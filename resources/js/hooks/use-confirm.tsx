import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';

type ConfirmOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    consequence?: ReactNode;
    onConfirm: () => void | Promise<void>;
};

function isPromise(value: void | Promise<void>): value is Promise<void> {
    return typeof (value as Promise<void> | undefined)?.then === 'function';
}

export function useConfirm() {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const isConfirming = useRef(false);

    const close = useCallback(() => {
        setIsOpen(false);
        setOptions(null);
        isConfirming.current = false;
    }, []);

    const confirm = useCallback((nextOptions: ConfirmOptions) => {
        setOptions(nextOptions);
        setIsOpen(true);
    }, []);

    const handleConfirm = useCallback(() => {
        if (!options || isConfirming.current) {
            return;
        }

        isConfirming.current = true;

        try {
            const result = options.onConfirm();

            if (isPromise(result)) {
                setIsProcessing(true);

                void result.finally(() => {
                    setIsProcessing(false);
                    close();
                });

                return;
            }

            close();
        } catch (error) {
            close();

            throw error;
        }
    }, [close, options]);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!isProcessing) {
                setIsOpen(nextOpen);

                if (!nextOpen) {
                    setOptions(null);
                    isConfirming.current = false;
                }
            }
        },
        [isProcessing],
    );

    const confirmDialog = options ? (
        isDesktop ? (
            <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options.title}</AlertDialogTitle>
                        {options.description && (
                            <AlertDialogDescription>
                                {options.description}
                            </AlertDialogDescription>
                        )}
                        {options.consequence}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel autoFocus disabled={isProcessing}>
                            {options.cancelLabel ?? 'Batal'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={
                                options.destructive ? 'destructive' : 'default'
                            }
                            disabled={isProcessing}
                            onClick={(event) => {
                                event.preventDefault();
                                handleConfirm();
                            }}
                        >
                            {isProcessing && (
                                <LoaderCircle className="animate-spin" />
                            )}
                            {options.confirmLabel ?? 'Konfirmasi'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        ) : (
            <Drawer open={isOpen} onOpenChange={handleOpenChange}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{options.title}</DrawerTitle>
                        {options.description && (
                            <DrawerDescription>
                                {options.description}
                            </DrawerDescription>
                        )}
                        {options.consequence}
                    </DrawerHeader>
                    <DrawerFooter>
                        <Button
                            variant={
                                options.destructive ? 'destructive' : 'default'
                            }
                            disabled={isProcessing}
                            onClick={handleConfirm}
                        >
                            {isProcessing && (
                                <LoaderCircle className="animate-spin" />
                            )}
                            {options.confirmLabel ?? 'Konfirmasi'}
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isProcessing}
                            onClick={close}
                        >
                            {options.cancelLabel ?? 'Batal'}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    ) : null;

    return [confirm, confirmDialog] as const;
}

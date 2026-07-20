import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

function PrivacyTooltip() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Info size={12} />
        </PopoverTrigger>
        <PopoverContent className="w-fit py-2 text-muted-foreground">
          Hanya terlihat oleh Anda.
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-muted-foreground "
          aria-label="Informasi privasi"
        >
          <Info size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent>Hanya terlihat oleh Anda.</TooltipContent>
    </Tooltip>
  );
}

export { PrivacyTooltip };

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EnhanceButtonProps = {
  available: boolean;
  loading: boolean;
  idleLabel: string;
  loadingLabel?: string;
  onClick: () => void;
  className?: string;
};

function EnhanceButton({
  available,
  loading,
  idleLabel,
  loadingLabel = 'Memproses...',
  onClick,
  className,
}: EnhanceButtonProps) {
  if (!available && !loading) {
    return null;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn('h-8 gap-1.5 text-xs', className)}
      onClick={onClick}
      disabled={!available}
    >
      <Sparkles
        data-icon="inline-start"
        className={cn('text-primary', loading && 'animate-pulse')}
      />
      {loading ? loadingLabel : idleLabel}
    </Button>
  );
}

export { EnhanceButton };

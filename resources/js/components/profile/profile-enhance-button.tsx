import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProfileEnhanceButtonProps = {
  available: boolean;
  loading: boolean;
  idleLabel: string;
  loadingLabel?: string;
  onClick: () => void;
};

function ProfileEnhanceButton({
  available,
  loading,
  idleLabel,
  loadingLabel = 'Memproses...',
  onClick,
}: ProfileEnhanceButtonProps) {
  if (!available && !loading) {
    return null;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1.5 text-xs"
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

export { ProfileEnhanceButton };

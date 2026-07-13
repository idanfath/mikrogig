import { Badge } from "../ui/badge";

type PickCardProps = {
  description: string;
  illustration: {
    alt: string;
    height: number;
    src: string;
    translateY: number;
  };
  badge?: string;
  isSelected: boolean;
  onSelect: () => void;
  title: string;
};

export default function PickCard({
  description,
  illustration,
  badge,
  isSelected,
  onSelect,
  title,
}: PickCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex min-h-52 flex-col overflow-hidden rounded-lg bg-card border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        ${isSelected ? 'border-primary' : 'border-border hover:border-primary/50'
        }`}
    >
      <div className="flex h-30 w-full items-end justify-end overflow-hidden bg-secondary px-3 pt-4">
        <img
          src={illustration.src}
          alt={illustration.alt}
          className="max-w-none object-contain object-right"
          style={{
            height: illustration.height,
            transform: `translateY(${illustration.translateY}px)`,
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-base font-bold text-foreground">
          {title} {badge && <span className="ml-1">
            <Badge variant="accent" className="text-xs">{badge}</Badge>
          </span>}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </div>
    </button>
  );
}

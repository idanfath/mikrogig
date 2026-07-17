type NotificationEmptyProps = {
  isCompact: boolean;
  hasSearch: boolean;
};

export function NotificationEmpty({
  isCompact,
  hasSearch,
}: NotificationEmptyProps) {
  return (
    <div
      className={`border border-dashed bg-muted/20 py-12 text-center text-sm text-muted-foreground ${isCompact ? 'rounded-xl' : 'rounded-2xl'}`}
    >
      {hasSearch
        ? 'Tidak ada notifikasi yang cocok dengan pencarian.'
        : 'Tidak ada notifikasi.'}
    </div>
  );
}

export function getServerCountdown(target: string, serverNow: string): string {
  const remainingSeconds = Math.max(
    0,
    Math.ceil(
      (new Date(target).getTime() - new Date(serverNow).getTime()) / 1000,
    ),
  );
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return [
    hours > 0 ? `${hours}j` : null,
    minutes > 0 || hours > 0 ? `${minutes}m` : null,
    `${seconds}d`,
  ]
    .filter(Boolean)
    .join(' ');
}

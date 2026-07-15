import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const relative = formatDistanceToNow(date, { addSuffix: true, locale: id });
    return relative.charAt(0).toUpperCase() + relative.slice(1);
  } catch (e) {
    return dateString;
  }
}

export function formatDate(dateString: string, formatStr: string = 'dd MMMM yyyy, HH:mm'): string {
  try {
    const date = new Date(dateString);
    return format(date, formatStr, { locale: id });
  } catch (e) {
    return dateString;
  }
}

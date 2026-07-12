
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// device capabilities detection for adaptive image loading, used in image_utility.ts
export function getDeviceInformation() {
  // @ts-ignore
  const memory = navigator.deviceMemory; // in GB
  const cores = navigator.hardwareConcurrency;
  // @ts-ignore
  const connection = navigator.connection?.effectiveType; // "4g", "3g", "2g", "slow-2g"
  return { memory, cores, connection };
}

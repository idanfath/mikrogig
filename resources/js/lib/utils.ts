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

export function sentenceCase(str: string | undefined, force: boolean = false): string {
    if (str === null || str === undefined) {
        return '';
    }
    if (force) {
        str = str.toLowerCase();
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalize(str: string, force: boolean = false): string {
    const words = str.split(' ');
    for (let i = 0; i < words.length; i++) {
        if (force || i === 0) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
        }
    }
    return words.join(' ');
}

export function isInternalActionUrl(url: string): boolean {
    try {
        return new URL(url, window.location.origin).origin === window.location.origin;
    } catch {
        return false;
    }
}

export function toInertiaHref(url: string): string {
    try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.origin === window.location.origin) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
        return url;
    } catch {
        return url;
    }
}

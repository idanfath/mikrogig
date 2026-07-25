<?php

namespace App\Enums;

enum GigStatusFrontendLabel: string
{
    case open = 'Terbuka';
    case agreement_preparation = 'Persiapan Persetujuan';
    case lock_pending = 'Menunggu Kunci';
    case payment_pending = 'Menunggu Pembayaran';
    case locked = 'Terkunci';
    case in_progress = 'Dalam Pengerjaan';
    case review = 'Ditinjau';
    case completed = 'Selesai';
    case cancelled = 'Dibatalkan';
    case disputed = 'Sengketa';
    case dispute_resolved = 'Sengketa Selesai';
}

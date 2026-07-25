<?php

namespace App\Enums;

enum GigOfferStatusFrontendLabel: string
{
    case pending = 'Menunggu Tanggapan';
    case accepted = 'Diterima';
    case rejected = 'Ditolak';
    case withdrawn = 'Ditarik';
    case auto_withdrawn = 'Ditarik Otomatis';
}

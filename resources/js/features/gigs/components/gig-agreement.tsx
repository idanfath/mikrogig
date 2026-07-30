import { Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Coins,
    FileText,
    MapPin,
} from 'lucide-react';
import type { FormEvent } from 'react';
import {
    accept,
    decline,
    leave,
    reject,
    requestChanges,
    submit,
} from '@/actions/App/Http/Controllers/GigAgreementController';
import { show as showPayment } from '@/actions/App/Http/Controllers/GigPaymentController';
import { AppPage, AppPageCard } from '@/components/layout/app-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/hooks/use-confirm';
import { formatDate } from '@/lib/date';
import { show as showGig } from '@/routes/app/gigs';
import { show as workflow } from '@/routes/app/gigs/workflow';
import {
  GigStatus,
  getGigEstimatedDurationLabel,
  getGigStatusLabel,
  getGigStatusVariant,
} from '@/types/enum';
import type { GigEstimatedDuration } from '@/types/enum';
import type { GigConversation as GigConversationData } from '../conversation-types';
import type {
    Gig,
    GigAgreement,
    GigAgreementCapabilities,
    WageBenchmarkContext,
} from '../types';
import { GigConversation } from './gig-conversation';
import {
    WageBenchmark,
    classifyWageBenchmark,
} from './wage-benchmark';

type GigAgreementProps = {
    gig: Gig;
    agreement: GigAgreement;
    is_client: boolean;
    is_selected_freelancer: boolean;
    capabilities: GigAgreementCapabilities;
    conversation: GigConversationData;
    wage_benchmark_context: WageBenchmarkContext;
};

const workflowStatuses: string[] = [
    GigStatus.Locked,
    GigStatus.InProgress,
    GigStatus.Disputed,
    GigStatus.DisputeResolved,
];

export function GigAgreementPage({
    gig,
    agreement,
    capabilities,
    conversation,
    wage_benchmark_context: wageBenchmarkContext,
}: GigAgreementProps) {
    const [confirm, confirmDialog] = useConfirm();
    const initialScheduledAt = agreement.scheduled_at ?? gig.scheduled_at;
    const initialWorkDate = initialScheduledAt
        ? formatDate(initialScheduledAt, 'yyyy-MM-dd')
        : (agreement.work_date ?? gig.work_date);
    const initialStartTime = initialScheduledAt
        ? formatDate(initialScheduledAt, 'HH:mm')
        : ((agreement.start_time ?? gig.start_time)?.slice(0, 5) ?? '');

    const terms = useForm({
        final_scope: agreement.final_scope ?? '',
        work_date: initialWorkDate,
        start_time: initialStartTime,
        location_arrangement:
            agreement.location_arrangement ?? gig.location_address,
        delivery_expectations: agreement.delivery_expectations ?? '',
        final_total_price: agreement.final_total_price?.toString() ?? '',
        estimated_duration: agreement.estimated_duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const changes = useForm({ note: '' });
    const termsSubmitted = agreement.submitted_at !== null;
    const submitTerms = (event: FormEvent) => {
        event.preventDefault();
        terms.patch(submit.url(gig));
    };

    const hasHeaderActions =
        gig.status === GigStatus.PaymentPending ||
        gig.status === GigStatus.Locked ||
        workflowStatuses.includes(gig.status);
    const hasHeaderContentBelow =
        Boolean(agreement.latest_change_request_note) || hasHeaderActions;

    const scheduledAtIso = agreement.scheduled_at ?? gig.scheduled_at;
    const formattedWorkDate = scheduledAtIso
        ? formatDate(scheduledAtIso, 'dd MMMM yyyy')
        : (agreement.work_date ? formatDate(agreement.work_date, 'dd MMMM yyyy') : null);
    const formattedStartTime = scheduledAtIso
        ? `Pukul ${formatDate(scheduledAtIso, 'HH:mm')}`
        : (agreement.start_time ? `Pukul ${agreement.start_time.slice(0, 5)}` : '-');
    const wageRange =
        wageBenchmarkContext.provinces[gig.province_id]?.[
            terms.data.estimated_duration
        ];
    const effectiveFinalPrice =
        terms.data.final_total_price === ''
            ? agreement.accepted_fee
            : Number(terms.data.final_total_price);
    const wageStatus = wageRange
        ? classifyWageBenchmark(effectiveFinalPrice, wageRange)
        : undefined;

    return (
        <AppPage
            title={`Persetujuan: ${gig.title}`}
            description="Atur dan sepakati syarat final pekerjaan sebelum pembayaran dilakukan."
        >
            <div className="flex flex-col gap-6">
                <AppPageCard className="flex flex-col gap-4">
                    <div
                        className={`flex flex-wrap items-center justify-between gap-3 ${
                            hasHeaderContentBelow ? 'pb-3 border-b border-border/40' : ''
                        }`}
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Biaya Penawaran Diterima
                            </span>
                            <span className="font-bold text-foreground text-lg">
                                Rp{agreement.accepted_fee.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                                variant={getGigStatusVariant(gig.status)}
                                className="px-3 py-1 font-medium text-xs"
                            >
                                {getGigStatusLabel(gig.status)}
                            </Badge>
                            <Badge variant="outline" className="px-3 py-1 font-medium text-xs">
                                Syarat Versi {agreement.terms_version}
                            </Badge>
                            <Button asChild variant="outline" size="sm">
                                <Link href={showGig.url(gig)}>
                                    <ArrowLeft className="mr-1.5 size-4" />
                                    Detail Gig
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {agreement.latest_change_request_note && (
                        <div className="flex flex-col gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                            <div className="flex items-center gap-1.5 font-bold">
                                <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>Permintaan Perubahan Terbaru</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">
                                {agreement.latest_change_request_note}
                            </p>
                        </div>
                    )}

                    {hasHeaderActions && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {(gig.status === GigStatus.PaymentPending ||
                                gig.status === GigStatus.Locked) && (
                                <Button asChild variant="default">
                                    <Link href={showPayment(gig)}>Lihat pembayaran</Link>
                                </Button>
                            )}
                            {workflowStatuses.includes(gig.status) && (
                                <Button asChild variant="outline">
                                    <Link href={workflow(gig)}>Lihat workflow</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </AppPageCard>

                <GigConversation conversation={conversation} />

                {capabilities.can_submit_terms && (
                    <AppPageCard>
                        <form onSubmit={submitTerms} className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                                <FileText className="size-4 text-primary" />
                                <h2 className="font-bold text-foreground text-base">
                                    Isi Syarat Final Persetujuan
                                </h2>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Lingkup Pekerjaan
                                </label>
                                <Textarea
                                    value={terms.data.final_scope}
                                    onChange={(event) =>
                                        terms.setData('final_scope', event.target.value)
                                    }
                                    placeholder="Rincian lingkup pekerjaan final yang disepakati..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Tanggal Kerja
                                    </label>
                                    <DatePicker
                                        value={terms.data.work_date}
                                        onChange={(val) => terms.setData('work_date', val)}
                                        minDate={new Date()}
                                        placeholder="Pilih tanggal kerja"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Waktu Mulai
                                    </label>
                                    <Input
                                        type="time"
                                        value={terms.data.start_time}
                                        onChange={(event) =>
                                            terms.setData('start_time', event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Estimasi Durasi Pekerjaan
                                </label>
                                <Select
                                    value={terms.data.estimated_duration}
                                    onValueChange={(value) =>
                                        terms.setData(
                                            'estimated_duration',
                                            value as GigEstimatedDuration,
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full" mobileLarge>
                                        <SelectValue placeholder="Pilih estimasi durasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {wageBenchmarkContext.durations.map((duration) => (
                                            <SelectItem
                                                key={duration.value}
                                                value={duration.value}
                                            >
                                                {duration.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Pengaturan Lokasi
                                </label>
                                <Textarea
                                    value={terms.data.location_arrangement}
                                    onChange={(event) =>
                                        terms.setData('location_arrangement', event.target.value)
                                    }
                                    placeholder="Instruksi lokasi atau alamat lengkap..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Ekspektasi Penyelesaian (Deliverables)
                                </label>
                                <Textarea
                                    value={terms.data.delivery_expectations}
                                    onChange={(event) =>
                                        terms.setData('delivery_expectations', event.target.value)
                                    }
                                    placeholder="Hasil kerja atau bukti penyelesaian yang diharapkan..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Total Harga Final (Rp)
                                </label>
                                <InputGroup mobileLarge>
                                    <InputGroupAddon align="inline-start">Rp</InputGroupAddon>
                                    <InputGroupInput
                                        type="number"
                                        min="1000"
                                        value={terms.data.final_total_price}
                                        onChange={(event) =>
                                            terms.setData('final_total_price', event.target.value)
                                        }
                                        placeholder={agreement.accepted_fee.toLocaleString(
                                            'id-ID',
                                        )}
                                        mobileLarge
                                    />
                                </InputGroup>
                            </div>

                            {wageRange && (
                                <WageBenchmark
                                    duration={terms.data.estimated_duration}
                                    range={wageRange}
                                    context={wageBenchmarkContext}
                                    status={wageStatus}
                                    showDisclaimer
                                />
                            )}

                            {Object.values(terms.errors).map((error) => (
                                <p key={error} className="text-xs text-destructive">
                                    {error}
                                </p>
                            ))}

                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/40">
                                {capabilities.can_reject && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        disabled={terms.processing}
                                        onClick={() =>
                                            confirm({
                                                title: 'Tolak freelancer ini?',
                                                description:
                                                    'Persiapan persetujuan akan dibatalkan dan freelancer akan ditolak.',
                                                confirmLabel: 'Ya, tolak freelancer',
                                                destructive: true,
                                                onConfirm: () => terms.patch(reject.url(gig)),
                                            })
                                        }
                                    >
                                        Tolak freelancer
                                    </Button>
                                )}
                                <Button type="submit" disabled={terms.processing}>
                                    Kirim syarat final
                                </Button>
                            </div>
                        </form>
                    </AppPageCard>
                )}

                {termsSubmitted && !capabilities.can_submit_terms && (
                    <AppPageCard className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/40">
                            <div className="flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                <h2 className="font-bold text-foreground text-base">
                                    Syarat Final Persetujuan
                                </h2>
                            </div>
                            <Badge variant="secondary" className="text-xs font-normal">
                                Terkirim
                            </Badge>
                        </div>

                        {agreement.final_scope && (
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Lingkup Pekerjaan
                                </span>
                                <div className="rounded-xl bg-secondary/30 p-3.5 border border-border/40 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                    {agreement.final_scope}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2 text-xs">
                            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
                                <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Jadwal Kerja
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {formattedWorkDate ?? agreement.work_date ?? '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3">
                                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Waktu Mulai
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {formattedStartTime}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3 sm:col-span-2">
                                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Estimasi Durasi
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {getGigEstimatedDurationLabel(
                                            agreement.estimated_duration,
                                        )}
                                    </span>
                                </div>
                            </div>

                            {agreement.location_arrangement && (
                                <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3 sm:col-span-2">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Pengaturan Lokasi
                                        </span>
                                        <span className="font-medium text-foreground whitespace-pre-wrap">
                                            {agreement.location_arrangement}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {agreement.delivery_expectations && (
                                <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3 sm:col-span-2">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground/80" />
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Ekspektasi Penyelesaian
                                        </span>
                                        <span className="font-medium text-foreground whitespace-pre-wrap">
                                            {agreement.delivery_expectations}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card p-3 sm:col-span-2">
                                <Coins className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Total Harga Final
                                    </span>
                                    <span className="font-bold text-foreground text-sm">
                                        Rp
                                        {agreement.final_total_price?.toLocaleString('id-ID') ??
                                            '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <WageBenchmark
                            duration={agreement.estimated_duration}
                            range={agreement.wage_benchmark}
                            context={{
                                year: agreement.wage_benchmark.year,
                                source: wageBenchmarkContext.source,
                            }}
                            status={agreement.wage_benchmark.status}
                            showDisclaimer
                        />

                        {capabilities.can_reject && (
                            <div className="flex justify-end pt-2 border-t border-border/40">
                                <Button
                                    variant="destructive"
                                    disabled={terms.processing}
                                    onClick={() =>
                                        confirm({
                                            title: 'Tolak freelancer ini?',
                                            description:
                                                'Persiapan persetujuan akan dibatalkan dan freelancer akan ditolak.',
                                            confirmLabel: 'Ya, tolak freelancer',
                                            destructive: true,
                                            onConfirm: () => terms.patch(reject.url(gig)),
                                        })
                                    }
                                >
                                    Tolak freelancer
                                </Button>
                            </div>
                        )}
                    </AppPageCard>
                )}

                {capabilities.can_leave && (
                    <AppPageCard className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-col gap-0.5">
                                <h3 className="font-bold text-foreground text-sm">
                                    Keluar dari Persiapan Persetujuan
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Anda dapat meninggalkan proses persiapan persetujuan ini jika
                                    tidak ingin melanjutkan.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                disabled={changes.processing}
                                onClick={() =>
                                    confirm({
                                        title: 'Tinggalkan persiapan persetujuan?',
                                        description:
                                            'Anda akan keluar dari proses persiapan persetujuan gig ini.',
                                        confirmLabel: 'Ya, tinggalkan',
                                        destructive: true,
                                        onConfirm: () => changes.patch(leave.url(gig)),
                                    })
                                }
                            >
                                Tinggalkan persiapan
                            </Button>
                        </div>
                    </AppPageCard>
                )}

                {(capabilities.can_accept ||
                    capabilities.can_decline ||
                    capabilities.can_request_changes) && (
                        <AppPageCard className="flex flex-col gap-4">
                            <h3 className="font-bold text-foreground text-base">
                                Keputusan Persetujuan
                            </h3>

                            <div className="flex flex-wrap items-center gap-2">
                                {capabilities.can_accept && (
                                    <Button
                                        disabled={changes.processing}
                                        onClick={() =>
                                            confirm({
                                                title: 'Setujui syarat persetujuan?',
                                                description:
                                                    'Dengan menyetujui syarat, alur akan dilanjutkan ke tahap pembayaran / penguncian gig.',
                                                confirmLabel: 'Ya, setujui syarat',
                                                onConfirm: () => changes.patch(accept.url(gig)),
                                            })
                                        }
                                    >
                                        Setujui syarat
                                    </Button>
                                )}
                                {capabilities.can_decline && (
                                    <Button
                                        variant="destructive"
                                        disabled={changes.processing}
                                        onClick={() =>
                                            confirm({
                                                title: 'Tolak syarat persetujuan?',
                                                description:
                                                    'Syarat persetujuan akan ditolak dan proses tidak akan dilanjutkan.',
                                                confirmLabel: 'Ya, tolak syarat',
                                                destructive: true,
                                                onConfirm: () => changes.patch(decline.url(gig)),
                                            })
                                        }
                                    >
                                        Tolak syarat
                                    </Button>
                                )}
                            </div>

                            {capabilities.can_request_changes && (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        changes.patch(requestChanges.url(gig));
                                    }}
                                    className="flex flex-col gap-3 pt-3 border-t border-border/40"
                                >
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Minta Perubahan Syarat
                                        </label>
                                        <Textarea
                                            value={changes.data.note}
                                            onChange={(event) =>
                                                changes.setData('note', event.target.value)
                                            }
                                            placeholder="Tuliskan catatan rincian perubahan syarat yang Anda minta..."
                                            rows={3}
                                        />
                                    </div>
                                    {changes.errors.note && (
                                        <p className="text-xs text-destructive">
                                            {changes.errors.note}
                                        </p>
                                    )}
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            disabled={changes.processing}
                                        >
                                            Kirim Permintaan Perubahan
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </AppPageCard>
                    )}
            </div>
            {confirmDialog}
        </AppPage>
    );
}

import { Link, useForm } from '@inertiajs/react';
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
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { show as workflow } from '@/routes/app/gigs/workflow';
import { GigStatus } from '@/types/enum';
import type { GigConversation as GigConversationData } from '../conversation-types';
import type { Gig, GigAgreement, GigAgreementCapabilities } from '../types';
import { GigConversation } from './gig-conversation';

type GigAgreementProps = {
  gig: Gig;
  agreement: GigAgreement;
  is_client: boolean;
  is_selected_freelancer: boolean;
  capabilities: GigAgreementCapabilities;
  conversation: GigConversationData;
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
}: GigAgreementProps) {
  const terms = useForm({
    final_scope: agreement.final_scope ?? '',
    work_date: agreement.work_date ?? gig.work_date,
    start_time: (agreement.start_time ?? gig.start_time)?.slice(0, 5) ?? '',
    location_arrangement:
      agreement.location_arrangement ?? gig.location_address,
    delivery_expectations: agreement.delivery_expectations ?? '',
    final_total_price: agreement.final_total_price?.toString() ?? '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const changes = useForm({ note: '' });
  const termsSubmitted = agreement.submitted_at !== null;
  const submitTerms = (event: FormEvent) => {
    event.preventDefault();
    terms.patch(submit.url(gig));
  };

  return (
    <AppPage title={`Persetujuan: ${gig.title}`}>
      <div className="flex flex-col gap-6">
        <AppPageCard className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Biaya penawaran diterima: Rp
            {agreement.accepted_fee.toLocaleString('id-ID')} · Versi{' '}
            {agreement.terms_version}
          </p>
          {agreement.latest_change_request_note && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <strong>Permintaan perubahan terbaru</strong>
              <p className="mt-1 whitespace-pre-wrap">
                {agreement.latest_change_request_note}
              </p>
            </div>
          )}
          {(gig.status === GigStatus.PaymentPending ||
            gig.status === GigStatus.Locked) && (
            <Button asChild className="self-start">
              <Link href={showPayment(gig)}>Lihat pembayaran</Link>
            </Button>
          )}
          {workflowStatuses.includes(gig.status) && (
            <Button asChild variant="outline" className="self-start">
              <Link href={workflow(gig)}>Lihat workflow</Link>
            </Button>
          )}
        </AppPageCard>

        {capabilities.can_submit_terms && (
          <AppPageCard>
            <form onSubmit={submitTerms} className="flex flex-col gap-3">
              <h2 className="font-semibold">Syarat final</h2>
              <Textarea
                value={terms.data.final_scope}
                onChange={(event) =>
                  terms.setData('final_scope', event.target.value)
                }
                placeholder="Lingkup pekerjaan"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <DatePicker
                  value={terms.data.work_date}
                  onChange={(val) => terms.setData('work_date', val)}
                  minDate={new Date()}
                  placeholder="Pilih tanggal kerja"
                />
                <Input
                  type="time"
                  value={terms.data.start_time}
                  onChange={(event) =>
                    terms.setData('start_time', event.target.value)
                  }
                />
              </div>
              <Textarea
                value={terms.data.location_arrangement}
                onChange={(event) =>
                  terms.setData('location_arrangement', event.target.value)
                }
                placeholder="Pengaturan lokasi"
              />
              <Textarea
                value={terms.data.delivery_expectations}
                onChange={(event) =>
                  terms.setData('delivery_expectations', event.target.value)
                }
                placeholder="Ekspektasi penyelesaian"
              />
              <Input
                type="number"
                min="1000"
                value={terms.data.final_total_price}
                onChange={(event) =>
                  terms.setData('final_total_price', event.target.value)
                }
                placeholder="Total harga final"
              />
              {Object.values(terms.errors).map((error) => (
                <p key={error} className="text-sm text-destructive">
                  {error}
                </p>
              ))}
              <Button type="submit" disabled={terms.processing}>
                Kirim syarat final
              </Button>
              {capabilities.can_reject && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => terms.patch(reject.url(gig))}
                >
                  Tolak freelancer
                </Button>
              )}
            </form>
          </AppPageCard>
        )}

        {termsSubmitted && !capabilities.can_submit_terms && (
          <AppPageCard className="flex flex-col gap-3">
            <h2 className="font-semibold">Syarat final</h2>
            <p className="whitespace-pre-wrap">{agreement.final_scope}</p>
            <p>
              {agreement.work_date} · {agreement.start_time}
            </p>
            <p className="whitespace-pre-wrap">
              {agreement.location_arrangement}
            </p>
            <p className="whitespace-pre-wrap">
              {agreement.delivery_expectations}
            </p>
            <p>
              Total final: Rp
              {agreement.final_total_price?.toLocaleString('id-ID')}
            </p>
            {capabilities.can_reject && (
              <Button
                variant="destructive"
                onClick={() => terms.patch(reject.url(gig))}
              >
                Tolak freelancer
              </Button>
            )}
          </AppPageCard>
        )}

        {capabilities.can_leave && (
          <AppPageCard>
            <Button
              variant="destructive"
              onClick={() => changes.patch(leave.url(gig))}
            >
              Tinggalkan persiapan
            </Button>
          </AppPageCard>
        )}

        {(capabilities.can_accept ||
          capabilities.can_decline ||
          capabilities.can_request_changes) && (
          <AppPageCard className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {capabilities.can_accept && (
                <Button onClick={() => changes.patch(accept.url(gig))}>
                  Setujui syarat
                </Button>
              )}
              {capabilities.can_decline && (
                <Button
                  variant="destructive"
                  onClick={() => changes.patch(decline.url(gig))}
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
                className="flex flex-col gap-2"
              >
                <Textarea
                  value={changes.data.note}
                  onChange={(event) =>
                    changes.setData('note', event.target.value)
                  }
                  placeholder="Catatan perubahan yang diminta"
                />
                {changes.errors.note && (
                  <p className="text-sm text-destructive">
                    {changes.errors.note}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  disabled={changes.processing}
                >
                  Minta perubahan
                </Button>
              </form>
            )}
          </AppPageCard>
        )}
        <GigConversation conversation={conversation} />
      </div>
    </AppPage>
  );
}

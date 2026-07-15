<?php

namespace App\Console\Commands;

use App\Enums\NotificationTargetType;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\info;
use function Laravel\Prompts\search;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

class SendNotificationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notification:send';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send real-time interactive notifications to users';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService)
    {
        $target = select(
            label: 'Pilih target notifikasi',
            options: [
                'everyone' => 'Semua User (Everyone)',
                'role' => 'Berdasarkan Peran (Role)',
                'user' => 'Satu User Spesifik (User)',
                'users' => 'Beberapa User Spesifik (Users)',
            ],
            default: 'everyone'
        );

        $targetType = NotificationTargetType::from($target);
        $role = null;
        $recipientIds = null;

        if ($targetType === NotificationTargetType::Role) {
            $role = select(
                label: 'Pilih peran',
                options: [
                    'freelancer' => 'Freelancer',
                    'client' => 'Client',
                ]
            );
        } elseif ($targetType === NotificationTargetType::User) {
            $userId = search(
                label: 'Cari user berdasarkan nama atau email',
                options: fn (string $value) => User::where('name', 'like', "%{$value}%")
                    ->orWhere('email', 'like', "%{$value}%")
                    ->take(10)
                    ->pluck('email', 'id')
                    ->all(),
                placeholder: 'Ketik nama/email...'
            );
            $recipientIds = [(int) $userId];
        } elseif ($targetType === NotificationTargetType::Users) {
            $emailsInput = text(
                label: 'Masukkan email-email user (pisahkan dengan koma)',
                placeholder: 'user1@mail.com, user2@mail.com',
                validate: function (string $value) {
                    if (empty(trim($value))) {
                        return 'Email tidak boleh kosong.';
                    }

                    return null;
                }
            );

            $emails = array_filter(array_map('trim', explode(',', $emailsInput)));
            $recipientIds = User::whereIn('email', $emails)->pluck('id')->all();

            if (empty($recipientIds)) {
                $this->error('Tidak ada user yang cocok dengan email tersebut.');

                return 1;
            }
        }

        $title = text(
            label: 'Masukkan Judul Notifikasi',
            placeholder: 'Info Penting!',
            required: true
        );

        $body = text(
            label: 'Masukkan Detail Pesan (Body)',
            placeholder: 'Detail isi pesan...'
        );

        $actionUrl = text(
            label: 'Masukkan Action URL (Opsional)',
            placeholder: 'https://...'
        );

        $actionLabel = null;
        if (! empty($actionUrl)) {
            $actionLabel = text(
                label: 'Masukkan Tombol Action Label (Opsional)',
                placeholder: 'Buka Link',
                default: 'Buka'
            );
        }

        $sendEmail = confirm(
            label: 'Kirim notifikasi via email juga?',
            default: false
        );

        // Send notification using the service
        $notificationService->send(
            title: $title,
            targetType: $targetType,
            createdBy: null, // sent by system command
            body: ! empty($body) ? $body : null,
            recipientIds: $recipientIds,
            role: $role,
            action_url: ! empty($actionUrl) ? $actionUrl : null,
            action_label: ! empty($actionLabel) ? $actionLabel : null,
            sendEmail: $sendEmail
        );

        info('Notifikasi berhasil dikirim dan di-broadcast!');

        return 0;
    }
}

import type { GigStatus, UserRole } from '@/types/enum';

export const HomeAccountState = {
    Active: 'active',
    Suspended: 'suspended',
} as const;

export type HomeAccountState =
    (typeof HomeAccountState)[keyof typeof HomeAccountState];

export const HomeActionPriority = {
    Normal: 'normal',
    Warning: 'warning',
    Critical: 'critical',
} as const;

export type HomeActionPriority =
    (typeof HomeActionPriority)[keyof typeof HomeActionPriority];

export const HomeActionKind = {
    Agreement: 'agreement',
    Applicants: 'applicants',
    Counterproof: 'counterproof',
    DisputeDecision: 'dispute_decision',
    ExitRequest: 'exit_request',
    FinalTerms: 'final_terms',
    FinishRequest: 'finish_request',
    FinishReview: 'finish_review',
    Payment: 'payment',
    Rating: 'rating',
    WorkStart: 'work_start',
} as const;

export type HomeActionKind =
    (typeof HomeActionKind)[keyof typeof HomeActionKind];

export type HomeAction = {
    id: string;
    kind: HomeActionKind;
    priority: HomeActionPriority;
    title: string;
    description: string;
    gig_title: string | null;
    due_at: string | null;
    action_label: string;
    target: {
        type:
            | 'agreement'
            | 'applicants'
            | 'dispute'
            | 'admin_dispute'
            | 'history'
            | 'payment'
            | 'workflow';
        id: number;
    };
};

type ActiveHomeData = {
    account_state: typeof HomeAccountState.Active;
    viewer_name: string;
    server_now: string;
    actions: HomeAction[];
    rating_reminders: HomeAction[];
};

export type ClientHomeData = ActiveHomeData & {
    role: typeof UserRole.Client;
    summary: {
        held_amount: number;
        active_gigs: number;
        new_applicants: number;
        pending_ratings: number;
    };
};

export type FreelancerHomeData = ActiveHomeData & {
    role: typeof UserRole.Freelancer;
    summary: {
        active_applications: number;
        application_limit: number;
        completed_gigs: number;
    };
    exclusive_gig: {
        id: number;
        title: string;
        status: GigStatus;
        starts_at: string;
    } | null;
};

export type AdminHomeData = ActiveHomeData & {
    role: typeof UserRole.Admin;
    summary: {
        awaiting_admin: number;
        awaiting_counterproof: number;
        expiring_today: number;
    };
};

export type SuspendedHomeData = {
    account_state: typeof HomeAccountState.Suspended;
    viewer_name: string;
    role: typeof UserRole.Client | typeof UserRole.Freelancer;
    server_now: string;
    suspension: {
        reason: string;
        banned_at: string;
        banned_until: string | null;
        is_permanent: boolean;
        gig_title: string | null;
    };
};

export type HomeData =
    | ClientHomeData
    | FreelancerHomeData
    | AdminHomeData
    | SuspendedHomeData;

export type ChatNotice = {
    agreement_id: number;
    latest_message_id: number;
    unread_count: number;
    sender: {
        id: number;
        name: string;
        avatar_url: string | null;
    };
    gig_title: string;
    created_at: string;
};

export type ChatNotices = {
    data: ChatNotice[];
    has_more: boolean;
};

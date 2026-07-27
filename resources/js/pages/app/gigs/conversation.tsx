import { Head } from '@inertiajs/react';
import { GigConversation } from '@/features/gigs/components/gig-conversation';
import type { GigConversation as GigConversationData } from '@/features/gigs/conversation-types';

type Props = {
  conversation: GigConversationData;
};

export default function Page({ conversation }: Props) {
  return (
    <>
      <Head title="Percakapan Gig" />
      <GigConversation conversation={conversation} mode="page" />
    </>
  );
}

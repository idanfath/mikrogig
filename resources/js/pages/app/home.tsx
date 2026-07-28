import type { ReactNode } from 'react';

import { HomeDashboard } from '@/features/home/components/home-dashboard';
import type { ChatNotices, HomeData } from '@/features/home/types';
import AppLayout from '@/layout/AppLayout';

const Home: InertiaPageWithLayout<{
    home: HomeData;
    chat_notices: ChatNotices;
}> = ({ home, chat_notices }) => {
    return <HomeDashboard data={home} chatNotices={chat_notices} />;
};

Home.layout = (page: ReactNode) => (
    <AppLayout title="Beranda">{page}</AppLayout>
);

export default Home;

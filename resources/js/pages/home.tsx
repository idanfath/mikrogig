import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { CTA } from '@/features/landing/components/cta';
import { FAQ } from '@/features/landing/components/faq';
import { Hero } from '@/features/landing/components/hero';
import { AIFeatures } from '@/features/landing/components/ai-features';
import { HowItWorks } from '@/features/landing/components/how-it-works';
import { RealtimeExperience } from '@/features/landing/components/realtime-experience';
import { TrustBar } from '@/features/landing/components/trust-bar';
import { WorkProtection } from '@/features/landing/components/work-protection';

const description =
    'Temukan atau pasang pekerjaan lokal, sepakati bayaran, selesaikan pekerjaan dengan bukti, dan tangani masalah dalam satu alur.';
const title = 'Kerja Lokal dengan Kesepakatan Jelas';

function LandingPage() {
    return (
        <>
            <Head title={title}>
                <meta
                    head-key="description"
                    name="description"
                    content={description}
                />
                <meta name="theme-color" content="#FAF9F6" />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary" />
            </Head>

            <div className="landing-page min-h-screen bg-background text-foreground">
                <Navbar />
                <main id="konten-utama" tabIndex={-1} className="outline-none">
                    <Hero />
                    <TrustBar />
                    <HowItWorks />
                    <WorkProtection />
                    <RealtimeExperience />
                    <AIFeatures />
                    <FAQ />
                    <CTA />
                </main>
                <Footer />
            </div>
        </>
    );
}

LandingPage.layout = (page: ReactNode) => page;

export default LandingPage;

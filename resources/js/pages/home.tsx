import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { AIFeatures } from '@/components/landing/ai-features';
import { CTA } from '@/components/landing/cta';
import { FAQ } from '@/components/landing/faq';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { RealtimeExperience } from '@/components/landing/realtime-experience';
import { TrustBar } from '@/components/landing/trust-bar';
import { WorkProtection } from '@/components/landing/work-protection';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

const description =
    'Temukan atau buat gig lokal, sepakati biaya, chat secara realtime, selesaikan pekerjaan dengan bukti, dan tangani sengketa dalam satu alur.';
const title = 'MikroGig - Gig Lokal dengan Kesepakatan Jelas';

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

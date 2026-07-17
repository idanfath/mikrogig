import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { AIFeatures } from '@/components/landing/ai-features';
import { Categories } from '@/components/landing/categories';
import { CTA } from '@/components/landing/cta';
import { FairWage } from '@/components/landing/fair-wage';
import { FAQ } from '@/components/landing/faq';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Testimonials } from '@/components/landing/testimonials';
import { TrustBar } from '@/components/landing/trust-bar';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

const description =
  'MikroGig menghubungkan pekerja informal dan pemberi kerja lokal melalui upah transparan, kontrak sederhana, escrow, dan akses berbasis suara.';

function LandingPage() {
  return (
    <>
      <Head title="MikroGig - Platform Gig Lokal">
        <meta name="description" content={description} />
        <meta name="theme-color" content="#FAF9F6" />
        <meta property="og:title" content="MikroGig - Platform Gig Lokal" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="landing-page min-h-screen bg-background text-foreground">
        <Navbar />
        <main id="konten-utama" tabIndex={-1} className="outline-none">
          <Hero />
          <TrustBar />
          <HowItWorks />
          <Categories />
          <FairWage />
          <AIFeatures />
          <Testimonials />
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

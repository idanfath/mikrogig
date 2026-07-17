import { Hammer, Home, Sparkles, Truck, Utensils, Wrench } from 'lucide-react';
import * as React from 'react';

import { CategoryCard } from './ui/category-card';
import { Section } from './ui/section';
import { SectionHeader } from './ui/section-header';
import { cn } from '@/lib/utils';

interface Category {
  name: string;
  meta: string;
  icon: React.ReactNode;
  href?: string;
  jobs?: number;
}

interface CategoriesProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> {
  badge?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  categories?: Category[];
}

const defaultCategories: Category[] = [
  {
    name: 'Kebersihan',
    meta: 'Rumah, kos, dan kantor',
    icon: <Sparkles className="size-5" />,
  },
  {
    name: 'Perbaikan rumah',
    meta: 'Listrik, air, dan servis kecil',
    icon: <Wrench className="size-5" />,
  },
  {
    name: 'Konstruksi',
    meta: 'Tukang dan tenaga harian',
    icon: <Hammer className="size-5" />,
  },
  {
    name: 'Pindahan',
    meta: 'Angkut, kemas, dan bongkar',
    icon: <Truck className="size-5" />,
  },
  {
    name: 'Asisten rumah',
    meta: 'Bantuan domestik terpercaya',
    icon: <Home className="size-5" />,
  },
  {
    name: 'Acara & katering',
    meta: 'Kru acara dan bantuan dapur',
    icon: <Utensils className="size-5" />,
  },
];

function Categories({
  badge = 'Pekerjaan di sekitar kita',
  title = 'Keahlian lokal layak mendapat akses pasar yang lebih luas.',
  description = 'Kategori dibuat dekat dengan realitas kerja informal—mudah dicari berdasarkan kebutuhan, lokasi, waktu, dan tingkat risiko.',
  categories = defaultCategories,
  className,
  ...props
}: CategoriesProps) {
  return (
    <Section
      id="categories"
      background="muted"
      className={cn(className)}
      {...props}
    >
      <SectionHeader badge={badge} heading={title} description={description} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.name}
            icon={category.icon}
            title={category.name}
            meta={category.meta}
            jobs={category.jobs}
            href={category.href ?? '#mulai'}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-primary/30 bg-accent/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold">Keahlianmu belum ada di daftar?</p>
        <p className="text-sm text-muted-foreground">
          Ceritakan lewat suara—AI membantu menyusun kategori dan profil yang
          sesuai.
        </p>
      </div>
    </Section>
  );
}

export { Categories };

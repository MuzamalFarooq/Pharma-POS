import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const medicineSections = [
  {
    slug: 'over-the-counter',
    title: 'Over the Counter Medicine',
    description: 'Everyday essentials for common health needs.',
    image: '/over%20the%20counter%20medicine.webp',
  },
  {
    slug: 'prescribed',
    title: 'Prescribed Medicine',
    description: 'Medicines that require a prescription.',
    image: '/prescribed%20medicine.webp',
  },
  {
    slug: 'skin-hair',
    title: 'Skin & Hair Care',
    description: 'Care for healthy skin and hair.',
    image: '/skin%20%26hair%20care.webp',
  },
  {
    slug: 'vitamins-supplements',
    title: 'Vitamins & Supplements',
    description: 'Support your daily nutrition and wellbeing.',
    image: '/vitamins%20%26supplements.webp',
  },
  {
    slug: 'women-health',
    title: 'Women Health',
    description: 'Health and wellness essentials for women.',
    image: '/women%20health.webp',
  },
];

export default function MedicineSections({ onSelectSection, selectedSection = '' }) {
  return (
    <section aria-labelledby="medicine-sections-title">
      <div className="mb-5">
        <h2 id="medicine-sections-title" className="text-2xl font-extrabold text-slate-900">
          Shop by medicine section
        </h2>
        <p className="mt-1 text-sm text-slate-500">Choose a section to find the medicines and care products you need.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {medicineSections.map((section) => {
          const className = `group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            selectedSection === section.slug ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
          }`;
          const content = (
            <>
              <div className="relative h-28 overflow-hidden bg-emerald-50 sm:h-36">
                <Image
                  src={section.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="flex min-h-10 items-center justify-between gap-2 text-sm font-bold text-slate-900 sm:text-base">
                  <span>{section.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-emerald-600 transition-transform group-hover:translate-x-1" />
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{section.description}</p>
              </div>
            </>
          );

          return onSelectSection ? (
            <button
              key={section.slug}
              type="button"
              onClick={() => onSelectSection(section.slug)}
              aria-pressed={selectedSection === section.slug}
              className={className}
            >
              {content}
            </button>
          ) : (
            <Link key={section.slug} href={`/shop?section=${section.slug}`} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

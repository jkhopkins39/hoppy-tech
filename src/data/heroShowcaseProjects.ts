import { initialProjects } from './portfolioProjects';

/** Capstone and any future exclusions from the home hero carousel */
const EXCLUDED_IDS = new Set([4]);

export interface HeroShowcaseProject {
  id: number;
  title: string;
  image: string;
  fallback?: string;
  liveUrl?: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
}

/** Per-project hero framing tweaks (Safari/object-fit edge cases) */
const HERO_IMAGE_OVERRIDES: Record<number, Pick<HeroShowcaseProject, 'imageFit' | 'imagePosition'>> = {
  6: { imageFit: 'contain', imagePosition: 'top center' },
};

export const heroShowcaseProjects: HeroShowcaseProject[] = initialProjects
  .filter((p) => !EXCLUDED_IDS.has(p.id))
  .map((p) => ({
    id: p.id,
    title: p.title,
    image: p.imageWebP || p.image,
    fallback: p.imageFallback,
    liveUrl: p.liveUrl,
    ...HERO_IMAGE_OVERRIDES[p.id],
  }));

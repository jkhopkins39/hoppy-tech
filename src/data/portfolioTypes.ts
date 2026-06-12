export interface Project {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  imageWebP?: string;
  imageFallback?: string;
  imageDark?: string;
  imageDarkWebP?: string;
  technologies: string[];
  repoUrl?: string;
  liveUrl?: string;
  category: 'web' | 'mobile' | 'ai' | 'other';
}

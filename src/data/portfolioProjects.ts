import { portfolioProjects } from './portfolioProjectList.js';
import type { Project } from './portfolioTypes';

export type { Project } from './portfolioTypes';

/** Projects removed from the portfolio but that may still exist in cached localStorage. */
export const REMOVED_PROJECT_TITLES = ['Landlock Solutions LLC'] as const;
export const REMOVED_PROJECT_URLS = ['https://landlocksolutionsllc.com'] as const;

export const initialProjects: Project[] = portfolioProjects;

export function isRemovedProject(project: Pick<Project, 'title' | 'liveUrl'>): boolean {
  return (
    REMOVED_PROJECT_TITLES.includes(project.title as (typeof REMOVED_PROJECT_TITLES)[number])
    || (project.liveUrl != null && REMOVED_PROJECT_URLS.includes(project.liveUrl as (typeof REMOVED_PROJECT_URLS)[number]))
  );
}

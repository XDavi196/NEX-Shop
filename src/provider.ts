import type { Category, Repo, Release, SearchPage } from './github';

export interface ReleaseProvider {
  id: 'github' | 'gitlab';
  label: string;
  search(query: string, category: Category, page: number, signal?: AbortSignal): Promise<SearchPage>;
  getProject(fullName: string, signal?: AbortSignal): Promise<Repo>;
  getReleases(fullName: string, signal?: AbortSignal): Promise<Release[]>;
}

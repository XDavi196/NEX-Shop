import { getReleases, getRepo, searchRepos } from './github';
import { gitLabProvider } from './gitlab';
import type { ReleaseProvider } from './provider';

export const providers: Record<'github' | 'gitlab', ReleaseProvider> = {
  github: {
    id: 'github',
    label: 'GitHub',
    search: searchRepos,
    getProject: getRepo,
    getReleases,
  },
  gitlab: gitLabProvider,
};

export const providerOptions = Object.values(providers);

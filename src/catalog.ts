import type { ProviderId } from './github';

export type CatalogEntry = {
  id: string;
  name: string;
  provider: ProviderId;
  project: string;
  category: 'emulators' | 'homebrew' | 'ports';
  targets: string[];
  note: string;
  verifiedAt: string;
};

// These seed entries were checked against the provider APIs on 2026-10-19.
// Release details remain live and are fetched from the project provider.
export const curatedCatalog: CatalogEntry[] = [
  {
    id: 'ppsspp', name: 'PPSSPP', provider: 'github', project: 'hrydgard/ppsspp', category: 'emulators',
    targets: ['Windows', 'Android'], note: 'Emulador de PSP. Confira os requisitos e arquivos na página oficial.', verifiedAt: '2026-10-19',
  },
  {
    id: 'melonds', name: 'melonDS', provider: 'github', project: 'melonDS-emu/melonDS', category: 'emulators',
    targets: ['Windows'], note: 'Emulador de Nintendo DS. Os dados de jogos e firmware não são fornecidos pela NEX.', verifiedAt: '2026-10-19',
  },
  {
    id: 'retroarch', name: 'RetroArch', provider: 'github', project: 'libretro/RetroArch', category: 'emulators',
    targets: ['Windows', 'Android'], note: 'Frontend para emuladores. Núcleos e conteúdo podem ter licenças e requisitos distintos.', verifiedAt: '2026-10-19',
  },
  {
    id: 'scummvm', name: 'ScummVM', provider: 'github', project: 'scummvm/scummvm', category: 'emulators',
    targets: ['Windows', 'Android'], note: 'Executa jogos compatíveis com ScummVM; os arquivos dos jogos devem vir de fonte autorizada.', verifiedAt: '2026-10-19',
  },
  {
    id: 'duckstation', name: 'DuckStation', provider: 'github', project: 'stenzek/duckstation', category: 'emulators',
    targets: ['Windows', 'Android'], note: 'Emulador de PlayStation. Não inclui BIOS nem arquivos de jogos.', verifiedAt: '2026-10-19',
  },
];

export function parseOfficialProjectUrl(value: string): { provider: ProviderId; project: string } | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return null;
    const parts = url.pathname.replace(/\.git$/i, '').split('/').filter(Boolean).map(part => decodeURIComponent(part));
    if (parts.length < 2 || parts.some(part => part === '.' || part === '..')) return null;
    if (url.hostname === 'github.com' && parts.length === 2) return { provider: 'github', project: parts.join('/') };
    if (url.hostname === 'gitlab.com' && !parts.includes('-')) return { provider: 'gitlab', project: parts.join('/') };
    return null;
  } catch {
    return null;
  }
}

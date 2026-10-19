import { describe, expect, it } from 'vitest';
import { parseOfficialProjectUrl } from './catalog';

describe('parseOfficialProjectUrl', () => {
  it('accepts canonical GitHub project URLs and strips .git', () => {
    expect(parseOfficialProjectUrl('https://github.com/hrydgard/ppsspp.git')).toEqual({ provider: 'github', project: 'hrydgard/ppsspp' });
  });

  it('accepts nested GitLab project paths', () => {
    expect(parseOfficialProjectUrl('https://gitlab.com/studio/subgroup/project')).toEqual({ provider: 'gitlab', project: 'studio/subgroup/project' });
  });

  it('rejects unofficial hosts, insecure links, and non-project paths', () => {
    expect(parseOfficialProjectUrl('https://evil.example/github.com/owner/project')).toBeNull();
    expect(parseOfficialProjectUrl('http://github.com/owner/project')).toBeNull();
    expect(parseOfficialProjectUrl('https://github.com/owner')).toBeNull();
    expect(parseOfficialProjectUrl('https://github.com/owner/project?token=secret')).toBeNull();
    expect(parseOfficialProjectUrl('https://gitlab.com/group/project/-/releases')).toBeNull();
  });
});

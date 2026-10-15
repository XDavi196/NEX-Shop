export type Category = 'all'|'emulators'|'ports'|'homebrew'|'opensource'|'tools'|'launchers'|'android'|'windows';
export type Repo = { id:number; name:string; full_name:string; html_url:string; description:string|null; owner:{login:string;html_url:string}; language:string|null; stargazers_count:number; updated_at:string; default_branch:string; topics?:string[]; license?:{spdx_id:string|null;name:string;url:string|null}|null; forks_count:number; open_issues_count:number; created_at:string; homepage:string|null; archived:boolean; disabled:boolean; };
export type ReleaseAsset = {name:string;size:number;browser_download_url:string;content_type:string;download_count:number};
export type Release = {tag_name:string;name:string|null;html_url:string;published_at:string|null;body:string|null;draft:boolean;prerelease:boolean;assets:ReleaseAsset[]};
export type SearchPage = {items:Repo[];total_count:number;incomplete_results:boolean};
const API='https://api.github.com';
const cache = new Map<string,{until:number;value:unknown}>();
const TTL=5*60_000;
const categoryTerms:Record<Category,string>={all:'',emulators:'emulator',ports:'game-port',homebrew:'homebrew',opensource:'open-source game',tools:'game tools',launchers:'game launcher',android:'android',windows:'windows'};
export class GitHubError extends Error { constructor(message:string, public status?:number, public retryAt?:number){super(message)} }
async function get<T>(path:string,signal?:AbortSignal):Promise<T>{
  const url=API+path; const hit=cache.get(url); if(hit&&hit.until>Date.now()) return hit.value as T;
  let response:Response;
  try { response=await fetch(url,{signal,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}}); }
  catch(e){if(e instanceof DOMException&&e.name==='AbortError')throw e; throw new GitHubError('Falha de rede ao conectar à API pública do GitHub. Verifique a conexão e tente novamente.');}
  if(!response.ok){
    if(response.status===403||response.status===429){const reset=Number(response.headers.get('X-RateLimit-Reset'));const retryAfter=Number(response.headers.get('Retry-After'));const retryAt=retryAfter?Date.now()+retryAfter*1000:(reset?reset*1000:undefined);throw new GitHubError('O GitHub limitou temporariamente as consultas públicas.'+(retryAt?` Tente novamente ${new Date(retryAt).toLocaleTimeString('pt-BR')}.`:''),response.status,retryAt);}
    if(response.status===404)throw new GitHubError('Este repositório não foi encontrado.',404);
    throw new GitHubError(`O GitHub respondeu com erro (${response.status}). Tente novamente mais tarde.`,response.status);
  }
  const data=await response.json() as T; cache.set(url,{value:data,until:Date.now()+TTL}); return data;
}
export function searchRepos(query:string,category:Category,page:number,signal?:AbortSignal){
  const terms=[query.trim(),categoryTerms[category]].filter(Boolean).join(' ');
  const q=terms||'game'; const params=new URLSearchParams({q,sort:'stars',order:'desc',page:String(page),per_page:'24'});
  return get<SearchPage>(`/search/repositories?${params}`,signal);
}
export function getRepo(fullName:string,signal?:AbortSignal){return get<Repo>(`/repos/${fullName}`,signal)}
export async function getReleases(fullName:string,signal?:AbortSignal){try{return await get<Release[]>(`/repos/${fullName}/releases?per_page=10`,signal)}catch(e){if(e instanceof GitHubError&&e.status===404)return [];throw e}}
export function validReleaseUrl(url:string){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='github.com'&&u.pathname.includes('/releases/download/')}catch{return false}}
export function formatDate(date:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(new Date(date))}
export function formatSize(bytes:number){return bytes<1024*1024?`${(bytes/1024).toFixed(0)} KB`:`${(bytes/1024/1024).toFixed(1)} MB`}

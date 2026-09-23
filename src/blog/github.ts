// Thin GitHub REST client for the blog admin. Every write is a commit to the site repo,
// which triggers the Pages deploy workflow. The token never leaves this browser except
// in requests to api.github.com.
import { site } from '../data'

const API = 'https://api.github.com'
const { owner, name, branch } = site.repo
const REPO = `/repos/${owner}/${name}`

export class GhError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function gh<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new GhError(res.status, body.message ?? res.statusText)
  }
  return (res.status === 204 ? null : await res.json()) as T
}

const enc = (path: string) => path.split('/').map(encodeURIComponent).join('/')

export function bytesToB64(bytes: Uint8Array) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
export const textToB64 = (s: string) => bytesToB64(new TextEncoder().encode(s))
const b64ToText = (b: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)))

/** Returns the GitHub login if the token can push to the site repo. */
export async function verify(token: string) {
  const repo = await gh<{ permissions?: { push?: boolean } }>(token, REPO)
  if (!repo.permissions?.push) throw new GhError(403, `This token can't write to ${owner}/${name}.`)
  const user = await gh<{ login: string }>(token, '/user')
  return user.login
}

export async function listDir(token: string, dir: string) {
  try {
    const items = await gh<{ type: string; name: string; path: string; sha: string }[]>(
      token,
      `${REPO}/contents/${enc(dir)}?ref=${branch}`,
    )
    return items.filter((f) => f.type === 'file')
  } catch (e) {
    if (e instanceof GhError && e.status === 404) return []
    throw e
  }
}

export async function readText(token: string, path: string) {
  const f = await gh<{ content: string; sha: string }>(token, `${REPO}/contents/${enc(path)}?ref=${branch}`)
  return { text: b64ToText(f.content), sha: f.sha }
}

/** Create (no sha) or update (with sha) a file. Returns the new blob sha. */
export async function writeFile(token: string, path: string, base64: string, message: string, sha?: string) {
  const r = await gh<{ content: { sha: string } }>(token, `${REPO}/contents/${enc(path)}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: base64, branch, sha }),
  })
  return r.content.sha
}

export async function deleteFile(token: string, path: string, sha: string, message: string) {
  await gh(token, `${REPO}/contents/${enc(path)}`, { method: 'DELETE', body: JSON.stringify({ message, sha, branch }) })
}

export const rawUrl = (path: string) => `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${path}`
export const actionsUrl = `https://github.com/${owner}/${name}/actions`

import { useEffect, useState } from 'react'

// Hash routes keep GitHub Pages happy (no server rewrites needed).
// "#/blog", "#/blog/<slug>", "#/admin" are pages; any other hash is an anchor on the home page.
export type Route =
  | { name: 'home'; anchor?: string }
  | { name: 'blog' }
  | { name: 'post'; slug: string }
  | { name: 'admin' }

export function parseHash(hash: string): Route {
  if (hash.startsWith('#/')) {
    const [page, slug] = hash.slice(2).split('/').filter(Boolean)
    if (page === 'blog') return slug ? { name: 'post', slug: decodeURIComponent(slug) } : { name: 'blog' }
    if (page === 'admin') return { name: 'admin' }
  }
  return { name: 'home', anchor: hash.slice(1) || undefined }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

// Home-page sections are linked as "#id" from the home page and "./#id" elsewhere (same thing).
export const sectionHref = (id: string) => `#${id}`
export const postHref = (slug: string) => `#/blog/${slug}`

declare module 'virtual:posts' {
  export type PostMeta = {
    slug: string
    title: string
    date: string
    summary: string
    tags: string[]
    draft: boolean
    minutes: number
  }
  export const posts: PostMeta[]
  export const loaders: Record<string, () => Promise<string>>
}

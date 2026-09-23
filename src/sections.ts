import { posts } from 'virtual:posts'
import { SECTIONS as ALL } from './data'

// The Blog section only appears once there is at least one published post.
export const hasBlog = posts.length > 0

export const SECTIONS = ALL.filter((s) => s.id !== 'writing' || hasBlog)

export const sectionNo = (id: string) => String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, '0')

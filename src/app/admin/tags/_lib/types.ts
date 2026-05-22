import type { ComponentType, SVGProps } from 'react'

export interface Tag {
  id: string
  name: string
  slug: string
  tag_type?: string
  tag_type_id?: string
}

export interface TagType {
  id: string
  name: string
  slug: string
  icon?: string
  color: string
  created_at: string
  updated_at: string
  tags?: { count: number }[]
}

export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>

export interface TagCategory {
  id: string
  type: string
  name: string
  icon: HeroIcon
  color: string
  tags: Tag[]
}

export type DeleteTarget = { type: 'tag' | 'type'; id: string }

export interface TagFormState {
  name: string
  slug: string
  tag_type_id: string
}

export interface TypeFormState {
  name: string
  slug: string
  icon: string
  color: string
  initialTag: string
}

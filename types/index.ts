import type { Project, Card, ProjectStatus, CardColumn } from '@prisma/client'

export type { Project, Card, ProjectStatus, CardColumn }

export type ProjectWithCards = Project & { cards: Card[] }

export type CardWithProject = Card & { project: Project }

export type Column = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type BoardState = {
  TODO: Card[]
  IN_PROGRESS: Card[]
  DONE: Card[]
}

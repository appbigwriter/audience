/**
 * Calendário editorial (AB-S4-002).
 * Suporta pauta, owner, data, canal, status, prioridade e bloqueio; NÃO cria publicação automática.
 */
export const EDITORIAL_CALENDAR_VERSION = 1

export type CalendarItemStatus = 'idea' | 'briefed' | 'in-research' | 'drafting' | 'in-review' | 'blocked' | 'approved-draft' | 'cancelled'

export type CalendarChannel = 'blog' | 'social' | 'newsletter'

export type CalendarItem = {
  itemId: string
  projectId: string
  title: string
  angle?: string
  outlinePoints?: string[]
  scheduledFor: string // ISO date
  owner: string
  channel: CalendarChannel
  status: CalendarItemStatus
  priority: 'low' | 'normal' | 'high'
  blockedReason?: string
  dependsOn?: string[]
}

export class CalendarError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'CalendarError'
  }
}

export function createCalendarItem(input: Omit<CalendarItem, 'status' | 'priority'> & { status?: CalendarItemStatus; priority?: CalendarItem['priority'] }): CalendarItem {
  if (!input.itemId?.trim()) throw new CalendarError('ID_REQUIRED', 'itemId é obrigatório')
  if (!input.projectId?.trim()) throw new CalendarError('PROJECT_REQUIRED', 'projectId é obrigatório')
  if (!input.title?.trim() || input.title.trim().length < 4) throw new CalendarError('TITLE_TOO_SHORT', 'título precisa de ao menos 4 caracteres')
  if (!/^\d{4}-\d{2}-\d{2}/.test(input.scheduledFor)) throw new CalendarError('DATE_FORMAT', 'scheduledFor deve ser data ISO (YYYY-MM-DD)')
  if (!input.owner?.trim()) throw new CalendarError('OWNER_REQUIRED', 'owner é obrigatório')
  if (input.outlinePoints !== undefined && input.outlinePoints.length < 4) {
    throw new CalendarError('OUTLINE_MIN_POINTS', 'pauta precisa de pelo menos 4 pontos concretos')
  }
  return {
    ...input,
    status: input.status ?? 'idea',
    priority: input.priority ?? 'normal',
  }
}

const TRANSITIONS: Record<CalendarItemStatus, CalendarItemStatus[]> = {
  'idea': ['briefed', 'cancelled'],
  'briefed': ['in-research', 'cancelled'],
  'in-research': ['drafting', 'blocked', 'cancelled'],
  'drafting': ['in-review', 'blocked', 'cancelled'],
  'in-review': ['approved-draft', 'blocked', 'cancelled'],
  'blocked': ['in-research', 'drafting', 'in-review', 'cancelled'],
  'approved-draft': [], // só sai por Gate de publicação — fora do calendário
  'cancelled': [],
}

export function transitionCalendarItem(item: CalendarItem, to: CalendarItemStatus, opts?: { reason?: string; actor?: string }): CalendarItem {
  const allowed = TRANSITIONS[item.status]
  if (!allowed.includes(to)) {
    throw new CalendarError('INVALID_TRANSITION', `transição ${item.status} → ${to} não permitida`)
  }
  if (to === 'blocked' && !opts?.reason?.trim()) {
    throw new CalendarError('BLOCKED_REASON_REQUIRED', 'bloqueio exige motivo')
  }
  const next: CalendarItem = { ...item, status: to }
  if (to === 'blocked') next.blockedReason = opts?.reason
  else delete next.blockedReason
  return next
}

/** approved-draft nunca significa publicado: o calendário não emite publicação. */
export function assertNoAutoPublish(item: CalendarItem): void {
  if (item.status === 'approved-draft') {
    // estado terminal do calendário; publicação exige Gate — nada a fazer aqui além de explícito
    return
  }
}

export function calendarView(items: CalendarItem[], filter?: { projectId?: string; channel?: CalendarChannel; from?: string; to?: string }): CalendarItem[] {
  return items
    .filter(i => (!filter?.projectId || i.projectId === filter.projectId))
    .filter(i => (!filter?.channel || i.channel === filter.channel))
    .filter(i => (!filter?.from || i.scheduledFor >= filter.from))
    .filter(i => (!filter?.to || i.scheduledFor <= filter.to))
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || a.priority.localeCompare(b.priority))
}

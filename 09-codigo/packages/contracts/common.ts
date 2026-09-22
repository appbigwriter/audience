/**
 * Audience Builder — primitivas compartilhadas de contrato.
 *
 * Nenhum segredo, token ou valor externo real passa por aqui.
 * Erros seguem o padrão de código estável + status HTTP já usado em
 * `lib/persona-binding.ts` (adapter contract v1).
 */
import { createHash } from 'node:crypto'

/** Hash canônico no formato `sha256:<hex>`. */
export type CanonicalHash = string

export type FieldError = {
  /** caminho do campo, ex.: `persona.approval.approvedBy` */
  field: string
  code: string
  message: string
}

export type ValidationResult = { ok: boolean; errors: FieldError[] }

export class AudienceBuilderContractError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus: number = 422,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'AudienceBuilderContractError'
  }
}

/** Serialização determinística: chaves ordenadas, sem whitespace. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`
}

/** Hash de conteúdo determinístico sobre a forma canônica. */
export function computeContentHash(value: unknown): CanonicalHash {
  return `sha256:${createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')}`
}

export function isCanonicalHash(value: string): boolean {
  return /^sha256:[0-9a-f]{64}$/.test(value)
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function isIsoDate(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().length > 0
}

/** Validação base reutilizável: acumula erros por campo. */
export class FieldValidator {
  readonly errors: FieldError[] = []

  require(field: string, value: unknown, code = 'REQUIRED', message = `${field} is required`): boolean {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)) {
      this.errors.push({ field, code, message })
      return false
    }
    return true
  }

  requireNonEmptyArray(field: string, value: unknown, code = 'REQUIRED_NON_EMPTY'): boolean {
    if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== 'string' || v.trim().length === 0)) {
      this.errors.push({ field, code, message: `${field} must be a non-empty array of strings` })
      return false
    }
    return true
  }

  enum<T extends string>(field: string, value: unknown, allowed: readonly T[], code = 'INVALID_VALUE'): boolean {
    if (!allowed.includes(value as T)) {
      this.errors.push({ field, code, message: `${field} must be one of: ${allowed.join(', ')}` })
      return false
    }
    return true
  }

  pattern(field: string, value: unknown, regex: RegExp, code = 'INVALID_FORMAT'): boolean {
    if (typeof value !== 'string' || !regex.test(value)) {
      this.errors.push({ field, code, message: `${field} has invalid format` })
      return false
    }
    return true
  }

  add(field: string, code: string, message: string): void {
    this.errors.push({ field, code, message })
  }

  result(): ValidationResult {
    return { ok: this.errors.length === 0, errors: this.errors }
  }
}

export type ActorRef = { actor: string; at: string; reason: string }

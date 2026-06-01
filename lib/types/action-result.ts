export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type CompensacaoActionResult =
  | { ok: true }
  | { ok: false; reason: string }

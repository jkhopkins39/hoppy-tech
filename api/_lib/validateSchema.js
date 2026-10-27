/**
 * Lightweight field-schema validation (no zod).
 * Enforces required flags, types, and max lengths before any paid work.
 */

/**
 * @typedef {{
 *   type?: 'string' | 'boolean' | 'number',
 *   required?: boolean,
 *   max?: number,
 *   message?: string,
 * }} FieldRule
 */

/**
 * @param {unknown} body
 * @param {Record<string, FieldRule>} schema
 * @returns {{ ok: true, data: Record<string, unknown> } | { ok: false, field: string|null, message: string }}
 */
export function validateSchema(body, schema) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, field: null, message: 'Invalid request.' };
  }

  /** @type {Record<string, unknown>} */
  const data = {};

  for (const [key, rules] of Object.entries(schema)) {
    const type = rules.type ?? 'string';
    let value = /** @type {Record<string, unknown>} */ (body)[key];

    if (value === undefined || value === null || value === '') {
      if (rules.required) {
        return { ok: false, field: key, message: rules.message ?? `${key} is required.` };
      }
      data[key] = type === 'boolean' ? false : '';
      continue;
    }

    if (type === 'boolean') {
      data[key] = Boolean(value);
      continue;
    }

    if (type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { ok: false, field: key, message: rules.message ?? `Invalid ${key}.` };
      }
      data[key] = n;
      continue;
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
      return { ok: false, field: key, message: rules.message ?? `Invalid ${key}.` };
    }

    let text = String(value).trim();
    if (rules.required && !text) {
      return { ok: false, field: key, message: rules.message ?? `${key} is required.` };
    }
    if (rules.max != null && text.length > rules.max) {
      return { ok: false, field: key, message: rules.message ?? 'Input too long.' };
    }
    if (rules.max != null) text = text.slice(0, rules.max);
    data[key] = text;
  }

  return { ok: true, data };
}

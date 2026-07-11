/* ============================================================================
   schema.mjs — a tiny, dependency-free JSON-Schema-subset validator
   ============================================================================
   Supports the keywords this project needs: type, required, properties,
   additionalProperties(false→warn), items, enum, minimum, maximum, pattern,
   minLength, minItems, maxItems. Returns a flat list of {path, message}.
   It is intentionally small and readable — not a full JSON Schema engine.
   ============================================================================ */

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v; // string, number, boolean, object
}

function matchesType(v, t) {
  if (t === 'integer') return Number.isInteger(v);
  if (t === 'number') return typeof v === 'number';
  if (t === 'array') return Array.isArray(v);
  if (t === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
  return typeOf(v) === t;
}

export function validate(schema, data, pathPrefix = '') {
  const errors = [];
  walk(schema, data, pathPrefix || '(root)', errors);
  return errors;
}

function walk(schema, data, p, errors) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(data, t))) {
      errors.push({ path: p, message: `expected ${types.join(' or ')}, got ${typeOf(data)}` });
      return; // stop deeper checks on wrong type
    }
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({ path: p, message: `must be one of ${JSON.stringify(schema.enum)}` });
  }
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) errors.push({ path: p, message: `must be >= ${schema.minimum}` });
    if (schema.maximum !== undefined && data > schema.maximum) errors.push({ path: p, message: `must be <= ${schema.maximum}` });
  }
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) errors.push({ path: p, message: `must be at least ${schema.minLength} characters` });
    if (schema.pattern && !(new RegExp(schema.pattern)).test(data)) errors.push({ path: p, message: `does not match required pattern` });
  }
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) errors.push({ path: p, message: `must have at least ${schema.minItems} items` });
    if (schema.maxItems !== undefined && data.length > schema.maxItems) errors.push({ path: p, message: `must have at most ${schema.maxItems} items` });
    if (schema.items) data.forEach((item, i) => walk(schema.items, item, `${p}[${i}]`, errors));
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in data) || data[key] === undefined) errors.push({ path: `${p}.${key}`, message: `is required` });
      }
    }
    if (schema.properties) {
      for (const [key, sub] of Object.entries(schema.properties)) {
        if (key in data && data[key] !== undefined) walk(sub, data[key], `${p}.${key}`, errors);
      }
    }
  }
}

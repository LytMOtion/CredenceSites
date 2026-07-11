/* ============================================================================
   render.mjs — tiny, zero-dependency template renderer (a Mustache subset)
   ============================================================================
   The Credence client generator keeps every page as plain static HTML with
   EXPLICIT, NAMED data bindings — no framework, no database, no CMS. This file
   is the whole templating engine.

   Supported syntax (deliberately small and predictable):
     {{ name }}          → HTML-escaped value           (safe text binding)
     {{{ name }}}        → raw value, NOT escaped        (only for trusted markup we generate)
     {{# name }}...{{/ name }}   → section:
                              - if value is an array  → repeat block for each item (item context)
                              - if value is truthy    → render block once
                              - if value is falsy/[]  → skip
     {{^ name }}...{{/ name }}   → inverted section: render block only when value is falsy/empty
     {{! comment }}      → removed from output

   Dotted paths are supported inside sections and at top level: {{ business.publicName }}.
   Inside an array section, {{ . }} refers to the current item (for arrays of strings).

   There is intentionally no arbitrary code execution and no partial includes by
   filename — bindings are named and data-driven only.
   ============================================================================ */

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lookup(scopes, key) {
  key = key.trim();
  if (key === '.') return scopes[scopes.length - 1];
  const parts = key.split('.');
  for (let i = scopes.length - 1; i >= 0; i--) {
    let ctx = scopes[i];
    if (ctx == null) continue;
    let ok = true, cur = ctx;
    for (const p of parts) {
      if (cur != null && Object.prototype.hasOwnProperty.call(Object(cur), p)) {
        cur = cur[p];
      } else { ok = false; break; }
    }
    if (ok) return cur;
  }
  return undefined;
}

function isEmpty(v) {
  if (v == null || v === false || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

/* Tokeniser → flat list of {type,text|name} */
function tokenize(tpl) {
  const re = /\{\{([{#\/^!]?)\s*([^}]*?)\s*\}?\}\}/g;
  const out = [];
  let last = 0, m;
  while ((m = re.exec(tpl)) !== null) {
    if (m.index > last) out.push({ type: 'text', text: tpl.slice(last, m.index) });
    const sigil = m[1], name = m[2];
    if (sigil === '#') out.push({ type: 'open', name });
    else if (sigil === '^') out.push({ type: 'openInv', name });
    else if (sigil === '/') out.push({ type: 'close', name });
    else if (sigil === '!') { /* comment: drop */ }
    else if (sigil === '{') out.push({ type: 'raw', name });
    else out.push({ type: 'var', name });
    last = re.lastIndex;
  }
  if (last < tpl.length) out.push({ type: 'text', text: tpl.slice(last) });
  return out;
}

/* Parse token list → nested nodes */
function parse(tokens) {
  const root = { children: [] };
  const stack = [root];
  for (const t of tokens) {
    const top = stack[stack.length - 1];
    if (t.type === 'open' || t.type === 'openInv') {
      const node = { type: t.type, name: t.name, children: [] };
      top.children.push(node);
      stack.push(node);
    } else if (t.type === 'close') {
      if (stack.length < 2) throw new Error('Unbalanced section: unexpected {{/' + t.name + '}}');
      const closing = stack.pop();
      if (closing.name.trim() !== t.name.trim()) {
        throw new Error('Mismatched section: {{#' + closing.name + '}} closed by {{/' + t.name + '}}');
      }
    } else {
      top.children.push(t);
    }
  }
  if (stack.length !== 1) throw new Error('Unclosed section: {{#' + stack[stack.length - 1].name + '}}');
  return root;
}

function renderNodes(nodes, scopes) {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') out += n.text;
    else if (n.type === 'var') { const v = lookup(scopes, n.name); out += v == null ? '' : escapeHtml(v); }
    else if (n.type === 'raw') { const v = lookup(scopes, n.name); out += v == null ? '' : String(v); }
    else if (n.type === 'open') {
      const v = lookup(scopes, n.name);
      if (Array.isArray(v)) { for (const item of v) out += renderNodes(n.children, scopes.concat([item])); }
      else if (!isEmpty(v)) { out += renderNodes(n.children, scopes.concat([typeof v === 'object' ? v : {}])); }
    } else if (n.type === 'openInv') {
      const v = lookup(scopes, n.name);
      if (isEmpty(v)) out += renderNodes(n.children, scopes);
    }
  }
  return out;
}

export function render(template, data) {
  const ast = parse(tokenize(template));
  return renderNodes(ast.children, [data]);
}

export { escapeHtml };

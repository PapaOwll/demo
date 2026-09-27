/**
 * Sanitizes a notification message for safe v-html rendering.
 * Escapes all HTML entities first, then re-enables only a
 * whitelist of attribute-free tags (br, b, strong, i, em, span).
 *
 * @param {string} input - Raw message text
 * @returns {string} Safe HTML string
 */
export function sanitizeNotifHtml(input) {
  if (!input) return ''

  let escaped = String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  const whitelist = ['br', 'b', 'strong', 'i', 'em', 'span']

  whitelist.forEach((tag) => {
    const openTag = new RegExp(`&lt;(${tag})&gt;`, 'gi')
    const closeTag = new RegExp(`&lt;/(${tag})&gt;`, 'gi')

    escaped = escaped.replace(openTag, `<$1>`).replace(closeTag, `</$1>`)
  })

  return escaped
}

/**
 * Fetches pages 1..maxPages via `getPageItems` sequentially, stopping at the
 * first empty page; returns all items in page order. Sequential awaits are
 * intentional: whether page N+1 exists is known only after page N resolves.
 *
 * @param {(page: number) => Promise<Array>} getPageItems - resolves the items of one page
 * @param {number} maxPages - hard cap on pages fetched
 * @returns {Promise<Array>} all items, in page order
 */
export async function fetchAllPages(getPageItems, maxPages) {
  const items = []
  for (let page = 1; page <= maxPages; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const pageItems = await getPageItems(page)
    if (!Array.isArray(pageItems) || pageItems.length === 0) break
    items.push(...pageItems)
  }
  return items
}

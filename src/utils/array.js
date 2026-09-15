export function generateArray(length) {
  try {
    return [...Array.from({ length }).keys()]
  } catch {
    return []
  }
}

export function range(_start, _end, step = 1) {
  let start = Number(_start)
  let end = _end && Number(_end)
  if (end === undefined) {
    end = start
    start = 0
  }

  if (typeof start !== 'number' || typeof end !== 'number' || typeof step !== 'number') {
    throw new TypeError('The start,end or step in range function must be number.')
  }

  return Array.from({ length: Math.ceil(end - start) / step }, (_, i) => start + i * step)
}

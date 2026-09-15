export function flattenStatusObject(obj) {
  const results = []

  function recurse(current) {
    Object.entries(current).forEach(([value]) => {
      if (value?.id) {
        results.push({
          title: value.title,
          value: value.id,
        })
      } else if (typeof value === 'object' && value !== null) {
        recurse(value)
      }
    })
  }

  recurse(obj)
  return results
}

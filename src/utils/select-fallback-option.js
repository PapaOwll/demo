export function addFallbackOption(
  options,
  modelValue,
  labelKey = 'title',
  displayLabel = null,
  loaded = true
) {
  if (displayLabel && modelValue != null) {
    const mvId = typeof modelValue === 'object' ? (modelValue.id ?? modelValue.value) : modelValue
    if (mvId != null && !options.some((o) => o.value === mvId)) {
      options.unshift({ label: displayLabel, value: mvId })
    }
    return options
  }

  if (!loaded) return options

  if (!modelValue) return options

  const values = Array.isArray(modelValue) ? modelValue : [modelValue]

  values.forEach((mv) => {
    if (!mv || typeof mv !== 'object') return
    const mvId = mv.id ?? mv.value
    const mvLabel = mv[labelKey] ?? mv.title ?? mv.name ?? mv.faTitle ?? mv.label
    if (mvId != null && mvLabel && !options.some((o) => o.value === mvId)) {
      options.push({ label: mvLabel, value: mvId, rawData: mv })
    }
  })

  return options
}

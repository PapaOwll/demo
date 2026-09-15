// utils.js
export const groupAdvisorsByProvince = (groups, advisors, provinces) => {
  const data = groups.flatMap(({ advisorId, provinceId, fromDaysAgo, toDaysAgo }) =>
    advisorId.map((advisorItemId) => {
      const province =
        provinces.find((p) => p.id === provinceId) ||
        (provinceId === -1
          ? { id: -1, name: 'سایر استان‌ها' }
          : provinceId === -2
            ? { id: -2, name: 'لید سرد' }
            : { id: null, name: 'بدون استان' })

      const advisor = advisors.find((a) => a.id === advisorItemId)

      return {
        provinceId: province.id,
        provinceName: province.name ?? 'نامشخص',
        advisorId: advisor?.id ?? 'نامشخص',
        advisorName: advisor?.name ?? 'نامشخص',
        fromDaysAgo,
        toDaysAgo,
      }
    })
  )
  return data
}
export const groupByProvince = (data) => {
  return data.reduce((acc, advisor) => {
    const { provinceId, provinceName, fromDaysAgo, toDaysAgo, advisorId, advisorName } = advisor

    const key = `${provinceId}-${fromDaysAgo}-${toDaysAgo}`

    if (!acc[key]) {
      acc[key] = {
        provinceId,
        provinceName,
        fromDaysAgo,
        toDaysAgo,
        advisors: [],
        advisorsSet: new Set(),
      }
    }

    if (!acc[key].advisorsSet.has(advisorId)) {
      acc[key].advisors.push({ advisorId, advisorName })
      acc[key].advisorsSet.add(advisorId)
    }

    return acc
  }, {})
}

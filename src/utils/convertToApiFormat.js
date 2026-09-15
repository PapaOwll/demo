import { snakize } from '@/utils/convert-to-camel-snake'
import createFilterObject from '@/utils/create-filter-object'

export const convertToApiFormat = (filters) => {
  const snakeCaseFilters = snakize(filters)
  return createFilterObject(snakeCaseFilters)
}

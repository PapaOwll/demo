import { getBaseUrl } from '@/utils/base-url'
import { createInstance } from './instance'

const baseUrl = getBaseUrl()

export const request = createInstance(baseUrl)

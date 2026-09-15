// Custom axios adapter — serves every request from the local mock system.
import { handleMockRequest } from './handlers'

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const mockAdapter = async (config) => {
  await delay(100 + Math.random() * 150)

  const result = handleMockRequest(config)

  const response = {
    data: result.body,
    status: result.status || 200,
    statusText: 'OK',
    headers: {},
    config,
    request: { responseType: config.responseType },
  }

  if (response.status >= 400) {
    const error = new Error(`Mock request failed with status code ${response.status}`)
    error.isAxiosError = true
    error.config = config
    error.response = response
    throw error
  }

  return response
}

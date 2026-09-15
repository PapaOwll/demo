import { isTenant } from './tenant-utils'

export function getBaseUrl() {
  const { VITE_BASE_URL, VITE_SERVER } = import.meta.env
  const { origin } = window.location

  const isRelease = VITE_BASE_URL !== origin && isTenant('release')
  const isOrthopedic = VITE_BASE_URL !== origin && isTenant('serito')
  const isStage = VITE_BASE_URL !== origin && origin.includes('localhost')

  return isRelease
    ? 'https://release.seritaclinic.ir/api/'
    : isOrthopedic
      ? 'https://serito.seritaclinic.ir/api/'
      : isStage
        ? 'https://panel.seritaclinic.ir/api/'
        : //   'https://panel.seritaclinic.ir/api/'
          VITE_SERVER
}

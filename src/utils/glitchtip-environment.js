export function getGlitchtipEnvironment() {
  const { host } = window.location

  return host.includes('stage')
    ? 'stage'
    : host.includes('release')
      ? 'release'
      : host.includes('serito')
        ? 'serito'
        : 'production'
}

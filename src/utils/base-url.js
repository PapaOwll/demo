export function getBaseUrl() {
  // Demo runs fully on the bundled mock layer; this prefix is only used when
  // a real backend is wired up later.
  return import.meta.env.VITE_SERVER
}

let parentApp = null

export function captureApp(app) {
  if (parentApp && parentApp !== app) {
    // eslint-disable-next-line no-console
    console.warn('[app-context] parent app already captured; ignoring re-capture')
    return
  }
  parentApp = app
}

export function getParentApp() {
  if (!parentApp) {
    throw new Error(
      '[app-context] parent app not captured yet. Call captureApp(app) during bootstrap before using imperative services.'
    )
  }
  return parentApp
}

import { createApp, h, nextTick } from 'vue'
import { Notify, Dialog } from 'quasar'
import NotifCard from '@/components/NotifCard'
import { getParentApp } from '@/composables/_app-context'

const DEFAULT_TITLES = Object.freeze({
  error: 'خطا',
  info: 'اطلاع',
  success: 'موفق',
  warning: 'هشدار',
})

const POSITION_MAP = Object.freeze({
  bottom: 'bottom',
  'bottom-center': 'bottom',
  'bottom-left': 'bottom-left',
  'bottom-right': 'bottom-right',
  top: 'top',
  'top-center': 'top',
  'top-left': 'top-left',
  'top-right': 'top-right',
})
const DEFAULT_POSITION = 'top'
const DEFAULT_TIMEOUT = 3000

const normalizePosition = (position) => POSITION_MAP[position] ?? POSITION_MAP[DEFAULT_POSITION]

const toClassList = (value) => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const createChildApp = (rootComponent, childProps, parent) => {
  const child = createApp({
    name: 'NotifCardRoot',
    render: () => h(rootComponent, childProps),
  })
  child.config.globalProperties = parent.config.globalProperties
  // eslint-disable-next-line no-underscore-dangle
  const { reload, ...appContext } = parent._context
  // eslint-disable-next-line no-underscore-dangle
  Object.assign(child._context, appContext)
  return child
}

let notifSeq = 0
const mountedApps = new WeakMap()

/**
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} message
 * @param {Object} [options]
 * @param {string|false|null} [options.title]
 * @param {string} [options.caption]
 * @param {string} [options.position]
 * @param {number} [options.timeout]
 * @param {string|string[]} [options.classes]
 * @param {Array<{ label?: string, variant?: 'filled'|'outline'|'flat', color?: string, handler?: Function, noDismiss?: boolean }>} [options.actions]
 * @returns {Function|false|undefined}
 */
const createNotif = (type, message, options = {}) => {
  const {
    title = DEFAULT_TITLES[type],
    caption,
    position = DEFAULT_POSITION,
    timeout = DEFAULT_TIMEOUT,
    classes: extraClasses,
    actions,
    ...rest
  } = options

  const hasTitle = title !== false && title !== null && title !== ''
  const safeActions = Array.isArray(actions) ? actions : []
  const notifUid = `app-notify-instance-${(notifSeq += 1)}`
  const groupKey = [
    type,
    message,
    hasTitle ? title : '',
    caption || '',
    safeActions.map((action) => action.label).join(','),
  ].join('|')
  const shellClasses = [
    'app-notify-shell',
    notifUid,
    `app-notify-shell--${type}`,
    ...toClassList(extraClasses),
  ]

  delete rest.type
  delete rest.message
  delete rest.html
  delete rest.caption
  delete rest.group

  let mountPointEl = null
  let notifyApi = null
  let dismissed = false

  const teardown = () => {
    dismissed = true
    if (mountPointEl) {
      mountedApps.get(mountPointEl)?.unmount()
      mountedApps.delete(mountPointEl)
      mountPointEl = null
    }
  }

  const dismissNotif = () => {
    if (notifyApi) notifyApi()
  }

  const cardProps = {
    type,
    title: hasTitle ? title : null,
    message,
    caption: caption || '',
    actions: safeActions,
    onClose: () => dismissNotif(),
    onAction: (action) => {
      action.handler?.()
      if (!action.noDismiss) dismissNotif()
    },
  }

  const payload = {
    classes: shellClasses.join(' '),
    position: normalizePosition(position),
    timeout,
    group: groupKey,
    progress: true,
    html: true,
    message: '<div class="app-notify-mount"></div>',
    onDismiss: teardown,
    ...rest,
  }

  notifyApi = Notify.create(payload)

  nextTick(() => {
    if (dismissed) return

    const shell = document.querySelector(`.${notifUid}`)
    const mountPoint = shell?.querySelector('.app-notify-mount')
    if (!mountPoint) return

    mountPointEl = mountPoint
    mountedApps.get(mountPoint)?.unmount()

    const parent = getParentApp()
    const childApp = createChildApp(NotifCard, cardProps, parent)
    mountedApps.set(mountPoint, childApp)
    childApp.mount(mountPoint)
  })

  return notifyApi
}

const error = (message, options) => createNotif('error', message, options)
const info = (message, options) => createNotif('info', message, options)
const success = (message, options) => createNotif('success', message, options)
const warning = (message, options) => createNotif('warning', message, options)

const Notif = { error, info, success, warning }

const createDialog = (title, message, callbackFn, options = {}, onCancelFn = null) => {
  const payload = {
    title,
    message,

    cancel: {
      label: 'انصراف',
      color: 'primary',
      flat: true,
    },
    ...options,
  }
  const dialog = Dialog.create(payload).onOk(() => callbackFn())
  if (typeof onCancelFn === 'function') dialog.onCancel(() => onCancelFn())
  return dialog
}

const confirmDialog = (title, message, callbackFn, options, onCancelFn = null) =>
  createDialog(title, message, callbackFn, options, onCancelFn)

export { Notif, confirmDialog }

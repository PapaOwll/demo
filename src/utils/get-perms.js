import { useUserStore } from '@/store/user'

export const getPerms = (moduleKey, actionKey, inSubModule, subModuleName) => {
  const userStore = useUserStore()
  const perms = userStore.modules

  if (!inSubModule) {
    const currentPerms = perms?.find((el) => el?.key === moduleKey)
    const access = currentPerms?.permissions?.find((el) => el?.key === actionKey)
    return !!access
  }
  const module = perms?.find((el) => el.key === moduleKey)
  const subModule = module?.subModules?.find((el) => el.key === subModuleName)
  const access = subModule?.permissions?.find((el) => el.key === actionKey)
  return !!access
}

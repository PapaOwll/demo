export const normalizedMessage = ({ text, user, target = false }) => {
  if (user) {
    const fullName = `${user?.firstName || ''} ${user?.name || ''}`
    return target
      ? text.replace('(نام مشاور)', fullName)
      : text.replace(/%0A/g, '\n').replace('(نام مشاور)', fullName)
  }
  return true
}

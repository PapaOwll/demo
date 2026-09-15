import { useMutation } from '@tanstack/vue-query'
import { apiResetPassword } from '@/modules/Auth/api'

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: apiResetPassword,
  })
}

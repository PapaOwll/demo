import * as yup from 'yup'

export const aclSchema = yup.object().shape({
  modules: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.number().required(),
        has_access: yup.boolean().required(),
        hidden: yup.boolean().when('has_access', (hasAccess, schema) => {
          if (!hasAccess) {
            return schema.oneOf([false], 'مخفی سازی فقط برای ماژول‌های با دسترسی امکان‌پذیر است')
          }
          return schema
        }),
        permissions: yup
          .object()
          .test(
            'valid-access-levels',
            'سطح دسترسی باید یکی از مقادیر all، owner, branch یا null باشد',
            function validateAccessLevels(value) {
              if (!value) return true
              return Object.values(value).every(
                (access) =>
                  access === null || access === 'all' || access === 'owner' || access === 'branch'
              )
            }
          ),
      })
    )
    .min(1, 'حداقل یک ماژول باید دسترسی داشته باشد')
    .test(
      'at-least-one-access',
      'حداقل یک ماژول باید دسترسی داشته باشد',
      function validateAtLeastOneAccess(modules) {
        return modules?.some((m) => m.has_access) || false
      }
    ),
})

export const createRoleSchema = yup.object().shape({
  title: yup
    .string()
    .required('عنوان انگلیسی الزامی است')
    .min(3, 'عنوان انگلیسی باید حداقل ۳ کاراکتر باشد')
    .matches(/^[_a-z]+$/, 'عنوان انگلیسی فقط باید شامل حروف کوچک و آندرلاین باشد'),
  faTitle: yup
    .string()
    .required('عنوان فارسی الزامی است')
    .min(2, 'عنوان فارسی باید حداقل ۲ کاراکتر باشد'),
  parentRoleId: yup.number().nullable().notRequired(),
})

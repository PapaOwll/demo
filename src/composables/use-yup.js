import { ref } from 'vue'

export default function useYup(validationSchema) {
  const errors = ref({})
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  const validate = async (values, options = { abortEarly: false, stripUnknown: true }) => {
    try {
      const response = await validationSchema.validate(values, options)
      if (!(response instanceof Error)) {
        errors.value = {}
        return { isValid: true, payload: response }
      }
      return { isValid: false, payload: response }
    } catch (error) {
      if (error.inner) {
        const newErrors = {}
        error.inner.forEach((validationError) => {
          newErrors[validationError.path] = validationError.message
        })
        errors.value = newErrors
        return { isValid: false }
      }
      return { isValid: false, payload: error }
    }
  }

  const validateAt = async (field, value, fullContext = null) => {
    try {
      const pathParts = field.split('.')
      const lastPart = pathParts.pop()
      let schemaContext = validationSchema
      let context = {}
      if (pathParts.length > 0) {
        pathParts.forEach((part) => {
          if (part.includes('[')) {
            const [arrayPart, indexPart] = part.split(/[[\]]/).filter(Boolean)
            schemaContext = schemaContext.fields[arrayPart].innerType
            context = { ...context, [arrayPart]: (context[arrayPart] || [])[indexPart] || {} }
          } else {
            context[part] = context[part] || {}
            schemaContext = schemaContext.fields[part]
          }
        })

        context[lastPart] = value
        await schemaContext.validateAt(lastPart, context)
        errors.value[field] = null
      } else {
        const contextObj = fullContext ? { ...fullContext, [field]: value } : { [field]: value }
        await validationSchema.validateAt(field, contextObj)
        errors.value[field] = null
      }
    } catch (error) {
      errors.value[field] = error?.message ?? null
    }
  }

  const resetErrors = () => {
    errors.value = {}
  }

  const setError = (field, error) => {
    errors.value[field] = error
  }

  return {
    validate,
    validateAt,
    errors,
    resetErrors,
    setError,
  }
}

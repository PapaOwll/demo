import { normalizedMessage } from '@/utils/normalized-quick-messages'

async function modernCopy(value) {
  return navigator.clipboard.writeText(`${value}`)
}

function legacyCopy(value) {
  const temporaryInput = document.createElement('input')
  temporaryInput.value = `${value}`
  document.body.append(temporaryInput)
  temporaryInput.select()
  document.execCommand('copy')
  temporaryInput.remove()
}

export const copyToClipboard = async (text, user = {}) => {
  if (!text) {
    return
  }
  const formattedText = user ? normalizedMessage({ text, user }) : text

  if (navigator.clipboard) {
    try {
      await modernCopy(formattedText)
    } catch {
      legacyCopy(formattedText)
    }
  } else {
    legacyCopy(formattedText)
  }
}

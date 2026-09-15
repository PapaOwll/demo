import { nextTick } from 'vue'

/**
 * @param inputRefs
 */
export function useInsertTag(inputRefs) {
  /**
   * @param {string} tagValue value of selected tag
   * @param {Object} item whole object of item
   * @param {number} index The index of selected message
   * @param hasBracket -Boolean- check for value of tag be in brackets[]
   */
  const insertTag = async (tagValue, item, index, hasBracket = true) => {
    await nextTick()

    const inputComponent = inputRefs.value[index]
    if (!inputComponent) {
      console.warn(`Input component at index ${index} not found.`)
      return
    }

    const textareaElement = inputComponent.$el?.querySelector('textarea')
    if (!textareaElement) {
      console.warn(`Textarea element not found on input component at index ${index}.`)
      return
    }

    const cursorPos = textareaElement.selectionStart || 0
    const textBefore = item.message.slice(0, cursorPos)
    const textAfter = item.message.slice(cursorPos)

    hasBracket
      ? // eslint-disable-next-line no-param-reassign
        (item.message = `${textBefore}[${tagValue}]${textAfter}`)
      : // eslint-disable-next-line no-param-reassign
        (item.message = `${textBefore}${tagValue}${textAfter}`)

    await nextTick()
    const newCursorPos = cursorPos + tagValue.length + 2
    textareaElement.setSelectionRange(newCursorPos, newCursorPos)
    textareaElement.focus()
  }
  return { insertTag }
}

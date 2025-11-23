// utils/clipboard.ts

/**
 * Copy text to clipboard with Telegram WebApp support and fallbacks
 * Returns true if successful, false if failed
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  const tg = (window as any)?.Telegram?.WebApp

  try {
    // Method 1: Try Telegram WebApp clipboard API first
    if (tg?.clipboard?.writeText) {
      try {
        await tg.clipboard.writeText(text)
        return true
      } catch (err) {
        console.log('Telegram clipboard failed, trying navigator.clipboard:', err)
      }
    }

    // Method 2: Try modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (err) {
        console.log('Navigator clipboard failed, trying fallback:', err)
      }
    }

    // Method 3: Fallback - Create temporary textarea element
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        return true
      } else {
        throw new Error('Copy command failed')
      }
    } catch (err) {
      console.error('Fallback copy failed:', err)
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  } catch (err) {
    console.error('All copy methods failed:', err)
    return false
  }
}
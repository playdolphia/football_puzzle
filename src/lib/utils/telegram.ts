export const detectTelegramTheme = (tg: any): 'light' | 'dark' => {
  if (!tg) return 'light'

  // Prefer colorScheme (Telegram sets this reliably)
  if (tg.colorScheme === 'dark') return 'dark'
  if (tg.colorScheme === 'light') return 'light'

  // Fallback to bg_color if needed
  if (tg.themeParams?.bg_color) {
    const bg = tg.themeParams.bg_color.toLowerCase()
    return bg === '#000000' ? 'dark' : 'light'
  }

  return 'light'
}

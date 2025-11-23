let telegramData = {
  userId: null,
  username: null,
  initData: null,
};

export function extractTelegramData() {
  const tg = window.Telegram?.WebApp;

  if (tg && tg.initDataUnsafe?.user?.id) {
    telegramData = {
      userId: tg.initDataUnsafe.user.id,
      username: tg.initDataUnsafe.user.username,
      initData: tg.initData,
    };
    tg.ready?.();
  }
}
export function getTelegramData() {
  return telegramData;
}

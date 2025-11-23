import { getTelegramData } from '@/utils/telegram';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(endpoint, { method = 'GET', headers = {}, body = null, skipTlg = false } = {}, token) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    ...headers,
  };

  // Get Telegram data
  const tg = getTelegramData();
  let initData = tg?.initData;
  let userId = tg?.userId;
  let username = tg?.username;
  if (import.meta.env.VITE_TEST_CHAT_ID) {
    initData = import.meta.env.VITE_TEST_INIT_DATA;
    userId = import.meta.env.VITE_TEST_CHAT_ID;
    username = import.meta.env.VITE_TEST_USERNAME;
  }
  let finalBody = body;
  if (body && typeof body === 'object') {
    if (skipTlg) {
      finalBody = JSON.stringify(body);
    } else {
      finalBody = JSON.stringify({
        ...body,
        __tlg: {
          init_data: initData,
          chat_id: userId,
          username: username
        }
      });
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: defaultHeaders,
    body: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) ? finalBody : null,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

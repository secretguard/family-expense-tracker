import { config } from './config';

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  parseMode?: 'HTML'
): Promise<{ message_id: number } | null> {
  const url = `https://api.telegram.org/bot${config.telegramBotToken()}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...(parseMode ? { parse_mode: parseMode } : {}) }),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error('Telegram sendMessage failed:', data);
    return null;
  }
  return data.result;
}

export function isAuthorized(chatId: number | string, userId: number | string): boolean {
  return String(chatId) === config.allowedChatId() && config.allowedUserIds().includes(String(userId));
}

export function getUserName(userId: number | string): string {
  return config.userNames()[String(userId)] ?? `User ${userId}`;
}

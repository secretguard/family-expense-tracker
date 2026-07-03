function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  telegramBotToken: () => required('TELEGRAM_BOT_TOKEN'),
  allowedChatId: () => required('ALLOWED_CHAT_ID'),
  allowedUserIds: () => required('ALLOWED_USER_IDS').split(',').map((s) => s.trim()),
  userNames: (): Record<string, string> => {
    try {
      return JSON.parse(required('USER_NAMES'));
    } catch {
      return {};
    }
  },
  spreadsheetId: () => required('SPREADSHEET_ID'),
  googleServiceAccountEmail: () => required('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
  googlePrivateKey: () => required('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  setupSecret: () => process.env.SETUP_SECRET || '',
  dashboardPassword: () => required('DASHBOARD_PASSWORD'),
  sessionSecret: () => required('SESSION_SECRET'),
};

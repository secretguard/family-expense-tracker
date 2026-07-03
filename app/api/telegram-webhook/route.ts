import { NextRequest, NextResponse } from 'next/server';
import { parseExpenseMessage, findCategory } from '@/lib/parser';
import { appendExpenseRow, deleteLastExpenseRow, updateExpenseCategory, getCategoryMap } from '@/lib/sheets';
import { sendTelegramMessage, isAuthorized, getUserName } from '@/lib/telegram';
import { isDuplicateUpdate, rememberConfirmation, getRowForConfirmation } from '@/lib/state';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    await handleUpdate(update);
  } catch (err) {
    console.error('telegram-webhook error:', err);
    // Fall through — we still return 200 below. Telegram must get a clean 200
    // regardless of internal errors, or it will queue retries indefinitely.
  }
  return NextResponse.json({ ok: true });
}

async function handleUpdate(update: any) {
  if (typeof update.update_id === 'number' && (await isDuplicateUpdate(update.update_id))) {
    return; // already processed, Telegram redelivered
  }

  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = String(message.text).trim();

  if (!isAuthorized(chatId, userId)) return;

  if (text.startsWith('/')) {
    await handleCommand(chatId, text);
    return;
  }

  if (message.reply_to_message) {
    const handled = await tryHandleCorrection(chatId, message.reply_to_message.message_id, text);
    if (handled) return;
  }

  await handleExpenseMessage(chatId, userId, text);
}

async function handleCommand(chatId: number, text: string) {
  const cmd = text.split(/\s+/)[0].toLowerCase();

  if (cmd === '/start' || cmd === '/help') {
    await sendTelegramMessage(chatId,
      'Hi! Log an expense like:\n' +
      '  Fuel 1000\n' +
      '  1000 Fuel\n\n' +
      'Commands:\n' +
      '/undo — remove the last logged expense\n' +
      '/help — show this message\n\n' +
      'Tip: reply to a confirmation message with the correct category name to fix a miscategorized entry.'
    );
    return;
  }

  if (cmd === '/undo') {
    const removed = await deleteLastExpenseRow();
    if (!removed) {
      await sendTelegramMessage(chatId, 'Nothing to undo.');
    } else {
      await sendTelegramMessage(chatId, `🗑️ Removed: ₹${removed.amount} (${removed.category})`);
    }
    return;
  }

  await sendTelegramMessage(chatId, 'Unknown command. Try /help.');
}

async function handleExpenseMessage(chatId: number, userId: number, text: string) {
  const categoryMap = await getCategoryMap();
  const parsed = parseExpenseMessage(text, categoryMap);

  if (parsed.amount === null) {
    return; // doesn't look like an expense — ignore quietly (normal chatter)
  }

  const userName = getUserName(userId);
  const row = await appendExpenseRow({
    date: new Date(),
    amount: parsed.amount,
    category: parsed.category,
    note: parsed.note,
    addedBy: userName,
    rawMessage: text,
  });

  const confirmText = parsed.category === 'Uncategorized'
    ? `⚠️ ₹${parsed.amount} logged, but I could not match a category.\nReply to this message with the correct category to fix it.`
    : `✅ ₹${parsed.amount} logged under ${parsed.category}`;

  const sent = await sendTelegramMessage(chatId, confirmText);
  if (sent?.message_id && row > 0) {
    await rememberConfirmation(chatId, sent.message_id, row);
  }
}

async function tryHandleCorrection(chatId: number, repliedToMessageId: number, text: string): Promise<boolean> {
  const row = await getRowForConfirmation(chatId, repliedToMessageId);
  if (row === null) return false;

  const categoryMap = await getCategoryMap();
  const newCategory = findCategory(text, categoryMap);
  if (newCategory === 'Uncategorized') {
    await sendTelegramMessage(chatId, "Didn't recognize that category. Add it to the Categories sheet if needed.");
    return true;
  }

  await updateExpenseCategory(row, newCategory);
  await sendTelegramMessage(chatId, `✅ Updated to ${newCategory}`);
  return true;
}

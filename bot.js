import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const API = process.env.API_URL;

// Helper: call backend safely
async function api(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

// /start (NO LOGIN REQUIRED)
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const userId = match?.[1]; // daga deep link

  if (userId) {
    const res = await fetch(`${API}/api/telegram/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, telegramId })
    });

    const data = await res.json();

    if (data.success) {
      bot.sendMessage(
        chatId,
        "✅ Telegram linked successfully!\n\nYou can now use /balance and /daily."
      );
      return;
    }
  }

  bot.sendMessage(
    chatId,
    "👋 Welcome!\n\nTelegram is optional.\nUse /help to see commands."
  );
});
  
// /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `ℹ️ *Help*\n\n` +
    `• All rewards are VIRTUAL\n` +
    `• No real money\n` +
    `• Telegram is optional`,
    { parse_mode: "Markdown" }
  );
});

// /balance (SAFE: telegramId only)
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);

  const data = await api("/api/telegram/balance", { telegramId });

  if (data.error) {
    bot.sendMessage(chatId, "❌ Please open the app at least once.");
    return;
  }

  bot.sendMessage(
    chatId,
    `📊 *Your Stats*\n` +
    `💰 Balance: ${data.balance}\n` +
    `⚡ Energy: ${data.energy}\n` +
    `🪙 Tokens: ${data.tokens}`,
    { parse_mode: "Markdown" }
  );
});

// /daily (LIMITED, SAFE)
bot.onText(/\/daily/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);

  const data = await api("/api/telegram/daily", { telegramId });

  if (data.error) {
    bot.sendMessage(chatId, "⏳ Come back later.");
    return;
  }

  bot.sendMessage(
    chatId,
    `🎁 *Daily Bonus*\n+${data.reward} coins added!`,
    { parse_mode: "Markdown" }
  );
});

console.log("🤖 Telegram bot running");

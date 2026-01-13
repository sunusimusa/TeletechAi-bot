import { Telegraf } from "telegraf";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

/* ================= CONFIG ================= */
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL; // https://yourapp.onrender.com

if (!BOT_TOKEN || !WEB_APP_URL) {
  throw new Error("❌ BOT_TOKEN or WEB_APP_URL missing in .env");
}

const bot = new Telegraf(BOT_TOKEN);

/* ================= HELPERS ================= */
async function getOrCreateUser(payloadUserId, telegramId, ref = null) {
  const res = await fetch(`${WEB_APP_URL}/api/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: payloadUserId,   // 👈 USER_xxx daga app
      telegramId,              // 👈 daga Telegram
      ref
    })
  });

  return res.json();
}

/* ================= /start ================= */
bot.start(async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const payload = ctx.startPayload; // USER_xxx daga app

    if (!payload) {
      return ctx.reply(
        "❌ Open this bot from the app to link your account."
      );
    }

    const user = await getOrCreateUser(payload, telegramId);

    if (user.error) {
      return ctx.reply("❌ Failed to load your account.");
    }

    await ctx.reply(
      `🎁 *Lucky Box Game*\n\n` +
      `💰 Balance: ${user.balance}\n` +
      `⚡ Energy: ${user.energy}\n` +
      `🪙 Tokens: ${user.tokens}\n\n` +
      `👇 Open the game:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎮 Open Game",
                web_app: { url: WEB_APP_URL }
              }
            ],
            [
              {
                text: "👥 My Referral Link",
                callback_data: "REFERRAL"
              }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Bot error occurred.");
  }
});

/* ================= /balance ================= */
bot.command("balance", async (ctx) => {
  const telegramId = String(ctx.from.id);

  const res = await fetch(`${WEB_APP_URL}/api/user/by-telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId })
  });

  const user = await res.json();
  if (user.error) return ctx.reply("❌ Account not linked.");

  ctx.reply(
    `📊 *Your Stats*\n\n` +
    `💰 Balance: ${user.balance}\n` +
    `⚡ Energy: ${user.energy}\n` +
    `🪙 Tokens: ${user.tokens}\n` +
    `👥 Referrals: ${user.referralsCount || 0}`,
    { parse_mode: "Markdown" }
  );
});

/* ================= REFERRAL ================= */
bot.action("REFERRAL", async (ctx) => {
  const telegramId = String(ctx.from.id);

  const res = await fetch(`${WEB_APP_URL}/api/user/by-telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId })
  });

  const user = await res.json();
  if (user.error) return ctx.reply("❌ Account not linked.");

  const link = `${WEB_APP_URL}/?ref=${user.wallet}`;

  await ctx.reply(
    `👥 *Your Referral Link*\n\n${link}\n\nInvites: ${user.referralsCount || 0}`,
    { parse_mode: "Markdown" }
  );
});

/* ================= ERROR ================= */
bot.catch((err) => {
  console.error("❌ BOT ERROR:", err);
});

/* ================= START ================= */
bot.launch().then(() => {
  console.log("🤖 Telegram bot running...");
});

/* ================= STOP ================= */
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

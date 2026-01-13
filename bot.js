import { Telegraf } from "telegraf";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

/* ================= CONFIG ================= */
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL; // misali: https://yourapp.onrender.com

if (!BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN missing in .env");
}

const bot = new Telegraf(BOT_TOKEN);

/* ================= HELPERS ================= */
async function getUser(userId, ref = null) {
  const res = await fetch(`${WEB_APP_URL}/api/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ref })
  });
  return res.json();
}

/* ================= /start ================= */
bot.start(async (ctx) => {
  const tgId = String(ctx.from.id);
  const ref = ctx.startPayload || null;

  const user = await getUser(tgId, ref);

  await ctx.reply(
    `🎁 *Lucky Box Game*\n\n` +
    `👤 ID: ${tgId}\n` +
    `💰 Balance: ${user.balance}\n` +
    `⚡ Energy: ${user.energy}\n` +
    `🪙 Tokens: ${user.tokens}\n\n` +
    `👇 Bude wasan nan:`,
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
});

/* ================= /balance ================= */
bot.command("balance", async (ctx) => {
  const tgId = String(ctx.from.id);
  const user = await getUser(tgId);

  ctx.reply(
    `📊 *Your Stats*\n\n` +
    `💰 Balance: ${user.balance}\n` +
    `⚡ Energy: ${user.energy}\n` +
    `🪙 Tokens: ${user.tokens}\n` +
    `👥 Referrals: ${user.referralsCount || 0}`,
    { parse_mode: "Markdown" }
  );
});

/* ================= /daily ================= */
bot.command("daily", async (ctx) => {
  const tgId = String(ctx.from.id);

  const res = await fetch(`${WEB_APP_URL}/api/daily`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: tgId })
  });

  const data = await res.json();

  if (data.error) {
    return ctx.reply("⏳ Ka dawo gobe domin Daily Bonus.");
  }

  ctx.reply(
    `🎉 *Daily Bonus Claimed!*\n\n` +
    `💰 +${data.reward} coins\n` +
    `⚡ Energy yanzu: ${data.energy}`,
    { parse_mode: "Markdown" }
  );
});

/* ================= REFERRAL ================= */
bot.action("REFERRAL", async (ctx) => {
  const tgId = String(ctx.from.id);
  const user = await getUser(tgId);

  const link = `https://t.me/${ctx.me}?start=${user.wallet}`;

  await ctx.reply(
    `👥 *Your Referral Link*\n\n${link}\n\n` +
    `Invites: ${user.referralsCount || 0}`,
    { parse_mode: "Markdown" }
  );
});

/* ================= ERROR HANDLER ================= */
bot.catch((err) => {
  console.error("❌ BOT ERROR:", err);
});

/* ================= START BOT ================= */
bot.launch().then(() => {
  console.log("🤖 Telegram bot running...");
});

/* ================= GRACEFUL STOP ================= */
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

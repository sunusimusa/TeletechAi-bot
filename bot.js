bot.start(async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const userId = ctx.startPayload || null;

    // idan ba a bude daga app ba
    if (!userId) {
      return ctx.reply(
        "❌ Please open this bot from the app to link your account."
      );
    }

    // 🔗 link telegram ↔ app user
    await fetch(`${WEB_APP_URL}/api/telegram/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, telegramId })
    });

    // 📥 load user data
    const res = await fetch(`${WEB_APP_URL}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const user = await res.json();
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
    console.error("BOT START ERROR:", err);
    ctx.reply("❌ Bot error occurred.");
  }
});

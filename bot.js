bot.start(async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const userId = ctx.startPayload || null;

    if (!userId) {
      return ctx.reply(
        "❌ Open this bot from the app to link your account."
      );
    }

    // 🔗 LINK ACCOUNT
    await fetch(`${WEB_APP_URL}/api/telegram/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, telegramId })
    });

    // 📥 LOAD USER
    const res = await fetch(`${WEB_APP_URL}/api/user/by-telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId })
    });

    const user = await res.json();
    if (user.error) {
      return ctx.reply("❌ Account linking failed.");
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
            ]
          ]
        }
      }
    );
  } catch (e) {
    console.error(e);
    ctx.reply("❌ Bot error.");
  }
});

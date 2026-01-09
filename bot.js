bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const ref = match && match[1] ? match[1] : null;

  let text =
`🔥 TeleTech AI

Earn coins by tapping, completing tasks & inviting friends.

🎁 Daily rewards
👥 Referral bonuses
⚡ Fast gameplay

👇 Tap the button below to start`;

  bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Open App",
            web_app: {
              url: ref
                ? `https://teletechai.onrender.com/?ref=${ref}`
                : `https://teletechai.onrender.com`
            }
          }
        ]
      ]
    }
  });
});

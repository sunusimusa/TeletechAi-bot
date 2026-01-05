const REF_SEASON = {
  name: "Season 1",
  start: new Date("2026-01-01"),
  end: new Date("2026-01-14")
};

router.get("/leaderboard", async (req, res) => {
  const top = await User.find()
    .sort({ referralsCount: -1 })
    .limit(10)
    .select("telegramId referralsCount");

  res.json({
    season: REF_SEASON.name,
    start: REF_SEASON.start,
    end: REF_SEASON.end,
    top
  });
});

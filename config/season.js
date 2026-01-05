export const REF_SEASON = {
  name: "Season 1",
  start: new Date("2026-01-01"),
  end: new Date("2026-01-14"),
  paid: false, // ❗ ko an biya rewards ko a'a

  rewards: {
    1: 1000, // 🥇 1st place
    2: 500,  // 🥈 2nd
    3: 250,  // 🥉 3rd
    rest: 50 // top 4–10
  }
};

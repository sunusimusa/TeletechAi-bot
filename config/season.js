export const REF_SEASON = {
  name: "Season 1",
  start: new Date("2026-01-01"),
  end: new Date("2026-01-14"),
  paid: false // ❗ very important
};

export const REF_REWARDS = {
  1: 500,   // 🥇
  2: 300,   // 🥈
  3: 200,   // 🥉
  rest: 50  // top 4–10
};

export const REF_SEASON = {
  name: "Season 1",
  start: new Date("2026-01-01"),
  end: new Date("2026-01-14"),
  rewards: {
    1: 1000, // 🥇 1st place
    2: 500,  // 🥈 2nd
    3: 250   // 🥉 3rd
  }
};

// Everything a person would want to edit lives here. The generator reads it; nothing else needs changing.

export const PROFILE = {
  login: 'muthokaricky-alt',
  name: 'Kyalo Rick Muthoka',
  title: 'Full-Stack Developer · CS @ Strathmore',
  pitch: 'I build and ship full-stack products: React, Node, Python.',
  location: 'Nairobi · Mombasa, Kenya',
  status: 'Open to SWE internships (remote / Nairobi / Mombasa)',
  stack: 'TypeScript · React · Node/Express · Python · SQL',
  // Shown in the terminal card. Leave as the placeholder to show the GitHub URL instead.
  email: 'muthokaricky@gmail.com',
};

// Featured projects, in display order. `repo` is the GitHub repo name under PROFILE.login.
// Stars and "updated Xd ago" are fetched live; everything else is written here by hand.
export const FEATURED = [
  {
    repo: 'xGenius',
    name: 'xGenius',
    icon: 'ball',
    kind: 'Football forecasts',
    desc: 'Elo + Dixon-Coles models predict PL, UCL and top-club matches, backtested on 32k games.',
    highlight: '53.1% accuracy · log loss 0.970 vs 1.074 base',
    stack: ['Python', 'React', 'Vite', 'GitHub Actions', 'Cloudflare'],
    demo: 'https://xgenius.pages.dev',
  },
  {
    repo: 'AniTrack',
    name: 'AniTrack',
    icon: 'play',
    kind: 'Anime & manga tracker',
    desc: 'Recommendations, taste match, Ctrl+K command palette and shareable profile cards.',
    highlight: '171 tests · Neon Postgres · Render API',
    stack: ['React', 'Express', 'PostgreSQL', 'GraphQL'],
    demo: 'https://anitrack.muthokaricky.workers.dev/',
  },
  {
    repo: 'Touchline',
    name: 'Touchline',
    icon: 'pitch',
    kind: 'Football management sim',
    desc: 'Cross-platform football manager: match engine, transfers, competitions, career mode.',
    highlight: '10 / 10 roadmap milestones built',
    stack: ['Expo', 'React Native', 'TypeScript', 'Zustand', 'SQLite', 'Zod'],
    demo: 'https://touchline.muthokaricky.workers.dev',
  },
  {
    repo: 'CampusSeat',
    name: 'CampusSeat',
    icon: 'seat',
    kind: 'Team project · Group 4',
    desc: 'Event seat booking with row-locked transactions, waitlists and offline tickets.',
    highlight: 'My part: documentation lead + live demo',
    stack: ['React', 'Express', 'MySQL', 'Docker'],
    demo: 'https://campusseat.onrender.com/',
  },
  {
    repo: 'SkillBridge',
    name: 'SkillBridge',
    icon: 'bridge',
    kind: 'Team project · 3-team API ring',
    desc: 'Students swap skills or pay in Skill Coins; one of three apps in a shared API ring.',
    highlight: 'My part: API lead · serves one team, consumes another',
    stack: ['React', 'Express', 'SQLite', 'OpenAPI'],
    demo: null,
  },
];

// Named on the "more" card. Keep it to repos that have a README and real code.
export const MORE = ['QR-Studio', 'Schedulix-', 'NexusLS', 'budget-tracker', 'MyBlock', 'TicTacToe'];

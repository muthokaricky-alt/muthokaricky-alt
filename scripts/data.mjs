// Fetches everything the cards need and returns one plain object.
// With a token: one GitHub GraphQL query. Without one (local runs): public REST + the public contributions page.

const API = 'https://api.github.com';
const UA = { 'User-Agent': 'profile-readme-generator' };

async function getJSON(url, token, extraHeaders = {}) {
  const res = await fetch(url, {
    headers: { ...UA, Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    createdAt
    followers { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      nodes {
        name description isFork isArchived stargazerCount pushedAt createdAt homepageUrl diskUsage
        primaryLanguage { name color }
        languages(first: 20, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }
        stargazers(first: 100) { edges { starredAt } }
      }
    }
  }
}`;

async function viaGraphQL(login, token) {
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { ...UA, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors || json).slice(0, 400)}`);
  const u = json.data.user;
  const cc = u.contributionsCollection;
  return {
    source: 'graphql',
    createdAt: u.createdAt,
    followers: u.followers.totalCount,
    publicRepos: u.repositories.totalCount,
    days: cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount })),
    totalContributions: cc.contributionCalendar.totalContributions,
    breakdown: {
      commits: cc.totalCommitContributions,
      prs: cc.totalPullRequestContributions + cc.totalPullRequestReviewContributions,
      issues: cc.totalIssueContributions,
    },
    repos: u.repositories.nodes.map((r) => ({
      name: r.name,
      description: r.description,
      fork: r.isFork,
      archived: r.isArchived,
      stars: r.stargazerCount,
      pushedAt: r.pushedAt,
      createdAt: r.createdAt,
      homepage: r.homepageUrl,
      empty: r.diskUsage === 0,
      languages: Object.fromEntries(r.languages.edges.map((e) => [e.node.name, e.size])),
      starredAt: r.stargazers.edges.map((e) => e.starredAt),
    })),
  };
}

// Public contributions page: one <td data-date data-level> per day, with the count in a matching <tool-tip>.
async function scrapeContributions(login) {
  const res = await fetch(`https://github.com/users/${login}/contributions`, { headers: UA });
  if (!res.ok) throw new Error(`contributions page: ${res.status}`);
  const html = await res.text();
  const tips = {};
  for (const m of html.matchAll(/for="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)<\/tool-tip>/g)) tips[m[1]] = m[2];
  const days = [];
  for (const m of html.matchAll(/data-date="([\d-]+)" id="(contribution-day-component-[\d-]+)"/g)) {
    const n = /^(\d[\d,]*) contribution/.exec(tips[m[2]] || '');
    days.push({ date: m[1], count: n ? Number(n[1].replace(/,/g, '')) : 0 });
  }
  if (!days.length) throw new Error('contributions page: no days found (markup changed?)');
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

async function viaREST(login, token) {
  const user = await getJSON(`${API}/users/${login}`, token);
  const list = await getJSON(`${API}/users/${login}/repos?per_page=100&type=owner`, token);
  const repos = [];
  for (const r of list) {
    const own = !r.fork && r.size > 0;
    const languages = own ? await getJSON(`${API}/repos/${login}/${r.name}/languages`, token) : {};
    // Star timestamps need a token on REST; without one they're unknown (null) and the history file is used instead.
    const starredAt = !token
      ? null
      : !own || r.stargazers_count === 0
        ? []
        : (await getJSON(`${API}/repos/${login}/${r.name}/stargazers?per_page=100`, token, { Accept: 'application/vnd.github.star+json' })).map((s) => s.starred_at);
    repos.push({
      name: r.name,
      description: r.description,
      fork: r.fork,
      archived: r.archived,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
      createdAt: r.created_at,
      homepage: r.homepage,
      empty: r.size === 0,
      languages,
      starredAt,
    });
  }
  const days = await scrapeContributions(login);
  return {
    source: 'rest',
    createdAt: user.created_at,
    followers: user.followers,
    publicRepos: user.public_repos,
    days,
    totalContributions: days.reduce((s, d) => s + d.count, 0),
    breakdown: null, // GraphQL only
    repos,
  };
}

export async function fetchData(login, token) {
  if (!token) return viaREST(login, '');
  try {
    return await viaGraphQL(login, token);
  } catch (err) {
    // e.g. a token without access to some field: still produce cards from REST rather than fail the run
    console.warn(`GraphQL failed, falling back to REST: ${err.message}`);
    return viaREST(login, token);
  }
}

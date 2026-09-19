// The whole dashboard: a hash router with two views (the match list, and one
// match's live detail), fed by STOMP-over-SockJS with a polling fallback so
// the page still updates if a proxy in between blocks WebSocket upgrades.

const API = '/api/matches';
const WS_ENDPOINT = '/ws';
const POLL_MS = 3000;

const app = document.getElementById('app');
const connDot = document.getElementById('conn-dot');
const connLabel = document.getElementById('conn-label');

let stompClient = null;
let listSubscription = null;
let matchSubscription = null;
let pollTimer = null;
let latestSummaries = [];

/* ------------------------------------------------------------ connection */

function setConnectionState(state) {
  // state: 'live' | 'connecting' | 'polling'
  connDot.className = 'conn-dot conn-' + state;
  connLabel.textContent = state === 'live' ? 'Live'
    : state === 'polling' ? 'Polling (no socket)'
    : 'Connecting…';
}

function connect() {
  setConnectionState('connecting');

  const socket = new SockJS(WS_ENDPOINT);
  stompClient = new StompJs.Client({
    webSocketFactory: () => socket,
    reconnectDelay: 3000,
    onConnect: () => {
      stopPolling();
      setConnectionState('live');
      resubscribeForCurrentRoute();
    },
    onWebSocketClose: () => {
      setConnectionState('connecting');
      startPolling();
    },
    onStompError: () => startPolling()
  });
  stompClient.activate();

  // If the socket has not connected within a few seconds, poll meanwhile;
  // the moment it does connect, onConnect() above cancels the poll.
  setTimeout(() => {
    if (!stompClient.connected) startPolling();
  }, 2500);
}

function startPolling() {
  if (pollTimer) return;
  setConnectionState((stompClient && stompClient.connected) ? 'live' : 'polling');
  pollTimer = setInterval(() => refreshCurrentRoute(), POLL_MS);
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

/* ------------------------------------------------------------- fetching */

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  return response.json();
}

function refreshCurrentRoute() {
  const route = parseRoute();
  if (route.name === 'list') {
    fetchJson(API).then(renderList).catch(showError);
  } else {
    fetchJson(API + '/' + route.id).then(renderDetail).catch(showError);
  }
}

/* --------------------------------------------------------------- router */

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const match = hash.match(/^\/match\/(.+)$/);
  return match ? { name: 'detail', id: match[1] } : { name: 'list' };
}

function resubscribeForCurrentRoute() {
  if (matchSubscription) { matchSubscription.unsubscribe(); matchSubscription = null; }

  const route = parseRoute();

  if (!listSubscription) {
    listSubscription = stompClient.subscribe('/topic/matches', (frame) => {
      latestSummaries = JSON.parse(frame.body);
      if (parseRoute().name === 'list') renderList(latestSummaries);
    });
  }

  if (route.name === 'detail') {
    matchSubscription = stompClient.subscribe('/topic/matches/' + route.id, (frame) => {
      renderDetail(JSON.parse(frame.body));
    });
  }

  // The topic only pushes on the next tick; fetch once immediately so the
  // page is not blank until then.
  refreshCurrentRoute();
}

window.addEventListener('hashchange', () => {
  render(); // switch view immediately using whatever we already have
  if (stompClient && stompClient.connected) resubscribeForCurrentRoute();
  else refreshCurrentRoute();
});

/* --------------------------------------------------------------- render */

function render() {
  const route = parseRoute();
  if (route.name === 'list') {
    renderList(latestSummaries.length ? latestSummaries : []);
    if (!latestSummaries.length) refreshCurrentRoute();
  } else {
    app.innerHTML = '<p class="loading">Loading match…</p>';
    refreshCurrentRoute();
  }
}

function showError(error) {
  app.innerHTML = '<p class="alert alert-error">' + escapeHtml(error.message) +
    '. Is the Spring Boot application running?</p>';
}

const STATUS_LABEL = {
  SCHEDULED: 'Starting soon',
  LIVE: 'Live',
  INNINGS_BREAK: 'Innings break',
  COMPLETED: 'Completed'
};

function renderList(summaries) {
  latestSummaries = summaries;
  if (parseRoute().name !== 'list') return;

  if (!summaries.length) {
    app.innerHTML = '<p class="loading">No matches yet.</p>';
    return;
  }

  const cards = summaries.map((match) => `
    <a class="match-card status-${match.status.toLowerCase()}" href="#/match/${match.id}">
      <div class="match-card-status">
        <span class="badge badge-${match.status.toLowerCase()}">${STATUS_LABEL[match.status]}</span>
        <span class="match-overs">${match.oversLimit}-over match</span>
      </div>
      <div class="match-teams">
        <span>${escapeHtml(match.teamA.shortName)}</span>
        <span class="vs">vs</span>
        <span>${escapeHtml(match.teamB.shortName)}</span>
      </div>
      <p class="match-venue">${escapeHtml(match.venue)}</p>
      <p class="match-score">${match.scoreLine ? escapeHtml(match.scoreLine) : '&nbsp;'}</p>
      ${match.resultSummary
        ? `<p class="match-result">${escapeHtml(match.resultSummary)}</p>`
        : '<p class="match-cta">View live scorecard →</p>'}
    </a>
  `).join('');

  app.innerHTML = `<section class="match-grid">${cards}</section>`;
}

function renderDetail(detail) {
  if (parseRoute().name !== 'detail' || parseRoute().id !== detail.id) return;

  const isComplete = detail.status === 'COMPLETED';
  const innings = detail.innings;
  const current = innings.length ? innings[innings.length - 1] : null;

  const header = `
    <a class="back-link" href="#/">← All matches</a>
    <div class="detail-head">
      <div>
        <h1>${escapeHtml(detail.teamA.shortName)} vs ${escapeHtml(detail.teamB.shortName)}</h1>
        <p class="detail-sub">${escapeHtml(detail.venue)} · ${detail.oversLimit}-over match</p>
      </div>
      <span class="badge badge-${detail.status.toLowerCase()}">${STATUS_LABEL[detail.status]}</span>
    </div>
  `;

  const resultBanner = isComplete
    ? `<p class="alert alert-result">${escapeHtml(detail.resultSummary)}</p>` : '';

  const scoreboard = current ? renderScoreboard(current, isComplete) : '<p class="loading">Match is about to begin…</p>';
  const inningsSections = innings.map((card, i) => renderInningsCard(card, i, innings.length)).join('');

  app.innerHTML = header + resultBanner + scoreboard + inningsSections;
}

function renderScoreboard(card, isComplete) {
  const chaseLine = card.target != null
    ? `<p class="chase-line">Target ${card.target + 1} · needs ${card.runsNeeded} more</p>`
    : '';

  const liveBlock = (!isComplete && card.striker) ? `
    <div class="live-players">
      <div class="live-player">
        <span class="live-role">On strike</span>
        <span class="live-name">${escapeHtml(card.striker.name)}*</span>
        <span class="live-figures">${card.striker.runsScored} (${card.striker.ballsFaced}) · SR ${card.striker.strikeRate.toFixed(1)}</span>
      </div>
      <div class="live-player">
        <span class="live-role">Non-striker</span>
        <span class="live-name">${escapeHtml(card.nonStriker.name)}</span>
        <span class="live-figures">${card.nonStriker.runsScored} (${card.nonStriker.ballsFaced}) · SR ${card.nonStriker.strikeRate.toFixed(1)}</span>
      </div>
      <div class="live-player">
        <span class="live-role">Bowling</span>
        <span class="live-name">${escapeHtml(card.currentBowler.name)}</span>
        <span class="live-figures">${card.currentBowler.oversBowled}-${card.currentBowler.runsConceded}-${card.currentBowler.wicketsTaken} · Econ ${card.currentBowler.economyRate.toFixed(1)}</span>
      </div>
    </div>` : '';

  const ticker = card.recentBalls.map((ball) => `
    <span class="ball-chip ball-${ballChipClass(ball)}" title="${escapeHtml(ball.commentary)}">
      ${escapeHtml(ball.shortLabel)}
    </span>
  `).join('');

  return `
    <section class="scoreboard">
      <div class="score-main">
        <span class="score-team">${escapeHtml(card.battingTeam.shortName)}</span>
        <span class="score-runs">${card.totalRuns}/${card.wickets}</span>
        <span class="score-overs">(${card.oversLabel} ov)</span>
      </div>
      <p class="score-rate">Run rate ${card.runRate.toFixed(2)}
        · Extras ${card.wideRuns + card.noBallRuns + card.byeRuns + card.legByeRuns}</p>
      ${chaseLine}
      ${liveBlock}
      <div class="ticker">
        <span class="ticker-label">This over &amp; last</span>
        <div class="ticker-balls">${ticker || '<span class="ticker-empty">No deliveries yet</span>'}</div>
      </div>
    </section>
  `;
}

function ballChipClass(ball) {
  if (ball.wicket) return 'wicket';
  if (ball.runs === 4) return 'four';
  if (ball.runs === 6) return 'six';
  if (ball.extraType !== 'NONE') return 'extra';
  return 'plain';
}

function renderInningsCard(card, index, total) {
  const title = total > 1
    ? `Innings ${index + 1} · ${escapeHtml(card.battingTeam.name)}`
    : `${escapeHtml(card.battingTeam.name)} innings`;

  const battingRows = card.battingCard.map((p) => `
    <tr class="${p.onStrike ? 'is-striking' : ''}">
      <td>${escapeHtml(p.name)}${p.onStrike ? ' *' : ''}</td>
      <td>${dismissalLabel(p)}</td>
      <td>${p.runsScored}</td>
      <td>${p.ballsFaced}</td>
      <td>${p.fours}</td>
      <td>${p.sixes}</td>
      <td>${p.strikeRate.toFixed(1)}</td>
    </tr>
  `).join('');

  const bowlingRows = card.bowlingCard.map((p) => `
    <tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.oversBowled}</td>
      <td>${p.runsConceded}</td>
      <td>${p.wicketsTaken}</td>
      <td>${p.economyRate.toFixed(1)}</td>
    </tr>
  `).join('');

  const fow = card.fallOfWickets.length
    ? `<p class="fow"><strong>Fall of wickets:</strong> ${card.fallOfWickets.map(escapeHtml).join(', ')}</p>`
    : '';

  return `
    <section class="innings-card">
      <h2>${title}</h2>
      <div class="table-wrap">
        <table class="score-table">
          <thead><tr><th>Batter</th><th>Status</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
          <tbody>${battingRows}</tbody>
        </table>
      </div>
      ${fow}
      <div class="table-wrap">
        <table class="score-table">
          <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
          <tbody>${bowlingRows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function dismissalLabel(player) {
  if (!player.out) return 'not out';
  const type = player.dismissalType.replace('_', ' ').toLowerCase();
  return type + (player.dismissedBy ? ' b ' + escapeHtml(player.dismissedBy) : '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------------------------------------------------------------- start */

render();
connect();

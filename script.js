const TEAM_ID = 8;
const TEAM_NAME = "Canadiens de Montréal";
const gamesList = document.getElementById("games-list");
const statusText = document.getElementById("status");
const refreshBtn = document.getElementById("refresh-btn");
const streamSelect = document.getElementById("stream-select");
const openStreamBtn = document.getElementById("open-stream-btn");
const castBtn = document.getElementById("cast-btn");
const appleTvBtn = document.getElementById("apple-tv-btn");
const streamFrame = document.getElementById("stream-frame");
const streamMessage = document.getElementById("stream-message");
const ALLOWED_STREAM_PREFIXES = [
  "https://www.rds.ca/hockey/canadiens",
  "https://www.tvasports.ca/hockey/lnh/canadiens",
  "https://www.nhl.com/fr/canadiens",
];

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }
  return date.toLocaleString("fr-CA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toReadableStatus(game) {
  const raw =
    game?.status?.detailedState ||
    game?.gameState ||
    game?.gameScheduleState ||
    "À venir";
  return String(raw).replaceAll("_", " ");
}

function normalizeFromStatsApi(payload) {
  const dates = Array.isArray(payload?.dates) ? payload.dates : [];
  const games = [];
  for (const dateEntry of dates) {
    for (const game of dateEntry.games || []) {
      games.push({
        id: game.gamePk,
        startTime:
          game.gameDate ||
          dateEntry.date ||
          game.startTimeUTC ||
          game.startTime,
        home: game?.teams?.home?.team?.name || game?.homeTeam?.name?.default || "Domicile",
        away: game?.teams?.away?.team?.name || game?.awayTeam?.name?.default || "Visiteur",
        status: toReadableStatus(game),
      });
    }
  }
  return games;
}

function normalizeFromNhlWebApi(payload) {
  const source = Array.isArray(payload?.games)
    ? payload.games
    : Array.isArray(payload?.gameWeek)
      ? payload.gameWeek.flatMap((w) => w.games || [])
      : [];

  return source.map((game) => ({
    id: game.id || game.gamePk,
    startTime: game.startTimeUTC || game.gameDate || game.startTime,
    home: game?.homeTeam?.name?.default || game?.teams?.home?.team?.name || "Domicile",
    away: game?.awayTeam?.name?.default || game?.teams?.away?.team?.name || "Visiteur",
    status: toReadableStatus(game),
  }));
}

function renderGames(games) {
  gamesList.innerHTML = "";

  if (!games.length) {
    statusText.textContent = `Aucun match trouvé pour ${TEAM_NAME}.`;
    return;
  }

  statusText.textContent = `${games.length} match(s) trouvé(s) pour ${TEAM_NAME}.`;
  for (const game of games) {
    const li = document.createElement("li");
    li.textContent = `${formatDate(game.startTime)} — ${game.away} vs ${game.home} (${game.status})`;
    gamesList.appendChild(li);
  }
}

async function fetchGames() {
  statusText.textContent = "Chargement des matchs…";

  const endpoints = [
    "https://api-web.nhle.com/v1/club-schedule-season/mtl/now",
    `https://statsapi.web.nhl.com/api/v1/schedule?teamId=${TEAM_ID}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        continue;
      }
      const payload = await response.json();
      const normalized = endpoint.includes("statsapi")
        ? normalizeFromStatsApi(payload)
        : normalizeFromNhlWebApi(payload);
      if (normalized.length) {
        renderGames(normalized);
        return;
      }
    } catch (error) {
      console.debug("Erreur endpoint NHL ignorée:", error);
    }
  }

  gamesList.innerHTML = "";
  statusText.textContent = "Impossible de charger les matchs pour le moment.";
}

function updateStream(url) {
  const safeUrl = getValidatedStreamUrl(url);
  if (!safeUrl) {
    streamMessage.textContent = "Source de stream invalide.";
    return null;
  }

  streamFrame.src = safeUrl;
  streamMessage.textContent =
    "Si la vidéo ne charge pas ici, utilise le même lien dans un nouvel onglet.";
  return safeUrl;
}

function getValidatedStreamUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const normalized = parsed.toString();
    const isAllowed = ALLOWED_STREAM_PREFIXES.some((prefix) => normalized.startsWith(prefix));
    return isAllowed ? normalized : null;
  } catch (_) {
    return null;
  }
}

function openStream() {
  const safeUrl = updateStream(streamSelect.value);
  if (!safeUrl) {
    return;
  }
  window.open(safeUrl, "_blank", "noopener,noreferrer");
}

function castToGoogle() {
  const safeUrl = getValidatedStreamUrl(streamSelect.value);
  if (!safeUrl) {
    streamMessage.textContent = "Source de stream invalide pour Google Cast.";
    return;
  }
  streamMessage.textContent =
    "Google Cast: ouvre la source dans Chrome puis utilise le bouton Cast de ton navigateur/appareil.";
  window.open(safeUrl, "_blank", "noopener,noreferrer");
}

function castToAppleTv() {
  const safeUrl = getValidatedStreamUrl(streamSelect.value);
  if (!safeUrl) {
    streamMessage.textContent = "Source de stream invalide pour Apple TV.";
    return;
  }
  streamMessage.textContent =
    "Apple TV: ouvre la source puis utilise AirPlay depuis Safari ou l’app vidéo.";
  window.open(safeUrl, "_blank", "noopener,noreferrer");
}

refreshBtn.addEventListener("click", fetchGames);
openStreamBtn.addEventListener("click", openStream);
castBtn.addEventListener("click", castToGoogle);
appleTvBtn.addEventListener("click", castToAppleTv);

fetchGames();

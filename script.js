// --- CONFIGURATION CHROMECAST ---
window.__onGCastApiAvailable = function(isAvailable) {
    if (isAvailable) {
        initializeCastApi();
    }
};

function initializeCastApi() {
    cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });
}

// --- LOGIQUE DE L'INTERFACE ---
document.addEventListener('DOMContentLoaded', () => {
    const streamSelect = document.getElementById('stream-select');
    const openBtn = document.getElementById('open-stream-btn');
    const iframe = document.getElementById('stream-frame');
    const videoContainer = document.getElementById('video-container');
    const gameInfo = document.getElementById('game-info');
    const status = document.getElementById('status');

    // Gestion du stream
    openBtn.addEventListener('click', () => {
        const choice = streamSelect.value;
        if (choice === "iframe-source") {
            videoContainer.style.display = "block";
            iframe.src = "https://onhockey.tv/np_stream400.php?channel=//dlstreams.com/stream/stream-833.php";
        } else {
            videoContainer.style.display = "none";
            window.open(choice, '_blank');
        }
    });

    // Récupération des scores (NHL API)
    async function fetchNHLData() {
        try {
            const response = await fetch('https://api-web.nhle.com/v1/score/now');
            const data = await response.json();
            
            // Chercher le match de Montréal (MTL)
            const match = data.games.find(g => g.homeTeam.abbrev === 'MTL' || g.awayTeam.abbrev === 'MTL');

            if (match) {
                status.style.display = "none";
                gameInfo.innerHTML = `
                    <div class="score-card">
                        <span>${match.awayTeam.abbrev} <strong>${match.awayTeam.score ?? 0}</strong></span>
                        <span> vs </span>
                        <span><strong>${match.homeTeam.score ?? 0}</strong> ${match.homeTeam.abbrev}</span>
                        <p><small>Période: ${match.periodDescriptor.number} | Statut: ${match.gameState}</small></p>
                    </div>
                `;
            } else {
                status.innerText = "Pas de match des Canadiens aujourd'hui.";
            }
        } catch (error) {
            status.innerText = "Erreur de chargement des scores.";
        }
    }

    document.getElementById('refresh-btn').addEventListener('click', fetchNHLData);
    fetchNHLData();
});

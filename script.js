document.addEventListener('DOMContentLoaded', () => {
    const streamSelect = document.getElementById('stream-select');
    const openBtn = document.getElementById('open-stream-btn');
    const iframe = document.getElementById('stream-frame');
    const videoContainer = document.getElementById('video-container');

    openBtn.addEventListener('click', () => {
        const choice = streamSelect.value;

        if (choice === "iframe-source") {
            // Exemple de chargement d'un flux compatible iframe
            videoContainer.style.display = "block";
            iframe.src = "https://onhockey.tv/np_stream400.php?channel=//dlstreams.com/stream/stream-833.php";
        } else {
            // Pour RDS, TVA, CBC : Ouverture dans un nouvel onglet
            videoContainer.style.display = "none";
            window.open(choice, '_blank');
        }
    });

    // Logique pour l'API NHL (Scores)
    const refreshBtn = document.getElementById('refresh-btn');
    const status = document.getElementById('status');
    const gamesList = document.getElementById('games-list');

    async function fetchScores() {
        status.innerText = "Mise à jour...";
        try {
            // Note: Utilisation de l'API NHL v1 pour les Canadiens (ID: 8)
            const response = await fetch('https://api-web.nhle.com/v1/score/now');
            const data = await response.json();
            
            // Filtrer pour trouver le match des Canadiens
            const habsGame = data.games.find(g => g.homeTeam.abbrev === 'MTL' || g.awayTeam.abbrev === 'MTL');

            if (habsGame) {
                gamesList.innerHTML = `
                    <li>
                        <strong>${habsGame.awayTeam.abbrev} ${habsGame.awayTeam.score ?? 0}</strong> vs 
                        <strong>${habsGame.homeTeam.abbrev} ${habsGame.homeTeam.score ?? 0}</strong>
                        <br><small>Statut: ${habsGame.gameState}</small>
                    </li>`;
                status.innerText = "À jour";
            } else {
                status.innerText = "Aucun match des Canadiens aujourd'hui.";
            }
        } catch (error) {
            status.innerText = "Erreur de connexion à l'API.";
            console.error(error);
        }
    }

    refreshBtn.addEventListener('click', fetchScores);
    fetchScores(); // Appel au chargement
});

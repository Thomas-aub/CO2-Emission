/*
 * Serveur Node.js 
 * Crée un serveur HTTP qui écoute sur le port 3000 ou PORT défini dans .env.
 * Utilisation d'Express pour gérer les requêtes et les réponses.
*/

const app = require('./app');

function startServer(port = process.env.PORT || 3000) {
  const server = app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
    console.log(`Accessible à : http://localhost:${port}`);
  });
  return server;
}

// Si ce fichier est exécuté directement (pas importé comme module)
if (require.main === module) {
  startServer();
}

module.exports = { startServer };

/*

  co2_emission/
  |
  ├── app.js                   # Point d'entrée principal
  ├── server.js                # Démarrage du serveur
  |
  ├── controllers/             # Logique métier des routes
  │   ├── emissionController.js
  │   └── geocodeController.js
  |
  ├── routes/                  # Définition des routes
  │   ├── emissionRoutes.js
  │   └── geocodeRoutes.js
  |
  ├── services/                # Services externes (API)
  │   ├── impactCo2Service.js
  │   └── geocodeService.js
  |
  ├── middlewares/             # Middlewares personnalisés
  │   └── errorHandler.js
  |
  ├── utils/                   # Utilitaires et fonctions d'aide
  │   └── logger.js
  |
  └─────

*/
# 🌱 Eco-Calculateur CO2

[![Quality Gate Status](https://sonar.info.univ-lyon1.fr/api/project_badges/measure?project=co2_emission_project&metric=alert_status&token=sqb_684655eb74e20d2001fdb435c4eb7c2948a4d48a)](https://sonar.info.univ-lyon1.fr/dashboard?id=co2_emission_project)

## 📋 Sommaire

- [Présentation du projet](#présentation-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies et ressources utilisées](#technologies-et-ressources-utilisées)
- [Installation et configuration](#installation-et-configuration)
- [Guide d'utilisation](#guide-dutilisation)
- [Documentation API](#documentation-api)
- [Procédure de build](#procédure-de-build)
- [Lien vers la VM de démo](#lien-vers-la-vm-de-démo)
- [Équipe de développement](#équipe-de-développement)
- [Licence et crédits](#licence-et-crédits)

## Présentation du projet

L'Eco-Calculateur CO2 est une application web permettant d'estimer les émissions de CO2 associées à différents modes de transport pour un trajet donné. L'objectif est de sensibiliser les utilisateurs à l'impact environnemental de leurs déplacements et de les aider à choisir des options de transport plus écologiques.

Ce projet a été développé dans le cadre du cours MIF10 (Master 1 Informatique) à l'Université Claude Bernard Lyon 1.

## Fonctionnalités

- 🗺️ **Géocodage** : Conversion d'adresses en coordonnées géographiques
- 📏 **Calcul de distance** : 
  - Distance à vol d'oiseau par formule de Haversine
  - Distance réelle via l'API Distance Matrix pour différents modes de transport
- 🌍 **Calcul d'émissions CO2** :
  - Émissions pour plusieurs modes de transport (voiture, train, bus, avion, vélo, etc.)
  - Prise en compte des spécificités de chaque mode (taux d'occupation, facteurs d'émission)
- 👤 **Gestion des utilisateurs** :
  - Création de compte et authentification
  - Sauvegarde des trajets favoris

## Architecture

Le projet est structuré selon une architecture MVC (Modèle-Vue-Contrôleur) avec une séparation claire des responsabilités :

```
co2_emission/
|
├── app.js                   # Point d'entrée principal
├── server.js                # Démarrage du serveur
|
├── controllers/             # Logique métier des routes
│   ├── emissionController.js
│   ├── geocodeController.js
│   └── travelImpactController.js
|
├── routes/                  # Définition des routes
│   ├── emissionRoutes.js
│   ├── geocodeRoutes.js
│   ├── distanceGpsRoutes.js
│   ├── distanceMatrixRoutes.js
│   ├── travelImpactRoutes.js
│   └── userRoutes.js
|
├── services/                # Services externes (API)
│   ├── impactCo2Service.js
│   ├── geocodeService.js
│   └── distanceMatrixService.js
|
├── models/                  # Modèles de données MongoDB
│   └── userModel.js
|
├── middlewares/             # Middlewares personnalisés
│   └── errorHandler.js
|
├── utils/                   # Utilitaires et fonctions d'aide
│   └── logger.js
|
└── config/                  # Configuration
    └── database.js
```

### Patrons de conception
- **Singleton** : Utilisé pour la connexion à la base de données et le logger
- **Facade** : Les services encapsulent les appels API complexes derrière des interfaces simples
- **Stratégie** : Différentes stratégies de calcul de distance selon le contexte
- **MVC** : Séparation claire entre routes, contrôleurs et services

## Technologies et ressources utilisées

### Back-end
- **Node.js** : Environnement d'exécution JavaScript côté serveur
- **Express** : Framework web pour Node.js
- **MongoDB** : Base de données NoSQL
- **Mongoose** : ODM (Object Data Modeling) pour MongoDB

### Sécurité et authentification
- **bcrypt** : Hachage sécurisé des mots de passe
- **jsonwebtoken** : Gestion des tokens JWT pour l'authentification
- **validator** : Validation des entrées utilisateur

### API externes
- **Impact CO2** : API de l'ADEME pour le calcul des émissions CO2 des transports
- **Distance Matrix AI** : API pour calculer les distances et durées des trajets

### Tests et qualité de code
- **Jest** : Framework de test JavaScript
- **Supertest** : Tests d'intégration pour les API Express
- **SonarQube** : Analyse statique du code

## Installation et configuration

### Prérequis
- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- MongoDB (v4 ou supérieur)

### Installation

1. Clonez le dépôt :
```bash
git clone https://forge.univ-lyon1.fr/mif10-grp7-2024/co2_emission.git
cd co2_emission
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à la racine du projet avec les variables suivantes :
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/eco_co2
JWT_SECRET=votre_secret_jwt
IMPACT_CO2_API_TOKEN=votre_token_api
DISTANCE_MATRIX_API_KEY=votre_clé_api
```

4. Démarrez le serveur :
```bash
npm start
```

Le serveur sera accessible à l'adresse http://localhost:3000.

## Guide d'utilisation

### Calcul d'impact CO2 pour un trajet

1. **Endpoint** : `GET /api/travel-impact`
2. **Paramètres** :
   - `origins` : Adresse ou coordonnées de départ (ex: "Paris, France" ou "48.8566,2.3522")
   - `destinations` : Adresse ou coordonnées d'arrivée (ex: "Lyon, France" ou "45.7578,4.8320")
3. **Exemple de requête** :
```
GET /api/travel-impact?origins=Paris&destinations=Lyon
```

4. **Réponse** : Liste des modes de transport disponibles avec leurs émissions CO2 respectives.

### Calcul d'impact CO2 pour un vol aérien

1. **Endpoint** : `GET /api/air-travel-impact`
2. **Paramètres** :
   - `origins` : Aéroport de départ (ex: "Paris, France")
   - `destinations` : Aéroport d'arrivée (ex: "New York, USA")
3. **Exemple de requête** :
```
GET /api/air-travel-impact?origins=Paris&destinations=New%20York
```

## Documentation API

### Endpoints principaux

| Endpoint | Méthode | Description | Paramètres |
|----------|---------|-------------|------------|
| `/api/geocode` | GET | Convertit une adresse en coordonnées | `address` |
| `/api/emissions` | GET | Calcule les émissions CO2 | `distance` |
| `/api/distance-gps` | GET | Calcule la distance à vol d'oiseau | `lat1`, `lon1`, `lat2`, `lon2` |
| `/api/distance-matrix` | GET | Calcule la distance réelle via l'API | `origins`, `destinations`, `mode` |
| `/api/travel-impact` | GET | Calcule l'impact CO2 pour tous les modes de transport | `origins`, `destinations` |
| `/api/air-travel-impact` | GET | Calcule l'impact CO2 pour un vol | `origins`, `destinations` |
| `/api/users/register` | POST | Crée un nouvel utilisateur | `email`, `password`, `name` |
| `/api/users/login` | POST | Authentifie un utilisateur | `email`, `password` |

### Documentation complète

Pour une documentation complète de l'API, y compris les exemples de requêtes et de réponses, veuillez consulter le fichier [`api.md`](api.md) dans le répertoire racine du projet.

## Procédure de build

### Build de développement
```bash
npm install
npm start
```

### Tests unitaires et d'intégration
```bash
npm test
```

### Tests avec couverture de code
```bash
npm run test:coverage
```

### Analyse SonarQube
```bash
npm run sonar
```

## Lien vers la VM de démo

L'application est accessible en ligne à l'adresse suivante :
[https://eco-calculateur-co2.univ-lyon1.fr](http://192.168.75.65/)

## Équipe de développement

- [NEDJAR Amine]
- [ERGHAI Abdelmounaim]
- [AUBOURG Thomas]'
- [FERREIRA Rémi]
- [TEKIN Emir]
- [TIDJANI Mounira]


## Licence et crédits

### Licence
Ce projet est sous licence ISC.

### Crédits
- API Impact CO2 : [ADEME](https://impactco2.fr/api)
- API Distance Matrix : [Distance Matrix AI](https://www.distancematrix.ai/)

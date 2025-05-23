# Documentation de l'API CO2 Emissions

Cette documentation présente les différentes routes disponibles dans l'API d'émissions de CO2, leurs paramètres et des exemples d'utilisation.

## Table des matières

1. [Géocodage](#1-géocodage)
2. [Calcul de distance GPS](#2-calcul-de-distance-gps)
3. [Distance Matrix](#3-distance-matrix)
4. [Émissions CO2](#4-émissions-co2)
5. [Impact des trajets](#5-impact-des-trajets)
6. [Impact des vols aériens](#6-impact-des-vols-aériens)
7. [Gestion des utilisateurs](#7-gestion-des-utilisateurs)

---

## 1. Géocodage

Convertit une adresse physique en coordonnées GPS (latitude/longitude).

### Endpoint

```
GET /api/geocode
```

### Paramètres

| Paramètre | Type   | Requis | Description               |
|-----------|--------|--------|---------------------------|
| address   | string | Oui    | Adresse à géocoder        |

### Exemple de requête

```
GET /api/geocode?address=Tour%20Eiffel,%20Paris
```

### Exemple de réponse

```json
{
  "address": "Tour Eiffel, 5, Avenue Anatole France, Quartier du Gros-Caillou, Paris 7e Arrondissement, Paris, France métropolitaine, 75007, France",
  "coordinates": {
    "lat": "48.8582599",
    "lon": "2.2945006"
  }
}
```

---

## 2. Calcul de distance GPS

Calcule la distance à vol d'oiseau entre deux points GPS.

### Endpoint

```
GET /api/distanceGps
```

### Paramètres

| Paramètre | Type   | Requis | Description               |
|-----------|--------|--------|---------------------------|
| lat1      | number | Oui    | Latitude du point 1       |
| lng1      | number | Oui    | Longitude du point 1      |
| lat2      | number | Oui    | Latitude du point 2       |
| lng2      | number | Oui    | Longitude du point 2      |

### Exemple de requête

```
GET /api/distanceGps?lat1=48.8582602&lng1=2.2944991&lat2=45.7578137&lng2=4.8320114
```

### Exemple de réponse

```json
{
  "distance": "394.23 km",
  "distanceKm": 394.226749990088,
  "distanceMiles": 244.961069868091,
  "points": {
    "origin": {
      "lat": 48.8582602,
      "lon": 2.2944991
    },
    "destination": {
      "lat": 45.7578137,
      "lon": 4.8320114
    }
  }
}
```

---

## 3. Distance Matrix

### 3.1 Calcul pour un mode de transport spécifique

Calcule la distance et la durée entre deux points pour un mode de transport spécifique.

#### Endpoint

```
GET /api/distance-matrix
```

#### Paramètres

| Paramètre    | Type   | Requis | Description                                                |
|--------------|--------|---------|------------------------------------------------------------|
| origins      | string | Oui     | Adresse ou coordonnées de départ                           |
| destinations | string | Oui     | Adresse ou coordonnées d'arrivée                           |
| mode         | string | Non     | Mode de transport (driving, walking, bicycling, transit)   |
| transitMode  | string | Non     | Mode de transit (bus, metro, train, tram, rail)            |

#### Exemple de requête

```
GET /api/distance-matrix?origins=Paris,France&destinations=Lyon,France&mode=driving
```

#### Exemple de réponse

```json
{
  "destination_addresses": [
    "Lyon, France"
  ],
  "origin_addresses": [
    "Paris, France"
  ],
  "rows": [
    {
      "elements": [
        {
          "distance": {
            "text": "464.6 km",
            "value": 464552
          },
          "duration": {
            "text": "4 hour 33 mins",
            "value": 16428
          },
          "origin": "Paris,France",
          "destination": "Lyon,France",
          "status": "OK"
        }
      ]
    }
  ],
  "status": "OK"
}
```

### 3.2 Calcul pour tous les modes de transport

Calcule la distance et la durée entre deux points pour tous les modes de transport disponibles.

#### Endpoint

```
GET /api/distance-matrix/all-modes
```

#### Paramètres

| Paramètre    | Type   | Requis | Description                                  |
|--------------|--------|--------|----------------------------------------------|
| origins      | string | Oui     | Adresse ou coordonnées de départ             |
| destinations | string | Oui     | Adresse ou coordonnées d'arrivée             |

#### Exemple de requête

```
GET /api/distance-matrix/all-modes?origins=Paris,France&destinations=Lyon,France
```

#### Exemple de réponse

```json
{
  "origin": "Paris,France",
  "destination": "Lyon,France",
  "origin_address": "Paris, France",
  "destination_address": "Lyon, France",
  "transport_modes": [
    {
      "mode": "driving",
      "name": "Voiture",
      "available": true,
      "distance": {
        "text": "464.6 km",
        "value": 464552
      },
      "duration": {
        "text": "4 hour 33 mins",
        "value": 16428
      },
      "origin_address": "Paris, France",
      "destination_address": "Lyon, France"
    },
    {
      "mode": "walking",
      "name": "Marche",
      "available": true,
      "distance": {
        "text": "440.9 km",
        "value": 440903
      },
      "duration": {
        "text": "4 day 4 hour 24 mins",
        "value": 361466
      },
      "origin_address": "Paris, France",
      "destination_address": "Lyon, France"
    },
    // ...autres modes de transport
  ]
}
```

---

## 4. Émissions CO2

Calcule les émissions de CO2 pour différents modes de transport sur une distance donnée.

### Endpoint

```
GET /api/emissions
```

### Paramètres

| Paramètre | Type   | Requis | Description               |
|-----------|--------|--------|---------------------------|
| distance  | number | Oui    | Distance en kilomètres    |

### Exemple de requête

```
GET /api/emissions?distance=100
```

### Exemple de réponse

```json
{
  "distance": 100,
  "emissions": [
    [
      {
        "id": 1,
        "name": "Avion court courrier",
        "value": 25.82
      },
      {
        "id": 2,
        "name": "TGV",
        "value": 0.23
      },
      {
        "id": 3,
        "name": "Intercités",
        "value": 0.58
      },
      {
        "id": 4,
        "name": "Voiture thermique",
        "value": 19.2
      },
      ...,
      {
        "id": 17,
        "name": "Trottinette à assistance électrique",
        "value": 0.2
      }
    ]
  ]
}
```

---

## 5. Impact des trajets

Calcule l'impact CO2 complet d'un trajet pour tous les modes de transport disponibles.

### Endpoint

```
GET /api/travel-impact
```

### Paramètres

| Paramètre    | Type   | Requis | Description                       |
|--------------|--------|--------|-----------------------------------|
| origins      | string | Oui    | Adresse ou coordonnées de départ  |
| destinations | string | Oui    | Adresse ou coordonnées d'arrivée  |

### Exemple de requête

```
GET /api/travel-impact?origins=Tour%20Eiffel,%20Paris&destinations=Place%20Bellecour,%20Lyon
```

```
GET /api/travel-impact?origins=48.8584,2.2945&destinations=45.7579,4.8320
```


### Exemple de réponse

```json
{
  "origin": "Paris,France",
  "destination": "Lyon,France",
  "origin_address": "Paris, France",
  "destination_address": "Lyon, France",
  "transport_modes": [
    {
      "mode": "transit_train",
      "name": "Train",
      "available": true,
      "distance": {
        "text": "427.1 km",
        "value": 427146
      },
      "duration": {
        "text": "1 hour 56 mins",
        "value": 6960
      },
      "origin_address": "Paris, France",
      "destination_address": "Lyon, France",
      "emissions": {
        "id": 2,
        "name": "TGV",
        "value": 0.9824358
      }
    },
    {
      "mode": "transit_tram",
      "name": "Tram",
      "available": true,
      "distance": {
        "text": "427.1 km",
        "value": 427146
      },
      "duration": {
        "text": "1 hour 56 mins",
        "value": 6960
      },
      "origin_address": "Paris, France",
      "destination_address": "Lyon, France",
      "emissions": {
        "id": 10,
        "name": "Tramway",
        "value": 1.6231548
      }
    },
    ...,
    {
      "origin_address": "Paris, France",
      "destination_address": "Lyon, France",
      "emissions": {
        "id": 7,
        "name": "Vélo mécanique",
        "value": 0
      }
    }
  ]
}
```

---

## 6. Impact des vols aériens

Calcule uniquement l'impact CO2 pour un vol aérien.

### Endpoint

```
GET /api/air-travel-impact
```

### Paramètres

| Paramètre    | Type   | Requis | Description                       |
|--------------|--------|--------|-----------------------------------|
| origins      | string | Oui    | Adresse ou coordonnées de départ  |
| destinations | string | Oui    | Adresse ou coordonnées d'arrivée  |

### Exemple de requête

```
GET /api/air-travel-impact?origins=Paris,France&destinations=New York,USA
```

```
GET /api/air-travel-impact?origins=43.6975,7.2738&destinations=41.9028,12.4964
```

### Exemple de réponse

```json
{
  "origin": "Paris,France",
  "destination": "New York,USA",
  "flight_type": "Long-courrier",
  "distance": {
    "km": 5813.86426578761,
    "miles": 3612.56665269671
  },
  "duration": {
    "hours": 8,
    "minutes": 1,
    "total_minutes": 481
  },
  "emissions": {
    "id": 13,
    "name": "Avion long-courrier",
    "value": 883.71,
    "unit": "kgCO2e",
    "estimated": true
  },
  "coordinates": {
    "origin": {
      "lat": 48.8588897,
      "lon": 2.320041
    },
    "destination": {
      "lat": 40.7269813,
      "lon": -73.7093369
    }
  },
  "calculation_method": "GPS straight-line distance"
}
```

---

## 7. Gestion des utilisateurs

Cette section détaille les routes permettant de gérer les utilisateurs et leurs trajets sauvegardés.

### 7.1 Inscription

Permet de créer un nouveau compte utilisateur.

#### Endpoint

```
POST /api/users/register
```

#### Paramètres

| Paramètre | Type   | Requis | Description            |
|-----------|--------|--------|------------------------|
| name      | string | Oui    | Nom de l'utilisateur   |
| email     | string | Oui    | Email de l'utilisateur |
| password  | string | Oui    | Mot de passe           |

#### Exemple de requête

```
POST /api/users/register
Content-Type: application/json

{
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "password": "motdepasse123"
}
```

#### Exemple de réponse

```json
{
  "message": "Utilisateur créé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f6e3a1b9b1c71234567890",
    "name": "Jean Dupont",
    "email": "jean@exemple.com",
    "role": "user"
  }
}
```

### 7.2 Connexion

Permet à un utilisateur de se connecter avec ses identifiants.

#### Endpoint

```
POST /api/users/login
```

#### Paramètres

| Paramètre | Type   | Requis | Description            |
|-----------|--------|--------|------------------------|
| email     | string | Oui    | Email de l'utilisateur |
| password  | string | Oui    | Mot de passe           |

#### Exemple de requête

```
POST /api/users/login
Content-Type: application/json

{
  "email": "jean@exemple.com",
  "password": "motdepasse123"
}
```

#### Exemple de réponse

```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60f6e3a1b9b1c71234567890",
    "name": "Jean Dupont",
    "email": "jean@exemple.com",
    "role": "user"
  }
}
```

### 7.3 Profil utilisateur

Récupère les informations du profil de l'utilisateur connecté.

#### Endpoint

```
GET /api/users/profile
```

#### Headers

| Header        | Value           | Description                  |
|---------------|-----------------|------------------------------|
| Authorization | Bearer \<token> | Token JWT d'authentification |

#### Exemple de réponse

```json
{
  "user": {
    "_id": "60f6e3a1b9b1c71234567890",
    "name": "Jean Dupont",
    "email": "jean@exemple.com",
    "role": "user",
    "savedJourneys": [...],
    "created": "2023-07-12T14:23:21.492Z",
    "updatedAt": "2023-07-12T14:23:21.492Z"
  }
}
```

### 7.4 Sauvegarde d'un trajet

Permet à un utilisateur de sauvegarder un trajet avec ses émissions CO2.

#### Endpoint

```
POST /api/users/journeys
```

#### Headers

| Header        | Value           | Description                  |
|---------------|-----------------|------------------------------|
| Authorization | Bearer \<token> | Token JWT d'authentification |

#### Paramètres

| Paramètre     | Type   | Requis | Description                |
|---------------|--------|--------|----------------------------|
| origin        | string | Oui    | Lieu de départ             |
| destination   | string | Oui    | Lieu d'arrivée             |
| transportMode | string | Oui    | Mode de transport utilisé  |
| distance      | number | Oui    | Distance en kilomètres     |
| emissions     | number | Oui    | Émissions de CO2 en kg     |

#### Exemple de requête

```
POST /api/users/journeys
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "origin": "Paris, France",
  "destination": "Lyon, France",
  "transportMode": "train",
  "distance": 427.1,
  "emissions": 0.98
}
```

#### Exemple de réponse

```json
{
  "message": "Trajet sauvegardé avec succès",
  "journey": {
    "_id": "60f6e3a1b9b1c71234567891",
    "origin": "Paris, France",
    "destination": "Lyon, France",
    "transportMode": "train",
    "distance": 427.1,
    "emissions": 0.98,
    "date": "2023-07-12T14:30:21.492Z"
  }
}
```

### 7.5 Récupération des trajets

Récupère tous les trajets sauvegardés par l'utilisateur.

#### Endpoint

```
GET /api/users/journeys
```

#### Headers

| Header        | Value           | Description                  |
|---------------|-----------------|------------------------------|
| Authorization | Bearer \<token> | Token JWT d'authentification |

#### Exemple de réponse

```json
{
  "journeys": [
    {
      "_id": "60f6e3a1b9b1c71234567891",
      "origin": "Paris, France",
      "destination": "Lyon, France",
      "transportMode": "train",
      "distance": 427.1,
      "emissions": 0.98,
      "date": "2023-07-12T14:30:21.492Z"
    },
    {
      "_id": "60f6e3a1b9b1c71234567892",
      "origin": "Paris, France",
      "destination": "Marseille, France",
      "transportMode": "airplane",
      "distance": 660.5,
      "emissions": 170.43,
      "date": "2023-07-13T09:15:10.123Z"
    }
  ]
}
```

### 7.6 Suppression d'un trajet

Supprime un trajet sauvegardé par l'utilisateur.

#### Endpoint

```
DELETE /api/users/journeys/:id
```

#### Headers

| Header        | Value           | Description                  |
|---------------|-----------------|------------------------------|
| Authorization | Bearer \<token> | Token JWT d'authentification |

#### Paramètres de chemin

| Paramètre | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | ID du trajet à supprimer  |

#### Exemple de requête

```
DELETE /api/users/journeys/60f6e3a1b9b1c71234567891
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Exemple de réponse

```json
{
  "message": "Trajet supprimé avec succès"
}
```

---

## Notes d'utilisation

1. **Formats d'entrée flexibles** : Pour les endpoints qui utilisent des adresses ou des coordonnées, vous pouvez fournir soit une adresse textuelle (comme "Paris, France"), soit des coordonnées GPS au format "latitude,longitude" (comme "48.8566,2.3522").

2. **Clé API** : L'API utilise deux services externes qui nécessitent des clés API :
   - L'API Impact CO2 (pour les calculs d'émissions)
   - L'API Distance Matrix (pour les calculs de distance et de durée)
   
   Assurez-vous que ces clés sont correctement configurées dans le fichier `.env`.

3. **Limitations de requêtes** : Les APIs externes utilisées ont des limites de taux. Consultez leur documentation pour plus d'informations.

4. **Types de transport** : L'API d'émissions CO2 prend en compte divers modes de transport, tels que voiture, TGV, métro, bus, vélo, marche, et différents types d'avions (court, moyen et long-courrier).

---

# Résumé des informations clés pour travailler avec l'API CO2 Emissions

## Principes fondamentaux

Cette API permet de calculer les émissions de CO2 pour différents types de transports entre deux points géographiques. Voici les éléments essentiels à connaître :

## Calcul des émissions pour les avions

- **Classification des vols** :
  - **Court-courrier** : < 1000 km (taux d'émission ~0,258 kg CO2e/km)
  - **Moyen-courrier** : 1000-3500 km (taux d'émission ~0,187 kg CO2e/km)
  - **Long-courrier** : > 3500 km (taux d'émission ~0,152 kg CO2e/km)

- **Estimation de la durée** : 
  - Vitesse moyenne considérée : 800 km/h
  - Temps additionnel forfaitaire : 45 minutes (embarquement/débarquement)
  - Formule : `Durée = (Distance/800) * 60 + 45` (en minutes)

## Formats d'entrée et conversion

- **Deux types d'entrées acceptés** :
  - Adresses textuelles (ex: "Paris, France") - converties en coordonnées via géocodage
  - Coordonnées GPS directes au format "latitude,longitude" (ex: "48.8566,2.3522")

- **Calcul des distances** :
  - Terrestres : utilisation de l'API Google Maps Distance Matrix
  - Aériennes : formule de Haversine (distance à vol d'oiseau)

## Modes de transport disponibles

L'API fournit des données d'émission pour 17 moyens de transport, identifiés par des IDs spécifiques :
- Vols aériens (ID 1)
- Trains (TGV ID 2, Intercités ID 3, TER ID 15...)
- Voitures (thermique ID 4, électrique ID 5)
- Transports en commun (bus ID 9, métro ID 11, tramway ID 10...)
- Mobilités douces (vélo ID 7, marche ID 30...)


## Cas d'utilisation

- Utilisez `/api/travel-impact` pour comparer tous les modes de transport disponibles entre deux points hors vol.
- Utilisez `/api/air-travel-impact` qui est optimisé pour les vols aériens.


Cette API combine des données issues de plusieurs sources (Google Maps, Impact CO2) pour fournir une vision complète et comparative de l'impact environnemental des différents modes de transport.

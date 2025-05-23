const createProxyAxios = require('../utils/proxyAxios');
const logger = require('../utils/logger');

const axios = createProxyAxios();
//const axios = require("axios");

const API_KEY = process.env.DISTANCE_MATRIX_API_KEY;

const TRANSPORT_MODES = [
  { mode: "driving", name: "Voiture", emissionId: 4 },
  { mode: "walking", name: "Marche", emissionId: 30 },
  { mode: "bicycling", name: "Vélo", emissionId: 7 },
  { mode: "transit_bus", name: "Bus", emissionId: 9 },
  { mode: "transit_train", name: "Train", emissionId: 2 },
  { mode: "transit_metro", name: "Métro", emissionId: 11 },
  { mode: "transit_tram", name: "Tram", emissionId: 10 },
];

/**
 * Calcule la distance et la durée entre deux points avec différents modes de transport
 * @param {string} origins - Adresse de départ ou coordonnées (lat,lng)
 * @param {string} destinations - Adresse d'arrivée ou coordonnées (lat,lng)
 * @param {string} mode - Mode de transport (driving, walking, bicycling, transit)
 * @param {string} transitMode - Mode de transit spécifique (bus, metro, train, tram, rail)
 * @returns {Promise<Object>} - Données de distance et de durée
 */
exports.getDistanceMatrix = async (
  origins,
  destinations,
  mode = "driving",
  transitMode = null
) => {
  try {
    const params = {
      origins,
      destinations,
      key: API_KEY,
      mode,
    };

    if (mode === "transit" && transitMode) {
      params.transit_mode = transitMode;
    }

    params.timestamp = new Date().getTime(); // Éviter la mise en cache

    const response = await axios.get(
      "https://api.distancematrix.ai/maps/api/distancematrix/json",
      {
        params,
      }
    );

    if (response.data.status !== "OK") {
      const error = new Error(
        `API Distance Matrix error: ${response.data.status}`
      );
      error.statusCode = 400;
      throw error;
    }

    return response.data;
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = error.response?.status || 500;
    }
    throw error;
  }
};

/**
 * Récupère les distances et durées pour tous les modes de transport disponibles
 * @param {string} origins - Adresse de départ ou coordonnées (lat,lng)
 * @param {string} destinations - Adresse d'arrivée ou coordonnées (lat,lng)
 * @returns {Promise<Object>} - Données de distance et de durée pour tous les modes
 */
exports.getAllTransportModes = async (origins, destinations) => {
  try {
    // Récupérer les données pour la voiture (mode driving)
    const drivingResponse = await this.getDistanceMatrix(
      origins,
      destinations,
      "driving"
    );

    // Récupérer les données des autres modes disponibles via l'API
    const walkingResponse = await this.getDistanceMatrix(
      origins,
      destinations,
      "walking"
    );
    const bicyclingResponse = await this.getDistanceMatrix(
      origins,
      destinations,
      "bicycling"
    );
    const busResponse = await this.getDistanceMatrix(
      origins,
      destinations,
      "transit",
      "bus"
    );
    const trainResponse = await this.getDistanceMatrix(
      origins,
      destinations,
      "transit",
      "train"
    );
    const tramResponse = await this.getDistanceMatrix(
      origins,
      destinations,
      "transit",
      "tram"
    );
    const metroResponse = await this.getDistanceMatrix(
      origins,
      destinations,
      "transit",
      "subway"
    );

    // Extraire les adresses
    const origin_addresses = drivingResponse.origin_addresses || [origins];
    const destination_addresses = drivingResponse.destination_addresses || [
      destinations,
    ];

    // Préparer les données de chaque mode
    const drivingElement = drivingResponse.rows[0]?.elements[0];
    const walkingElement = walkingResponse.rows[0]?.elements[0];
    const bicyclingElement = bicyclingResponse.rows[0]?.elements[0];
    const busElement = busResponse.rows[0]?.elements[0];
    const trainElement = trainResponse.rows[0]?.elements[0];
    const tramElement = tramResponse.rows[0]?.elements[0];
    const metroElement = metroResponse.rows[0]?.elements[0];

    // Créer la liste des modes de base
    const baseModes = [
      {
        mode: "driving",
        name: "Voiture thermique",
        emissionId: 4,
        available: drivingElement?.status === "OK",
        distance:
          drivingElement?.status === "OK" ? drivingElement.distance : null,
        duration:
          drivingElement?.status === "OK" ? drivingElement.duration : null,
      },
      {
        mode: "walking",
        name: "Marche",
        emissionId: 30,
        available: walkingElement?.status === "OK",
        distance:
          walkingElement?.status === "OK" ? walkingElement.distance : null,
        duration:
          walkingElement?.status === "OK" ? walkingElement.duration : null,
      },
      {
        mode: "bicycling",
        name: "Vélo mécanique",
        emissionId: 7,
        available: bicyclingElement?.status === "OK",
        distance:
          bicyclingElement?.status === "OK" ? bicyclingElement.distance : null,
        duration:
          bicyclingElement?.status === "OK" ? bicyclingElement.duration : null,
      },
      {
        mode: "transit_bus",
        name: "Bus thermique",
        emissionId: 9,
        available: busElement?.status === "OK",
        distance: busElement?.status === "OK" ? busElement.distance : null,
        duration: busElement?.status === "OK" ? busElement.duration : null,
      },
      {
        mode: "transit_train",
        name: "Train",
        emissionId: 2,
        available: trainElement?.status === "OK",
        distance: trainElement?.status === "OK" ? trainElement.distance : null,
        duration: trainElement?.status === "OK" ? trainElement.duration : null,
      },
      {
        mode: "transit_tram",
        name: "Tram",
        emissionId: 10,
        available: tramElement?.status === "OK",
        distance: tramElement?.status === "OK" ? tramElement.distance : null,
        duration: tramElement?.status === "OK" ? tramElement.duration : null,
      },
      {
        mode: "transit_metro",
        name: "Métro",
        emissionId: 11,
        available: metroElement?.status === "OK",
        distance: metroElement?.status === "OK" ? metroElement.distance : null,
        duration: metroElement?.status === "OK" ? metroElement.duration : null,
      },
    ];

    // Ajouter les modes dérivés
    const allModes = [...baseModes];

    // 1. Ajouter voiture électrique & Moto thermique (basé sur voiture thermique)
    if (drivingElement?.status === "OK") {
      allModes.push({
        mode: "electric_car",
        name: "Voiture électrique",
        emissionId: 5,
        available: true,
        distance: drivingElement.distance,
        duration: drivingElement.duration,
      });

      allModes.push({
        mode: "motorcycle",
        name: "Moto thermique",
        emissionId: 13,
        available: true,
        distance: drivingElement.distance,
        // La moto est généralement un peu plus rapide que la voiture en ville
        duration: {
          text: formatDuration(
            Math.round(drivingElement.duration.value * 0.85)
          ), // 15% plus rapide
          value: Math.round(drivingElement.duration.value * 0.85),
        },
      });
    }

    // 2. Ajouter bus électrique & Bus GNV (basé sur bus thermique)
    if (busElement?.status === "OK") {
      allModes.push({
        mode: "electric_bus",
        name: "Bus électrique",
        emissionId: 16,
        available: true,
        distance: busElement.distance,
        duration: busElement.duration,
      });

      allModes.push({
        mode: "gnv_bus",
        name: "Bus (GNV)",
        emissionId: 21,
        available: true,
        distance: busElement.distance,
        duration: busElement.duration,
      });
    }

    // 3. Ajouter vélo électrique (basé sur vélo mécanique mais plus rapide)
    if (bicyclingElement?.status === "OK") {
      // Convertir la durée en secondes et réduire de 30%
      const bikeSeconds = bicyclingElement.duration.value;
      const electricBikeSeconds = Math.round(bikeSeconds * 0.7); // 30% plus rapide

      allModes.push({
        mode: "electric_bike",
        name: "Vélo électrique",
        emissionId: 8,
        available: true,
        distance: bicyclingElement.distance,
        duration: {
          text: formatDuration(electricBikeSeconds),
          value: electricBikeSeconds,
        },
      });

      // 4. Ajouter trottinette électrique (similaire au vélo électrique mais légèrement plus rapide)
      const scooterSeconds = Math.round(bikeSeconds * 0.65); // 35% plus rapide que le vélo

      allModes.push({
        mode: "electric_scooter",
        name: "Trottinette électrique",
        emissionId: 17,
        available: true,
        distance: bicyclingElement.distance,
        duration: {
          text: formatDuration(scooterSeconds),
          value: scooterSeconds,
        },
      });
    }

    // Retourner tous les modes
    return {
      origin_addresses,
      destination_addresses,
      transport_modes: allModes,
    };
  } catch (error) {
    // En cas d'erreur globale, retourner tous les modes comme non disponibles
    return {
      transport_modes: TRANSPORT_MODES.map((mode) => ({
        ...mode,
        available: false,
        error: error.message,
      })),
    };
  }
};

/**
 * Fonction utilitaire pour formater une durée en secondes au format texte (X hour Y mins)
 * @param {number} seconds - Durée en secondes
 * @returns {string} - Durée formatée
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} mins`;
  } else if (minutes === 0) {
    return `${hours} hour`;
  } else {
    return `${hours} hour ${minutes} mins`;
  }
}

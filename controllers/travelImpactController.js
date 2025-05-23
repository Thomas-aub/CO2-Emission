const distanceMatrixService = require('../services/distanceMatrixService');
const emissionService = require('../services/impactCo2Service');
const distanceGpsService = require('../services/distanceGpsService');
const geocodeService = require('../services/geocodeService');
const logger = require('../utils/logger');

/**
 * Fonction utilitaire pour extraire les coordonnées d'une adresse ou d'une chaîne GPS
 * @throws {Error} Si les coordonnées ne peuvent pas être extraites
 */
const getCoordinates = async (location) => {
  // Vérifier si la chaîne correspond à un format de coordonnées (lat,lon)
  // Format attendu: deux nombres séparés par une virgule
  const coordPattern = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
  
  if (coordPattern.test(location)) {
    const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
    return { lat, lon: lng };
  }
  
  // Sinon, utiliser le service de géocodage
  const geoData = await geocodeService.getCoordinates(location);
  
  // Vérifier que les coordonnées sont valides
  if (!geoData || !geoData.coordinates || 
      geoData.coordinates.lat === null || geoData.coordinates.lon === null ||
      isNaN(geoData.coordinates.lat) || isNaN(geoData.coordinates.lon)) {
    logger.error(`Coordonnées invalides reçues pour "${location}": ${JSON.stringify(geoData)}`);
    throw new Error(`Impossible d'obtenir des coordonnées valides pour "${location}"`);
  }
  
  return geoData.coordinates;
};


/**
 * Fonction utilitaire pour calculer la distance GPS
 * @throws {Error} Si la distance ne peut pas être calculée
 */
const calculateAirDistance = async (origins, destinations) => {
  // Récupérer les coordonnées d'origine
  const originsCoords = await getCoordinates(origins);
  
  // Récupérer les coordonnées de destination
  const destinationsCoords = await getCoordinates(destinations);
  
  // Calculer la distance avec les coordonnées valides
  const distanceKm = distanceGpsService.calculateHaversineDistance(
    originsCoords.lat, originsCoords.lon,
    destinationsCoords.lat, destinationsCoords.lon
  );
  
  if (distanceKm === null || isNaN(distanceKm)) {
    logger.error(`Calcul de distance invalide: ${distanceKm}`);
    throw new Error('Calcul de distance impossible avec les coordonnées fournies');
  }
  
  return { distanceKm };
};

/**
 * Fonction utilitaire pour calculer les émissions pour un mode de transport
 * @throws {Error} Si les émissions ne peuvent pas être calculées
 */
const calculateEmissionsForMode = async (mode, emissionService) => {
  // Vérifier que nous avons une distance valide
  if (!mode.distance || !mode.distance.value || isNaN(mode.distance.value)) {
    logger.error(`Distance invalide pour le mode ${mode.name}`);
    throw new Error(`Distance invalide pour le mode ${mode.name}`);
  }
  
  const distanceKm = mode.distance.value / 1000;
  
  // Vérifier que la distance est positive
  if (distanceKm <= 0) {
    logger.error(`Distance négative ou nulle pour le mode ${mode.name}: ${distanceKm}`);
    throw new Error(`Distance négative ou nulle pour le mode ${mode.name}`);
  }
  
  // Obtenir les données d'émission
  const rawEmissionsData = await emissionService.getEmissions(distanceKm);
  
  // Normaliser le format des données d'émission
  const emissionsData = Array.isArray(rawEmissionsData) && rawEmissionsData.length === 1 && Array.isArray(rawEmissionsData[0])
    ? rawEmissionsData[0]
    : rawEmissionsData;

  if (!Array.isArray(emissionsData)) {
    logger.error(`Format de données d'émission invalide pour ${mode.name}`);
    throw new Error(`Format de données d'émission invalide pour ${mode.name}`);
  }

  // Trouver l'émission correspondant au mode
  const emissionMatch = emissionsData.find(e => e && e.id === mode.emissionId);
  console.log('---> Émission trouvée:', emissionMatch);

  if (!emissionMatch) {
    console.error(`Aucune donnée d'émission trouvée pour le mode ${mode.name} (ID: ${mode.emissionId})`);
    logger.error(`Aucune donnée d'émission trouvée pour le mode ${mode.name} (ID: ${mode.emissionId})`);
    throw new Error(`Aucune donnée d'émission trouvée pour le mode ${mode.name}`);
  }
  
  return { ...mode, emissions: emissionMatch };
};

/**
 * Fonction utilitaire pour ajouter les données d'émissions pour les modes de transport
 */
const addEmissionsToModes = async (transportModes, emissionService) => {

  console.log('Modes de transport:', transportModes);
  // Filtrer les modes disponibles
  const availableModes = transportModes.filter(mode => mode.available);


  console.log('Modes de transport disponibles:', availableModes);

  
  if (availableModes.length === 0) {
    logger.warn('Aucun mode de transport disponible');
    return [];
  }
  
  // Calculer les émissions pour chaque mode
  const results = [];
  
  for (const mode of availableModes) {
    try {
      const modeWithEmissions = await calculateEmissionsForMode(mode, emissionService);
      results.push(modeWithEmissions);
    } catch (error) {
      logger.error(`Erreur lors du calcul des émissions pour ${mode.name}: ${error.message}`);
      // Ne pas ajouter ce mode s'il y a une erreur
    }
  }
  
  return results;
};

/**
 * Calcule l'impact CO2 d'un trajet pour tous les modes de transport disponibles
 */
exports.calculateTravelImpact = async (req, res) => {
  try {
    const { origins, destinations } = req.query;

    // Validation des paramètres
    if (!origins || !destinations) {
      return res.status(400).json({
        error: 'Paramètres manquants',
        message: 'Les paramètres "origins" et "destinations" sont requis'
      });
    }

    // Récupérer les données de distance matrix
    const distanceData = await distanceMatrixService.getAllTransportModes(origins, destinations);
    
    // Vérifier que les données de distance sont valides
    if (!distanceData || !distanceData.transport_modes || !Array.isArray(distanceData.transport_modes)) {
      logger.error('Données de distance invalides', distanceData);
      return res.status(500).json({
        error: 'Données de distance invalides',
        message: 'Impossible de récupérer les distances pour les modes de transport'
      });
    }
    
    // Ajouter les émissions aux modes disponibles
    const modesWithEmissions = await addEmissionsToModes(
      distanceData.transport_modes, 
      emissionService
    );
    
    // Si aucun mode avec émissions n'est disponible, c'est une erreur
    if (modesWithEmissions.length === 0) {
      return res.status(500).json({
        error: 'Calcul des émissions impossible',
        message: 'Aucun mode de transport avec émissions n\'est disponible pour cet itinéraire'
      });
    }

    // Essayer de calculer la distance aérienne
    try {
      const airDistance = await calculateAirDistance(origins, destinations);
      const airDistanceKm = airDistance.distanceKm;
      logger.info(`Distance aérienne calculée: ${airDistanceKm} km`);
      
      // Calculer les émissions aériennes
      const airEmissionsData = await emissionService.getEmissions(airDistanceKm);
      
      // Vérifier que les données d'émission sont valides
      if (Array.isArray(airEmissionsData) && airEmissionsData.length > 0 && 
          Array.isArray(airEmissionsData[0])) {
        
        // Trouver spécifiquement l'émission pour l'avion (id 1)
        const airplaneEmission = airEmissionsData[0].find(e => e.id === 1);
        
        if (airplaneEmission) {
          // Ajouter le mode avion avec seulement l'émission de l'avion
          modesWithEmissions.push({
            mode: 'airplane',
            name: 'Avion',
            available: true,
            distance: {
              text: `${airDistanceKm.toFixed(1)} km`,
              value: airDistanceKm * 1000
            },
            emissions: airplaneEmission // Utiliser seulement l'émission de l'avion, pas tout le tableau
          });
        }
      }
    } catch (error) {
      logger.error(`Erreur lors du calcul du mode aérien: ${error.message}`);
      // Continuer sans le mode aérien si une erreur se produit
    }

    // Renvoyer les résultats
    res.status(200).json({
      origin: origins,
      destination: destinations,
      origin_address: distanceData.origin_addresses?.[0] || origins,
      destination_address: distanceData.destination_addresses?.[0] || destinations,
      transport_modes: modesWithEmissions
    });
    
  } catch (error) {
    logger.error(`Erreur dans calculateTravelImpact: ${error.message}`);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
};

/**
 * Calcule uniquement l'impact CO2 pour un vol aérien
 */
exports.calculateAirTravelImpact = async (req, res) => {
  try {
    const { origins, destinations } = req.query;

    // Validation des paramètres
    if (!origins || !destinations) {
      return res.status(400).json({
        error: 'Paramètres manquants',
        message: 'Les paramètres "origins" et "destinations" sont requis'
      });
    }

    // Récupérer les coordonnées
    const originsCoords = await getCoordinates(origins);
    const destinationsCoords = await getCoordinates(destinations);
    
    // Calculer la distance aérienne
    const airDistanceKm = distanceGpsService.calculateHaversineDistance(
      originsCoords.lat, originsCoords.lon,
      destinationsCoords.lat, destinationsCoords.lon
    );
    
    if (airDistanceKm === null || isNaN(airDistanceKm)) {
      return res.status(500).json({
        error: 'Calcul de distance impossible',
        message: 'Impossible de calculer la distance aérienne avec les coordonnées fournies'
      });
    }
    
    // Pour un trajet très court (même ville), renvoyer une réponse spécifique
    if (airDistanceKm < 10) {
      return res.status(200).json({
        origin: origins,
        destination: destinations,
        flight_type: "Trajet très court",
        distance: {
          km: airDistanceKm,
          miles: airDistanceKm * 0.621371,
        },
        message: "Pour cette distance, privilégiez d'autres modes de transport",
        emissions: {
          name: "Avion (non recommandé)",
          value: 0,
          unit: "kgCO2e",
          note: "Distance trop courte pour un vol commercial"
        },
        coordinates: {
          origin: originsCoords,
          destination: destinationsCoords,
        },
        calculation_method: "GPS straight-line distance",
      });
    }
    
    // Récupérer les données d'émission
    const emissionsData = await emissionService.getEmissions(airDistanceKm);
    
    if (!Array.isArray(emissionsData) || !emissionsData[0] || !Array.isArray(emissionsData[0])) {
      logger.error(`Format de données d'émission invalide: ${JSON.stringify(emissionsData)}`);
      return res.status(500).json({
        error: 'Format de données d\'émission invalide',
        message: 'Le service d\'émissions a retourné un format de données incorrect'
      });
    }

    // Logs pour aider au débogage
    logger.info(`Recherche d'émissions pour un vol de ${airDistanceKm} km`);
    
    // Déterminer le type de vol
    let flightType, emissionId;
    if (airDistanceKm < 1000) {
      flightType = "court-courrier";
      emissionId = 1;  // ID pour vol court-courrier
    } else if (airDistanceKm < 3500) {
      flightType = "moyen-courrier";
      emissionId = 1;  // Peut être le même que court-courrier selon l'API
    } else {
      flightType = "long-courrier";
      emissionId = 1;  // Peut être le même que court-courrier selon l'API
    }
    
    logger.info(`Type de vol: ${flightType}, ID recherché: ${emissionId}`);
    
    // Extraire la liste plate d'émissions
    const emissions = emissionsData[0];
    
    // Log de toutes les émissions reçues pour débogage
    logger.info(`Émissions reçues: ${JSON.stringify(emissions.map(e => ({ id: e.id, name: e.name })))}`);
    
    // Trouver l'émission correspondant au type de vol
    const emissionMatch = emissions.find(e => e.id === emissionId);

    if (!emissionMatch) {
      // Si l'ID exact n'est pas trouvé, rechercher par nom (plus flexible)
      const namePattern = new RegExp(`avion|airplane|vol`, 'i');
      let altEmissionMatch = emissions.find(e => namePattern.test(e.name));
      
      if (altEmissionMatch) {
        logger.info(`Utilisation de l'émission alternative: ${JSON.stringify(altEmissionMatch)}`);
        // Créer une nouvelle variable pour stocker l'émission trouvée
        const matchedEmission = altEmissionMatch;
        
        // Construire la réponse
        const response = {
          origin: origins,
          destination: destinations,
          flight_type: flightType,
          distance: {
            km: airDistanceKm,
            miles: airDistanceKm * 0.621371,
          },
          duration: flightDuration,
          emissions: matchedEmission, // Utiliser l'émission correspondante, pas tout le tableau
          coordinates: {
            origin: originsCoords,
            destination: destinationsCoords,
          },
          calculation_method: "GPS straight-line distance",
        };

        return res.status(200).json(response);
      } else {
        logger.error(`Aucune donnée d'émission trouvée pour un vol ${flightType}`);
        return res.status(500).json({
          error: 'Données d\'émission non trouvées',
          message: `Aucune donnée d'émission trouvée pour un vol ${flightType}`
        });
      }
    }
    
    // Calculer la durée du vol
    const flightDurationHours = airDistanceKm / 800;
    const totalDurationMinutes = Math.round((flightDurationHours * 60) + 45);
    const flightDuration = {
      hours: Math.floor(totalDurationMinutes / 60),
      minutes: totalDurationMinutes % 60,
      total_minutes: totalDurationMinutes,
    };

    // Construire la réponse
    const response = {
      origin: origins,
      destination: destinations,
      flight_type: flightType,
      distance: {
        km: airDistanceKm,
        miles: airDistanceKm * 0.621371,
      },
      duration: flightDuration,
      emissions: emissionMatch,
      coordinates: {
        origin: originsCoords,
        destination: destinationsCoords,
      },
      calculation_method: "GPS straight-line distance",
    };

    res.status(200).json(response);
    
  } catch (error) {
    logger.error(`Erreur dans calculateAirTravelImpact: ${error.message}`);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
};
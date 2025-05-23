const distanceMatrixService = require('../services/distanceMatrixService');
const logger = require('../utils/logger');

/**
 * Calcule la distance entre deux points pour un mode de transport spécifique
 */
exports.getDistance = async (req, res) => {
  const { origins, destinations, mode = 'driving', transitMode } = req.query;

  // Vérifiez si les paramètres sont manquants
  if (origins === undefined || destinations === undefined) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  // Vérifiez si les paramètres sont invalides
  if (!origins.trim() || !destinations.trim()) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }

  try {
    // Appel au service pour obtenir la distance et la durée
    const result = await distanceMatrixService.getDistanceMatrix(origins, destinations, mode, transitMode);

    // Vérifiez si le service retourne des données valides
    if (!result?.rows?.[0]?.elements) {
      logger.error('Données invalides retournées par le service:', result);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }

    // Vérifiez si le mode de transport demandé est disponible
    const element = result.rows[0].elements[0];
    if (element.status !== 'OK') {
      logger.error('Mode de transport indisponible:', element);
      return res.status(200).json({
        message: 'Mode de transport indisponible pour les paramètres fournis.',
        details: element,
      });
    }

    // Retournez les résultats
    return res.status(200).json({
      origin: result.origin_addresses[0],
      destination: result.destination_addresses[0],
      distance: element.distance.text,
      duration: element.duration.text,
    });
  } catch (error) {
    // Gérer les erreurs du service
    logger.error('Erreur lors de l\'appel au service:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

/**
 * Calcule la distance pour tous les modes de transport disponibles
 */
exports.getAllModes = async (req, res) => {
  const { origins, destinations } = req.query;

  // Vérifiez si les paramètres sont manquants
  if (origins === undefined || destinations === undefined) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  // Vérifiez si les paramètres sont invalides
  if (!origins.trim() || !destinations.trim()) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }

  try {
    // Appel au service pour obtenir les modes de transport
    const result = await distanceMatrixService.getAllTransportModes(origins, destinations);

    // Vérifiez si le service retourne des données valides
    if (!result || !Array.isArray(result.transport_modes)) {
      logger.error('Données invalides retournées par le service:', result);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }

    // Vérifiez si au moins un mode de transport est disponible
    const hasAvailableModes = result.transport_modes.some(mode => mode.available);
    if (!hasAvailableModes) {
      logger.error('Aucun mode de transport disponible:', result.transport_modes);
      return res.status(200).json({
        transport_modes: result.transport_modes,
        message: 'Aucun mode de transport disponible pour les paramètres fournis.',
      });
    }

    // Retournez les résultats
    return res.status(200).json(result);
  } catch (error) {
    // Gérer les erreurs spécifiques du service
    logger.error('Erreur lors de l\'appel au service:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

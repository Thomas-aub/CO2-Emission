const distanceGpsService = require('../services/distanceGpsService');
const logger = require('../utils/logger');

/**
 * Calcule la distance entre deux points GPS
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getDistance = (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      logger.warn('Paramètres manquants pour le calcul de distance GPS');
      return res.status(400).json({
        error: 'Paramètres manquants',
        message: 'Tous les paramètres (lat1, lng1, lat2, lng2) sont requis'
      });
    }
    
    const distanceKm = distanceGpsService.calculateHaversineDistance(lat1, lng1, lat2, lng2);
    
    if (distanceKm === null) {
      return res.status(400).json({
        error: 'Calcul impossible',
        message: 'Impossible de calculer la distance avec les paramètres fournis'
      });
    }
    
    const formattedDistance = distanceGpsService.formatDistance(distanceKm);
    
    res.status(200).json({
      distanceKm: distanceKm,
      distance: formattedDistance
    });
  } catch (error) {
    logger.error(`Erreur lors du calcul de distance: ${error.message}`);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Une erreur est survenue lors du calcul de la distance'
    });
  }
};
const logger = require('../utils/logger');

/**
 * Calcule la distance en kilomètres entre deux points GPS
 * en utilisant la formule de la distance haversine
 * 
 * @param {string|number} lat1 - Latitude du point de départ
 * @param {string|number} lon1 - Longitude du point de départ
 * @param {string|number} lat2 - Latitude du point d'arrivée
 * @param {string|number} lon2 - Longitude du point d'arrivée
 * @returns {number|null} - Distance en kilomètres ou null si calcul impossible
 */
exports.calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  try {
    lat1 = parseFloat(lat1);
    lon1 = parseFloat(lon1);
    lat2 = parseFloat(lat2);
    lon2 = parseFloat(lon2);
    
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      logger.error(`Paramètres invalides: lat1=${lat1}, lon1=${lon1}, lat2=${lat2}, lon2=${lon2}`);
      return null;
    }
    
    // Conversion degrés en radians
    const toRad = value => (value * Math.PI) / 180;
    
    // Rayon de la Terre en kilomètres
    const R = 6371;
    
    // Différence de latitude et longitude en radians
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    // Formule haversine
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Arrondir à 2 décimales
    return Math.round(distance * 100) / 100;
  } catch (error) {
    logger.error(`Erreur lors du calcul de distance: ${error.message}`);
    return null;
  }
};

/**
 * Formate la distance pour l'affichage
 * 
 * @param {number} distance - Distance en kilomètres
 * @returns {string} - Distance formatée (ex: "427.15 km")
 */
exports.formatDistance = (distance) => {
  if (distance === null || isNaN(distance)) {
    return "Distance inconnue";
  }
  return `${distance} km`;
};
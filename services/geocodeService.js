const logger = require('../utils/logger');
const createProxyAxios = require('../utils/proxyAxios');
const axios = createProxyAxios();
// const axios = require('axios');

/**
 * Service pour convertir une adresse en coordonnées GPS via l'API Nominatim
*/
exports.getCoordinates = async (address) => {
  try {
    logger.info(`Géocodage de l'adresse: ${address}`);
    
    // Appel à l'API Nominatim
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'CO2EmissionCalculator/1.0'
      },
      // Ajouter un timeout pour éviter les requêtes bloquantes
      timeout: 5000
    });

    // Vérifier que la réponse contient des résultats
    if (!response.data || response.data.length === 0) {
      throw new Error(`Aucun résultat trouvé pour l'adresse: ${address}`);
    }

    const location = response.data[0];
    
    // Vérifier que les coordonnées existent et sont des nombres valides
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error(`Coordonnées invalides reçues pour l'adresse: ${address}`);
    }
    
    return {
      address: location.display_name,
      coordinates: { lat, lon }
    };
  } catch (error) {
    // Journaliser l'erreur précise
    logger.error(`Erreur lors du géocodage de "${address}": ${error.message}`);
    
    throw new Error(`Géocodage impossible pour l'adresse "${address}": ${error.message}`);
  }
};
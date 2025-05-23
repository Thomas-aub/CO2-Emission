const createProxyAxios = require('../utils/proxyAxios');
const logger = require('../utils/logger');

const axios = createProxyAxios();
// const axios = require('axios'); 

const API_TOKEN = process.env.IMPACT_CO2_API_TOKEN;

exports.getEmissions = async (distance, axiosInstance = axios) => {
  try {
    // Paramètres pour l'API Impact CO2 (https://impactco2.fr/)
    // Documentation: https://impactco2.fr/api/v1/transport

    const impactCo2Params = {
      km: distance,
      displayAll: 1,
      ignoreRadiativeForcing: 0,
      occupencyRate: 1,
      includeConstruction: 0,
      language: 'fr',
      transports: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,21,30'
    };

    // Appel à l'API Impact CO2 avec Bearer Token
    const impactCo2Response = await axiosInstance.get('https://impactco2.fr/api/v1/transport', {
      params: impactCo2Params,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    logger.info('Réponse brute de l\'API:', impactCo2Response.data);
    
    let transportData;
    if (Array.isArray(impactCo2Response.data)) {
      transportData = impactCo2Response.data;
    } else if (typeof impactCo2Response.data === 'object') {
      transportData = Object.values(impactCo2Response.data);
    } else {
      throw new Error('Format de réponse API inattendu');
    }
    
    // S'assurer qu'il s'agit toujours d'un tableau de tableaux
    if (!Array.isArray(transportData[0])) {
      transportData = [transportData];
    }

    // Log des résultats
    logger.info(`Résultats des émissions CO2 pour ${distance} km`);
    
    return transportData;
  } catch (error) {
    logger.error('Erreur lors de la requête à l\'API Impact CO2:', error);
    throw error; 
  }
};
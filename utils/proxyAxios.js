const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const logger = require('./logger');

/**
 * Crée une instance Axios configurée en fonction de l'environnement
 * Sur la VM de production, le proxy peut être différent ou désactivé
 */
const createProxyAxios = () => {
  // Utiliser la variable d'environnement pour déterminer si on est en production
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Configuration du proxy selon l'environnement
  const PROXY = isProduction 
    ? (process.env.PRODUCTION_PROXY || null) 
    : (process.env.HTTPS_PROXY || 'https://proxy.univ-lyon1.fr:3128/');
  
  // Configuration Axios de base
  const config = {
    headers: {
      'User-Agent': 'CO2EmissionCalculator/1.0',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    },
    timeout: 15000 // 15 secondes de timeout
  };
  
  // Si le proxy est défini, l'utiliser
  if (PROXY) {
    logger.info(`Configuration d'Axios avec le proxy: ${PROXY}`);
    const httpsAgent = new HttpsProxyAgent(PROXY);
    config.httpsAgent = httpsAgent;
    config.proxy = false; // Désactive le proxy intégré d'Axios
  } else {
    logger.info('Configuration d\'Axios sans proxy');
  }
  
  return axios.create(config);
};

module.exports = createProxyAxios;
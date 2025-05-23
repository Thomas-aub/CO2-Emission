const logger = require('../utils/logger');

/**
 * Middleware de gestion globale des erreurs
 */
module.exports = (err, req, res, next) => {
  
  logger.error('Erreur non gérée:', err);

  const statusCode = err.statusCode || 500;
  
  // Réponse au client
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Erreur interne du serveur' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
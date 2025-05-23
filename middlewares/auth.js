const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification
 * Vérifie si un token JWT valide est présent dans les en-têtes de la requête
 */
const authenticate = (req, res, next) => {
  try {
    // Récupérer le token dans l'en-tête Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise'
      });
    }
    
    // Extraire le token (enlever "Bearer ")
    const token = authHeader.split(' ')[1];
    
    // Vérifier la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter'
      });
    }
    
    logger.error('Erreur d\'authentification:', error);
    return res.status(401).json({
      error: 'Non autorisé',
      message: 'Token d\'authentification invalide'
    });
  }
};

/**
 * Middleware de restriction par rôle
 * Vérifie si l'utilisateur a le rôle requis
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires'
      });
    }
    next();
  };
};

// Attacher la fonction restrictTo au middleware principal pour la rendre accessible
authenticate.restrictTo = restrictTo;

// Exporter le middleware d'authentification avec la fonction restrictTo attachée
module.exports = authenticate;
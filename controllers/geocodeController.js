const geocodeService = require('../services/geocodeService');

/**
 * Convertit une adresse en coordonnées géographiques
*/
exports.getCoordinates = async (req, res, next) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        error: 'L\'adresse est requise',
        message: 'Veuillez fournir une adresse dans la requête'
      });
    }

    const geoData = await geocodeService.getCoordinates(address);
    
    res.status(200).json(geoData);

  } catch (error) {
    // Si l'erreur a un code de statut spécifique défini dans le service
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: error.message,
        ...(error.response?.data && { details: error.response.data })
      });
    }
    
    // Sinon, on passe l'erreur au middleware d'erreur
    next(error);
  }
};
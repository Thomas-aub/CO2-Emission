/**
 * Controller pour gérer les émissions de CO2 calculées
 * à partir de la distance parcourue.
 **/

const impactCo2Service = require('../services/impactCo2Service');

exports.calculateEmissions = async (req, res, next) => {
  try {
    const { distance } = req.query;

    if (!distance) {
      return res.status(400).json({
        error: 'La distance est requise',
        message: 'Veuillez fournir une distance dans la requête'
      });
    }

    const transportData = await impactCo2Service.getEmissions(parseFloat(distance));

    // Renvoyer les données au client
    res.status(200).json({
      distance: parseFloat(distance),
      emissions: transportData
    });

  } catch (error) {
    next(error); // Passer l'erreur au middleware d'erreur
  }
};
const express = require('express');
const router = express.Router();
const travelImpactController = require('../controllers/travelImpactController');

/**
 * @route GET /api/travel-impact
 * @desc Calcule l'impact CO2 d'un trajet pour tous les modes de transport disponibles
 * @query {string} origins - Coordonnées ou adresse de départ
 * @query {string} destinations - Coordonnées ou adresse d'arrivée
 */
router.get('/travel-impact', travelImpactController.calculateTravelImpact);

/**
 * @route GET /api/air-travel-impact
 * @desc Calcule uniquement l'impact CO2 pour un vol aérien
 * @query {string} origins - Coordonnées ou adresse de départ
 * @query {string} destinations - Coordonnées ou adresse d'arrivée
 */
router.get('/air-travel-impact', travelImpactController.calculateAirTravelImpact);

module.exports = router;
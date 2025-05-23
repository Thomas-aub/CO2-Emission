const express = require('express');
const router = express.Router();
const distanceMatrixController = require('../controllers/distanceMatrixController');

/**
 * @route GET /api/distance-matrix
 * @desc Calcule la distance entre deux points pour un mode de transport spécifique
 * @query {string} origins - Coordonnées ou adresse de départ
 * @query {string} destinations - Coordonnées ou adresse d'arrivée
 * @query {string} [mode=driving] - Mode de transport (driving, walking, bicycling, transit)
 * @query {string} [transitMode] - Mode de transit (bus, metro, train, tram, rail)
 */
router.get('/distance-matrix', distanceMatrixController.getDistance);

/**
 * @route GET /api/distance-matrix/all-modes
 * @desc Calcule la distance pour tous les modes de transport disponibles
 * @query {string} origins - Coordonnées ou adresse de départ
 * @query {string} destinations - Coordonnées ou adresse d'arrivée
 */
router.get('/distance-matrix/all-modes', distanceMatrixController.getAllModes);

module.exports = router;
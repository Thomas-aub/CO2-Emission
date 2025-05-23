const express = require('express');
const router = express.Router();
const emissionController = require('../controllers/emissionController');

// Route pour calculer les émissions CO2
router.get('/emissions', emissionController.calculateEmissions);

module.exports = router;
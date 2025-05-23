const express = require('express');
const router = express.Router();
const geocodeController = require('../controllers/geocodeController');

// Route pour geocoder une adresse
router.get('/geocode', geocodeController.getCoordinates);

module.exports = router;
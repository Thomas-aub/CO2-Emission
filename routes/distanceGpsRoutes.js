const express = require('express');
const router = express.Router();
const distanceGpsController = require('../controllers/distanceGpsController');

// Route pour calculer la distance GPS
router.get('/distance-gps', distanceGpsController.getDistance);

module.exports = router;
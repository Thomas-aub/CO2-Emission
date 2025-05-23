/*
 * @file app.js
 * @description Point d'entrée de l'application Express.
 * @date 2025-04-01
 * @version 1.0.0
*/

const express = require('express');
const cors = require('cors');

require('dotenv').config();

// Connexion à la base de données 
const connectDB = require('./config/database');

// Importation des routes
const emissionRoutes = require('./routes/emissionRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const distanceGpsRoutes = require('./routes/distanceGpsRoutes');
const distanceMatrixRoutes = require('./routes/distanceMatrixRoutes');
const travelImpactRoutes = require('./routes/travelImpactRoutes');

// Importation des routes utilisateur
const userRoutes = require('./routes/userRoutes');

// Middleware d'erreur
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(cors());

// Connexion à MongoDB
connectDB();

// Routes
app.use('/api', geocodeRoutes);         // => api/geocode
app.use('/api', emissionRoutes);        // => api/emission
app.use('/api', distanceGpsRoutes);     // => api/distance-gps
app.use('/api', distanceMatrixRoutes);  // => api/distance-matrix
app.use('/api', travelImpactRoutes);    // => api/travel-impact, api/air-travel-impact

// Routes utilisateur
app.use('/api/users', userRoutes);      // => api/users

// Middleware pour gérer les routes inconnues
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware de gestion des erreurs (doit être le dernier)
app.use(errorHandler);

module.exports = app;
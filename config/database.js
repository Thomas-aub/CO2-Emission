const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Fonction de connexion à MongoDB
const connectDB = async () => {
  try {
    // Déterminer la chaîne de connexion selon l'environnement
    const isProduction = process.env.NODE_ENV === "production";

    // Choisir l'URI en fonction de l'environnement
    let mongoURI;

    if (isProduction) {
      // En production, utiliser MongoDB local par défaut
      mongoURI =
        process.env.MONGODB_URI_PRODUCTION ||
        "mongodb://localhost:27017/eco_co2";
    } else {
      // En développement, utiliser l'URI spécifié ou MongoDB local
      mongoURI =
        process.env.MONGODB_URI || "mongodb://localhost:27017/eco_co2_dev";
    }

    logger.info(
      `Tentative de connexion à MongoDB (${
        isProduction ? "production" : "développement"
      })`
    );
    logger.info(
      `URI de connexion: ${mongoURI.replace(
        /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
        "mongodb$1://$2:****@"
      )}`
    );

    // Options de connexion
    const options = {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      // Configuration pour MongoDB 6+ (si nécessaire)
      useUnifiedTopology: true,
    };

    // Connexion à MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`MongoDB connecté: ${conn.connection.host}`);

    // Créer la collection et l'index si nécessaire
    await initializeDatabase();

    return true;
  } catch (error) {
    logger.error(`Erreur de connexion à MongoDB: ${error.message}`);
    logger.error(error.stack); // En production, réessayer après un délai
    if (process.env.NODE_ENV === "production") {
      logger.info("Tentative de reconnexion dans 5 secondes...");
      setTimeout(() => connectDB(), 5000);
    }
    return false;
  }
};

// Initialisation de la base de données
async function initializeDatabase() {
  try {
    // Créer les collections et index nécessaires ici si besoin
    logger.info("Base de données initialisée avec succès");
  } catch (error) {
    logger.error(
      `Erreur lors de l'initialisation de la base de données: ${error.message}`
    );
  }
}

module.exports = connectDB;

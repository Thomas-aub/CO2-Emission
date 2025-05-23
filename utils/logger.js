/**
 * Utilitaire de logging pour l'application
 */
const isTestEnv = process.env.NODE_ENV === 'test';

module.exports = {
  info: (message, data) => {
    if (!isTestEnv) console.log(`[INFO] ${message}`, data || '');
  },
  warn: (message, data) => {
    // Supprimer temporairement la condition pour permettre les tests
    console.warn(`[WARNING] ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error || '');
  }
};
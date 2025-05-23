const errorHandler = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

jest.mock('../utils/logger');

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('gère une erreur avec un code de statut spécifique', () => {
    const error = new Error('Erreur spécifique');
    error.statusCode = 400;

    errorHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Erreur non gérée:', error);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Erreur spécifique',
      })
    );
  });

  test('gère une erreur sans code de statut (erreur 500)', () => {
    const error = new Error('Erreur interne');

    errorHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Erreur non gérée:', error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Erreur interne du serveur',
      })
    );
  });

  test('inclut la pile d\'erreurs en mode non production', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Erreur avec pile');

    errorHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Erreur non gérée:', error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erreur interne du serveur',
      stack: error.stack,
    });

    process.env.NODE_ENV = 'test'; // Réinitialiser l'environnement
  });
});

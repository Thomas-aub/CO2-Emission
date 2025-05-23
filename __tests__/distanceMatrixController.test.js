const distanceMatrixController = require('../controllers/distanceMatrixController');
const distanceMatrixService = require('../services/distanceMatrixService');
const logger = require('../utils/logger');

jest.mock('../services/distanceMatrixService');
jest.mock('../utils/logger');

describe('distanceMatrixController', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getDistance', () => {
    test('retourne la distance pour des paramètres valides', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon', mode: 'driving' };
      distanceMatrixService.getDistanceMatrix.mockResolvedValueOnce({
        origin_addresses: ['Paris, France'],
        destination_addresses: ['Lyon, France'],
        rows: [
          {
            elements: [
              {
                status: 'OK',
                distance: { text: '465 km' },
                duration: { text: '4h 30m' },
              },
            ],
          },
        ],
      });

      await distanceMatrixController.getDistance(req, res);

      expect(distanceMatrixService.getDistanceMatrix).toHaveBeenCalledWith('Paris', 'Lyon', 'driving', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        origin: 'Paris, France',
        destination: 'Lyon, France',
        distance: '465 km',
        duration: '4h 30m',
      });
    });

    test('retourne une erreur 400 si les paramètres sont manquants', async () => {
      await distanceMatrixController.getDistance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Paramètres manquants' });
    });

    test('retourne une erreur 400 si les paramètres sont invalides', async () => {
      req.query = { origins: ' ', destinations: ' ' };

      await distanceMatrixController.getDistance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Paramètres invalides' });
    });

    test('retourne une erreur 500 si le service retourne des données invalides', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      distanceMatrixService.getDistanceMatrix.mockResolvedValueOnce(null);

      await distanceMatrixController.getDistance(req, res);

      expect(logger.error).toHaveBeenCalledWith('Données invalides retournées par le service:', null);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur' });
    });

    test('retourne un message si le mode de transport est indisponible', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      distanceMatrixService.getDistanceMatrix.mockResolvedValueOnce({
        rows: [
          {
            elements: [
              {
                status: 'ZERO_RESULTS',
              },
            ],
          },
        ],
      });

      await distanceMatrixController.getDistance(req, res);

      expect(logger.error).toHaveBeenCalledWith('Mode de transport indisponible:', { status: 'ZERO_RESULTS' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Mode de transport indisponible pour les paramètres fournis.',
        details: { status: 'ZERO_RESULTS' },
      });
    });

    test('retourne une erreur 500 si les éléments de la réponse sont manquants', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      distanceMatrixService.getDistanceMatrix.mockResolvedValueOnce({
        origin_addresses: ['Paris, France'],
        destination_addresses: ['Lyon, France'],
        rows: [{}], // Les éléments sont manquants
      });

      await distanceMatrixController.getDistance(req, res);

      expect(logger.error).toHaveBeenCalledWith('Données invalides retournées par le service:', {
        origin_addresses: ['Paris, France'],
        destination_addresses: ['Lyon, France'],
        rows: [{}],
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur' });
    });

    test('retourne une erreur 500 si une exception est levée dans le service', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      const error = new Error('Erreur du service');
      distanceMatrixService.getDistanceMatrix.mockRejectedValueOnce(error);

      await distanceMatrixController.getDistance(req, res);

      expect(logger.error).toHaveBeenCalledWith('Erreur lors de l\'appel au service:', error.message);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur' });
    });
  });

  describe('getAllModes', () => {
    test('retourne les modes de transport disponibles', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      distanceMatrixService.getAllTransportModes.mockResolvedValueOnce({
        transport_modes: [
          { mode: 'driving', available: true },
          { mode: 'walking', available: false },
        ],
      });

      await distanceMatrixController.getAllModes(req, res);

      expect(distanceMatrixService.getAllTransportModes).toHaveBeenCalledWith('Paris', 'Lyon');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        transport_modes: [
          { mode: 'driving', available: true },
          { mode: 'walking', available: false },
        ],
      });
    });

    test('retourne une erreur 400 si les paramètres sont manquants', async () => {
      await distanceMatrixController.getAllModes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Paramètres manquants' });
    });

    test('retourne une erreur 400 si les paramètres sont invalides', async () => {
      req.query = { origins: ' ', destinations: ' ' };

      await distanceMatrixController.getAllModes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Paramètres invalides' });
    });

    test('retourne une erreur 500 si le service retourne des données invalides', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      distanceMatrixService.getAllTransportModes.mockResolvedValueOnce(null);

      await distanceMatrixController.getAllModes(req, res);

      expect(logger.error).toHaveBeenCalledWith('Données invalides retournées par le service:', null);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur' });
    });

    test('retourne un message si aucun mode de transport n\'est disponible', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      distanceMatrixService.getAllTransportModes.mockResolvedValueOnce({
        transport_modes: [],
      });

      await distanceMatrixController.getAllModes(req, res);

      expect(logger.error).toHaveBeenCalledWith('Aucun mode de transport disponible:', []);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        transport_modes: [],
        message: 'Aucun mode de transport disponible pour les paramètres fournis.',
      });
    });

    test('retourne une erreur 500 si les modes de transport sont manquants', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      distanceMatrixService.getAllTransportModes.mockResolvedValueOnce({
        transport_modes: null, // Les modes de transport sont manquants
      });

      await distanceMatrixController.getAllModes(req, res);

      expect(logger.error).toHaveBeenCalledWith('Données invalides retournées par le service:', {
        transport_modes: null,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur' });
    });

    test('retourne une erreur 500 si une exception est levée dans le service', async () => {
      req.query = { origins: 'Paris', destinations: 'Lyon' };
      const error = new Error('Erreur spécifique du service');
      distanceMatrixService.getAllTransportModes.mockRejectedValueOnce(error);

      await distanceMatrixController.getAllModes(req, res);

      expect(logger.error).toHaveBeenCalledWith('Erreur lors de l\'appel au service:', error.message);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erreur interne du serveur' });
    });
  });
});
 
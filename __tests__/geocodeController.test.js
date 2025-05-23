const geocodeController = require('../controllers/geocodeController');
const geocodeService = require('../services/geocodeService');

jest.mock('../services/geocodeService');

describe('geocodeController.getCoordinates', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('retourne les coordonnées pour une adresse valide', async () => {
    req.query.address = 'Paris';
    geocodeService.getCoordinates.mockResolvedValueOnce({
      address: 'Paris, France',
      coordinates: { lat: '48.8566', lon: '2.3522' },
    });

    await geocodeController.getCoordinates(req, res, next);

    expect(geocodeService.getCoordinates).toHaveBeenCalledWith('Paris');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      address: 'Paris, France',
      coordinates: { lat: '48.8566', lon: '2.3522' },
    });
  });

  test('retourne une erreur 400 si l\'adresse est manquante', async () => {
    await geocodeController.getCoordinates(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'L\'adresse est requise',
      message: 'Veuillez fournir une adresse dans la requête',
    });
    expect(geocodeService.getCoordinates).not.toHaveBeenCalled();
  });

  test('gère une erreur levée par geocodeService', async () => {
    req.query.address = 'Inconnue';
    const error = new Error('Adresse non trouvée');
    error.statusCode = 404;
    geocodeService.getCoordinates.mockRejectedValueOnce(error);

    await geocodeController.getCoordinates(req, res, next);

    expect(geocodeService.getCoordinates).toHaveBeenCalledWith('Inconnue');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Adresse non trouvée',
    });
  });

  test('passe une erreur non gérée au middleware d\'erreur', async () => {
    req.query.address = 'Erreur';
    const error = new Error('Erreur serveur');
    geocodeService.getCoordinates.mockRejectedValueOnce(error);

    await geocodeController.getCoordinates(req, res, next);

    expect(geocodeService.getCoordinates).toHaveBeenCalledWith('Erreur');
    expect(next).toHaveBeenCalledWith(error);
  });
});

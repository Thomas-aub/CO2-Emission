const emissionController = require('../controllers/emissionController');
const impactCo2Service = require('../services/impactCo2Service');

jest.mock('../services/impactCo2Service');

describe('emissionController.calculateEmissions', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('retourne les émissions pour une distance valide', async () => {
    req.query.distance = '100';
    impactCo2Service.getEmissions.mockResolvedValueOnce([
      { transport: 'car', emissions: 120 },
      { transport: 'train', emissions: 30 },
    ]);

    await emissionController.calculateEmissions(req, res, next);

    expect(impactCo2Service.getEmissions).toHaveBeenCalledWith(100);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      distance: 100,
      emissions: [
        { transport: 'car', emissions: 120 },
        { transport: 'train', emissions: 30 },
      ],
    });
  });

  test('retourne une erreur 400 si la distance est manquante', async () => {
    await emissionController.calculateEmissions(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'La distance est requise',
      message: 'Veuillez fournir une distance dans la requête',
    });
    expect(impactCo2Service.getEmissions).not.toHaveBeenCalled();
  });

  test('passe une erreur au middleware d\'erreur en cas de problème', async () => {
    req.query.distance = '100';
    const error = new Error('Erreur serveur');
    impactCo2Service.getEmissions.mockRejectedValueOnce(error);

    await emissionController.calculateEmissions(req, res, next);

    expect(impactCo2Service.getEmissions).toHaveBeenCalledWith(100);
    expect(next).toHaveBeenCalledWith(error);
  });
});
 
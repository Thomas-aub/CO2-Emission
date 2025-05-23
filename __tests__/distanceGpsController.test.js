const request = require('supertest');
const app = require('../app');
const distanceGpsService = require('../services/distanceGpsService');

// Mock du service distanceGpsService
jest.mock('../services/distanceGpsService');

describe('distanceGpsController', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if parameters are missing', async () => {
    const res = await request(app).get('/api/distance-gps');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Paramètres manquants');
  });

  it('should return 400 if parameters are invalid', async () => {
    // Le service retourne null pour des paramètres invalides
    distanceGpsService.calculateHaversineDistance.mockReturnValue(null);
    
    const res = await request(app).get('/api/distance-gps?lat1=abc&lng1=2&lat2=3&lng2=4');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Calcul impossible');
  });

  it('should return 200 with valid parameters', async () => {
    // Mock pour retourner une distance valide
    distanceGpsService.calculateHaversineDistance.mockReturnValue(10);
    distanceGpsService.formatDistance.mockReturnValue('10 km');

    const res = await request(app).get('/api/distance-gps?lat1=1&lng1=2&lat2=3&lng2=4');
    expect(res.status).toBe(200);
    expect(res.body.distanceKm).toBe(10);
    expect(res.body.distance).toBe('10 km');
  });

  it('should handle edge cases for valid parameters', async () => {
    // Pour des coordonnées identiques, le service retourne 0
    distanceGpsService.calculateHaversineDistance.mockReturnValue(0);
    distanceGpsService.formatDistance.mockReturnValue('0 km');

    const res = await request(app).get('/api/distance-gps?lat1=0&lng1=0&lat2=0&lng2=0');
    expect(res.status).toBe(200);
    expect(res.body.distanceKm).toBe(0);
    expect(res.body.distance).toBe('0 km');
  });

  it('should return 404 for an unknown route', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
  });

  it('should return 500 if the service throws an error', async () => {
    // Simule une erreur dans le service en lançant une exception
    distanceGpsService.calculateHaversineDistance.mockImplementation(() => {
      throw new Error('Service error');
    });

    const res = await request(app).get('/api/distance-gps?lat1=1&lng1=2&lat2=3&lng2=4');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Erreur serveur');
  });
});
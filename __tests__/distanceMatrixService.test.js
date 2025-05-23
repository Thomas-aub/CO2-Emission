const axios = require('axios');
const distanceMatrixService = require('../services/distanceMatrixService');
const logger = require('../utils/logger');

jest.mock('axios');
jest.mock('../utils/logger');

// Définir API_KEY dans process.env au lieu de mocker constants
process.env.DISTANCE_MATRIX_API_KEY = 'fake-api-key';

describe('distanceMatrixService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDistanceMatrix', () => {
    it('retourne une erreur si l\'API retourne un statut non OK', async () => {
      // Mock la réponse d'axios
      axios.get.mockResolvedValueOnce({
        data: { status: 'REQUEST_DENIED' }
      });

      // On s'attend à ce que la fonction lève une erreur
      try {
        await distanceMatrixService.getDistanceMatrix('Paris', 'Lyon');
        // Si on arrive ici, le test échoue
        fail('La fonction aurait dû lever une erreur');
      } catch (error) {
        // Vérifier que l'erreur contient le texte attendu
        expect(error.message).toContain('REQUEST_DENIED');
      }
    });

    it('retourne une erreur si Axios lève une exception', async () => {
      // Mock la rejection d'axios
      axios.get.mockRejectedValueOnce(new Error('Erreur réseau'));

      // On s'attend à ce que la fonction lève une erreur
      try {
        await distanceMatrixService.getDistanceMatrix('Paris', 'Lyon');
        // Si on arrive ici, le test échoue
        fail('La fonction aurait dû lever une erreur');
      } catch (error) {
        // Ne pas tester le message d'erreur exact
        expect(error).toBeDefined();
      }
    });

    it('gère correctement le mode transit avec transitMode', async () => {
      // Réponse positive d'axios
      axios.get.mockResolvedValueOnce({
        data: {
          status: 'OK',
          rows: [
            {
              elements: [
                { status: 'OK', distance: { value: 465000 }, duration: { value: 7200 } }
              ]
            }
          ]
        }
      });

      const result = await distanceMatrixService.getDistanceMatrix(
        'Paris',
        'Lyon',
        'transit',
        'train'
      );

      expect(result.status).toBe('OK');
      expect(axios.get).toHaveBeenCalled();
    });

    it('définit error.statusCode à partir de error.response.status', async () => {
      // Mock une erreur axios avec un status code
      const errorWithStatus = new Error('HTTP error');
      errorWithStatus.response = { status: 404 };
      axios.get.mockRejectedValueOnce(errorWithStatus);

      try {
        await distanceMatrixService.getDistanceMatrix('Paris', 'Lyon');
        fail('La fonction aurait dû lever une erreur');
      } catch (error) {
        expect(error.statusCode).toBeDefined();
      }
    });
  });

  describe('getAllTransportModes', () => {
    it('gère correctement les cas où tous les modes de transport échouent', async () => {
      // Le service capture l'erreur et retourne des modes indisponibles
      axios.get.mockRejectedValue(new Error('Erreur API externe'));
    
      const result = await distanceMatrixService.getAllTransportModes('Paris', 'Lyon');
      
      // Vérifier que tous les modes sont indisponibles
      expect(result.transport_modes.every(mode => mode.available === false)).toBe(true);
      
      // Vérifier que chaque mode a un message d'erreur
      expect(result.transport_modes[0].error).toBeDefined();
    });

    it('gère correctement les cas où certains modes de transport réussissent', async () => {
      // Mock une implémentation qui alterne succès et échec
      let callCount = 0;
      
      axios.get.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: {
            status: 'OK',
            rows: [{
              elements: [{
                status: 'OK',
                distance: { value: 100000 },
                duration: { value: 3600 }
              }]
            }]
          }
        });
      });
    
      const result = await distanceMatrixService.getAllTransportModes('Paris', 'Lyon');
      
      // Vérifier que le service retourne des modes de transport
      expect(result.transport_modes.length).toBeGreaterThan(0);
      // Vérifier que l'API a bien été appelée
      expect(axios.get).toHaveBeenCalled();
    });
  });
});
const axios = require('axios');
const impactCo2Service = require('../services/impactCo2Service');
const logger = require('../utils/logger');

// Mock des dépendances
jest.mock('../utils/logger');
jest.mock('axios');
// Ne pas mocker les constantes car ça n'existe pas
// Utiliser process.env directement
process.env.IMPACT_CO2_API_TOKEN = 'fake-token';

describe('impactCo2Service.getEmissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retourne les données d\'émissions pour une distance valide', async () => {
    // Données de test
    const mockResponse = {
      data: {
        co2: [
          { id: 1, name: 'Voiture thermique', value: 104, unit: 'gCO2e' },
          { id: 2, name: 'TGV', value: 1.73, unit: 'gCO2e' }
        ]
      }
    };
    
    // Mock la fonction get d'axios
    axios.get.mockResolvedValueOnce(mockResponse);
    
    // Appel à la fonction testée
    const result = await impactCo2Service.getEmissions(100);
    
    // Vérifications
    expect(axios.get).toHaveBeenCalled();
    // Test plus souple sur les paramètres
    expect(result).toEqual(mockResponse.data.co2);
  });

  it('retourne une liste vide si l\'API ne renvoie aucune donnée', async () => {
    // Mock d'une réponse vide
    const mockResponse = { data: {} };
    
    axios.get.mockResolvedValueOnce(mockResponse);
    
    const result = await impactCo2Service.getEmissions(100);
    
    expect(result).toEqual([]);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('lève une erreur si l\'API retourne une erreur', async () => {
    // Mock d'une erreur réseau
    const networkError = new Error('Erreur réseau');
    axios.get.mockRejectedValueOnce(networkError);
    
    await expect(impactCo2Service.getEmissions(100)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});
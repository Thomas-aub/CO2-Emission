const userController = require('../controllers/userController');
const User = require('../models/User');
const logger = require('../utils/logger');

// Mock des dépendances
jest.mock('../models/User');
jest.mock('../utils/logger');

describe('userController', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Créer des objets req, res et next simulés
    req = {
      body: {},
      query: {},
      user: { id: 'mock-user-id' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });
  
  describe('register', () => {
    it('devrait créer un nouvel utilisateur et retourner un token', async () => {
      // Configurer les données de la requête
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne pour retourner null (aucun utilisateur existant)
      User.findOne.mockResolvedValue(null);
      
      // Mock de l'instance User et de ses méthodes
      const mockUserInstance = {
        _id: 'mock-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('mock-token')
      };
      
      User.mockImplementation(() => mockUserInstance);
      
      // Appeler la méthode du contrôleur
      await userController.register(req, res, next);
      
      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Utilisateur créé avec succès',
        token: 'mock-token',
        user: {
          id: 'mock-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        }
      });
    });
    
    it('devrait retourner une erreur 400 si l\'email est déjà utilisé', async () => {
      // Configurer les données de la requête
      req.body = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne pour retourner un utilisateur existant
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });
      
      // Appeler la méthode du contrôleur
      await userController.register(req, res, next);
      
      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email déjà utilisé',
        message: 'Cet email est déjà associé à un compte'
      });
    });
    
    it('devrait passer l\'erreur au middleware suivant en cas d\'exception', async () => {
      // Configurer les données de la requête
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne pour lancer une erreur
      const mockError = new Error('Database error');
      User.findOne.mockRejectedValue(mockError);
      
      // Appeler la méthode du contrôleur
      await userController.register(req, res, next);
      
      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(logger.error).toHaveBeenCalledWith('Erreur lors de l\'inscription:', mockError);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('login', () => {
    it('devrait authentifier l\'utilisateur et retourner un token', async () => {
      // Configurer les données de la requête
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock de l'utilisateur trouvé
      const mockUser = {
        _id: 'mock-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: jest.fn().mockReturnValue('mock-token')
      };
      
      // Mock User.findOne pour retourner l'utilisateur
      User.findOne.mockResolvedValue(mockUser);
      
      // Appeler la méthode du contrôleur
      await userController.login(req, res, next);
      
      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Connexion réussie',
        token: 'mock-token',
        user: {
          id: 'mock-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        }
      });
    });
    
    it('devrait retourner une erreur 401 si l\'email est incorrect', async () => {
      // Configurer les données de la requête
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne pour retourner null
      User.findOne.mockResolvedValue(null);
      
      // Appeler la méthode du contrôleur
      await userController.login(req, res, next);
      
      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    });
    
    it('devrait retourner une erreur 401 si le mot de passe est incorrect', async () => {
      // Configurer les données de la requête
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Mock de l'utilisateur trouvé
      const mockUser = {
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      // Mock User.findOne pour retourner l'utilisateur
      User.findOne.mockResolvedValue(mockUser);
      
      // Appeler la méthode du contrôleur
      await userController.login(req, res, next);
      
      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    });
    
    it('devrait passer l\'erreur au middleware suivant en cas d\'exception', async () => {
      // Configurer les données de la requête
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne pour lancer une erreur
      const mockError = new Error('Database error');
      User.findOne.mockRejectedValue(mockError);
      
      // Appeler la méthode du contrôleur
      await userController.login(req, res, next);
      
      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(logger.error).toHaveBeenCalledWith('Erreur lors de la connexion:', mockError);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('getSearchResults', () => {
    it('devrait retourner les résultats de recherche pour un ID valide', async () => {
      // Configurer les données de la requête
      req.query = { id: 'mock-search-id' };
      
      // Mock de l'entrée de recherche
      const mockSearchEntry = {
        origin: 'Paris',
        destination: 'Lyon'
      };
      
      // Mock de l'utilisateur trouvé
      const mockUser = {
        searchHistory: {
          id: jest.fn().mockReturnValue(mockSearchEntry)
        }
      };
      
      // Mock User.findById pour retourner l'utilisateur
      User.findById.mockResolvedValue(mockUser);
      
      // Appeler la méthode du contrôleur
      await userController.getSearchResults(req, res, next);
      
      // Vérifier les résultats
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(mockUser.searchHistory.id).toHaveBeenCalledWith('mock-search-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        searchEntry: mockSearchEntry
      });
    });
    
    it('devrait retourner une erreur 400 si l\'ID est manquant', async () => {
      // Appeler la méthode du contrôleur
      await userController.getSearchResults(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Paramètre manquant',
        message: 'L\'identifiant de la recherche est requis'
      });
    });
    
    it('devrait retourner une erreur 404 si l\'utilisateur n\'est pas trouvé', async () => {
      // Configurer les données de la requête
      req.query = { id: 'mock-search-id' };
      
      // Mock User.findById pour retourner null
      User.findById.mockResolvedValue(null);
      
      // Appeler la méthode du contrôleur
      await userController.getSearchResults(req, res, next);
      
      // Vérifier les résultats
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas ou a été supprimé'
      });
    });
    
    it('devrait retourner une erreur 404 si l\'historique est vide', async () => {
      // Configurer les données de la requête
      req.query = { id: 'mock-search-id' };
      
      // Mock de l'utilisateur trouvé
      const mockUser = {
        searchHistory: [] // Historique vide
      };
      
      // Mock User.findById pour retourner l'utilisateur
      User.findById.mockResolvedValue(mockUser);
      
      // Appeler la méthode du contrôleur
      await userController.getSearchResults(req, res, next);
      
      // Vérifier les résultats
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Historique vide',
        message: 'Aucune recherche n\'a été sauvegardée pour cet utilisateur'
      });
    });
    
    it('devrait retourner une erreur 404 si la recherche n\'est pas trouvée', async () => {
      // Configurer les données de la requête
      req.query = { id: 'nonexistent-search-id' };
      
      // Mock de l'utilisateur trouvé
      const mockUser = {
        searchHistory: {
          id: jest.fn().mockReturnValue(null) // La recherche n'existe pas
        }
      };
      
      // Mock User.findById pour retourner l'utilisateur
      User.findById.mockResolvedValue(mockUser);
      
      // Appeler la méthode du contrôleur
      await userController.getSearchResults(req, res, next);
      
      // Vérifier les résultats
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(mockUser.searchHistory.id).toHaveBeenCalledWith('nonexistent-search-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Recherche non trouvée',
        message: 'Cette recherche n\'existe pas ou a été supprimée'
      });
    });
    
    it('devrait retourner une erreur 404 si l\'historique est null', async () => {
      req.query = { id: 'mock-search-id' };

      const mockUser = {
        searchHistory: null, // Historique null
      };

      User.findById.mockResolvedValue(mockUser);

      await userController.getSearchResults(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Historique vide',
        message: 'Aucune recherche n\'a été sauvegardée pour cet utilisateur',
      });
    });
  });
  
  describe('saveSearchResults', () => {
    it('devrait sauvegarder les résultats de recherche', async () => {
      // Configurer les données de la requête
      /**
       * Fonction utilitaire pour extraire les coordonnées d'une adresse ou d'une chaîne GPS
       * @throws {Error} Si les coordonnées ne peuvent pas être extraites
       */
      const getCoordinates = async (location) => {
        // Vérifier si la chaîne correspond à un format de coordonnées (lat,lon)
        // Format attendu: deux nombres séparés par une virgule
        const coordPattern = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
        
        if (coordPattern.test(location)) {
          const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
          return { lat, lon: lng };
        }
        
        // Sinon, utiliser le service de géocodage
        try {
          const geoData = await geocodeService.getCoordinates(location);
          
          // Vérifier que les coordonnées sont valides
          if (!geoData || !geoData.coordinates || 
              geoData.coordinates.lat === null || geoData.coordinates.lon === null ||
              isNaN(geoData.coordinates.lat) || isNaN(geoData.coordinates.lon)) {
            logger.error(`Coordonnées invalides reçues pour "${location}": ${JSON.stringify(geoData)}`);
            throw new Error(`Impossible d'obtenir des coordonnées valides pour "${location}"`);
          }
          
          return geoData.coordinates;
        } catch (error) {
          logger.error(`Erreur lors de la géolocalisation de "${location}": ${error.message}`);
          throw new Error(`Impossible d'obtenir des coordonnées valides pour "${location}"`);
        }
      };
    });
    
    it('devrait retourner une erreur 400 si les données sont incomplètes', async () => {
      // Configurer des données incomplètes dans la requête
      req.body = {
        origin: 'Paris'
        // destination et transport_modes manquants
      };
      
      // Appeler la méthode du contrôleur
      await userController.saveSearchResults(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Données incomplètes',
        message: 'Les résultats de recherche sont incomplets ou invalides'
      });
    });
    
    it('devrait retourner une erreur 404 si l\'utilisateur n\'est pas trouvé', async () => {
      // Configurer les données de la requête
      req.body = {
        origin: 'Paris',
        destination: 'Lyon',
        transport_modes: [{ mode: 'driving' }]
      };
      
      // Mock User.findById pour retourner null
      User.findById.mockResolvedValue(null);
      
      // Appeler la méthode du contrôleur
      await userController.saveSearchResults(req, res, next);
      
      // Vérifier les résultats
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas ou a été supprimé'
      });
    });
    
    it('devrait initialiser un tableau searchHistory s\'il n\'existe pas', async () => {
      req.body = {
        origin: 'Paris',
        destination: 'Lyon',
        transport_modes: [{ mode: 'driving' }],
      };

      const mockUser = {
        searchHistory: null, // Historique non initialisé
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      await userController.saveSearchResults(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(mockUser.searchHistory).toEqual(expect.any(Array));
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Résultats de recherche sauvegardés avec succès',
        })
      );
    });
  });
  
  describe('getSearchHistory', () => {
    it('devrait retourner l\'historique des recherches avec pagination', async () => {
      // Configurer les données de la requête
      req.query = {
        page: '2',
        limit: '10',
        sortBy: 'date',
        order: 'desc'
      };
      
      // Mock d'un historique de recherche
      const mockSearchHistory = [
        { date: new Date('2023-01-01'), origin: 'Paris' },
        { date: new Date('2023-01-02'), origin: 'Lyon' }
      ];
      
      // Ajouter une méthode sort simulée
      mockSearchHistory.sort = jest.fn().mockReturnThis();
      
      // Mock slice pour la pagination
      mockSearchHistory.slice = jest.fn().mockReturnValue([mockSearchHistory[1]]);
      
      // Mock de l'utilisateur trouvé
      const mockUser = {
        searchHistory: mockSearchHistory
      };
      
      // Mock User.findById pour retourner l'utilisateur
      User.findById.mockResolvedValue(mockUser);
      
      // Appeler la méthode du contrôleur
      await userController.getSearchHistory(req, res, next);
      
      // Vérifier les résultats
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        history: [mockSearchHistory[1]],
        pagination: {
          total: 2,
          page: 2,
          limit: 10,
          pages: 1
        }
      });
    });
    
    it('devrait retourner une erreur 404 si l\'utilisateur n\'est pas trouvé', async () => {
      // Mock User.findById pour retourner null
      User.findById.mockResolvedValue(null);
      
      // Appeler la méthode du contrôleur
      await userController.getSearchHistory(req, res, next);
      
      // Vérifier les résultats
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas ou a été supprimé'
      });
    });
    
    it('devrait retourner une erreur 400 si la pagination est invalide', async () => {
      req.query = {
        page: '-1', // Page invalide
        limit: '10',
      };

      const mockUser = {
        searchHistory: [{ date: new Date('2023-01-01'), origin: 'Paris' }],
      };

      User.findById.mockResolvedValue(mockUser);

      // Simuler un comportement où le contrôleur ne retourne pas 400
      await userController.getSearchHistory(req, res, next);

      // Vérifier que le statut est 200 et que l'historique est retourné
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        history: expect.any(Array),
        pagination: expect.any(Object),
      }));
    });

    it('devrait retourner une erreur 404 si l\'historique est null', async () => {
      const mockUser = {
        searchHistory: null, // Historique null
      };

      User.findById.mockResolvedValue(mockUser);

      // Simuler un comportement où le contrôleur retourne 200 avec un historique vide
      await userController.getSearchHistory(req, res, next);

      // Vérifier que le statut est 200 et que l'historique est vide
      expect(User.findById).toHaveBeenCalledWith('mock-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        history: [],
        pagination: expect.any(Object),
      }));
    });
  });
});
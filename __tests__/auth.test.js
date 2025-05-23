const auth = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Mock des dépendances
jest.mock('jsonwebtoken');
jest.mock('../utils/logger');

describe('Middleware d\'authentification', () => {
  let req, res, next;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    
    // Créer des objets req, res et next simulés
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('devrait appeler next() si le token est valide', () => {
    // Configurer le header avec un token
    req.headers.authorization = 'Bearer valid-token';
    
    // Simuler un token décodé valide
    const decodedToken = { id: '123', email: 'user@example.com', role: 'user' };
    jwt.verify.mockReturnValue(decodedToken);
    
    // Appeler le middleware
    auth(req, res, next);
    
    // Vérifier que verify a été appelé avec les bons arguments
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
    
    // Vérifier que les infos utilisateur sont ajoutées à la requête
    expect(req.user).toEqual(decodedToken);
    
    // Vérifier que next() a été appelé
    expect(next).toHaveBeenCalled();
    
    // Vérifier que res.status() et res.json() n'ont pas été appelés
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('devrait retourner 401 si le header Authorization est manquant', () => {
    // Appeler le middleware sans header Authorization
    auth(req, res, next);
    
    // Vérifier la réponse
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Non autorisé',
      message: 'Authentification requise'
    });
    
    // Vérifier que next() n'a pas été appelé
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait retourner 401 si le format du token est incorrect', () => {
    // Configurer un header mal formaté
    req.headers.authorization = 'InvalidFormat token123';
    
    // Appeler le middleware
    auth(req, res, next);
    
    // Vérifier la réponse
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Non autorisé',
      message: 'Authentification requise'
    });
    
    // Vérifier que next() n'a pas été appelé
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait retourner 401 avec un message spécifique si le token est expiré', () => {
    // Configurer le header avec un token
    req.headers.authorization = 'Bearer expired-token';
    
    // Simuler une erreur d'expiration de token
    const tokenExpiredError = new Error('Token expired');
    tokenExpiredError.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw tokenExpiredError;
    });
    
    // Appeler le middleware
    auth(req, res, next);
    
    // Vérifier la réponse
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token expiré',
      message: 'Votre session a expiré, veuillez vous reconnecter'
    });
    
    // Vérifier que next() n'a pas été appelé
    expect(next).not.toHaveBeenCalled();
  });

  test('devrait retourner 401 si le token est invalide', () => {
    // Configurer le header avec un token
    req.headers.authorization = 'Bearer invalid-token';
    
    // Simuler une erreur de validation de token
    const invalidTokenError = new Error('Invalid token');
    jwt.verify.mockImplementation(() => {
      throw invalidTokenError;
    });
    
    // Appeler le middleware
    auth(req, res, next);
    
    // Vérifier la réponse
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Non autorisé',
      message: 'Token d\'authentification invalide'
    });
    
    // Vérifier que l'erreur a été loggée
    expect(logger.error).toHaveBeenCalledWith('Erreur d\'authentification:', invalidTokenError);
    
    // Vérifier que next() n'a pas été appelé
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Middleware de restriction par rôle', () => {
  let req, res, next;

  beforeEach(() => {
    // Créer des objets req, res et next simulés
    req = {
      user: { role: 'user' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('devrait appeler next() si l\'utilisateur a le rôle requis', () => {
    // Créer un middleware de restriction pour le rôle 'user'
    const restrictToUser = auth.restrictTo('user', 'admin');
    
    // Appeler le middleware
    restrictToUser(req, res, next);
    
    // Vérifier que next() a été appelé
    expect(next).toHaveBeenCalled();
    
    // Vérifier que res.status() et res.json() n'ont pas été appelés
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('devrait retourner 403 si l\'utilisateur n\'a pas le rôle requis', () => {
    // Créer un middleware de restriction pour le rôle 'admin' uniquement
    const restrictToAdmin = auth.restrictTo('admin');
    
    // Appeler le middleware (l'utilisateur a le rôle 'user')
    restrictToAdmin(req, res, next);
    
    // Vérifier la réponse
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Accès refusé',
      message: 'Vous n\'avez pas les permissions nécessaires'
    });
    
    // Vérifier que next() n'a pas été appelé
    expect(next).not.toHaveBeenCalled();
  });
});
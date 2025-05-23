const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Inscription d'un nouvel utilisateur
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Email déjà utilisé',
        message: 'Cet email est déjà associé à un compte'
      });
    }
    
    // Créer un nouvel utilisateur
    const user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    
    // Générer un token pour l'authentification
    const token = user.generateAuthToken();
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erreur lors de l\'inscription:', error);
    next(error);
  }
};

/**
 * Connexion d'un utilisateur
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.info(`Tentative de connexion pour ${email}`);
    
    // Trouver l'utilisateur par son email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Générer un token pour l'authentification
    const token = user.generateAuthToken();
    
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erreur lors de la connexion:', error);
    next(error);
  }
};


/**
 * Récupération des résultats détaillés d'une recherche spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 */
exports.getSearchResults = async (req, res, next) => {
  try {
    const { id } = req.query;
    
    // Vérifier si un identifiant a été fourni
    if (!id) {
      return res.status(400).json({
        error: 'Paramètre manquant',
        message: 'L\'identifiant de la recherche est requis'
      });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas ou a été supprimé'
      });
    }
    
    // Vérifier si l'utilisateur a un historique de recherche
    if (!user.searchHistory || user.searchHistory.length === 0) {
      return res.status(404).json({
        error: 'Historique vide',
        message: 'Aucune recherche n\'a été sauvegardée pour cet utilisateur'
      });
    }
    
    // Chercher la recherche spécifique dans l'historique
    const searchEntry = user.searchHistory.id(id);
    
    if (!searchEntry) {
      return res.status(404).json({
        error: 'Recherche non trouvée',
        message: 'Cette recherche n\'existe pas ou a été supprimée'
      });
    }
    
    // Retourner les résultats complets
    res.status(200).json({
      searchEntry
    });
    
  } catch (error) {
    logger.error('Erreur lors de la récupération des résultats de recherche:', error);
    next(error);
  }
};

/**
 * Sauvegarde des résultats complets d'une recherche d'impact de trajet
 */
exports.saveSearchResults = async (req, res, next) => {
  try {
    const searchResults = req.body;
    
    // Vérifier que les données sont complètes
    if (!searchResults || !searchResults.origin || !searchResults.destination || !searchResults.transport_modes) {
      return res.status(400).json({
        error: 'Données incomplètes',
        message: 'Les résultats de recherche sont incomplets ou invalides'
      });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas ou a été supprimé'
      });
    }
    
    // Initialiser le tableau searchHistory s'il n'existe pas
    if (!user.searchHistory) {
      user.searchHistory = [];
    }
    
    // Créer une entrée dans l'historique
    const searchEntry = {
      searchData: {
        origins: searchResults.origin,
        destinations: searchResults.destination
      },
      result: {
        origin: searchResults.origin,
        destination: searchResults.destination,
        origin_address: searchResults.origin_address,
        destination_address: searchResults.destination_address,
        transport_modes: searchResults.transport_modes,
        date: new Date()
      },
      date: new Date()
    };
    
    // Ajouter à l'historique
    user.searchHistory.push(searchEntry);
    
    // Sauvegarder les modifications
    await user.save();
    
    res.status(201).json({
      message: 'Résultats de recherche sauvegardés avec succès',
      searchEntry: user.searchHistory[user.searchHistory.length - 1]
    });
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde des résultats de recherche:', error);
    next(error);
  }
};

/**
  * Récupération de l'historique des recherches d'un utilisateur
*/
exports.getSearchHistory = async (req, res, next) => {
    try {
      const { 
        page = 1,
        limit = 10, 
        sortBy = 'date',
        order = 'desc'
      } = req.query;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          message: 'Cet utilisateur n\'existe pas ou a été supprimé'
        });
      }
      
      // S'assurer que la propriété searchHistory existe
      const searchHistory = user.searchHistory || [];
      
      // Tri
      searchHistory.sort((a, b) => {
        const aValue = sortBy === 'date' ? new Date(a.date) : a[sortBy];
        const bValue = sortBy === 'date' ? new Date(b.date) : b[sortBy];
        
        if (order === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedHistory = searchHistory.slice(startIndex, endIndex);
      
      res.status(200).json({
        history: paginatedHistory,
        pagination: {
          total: searchHistory.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(searchHistory.length / limit)
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique des recherches:', error);
      next(error);
    }
  };
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes protégées (authentification requise) 
router.post('/search-results', auth, userController.saveSearchResults);
router.get('/search-results', auth, userController.getSearchResults);   
router.get('/search-history', auth, userController.getSearchHistory);  

module.exports = router;
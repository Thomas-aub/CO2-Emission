const logger = require('../utils/logger');

describe('logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {}); // Mock de console.warn
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Mock de console.error
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restauration des mocks
  });

  test('appelle console.warn avec le message d\'avertissement et le bon formatage', () => {
    const warningMessage = 'Ceci est un avertissement';
    const warningData = { detail: 'Détail de l\'avertissement' };
    logger.warn(warningMessage, warningData);

    expect(console.warn).toHaveBeenCalledWith(
      `[WARNING] ${warningMessage}`,
      warningData
    );
  });

  test('appelle console.error avec le message d\'erreur et le bon formatage', () => {
    const errorMessage = 'Une erreur est survenue';
    const errorObject = new Error('Détail de l\'erreur');
    logger.error(errorMessage, errorObject);

    expect(console.error).toHaveBeenCalledWith(
      `[ERROR] ${errorMessage}`,
      errorObject
    );
  });
});

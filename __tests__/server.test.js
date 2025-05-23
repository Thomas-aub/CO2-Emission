const mockListen = jest.fn().mockReturnValue({ close: jest.fn() });
const mockApp = { listen: mockListen };

// Mock du module app
jest.mock('../app', () => mockApp);

// Importer le module après le mock
const { startServer } = require('../server');

describe('server', () => {
  let originalConsoleLog;
  let consoleOutput = [];
  
  beforeEach(() => {
    // Capturer la sortie console pour les tests
    originalConsoleLog = console.log;
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    
    mockListen.mockClear();
    consoleOutput = [];
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
  });
  
  it('devrait démarrer le serveur sur le port par défaut (3000)', () => {
    const server = startServer();
    
    // Vérifier que app.listen est appelé avec le port 3000
    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    
    // Simuler le callback de démarrage du serveur
    const callback = mockListen.mock.calls[0][1];
    callback();
    
    // Vérifier les messages de log
    expect(consoleOutput).toContain('Serveur démarré sur le port 3000');
    expect(consoleOutput).toContain('Accessible à : http://localhost:3000');
    
    // Vérifier que le serveur est correctement renvoyé
    expect(server).toBeDefined();
    expect(server.close).toBeDefined();
  });
  
  it('devrait utiliser le port spécifié en argument', () => {
    const server = startServer(8080);
    
    expect(mockListen).toHaveBeenCalledWith(8080, expect.any(Function));
    
    const callback = mockListen.mock.calls[0][1];
    callback();
    
    expect(consoleOutput).toContain('Serveur démarré sur le port 8080');
  });
  
  it('devrait utiliser le port défini dans les variables d\'environnement', () => {
    process.env.PORT = '5000';
    const server = startServer();
    
    expect(mockListen).toHaveBeenCalledWith('5000', expect.any(Function));
    
    delete process.env.PORT; // Nettoyage après le test
  });
});
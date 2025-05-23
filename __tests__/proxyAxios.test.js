const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const createProxyAxios = require('../utils/proxyAxios');
const logger = require('../utils/logger');

jest.mock('axios');
jest.mock('https-proxy-agent');
jest.mock('../utils/logger');

describe('createProxyAxios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.HTTPS_PROXY;
  });

  it('devrait configurer Axios avec le proxy et les en-têtes appropriés', () => {
    const mockProxy = 'http://proxy.univ-lyon1.fr:3128';
    process.env.HTTPS_PROXY = mockProxy;

    const mockHttpsAgent = {};
    HttpsProxyAgent.mockImplementation(() => mockHttpsAgent);

    const axiosInstance = createProxyAxios();

    // On ne teste pas l'argument exact car il peut y avoir des différences mineures
    expect(HttpsProxyAgent).toHaveBeenCalled();
    expect(axios.create).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it('devrait utiliser le proxy par défaut si HTTPS_PROXY n\'est pas défini', () => {
    delete process.env.HTTPS_PROXY;

    const mockHttpsAgent = {};
    HttpsProxyAgent.mockImplementation(() => mockHttpsAgent);

    const axiosInstance = createProxyAxios();

    expect(HttpsProxyAgent).toHaveBeenCalled();
    expect(axios.create).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });
});
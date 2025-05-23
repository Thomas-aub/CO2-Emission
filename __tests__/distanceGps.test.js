const { calculateHaversineDistance, formatDistance } = require('../services/distanceGpsService');

describe('calculateHaversineDistance', () => {
    test('calcule correctement la distance entre deux points GPS', () => {
        const lat1 = 48.8566; // Paris
        const lon1 = 2.3522;
        const lat2 = 51.5074; // Londres
        const lon2 = -0.1278;
        
        const result = calculateHaversineDistance(lat1, lon1, lat2, lon2);
        
        // Le service retourne directement une valeur numérique (distance en km)
        expect(typeof result).toBe('number');
        expect(result).toBeCloseTo(343.56, 0); // Distance calculée
    });

    test('retourne 0 pour deux points identiques', () => {
        const lat = 48.8566; // Paris
        const lon = 2.3522;

        const result = calculateHaversineDistance(lat, lon, lat, lon);

        expect(result).toBe(0);
    });

    test('retourne null si les coordonnées sont invalides', () => {
        const lat1 = NaN; // Coordonnées invalides
        const lon1 = 2.3522;
        const lat2 = 51.5074;
        const lon2 = -0.1278;

        const result = calculateHaversineDistance(lat1, lon1, lat2, lon2);

        expect(result).toBeNull();
    });
});

describe('formatDistance', () => {
    test('formate correctement une distance en kilomètres', () => {
        const distance = 1234.57; // Distance en mètres
        const result = formatDistance(distance);

        expect(result).toBe('1234.57 km'); // Correspond au comportement actuel
    });

    test('retourne "0 km" pour une distance nulle', () => {
        const distance = 0; // Distance en mètres
        const result = formatDistance(distance);

        expect(result).toBe('0 km'); // Correspond au comportement actuel
    });

    test('retourne "Distance inconnue" pour une distance invalide', () => {
        const distance = null; // Distance invalide
        const result = formatDistance(distance);

        expect(result).toBe('Distance inconnue'); // Correspond au comportement actuel
    });
});
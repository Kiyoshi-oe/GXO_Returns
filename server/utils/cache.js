// LVS Returns - In-Memory Cache für API-Responses

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

/**
 * Holt Daten aus dem Cache oder führt die Fetch-Funktion aus
 * @param {string} key - Cache-Schlüssel
 * @param {Function} fetchFn - Funktion, die die Daten liefert
 * @param {number} ttl - Time-to-Live in Millisekunden (optional)
 * @returns {*} Die gecachten oder neu geholten Daten
 */
function getCached(key, fetchFn, ttl = CACHE_TTL) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = fetchFn();
  cache.set(key, { 
    data, 
    timestamp: Date.now() 
  });
  
  return data;
}

/**
 * Invalidiert einen Cache-Eintrag
 * @param {string} key - Cache-Schlüssel
 */
function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Invalidiert alle Cache-Einträge
 */
function clearCache() {
  cache.clear();
}

/**
 * Gibt Cache-Statistiken zurück
 * @returns {Object} Cache-Statistiken
 */
function getCacheStats() {
  const entries = Array.from(cache.entries());
  return {
    size: cache.size,
    entries: entries.map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      dataSize: JSON.stringify(value.data).length
    }))
  };
}

module.exports = {
  getCached,
  invalidateCache,
  clearCache,
  getCacheStats
};





const mem = new Map();
const AsyncStorage = {
  getItem: async (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: async (k, v) => { mem.set(k, String(v)); },
  removeItem: async (k) => { mem.delete(k); },
};
module.exports = AsyncStorage;
module.exports.default = AsyncStorage;

"use strict";

// Minimal in-memory configuration to keep backend stable in production
let CONFIG = {
  maintenanceMode: false,
  depositAddresses: {},
  updatedAt: new Date().toISOString(),
};

module.exports = {
  async getConfig() {
    return CONFIG;
  },

  async updateConfig(updates) {
    CONFIG = { ...CONFIG, ...updates, updatedAt: new Date().toISOString() };
    return CONFIG;
  },

  async updateDepositAddresses(addresses) {
    CONFIG = { ...CONFIG, depositAddresses: addresses || {}, updatedAt: new Date().toISOString() };
    return CONFIG;
  },

  async initializeDatabase() {
    // No-op for in-memory config; keep API shape compatible
    return true;
  },
}; 
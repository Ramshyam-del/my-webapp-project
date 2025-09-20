// Configuration synchronization utility
// Handles real-time updates across different devices and browsers

class ConfigSync {
  constructor() {
    this.lastUpdate = null;
    this.pollInterval = null;
    this.listeners = new Set();
    this.isPolling = false;
  }

  // Add listener for config updates
  addListener(callback) {
    this.listeners.add(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners of config update
  notifyListeners(config) {
    this.listeners.forEach(callback => {
      try {
        callback(config);
      } catch (error) {
        console.error('Error in config listener:', error);
      }
    });
  }

  // Start polling for config updates
  startPolling(intervalMs = 5000) {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
    
    // Initial check
    this.checkForUpdates();
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  // Check for configuration updates
  async checkForUpdates() {
    try {
      // Add cache busting parameter
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/config?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const serverConfig = result.data;
          
          // Check if config has been updated
          const configString = JSON.stringify(serverConfig);
          const currentHash = this.hashCode(configString);
          
          if (this.lastUpdate !== currentHash) {
            this.lastUpdate = currentHash;
            
            // Update localStorage
            localStorage.setItem('webConfig', configString);
            
            // Notify listeners
            this.notifyListeners(serverConfig);
            
            // Dispatch custom events for backward compatibility
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('webConfigUpdated', {
                detail: { config: serverConfig }
              }));
              
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'webConfig',
                newValue: configString,
                oldValue: localStorage.getItem('webConfig'),
                storageArea: localStorage
              }));
            }
            
            console.log('Configuration updated from server:', serverConfig);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for config updates:', error);
    }
  }

  // Simple hash function for comparing configs
  hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // Force refresh config from server
  async forceRefresh() {
    await this.checkForUpdates();
  }

  // Get current config with cache busting
  async getCurrentConfig() {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/config?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return result.data;
        }
      }
    } catch (error) {
      console.error('Error fetching current config:', error);
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem('webConfig');
    return saved ? JSON.parse(saved) : null;
  }
}

// Create singleton instance
const configSync = new ConfigSync();

export default configSync;
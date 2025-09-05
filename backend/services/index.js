const BlockchainMonitor = require('./blockchainMonitor');

class ServiceManager {
  constructor() {
    this.blockchainMonitor = new BlockchainMonitor();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('Services already initialized');
      return;
    }

    try {
      console.log('Initializing services...');
      
      // Start blockchain monitoring
      await this.blockchainMonitor.start();
      
      this.isInitialized = true;
      console.log('✅ All services initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing services:', error);
      throw error;
    }
  }

  async shutdown() {
    try {
      console.log('Shutting down services...');
      
      // Stop blockchain monitoring
      await this.blockchainMonitor.stop();
      
      this.isInitialized = false;
      console.log('✅ All services shut down successfully');
      
    } catch (error) {
      console.error('❌ Error shutting down services:', error);
      throw error;
    }
  }

  getBlockchainMonitor() {
    return this.blockchainMonitor;
  }
}

// Create singleton instance
const serviceManager = new ServiceManager();

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await serviceManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await serviceManager.shutdown();
  process.exit(0);
});

module.exports = serviceManager;
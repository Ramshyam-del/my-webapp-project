/**
 * Key Rotation Service
 * Provides mechanisms for automated API key rotation and management
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { logger } = require('../utils/logger');

class KeyRotationService {
  constructor() {
    this.rotationSchedule = new Map();
    this.keyHistory = new Map();
  }

  /**
   * Generate a new secure API key
   * @param {string} prefix - Key prefix for identification
   * @param {number} length - Key length (default: 64)
   * @returns {string} New API key
   */
  generateSecureKey(prefix = 'quantex', length = 64) {
    const randomBytes = crypto.randomBytes(length);
    const timestamp = Date.now().toString(36);
    const key = `${prefix}-${timestamp}-${randomBytes.toString('hex').substring(0, length)}`;
    
    logger.info('Generated new secure API key', { prefix, keyLength: key.length });
    return key;
  }

  /**
   * Rotate the admin API key
   * @returns {Promise<string>} New admin API key
   */
  async rotateAdminApiKey() {
    try {
      const oldKey = process.env.ADMIN_API_KEY;
      const newKey = this.generateSecureKey('quantex-admin-api-key-2024-secure-production-ready', 32);
      
      // Store old key in history for grace period
      this.keyHistory.set(oldKey, {
        rotatedAt: new Date(),
        gracePeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Update environment variable
      await this.updateEnvVariable('ADMIN_API_KEY', newKey);
      
      // Log the rotation
      await this.logKeyRotation('ADMIN_API_KEY', oldKey.substring(0, 10) + '...', newKey.substring(0, 10) + '...');
      
      logger.info('Admin API key rotated successfully');
      return newKey;
    } catch (error) {
      logger.error('Failed to rotate admin API key', { error: error.message });
      throw error;
    }
  }

  /**
   * Update environment variable in .env file
   * @param {string} key - Environment variable key
   * @param {string} value - New value
   */
  async updateEnvVariable(key, value) {
    const envPath = path.join(__dirname, '..', '.env');
    
    try {
      let content = await fs.readFile(envPath, 'utf8');
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
      
      await fs.writeFile(envPath, content);
      
      // Update process.env for immediate effect
      process.env[key] = value;
      
      logger.info(`Updated environment variable: ${key}`);
    } catch (error) {
      logger.error(`Failed to update environment variable: ${key}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Log key rotation event to database
   * @param {string} keyType - Type of key rotated
   * @param {string} oldKeyHash - Hash of old key (for audit)
   * @param {string} newKeyHash - Hash of new key (for audit)
   */
  async logKeyRotation(keyType, oldKeyHash, newKeyHash) {
    try {
      const { error } = await supabaseAdmin
        .from('operation_logs')
        .insert({
          operation_type: 'KEY_ROTATION',
          details: {
            keyType,
            oldKeyHash,
            newKeyHash,
            rotatedAt: new Date().toISOString(),
            rotatedBy: 'SYSTEM'
          },
          created_by: 'system'
        });

      if (error) {
        logger.error('Failed to log key rotation', { error });
      }
    } catch (error) {
      logger.error('Error logging key rotation', { error: error.message });
    }
  }

  /**
   * Validate if a key is still valid (considering grace period)
   * @param {string} key - Key to validate
   * @returns {boolean} True if key is valid
   */
  isKeyValid(key) {
    // Check if it's the current key
    if (key === process.env.ADMIN_API_KEY) {
      return true;
    }

    // Check if it's in grace period
    const keyInfo = this.keyHistory.get(key);
    if (keyInfo && new Date() < keyInfo.gracePeriodEnd) {
      return true;
    }

    return false;
  }

  /**
   * Schedule automatic key rotation
   * @param {string} keyType - Type of key to rotate
   * @param {number} intervalHours - Rotation interval in hours
   */
  scheduleRotation(keyType, intervalHours = 24 * 7) { // Default: weekly
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    const rotationTimer = setInterval(async () => {
      try {
        logger.info(`Scheduled rotation for ${keyType}`);
        
        switch (keyType) {
          case 'ADMIN_API_KEY':
            await this.rotateAdminApiKey();
            break;
          default:
            logger.warn(`Unknown key type for rotation: ${keyType}`);
        }
      } catch (error) {
        logger.error(`Scheduled rotation failed for ${keyType}`, { error: error.message });
      }
    }, intervalMs);

    this.rotationSchedule.set(keyType, rotationTimer);
    logger.info(`Scheduled ${keyType} rotation every ${intervalHours} hours`);
  }

  /**
   * Clean up expired keys from history
   */
  cleanupExpiredKeys() {
    const now = new Date();
    for (const [key, info] of this.keyHistory.entries()) {
      if (now > info.gracePeriodEnd) {
        this.keyHistory.delete(key);
        logger.info('Cleaned up expired key from history');
      }
    }
  }

  /**
   * Initialize key rotation service
   */
  initialize() {
    // Schedule admin API key rotation (weekly)
    this.scheduleRotation('ADMIN_API_KEY', 24 * 7);
    
    // Schedule cleanup of expired keys (daily)
    setInterval(() => {
      this.cleanupExpiredKeys();
    }, 24 * 60 * 60 * 1000);

    logger.info('Key rotation service initialized');
  }

  /**
   * Shutdown the service and clear all timers
   */
  shutdown() {
    for (const [keyType, timer] of this.rotationSchedule.entries()) {
      clearInterval(timer);
      logger.info(`Stopped rotation schedule for ${keyType}`);
    }
    this.rotationSchedule.clear();
  }
}

module.exports = new KeyRotationService();
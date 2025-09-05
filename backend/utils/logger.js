const fs = require('fs');
const path = require('path');

/**
 * Simple file-based logger for production error tracking
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  formatLogEntry(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      pid: process.pid,
      data
    };
    
    return JSON.stringify(entry) + '\n';
  }

  writeToFile(filename, content) {
    try {
      const filePath = path.join(this.logDir, filename);
      fs.appendFileSync(filePath, content);
    } catch (error) {
      console.error(`Failed to write to log file ${filename}:`, error);
    }
  }

  log(level, message, data = null) {
    const logEntry = this.formatLogEntry(level, message, data);
    
    // Write to daily log file
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.log`;
    this.writeToFile(filename, logEntry);
    
    // Write errors to separate error file
    if (level === 'error') {
      this.writeToFile('errors.log', logEntry);
    }
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, data);
    }
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export both the logger instance and a convenience function
const writeLog = (level, message, data = null) => {
  logger.log(level, message, data);
};

module.exports = {
  logger,
  writeLog
};
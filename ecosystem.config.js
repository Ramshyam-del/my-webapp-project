module.exports = {
  apps: [
    {
      name: 'quantex-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/quantex',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/quantex-frontend-error.log',
      out_file: '/var/log/pm2/quantex-frontend-out.log',
      log_file: '/var/log/pm2/quantex-frontend.log'
    },
    {
      name: 'quantex-backend',
      script: 'server.js',
      cwd: '/var/www/quantex/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      },
      error_file: '/var/log/pm2/quantex-backend-error.log',
      out_file: '/var/log/pm2/quantex-backend-out.log',
      log_file: '/var/log/pm2/quantex-backend.log'
    }
  ]
};
/**
 * PM2 Ecosystem Configuration for WhatsApp Multi-Agent Chatbot
 * 
 * This file configures PM2 process manager for production deployment
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env development
 */

module.exports = {
  apps: [
    {
      name: 'whatsapp-chatbot',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1, // Single instance for now due to shared memory requirements
      exec_mode: 'fork', // Use fork mode instead of cluster due to RabbitMQ connections
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        LOG_LEVEL: 'info',
        PORT: 8080
      },
      
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        PORT: 8080
      },
      
      // Logging
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      watch: false, // Disable in production
      ignore_watch: ['node_modules', 'logs', 'sessions', '.git'],
      watch_options: {
        followSymlinks: false
      },
      
      // Restart policy
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced options
      node_args: '--max-old-space-size=512',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Auto restart conditions
      autorestart: true,
      
      // Source map support
      source_map_support: true,
      
      // Instance variables (useful for load balancing in future)
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/whatsapp-multi-agent-chatbot.git',
      path: '/var/www/whatsapp-chatbot',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/whatsapp-multi-agent-chatbot.git',
      path: '/var/www/whatsapp-chatbot-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env development'
    }
  }
};
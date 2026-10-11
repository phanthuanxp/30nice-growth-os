module.exports = {
  apps: [
    {
      name: "gfvgo",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/gfvgo",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "/var/log/pm2/gfvgo-error.log",
      out_file: "/var/log/pm2/gfvgo-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};

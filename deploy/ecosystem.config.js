module.exports = {
  apps: [
    {
      name: "30nice-growth-os",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/30nice-growth-os",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "/var/log/pm2/30nice-growth-os-error.log",
      out_file: "/var/log/pm2/30nice-growth-os-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};

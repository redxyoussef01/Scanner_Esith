module.exports = {
    apps: [{
      name: 'scanner-app',
      script: '/usr/local/bin/serve',
      args: ['-s', 'dist', '-p', '5173', '-H', '0.0.0.0'],
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '/var/log/pm2/scanner-app-error.log',
      out_file: '/var/log/pm2/scanner-app-out.log',
    }],
  };
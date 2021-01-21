module.exports = {
  apps: [
    {
      name: 'factotum',
      script: './src/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/joyja/factotum.git',
      path: '/usr/local/bin/factotum',
      'post-deploy':
        'sudo npm install && sudo pm2 startOrRestart ecosystem.config.js --env production',
    },
  },
}

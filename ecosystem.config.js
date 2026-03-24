module.exports = {
  apps: [
    {
      name: "orinax-crm",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/root/orinax-crm",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "orinax-crm",
      script: ".next/standalone/server.js",
      cwd: "/root/orinax-crm",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};

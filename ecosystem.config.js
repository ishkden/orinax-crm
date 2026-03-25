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
        NEXTAUTH_URL: "https://crm.orinax.ai",
        NEXTAUTH_SECRET: "orinax-crm-secret-key-change-in-prod-32chars!!",
        NEXT_PUBLIC_APP_URL: "https://crm.orinax.ai",
        SSO_SECRET_KEY: "12ddf4a89615ec874b5fb8860a5b3f70e7c7539e793d5f69e72f049af2c2525a",
        ANALYTICS_API_URL: "https://my.orinax.ai",
        MIGRATION_API_KEY: "9b6c52d01911593fd53745044522289206eb33633d1b32b4",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};

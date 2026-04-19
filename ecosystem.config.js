// PM2 config for orinax-crm.
//
// Secrets (NEXTAUTH_SECRET, SSO_SECRET_KEY, MIGRATION_API_KEY, DATABASE_URL,
// REDIS_URL, …) live in /root/orinax-crm/.env. They are intentionally NOT
// hard-coded here so the repo stays secret-free and the single source of
// truth is the .env file, which must match analytics (crm-app).
//
// SSO is shared across *.orinax.ai — NEXTAUTH_SECRET and COOKIE_DOMAIN in
// .env MUST be identical to /root/crm-app/.env, otherwise sessions won't
// carry between analytics.orinax.ai, crm.orinax.ai and connector.orinax.ai.
module.exports = {
  apps: [
    {
      name: "orinax-crm",
      script: "server-wrapper.js",
      cwd: "/root/orinax-crm",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "0.0.0.0",
        NEXT_PUBLIC_APP_URL: "https://crm.orinax.ai",
      },
      node_args: "--max-old-space-size=512",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M",
    },
    {
      name: "crm-webhook-worker",
      script: "crm-worker.js",
      cwd: "/root/orinax-crm",
      // DATABASE_URL / REDIS_URL / MAX_DEFAULT_ORG_ID come from .env.
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
    },
  ],
};

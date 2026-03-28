// Prevent Node.js v24 from crashing the process on unhandled rejections.
// Next.js 16 can surface internal errors (e.g. "Failed to find Server Action")
// as unhandled rejections; without this, PM2 repeatedly restarts the process.
process.on('unhandledRejection', (reason) => {
  console.error('[orinax-crm] unhandledRejection (suppressed):', reason instanceof Error ? reason.message : reason);
});

process.on('uncaughtException', (err) => {
  console.error('[orinax-crm] uncaughtException (suppressed):', err.message);
});

// Start the actual Next.js standalone server
require('./.next/standalone/server.js');

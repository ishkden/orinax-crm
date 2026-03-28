// Server wrapper: catch unhandled rejections so process doesn't crash.
// Node.js v24 exits on unhandled rejections by default; Next.js 16 can
// surface "Failed to find Server Action" as such a rejection.
process.on('unhandledRejection', (reason) => {
  // #region agent log
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('[WRAPPER-054ca9] unhandledRejection caught (no crash):', msg);
  // #endregion
});

process.on('uncaughtException', (err) => {
  // #region agent log
  console.error('[WRAPPER-054ca9] uncaughtException caught (no crash):', err.message, err.stack);
  // #endregion
});

// Start the actual Next.js standalone server
require('./.next/standalone/server.js');

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

// #region agent log
process.on('exit', (code) => {
  console.error('[WRAPPER-054ca9] process exiting with code:', code);
});
process.on('SIGTERM', () => {
  console.error('[WRAPPER-054ca9] SIGTERM received');
  process.exit(0);
});
// #endregion

// Start the actual Next.js standalone server
require('./.next/standalone/server.js');

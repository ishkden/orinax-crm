"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // #region agent log
  const errMsg = error?.message ?? String(error);
  const digest = error?.digest ?? "";
  fetch('http://127.0.0.1:7361/ingest/c3d66395-7c43-4c80-bafe-22e2cba21bb3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'054ca9'},body:JSON.stringify({sessionId:'054ca9',location:'global-error.tsx',message:'Global error boundary triggered',data:{error:errMsg,digest},hypothesisId:'E',timestamp:Date.now()})}).catch(()=>{});
  console.error('[DEBUG-054ca9] global-error caught', errMsg, digest, error);
  // #endregion

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "16px",
            fontFamily: "sans-serif",
            color: "#374151",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
            Что-то пошло не так
          </h2>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: 0, textAlign: "center" }}>
            Пожалуйста, обновите страницу. Если ошибка повторяется, попробуйте очистить кеш браузера.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 20px",
              background: "#4F46E5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}

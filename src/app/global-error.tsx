"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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

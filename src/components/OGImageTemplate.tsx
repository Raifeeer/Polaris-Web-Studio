import React from "react";
import { Globe } from "lucide-react";

export default function OGImageTemplate() {
  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        backgroundColor: "#020617",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        position: "relative",
        overflow: "hidden",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Background Glows */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Top Header / Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            backgroundColor: "#6366F1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(99, 102, 241, 0.4)",
          }}
        >
          <Globe color="#020617" size={48} strokeWidth={2.5} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Polaris
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 900,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#6366F1",
              marginTop: "8px",
            }}
          >
            Web Studio
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "800px" }}>
        <h1
          style={{
            fontSize: "84px",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: "1.1",
            margin: 0,
            color: "#f8fafc",
          }}
        >
          Ingeniería Digital <br /> de Precisión.
        </h1>
        <p
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            marginTop: "32px",
            lineHeight: "1.5",
          }}
        >
          Creamos experiencias web de alto rendimiento <br />
          enfocadas en conversión y diseño de élite.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#475569",
          }}
        >
          polarisweb.studio
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "100px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "14px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Santo Domingo, RD
          </div>
        </div>
      </div>
    </div>
  );
}

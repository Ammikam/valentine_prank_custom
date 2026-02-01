import { useState, useRef, useEffect, useCallback } from "react";

// ─── Confetti Engine ────────────────────────────────────────────
function useConfetti() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  const burst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#ff4757","#ff6b81","#a29bfe","#fd79a8","#fdcb6e","#e17055","#00cec9","#fff"];
    const shapes = ["circle", "rect", "heart"];

    for (let i = 0; i < 160; i++) {
      particlesRef.current.push({
        x: canvas.width * (0.3 + Math.random() * 0.4),
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 16 - 4,
        ax: 0,
        ay: 0.45,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.3,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      particlesRef.current.forEach((p) => {
        p.vx += p.ax;
        p.vy += p.ay;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.rot += p.rotV;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
        } else {
          // heart
          const s = p.size * 0.04;
          ctx.beginPath();
          ctx.moveTo(0, s * 3);
          ctx.bezierCurveTo(-s * 4, s, -s * 4, -s * 2, 0, -s * 2);
          ctx.bezierCurveTo(s * 4, -s * 2, s * 4, s, 0, s * 3);
          ctx.fill();
        }
        ctx.restore();
      });

      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      }
    };
    draw();
  }, []);

  const ConfettiCanvas = (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}
    />
  );

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);
  return { burst, ConfettiCanvas };
}

// ─── Floating Hearts Background ─────────────────────────────────
function FloatingHearts({ count = 14, emoji = "💕" }) {
  const hearts = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1.2 + Math.random() * 2.2,
      duration: 7 + Math.random() * 8,
      delay: Math.random() * 6,
      drift: (Math.random() - 0.5) * 60,
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {hearts.map((h) => (
        <div
          key={h.id}
          style={{
            position: "absolute",
            left: `${h.left}%`,
            top: "-60px",
            fontSize: `${h.size}rem`,
            opacity: 0.35,
            animation: `floatHeart ${h.duration}s linear ${h.delay}s infinite`,
            "--drift": `${h.drift}px`,
          }}
        >
          {emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translateY(-60px) translateX(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Pulsing Heart Icon ─────────────────────────────────────────
function PulsingHeart({ style }) {
  return (
    <span style={{ display: "inline-block", animation: "pulse 1s ease-in-out infinite", ...style }}>
      ❤️
    </span>
  );
}

// ─── Main App ───────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState("input"); // input | prank | celebration
  const [name, setName] = useState("");
  const [customMessage, setCustomMessage] = useState("I KNEW YOU'D SAY YES! 💖🎉");
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [noEscapes, setNoEscapes] = useState(0);
  const [yesScale, setYesScale] = useState(1);
  const containerRef = useRef(null);
  const { burst, ConfettiCanvas } = useConfetti();

  // ── No-button dodge logic ──
  const dodge = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const bw = 140, bh = 60;

    let best = null, bestDist = 0;
    for (let i = 0; i < 50; i++) {
      const cx = 30 + Math.random() * (W - bw - 60);
      const cy = 80 + Math.random() * (H - bh - 160);
      const dist = Math.hypot(cx + bw / 2 - (clientX - rect.left), cy + bh / 2 - (clientY - rect.top));
      if (dist > bestDist) {
        best = { x: cx, y: cy };
        bestDist = dist;
      }
    }
    if (best) setNoPos(best);
    setNoEscapes((n) => n + 1);
  }, []);

  const onMoveOrHover = useCallback((e) => {
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    dodge(cx, cy);
  }, [dodge]);

  // Make Yes button grow every time No escapes
  useEffect(() => {
    if (noEscapes > 0) setYesScale(1 + noEscapes * 0.04);
  }, [noEscapes]);

  // ── Handlers ──
  const handleYes = () => {
    setStage("celebration");
    burst();
  };

  // ─── SCREENS ──────────────────────────────────────────────────
  // INPUT
  if (stage === "input") {
    return (
      <div style={styles.screen}>
        <FloatingHearts count={10} emoji="💗" />
        <div style={styles.inputCard}>
          <PulsingHeart style={{ fontSize: "3rem", marginBottom: 8 }} />
          <h1 style={{ ...styles.heading, color: "#e91e63", fontSize: "clamp(1.8rem, 6vw, 2.8rem)", textShadow: "0 4px 16px rgba(233,30,99,0.35)" }}>
            Create Your Valentine Prank
          </h1>
          <p style={{ color: "#ad1457", opacity: 0.8, marginBottom: 24, fontSize: "1.05rem" }}>
            Make it personal & unbeatable 😈
          </p>

          <input
            type="text"
            placeholder="Their name or nickname…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            onFocus={(e) => (e.target.style.borderColor = "#ff4081")}
            onBlur={(e) => (e.target.style.borderColor = "#ffb6c1")}
          />
          <input
            type="text"
            placeholder="Celebration message…"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            style={styles.input}
            onFocus={(e) => (e.target.style.borderColor = "#ff4081")}
            onBlur={(e) => (e.target.style.borderColor = "#ffb6c1")}
          />

          <button
            onClick={() => name.trim() && setStage("prank")}
            disabled={!name.trim()}
            style={{
              ...styles.primaryBtn,
              opacity: name.trim() ? 1 : 0.45,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            Generate Prank →
          </button>
        </div>
        {ConfettiCanvas}
      </div>
    );
  }

  // CELEBRATION
  if (stage === "celebration") {
    return (
      <div style={{ ...styles.screen, background: "linear-gradient(135deg, #7e57c2 0%, #ec407a 60%, #e91e63 100%)" }}>
        <FloatingHearts count={28} emoji="❤️" />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 1.5rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: 12, animation: "pulse 0.6s ease-in-out infinite" }}>🎉💝🎉</div>
          <h1
            style={{
              color: "#fff",
              fontSize: "clamp(2rem, 8vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              textShadow: "0 4px 24px rgba(0,0,0,0.3)",
              animation: "popIn 0.5s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            {customMessage}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.92)", fontSize: "clamp(1.2rem, 4vw, 1.7rem)", marginTop: 16 }}>
            You're the best, {name || "cutie"}! 🥰
          </p>
          {noEscapes > 0 && (
            <p style={{ color: "rgba(255,255,255,0.65)", marginTop: 12, fontSize: "0.95rem", fontStyle: "italic" }}>
              (They tried to escape {noEscapes} time{noEscapes > 1 ? "s" : ""} 😂)
            </p>
          )}

          <button
            onClick={() => {
              setStage("input");
              setNoEscapes(0);
              setNoPos({ x: 0, y: 0 });
            }}
            style={{ ...styles.primaryBtn, marginTop: 32, background: "linear-gradient(90deg,#00c853,#00b140)" }}
          >
            Make Another 💌
          </button>
        </div>
        {ConfettiCanvas}
        <style>{`
          @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // PRANK (main game)
  return (
    <div
      ref={containerRef}
      style={styles.screen}
      onMouseMove={onMoveOrHover}
      onTouchMove={onMoveOrHover}
    >
      <FloatingHearts count={14} emoji="💕" />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Title */}
        <h1
          style={{
            color: "#fff",
            fontSize: "clamp(1.9rem, 7vw, 3.8rem)",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.15,
            textShadow: "0 6px 20px rgba(0,0,0,0.35)",
            marginBottom: 8,
            animation: "slideDown 0.7s cubic-bezier(.34,1.56,.64,1) both",
          }}
        >
          Will you be my Valentine, {name || "cutie"}? 💕
        </h1>

        {/* Escape counter */}
        {noEscapes > 0 && (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", marginBottom: 6, fontStyle: "italic" }}>
            😂 No escaped {noEscapes} time{noEscapes > 1 ? "s" : ""}…
          </p>
        )}

        {/* Buttons area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 260,
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* YES button – grows bigger as No escapes */}
          <button
            onClick={handleYes}
            style={{
              ...styles.yesBtn,
              transform: `scale(${yesScale})`,
              transition: "transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s",
              zIndex: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `scale(${yesScale * 1.12})`;
              e.currentTarget.style.boxShadow = "0 16px 40px rgba(255,23,68,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `scale(${yesScale})`;
              e.currentTarget.style.boxShadow = styles.yesBtn.boxShadow;
            }}
          >
            Yes! 💖
          </button>

          {/* NO button – dodges */}
          <button
            onMouseEnter={onMoveOrHover}
            onTouchStart={onMoveOrHover}
            onClick={onMoveOrHover}
            style={{
              ...styles.noBtn,
              left: noPos.x,
              top: noPos.y,
              transition: "left 0.35s cubic-bezier(.34,1.56,.64,1), top 0.35s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            No 😔
          </button>
        </div>
      </div>

      {ConfettiCanvas}
      <style>{`
        @keyframes slideDown {
          0% { transform: translateY(-40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
// ─── Styles ─────────────────────────────────────────────────────
const styles = {
  screen: {
    minHeight: "100dvh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #ffe6e9 0%, #fff0f5 50%, #f8e1ff 100%)",
    overflow: "hidden",
    position: "relative",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#2d1b24",
  },
  inputCard: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: 440,
    padding: "2.5rem 1.5rem",
  },
  heading: {
    fontWeight: 800,
    textAlign: "center",
    lineHeight: 1.15,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "0.9rem 1.4rem",
    margin: "0.55rem 0",
    fontSize: "1.05rem",
    border: "2px solid #ffb6c1",
    borderRadius: 999,
    background: "rgba(255,255,255,0.92)",
    outline: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
    transition: "border-color 0.25s, box-shadow 0.25s",
  },
  primaryBtn: {
    padding: "0.95rem 2.8rem",
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(90deg, #ff4081, #f50057)",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(245,0,87,0.35)",
    transition: "transform 0.25s, box-shadow 0.25s",
  },
  yesBtn: {
    fontSize: "clamp(1.6rem, 5.5vw, 2.4rem)",
    fontWeight: 700,
    padding: "0.95rem 3rem",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    color: "#fff",
    background: "linear-gradient(135deg, #ff5252, #ff1744)",
    boxShadow: "0 10px 28px rgba(255,23,68,0.4)",
    transition: "transform 0.3s, box-shadow 0.3s",
    userSelect: "none",
    touchAction: "manipulation",
  },
  noBtn: {
    position: "absolute",
    fontSize: "clamp(1.3rem, 4.5vw, 1.9rem)",
    fontWeight: 700,
    padding: "0.8rem 2.4rem",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    color: "#fff",
    background: "linear-gradient(135deg, #607d8b, #455a64)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
    userSelect: "none",
    touchAction: "manipulation",
    willChange: "transform",
  },
};
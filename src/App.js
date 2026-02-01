import { useState, useRef, useEffect, useCallback } from "react";

// ─── URL Param Helpers ──────────────────────────────────────────
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return { to: p.get("to") || "", msg: p.get("msg") || "" };
}

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
    const shapes = ["circle","rect","heart"];
    for (let i = 0; i < 180; i++) {
      particlesRef.current.push({
        x: canvas.width * (0.3 + Math.random() * 0.4),
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 17 - 4,
        ay: 0.46,
        life: 1,
        decay: 0.007 + Math.random() * 0.013,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 11,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.3,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      particlesRef.current.forEach((p) => {
        p.vy += p.ay; p.x += p.vx; p.y += p.vy;
        p.life -= p.decay; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size/2, -p.size*0.3, p.size, p.size*0.6);
        } else {
          const s = p.size * 0.04;
          ctx.beginPath(); ctx.moveTo(0,s*3);
          ctx.bezierCurveTo(-s*4,s,-s*4,-s*2,0,-s*2);
          ctx.bezierCurveTo(s*4,-s*2,s*4,s,0,s*3); ctx.fill();
        }
        ctx.restore();
      });
      if (particlesRef.current.length > 0) animRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const ConfettiCanvas = (
    <canvas ref={canvasRef} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:50 }} />
  );
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);
  return { burst, ConfettiCanvas };
}

// ─── Floating Hearts ────────────────────────────────────────────
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
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {hearts.map((h) => (
        <div key={h.id} style={{
          position:"absolute", left:`${h.left}%`, top:"-60px",
          fontSize:`${h.size}rem`, opacity:0.35,
          animation:`floatHeart ${h.duration}s linear ${h.delay}s infinite`,
          "--drift":`${h.drift}px`,
        }}>{emoji}</div>
      ))}
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translateY(-60px) translateX(0) rotate(0deg); opacity:0; }
          10%  { opacity:0.4; }
          90%  { opacity:0.3; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(360deg); opacity:0; }
        }
      `}</style>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────
function Toast({ show, children }) {
  return (
    <div style={{
      position:"fixed", bottom:32, left:"50%", transform:`translateX(-50%) translateY(${show ? 0 : 120}px)`,
      transition:"transform 0.4s cubic-bezier(.34,1.56,.64,1)",
      background:"#2d1b24", color:"#fff", padding:"0.75rem 1.6rem",
      borderRadius:999, fontSize:"1rem", fontWeight:600, zIndex:100,
      boxShadow:"0 8px 24px rgba(0,0,0,0.25)", pointerEvents:"none",
      whiteSpace:"nowrap",
    }}>{children}</div>
  );
}

// ─── Main App ───────────────────────────────────────────────────
export default function App() {
  const params = getParams();

  // If URL has ?to=… → lover lands directly on prank. Otherwise → setup screen.
  const initialStage = params.to ? "prank" : "input";

  const [stage, setStage] = useState(initialStage);
  const [name, setName]   = useState(params.to || "");
  const [customMessage, setCustomMessage] = useState(
    params.msg || "I KNEW YOU'D SAY YES! 💖🎉"
  );
  const [noPos, setNoPos]           = useState({ x: 0, y: 0 });
  const [noEscapes, setNoEscapes]   = useState(0);
  const [yesScale, setYesScale]     = useState(1);
  const [showToast, setShowToast]   = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const containerRef = useRef(null);
  const { burst, ConfettiCanvas } = useConfetti();

  // ── No-button dodge ──
  const dodge = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const bw = 140, bh = 60;
    let best = null, bestDist = 0;
    for (let i = 0; i < 50; i++) {
      const cx = 30 + Math.random() * (W - bw - 60);
      const cy = 80 + Math.random() * (H - bh - 160);
      const dist = Math.hypot(
        cx + bw/2 - (clientX - rect.left),
        cy + bh/2 - (clientY - rect.top)
      );
      if (dist > bestDist) { best = { x: cx, y: cy }; bestDist = dist; }
    }
    if (best) setNoPos(best);
    setNoEscapes((n) => n + 1);
  }, []);

  const onMoveOrHover = useCallback((e) => {
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    dodge(cx, cy);
  }, [dodge]);

  useEffect(() => {
    if (noEscapes > 0) setYesScale(1 + noEscapes * 0.04);
  }, [noEscapes]);

  // ── Generate shareable link ──
  const handleGenerateLink = () => {
    const base = window.location.origin + window.location.pathname;
    const link = `${base}?to=${encodeURIComponent(name.trim())}&msg=${encodeURIComponent(customMessage)}`;
    setGeneratedLink(link);
  };

  // ── Copy link + toast ──
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = generatedLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  // ── Reset back to setup ──
  const handleReset = () => {
    setStage("input");
    setNoEscapes(0);
    setNoPos({ x: 0, y: 0 });
    setYesScale(1);
    setGeneratedLink("");
    window.history.replaceState({}, "", window.location.pathname);
  };

  // ─────────────────────────────────────────────────────────────
  // INPUT / SETUP SCREEN  (buyer sees this)
  // ─────────────────────────────────────────────────────────────
  if (stage === "input") {
    return (
      <div style={S.screen}>
        <FloatingHearts count={10} emoji="💗" />
        <div style={S.inputCard}>

          <div style={{ fontSize:"2.8rem", marginBottom:4, animation:"pulse 1s ease-in-out infinite" }}>💝</div>

          <h1 style={{ ...S.heading, color:"#e91e63", fontSize:"clamp(1.7rem,5.5vw,2.5rem)", textShadow:"0 4px 16px rgba(233,30,99,0.35)" }}>
            Create Your Valentine Prank
          </h1>
          <p style={{ color:"#ad1457", opacity:0.75, marginBottom:20, fontSize:"0.95rem", textAlign:"center" }}>
            They'll never see this screen 😈
          </p>

          <input
            type="text"
            placeholder="Their name or nickname…"
            value={name}
            onChange={(e) => { setName(e.target.value); setGeneratedLink(""); }}
            style={S.input}
          />
          <input
            type="text"
            placeholder="Celebration message…"
            value={customMessage}
            onChange={(e) => { setCustomMessage(e.target.value); setGeneratedLink(""); }}
            style={S.input}
          />

          {/* Generate link button */}
          {!generatedLink && (
            <button
              onClick={handleGenerateLink}
              disabled={!name.trim()}
              style={{
                ...S.primaryBtn,
                opacity: name.trim() ? 1 : 0.4,
                cursor: name.trim() ? "pointer" : "not-allowed",
                marginTop: 20,
              }}
            >
              Generate Link →
            </button>
          )}

          {/* Generated link card */}
          {generatedLink && (
            <div style={S.linkCard}>
              <p style={{ fontSize:"0.82rem", color:"#ad1457", fontWeight:600, marginBottom:8, textAlign:"center" }}>
                ✨ Your prank link is ready! Send this to {name.trim()}:
              </p>
              <div style={S.linkBox}>
                <span style={S.linkText}>{generatedLink}</span>
              </div>
              <button onClick={handleCopyLink} style={S.copyBtn}>
                Copy Link 📋
              </button>

              {/* Preview / test it yourself */}
              <button
                onClick={() => setStage("prank")}
                style={{ ...S.ghostBtn, marginTop: 10 }}
              >
                Preview prank →
              </button>
            </div>
          )}
        </div>

        <Toast show={showToast}>✓ Link copied!</Toast>
        {ConfettiCanvas}
        <style>{`
          @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CELEBRATION SCREEN
  // ─────────────────────────────────────────────────────────────
  if (stage === "celebration") {
    return (
      <div style={{ ...S.screen, background:"linear-gradient(135deg,#7e57c2 0%,#ec407a 60%,#e91e63 100%)" }}>
        <FloatingHearts count={28} emoji="❤️" />
        <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"0 1.5rem" }}>
          <div style={{ fontSize:"3.6rem", marginBottom:10, animation:"pulse 0.6s ease-in-out infinite" }}>🎉💝🎉</div>
          <h1 style={{
            color:"#fff", fontSize:"clamp(2rem,8vw,4rem)", fontWeight:800,
            lineHeight:1.15, textShadow:"0 4px 24px rgba(0,0,0,0.3)",
            animation:"popIn 0.5s cubic-bezier(.34,1.56,.64,1) both",
          }}>
            {customMessage}
          </h1>
          <p style={{ color:"rgba(255,255,255,0.92)", fontSize:"clamp(1.2rem,4vw,1.7rem)", marginTop:16 }}>
            You're the best, {name || "cutie"}! 🥰
          </p>
          {noEscapes > 0 && (
            <p style={{ color:"rgba(255,255,255,0.6)", marginTop:14, fontSize:"0.92rem", fontStyle:"italic" }}>
              (You tried to escape {noEscapes} time{noEscapes > 1 ? "s" : ""} 😂)
            </p>
          )}

          {/* Only show reset if buyer is previewing, not the lover */}
          {!params.to && (
            <button onClick={handleReset} style={{ ...S.primaryBtn, marginTop:28, background:"linear-gradient(90deg,#00c853,#00b140)" }}>
              ← Back to Setup
            </button>
          )}
        </div>

        {ConfettiCanvas}
        <style>{`
          @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
          @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PRANK SCREEN  (lover lands here via link)
  // ─────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={S.screen} onMouseMove={onMoveOrHover} onTouchMove={onMoveOrHover}>
      <FloatingHearts count={14} emoji="💕" />

      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:700, display:"flex", flexDirection:"column", alignItems:"center" }}>
        <h1 style={{
          color:"#fff", fontSize:"clamp(1.9rem,7vw,3.8rem)", fontWeight:800,
          textAlign:"center", lineHeight:1.15,
          textShadow:"0 6px 20px rgba(0,0,0,0.35)", marginBottom:8,
          animation:"slideDown 0.7s cubic-bezier(.34,1.56,.64,1) both",
        }}>
          Will you be my Valentine, {name || "cutie"}? 💕
        </h1>

        {noEscapes > 0 && (
          <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.92rem", marginBottom:4, fontStyle:"italic" }}>
            😂 No escaped {noEscapes} time{noEscapes > 1 ? "s" : ""}…
          </p>
        )}

        {/* Button arena */}
        <div style={{ position:"relative", width:"100%", height:260, marginTop:20, display:"flex", alignItems:"center", justifyContent:"center" }}>

          {/* YES – grows as No escapes */}
          <button
            onClick={() => { setStage("celebration"); burst(); }}
            style={{
              ...S.yesBtn,
              transform:`scale(${yesScale})`,
              transition:"transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s",
              zIndex:3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `scale(${yesScale * 1.12})`;
              e.currentTarget.style.boxShadow = "0 18px 44px rgba(255,23,68,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `scale(${yesScale})`;
              e.currentTarget.style.boxShadow = S.yesBtn.boxShadow;
            }}
          >
            Yes! 💖
          </button>

          {/* NO – dodges */}
          <button
            onMouseEnter={onMoveOrHover}
            onTouchStart={onMoveOrHover}
            onClick={onMoveOrHover}
            style={{
              ...S.noBtn,
              left: noPos.x,
              top: noPos.y,
              transition:"left 0.35s cubic-bezier(.34,1.56,.64,1), top 0.35s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            No 😔
          </button>
        </div>
      </div>

      {ConfettiCanvas}
      <style>{`
        @keyframes slideDown { 0%{transform:translateY(-40px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
      `}</style>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const S = {
  screen: {
    minHeight:"100dvh", width:"100%",
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    background:"linear-gradient(135deg,#ffe6e9 0%,#fff0f5 50%,#f8e1ff 100%)",
    overflow:"hidden", position:"relative",
    fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",
    color:"#2d1b24",
  },
  inputCard: {
    position:"relative", zIndex:2,
    display:"flex", flexDirection:"column", alignItems:"center",
    width:"100%", maxWidth:440, padding:"2rem 1.5rem",
  },
  heading: {
    fontWeight:800, textAlign:"center", lineHeight:1.15, marginBottom:6,
  },
  input: {
    width:"100%", padding:"0.85rem 1.4rem", margin:"0.5rem 0", fontSize:"1.05rem",
    border:"2px solid #ffb6c1", borderRadius:999,
    background:"rgba(255,255,255,0.92)", outline:"none",
    boxShadow:"0 4px 12px rgba(0,0,0,0.07)",
    transition:"border-color 0.25s, box-shadow 0.25s",
  },
  primaryBtn: {
    padding:"0.9rem 2.6rem", fontSize:"1.15rem", fontWeight:700, color:"#fff",
    background:"linear-gradient(90deg,#ff4081,#f50057)", border:"none", borderRadius:999,
    cursor:"pointer", boxShadow:"0 8px 24px rgba(245,0,87,0.35)",
    transition:"transform 0.25s, box-shadow 0.25s",
  },
  linkCard: {
    marginTop:24, width:"100%", background:"rgba(255,255,255,0.88)",
    borderRadius:20, padding:"1.4rem 1.2rem",
    boxShadow:"0 8px 28px rgba(233,30,99,0.12)", border:"1.5px solid #ffcdd2",
  },
  linkBox: {
    background:"#fff", borderRadius:12, padding:"0.7rem 1rem",
    border:"1px solid #f48fb1", overflowX:"auto", marginBottom:12,
  },
  linkText: {
    fontSize:"0.78rem", color:"#c2185b", wordBreak:"break-all", fontFamily:"monospace",
  },
  copyBtn: {
    width:"100%", padding:"0.7rem", fontSize:"1rem", fontWeight:700, color:"#fff",
    background:"linear-gradient(90deg,#ff4081,#f50057)", border:"none", borderRadius:999,
    cursor:"pointer", boxShadow:"0 6px 18px rgba(245,0,87,0.3)",
    transition:"transform 0.2s, box-shadow 0.2s",
  },
  ghostBtn: {
    width:"100%", padding:"0.55rem", fontSize:"0.88rem", fontWeight:600,
    color:"#e91e63", background:"transparent", border:"1.5px solid #f48fb1",
    borderRadius:999, cursor:"pointer", transition:"background 0.2s",
  },
  yesBtn: {
    fontSize:"clamp(1.6rem,5.5vw,2.4rem)", fontWeight:700,
    padding:"0.95rem 3rem", border:"none", borderRadius:999,
    cursor:"pointer", color:"#fff",
    background:"linear-gradient(135deg,#ff5252,#ff1744)",
    boxShadow:"0 10px 28px rgba(255,23,68,0.4)",
    userSelect:"none", touchAction:"manipulation",
  },
  noBtn: {
    position:"absolute", fontSize:"clamp(1.3rem,4.5vw,1.9rem)", fontWeight:700,
    padding:"0.8rem 2.4rem", border:"none", borderRadius:999,
    cursor:"pointer", color:"#fff",
    background:"linear-gradient(135deg,#607d8b,#455a64)",
    boxShadow:"0 8px 20px rgba(0,0,0,0.22)",
    userSelect:"none", touchAction:"manipulation", willChange:"transform",
  },
};
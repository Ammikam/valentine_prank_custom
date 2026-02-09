import { useState, useRef, useEffect, useCallback } from "react";

// ─── URL Param Helpers ──────────────────────────────────────────
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return { 
    to: p.get("to") || "", 
    msg: p.get("msg") || "",
    q: p.get("q") || "",
    id: p.get("id") || ""
  };
}

// ─── Generate unique ID ─────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ─── Google Font loader ─────────────────────────────────────────
function useFontLoad() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
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
    const colors = ["#ff4757","#ff6b81","#a29bfe","#fd79a8","#fdcb6e","#e17055","#fff","#c56cf0"];
    const shapes = ["circle","rect","heart"];
    for (let i = 0; i < 200; i++) {
      particlesRef.current.push({
        x: canvas.width * (0.25 + Math.random() * 0.5),
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 5,
        ay: 0.48,
        life: 1,
        decay: 0.006 + Math.random() * 0.014,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 12,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.35,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.vy += p.ay; p.x += p.vx; p.y += p.vy;
        p.life -= p.decay; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size/2, -p.size*0.3, p.size, p.size*0.6);
        } else {
          const s = p.size * 0.042;
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
      left: 5 + Math.random() * 90,
      size: 1 + Math.random() * 2,
      duration: 8 + Math.random() * 9,
      delay: Math.random() * 7,
      drift: (Math.random() - 0.5) * 70,
    }))
  ).current;
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
      {hearts.map(h => (
        <div key={h.id} style={{
          position:"absolute", left:`${h.left}%`, top:"-50px",
          fontSize:`${h.size}rem`, opacity:0.32,
          animation:`floatHeart ${h.duration}s linear ${h.delay}s infinite`,
          "--drift":`${h.drift}px`,
        }}>{emoji}</div>
      ))}
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translateY(-50px) translateX(0) rotate(0deg); opacity:0; }
          8%   { opacity:0.38; }
          92%  { opacity:0.25; }
          100% { transform: translateY(105vh) translateX(var(--drift)) rotate(420deg); opacity:0; }
        }
      `}</style>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────
function Toast({ show, children }) {
  return (
    <div style={{
      position:"fixed",
      bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      left:"50%",
      transform:`translateX(-50%) translateY(${show ? 0 : 140}px)`,
      transition:"transform 0.42s cubic-bezier(.34,1.56,.64,1)",
      background:"#1a1a2e", color:"#fff", padding:"0.85rem 1.8rem",
      borderRadius:999, fontSize:"0.95rem", fontWeight:600, zIndex:100,
      boxShadow:"0 8px 28px rgba(0,0,0,0.3)", pointerEvents:"none",
      whiteSpace:"nowrap", letterSpacing:"0.02em",
    }}>{children}</div>
  );
}

// ─── Character Counter ──────────────────────────────────────────
function CharCounter({ current, max, style = {} }) {
  const percentage = (current / max) * 100;
  const color = percentage > 90 ? "#f44336" : percentage > 75 ? "#ff9800" : "#4caf50";
  return (
    <div style={{ fontSize:"0.75rem", color, fontWeight:600, marginTop:4, textAlign:"right", ...style }}>
      {current}/{max}
    </div>
  );
}

// ─── Sound Effect Hook ──────────────────────────────────────────
function useSuccessSound() {
  const audioRef = useRef(null);

  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    audioRef.current = playSound;
    
    const resumeAudio = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    };
    
    document.addEventListener('touchstart', resumeAudio, { once: true });
    document.addEventListener('click', resumeAudio, { once: true });
    
    return () => {
      audioContext.close();
    };
  }, []);

  return () => audioRef.current?.();
}

// ─── Response Tracking Hook ─────────────────────────────────────
function useTracking(linkId) {
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveTracking = useCallback(async (id, action, data = {}) => {
    if (!id) return;
    
    try {
      const storageKey = `prank_${id}`;
      const existing = await window.storage?.get(storageKey, true);
      
      const trackingInfo = existing ? JSON.parse(existing.value) : {
        id,
        created: Date.now(),
        opened: null,
        answered: null,
        noEscapes: 0,
      };

      if (action === "open" && !trackingInfo.opened) {
        trackingInfo.opened = Date.now();
      } else if (action === "yes") {
        trackingInfo.answered = Date.now();
        trackingInfo.noEscapes = data.noEscapes || 0;
      } else if (action === "escape") {
        trackingInfo.noEscapes = data.noEscapes || 0;
      }

      await window.storage?.set(storageKey, JSON.stringify(trackingInfo), true);
      return trackingInfo;
    } catch (err) {
      console.log("Tracking not available:", err);
      return null;
    }
  }, []);

  const loadTracking = useCallback(async (id) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const storageKey = `prank_${id}`;
      const result = await window.storage?.get(storageKey, true);
      
      if (result?.value) {
        setTrackingData(JSON.parse(result.value));
      }
    } catch (err) {
      console.log("Could not load tracking:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (linkId) {
      loadTracking(linkId);
      
      // Poll for updates every 3 seconds
      const interval = setInterval(() => loadTracking(linkId), 3000);
      return () => clearInterval(interval);
    }
  }, [linkId, loadTracking]);

  return { trackingData, isLoading, saveTracking, loadTracking };
}

// ─── Main App ───────────────────────────────────────────────────
export default function App() {
  useFontLoad();
  const params = getParams();
  const initialStage = params.to ? "prank" : "input";

  const [stage, setStage]                 = useState(initialStage);
  const [name, setName]                   = useState(params.to || "");
  const [customMessage, setCustomMessage] = useState(params.msg || "I KNEW YOU'D SAY YES! 💖");
  const [question, setQuestion]           = useState(params.q || "Will you join me for a coffee date");
  const [noPos, setNoPos]                 = useState({ x: 0, y: 0 });
  const [noEscapes, setNoEscapes]         = useState(0);
  const [yesScale, setYesScale]           = useState(1);
  const [showToast, setShowToast]         = useState(false);
  const [toastMessage, setToastMessage]   = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkId, setLinkId]               = useState(params.id || "");
  const arenaRef                          = useRef(null);
  const { burst, ConfettiCanvas }         = useConfetti();
  const playSuccessSound                  = useSuccessSound();
  const { trackingData, saveTracking, loadTracking } = useTracking(linkId);

  // Question presets
  const questionPresets = [
    "Will you join me for a coffee date",
    "Want to grab dinner with me",
    "Will you be my Valentine",
    "Can I take you out sometime",
    "Would you go on a date with me",
    "Want to hang out this weekend",
  ];

  // Track when prank is opened
  useEffect(() => {
    if (stage === "prank" && params.id) {
      saveTracking(params.id, "open");
    }
  }, [stage, params.id, saveTracking]);

  // Track escape attempts
  useEffect(() => {
    if (noEscapes > 0 && params.id) {
      saveTracking(params.id, "escape", { noEscapes });
    }
  }, [noEscapes, params.id, saveTracking]);

  const dodge = useCallback((clientX, clientY) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    const bw = window.innerWidth < 400 ? 100 : 120;
    const bh = 48;
    const pad = 16;

    let best = null, bestDist = 0;
    for (let i = 0; i < 80; i++) {
      const cx = pad + Math.random() * (W - bw - pad * 2);
      const cy = pad + Math.random() * (H - bh - pad * 2);
      const dist = Math.hypot(
        cx + bw / 2 - (clientX - rect.left),
        cy + bh / 2 - (clientY - rect.top)
      );
      if (dist > bestDist) { best = { x: cx, y: cy }; bestDist = dist; }
    }
    if (best) setNoPos(best);
    setNoEscapes(n => n + 1);
  }, []);

  const onInteract = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches?.[0] ?? e.changedTouches?.[0];
    const cx = touch?.clientX ?? e.clientX ?? 0;
    const cy = touch?.clientY ?? e.clientY ?? 0;
    dodge(cx, cy);
  }, [dodge]);

  useEffect(() => {
    if (noEscapes > 0) setYesScale(Math.min(1 + noEscapes * 0.055, 2.5));
  }, [noEscapes]);

  const handleGenerateLink = () => {
    const id = generateId();
    const base = window.location.origin + window.location.pathname;
    const link = `${base}?to=${encodeURIComponent(name.trim())}&msg=${encodeURIComponent(customMessage)}&q=${encodeURIComponent(question)}&id=${id}`;
    setGeneratedLink(link);
    setLinkId(id);
    
    // Initialize tracking
    saveTracking(id, "create");
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(generatedLink); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = generatedLink;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setToastMessage("✓ Link copied!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const handleReset = () => {
    setStage("input"); setNoEscapes(0);
    setNoPos({ x:0, y:0 }); setYesScale(1); setGeneratedLink(""); setLinkId("");
    window.history.replaceState({}, "", window.location.pathname);
  };

  const handleYesClick = () => {
    playSuccessSound();
    
    // Save the "yes" response
    if (params.id) {
      saveTracking(params.id, "yes", { noEscapes });
    }
    
    setTimeout(() => {
      setStage("celebration"); 
      burst();
    }, 100);
  };

  // ─────────────────── RENDER ─────────────────────────────────

  // ── INPUT (setup screen – buyer only) ───────────────────────
  if (stage === "input") {
    return (
      <div style={S.screen}>
        <FloatingHearts count={10} emoji="💗" />
        <div style={S.inputCard}>
          <div style={{ fontSize:"2.8rem", marginBottom:4, animation:"pulse 1.1s ease-in-out infinite" }}>💝</div>
          <h1 style={{ ...S.displayTitle, color:"#e91e63", textShadow:"0 3px 14px rgba(233,30,99,0.4)" }}>
            Create Your<br/>Valentine Prank
          </h1>
          <p style={S.subtitle}>They'll never see this screen 😈</p>

          <div style={S.inputWrapper}>
            <input
              type="text"
              placeholder="Their name or nickname…"
              value={name}
              onChange={e => { setName(e.target.value); setGeneratedLink(""); }}
              style={S.input}
              maxLength={30}
            />
            <CharCounter current={name.length} max={30} />

            {/* Question Presets */}
            <div style={S.presetsLabel}>Quick questions:</div>
            <div style={S.presetsGrid}>
              {questionPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(preset)}
                  style={{
                    ...S.presetBtn,
                    background: question === preset ? "linear-gradient(90deg,#ff4081,#f50057)" : "rgba(255,255,255,0.95)",
                    color: question === preset ? "#fff" : "#e91e63",
                    border: question === preset ? "2px solid #f50057" : "2px solid #ffb6c1",
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Or type your own question…"
              value={question}
              onChange={e => { setQuestion(e.target.value); setGeneratedLink(""); }}
              style={{ ...S.input, marginTop: 12 }}
              maxLength={100}
            />
            <CharCounter current={question.length} max={100} />

            <input
              type="text"
              placeholder="Celebration message…"
              value={customMessage}
              onChange={e => { setCustomMessage(e.target.value); setGeneratedLink(""); }}
              style={S.input}
              maxLength={80}
            />
            <CharCounter current={customMessage.length} max={80} />
          </div>

          {!generatedLink && (
            <button
              onClick={handleGenerateLink}
              disabled={!name.trim()}
              style={{ 
                ...S.primaryBtn, 
                opacity: name.trim() ? 1 : 0.5, 
                cursor: name.trim() ? "pointer" : "not-allowed",
                transform: name.trim() ? "scale(1)" : "scale(0.98)"
              }}
            >
              Generate Link →
            </button>
          )}

          {generatedLink && (
            <div style={S.linkCard}>
              <p style={S.linkLabel}>✨ Link ready! Send this to {name.trim()}:</p>
              <div style={S.linkBox}>
                <span style={S.linkText}>{generatedLink}</span>
              </div>
              <button onClick={handleCopyLink} style={S.copyBtn}>Copy Link 📋</button>
              <button onClick={() => setStage("prank")} style={S.ghostBtn}>Preview prank →</button>
              
              {/* Tracking Status */}
              {trackingData && (
                <div style={S.trackingCard}>
                  <div style={S.trackingTitle}>📊 Link Status</div>
                  <div style={S.trackingItem}>
                    <span style={S.trackingLabel}>Opened:</span>
                    <span style={S.trackingValue}>
                      {trackingData.opened ? "✓ Yes" : "Not yet"}
                    </span>
                  </div>
                  {trackingData.opened && !trackingData.answered && (
                    <div style={S.trackingItem}>
                      <span style={S.trackingLabel}>Escape attempts:</span>
                      <span style={S.trackingValue}>{trackingData.noEscapes || 0}</span>
                    </div>
                  )}
                  {trackingData.answered && (
                    <div style={{ ...S.trackingItem, background:"rgba(76,175,80,0.1)", padding:"0.75rem", borderRadius:8, marginTop:8 }}>
                      <span style={{ fontSize:"1.1rem" }}>🎉 They said YES!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Toast show={showToast}>{toastMessage}</Toast>
        {ConfettiCanvas}
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.22)}}`}</style>
      </div>
    );
  }

  // ── CELEBRATION ─────────────────────────────────────────────
  if (stage === "celebration") {
    return (
      <div style={{ ...S.screen, background:"linear-gradient(145deg,#6a1b9a 0%,#ec407a 55%,#e91e63 100%)" }}>
        <FloatingHearts count={30} emoji="❤️" />
        <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"0 1.5rem", maxWidth:500 }}>
          <div style={{ fontSize:"3.5rem", marginBottom:12, animation:"pulse 0.55s ease-in-out infinite" }}>💝</div>
          <h1 style={{ ...S.displayTitle, color:"#fff", textShadow:"0 4px 22px rgba(0,0,0,0.32)", animation:"popIn 0.5s cubic-bezier(.34,1.56,.64,1) both" }}>
            {customMessage}
          </h1>
          <p style={{ color:"rgba(255,255,255,0.95)", fontSize:"clamp(1.15rem,4.5vw,1.7rem)", marginTop:16, fontFamily:"system-ui,sans-serif", lineHeight:1.4 }}>
            You're the best, {name || "cutie"}! 🥰
          </p>
          {noEscapes > 0 && (
            <div style={S.escapeCounter}>
              <p style={{ margin:0, fontSize:"0.95rem" }}>
                😂 "No" tried to escape <strong>{noEscapes}</strong> time{noEscapes !== 1 ? "s" : ""}!
              </p>
            </div>
          )}
          {!params.to && (
            <button onClick={handleReset} style={{ ...S.primaryBtn, marginTop:32, background:"linear-gradient(90deg,#00c853,#00b140)" }}>
              ← Back to Setup
            </button>
          )}
        </div>
        {ConfettiCanvas}
        <style>{`
          @keyframes popIn{0%{transform:scale(0.45);opacity:0}100%{transform:scale(1);opacity:1}}
          @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.22)}}
        `}</style>
      </div>
    );
  }

  // ── PRANK (lover lands here) ────────────────────────────────
  return (
    <div style={S.screen}>
      <FloatingHearts count={14} emoji="💕" />
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:540, display:"flex", flexDirection:"column", alignItems:"center", padding:"0 1.25rem" }}>

        <h1 style={{ ...S.displayTitle, color:"#e02121", textShadow:"0 5px 18px rgba(0,0,0,0.35)", animation:"slideDown 0.65s cubic-bezier(.34,1.56,.64,1) both", marginBottom:12 }}>
          {question}, {name || "cutie"}? 💕
        </h1>

        {noEscapes > 0 && (
          <p style={{ color:"rgba(173, 50, 50, 0.75)", fontSize:"0.9rem", marginBottom:8, fontStyle:"italic", fontFamily:"system-ui,sans-serif", textAlign:"center" }}>
            😂 "No" escaped {noEscapes} time{noEscapes !== 1 ? "s" : ""}… just give in already!
          </p>
        )}

        <div
          ref={arenaRef}
          onMouseMove={onInteract}
          onTouchMove={onInteract}
          onTouchStart={onInteract}
          style={S.arena}
        >
          <button
            onClick={handleYesClick}
            style={{
              ...S.yesBtn,
              transform:`scale(${yesScale})`,
              transition:"transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s",
              zIndex:3,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = `scale(${yesScale * 1.12})`;
              e.currentTarget.style.boxShadow = "0 18px 44px rgba(255,23,68,0.6)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = `scale(${yesScale})`;
              e.currentTarget.style.boxShadow = S.yesBtn.boxShadow;
            }}
          >
            Yes! 💖
          </button>

          <button
            onMouseEnter={onInteract}
            onTouchStart={onInteract}
            onClick={onInteract}
            style={{
              ...S.noBtn,
              left: noPos.x,
              top: noPos.y,
              transition:"left 0.28s cubic-bezier(.34,1.56,.64,1), top 0.28s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            No 😔
          </button>
        </div>

        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.8rem", marginTop:16, textAlign:"center", fontStyle:"italic" }}>
          Hint: Chasing "No" makes "Yes" bigger 😉
        </p>
      </div>

      {ConfettiCanvas}
      <style>{`
        @keyframes slideDown{0%{transform:translateY(-36px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.22)}}
      `}</style>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const S = {
  screen: {
    minHeight:"100dvh",
    width:"100%",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    background:"linear-gradient(135deg,#ffe6e9 0%,#fff0f5 50%,#f8e1ff 100%)",
    overflow:"hidden",
    position:"relative",
    fontFamily:"system-ui,-apple-system,sans-serif",
    color:"#2d1b24",
    paddingTop:"env(safe-area-inset-top, 0px)",
    paddingBottom:"env(safe-area-inset-bottom, 0px)",
  },

  displayTitle: {
    fontFamily:"'Playfair Display', Georgia, serif",
    fontWeight:800,
    fontSize:"clamp(1.85rem, 7.8vw, 3.6rem)",
    lineHeight:1.14,
    textAlign:"center",
    marginBottom:10,
    letterSpacing:"-0.015em",
  },

  subtitle: {
    color:"#ad1457",
    opacity:0.75,
    marginBottom:28,
    fontSize:"0.95rem",
    textAlign:"center",
    fontFamily:"system-ui,sans-serif",
    fontWeight:500,
  },

  inputCard: {
    position:"relative",
    zIndex:2,
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    width:"100%",
    maxWidth:440,
    padding:"clamp(1rem, 3vw, 1.75rem) clamp(1.25rem, 4vw, 1.5rem)",
  },

  inputWrapper: {
    width:"100%",
    padding:"0 clamp(0.5rem, 2vw, 0rem)",
  },

  input: {
    width:"100%",
    padding:"0.95rem 1.4rem",
    margin:"0.5rem 0",
    fontSize:"16px",
    border:"2px solid #ffb6c1",
    borderRadius:12,
    background:"rgba(255,255,255,0.95)",
    outline:"none",
    boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
    transition:"border-color 0.25s, box-shadow 0.25s, transform 0.2s",
    WebkitAppearance:"none",
    MozAppearance:"none",
    appearance:"none",
    touchAction:"manipulation",
    boxSizing:"border-box",
  },

  presetsLabel: {
    fontSize:"0.85rem",
    color:"#ad1457",
    fontWeight:600,
    marginTop:16,
    marginBottom:8,
    textAlign:"left",
    width:"100%",
  },

  presetsGrid: {
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:8,
    width:"100%",
    marginBottom:8,
  },

  presetBtn: {
    padding:"0.7rem 0.9rem",
    fontSize:"0.8rem",
    fontWeight:600,
    borderRadius:10,
    cursor:"pointer",
    transition:"all 0.2s",
    textAlign:"center",
    lineHeight:1.3,
    minHeight:52,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    touchAction:"manipulation",
  },

  primaryBtn: {
    width:"100%",
    maxWidth:340,
    padding:"1rem 1.6rem",
    fontSize:"1.1rem",
    fontWeight:700,
    color:"#fff",
    background:"linear-gradient(90deg,#ff4081,#f50057)",
    border:"none",
    borderRadius:12,
    cursor:"pointer",
    boxShadow:"0 8px 24px rgba(245,0,87,0.35)",
    transition:"transform 0.25s, box-shadow 0.25s, opacity 0.25s",
    marginTop:20,
    minHeight:52,
    touchAction:"manipulation",
  },

  linkCard: {
    marginTop:24,
    width:"100%",
    background:"rgba(255,255,255,0.92)",
    borderRadius:20,
    padding:"1.35rem 1.15rem",
    boxShadow:"0 8px 28px rgba(233,30,99,0.12)",
    border:"2px solid #ffcdd2",
  },

  linkLabel: {
    fontSize:"0.88rem",
    color:"#ad1457",
    fontWeight:600,
    marginBottom:10,
    textAlign:"center",
    lineHeight:1.4,
  },

  linkBox: {
    background:"#fff",
    borderRadius:10,
    padding:"0.75rem 1rem",
    border:"1.5px solid #f48fb1",
    overflowX:"auto",
    marginBottom:12,
    WebkitOverflowScrolling:"touch",
    maxWidth:"100%",
  },

  linkText: {
    fontSize:"0.75rem",
    color:"#c2185b",
    wordBreak:"break-all",
    fontFamily:"'SF Mono','Consolas',monospace",
    lineHeight:1.5,
  },

  copyBtn: {
    width:"100%",
    padding:"0.85rem",
    fontSize:"1.05rem",
    fontWeight:700,
    color:"#fff",
    background:"linear-gradient(90deg,#ff4081,#f50057)",
    border:"none",
    borderRadius:12,
    cursor:"pointer",
    boxShadow:"0 6px 18px rgba(245,0,87,0.3)",
    minHeight:52,
    touchAction:"manipulation",
    transition:"transform 0.2s, box-shadow 0.2s",
  },

  ghostBtn: {
    width:"100%",
    padding:"0.75rem",
    fontSize:"0.92rem",
    fontWeight:600,
    color:"#e91e63",
    background:"transparent",
    border:"2px solid #f48fb1",
    borderRadius:12,
    cursor:"pointer",
    marginTop:10,
    minHeight:48,
    touchAction:"manipulation",
    transition:"all 0.2s",
  },

  trackingCard: {
    marginTop:16,
    padding:"1rem",
    background:"rgba(233,30,99,0.05)",
    borderRadius:12,
    border:"1.5px solid #f48fb1",
  },

  trackingTitle: {
    fontSize:"0.85rem",
    fontWeight:700,
    color:"#ad1457",
    marginBottom:8,
    textAlign:"center",
  },

  trackingItem: {
    display:"flex",
    justifyContent:"space-between",
    padding:"0.5rem 0",
    fontSize:"0.85rem",
  },

  trackingLabel: {
    color:"#666",
    fontWeight:500,
  },

  trackingValue: {
    color:"#e91e63",
    fontWeight:700,
  },

  escapeCounter: {
    marginTop:20,
    padding:"0.85rem 1.4rem",
    background:"rgba(255,255,255,0.18)",
    borderRadius:12,
    border:"1.5px solid rgba(255,255,255,0.3)",
    color:"#fff",
    backdropFilter:"blur(8px)",
  },

  arena: {
    position:"relative",
    width:"100%",
    maxWidth:"min(500px, 92vw)",
    height:"clamp(240px, 45vw, 320px)",
    marginTop:20,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    touchAction:"none",
    border:"2px dashed rgba(255,255,255,0.3)",
    borderRadius:16,
    background:"rgba(255,255,255,0.08)",
  },

  yesBtn: {
    fontSize:"clamp(1.6rem, 6.2vw, 2.5rem)",
    fontWeight:700,
    padding:"0.95rem 2.8rem",
    border:"none",
    borderRadius:14,
    cursor:"pointer",
    color:"#fff",
    background:"linear-gradient(135deg,#ff5252,#ff1744)",
    boxShadow:"0 12px 32px rgba(255,23,68,0.45)",
    userSelect:"none",
    touchAction:"manipulation",
    minHeight:56,
    zIndex:2,
  },

  noBtn: {
    position:"absolute",
    fontSize:"clamp(1.2rem, 4.5vw, 1.8rem)",
    fontWeight:700,
    padding:"0.75rem 2.2rem",
    border:"none",
    borderRadius:14,
    cursor:"pointer",
    color:"#fff",
    background:"linear-gradient(135deg,#607d8b,#455a64)",
    boxShadow:"0 8px 20px rgba(0,0,0,0.25)",
    userSelect:"none",
    touchAction:"manipulation",
    minHeight:52,
    willChange:"transform",
    zIndex:4,
  },
};
import { useState, useRef, useEffect, useCallback } from "react";
import { ref, set, update, onValue, get } from "firebase/database";
import { db } from "./firebase";


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
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Dancing+Script:wght@600;700&family=Satisfy&family=Pacifico&family=Sacramento&display=swap";
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
    const colors = ["#ff4757","#ff6b81","#a29bfe","#fd79a8","#fdcb6e","#e17055","#fff","#c56cf0","#feca57","#ff9ff3"];
    const shapes = ["circle","rect","heart"];
    for (let i = 0; i < 250; i++) {
      particlesRef.current.push({
        x: canvas.width * (0.25 + Math.random() * 0.5),
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 18,
        vy: -Math.random() * 20 - 6,
        ay: 0.5,
        life: 1,
        decay: 0.005 + Math.random() * 0.012,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 14,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.4,
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

// ─── Dodge Sound Effect Hook ────────────────────────────────────
function useDodgeSound() {
  const audioRef = useRef(null);

  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const playSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    };
    
    audioRef.current = playSound;
    
    return () => {
      audioContext.close();
    };
  }, []);

  return () => audioRef.current?.();
}

// ─── Firebase Tracking Hook (FIXED) ─────────────────────────────
function useTracking(linkId) {
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Save tracking data to Firebase
  const saveTracking = useCallback(async (id, action, data = {}) => {
    if (!id || !db) return;
    
    try {
      const prankRef = ref(db, `pranks/${id}`);
      
      if (action === "create") {
        // Initialize new prank
        await set(prankRef, {
          id,
          created: Date.now(),
          opened: null,
          answered: null,
          noEscapes: 0,
          lastUpdated: Date.now(),
        });
      } else if (action === "open") {
        // Mark as opened (only if not already opened)
        const snapshot = await get(prankRef);
        if (snapshot.exists() && !snapshot.val().opened) {
          await update(prankRef, {
            opened: Date.now(),
            lastUpdated: Date.now(),
          });
        } else if (!snapshot.exists()) {
          // Create if doesn't exist
          await set(prankRef, {
            id,
            created: Date.now(),
            opened: Date.now(),
            answered: null,
            noEscapes: 0,
            lastUpdated: Date.now(),
          });
        }
      } else if (action === "escape") {
        // Update escape count
        await update(prankRef, {
          noEscapes: data.noEscapes || 0,
          lastUpdated: Date.now(),
        });
      } else if (action === "yes") {
        // Mark as answered
        await update(prankRef, {
          answered: Date.now(),
          noEscapes: data.noEscapes || 0,
          lastUpdated: Date.now(),
        });
      }
      
      return true;
    } catch (err) {
      console.error("Firebase tracking error:", err);
      return null;
    }
  }, []);

  // Real-time listener for tracking data
  useEffect(() => {
    if (!linkId || !db) return;
    
    setIsLoading(true);
    const prankRef = ref(db, `pranks/${linkId}`);
    
    // Set up real-time listener
    const unsubscribe = onValue(prankRef, (snapshot) => {
      setIsLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Firebase data updated:", data); // Debug log
        setTrackingData(data);
      } else {
        setTrackingData(null);
      }
    }, (error) => {
      console.error("Firebase read error:", error);
      setIsLoading(false);
    });
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [linkId]);

  return { trackingData, isLoading, saveTracking };
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
  const [noBtnShake, setNoBtnShake]       = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const prevTrackingRef                   = useRef(null);
  const hasShownOpenedRef                 = useRef(false);
  const arenaRef                          = useRef(null);
  const { burst, ConfettiCanvas }         = useConfetti();
  const playSuccessSound                  = useSuccessSound();
  const playDodgeSound                    = useDodgeSound();
  const { trackingData, saveTracking }    = useTracking(linkId);

  // Question presets
  const questionPresets = [
    "Will you join me for a coffee date",
    "Want to grab dinner with me",
    "Will you be my Valentine",
    "Can I take you out sometime",
    "Would you go on a date with me",
    "Want to hang out this weekend",
  ];

  // Track when prank is opened (FIXED - only runs once)
  const hasTrackedOpen = useRef(false);
  useEffect(() => {
    if (stage === "prank" && params.id && !hasTrackedOpen.current) {
      console.log("Tracking prank open for ID:", params.id);
      saveTracking(params.id, "open");
      hasTrackedOpen.current = true;
    }
  }, [stage, params.id, saveTracking]);

  // Track escape attempts
  useEffect(() => {
    if (noEscapes > 0 && params.id) {
      console.log("Tracking escape attempt:", noEscapes);
      saveTracking(params.id, "escape", { noEscapes });
    }
  }, [noEscapes, params.id, saveTracking]);

  // FIXED: Notification system - detect tracking changes
  useEffect(() => {
    if (!trackingData) {
      prevTrackingRef.current = trackingData;
      return;
    }

    const prev = prevTrackingRef.current;
    
    // First time seeing data - don't show notifications
    if (!prev) {
      prevTrackingRef.current = trackingData;
      return;
    }

    console.log("Tracking data changed:", { prev, current: trackingData });
    
    // Detect if link was just opened
    if (!prev.opened && trackingData.opened && !hasShownOpenedRef.current) {
      console.log("Link was opened!");
      setNotificationText(` ${name || "They"} opened your link!`);
      setShowNotification(true);
      playSuccessSound();
      hasShownOpenedRef.current = true;
      setTimeout(() => setShowNotification(false), 4000);
    }
    
    // Detect if they're trying to escape (escape count increased)
    if (trackingData.noEscapes > (prev.noEscapes || 0) && !trackingData.answered) {
      console.log("Escape attempt detected!");
      setNotificationText(`😂 They tried to click "No" ${trackingData.noEscapes} time${trackingData.noEscapes !== 1 ? 's' : ''}!`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
    
    // Detect if they said YES!
    if (!prev.answered && trackingData.answered) {
      console.log("They said YES!");
      setNotificationText(`💖 THEY SAID YES! ${name || "They"} accepted!`);
      setShowNotification(true);
      playSuccessSound();
      setTimeout(() => {
        setShowNotification(false);
        // Auto-trigger confetti celebration
        burst();
      }, 5000);
    }
    
    prevTrackingRef.current = trackingData;
  }, [trackingData, name, playSuccessSound, burst]);

  // IMPROVED: Smoother, more gradual scaling with diminishing returns
  useEffect(() => {
    if (noEscapes > 0) {
      // Use logarithmic growth for smooth, natural scaling
      const logarithmicScale = 1 + Math.log(noEscapes + 1) * 0.15;
      // Cap at 1.8x for better visual aesthetics
      setYesScale(Math.min(logarithmicScale, 1.8));
    }
  }, [noEscapes]);

  const dodge = useCallback((clientX, clientY) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    
    const bw = window.innerWidth < 400 ? 100 : 120;
    const bh = 48;
    const pad = 20;

    // Find furthest safe position from cursor
    let best = null, bestDist = 0;
    for (let i = 0; i < 100; i++) {
      const cx = pad + Math.random() * (W - bw - pad * 2);
      const cy = pad + Math.random() * (H - bh - pad * 2);
      const dist = Math.hypot(
        cx + bw / 2 - (clientX - rect.left),
        cy + bh / 2 - (clientY - rect.top)
      );
      if (dist > bestDist) { best = { x: cx, y: cy }; bestDist = dist; }
    }
    if (best) {
      setNoPos(best);
      setNoBtnShake(true);
      setTimeout(() => setNoBtnShake(false), 300);
    }
    setNoEscapes(n => n + 1);
    playDodgeSound();
  }, [playDodgeSound]);

  const onInteract = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches?.[0] ?? e.changedTouches?.[0];
    const cx = touch?.clientX ?? e.clientX ?? 0;
    const cy = touch?.clientY ?? e.clientY ?? 0;
    dodge(cx, cy);
  }, [dodge]);

  const handleGenerateLink = () => {
    const id = generateId();
    const base = window.location.origin + window.location.pathname;
    const link = `${base}?to=${encodeURIComponent(name.trim())}&msg=${encodeURIComponent(customMessage)}&q=${encodeURIComponent(question)}&id=${id}`;
    setGeneratedLink(link);
    setLinkId(id);
    
    // Initialize tracking in Firebase
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
    hasShownOpenedRef.current = false;
    prevTrackingRef.current = null;
    window.history.replaceState({}, "", window.location.pathname);
  };

  const handleYesClick = () => {
    playSuccessSound();
    
    // Save the "yes" response to Firebase
    if (params.id) {
      console.log("Saving YES response to Firebase");
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
        
        {/* Card Modal */}
        <div style={S.modalCard}>
          <div style={S.cardHeader}>
            <div style={{ fontSize:"3.2rem", marginBottom:8, animation:"pulse 1.1s ease-in-out infinite" }}>💝</div>
            <h1 style={S.cardTitle}>
              Create Your<br/>Valentine Prank
            </h1>
            <p style={S.cardSubtitle}>They'll never see this screen 😈</p>
          </div>

          <div style={S.cardBody}>
            <div style={S.inputGroup}>
              <label style={S.label}>Their Name</label>
              <input
                type="text"
                placeholder="Sweetheart..."
                value={name}
                onChange={e => { setName(e.target.value); setGeneratedLink(""); }}
                style={S.inputName}
                maxLength={30}
              />
              <CharCounter current={name.length} max={30} />
            </div>

            <div style={S.inputGroup}>
              <label style={S.label}>Quick Questions</label>
              <div style={S.presetsGrid}>
                {questionPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuestion(preset)}
                    style={{
                      ...S.presetBtn,
                      background: question === preset ? "linear-gradient(135deg,#ff4081,#f50057)" : "rgba(255,255,255,0.7)",
                      color: question === preset ? "#fff" : "#e91e63",
                      border: question === preset ? "2px solid #f50057" : "2px solid rgba(233,30,99,0.2)",
                      boxShadow: question === preset ? "0 4px 12px rgba(245,0,87,0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.inputGroup}>
              <label style={S.label}>Custom Question</label>
              <input
                type="text"
                placeholder="Or write your own..."
                value={question}
                onChange={e => { setQuestion(e.target.value); setGeneratedLink(""); }}
                style={S.input}
                maxLength={100}
              />
              <CharCounter current={question.length} max={100} />
            </div>

            <div style={S.inputGroup}>
              <label style={S.label}>Celebration Message</label>
              <input
                type="text"
                placeholder="I knew you'd say yes! 💖"
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
                Generate Link ✨
              </button>
            )}

            {generatedLink && (
              <div style={S.linkResultCard}>
                <p style={S.linkLabel}> Link ready! Send this to {name.trim()}:</p>
                <div style={S.linkBox}>
                  <span style={S.linkText}>{generatedLink}</span>
                </div>
                <div style={S.buttonGroup}>
                  <button onClick={handleCopyLink} style={S.copyBtn}>Copy Link </button>
                  <button onClick={() => setStage("prank")} style={S.previewBtn}>Preview </button>
                </div>
                
                {/* Tracking Status */}
                {trackingData && (
                  <div style={S.trackingCard}>
                    <div style={S.trackingTitle}>
                       Link Status 
                      <span style={{
                        display:"inline-block",
                        width:8,
                        height:8,
                        borderRadius:"50%",
                        background:"#4caf50",
                        marginLeft:8,
                        animation:"pulse 2s ease-in-out infinite",
                        boxShadow:"0 0 8px #4caf50"
                      }}></span>
                      <span style={{fontSize:"0.7rem", marginLeft:6, opacity:0.7}}>Live</span>
                    </div>
                    <div style={S.trackingGrid}>
                      <div style={S.trackingItem}>
                        <span style={S.trackingLabel}>Opened:</span>
                        <span style={{...S.trackingValue, color: trackingData.opened ? "#4caf50" : "#999"}}>
                          {trackingData.opened ? "✓ Yes" : "⏳ Waiting..."}
                        </span>
                      </div>
                      {trackingData.opened && !trackingData.answered && (
                        <div style={S.trackingItem}>
                          <span style={S.trackingLabel}>Escape attempts:</span>
                          <span style={{...S.trackingValue, color:"#ff9800", fontWeight:800}}>
                            {trackingData.noEscapes || 0}
                            {trackingData.noEscapes > 0 && " 😂"}
                          </span>
                        </div>
                      )}
                      {trackingData.lastUpdated && (
                        <div style={{
                          ...S.trackingItem,
                          borderBottom:"none",
                          paddingTop:8,
                          fontSize:"0.75rem",
                          opacity:0.6,
                          fontStyle:"italic"
                        }}>
                          <span>Last updated:</span>
                          <span>{new Date(trackingData.lastUpdated).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                    {trackingData.answered && (
                      <div style={{
                        ...S.successBadge,
                        animation:"bounceIn 0.6s cubic-bezier(.34,1.56,.64,1)"
                      }}>
                        
                        They said YES!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Toast show={showToast}>{toastMessage}</Toast>
        
        {/* Live Notification Banner */}
        <div style={{
          position:"fixed",
          top: "calc(env(safe-area-inset-top, 0px) + 20px)",
          left:"50%",
          transform:`translateX(-50%) translateY(${showNotification ? 0 : -150}px)`,
          transition:"transform 0.5s cubic-bezier(.34,1.56,.64,1)",
          background:"linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
          color:"#fff",
          padding:"1.2rem 2rem",
          borderRadius:16,
          fontSize:"1rem",
          fontWeight:700,
          zIndex:101,
          boxShadow:"0 12px 40px rgba(76,175,80,0.5)",
          border:"2px solid rgba(255,255,255,0.3)",
          backdropFilter:"blur(12px)",
          minWidth:280,
          textAlign:"center",
          animation: showNotification ? "bounceIn 0.6s cubic-bezier(.34,1.56,.64,1)" : "none",
        }}>
          {notificationText}
        </div>
        
        {ConfettiCanvas}
        <style>{`
          @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.22)}}
          @keyframes bounceIn{
            0%{transform:translateX(-50%) scale(0.3);opacity:0}
            50%{transform:translateX(-50%) scale(1.05);opacity:1}
            100%{transform:translateX(-50%) scale(1);opacity:1}
          }
        `}</style>
      </div>
    );
  }

  // ── CELEBRATION ─────────────────────────────────────────────
  if (stage === "celebration") {
    return (
      <div style={S.celebrationScreen}>
        <FloatingHearts count={35} emoji="❤️" />
        
        {/* Celebration Modal Card */}
        <div style={S.celebrationModal}>
          <div style={S.celebrationIconWrapper}>
            <div style={S.celebrationIcon}>💝</div>
            <div style={S.celebrationRing}></div>
            <div style={S.celebrationRing2}></div>
          </div>
          
          <h1 style={S.celebrationTitle}>
            {customMessage}
          </h1>
          
          <p style={S.celebrationSubtitle}>
            You're absolutely amazing, {name || "cutie"}! 🥰
          </p>
          
          <div style={S.celebrationDivider}></div>
          
          {noEscapes > 0 && (
            <div style={S.escapeStats}>
              <p style={S.escapeSubtext}>
                love always wins 💕
              </p>
            </div>
          )}
          
          {!params.to && (
            <button onClick={handleReset} style={S.backBtn}>
              ← Create Another Prank
            </button>
          )}
        </div>
        
        {ConfettiCanvas}
        <style>{`
          @keyframes popIn {
            0% { transform: scale(0.5) translateY(30px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
          @keyframes ripple {
            0% { transform: scale(0.8); opacity: 0.6; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-25px) rotate(10deg); }
          }
          @keyframes slideUp {
            0% { transform: translateY(40px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ── PRANK (lover lands here) ────────────────────────────────
  return (
    <div style={S.prankScreen}>
      <FloatingHearts count={18} emoji="💕" />
      
      {/* Prank Card Container */}
      <div style={S.prankCard}>
        <div style={S.prankHeader}>
          <div style={S.heartDecor}>💖</div>
          <h1 style={S.prankTitle}>
            {question}, {name || "cutie"}?
          </h1>
          <div style={S.heartDecor}>💖</div>
        </div>

        {noEscapes > 0 && (
          <div style={S.escapeCounter}>
            <span style={S.escapeEmoji}>😏</span>
            <p style={S.escapeMessage}>
              "No" has escaped <strong>{noEscapes}</strong> time{noEscapes !== 1 ? "s" : ""}
            </p>
          </div>
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
              transition:"transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
              zIndex:3,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = `scale(${yesScale * 1.12})`;
              e.currentTarget.style.boxShadow = "0 20px 50px rgba(255,23,68,0.7)";
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
              transition:"left 0.25s cubic-bezier(.34,1.56,.64,1), top 0.25s cubic-bezier(.34,1.56,.64,1)",
              animation: noBtnShake ? "shake 0.3s" : "none",
            }}
          >
            No 😔
          </button>
        </div>

        <div style={S.prankFooter}>
          <p style={S.hintText}>💡 Hint: The more you chase "No", the bigger "Yes" gets!</p>
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
          50% { transform: scale(1.22); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-8px) rotate(-5deg); }
          75% { transform: translateX(8px) rotate(5deg); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 12px 32px rgba(255,23,68,0.45); }
          50% { box-shadow: 0 12px 42px rgba(255,23,68,0.7); }
        }
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
    padding:"clamp(1rem, 3vw, 2rem)",
  },

  modalCard: {
    position:"relative",
    zIndex:2,
    width:"100%",
    maxWidth:480,
    background:"rgba(255,255,255,0.95)",
    backdropFilter:"blur(20px)",
    borderRadius:24,
    boxShadow:"0 20px 60px rgba(233,30,99,0.25), 0 0 0 1px rgba(255,255,255,0.5)",
    overflow:"hidden",
    animation:"slideUp 0.6s cubic-bezier(.34,1.56,.64,1)",
  },

  cardHeader: {
    padding:"2rem 1.5rem 1.5rem",
    background:"linear-gradient(135deg, #ff6b9d 0%, #ff1744 100%)",
    color:"#fff",
    textAlign:"center",
    position:"relative",
  },

  cardTitle: {
    fontFamily:"'Playfair Display', Georgia, serif",
    fontWeight:800,
    fontSize:"clamp(1.85rem, 6vw, 2.5rem)",
    lineHeight:1.2,
    margin:"0 0 0.5rem 0",
    textShadow:"0 2px 12px rgba(0,0,0,0.2)",
  },

  cardSubtitle: {
    fontSize:"0.95rem",
    opacity:0.9,
    margin:0,
    fontWeight:500,
  },

  cardBody: {
    padding:"1.75rem 1.5rem 2rem",
  },

  inputGroup: {
    marginBottom:"1.5rem",
  },

  label: {
    display:"block",
    fontSize:"0.85rem",
    fontWeight:700,
    color:"#ad1457",
    marginBottom:"0.5rem",
    letterSpacing:"0.02em",
    textTransform:"uppercase",
  },

input: {
  width: "100%",
  padding: "1rem 1.25rem",
  fontSize: "17px",                 // or try 16px if still feels big
  fontFamily: "'Caveat', cursive",
  fontWeight: 400,                  // Caveat regular is perfect
  border: "2px solid rgba(233,30,99,0.15)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.8)",
  outline: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  transition: "all 0.3s ease",
  WebkitAppearance: "none",
  MozAppearance: "none",
  appearance: "none",
  touchAction: "manipulation",
  boxSizing: "border-box",
  color: "#e91e63",
},

  inputName: {
    width:"100%",
    padding:"1rem 1.25rem",
    fontSize:"18px",
    fontFamily:"'Pacifico', cursive",
    fontWeight:400,
    border:"2px solid rgba(233,30,99,0.15)",
    borderRadius:12,
    background:"rgba(255,255,255,0.8)",
    outline:"none",
    boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
    transition:"all 0.3s ease",
    WebkitAppearance:"none",
    MozAppearance:"none",
    appearance:"none",
    touchAction:"manipulation",
    boxSizing:"border-box",
    color:"#e91e63",
  },

  presetsGrid: {
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:10,
    marginTop:8,
  },

  presetBtn: {
    padding:"0.75rem 0.5rem",
    fontSize:"0.75rem",
    fontWeight:600,
    borderRadius:10,
    cursor:"pointer",
    transition:"all 0.25s cubic-bezier(.34,1.56,.64,1)",
    textAlign:"center",
    lineHeight:1.3,
    minHeight:56,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    touchAction:"manipulation",
    fontFamily:"system-ui, sans-serif",
  },

  primaryBtn: {
    width:"100%",
    padding:"1.1rem 1.6rem",
    fontSize:"1.05rem",
    fontWeight:700,
    color:"#fff",
    background:"linear-gradient(135deg,#ff4081,#f50057)",
    border:"none",
    borderRadius:12,
    cursor:"pointer",
    boxShadow:"0 8px 24px rgba(245,0,87,0.35)",
    transition:"all 0.3s cubic-bezier(.34,1.56,.64,1)",
    marginTop:8,
    touchAction:"manipulation",
    fontFamily:"system-ui, sans-serif",
  },

  linkResultCard: {
    marginTop:20,
    padding:"1.25rem",
    background:"linear-gradient(135deg, rgba(255,64,129,0.08) 0%, rgba(245,0,87,0.12) 100%)",
    borderRadius:16,
    border:"2px solid rgba(233,30,99,0.15)",
  },

  linkLabel: {
    fontSize:"0.9rem",
    color:"#ad1457",
    fontWeight:600,
    marginBottom:12,
    textAlign:"center",
    lineHeight:1.4,
  },

  linkBox: {
    background:"#fff",
    borderRadius:10,
    padding:"0.85rem 1rem",
    border:"1.5px solid rgba(233,30,99,0.2)",
    overflowX:"auto",
    marginBottom:12,
    WebkitOverflowScrolling:"touch",
  },

  linkText: {
    fontSize:"0.75rem",
    color:"#c2185b",
    wordBreak:"break-all",
    fontFamily:"'SF Mono','Consolas',monospace",
    lineHeight:1.5,
  },

  buttonGroup: {
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:10,
  },

  copyBtn: {
    padding:"0.9rem",
    fontSize:"0.95rem",
    fontWeight:700,
    color:"#fff",
    background:"linear-gradient(135deg,#ff4081,#f50057)",
    border:"none",
    borderRadius:10,
    cursor:"pointer",
    boxShadow:"0 4px 16px rgba(245,0,87,0.25)",
    touchAction:"manipulation",
    transition:"all 0.25s",
    fontFamily:"system-ui, sans-serif",
  },

  previewBtn: {
    padding:"0.9rem",
    fontSize:"0.95rem",
    fontWeight:600,
    color:"#e91e63",
    background:"rgba(255,255,255,0.9)",
    border:"2px solid rgba(233,30,99,0.3)",
    borderRadius:10,
    cursor:"pointer",
    touchAction:"manipulation",
    transition:"all 0.25s",
    fontFamily:"system-ui, sans-serif",
  },

  trackingCard: {
    marginTop:16,
    padding:"1rem",
    background:"rgba(255,255,255,0.7)",
    borderRadius:12,
    border:"1.5px solid rgba(233,30,99,0.15)",
  },

  trackingTitle: {
    fontSize:"0.8rem",
    fontWeight:700,
    color:"#ad1457",
    marginBottom:12,
    textAlign:"center",
    textTransform:"uppercase",
    letterSpacing:"0.05em",
  },

  trackingGrid: {
    display:"flex",
    flexDirection:"column",
    gap:8,
  },

  trackingItem: {
    display:"flex",
    justifyContent:"space-between",
    padding:"0.5rem 0",
    fontSize:"0.85rem",
    borderBottom:"1px solid rgba(233,30,99,0.1)",
  },

  trackingLabel: {
    color:"#666",
    fontWeight:500,
  },

  trackingValue: {
    color:"#e91e63",
    fontWeight:700,
  },

  successBadge: {
    marginTop:12,
    padding:"0.85rem",
    background:"linear-gradient(135deg, rgba(76,175,80,0.15) 0%, rgba(76,175,80,0.25) 100%)",
    borderRadius:10,
    textAlign:"center",
    color:"#2e7d32",
    fontWeight:700,
    fontSize:"0.95rem",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
  },

  // ─── PRANK SCREEN ───────────────────────────────────────────
  prankScreen: {
    minHeight:"100dvh",
    width:"100%",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    background:"linear-gradient(135deg,#fff5f7 0%,#ffe3e9 50%,#ffd6e0 100%)",
    overflow:"hidden",
    position:"relative",
    fontFamily:"system-ui,-apple-system,sans-serif",
    padding:"clamp(1rem, 3vw, 2rem)",
  },

  prankCard: {
    position:"relative",
    zIndex:2,
    width:"100%",
    maxWidth:600,
    background:"rgba(255,255,255,0.95)",
    backdropFilter:"blur(20px)",
    borderRadius:28,
    boxShadow:"0 24px 64px rgba(233,30,99,0.3), 0 0 0 1px rgba(255,255,255,0.6)",
    overflow:"hidden",
    animation:"slideDown 0.65s cubic-bezier(.34,1.56,.64,1)",
    padding:"2rem clamp(1rem, 3vw, 2rem) 1.5rem",
  },

  prankHeader: {
    textAlign:"center",
    marginBottom:"1.5rem",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:"1rem",
  },

  heartDecor: {
    fontSize:"2rem",
    animation:"pulse 2s ease-in-out infinite",
  },

  prankTitle: {
    fontFamily:"'Pacifico', cursive",
    fontWeight:400,
    fontSize:"clamp(1.5rem, 5vw, 2.2rem)",
    lineHeight:1.3,
    color:"#e91e63",
    textShadow:"0 2px 12px rgba(233,30,99,0.2)",
    margin:0,
  },

  escapeCounter: {
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    gap:"0.75rem",
    padding:"0.75rem 1.25rem",
    background:"linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,193,7,0.15) 100%)",
    borderRadius:14,
    marginBottom:"1.5rem",
    border:"2px solid rgba(255,152,0,0.2)",
  },

  escapeEmoji: {
    fontSize:"1.5rem",
  },

  escapeMessage: {
    margin:0,
    fontSize:"0.9rem",
    color:"#e65100",
    fontWeight:600,
  },

  arena: {
    position:"relative",
    width:"100%",
    height:"clamp(280px, 50vw, 380px)",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    touchAction:"none",
    border:"3px dashed rgba(233,30,99,0.2)",
    borderRadius:20,
    background:"linear-gradient(135deg, rgba(255,240,245,0.6) 0%, rgba(252,228,236,0.6) 100%)",
    marginBottom:"1rem",
  },

  yesBtn: {
    fontSize:"clamp(1.7rem, 6.5vw, 2.6rem)",
    fontWeight:700,
    padding:"1rem 3rem",
    border:"none",
    borderRadius:16,
    cursor:"pointer",
    color:"#fff",
    background:"linear-gradient(135deg,#ff5252,#ff1744)",
    boxShadow:"0 12px 32px rgba(255,23,68,0.45)",
    userSelect:"none",
    touchAction:"manipulation",
    zIndex:2,
    fontFamily:"system-ui, sans-serif",
    animation:"glow 2s ease-in-out infinite",
  },

  noBtn: {
    position:"absolute",
    fontSize:"clamp(1.2rem, 4.8vw, 1.9rem)",
    fontWeight:700,
    padding:"0.8rem 2.4rem",
    border:"none",
    borderRadius:14,
    cursor:"pointer",
    color:"#fff",
    background:"linear-gradient(135deg,#78909c,#546e7a)",
    boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
    userSelect:"none",
    touchAction:"manipulation",
    willChange:"transform",
    zIndex:4,
    fontFamily:"system-ui, sans-serif",
  },

  prankFooter: {
    textAlign:"center",
    marginTop:"1rem",
  },

  hintText: {
    color:"rgba(233,30,99,0.6)",
    fontSize:"0.85rem",
    margin:0,
    fontStyle:"italic",
    fontWeight:500,
  },

  // ─── CELEBRATION SCREEN ─────────────────────────────────────
  celebrationScreen: {
    minHeight:"100dvh",
    width:"100%",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    background:"linear-gradient(145deg,#6a1b9a 0%,#ec407a 55%,#e91e63 100%)",
    overflow:"hidden",
    position:"relative",
    padding:"2rem 1.5rem",
  },

  celebrationModal: {
    position:"relative",
    zIndex:2,
    width:"100%",
    maxWidth:520,
    background:"rgba(255,255,255,0.98)",
    backdropFilter:"blur(30px)",
    borderRadius:32,
    boxShadow:"0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.8)",
    padding:"3rem 2rem 2.5rem",
    textAlign:"center",
    animation:"popIn 0.7s cubic-bezier(.34,1.56,.64,1)",
  },

  celebrationIconWrapper: {
    position:"relative",
    display:"inline-block",
    marginBottom:32,
  },

  celebrationIcon: {
    fontSize:"5.5rem",
    animation:"float 3s ease-in-out infinite",
    position:"relative",
    zIndex:2,
  },

  celebrationRing: {
    position:"absolute",
    top:"50%",
    left:"50%",
    transform:"translate(-50%, -50%)",
    width:110,
    height:110,
    border:"4px solid rgba(233,30,99,0.4)",
    borderRadius:"50%",
    animation:"ripple 2.5s ease-out infinite",
  },

  celebrationRing2: {
    position:"absolute",
    top:"50%",
    left:"50%",
    transform:"translate(-50%, -50%)",
    width:110,
    height:110,
    border:"4px solid rgba(233,30,99,0.3)",
    borderRadius:"50%",
    animation:"ripple 2.5s ease-out infinite 0.7s",
  },

  celebrationTitle: {
    fontFamily:"'Playfair Display', Georgia, serif",
    fontWeight:800,
    fontSize:"clamp(2rem, 7vw, 3.2rem)",
    lineHeight:1.2,
    color:"#e91e63",
    marginBottom:20,
    textShadow:"0 2px 16px rgba(233,30,99,0.2)",
  },

  celebrationSubtitle: {
    color:"#ad1457",
    fontSize:"clamp(1.1rem, 4vw, 1.5rem)",
    fontFamily:"'Satisfy', cursive",
    lineHeight:1.4,
    marginBottom:28,
  },

  celebrationDivider: {
    width:80,
    height:3,
    background:"linear-gradient(90deg, transparent, #ff4081, transparent)",
    margin:"0 auto 28px",
    borderRadius:2,
  },

  escapeStats: {
    padding:"1.75rem 2rem",
    background:"linear-gradient(135deg, rgba(255,64,129,0.08) 0%, rgba(245,0,87,0.12) 100%)",
    borderRadius:20,
    border:"2px solid rgba(233,30,99,0.15)",
    marginBottom:24,
  },

  escapeSubtext: {
    margin:"12px 0 0",
    color:"#e91e63",
    fontSize:"0.95rem",
    fontStyle:"italic",
    fontWeight:500,
  },

  backBtn: {
    padding:"1.1rem 2.5rem",
    fontSize:"1rem",
    fontWeight:700,
    color:"#fff",
    background:"linear-gradient(135deg,#00c853,#00b140)",
    border:"none",
    borderRadius:14,
    cursor:"pointer",
    boxShadow:"0 8px 24px rgba(0,200,83,0.3)",
    transition:"all 0.3s cubic-bezier(.34,1.56,.64,1)",
    touchAction:"manipulation",
    fontFamily:"system-ui, sans-serif",
  },
};
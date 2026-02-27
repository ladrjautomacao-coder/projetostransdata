import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, List, BarChart3, Signal } from "lucide-react";
import { useEffect, useRef } from "react";

/* ───────────────────────── Satellite SVG ───────────────────────── */
function Satellite() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="drop-shadow-[0_0_20px_hsl(28,90%,52%,0.25)]">
      <defs>
        <linearGradient id="sat-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(28, 90%, 52%)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(28, 90%, 42%)" stopOpacity="0.15" />
        </linearGradient>
        <filter id="sat-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Solar panels - left */}
      <g>
        <rect x="8" y="32" width="30" height="18" rx="2" fill="hsl(220, 60%, 30%)" fillOpacity="0.3" stroke="hsl(28, 90%, 52%)" strokeWidth="0.8" strokeOpacity="0.5" />
        {[0, 1, 2].map(i => (
          <line key={i} x1={8 + i * 10 + 10} y1="32" x2={8 + i * 10 + 10} y2="50" stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0.3" />
        ))}
        {[0, 1].map(i => (
          <line key={i} x1="8" y1={38 + i * 6} x2="38" y2={38 + i * 6} stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0.3" />
        ))}
        {/* Solar cell shimmer */}
        <rect x="9" y="33" width="10" height="5" rx="0.5" fill="hsl(200, 80%, 60%)" fillOpacity="0.15">
          <animate attributeName="fillOpacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Solar panels - right */}
      <g>
        <rect x="82" y="32" width="30" height="18" rx="2" fill="hsl(220, 60%, 30%)" fillOpacity="0.3" stroke="hsl(28, 90%, 52%)" strokeWidth="0.8" strokeOpacity="0.5" />
        {[0, 1, 2].map(i => (
          <line key={i} x1={82 + i * 10 + 10} y1="32" x2={82 + i * 10 + 10} y2="50" stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0.3" />
        ))}
        {[0, 1].map(i => (
          <line key={i} x1="82" y1={38 + i * 6} x2="112" y2={38 + i * 6} stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0.3" />
        ))}
        <rect x="93" y="39" width="10" height="5" rx="0.5" fill="hsl(200, 80%, 60%)" fillOpacity="0.15">
          <animate attributeName="fillOpacity" values="0.1;0.25;0.1" dur="3s" begin="1.5s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Panel arms */}
      <rect x="38" y="39" width="10" height="3" rx="1" fill="hsl(28, 90%, 52%)" fillOpacity="0.3" />
      <rect x="72" y="39" width="10" height="3" rx="1" fill="hsl(28, 90%, 52%)" fillOpacity="0.3" />

      {/* Satellite body */}
      <rect x="48" y="26" width="24" height="30" rx="4" fill="url(#sat-body)" stroke="hsl(28, 90%, 52%)" strokeWidth="1" strokeOpacity="0.6" />

      {/* Antenna dish */}
      <path d="M56 58 Q60 68 64 58" stroke="hsl(28, 90%, 52%)" strokeWidth="1" strokeOpacity="0.6" fill="none" />
      <line x1="60" y1="56" x2="60" y2="64" stroke="hsl(28, 90%, 52%)" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="60" cy="66" r="2" fill="hsl(28, 90%, 52%)" fillOpacity="0.6" filter="url(#sat-glow)">
        <animate attributeName="fillOpacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Status light */}
      <circle cx="60" cy="33" r="3" fill="hsl(120, 70%, 50%)" fillOpacity="0.5">
        <animate attributeName="fillOpacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect x="54" y="38" width="12" height="2" rx="1" fill="hsl(28, 90%, 52%)" fillOpacity="0.3" />
      <rect x="56" y="42" width="8" height="2" rx="1" fill="hsl(28, 90%, 52%)" fillOpacity="0.2" />

      {/* Signal waves from antenna */}
      {[8, 14, 20].map((r, i) => (
        <circle key={i} cx="60" cy="66" r={r} fill="none" stroke="hsl(28, 90%, 52%)" strokeWidth="0.6" strokeOpacity="0" strokeDasharray="4 3">
          <animate attributeName="strokeOpacity" values="0;0.35;0" dur="2.5s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
          <animate attributeName="r" values={`${r};${r + 4}`} dur="2.5s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ───────────────── AVL Bus (inspired by reference image) ───────────────── */
function AVLBus() {
  return (
    <svg width="200" height="100" viewBox="0 0 320 160" fill="none" className="drop-shadow-[0_0_20px_hsl(28,90%,52%,0.2)]">
      <defs>
        <linearGradient id="bus-body-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(28, 90%, 52%)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(28, 90%, 42%)" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="bus-window-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(200, 80%, 60%)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(200, 80%, 40%)" stopOpacity="0.08" />
        </linearGradient>
        <filter id="bus-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Road surface */}
      <rect x="0" y="138" width="320" height="22" fill="hsl(220, 15%, 15%)" fillOpacity="0.15" rx="2" />
      <line x1="0" y1="148" x2="320" y2="148" stroke="hsl(28, 90%, 52%)" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="12 8" />

      {/* City skyline background */}
      {[20, 50, 80, 120, 155, 200, 240, 270].map((x, i) => (
        <rect key={i} x={x} y={100 + (i % 3) * 10} width={12 + (i % 2) * 8} height={38 - (i % 3) * 10} rx="1" fill="hsl(220, 20%, 30%)" fillOpacity="0.06" />
      ))}

      {/* Bus body - main shape */}
      <path
        d="M50 130 L50 72 Q50 62 60 62 L240 62 Q260 62 268 70 L280 82 Q284 86 284 92 L284 130 Q284 134 280 134 L54 134 Q50 134 50 130Z"
        fill="url(#bus-body-g)"
        stroke="hsl(28, 90%, 52%)"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />

      {/* Roof line accent */}
      <path d="M60 62 L240 62 Q260 62 268 70" stroke="hsl(28, 90%, 52%)" strokeWidth="1.5" strokeOpacity="0.8" fill="none" />

      {/* AVL Equipment on roof */}
      <rect x="140" y="46" width="40" height="18" rx="3" fill="hsl(28, 90%, 52%)" fillOpacity="0.15" stroke="hsl(28, 90%, 52%)" strokeWidth="1" strokeOpacity="0.5" />
      <rect x="145" y="49" width="12" height="6" rx="1" fill="hsl(200, 80%, 60%)" fillOpacity="0.2" stroke="hsl(200, 80%, 60%)" strokeWidth="0.5" strokeOpacity="0.3" />
      <text x="160" y="58" fill="hsl(28, 90%, 52%)" fillOpacity="0.7" fontSize="7" fontFamily="monospace" fontWeight="bold">AVL</text>

      {/* Status LEDs on AVL box */}
      <circle cx="148" cy="58" r="1.5" fill="hsl(120, 80%, 50%)" fillOpacity="0.6">
        <animate attributeName="fillOpacity" values="0.3;0.9;0.3" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="153" cy="58" r="1.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.6">
        <animate attributeName="fillOpacity" values="0.2;0.8;0.2" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Antenna from AVL box */}
      <line x1="160" y1="46" x2="160" y2="28" stroke="hsl(28, 90%, 52%)" strokeWidth="1.2" strokeOpacity="0.7" />
      <circle cx="160" cy="26" r="3" fill="hsl(28, 90%, 52%)" fillOpacity="0.8" filter="url(#bus-glow)">
        <animate attributeName="fillOpacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Signal waves from bus antenna */}
      {[6, 12, 18].map((r, i) => (
        <path key={i} d={`M${160 - r * 0.7} ${26 - r * 0.7} A${r} ${r} 0 0 1 ${160 + r * 0.7} ${26 - r * 0.7}`}
          fill="none" stroke="hsl(28, 90%, 52%)" strokeWidth="0.8" strokeOpacity="0">
          <animate attributeName="strokeOpacity" values="0;0.4;0" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
        </path>
      ))}

      {/* Windows - large with data displays */}
      {[68, 98, 128, 158, 188].map((x, i) => (
        <g key={i}>
          <rect x={x} y="72" width="24" height="28" rx="3" fill="url(#bus-window-g)" stroke="hsl(200, 80%, 60%)" strokeWidth="0.6" strokeOpacity="0.3" />
          {/* Data visualization inside windows */}
          <line x1={x + 4} y1={92 - i * 2} x2={x + 10} y2={86 + i} stroke="hsl(28, 90%, 52%)" strokeWidth="0.6" strokeOpacity="0.3">
            <animate attributeName="strokeOpacity" values="0.15;0.45;0.15" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
          </line>
          <line x1={x + 10} y1={86 + i} x2={x + 16} y2={89 - i} stroke="hsl(28, 90%, 52%)" strokeWidth="0.6" strokeOpacity="0.3">
            <animate attributeName="strokeOpacity" values="0.15;0.45;0.15" dur={`${2 + i * 0.5}s`} begin="0.5s" repeatCount="indefinite" />
          </line>
          <line x1={x + 16} y1={89 - i} x2={x + 20} y2={84 + i * 2} stroke="hsl(28, 90%, 52%)" strokeWidth="0.6" strokeOpacity="0.3">
            <animate attributeName="strokeOpacity" values="0.15;0.45;0.15" dur={`${2 + i * 0.5}s`} begin="1s" repeatCount="indefinite" />
          </line>
        </g>
      ))}

      {/* Windshield */}
      <path d="M218 72 L245 72 Q258 72 264 80 L274 92 L218 92 Z" fill="url(#bus-window-g)" stroke="hsl(200, 80%, 60%)" strokeWidth="0.6" strokeOpacity="0.35" />

      {/* Driver silhouette */}
      <circle cx="250" cy="82" r="5" fill="hsl(220, 20%, 30%)" fillOpacity="0.15" />
      <rect x="246" y="88" width="8" height="6" rx="2" fill="hsl(220, 20%, 30%)" fillOpacity="0.1" />

      {/* Dashboard screen */}
      <rect x="236" y="96" width="16" height="10" rx="2" fill="hsl(200, 80%, 60%)" fillOpacity="0.1" stroke="hsl(28, 90%, 52%)" strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="238" y1="99" x2="248" y2="99" stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0.4">
        <animate attributeName="x2" values="244;250;244" dur="3s" repeatCount="indefinite" />
      </line>
      <line x1="238" y1="102" x2="246" y2="102" stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0.25" />

      {/* Headlights */}
      <rect x="282" y="86" width="5" height="16" rx="2.5" fill="hsl(45, 100%, 70%)" fillOpacity="0.6" filter="url(#bus-glow)">
        <animate attributeName="fillOpacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
      </rect>

      {/* Taillights */}
      <rect x="50" y="90" width="3" height="12" rx="1.5" fill="hsl(0, 80%, 55%)" fillOpacity="0.5">
        <animate attributeName="fillOpacity" values="0.3;0.7;0.3" dur="1.2s" repeatCount="indefinite" />
      </rect>

      {/* Door */}
      <rect x="112" y="72" width="12" height="56" rx="2" fill="none" stroke="hsl(28, 90%, 52%)" strokeWidth="0.6" strokeOpacity="0.3" />
      <line x1="118" y1="72" x2="118" y2="128" stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0.2" />

      {/* Wheels */}
      {[90, 250].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy="134" r="14" fill="hsl(220, 20%, 10%)" fillOpacity="0.3" stroke="hsl(28, 90%, 52%)" strokeWidth="1" strokeOpacity="0.4" />
          <circle cx={cx} cy="134" r="8" fill="hsl(220, 20%, 15%)" fillOpacity="0.2" stroke="hsl(28, 90%, 52%)" strokeWidth="0.5" strokeOpacity="0.3" />
          <circle cx={cx} cy="134" r="3" fill="hsl(28, 90%, 52%)" fillOpacity="0.4" />
          {/* Spinning rim spokes */}
          {[0, 60, 120, 180, 240, 300].map((angle, j) => (
            <line key={j} x1={cx} y1={134 - 5} x2={cx} y2={134 - 12}
              stroke="hsl(28, 90%, 52%)" strokeWidth="0.6" strokeOpacity="0.25"
              transform={`rotate(${angle} ${cx} 134)`}
            >
              <animateTransform attributeName="transform" type="rotate" from={`${angle} ${cx} 134`} to={`${angle + 360} ${cx} 134`} dur="2s" repeatCount="indefinite" />
            </line>
          ))}
        </g>
      ))}

      {/* Undercarriage glow */}
      <rect x="80" y="136" width="160" height="2" rx="1" fill="hsl(28, 90%, 52%)" fillOpacity="0.15">
        <animate attributeName="fillOpacity" values="0.08;0.25;0.08" dur="2s" repeatCount="indefinite" />
      </rect>

      {/* Route display */}
      <rect x="60" y="64" width="40" height="8" rx="2" fill="hsl(28, 90%, 52%)" fillOpacity="0.1" stroke="hsl(28, 90%, 52%)" strokeWidth="0.5" strokeOpacity="0.3" />
      <text x="64" y="70.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.6" fontSize="5" fontFamily="monospace">TELEMETRIA</text>
    </svg>
  );
}

/* ───────────── Data Packets (animated from bus to satellite) ───────────── */
function DataPackets() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="pkt-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Data transmission path (curved) */}
      <path id="data-path-1" d="M400 340 Q380 260 420 200 Q460 140 540 90 Q590 65 620 55" fill="none" stroke="none" />
      <path id="data-path-2" d="M400 330 Q360 250 390 190 Q430 120 530 80 Q580 60 620 50" fill="none" stroke="none" />
      <path id="data-path-3" d="M410 335 Q400 270 440 210 Q480 150 550 100 Q600 70 625 58" fill="none" stroke="none" />

      {/* Main visible beam with flash effect */}
      <path d="M400 340 Q420 250 520 120 Q570 70 620 55"
        fill="none" stroke="hsl(28, 90%, 52%)" strokeWidth="2" strokeOpacity="0.08" strokeDasharray="6 3">
        <animate attributeName="strokeOpacity" values="0.04;0.15;0.04" dur="1.5s" repeatCount="indefinite" />
      </path>
      {/* Second beam line for thickness */}
      <path d="M400 340 Q420 250 520 120 Q570 70 620 55"
        fill="none" stroke="hsl(28, 90%, 65%)" strokeWidth="0.8" strokeOpacity="0.06">
        <animate attributeName="strokeOpacity" values="0.03;0.12;0.03" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* FLASH pulse along beam - bright burst effect */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`flash-${i}`}>
          {/* Outer glow halo */}
          <circle r="0" fill="hsl(28, 85%, 58%)" fillOpacity="0" filter="url(#pkt-glow)">
            <animateMotion dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite">
              <mpath href="#data-path-1" />
            </animateMotion>
            <animate attributeName="r" values="0;12;0" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0;0.45;0" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
          </circle>
          {/* Mid glow */}
          <circle r="0" fill="hsl(30, 95%, 68%)" fillOpacity="0" filter="url(#pkt-glow)">
            <animateMotion dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite">
              <mpath href="#data-path-1" />
            </animateMotion>
            <animate attributeName="r" values="0;6;0" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0;0.8;0" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
          </circle>
          {/* Core white-hot dot */}
          <circle r="0" fill="hsl(45, 100%, 92%)" fillOpacity="0">
            <animateMotion dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite">
              <mpath href="#data-path-1" />
            </animateMotion>
            <animate attributeName="r" values="0;3;0" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0;1;0" dur="1.2s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* Secondary beam flashes - path 2 */}
      {[0, 1, 2].map((i) => (
        <g key={`flash2-${i}`}>
          <circle r="0" fill="hsl(28, 90%, 55%)" fillOpacity="0" filter="url(#pkt-glow)">
            <animateMotion dur="1.4s" begin={`${i * 0.5 + 0.15}s`} repeatCount="indefinite">
              <mpath href="#data-path-2" />
            </animateMotion>
            <animate attributeName="r" values="0;10;0" dur="1.4s" begin={`${i * 0.5 + 0.15}s`} repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0;0.5;0" dur="1.4s" begin={`${i * 0.5 + 0.15}s`} repeatCount="indefinite" />
          </circle>
          <circle r="0" fill="hsl(45, 100%, 90%)" fillOpacity="0">
            <animateMotion dur="1.4s" begin={`${i * 0.5 + 0.15}s`} repeatCount="indefinite">
              <mpath href="#data-path-2" />
            </animateMotion>
            <animate attributeName="r" values="0;3;0" dur="1.4s" begin={`${i * 0.5 + 0.15}s`} repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0;0.95;0" dur="1.4s" begin={`${i * 0.5 + 0.15}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* Third path flashes */}
      {[0, 1].map((i) => (
        <g key={`flash3-${i}`}>
          <circle r="0" fill="hsl(28, 85%, 60%)" fillOpacity="0" filter="url(#pkt-glow)">
            <animateMotion dur="1.6s" begin={`${i * 0.7 + 0.3}s`} repeatCount="indefinite">
              <mpath href="#data-path-3" />
            </animateMotion>
            <animate attributeName="r" values="0;9;0" dur="1.6s" begin={`${i * 0.7 + 0.3}s`} repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0;0.55;0" dur="1.6s" begin={`${i * 0.7 + 0.3}s`} repeatCount="indefinite" />
          </circle>
          <circle r="0" fill="hsl(40, 100%, 88%)" fillOpacity="0">
            <animateMotion dur="1.6s" begin={`${i * 0.7 + 0.3}s`} repeatCount="indefinite">
              <mpath href="#data-path-3" />
            </animateMotion>
            <animate attributeName="r" values="0;2.5;0" dur="1.6s" begin={`${i * 0.7 + 0.3}s`} repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0;1;0" dur="1.6s" begin={`${i * 0.7 + 0.3}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* Sparkle bursts along the beam */}
      {[140, 180, 220, 260, 300, 340].map((y, i) => (
        <circle key={i} cx={395 + (i - 2.5) * 22 + i * 12} cy={y} r="1"
          fill="hsl(28, 90%, 65%)" fillOpacity="0">
          <animate attributeName="fillOpacity" values="0;0.7;0" dur="1s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="0.3;5;0.3" dur="1s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ───────────── Particle Field Background ───────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; pulse: number }[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5, opacity: Math.random() * 0.2 + 0.03,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.015;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.fillStyle = `hsla(28, 90%, 52%, ${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        particles.forEach((p2, j) => {
          if (j <= i) return;
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.strokeStyle = `hsla(28, 90%, 52%, ${0.04 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ───────────── Stars / Moon ───────────── */
function StarsAndMoon() {
  return (
    <div className="absolute top-4 right-8 pointer-events-none">
      {/* Moon */}
      <svg width="40" height="40" viewBox="0 0 40 40" className="absolute top-2 right-4 opacity-20">
        <path d="M25 5 A15 15 0 1 0 25 35 A12 12 0 1 1 25 5" fill="hsl(40, 30%, 70%)" />
      </svg>
      {/* Stars */}
      {[
        { x: 20, y: 10, s: 2 }, { x: 60, y: 25, s: 1.5 }, { x: 90, y: 8, s: 1 },
        { x: 140, y: 20, s: 1.8 }, { x: 180, y: 12, s: 1.2 },
      ].map((star, i) => (
        <svg key={i} className="absolute opacity-15" style={{ left: star.x, top: star.y }} width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r={star.s} fill="hsl(40, 30%, 80%)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        </svg>
      ))}
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function Projects() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const cards = [
    ...(isAdmin ? [{
      title: "Cadastrar Novo Projeto",
      description: "Crie um novo projeto no sistema",
      icon: Plus,
      onClick: () => navigate("/projetos/novo"),
      glow: false,
    }] : []),
    {
      title: "Visualizar Projetos",
      description: "Veja e gerencie os projetos existentes",
      icon: List,
      onClick: () => navigate("/projetos/lista"),
      glow: false,
    },
    {
      title: "Visão Analítica",
      description: "Dashboard com gráficos e métricas dos projetos",
      icon: BarChart3,
      onClick: () => navigate("/projetos/analitico"),
      glow: true,
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Particle network background */}
      <div className="absolute inset-0 pointer-events-none"><ParticleField /></div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(28, 90%, 52%) 1px, transparent 1px), linear-gradient(90deg, hsl(28, 90%, 52%) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* Stars and moon */}
      <StarsAndMoon />

      {/* ── TELEMETRY SCENE ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Data packets animation layer */}
        <DataPackets />

        {/* Satellite - top right area */}
        <div className="absolute" style={{ top: "3%", right: "12%", animation: "float-satellite 8s ease-in-out infinite" }}>
          <Satellite />
        </div>

        {/* AVL Bus - bottom center area */}
        <div className="absolute" style={{ bottom: "8%", left: "18%", animation: "bus-hover 4s ease-in-out infinite" }}>
          <AVLBus />
        </div>
      </div>

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          style={{ animation: "scan-horizontal 6s ease-in-out infinite", top: "30%" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Signal className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
            Módulo de Projetos
          </span>
          <Signal className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
          Projetos
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          Gerencie, monitore e analise seus projetos de telemetria
        </p>
      </div>

      {/* Cards */}
      <div className={`relative z-10 grid gap-8 w-full max-w-5xl px-4 justify-center ${cards.length <= 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {cards.map((card, i) => (
          <Card
            key={card.title}
            className={`
              group cursor-pointer transition-all duration-500 hover:-translate-y-2 relative overflow-hidden
              border-border/50 backdrop-blur-sm bg-card/80
              ${card.glow ? "glow-orange-strong" : "hover:glow-orange"}
            `}
            onClick={card.onClick}
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-500 ${
              card.glow
                ? "bg-gradient-to-r from-primary via-primary/80 to-primary/40"
                : "bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:from-primary/40 group-hover:via-primary group-hover:to-primary/40"
            }`} />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-primary/0 group-hover:border-primary/30 transition-all duration-500 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-primary/0 group-hover:border-primary/30 transition-all duration-500 rounded-bl-lg" />

            <CardContent className="flex flex-col items-center text-center p-10 gap-5 relative z-10">
              <div className={`
                flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500
                ${card.glow
                  ? "bg-primary/15 text-primary pulse-glow"
                  : "bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110"
                }
              `}>
                <card.icon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1.5">{card.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span>Acessar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom decorative line */}
      <div className="relative z-10 mt-12 flex items-center gap-3 text-muted-foreground/40">
        <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
        <Signal className="h-3 w-3 text-primary/40" />
        <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
      </div>
    </div>
  );
}

interface OptimusLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  className?: string
  glow?: boolean
  showWordmark?: boolean
}

export function OptimusLogo({
  size = 'md',
  className = '',
  glow = true,
  showWordmark = false,
}: OptimusLogoProps) {
  const pixelSize =
    typeof size === 'number'
      ? size
      : {
          xs: 22,
          sm: 30,
          md: 38,
          lg: 56,
          xl: 76,
        }[size]

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="relative shrink-0 select-none"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {glow && (
          <div
            className="absolute inset-0 -z-10 rounded-full blur-md opacity-80"
            style={{
              background:
                'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(0, 240, 255, 0.35) 45%, rgba(239, 68, 68, 0.2) 75%, transparent 100%)',
              transform: 'scale(1.3)',
            }}
          />
        )}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_2px_12px_rgba(0,212,255,0.35)]"
          aria-hidden="true"
        >
          <defs>
            {/* Primary Electric Blue Gradient */}
            <linearGradient id="optBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="35%" stopColor="#2563eb" />
              <stop offset="75%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Deep Metallic Blue Gradient */}
            <linearGradient id="optDeepBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Optimus Crimson Red Gradient */}
            <linearGradient id="optRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="40%" stopColor="#ef4444" />
              <stop offset="85%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>

            {/* Dark Cyber Titanium Base */}
            <linearGradient id="optDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b0f19" />
              <stop offset="50%" stopColor="#131b2e" />
              <stop offset="100%" stopColor="#070a12" />
            </linearGradient>

            {/* Neon Cyan Eye / Visor Glow */}
            <linearGradient id="optVisorGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Purple Aura Ring Gradient */}
            <linearGradient id="optPurpleAura" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>

            {/* Metallic Chrome Trim */}
            <linearGradient id="optChromeTrim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <filter id="optEyeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Cybernetic Energy Ring */}
          <circle
            cx="50"
            cy="50"
            r="47"
            stroke="url(#optPurpleAura)"
            strokeWidth="1.2"
            strokeOpacity="0.45"
            strokeDasharray="4 2"
          />

          {/* Base Shield Chassis */}
          <polygon
            points="50,5 88,23 80,73 50,95 20,73 12,23"
            fill="url(#optDarkGrad)"
            stroke="url(#optBlueGrad)"
            strokeWidth="1.4"
          />

          {/* Top Center Crown / Crest Antenna (Iconic Optimus Fin) */}
          <polygon
            points="50,9 56,23 50,29 44,23"
            fill="url(#optBlueGrad)"
            stroke="#00f0ff"
            strokeWidth="1"
          />
          <polygon
            points="50,12 53,22 50,26 47,22"
            fill="#38bdf8"
            opacity="0.9"
          />

          {/* Left Wing / Ear Fin Assembly */}
          <polygon
            points="21,13 33,25 27,53 17,45 13,23"
            fill="url(#optBlueGrad)"
            stroke="rgba(0, 240, 255, 0.8)"
            strokeWidth="1"
          />
          <polygon
            points="17,23 27,33 23,49 15,41"
            fill="url(#optRedGrad)"
            stroke="#ff4d6d"
            strokeWidth="0.6"
          />

          {/* Right Wing / Ear Fin Assembly */}
          <polygon
            points="79,13 67,25 73,53 83,45 87,23"
            fill="url(#optBlueGrad)"
            stroke="rgba(0, 240, 255, 0.8)"
            strokeWidth="1"
          />
          <polygon
            points="83,23 73,33 77,49 85,41"
            fill="url(#optRedGrad)"
            stroke="#ff4d6d"
            strokeWidth="0.6"
          />

          {/* Forehead V-Crest (Distinctive Optimus Prime Brow Plate) */}
          <polygon
            points="50,21 67,35 59,41 50,31 41,41 33,35"
            fill="url(#optRedGrad)"
            stroke="#ff4d6d"
            strokeWidth="1"
          />

          {/* Inner Brow Inset */}
          <polygon
            points="50,26 60,34 50,29 40,34"
            fill="#fecdd3"
            opacity="0.3"
          />

          {/* Helmet Visor Brow Frame */}
          <polygon
            points="31,39 69,39 65,48 35,48"
            fill="url(#optDeepBlue)"
            stroke="rgba(0, 240, 255, 0.5)"
            strokeWidth="1"
          />

          {/* Electric Blue Optical Visor Slits / Eyes */}
          <g filter="url(#optEyeGlow)">
            {/* Left Eye */}
            <polygon
              points="34,42 45,42 42,47 33,47"
              fill="url(#optVisorGlow)"
            />
            {/* Right Eye */}
            <polygon
              points="55,42 66,42 67,47 58,47"
              fill="url(#optVisorGlow)"
            />
            {/* Center Bridge Sensor */}
            <rect
              x="48"
              y="43"
              width="4"
              height="2.5"
              rx="0.5"
              fill="#00f0ff"
            />
          </g>

          {/* Faceplate / Mouthguard Center Chassis */}
          <polygon
            points="37,51 63,51 59,75 50,83 41,75"
            fill="url(#optDarkGrad)"
            stroke="url(#optPurpleAura)"
            strokeWidth="1.2"
          />

          {/* Mouthplate Horizontal Metallic Vents */}
          <line
            x1="41"
            y1="57"
            x2="59"
            y2="57"
            stroke="url(#optBlueGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="43"
            y1="63"
            x2="57"
            y2="63"
            stroke="url(#optBlueGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="45"
            y1="69"
            x2="55"
            y2="69"
            stroke="url(#optBlueGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Chin Guard Accent */}
          <polygon
            points="45,76 55,76 53,87 47,87"
            fill="url(#optRedGrad)"
            stroke="#ff3366"
            strokeWidth="0.8"
          />

          {/* Side Cheek Armor Panels */}
          <polygon
            points="25,51 35,51 37,71 25,63"
            fill="url(#optRedGrad)"
            stroke="rgba(239, 68, 68, 0.7)"
            strokeWidth="1"
          />
          <polygon
            points="75,51 65,51 63,71 75,63"
            fill="url(#optRedGrad)"
            stroke="rgba(239, 68, 68, 0.7)"
            strokeWidth="1"
          />

          {/* Lower Jaw Corner Nodes */}
          <circle cx="26" cy="62" r="1.5" fill="#00f0ff" opacity="0.8" />
          <circle cx="74" cy="62" r="1.5" fill="#00f0ff" opacity="0.8" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span className="font-['Orbitron',sans-serif] text-lg font-extrabold tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 drop-shadow-[0_2px_10px_rgba(56,189,248,0.4)]">
            OPTIMUS
          </span>
          <span className="text-[9.5px] font-bold tracking-[0.24em] text-cyan-400/90 uppercase">
            AI Voice Tutor
          </span>
        </div>
      )}
    </div>
  )
}


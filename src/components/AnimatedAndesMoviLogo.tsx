import React from 'react';

interface AnimatedAndesMoviLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  showShadow?: boolean;
}

/**
 * Componente SVG del Emblema 3D Futurista de AndesMovi
 * Integra el fondo de squircle con degradado azul neón y naranja brillante,
 * la silueta multifacética de las montañas de los Andes (Cayembe),
 * la elegante letra "A" estilizada entrelazada con una autopista curvada en perspectiva 3D,
 * y movimiento súper realista del auto ejecutivo y la moto con faros y efectos de brillo.
 */
export const AndesMovi3DLogoSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Degradados Principales */}
        <linearGradient id="bgSquircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="40%" stopColor="#1C2541" />
          <stop offset="85%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#0052FF" />
        </linearGradient>

        <linearGradient id="neonOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8C00" />
          <stop offset="50%" stopColor="#FF5500" />
          <stop offset="100%" stopColor="#E63900" />
        </linearGradient>

        <linearGradient id="neonBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="50%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#0033B3" />
        </linearGradient>

        <linearGradient id="goldBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        <linearGradient id="letterAGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        <linearGradient id="roadRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="50%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#0052FF" />
        </linearGradient>

        <linearGradient id="mountainPeakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#0284C7" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        {/* Filtros de Brillo y Sombra */}
        <filter id="glowNeon" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="heavyGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="dropShadowCard" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.6" />
        </filter>

        {/* Máscaras de Reflejo */}
        <linearGradient id="glassSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* CSS KEYFRAMES PARA MOVIMIENTO SUPER REALISTA */}
        <style>{`
          @keyframes badgeFloat3D {
            0%, 100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
            50% { transform: translateY(-8px) rotateX(2deg) rotateY(-1deg); }
          }
          .emblem-floating {
            animation: badgeFloat3D 5s ease-in-out infinite;
            transform-origin: 250px 250px;
          }

          @keyframes sweepGlint {
            0% { transform: translateX(-350px) translateY(-100px) rotate(25deg); }
            100% { transform: translateX(450px) translateY(100px) rotate(25deg); }
          }
          .glint-effect {
            animation: sweepGlint 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          /* Movimiento ultra fluido del carro siguiendo la autopista */
          @keyframes realisticCarMove {
            0% {
              transform: translate(90px, 320px) scale(0.65) rotate(-18deg);
              opacity: 0.9;
            }
            35% {
              transform: translate(210px, 280px) scale(0.85) rotate(-6deg);
              opacity: 1;
            }
            70% {
              transform: translate(340px, 330px) scale(1.1) rotate(14deg);
              opacity: 1;
            }
            100% {
              transform: translate(410px, 390px) scale(1.25) rotate(24deg);
              opacity: 0;
            }
          }
          .car-real-motion {
            animation: realisticCarMove 3.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            transform-origin: center;
          }

          /* Movimiento fluido de la moto en el carril superior */
          @keyframes realisticMotoMove {
            0% {
              transform: translate(390px, 380px) scale(1.15) rotate(-22deg);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            60% {
              transform: translate(230px, 260px) scale(0.8) rotate(4deg);
              opacity: 1;
            }
            100% {
              transform: translate(110px, 310px) scale(0.6) rotate(18deg);
              opacity: 0.8;
            }
          }
          .moto-real-motion {
            animation: realisticMotoMove 4.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
            animation-delay: 1.2s;
            transform-origin: center;
          }

          @keyframes dashFlow {
            0% { stroke-dashoffset: 60; }
            100% { stroke-dashoffset: 0; }
          }
          .road-line-anim {
            stroke-dasharray: 12 10;
            animation: dashFlow 1s linear infinite;
          }

          @keyframes headlightBeam {
            0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 8px #00F0FF); }
            50% { opacity: 1; filter: drop-shadow(0 0 18px #00F0FF); }
          }
          .headlight-glow { animation: headlightBeam 1.5s ease-in-out infinite; }

          @keyframes mountainPulse {
            0%, 100% { filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.3)); }
            50% { filter: drop-shadow(0 0 18px rgba(255, 107, 0, 0.5)); }
          }
          .mountain-glow-effect { animation: mountainPulse 4s ease-in-out infinite; }
        `}</style>

        {/* Plantilla: Auto Ejecutivo Sedán 3D */}
        <g id="car-3d-model">
          <g transform="translate(-30, -18)">
            {/* Sombra proyectada del carro */}
            <ellipse cx="30" cy="28" rx="28" ry="8" fill="rgba(0,0,0,0.6)" filter="blur(4px)" />
            
            {/* Haz de luz de los faros */}
            <polygon points="45,18 95,-5 90,38 45,22" fill="url(#neonBlueGrad)" opacity="0.35" className="headlight-glow" />

            {/* Chasis metálico aerodinámico */}
            <path d="M 5 20 C 8 10, 20 6, 35 6 L 42 12 C 48 12, 54 16, 56 22 L 56 26 L 5 26 Z" fill="#0052FF" stroke="#00F0FF" strokeWidth="1.5" />
            <path d="M 2 22 C 2 18, 10 16, 22 16 L 45 16 C 52 16, 58 20, 58 24 L 58 28 L 2 28 Z" fill="url(#neonOrangeGrad)" />
            
            {/* Parabrisas y ventanas polarizadas */}
            <path d="M 18 10 L 32 10 L 38 16 L 16 16 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            
            {/* Faros delanteros neón */}
            <circle cx="55" cy="22" r="2.5" fill="#00F0FF" className="headlight-glow" />
            <circle cx="3" cy="22" r="2" fill="#FF2200" />
            
            {/* Llantas en perspectiva */}
            <circle cx="14" cy="27" r="5" fill="#020617" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="44" cy="27" r="5" fill="#020617" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="14" cy="27" r="2" fill="#00F0FF" />
            <circle cx="44" cy="27" r="2" fill="#00F0FF" />
          </g>
        </g>

        {/* Plantilla: Motocicleta Express 3D */}
        <g id="moto-3d-model">
          <g transform="translate(-20, -15)">
            {/* Sombra proyectada */}
            <ellipse cx="20" cy="22" rx="18" ry="6" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            
            {/* Luz de faro */}
            <polygon points="-5,15 -45,0 -40,30 -5,17" fill="#FF8C00" opacity="0.3" className="headlight-glow" />

            {/* Cuerpo de moto neón */}
            <path d="M 5 12 L 20 8 L 30 14 L 18 20 Z" fill="url(#neonOrangeGrad)" stroke="#FFD700" strokeWidth="1" />
            
            {/* Conductor con casco neón */}
            <circle cx="16" cy="6" r="4.5" fill="#00F0FF" />
            <path d="M 12 10 Q 16 12 20 10 L 18 18 L 10 18 Z" fill="#0F172A" />
            
            {/* Ruedas en movimiento */}
            <circle cx="6" cy="20" r="4.5" fill="#000000" stroke="#00F0FF" strokeWidth="1" />
            <circle cx="28" cy="20" r="4.5" fill="#000000" stroke="#FF8C00" strokeWidth="1" />
          </g>
        </g>
      </defs>

      {/* EMBLEMA CENTRAL CON LEVITACIÓN 3D */}
      <g className="emblem-floating" filter="url(#dropShadowCard)">
        {/* Sombra proyectada exterior */}
        <rect x="50" y="50" width="400" height="400" rx="95" fill="none" />

        {/* 1. SQUIRCLE BASE CON BISLE METÁLICO CROMADO */}
        <rect x="45" y="45" width="410" height="410" rx="100" fill="url(#goldBevelGrad)" />
        <rect x="50" y="50" width="400" height="400" rx="95" fill="url(#bgSquircleGrad)" />
        
        {/* Resplandor interior del borde de la tarjeta */}
        <rect x="52" y="52" width="396" height="396" rx="93" fill="none" stroke="url(#neonOrangeGrad)" strokeWidth="3" opacity="0.8" />
        <rect x="58" y="58" width="384" height="384" rx="88" fill="none" stroke="url(#neonBlueGrad)" strokeWidth="1.5" opacity="0.6" />

        {/* 2. SILUETA MULTIFACÉTICA DE LAS MONTAÑAS DE LOS ANDES (CAYEMBE) */}
        <g className="mountain-glow-effect">
          {/* Montaña Secundaria (Izquierda) */}
          <polygon points="70,360 170,180 270,360" fill="url(#mountainPeakGrad)" opacity="0.75" />
          <polygon points="170,180 210,240 270,360 170,360" fill="#0284C7" opacity="0.3" />
          {/* Nieve Montaña Izquierda */}
          <polygon points="170,180 150,215 170,205 190,215" fill="url(#snowGrad)" />

          {/* Montaña Secundaria (Derecha) */}
          <polygon points="230,370 340,160 430,370" fill="url(#mountainPeakGrad)" opacity="0.7" />
          {/* Nieve Montaña Derecha */}
          <polygon points="340,160 318,200 340,190 362,200" fill="url(#snowGrad)" />

          {/* MONTAÑA PRINCIPAL DE LOS ANDES (CENTRO) */}
          <polygon points="110,380 250,110 390,380" fill="url(#mountainPeakGrad)" />
          {/* Cara en sombra de la montaña */}
          <polygon points="250,110 250,380 390,380" fill="#0369A1" opacity="0.4" />
          
          {/* Cumbre Nevada Resplandeciente */}
          <polygon points="250,110 210,180 235,168 250,178 265,168 290,180" fill="url(#snowGrad)" filter="url(#glowNeon)" />
        </g>

        {/* 3. AUTOPISTA VECTORIAL DINÁMICA (ROAD RIBBON 3D) */}
        <g>
          {/* Cinta Ancha de la Autopista Neón */}
          <path
            d="M 60,320 C 130,230 200,320 280,270 C 340,230 380,290 440,390"
            fill="none"
            stroke="url(#roadRibbonGrad)"
            strokeWidth="32"
            strokeLinecap="round"
            filter="url(#glowNeon)"
            opacity="0.9"
          />
          {/* Asfalto interior oscuro */}
          <path
            d="M 60,320 C 130,230 200,320 280,270 C 340,230 380,290 440,390"
            fill="none"
            stroke="#090D16"
            strokeWidth="22"
            strokeLinecap="round"
          />
          {/* Línea Divisoria Neón Discontinua Animada */}
          <path
            d="M 60,320 C 130,230 200,320 280,270 C 340,230 380,290 440,390"
            fill="none"
            stroke="#00F0FF"
            strokeWidth="3"
            className="road-line-anim"
            strokeLinecap="round"
          />
        </g>

        {/* 4. LETRA "A" ESTILIZADA EN 3D FUTURISTA (SIMBOLOGÍA ANDES) */}
        <g filter="url(#glowNeon)">
          {/* Trazo Izquierdo de la "A" (Blanco Plateado) */}
          <path
            d="M 250,110 L 150,330 L 195,330 L 250,195 Z"
            fill="url(#letterAGrad)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          {/* Trazo Derecho de la "A" con Corte de Velocidad Aerodinámico */}
          <path
            d="M 250,110 L 350,330 L 305,330 L 250,195 Z"
            fill="url(#letterAGrad)"
            stroke="#CBD5E1"
            strokeWidth="2"
          />
          {/* Puente Horizontal Neón de la "A" (Entrelazado con la Autopista Naranja) */}
          <path
            d="M 180,260 Q 250,235 320,260 L 310,285 Q 250,260 190,285 Z"
            fill="url(#neonOrangeGrad)"
            filter="url(#glowNeon)"
          />
        </g>

        {/* 5. VEHÍCULOS EN MOVIMIENTO REALISTA SIGUIENDO LA AUTOPISTA */}
        {/* Carro Ejecutivo Neón */}
        <g className="car-real-motion">
          <use href="#car-3d-model" />
        </g>

        {/* Motocicleta Express Neón */}
        <g className="moto-real-motion">
          <use href="#moto-3d-model" />
        </g>

        {/* 6. EFECTO DE DESTELLO Y CRISTAL DE SUPERFICIE (3D GLOSSY SWEEP) */}
        <g style={{ mixBlendMode: 'overlay' }}>
          <rect
            x="45"
            y="45"
            width="410"
            height="410"
            rx="100"
            fill="url(#glassSweepGrad)"
            className="glint-effect"
            clipPath="url(#squircleClip)"
          />
        </g>

        {/* TEXTO INFERIOR "ANDESMOVI" */}
        <text
          x="250"
          y="428"
          textAnchor="middle"
          fill="#FFFFFF"
          style={{
            fontSize: '32px',
            fontWeight: '900',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '6px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(0,240,255,0.6))',
          }}
        >
          ANDESMOVI
        </text>
      </g>
    </svg>
  );
};

export const AnimatedAndesMoviLogo: React.FC<AnimatedAndesMoviLogoProps> = ({
  className = '',
  size = 'md',
  showShadow = true,
}) => {
  const sizeClasses = {
    icon: 'w-10 h-10',
    sm: 'w-36 h-28',
    md: 'w-56 h-40',
    lg: 'w-68 h-48',
    xl: 'w-84 h-56',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <AndesMovi3DLogoSVG className="w-full h-full" />
    </div>
  );
};

import React, { useState } from 'react';
import { ServiceType, UserProfile } from '../types';
import { haptic } from '../utils/haptics';
import { LegalTermsModal, LegalDocType } from './LegalTermsModal';
import { AudiVehicleIcon, YamahaBikeIcon } from './vehicleIcons';
import { AnimatedAndesMoviLogo } from './AnimatedAndesMoviLogo';
import {
  Package,
  Car,
  MapPin,
  Headphones,
  User,
  UserPlus,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Mountain,
  Navigation,
  Compass,
  PhoneCall,
  Flame,
  Banknote,
  Smartphone,
  Gift,
} from 'lucide-react';

interface AndesMoviHomeHubProps {
  onSelectService: (service: ServiceType) => void;
  onOpenAuth: (initialTab?: 'social' | 'cedula' | 'email' | 'telefono') => void;
  onOpenSupport: () => void;
  onOpenInterprovincial: () => void;
  onStartBookingNow: () => void;
  onOpenLoyaltyPromos: () => void;
  currentUser: UserProfile | null;
  onOpenAdminPanel?: () => void;
  onOpenFlutterDesign?: () => void;
  isDark?: boolean;
}

export const AndesMoviHomeHub: React.FC<AndesMoviHomeHubProps> = ({
  onSelectService,
  onOpenAuth,
  onOpenSupport,
  onOpenInterprovincial,
  onStartBookingNow,
  onOpenLoyaltyPromos,
  currentUser,
  onOpenAdminPanel,
  onOpenFlutterDesign,
  isDark = true,
}) => {
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terminos');

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* Visual Canvas matching the exact AndesMovi phone interface from the photo */}
      <div className={`relative rounded-[32px] overflow-hidden border shadow-2xl p-4 sm:p-5 flex flex-col gap-4 transition-all ${
        isDark 
          ? 'border-amber-600/30 bg-gradient-to-b from-[#1c1613] via-[#14100e] to-[#0c0a09] text-white' 
          : 'border-slate-200 bg-white text-slate-900 shadow-slate-200'
      }`}>
        
        {/* Loyalty Points Display */}
        {currentUser && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5">
            <div className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 backdrop-blur-sm shadow-sm ${
              isDark ? 'bg-black/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <Banknote className="w-4 h-4 text-emerald-500" />
              <span className={`text-xs font-black ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>{currentUser.loyaltyPoints || 0} pts</span>
            </div>
            {currentUser.hasActiveFreeRideCoupon && (
              <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse uppercase">
                ⚡ Carrera Gratis (Menor de $5) Activa
              </span>
            )}
          </div>
        )}

        {/* Subtle Andean Volcanic Mountain Backdrop & Highlights */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full bg-sky-600/15 blur-3xl" />
          <svg
            className="absolute bottom-0 right-0 w-full h-48 text-amber-500/10"
            viewBox="0 0 400 200"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <polygon points="0,200 80,80 150,140 240,40 330,120 400,20 400,200" />
            <polygon points="40,200 130,100 200,160 300,70 370,140 400,90 400,200" opacity="0.5" />
          </svg>
        </div>

        {/* TOP BRAND HEADER (Slogan Arcoíris Curvado Extra Visible ENCIMA del Logo Emblem 3D) */}
        <div className="andesmovi-logo-banner relative z-10 flex flex-col items-center text-center pt-1">
          {/* 1. Slogan Arcoíris Curvado ENCIMA del Logotipo - 100% Completo y Ultra Legible */}
          <div className="w-full flex justify-center -mb-3 sm:-mb-4 z-20 pointer-events-none">
            <svg viewBox="0 0 440 90" className="w-full max-w-[360px] sm:max-w-[420px] h-16 sm:h-20 overflow-visible">
              <defs>
                {/* CSS Keyframes + SMIL para Animación de Bucle Infinito Ultra Rápida y Fluida */}
                <style>{`
                  @keyframes rainbowFlowTranslate {
                    0% { transform: translateX(0px); }
                    100% { transform: translateX(-440px); }
                  }
                  .rainbow-animated-linear {
                    animation: rainbowFlowTranslate 2.2s linear infinite !important;
                  }
                `}</style>

                {/* Degradado Arcoíris Neón Animado en Bucle Infinito */}
                <linearGradient
                  id="andesRainbowGradHeader"
                  x1="0%"
                  y1="0%"
                  x2="200%"
                  y2="0%"
                  className="rainbow-animated-linear"
                >
                  <stop offset="0%" stopColor="#FF0055" />
                  <stop offset="10%" stopColor="#FF6D00" />
                  <stop offset="20%" stopColor="#FFD600" />
                  <stop offset="30%" stopColor="#00E676" />
                  <stop offset="40%" stopColor="#00B0FF" />
                  <stop offset="50%" stopColor="#651FFF" />
                  <stop offset="60%" stopColor="#FF00B7" />
                  <stop offset="70%" stopColor="#FF0055" />
                  <stop offset="80%" stopColor="#FF6D00" />
                  <stop offset="90%" stopColor="#FFD600" />
                  <stop offset="100%" stopColor="#00E676" />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="0 0"
                    to="-440 0"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </linearGradient>

                {/* Filtro de Sombra de Fondo y Borde de Máxima Nitidez */}
                <filter id="rainbowTextGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="1" />
                  <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.9" />
                </filter>

                {/* Ruta de Arco Curvado Aumentada y Perfectamente Proporcionada */}
                <path id="rainbowHeaderArcPath" d="M 15 76 Q 220 2 425 76" fill="none" />
              </defs>
              <text
                filter="url(#rainbowTextGlow)"
                className="font-black text-[11px] sm:text-[12.5px] uppercase tracking-tight sm:tracking-normal"
                stroke="#000000"
                strokeWidth="0.7"
                paintOrder="stroke fill"
              >
                <textPath
                  href="#rainbowHeaderArcPath"
                  startOffset="50%"
                  textAnchor="middle"
                  fill="url(#andesRainbowGradHeader)"
                >
                  "TU CONFIANZA, TU SEGURIDAD, NUESTRO COMPROMISO"
                </textPath>
              </text>
            </svg>
          </div>

          {/* 2. Emblema 3D Animado (Debajo del Arcoíris) */}
          <div className="relative w-48 h-32 sm:w-56 sm:h-36 flex items-center justify-center -mb-2">
            <AnimatedAndesMoviLogo size="lg" showShadow={true} />
          </div>
        </div>

        {/* WELCOME CONTAINER WITH THREE PILLARS (Oculto en teléfonos, visible en tablets y computadoras) */}
        <div className={`andesmovi-welcome-hero hidden md:flex relative z-10 rounded-2xl border p-4 shadow-inner flex-col gap-2.5 transition-all ${
          isDark 
            ? 'bg-gradient-to-b from-[#211a16]/90 to-[#191310]/90 border-amber-600/30' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-base sm:text-lg font-black text-center transition-all ${
            isDark 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300' 
              : 'text-slate-900'
          }`}>
            ¡Bienvenido a ANDESMOVI!
          </h2>

          <div className="flex flex-col gap-2 pt-1">
            {/* Item 1 */}
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${
                isDark ? 'bg-sky-500/20 border-sky-400/40 text-sky-400' : 'bg-sky-100 border-sky-200 text-sky-600'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className={`tracking-wide uppercase text-[11px] sm:text-xs transition-all ${isDark ? 'text-zinc-100' : 'text-slate-700'}`}>
                PAQUETES SEGUROS
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${
                isDark ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-600'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className={`tracking-wide uppercase text-[11px] sm:text-xs transition-all ${isDark ? 'text-zinc-100' : 'text-slate-700'}`}>
                CARRERAS SEGURAS
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${
                isDark ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-600'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className={`tracking-wide uppercase text-[11px] sm:text-xs transition-all ${isDark ? 'text-zinc-100' : 'text-slate-700'}`}>
                ENCOMIENDAS SEGURAS
              </span>
            </div>
          </div>
        </div>

        {/* 4 SERVICIOS PRINCIPALES DE ANDESMOVI (CUADRÍCULA INTERACTIVA 2X2) */}
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Nuestros 4 Servicios Estrella
            </span>
            <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Ecuador 24/7
            </span>
          </div>

          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              width: '100%',
            }}
          >
            {/* BOTÓN 1: TAXI EJECUTIVO */}
            <button
              id="quick-service-vehiculos"
              type="button"
              onClick={() => {
                haptic.tap();
                onSelectService('viaje');
              }}
              style={{
                borderRadius: '14px',
                backgroundColor: isDark ? '#1a1f26' : '#ffffff',
                border: isDark ? '1px solid #2a333d' : '1px solid #e2e8f0',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '90px',
              }}
              className={`active:scale-[0.97] transition-all cursor-pointer shadow-lg group ${
                isDark ? 'hover:bg-[#222933]' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl border mb-1.5 group-hover:scale-110 transition-transform ${
                isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <AudiVehicleIcon className="w-6 h-6" size={26} />
              </div>
              <span className={`text-xs font-black uppercase leading-snug whitespace-normal break-words w-full ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              }`}>
                Taxi Ejecutivo
              </span>
              <span className={`text-[10px] font-medium leading-snug whitespace-normal break-words mt-0.5 w-full ${
                isDark ? 'text-zinc-300' : 'text-slate-500'
              }`}>
                Carreras Urbanas
              </span>
            </button>

            {/* BOTÓN 2: MOTO EXPRESS */}
            <button
              id="quick-service-domicilios"
              type="button"
              onClick={() => {
                haptic.tap();
                onSelectService('domicilio');
              }}
              style={{
                borderRadius: '14px',
                backgroundColor: isDark ? '#1a1f26' : '#ffffff',
                border: isDark ? '1px solid #2a333d' : '1px solid #e2e8f0',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '90px',
              }}
              className={`active:scale-[0.97] transition-all cursor-pointer shadow-lg group ${
                isDark ? 'hover:bg-[#222933]' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl border mb-1.5 group-hover:scale-110 transition-transform ${
                isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-600 border-sky-200'
              }`}>
                <YamahaBikeIcon className="w-6 h-6" size={26} />
              </div>
              <span className={`text-xs font-black uppercase leading-snug whitespace-normal break-words w-full ${
                isDark ? 'text-sky-300' : 'text-sky-700'
              }`}>
                Moto Express
              </span>
              <span className={`text-[10px] font-medium leading-snug whitespace-normal break-words mt-0.5 w-full ${
                isDark ? 'text-zinc-300' : 'text-slate-500'
              }`}>
                Delivery Rápido
              </span>
            </button>

            {/* BOTÓN 3: ENCOMIENDAS */}
            <button
              id="quick-service-paquetes"
              type="button"
              onClick={() => {
                haptic.tap();
                onSelectService('encomienda');
              }}
              style={{
                borderRadius: '14px',
                backgroundColor: isDark ? '#1a1f26' : '#ffffff',
                border: isDark ? '1px solid #2a333d' : '1px solid #e2e8f0',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '90px',
              }}
              className={`active:scale-[0.97] transition-all cursor-pointer shadow-lg group ${
                isDark ? 'hover:bg-[#222933]' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl border mb-1.5 group-hover:scale-110 transition-transform ${
                isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                <Package className="w-5 h-5" />
              </div>
              <span className={`text-xs font-black uppercase leading-snug whitespace-normal break-words w-full ${
                isDark ? 'text-emerald-300' : 'text-emerald-700'
              }`}>
                Encomiendas
              </span>
              <span className={`text-[10px] font-medium leading-snug whitespace-normal break-words mt-0.5 w-full ${
                isDark ? 'text-zinc-300' : 'text-slate-500'
              }`}>
                Paquetería Segura
              </span>
            </button>

            {/* BOTÓN 4: INTERPROVINCIAL */}
            <button
              id="quick-service-ejecutivo"
              type="button"
              onClick={() => {
                haptic.tap();
                onSelectService('ejecutivo_quito');
                if (onOpenInterprovincial) onOpenInterprovincial();
              }}
              style={{
                borderRadius: '14px',
                backgroundColor: isDark ? '#1a1f26' : '#ffffff',
                border: isDark ? '1px solid #2a333d' : '1px solid #e2e8f0',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '90px',
              }}
              className={`active:scale-[0.97] transition-all cursor-pointer shadow-lg group ${
                isDark ? 'hover:bg-[#222933]' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl border mb-1.5 group-hover:scale-110 transition-transform ${
                isDark ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
              }`}>
                <Compass className="w-5 h-5" />
              </div>
              <span className={`text-xs font-black uppercase leading-snug whitespace-normal break-words w-full ${
                isDark ? 'text-indigo-300' : 'text-indigo-700'
              }`}>
                Interprovincial
              </span>
              <span className={`text-[10px] font-medium leading-snug whitespace-normal break-words mt-0.5 w-full ${
                isDark ? 'text-zinc-300' : 'text-slate-500'
              }`}>
                Tulcán - Quito y más
              </span>
            </button>
          </div>
        </div>

        {/* REWARDS & PROMOTIONS INTERACTIVE BANNER */}
        <button
          type="button"
          onClick={() => {
            haptic.success();
            onOpenLoyaltyPromos();
          }}
          className={`relative z-10 w-full p-4 rounded-3xl border text-left overflow-hidden shadow-lg transition-all active:scale-[0.98] group flex items-center justify-between gap-4 cursor-pointer ${
            isDark
              ? 'bg-gradient-to-r from-amber-950/40 via-[#181310] to-orange-950/40 border-amber-500/30 hover:border-amber-500/50'
              : 'bg-gradient-to-r from-amber-500/10 via-white to-orange-500/10 border-amber-200 hover:border-amber-300 shadow-amber-500/5'
          }`}
        >
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_right_top,#fff,transparent)]" />
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border transition-transform group-hover:scale-110 ${
              isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-200'
            }`}>
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                  🎁 Club AndesMovi Rewards
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500 text-white font-sans tracking-wide uppercase animate-pulse">
                  PROMO
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 leading-tight ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                {currentUser?.role === 'conductor'
                  ? 'Ver desafíos semanales, metas y bonos activos en tu billetera digital.'
                  : 'Canjea tus AndesMovi Coins por viajes gratis y descuentos automáticos.'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-500 shrink-0 group-hover:translate-x-1 transition-transform" />
        </button>





        {/* SECONDARY UTILITIES: Rutas, Soporte & Documentos Legales */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400 pt-1">
          <button
            type="button"
            onClick={onOpenInterprovincial}
            className="hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Rutas Nacionales</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenSupport}
            className="hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Soporte 24/7</span>
          </button>
        </div>

        {/* FOOTER: Legal Links & "Una marca de Andes Move" & Cayembe Heritage */}
        <div className="relative z-10 border-t border-amber-900/40 pt-2.5 flex flex-col items-center text-center gap-1.5 text-[11px] text-zinc-400">
          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setLegalDocType('terminos');
                setShowLegalModal(true);
              }}
              className="hover:text-emerald-400 hover:underline transition-colors cursor-pointer font-medium"
            >
              Términos y Condiciones
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setLegalDocType('privacidad');
                setShowLegalModal(true);
              }}
              className="hover:text-emerald-400 hover:underline transition-colors cursor-pointer font-medium"
            >
              Políticas de Privacidad (LOPDP)
            </button>
          </div>

          <span className="text-amber-200/80 font-medium">Una marca de Andes Move</span>
          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
            <span>- ECUADOR -</span>
            <span>•</span>
            <span className="text-amber-400/90 font-bold">TOTALMENTE ECUATORIANA</span>
          </div>
          <span className="text-[9px] text-zinc-500 italic">
            Diseño inspirado en el Volcán Cayembe
          </span>
        </div>
      </div>

      {/* Modal Legal */}
      {showLegalModal && (
        <LegalTermsModal
          isOpen={showLegalModal}
          initialDoc={legalDocType}
          onClose={() => setShowLegalModal(false)}
        />
      )}
    </div>
  );
};

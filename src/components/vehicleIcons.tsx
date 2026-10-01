import React from 'react';

/**
 * Generador de SVG vectorial para Sedán Premium Estilo Audi (Vista Cenital / Superior)
 * Diseñado para marcadores de mapa en tiempo real y miniaturas de UI.
 */
export const getAudiSedanSvgString = (
  color: 'taxi' | 'silver' = 'taxi',
  plate: string = ''
): string => {
  const bodyColor = color === 'taxi' ? '#FACC15' : '#E2E8F0';
  const bodyStroke = color === 'taxi' ? '#A16207' : '#64748B';
  const accentColor = color === 'taxi' ? '#EAB308' : '#CBD5E1';

  return `
    <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
      <!-- Sombra proyectada sobre la calzada -->
      <div style="position: absolute; width: 34px; height: 50px; border-radius: 20px; background: rgba(0,0,0,0.5); filter: blur(3px); transform: translateY(2px);"></div>

      <!-- Auto Audi Vectorial (Alineado Verticalmente a 0°) -->
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: relative; z-index: 2;">
        <!-- Haz de Luz de Faros LED Delanteros -->
        <path d="M22 14 L12 0 L24 0 Z" fill="url(#audi-light-left)" opacity="0.7"/>
        <path d="M42 14 L52 0 L40 0 Z" fill="url(#audi-light-right)" opacity="0.7"/>

        <!-- Carrocería Aerodinámica Audi Sedán -->
        <path d="M23 10 C25 7 39 7 41 10 C44 14 46 22 46 34 C46 46 44 52 41 55 C39 57 25 57 23 55 C20 52 18 46 18 34 C18 22 20 14 23 10 Z" fill="${bodyColor}" stroke="${bodyStroke}" stroke-width="1.5"/>

        <!-- Techo de Cristal / Parabrisas Panorámico -->
        <path d="M23 20 C25 18 39 18 41 20 L43 38 C41 41 23 41 21 38 Z" fill="#0F172A" stroke="#334155" stroke-width="1"/>
        <!-- Reflejo Azul en el Parabrisas Delantero -->
        <path d="M24 21 C26 19 38 19 40 21 L41 27 L23 27 Z" fill="#38BDF8" opacity="0.45"/>

        <!-- Paragolpes & Parrilla Singleframe Audi con Aros -->
        <rect x="26" y="8.5" width="12" height="2.5" rx="1" fill="#0F172A"/>
        <circle cx="29.5" cy="9.7" r="0.7" fill="#F8FAFC"/>
        <circle cx="31" cy="9.7" r="0.7" fill="#F8FAFC"/>
        <circle cx="32.5" cy="9.7" r="0.7" fill="#F8FAFC"/>
        <circle cx="34" cy="9.7" r="0.7" fill="#F8FAFC"/>

        <!-- Faros LED Matriz Afilados -->
        <path d="M19 11.5 L25 12.5 L24 14.5 Z" fill="#67E8F9"/>
        <path d="M45 11.5 L39 12.5 L40 14.5 Z" fill="#67E8F9"/>

        <!-- Espejos Retrovisores Anchos -->
        <rect x="14.5" y="21" width="3.5" height="5" rx="1.5" fill="${accentColor}" stroke="#334155" stroke-width="0.8"/>
        <rect x="46" y="21" width="3.5" height="5" rx="1.5" fill="${accentColor}" stroke="#334155" stroke-width="0.8"/>

        <!-- Luces LED Traseras Rojas -->
        <rect x="20.5" y="54" width="6" height="2.2" rx="1" fill="#EF4444"/>
        <rect x="37.5" y="54" width="6" height="2.2" rx="1" fill="#EF4444"/>

        <!-- Definición de Gradientes de Luz -->
        <defs>
          <linearGradient id="audi-light-left" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="audi-light-right" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>

      <!-- Placa de Identificación Metálica al Pie -->
      ${
        plate
          ? `<div style="position: absolute; bottom: -6px; background: #09090b; border: 1.5px solid #facc15; color: #ffffff; font-size: 8px; font-family: monospace; font-weight: 900; padding: 1px 4px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.8); z-index: 10;">${plate}</div>`
          : ''
      }
    </div>
  `;
};

/**
 * Generador de SVG vectorial para Motocicleta Deportiva Estilo Yamaha (MT / Scooter Rápida Vista Cenital)
 * Diseñado para marcadores de mapa en tiempo real y miniaturas de UI.
 */
export const getYamahaBikeSvgString = (
  color: 'blue' | 'graphite' = 'blue',
  plate: string = ''
): string => {
  const mainColor = color === 'blue' ? '#2563EB' : '#1E293B';
  const highlightColor = color === 'blue' ? '#3B82F6' : '#475569';

  return `
    <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
      <!-- Sombra proyectada de la moto -->
      <div style="position: absolute; width: 22px; height: 48px; border-radius: 12px; background: rgba(0,0,0,0.55); filter: blur(2.5px); transform: translateY(1px);"></div>

      <!-- Motocicleta Yamaha Vectorial (Alineada a 0° Norte) -->
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: relative; z-index: 2;">
        <!-- Haz de Luz Frontal Dual Yamaha -->
        <path d="M30 12 L20 0 L44 0 L34 12 Z" fill="url(#yamaha-light-beam)" opacity="0.75"/>

        <!-- Neumático Delantero Deportivo -->
        <rect x="29.5" y="6" width="5" height="11" rx="2.5" fill="#09090B" stroke="#64748B" stroke-width="1"/>

        <!-- Faros LED Agresivos Yamaha MT -->
        <path d="M27 16.5 L31 18.5 L32 16.5 Z" fill="#60A5FA"/>
        <path d="M37 16.5 L33 18.5 L32 16.5 Z" fill="#60A5FA"/>

        <!-- Manubrio Deportivo Ancho con Retrovisores -->
        <path d="M18 20.5 L46 20.5" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
        <circle cx="16" cy="18.5" r="2.8" fill="${highlightColor}" stroke="#0F172A" stroke-width="0.8"/>
        <circle cx="48" cy="18.5" r="2.8" fill="${highlightColor}" stroke="#0F172A" stroke-width="0.8"/>

        <!-- Tanque de Combustible Aerodinámico (Azul Eléctrico Yamaha) -->
        <path d="M27 22.5 C25 25.5 25 32 27 35 L37 35 C39 32 39 25 37 22.5 Z" fill="${mainColor}" stroke="${highlightColor}" stroke-width="1.2"/>

        <!-- Casco del Piloto con Visera Reflectante -->
        <circle cx="32" cy="36.5" r="6.5" fill="#0F172A" stroke="#38BDF8" stroke-width="1.8"/>
        <path d="M28 34.5 C30 32.5 34 32.5 36 34.5 L35 36.5 C33 35.5 31 35.5 29 36.5 Z" fill="#38BDF8"/>

        <!-- Asiento Trasero y Chasis -->
        <path d="M28.5 43 L35.5 43 L33.5 51 L30.5 51 Z" fill="#1E293B"/>
        <!-- Neumático Trasero Ancho -->
        <rect x="29" y="49" width="6" height="9" rx="2.5" fill="#09090B" stroke="#475569" stroke-width="1"/>
        <!-- Luz LED Trasera de Freno -->
        <rect x="30" y="53" width="4" height="2" rx="0.8" fill="#EF4444"/>

        <!-- Definición de Gradiente de Luz -->
        <defs>
          <linearGradient id="yamaha-yamaha-glow" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#60A5FA" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#60A5FA" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="yamaha-light-beam" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>

      <!-- Placa de Identificación Metálica al Pie -->
      ${
        plate
          ? `<div style="position: absolute; bottom: -6px; background: #09090b; border: 1.5px solid #38bdf8; color: #ffffff; font-size: 8px; font-family: monospace; font-weight: 900; padding: 1px 4px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.8); z-index: 10;">${plate}</div>`
          : ''
      }
    </div>
  `;
};

/**
 * Componente React para la miniatura ilustrada de un Auto / Taxi Ejecutivo tipo Audi
 */
export const AudiVehicleIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-6 h-6',
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M23 10 C25 7 39 7 41 10 C44 14 46 22 46 34 C46 46 44 52 41 55 C39 57 25 57 23 55 C20 52 18 46 18 34 C18 22 20 14 23 10 Z"
        fill="#FACC15"
        stroke="#A16207"
        strokeWidth="2"
      />
      <path
        d="M23 20 C25 18 39 18 41 20 L43 38 C41 41 23 41 21 38 Z"
        fill="#0F172A"
        stroke="#334155"
        strokeWidth="1.5"
      />
      <path d="M24 21 C26 19 38 19 40 21 L41 27 L23 27 Z" fill="#38BDF8" opacity="0.6" />
      <rect x="26" y="8.5" width="12" height="2.5" rx="1" fill="#0F172A" />
      <path d="M19 11.5 L25 12.5 L24 14.5 Z" fill="#67E8F9" />
      <path d="M45 11.5 L39 12.5 L40 14.5 Z" fill="#67E8F9" />
      <rect x="14.5" y="21" width="3.5" height="5" rx="1.5" fill="#E2E8F0" />
      <rect x="46" y="21" width="3.5" height="5" rx="1.5" fill="#E2E8F0" />
      <rect x="20.5" y="54" width="6" height="2.2" rx="1" fill="#EF4444" />
      <rect x="37.5" y="54" width="6" height="2.2" rx="1" fill="#EF4444" />
    </svg>
  );
};

/**
 * Componente React para la miniatura ilustrada de una Motocicleta tipo Yamaha Deportiva
 */
export const YamahaBikeIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-6 h-6',
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="29.5" y="6" width="5" height="11" rx="2.5" fill="#09090B" stroke="#64748B" strokeWidth="1" />
      <path d="M27 16.5 L31 18.5 L32 16.5 Z" fill="#60A5FA" />
      <path d="M37 16.5 L33 18.5 L32 16.5 Z" fill="#60A5FA" />
      <path d="M18 20.5 L46 20.5" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="16" cy="18.5" r="3" fill="#3B82F6" />
      <circle cx="48" cy="18.5" r="3" fill="#3B82F6" />
      <path d="M27 22.5 C25 25.5 25 32 27 35 L37 35 C39 32 39 25 37 22.5 Z" fill="#2563EB" stroke="#3B82F6" strokeWidth="1.5" />
      <circle cx="32" cy="36.5" r="6.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
      <path d="M28 34.5 C30 32.5 34 32.5 36 34.5 L35 36.5 C33 35.5 31 35.5 29 36.5 Z" fill="#38BDF8" />
      <path d="M28.5 43 L35.5 43 L33.5 51 L30.5 51 Z" fill="#1E293B" />
      <rect x="29" y="49" width="6" height="9" rx="2.5" fill="#09090B" stroke="#475569" strokeWidth="1" />
      <rect x="30" y="53" width="4" height="2" rx="0.8" fill="#EF4444" />
    </svg>
  );
};

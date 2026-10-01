import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates, Driver, TripStatus, SystemTariffs, ServiceType } from '../types';
import {
  fleetSimulationService,
  SimulatedVehicle,
} from '../services/fleetSimulationService';
import { Navigation, LocateFixed, Plus, Minus, Target, Crosshair, Compass, Layers, MapPin, X, Search, Check, ChevronDown, Sparkles } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { calculateDistanceKm } from '../utils/geoUtils';

export const ECUADOR_MAJOR_CITIES: Array<{ name: string; province: string; lat: number; lng: number }> = [
  { name: 'Quito', province: 'Pichincha', lat: -0.1807, lng: -78.4678 },
  { name: 'Guayaquil', province: 'Guayas', lat: -2.1894, lng: -79.8891 },
  { name: 'Cuenca', province: 'Azuay', lat: -2.9001, lng: -79.0059 },
  { name: 'Santo Domingo', province: 'Santo Domingo', lat: -0.2530, lng: -79.1754 },
  { name: 'Ambato', province: 'Tungurahua', lat: -1.2491, lng: -78.6168 },
  { name: 'Ibarra', province: 'Imbabura', lat: 0.3517, lng: -78.1223 },
  { name: 'Tulcán', province: 'Carchi', lat: 0.8116, lng: -77.7173 },
  { name: 'Manta', province: 'Manabí', lat: -0.9677, lng: -80.7089 },
  { name: 'Portoviejo', province: 'Manabí', lat: -1.0546, lng: -80.4544 },
  { name: 'Machala', province: 'El Oro', lat: -3.2581, lng: -79.9554 },
  { name: 'Loja', province: 'Loja', lat: -3.9931, lng: -79.2042 },
  { name: 'Riobamba', province: 'Chimborazo', lat: -1.6636, lng: -78.6546 },
  { name: 'Esmeraldas', province: 'Esmeraldas', lat: 0.9682, lng: -79.6517 },
  { name: 'Latacunga', province: 'Cotopaxi', lat: -0.9316, lng: -78.6155 },
  { name: 'Otavalo', province: 'Imbabura', lat: 0.2312, lng: -78.2612 },
  { name: 'Cayambe', province: 'Pichincha', lat: 0.0403, lng: -78.1452 },
];

export const TULCAN_CENTRO_DEFAULT = {
  name: '🏰 Tulcán Centro (Parque Independencia)',
  canton: 'Tulcán',
  province: 'Carchi',
  lat: 0.8122,
  lng: -77.7175,
  address: 'Calle Bolívar y 10 de Agosto, Parque Central, Tulcán, Carchi, Ecuador',
};

export const POPULAR_TULCAN_SECTORS = [
  { name: '🏰 Tulcán Centro (Parque Independencia)', canton: 'Tulcán', province: 'Carchi', lat: 0.8122, lng: -77.7175, address: 'Parque Central de la Independencia, Calle Bolívar y 10 de Agosto, Tulcán' },
  { name: '🚌 Terminal Terrestre de Tulcán', canton: 'Tulcán', province: 'Carchi', lat: 0.8119, lng: -77.7173, address: 'Av. Veintimilla y Fray Vacas Galindo, Tulcán' },
  { name: '🎓 Univ. Politécnica Estatal del Carchi (UPEC)', canton: 'Tulcán', province: 'Carchi', lat: 0.8268, lng: -77.7161, address: 'Campus UPEC, Av. Universitaria y Antisana, Tulcán' },
  { name: '🏥 Hospital Luis Gabriel Dávila', canton: 'Tulcán', province: 'Carchi', lat: 0.8035, lng: -77.7198, address: 'Av. Veintimilla y Cotopaxi, Tulcán' },
  { name: '🛒 Mercado Central / Calle Sucre', canton: 'Tulcán', province: 'Carchi', lat: 0.8130, lng: -77.7185, address: 'Calle Sucre y Olmedo, Tulcán Centro' },
  { name: '🌲 Cementerio Municipal (Azael Gómez)', canton: 'Tulcán', province: 'Carchi', lat: 0.8168, lng: -77.7242, address: 'Av. Cotopaxi y Cementerio, Tulcán' },
  { name: '🛂 Rumichaca (Puente Internacional)', canton: 'Tulcán', province: 'Carchi', lat: 0.8139, lng: -77.6625, address: 'Puente Internacional Rumichaca, Frontera Ecuador-Colombia' },
  { name: '🏟️ Estadio Olímpico de Tulcán', canton: 'Tulcán', province: 'Carchi', lat: 0.8145, lng: -77.7125, address: 'Av. Coral y Calle Manabí, Tulcán' },
];

export const POPULAR_ECUADOR_POINTS = [
  { name: '🏰 Tulcán Centro', canton: 'Tulcán', province: 'Carchi', lat: 0.8122, lng: -77.7175, address: 'Parque Principal de la Independencia, Tulcán, Carchi' },
  { name: '🏔️ Cayambe', canton: 'Cayambe', province: 'Pichincha', lat: 0.0425, lng: -78.1458, address: 'Parque Central, Cayambe, Pichincha' },
  { name: '🏛️ Quito La Carolina', canton: 'Quito', province: 'Pichincha', lat: -0.1807, lng: -78.4678, address: 'Parque La Carolina / Quicentro, Quito' },
  { name: '🏛️ Quito Quitumbe (Sur)', canton: 'Quito', province: 'Pichincha', lat: -0.2891, lng: -78.5492, address: 'Terminal Quitumbe, Quito Sur' },
  { name: '🌸 Ibarra', canton: 'Ibarra', province: 'Imbabura', lat: 0.3517, lng: -78.1223, address: 'Parque Pedro Moncayo, Ibarra' },
  { name: '🧶 Otavalo', canton: 'Otavalo', province: 'Imbabura', lat: 0.2346, lng: -78.2625, address: 'Plaza de Ponchos, Otavalo' },
  { name: '🌾 Tabacundo', canton: 'Pedro Moncayo', province: 'Pichincha', lat: 0.0469, lng: -78.2192, address: 'Tabacundo, Pedro Moncayo' },
  { name: '⛰️ San Gabriel', canton: 'Montúfar', province: 'Carchi', lat: 0.5956, lng: -77.8306, address: 'San Gabriel, Montúfar, Carchi' },
  { name: '🌊 Guayaquil', canton: 'Guayaquil', province: 'Guayas', lat: -2.1894, lng: -79.8833, address: 'Malecón 2000, Guayaquil' },
  { name: '⛪ Cuenca', canton: 'Cuenca', province: 'Azuay', lat: -2.8974, lng: -79.0044, address: 'Parque Calderón, Cuenca' },
  { name: '🌺 Ambato', canton: 'Ambato', province: 'Tungurahua', lat: -1.2491, lng: -78.6168, address: 'Parque Montalvo, Ambato' },
  { name: '🌴 Santo Domingo', canton: 'Santo Domingo', province: 'Santo Domingo', lat: -0.2530, lng: -79.1754, address: 'Centro de Santo Domingo' },
  { name: '🏖️ Manta', canton: 'Manta', province: 'Manabí', lat: -0.9677, lng: -80.7089, address: 'Playa El Murciélago, Manta' },
  { name: '🌋 Riobamba', canton: 'Riobamba', province: 'Chimborazo', lat: -1.6636, lng: -78.6546, address: 'Parque Maldonado, Riobamba' },
];

// Safe monkey patch for Leaflet's DomUtil to prevent Uncaught TypeError on _leaflet_pos
if (typeof window !== 'undefined' && L && L.DomUtil) {
  L.DomUtil.getPosition = function (el: any): L.Point {
    if (!el || typeof el !== 'object') {
      return new L.Point(0, 0);
    }
    try {
      return el._leaflet_pos || new L.Point(0, 0);
    } catch {
      return new L.Point(0, 0);
    }
  };

  L.DomUtil.setPosition = function (el: any, point: L.Point): void {
    if (!el || typeof el !== 'object') {
      return;
    }
    try {
      const validPoint = point || new L.Point(0, 0);
      el._leaflet_pos = validPoint;
      if (L.Browser && L.Browser.any3d) {
        L.DomUtil.setTransform(el, validPoint);
      } else {
        el.style.left = validPoint.x + 'px';
        el.style.top = validPoint.y + 'px';
      }
    } catch {}
  };
}

export interface SafeTileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains: string[];
  fallbackUrl: string;
}

/**
 * Capa de Mapa Exclusiva en Relieve Andino (Topografía, elevaciones y curvas de nivel)
 * Utiliza OpenTopoMap como proveedor principal con fallback a ESRI World Topo Map (Relieve de contingencia)
 * Garantizando visualización de relieve 100% libre sin bloqueos 403 ni pantallas blancas.
 */
export function getSafeTileConfig(isDark?: boolean): SafeTileConfig {
  return {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Topografía y Relieve &copy; OpenStreetMap contributors, SRTM | Estilo: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
    fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  };
}

/**
 * Crea una capa TileLayer de Leaflet tolerante a fallos, optimizada para rendimiento móvil y sin tirones (lag).
 */
export function createSafeTileLayer(config: SafeTileConfig): L.TileLayer {
  const layer = L.tileLayer(config.url, {
    maxZoom: config.maxZoom || 19,
    maxNativeZoom: 17, // OpenTopoMap genera tiles nativos hasta zoom 17; Leaflet los escala fluidamente a 18 y 19
    attribution: config.attribution,
    subdomains: config.subdomains,
    detectRetina: false, // Optimización móvil: evita cuadruplicar las solicitudes de teselas en pantallas retina
    crossOrigin: true,
    keepBuffer: 10, // Mantiene en memoria las teselas circundantes para desplazamientos fluidos
    updateWhenIdle: true, // Espera a pausar el movimiento para cargar nuevas teselas, eliminando el lag en 60fps
    updateWhenZooming: false, // Evita sobrecarga de red durante el zoom o pellizco
    tileSize: 256,
  });

  let hasSwappedToFallback = false;
  layer.on('tileerror', () => {
    if (!hasSwappedToFallback && config.fallbackUrl) {
      hasSwappedToFallback = true;
      console.warn('Alerta de mosaico en WebView: Conmutando automáticamente a capa de relieve de respaldo (ESRI World Topo)...');
      layer.setUrl(config.fallbackUrl);
    }
  });

  return layer;
}

export interface MapComponentProps {
  origin?: Coordinates | null;
  destination?: Coordinates | null;
  intermediateStops?: Coordinates[];
  activeDriver?: Driver | null;
  drivers?: Driver[];
  tripStatus?: TripStatus;
  onSelectCoordinates?: (coords: Coordinates, type: 'origin' | 'destination' | 'stop') => void;
  selectionMode?: 'origin' | 'destination' | 'stop' | null;
  serviceType?: ServiceType;
  systemTariffs?: Partial<SystemTariffs>;
  tarifaCalculada?: number;
  ofertaUsuario?: number;
  onUserOfferChange?: (offer: number) => void;
  onRouteCalculated?: (fare: number, distanceKm: number, durationMin: number, originName?: string, destName?: string) => void;
  isSidePanelVisible?: boolean;
  onSuggestedFareChange?: (fare: number, distanceKm: number, durationMin: number) => void;
  onPriceChange?: (newPrice: number) => void;
  onRequestRide?: (offeredPrice?: number) => void;
  className?: string;
  isDarkMode?: boolean;
  effectiveTheme?: 'dark' | 'light';
  mapId?: string;
  onOpenMobileSdkGuide?: () => void;
  onDispatchToMapClick?: (coords: Coordinates) => void;
  manualEcoMode?: boolean;
  batteryLevel?: number | null;
  onToggleEcoGps?: () => void;
  onOpenMenu?: () => void;
  style?: React.CSSProperties;
  isDriverMode?: boolean;
  driverPhase?: 'pickup' | 'en_route';
  isAdminMap?: boolean;
}

export interface MapViewProps {
  isDarkMode?: boolean;
}

export interface RouteMetrics {
  distanceKm: string;
  durationMin: number;
  durationFormatted?: string;
  suggestedFare: number;
  isInterprovincial?: boolean;
}

export interface ParsedRoute {
  id: number;
  name: string;
  distanceKm: string;
  durationMin: number;
  durationFormatted?: string;
  suggestedFare: number;
  coordinates: [number, number][];
  isInterprovincial?: boolean;
}

/**
 * Cálculo dinámico de tarifa con los parámetros del Administrador de AndesMovi:
 * - Para viajes interprovinciales / larga distancia (> 35 km): tarifa sugerida por km interprovincial
 * - Para viajes urbanos: tarifaBase + (distanciaKm * valorPorKm) + (tiempoMin * valorPorMinuto)
 * - Respeta tarifa mínima configurada y recargo nocturno/dinámico
 */
export function calculateDynamicFare(
  distanceKm: number,
  durationMin: number,
  serviceType: ServiceType = 'viaje',
  tariffs?: Partial<SystemTariffs>
): number {
  const isInterprovincial = distanceKm > 35 || serviceType === 'ejecutivo_quito';

  if (isInterprovincial) {
    if (serviceType === 'ejecutivo_quito') {
      return 25.00;
    }
    const valorPorKmInterprovincial = tariffs?.parcelPerKmUsd ?? 0.30;
    const baseInterprovincial = 15.00;
    const tarifaSugerida = Math.round(Math.max(baseInterprovincial, distanceKm * valorPorKmInterprovincial));
    return Number(tarifaSugerida.toFixed(2));
  }

  if (serviceType === 'viaje') {
    const ahora = new Date();
    const horaDecimal = ahora.getHours() + (ahora.getMinutes() / 60);
    const esDiurno = horaDecimal >= 6.0167 && horaDecimal < 19.0;

    const baseMin = tariffs?.rideMinimumFareUsd ?? 1.25;
    const baseCoverageKm = tariffs?.rideBaseCoverageKm ?? 2.7;
    const perKm = tariffs?.ridePerKmUsd ?? (esDiurno ? 0.34 : 0.44);
    const perMin = tariffs?.ridePerMinuteUsd ?? (esDiurno ? 0.07 : 0.08);

    let tarifaFinal = 0;
    if (esDiurno) {
      if (distanceKm <= baseCoverageKm) {
        tarifaFinal = baseMin;
      } else {
        const kmExcedente = distanceKm - baseCoverageKm;
        tarifaFinal = baseMin + (kmExcedente * perKm) + (durationMin * perMin);
      }
      if (tarifaFinal < baseMin) tarifaFinal = baseMin;
    } else {
      const minNocturna = Math.max(baseMin, 1.50);
      if (distanceKm <= baseCoverageKm) {
        tarifaFinal = minNocturna;
      } else {
        const kmExcedente = distanceKm - baseCoverageKm;
        tarifaFinal = minNocturna + (kmExcedente * perKm) + (durationMin * perMin);
      }
      if (tarifaFinal < minNocturna) tarifaFinal = minNocturna;
    }

    const dynamicMultiplier = tariffs?.dynamicMultiplier && tariffs.dynamicMultiplier > 1.0
      ? tariffs.dynamicMultiplier
      : 1.0;
    tarifaFinal = tarifaFinal * dynamicMultiplier;

    return Number(tarifaFinal.toFixed(2));
  }

  const dynamicMultiplier = tariffs?.dynamicMultiplier && tariffs.dynamicMultiplier > 1.0
    ? tariffs.dynamicMultiplier
    : 1.0;

  let tarifaBase = tariffs?.rideBaseFareUsd ?? 1.25;
  let valorPorKm = tariffs?.ridePerKmUsd ?? 0.35;
  let valorPorMinuto = tariffs?.ridePerMinuteUsd ?? 0.05;
  let tarifaMinima = tariffs?.rideMinimumFareUsd ?? 1.25;
  let baseCoverageKm = tariffs?.rideBaseCoverageKm ?? 2.7;

  if (serviceType === 'encomienda') {
    tarifaBase = tariffs?.parcelBaseFareUsd ?? 1.50;
    valorPorKm = tariffs?.parcelPerKmUsd ?? 0.40;
    valorPorMinuto = 0.04;
    tarifaMinima = Math.max(6.00, tariffs?.parcelMinimumFareUsd ?? 6.00);
    baseCoverageKm = 0;
  } else if (serviceType === 'domicilio') {
    tarifaBase = tariffs?.deliveryBaseFareUsd ?? 1.25;
    valorPorKm = tariffs?.deliveryPerKmUsd ?? 0.35;
    valorPorMinuto = 0.04;
    tarifaMinima = Math.max(1.25, tariffs?.deliveryBaseFareUsd ?? 1.25);
    baseCoverageKm = 2.7;
  }

  const kmExcedente = Math.max(0, distanceKm - baseCoverageKm);
  let tarifaCalculada = (distanceKm <= baseCoverageKm && baseCoverageKm > 0)
    ? tarifaMinima
    : tarifaMinima + (kmExcedente * valorPorKm) + (durationMin * valorPorMinuto);

  tarifaCalculada = tarifaCalculada * dynamicMultiplier;

  if (tarifaCalculada < tarifaMinima) {
    tarifaCalculada = tarifaMinima;
  }

  return Number(tarifaCalculada.toFixed(2));
}

export const CARCHI_DEFAULT_COORDS: Coordinates = {
  lat: 0.8116,
  lng: -77.7173,
  name: 'Carchi - Tulcán',
  address: 'Tulcán, Provincia de Carchi, Ecuador',
};

export const ECUADOR_CITIES = [
  { name: 'Tulcán (Carchi)', canton: 'Carchi', lat: 0.8116, lng: -77.7173, zoom: 15, badge: 'Punto de Inicio' },
  { name: 'Ibarra', canton: 'Imbabura', lat: 0.3517, lng: -78.1223, zoom: 14, badge: 'Ciudad Blanca' },
  { name: 'Quito', canton: 'Pichincha', lat: -0.1807, lng: -78.4678, zoom: 14, badge: 'Capital' },
];

const GEOCODE_CACHE_PREFIX = 'andesmovi_geo_cache_';
const geocodeMemoryCache = new Map<string, { streetName: string; fullAddress: string; timestamp: number }>();

/**
 * Geocodificación inversa ultra rápida con caché local dual (Memoria + localStorage)
 * Convierte coordenadas en nombres de calles legibles sin saturar la red en cada toque.
 */
export async function reverseGeocodeOSRM(
  lat: number,
  lng: number
): Promise<{ streetName: string; fullAddress: string }> {
  // Redondeo a 4 decimales (~11m de precisión), ideal para reutilizar caché de calles
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  // 1. Caché instantáneo en memoria RAM (0ms)
  const mem = geocodeMemoryCache.get(cacheKey);
  if (mem) {
    return { streetName: mem.streetName, fullAddress: mem.fullAddress };
  }

  // 2. Caché persistente en localStorage
  try {
    const stored = localStorage.getItem(GEOCODE_CACHE_PREFIX + cacheKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < 1000 * 60 * 60 * 24 * 7) {
        geocodeMemoryCache.set(cacheKey, parsed);
        return { streetName: parsed.streetName, fullAddress: parsed.fullAddress };
      }
    }
  } catch {}

  // 3. Petición a OSRM si no está en caché
  try {
    const url = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.waypoints && data.waypoints.length > 0 && data.waypoints[0].name) {
        const street = data.waypoints[0].name.trim();
        if (street.length > 0) {
          const result = {
            streetName: street,
            fullAddress: `${street}, Tulcán, Carchi`,
          };
          geocodeMemoryCache.set(cacheKey, { ...result, timestamp: Date.now() });
          try {
            localStorage.setItem(GEOCODE_CACHE_PREFIX + cacheKey, JSON.stringify({ ...result, timestamp: Date.now() }));
          } catch {}
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('Error en reverse geocoding OSRM:', err);
  }

  return {
    streetName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    fullAddress: `Coordenadas (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
  };
}

// Generador de Icono Dinámico Punto A ("De akí") con Estilo Premium y Pulso Radar
export const createPersonaIcon = (label: string = 'De akí') =>
  L.divIcon({
    className: 'custom-person-pin',
    html: `
      <div class="marker-wrapper marker-origin-wrapper" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 140px;
        transform-origin: bottom center;
        user-select: none !important;
        -webkit-user-select: none !important;
      ">
        <!-- Efecto Pulso Radar: halo expansivo verde (.pulse-ring) activo bajo el marcador -->
        <div class="radar-pulse-anchor">
          <div class="pulse-ring pulse-ring-1"></div>
          <div class="pulse-ring pulse-ring-2"></div>
        </div>

        <!-- 1. Tarjeta superior: Cápsula verde esmeralda (#059669) con letras blancas en negrita '📍 De akí' -->
        <div class="marker-label-text" style="
          background: #059669;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 3.5px 10px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4), 0 1px 3px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
          margin-bottom: 3px;
          border: 1.5px solid #ffffff;
          letter-spacing: 0.4px;
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 4;
        ">
          📍 ${label || 'De akí'}
        </div>

        <!-- 2. Cuerpo central: Círculo blanco de 38px con borde verde, alojando el ícono de la persona (🙋‍♂️) -->
        <div class="marker-body-circle" style="
          width: 38px;
          height: 38px;
          background: #ffffff;
          border: 2.5px solid #059669;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12);
          font-size: 20px;
          z-index: 3;
          position: relative;
        ">
          🙋‍♂️
        </div>

        <!-- 3. Puntero: Vástago vertical fino que señala la coordenada exacta de la calle -->
        <div class="marker-stem-container" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: -1px;
          z-index: 2;
        ">
          <div style="
            width: 2.5px;
            height: 10px;
            background: linear-gradient(to bottom, #059669, #047857);
            border-radius: 1px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          "></div>
          <div style="
            width: 6px;
            height: 6px;
            background: #059669;
            border: 1.5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
            margin-top: -2px;
          "></div>
        </div>
      </div>
    `,
    iconSize: [140, 84],
    iconAnchor: [70, 80],
  });

// Generador de Icono Unificado Punto B (Bandera Ecuador 🇪🇨 + Mástil de Precisión + Etiqueta de Destino)
export const createDestIcon = (label: string = 'Llegada', isBouncing: boolean = false) =>
  L.divIcon({
    className: 'marcador-punto-b',
    html: `
      <div class="marker-wrapper marker-dest-wrapper marker-bounce-wrapper ${isBouncing ? 'marker-bounce-3s' : ''}" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 140px;
        transform-origin: bottom center;
        user-select: none !important;
        -webkit-user-select: none !important;
      ">
        <!-- 1. Etiqueta superior flotante: Destino / Llegada -->
        <div class="marker-label-text" style="
          background: #DC2626;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 3.5px 10px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
          margin-bottom: 3px;
          border: 1.5px solid #ffffff;
          letter-spacing: 0.3px;
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 4;
        ">
          🏁 ${label || 'Llegada'}
        </div>

        <!-- 2. Bandera de Ecuador 🇪🇨 con Mástil -->
        <div style="
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
          z-index: 3;
        ">
          <div style="
            display: flex;
            align-items: stretch;
            background: #ffffff;
            padding: 2px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 1px solid rgba(0,0,0,0.1);
          ">
            <div style="
              width: 38px;
              height: 24px;
              border-radius: 2px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              border: 0.5px solid rgba(0,0,0,0.15);
            ">
              <!-- Franja Amarilla (50%) con Escudo / Miniatura -->
              <div style="background: #FFD100; height: 50%; width: 100%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 7.5px; font-weight: 900; color: #1E3A8A; line-height: 1;">🇪🇨</span>
              </div>
              <!-- Franja Azul (25%) -->
              <div style="background: #0038A8; height: 25%; width: 100%;"></div>
              <!-- Franja Roja (25%) -->
              <div style="background: #CE1126; height: 25%; width: 100%;"></div>
            </div>
          </div>
        </div>

        <!-- 3. Mástil y puntero de precisión que señala la coordenada exacta de la calle -->
        <div class="marker-stem-container" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: -1px;
          z-index: 2;
        ">
          <div style="
            width: 2.5px;
            height: 10px;
            background: linear-gradient(to bottom, #DC2626, #991B1B);
            border-radius: 1px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          "></div>
          <div style="
            width: 6px;
            height: 6px;
            background: #DC2626;
            border: 1.5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 1px 4px rgba(220, 38, 38, 0.4);
            margin-top: -2px;
          "></div>
        </div>
      </div>
    `,
    iconSize: [140, 84],
    iconAnchor: [70, 80],
  });

/**
 * Actualiza el texto de la etiqueta del marcador sin destruir el nodo DOM ni corromper _leaflet_pos
 */
export function updateMarkerLabel(marker: L.Marker | null, label: string, isOrigin: boolean = false): void {
  if (!marker || !(marker as any)._map) return;
  try {
    const el = marker.getElement();
    if (el) {
      const labelEl = el.querySelector('.marker-label-text') as HTMLElement | null;
      if (labelEl) {
        const clean = (label || '').trim();
        if (isOrigin) {
          labelEl.textContent = `📍 ${clean || 'De akí'}`;
        } else {
          labelEl.textContent = `🏁 ${clean || 'Llegada'}`;
        }
      }
    }
  } catch {}
}

/**
 * Activa la animación de rebote (bounce de 3s) sobre el marcador de destino sin destruir el elemento DOM
 */
export function triggerDestMarkerBounce(marker: L.Marker | null): void {
  if (!marker || !(marker as any)._map) return;
  try {
    const el = marker.getElement();
    if (el) {
      const wrapper = el.querySelector('.marker-bounce-wrapper') as HTMLElement | null;
      if (wrapper) {
        wrapper.classList.remove('marker-bounce-3s');
        void wrapper.offsetWidth; // Forzar reflow para reiniciar animación
        wrapper.classList.add('marker-bounce-3s');
        setTimeout(() => {
          if (wrapper) {
            wrapper.classList.remove('marker-bounce-3s');
          }
        }, 3000);
      }
    }
  } catch {}
}

// 1. GENERADORES DE ICONOS CENITALES 2D (VISTA AÉREA SUPERIOR)
export const createCarIcon = (_label?: string) =>
  L.divIcon({
    className: 'custom-car-pin-zenithal',
    html: `
      <div class="vehicle-zenithal-wrapper" style="
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        width: 22px;
        height: 42px;
        transform-origin: center center;
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
        -webkit-tap-highlight-color: transparent !important;
        user-select: none !important;
      ">
        <svg width="22" height="42" viewBox="0 0 22 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.55));">
          <!-- 4 Neumáticos laterales en negro asfalto -->
          <rect x="0.5" y="7" width="2" height="6.5" rx="1" fill="#09090b"/>
          <rect x="19.5" y="7" width="2" height="6.5" rx="1" fill="#09090b"/>
          <rect x="0.5" y="27.5" width="2" height="6.5" rx="1" fill="#09090b"/>
          <rect x="19.5" y="27.5" width="2" height="6.5" rx="1" fill="#09090b"/>
          
          <!-- Espejos retrovisores laterales -->
          <path d="M1 14.5C0.4 14.5 0 14.9 0 15.5C0 16.1 0.4 16.5 1 16.5H2.5V14.5H1Z" fill="#CBD5E1"/>
          <path d="M21 14.5C21.6 14.5 22 14.9 22 15.5C22 16.1 21.6 16.5 21 16.5H19.5V14.5H21Z" fill="#CBD5E1"/>

          <!-- Carrocería Sedán Ejecutiva Blanco/Plateado (#F1F5F9) con contornos limpios -->
          <rect x="2" y="1" width="18" height="40" rx="5.5" fill="#F1F5F9" stroke="#94A3B8" stroke-width="0.75"/>
          
          <!-- Capó delantero con líneas de relieve aerodinámico -->
          <path d="M6 3.5L7.5 9.5" stroke="#CBD5E1" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M16 3.5L14.5 9.5" stroke="#CBD5E1" stroke-width="0.5" stroke-linecap="round"/>

          <!-- Parabrisas Delantero curvado en tono oscuro (#1E293B) con reflejo de luz -->
          <path d="M4.5 11C4.5 8.5 6.5 6.8 9 6.8H13C15.5 6.8 17.5 8.5 17.5 11V13.2H4.5V11Z" fill="#1E293B"/>
          <path d="M6.5 8.5C8 7.5 10 7.5 11.5 7.5" stroke="#64748B" stroke-width="0.6" stroke-linecap="round"/>
          
          <!-- Techo del auto con marco refinado -->
          <rect x="4.5" y="13.2" width="13" height="15" rx="1.5" fill="#E2E8F0"/>
          <rect x="6.5" y="15.5" width="9" height="9" rx="1" fill="#CBD5E1" stroke="#94A3B8" stroke-width="0.4"/>
          
          <!-- Vidrio Trasero en tono oscuro (#1E293B) -->
          <path d="M4.5 28.2H17.5V30.5C17.5 32.2 16 33.2 14 33.2H8C6 33.2 4.5 32.2 4.5 30.5V28.2Z" fill="#1E293B"/>
          
          <!-- Faros delanteros brillantes de xenón -->
          <rect x="3.2" y="1.6" width="3.2" height="1.8" rx="0.9" fill="#FEF08A"/>
          <rect x="15.6" y="1.6" width="3.2" height="1.8" rx="0.9" fill="#FEF08A"/>
          
          <!-- Luces traseras LED rojas -->
          <rect x="3.2" y="39.2" width="3.2" height="1.4" rx="0.7" fill="#EF4444"/>
          <rect x="15.6" y="39.2" width="3.2" height="1.4" rx="0.7" fill="#EF4444"/>
        </svg>
      </div>
    `,
    iconSize: [22, 42],
    iconAnchor: [11, 21],
  });

export const createMotoIcon = (_label?: string) =>
  L.divIcon({
    className: 'custom-moto-pin-zenithal',
    html: `
      <div class="vehicle-zenithal-wrapper" style="
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        width: 18px;
        height: 34px;
        transform-origin: center center;
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
        -webkit-tap-highlight-color: transparent !important;
        user-select: none !important;
      ">
        <svg width="18" height="34" viewBox="0 0 18 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55));">
          <!-- Rueda delantera centrada -->
          <rect x="7.5" y="0.5" width="3" height="7" rx="1.5" fill="#09090b"/>
          
          <!-- Manubrio horizontal con puños -->
          <rect x="1.5" y="6" width="15" height="2" rx="1" fill="#334155"/>
          <rect x="1" y="5.5" width="2" height="3" rx="0.8" fill="#09090b"/>
          <rect x="15" y="5.5" width="2" height="3" rx="0.8" fill="#09090b"/>
          <!-- Faro delantero LED centrado -->
          <circle cx="9" cy="5.5" r="1.5" fill="#38BDF8"/>

          <!-- Cuerpo delantero y chasis -->
          <path d="M6 8H12L11 13H7L6 8Z" fill="#475569"/>

          <!-- Casco superior del conductor visto desde arriba -->
          <circle cx="9" cy="15.5" r="3.8" fill="#F8FAFC" stroke="#0F172A" stroke-width="0.8"/>
          <!-- Visor del casco oscuro -->
          <path d="M6.5 13.5C7.2 12.8 10.8 12.8 11.5 13.5" stroke="#0F172A" stroke-width="1.2" stroke-linecap="round"/>

          <!-- Asiento de la moto -->
          <rect x="7" y="19" width="4" height="4.5" rx="1" fill="#1E293B"/>

          <!-- Cajón / Baúl cuadrado de reparto de encomiendas (#F59E0B) -->
          <rect x="4" y="23.5" width="10" height="8.5" rx="1.8" fill="#F59E0B" stroke="#D97706" stroke-width="0.75"/>
          <!-- Detalle de cinta de paquete -->
          <rect x="8.2" y="24" width="1.6" height="7.5" fill="#FEF3C7" opacity="0.9"/>
          <rect x="4.5" y="27" width="9" height="1.5" fill="#FEF3C7" opacity="0.9"/>

          <!-- Luz trasera roja de freno -->
          <rect x="7.5" y="32.5" width="3" height="1" rx="0.5" fill="#EF4444"/>
        </svg>
      </div>
    `,
    iconSize: [18, 34],
    iconAnchor: [9, 17],
  });

// 2. UTILIDADES DE RUMBO (BEARING) Y ROTACIÓN DE MARCADORES
export function calcularBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function aplicarRotacionMarcador(marker: L.Marker, anguloGrados: number): void {
  if (!marker) return;
  (marker as any).currentAngle = anguloGrados;
  const element = marker.getElement();
  if (element) {
    const innerWrapper = (element.querySelector('.vehicle-zenithal-wrapper') as HTMLElement) || element;
    innerWrapper.style.transform = `rotate(${anguloGrados.toFixed(1)}deg)`;
  }
}

/**
 * Desplaza suavemente un marcador de Leaflet hacia una nueva coordenada con interpolación lineal a 60 FPS
 */
export function slideMarkerTo(
  marker: L.Marker,
  targetLat: number,
  targetLng: number,
  durationMs: number = 900,
  targetHeading?: number,
  onComplete?: () => void
): () => void {
  if (!marker || !(marker as any)._map) return () => {};

  let startLatLng: L.LatLng;
  try {
    startLatLng = marker.getLatLng();
  } catch {
    return () => {};
  }

  const startLat = startLatLng.lat;
  const startLng = startLatLng.lng;

  if (Math.abs(startLat - targetLat) < 0.000001 && Math.abs(startLng - targetLng) < 0.000001) {
    if (targetHeading !== undefined) {
      aplicarRotacionMarcador(marker, targetHeading);
    }
    if (onComplete) onComplete();
    return () => {};
  }

  const bearing = targetHeading !== undefined
    ? targetHeading
    : calcularBearing(startLat, startLng, targetLat, targetLng);

  aplicarRotacionMarcador(marker, bearing);

  let startTime: number | null = null;
  let animId: number | null = null;
  let cancelled = false;

  function step(timestamp: number) {
    if (cancelled) return;
    if (!marker || !(marker as any)._map || !(marker as any)._icon) {
      cancelled = true;
      return;
    }

    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    const currentLat = startLat + (targetLat - startLat) * easeProgress;
    const currentLng = startLng + (targetLng - startLng) * easeProgress;

    try {
      if ((marker as any)._map && (marker as any)._icon) {
        marker.setLatLng([currentLat, currentLng]);
      }
    } catch {
      cancelled = true;
      return;
    }

    if (progress < 1 && !cancelled) {
      animId = requestAnimationFrame(step);
    } else {
      try {
        if ((marker as any)._map && (marker as any)._icon) {
          marker.setLatLng([targetLat, targetLng]);
        }
      } catch {}
      if (onComplete && !cancelled) {
        onComplete();
      }
    }
  }

  animId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (animId !== null) {
      cancelAnimationFrame(animId);
    }
  };
}

/**
 * Animación continua de recorrido sobre polyline OSRM a 60 FPS
 */
export function moverVehiculoSuave(
  marker: L.Marker,
  rutaCoords: [number, number][],
  duracionTotalMs: number = 15000,
  onComplete?: () => void
): () => void {
  if (!marker || !(marker as any)._map || !rutaCoords || rutaCoords.length < 2) return () => {};

  let startTime: number | null = null;
  const totalPuntos = rutaCoords.length;
  let animId: number | null = null;
  let cancelled = false;

  function animar(tiempoActual: number) {
    if (cancelled) return;
    if (!marker || !(marker as any)._map || !(marker as any)._icon) {
      cancelled = true;
      return;
    }

    if (!startTime) startTime = tiempoActual;
    const progreso = Math.min((tiempoActual - startTime) / duracionTotalMs, 1);

    const posicionFlotante = progreso * (totalPuntos - 1);
    const indiceBase = Math.floor(posicionFlotante);
    const siguienteIndice = Math.min(indiceBase + 1, totalPuntos - 1);
    const factorPaso = posicionFlotante - indiceBase;

    const p1 = rutaCoords[indiceBase];
    const p2 = rutaCoords[siguienteIndice];

    if (p1 && p2) {
      const latActual = p1[0] + (p2[0] - p1[0]) * factorPaso;
      const lngActual = p1[1] + (p2[1] - p1[1]) * factorPaso;

      try {
        if ((marker as any)._map && (marker as any)._icon) {
          marker.setLatLng([latActual, lngActual]);
        }
      } catch {
        cancelled = true;
        return;
      }

      const angulo = calcularBearing(p1[0], p1[1], p2[0], p2[1]);
      aplicarRotacionMarcador(marker, angulo);
    }

    if (progreso < 1 && !cancelled) {
      animId = requestAnimationFrame(animar);
    } else if (onComplete && !cancelled) {
      onComplete();
    }
  }

  animId = requestAnimationFrame(animar);

  return () => {
    cancelled = true;
    if (animId !== null) {
      cancelAnimationFrame(animId);
    }
  };
}

export const AndesMoviMap: React.FC<MapComponentProps & MapViewProps> = ({
  origin,
  destination,
  activeDriver,
  drivers,
  tripStatus = 'idle',
  isDarkMode = true,
  effectiveTheme,
  className = '',
  style,
  onSelectCoordinates,
  selectionMode = null,
  serviceType = 'viaje',
  systemTariffs,
  tarifaCalculada,
  ofertaUsuario,
  onUserOfferChange,
  onRouteCalculated,
  isSidePanelVisible,
  onSuggestedFareChange,
  onPriceChange,
  onRequestRide,
  isDriverMode = false,
  driverPhase = 'pickup',
  isAdminMap = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activePolylineRef = useRef<L.Polyline | null>(null);
  const routePolylinesRef = useRef<L.Polyline[]>([]);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const slideAnimationsRef = useRef<Map<string, () => void>>(new Map());
  const previousVehiclePositionsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const vehicleBearingsRef = useRef<Map<string, number>>(new Map());
  const routeCoordsRef = useRef<[number, number][]>([]);
  const cancelAnimationRef = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceCalcTimeoutRef = useRef<any>(null);

  const onSelectCoordinatesRef = useRef(onSelectCoordinates);
  const selectionModeRef = useRef(selectionMode);
  const serviceTypeRef = useRef(serviceType);
  const systemTariffsRef = useRef(systemTariffs);
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onUserOfferChangeRef = useRef(onUserOfferChange);
  const onSuggestedFareChangeRef = useRef(onSuggestedFareChange);
  const onPriceChangeRef = useRef(onPriceChange);

  const [availableRoutes, setAvailableRoutes] = useState<ParsedRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);
  const [clientOfferedPrice, setClientOfferedPrice] = useState<number | null>(null);
  const [showMinFareNotice, setShowMinFareNotice] = useState<boolean>(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [showLocationSelector, setShowLocationSelector] = useState<boolean>(false);
  const [searchCantonQuery, setSearchCantonQuery] = useState<string>('');
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const setLocationNoticeWithTimer = (msg: string) => {
    setLocationNotice(msg);
    setTimeout(() => setLocationNotice(null), 4000);
  };

  const handleSelectCityOrCanton = useCallback((item: { name: string; lat: number; lng: number; canton?: string; province?: string; address?: string }) => {
    haptic.tap();
    const lat = item.lat;
    const lng = item.lng;
    const rawName = item.name.replace(/^[^\w\s]+/, '').trim();
    const fullAddress = item.address || `${rawName}, ${item.province || 'Ecuador'}`;

    const coords: Coordinates = {
      lat,
      lng,
      name: rawName,
      address: fullAddress,
    };

    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng([lat, lng]);
      updateMarkerLabel(originMarkerRef.current, rawName, true);
    }

    // Si el usuario aún no seleccionó un destino específico, mover el punto B cerca del nuevo origen
    const newDestLat = lat + 0.008;
    const newDestLng = lng + 0.005;
    if (!destination || !destination.lat) {
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([newDestLat, newDestLng]);
      }
    }

    if (onSelectCoordinatesRef.current) {
      onSelectCoordinatesRef.current(coords, 'origin');
    }

    try {
      localStorage.setItem('andesmovi_last_gps_coords', JSON.stringify(coords));
    } catch {}

    const map = mapInstanceRef.current;
    if (map) {
      map.setView([lat, lng], 15, { animate: true });
    }

    if (destMarkerRef.current && calcularRutaRef.current) {
      const dPos = destMarkerRef.current.getLatLng();
      calcularRutaRef.current(lat, lng, dPos.lat, dPos.lng);
    }

    setShowLocationSelector(false);
    setLocationNoticeWithTimer(`📍 Ubicación fijada en ${rawName}`);
  }, [destination]);

  const aplicarPosicionGPS = async (lat: number, lng: number, accuracyMeters?: number) => {
    let streetName = 'Mi ubicación actual';
    let fullAddress = 'Mi ubicación GPS, Ecuador';

    // Detección y corrección especial de repetidora celular en Julio Andrade (Carchi)
    // Los proveedores de telefonía móvil en Carchi suelen resolver la IP celular en la antena de Julio Andrade
    // aunque el usuario esté ubicado físicamente en Tulcán.
    const isCellTowerJulioAndrade =
      lat >= 0.70 && lat <= 0.77 && lng <= -77.65 && lng >= -77.78;

    if (isCellTowerJulioAndrade) {
      lat = TULCAN_CENTRO_DEFAULT.lat;
      lng = TULCAN_CENTRO_DEFAULT.lng;
      streetName = TULCAN_CENTRO_DEFAULT.name.replace(/^[^\w\s]+/, '').trim();
      fullAddress = TULCAN_CENTRO_DEFAULT.address;
      setLocationNoticeWithTimer('📍 Señal móvil en Carchi: Centrado en Tulcán Centro');
    }

    // 1. Nominatim Reverse Geocode
    try {
      if (!isCellTowerJulioAndrade) {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
          headers: { 'Accept-Language': 'es' }
        });
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          if (nomData && nomData.address) {
            const displayNameLower = (nomData.display_name || '').toLowerCase();
            if (displayNameLower.includes('julio andrade')) {
              lat = TULCAN_CENTRO_DEFAULT.lat;
              lng = TULCAN_CENTRO_DEFAULT.lng;
              streetName = TULCAN_CENTRO_DEFAULT.name.replace(/^[^\w\s]+/, '').trim();
              fullAddress = TULCAN_CENTRO_DEFAULT.address;
              setLocationNoticeWithTimer('📍 Centrado automáticamente en Tulcán Centro');
            } else {
              const road = nomData.address.road || nomData.address.pedestrian || nomData.address.suburb || nomData.address.neighbourhood;
              let city = nomData.address.city || nomData.address.town || nomData.address.village || nomData.address.county || 'Ecuador';
              // Si las coordenadas están en el casco urbano de Tulcán (Carchi)
              if (lat >= 0.78 && lat <= 0.85 && lng >= -77.75 && lng <= -77.66) {
                city = 'Tulcán';
              }
              if (road) {
                streetName = `${road}, ${city}`;
              } else if (nomData.display_name) {
                streetName = nomData.display_name.split(',')[0];
              }
              fullAddress = nomData.display_name || `${streetName}, ${city}`;
            }
          }
        }
      }
    } catch {
      try {
        if (!isCellTowerJulioAndrade) {
          const revRes = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`);
          if (revRes.ok) {
            const data = await revRes.json();
            if (data.waypoints && data.waypoints[0] && data.waypoints[0].name) {
              streetName = data.waypoints[0].name.trim();
              fullAddress = `${streetName}, Ecuador`;
            }
          }
        }
      } catch {}
    }

    const coords: Coordinates = {
      lat,
      lng,
      name: streetName,
      address: fullAddress,
    };

    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng([lat, lng]);
      updateMarkerLabel(originMarkerRef.current, streetName, true);
    }

    // Si el usuario aún no seleccionó un destino específico, mover el punto B cerca del nuevo origen
    const newDestLat = lat + 0.008;
    const newDestLng = lng + 0.005;
    if (!destination || !destination.lat) {
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([newDestLat, newDestLng]);
      }
    }

    if (onSelectCoordinatesRef.current) {
      onSelectCoordinatesRef.current(coords, 'origin');
    }

    try {
      localStorage.setItem('andesmovi_last_gps_coords', JSON.stringify(coords));
    } catch {}

    const map = mapInstanceRef.current;
    if (map) {
      map.setView([lat, lng], 16, { animate: true });
    }

    if (destMarkerRef.current && calcularRutaRef.current) {
      const dPos = destMarkerRef.current.getLatLng();
      calcularRutaRef.current(lat, lng, dPos.lat, dPos.lng);
    }

    setShowLocationSelector(false);
    setLocationNoticeWithTimer(`🎯 GPS activo: ${streetName} (±${Math.round(accuracyMeters || 10)}m)`);
  };

  const obtenerUbicacionReal = () => {
    if (!navigator.geolocation) {
      setShowLocationSelector(true);
      setLocationNoticeWithTimer("Tu navegador no soporta GPS. Selecciona tu cantón.");
      return;
    }

    haptic.tap();
    setIsLocatingUser(true);

    // Intento 1: Alta precisión satelital
    navigator.geolocation.getCurrentPosition(
      async (posicion) => {
        setIsLocatingUser(false);
        await aplicarPosicionGPS(posicion.coords.latitude, posicion.coords.longitude, posicion.coords.accuracy);
      },
      (errorAlta) => {
        console.warn('GPS alta precisión demoró, probando geolocalización estándar por red móvil / IP:', errorAlta.message);
        // Intento 2: Red móvil / Wi-Fi sin bloqueo
        navigator.geolocation.getCurrentPosition(
          async (posicion) => {
            setIsLocatingUser(false);
            await aplicarPosicionGPS(posicion.coords.latitude, posicion.coords.longitude, posicion.coords.accuracy);
          },
          (errorBaja) => {
            setIsLocatingUser(false);
            console.warn('Geolocalización estándar falló:', errorBaja.message);
            // Abrir selector de ciudad para que el usuario elija de inmediato
            setShowLocationSelector(true);
            setLocationNoticeWithTimer("No se pudo obtener señal GPS. Elige tu ciudad o arrastra el marcador 'De akí'.");
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  // Sincronización directa y síncrona de refs sin ciclos innecesarios de useEffect
  onSelectCoordinatesRef.current = onSelectCoordinates;
  selectionModeRef.current = selectionMode;
  serviceTypeRef.current = serviceType;
  systemTariffsRef.current = systemTariffs;
  onRouteCalculatedRef.current = onRouteCalculated;
  onUserOfferChangeRef.current = onUserOfferChange;
  onSuggestedFareChangeRef.current = onSuggestedFareChange;
  onPriceChangeRef.current = onPriceChange;

  const isDark = effectiveTheme ? effectiveTheme === 'dark' : isDarkMode;

  // Capa única y permanente: Mapa en Relieve Andino (topografía, curvas de nivel y elevaciones)
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);

  // Hook dinámico para actualizar la capa de mapa en Relieve
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTileLayerRef.current) {
      try {
        map.removeLayer(activeTileLayerRef.current);
      } catch {}
      activeTileLayerRef.current = null;
    }

    const tileConfig = getSafeTileConfig(isDark);
    const newLayer = createSafeTileLayer(tileConfig).addTo(map);
    activeTileLayerRef.current = newLayer;
  }, [isDark]);

  // Redimensión e invalidación de tamaño automática para Leaflet al cambiar paneles o vistas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
        } catch (e) {
          console.warn('Error invalidating map size:', e);
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isSidePanelVisible, effectiveTheme, isDarkMode]);

  const calcularRutaRef = useRef<((oLat: number, oLng: number, dLat: number, dLng: number) => Promise<void>) | null>(null);
  const setPuntoDestinoRef = useRef<((lat: number, lng: number, shouldFitBounds?: boolean) => Promise<void>) | null>(null);

  // 1. Inicialización de Mapa OpenStreetMap, Marcadores A / B y Rutas OSRM
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // Ignorar
      }
      mapInstanceRef.current = null;
    }

    const originLat = origin?.lat ?? 0.8116;
    const originLng = origin?.lng ?? -77.7173;
    const destLat = destination?.lat ?? (origin ? originLat + 0.009 : 0.8220);
    const destLng = destination?.lng ?? (origin ? originLng + 0.006 : -77.7115);

    const coordsOrigen: [number, number] = [originLat, originLng];
    const coordsDestino: [number, number] = [destLat, destLng];

    // Inicializar mapa de Leaflet con zoom fluido
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      tapHold: false,
      zoomSnap: 0,
      zoomDelta: 0.25,
      wheelPxPerZoomLevel: 120,
      touchZoom: true,
      bounceAtZoomLimits: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 4
    }).setView(coordsOrigen, 15);

    mapInstanceRef.current = map;

    // Refresh vehicle marker rotations on zoom, pan, or map movement
    const refreshRotations = () => {
      driverMarkersRef.current.forEach((marker) => {
        const angle = (marker as any).currentAngle;
        if (angle !== undefined) {
          aplicarRotacionMarcador(marker, angle);
        }
      });
    };
    map.on('zoomend', refreshRotations);
    map.on('moveend', refreshRotations);

    // 1. Permite interacción y arrastre fluido de mapa para clientes y conductores
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();

    // Observador de Redimensión para adaptación fluida en móviles (Split View, Giro de Pantalla, Pantalla Completa)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Capa base inicial permanente: Relieve Andino (OpenTopoMap con fallback a ESRI World Topo)
    const initialConfig = getSafeTileConfig(isDark);
    const initialLayer = createSafeTileLayer(initialConfig).addTo(map);
    activeTileLayerRef.current = initialLayer;

    // Invalidador secuencial de tamaño para WebView de Android (múltiples pasadas tras render inicial)
    const invalidateTimers = [50, 150, 350, 700, 1200].map((delay) =>
      setTimeout(() => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
          } catch {}
        }
      }, delay)
    );

    const handleWindowResizeOrOrientation = () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
        } catch {}
      }
    };
    window.addEventListener('resize', handleWindowResizeOrOrientation);
    window.addEventListener('orientationchange', handleWindowResizeOrOrientation);
    document.addEventListener('visibilitychange', handleWindowResizeOrOrientation);

    if (isAdminMap) {
      // En modo administración / monitoreo de flota GPS:
      // NO se renderiza Punto A, NO se renderiza Punto B, NO se calculan rutas OSRM.
      // Únicamente se sincronizan los vehículos de conductores activos.
      return () => {
        isMounted = false;
        invalidateTimers.forEach(clearTimeout);
        window.removeEventListener('resize', handleWindowResizeOrOrientation);
        window.removeEventListener('orientationchange', handleWindowResizeOrOrientation);
        document.removeEventListener('visibilitychange', handleWindowResizeOrOrientation);
        if (resizeObserver) resizeObserver.disconnect();
      };
    }

    // 1. Marcador Punto A (Recogida) - FIJO en la ubicación del usuario (Punto A se queda fijo)
    const originMarker = L.marker(coordsOrigen, {
      icon: createPersonaIcon(origin?.name || 'De akí'),
      draggable: false, // Fijo en la ubicación del usuario según requerimiento
      autoPan: false,
      zIndexOffset: 500,
    }).addTo(map);
    originMarkerRef.current = originMarker;

    // Función para renderizar estrictamente UNA SOLA LÍNEA de ruta limpia en el mapa
    const renderPolylines = (routes: ParsedRoute[], activeIdx: number) => {
      if (!isMounted || !mapInstanceRef.current || !(map as any)._panes) return;

      if (!routes || routes.length === 0) return;

      // 1. Limpieza Obligatoria de Capas Previas (Evitar acumulación de trazos y rutas alternativas)
      if ((window as any).capaRutaActiva) {
        try {
          map.removeLayer((window as any).capaRutaActiva);
        } catch {}
        (window as any).capaRutaActiva = null;
      }
      if (activePolylineRef.current) {
        try {
          activePolylineRef.current.remove();
        } catch {}
        activePolylineRef.current = null;
      }
      routePolylinesRef.current.forEach((p) => {
        try {
          p.remove();
        } catch {}
      });
      routePolylinesRef.current = [];

      // 2. Trazado Único, Nítido y Limpio (Tomando únicamente la primera ruta principal)
      const selectedRoute = routes[0] || routes[activeIdx];
      if (selectedRoute) {
        (window as any).capaRutaActiva = L.polyline(selectedRoute.coordinates, {
          color: '#0052FF',      // Azul eléctrico intenso de alto contraste
          weight: 6,             // Grosor visible sin saturar
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
          smoothFactor: 1.2,
        }).addTo(map);

        activePolylineRef.current = (window as any).capaRutaActiva;
        routeCoordsRef.current = selectedRoute.coordinates;

        // 3. Enfoque de Cámara Automático (FitBounds) una sola vez
        try {
          map.fitBounds((window as any).capaRutaActiva.getBounds(), {
            padding: [50, 50],
            maxZoom: 16,
          });
        } catch {}
      }
    };

    // Función de cálculo de ruta con OSRM optimizada (AbortController + Manejo eficiente de memoria)
    const calcularRuta = async (
      oLat: number,
      oLng: number,
      dLat: number,
      dLng: number
    ) => {
      // Cancelar peticiones HTTP previas pendientes para evitar saturación de red y memoria
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (!isMounted) return;
        setIsCalculatingRoute(true);
        const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&alternatives=false`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`OSRM HTTP error status ${response.status}`);
        }
        const data = await response.json();

        if (!isMounted || !mapInstanceRef.current || !(map as any)._panes) return;

        if (!data.routes || data.routes.length === 0) {
          throw new Error('OSRM no devolvió rutas');
        }

        const currentService = serviceTypeRef.current || 'viaje';
        const currentTariffs = systemTariffsRef.current;
        const rutaPrincipal = data.routes[0];
        const sortedRoutes = [rutaPrincipal];

        const parsedList: ParsedRoute[] = sortedRoutes.slice(0, 3).map((r: any, idx: number) => {
          const distanciaMetros = r.distance || 0;
          const duracionSegundos = r.duration || 0;
          const distanciaKmNum = distanciaMetros / 1000;
          const distanciaKmStr = distanciaKmNum.toFixed(1);

          const horas = Math.floor(duracionSegundos / 3600);
          const minutos = Math.round((duracionSegundos % 3600) / 60);
          const tiempoMinTotal = Math.max(1, Math.round(duracionSegundos / 60));

          // Formateo legible de tiempo en la interfaz: "4 h 35 min" o "12 min"
          const tiempoTexto = horas >= 1
            ? (minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`)
            : `${tiempoMinTotal} min`;

          const isInter = distanciaKmNum > 35 || currentService === 'ejecutivo_quito';
          const suggestedFare = calculateDynamicFare(distanciaKmNum, tiempoMinTotal, currentService, currentTariffs);
          let coordinates: [number, number][] = r.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );

          // Asegurar que el primer punto coincida exactamente con Punto A y el último con la Bandera (Punto B)
          if (coordinates.length >= 2) {
            coordinates[0] = [oLat, oLng];
            coordinates[coordinates.length - 1] = [dLat, dLng];
          } else {
            coordinates = [[oLat, oLng], [dLat, dLng]];
          }

          return {
            id: idx,
            name: idx === 0 ? '⚡ RUTA MÁS RÁPIDA' : `Alternativa ${idx}`,
            distanceKm: distanciaKmStr,
            durationMin: tiempoMinTotal,
            durationFormatted: tiempoTexto,
            suggestedFare,
            coordinates,
            isInterprovincial: isInter,
          };
        });

        setAvailableRoutes(parsedList);
        setSelectedRouteIndex(0);

        // 2. Sincronización Inmediata de la RUTA MÁS RÁPIDA
        const primary = parsedList[0];
        setRouteMetrics({
          distanceKm: primary.distanceKm,
          durationMin: primary.durationMin,
          durationFormatted: primary.durationFormatted,
          suggestedFare: primary.suggestedFare,
          isInterprovincial: primary.isInterprovincial,
        });
        setClientOfferedPrice(primary.suggestedFare);

        if (onRouteCalculatedRef.current) {
          onRouteCalculatedRef.current(primary.suggestedFare, parseFloat(primary.distanceKm), primary.durationMin, origin?.name, destination?.name);
        }
        if (onSuggestedFareChangeRef.current) {
          onSuggestedFareChangeRef.current(primary.suggestedFare, parseFloat(primary.distanceKm), primary.durationMin);
        }
        if (onPriceChangeRef.current) {
          onPriceChangeRef.current(primary.suggestedFare);
        }
        if (onUserOfferChangeRef.current) {
          onUserOfferChangeRef.current(primary.suggestedFare);
        }

        renderPolylines(parsedList, 0);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          // Petición cancelada por una nueva interacción de usuario (comportamiento normal)
          return;
        }
        console.warn('Error al calcular la ruta con OSRM, usando cálculo directo:', error);
        if (isMounted && mapInstanceRef.current && (map as any)._panes) {
          const directDistKm = calculateDistanceKm({ lat: oLat, lng: oLng }, { lat: dLat, lng: dLng });
          const estMin = Math.max(5, Math.ceil((directDistKm / 28) * 60));
          const horas = Math.floor(estMin / 60);
          const mins = estMin % 60;
          const tiempoTexto = horas >= 1
            ? (mins > 0 ? `${horas} h ${mins} min` : `${horas} h`)
            : `${estMin} min`;
          const currentService = serviceTypeRef.current || 'viaje';
          const currentTariffs = systemTariffsRef.current;
          const isInter = directDistKm > 35 || currentService === 'ejecutivo_quito';
          const suggestedFare = calculateDynamicFare(directDistKm, estMin, currentService, currentTariffs);
          const fallbackCoords: [number, number][] = [
            [oLat, oLng],
            [dLat, dLng],
          ];
          const fallbackList: ParsedRoute[] = [{
            id: 0,
            name: '⚡ RUTA MÁS RÁPIDA',
            distanceKm: directDistKm.toFixed(1),
            durationMin: estMin,
            durationFormatted: tiempoTexto,
            suggestedFare,
            coordinates: fallbackCoords,
            isInterprovincial: isInter,
          }];
          setAvailableRoutes(fallbackList);
          setSelectedRouteIndex(0);
          setRouteMetrics({
            distanceKm: fallbackList[0].distanceKm,
            durationMin: fallbackList[0].durationMin,
            durationFormatted: fallbackList[0].durationFormatted,
            suggestedFare: fallbackList[0].suggestedFare,
            isInterprovincial: fallbackList[0].isInterprovincial,
          });
          setClientOfferedPrice(suggestedFare);
          if (onRouteCalculatedRef.current) {
            onRouteCalculatedRef.current(suggestedFare, directDistKm, estMin, origin?.name, destination?.name);
          }
          if (onSuggestedFareChangeRef.current) {
            onSuggestedFareChangeRef.current(suggestedFare, directDistKm, estMin);
          }
          if (onPriceChangeRef.current) {
            onPriceChangeRef.current(suggestedFare);
          }
          if (onUserOfferChangeRef.current) {
            onUserOfferChangeRef.current(suggestedFare);
          }
          renderPolylines(fallbackList, 0);
        }
      } finally {
        if (isMounted) {
          setIsCalculatingRoute(false);
        }
      }
    };

    calcularRutaRef.current = calcularRuta;

    // Función unificada para situar o mover el Marcador Punto B (Bandera Ecuador 🇪🇨) con instancia única
    const setPuntoDestino = async (lat: number, lng: number, shouldFitBounds: boolean = true) => {
      if (!isMounted || !mapInstanceRef.current || !(map as any)._panes) return;

      const destLabel = destination?.name || 'Llegada';

      if (!destMarkerRef.current) {
        // Crear el marcador únicamente si no existe aún en memoria
        const newDestMarker = L.marker([lat, lng], {
          icon: createDestIcon(destLabel, true),
          draggable: !isDriverMode,
          autoPan: !isDriverMode,
          zIndexOffset: 400,
        }).addTo(map);

        newDestMarker.on('dragstart', (e: any) => {
          haptic.tap();
          const el = e.target?.getElement?.();
          if (el) el.classList.add('marker-dragging');
          if (activePolylineRef.current) {
            try {
              activePolylineRef.current.setStyle({ opacity: 0.25, weight: 3 });
            } catch {}
          }
        });

        // Evento al soltar ('dragend'): Dispara la llamada OSRM únicamente al terminar de mover
        newDestMarker.on('dragend', async (e: any) => {
          haptic.success();
          const el = e.target?.getElement?.();
          if (el) el.classList.remove('marker-dragging');
          const pos = e.target.getLatLng();
          const origPos = originMarkerRef.current ? originMarkerRef.current.getLatLng() : L.latLng(coordsOrigen);
          calcularRuta(origPos.lat, origPos.lng, pos.lat, pos.lng);

          const geo = await reverseGeocodeOSRM(pos.lat, pos.lng);
          updateMarkerLabel(destMarkerRef.current, geo.streetName, false);
          triggerDestMarkerBounce(destMarkerRef.current);

          if (onSelectCoordinatesRef.current) {
            onSelectCoordinatesRef.current(
              {
                lat: pos.lat,
                lng: pos.lng,
                name: geo.streetName,
                address: geo.fullAddress,
              },
              'destination'
            );
          }
        });

        destMarkerRef.current = newDestMarker;
      } else {
        // Si ya existe, reutilizar instancia sin instanciar nuevos objetos (setLatLng)
        destMarkerRef.current.setLatLng([lat, lng]);
      }

      const origPos = originMarkerRef.current ? originMarkerRef.current.getLatLng() : L.latLng(coordsOrigen);
      // Recalcular la ruta con OSRM
      calcularRuta(origPos.lat, origPos.lng, lat, lng);

      // Geocodificación inversa para nombre de calle
      const geo = await reverseGeocodeOSRM(lat, lng);
      updateMarkerLabel(destMarkerRef.current, geo.streetName, false);
      triggerDestMarkerBounce(destMarkerRef.current);

      if (onSelectCoordinatesRef.current) {
        onSelectCoordinatesRef.current(
          {
            lat,
            lng,
            name: geo.streetName,
            address: geo.fullAddress,
          },
          'destination'
        );
      }

      // Ajuste de cámara (fitBounds)
      if (shouldFitBounds && mapInstanceRef.current) {
        try {
          map.fitBounds([
            [origPos.lat, origPos.lng],
            [lat, lng]
          ], { padding: [50, 50], maxZoom: 16, animate: true });
        } catch {}
      }
    };

    setPuntoDestinoRef.current = setPuntoDestino;

    // Inicializar Punto B con la función unificada (Siempre visible con ruta fija)
    setPuntoDestino(coordsDestino[0], coordsDestino[1], isDriverMode);

    // Quitar la clase de animación tras 3 segundos para asentar el marcador sin re-crear el icono DOM
    const destBounceTimer = setTimeout(() => {
      if (isMounted && destMarkerRef.current && (destMarkerRef.current as any)._map) {
        const el = destMarkerRef.current.getElement();
        if (el) {
          const wrapper = el.querySelector('.marker-bounce-wrapper');
          if (wrapper) wrapper.classList.remove('marker-bounce-3s');
        }
      }
    }, 3000);

    // Punto A (Origen / "De akí") permanece SIEMPRE FIJO en la ubicación del usuario
    if (originMarkerRef.current && originMarkerRef.current.dragging) {
      originMarkerRef.current.dragging.disable();
    }

    // Permitir seleccionar o cambiar el Punto B (Destino con Bandera 🇪🇨) con un clic o tap en el mapa
    if (!isDriverMode) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        if (e.originalEvent) {
          try {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
          } catch {}
        }

        const mode = selectionModeRef.current;
        haptic.tap();

        if (mode === 'stop') {
          const geo = await reverseGeocodeOSRM(e.latlng.lat, e.latlng.lng);
          if (onSelectCoordinatesRef.current) {
            onSelectCoordinatesRef.current(
              {
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                name: geo.streetName,
                address: geo.fullAddress,
              },
              'stop'
            );
          }
        } else {
          // Requerimiento: El Punto A se queda fijo en la ubicación del usuario.
          // El Punto B se puede seleccionar directamente con un clic o tap en cualquier lugar del mapa.
          if (setPuntoDestinoRef.current) {
            setPuntoDestinoRef.current(e.latlng.lat, e.latlng.lng, true);
          }
        }
      });
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator && !origin) {
      let puntoAFijado = false;
      if (puntoAFijado) return;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (puntoAFijado || !isMounted || !mapInstanceRef.current) return;
          puntoAFijado = true;
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          originMarker.setLatLng([userLat, userLng]);
          map.setView([userLat, userLng], 15);

          const geo = await reverseGeocodeOSRM(userLat, userLng);
          updateMarkerLabel(originMarkerRef.current, geo.streetName, true);

          if (onSelectCoordinatesRef.current) {
            onSelectCoordinatesRef.current(
              {
                lat: userLat,
                lng: userLng,
                name: geo.streetName,
                address: geo.fullAddress,
              },
              'origin'
            );
          }
          const destPos = destMarkerRef.current ? destMarkerRef.current.getLatLng() : L.latLng(coordsDestino);
          calcularRuta(userLat, userLng, destPos.lat, destPos.lng);
        },
        (error) => {
          console.warn('GPS no disponible al inicio, usando coordenadas por defecto:', error);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: Infinity }
      );
    }

    const resizeTimer = setTimeout(() => {
      if (isMounted && mapInstanceRef.current) {
        map.invalidateSize();
      }
    }, 250);

    return () => {
      isMounted = false;
      calcularRutaRef.current = null;
      invalidateTimers.forEach(clearTimeout);
      window.removeEventListener('resize', handleWindowResizeOrOrientation);
      window.removeEventListener('orientationchange', handleWindowResizeOrOrientation);
      document.removeEventListener('visibilitychange', handleWindowResizeOrOrientation);
      clearTimeout(destBounceTimer);
      clearTimeout(resizeTimer);
      if (debounceCalcTimeoutRef.current) {
        clearTimeout(debounceCalcTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (cancelAnimationRef.current) {
        cancelAnimationRef.current();
        cancelAnimationRef.current = null;
      }
      if (activePolylineRef.current) {
        try {
          activePolylineRef.current.remove();
        } catch {
          // Ignorar
        }
        activePolylineRef.current = null;
      }
      routePolylinesRef.current.forEach((poly) => {
        try {
          poly.remove();
        } catch {}
      });
      routePolylinesRef.current = [];

      // Cancelar animaciones activas
      slideAnimationsRef.current.forEach((cancel) => {
        try {
          cancel();
        } catch {}
      });
      slideAnimationsRef.current.clear();

      driverMarkersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch {
          // Ignorar
        }
      });
      driverMarkersRef.current.clear();

      if (originMarkerRef.current) {
        try {
          originMarkerRef.current.remove();
        } catch {}
        originMarkerRef.current = null;
      }

      if (destMarkerRef.current) {
        try {
          destMarkerRef.current.remove();
        } catch {}
        destMarkerRef.current = null;
      }

      if (resizeObserver) {
        try {
          resizeObserver.disconnect();
        } catch {}
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // Ignorar
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isDark]);

  // Sincronizar posición de Punto A y Punto B cuando cambien las coordenadas desde props externas
  useEffect(() => {
    if (!originMarkerRef.current || !destMarkerRef.current || !mapInstanceRef.current) return;
    let needsRecalc = false;

    if (origin && typeof origin.lat === 'number' && typeof origin.lng === 'number') {
      const curPos = originMarkerRef.current.getLatLng();
      if (Math.abs(curPos.lat - origin.lat) > 0.00005 || Math.abs(curPos.lng - origin.lng) > 0.00005) {
        originMarkerRef.current.setLatLng([origin.lat, origin.lng]);
        needsRecalc = true;
        // Si no hay destino explícito del usuario, reubicar el marcador de llegada cerca del nuevo origen
        if (!destination || !destination.lat) {
          destMarkerRef.current.setLatLng([origin.lat + 0.008, origin.lng + 0.005]);
        }
      }
    }

    if (destination && typeof destination.lat === 'number' && typeof destination.lng === 'number') {
      const curPos = destMarkerRef.current.getLatLng();
      if (Math.abs(curPos.lat - destination.lat) > 0.00005 || Math.abs(curPos.lng - destination.lng) > 0.00005) {
        destMarkerRef.current.setLatLng([destination.lat, destination.lng]);
        triggerDestMarkerBounce(destMarkerRef.current);
        needsRecalc = true;
      }
    }

    if (needsRecalc && calcularRutaRef.current) {
      const oPos = originMarkerRef.current.getLatLng();
      const dPos = destMarkerRef.current.getLatLng();
      calcularRutaRef.current(oPos.lat, oPos.lng, dPos.lat, dPos.lng);
      try {
        if (destination && destination.lat) {
          mapInstanceRef.current.fitBounds([
            [oPos.lat, oPos.lng],
            [dPos.lat, dPos.lng]
          ], { padding: [50, 50], maxZoom: 16, animate: true });
        } else {
          // Centrar directamente en el usuario si aún no seleccionó destino
          mapInstanceRef.current.setView([oPos.lat, oPos.lng], 16, { animate: true });
        }
      } catch {}
    }
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  // Sincronizar etiqueta del Punto A ("De akí") cuando cambie origin.name desde el panel o autocompletado
  useEffect(() => {
    if (originMarkerRef.current) {
      updateMarkerLabel(originMarkerRef.current, origin?.name || 'De akí', true);
    }
  }, [origin?.name]);

  // Sincronizar etiqueta del Punto B ("Llegada") cuando cambie destination.name desde el panel o autocompletado
  useEffect(() => {
    if (destMarkerRef.current) {
      updateMarkerLabel(destMarkerRef.current, destination?.name || 'Llegada', false);
    }
  }, [destination?.name]);

  // Dynamic map interactivity setup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if ((map as any).tapHold) (map as any).tapHold.enable();

    // Punto A permanece siempre fijo en la ubicación del usuario
    if (originMarkerRef.current && originMarkerRef.current.dragging) {
      originMarkerRef.current.dragging.disable();
    }

    if (isDriverMode) {
      if (destMarkerRef.current && destMarkerRef.current.dragging) {
        destMarkerRef.current.dragging.disable();
      }
    } else {
      if (destMarkerRef.current && destMarkerRef.current.dragging) {
        destMarkerRef.current.dragging.enable();
      }
    }
  }, [isDriverMode]);

  // En modo Conductor: Bloqueo estricto solo lectura, ruta fija completa y centrado de cámara
  useEffect(() => {
    if (!isDriverMode) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    // Asegurar que ambos marcadores estén presentes en el mapa y no sean arrastrables
    if (originMarkerRef.current) {
      if (!originMarkerRef.current.getElement()) {
        originMarkerRef.current.addTo(map);
      }
      if (originMarkerRef.current.dragging) {
        originMarkerRef.current.dragging.disable();
      }
    }

    if (!destMarkerRef.current && destination && typeof destination.lat === 'number' && typeof destination.lng === 'number') {
      const newDest = L.marker([destination.lat, destination.lng], {
        icon: createDestIcon(destination.name || 'Llegada', true),
        draggable: false,
        autoPan: false,
        zIndexOffset: 400,
      }).addTo(map);
      destMarkerRef.current = newDest;
    } else if (destMarkerRef.current) {
      if (!destMarkerRef.current.getElement()) {
        destMarkerRef.current.addTo(map);
      }
      if (destMarkerRef.current.dragging) {
        destMarkerRef.current.dragging.disable();
      }
    }

    // Trazar ruta fija y centrar cámara automáticamente abarcando ambos puntos y la ruta
    const oPos = originMarkerRef.current?.getLatLng();
    const dPos = destMarkerRef.current?.getLatLng();
    if (oPos && dPos) {
      if (calcularRutaRef.current) {
        calcularRutaRef.current(oPos.lat, oPos.lng, dPos.lat, dPos.lng);
      }
      try {
        map.fitBounds([
          [oPos.lat, oPos.lng],
          [dPos.lat, dPos.lng]
        ], { padding: [60, 60], maxZoom: 16, animate: true });
      } catch {}
    }
  }, [isDriverMode, destination?.lat, destination?.lng, origin?.lat, origin?.lng]);

  // 2. SINCRONIZACIÓN DINÁMICA DE CONDUCTORES CON INTERPOLACIÓN LINEAL SLIDETO
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const syncVehicles = (
      vehicleList: {
        id: string;
        name: string;
        isMoto: boolean;
        coords: Coordinates;
        label: string;
        isOnline: boolean;
        headingDegrees?: number;
      }[]
    ) => {
      if (!mapInstanceRef.current || !(mapInstanceRef.current as any)._panes) return;

      const currentIds = new Set<string>();

      vehicleList.forEach((veh) => {
        if (!veh.isOnline || !veh.coords || typeof veh.coords.lat !== 'number' || typeof veh.coords.lng !== 'number') {
          return;
        }

        currentIds.add(veh.id);
        const existingMarker = driverMarkersRef.current.get(veh.id);
        const prevPos = previousVehiclePositionsRef.current.get(veh.id);

        let currentBearing = veh.headingDegrees;

        if (existingMarker) {
          const currentLatLng = existingMarker.getLatLng();
          const hasMoved = currentLatLng.lat !== veh.coords.lat || currentLatLng.lng !== veh.coords.lng;

          if (currentBearing !== undefined) {
            (existingMarker as any).currentAngle = currentBearing;
          }

          if (hasMoved) {
            const existingSlide = slideAnimationsRef.current.get(veh.id);
            if (existingSlide) {
              existingSlide();
              slideAnimationsRef.current.delete(veh.id);
            }

            const cancelSlide = slideMarkerTo(
              existingMarker,
              veh.coords.lat,
              veh.coords.lng,
              950,
              currentBearing,
              () => {
                slideAnimationsRef.current.delete(veh.id);
              }
            );
            slideAnimationsRef.current.set(veh.id, cancelSlide);
          } else if (currentBearing !== undefined) {
            vehicleBearingsRef.current.set(veh.id, currentBearing);
            aplicarRotacionMarcador(existingMarker, currentBearing);
          }
        } else {
          const icon = veh.isMoto ? createMotoIcon(veh.label) : createCarIcon(veh.label);
          const marker = L.marker([veh.coords.lat, veh.coords.lng], {
            icon,
            zIndexOffset: 100,
          });

          const angleToUse = currentBearing !== undefined
            ? currentBearing
            : prevPos
            ? calcularBearing(prevPos.lat, prevPos.lng, veh.coords.lat, veh.coords.lng)
            : 0;

          (marker as any).currentAngle = angleToUse;

          // Reapply rotation when added or moved
          marker.on('add', () => {
            setTimeout(() => {
              aplicarRotacionMarcador(marker, (marker as any).currentAngle || 0);
            }, 10);
          });

          marker.on('move', () => {
            aplicarRotacionMarcador(marker, (marker as any).currentAngle || 0);
          });

          marker.addTo(map);

          driverMarkersRef.current.set(veh.id, marker);

          if (angleToUse !== undefined) {
            vehicleBearingsRef.current.set(veh.id, angleToUse);
            aplicarRotacionMarcador(marker, angleToUse);
          }

          if (
            routeCoordsRef.current.length >= 2 &&
            (tripStatus === 'driver_assigned' ||
              tripStatus === 'driver_arriving' ||
              tripStatus === 'in_progress')
          ) {
            if (cancelAnimationRef.current) {
              cancelAnimationRef.current();
            }
            cancelAnimationRef.current = moverVehiculoSuave(
              marker,
              routeCoordsRef.current,
              16000
            );
          }
        }

        previousVehiclePositionsRef.current.set(veh.id, {
          lat: veh.coords.lat,
          lng: veh.coords.lng,
        });
      });

      driverMarkersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          const cancelSlide = slideAnimationsRef.current.get(id);
          if (cancelSlide) {
            cancelSlide();
            slideAnimationsRef.current.delete(id);
          }
          try {
            marker.remove();
          } catch {
            // Ignorar
          }
          driverMarkersRef.current.delete(id);
          previousVehiclePositionsRef.current.delete(id);
          vehicleBearingsRef.current.delete(id);
        }
      });
    };

    if (drivers && drivers.length > 0) {
      const parsedDrivers = drivers.map((d) => {
        const isMoto = d.vehicle?.type === 'moto';
        const isOnline = d.isAvailable !== false && (!d.telemetry || d.telemetry.operationalStatus !== 'desconectado');
        const label = isMoto
          ? '📦 Reparto'
          : d.vehicle?.model || d.vehicle?.make || 'Mercedes';

        return {
          id: d.id,
          name: d.name,
          isMoto,
          coords: d.currentCoords,
          label,
          isOnline,
          headingDegrees: d.telemetry?.headingDegrees,
        };
      });

      syncVehicles(parsedDrivers);
      return;
    }

    if (activeDriver && activeDriver.currentCoords) {
      const isMoto = activeDriver.vehicle?.type === 'moto';
      syncVehicles([
        {
          id: activeDriver.id,
          name: activeDriver.name,
          isMoto,
          coords: activeDriver.currentCoords,
          label: isMoto ? '📦 Reparto' : 'Mercedes',
          isOnline: true,
          headingDegrees: activeDriver.telemetry?.headingDegrees,
        },
      ]);
      return;
    }

    // MODO MOCK / SIMULADO ELIMINADO: No renderizar vehículos artificiales de fondo
    syncVehicles([]);
    return () => {};
  }, [drivers, activeDriver, tripStatus]);

  const handleZoomIn = useCallback(() => {
    haptic.tap();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    haptic.tap();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  }, []);

  const handleRecenterFixedRoute = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    haptic.tap();
    const oPos = originMarkerRef.current?.getLatLng();
    const dPos = destMarkerRef.current?.getLatLng();
    if (oPos && dPos) {
      map.fitBounds([
        [oPos.lat, oPos.lng],
        [dPos.lat, dPos.lng]
      ], { padding: [60, 60], maxZoom: 16, animate: true });
    } else if (activePolylineRef.current) {
      map.fitBounds(activePolylineRef.current.getBounds(), { padding: [60, 60], maxZoom: 16, animate: true });
    }
  }, []);

  // 3. Recentrar mapa y Punto A en la ubicación GPS del usuario
  const handleCenterOnUserLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      alert('La geolocalización no está disponible en este dispositivo.');
      return;
    }

    setIsLocatingUser(true);
    haptic.tap();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocatingUser(false);
        haptic.success();
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([userLat, userLng], 16, {
            duration: 1.0,
          });

          if (originMarkerRef.current) {
            originMarkerRef.current.setLatLng([userLat, userLng]);
          }

          const geo = await reverseGeocodeOSRM(userLat, userLng);
          updateMarkerLabel(originMarkerRef.current, geo.streetName, true);

          if (onSelectCoordinatesRef.current) {
            onSelectCoordinatesRef.current(
              {
                lat: userLat,
                lng: userLng,
                name: geo.streetName,
                address: geo.fullAddress,
              },
              'origin'
            );
          }

          if (destMarkerRef.current && calcularRutaRef.current) {
            const destPos = destMarkerRef.current.getLatLng();
            calcularRutaRef.current(userLat, userLng, destPos.lat, destPos.lng);
          }
        }
      },
      (error) => {
        setIsLocatingUser(false);
        console.warn('Error al obtener GPS:', error);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <div
      className={`w-full h-full min-h-[300px] flex-1 relative overflow-hidden select-none ${
        isDark ? 'dark-map dark-map-theme' : 'light-map light-map-theme'
      } ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        touchAction: 'pan-x pan-y',
        ...style,
      }}
    >
      {/* Estilos CSS embebidos para mapas y eliminación de parpadeo táctil */}
      <style>{`
        .leaflet-zoom-animated {
          transition: transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1) !important;
        }
        .leaflet-tile-container {
          will-change: transform;
        }
        .leaflet-container {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          touch-action: pan-x pan-y !important;
          background: ${isDark ? '#121212' : '#f8fafc'} !important;
        }
        .leaflet-marker-icon, .leaflet-marker-shadow {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          user-select: none !important;
        }
        @keyframes pinDropBounce {
          0% {
            transform: translateY(-45px) scale(0.6);
            opacity: 0;
          }
          50% {
            transform: translateY(0px) scale(1.15);
            opacity: 1;
          }
          70% {
            transform: translateY(-10px) scale(0.95);
          }
          85% {
            transform: translateY(0px) scale(1.03);
          }
          100% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
        }
        .pin-drop-bounce {
          animation: pinDropBounce 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
          transform-origin: bottom center;
        }
      `}</style>

      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          zIndex: 1,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'auto',
          userSelect: isDriverMode ? 'none' : 'auto',
          pointerEvents: 'auto',
        }}
      />

      {/* Indicador visual de Modo Conductor Solo Lectura y Ruta Fija */}
      {isDriverMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-md text-xs font-bold ${
            isDark
              ? 'bg-zinc-950/90 border-emerald-500/60 text-emerald-400'
              : 'bg-white border-[#0052FF] text-[#0052FF] shadow-blue-500/10'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] animate-pulse" />
            <span className="font-extrabold text-[#111827]">Ruta Fija del Cliente • Modo Solo Lectura</span>
          </div>
        </div>
      )}

      {/* Barra Flotante de Ubicación Actual del Pasajero / Cliente */}
      {!isDriverMode && !isAdminMap && (
        <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[1000] pointer-events-auto">
          <div className={`p-2 sm:px-3 sm:py-2 rounded-2xl border shadow-xl backdrop-blur-md flex items-center justify-between gap-2 transition-all ${
            isDark
              ? 'bg-zinc-950/95 border-emerald-500/40 text-zinc-100 shadow-emerald-500/5'
              : 'bg-white/95 border-emerald-400 text-slate-800 shadow-emerald-500/10'
          }`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Punto A (Fijo en tu ubicación):</span>
                  <span className="text-[10px] text-zinc-400 font-semibold truncate">Ecuador</span>
                </div>
                <span className="text-xs font-bold truncate max-w-[190px] sm:max-w-[240px]">
                  {origin?.name || origin?.address || 'Mi ubicación actual'}
                </span>
                <span className="text-[9px] text-blue-500 font-bold flex items-center gap-1 mt-0.5">
                  🏁 Clic o tap en el mapa para marcar tu Destino (Punto B)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                id="btn-quick-gps-trigger"
                onClick={obtenerUbicacionReal}
                disabled={isLocatingUser}
                title="Detectar GPS satelital"
                className={`p-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  isLocatingUser
                    ? 'bg-emerald-500 text-black animate-pulse'
                    : isDark
                    ? 'bg-zinc-850 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}
              >
                <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline text-[11px]">GPS</span>
              </button>
              <button
                type="button"
                id="btn-open-city-selector"
                onClick={() => setShowLocationSelector((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black tracking-wide transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                }`}
                title="Cambiar mi ciudad o cantón"
              >
                <span>Cambiar</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLocationSelector ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Aviso especial de detección si marca Julio Andrade pero el usuario está en Tulcán */}
          {(origin?.name?.toLowerCase().includes('julio andrade') ||
            origin?.address?.toLowerCase().includes('julio andrade') ||
            (origin?.lat && origin.lat >= 0.70 && origin.lat <= 0.77 && origin.lng <= -77.65 && origin.lng >= -77.78)) && (
            <div className="mt-2 p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/80 text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs font-bold min-w-0">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span className="leading-tight">¿Estás en Tulcán y te marca en Julio Andrade?</span>
              </div>
              <button
                type="button"
                id="btn-fix-tulcan-centro-banner"
                onClick={() => handleSelectCityOrCanton(TULCAN_CENTRO_DEFAULT)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black tracking-wider uppercase transition-all active:scale-95 cursor-pointer shadow flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fijar Tulcán Centro</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notificación Toast flotante de ubicación */}
      {locationNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none transition-all animate-bounce">
          <div className={`px-4 py-2 rounded-full text-xs font-extrabold shadow-2xl border flex items-center gap-2 backdrop-blur-xl ${
            isDark ? 'bg-zinc-900/95 border-emerald-500 text-emerald-300' : 'bg-emerald-600 border-white text-white shadow-emerald-500/30'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{locationNotice}</span>
          </div>
        </div>
      )}

      {/* Modal / Sheet Flotante: Selector Rápido de Ubicación / Ciudad de Ecuador */}
      {showLocationSelector && (
        <div className="absolute inset-0 z-[2500] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl p-5 border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Header del Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">¿En qué ciudad te encuentras?</h3>
                  <p className="text-[11px] text-zinc-400">Selecciona tu cantón o activa el GPS satelital</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationSelector(false)}
                className="p-1.5 rounded-full hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1 scrollbar-thin">
              {/* Botón Destacado: Tulcán Centro Inmediato */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border-2 border-emerald-500/40 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-black block text-emerald-400">¿Estás en Tulcán?</span>
                  <span className="text-[11px] text-zinc-400 block truncate">Fijar en Parque de la Independencia / Casco Central</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectCityOrCanton(TULCAN_CENTRO_DEFAULT)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all active:scale-95 cursor-pointer shadow flex items-center gap-1 flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tulcán Centro</span>
                </button>
              </div>

              {/* Botón Destacado: Forzar GPS de Alta Precisión */}
              <button
                type="button"
                onClick={obtenerUbicacionReal}
                disabled={isLocatingUser}
                className={`w-full p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md ${
                  isLocatingUser
                    ? 'bg-emerald-500 text-black animate-pulse'
                    : isDark
                    ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800 hover:border-emerald-500/50'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <Crosshair className={`w-4 h-4 ${isLocatingUser ? 'animate-spin' : ''}`} />
                <span>{isLocatingUser ? 'Detectando señal de satélite...' : '🛰️ Reintentar GPS Satelital de alta precisión'}</span>
              </button>

              {/* Sectores de Tulcán */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-2">
                  🏰 Sectores de Tulcán (Carchi):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {POPULAR_TULCAN_SECTORS.map((sec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCityOrCanton(sec)}
                      className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex items-center justify-between group ${
                        isDark
                          ? 'bg-zinc-900/60 hover:bg-zinc-850 border-zinc-800/80 hover:border-emerald-500/40 text-zinc-200'
                          : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-400 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <span className="text-xs font-bold block truncate group-hover:text-emerald-400">
                          {sec.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          {sec.address}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-zinc-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Buscador de Ciudad / Cantón */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchCantonQuery}
                  onChange={(e) => setSearchCantonQuery(e.target.value)}
                  placeholder="Buscar cantón o ciudad (ej. Cayambe, Quito, Ibarra...)"
                  className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
                {searchCantonQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchCantonQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cuadrícula de Otras Ciudades Populares */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                  Otras Ciudades y Cantones de Ecuador:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POPULAR_ECUADOR_POINTS
                    .filter((pt) =>
                      !searchCantonQuery ||
                      pt.name.toLowerCase().includes(searchCantonQuery.toLowerCase()) ||
                      pt.canton.toLowerCase().includes(searchCantonQuery.toLowerCase()) ||
                      pt.province.toLowerCase().includes(searchCantonQuery.toLowerCase())
                    )
                    .map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCityOrCanton(item)}
                        className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between group ${
                          isDark
                            ? 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800 hover:border-emerald-500/50'
                            : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <span className="text-xs font-black truncate block text-emerald-400 group-hover:text-emerald-300">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate block mt-0.5">
                          {item.province}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Tip Informativo */}
              <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                isDark ? 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="text-base leading-none">💡</span>
                <span>
                  <strong>Tip de precisión:</strong> También puedes tocar y arrastrar directamente el marcador verde <strong>&quot;De akí&quot;</strong> en el mapa con tu dedo hasta la puerta exacta de tu casa o negocio.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800/40 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLocationSelector(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLES FLOTANTES EN ESQUINA INFERIOR DERECHA: ZOOM (+ / -) Y BOTÓN CIRCULAR DE NAVEGACIÓN */}
      <div className="absolute bottom-28 right-4 sm:bottom-32 sm:right-6 z-[1000] flex flex-col items-center gap-2.5">
        {/* Controles de Zoom (+ / -) Disponibles en modo conductor y pasajero */}
        <div
          className={`flex flex-col rounded-2xl shadow-md border backdrop-blur-md overflow-hidden ${
            isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white border-[#E5E7EB]'
          }`}
        >
          <button
            type="button"
            id="btn-map-zoom-in"
            onClick={handleZoomIn}
            className={`w-11 h-11 flex items-center justify-center transition-colors active:scale-90 cursor-pointer ${
              isDark ? 'text-zinc-200 hover:bg-zinc-800' : 'text-[#111827] hover:bg-[#F4F6F9]'
            }`}
            title="Acercar mapa (+)"
            aria-label="Acercar mapa"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className={`h-[1px] w-full ${isDark ? 'bg-zinc-800' : 'bg-[#E5E7EB]'}`} />
          <button
            type="button"
            id="btn-map-zoom-out"
            onClick={handleZoomOut}
            className={`w-11 h-11 flex items-center justify-center transition-colors active:scale-90 cursor-pointer ${
              isDark ? 'text-zinc-200 hover:bg-zinc-800' : 'text-[#111827] hover:bg-[#F4F6F9]'
            }`}
            title="Alejar mapa (-)"
            aria-label="Alejar mapa"
          >
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Botón Circular Flotante: Recentrar Ruta en Conductor / Centrar GPS en Pasajero */}
        {!isAdminMap && (
          <button
            type="button"
            id={isDriverMode ? 'btn-recenter-driver-route' : 'btn-center-gps'}
            onClick={isDriverMode ? handleRecenterFixedRoute : obtenerUbicacionReal}
            disabled={!isDriverMode && isLocatingUser}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer active:scale-90 border-2 backdrop-blur-md group ${
              isDriverMode
                ? isDark
                  ? 'bg-zinc-950/95 text-emerald-400 border-emerald-500/60 hover:bg-zinc-850'
                  : 'bg-white text-[#0052FF] border-[#0052FF] hover:bg-[#F4F6F9] shadow-md'
                : isLocatingUser
                ? 'bg-[#0052FF] text-white animate-pulse border-[#0052FF]'
                : isDark
                ? 'bg-zinc-950/95 text-emerald-400 border-emerald-500/60 hover:bg-zinc-850'
                : 'bg-white text-[#0052FF] border-[#0052FF] hover:bg-[#F4F6F9] shadow-md'
            }`}
            title={isDriverMode ? 'Enfocar ruta fija completa 🗺️' : 'Centrar en mi ubicación real (Punto A) 🎯'}
            aria-label={isDriverMode ? 'Enfocar ruta fija completa' : 'Centrar en mi ubicación real'}
          >
            {isDriverMode ? (
              <Navigation className="w-5 h-5 text-[#0052FF] group-hover:scale-110 transition-transform" />
            ) : isLocatingUser ? (
              <Crosshair className="w-6 h-6 animate-spin text-[#0052FF]" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Target className="w-6 h-6 stroke-[2.5] text-[#0052FF] group-hover:scale-110 transition-transform" />
                <span className="absolute w-2 h-2 rounded-full bg-[#0052FF] animate-ping opacity-75 pointer-events-none" />
              </div>
            )}
          </button>
        )}
      </div>

      {/* Botón Flotante Ultra-Compacto "Pedir carrera" en Móviles (Esquina Inferior Derecha) */}
      {!isAdminMap && !isDriverMode && (!tripStatus || tripStatus === 'idle') && (
        <button
          id="btn-floating-request-ride-mobile"
          type="button"
          onClick={() => {
            haptic.confirmTrip();
            if (onRequestRide) {
              onRequestRide(clientOfferedPrice ?? routeMetrics?.suggestedFare);
            }
          }}
          className="md:hidden pointer-events-auto flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer select-none"
          style={{
            position: 'absolute',
            bottom: '78px',
            right: '12px',
            left: 'auto',
            transform: 'none',
            zIndex: 1000,
            height: '28px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            backgroundColor: '#059669',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          }}
          title="Pedir carrera"
          aria-label="Pedir carrera"
        >
          <span>🚖 Pedir</span>
        </button>
      )}

      {/* TARJETA FLOTANTE INFERIOR CON DISTANCIA, TIEMPO, TARIFA Y SELECTOR DE RUTAS ALTERNATIVAS */}
      {!isAdminMap && !isDriverMode && routeMetrics && (() => {
        const isInterprovincialTrip = (parseFloat(routeMetrics.distanceKm) || 0) > 35 || routeMetrics.isInterprovincial || serviceType === 'ejecutivo_quito';
        const tarifaMinimaConfig = isInterprovincialTrip
          ? (serviceType === 'ejecutivo_quito' ? 25.00 : 15.00)
          : (systemTariffs?.rideMinimumFareUsd ?? 1.25);

        const tarifaSugerida = tarifaCalculada !== undefined ? tarifaCalculada : routeMetrics.suggestedFare;
        const isCarreraMinima = !isInterprovincialTrip && tarifaSugerida <= tarifaMinimaConfig;
        const discountMax = isInterprovincialTrip ? 10.00 : 0.25;
        const step = isInterprovincialTrip ? 1.00 : 0.25;

        const pisoPermitido = isCarreraMinima
          ? tarifaMinimaConfig
          : Math.max(tarifaMinimaConfig, Number((tarifaSugerida - discountMax).toFixed(2)));

        const currentOffer = ofertaUsuario !== undefined ? ofertaUsuario : (clientOfferedPrice ?? routeMetrics.suggestedFare);
        const isAtFloor = currentOffer <= pisoPermitido;

        const triggerMinNotice = () => {
          haptic.warning();
          setShowMinFareNotice(true);
          setTimeout(() => {
            setShowMinFareNotice(false);
          }, 3000);
        };

        const handleAdjustOffer = (delta: number) => {
          if (delta < 0 && isAtFloor) {
            triggerMinNotice();
            return;
          }
          const nextVal = delta < 0
            ? Math.max(pisoPermitido, Number((currentOffer + delta).toFixed(2)))
            : Number((currentOffer + delta).toFixed(2));
          haptic.tap();
          setClientOfferedPrice(nextVal);
          if (onUserOfferChange) onUserOfferChange(nextVal);
          if (onPriceChange) onPriceChange(nextVal);
        };

        const durationDisplay = routeMetrics.durationFormatted || `${routeMetrics.durationMin} min`;
        const originLabel = origin?.name || 'Origen';
        const destLabel = destination?.name || 'Destino';

        return (
          <div
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-sm pointer-events-auto"
          >
            {/* Aviso flotante discreto de carrera mínima / piso */}
            {showMinFareNotice && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] shadow-lg flex items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-200 border border-amber-300">
                {isInterprovincialTrip
                  ? `⚠️ Descuento máximo de $10.00 alcanzado (Piso: $${pisoPermitido.toFixed(2)}).`
                  : `⚠️ La carrera mínima es de $${tarifaMinimaConfig.toFixed(2)} y no admite descuentos.`}
              </div>
            )}

            {/* 1. MODO MÓVIL / ANDROID (<= 768px): BARRA HORIZONTAL DELGADA Y FLOTANTE CON FONDO BLANCO Y TEXTO OSCURO (#0F172A) */}
            <div className="md:hidden mobile-compact-route-card w-full py-1.5 px-3 rounded-2xl bg-white text-[#0F172A] border border-slate-300 shadow-2xl flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 select-none">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex-shrink-0">
                    {selectedRouteIndex === 0 ? '⚡ RUTA MÁS RÁPIDA' : `Ruta ${selectedRouteIndex + 1}/${availableRoutes.length}`}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-black text-[#0F172A] truncate">
                    <span>{routeMetrics.distanceKm} km</span>
                    <span className="text-slate-400">•</span>
                    <span>{durationDisplay}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleAdjustOffer(-step)}
                    className={`w-5 h-5 rounded-full font-bold flex items-center justify-center text-xs transition-transform shadow-xs cursor-pointer ${
                      isAtFloor
                        ? 'bg-slate-200 text-slate-400 opacity-60'
                        : 'bg-white hover:bg-slate-200 text-[#0F172A] active:scale-90'
                    }`}
                    title={isAtFloor ? `Piso mínimo: $${pisoPermitido.toFixed(2)}` : 'Disminuir'}
                  >
                    -
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase text-slate-500">Oferta:</span>
                    <span className="font-mono font-black text-xs text-[#0F172A]">
                      ${currentOffer.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdjustOffer(step)}
                    className="w-5 h-5 rounded-full bg-white hover:bg-slate-200 text-[#0F172A] font-bold flex items-center justify-center text-xs active:scale-90 transition-transform shadow-xs cursor-pointer"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Detección de trayecto origen ➔ destino */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 border-t border-slate-100 pt-1">
                <div className="truncate flex items-center gap-1">
                  <span>📍 {originLabel}</span>
                  <span>➔</span>
                  <span>🏁 {destLabel}</span>
                </div>
                <div className="flex-shrink-0 text-[10px] text-slate-500">
                  Sugerida: <strong className="text-slate-800">${tarifaSugerida.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* 2. MODO WEB / TABLET (> 768px): TARJETA ELEGANTE SIN DUPLICADOS */}
            <div className={`hidden md:flex desktop-full-route-card p-3.5 rounded-2xl shadow-2xl flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 border backdrop-blur-md ${
              isDark
                ? 'bg-zinc-950/92 border-zinc-800 text-white'
                : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-900/15'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider text-blue-500 flex items-center gap-1">
                    {isCalculatingRoute ? 'Calculando mejor ruta...' : (
                      selectedRouteIndex === 0
                        ? `⚡ RUTA MÁS RÁPIDA · ${routeMetrics.distanceKm} km · ${durationDisplay}`
                        : `Ruta Alternativa ${selectedRouteIndex + 1} de ${availableRoutes.length}`
                    )}
                  </span>
                  <div className={`flex items-center gap-2 text-sm font-black truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    <span>🛣️ {routeMetrics.distanceKm} km</span>
                    <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>•</span>
                    <span>⏱️ {durationDisplay}</span>
                  </div>
                  <div className={`text-[11px] font-medium truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    📍 {originLabel} ➔ 🏁 {destLabel}
                  </div>
                </div>

                {/* Si el panel lateral NO está visible, mostrar controles en el mapa. Si está visible, omitir duplicado para interfaz limpia */}
                {isSidePanelVisible === false ? (
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-xl border flex-shrink-0 ${
                      isDark ? 'bg-zinc-900/90 border-zinc-700/80' : 'bg-slate-100 border-slate-300'
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleAdjustOffer(-step)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-all cursor-pointer ${
                          isAtFloor
                            ? 'bg-zinc-850 text-zinc-600 opacity-50'
                            : isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-200 text-slate-800 shadow-sm border border-slate-200'
                        }`}
                        title={isAtFloor ? `Piso mínimo: $${pisoPermitido.toFixed(2)}` : `Disminuir oferta`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex flex-col items-center min-w-[55px]">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>TU OFERTA</span>
                        <span className="text-sm font-black text-emerald-500">
                          ${currentOffer.toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdjustOffer(step)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-all cursor-pointer ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-200 text-slate-800 shadow-sm border border-slate-200'
                        }`}
                        title={`Aumentar oferta`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={`flex flex-col items-end border-l pl-2 flex-shrink-0 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                      <span className={`text-[9px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Sugerida</span>
                      <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        ${tarifaSugerida.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`flex flex-col items-end border-l pl-3 flex-shrink-0 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tarifa</span>
                    <span className="text-sm font-black text-emerald-400">
                      ${currentOffer.toFixed(2)}
                    </span>
                    <span className={`text-[9px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Sug: ${tarifaSugerida.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Selector interactivo de rutas alternativas */}
              {availableRoutes.length > 1 && (
                <div className={`flex items-center gap-1.5 pt-2 border-t ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`}>
                  <span className={`text-[10px] font-medium mr-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Rutas:</span>
                  {availableRoutes.map((r, idx) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        setSelectedRouteIndex(idx);
                        routeCoordsRef.current = r.coordinates;
                        setRouteMetrics({
                          distanceKm: r.distanceKm,
                          durationMin: r.durationMin,
                          durationFormatted: r.durationFormatted,
                          suggestedFare: r.suggestedFare,
                          isInterprovincial: r.isInterprovincial,
                        });
                        setClientOfferedPrice(r.suggestedFare);
                        if (onRouteCalculatedRef.current) {
                          onRouteCalculatedRef.current(r.suggestedFare, parseFloat(r.distanceKm), r.durationMin, origin?.name, destination?.name);
                        }
                        if (onSuggestedFareChangeRef.current) {
                          onSuggestedFareChangeRef.current(r.suggestedFare, parseFloat(r.distanceKm), r.durationMin);
                        }
                        if (onPriceChangeRef.current) {
                          onPriceChangeRef.current(r.suggestedFare);
                        }
                        if (onUserOfferChangeRef.current) {
                          onUserOfferChangeRef.current(r.suggestedFare);
                        }

                        const map = mapInstanceRef.current;
                        if (!map || !(map as any)._panes) return;

                        // Redibujar con el nuevo índice activo
                        routePolylinesRef.current.forEach((p) => {
                          try { p.remove(); } catch {}
                        });
                        routePolylinesRef.current = [];

                        availableRoutes.forEach((route, i) => {
                          if (i !== idx) {
                            const altPoly = L.polyline(route.coordinates, {
                              color: '#94A3B8',
                              weight: 3,
                              opacity: 0.70,
                              lineCap: 'round',
                              lineJoin: 'round',
                            }).addTo(map);

                            altPoly.on('click', (e) => {
                              L.DomEvent.stopPropagation(e);
                              haptic.tap();
                              setSelectedRouteIndex(i);
                              routeCoordsRef.current = route.coordinates;
                              setRouteMetrics({
                                distanceKm: route.distanceKm,
                                durationMin: route.durationMin,
                                durationFormatted: route.durationFormatted,
                                suggestedFare: route.suggestedFare,
                                isInterprovincial: route.isInterprovincial,
                              });
                              setClientOfferedPrice(route.suggestedFare);
                              if (onRouteCalculatedRef.current) {
                                onRouteCalculatedRef.current(route.suggestedFare, parseFloat(route.distanceKm), route.durationMin, origin?.name, destination?.name);
                              }
                              if (onSuggestedFareChangeRef.current) {
                                onSuggestedFareChangeRef.current(route.suggestedFare, parseFloat(route.distanceKm), route.durationMin);
                              }
                              if (onPriceChangeRef.current) {
                                onPriceChangeRef.current(route.suggestedFare);
                              }
                              if (onUserOfferChangeRef.current) {
                                onUserOfferChangeRef.current(route.suggestedFare);
                              }
                            });

                            routePolylinesRef.current.push(altPoly);
                          }
                        });

                        const activePoly = L.polyline(r.coordinates, {
                          color: '#0052FF',
                          weight: 6,
                          opacity: 0.95,
                          lineCap: 'round',
                          lineJoin: 'round',
                        }).addTo(map);

                        activePoly.bringToFront();
                        activePolylineRef.current = activePoly;
                        routePolylinesRef.current.push(activePoly);

                        try {
                          map.fitBounds(activePoly.getBounds(), {
                            padding: [60, 60],
                            animate: true,
                            duration: 0.8,
                          });
                        } catch {}
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        selectedRouteIndex === idx
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                          : isDark
                          ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span>{idx === 0 ? '⚡ Más Rápida' : `Alt ${idx}`}</span>
                      <span className="opacity-80">({r.durationFormatted || r.durationMin + 'm'})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {/* Botón flotante único de asistencia: Recentrar ruta (Modo Conductor) */}
      {isDriverMode && (
        <button
          type="button"
          id="btn-driver-recenter-route"
          onClick={() => {
            haptic.tap();
            if (mapInstanceRef.current && activePolylineRef.current) {
              try {
                mapInstanceRef.current.fitBounds(activePolylineRef.current.getBounds(), {
                  padding: [60, 60],
                  animate: true,
                  duration: 0.8,
                });
              } catch {}
            }
          }}
          className="absolute top-3 right-3 z-[1000] px-3 py-2 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 font-black text-xs shadow-xl flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          title="Recentrar ruta GPS"
        >
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span>Recentrar Ruta</span>
        </button>
      )}

      {/* Indicador de Capa Exclusiva en Relieve Andino */}
      <div
        className={`absolute z-[1000] flex items-center gap-1.5 pointer-events-none transition-all ${
          isDriverMode ? 'top-14 right-3' : 'top-3 right-3'
        }`}
      >
        <div
          className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl border backdrop-blur-md font-bold text-xs ${
            isDark
              ? 'bg-zinc-900/90 text-zinc-100 border-zinc-700/80 shadow-black/40'
              : 'bg-white/95 text-slate-800 border-slate-300 shadow-slate-900/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500">
            Relieve Andino 🏔️
          </span>
        </div>
      </div>
    </div>
  );
};

// Comparador estricto para evitar redibujados innecesarios del mapa durante interacciones del usuario en paneles
function areMapPropsEqual(prev: MapComponentProps, next: MapComponentProps): boolean {
  if (prev.origin?.lat !== next.origin?.lat || prev.origin?.lng !== next.origin?.lng || prev.origin?.name !== next.origin?.name) return false;
  if (prev.destination?.lat !== next.destination?.lat || prev.destination?.lng !== next.destination?.lng || prev.destination?.name !== next.destination?.name) return false;
  if ((prev.intermediateStops?.length || 0) !== (next.intermediateStops?.length || 0)) return false;
  if (
    prev.activeDriver?.id !== next.activeDriver?.id ||
    prev.activeDriver?.currentCoords?.lat !== next.activeDriver?.currentCoords?.lat ||
    prev.activeDriver?.currentCoords?.lng !== next.activeDriver?.currentCoords?.lng
  ) return false;
  if ((prev.drivers?.length || 0) !== (next.drivers?.length || 0)) return false;
  if (prev.tripStatus !== next.tripStatus) return false;
  if (prev.selectionMode !== next.selectionMode) return false;
  if (prev.serviceType !== next.serviceType) return false;
  if (prev.tarifaCalculada !== next.tarifaCalculada) return false;
  if (prev.ofertaUsuario !== next.ofertaUsuario) return false;
  if (prev.isSidePanelVisible !== next.isSidePanelVisible) return false;
  if (prev.isDriverMode !== next.isDriverMode) return false;
  if (prev.isAdminMap !== next.isAdminMap) return false;
  if (prev.isDarkMode !== next.isDarkMode) return false;
  if (prev.effectiveTheme !== next.effectiveTheme) return false;
  return true;
}

export const MapComponent = React.memo(AndesMoviMap, areMapPropsEqual);
export default MapComponent;

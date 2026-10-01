import { Coordinates, SystemTariffs, ServiceType } from '../types';

/**
 * Calculates distance in kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal point
}

/**
 * Estimates duration in minutes based on distance and city traffic speed (~22 km/h average)
 */
export function estimateDurationMinutes(distanceKm: number): number {
  const avgSpeedKmH = 22;
  const durationHours = distanceKm / avgSpeedKmH;
  const minutes = Math.ceil(durationHours * 60) + 3; // +3 min buffer
  return Math.max(5, minutes);
}

/**
 * Regla Conductor Mini (Ecuador):
 * Bajar 50 centavos ($0.50 USD) por carrera larga (> 5 km)
 * Bajar 25 centavos ($0.25 USD) por carrera corta (<= 5 km)
 */
export function getMiniDriverDiscount(distanceKm: number): {
  discount: number;
  tripType: 'corta' | 'larga';
  label: string;
} {
  const isLongTrip = distanceKm > 5;
  const discount = isLongTrip ? 0.50 : 0.25;
  return {
    discount,
    tripType: isLongTrip ? 'larga' : 'corta',
    label: isLongTrip ? 'Carrera larga (-$0.50 USD)' : 'Carrera corta (-$0.25 USD)',
  };
}

/**
 * Regla Tarifaria Oficial AndesMovi Ecuador:
 * El valor de $1.25 USD cubre hasta 2.7 km de recorrido.
 * A partir de 2.7 km, se suma la tarifa por kilómetro adicional ($0.35 USD/km estándar).
 */
export const OFFICIAL_TARIFF_CONFIG = {
  baseFareUsd: 1.25,
  baseCoverageKm: 2.7,
  perExtraKmUsd: 0.35,
};

export interface OfficialTariffBreakdown {
  baseFareUsd: number;
  baseCoverageKm: number;
  distanceKm: number;
  isWithinBaseCoverage: boolean;
  excessKm: number;
  perExtraKmUsd: number;
  excessCostUsd: number;
  totalFareUsd: number;
  summaryLabel: string;
}

export function getOfficialTariffBreakdown(
  distanceKm: number,
  serviceType: ServiceType | 'viaje' | 'domicilio' | 'encomienda' | 'ejecutivo_quito' = 'viaje',
  vehicleType: 'auto' | 'moto' | 'confort' | 'mini' | 'camioneta' = 'auto',
  customTariffs?: Partial<SystemTariffs>,
  destinationName?: string
): OfficialTariffBreakdown {
  const isNight = isEcuadorNightTime();
  // Producción Tulcán: Diurna $1.25 (hasta 2.7km), Nocturna $1.50 (hasta 2.7km)
  let standardBase = isNight ? 1.50 : 1.25;
  let baseFare = customTariffs?.rideBaseFareUsd ?? standardBase;
  const baseCoverageKm = customTariffs?.rideBaseCoverageKm ?? OFFICIAL_TARIFF_CONFIG.baseCoverageKm; // 2.7 km
  let perExtraKm = customTariffs?.rideExtraPerKmUsd ?? OFFICIAL_TARIFF_CONFIG.perExtraKmUsd; // $0.35

  if (serviceType === 'ejecutivo_quito') {
    const dest = (destinationName || '').toLowerCase();
    if (dest.includes('quitumbe')) {
      baseFare = 30.00;
    } else if (dest.includes('tababela') || dest.includes('aeropuerto')) {
      baseFare = 30.00;
    } else {
      // Parque La Carolina / Quito Norte
      baseFare = 25.00;
    }
    perExtraKm = 0.0;
  } else if (serviceType === 'domicilio') {
    baseFare = customTariffs?.deliveryBaseFareUsd ?? 1.25;
    perExtraKm = customTariffs?.deliveryPerKmUsd ?? 0.35;
  } else if (serviceType === 'encomienda') {
    baseFare = customTariffs?.parcelBaseFareUsd ?? 1.50;
    perExtraKm = customTariffs?.parcelPerKmUsd ?? 0.40;
  }

  if (serviceType !== 'ejecutivo_quito') {
    if (vehicleType === 'moto') {
      baseFare = Math.max(0.75, baseFare - 0.25);
      perExtraKm = Math.max(0.2, perExtraKm - 0.1);
    } else if (vehicleType === 'confort') {
      baseFare = baseFare + (customTariffs?.confortExtraFeeUsd ?? 0.35);
      perExtraKm = perExtraKm + 0.1;
    } else if (vehicleType === 'camioneta') {
      baseFare = baseFare + 0.5;
      perExtraKm = perExtraKm + 0.15;
    }
  }

  const isWithinBaseCoverage = distanceKm <= baseCoverageKm;
  const excessKm = isWithinBaseCoverage ? 0 : Number((distanceKm - baseCoverageKm).toFixed(2));
  const excessCostUsd = serviceType === 'ejecutivo_quito' ? 0 : Number((excessKm * perExtraKm).toFixed(2));
  let totalFare = baseFare + excessCostUsd;

  // Redondear a 5 centavos
  const roundedTotal = Math.round(totalFare * 20) / 20;
  const finalTotal = serviceType === 'ejecutivo_quito' ? baseFare : Math.max(baseFare, Number(roundedTotal.toFixed(2)));

  return {
    baseFareUsd: baseFare,
    baseCoverageKm,
    distanceKm: Number(distanceKm.toFixed(2)),
    isWithinBaseCoverage,
    excessKm,
    perExtraKmUsd: perExtraKm,
    excessCostUsd,
    totalFareUsd: finalTotal,
    summaryLabel: serviceType === 'ejecutivo_quito'
      ? `Tarifa Fija Cerrada Ejecutivo Quito: $${baseFare.toFixed(2)} USD`
      : isWithinBaseCoverage
      ? `$${baseFare.toFixed(2)} (Mínima ${isNight ? 'Nocturna $1.50' : 'Diurna $1.25'} hasta ${baseCoverageKm} km)`
      : `$${baseFare.toFixed(2)} base (${baseCoverageKm} km) + $${excessCostUsd.toFixed(2)} (${excessKm} km extra)`,
  };
}

/**
 * Calculates fair suggested price in USD (Ecuador official currency)
 * Rule: $1.25 USD covers up to 2.7 km (or admin custom tariff)
 */
export function calculateSuggestedPrice(
  distanceKm: number,
  serviceType: ServiceType | 'viaje' | 'domicilio' | 'encomienda' | 'ejecutivo_quito',
  vehicleType: 'auto' | 'moto' | 'confort' | 'mini' | 'camioneta' = 'auto',
  customTariffs?: Partial<SystemTariffs>
): number {
  if (distanceKm > 35 || serviceType === 'ejecutivo_quito') {
    if (serviceType === 'ejecutivo_quito') return 25.00;
    const perKmInter = customTariffs?.parcelPerKmUsd ?? 0.35;
    return Number(Math.max(15.00, Math.round(distanceKm * perKmInter)).toFixed(2));
  }
  const breakdown = getOfficialTariffBreakdown(distanceKm, serviceType, vehicleType, customTariffs);
  return Number(breakdown.totalFareUsd.toFixed(2));
}

/**
 * Formatea de forma legible la duración de un viaje en horas y minutos
 * Ej. "4 h 35 min" para trayectos largos o "12 min" para viajes urbanos
 */
export function formatTripDuration(duracionSegundosOrMinutes: number, isSeconds: boolean = false): {
  horas: number;
  minutos: number;
  texto: string;
} {
  const duracionSegundos = isSeconds ? duracionSegundosOrMinutes : duracionSegundosOrMinutes * 60;
  const horas = Math.floor(duracionSegundos / 3600);
  const minutos = Math.round((duracionSegundos % 3600) / 60);

  if (horas >= 1) {
    const texto = minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`;
    return { horas, minutos, texto };
  }
  const minFinal = Math.max(1, minutos || Math.round(duracionSegundos / 60));
  return { horas: 0, minutos: minFinal, texto: `${minFinal} min` };
}

/**
 * Technical specification breakdown of the official ANT (Agencia Nacional de Tránsito del Ecuador) taxi fare.
 * Regulated by Resolución Oficial ANT N° 007-DIR-2014-ANT (Tarifas Oficiales para Taxi Convencional y Ejecutivo).
 */
export interface AntTaxiFareDetails {
  distanceKm: number;
  isNight: boolean;
  scheduleLabel: string;
  arranque: number;
  kmRate: number;
  distanceCharge: number;
  estimatedMinutes: number;
  waitMinutes: number;
  waitRate: number;
  waitCharge: number;
  subtotal: number;
  minimumFare: number;
  finalFare: number;
  appliedMinimum: boolean;
  resolution: string;
}

/**
 * Returns true if current Ecuador time (UTC-5) is in the night fare window (19:00 to 06:00)
 */
export function isEcuadorNightTime(date: Date = new Date()): boolean {
  const utcHours = date.getUTCHours();
  const ecuadorHour = (utcHours - 5 + 24) % 24;
  return ecuadorHour < 6 || ecuadorHour >= 19;
}

/**
 * Calculates taxi fare strictly based on official ANT (Agencia Nacional de Tránsito del Ecuador) regulations.
 *
 * Official parameters (Resolución ANT N° 007-DIR-2014-ANT):
 * - Horario Diurno (06:00 a 19:00):
 *     Arranque: $0.40 USD (Tarifa de arranque 40 centavos)
 *     Km recorrido: $0.40 USD/km
 *     Minuto de espera (< 10 km/h o semáforos): $0.10 USD/min
 *     Carrera mínima legal: $1.45 USD
 * - Horario Nocturno (19:00 a 06:00, domingos y feriados):
 *     Arranque: $0.55 USD
 *     Km recorrido: $0.45 USD/km
 *     Minuto de espera: $0.12 USD/min
 *     Carrera mínima legal: $1.75 USD
 */
export function calculateAntTaxiFare(
  distanceKm: number,
  options?: {
    isNight?: boolean;
    estimatedMinutes?: number;
    waitMinutes?: number;
    customArranque?: number;
  }
): AntTaxiFareDetails {
  const isNight = options?.isNight !== undefined ? options.isNight : isEcuadorNightTime();
  const estimatedMinutes = options?.estimatedMinutes ?? estimateDurationMinutes(distanceKm);

  // In standard urban traffic, waiting/slow speed time represents ~20% of trip duration
  const waitMinutes =
    options?.waitMinutes !== undefined
      ? options.waitMinutes
      : Math.max(1, Math.round(estimatedMinutes * 0.2));

  // Tarifa de arranque reglamentada en 40 centavos ($0.40 USD) diurno
  const arranque =
    options?.customArranque !== undefined
      ? options.customArranque
      : isNight
      ? 0.55
      : 0.40;
  const kmRate = isNight ? 0.45 : 0.4;
  const waitRate = isNight ? 0.12 : 0.1;
  const minimumFare = isNight ? 1.75 : 1.45;

  const distanceCharge = Number((distanceKm * kmRate).toFixed(2));
  const waitCharge = Number((waitMinutes * waitRate).toFixed(2));
  const subtotal = Number((arranque + distanceCharge + waitCharge).toFixed(2));

  const finalFare = Math.max(minimumFare, subtotal);
  const appliedMinimum = subtotal < minimumFare;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    isNight,
    scheduleLabel: isNight
      ? 'Tarifa Nocturna / Feriados (19:00 a 06:00)'
      : 'Tarifa Diurna Ordinaria (06:00 a 19:00)',
    arranque,
    kmRate,
    distanceCharge,
    estimatedMinutes,
    waitMinutes,
    waitRate,
    waitCharge,
    subtotal,
    minimumFare,
    finalFare: Number(finalFare.toFixed(2)),
    appliedMinimum,
    resolution: 'Resolución ANT N° 007-DIR-2014-ANT (Taxímetro Oficial Ecuador)',
  };
}

/**
 * Formats a currency amount into United States Dollars (USD - $) as used in Ecuador
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Computes bearing (angle in degrees 0-360) from coord1 to coord2 for vehicle orientation
 */
export function calculateBearing(coord1: Coordinates, coord2: Coordinates): number {
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;
  return Math.round(brng);
}

/**
 * Interpolates a realistic polyline path between origin and destination with natural city doglegs
 */
export function generateRoutePoints(origin: Coordinates, destination: Coordinates, steps = 30): Coordinates[] {
  const points: Coordinates[] = [];
  
  // Midpoint with a realistic street-grid deviation
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  
  // Small perpendicular offset to simulate real street turns instead of a straight line
  const dLat = destination.lat - origin.lat;
  const dLng = destination.lng - origin.lng;
  const perpLat = -dLng * 0.15;
  const perpLng = dLat * 0.15;

  const waypoints = [
    origin,
    { lat: origin.lat + dLat * 0.25 + perpLat, lng: origin.lng + dLng * 0.25 + perpLng },
    { lat: midLat + perpLat * 0.5, lng: midLng + perpLng * 0.5 },
    { lat: origin.lat + dLat * 0.75 - perpLat * 0.4, lng: origin.lng + dLng * 0.75 - perpLng * 0.4 },
    destination,
  ];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const segmentSteps = Math.floor(steps / (waypoints.length - 1));
    
    for (let s = 0; s <= segmentSteps; s++) {
      const t = s / segmentSteps;
      points.push({
        lat: p1.lat + (p2.lat - p1.lat) * t,
        lng: p1.lng + (p2.lng - p1.lng) * t,
      });
    }
  }

  points.push(destination);
  return points;
}

/**
 * Asynchronously fetches road-following driving polyline points from OSRM,
 * with instantaneous graceful fallback to generateRoutePoints if network request fails or times out.
 */
export async function fetchRoadRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<{ points: Coordinates[]; distanceKm: number; durationMin: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0 && data.routes[0].geometry?.coordinates) {
        const coords: [number, number][] = data.routes[0].geometry.coordinates;
        const points = coords.map(([lng, lat]) => ({ lat, lng }));
        const distanceKm = Number((data.routes[0].distance / 1000).toFixed(1));
        const durationMin = Math.max(3, Math.round(data.routes[0].duration / 60));
        return { points, distanceKm, durationMin };
      }
    }
  } catch {
    // Network or timeout failure - gracefully fall through to synthetic road generator
  }

  // Realistic synthetic street points
  const fallbackPoints = generateRoutePoints(origin, destination, 35);
  const dist = calculateDistanceKm(origin, destination);
  return {
    points: fallbackPoints,
    distanceKm: dist,
    durationMin: Math.max(3, Math.round((dist / 35) * 60)),
  };
}

/**
 * Linear interpolation helper
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Spherical / shortest-path angle interpolation in degrees (0-360)
 * Prevents 360-degree abrupt spinning when heading crosses north (0 / 360)
 */
export function lerpAngle(start: number, end: number, t: number): number {
  let diff = (end - start) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (start + diff * t + 360) % 360;
}

/**
 * Quadratic easing for organic vehicle acceleration / deceleration
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export interface TollBooth {
  id: string;
  name: string;
  location: string;
  feeUsd: number;
}

export const COMMON_TOLLS: TollBooth[] = [
  // PICHINCHA & SIERRA NORTE
  { id: 'toll-ruminahui', name: 'Peaje Autopista Gral. Rumiñahui', location: 'Los Chillos / Sangolquí / Conocoto', feeUsd: 0.40 },
  { id: 'toll-intervalles', name: 'Peaje Intervalles / Ruta Viva', location: 'Cumbayá - Tumbaco - San Rafael', feeUsd: 0.60 },
  { id: 'toll-guayasamin', name: 'Peaje Túnel Guayasamín', location: 'Quito - Plaza Argentina - Cumbayá', feeUsd: 0.40 },
  { id: 'toll-oyacoto', name: 'Peaje Oyacoto (Panamericana Norte)', location: 'Calderón - Guayllabamba - Tabacundo', feeUsd: 1.00 },
  { id: 'toll-cochasqui', name: 'Peaje Cochasquí / Tabacundo', location: 'Cayambe - Pedro Moncayo', feeUsd: 1.00 },
  { id: 'toll-ambuqui', name: 'Peaje Ambuquí', location: 'Imbabura - Ibarra - Tulcán', feeUsd: 1.00 },
  { id: 'toll-sangabriel', name: 'Peaje San Gabriel', location: 'Carchi - San Gabriel - Bolívar', feeUsd: 1.00 },

  // SIERRA CENTRO & SUR
  { id: 'toll-machachi', name: 'Peaje Machachi / Alóag', location: 'Mejía - Panamericana Sur', feeUsd: 1.00 },
  { id: 'toll-aloag-stodomingo', name: 'Peaje Vía Alóag - Santo Domingo', location: 'Pichincha - Santo Domingo', feeUsd: 1.00 },
  { id: 'toll-panzaleo', name: 'Peaje Panzaleo / Salcedo', location: 'Cotopaxi - Latacunga - Ambato', feeUsd: 1.00 },
  { id: 'toll-sanandres', name: 'Peaje San Andrés', location: 'Riobamba - Chimborazo - Tungurahua', feeUsd: 1.00 },
  { id: 'toll-chaquilcay', name: 'Peaje Chaquilcay / Gualaceo', location: 'Azuay - Cuenca - Paute', feeUsd: 1.00 },

  // COSTA ECUATORIANA
  { id: 'toll-chongon', name: 'Peaje Chongón (Vía a la Costa)', location: 'Guayaquil - Chongón - Salinas / Santa Elena', feeUsd: 1.00 },
  { id: 'toll-yaguachi', name: 'Peaje Yaguachi', location: 'Guayas - Durán - Milagro - Yaguachi', feeUsd: 1.00 },
  { id: 'toll-boliche', name: 'Peaje Boliche', location: 'Guayas - El Triunfo - Bucay', feeUsd: 1.00 },
  { id: 'toll-naranjal', name: 'Peaje Naranjal', location: 'Guayas - Naranjal - Machala (El Oro)', feeUsd: 1.00 },
  { id: 'toll-samborondon', name: 'Peaje Samborondón / Buijo', location: 'Samborondón - Guayaquil Norte', feeUsd: 1.00 },
  { id: 'toll-luzdeamerica', name: 'Peaje Luz de América', location: 'Santo Domingo - Quevedo - Los Ríos', feeUsd: 1.00 },
  { id: 'toll-elcambio', name: 'Peaje El Cambio / Machala', location: 'El Oro - Machala - Pasaje', feeUsd: 1.00 },

  // AMAZONÍA & CONEXIONES NACIONALES
  { id: 'toll-papallacta', name: 'Peaje Papallacta / Baeza', location: 'Napo - Baeza - Tena (Amazonía)', feeUsd: 1.00 },
  { id: 'toll-puyo', name: 'Peaje Puyo / Baños', location: 'Pastaza - Puyo - Tungurahua', feeUsd: 1.00 },
];

/**
 * Auto-detects if a route passes through known Ecuador toll booths across all 24 provinces
 */
export function detectRouteTolls(origin: Coordinates, destination: Coordinates, distanceKm: number): { hasTolls: boolean; tollFeeUsd: number; tollName?: string } {
  const text = `${origin.name || ''} ${origin.address || ''} ${destination.name || ''} ${destination.address || ''}`.toLowerCase();
  
  // 1. Autopista General Rumiñahui (Los Chillos / Sangolquí / Conocoto / San Rafael)
  if (text.includes('sangolqui') || text.includes('los chillos') || text.includes('rumiñahui') || text.includes('san rafael') || text.includes('triángulo') || text.includes('conocoto') || text.includes('fajardo')) {
    return { hasTolls: true, tollFeeUsd: 0.40, tollName: 'Peaje Autopista Gral. Rumiñahui ($0.40)' };
  }

  // 2. Intervalles / Ruta Viva (Cumbayá / Tumbaco / Aeropuerto Tababela / Pifo / Yaruquí)
  if (text.includes('cumbayá') || text.includes('tumbaco') || text.includes('intervalles') || text.includes('tababela') || text.includes('aeropuerto') || text.includes('pifo') || text.includes('yaruquí')) {
    return { hasTolls: true, tollFeeUsd: 0.60, tollName: 'Peaje Intervalles / Ruta Viva ($0.60)' };
  }

  // 3. Panamericana Norte (Calderón / Oyacoto / Guayllabamba / Tabacundo / Cayambe / Otavalo / Ibarra)
  if (text.includes('calderón') || text.includes('guayllabamba') || text.includes('cayambe') || text.includes('oyacoto') || text.includes('tabacundo') || text.includes('otavalo') || text.includes('ibarra') || text.includes('carchi') || text.includes('tulcán') || text.includes('san gabriel')) {
    return { hasTolls: true, tollFeeUsd: 1.00, tollName: 'Peaje Oyacoto / Panamericana Norte ($1.00)' };
  }

  // 4. Panamericana Sur & Alóag (Machachi / Alóag / Tambillo / Latacunga / Salcedo / Ambato / Riobamba)
  if (text.includes('machachi') || text.includes('alóag') || text.includes('latacunga') || text.includes('salcedo') || text.includes('tambillo') || text.includes('ambato') || text.includes('riobamba') || text.includes('cotopaxi') || text.includes('chimborazo') || text.includes('cuenca') || text.includes('azuay')) {
    return { hasTolls: true, tollFeeUsd: 1.00, tollName: 'Peaje Machachi / Panamericana Sur ($1.00)' };
  }

  // 5. Túnel Guayasamín (Quito Plaza Argentina - Cumbayá)
  if (text.includes('túnel') || text.includes('guayasamín') || text.includes('gonzález suárez') || text.includes('plaza argentina')) {
    return { hasTolls: true, tollFeeUsd: 0.40, tollName: 'Peaje Túnel Guayasamín ($0.40)' };
  }

  // 6. Guayas / Costa (Chongón / Vía a la Costa / Salinas / Durán / Yaguachi / Samborondón / Milagro / Naranjal / Machala)
  if (text.includes('chongón') || text.includes('vía a la costa') || text.includes('salinas') || text.includes('santa elena') || text.includes('durán') || text.includes('yaguachi') || text.includes('samborondón') || text.includes('milagro') || text.includes('naranjal') || text.includes('machala') || text.includes('el oro')) {
    return { hasTolls: true, tollFeeUsd: 1.00, tollName: 'Peaje Vía a la Costa / Guayas ($1.00)' };
  }

  // 7. Santo Domingo / Los Ríos / Manabí (Santo Domingo, Luz de América, Quevedo, Babahoyo, Manta)
  if (text.includes('santo domingo') || text.includes('luz de américa') || text.includes('quevedo') || text.includes('babahoyo') || text.includes('los ríos') || text.includes('manta') || text.includes('portoviejo')) {
    return { hasTolls: true, tollFeeUsd: 1.00, tollName: 'Peaje Santo Domingo / Vía a la Costa ($1.00)' };
  }

  // 8. Amazonía (Papallacta, Baeza, Tena, Puyo, Baños, Macas)
  if (text.includes('papallacta') || text.includes('baeza') || text.includes('tena') || text.includes('puyo') || text.includes('baños') || text.includes('napo') || text.includes('pastaza')) {
    return { hasTolls: true, tollFeeUsd: 1.00, tollName: 'Peaje Troncal Amazónica / Papallacta ($1.00)' };
  }

  // 9. Detección por distancia nacional (Rutas intercantonales mayores a 10 km)
  if (distanceKm > 10) {
    return { hasTolls: true, tollFeeUsd: 1.00, tollName: 'Peaje en Vía Nacional Ecuador ($1.00)' };
  }

  return { hasTolls: false, tollFeeUsd: 0, tollName: undefined };
}

export interface RouteOption {
  id: 'fastest' | 'shortest' | 'eco';
  title: string;
  badge: string;
  isBest: boolean;
  distanceKm: number;
  durationMin: number;
  trafficStatus: 'fluido' | 'moderado' | 'denso';
  trafficDelayMin: number;
  hasTolls: boolean;
  tollFeeUsd: number;
  savingsLabel: string;
  points: Coordinates[];
  description: string;
  highlights: string[];
}

/**
 * Calculates and analyzes alternative routes between origin and destination to identify the best route (Mejor Ruta)
 */
export async function getRouteAlternatives(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteOption[]> {
  const baseRoute = await fetchRoadRoute(origin, destination);
  const baseKm = baseRoute.distanceKm;
  const baseMin = baseRoute.durationMin;

  const tollInfo = detectRouteTolls(origin, destination, baseKm);

  // 1. Ruta Principal / Más Rápida (Óptima AndesMovi)
  const fastest: RouteOption = {
    id: 'fastest',
    title: 'Ruta Óptima Principal (Más Rápida)',
    badge: 'MEJOR RUTA SUGERIDA',
    isBest: true,
    distanceKm: baseKm,
    durationMin: baseMin,
    trafficStatus: 'fluido',
    trafficDelayMin: 0,
    hasTolls: tollInfo.hasTolls,
    tollFeeUsd: tollInfo.tollFeeUsd,
    savingsLabel: tollInfo.hasTolls ? `Incluye ${tollInfo.tollName}` : 'Tiempo mínimo estimado',
    points: baseRoute.points,
    description: 'Vías principales y avenidas de rápido flujo con semaforización coordinada.',
    highlights: [
      'Tráfico fluido',
      tollInfo.hasTolls ? `Incluye ${tollInfo.tollName}` : 'Sin peajes',
      'Avenidas principales',
      'GPS Calibrado',
    ],
  };

  // 2. Ruta Más Corta (Ahorro en kilometraje)
  const shortestKm = Number(Math.max(1.0, baseKm * 0.88).toFixed(1));
  const shortestMin = Math.round(baseMin * 1.12);
  const shortestPoints = generateRoutePoints(origin, destination, 32);
  const shortest: RouteOption = {
    id: 'shortest',
    title: 'Ruta Directa (Ahorro Distancia)',
    badge: 'MENOR KILOMETRAJE',
    isBest: false,
    distanceKm: shortestKm,
    durationMin: shortestMin,
    trafficStatus: 'moderado',
    trafficDelayMin: 2,
    hasTolls: false,
    tollFeeUsd: 0,
    savingsLabel: `Ahorra ${(baseKm - shortestKm).toFixed(1)} km`,
    points: shortestPoints,
    description: 'Recorrido directo por vías secundarias con atajos urbanos.',
    highlights: ['Atajo por calles secundarias', 'Sin peajes', 'Menor kilometraje'],
  };

  // 3. Ruta Ecológica / Sin Congestión
  const ecoKm = Number((baseKm * 1.06).toFixed(1));
  const ecoMin = Math.round(baseMin * 1.04);
  const ecoPoints = generateRoutePoints(origin, destination, 38);
  const eco: RouteOption = {
    id: 'eco',
    title: 'Ruta Perimetral Eco (Fluida)',
    badge: 'SIN FLOTANTE URBANO',
    isBest: false,
    distanceKm: ecoKm,
    durationMin: ecoMin,
    trafficStatus: 'fluido',
    trafficDelayMin: 0,
    hasTolls: tollInfo.hasTolls,
    tollFeeUsd: tollInfo.tollFeeUsd,
    savingsLabel: 'Menos frenadas y arranques',
    points: ecoPoints,
    description: 'Ruta bordeando centros de tráfico denso. Manejo suave y constante.',
    highlights: [
      'Ecológica',
      'Evita embotellamientos',
      tollInfo.hasTolls ? `Incluye ${tollInfo.tollName}` : 'Sin peajes',
      'Apta para motos y autos',
    ],
  };

  return [fastest, shortest, eco];
}

/**
 * ============================================================================
 * ANDESMOVI - CÁLCULO AUTOMÁTICO DE TARIFAS Y HORARIOS VIGENTES
 * (Diurna / Nocturna / Feriados según especificación oficial)
 * ============================================================================
 */

export function verificarSiEsFeriado(date: Date = new Date()): boolean {
  const mes = date.getMonth() + 1; // 1-12
  const dia = date.getDate();
  const diaSemana = date.getDay(); // 0 = Domingo

  const feriadosFijos = [
    { mes: 1, dia: 1 },   // Año Nuevo
    { mes: 5, dia: 1 },   // Día del Trabajo
    { mes: 5, dia: 24 },  // Batalla de Pichincha
    { mes: 8, dia: 10 },  // Primer Grito de Independencia
    { mes: 10, dia: 9 },  // Independencia de Guayaquil
    { mes: 11, dia: 2 },  // Día de los Difuntos
    { mes: 11, dia: 3 },  // Independencia de Cuenca
    { mes: 12, dia: 25 }, // Navidad
  ];

  for (const f of feriadosFijos) {
    if (f.mes === mes && f.dia === dia) return true;
  }

  // Domingos aplican tarifa nocturna / feriado 24 horas
  if (diaSemana === 0) return true;

  return false;
}

export interface DetalleTarifaOficial {
  tarifaCalculada: number;
  tarifaMinima: number;
  esDiurno: boolean;
  esFeriado: boolean;
  arranque: number;
  valorKm: number;
  valorMin: number;
  distanciaKm: number;
  tiempoMin: number;
  etiquetaHorario: string;
}

export function calcularTarifaVigenteAndesMovi(
  distanceKm: number,
  tiempoMin: number = 10,
  fecha: Date = new Date()
): DetalleTarifaOficial {
  const hora = fecha.getHours();
  const minutos = fecha.getMinutes();
  const horaDecimal = hora + (minutos / 60);

  const esFeriado = verificarSiEsFeriado(fecha);
  const esDiurno = !esFeriado && (horaDecimal >= 6.0167 && horaDecimal < 19.0); // 06:01 a 18:59

  const tarifaMinima = esDiurno ? 1.25 : 1.50;
  const valorKm = esDiurno ? 0.34 : 0.44;
  const valorMin = esDiurno ? 0.07 : 0.08;
  const arranque = 0.36;

  let tarifaCalculada = 0;
  if (distanceKm <= 2.7) {
    tarifaCalculada = tarifaMinima;
  } else {
    const kmExtra = Math.max(0, distanceKm - 2.7);
    tarifaCalculada = tarifaMinima + (kmExtra * valorKm) + (tiempoMin * valorMin);
  }

  if (tarifaCalculada < tarifaMinima) {
    tarifaCalculada = tarifaMinima;
  }
  tarifaCalculada = Number(tarifaCalculada.toFixed(2));

  const etiquetaHorario = esDiurno
    ? "☀️ Tarifa Diurna (Mínima: $1.25)"
    : "🌙 Tarifa Nocturna / Feriado (Mínima: $1.50)";

  return {
    tarifaCalculada,
    tarifaMinima,
    esDiurno,
    esFeriado,
    arranque,
    valorKm,
    valorMin,
    distanciaKm: Number(distanceKm.toFixed(2)),
    tiempoMin,
    etiquetaHorario,
  };
}



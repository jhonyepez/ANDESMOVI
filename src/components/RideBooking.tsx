import React, { useState, useEffect, useMemo } from 'react';
import { Coordinates, Driver, SystemTariffs, ExecutiveTripFrequency, UserProfile } from '../types';
import { databaseService } from '../services/databaseService';
import {
  calculateDistanceKm,
  estimateDurationMinutes,
  calculateSuggestedPrice,
  getMiniDriverDiscount,
  formatCurrency,
  detectRouteTolls,
  COMMON_TOLLS,
  calcularTarifaVigenteAndesMovi,
} from '../utils/geoUtils';
import { POPULAR_LOCATIONS } from '../data/mockData';
import { getPopularLocationsForProvince } from '../data/ecuador_geography';
import { RouteOptimizationModal } from './RouteOptimizationModal';
import { FavoriteAddressesModal, FavoritePlace, DEFAULT_FAVORITE_PLACES } from './FavoriteAddressesModal';
import { AudiVehicleIcon, YamahaBikeIcon } from './vehicleIcons';
import {
  MapPin,
  Navigation,
  Car,
  Bike,
  Sparkles,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Star,
  Check,
  X,
  ThumbsUp,
  Calendar,
  Route,
  Heart,
  Bookmark,
  LocateFixed,
  User,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface RideBookingProps {
  origin: Coordinates;
  destination: Coordinates | null;
  intermediateStops?: Coordinates[];
  onChangeIntermediateStops?: (stops: Coordinates[]) => void;
  onSelectOrigin: (coords: Coordinates) => void;
  onSelectDestination: (coords: Coordinates) => void;
  onRequestPickOnMap: (mode: 'origin' | 'destination' | 'stop') => void;
  onStartSearch: (bookingData: {
    vehicleType: 'auto' | 'moto' | 'confort' | 'mini';
    offeredPrice: number;
    notes: string;
    distanceKm: number;
    estimatedMinutes: number;
    hasTolls?: boolean;
    tollFeeUsd?: number;
    tollName?: string;
    intermediateStops?: Coordinates[];
    isInterprovincial?: boolean;
    passengerCount?: number;
    pricePerPassengerUsd?: number;
    commissionPerPassengerUsd?: number;
  }) => void;
  isSearching: boolean;
  onCancelSearch: () => void;
  onAcceptDriverOffer: (driver: Driver, finalPrice: number) => void;
  onOpenSchedule?: () => void;
  systemTariffs?: SystemTariffs;
  tarifaCalculada?: number;
  ofertaUsuario?: number;
  onUserOfferChange?: (offer: number) => void;
  infoRuta?: { km: number | string; min: number; origen: string; destino: string };
  initialInterprovincial?: boolean;
  esPrecioFijo?: boolean;
  currentUser?: UserProfile | null;
  onOpenRegister?: () => void;
  isDark?: boolean;
}

export const RideBooking: React.FC<RideBookingProps> = ({
  origin,
  destination,
  intermediateStops = [],
  onChangeIntermediateStops,
  onSelectOrigin,
  onSelectDestination,
  onRequestPickOnMap,
  onStartSearch,
  isSearching,
  onCancelSearch,
  onAcceptDriverOffer,
  onOpenSchedule,
  systemTariffs,
  tarifaCalculada,
  ofertaUsuario,
  onUserOfferChange,
  infoRuta,
  initialInterprovincial = false,
  esPrecioFijo = false,
  currentUser,
  onOpenRegister,
  isDark = true,
}) => {
  const [vehicleType, setVehicleType] = useState<'auto' | 'moto' | 'confort' | 'mini'>('auto');
  const [userOffer, setUserOffer] = useState<number>(ofertaUsuario ?? 1.25);
  const [showDiscountLimitNotice, setShowDiscountLimitNotice] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [incomingOffers, setIncomingOffers] = useState<Array<{ driver: Driver; price: number }>>([]);
  const [searchTimer, setSearchTimer] = useState<number>(0);
  const [showRouteModal, setShowRouteModal] = useState<boolean>(false);
  const [showDemoBlockModal, setShowDemoBlockModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setShowDemoBlockModal(false);
    }
  }, [currentUser]);

  // Interprovincial Trip state (Ejecutivo a Quito - Reserva por Asiento $25 USD)
  const [isInterprovincial, setIsInterprovincial] = useState<boolean>(initialInterprovincial);

  // Dynamic Executive Frequencies from databaseService
  const [executiveFrequencies, setExecutiveFrequencies] = useState<ExecutiveTripFrequency[]>(() =>
    databaseService.getExecutiveFrequencies().filter((f) => f.isActive)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setExecutiveFrequencies(databaseService.getExecutiveFrequencies().filter((f) => f.isActive));
    };
    window.addEventListener('andesmovi_frequencies_updated', handleUpdate);
    return () => {
      window.removeEventListener('andesmovi_frequencies_updated', handleUpdate);
    };
  }, []);

  const [selectedExecutiveFreqId, setSelectedExecutiveFreqId] = useState<string>(() => {
    const active = databaseService.getExecutiveFrequencies().filter((f) => f.isActive);
    return active[0]?.id || 'freq-tul-uio-01';
  });

  const selectedExecutiveFreq: ExecutiveTripFrequency = useMemo(() => {
    return (
      executiveFrequencies.find((f) => f.id === selectedExecutiveFreqId) ||
      executiveFrequencies[0] || {
        id: 'freq-tul-uio-01',
        code: 'FREQ-TUL-UIO-01',
        originCity: 'Tulcán',
        originTerminal: 'Terminal Terrestre Tulcán',
        originCoords: { lat: 0.8118, lng: -77.7173, name: 'Tulcán', address: 'Tulcán' },
        destinationCity: 'Quito',
        destinationTerminal: 'Parque La Carolina / Quicentro',
        destinationCoords: { lat: -0.1807, lng: -78.4678, name: 'Quito', address: 'Quito' },
        departureTime: '06:00 AM',
        pricePerSeatUsd: 25.0,
        depositRequiredUsd: 10.0,
        availableSeats: 4,
        daysOfWeek: ['Todos los días'],
        vehicleType: 'auto',
        isActive: true,
        createdAt: Date.now(),
      }
    );
  }, [executiveFrequencies, selectedExecutiveFreqId]);

  const returnExecutiveFreq = useMemo(() => {
    if (!selectedExecutiveFreq) return null;
    return (
      executiveFrequencies.find(
        (f) =>
          f.originCity.toLowerCase() === selectedExecutiveFreq.destinationCity.toLowerCase() &&
          f.destinationCity.toLowerCase() === selectedExecutiveFreq.originCity.toLowerCase() &&
          f.isActive
      ) || null
    );
  }, [selectedExecutiveFreq, executiveFrequencies]);

  // OpenStreetMap / Photon Geocoding Autocomplete States (100% libre sin API keys)
  const [originQuery, setOriginQuery] = useState(origin.name || origin.address || '');
  const [destQuery, setDestQuery] = useState(destination?.name || destination?.address || '');
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // Direcciones Favoritas (Casa, Trabajo, UPEC, etc.)
  const [favorites, setFavorites] = useState<FavoritePlace[]>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_user_favorites');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_FAVORITE_PLACES;
  });
  const [showFavoritesModal, setShowFavoritesModal] = useState<boolean>(false);
  const [candidateToSave, setCandidateToSave] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);

  const handleSaveFavoritesList = (updated: FavoritePlace[]) => {
    setFavorites(updated);
    try {
      localStorage.setItem('andesmovi_user_favorites', JSON.stringify(updated));
    } catch {
      // Ignorar
    }
  };

  const handleSelectFavoritePlace = (place: FavoritePlace, target: 'destination' | 'origin' = 'destination') => {
    haptic.success();
    const coords: Coordinates = {
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      address: place.address,
    };
    if (target === 'destination') {
      onSelectDestination(coords);
      setDestQuery(place.name);
    } else {
      onSelectOrigin(coords);
      setOriginQuery(place.name);
    }
  };

  useEffect(() => {
    setOriginQuery(origin.name || origin.address || '');
  }, [origin]);

  useEffect(() => {
    if (destination) {
      setDestQuery(destination.name || destination.address || '');
    } else {
      setDestQuery('');
    }
  }, [destination]);

  const fetchAddressSuggestions = async (query: string, type: 'origin' | 'destination') => {
    if (!query || query.trim().length < 2) {
      if (type === 'origin') setOriginSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    const cleanQuery = query.toLowerCase().trim();

    // 1. Instant Local Autocomplete from popular Ecuador locations (0ms response, 0 keys)
    const localMatches: any[] = [];
    const pool = [...localPopularLocations, ...POPULAR_LOCATIONS];
    for (const loc of pool) {
      if (
        loc.name.toLowerCase().includes(cleanQuery) ||
        (loc.address && loc.address.toLowerCase().includes(cleanQuery))
      ) {
        if (!localMatches.some((m) => m.name === loc.name)) {
          localMatches.push({
            id: `loc-${loc.lat}-${loc.lng}`,
            name: loc.name,
            address: loc.address || loc.name,
            lat: loc.lat,
            lng: loc.lng,
          });
        }
      }
      if (localMatches.length >= 4) break;
    }

    if (localMatches.length > 0) {
      if (type === 'origin') setOriginSuggestions(localMatches);
      else setDestSuggestions(localMatches);
    }

    // 2. 100% Free, Keyless OpenStreetMap Photon Geocoder (no keys, never expires)
    try {
      const origLat = origin?.lat ?? 0.8116;
      const origLng = origin?.lng ?? -77.7173;
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${origLat}&lon=${origLng}&limit=6`
      );
      if (photonRes.ok) {
        const data = await photonRes.json();
        if (data && data.features && data.features.length > 0) {
          const items = data.features.map((feat: any, idx: number) => {
            const p = feat.properties;
            const name = p.name || p.street || p.city || query;
            const parts = [p.name, p.street, p.district, p.city, p.country].filter(Boolean);
            const address = parts.length > 0 ? parts.join(', ') : name;
            return {
              id: `osm-${idx}-${feat.geometry.coordinates[0]}`,
              name,
              address,
              lng: feat.geometry.coordinates[0],
              lat: feat.geometry.coordinates[1],
            };
          });

          // Combine local matches + remote OSM matches without duplicates
          const combined = [...localMatches];
          for (const it of items) {
            if (!combined.some((c) => c.name === it.name)) {
              combined.push(it);
            }
          }

          if (type === 'origin') setOriginSuggestions(combined);
          else setDestSuggestions(combined);
          return;
        }
      }
    } catch {
      // Fallback already populated with local matches
    }

    // 3. Fallback: OpenStreetMap Nominatim
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ec&format=json&limit=5`
      );
      if (nomRes.ok) {
        const data = await nomRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const items = data.map((item: any, idx: number) => ({
            id: `nom-${idx}-${item.place_id}`,
            name: item.name || query,
            address: item.display_name,
            lng: parseFloat(item.lon),
            lat: parseFloat(item.lat),
          }));
          const combined = [...localMatches];
          for (const it of items) {
            if (!combined.some((c) => c.name === it.name)) {
              combined.push(it);
            }
          }
          if (type === 'origin') setOriginSuggestions(combined);
          else setDestSuggestions(combined);
        }
      }
    } catch {
      // Ignore
    }
  };

  const geocodeAndSetCoordinates = async (query: string, type: 'origin' | 'destination') => {
    if (!query || query.trim().length < 3) return;

    // 100% Free, Keyless Photon (OSM) - Never expires
    try {
      const origLat = origin?.lat ?? 0.8116;
      const origLng = origin?.lng ?? -77.7173;
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${origLat}&lon=${origLng}&limit=1`
      );
      if (photonRes.ok) {
        const data = await photonRes.json();
        if (data && data.features && data.features[0]) {
          const feat = data.features[0];
          const p = feat.properties;
          const name = p.name || p.street || query;
          const parts = [p.name, p.street, p.district, p.city, p.country].filter(Boolean);
          const address = parts.length > 0 ? parts.join(', ') : name;
          const coords = {
            lat: feat.geometry.coordinates[1],
            lng: feat.geometry.coordinates[0],
            name,
            address,
          };
          if (type === 'origin') onSelectOrigin(coords);
          else onSelectDestination(coords);
          return;
        }
      }
    } catch (err) {
      console.warn('Geocoding coordinates note:', err);
    }

    // Fallback: Nominatim OpenStreetMap
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ec&format=json&limit=1`
      );
      if (nomRes.ok) {
        const data = await nomRes.json();
        if (Array.isArray(data) && data[0]) {
          const item = data[0];
          const coords = {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            name: item.name || query,
            address: item.display_name,
          };
          if (type === 'origin') onSelectOrigin(coords);
          else onSelectDestination(coords);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    setIsInterprovincial(initialInterprovincial);
    if (initialInterprovincial && selectedExecutiveFreq) {
      onSelectOrigin(selectedExecutiveFreq.originCoords);
      onSelectDestination(selectedExecutiveFreq.destinationCoords);
      const defaultTurno = selectedExecutiveFreq.departureTimes?.[0] || selectedExecutiveFreq.departureTime || '06:00 AM';
      setSelectedSchedule(`${defaultTurno} (${selectedExecutiveFreq.originCity} ➔ ${selectedExecutiveFreq.destinationCity})`);
    }
  }, [initialInterprovincial, selectedExecutiveFreq]);

  const [selectedSchedule, setSelectedSchedule] = useState<string>(() => {
    const active = databaseService.getExecutiveFrequencies().filter((f) => f.isActive)[0];
    if (active) {
      const t = active.departureTimes?.[0] || active.departureTime || '06:00 AM';
      return `${t} (${active.originCity} ➔ ${active.destinationCity})`;
    }
    return '06:00 AM (Salida Ejecutiva)';
  });

  // Ubicaciones populares y cantones adaptados dinámicamente a la provincia del usuario/conductor
  const localPopularLocations = React.useMemo(() => {
    return getPopularLocationsForProvince(origin?.address || origin?.name);
  }, [origin?.address, origin?.name]);

  const EXECUTIVE_SEATS = useMemo(() => [
    { id: 'asiento_1', name: 'Copiloto / Asiento 1', sub: 'Fila Delantera', icon: '💺', priceUsd: selectedExecutiveFreq?.pricePerSeatUsd ?? 25.00 },
    { id: 'asiento_2', name: 'Asiento 2', sub: 'Fila Trasera (Ventana Izq.)', icon: '🪟', priceUsd: selectedExecutiveFreq?.pricePerSeatUsd ?? 25.00 },
    { id: 'asiento_3', name: 'Asiento 3', sub: 'Fila Trasera (Centro)', icon: '💺', priceUsd: selectedExecutiveFreq?.pricePerSeatUsd ?? 25.00 },
    { id: 'asiento_4', name: 'Asiento 4', sub: 'Fila Trasera (Ventana Der.)', icon: '🪟', priceUsd: selectedExecutiveFreq?.pricePerSeatUsd ?? 25.00 },
  ], [selectedExecutiveFreq]);
  
  // Occupied seats per schedule
  const [scheduleOccupiedSeats, setScheduleOccupiedSeats] = useState<Record<string, string[]>>({
    '03:00 AM (Tulcán ➔ Llegada Parque La Carolina)': ['asiento_2'],
    '10:00 AM (Tulcán ➔ Llegada Parque La Carolina)': ['asiento_3', 'asiento_4'],
    '05:00 PM (Tulcán ➔ Llegada Parque La Carolina)': ['asiento_1'],
    '11:00 AM (Salida Parque La Carolina ➔ Tulcán)': [],
    '05:00 PM (Salida Parque La Carolina ➔ Tulcán)': ['asiento_2'],
    '03:00 AM (Salida Parque La Carolina ➔ Tulcán)': ['asiento_4'],
  });

  const occupiedSeats = scheduleOccupiedSeats[selectedSchedule] || [];
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['asiento_1']);

  // Reset selected seats when schedule changes to first available seat
  useEffect(() => {
    const occ = scheduleOccupiedSeats[selectedSchedule] || [];
    const firstAvail = EXECUTIVE_SEATS.find((s) => !occ.includes(s.id))?.id || 'asiento_1';
    setSelectedSeats([firstAvail]);
  }, [selectedSchedule]);

  const toggleSeatSelection = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    haptic.selection();
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const selectAllSeats = () => {
    haptic.selection();
    const available = EXECUTIVE_SEATS.map((s) => s.id).filter((id) => !occupiedSeats.includes(id));
    if (available.length > 0) {
      setSelectedSeats(available);
    }
  };

  // Intermediate Stops Handlers
  const handleAddStop = () => {
    if (intermediateStops.length >= 4) return;
    haptic.impactLight();
    const newIndex = intermediateStops.length + 1;
    const newStop: Coordinates = {
      lat: origin.lat + 0.003 * newIndex,
      lng: origin.lng + 0.003 * newIndex,
      name: '',
      address: '',
    };
    const updated = [...intermediateStops, newStop];
    if (onChangeIntermediateStops) {
      onChangeIntermediateStops(updated);
    }
  };

  const handleUpdateStop = (index: number, text: string) => {
    const updated = intermediateStops.map((s, i) => (i === index ? { ...s, name: text, address: text } : s));
    if (onChangeIntermediateStops) {
      onChangeIntermediateStops(updated);
    }
  };

  const handleRemoveStop = (index: number) => {
    haptic.impactLight();
    const updated = intermediateStops.filter((_, i) => i !== index);
    if (onChangeIntermediateStops) {
      onChangeIntermediateStops(updated);
    }
  };

  const handleGeocodeStopOnBlur = async (index: number, text: string) => {
    if (!text || text.trim().length < 3) return;

    // 100% Free, Keyless Photon (OSM) - Never expires
    try {
      const origLat = origin?.lat ?? 0.8116;
      const origLng = origin?.lng ?? -77.7173;
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lat=${origLat}&lon=${origLng}&limit=1`
      );
      if (photonRes.ok) {
        const data = await photonRes.json();
        if (data && data.features && data.features[0]) {
          const feat = data.features[0];
          const p = feat.properties;
          const name = p.name || p.street || text;
          const parts = [p.name, p.street, p.district, p.city, p.country].filter(Boolean);
          const address = parts.length > 0 ? parts.join(', ') : name;
          const updated = intermediateStops.map((s, i) =>
            i === index
              ? {
                  lat: feat.geometry.coordinates[1],
                  lng: feat.geometry.coordinates[0],
                  name,
                  address,
                }
              : s
          );
          if (onChangeIntermediateStops) {
            onChangeIntermediateStops(updated);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Geocoding stop fallback error:', e);
    }

    // Fallback: OpenStreetMap Nominatim
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&countrycodes=ec&format=json&limit=1`
      );
      if (nomRes.ok) {
        const data = await nomRes.json();
        if (Array.isArray(data) && data[0]) {
          const item = data[0];
          const updated = intermediateStops.map((s, i) =>
            i === index
              ? {
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon),
                  name: item.name || text,
                  address: item.display_name,
                }
              : s
          );
          if (onChangeIntermediateStops) {
            onChangeIntermediateStops(updated);
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  // Distance & Fair Price calculation (controlled by Admin System Tariffs, Tolls & Intermediate Stops)
  const stopsKmAddon = intermediateStops.length * 1.5;
  const hasValidDest = destination && (destination.name || destination.address);
  const localDist = Number(((hasValidDest ? calculateDistanceKm(origin, destination) : 0) + stopsKmAddon).toFixed(1));
  const distanceKm = infoRuta && Number(infoRuta.km) > 0 ? Number(Number(infoRuta.km).toFixed(1)) : localDist;
  const estimatedMinutes = infoRuta && infoRuta.min > 0 ? infoRuta.min : (estimateDurationMinutes(distanceKm) + intermediateStops.length * 4);

  // Tarifa oficial vigente según horario (Diurna / Nocturna / Feriados)
  const tarifaOficialInfo = calcularTarifaVigenteAndesMovi(distanceKm, estimatedMinutes);

  // Base price computation (Sincronizado con tarifaCalculada de OSRM si está disponible)
  const pricePerPassenger = 25.00;
  const stopsFeeAddon = intermediateStops.length * 0.20;
  const baseSuggestedPrice = isInterprovincial
    ? selectedSeats.length * pricePerPassenger
    : (tarifaCalculada !== undefined ? tarifaCalculada : tarifaOficialInfo.tarifaCalculada);

  const suggestedPrice = tarifaCalculada !== undefined ? tarifaCalculada : Number((baseSuggestedPrice + stopsFeeAddon).toFixed(2));

  // Sync userOffer when external ofertaUsuario or suggestedPrice changes
  useEffect(() => {
    if (ofertaUsuario !== undefined) {
      setUserOffer(ofertaUsuario);
    } else {
      setUserOffer(suggestedPrice);
    }
  }, [ofertaUsuario, suggestedPrice, destination, vehicleType, isInterprovincial, selectedSeats, intermediateStops.length]);

  const activeOffer = ofertaUsuario !== undefined ? ofertaUsuario : userOffer;

  // Real-time search radar timer
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (isSearching) {
      setIncomingOffers([]);
      setSearchTimer(0);

      timerInterval = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(timerInterval);
      };
    }
  }, [isSearching]);

  // Regla estricta: Lectura de tarifa mínima urbana según horario oficial (Diurna $1.25 / Nocturna o Feriado $1.50)
  const tarifaMinima = isInterprovincial
    ? 25.00
    : (vehicleType === 'moto'
      ? Math.max(0.75, tarifaOficialInfo.tarifaMinima - 0.25)
      : tarifaOficialInfo.tarifaMinima);

  const isCarreraMinima = suggestedPrice <= tarifaMinima;
  // Si la tarifa calculada es igual a la mínima, PROHIBIDO APLICAR DESCUENTOS (piso = tarifaMinima).
  // Si supera la mínima, descuento máximo de $0.25 respetando el piso legal de la carrera mínima.
  const pisoPermitido = isCarreraMinima
    ? tarifaMinima
    : Math.max(tarifaMinima, Number((suggestedPrice - 0.25).toFixed(2)));

  const handleAdjustPrice = (delta: number) => {
    const currentVal = activeOffer;
    const nextVal = Number((currentVal + delta).toFixed(2));
    if (nextVal < pisoPermitido) {
      setShowDiscountLimitNotice(true);
      setTimeout(() => setShowDiscountLimitNotice(false), 3500);
      setUserOffer(pisoPermitido);
      if (onUserOfferChange) onUserOfferChange(pisoPermitido);
      return;
    }
    setUserOffer(nextVal);
    if (onUserOfferChange) onUserOfferChange(nextVal);
  };

  const getPriceAttractiveness = () => {
    const diff = activeOffer - suggestedPrice;
    if (diff >= 0.75) return { label: 'Tarifa muy atractiva para conductores', color: 'text-emerald-400 bg-emerald-500/10' };
    if (diff >= -0.25) return { label: 'Tarifa justa recomendada (USD)', color: 'text-blue-400 bg-blue-500/10' };
    return { label: 'Tarifa ajustada (podría tardar)', color: 'text-amber-400 bg-amber-500/10' };
  };

  const priceStatus = getPriceAttractiveness();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* AVISO DE MODO DEMO (SOLO LECTURA SIN REGISTRO) */}
      {!currentUser && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <strong className="text-amber-400 font-black block text-xs uppercase tracking-wider">
                Modo Demo (Solo Visualización)
              </strong>
              <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                Puedes ver rutas y calcular tarifas. Para pedir viajes reales con choferes, debes registrarte.
              </span>
            </div>
          </div>
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Registrarme
            </button>
          )}
        </div>
      )}
      {/* ========================================================================= */}
      {/* 🚙 MODO EJECUTIVO A QUITO: RESERVA DIRECTA DE ASIENTOS                   */}
      {/* ========================================================================= */}
      {isInterprovincial ? (
        <div className={`border-2 p-4 rounded-3xl shadow-2xl flex flex-col gap-4 animate-fadeIn transition-colors ${
          isDark ? 'bg-zinc-900/95 border-blue-500/70' : 'bg-white border-blue-200 shadow-blue-100'
        }`}>
          {/* Header Ejecutivo */}
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-blue-500/30' : 'border-blue-100'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => window.history.back()}
                className={`p-1.5 rounded-xl transition-colors ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
                title="Volver"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <span className={`text-base font-black tracking-wide block truncate flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>🚙</span> Viajes Ejecutivos
                </span>
                <span className={`text-[11px] block truncate font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  {selectedExecutiveFreq.originCity} ➔ {selectedExecutiveFreq.destinationCity} · ${selectedExecutiveFreq.pricePerSeatUsd.toFixed(2)} USD / asiento
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-sm font-mono font-black px-3 py-1 rounded-xl border block ${
                isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                ${(selectedSeats.length * selectedExecutiveFreq.pricePerSeatUsd).toFixed(2)} USD
              </span>
              <span className={`text-[9px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>
                {selectedSeats.length} de 4 Asientos
              </span>
            </div>
          </div>

          {/* SELECTOR DE RUTAS Y FRECUENCIAS NACIONALES (TODO ECUADOR) */}
          <div className={`p-3 rounded-2xl border space-y-2 ${
            isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                <Route className="w-3.5 h-3.5 text-blue-500" />
                <span>Rutas y Frecuencias Disponibles ({executiveFrequencies.length}):</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isDark ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              }`}>
                En Vivo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {executiveFrequencies.map((freq) => {
                const isSel = freq.id === selectedExecutiveFreqId;
                const hasTurnos = Array.isArray(freq.departureTimes) && freq.departureTimes.length > 0;
                const freqTurno = hasTurnos ? freq.departureTimes[0] : (freq.departureTime || '');
                return (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedExecutiveFreqId(freq.id);
                      if (freqTurno) {
                        setSelectedSchedule(`${freqTurno} (${freq.originCity} ➔ ${freq.destinationCity})`);
                      } else {
                        setSelectedSchedule(`Ruta ${freq.originCity} ➔ ${freq.destinationCity}`);
                      }
                      onSelectOrigin(freq.originCoords);
                      onSelectDestination(freq.destinationCoords);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSel
                        ? isDark
                          ? 'bg-blue-900/60 border-blue-400 text-white shadow-md ring-1 ring-blue-400'
                          : 'bg-blue-50 border-blue-500 text-blue-950 shadow-sm ring-2 ring-blue-400/40'
                        : isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className={`text-xs font-black block truncate ${
                        isSel ? (isDark ? 'text-white' : 'text-blue-950 font-black') : (isDark ? 'text-zinc-200' : 'text-slate-900')
                      }`}>
                        {freq.originCity} ➔ {freq.destinationCity}
                      </span>
                      {hasTurnos ? (
                        <span className={`text-[10px] font-mono block truncate ${isDark ? 'text-amber-400' : 'text-amber-800 font-bold'}`}>
                          ⏰ {freq.departureTimes.join(' · ')}
                        </span>
                      ) : (
                        <span className={`text-[10px] block truncate italic ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          ⏳ Turnos por programar
                        </span>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border block ${
                        isDark
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        ${freq.pricePerSeatUsd.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HORARIOS Y TURNOS OFICIALES DE SALIDAS (DINÁMICOS SEGÚN FRECUENCIAS CREADAS) */}
          <div className={`p-4 rounded-2xl border-2 shadow-sm flex flex-col gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-blue-950/80 via-zinc-900 to-indigo-950/80 border-blue-500/50 text-white'
              : 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/70 border-blue-200 text-slate-900'
          }`}>
            <div className={`font-black text-xs uppercase flex items-center justify-between ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Turnos de Salida ({selectedExecutiveFreq.originCity} ➔ {selectedExecutiveFreq.destinationCity})</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                isDark ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-800 bg-emerald-100 border-emerald-200'
              }`}>
                {selectedSchedule || 'Sin turno seleccionado'}
              </span>
            </div>

            {/* Render turnos configurados */}
            {(() => {
              const salidaTurnos = Array.isArray(selectedExecutiveFreq.departureTimes) && selectedExecutiveFreq.departureTimes.length > 0
                ? selectedExecutiveFreq.departureTimes
                : (selectedExecutiveFreq.departureTime ? [selectedExecutiveFreq.departureTime] : []);

              if (salidaTurnos.length === 0) {
                return (
                  <div className={`p-3.5 rounded-xl border text-center ${
                    isDark ? 'bg-zinc-900/80 border-amber-500/30 text-amber-300' : 'bg-amber-50/90 border-amber-200 text-amber-900'
                  }`}>
                    <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500 animate-pulse" />
                    <p className="text-xs font-bold">Sin turnos programados por el momento para esta ruta</p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      El administrador habilitará y publicará los horarios de salida en breve.
                    </p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-2">
                  <span className={`font-extrabold flex items-center gap-1 text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    <span>🚀</span> Turnos Disponibles en esta Ruta:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono font-black text-xs">
                    {salidaTurnos.map((turnoTime) => {
                      const fullScheduleLabel = `${turnoTime} (${selectedExecutiveFreq.originCity} ➔ ${selectedExecutiveFreq.destinationCity})`;
                      const isSel = selectedSchedule.startsWith(turnoTime) || selectedSchedule === fullScheduleLabel;
                      return (
                        <button
                          key={turnoTime}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setSelectedSchedule(fullScheduleLabel);
                            onSelectOrigin(selectedExecutiveFreq.originCoords);
                            onSelectDestination(selectedExecutiveFreq.destinationCoords);
                          }}
                          className={`py-2 px-2 rounded-xl text-center text-xs transition-all cursor-pointer font-black flex flex-col items-center justify-center gap-0.5 ${
                            isSel
                              ? isDark
                                ? 'bg-emerald-500 text-zinc-950 shadow-lg scale-105 ring-2 ring-emerald-300'
                                : 'bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-300'
                              : isDark 
                                ? 'bg-zinc-900 text-emerald-300 hover:bg-zinc-800 border border-emerald-500/30' 
                                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300 shadow-xs'
                          }`}
                        >
                          <span>⏰ {turnoTime}</span>
                          <span className={`text-[9px] font-sans font-bold ${
                            isSel ? (isDark ? 'text-zinc-950' : 'text-emerald-100') : (isDark ? 'text-zinc-400' : 'text-slate-500')
                          }`}>
                            4 cupos libres
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {returnExecutiveFreq && (
              <div className={`pt-2 border-t flex flex-col gap-2 ${isDark ? 'border-zinc-800' : 'border-blue-200/70'}`}>
                <span className={`font-extrabold flex items-center gap-1 text-[11px] ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                  <span>🔄</span> Turnos de Retorno ({returnExecutiveFreq.originCity} ➔ {returnExecutiveFreq.destinationCity}):
                </span>
                {(() => {
                  const retornoTurnos = Array.isArray(returnExecutiveFreq.departureTimes) && returnExecutiveFreq.departureTimes.length > 0
                    ? returnExecutiveFreq.departureTimes
                    : (returnExecutiveFreq.departureTime ? [returnExecutiveFreq.departureTime] : []);

                  if (retornoTurnos.length === 0) {
                    return (
                      <p className={`text-[11px] italic ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Sin turnos de retorno programados actualmente.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono font-black text-xs">
                      {retornoTurnos.map((turnoTime) => {
                        const fullScheduleLabel = `${turnoTime} (${returnExecutiveFreq.originCity} ➔ ${returnExecutiveFreq.destinationCity})`;
                        const isSel = selectedSchedule.startsWith(turnoTime) || selectedSchedule === fullScheduleLabel;
                        return (
                          <button
                            key={turnoTime}
                            type="button"
                            onClick={() => {
                              haptic.selection();
                              setSelectedExecutiveFreqId(returnExecutiveFreq.id);
                              setSelectedSchedule(fullScheduleLabel);
                              onSelectOrigin(returnExecutiveFreq.originCoords);
                              onSelectDestination(returnExecutiveFreq.destinationCoords);
                            }}
                            className={`py-2 px-2 rounded-xl text-center text-xs transition-all cursor-pointer font-black flex flex-col items-center justify-center gap-0.5 ${
                              isSel
                                ? isDark
                                  ? 'bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                                  : 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-300'
                                : isDark 
                                  ? 'bg-zinc-900 text-blue-300 hover:bg-zinc-800 border border-blue-500/30' 
                                  : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-300 shadow-xs'
                            }`}
                          >
                            <span>⏰ {turnoTime}</span>
                            <span className={`text-[9px] font-sans font-bold ${
                              isSel ? 'text-blue-100' : (isDark ? 'text-zinc-400' : 'text-slate-500')
                            }`}>
                              Retorno
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Rutas y Terminales Oficiales de la Frecuencia */}
          <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            isDark ? 'bg-zinc-950/90 border-blue-500/40 text-white' : 'bg-white border-slate-200 shadow-xs text-slate-800'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`p-1.5 rounded-lg flex-shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Punto de Salida</span>
                <span className={`text-xs font-bold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedExecutiveFreq.originTerminal} ({selectedExecutiveFreq.originCity})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                if (returnExecutiveFreq) {
                  setSelectedExecutiveFreqId(returnExecutiveFreq.id);
                  const defTurno = returnExecutiveFreq.departureTimes?.[0] || returnExecutiveFreq.departureTime || '';
                  if (defTurno) {
                    setSelectedSchedule(`${defTurno} (${returnExecutiveFreq.originCity} ➔ ${returnExecutiveFreq.destinationCity})`);
                  } else {
                    setSelectedSchedule(`Ruta ${returnExecutiveFreq.originCity} ➔ ${returnExecutiveFreq.destinationCity}`);
                  }
                  onSelectOrigin(returnExecutiveFreq.originCoords);
                  onSelectDestination(returnExecutiveFreq.destinationCoords);
                } else {
                  const prevOrigin = origin;
                  onSelectOrigin(destination || selectedExecutiveFreq.destinationCoords);
                  onSelectDestination(prevOrigin);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer flex-shrink-0 ${
                isDark
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-400/40'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 shadow-xs'
              }`}
            >
              <span>🔄 Invertir Dirección</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className={`p-1.5 rounded-lg flex-shrink-0 ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Punto de Llegada</span>
                <span className={`text-xs font-bold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedExecutiveFreq.destinationTerminal} ({selectedExecutiveFreq.destinationCity})
                </span>
              </div>
            </div>
          </div>

          {/* Quick toggle auto completo */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              id="btn-select-all-seats-exec"
              onClick={selectAllSeats}
              className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/40 text-blue-300'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-900 shadow-xs'
              }`}
            >
              <span>✨ Reservar Auto Completo (4 Asientos por ${(selectedExecutiveFreq.pricePerSeatUsd * 4).toFixed(2)} USD)</span>
            </button>
            <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Toca para elegir
            </span>
          </div>

          {/* ESQUEMA VISUAL DE ASIENTOS (DISTRIBUCIÓN DEL VEHÍCULO) */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 relative overflow-hidden shadow-sm transition-all ${
            isDark ? 'bg-zinc-950 border-blue-500/40' : 'bg-white border-slate-200'
          }`}>
            {/* Header leyenda del auto */}
            <div className={`flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider border-b pb-2 ${
              isDark ? 'border-zinc-800/80 text-blue-300' : 'border-slate-100 text-blue-900'
            }`}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                DISTRIBUCIÓN DE ASIENTOS EN CABINA
              </span>
              <div className="flex items-center gap-2.5 text-[9px]">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded bg-emerald-500" /> Tu Asiento
                </span>
                <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded ${isDark ? 'bg-zinc-700' : 'bg-slate-300'}`} /> Disponible
                </span>
              </div>
            </div>

            {/* VISUAL CAR CABIN OUTLINE */}
            <div className={`relative border-2 rounded-3xl p-4 sm:p-5 flex flex-col gap-4 ${
              isDark
                ? 'border-blue-500/40 bg-gradient-to-b from-blue-950/40 via-zinc-900/80 to-zinc-950 shadow-inner'
                : 'border-slate-200 bg-slate-50/70 shadow-xs'
            }`}>
              {/* Frente del Auto y Parabrisas */}
              <div className={`w-full py-2 border rounded-2xl text-center flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-950/60 via-blue-900/40 to-blue-950/60 border-blue-400/40 text-blue-200'
                  : 'bg-blue-50 border-blue-200 text-blue-900 font-black shadow-xs'
              }`}>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <span>⬆️</span> FRENTE DEL VEHÍCULO / PARABRISAS <span>⬆️</span>
                </span>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>

              {/* FILA DELANTERA: [ Conductor ] y [ Copiloto / Asiento 1 ] */}
              <div className={`flex items-center justify-between px-2 text-[10px] font-bold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                <span>FILA DELANTERA</span>
                <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>2 PUESTOS</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* [ Conductor ] (Ocupado / Chofer) */}
                <div className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 cursor-not-allowed select-none relative overflow-hidden ${
                  isDark ? 'bg-zinc-900/80 border-zinc-700/80 text-zinc-400 shadow-md' : 'bg-slate-100 border-slate-200 text-slate-500 shadow-xs'
                }`}>
                  <div className={`absolute top-1.5 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                    isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    Puesto Chofer
                  </div>
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-lg mt-2 ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    🚗
                  </div>
                  <span className={`text-xs sm:text-sm font-black tracking-tight text-center ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    [ Conductor ]
                  </span>
                  <span className={`text-[9px] border px-2 py-0.5 rounded-full font-extrabold uppercase ${
                    isDark ? 'bg-zinc-800/90 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    Conductor Asignado
                  </span>
                </div>

                {/* [ Copiloto / Asiento 1 ] (Reservable $25 USD) */}
                {(() => {
                  const isOccupied = occupiedSeats.includes('asiento_1');
                  const isSelected = selectedSeats.includes('asiento_1');
                  return (
                    <button
                      type="button"
                      disabled={isOccupied}
                      id="exec-seat-asiento-1"
                      onClick={() => toggleSeatSelection('asiento_1')}
                      className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all relative shadow-sm ${
                        isOccupied
                          ? isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isSelected
                          ? isDark
                            ? 'bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 border-emerald-300 text-zinc-950 shadow-emerald-500/30 ring-2 ring-emerald-400 cursor-pointer active:scale-95'
                            : 'bg-emerald-600 border-emerald-500 text-white shadow-md ring-2 ring-emerald-400/40 cursor-pointer active:scale-95'
                          : isDark
                          ? 'bg-zinc-900/95 border-blue-500/40 text-zinc-200 hover:border-emerald-400 hover:bg-zinc-800/90 cursor-pointer active:scale-95'
                          : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-xs cursor-pointer active:scale-95'
                      }`}
                    >
                      <div className="absolute top-1.5 right-2">
                        {isOccupied ? (
                          <span className={`px-2 py-0.5 rounded-full border font-mono text-[8px] font-bold uppercase ${
                            isDark ? 'bg-red-950/60 text-red-400 border-red-500/40' : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            Ocupado
                          </span>
                        ) : isSelected ? (
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[8px] font-black uppercase ${
                            isDark ? 'bg-zinc-950 text-emerald-300 border border-emerald-400' : 'bg-emerald-800 text-white border border-emerald-300'
                          }`}>
                            ✓ Tu Asiento
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[8px] font-bold border ${
                            isDark ? 'bg-blue-500/20 text-blue-300 border-blue-400/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            Disponible
                          </span>
                        )}
                      </div>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black mt-2 shadow-inner ${
                        isOccupied 
                          ? (isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-slate-200 text-slate-400')
                          : isSelected 
                          ? (isDark ? 'bg-zinc-950 text-emerald-300 border border-emerald-400/50' : 'bg-emerald-700 text-white')
                          : (isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-blue-50 text-blue-700 border border-blue-100')
                      }`}>
                        💺
                      </div>
                      <span className={`text-xs sm:text-sm font-black text-center tracking-tight ${
                        isOccupied 
                          ? 'text-zinc-500' 
                          : isSelected 
                          ? (isDark ? 'text-zinc-950' : 'text-white') 
                          : (isDark ? 'text-white' : 'text-slate-900')
                      }`}>
                        [ Copiloto / Asiento 1 ]
                      </span>
                      <span className={`text-[11px] font-mono font-black ${
                        isOccupied 
                          ? 'text-zinc-500' 
                          : isSelected 
                          ? (isDark ? 'text-zinc-950 bg-emerald-300/40 px-2 py-0.5 rounded-lg' : 'text-white bg-emerald-700/80 px-2 py-0.5 rounded-lg') 
                          : (isDark ? 'text-emerald-400 bg-zinc-950/80 px-2 py-0.5 rounded-lg border border-zinc-800' : 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200')
                      }`}>
                        ${selectedExecutiveFreq.pricePerSeatUsd.toFixed(2)} USD
                      </span>
                    </button>
                  );
                })()}
              </div>

              {/* PASILLO CENTRAL */}
              <div className={`flex items-center justify-between px-2 text-[10px] font-bold pt-1 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                <span>FILA TRASERA</span>
                <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>3 PUESTOS</span>
              </div>

            {/* FILA TRASERA: [ Asiento 2 ] [ Asiento 3 ] [ Asiento 4 ] */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { id: 'asiento_2', label: '[ Asiento 2 ]', sub: 'Ventana Izq.', icon: '🪟' },
                { id: 'asiento_3', label: '[ Asiento 3 ]', sub: 'Centro', icon: '💺' },
                { id: 'asiento_4', label: '[ Asiento 4 ]', sub: 'Ventana Der.', icon: '🪟' },
              ].map((seat) => {
                const isOccupied = occupiedSeats.includes(seat.id);
                const isSelected = selectedSeats.includes(seat.id);
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={isOccupied}
                    id={`exec-seat-${seat.id}`}
                    onClick={() => toggleSeatSelection(seat.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative shadow-sm ${
                      isOccupied
                        ? isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-600' : 'bg-slate-100 border-slate-200 text-slate-400'
                        : isSelected
                        ? isDark
                          ? 'bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 border-emerald-300 text-zinc-950 shadow-emerald-500/30 ring-2 ring-emerald-400 cursor-pointer active:scale-95'
                          : 'bg-emerald-600 border-emerald-500 text-white shadow-md ring-2 ring-emerald-400/40 cursor-pointer active:scale-95'
                        : isDark
                          ? 'bg-zinc-900/95 border-blue-500/30 text-zinc-200 hover:border-emerald-400 hover:bg-zinc-800 cursor-pointer active:scale-95'
                          : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer active:scale-95 shadow-xs'
                    } ${isOccupied ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="absolute top-1 right-1">
                      {isOccupied ? (
                        <span className={`px-1.5 py-0.2 rounded border font-mono text-[7px] font-bold uppercase ${
                          isDark ? 'bg-red-950/60 text-red-400 border-red-500/40' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          Ocupado
                        </span>
                      ) : isSelected ? (
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[7px] font-black uppercase ${
                          isDark ? 'bg-zinc-950 text-emerald-300 border border-emerald-400' : 'bg-emerald-800 text-white border border-emerald-300'
                        }`}>
                          ✓ Tu
                        </span>
                      ) : null}
                    </div>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base font-black shadow-inner ${
                      isOccupied 
                        ? isDark ? 'bg-zinc-900 text-zinc-600' : 'bg-slate-200 text-slate-400'
                        : isSelected 
                          ? isDark ? 'bg-zinc-950 text-emerald-300 border border-emerald-400/50' : 'bg-emerald-700 text-white'
                          : isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {seat.icon}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] sm:text-xs font-black block leading-tight truncate ${
                        isOccupied 
                          ? 'text-zinc-600' 
                          : isSelected 
                          ? (isDark ? 'text-zinc-950' : 'text-white') 
                          : (isDark ? 'text-white' : 'text-slate-900')
                      }`}>
                        {seat.label}
                      </span>
                      <span className={`text-[9px] block truncate ${
                        isOccupied 
                          ? 'text-zinc-600' 
                          : isSelected 
                          ? (isDark ? 'text-zinc-900 font-bold' : 'text-emerald-100') 
                          : (isDark ? 'text-zinc-400' : 'text-slate-500')
                      }`}>
                        {seat.sub}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-black block ${
                      isOccupied 
                        ? 'text-zinc-600' 
                        : isSelected 
                          ? (isDark ? 'text-zinc-950 bg-emerald-300/40 px-1.5 py-0.5 rounded' : 'text-white bg-emerald-700/80 px-1.5 py-0.5 rounded') 
                          : isDark 
                            ? 'text-emerald-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800' 
                            : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200'
                    }`}>
                      ${(selectedExecutiveFreq?.pricePerSeatUsd ?? 25.0).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

              {/* MALETERO ESPACIOSO */}
              <div className={`w-full py-2 border rounded-2xl text-center flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border-zinc-800 text-zinc-400 shadow-inner'
                  : 'bg-white border-slate-200 text-slate-600 shadow-xs'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <span>🧳</span> MALETERO ESPACIOSO (1 MALETA + 1 MOCHILA POR ASIENTO INCLUIDO)
                </span>
              </div>
            </div>
          </div>

          {/* Rutas y Direcciones directas (Origen y Destino) */}
          <div className="flex flex-col gap-2.5 pt-1">
            {/* Origen */}
            <div className="relative flex flex-col">
              <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-slate-300 shadow-xs focus-within:border-blue-500'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    Recogida (Origen)
                  </span>
                  <input
                    type="text"
                    id="input-exec-origin"
                    value={originQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOriginQuery(val);
                      setShowOriginSuggestions(true);
                      fetchAddressSuggestions(val, 'origin');
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowOriginSuggestions(false);
                        geocodeAndSetCoordinates(originQuery, 'origin');
                      }, 250);
                    }}
                    onFocus={() => setShowOriginSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (originSuggestions.length > 0) {
                          const sug = originSuggestions[0];
                          onSelectOrigin({
                            lat: sug.lat,
                            lng: sug.lng,
                            name: sug.name,
                            address: sug.address,
                          });
                          setOriginQuery(sug.name);
                        } else {
                          geocodeAndSetCoordinates(originQuery, 'origin');
                        }
                        setShowOriginSuggestions(false);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className={`w-full bg-transparent text-sm font-semibold focus:outline-none truncate ${
                      isDark ? 'text-white placeholder:text-zinc-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                    placeholder="Escribe tu dirección de recogida..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRequestPickOnMap('origin')}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Seleccionar en mapa"
                >
                  <Navigation className="w-4 h-4 text-emerald-500" />
                </button>
              </div>

              {/* Floating suggestions dropdown */}
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className={`absolute left-0 right-0 z-[10000] top-full mt-1 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-1 max-h-56 overflow-y-auto ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  {originSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        onSelectOrigin({
                          lat: sug.lat,
                          lng: sug.lng,
                          name: sug.name,
                          address: sug.address,
                        });
                        setOriginQuery(sug.name);
                        setShowOriginSuggestions(false);
                      }}
                      className={`text-left w-full p-2.5 rounded-xl transition-colors text-xs ${
                        isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className={`font-bold block text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{sug.name}</span>
                      <span className={`text-[10px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{sug.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destino */}
            <div className="relative flex flex-col">
              <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-slate-300 shadow-xs focus-within:border-blue-500'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'
                }`}>
                  <MapPin className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                    isDark ? 'text-rose-400' : 'text-rose-700'
                  }`}>
                    Destino en {selectedExecutiveFreq.destinationCity}
                  </span>
                  <input
                    type="text"
                    id="input-exec-destination"
                    value={destQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDestQuery(val);
                      setShowDestSuggestions(true);
                      fetchAddressSuggestions(val, 'destination');
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowDestSuggestions(false);
                        geocodeAndSetCoordinates(destQuery, 'destination');
                      }, 250);
                    }}
                    onFocus={() => setShowDestSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (destSuggestions.length > 0) {
                          const sug = destSuggestions[0];
                          onSelectDestination({
                            lat: sug.lat,
                            lng: sug.lng,
                            name: sug.name,
                            address: sug.address,
                          });
                          setDestQuery(sug.name);
                        } else {
                          geocodeAndSetCoordinates(destQuery, 'destination');
                        }
                        setShowDestSuggestions(false);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className={`w-full bg-transparent text-sm font-semibold focus:outline-none truncate ${
                      isDark ? 'text-white placeholder:text-zinc-500' : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                    placeholder={`Escribe tu destino en ${selectedExecutiveFreq.destinationCity} (${selectedExecutiveFreq.destinationTerminal} o dirección)...`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRequestPickOnMap('destination')}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Seleccionar en mapa"
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                </button>
              </div>

              {/* Floating suggestions dropdown */}
              {showDestSuggestions && destSuggestions.length > 0 && (
                <div className={`absolute left-0 right-0 z-[10000] top-full mt-1 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-1 max-h-56 overflow-y-auto ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  {destSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        onSelectDestination({
                          lat: sug.lat,
                          lng: sug.lng,
                          name: sug.name,
                          address: sug.address,
                        });
                        setDestQuery(sug.name);
                        setShowDestSuggestions(false);
                      }}
                      className={`text-left w-full p-2.5 rounded-xl transition-colors text-xs ${
                        isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className={`font-bold block text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{sug.name}</span>
                      <span className={`text-[10px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{sug.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notas opcionales */}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional: notas sobre maletas, hora preferida, etc."
              className={`w-full text-xs p-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border ${
                isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-200' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-xs'
              }`}
            />
          </div>

          {/* Botón de Confirmación Directa de Reserva Ejecutiva */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              id="btn-confirm-exec-booking"
              type="button"
              onClick={() => {
                haptic.confirmTrip();
                const farePerSeat = selectedExecutiveFreq?.pricePerSeatUsd ?? 25.0;
                const totalExecPrice = selectedSeats.length * farePerSeat;
                const finalDestination = destination || selectedExecutiveFreq.destinationCoords;
                if (!destination) {
                  onSelectDestination(finalDestination);
                }
                onStartSearch({
                  vehicleType: 'auto',
                  offeredPrice: totalExecPrice,
                  notes: `Viaje Ejecutivo ${selectedExecutiveFreq.originCity} ➔ ${selectedExecutiveFreq.destinationCity} | Horario: ${selectedSchedule}. ${notes}`,
                  distanceKm: distanceKm || 85.0,
                  estimatedMinutes: estimatedMinutes || 90,
                  isInterprovincial: true,
                  passengerCount: selectedSeats.length,
                  pricePerPassengerUsd: farePerSeat,
                  commissionPerPassengerUsd: 3.00,
                });
              }}
              className="flex-1 w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black text-sm tracking-wide shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Pedir Viaje Ejecutivo (${(selectedSeats.length * (selectedExecutiveFreq?.pricePerSeatUsd ?? 25.0)).toFixed(2)} USD)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenSchedule && (
              <button
                type="button"
                id="btn-schedule-exec-trip"
                onClick={onOpenSchedule}
                className={`w-full sm:w-auto px-4 py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border-zinc-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-xs'
                }`}
                title="Programar para fecha y hora futura"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Programar</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 🚖 MODO TAXI (CARRERAS Y AUTOS EN LA CIUDAD)                              */
        /* ========================================================================= */
        <>
          {/* Route Selector (Origin / Destination) */}
          <div className={`border p-4 rounded-2xl shadow-xl flex flex-col gap-3 transition-colors ${
            isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200 shadow-slate-100'
          }`}>
            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              className={`self-start text-xs flex items-center gap-1 mb-2 transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <X className="w-3 h-3" />
              Volver
            </button>

            {/* Origin Field */}
            <div className="relative flex flex-col">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                  <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-600'}`} />
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-1">
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Recogida (Origen)</span>
                    <input
                      type="text"
                      id="input-ride-origin"
                      value={originQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOriginQuery(val);
                        setShowOriginSuggestions(true);
                        fetchAddressSuggestions(val, 'origin');
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowOriginSuggestions(false);
                          geocodeAndSetCoordinates(originQuery, 'origin');
                        }, 250);
                      }}
                      onFocus={() => setShowOriginSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (originSuggestions.length > 0) {
                            const sug = originSuggestions[0];
                            onSelectOrigin({
                              lat: sug.lat,
                              lng: sug.lng,
                              name: sug.name,
                              address: sug.address,
                            });
                            setOriginQuery(sug.name);
                          } else {
                            geocodeAndSetCoordinates(originQuery, 'origin');
                          }
                          setShowOriginSuggestions(false);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className={`w-full bg-transparent text-sm font-semibold focus:outline-none truncate ${isDark ? 'text-white' : 'text-slate-900'}`}
                      placeholder="Escribe tu punto de recogida..."
                    />
                  </div>
                  {(origin.name || origin.address) && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOrigin({ ...origin, name: '', address: '' });
                        setOriginQuery('');
                      }}
                      className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Borrar origen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  id="btn-pick-origin-map"
                  onClick={() => onRequestPickOnMap('origin')}
                  className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl active:scale-95 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  }`}
                  title="Seleccionar en el mapa"
                >
                  <Navigation className="w-4 h-4 text-emerald-500" />
                  <span className="hidden sm:inline">Mapa</span>
                </button>
              </div>

              {/* Floating suggestions dropdown */}
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className={`absolute left-0 right-0 z-[10000] top-full mt-1 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-1 max-h-56 overflow-y-auto ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200 shadow-xl'
                }`}>
                  {originSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        onSelectOrigin({
                          lat: sug.lat,
                          lng: sug.lng,
                          name: sug.name,
                          address: sug.address,
                        });
                        setOriginQuery(sug.name);
                        setShowOriginSuggestions(false);
                      }}
                      className={`text-left w-full p-2.5 rounded-xl transition-colors text-xs ${
                        isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className={`font-bold block text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{sug.name}</span>
                      <span className={`text-[10px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{sug.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Origin Location Chips adaptados a la provincia */}
            <div className={`pt-1.5 pb-1 border-t flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
              isDark ? 'border-zinc-800/60' : 'border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        let streetName = 'Mi ubicación actual GPS';
                        try {
                          const revRes = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`);
                          if (revRes.ok) {
                            const data = await revRes.json();
                            if (data.waypoints && data.waypoints[0] && data.waypoints[0].name) {
                              streetName = data.waypoints[0].name.trim();
                            }
                          }
                        } catch {}
                        onSelectOrigin({
                          lat,
                          lng,
                          name: streetName,
                          address: `${streetName}, Ecuador`,
                        });
                        setOriginQuery(streetName);
                      },
                      () => {
                        alert("Asegúrate de permitir la ubicación GPS en tu navegador o celular.");
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }
                }}
                className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
                title="Detectar mi ubicación exacta por GPS"
              >
                <LocateFixed className="w-3 h-3 text-emerald-400" />
                <span>🎯 Usar mi GPS</span>
              </button>
              <span className={`text-[10px] font-bold flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Puntos:</span>
              {localPopularLocations.slice(0, 4).map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectOrigin(loc)}
                  className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap transition-colors border flex-shrink-0 cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700/60'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            {/* Intermediate Stops List */}
            {intermediateStops.map((stop, idx) => (
              <React.Fragment key={idx}>
                <div className="border-t border-zinc-800/80 my-0.5 ml-11" />
                <div className="flex items-center gap-3 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-extrabold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                          Parada {idx + 1} (Texto)
                        </span>
                        <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-500/40">
                          +$0.20 USD
                        </span>
                      </div>
                      <input
                        type="text"
                        id={`input-stop-${idx}`}
                        value={stop.name || stop.address || ''}
                        onChange={(e) => handleUpdateStop(idx, e.target.value)}
                        onBlur={() => handleGeocodeStopOnBlur(idx, stop.name || stop.address || '')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGeocodeStopOnBlur(idx, stop.name || stop.address || '');
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className={`w-full bg-transparent text-sm font-semibold focus:outline-none truncate ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                        placeholder={`Escribe la dirección de la parada ${idx + 1}...`}
                        autoFocus={!stop.name && !stop.address}
                      />
                    </div>
                    {(stop.name || stop.address) && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStop(idx, '')}
                        className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        title="Borrar texto de parada"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(idx)}
                    className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition-all flex-shrink-0"
                    title="Eliminar parada (-$0.20 USD)"
                  >
                    <X className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </React.Fragment>
            ))}

            {/* Button to Add Intermediate Stop (Solo escribir dirección, +$0.20 USD) */}
            {intermediateStops.length < 4 && (
              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  type="button"
                  id="btn-add-intermediate-stop"
                  onClick={handleAddStop}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-500/70 text-amber-500 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                  title="Agregar parada intermedia escribiendo dirección (+ $0.20 USD)"
                >
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>+ Agregar Parada ({intermediateStops.length}/4)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-black shadow-sm">
                    +$0.20 USD
                  </span>
                </button>
                <p className={`text-[10px] text-center ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Escribe la dirección de tu parada intermedia. Cada parada suma <strong>+$0.20 USD</strong> al costo del viaje.
                </p>
              </div>
            )}

            <div className={`border-t my-0.5 ml-11 ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`} />

            {/* Destination Field */}
            <div className="flex items-center gap-3 relative">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Destino (Llegada)</span>
                  <input
                    type="text"
                    id="input-ride-destination"
                    value={destQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDestQuery(val);
                      setShowDestSuggestions(true);
                      fetchAddressSuggestions(val, 'destination');
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowDestSuggestions(false);
                        geocodeAndSetCoordinates(destQuery, 'destination');
                      }, 250);
                    }}
                    onFocus={() => setShowDestSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (destSuggestions.length > 0) {
                          const sug = destSuggestions[0];
                          onSelectDestination({
                            lat: sug.lat,
                            lng: sug.lng,
                            name: sug.name,
                            address: sug.address,
                          });
                          setDestQuery(sug.name);
                        } else {
                          geocodeAndSetCoordinates(destQuery, 'destination');
                        }
                        setShowDestSuggestions(false);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className={`w-full bg-transparent text-sm font-semibold focus:outline-none truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                    placeholder="Escribe tu punto de llegada..."
                  />
                </div>
                {destination && (destination.name || destination.address) && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDestination({ lat: -0.1292, lng: -78.3575, name: '', address: '' });
                      setDestQuery('');
                    }}
                    className={`p-1 rounded-full ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-800'}`}
                    title="Borrar destino"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                id="btn-pick-dest-map"
                type="button"
                onClick={() => onRequestPickOnMap('destination')}
                className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl active:scale-95 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm flex-shrink-0 ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
                title="Seleccionar en el mapa"
              >
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">Mapa</span>
              </button>

              {/* Floating suggestions dropdown */}
              {showDestSuggestions && destSuggestions.length > 0 && (
                <div className={`absolute left-0 right-0 z-[10000] top-full mt-1 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-1 max-h-56 overflow-y-auto ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200 shadow-xl'
                }`}>
                  {destSuggestions.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        onSelectDestination({
                          lat: sug.lat,
                          lng: sug.lng,
                          name: sug.name,
                          address: sug.address,
                        });
                        setDestQuery(sug.name);
                        setShowDestSuggestions(false);
                      }}
                      className={`text-left w-full p-2.5 rounded-xl transition-colors text-xs ${
                        isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className={`font-bold block text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{sug.name}</span>
                      <span className={`text-[10px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{sug.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Popular Locations Chips adaptados a la provincia */}
            <div className={`pt-2 border-t ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`}>
              <span className={`text-[11px] font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Destinos frecuentes en la zona:</span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {localPopularLocations.slice(0, 4).map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectDestination(loc)}
                    className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors border cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700/60'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* DIRECCIONES FAVORITAS PERSONALIZADAS (CASA, TRABAJO, UPEC, ETC.) */}
            <div className={`pt-2.5 pb-1 border-t flex flex-col gap-2 ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-black uppercase tracking-wide text-amber-400">
                    Mis Lugares Favoritos (1 Clic)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {destination && (destination.name || destination.address) && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        setCandidateToSave({
                          name: destination.name || 'Mi Destino',
                          address: destination.address || destination.name || '',
                          lat: destination.lat,
                          lng: destination.lng,
                        });
                        setShowFavoritesModal(true);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Guardar el destino actual en tus favoritos"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Guardar actual</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.tap();
                      setCandidateToSave(null);
                      setShowFavoritesModal(true);
                    }}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Administrar o agregar lugares favoritos"
                  >
                    <span>⚙️ Gestionar</span>
                  </button>
                </div>
              </div>

              {/* Chips de favoritos con 1 clic para pre-llenar */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {favorites.map((fav) => (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => handleSelectFavoritePlace(fav, 'destination')}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer active:scale-95 flex-shrink-0 ${
                      destination && (destination.name === fav.name || destination.address === fav.address)
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-black ring-1 ring-amber-400'
                        : isDark
                        ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">{fav.icon}</span>
                    <span className="font-bold text-[11px]">{fav.name}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    haptic.tap();
                    setCandidateToSave(null);
                    setShowFavoritesModal(true);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border border-dashed text-xs flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                    isDark ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500' : 'border-slate-300 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px]">+ Añadir</span>
                </button>
              </div>
            </div>
          </div>

          {/* If destination is NOT YET selected and NOT searching, show quick selection panel & instant request option */}
          {(!destination || (!destination.name && !destination.address)) && !isSearching && (
            <div className={`p-4 rounded-2xl border shadow-xl flex flex-col gap-3 transition-colors ${
              isDark ? 'bg-zinc-900/95 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
                  🚖
                </div>
                <div>
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Elige tu Destino para Pedir Taxi
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Toca un lugar de la lista, en el mapa o pide tu carrera directa ($1.25 USD mín.)
                  </p>
                </div>
              </div>

              {/* Botones de acción rápida cuando aún no se ha seleccionado destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onRequestPickOnMap('destination')}
                  className="py-3 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Seleccionar Destino en Mapa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic.confirmTrip();
                    const defaultDest = {
                      lat: 0.8118,
                      lng: -77.7173,
                      name: 'Centro de Tulcán (A acordar con chofer)',
                      address: 'Tulcán, Carchi',
                    };
                    onSelectDestination(defaultDest);
                  }}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                >
                  <span>Pedir Taxi al Centro ($1.25 USD Mín.)</span>
                  <ArrowRight className="w-4 h-4 text-zinc-950" />
                </button>
              </div>
            </div>
          )}

          {/* When destination is selected and NOT searching, show Fare & Vehicle Options */}
          {destination && (destination.name || destination.address) && !isSearching && (
            <>
              {/* Distance and Estimated Time info & Route Optimization */}
              <div className="flex flex-col gap-2">
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Distancia aprox.: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{distanceKm} km</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tiempo estimado: <strong className={isDark ? 'text-white' : 'text-slate-900'}>~{estimatedMinutes} min</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-identify-best-route"
                  onClick={() => {
                    haptic.impactLight();
                    setShowRouteModal(true);
                  }}
                  className={`w-full py-2 px-3 border rounded-xl text-xs font-bold flex items-center justify-between transition-all group shadow-sm ${
                    isDark
                      ? 'bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 hover:from-emerald-900/60 border-emerald-500/40 text-emerald-400'
                      : 'bg-emerald-50/80 hover:bg-emerald-100/70 border-emerald-300 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 group-hover:rotate-12 transition-transform" />
                    <span>Identificar la Mejor Ruta (IA AndesMovi)</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-200/80 text-emerald-900 border-emerald-300'
                  }`}>
                    Analizar Vías
                  </span>
                </button>
              </div>

              {/* Vehicle Type Selection */}
              <div className="flex flex-col gap-2">
                <label className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                  <span>Elige tu Vehículo:</span>
                  <span className={`text-[11px] font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Arranque legal ANT: $0.40 USD</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="opt-vehicle-auto"
                    onClick={() => setVehicleType('auto')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center relative ${
                      vehicleType === 'auto'
                        ? 'bg-sky-500/15 border-sky-400 text-sky-400 dark:text-sky-200 shadow-md ring-1 ring-sky-400/30'
                        : isDark
                        ? 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl flex items-center justify-center ${vehicleType === 'auto' ? 'bg-amber-400 text-zinc-950 shadow-sm' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}>
                      <AudiVehicleIcon className="w-6 h-6" size={26} />
                    </div>
                    <span className="text-xs font-black">Auto / Taxi</span>
                    <span className="text-[10px] opacity-80 leading-tight">4 Asientos • Sedán</span>
                  </button>

                  <button
                    type="button"
                    id="opt-vehicle-moto"
                    onClick={() => setVehicleType('moto')}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center relative ${
                      vehicleType === 'moto'
                        ? 'bg-blue-500/15 border-blue-400 text-blue-500 dark:text-blue-200 shadow-md ring-1 ring-blue-400/30'
                        : isDark
                        ? 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
                    }`}
                  >
                    <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full bg-blue-500 text-white font-black text-[9px]">
                      YAMAHA
                    </span>
                    <div className={`p-1.5 rounded-xl flex items-center justify-center ${vehicleType === 'moto' ? 'bg-blue-600 text-white shadow-sm' : isDark ? 'bg-zinc-800 text-blue-400' : 'bg-slate-200 text-blue-600'}`}>
                      <YamahaBikeIcon className="w-6 h-6" size={26} />
                    </div>
                    <span className="text-xs font-black">Moto Express</span>
                    <span className="text-[10px] opacity-80 leading-tight">1 Pax • Casco Incluido</span>
                  </button>
                </div>

                {vehicleType === 'moto' && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
                    isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <span className="text-base">🪖</span>
                    <span>
                      <strong>Casco Garantizado:</strong> El conductor de la moto lleva obligatoriamente un <strong>casco adicional homologado para el cliente</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* InDrive Iconic "Ofrece tu Tarifa" Section */}
              <div className={`border p-4 rounded-2xl shadow-xl flex flex-col gap-3 transition-colors ${
                isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200 shadow-md'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                      Ofrece tu tarifa (Tú decides el precio)
                    </span>
                    <p className="text-[11px] font-extrabold text-emerald-400 mt-0.5">
                      {tarifaOficialInfo.etiquetaHorario}
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Sugerida: {formatCurrency(suggestedPrice)} {intermediateStops.length > 0 ? `• +${formatCurrency(stopsFeeAddon)} por ${intermediateStops.length} parada${intermediateStops.length > 1 ? 's' : ''}` : ''}
                    </p>
                    {systemTariffs?.dynamicMultiplier && systemTariffs.dynamicMultiplier > 1.0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 dark:text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 mt-0.5">
                        ⚡ Tarifa {systemTariffs.dynamicMultiplier}x activa (Configurada por Administrador)
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priceStatus.color}`}>
                    {priceStatus.label}
                  </span>
                </div>

                {/* Price Counter Controller in USD */}
                <div className="space-y-1.5">
                  <div className={`flex items-center justify-between p-2.5 rounded-xl border gap-2 ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <button
                      id="btn-decrease-fare"
                      type="button"
                      disabled={esPrecioFijo || activeOffer <= pisoPermitido}
                      onClick={() => {
                        if (esPrecioFijo) return;
                        if (activeOffer <= pisoPermitido) {
                          setShowDiscountLimitNotice(true);
                          setTimeout(() => setShowDiscountLimitNotice(false), 3500);
                        } else {
                          handleAdjustPrice(-0.25);
                        }
                      }}
                      className={`min-h-[44px] min-w-[52px] px-2.5 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        esPrecioFijo || activeOffer <= pisoPermitido
                          ? 'opacity-40 cursor-not-allowed bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'
                          : isDark
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-white active:scale-95 cursor-pointer shadow-sm'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-800 active:scale-95 cursor-pointer shadow-sm'
                      }`}
                      title={
                        esPrecioFijo
                          ? 'Ruta con Tarifa Fija Oficial (No admite descuentos)'
                          : isCarreraMinima || activeOffer <= tarifaMinima
                          ? `La carrera mínima es de $${tarifaMinima.toFixed(2)} y no admite descuentos`
                          : `Descuento máximo de $0.25 alcanzado (Piso: $${pisoPermitido.toFixed(2)})`
                      }
                    >
                      -$0.25
                    </button>

                    <div className="text-center min-w-0 flex-1 flex flex-col items-center">
                      <div className="flex items-center justify-center">
                        <span className={`text-xl font-bold font-mono mr-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>$</span>
                        <input
                          type="number"
                          step="0.05"
                          disabled={esPrecioFijo}
                          min={pisoPermitido}
                          value={activeOffer}
                          onChange={(e) => {
                            if (esPrecioFijo) return;
                            const val = parseFloat(e.target.value);
                            if (isNaN(val)) return;
                            if (val < pisoPermitido) {
                              setUserOffer(pisoPermitido);
                              if (onUserOfferChange) onUserOfferChange(pisoPermitido);
                              setShowDiscountLimitNotice(true);
                              setTimeout(() => setShowDiscountLimitNotice(false), 3500);
                            } else {
                              const nextVal = Number(val.toFixed(2));
                              setUserOffer(nextVal);
                              if (onUserOfferChange) onUserOfferChange(nextVal);
                            }
                          }}
                          className={`text-2xl font-black tracking-tight text-center bg-transparent border-b border-dashed focus:outline-none w-24 font-mono ${
                            esPrecioFijo ? 'cursor-not-allowed text-amber-400' : isDark ? 'text-white border-zinc-700 focus:border-emerald-400' : 'text-slate-900 border-slate-300 focus:border-emerald-600'
                          }`}
                        />
                      </div>
                      <span className={`text-[10px] block font-medium truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {esPrecioFijo
                          ? '🔒 Tarifa Oficial Fija (No Modificable)'
                          : isCarreraMinima
                          ? `Carrera mínima: $${tarifaMinima.toFixed(2)} USD (Fija)`
                          : `Piso permitido: $${pisoPermitido.toFixed(2)} USD (-$0.25 máx)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        id="btn-increase-fare"
                        type="button"
                        disabled={esPrecioFijo}
                        onClick={() => {
                          if (esPrecioFijo) return;
                          handleAdjustPrice(0.25);
                        }}
                        className={`min-h-[44px] min-w-[52px] px-2.5 rounded-xl flex items-center justify-center font-bold text-xs transition-transform ${
                          esPrecioFijo
                            ? 'opacity-40 cursor-not-allowed bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'
                            : isDark
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-white active:scale-95 cursor-pointer'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800 active:scale-95 cursor-pointer'
                        }`}
                        title={esPrecioFijo ? 'Tarifa Fija Oficial' : 'Subir $0.25 USD'}
                      >
                        +$0.25
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustPrice(0.50)}
                        className={`min-h-[44px] min-w-[52px] px-2.5 rounded-xl border active:scale-95 flex items-center justify-center font-bold text-xs transition-transform cursor-pointer ${
                          isDark
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                        }`}
                        title="Subir $0.50 USD"
                      >
                        +$0.50
                      </button>
                    </div>
                  </div>

                  {/* Aviso de límite de descuento / carrera mínima */}
                  {showDiscountLimitNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <span className="text-base">⚠️</span>
                      <span>
                        {isCarreraMinima || activeOffer <= tarifaMinima
                          ? `La carrera mínima es de $${tarifaMinima.toFixed(2)} y no admite descuentos.`
                          : `El descuento máximo permitido es de $0.25 respecto al precio sugerido (Piso: $${pisoPermitido.toFixed(2)} USD).`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Optional Ride Notes / Preferences */}
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional: comentarios (ej. viajo con maletas al aeropuerto, pago con billete de $20...)"
                  className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 transition-colors ${
                    isDark
                      ? 'bg-zinc-950/60 border-zinc-800 text-zinc-200 placeholder:text-zinc-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                />

                {/* Action Buttons: Instant vs Scheduled */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    id="btn-publish-offer"
                    onClick={() => {
                      if (!currentUser) {
                        haptic.warning();
                        setShowDemoBlockModal(true);
                        return;
                      }
                      haptic.confirmTrip();
                      onStartSearch({
                        vehicleType,
                        offeredPrice: activeOffer,
                        notes,
                        distanceKm,
                        estimatedMinutes,
                        intermediateStops: intermediateStops.length > 0 ? intermediateStops : undefined,
                        isInterprovincial: false,
                      });
                    }}
                    className="flex-1 w-full py-3.5 rounded-xl bg-[#0052FF] hover:bg-[#0045D8] active:scale-98 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Pedir Taxi (${activeOffer.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {onOpenSchedule && (
                    <button
                      type="button"
                      id="btn-schedule-trip"
                      onClick={() => {
                        if (!currentUser) {
                          haptic.warning();
                          setShowDemoBlockModal(true);
                          return;
                        }
                        onOpenSchedule();
                      }}
                      className={`w-full sm:w-auto px-4 py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                      title="Programar para fecha y hora futura"
                    >
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>Programar</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* InDrive Driver Offers Waiting Radar Room */}
      {isSearching && (
        <div className="bg-zinc-900/95 border border-emerald-500/40 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in">
          {/* Header Radar State */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 relative" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Negociando con conductores cercanos</h4>
                <p className="text-[11px] text-zinc-400">
                  Tu oferta: <strong className="text-emerald-400">{formatCurrency(userOffer)}</strong> • Buscando ({searchTimer}s)
                </p>
              </div>
            </div>

            <button
              id="btn-cancel-search"
              onClick={onCancelSearch}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-[#FF3B30] hover:bg-[#E02E24] text-white'
              }`}
            >
              Cancelar
            </button>
          </div>

          {/* List of Incoming Driver Offers */}
          <div className="flex flex-col gap-3">
            {/* Live Drivers Viewing Counter Badge */}
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs shadow-inner">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-300">Conductores viendo tu carrera en vivo:</span>
              </div>
              <span className="font-mono font-black text-white bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                {Math.min(24, 14 + Math.floor(searchTimer * 0.7))} en línea
              </span>
            </div>

            {incomingOffers.length === 0 ? (
              <div className="p-7 text-center text-zinc-400 flex flex-col items-center gap-3 bg-zinc-950/60 rounded-xl border border-zinc-850">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-spin">
                  <Car className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Transmitiendo tu solicitud a conductores cercanos...</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Los conductores revisarán tu ruta y aceptarán tu precio o propondrán otro.</p>
                </div>
              </div>
            ) : (
              incomingOffers.map((offer, index) => {
                const isMatchingOffer = offer.price === userOffer;
                const distanceVal = offer.driver.distanceKm || calculateDistanceKm(offer.driver.currentCoords, origin) || 1.2;

                return (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 transition-all shadow-xl flex flex-col gap-3 animate-in slide-in-from-bottom-2"
                  >
                    {/* Top Row: Driver Photo & Info + Price Banner */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Driver Avatar & Name */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={offer.driver.avatar || null}
                            alt={offer.driver.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                          />
                          <div
                            className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-zinc-950 text-emerald-400 border border-zinc-700"
                            title="Conductor Verificado en Ecuador"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-sm font-bold text-white truncate">{offer.driver.name}</h5>
                            <span className="flex items-center text-[10px] font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <Star className="w-2.5 h-2.5 fill-amber-400 mr-1" />
                              {offer.driver.rating}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            {offer.driver.totalTrips} carreras completadas
                          </span>

                          {/* Distance & ETA */}
                          <div className="flex items-center gap-3 text-[11px] mt-1 text-zinc-300 font-medium">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              A {distanceVal} km de ti
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="flex items-center gap-1 text-zinc-300">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              Llega en ~{offer.driver.etaMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price Header Box */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-black text-white font-mono block">
                          {formatCurrency(offer.price)}
                        </span>
                        {isMatchingOffer ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            Aceptó tu precio
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            Contraoferta (+{formatCurrency(offer.price - userOffer)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Vehicle & Ecuadorian License Plate Badge */}
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 flex-shrink-0">
                          {offer.driver.vehicle.type === 'moto' ? (
                            <Bike className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Car className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <span className="text-white font-semibold">
                            {offer.driver.vehicle.model}
                          </span>
                          <span className="text-zinc-400 text-[11px] block">
                            {offer.driver.vehicle.color} • {offer.driver.vehicle.year}
                          </span>
                          {offer.driver.vehicle.type === 'moto' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1">
                              <Bike className="w-2.5 h-2.5 text-amber-400" />
                              <span>Moto Express • Casco de pasajero incluido</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] text-sky-300 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 mt-1">
                              <Car className="w-2.5 h-2.5 text-sky-400" />
                              <span>Auto / Taxi • 4 Asientos y maletero</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ecuadorian Plate Badge */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-950 border border-zinc-700 shadow-inner flex-shrink-0">
                        <span className="text-[8px] text-zinc-400 font-bold tracking-tighter uppercase mr-0.5">EC</span>
                        <span className="font-mono text-xs font-black text-amber-400 tracking-wider">
                          {offer.driver.vehicle.plate}
                        </span>
                      </div>
                    </div>

                    {/* Proposal Status Banner */}
                    <div className="text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 bg-zinc-900/50">
                      {isMatchingOffer ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Check className="w-3.5 h-3.5" />
                          <span>El conductor aceptó exactamente tu oferta de {formatCurrency(userOffer)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>El conductor propone otro precio: {formatCurrency(offer.price)}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-zinc-500">Tarifa fija</span>
                    </div>

                    {/* Action: Passenger Selects This Driver */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        id={`btn-select-driver-${offer.driver.id}`}
                        onClick={() => {
                          haptic.confirmTrip();
                          onAcceptDriverOffer(offer.driver, offer.price);
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
                          isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' : 'bg-[#00C853] hover:bg-[#00B048] text-white'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Seleccionar a {offer.driver.name.split(' ')[0]} por {formatCurrency(offer.price)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIncomingOffers((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors"
                        title="Rechazar esta propuesta"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Route Optimization Modal */}
      <RouteOptimizationModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        origin={origin}
        destination={destination}
      />

      {/* Favorite Addresses Management Modal */}
      {showFavoritesModal && (
        <FavoriteAddressesModal
          favorites={favorites}
          onSaveFavorites={handleSaveFavoritesList}
          onSelectFavorite={handleSelectFavoritePlace}
          onClose={() => {
            setShowFavoritesModal(false);
            setCandidateToSave(null);
          }}
          currentAddressCandidate={candidateToSave}
          isDark={isDark}
        />
      )}

      {/* MODAL DE BLOQUEO DE MODO DEMO (SIN REGISTRO / SIN DATOS) */}
      {showDemoBlockModal && (
        <div className="fixed inset-0 z-[10005] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 text-left animate-scaleUp ${
              isDark ? 'bg-zinc-950 border-amber-500/60 text-white' : 'bg-white border-amber-400 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">MODO DEMO (Solo Visualización)</h3>
                <p className="text-xs text-amber-400 font-bold">Sin datos no puedes pedir viajes reales</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Estás en <strong>Modo Demostración</strong>. Puedes explorar el mapa y simular rutas, pero para <strong>solicitar un taxi o carrera real con conductores de la flota</strong> debes registrar tus datos básicos de contacto (Nombre y Teléfono).
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              ℹ️ <strong>Registro de cliente en 1 solo paso</strong>: sin trámites de SRI ni Registro Civil.
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDemoBlockModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Seguir en Demo
              </button>
              {onOpenRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoBlockModal(false);
                    onOpenRegister();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer active:scale-95 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>Crear Cuenta (1 Paso)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

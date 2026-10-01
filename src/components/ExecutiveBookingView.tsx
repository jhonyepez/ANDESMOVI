import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { databaseService } from '../services/databaseService';
import {
  Car,
  Clock,
  Calendar,
  Users,
  Luggage,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Ticket,
  Phone,
  Target,
  Check,
  Copy,
  Building2,
  DollarSign,
  X,
  QrCode,
  Sparkles,
  Lock,
  User,
} from 'lucide-react';
import { Coordinates, ServiceType, SystemTariffs, UserProfile, ExecutiveSeatAdvanceVoucher, ExecutiveTripFrequency } from '../types';
import { haptic } from '../utils/haptics';

const MapComponent = React.lazy(() => import('./MapComponent'));

// Cuentas bancarias oficiales de la empresa para depósitos de reserva ($10.00 USD)
export const COMPANY_DEPOSIT_BANK_ACCOUNTS = [
  {
    id: 'pichincha',
    bankName: 'Banco Pichincha',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '2207472368',
    accountHolder: 'Jhon Sebastian Yepez Clavijo',
    identification: '1004721351',
    badge: 'DeUna! / Mi Vecino',
    icon: '🏦',
  },
  {
    id: 'guayaquil',
    bankName: 'Banco Guayaquil',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '47801405',
    accountHolder: 'Jhon Sebastian Yepez Clavijo',
    identification: '1004721351',
    badge: 'Banco del Barrio',
    icon: '🏛️',
  },
  {
    id: 'produbanco',
    bankName: 'Produbanco (Promerica)',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '20008810468',
    accountHolder: 'Jhon Sebastian Yepez Clavijo',
    identification: '1004721351',
    badge: 'Pago Ágil',
    icon: '💳',
  },
  {
    id: 'austro',
    bankName: 'Banco del Austro',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '0004282655',
    accountHolder: 'Jhon Sebastian Yepez Clavijo',
    identification: '1004721351',
    badge: 'Red Austro',
    icon: '🏬',
  },
];

export interface ExecutiveBookingViewProps {
  isDark: boolean;
  activeService: ServiceType;
  onChangeService: (service: ServiceType) => void;
  systemTariffs?: SystemTariffs;
  onConfirmBooking: (data: {
    origin: Coordinates;
    destination: Coordinates;
    seats: number;
    price: number;
    departureDate: string;
    departureTime: string;
    luggageType: string;
    notes: string;
    direction: 'tulcan_quito' | 'quito_tulcan' | string;
  }) => void;
  onCancelBooking?: () => void;
  isSearching?: boolean;
  currentUser?: UserProfile | null;
  onOpenRegister?: () => void;
  onSelectOrigin?: (coords: Coordinates) => void;
  onSelectDestination?: (coords: Coordinates) => void;
}

// Paradas frecuentes oficiales en Tulcán
const TULCAN_STOPS = [
  {
    id: 'tt_tulcan',
    name: 'Terminal Terrestre Tulcán',
    address: 'Av. Veintimilla y Cotopaxi (Matriz AndesMovi)',
    lat: 0.8118,
    lng: -77.7173,
    tag: 'Matriz Principal',
  },
  {
    id: 'parque_central_tulcan',
    name: 'Parque Central Tulcán / Catedral',
    address: 'Calles Sucre y 10 de Agosto, Centro Histórico',
    lat: 0.8124,
    lng: -77.7178,
    tag: 'Centro',
  },
  {
    id: 'redondel_mambla',
    name: 'Redondel del Mambla / Tulcanaza',
    address: 'Salida Sur Panamericana Norte E35',
    lat: 0.8035,
    lng: -77.7265,
    tag: 'Salida Sur',
  },
  {
    id: 'upec_tulcan',
    name: 'UPEC - Univ. Estatal del Carchi',
    address: 'Campus Universitario, Av. Universitaria',
    lat: 0.8089,
    lng: -77.7312,
    tag: 'Universidad',
  },
  {
    id: 'obelisco_tulcan',
    name: 'Obelisco de Tulcán',
    address: 'Av. Coral y Manabí',
    lat: 0.8162,
    lng: -77.7155,
    tag: 'Norte',
  },
  {
    id: 'rumichaca',
    name: 'Puente Rumichaca (Frontera)',
    address: 'Frontera Ecuador - Colombia, Tulcán',
    lat: 0.816,
    lng: -77.6644,
    tag: 'Frontera',
  },
];

// Paradas frecuentes oficiales en Quito
const QUITO_STOPS = [
  {
    id: 'tt_carcelen',
    name: 'Terminal Terrestre Carcelén (Quito Norte)',
    address: 'Av. Eloy Alfaro y Galo Plaza Lasso',
    lat: -0.0984,
    lng: -78.4789,
    tag: 'Quito Norte',
    basePriceUSD: 25,
  },
  {
    id: 'parque_carolina',
    name: 'Parque La Carolina / Quicentro / Shyris',
    address: 'Av. de los Shyris y Naciones Unidas',
    lat: -0.1807,
    lng: -78.4678,
    tag: 'Centro Norte',
    basePriceUSD: 25,
  },
  {
    id: 'aeropuerto_tababela',
    name: 'Aeropuerto Mariscal Sucre (Tababela VIP)',
    address: 'Conector Alpachaca, Tababela, Quito',
    lat: -0.1292,
    lng: -78.3575,
    tag: 'Aeropuerto',
    basePriceUSD: 30,
  },
  {
    id: 'tt_quitumbe',
    name: 'Terminal Terrestre Quitumbe (Quito Sur)',
    address: 'Av. Cóndor Ñan y Av. Mariscal Sucre',
    lat: -0.2895,
    lng: -78.5492,
    tag: 'Quito Sur',
    basePriceUSD: 30,
  },
  {
    id: 'metro_el_labrador',
    name: 'Estación Metro El Labrador',
    address: 'Av. Amazonas e Isaac Albéniz',
    lat: -0.1585,
    lng: -78.4875,
    tag: 'Metro',
    basePriceUSD: 25,
  },
  {
    id: 'condado_shopping',
    name: 'Condado Shopping (Norte)',
    address: 'Av. Prensa y Av. Mariscal Sucre',
    lat: -0.1065,
    lng: -78.4985,
    tag: 'Comercial',
    basePriceUSD: 25,
  },
];

// Horarios oficiales de salida frecuente
const OFFICIAL_SCHEDULES = [
  { time: '03:00 AM', label: 'Madrugada VIP (Conexión Vuelos)', icon: '✈️' },
  { time: '06:00 AM', label: 'Primera Frecuencia Mañana', icon: '☀️' },
  { time: '10:00 AM', label: 'Media Mañana', icon: '🌤️' },
  { time: '01:00 PM', label: 'Mediodía / Almuerzo', icon: '🥪' },
  { time: '05:00 PM', label: 'Tarde / Retorno Ejecutivo', icon: '🌆' },
  { time: '08:00 PM', label: 'Nocturno Ejecutivo', icon: '🌙' },
];

// Croquis oficial de los 4 asientos de pasajeros en cabina
export const EXECUTIVE_CABIN_SEATS = [
  { id: 'asiento_1', name: 'Copiloto (Asiento 1)', sub: 'Fila Delantera', icon: '💺' },
  { id: 'asiento_2', name: 'Asiento 2 (Ventana)', sub: 'Ventana Izq.', icon: '🪟' },
  { id: 'asiento_3', name: 'Asiento 3 (Centro)', sub: 'Fila Trasera', icon: '💺' },
  { id: 'asiento_4', name: 'Asiento 4 (Ventana)', sub: 'Ventana Der.', icon: '🪟' },
];

export const ExecutiveBookingView: React.FC<ExecutiveBookingViewProps> = ({
  isDark,
  activeService,
  onChangeService,
  systemTariffs,
  onConfirmBooking,
  onCancelBooking,
  isSearching = false,
  currentUser,
  onOpenRegister,
  onSelectOrigin,
  onSelectDestination,
}) => {
  // Dirección del viaje (compatibilidad previa)
  const [direction, setDirection] = useState<'tulcan_quito' | 'quito_tulcan'>('tulcan_quito');
  const [showDemoBlockModal, setShowDemoBlockModal] = useState<boolean>(false);

  // Dynamic Frequencies from DatabaseService
  const [frequencies, setFrequencies] = useState<ExecutiveTripFrequency[]>(() =>
    databaseService.getExecutiveFrequencies().filter((f) => f.isActive)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setFrequencies(databaseService.getExecutiveFrequencies().filter((f) => f.isActive));
    };
    window.addEventListener('andesmovi_frequencies_updated', handleUpdate);
    return () => {
      window.removeEventListener('andesmovi_frequencies_updated', handleUpdate);
    };
  }, []);

  const [selectedFrequencyId, setSelectedFrequencyId] = useState<string>(() => {
    const active = databaseService.getExecutiveFrequencies().filter((f) => f.isActive);
    return active[0]?.id || 'freq-tul-uio-01';
  });

  const selectedFrequency: ExecutiveTripFrequency = useMemo(() => {
    return frequencies.find((f) => f.id === selectedFrequencyId) || frequencies[0] || {
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
    };
  }, [frequencies, selectedFrequencyId]);

  // Punto de abordaje / Parada en Origen
  const [tulcanStopText, setTulcanStopText] = useState(selectedFrequency.originTerminal);
  const [selectedTulcanStop, setSelectedTulcanStop] = useState(TULCAN_STOPS[0]);
  const [isCustomTulcan, setIsCustomTulcan] = useState(false);

  // Destino / Parada en Destino
  const [quitoStopText, setQuitoStopText] = useState(selectedFrequency.destinationTerminal);
  const [selectedQuitoStop, setSelectedQuitoStop] = useState(QUITO_STOPS[0]);
  const [isCustomQuito, setIsCustomQuito] = useState(false);

  // Handle switching frequency
  const handleSelectFrequency = (freq: ExecutiveTripFrequency) => {
    haptic.selection();
    setSelectedFrequencyId(freq.id);
    const defTurno = freq.departureTimes?.[0] || freq.departureTime || '06:00 AM';
    setSelectedTime(defTurno);
    setIsCustomTimeMode(false);
    setTulcanStopText(freq.originTerminal);
    setQuitoStopText(freq.destinationTerminal);
    setIsCustomTulcan(false);
    setIsCustomQuito(false);
    if (freq.originCity.toLowerCase().includes('quito')) {
      setDirection('quito_tulcan');
    } else {
      setDirection('tulcan_quito');
    }
  };

  // Coordenadas calculadas en tiempo real
  const currentOriginCoords: Coordinates = useMemo(() => {
    if (isCustomTulcan) {
      return {
        lat: selectedTulcanStop.lat,
        lng: selectedTulcanStop.lng,
        name: tulcanStopText || selectedFrequency.originTerminal,
        address: tulcanStopText || selectedFrequency.originTerminal,
      };
    }
    return {
      lat: selectedFrequency.originCoords?.lat ?? 0.8118,
      lng: selectedFrequency.originCoords?.lng ?? -77.7173,
      name: selectedFrequency.originTerminal,
      address: `${selectedFrequency.originTerminal}, ${selectedFrequency.originCity}`,
    };
  }, [selectedFrequency, isCustomTulcan, tulcanStopText, selectedTulcanStop]);

  const currentDestCoords: Coordinates = useMemo(() => {
    if (isCustomQuito) {
      return {
        lat: selectedQuitoStop.lat,
        lng: selectedQuitoStop.lng,
        name: quitoStopText || selectedFrequency.destinationTerminal,
        address: quitoStopText || selectedFrequency.destinationTerminal,
      };
    }
    return {
      lat: selectedFrequency.destinationCoords?.lat ?? -0.1807,
      lng: selectedFrequency.destinationCoords?.lng ?? -78.4678,
      name: selectedFrequency.destinationTerminal,
      address: `${selectedFrequency.destinationTerminal}, ${selectedFrequency.destinationCity}`,
    };
  }, [selectedFrequency, isCustomQuito, quitoStopText, selectedQuitoStop]);

  // Sincronizar automáticamente hacia el estado global
  useEffect(() => {
    if (onSelectOrigin) onSelectOrigin(currentOriginCoords);
    if (onSelectDestination) onSelectDestination(currentDestCoords);
  }, [currentOriginCoords, currentDestCoords, onSelectOrigin, onSelectDestination]);

  // Fechas de salida
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Firestore live trips para cupos
  const [liveTrips, setLiveTrips] = useState<any[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'trips'),
      (snapshot) => {
        const trips: any[] = [];
        snapshot.forEach((doc) => trips.push(doc.data()));
        setLiveTrips(trips);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const getOccupiedSeatsForSlot = (timeStr: string) => {
    const matching = liveTrips.filter((t) => {
      const notes = (t.notes || '').toLowerCase();
      return notes.includes(timeStr.toLowerCase()) && t.status !== 'cancelado';
    });
    const booked = matching.reduce(
      (acc, t) => acc + (t.fareBreakdown?.totalFareUsd ? Math.round(t.fareBreakdown.totalFareUsd / 25) : 1),
      0
    );
    return Math.min(4, booked);
  };

  // Hora de salida
  const [selectedTime, setSelectedTime] = useState<string>('06:00 AM');
  const [customTime, setCustomTime] = useState<string>('06:00');
  const [isCustomTimeMode, setIsCustomTimeMode] = useState<boolean>(false);

  // Pasajeros y asientos reservados en cabina (Croquis Interactivo)
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['asiento_1']);
  const [isWholeCar, setIsWholeCar] = useState<boolean>(false);

  const toggleSeatSelection = (seatId: string) => {
    haptic.selection();
    if (isWholeCar) {
      setIsWholeCar(false);
      setSelectedSeats([seatId]);
      return;
    }
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        if (prev.length <= 1) return prev; // Mantener al menos 1 asiento
        return prev.filter((id) => id !== seatId);
      } else {
        if (prev.length >= 4) return prev;
        return [...prev, seatId];
      }
    });
  };

  const toggleWholeCar = () => {
    haptic.selection();
    if (isWholeCar) {
      setIsWholeCar(false);
      setSelectedSeats(['asiento_1']);
    } else {
      setIsWholeCar(true);
      setSelectedSeats(['asiento_1', 'asiento_2', 'asiento_3', 'asiento_4']);
    }
  };

  const seatsCount = isWholeCar ? 4 : selectedSeats.length;

  // Equipaje
  const [luggageType, setLuggageType] = useState<string>('maleta_bodega');

  // Contacto del pasajero
  const [passengerPhone, setPassengerPhone] = useState<string>(currentUser?.phone || '+593 99 876 5432');
  const [passengerName, setPassengerName] = useState<string>(currentUser?.name || 'Pasajero Ejecutivo');
  const [notes, setNotes] = useState<string>('');

  // Sincronizar contacto si el usuario inicia sesión o se registra
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && currentUser.name.trim()) setPassengerName(currentUser.name);
      if (currentUser.phone && currentUser.phone.trim()) setPassengerPhone(currentUser.phone);
      setShowDemoBlockModal(false);
    }
  }, [currentUser]);

  // Captura GPS para Punto de Abordaje
  const [isLocatingBoarding, setIsLocatingBoarding] = useState(false);

  const handleCaptureGpsBoarding = (isTulcanTarget: boolean) => {
    if (!navigator.geolocation) {
      alert('La geolocalización GPS no está soportada en tu dispositivo.');
      return;
    }
    setIsLocatingBoarding(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let addressName = `Mi Ubicación GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        try {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          );
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.address) {
              const road =
                nomData.address.road ||
                nomData.address.pedestrian ||
                nomData.address.suburb ||
                nomData.address.neighbourhood;
              const city = nomData.address.city || nomData.address.town || 'Ecuador';
              if (road) addressName = `${road}, ${city}`;
              else if (nomData.display_name) addressName = nomData.display_name.split(',')[0];
            }
          }
        } catch {}

        setIsLocatingBoarding(false);

        if (isTulcanTarget) {
          setSelectedTulcanStop({
            id: 'custom_gps_tulcan',
            name: addressName,
            address: addressName,
            lat,
            lng,
            tag: 'GPS Vivo',
          });
          setTulcanStopText(addressName);
          setIsCustomTulcan(true);
        } else {
          setSelectedQuitoStop({
            id: 'custom_gps_quito',
            name: addressName,
            address: addressName,
            lat,
            lng,
            tag: 'GPS Vivo',
            basePriceUSD: 25,
          });
          setQuitoStopText(addressName);
          setIsCustomQuito(true);
        }
      },
      () => {
        setIsLocatingBoarding(false);
        alert('No se pudo obtener la ubicación GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Modal depósito
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [selectedDepositBank, setSelectedDepositBank] = useState<string>('pichincha');
  const [depositRefNum, setDepositRefNum] = useState<string>('');
  const [copiedAccountNum, setCopiedAccountNum] = useState<string | null>(null);

  // Tarifa fija oficial definida por el administrador en la frecuencia
  const fixedFarePerSeat = selectedFrequency?.pricePerSeatUsd ?? 25.0;
  const fixedFareWholeCar = fixedFarePerSeat * 4; // Auto completo oficial
  const totalFare = isWholeCar ? fixedFareWholeCar : seatsCount * fixedFarePerSeat;
  const depositPerSeat = selectedFrequency?.depositRequiredUsd ?? 10.0;
  const totalDeposit = isWholeCar ? depositPerSeat * 2 : depositPerSeat * seatsCount;

  // Confirmar reserva con depósito de anticipo
  const handleFinalConfirmWithDeposit = () => {
    haptic.confirmTrip();
    setShowDepositModal(false);

    const originCoords: Coordinates = currentOriginCoords;
    const destCoords: Coordinates = currentDestCoords;

    const finalTime = isCustomTimeMode ? customTime : selectedTime;
    const bankObj =
      COMPANY_DEPOSIT_BANK_ACCOUNTS.find((b) => b.id === selectedDepositBank) || COMPANY_DEPOSIT_BANK_ACCOUNTS[0];
    const refText = depositRefNum.trim() ? `Comprobante #${depositRefNum.trim()}` : 'Verificación por Banco';
    const depositNote = `[DEPÓSITO $${totalDeposit.toFixed(2)} USD OK] ${bankObj.bankName} (${refText}) | Saldo al abordar: $${Math.max(
      0,
      totalFare - totalDeposit
    ).toFixed(2)} USD`;

    const newAdvanceVoucher: ExecutiveSeatAdvanceVoucher = {
      id: `vch-${Date.now()}`,
      voucherCode: `ANT-EJEC-${Math.floor(1000 + Math.random() * 9000)}`,
      passengerName: passengerName.trim() || currentUser?.name || 'Pasajero Ejecutivo',
      passengerPhone: passengerPhone.trim() || currentUser?.phone || '+593 99 876 5432',
      passengerCedula: currentUser?.cedula || '1004721351',
      route: `${selectedFrequency.originCity} ➔ ${selectedFrequency.destinationCity} (${selectedFrequency.originTerminal} a ${selectedFrequency.destinationTerminal})`,
      departureDate: selectedDate,
      departureTime: finalTime,
      seatsCount: isWholeCar ? 4 : seatsCount,
      seatNumbers: isWholeCar
        ? ['Auto Completo VIP (4 Asientos)']
        : selectedSeats.map((id) => EXECUTIVE_CABIN_SEATS.find((s) => s.id === id)?.name || id),
      advanceAmountUsd: totalDeposit,
      totalFareUsd: totalFare,
      remainingAmountUsd: Math.max(0, totalFare - totalDeposit),
      destinationBank: bankObj.bankName,
      transferVoucherNumber: depositRefNum.trim() || `${Math.floor(100000 + Math.random() * 900000)}`,
      voucherPhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      status: 'pendiente_verificacion',
      submittedAt: Date.now(),
      submittedAtFormatted: new Date().toLocaleString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    try {
      const stored = localStorage.getItem('andesmovi_executive_vouchers');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newAdvanceVoucher);
      localStorage.setItem('andesmovi_executive_vouchers', JSON.stringify(list));
      window.dispatchEvent(new Event('andesmovi_executive_vouchers_updated'));
    } catch {}

    databaseService.createTrip({
      serviceType: 'ejecutivo_quito',
      passengerName: passengerName.trim() || currentUser?.name || 'Pasajero Ejecutivo',
      passengerPhone: passengerPhone.trim() || currentUser?.phone || '+593 99 876 5432',
      originAddress: originCoords.name,
      destinationAddress: destCoords.name,
      distanceKm: 280,
      durationMinutes: 210,
      paymentMethod: 'transferencia',
      cooperativaName: 'Coop. Ejecutiva AndesMovi Ecuador',
      terminalName: selectedFrequency.destinationTerminal,
      notes: `Frecuencia: ${finalTime} | Fecha: ${selectedDate} | Ruta: ${selectedFrequency.originCity} a ${selectedFrequency.destinationCity} | Asientos: ${
        isWholeCar
          ? 'Auto Completo VIP'
          : selectedSeats.map((id) => EXECUTIVE_CABIN_SEATS.find((s) => s.id === id)?.name || id).join(', ')
      } | Total: $${totalFare} | ${depositNote}`,
    });

    onConfirmBooking({
      origin: originCoords,
      destination: destCoords,
      seats: isWholeCar ? 4 : seatsCount,
      price: totalFare,
      departureDate: selectedDate,
      departureTime: finalTime,
      luggageType,
      notes: `${selectedFrequency.originCity} ➔ ${selectedFrequency.destinationCity} | Asientos: ${
        isWholeCar
          ? 'Auto Completo VIP'
          : selectedSeats.map((id) => EXECUTIVE_CABIN_SEATS.find((s) => s.id === id)?.name || id).join(', ')
      } | Equipaje: ${luggageType} | ${depositNote} | ${notes}`,
      direction: `${selectedFrequency.originCity.toLowerCase()}_${selectedFrequency.destinationCity.toLowerCase()}`,
    });
  };

  const selectedBankObj =
    COMPANY_DEPOSIT_BANK_ACCOUNTS.find((b) => b.id === selectedDepositBank) || COMPANY_DEPOSIT_BANK_ACCOUNTS[0];

  return (
    <div
      className={`w-full h-full min-h-screen overflow-y-auto pb-24 ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100/80 text-slate-900'
      }`}
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-5 py-4 flex flex-col gap-4">
        {/* ========================================================================= */}
        {/* 0. AVISO DE MODO DEMO (SOLO LECTURA SIN REGISTRO)                         */}
        {/* ========================================================================= */}
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
                  Puedes ver rutas, turnos y tarifas. Sin datos no puedes realizar reservas ejecutivas.
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
        {/* 1. BARRA SUPERIOR SIMPLIFICADA (UN SOLO BOTÓN DE REGRESO)                */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              onChangeService('viaje');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'bg-white border-slate-200 text-slate-800 shadow-xs hover:bg-slate-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Volver al Taxi</span>
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isDark
                  ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                  : 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
              }`}
            >
              ★ Viajes Ejecutivos
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BANNER COMPACTO DE RUTA Y TARIFA REGULADA                              */}
        {/* ========================================================================= */}
        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between gap-3 ${
            isDark
              ? 'bg-gradient-to-r from-blue-950/70 via-zinc-900 to-indigo-950/70 border-blue-500/30 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                Viajes Ejecutivos
              </h1>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 truncate font-semibold">
                {selectedFrequency.originCity} ➔ {selectedFrequency.destinationCity}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 block">
              ${fixedFarePerSeat.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400">por cupo</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SELECTOR DE RUTA Y FRECUENCIAS NACIONALES (TODO ECUADOR)               */}
        {/* ========================================================================= */}
        <div
          className={`p-4 rounded-2xl border flex flex-col gap-3 shadow-xs ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <label className={`text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${
              isDark ? 'text-blue-400' : 'text-blue-900'
            }`}>
              <span>🛣️</span>
              <span>Rutas y Frecuencias Disponibles ({frequencies.length}):</span>
            </label>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              Disponibles Hoy
            </span>
          </div>

          {/* Frequencies cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
            {frequencies.map((freq) => {
              const isSel = freq.id === selectedFrequencyId;
              const hasTurnos = Array.isArray(freq.departureTimes) && freq.departureTimes.length > 0;
              return (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => handleSelectFrequency(freq)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSel
                      ? isDark
                        ? 'bg-blue-950/80 border-blue-500 text-white shadow-md ring-1 ring-blue-500/50'
                        : 'bg-blue-50 border-blue-500 text-blue-950 shadow-sm ring-2 ring-blue-400/40'
                      : isDark
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`text-xs font-black block truncate ${
                      isSel ? (isDark ? 'text-white' : 'text-blue-950') : (isDark ? 'text-zinc-200' : 'text-slate-900')
                    }`}>
                      {freq.originCity} ➔ {freq.destinationCity}
                    </span>
                    <span className={`text-[10px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {freq.originTerminal}
                    </span>
                    {hasTurnos ? (
                      <span className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 ${
                        isDark ? 'text-amber-400' : 'text-amber-800 font-bold'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        <span>{freq.departureTimes.join(' · ')}</span>
                      </span>
                    ) : (
                      <span className={`text-[10px] italic flex items-center gap-1 mt-0.5 ${
                        isDark ? 'text-zinc-500' : 'text-slate-500'
                      }`}>
                        ⏳ Sin turnos aún
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
                    <span className={`text-[9px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>asiento</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PUNTOS DE SALIDA Y LLEGADA CONFIGURABLES                                */}
        {/* ========================================================================= */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3.5 shadow-xs ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* 4.1 Punto de Abordaje (Origen) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  1. Salida en {selectedFrequency.originCity} ({selectedFrequency.originProvince || 'Ecuador'}):
                </span>
              </label>

              <button
                type="button"
                onClick={() => handleCaptureGpsBoarding(true)}
                disabled={isLocatingBoarding}
                className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border cursor-pointer transition-all ${
                  isLocatingBoarding
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : isDark
                    ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                title="Capturar mi ubicación actual para recogida"
              >
                <Target className={`w-3 h-3 ${isLocatingBoarding ? 'animate-spin' : ''}`} />
                <span>{isLocatingBoarding ? 'Detectando...' : 'Mi GPS'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={tulcanStopText}
                onChange={(e) => {
                  setTulcanStopText(e.target.value);
                  setIsCustomTulcan(true);
                }}
                placeholder={`Ej: ${selectedFrequency.originTerminal}`}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* 4.2 Punto de Llegada (Destino) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  2. Llegada en {selectedFrequency.destinationCity} ({selectedFrequency.destinationProvince || 'Ecuador'}):
                </span>
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                value={quitoStopText}
                onChange={(e) => {
                  setQuitoStopText(e.target.value);
                  setIsCustomQuito(true);
                }}
                placeholder={`Ej: ${selectedFrequency.destinationTerminal}`}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. MAPA INTERACTIVO COMPACTO                                              */}
        {/* ========================================================================= */}
        <div className="w-full h-40 sm:h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xs relative">
          <React.Suspense fallback={<div className="w-full h-full bg-slate-900 animate-pulse" />}>
            <MapComponent
              isDarkMode={isDark}
              origin={currentOriginCoords}
              destination={currentDestCoords}
              serviceType="ejecutivo_quito"
              systemTariffs={systemTariffs}
            />
          </React.Suspense>
        </div>

        {/* ========================================================================= */}
        {/* 6. OPCIONES DE VIAJE: PASAJEROS (1 CLIC EN LUGAR DE BOTONES +/-)          */}
        {/* ========================================================================= */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 shadow-xs ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* ========================================================================= */}
          {/* 6.1 CROQUIS DE LA CABINA: RESERVAR ASIENTOS ESPECÍFICOS                  */}
          {/* ========================================================================= */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">💺</span>
                <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-zinc-200">
                  Reservar Asiento en Cabina (Croquis)
                </span>
              </div>

              {/* Botón rápido Auto Completo */}
              <button
                type="button"
                onClick={toggleWholeCar}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                  isWholeCar
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                    : isDark
                    ? 'bg-zinc-800 text-amber-400 border-zinc-700 hover:bg-zinc-750'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                }`}
              >
                {isWholeCar ? '✓ Auto Completo ($100 USD)' : '🚘 Auto Completo ($100 USD)'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 -mt-1">
              Toca directamente el asiento que deseas reservar en el vehículo:
            </p>

            {/* Representación gráfica de la cabina del vehículo */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col gap-3 ${
                isDark ? 'bg-zinc-950/80 border-zinc-800 shadow-inner' : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              {/* Barra superior de parabrisas */}
              <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                <span>🚗 Frente / Parabrisas</span>
                <span>Fila Delantera</span>
              </div>

              {/* FILA DELANTERA: Conductor (Izquierda) + Copiloto (Derecha) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Conductor asignado */}
                <div
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 opacity-70 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-xl">👨‍✈️</span>
                  <span className="text-xs font-black text-center">Conductor</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">
                    Asignado AndesMovi
                  </span>
                </div>

                {/* Copiloto / Asiento 1 */}
                {(() => {
                  const seat = EXECUTIVE_CABIN_SEATS[0]; // Copiloto
                  const isSelected = selectedSeats.includes(seat.id);
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      id={`exec-seat-${seat.id}`}
                      onClick={() => toggleSeatSelection(seat.id)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer active:scale-95 text-center ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                            : 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                          : isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-emerald-500/50'
                          : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-xs'
                      }`}
                    >
                      <div className="absolute top-1.5 right-1.5">
                        {isSelected ? (
                          <span className={`text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full shadow-xs ${
                            isDark ? 'bg-emerald-300 text-zinc-950' : 'bg-emerald-800 text-white'
                          }`}>
                            ✓ TU CUPO
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-500/10 px-1 rounded">
                            Libre
                          </span>
                        )}
                      </div>
                      <span className="text-xl mt-1">{seat.icon}</span>
                      <span className={`text-xs font-black ${isSelected ? (isDark ? 'text-zinc-950' : 'text-white') : (isDark ? 'text-white' : 'text-slate-900')}`}>
                        {seat.name}
                      </span>
                      <span className={`text-[10px] ${isSelected ? (isDark ? 'text-zinc-900 font-bold' : 'text-emerald-100 font-bold') : (isDark ? 'text-zinc-400' : 'text-slate-500')}`}>
                        {seat.sub}
                      </span>
                      <span
                        className={`text-[11px] font-mono font-black mt-0.5 ${
                          isSelected ? (isDark ? 'text-zinc-950' : 'text-white') : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        ${fixedFarePerSeat}.00 USD
                      </span>
                    </button>
                  );
                })()}
              </div>

              {/* Separador de pasillo / Fila Trasera */}
              <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 pt-1.5 border-t border-slate-200 dark:border-zinc-800">
                <span>Fila Trasera</span>
                <span>3 Cupos Disponibles</span>
              </div>

              {/* FILA TRASERA: Asiento 2, Asiento 3, Asiento 4 */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {EXECUTIVE_CABIN_SEATS.slice(1).map((seat) => {
                  const isSelected = selectedSeats.includes(seat.id);
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      id={`exec-seat-${seat.id}`}
                      onClick={() => toggleSeatSelection(seat.id)}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer active:scale-95 text-center ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                            : 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                          : isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-emerald-500/50'
                          : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-xs'
                      }`}
                    >
                      <div className="absolute top-1 right-1">
                        {isSelected ? (
                          <span className={`text-[7px] font-black font-mono px-1 py-0.2 rounded shadow-xs ${
                            isDark ? 'bg-emerald-300 text-zinc-950' : 'bg-emerald-800 text-white'
                          }`}>
                            ✓ TU CUPO
                          </span>
                        ) : (
                          <span className="text-[7px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                            Libre
                          </span>
                        )}
                      </div>
                      <span className="text-lg mt-1">{seat.icon}</span>
                      <span className={`text-[11px] font-black leading-tight ${isSelected ? (isDark ? 'text-zinc-950' : 'text-white') : (isDark ? 'text-white' : 'text-slate-900')}`}>
                        {seat.name}
                      </span>
                      <span className={`text-[9px] ${isSelected ? (isDark ? 'text-zinc-900 font-bold' : 'text-emerald-100') : (isDark ? 'text-zinc-400' : 'text-slate-500')}`}>
                        {seat.sub}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-black mt-0.5 ${
                          isSelected ? (isDark ? 'text-zinc-950' : 'text-white') : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        ${fixedFarePerSeat}.00
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Resumen dinámico de asientos */}
              <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs shadow-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-zinc-200 truncate">
                    {isWholeCar
                      ? 'Auto Completo VIP (4 Asientos Reservados)'
                      : `Asiento(s): ${selectedSeats
                          .map((id) => EXECUTIVE_CABIN_SEATS.find((s) => s.id === id)?.name || id)
                          .join(', ')}`}
                  </span>
                </div>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                  ${totalFare}.00 USD
                </span>
              </div>
            </div>
          </div>

          {/* 6.2 Fecha y Hora en una sola fila compacta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
            {/* Fecha */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500" />
                <span>Fecha de Salida:</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  haptic.selection();
                  setSelectedDate(e.target.value);
                }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                  isDark
                    ? 'bg-zinc-950 text-white border-zinc-700'
                    : 'bg-slate-50 text-slate-900 border-slate-300 focus:bg-white focus:border-blue-500'
                }`}
              />
            </div>

            {/* Hora y Turnos */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Turnos de Salida ({selectedFrequency.originCity} ➔ {selectedFrequency.destinationCity}):</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-500">
                  {selectedTime || 'Sin turno'}
                </span>
              </label>

              {/* Turnos pills configurados por la administración */}
              {(() => {
                const turnosList = Array.isArray(selectedFrequency.departureTimes) && selectedFrequency.departureTimes.length > 0
                  ? selectedFrequency.departureTimes
                  : (selectedFrequency.departureTime ? [selectedFrequency.departureTime] : []);

                if (turnosList.length === 0) {
                  return (
                    <div className={`p-2.5 rounded-xl border text-center ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-amber-400' : 'bg-amber-50/90 border-amber-200 text-amber-900'
                    }`}>
                      <span className="text-xs font-bold block">⏳ Sin turnos programados por el momento</span>
                      <span className="text-[10px] block opacity-80 mt-0.5">La administración publicará los horarios en breve.</span>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-wrap gap-1">
                    {turnosList.map((t) => {
                      const isSel = !isCustomTimeMode && selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setIsCustomTimeMode(false);
                            setSelectedTime(t);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md ring-2 ring-amber-300'
                              : isDark
                                ? 'bg-zinc-950 text-amber-400 border-zinc-700 hover:bg-zinc-800'
                                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50 shadow-xs'
                          }`}
                        >
                          ⏰ {t}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <select
                value={isCustomTimeMode ? 'custom' : selectedTime}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setIsCustomTimeMode(true);
                  } else {
                    setIsCustomTimeMode(false);
                    setSelectedTime(val);
                  }
                }}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer mt-1 ${
                  isDark
                    ? 'bg-zinc-950 text-white border-zinc-700'
                    : 'bg-slate-50 text-slate-900 border-slate-300 focus:bg-white'
                }`}
              >
                {(selectedFrequency.departureTimes && selectedFrequency.departureTimes.length > 0
                  ? selectedFrequency.departureTimes
                  : (selectedFrequency.departureTime ? [selectedFrequency.departureTime] : [])
                ).map((t) => (
                  <option key={t} value={t}>
                    ⏰ Turno {t} (Programado)
                  </option>
                ))}
                {(!selectedFrequency.departureTimes || selectedFrequency.departureTimes.length === 0) && !selectedFrequency.departureTime && (
                  <option value="">⏳ Esperando publicación de turnos</option>
                )}
                <option value="custom">🕒 Otra hora personalizada...</option>
              </select>
            </div>
          </div>

          {/* 6.3 Contacto Directo: Nombre y WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">
                Nombre del Pasajero:
              </label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-500'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">
                Teléfono / WhatsApp:
              </label>
              <input
                type="tel"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                placeholder="Ej. 0998765432"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-700 text-emerald-400'
                    : 'bg-slate-50 border-slate-300 text-emerald-700 focus:bg-white focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 7. RESUMEN DE TARIFA Y BOTÓN ÚNICO DE CONFIRMACIÓN                        */}
        {/* ========================================================================= */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col gap-3.5 ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Desglose rápido */}
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-zinc-800">
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-400 block">
                Total a Pagar
              </span>
              <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                {isWholeCar
                  ? 'Auto Completo Exclusivo'
                  : `${seatsCount} ${seatsCount === 1 ? 'asiento' : 'asientos'} × $${fixedFarePerSeat.toFixed(2)}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                ${totalFare.toFixed(2)} <span className="text-xs font-sans">USD</span>
              </span>
              <span className="text-[10px] block text-slate-500 dark:text-zinc-400">
                Anticipo $10.00 • Saldo al abordar ${Math.max(0, totalFare - 10)}.00
              </span>
            </div>
          </div>

          {/* ÚNICO BOTÓN PRINCIPAL DE ACCIÓN */}
          <button
            id="btn-confirm-executive-seat"
            type="button"
            disabled={isSearching}
            onClick={() => {
              if (!currentUser) {
                haptic.warning();
                setShowDemoBlockModal(true);
                return;
              }
              // Usuario registrado / con cuenta activa: autocompletar si falta y abrir reserva
              if (!passengerName.trim()) setPassengerName(currentUser.name || 'Cliente AndesMovi');
              if (!passengerPhone.trim()) setPassengerPhone(currentUser.phone || '+593 99 876 5432');

              haptic.confirmTrip();
              setShowDepositModal(true);
            }}
            className={`w-full py-3.5 px-5 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
              isSearching
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            <Ticket className="w-4 h-4 text-white" />
            <span>
              {isSearching
                ? 'Solicitando cupo...'
                : isWholeCar
                ? `Confirmar Reserva de Auto Completo ($${totalFare.toFixed(2)} USD)`
                : `Confirmar Reserva de ${seatsCount} Asiento${seatsCount > 1 ? 's' : ''} ($${totalFare.toFixed(2)} USD)`}
            </span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 8. Búsqueda activa (si está en curso) */}
        {isSearching && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
              <div>
                <span className="text-xs font-black text-amber-500 block">Asignando Conductor...</span>
                <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                  {seatsCount} asiento(s) reservados para {selectedDate} {isCustomTimeMode ? customTime : selectedTime}
                </span>
              </div>
            </div>

            {onCancelBooking && (
              <button
                type="button"
                onClick={onCancelBooking}
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ATENCIÓN Y CONTACTO CON LA CENTRAL ANDESMOVI (0978734844)                */}
        {/* ========================================================================= */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-xs block text-slate-900 dark:text-white">
                Central AndesMovi: 0978734844
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Atención 24/7 para reservas, encomiendas y despacho interprovincial
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="tel:0978734844"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Llamar Central</span>
            </a>
            <a
              href="https://wa.me/593978734844?text=Hola%20Central%20AndesMovi,%20deseo%20información%20del%20servicio%20Ejecutivo%20a%20Quito"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-all"
            >
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE DEPÓSITO SIMPLIFICADO ($10.00 USD)                                */}
      {/* ========================================================================= */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header modal */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏦</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Depósito de Reserva ($10.00 USD)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Garantiza tu asiento con depósito o transferencia
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido modal */}
            <div className="p-4 flex flex-col gap-3.5 overflow-y-auto max-h-[70vh]">
              {/* Selector de Banco */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">
                  Elige tu Banco o Cooperativa:
                </label>
                <select
                  value={selectedDepositBank}
                  onChange={(e) => setSelectedDepositBank(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                >
                  {COMPANY_DEPOSIT_BANK_ACCOUNTS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.icon} {b.bankName} ({b.badge})
                    </option>
                  ))}
                </select>
              </div>

              {/* Datos de la cuenta seleccionada */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400 block">
                    {selectedBankObj.accountType}: {selectedBankObj.accountNumber}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
                    Titular: {selectedBankObj.accountHolder} • C.I.: {selectedBankObj.identification}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.tap();
                    navigator.clipboard.writeText(selectedBankObj.accountNumber);
                    setCopiedAccountNum(selectedBankObj.accountNumber);
                    setTimeout(() => setCopiedAccountNum(null), 2500);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all flex-shrink-0 ${
                    copiedAccountNum === selectedBankObj.accountNumber
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isDark
                      ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 shadow-xs'
                  }`}
                >
                  {copiedAccountNum === selectedBankObj.accountNumber ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedAccountNum === selectedBankObj.accountNumber ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              {/* Referencia */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-400">
                  Número de Comprobante / Referencia:
                </label>
                <input
                  type="text"
                  value={depositRefNum}
                  onChange={(e) => setDepositRefNum(e.target.value)}
                  placeholder="Ej. 849201"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold focus:outline-none ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>

              {/* Botón de Confirmación Final */}
              <button
                type="button"
                onClick={handleFinalConfirmWithDeposit}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wide shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Confirmar Reserva ($10.00 USD)</span>
              </button>
            </div>
          </div>
        </div>
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
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">MODO DEMO (Solo Visualización)</h3>
                <p className="text-xs text-amber-400 font-bold">Sin datos no puedes reservar en Ejecutivo</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Estás en <strong>Modo Demostración</strong>. Puedes ver todas las rutas, frecuencias y paradas en vivo, pero para <strong>reservar asientos o confirmar viajes ejecutivos</strong> debes ingresar tus datos personales (Nombre y Teléfono) o registrarte en la aplicación.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              ℹ️ <strong>El registro para clientes es libre y toma 10 segundos</strong> (sin trabas de SRI ni Registro Civil).
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDemoBlockModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Seguir Viendo en Demo
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
                  <span>Registrarme (1 Paso)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

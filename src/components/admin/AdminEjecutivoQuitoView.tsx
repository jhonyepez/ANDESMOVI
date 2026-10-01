import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Plane,
  Navigation,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Shield,
  DollarSign,
  Send,
  Radio,
  ArrowRight,
  Search,
  Filter,
  Plus,
  RefreshCw,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  X,
  Building2,
  CreditCard,
  Eye,
  XCircle,
  FileCheck,
  Receipt,
  Ticket,
  Trash2,
  Check,
} from 'lucide-react';
import { Driver, AdminActiveTrip, AdminTripStatus, ExecutiveSeatAdvanceVoucher, ExecutiveTripFrequency, Coordinates } from '../../types';
import { databaseService } from '../../services/databaseService';
import { ECUADOR_GEOGRAPHY, ECUADOR_PROVINCE_COORDINATES, ECUADOR_CANTON_COORDINATES } from '../../data/ecuador_geography';
import { formatCurrency } from '../../utils/geoUtils';
import { haptic } from '../../utils/haptics';

const INITIAL_ADVANCE_VOUCHERS: ExecutiveSeatAdvanceVoucher[] = [
  {
    id: 'vch-101',
    voucherCode: 'ANT-EJEC-9841',
    passengerName: 'Dra. Gabriela Jaramillo',
    passengerPhone: '+593 99 456 7890',
    passengerCedula: '1003456789',
    route: 'Tulcán ➔ Quito (Parque La Carolina)',
    departureDate: '2026-09-29',
    departureTime: '06:00 AM',
    seatsCount: 2,
    seatNumbers: ['#1', '#2'],
    advanceAmountUsd: 10.0,
    totalFareUsd: 50.0,
    remainingAmountUsd: 40.0,
    destinationBank: 'Banco Pichincha (Cta Ahorros #2207472368)',
    transferVoucherNumber: '849201',
    voucherPhotoUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'pendiente_verificacion',
    submittedAt: Date.now() - 3600000,
    submittedAtFormatted: 'Hoy, 14:20',
  },
  {
    id: 'vch-102',
    voucherCode: 'ANT-EJEC-7723',
    passengerName: 'Ing. Roberto Andrade',
    passengerPhone: '+593 98 111 2233',
    passengerCedula: '0402233445',
    route: 'Quito (Parque La Carolina) ➔ Tulcán',
    departureDate: '2026-09-29',
    departureTime: '11:00 AM',
    seatsCount: 1,
    seatNumbers: ['#3'],
    advanceAmountUsd: 10.0,
    totalFareUsd: 25.0,
    remainingAmountUsd: 15.0,
    destinationBank: 'Produbanco (Cta Corriente #1200508492)',
    transferVoucherNumber: '100472',
    voucherPhotoUrl: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=600&auto=format&fit=crop&q=80',
    status: 'aprobado',
    adminNotes: 'Verificado en cuenta bancaria. Acreditado por Jhon Yepez.',
    submittedAt: Date.now() - 7200000,
    submittedAtFormatted: 'Hoy, 12:15',
  },
  {
    id: 'vch-103',
    voucherCode: 'ANT-EJEC-4412',
    passengerName: 'Lic. María Belén Narváez',
    passengerPhone: '+593 99 888 7766',
    passengerCedula: '1005544332',
    route: 'Tulcán ➔ Quito (Parque La Carolina)',
    departureDate: '2026-09-29',
    departureTime: '14:30 PM',
    seatsCount: 2,
    seatNumbers: ['#1', '#2'],
    advanceAmountUsd: 10.0,
    totalFareUsd: 50.0,
    remainingAmountUsd: 40.0,
    destinationBank: 'Banco Guayaquil / DeUna!',
    transferVoucherNumber: '559102',
    voucherPhotoUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    status: 'pendiente_verificacion',
    submittedAt: Date.now() - 1800000,
    submittedAtFormatted: 'Hace 30 min',
  },
];

interface AdminEjecutivoQuitoViewProps {
  drivers: Driver[];
  activeTrips: AdminActiveTrip[];
  onUpdateTripStatus: (tripId: string, status: AdminTripStatus) => void;
  onDispatchManualTrip?: (tripData: Partial<AdminActiveTrip>) => void;
  onOpenFareCalculator?: () => void;
  isDark?: boolean;
}

export interface ExecutiveDriverUnit {
  id: string;
  driverName: string;
  phone: string;
  cedula: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehicleColor: string;
  cooperativa: string;
  status: 'disponible_base' | 'en_ruta_aeropuerto' | 'embarcando' | 'en_espera_aeropuerto' | 'en_descanso';
  occupiedSeats: number;
  totalSeats: number;
  currentLocationName: string;
  destinationName: string;
  estimatedArrivalMinutes?: number;
  speedKmh?: number;
}

export interface ExecutiveAirportTrip {
  id: string;
  tripCode: string;
  passengerName: string;
  passengerPhone: string;
  passengerCedula?: string;
  flightCode?: string;
  airline?: string;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  assignedDriverId: string;
  assignedDriverName: string;
  assignedUnitPlate: string;
  assignedUnitModel: string;
  reservedSeats: number;
  pricePerSeatUsd: number;
  totalFareUsd: number;
  commissionAndesMoviUsd: number;
  status: 'programado' | 'embarcando' | 'en_ruta' | 'arribado_aeropuerto' | 'completado' | 'cancelado';
  notes?: string;
  hasLuggage: boolean;
  createdAt: number;
}

// Initial Mock data for Executive Drivers specializing in Quito / Airport routes
const INITIAL_EXECUTIVE_DRIVERS: ExecutiveDriverUnit[] = [
  {
    id: 'exec-drv-01',
    driverName: 'Marco Vinicio Benavides',
    phone: '+593 99 123 4567',
    cedula: '0400123456',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.98,
    totalTrips: 342,
    vehicleMake: 'Toyota',
    vehicleModel: 'Fortuner SW4 Executive',
    vehicleYear: 2024,
    vehiclePlate: 'PBA-4512',
    vehicleColor: 'Negro Metálico',
    cooperativa: 'Coop. Ejecutiva Carchi-Quito',
    status: 'en_ruta_aeropuerto',
    occupiedSeats: 3,
    totalSeats: 4,
    currentLocationName: 'Peaje de Oyacachi (Vía E35)',
    destinationName: 'Aeropuerto Mariscal Sucre (Tababela)',
    estimatedArrivalMinutes: 45,
    speedKmh: 88,
  },
  {
    id: 'exec-drv-02',
    driverName: 'Santiago Andrés Grijalva',
    phone: '+593 98 765 4321',
    cedula: '1002345678',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4.95,
    totalTrips: 289,
    vehicleMake: 'Chevrolet',
    vehicleModel: 'Captiva Premier',
    vehicleYear: 2023,
    vehiclePlate: 'GBA-9831',
    vehicleColor: 'Platino',
    cooperativa: 'Coop. Ejecutiva Norte',
    status: 'embarcando',
    occupiedSeats: 4,
    totalSeats: 4,
    currentLocationName: 'Terminal Terrestre Tulcán',
    destinationName: 'Quito Centro / Aeropuerto',
    estimatedArrivalMinutes: 180,
    speedKmh: 0,
  },
  {
    id: 'exec-drv-03',
    driverName: 'Bolívar Efrén Ruales',
    phone: '+593 99 987 1122',
    cedula: '0401122334',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
    totalTrips: 512,
    vehicleMake: 'Kia',
    vehicleModel: 'Sportage R Active',
    vehicleYear: 2024,
    vehiclePlate: 'TBA-7740',
    vehicleColor: 'Blanco Perla',
    cooperativa: 'Coop. Ejecutiva Interprovincial Carchi',
    status: 'disponible_base',
    occupiedSeats: 0,
    totalSeats: 4,
    currentLocationName: 'Matriz AndesMovi Tulcán',
    destinationName: 'Disponible para Ruta Tulcán ⇄ Quito',
    estimatedArrivalMinutes: 0,
    speedKmh: 0,
  },
  {
    id: 'exec-drv-04',
    driverName: 'Patricio Javier Narváez',
    phone: '+593 98 333 4455',
    cedula: '1005566778',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    rating: 4.92,
    totalTrips: 198,
    vehicleMake: 'Hyundai',
    vehicleModel: 'Tucson Limited',
    vehicleYear: 2023,
    vehiclePlate: 'CBA-2219',
    vehicleColor: 'Gris Grafito',
    cooperativa: 'Coop. Aeropuerto Express',
    status: 'en_espera_aeropuerto',
    occupiedSeats: 0,
    totalSeats: 4,
    currentLocationName: 'Aeropuerto Tababela (Quito)',
    destinationName: 'Retorno Tulcán Programado',
    estimatedArrivalMinutes: 0,
    speedKmh: 0,
  },
];

// Initial Mock Executive Trips to Airport
const INITIAL_AIRPORT_TRIPS: ExecutiveAirportTrip[] = [
  {
    id: 'exec-trip-101',
    tripCode: 'EXEC-7841',
    passengerName: 'Dra. Gabriela Jaramillo',
    passengerPhone: '+593 99 456 7890',
    passengerCedula: '1003456789',
    flightCode: 'AV-1620',
    airline: 'Avianca Ecuador',
    originAddress: 'Terminal Terrestre Tulcán',
    destinationAddress: 'Aeropuerto Mariscal Sucre (Tababela) - Salidas',
    departureTime: '06:00 AM (Hoy)',
    assignedDriverId: 'exec-drv-01',
    assignedDriverName: 'Marco Vinicio Benavides',
    assignedUnitPlate: 'PBA-4512',
    assignedUnitModel: 'Toyota Fortuner SW4',
    reservedSeats: 2,
    pricePerSeatUsd: 35.0,
    totalFareUsd: 70.0,
    commissionAndesMoviUsd: 6.00,
    status: 'en_ruta',
    notes: 'Pasajeros con equipaje prioritario. Conexión internacional.',
    hasLuggage: true,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'exec-trip-102',
    tripCode: 'EXEC-9023',
    passengerName: 'Ing. Roberto Andrade',
    passengerPhone: '+593 98 111 2233',
    passengerCedula: '0402233445',
    flightCode: 'LA-1432',
    airline: 'LATAM Airlines',
    originAddress: 'Hotel Carchi Imperial (Tulcán)',
    destinationAddress: 'Quito Norte (La Carolina / CCI)',
    departureTime: '14:30 PM (Hoy)',
    assignedDriverId: 'exec-drv-02',
    assignedDriverName: 'Santiago Andrés Grijalva',
    assignedUnitPlate: 'GBA-9831',
    assignedUnitModel: 'Chevrolet Captiva Premier',
    reservedSeats: 1,
    pricePerSeatUsd: 30.0,
    totalFareUsd: 30.0,
    commissionAndesMoviUsd: 3.00,
    status: 'embarcando',
    notes: 'Recogida en hotel y ruta directa por E35.',
    hasLuggage: true,
    createdAt: Date.now() - 1800000,
  },
];

export const AdminEjecutivoQuitoView: React.FC<AdminEjecutivoQuitoViewProps> = ({
  drivers,
  activeTrips,
  onUpdateTripStatus,
  onDispatchManualTrip,
  onOpenFareCalculator,
  isDark = true,
}) => {
  // State for Executive Drivers and Trips
  const [executiveDrivers, setExecutiveDrivers] = useState<ExecutiveDriverUnit[]>(INITIAL_EXECUTIVE_DRIVERS);
  const [airportTrips, setAirportTrips] = useState<ExecutiveAirportTrip[]>(INITIAL_AIRPORT_TRIPS);

  // Advance Transfer Vouchers State
  const [advanceVouchers, setAdvanceVouchers] = useState<ExecutiveSeatAdvanceVoucher[]>(() => {
    try {
      const stored = localStorage.getItem('andesmovi_executive_vouchers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ADVANCE_VOUCHERS;
  });

  const [voucherFilter, setVoucherFilter] = useState<'todos' | 'pendiente_verificacion' | 'aprobado' | 'rechazado'>('todos');
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [rejectingVoucher, setRejectingVoucher] = useState<ExecutiveSeatAdvanceVoucher | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    const handleVoucherUpdate = () => {
      try {
        const stored = localStorage.getItem('andesmovi_executive_vouchers');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setAdvanceVouchers(parsed);
        }
      } catch {}
    };
    window.addEventListener('andesmovi_executive_vouchers_updated', handleVoucherUpdate);
    return () => window.removeEventListener('andesmovi_executive_vouchers_updated', handleVoucherUpdate);
  }, []);

  const pendingVouchersCount = useMemo(() => {
    return advanceVouchers.filter((v) => v.status === 'pendiente_verificacion').length;
  }, [advanceVouchers]);

  const filteredVouchers = useMemo(() => {
    return advanceVouchers.filter((v) => {
      if (voucherFilter !== 'todos' && v.status !== voucherFilter) return false;
      return true;
    });
  }, [advanceVouchers, voucherFilter]);

  const handleApproveVoucher = (voucherId: string) => {
    haptic.success();
    const updated = advanceVouchers.map((v) =>
      v.id === voucherId
        ? { ...v, status: 'aprobado' as const, adminNotes: 'Comprobante de anticipo verificado en cuenta bancaria.' }
        : v
    );
    setAdvanceVouchers(updated);
    try {
      localStorage.setItem('andesmovi_executive_vouchers', JSON.stringify(updated));
    } catch {}
  };

  const handleConfirmRejectVoucher = () => {
    if (!rejectingVoucher) return;
    haptic.warning();
    const updated = advanceVouchers.map((v) =>
      v.id === rejectingVoucher.id
        ? { ...v, status: 'rechazado' as const, adminNotes: rejectReason.trim() || 'Comprobante no reflejado en cuenta bancaria.' }
        : v
    );
    setAdvanceVouchers(updated);
    try {
      localStorage.setItem('andesmovi_executive_vouchers', JSON.stringify(updated));
    } catch {}
    setRejectingVoucher(null);
    setRejectReason('');
  };

  const handleDeleteVoucher = (voucherId: string) => {
    haptic.tap();
    const updated = advanceVouchers.filter((v) => v.id !== voucherId);
    setAdvanceVouchers(updated);
    try {
      localStorage.setItem('andesmovi_executive_vouchers', JSON.stringify(updated));
    } catch {}
  };

  const handleClearProcessedVouchers = () => {
    haptic.tap();
    const updated = advanceVouchers.filter((v) => v.status === 'pendiente_verificacion');
    setAdvanceVouchers(updated);
    try {
      localStorage.setItem('andesmovi_executive_vouchers', JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteAirportTrip = (tripId: string) => {
    haptic.tap();
    setAirportTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  const handleClearFinishedAirportTrips = () => {
    haptic.tap();
    setAirportTrips((prev) => prev.filter((t) => t.status !== 'completado' && t.status !== 'cancelado'));
  };

  // Filters & Search
  const [tripFilter, setTripFilter] = useState<'todos' | 'en_ruta' | 'embarcando' | 'programado' | 'completado'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'todos' | 'disponibles' | 'en_ruta'>('todos');

  // =========================================================
  // GESTIÓN DE FRECUENCIAS Y RUTAS NACIONALES (ECUADOR)
  // =========================================================
  const [frequencies, setFrequencies] = useState<ExecutiveTripFrequency[]>(() =>
    databaseService.getExecutiveFrequencies()
  );
  const [freqSearchQuery, setFreqSearchQuery] = useState<string>('');
  const [freqOriginFilter, setFreqOriginFilter] = useState<string>('todos');
  const [showNewFrequencyModal, setShowNewFrequencyModal] = useState<boolean>(false);
  const [frequencySuccessMsg, setFrequencySuccessMsg] = useState<string | null>(null);

  // New Frequency Form State
  const [newOriginProvince, setNewOriginProvince] = useState<string>('Carchi');
  const [newOriginCanton, setNewOriginCanton] = useState<string>('Tulcán');
  const [newOriginTerminal, setNewOriginTerminal] = useState<string>('Terminal Terrestre Tulcán');
  const [newDestProvince, setNewDestProvince] = useState<string>('Pichincha');
  const [newDestCanton, setNewDestCanton] = useState<string>('Quito');
  const [newDestTerminal, setNewDestTerminal] = useState<string>('Parque La Carolina / Quicentro');
  const [newDepartureTime, setNewDepartureTime] = useState<string>('06:00 AM');
  const [newTurnosList, setNewTurnosList] = useState<string[]>(['06:00 AM', '10:00 AM', '05:00 PM']);
  const [newPricePerSeatUsd, setNewPricePerSeatUsd] = useState<number>(25.0);
  const [newDepositRequiredUsd, setNewDepositRequiredUsd] = useState<number>(10.0);
  const [newAvailableSeats, setNewAvailableSeats] = useState<number>(4);
  const [newVehicleType, setNewVehicleType] = useState<'auto' | 'confort' | 'camioneta' | 'van'>('auto');
  const [newNotes, setNewNotes] = useState<string>('Ruta directa por vía principal, climatizado, maletas incluidas.');

  // Sync frequencies when updated from databaseService
  useEffect(() => {
    const handleUpdate = () => {
      setFrequencies(databaseService.getExecutiveFrequencies());
    };
    window.addEventListener('andesmovi_frequencies_updated', handleUpdate);
    return () => {
      window.removeEventListener('andesmovi_frequencies_updated', handleUpdate);
    };
  }, []);

  const handleCreateNewFrequency = (e: React.FormEvent) => {
    e.preventDefault();
    haptic.success();

    const originCantonKey = newOriginCanton.toLowerCase().replace(/\s+/g, '');
    const originCoordInfo = ECUADOR_CANTON_COORDINATES[originCantonKey] || 
      ECUADOR_PROVINCE_COORDINATES[newOriginProvince.toLowerCase().replace(/\s+/g, '')] || {
        lat: 0.8122,
        lng: -77.7175,
        name: `${newOriginCanton} (${newOriginProvince})`,
        address: `${newOriginCanton}, ${newOriginProvince}, Ecuador`,
      };

    const destCantonKey = newDestCanton.toLowerCase().replace(/\s+/g, '');
    const destCoordInfo = ECUADOR_CANTON_COORDINATES[destCantonKey] || 
      ECUADOR_PROVINCE_COORDINATES[newDestProvince.toLowerCase().replace(/\s+/g, '')] || {
        lat: -0.1807,
        lng: -78.4678,
        name: `${newDestCanton} (${newDestProvince})`,
        address: `${newDestCanton}, ${newDestProvince}, Ecuador`,
      };

    const originCoords: Coordinates = {
      lat: originCoordInfo.lat,
      lng: originCoordInfo.lng,
      name: newOriginTerminal || `${newOriginCanton} (${newOriginProvince})`,
      address: `${newOriginTerminal ? newOriginTerminal + ', ' : ''}${newOriginCanton}, ${newOriginProvince}`,
    };

    const destCoords: Coordinates = {
      lat: destCoordInfo.lat,
      lng: destCoordInfo.lng,
      name: newDestTerminal || `${newDestCanton} (${newDestProvince})`,
      address: `${newDestTerminal ? newDestTerminal + ', ' : ''}${newDestCanton}, ${newDestProvince}`,
    };

    const allTurnos = Array.from(
      new Set(
        [
          newDepartureTime.trim(),
          ...newTurnosList,
        ].filter(Boolean)
      )
    );

    const codeNum = Math.floor(100 + Math.random() * 900);
    const newFreq: ExecutiveTripFrequency = {
      id: `freq-${Date.now()}`,
      code: `FREQ-${newOriginCanton.slice(0, 3).toUpperCase()}-${newDestCanton.slice(0, 3).toUpperCase()}-${codeNum}`,
      originCity: newOriginCanton,
      originProvince: newOriginProvince,
      originTerminal: newOriginTerminal || `Terminal Terrestre ${newOriginCanton}`,
      originCoords,
      destinationCity: newDestCanton,
      destinationProvince: newDestProvince,
      destinationTerminal: newDestTerminal || `Terminal / Punto ${newDestCanton}`,
      destinationCoords: destCoords,
      departureTime: allTurnos[0] || '06:00 AM',
      departureTimes: allTurnos.length > 0 ? allTurnos : ['06:00 AM'],
      pricePerSeatUsd: Math.max(1, Number(newPricePerSeatUsd) || 25.0),
      depositRequiredUsd: Math.max(0, Number(newDepositRequiredUsd) || 10.0),
      availableSeats: Math.max(1, Number(newAvailableSeats) || 4),
      daysOfWeek: ['Todos los días'],
      vehicleType: newVehicleType,
      notes: newNotes.trim() || 'Ruta ejecutiva AndesMovi',
      isActive: true,
      createdAt: Date.now(),
    };

    databaseService.addExecutiveFrequency(newFreq);
    setFrequencies(databaseService.getExecutiveFrequencies());
    setFrequencySuccessMsg(`¡Frecuencia ${newFreq.originCity} ➔ ${newFreq.destinationCity} con ${newFreq.departureTimes?.length || 1} turnos ($${newFreq.pricePerSeatUsd.toFixed(2)} USD) creada y publicada en el panel de clientes!`);
    setTimeout(() => setFrequencySuccessMsg(null), 5000);
    setShowNewFrequencyModal(false);
  };

  const handleToggleFrequencyStatus = (id: string) => {
    haptic.tap();
    databaseService.toggleExecutiveFrequencyStatus(id);
    setFrequencies(databaseService.getExecutiveFrequencies());
  };

  const handleDeleteFrequency = (id: string) => {
    haptic.tap();
    databaseService.deleteExecutiveFrequency(id);
    setFrequencies(databaseService.getExecutiveFrequencies());
    setFrequencySuccessMsg('Frecuencia eliminada del sistema.');
    setTimeout(() => setFrequencySuccessMsg(null), 4000);
  };

  const handleUpdateFrequencyPrice = (id: string, newPrice: number) => {
    haptic.tap();
    const freq = frequencies.find((f) => f.id === id);
    if (!freq) return;
    const updated: ExecutiveTripFrequency = {
      ...freq,
      pricePerSeatUsd: Math.max(1, Number(newPrice) || freq.pricePerSeatUsd),
    };
    databaseService.updateExecutiveFrequency(updated);
    setFrequencies(databaseService.getExecutiveFrequencies());
    setFrequencySuccessMsg(`¡Tarifa actualizada a $${updated.pricePerSeatUsd.toFixed(2)} USD para ${updated.originCity} ➔ ${updated.destinationCity}!`);
    setTimeout(() => setFrequencySuccessMsg(null), 4000);
  };

  const handleQuickAdjustPrice = (id: string, delta: number) => {
    haptic.selection();
    const freq = frequencies.find((f) => f.id === id);
    if (!freq) return;
    const newPrice = Math.max(1, Math.round((freq.pricePerSeatUsd + delta) * 100) / 100);
    handleUpdateFrequencyPrice(id, newPrice);
  };

  // State & Handlers for dedicated Price & Departure Schedule Editor
  const [editingFrequency, setEditingFrequency] = useState<ExecutiveTripFrequency | null>(null);
  const [editPricePerSeat, setEditPricePerSeat] = useState<number>(25);
  const [editDepositRequired, setEditDepositRequired] = useState<number>(10);
  const [editTurnosList, setEditTurnosList] = useState<string[]>([]);
  const [newTurnoInput, setNewTurnoInput] = useState<string>('');
  const [editDaysOfWeek, setEditDaysOfWeek] = useState<string[]>(['Todos los días']);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editOriginTerminal, setEditOriginTerminal] = useState<string>('');
  const [editDestTerminal, setEditDestTerminal] = useState<string>('');
  const [editAvailableSeats, setEditAvailableSeats] = useState<number>(4);
  const [editVehicleType, setEditVehicleType] = useState<'auto' | 'confort' | 'camioneta' | 'van'>('auto');

  const handleOpenEditFrequency = (freq: ExecutiveTripFrequency) => {
    haptic.tap();
    setEditingFrequency(freq);
    setEditPricePerSeat(freq.pricePerSeatUsd);
    setEditDepositRequired(freq.depositRequiredUsd);
    setEditTurnosList(
      freq.departureTimes && freq.departureTimes.length > 0
        ? [...freq.departureTimes]
        : (freq.departureTime ? [freq.departureTime] : ['06:00 AM'])
    );
    setNewTurnoInput('');
    setEditDaysOfWeek(freq.daysOfWeek && freq.daysOfWeek.length > 0 ? [...freq.daysOfWeek] : ['Todos los días']);
    setEditNotes(freq.notes || '');
    setEditOriginTerminal(freq.originTerminal || '');
    setEditDestTerminal(freq.destinationTerminal || '');
    setEditAvailableSeats(freq.availableSeats || 4);
    setEditVehicleType(freq.vehicleType || 'auto');
  };

  const handleAddTurnoToEditList = (turnoToAdd?: string) => {
    const t = (turnoToAdd || newTurnoInput).trim();
    if (!t) return;
    haptic.tap();
    if (!editTurnosList.includes(t)) {
      setEditTurnosList([...editTurnosList, t]);
    }
    setNewTurnoInput('');
  };

  const handleRemoveTurnoFromEditList = (turnoToRemove: string) => {
    haptic.tap();
    setEditTurnosList(editTurnosList.filter((t) => t !== turnoToRemove));
  };

  const handleSaveEditedFrequency = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingFrequency) return;
    haptic.success();

    const turnos = editTurnosList.length > 0 ? editTurnosList : ['06:00 AM'];
    const updated: ExecutiveTripFrequency = {
      ...editingFrequency,
      pricePerSeatUsd: Math.max(1, Number(editPricePerSeat) || 25),
      depositRequiredUsd: Math.max(0, Number(editDepositRequired) || 0),
      departureTime: turnos[0],
      departureTimes: turnos,
      daysOfWeek: editDaysOfWeek.length > 0 ? editDaysOfWeek : ['Todos los días'],
      notes: editNotes.trim() || 'Ruta ejecutiva AndesMovi',
      originTerminal: editOriginTerminal.trim() || editingFrequency.originTerminal,
      destinationTerminal: editDestTerminal.trim() || editingFrequency.destinationTerminal,
      availableSeats: Math.max(1, Number(editAvailableSeats) || 4),
      vehicleType: editVehicleType,
    };

    databaseService.updateExecutiveFrequency(updated);
    setFrequencies(databaseService.getExecutiveFrequencies());
    setFrequencySuccessMsg(
      `¡Tarifa y horarios de ${updated.originCity} ➔ ${updated.destinationCity} guardados! Tarifa: $${updated.pricePerSeatUsd.toFixed(2)} USD | Turnos: ${turnos.join(', ')}`
    );
    setTimeout(() => setFrequencySuccessMsg(null), 5000);
    setEditingFrequency(null);
  };

  // Manual Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [dispatchDriverId, setDispatchDriverId] = useState<string>(INITIAL_EXECUTIVE_DRIVERS[2]?.id || 'exec-drv-03');
  const [passengerName, setPassengerName] = useState<string>('Pasajero Ejecutivo');
  const [passengerPhone, setPassengerPhone] = useState<string>('+593 99 876 5432');
  const [passengerCedula, setPassengerCedula] = useState<string>('1004721351');
  const [originAddress, setOriginAddress] = useState<string>('Terminal Terrestre Tulcán (Matriz AndesMovi)');
  const [destinationAirport, setDestinationAirport] = useState<string>(
    'Aeropuerto Internacional Mariscal Sucre (Tababela) - Salidas Internacionales'
  );
  const [flightCode, setFlightCode] = useState<string>('AV-1620 / LATAM');
  const [airline, setAirline] = useState<string>('Avianca Ecuador');
  const [departureTime, setDepartureTime] = useState<string>('Salida Inmediata (Express Aeropuerto)');
  const [reservedSeats, setReservedSeats] = useState<number>(2);
  const [dispatchType, setDispatchType] = useState<'compartido' | 'express_privado'>('compartido');
  const [notes, setNotes] = useState<string>('Pasajeros con vuelo confirmado. Despacho prioritario por Vía E35.');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Computed metrics
  const totalVolumeUsd = useMemo(() => {
    return airportTrips.reduce((acc, t) => acc + (t.status !== 'cancelado' ? t.totalFareUsd : 0), 0);
  }, [airportTrips]);

  const totalSeatsSold = useMemo(() => {
    return airportTrips.reduce((acc, t) => acc + (t.status !== 'cancelado' ? t.reservedSeats : 0), 0);
  }, [airportTrips]);

  const activeUnitsInRoute = useMemo(() => {
    return executiveDrivers.filter((d) => d.status === 'en_ruta_aeropuerto' || d.status === 'embarcando').length;
  }, [executiveDrivers]);

  const availableUnits = useMemo(() => {
    return executiveDrivers.filter((d) => d.status === 'disponible_base').length;
  }, [executiveDrivers]);

  const originCitiesList = useMemo(() => {
    const list = Array.from(new Set(frequencies.map((f) => f.originCity))).filter(Boolean);
    return list.sort();
  }, [frequencies]);

  const filteredFrequencies = useMemo(() => {
    return frequencies.filter((f) => {
      const q = freqSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.originCity.toLowerCase().includes(q) ||
        f.destinationCity.toLowerCase().includes(q) ||
        f.originTerminal.toLowerCase().includes(q) ||
        f.destinationTerminal.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q);
      const matchesOrigin =
        freqOriginFilter === 'todos' || f.originCity.toLowerCase() === freqOriginFilter.toLowerCase();
      return matchesSearch && matchesOrigin;
    });
  }, [frequencies, freqSearchQuery, freqOriginFilter]);

  // Filtered Trips
  const filteredTrips = useMemo(() => {
    return airportTrips.filter((trip) => {
      if (tripFilter !== 'todos' && trip.status !== tripFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCode = trip.tripCode.toLowerCase().includes(q);
        const mPass = trip.passengerName.toLowerCase().includes(q);
        const mDriver = trip.assignedDriverName.toLowerCase().includes(q);
        const mFlight = trip.flightCode?.toLowerCase().includes(q);
        const mPlate = trip.assignedUnitPlate.toLowerCase().includes(q);
        if (!mCode && !mPass && !mDriver && !mFlight && !mPlate) return false;
      }
      return true;
    });
  }, [airportTrips, tripFilter, searchQuery]);

  // Filtered Drivers
  const filteredDrivers = useMemo(() => {
    return executiveDrivers.filter((driver) => {
      if (driverStatusFilter === 'disponibles') return driver.status === 'disponible_base';
      if (driverStatusFilter === 'en_ruta') return driver.status === 'en_ruta_aeropuerto';
      return true;
    });
  }, [executiveDrivers, driverStatusFilter]);

  // Handle Manual Dispatch Submission
  const handleExecuteDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerPhone.trim()) return;

    haptic.success();
    const selDriver = executiveDrivers.find((d) => d.id === dispatchDriverId) || executiveDrivers[0];
    const pricePerSeat = 25.0;
    const totalFare = dispatchType === 'express_privado' ? 95.0 : reservedSeats * pricePerSeat;
    const commission = dispatchType === 'express_privado' ? 12.0 : reservedSeats * 3.0;

    const newTrip: ExecutiveAirportTrip = {
      id: `exec-trp-${Date.now().toString().slice(-4)}`,
      tripCode: `EJEC-AERO-${Math.floor(1000 + Math.random() * 9000)}`,
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      passengerCedula: passengerCedula.trim(),
      flightCode: flightCode.trim(),
      airline: airline.trim(),
      originAddress: originAddress.trim(),
      destinationAddress: destinationAirport.trim(),
      departureTime,
      assignedDriverId: selDriver.id,
      assignedDriverName: selDriver.driverName,
      assignedUnitPlate: selDriver.vehiclePlate,
      assignedUnitModel: `${selDriver.vehicleMake} ${selDriver.vehicleModel}`,
      reservedSeats: dispatchType === 'express_privado' ? 4 : reservedSeats,
      pricePerSeatUsd: pricePerSeat,
      totalFareUsd: totalFare,
      commissionAndesMoviUsd: commission,
      status: 'en_ruta',
      notes: notes.trim(),
      hasLuggage: true,
      createdAt: Date.now(),
    };

    // Update Trips
    setAirportTrips((prev) => [newTrip, ...prev]);

    // Update driver status to en_ruta_aeropuerto
    setExecutiveDrivers((prev) =>
      prev.map((d) =>
        d.id === selDriver.id
          ? {
              ...d,
              status: 'en_ruta_aeropuerto',
              occupiedSeats: dispatchType === 'express_privado' ? 4 : reservedSeats,
              destinationName: destinationAirport,
              estimatedArrivalMinutes: 180,
              speedKmh: 65,
            }
          : d
      )
    );

    // Call prop dispatcher if provided
    if (onDispatchManualTrip) {
      onDispatchManualTrip({
        id: newTrip.id,
        tripCode: newTrip.tripCode,
        serviceType: 'ejecutivo_quito',
        passengerName: newTrip.passengerName,
        passengerPhone: newTrip.passengerPhone,
        originAddress: newTrip.originAddress,
        destinationAddress: newTrip.destinationAddress,
        distanceKm: 240.0,
        durationMinutes: 195,
        fareBreakdown: {
          baseFareUsd: 25.0,
          coveredKm: 240.0,
          extraKm: 0,
          extraKmRateUsd: 0,
          totalFareUsd: newTrip.totalFareUsd,
        },
        status: 'en_curso',
        paymentMethod: 'efectivo',
        paymentStatus: 'pagado',
        cooperativaName: selDriver.cooperativa,
        assignedDriverName: selDriver.driverName,
        assignedUnitNumber: selDriver.vehiclePlate,
        vehiclePlate: selDriver.vehiclePlate,
        notes: `SERVICIO EJECUTIVO AEROPUERTO: ${newTrip.flightCode || 'Directo'}`,
      });
    }

    setDispatchSuccessMsg(
      `✈️ ¡Unidad ${selDriver.vehiclePlate} (${selDriver.driverName}) despachada con éxito hacia el Aeropuerto Internacional Mariscal Sucre!`
    );
    setShowDispatchModal(false);

    setTimeout(() => {
      setDispatchSuccessMsg(null);
    }, 6000);
  };

  const handleAssignDriverToTrip = (tripId: string, newDriverId: string) => {
    haptic.success();
    const selDriver = executiveDrivers.find((d) => d.id === newDriverId);
    if (!selDriver) return;

    setAirportTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              assignedDriverId: selDriver.id,
              assignedDriverName: selDriver.driverName,
              assignedUnitPlate: selDriver.vehiclePlate,
              assignedUnitModel: `${selDriver.vehicleMake} ${selDriver.vehicleModel}`,
            }
          : t
      )
    );
  };

  // Change Trip Status
  const handleUpdateTripState = (
    tripId: string,
    newStatus: ExecutiveAirportTrip['status']
  ) => {
    haptic.tap();
    setAirportTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t))
    );

    // If completed or cancelled, release driver
    if (newStatus === 'completado' || newStatus === 'cancelado') {
      const trip = airportTrips.find((t) => t.id === tripId);
      if (trip) {
        setExecutiveDrivers((prev) =>
          prev.map((d) =>
            d.id === trip.assignedDriverId
              ? {
                  ...d,
                  status: 'disponible_base',
                  occupiedSeats: 0,
                  destinationName: 'Base Tulcán / Ibarra',
                  estimatedArrivalMinutes: 0,
                  speedKmh: 0,
                }
              : d
          )
        );
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* 1. HEADER & HERO BANNER */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 shadow-2xl relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-r from-blue-950 via-zinc-900 to-indigo-950 border-blue-500/60' 
          : 'bg-gradient-to-r from-blue-50 via-indigo-50/40 to-blue-50 border-blue-300 shadow-md'
      }`}>
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className={`p-2 rounded-xl border ${
                isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}>
                <Plane className="w-5 h-5 text-blue-500" />
              </span>
              <h2 className={`text-lg sm:text-xl font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                SERVICIO EJECUTIVO TULCÁN ⇄ QUITO (PARQUE LA CAROLINA) & TABABELA
              </h2>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border shadow-sm ${
                isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Ruta E35: Tulcán ⇄ Parque La Carolina</span>
              </span>
            </div>

            <p className={`text-xs sm:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              Monitoreo satelital y central de despacho interprovincial: <strong className={isDark ? 'text-white' : 'text-slate-900'}>Llegada a Quito en Parque La Carolina</strong> (Av. de los Shyris y Naciones Unidas) • <strong className={isDark ? 'text-white' : 'text-slate-900'}>Salida desde Parque La Carolina a Tulcán</strong> • Enlace especial a Tababela. Tarifa regulada de <strong className="text-amber-600 font-mono font-black">$25.00 USD</strong> por asiento.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {onOpenFareCalculator && (
              <button
                type="button"
                onClick={onOpenFareCalculator}
                className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span>Calculadora Tarifas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setShowNewFrequencyModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950 flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-emerald-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nueva Frecuencia (Ecuador)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setShowDispatchModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-950 flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-blue-400/40"
            >
              <Send className="w-4 h-4" />
              <span>Despachar Unidad al Aeropuerto</span>
            </button>
          </div>
        </div>

        {/* Success alert message for new frequencies */}
        {frequencySuccessMsg && (
          <div className={`mt-4 p-3.5 rounded-2xl border-2 text-xs font-bold flex items-center gap-3 animate-fadeIn shadow-lg ${
            isDark ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' : 'bg-emerald-50 border-emerald-400 text-emerald-800'
          }`}>
            <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{frequencySuccessMsg}</span>
          </div>
        )}

        {/* Success alert message */}
        {dispatchSuccessMsg && (
          <div className={`mt-4 p-3.5 rounded-2xl border-2 text-xs font-bold flex items-center gap-3 animate-fadeIn shadow-lg ${
            isDark ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' : 'bg-emerald-50 border-emerald-400 text-emerald-800'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{dispatchSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 2. REAL-TIME STATS / KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-2xl border-2 shadow-lg ${
          isDark ? 'bg-zinc-900 border-blue-500/40' : 'bg-white border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Unidades en Ruta</span>
            <Car className="w-4 h-4 text-blue-500" />
          </div>
          <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeUnitsInRoute}</span>
          <span className={`text-[11px] font-bold block mt-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Hacia Quito / Tababela
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 shadow-lg ${
          isDark ? 'bg-zinc-900 border-emerald-500/40' : 'bg-white border-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Asientos Reservados</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-500 font-mono">{totalSeatsSold} Pasajeros</span>
          <span className={`text-[11px] font-bold block mt-1 ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
            $25.00 USD tarifa regulada
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 shadow-lg ${
          isDark ? 'bg-zinc-900 border-amber-500/40' : 'bg-white border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Recaudación Servicio</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <span className={`text-2xl font-black font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
            {formatCurrency(totalVolumeUsd)}
          </span>
          <span className={`text-[11px] font-bold block mt-1 ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
            Comisión AndesMovi: {formatCurrency(totalSeatsSold * 3.0)}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border-2 shadow-lg ${
          isDark ? 'bg-zinc-900 border-purple-500/40' : 'bg-white border-purple-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Unidades Disponibles</span>
            <Radio className="w-4 h-4 text-purple-500" />
          </div>
          <span className={`text-2xl font-black font-mono ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{availableUnits} Unidades</span>
          <span className={`text-[11px] font-bold block mt-1 ${isDark ? 'text-purple-300/80' : 'text-purple-600'}`}>
            Listas para despacho inmediato
          </span>
        </div>
      </div>

      {/* 2.4 CENTRAL DE GESTIÓN DE FRECUENCIAS Y RUTAS NACIONALES (TODO ECUADOR) */}
      <div className={`p-5 rounded-3xl border-2 shadow-xl space-y-4 ${
        isDark ? 'bg-zinc-900 border-emerald-500/50' : 'bg-white border-emerald-300'
      }`}>
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-4 ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-2xl border flex-shrink-0 ${
              isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              <MapPin className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  FRECUENCIAS Y RUTAS NACIONALES (TODO ECUADOR)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black shadow-md flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                  {frequencies.filter((f) => f.isActive).length} Activas en Clientes
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {originCitiesList.length} Ciudades
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Crea nuevas rutas y frecuencias interprovinciales desde cualquier ciudad de Ecuador. Tú defines los precios por asiento en dólares y aparecen al instante en el panel del cliente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Restaurar las 6 rutas oficiales (Tulcán ⇄ Quito, Ibarra ⇄ Quito, Ibarra ⇄ Tulcán)?')) {
                  haptic.tap();
                  databaseService.resetToOfficialFrequencies();
                  setFrequencies(databaseService.getExecutiveFrequencies());
                  setFrequencySuccessMsg('¡Se han restaurado las 6 frecuencias oficiales!');
                  setTimeout(() => setFrequencySuccessMsg(null), 4000);
                }
              }}
              className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              title="Restaurar a las 6 rutas oficiales"
            >
              🔄 Rutas Oficiales (6)
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.tap();
                setShowNewFrequencyModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950 flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-emerald-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nueva Frecuencia</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* City filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setFreqOriginFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                freqOriginFilter === 'todos'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Todas las Ciudades ({frequencies.length})
            </button>
            {originCitiesList.map((city) => {
              const count = frequencies.filter((f) => f.originCity.toLowerCase() === city.toLowerCase()).length;
              const isSel = freqOriginFilter.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setFreqOriginFilter(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>{city}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-slate-950 text-white' : 'bg-zinc-700/50 text-zinc-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={freqSearchQuery}
              onChange={(e) => setFreqSearchQuery(e.target.value)}
              placeholder="Buscar origen, destino o código..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {freqSearchQuery && (
              <button
                type="button"
                onClick={() => setFreqSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Frequencies Cards Grid */}
        {filteredFrequencies.length === 0 ? (
          <div className={`text-center py-10 rounded-2xl border text-xs ${
            isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <MapPin className="w-9 h-9 mx-auto mb-2 text-emerald-500 opacity-50" />
            <p className={`font-bold text-sm ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
              No hay frecuencias encontradas con este filtro.
            </p>
            <p className={`mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Crea una nueva frecuencia desde cualquier punto de Ecuador usando el botón verde de arriba.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFrequencies.map((freq) => {
              return (
                <div
                  key={freq.id}
                  className={`p-4 rounded-2xl border-2 transition-all shadow-md flex flex-col justify-between gap-3 ${
                    isDark ? 'bg-zinc-950' : 'bg-white'
                  } ${
                    freq.isActive
                      ? isDark ? 'border-emerald-500/40 hover:border-emerald-500' : 'border-emerald-300 hover:border-emerald-500'
                      : 'border-zinc-700/50 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-emerald-500 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                        {freq.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleFrequencyStatus(freq.id)}
                        className={`px-2 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all active:scale-95 ${
                          freq.isActive
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isDark
                            ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                        title="Click para cambiar estado de la frecuencia"
                      >
                        {freq.isActive ? '✅ Activa en Clientes' : '⏸️ Pausada'}
                      </button>
                    </div>

                    {/* Route Details */}
                    <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                      isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold text-xs">🚀 Salida:</span>
                        <div className="min-w-0">
                          <strong className={`block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {freq.originCity} {freq.originProvince ? `(${freq.originProvince})` : ''}
                          </strong>
                          <span className={`text-[11px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {freq.originTerminal}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center my-0.5">
                        <ArrowRight className="w-4 h-4 text-emerald-500 opacity-60" />
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold text-xs">🏁 Destino:</span>
                        <div className="min-w-0">
                          <strong className={`block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {freq.destinationCity} {freq.destinationProvince ? `(${freq.destinationProvince})` : ''}
                          </strong>
                          <span className={`text-[11px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {freq.destinationTerminal}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing and Schedule Metrics */}
                    <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-center text-xs ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Horario
                        </span>
                        <span className={`font-mono font-black flex items-center justify-center gap-1 mt-0.5 ${
                          isDark ? 'text-amber-400' : 'text-amber-700'
                        }`}>
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{freq.departureTime}</span>
                        </span>
                      </div>

                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Tarifa Asiento
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-black text-emerald-500 text-sm block">
                            ${freq.pricePerSeatUsd.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustPrice(freq.id, -1)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                              title="Reducir $1.00 USD"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustPrice(freq.id, +1)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/50'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                              }`}
                              title="Aumentar $1.00 USD"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Anticipo
                        </span>
                        <span className={`font-mono font-bold block mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          ${freq.depositRequiredUsd.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Turnos Programados / Horarios fijados por el Administrador */}
                    <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                          isDark ? 'text-amber-400' : 'text-amber-800'
                        }`}>
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Turnos de Salida ({freq.departureTimes?.length || 1}):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditFrequency(freq)}
                          className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 active:scale-95"
                          title="Gestionar horarios y turnos de salida"
                        >
                          + Horarios
                        </button>
                      </div>

                      {(!freq.departureTimes || freq.departureTimes.length === 0) && (!freq.departureTime) ? (
                        <div className={`p-2 rounded-xl border text-[11px] w-full ${
                          isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          ⏳ <strong>Sin turnos asignados aún.</strong> Agrega horarios con el botón <em>+ Horarios</em>.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(freq.departureTimes && freq.departureTimes.length > 0
                            ? freq.departureTimes
                            : (freq.departureTime ? [freq.departureTime] : [])
                          ).map((t) => (
                            <span
                              key={t}
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                                isDark ? 'bg-zinc-950 text-amber-300 border-zinc-700' : 'bg-white text-amber-900 border-amber-300 shadow-xs'
                              }`}
                            >
                              <span>⏰ {t}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  databaseService.removeTurnoFromFrequency(freq.id, t);
                                  setFrequencies(databaseService.getExecutiveFrequencies());
                                }}
                                className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-black text-[9px] cursor-pointer ml-0.5"
                                title="Eliminar este turno"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes / Route info */}
                    {freq.notes && (
                      <p className={`text-[11px] italic truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        ℹ️ {freq.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className={`pt-2 border-t flex items-center justify-between gap-2 text-xs ${
                    isDark ? 'border-zinc-800' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditFrequency(freq)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                          isDark
                            ? 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                        title="Modificar precio y horarios de salida"
                      >
                        <span>✏️ Ajustar Precio y Horarios</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteFrequency(freq.id)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-rose-950 text-rose-400 border-zinc-700 hover:border-rose-500'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 hover:border-rose-400'
                        }`}
                        title="Eliminar frecuencia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2.5 CENTRAL DE RECEPCIÓN Y VERIFICACIÓN DE COMPROBANTES DE ANTICIPO DE ASIENTOS */}
      <div className={`p-5 rounded-3xl border-2 shadow-xl space-y-4 ${
        isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-white border-amber-300'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                <Receipt className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>CENTRAL DE COMPROBANTES DE ANTICIPOS DE ASIENTO (EJECUTIVO A QUITO)</span>
                  {pendingVouchersCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-bounce shadow-md">
                      {pendingVouchersCount} Pendiente{pendingVouchersCount > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Verificación en tiempo real de transferencias bancarias y depósitos ($10.00 USD por asiento) enviadas por clientes.
                </p>
              </div>
            </div>
          </div>

          {/* Filters for Vouchers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['todos', 'pendiente_verificacion', 'aprobado', 'rechazado'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setVoucherFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  voucherFilter === st
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {st === 'todos'
                  ? `Todos (${advanceVouchers.length})`
                  : st === 'pendiente_verificacion'
                  ? `Pendientes (${pendingVouchersCount})`
                  : st === 'aprobado'
                  ? 'Aprobados'
                  : 'Rechazados'}
              </button>
            ))}
          </div>

          {advanceVouchers.filter((v) => v.status !== 'pendiente_verificacion').length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas eliminar del registro todos los comprobantes aprobados o rechazados?')) {
                  handleClearProcessedVouchers();
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-400'
              }`}
              title="Limpiar comprobantes ya procesados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Procesados</span>
            </button>
          )}
        </div>

        {/* Vouchers list */}
        {filteredVouchers.length === 0 ? (
          <div className={`text-center py-8 rounded-2xl border text-xs ${
            isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <Receipt className="w-8 h-8 mx-auto mb-2 text-zinc-400 opacity-50" />
            <p className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>No hay comprobantes de anticipos registradas con este filtro.</p>
            <p className={isDark ? 'text-zinc-500 mt-1' : 'text-slate-400 mt-1'}>Cuando un pasajero reserva en Ejecutivo a Quito, el comprobante aparecerá aquí inmediatamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredVouchers.map((vch) => {
              const isPendiente = vch.status === 'pendiente_verificacion';
              const isAprobado = vch.status === 'aprobado';
              const isRechazado = vch.status === 'rechazado';

              return (
                <div
                  key={vch.id}
                  className={`p-4 rounded-2xl border-2 transition-all shadow-lg flex flex-col justify-between gap-3 ${
                    isDark ? 'bg-zinc-950' : 'bg-white'
                  } ${
                    isPendiente
                      ? 'border-amber-500/60 ring-1 ring-amber-500/20'
                      : isAprobado
                      ? 'border-emerald-500/40'
                      : 'border-rose-500/40 opacity-75'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-black text-amber-600 text-xs bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          {vch.voucherCode}
                        </span>
                        <h4 className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{vch.passengerName}</h4>
                        <span className={`text-[11px] font-mono block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          CI: {vch.passengerCedula || 'N/D'} • Tel: <a href={`tel:${vch.passengerPhone}`} className="text-blue-600 hover:underline">{vch.passengerPhone}</a>
                        </span>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                          isPendiente
                            ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                            : isAprobado
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-red-100 text-red-800 border-red-300'
                        }`}
                      >
                        {isPendiente ? '⏱️ Pendiente' : isAprobado ? '✅ Aprobado' : '❌ Rechazado'}
                      </span>
                    </div>

                    {/* Route and seat details */}
                    <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>🛣️ {vch.route}</span>
                      </div>
                      <div className={`flex items-center justify-between text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <span>📅 Fecha: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{vch.departureDate} ({vch.departureTime})</strong></span>
                        <span>💺 {vch.seatsCount} Asiento{vch.seatsCount > 1 ? 's' : ''} ({vch.seatNumbers.join(', ')})</span>
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-center text-xs ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Anticipo</span>
                        <span className="font-mono font-black text-amber-600">${vch.advanceAmountUsd.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total</span>
                        <span className={`font-mono font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>${vch.totalFareUsd.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Pendiente</span>
                        <span className="font-mono font-black text-emerald-600">${vch.remainingAmountUsd.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Bank and reference info */}
                    <div className="text-xs space-y-1">
                      <div className={`flex items-center justify-between ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        <span>🏦 Banco:</span>
                        <strong className={`truncate max-w-[170px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{vch.destinationBank}</strong>
                      </div>
                      <div className={`flex items-center justify-between font-mono ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        <span>📄 Comprobante #:</span>
                        <strong className="text-amber-600 font-black">#{vch.transferVoucherNumber}</strong>
                      </div>
                      <div className={`text-[10px] text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        Enviado: {vch.submittedAtFormatted}
                      </div>
                    </div>

                    {/* Photo proof preview */}
                    {vch.voucherPhotoUrl && (
                      <div className={`relative rounded-xl overflow-hidden border group ${
                        isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-slate-100'
                      }`}>
                        <img
                          src={vch.voucherPhotoUrl}
                          alt="Comprobante de depósito"
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedProofImg(vch.voucherPhotoUrl || null)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1.5 transition-opacity cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>Ver Comprobante Ampliado</span>
                        </button>
                      </div>
                    )}

                    {vch.adminNotes && (
                      <p className={`text-[11px] italic p-2 rounded-xl border ${
                        isDark ? 'text-zinc-400 bg-zinc-900/60 border-zinc-800' : 'text-slate-600 bg-slate-50 border-slate-200'
                      }`}>
                        Nota Admin: {vch.adminNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`pt-2 border-t flex items-center justify-between gap-2 flex-wrap ${
                    isDark ? 'border-zinc-800/80' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${vch.passengerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${vch.passengerName}, te saludamos de AndesMovi Central. Tu comprobante #${vch.transferVoucherNumber} para la reserva de asiento a Quito (${vch.route}) ha sido verificado.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-colors ${
                          isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar el comprobante #${vch.voucherCode} de ${vch.passengerName}?`)) {
                            handleDeleteVoucher(vch.id);
                          }
                        }}
                        className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          isDark ? 'bg-zinc-900 hover:bg-red-950 text-red-400 border-zinc-800 hover:border-red-500' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        }`}
                        title="Eliminar comprobante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isPendiente && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingVoucher(vch);
                            setRejectReason('');
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                            isDark ? 'bg-zinc-900 hover:bg-rose-950 text-rose-400 border-rose-500/30' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
                          }`}
                        >
                          Rechazar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveVoucher(vch.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. CONDUCTORES EJECUTIVOS ASIGNADOS AL SERVICIO */}
      <div className={`p-5 rounded-3xl border-2 shadow-xl space-y-4 ${
        isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div>
            <h3 className={`text-sm sm:text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Shield className="w-4 h-4 text-blue-500" />
              <span>FLOTA DE CONDUCTORES EJECUTIVOS AUTORIZADOS (ANT / COOPERATIVAS)</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Choferes profesionales con récord policial limpio, licencia profesional tipo C/E y vehículos climatizados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDriverStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                driverStatusFilter === 'todos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Todos ({executiveDrivers.length})
            </button>
            <button
              type="button"
              onClick={() => setDriverStatusFilter('disponibles')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                driverStatusFilter === 'disponibles'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Disponibles ({availableUnits})
            </button>
            <button
              type="button"
              onClick={() => setDriverStatusFilter('en_ruta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                driverStatusFilter === 'en_ruta'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              En Ruta ({activeUnitsInRoute})
            </button>
          </div>
        </div>

        {/* Driver Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDrivers.map((driver) => {
            const isEnRuta = driver.status === 'en_ruta_aeropuerto';
            const isEmbarcando = driver.status === 'embarcando';
            const isDisponible = driver.status === 'disponible_base';
            const isAeropuerto = driver.status === 'en_espera_aeropuerto';

            return (
              <div
                key={driver.id}
                className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-blue-500/50 transition-all shadow-md flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={driver.avatar}
                          alt={driver.driverName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-400/40 shadow-md"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                            isEnRuta
                              ? 'bg-blue-500 animate-ping'
                              : isEmbarcando
                              ? 'bg-amber-400'
                              : isDisponible
                              ? 'bg-emerald-500'
                              : 'bg-purple-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-white">{driver.driverName}</h4>
                          <span className="text-[11px] font-bold text-amber-400">★ {driver.rating}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono">
                          CI: {driver.cedula} • {driver.cooperativa}
                        </p>
                        <p className="text-[11px] text-zinc-300 font-medium">
                          Tel: <a href={`tel:${driver.phone}`} className="text-blue-400 hover:underline">{driver.phone}</a>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                        isEnRuta
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : isEmbarcando
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isDisponible
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {isEnRuta
                        ? 'En Ruta Aeropuerto'
                        : isEmbarcando
                        ? 'Embarcando Asientos'
                        : isDisponible
                        ? 'Disponible en Base'
                        : 'En Espera Tababela'}
                    </span>
                  </div>

                  {/* Vehicle specs and seat capacity */}
                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-200 block">
                        {driver.vehicleMake} {driver.vehicleModel} ({driver.vehicleYear})
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Placa: <strong className="text-white">{driver.vehiclePlate}</strong> • Color: {driver.vehicleColor}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block uppercase font-bold">Ocupación</span>
                      <span className="font-mono font-black text-amber-300 text-xs">
                        {driver.occupiedSeats} / {driver.totalSeats} Asientos
                      </span>
                    </div>
                  </div>

                  {/* Telemetry location */}
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="truncate">
                      Ubicación actual: <strong className="text-zinc-200">{driver.currentLocationName}</strong>
                    </span>
                  </div>
                  {driver.speedKmh ? (
                    <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Velocidad GPS: <strong className="text-emerald-400">{driver.speedKmh} km/h</strong> • ETA Tababela: ~{driver.estimatedArrivalMinutes} min</span>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/${driver.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(driver.driverName)},%20te%20escribimos%20desde%20la%20Central%20AndesMovi%20sobre%20el%20servicio%20Ejecutivo%20a%20Quito.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.tap();
                      setDispatchDriverId(driver.id);
                      setShowDispatchModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Despachar a Tababela</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MONITOREO DE CARRERAS ACTIVAS EN VIVO (EJECUTIVO A QUITO) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border-2 border-blue-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-500/40">
                <Plane className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                CARRERAS ACTIVAS Y PROGRAMADAS HACIA EL AEROPUERTO / QUITO
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Control de horarios de salida, aerolíneas, vuelos asignados y estado de entrega de pasajeros en Tababela.
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar código, pasajero, vuelo..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              {(['todos', 'en_ruta', 'embarcando', 'programado'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTripFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    tripFilter === st ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {st === 'todos' ? 'Todos' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {airportTrips.filter((t) => t.status === 'completado' || t.status === 'cancelado').length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas eliminar del registro todas las salidas completadas o canceladas?')) {
                    handleClearFinishedAirportTrips();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950 text-red-400 border border-zinc-700 hover:border-red-500 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Limpiar viajes terminados"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Finalizadas</span>
              </button>
            )}
          </div>
        </div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <div className={`text-center py-10 rounded-2xl border text-xs ${
            isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Plane className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'} opacity-50`} />
            <p className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>No hay carreras ejecutivas con los filtros seleccionados.</p>
            <p className={`mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Utiliza el botón de despacho para crear una nueva carrera al aeropuerto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => {
              const isEnRuta = trip.status === 'en_ruta';
              const isEmbarcando = trip.status === 'embarcando';
              const isProgramado = trip.status === 'programado';
              const isArribado = trip.status === 'arribado_aeropuerto';
              const isCompletado = trip.status === 'completado';

              return (
                <div
                  key={trip.id}
                  className={`p-4 rounded-2xl border transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-800 hover:border-blue-500/50'
                      : 'bg-white border-slate-200 hover:border-blue-500/60 shadow-slate-100'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`font-mono font-black px-2.5 py-0.5 rounded-lg border text-xs ${
                        isDark
                          ? 'text-blue-300 bg-blue-500/10 border-blue-500/30'
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}>
                        {trip.tripCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isEnRuta
                            ? isDark
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                              : 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                            : isEmbarcando
                            ? isDark
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isProgramado
                            ? isDark
                              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                            : isArribado
                            ? isDark
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-purple-100 text-purple-800 border border-purple-300'
                            : isDark
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {isEnRuta
                          ? 'En Ruta E35'
                          : isEmbarcando
                          ? 'Embarque Abierto'
                          : isProgramado
                          ? 'Programado'
                          : isArribado
                          ? 'Arribado a Tababela'
                          : 'Completado'}
                      </span>
                      {trip.flightCode && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                          isDark
                            ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                            : 'text-amber-800 bg-amber-50 border-amber-300'
                        }`}>
                          <Plane className="w-3 h-3" />
                          <span>Vuelo: {trip.flightCode} ({trip.airline})</span>
                        </span>
                      )}
                    </div>

                    {/* Route */}
                    <div className="space-y-1 text-xs">
                      <div className={`flex items-center justify-between gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className={`font-bold whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>Origen / Abordaje:</span>
                          <span className="truncate">{trip.originAddress}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.originAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[10px] font-bold border px-2 py-0.5 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-blue-950/80 text-blue-300 border-blue-500/50 hover:bg-blue-900'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            }`}
                            title="Navegar a punto de abordaje en Google Maps"
                          >
                            <span>🗺️ Google Maps</span>
                          </a>
                          <a
                            href={`https://waze.com/ul?q=${encodeURIComponent(trip.originAddress)}&navigate=yes`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[10px] font-bold border px-2 py-0.5 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                            }`}
                            title="Navegar a punto de abordaje en Waze"
                          >
                            <span>🧭 Waze</span>
                          </a>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Destino:</span>
                        <span className={`truncate font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.destinationAddress}</span>
                      </div>
                    </div>

                    {/* Passenger & Driver details */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      <div className="flex flex-col gap-1">
                        <div>
                          Pasajero: <strong className={isDark ? 'text-zinc-200' : 'text-slate-900'}>{trip.passengerName}</strong>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-mono font-bold text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{trip.passengerPhone}</span>
                          <a
                            href={`tel:${trip.passengerPhone}`}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            }`}
                            title="Llamada telefónica directa"
                          >
                            <span>📞 Llamar</span>
                          </a>
                          <a
                            href={`https://wa.me/${trip.passengerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-lg transition-colors ${
                              isDark
                                ? 'bg-green-950/80 text-green-300 border-green-500/50 hover:bg-green-900'
                                : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            }`}
                            title="Abrir chat de WhatsApp"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        </div>
                        {trip.passengerCedula ? <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>C.I. {trip.passengerCedula}</span> : null}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            isDark
                              ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            <Shield className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            <span>Unidad Asignada por la Empresa</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={trip.assignedDriverId}
                            onChange={(e) => handleAssignDriverToTrip(trip.id, e.target.value)}
                            className={`border rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-blue-400 cursor-pointer font-bold ${
                              isDark
                                ? 'bg-zinc-900 border-zinc-700 text-white'
                                : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                            title="Cambiar o Reasignar Conductor de la Empresa"
                          >
                            {executiveDrivers.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.driverName} — {d.vehicleMake} (Placa: {d.vehiclePlate})
                              </option>
                            ))}
                          </select>
                        </div>

                        <span className={`text-[10px] font-mono block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          Unidad Oficial: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{trip.assignedUnitPlate}</strong> • {trip.assignedUnitModel}
                        </span>
                      </div>
                    </div>

                    {trip.notes && (
                      <p className={`text-[11px] italic p-2 rounded-xl border ${
                        isDark ? 'text-zinc-400 bg-zinc-900/60 border-zinc-800/60' : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}>
                        Nota: {trip.notes}
                      </p>
                    )}
                  </div>

                  {/* Pricing & State actions */}
                  <div className={`flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 ${
                    isDark ? 'border-zinc-800' : 'border-slate-200'
                  } flex-shrink-0`}>
                    <div className="text-left lg:text-right">
                      <span className={`text-lg font-black font-mono block ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                        ${trip.totalFareUsd.toFixed(2)} USD
                      </span>
                      <span className={`text-[11px] block font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        {trip.reservedSeats} Asiento{trip.reservedSeats > 1 ? 's' : ''} (${trip.pricePerSeatUsd} c/u)
                      </span>
                      <span className={`text-[10px] font-mono block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        Comisión AndesMovi: ${trip.commissionAndesMoviUsd.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isProgramado && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTripState(trip.id, 'embarcando')}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                        >
                          Iniciar Embarque
                        </button>
                      )}

                      {isEmbarcando && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTripState(trip.id, 'en_ruta')}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" />
                          <span>Despachar a Ruta</span>
                        </button>
                      )}

                      {isEnRuta && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTripState(trip.id, 'arribado_aeropuerto')}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Plane className="w-3 h-3" />
                          <span>Marcar Arribado</span>
                        </button>
                      )}

                      {isArribado && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTripState(trip.id, 'completado')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completar y Liquidar</span>
                        </button>
                      )}

                      {!isCompletado && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTripState(trip.id, 'cancelado')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors border ${
                            isDark
                              ? 'bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-400 border-zinc-700'
                              : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border-slate-300'
                          }`}
                        >
                          Cancelar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar el registro de salida #${trip.tripCode || trip.id} hacia ${trip.destinationAddress}?`)) {
                            handleDeleteAirportTrip(trip.id);
                          }
                        }}
                        className={`p-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        }`}
                        title="Eliminar salida del registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL DE DESPACHO MANUAL DIRECTO AL AEROPUERTO */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left">
          <div className={`w-full max-w-xl rounded-3xl border-2 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp ${
            isDark
              ? 'border-blue-500/60 bg-zinc-950 text-white'
              : 'border-blue-400 bg-white text-slate-900 shadow-2xl'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-blue-100 text-blue-700 border-blue-300'
                }`}>
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Despacho Manual de Unidad al Aeropuerto</h4>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Aeropuerto Internacional Mariscal Sucre (Tababela) • Ruta E35
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteDispatch} className="space-y-4 text-xs">
              {/* Dispatch Type Selection */}
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Modalidad de Viaje Ejecutivo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchType('compartido')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      dispatchType === 'compartido'
                        ? isDark
                          ? 'bg-blue-950/60 border-blue-400 text-white shadow-md'
                          : 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                        : isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="font-black block text-xs">Reserva por Asiento</span>
                    <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>$25.00 USD por persona</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchType('express_privado')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      dispatchType === 'express_privado'
                        ? isDark
                          ? 'bg-blue-950/60 border-blue-400 text-white shadow-md'
                          : 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                        : isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="font-black block text-xs">Vehículo Exclusivo Directo</span>
                    <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>$95.00 USD puerta a puerta</span>
                  </button>
                </div>
              </div>

              {/* Driver selection */}
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                  Seleccionar Conductor / Unidad Ejecutiva
                </label>
                <select
                  value={dispatchDriverId}
                  onChange={(e) => setDispatchDriverId(e.target.value)}
                  className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-bold ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {executiveDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.driverName} — {d.vehicleMake} {d.vehicleModel} (Placa: {d.vehiclePlate}) • {d.status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rutas Rápidas Preconfiguradas (Tulcán ⇄ Parque La Carolina / Aeropuerto) */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Rutas Ejecutivas Frecuentes
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOriginAddress('Terminal Terrestre Tulcán (Matriz AndesMovi)');
                      setDestinationAirport('Parque La Carolina (Av. de los Shyris y Naciones Unidas) - Quito Norte');
                      setDepartureTime('03:00 AM (Tulcán ➔ Llegada Parque La Carolina)');
                      setFlightCode('Conexión Centro Norte');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-emerald-500/40'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                    }`}
                  >
                    <span className={`font-black block text-[11px] ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>🚀 Tulcán ➔ Parque La Carolina</span>
                    <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Llegada a Quito Norte (Shyris / CCI)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOriginAddress('Parque La Carolina (Av. de los Shyris y Naciones Unidas), Quito');
                      setDestinationAirport('Terminal Terrestre Tulcán (Matriz AndesMovi)');
                      setDepartureTime('11:00 AM (Salida Parque La Carolina ➔ Tulcán)');
                      setFlightCode('Retorno Interprovincial E35');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-blue-500/40'
                        : 'bg-blue-50 hover:bg-blue-100 border-blue-300'
                    }`}
                  >
                    <span className={`font-black block text-[11px] ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>🔄 Salida Parque La Carolina ➔ Tulcán</span>
                    <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Salida directa desde Quito a Tulcán</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOriginAddress('Terminal Terrestre Tulcán / Ibarra');
                      setDestinationAirport('Aeropuerto Internacional Mariscal Sucre (Tababela) - Salidas Internacionales');
                      setDepartureTime('Salida Inmediata (Express Aeropuerto)');
                      setFlightCode('AV-1620 / LATAM');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 border-amber-500/40'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-300'
                    }`}
                  >
                    <span className={`font-black block text-[11px] ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>✈️ Enlace Tababela Aeropuerto</span>
                    <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Puerta Salidas Internacionales</span>
                  </button>
                </div>
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Origen (Punto de Salida)</label>
                  <input
                    type="text"
                    value={originAddress}
                    onChange={(e) => setOriginAddress(e.target.value)}
                    placeholder="Parque La Carolina / Terminal Tulcán"
                    className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setOriginAddress('Terminal Terrestre Tulcán (Matriz AndesMovi)')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer ${
                        isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Terminal Tulcán
                    </button>
                    <button
                      type="button"
                      onClick={() => setOriginAddress('Parque La Carolina (Av. de los Shyris y Naciones Unidas), Quito')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] cursor-pointer ${
                        isDark ? 'bg-zinc-800 text-blue-300 hover:text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      Parque La Carolina
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Destino (Punto de Llegada)</label>
                  <select
                    value={destinationAirport}
                    onChange={(e) => setDestinationAirport(e.target.value)}
                    className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Parque La Carolina (Av. de los Shyris y Naciones Unidas) - Quito Norte">
                      Quito Norte: Parque La Carolina (Av. de los Shyris / CCI)
                    </option>
                    <option value="Terminal Terrestre Tulcán (Matriz AndesMovi)">
                      Tulcán: Terminal Terrestre (Matriz AndesMovi)
                    </option>
                    <option value="Aeropuerto Internacional Mariscal Sucre (Tababela) - Salidas Internacionales">
                      Tababela - Salidas Internacionales (Puerta 3)
                    </option>
                    <option value="Aeropuerto Internacional Mariscal Sucre (Tababela) - Salidas Nacionales">
                      Tababela - Salidas Nacionales (Puerta 1 y 2)
                    </option>
                    <option value="Aeropuerto Mariscal Sucre - Terminal de Carga Aérea">
                      Tababela - Terminal de Carga Aérea
                    </option>
                    <option value="Hotel Wyndham Quito Airport (Tababela)">
                      Hotel Wyndham Quito Airport
                    </option>
                    <option value="Terminal Carcelén (Norte de Quito)">
                      Terminal Carcelén (Norte de Quito)
                    </option>
                    <option value="Terminal Quitumbe (Sur de Quito)">
                      Terminal Quitumbe (Sur de Quito)
                    </option>
                  </select>
                </div>
              </div>

              {/* Flight info & departure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Código de Vuelo</label>
                  <input
                    type="text"
                    value={flightCode}
                    onChange={(e) => setFlightCode(e.target.value)}
                    placeholder="ej: AV-1620 / LA-1412"
                    className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Aerolínea</label>
                  <select
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Avianca Ecuador">Avianca Ecuador</option>
                    <option value="LATAM Ecuador">LATAM Ecuador</option>
                    <option value="Iberia">Iberia (Vuelo a Madrid)</option>
                    <option value="KLM Royal Dutch">KLM Royal Dutch (Ámsterdam)</option>
                    <option value="Air Europa">Air Europa</option>
                    <option value="American Airlines">American Airlines</option>
                    <option value="Delta Air Lines">Delta Air Lines</option>
                    <option value="Copa Airlines">Copa Airlines (Panamá)</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Horario de Salida</label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="ej: Salida Inmediata"
                    className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Passenger details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Nombre del Pasajero *</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Nombres completos"
                    className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Teléfono Móvil (+593) *</label>
                  <input
                    type="tel"
                    required
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="099XXXXXXX"
                    className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {dispatchType === 'compartido' ? (
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Número de Asientos</label>
                    <select
                      value={reservedSeats}
                      onChange={(e) => setReservedSeats(Number(e.target.value))}
                      className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value={1}>1 Asiento ($25.00)</option>
                      <option value={2}>2 Asientos ($50.00)</option>
                      <option value={3}>3 Asientos ($75.00)</option>
                      <option value={4}>4 Asientos ($100.00)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Tarifa Fija Exclusiva</label>
                    <div className={`w-full border rounded-2xl px-3 py-2 text-xs font-mono font-bold ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    }`}>
                      $95.00 USD (Vehículo Completo)
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Notas / Equipaje</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre equipaje, paradas en el camino, etc."
                  className={`w-full border rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Total Summary */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isDark
                  ? 'bg-blue-950/60 border-blue-500/40 text-white'
                  : 'bg-blue-50 border-blue-200 text-slate-900'
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Total a Cobrar al Pasajero:</span>
                  <span className={`text-lg font-black font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                    ${(dispatchType === 'express_privado' ? 95 : reservedSeats * 25).toFixed(2)} USD
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Comisión AndesMovi:</span>
                  <span className={`text-xs font-mono font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    ${(dispatchType === 'express_privado' ? 12.0 : reservedSeats * 3.0).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirmar y Despachar Unidad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DE ZOOM DE COMPROBANTE BANCARIO */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn text-center">
          <div className={`relative max-w-2xl w-full p-4 rounded-3xl border-2 shadow-2xl space-y-3 ${
            isDark ? 'bg-zinc-950 border-amber-500/60' : 'bg-white border-amber-400'
          }`}>
            <div className="flex items-center justify-between px-2 pt-1">
              <span className={`text-xs font-black flex items-center gap-2 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                <Receipt className="w-4 h-4" />
                <span>Comprobante de Transferencia / Depósito de Anticipo</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedProofImg(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl max-h-[75vh] flex items-center justify-center bg-black">
              <img src={selectedProofImg} alt="Comprobante ampliado" className="max-h-[70vh] object-contain rounded-xl" />
            </div>
            <div className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
              isDark ? 'bg-zinc-900/80 text-zinc-300' : 'bg-slate-100 text-slate-700'
            }`}>
              <span>Inspección de seguridad para verificar número de transacción y valor.</span>
              <button
                type="button"
                onClick={() => setSelectedProofImg(null)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL DE RECHAZO DE COMPROBANTE DE ANTICIPO */}
      {rejectingVoucher && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left">
          <div className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 ${
            isDark ? 'border-rose-500/60 bg-zinc-950 text-white' : 'border-rose-300 bg-white text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 text-rose-500 font-black text-sm">
                <XCircle className="w-5 h-5" />
                <span>Rechazar Comprobante de Anticipo</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingVoucher(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            <div className={`text-xs space-y-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              <p>
                Indica el motivo de rechazo del comprobante <strong className={`font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>#{rejectingVoucher.transferVoucherNumber}</strong> de <strong>{rejectingVoucher.passengerName}</strong>:
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: La transferencia no se refleja en la cuenta de Banco Pichincha o el número de comprobante es ilegible."
                className={`w-full border rounded-2xl p-3 text-xs focus:outline-none focus:border-rose-500 ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingVoucher(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectVoucher}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.5. MODAL DE AJUSTE DE PRECIO Y HORARIOS DE SALIDA (FRECUENCIAS EJECUTIVAS) */}
      {editingFrequency && (
        <div className="fixed inset-0 z-[10002] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-3xl border-2 p-5 sm:p-6 shadow-2xl space-y-4 my-8 transition-all animate-scaleUp text-left ${
              isDark ? 'bg-zinc-950 border-emerald-500/70 text-white' : 'bg-white border-emerald-300 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b pb-3.5 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <Clock className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    <span>AJUSTAR PRECIO Y HORARIOS DE SALIDA</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black uppercase font-mono">
                      {editingFrequency.code}
                    </span>
                  </h3>
                  <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Ruta: <strong className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>{editingFrequency.originCity} ({editingFrequency.originProvince || 'Ecuador'})</strong> ➔ <strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>{editingFrequency.destinationCity} ({editingFrequency.destinationProvince || 'Ecuador'})</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingFrequency(null)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedFrequency} className="space-y-4">
              {/* 1. SECCIÓN: AJUSTAR PRECIO POR ASIENTO */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/70 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-800'
                  }`}>
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>1. Tarifa por Asiento / Pasajero (USD)</span>
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                    ${Number(editPricePerSeat).toFixed(2)} USD
                  </span>
                </div>

                {/* Stepper + Direct Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Precio Directo ($ USD)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditPricePerSeat(Math.max(1, Math.round((editPricePerSeat - 5) * 100) / 100))}
                        className={`px-2.5 py-2 rounded-xl text-xs font-black border transition-colors cursor-pointer ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        -$5
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPricePerSeat(Math.max(1, Math.round((editPricePerSeat - 1) * 100) / 100))}
                        className={`px-2.5 py-2 rounded-xl text-xs font-black border transition-colors cursor-pointer ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        -$1
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        step="0.5"
                        required
                        value={editPricePerSeat}
                        onChange={(e) => setEditPricePerSeat(parseFloat(e.target.value) || 0)}
                        className={`flex-1 px-3 py-2 rounded-xl border text-center font-mono font-black text-base focus:outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setEditPricePerSeat(Math.round((editPricePerSeat + 1) * 100) / 100)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-black border transition-colors cursor-pointer ${
                          isDark ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        +$1
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPricePerSeat(Math.round((editPricePerSeat + 5) * 100) / 100)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-black border transition-colors cursor-pointer ${
                          isDark ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-700/60' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        +$5
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Anticipo Requerido ($ USD para reservar asiento)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[0, 5, 10, 15].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setEditDepositRequired(amt)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            editDepositRequired === amt
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                              : isDark
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={editDepositRequired}
                        onChange={(e) => setEditDepositRequired(parseFloat(e.target.value) || 0)}
                        className={`w-16 px-2 py-2 rounded-xl border text-center font-mono font-bold text-xs focus:outline-none focus:border-amber-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-amber-300' : 'bg-white border-slate-300 text-amber-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Precios Frecuentes Rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-dashed border-zinc-700/40">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Tarifas Sugeridas:
                  </span>
                  {[12, 15, 20, 25, 30, 35, 40].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPricePerSeat(p)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                        editPricePerSeat === p
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-xs'
                          : isDark
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      ${p}.00
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. SECCIÓN: AJUSTAR HORARIOS DE SALIDA / TURNOS */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/70 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${
                    isDark ? 'text-amber-400' : 'text-amber-800'
                  }`}>
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>2. Horarios de Salida y Turnos Programados ({editTurnosList.length})</span>
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Los clientes eligen entre estos horarios
                  </span>
                </div>

                {/* Active Turnos Tags */}
                <div>
                  <label className={`block text-[11px] font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Turnos Activos para esta Frecuencia:
                  </label>
                  {editTurnosList.length === 0 ? (
                    <p className="text-xs text-rose-400 italic">
                      ⚠️ No has agregado turnos. Agrega al menos uno usando los botones o el campo abajo.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {editTurnosList.map((t, idx) => (
                        <span
                          key={t}
                          className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold transition-all shadow-xs ${
                            idx === 0
                              ? isDark
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                              : isDark
                              ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                              : 'bg-white text-slate-800 border-slate-300'
                          }`}
                        >
                          <span>⏰ {t} {idx === 0 && <span className="text-[9px] font-sans font-bold opacity-75">(Principal)</span>}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTurnoFromEditList(t)}
                            className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-black text-xs cursor-pointer ml-1"
                            title="Eliminar este horario"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Add Hour Chips */}
                <div className="space-y-1.5 pt-1 border-t border-dashed border-zinc-700/40">
                  <span className={`text-[10px] font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    + Añadir Horario Rápido (Click para agregar):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      '04:00 AM',
                      '05:30 AM',
                      '06:00 AM',
                      '07:30 AM',
                      '09:00 AM',
                      '10:30 AM',
                      '12:00 PM',
                      '01:30 PM',
                      '03:00 PM',
                      '04:30 PM',
                      '06:00 PM',
                      '07:30 PM',
                      '09:00 PM',
                      '11:00 PM',
                    ].map((hr) => (
                      <button
                        key={hr}
                        type="button"
                        onClick={() => handleAddTurnoToEditList(hr)}
                        disabled={editTurnosList.includes(hr)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          editTurnosList.includes(hr)
                            ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
                            : isDark
                            ? 'bg-zinc-800 hover:bg-amber-950 text-amber-300 border-zinc-700 hover:border-amber-500'
                            : 'bg-white hover:bg-amber-50 text-amber-900 border-slate-300'
                        }`}
                      >
                        + {hr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Time Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ej: 08:15 AM o 15:45 PM"
                    value={newTurnoInput}
                    onChange={(e) => setNewTurnoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTurnoToEditList();
                      }
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTurnoToEditList()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer active:scale-95 shadow-sm"
                  >
                    + Agregar Horario
                  </button>
                </div>
              </div>

              {/* 3. TERMINALES Y NOTAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Terminal de Origen ({editingFrequency.originCity})
                  </label>
                  <input
                    type="text"
                    value={editOriginTerminal}
                    onChange={(e) => setEditOriginTerminal(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Terminal / Parada Destino ({editingFrequency.destinationCity})
                  </label>
                  <input
                    type="text"
                    value={editDestTerminal}
                    onChange={(e) => setEditDestTerminal(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingFrequency(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Tarifa y Horarios de Salida</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL DE CREACIÓN DE NUEVA FRECUENCIA INTERPROVINCIAL (ECUADOR) */}
      {showNewFrequencyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-3xl border-2 p-5 sm:p-6 shadow-2xl space-y-4 my-8 transition-all animate-scaleUp ${
              isDark ? 'bg-zinc-950 border-emerald-500/70 text-white' : 'bg-white border-emerald-300 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b pb-3.5 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <MapPin className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    <span>CREAR NUEVA FRECUENCIA INTERPROVINCIAL</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      Ecuador
                    </span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Define origen, destino, horarios y tarifa en dólares. Aparecerá en vivo en la app del cliente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewFrequencyModal(false)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Route Presets */}
            <div className={`p-3 rounded-2xl border space-y-2 ${
              isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-emerald-50/60 border-emerald-100'
            }`}>
              <span className={`text-[11px] font-black uppercase tracking-wider block flex items-center gap-1.5 ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rutas Frecuentes Populares (Click para autorellenar):</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { originP: 'Carchi', originC: 'Tulcán', originT: 'Terminal Terrestre Tulcán', destP: 'Pichincha', destC: 'Quito', destT: 'Parque La Carolina / Quicentro', price: 25, deposit: 10, label: 'Tulcán ➔ Quito ($25)' },
                  { originP: 'Pichincha', originC: 'Quito', originT: 'Parque La Carolina / Quicentro', destP: 'Carchi', destC: 'Tulcán', destT: 'Terminal Terrestre Tulcán', price: 25, deposit: 10, label: 'Quito ➔ Tulcán ($25)' },
                  { originP: 'Carchi', originC: 'Tulcán', originT: 'Terminal Terrestre Tulcán', destP: 'Pichincha', destC: 'Quito (Tababela)', destT: 'Aeropuerto Mariscal Sucre (Tababela VIP)', price: 30, deposit: 10, label: 'Tulcán ➔ Aeropuerto ($30)' },
                  { originP: 'Imbabura', originC: 'Ibarra', originT: 'Terminal Terrestre Ibarra', destP: 'Pichincha', destC: 'Quito', destT: 'Terminal Terrestre Carcelén', price: 15, deposit: 5, label: 'Ibarra ➔ Quito ($15)' },
                  { originP: 'Pichincha', originC: 'Quito', originT: 'Terminal Quitumbe', destP: 'Guayas', destC: 'Guayaquil', destT: 'Terminal Terrestre Guayaquil', price: 35, deposit: 10, label: 'Quito ➔ Guayaquil ($35)' },
                  { originP: 'Guayas', originC: 'Guayaquil', originT: 'Terminal Terrestre Guayaquil', destP: 'Pichincha', destC: 'Quito', destT: 'Terminal Quitumbe', price: 35, deposit: 10, label: 'Guayaquil ➔ Quito ($35)' },
                  { originP: 'Azuay', originC: 'Cuenca', originT: 'Terminal Terrestre Cuenca', destP: 'Guayas', destC: 'Guayaquil', destT: 'Terminal Terrestre Guayaquil', price: 20, deposit: 10, label: 'Cuenca ➔ Guayaquil ($20)' },
                  { originP: 'Tungurahua', originC: 'Ambato', originT: 'Terminal Terrestre Sur Ambato', destP: 'Pichincha', destC: 'Quito', destT: 'Terminal Quitumbe', price: 12, deposit: 5, label: 'Ambato ➔ Quito ($12)' },
                  { originP: 'Santo Domingo de los Tsáchilas', originC: 'Santo Domingo', originT: 'Terminal Terrestre Santo Domingo', destP: 'Pichincha', destC: 'Quito', destT: 'Terminal Carcelén', price: 14, deposit: 5, label: 'Sto Domingo ➔ Quito ($14)' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setNewOriginProvince(item.originP);
                      setNewOriginCanton(item.originC);
                      setNewOriginTerminal(item.originT);
                      setNewDestProvince(item.destP);
                      setNewDestCanton(item.destC);
                      setNewDestTerminal(item.destT);
                      setNewPricePerSeatUsd(item.price);
                      setNewDepositRequiredUsd(item.deposit);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700'
                        : 'bg-white hover:bg-emerald-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewFrequency} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. ORIGEN */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-xs font-black uppercase text-emerald-500 flex items-center gap-1.5">
                    <span>🚀</span> 1. Punto de Origen / Salida:
                  </span>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Provincia de Salida:
                    </label>
                    <select
                      value={newOriginProvince}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setNewOriginProvince(prov);
                        const match = ECUADOR_GEOGRAPHY.find((g) => g.province === prov);
                        if (match && match.cantons.length > 0) {
                          setNewOriginCanton(match.cantons[0]);
                          setNewOriginTerminal(`Terminal Terrestre ${match.cantons[0]}`);
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {ECUADOR_GEOGRAPHY.map((g) => (
                        <option key={g.province} value={g.province}>
                          {g.province}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Ciudad / Cantón de Salida:
                    </label>
                    <select
                      value={newOriginCanton}
                      onChange={(e) => {
                        const canton = e.target.value;
                        setNewOriginCanton(canton);
                        setNewOriginTerminal(`Terminal Terrestre ${canton}`);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {(
                        ECUADOR_GEOGRAPHY.find((g) => g.province === newOriginProvince)?.cantons || [
                          newOriginCanton,
                        ]
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Terminal / Dirección de Abordaje:
                    </label>
                    <input
                      type="text"
                      required
                      value={newOriginTerminal}
                      onChange={(e) => setNewOriginTerminal(e.target.value)}
                      placeholder="Ej: Terminal Terrestre Tulcán, Parque Central, etc."
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. DESTINO */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-xs font-black uppercase text-blue-500 flex items-center gap-1.5">
                    <span>🏁</span> 2. Punto de Destino / Llegada:
                  </span>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Provincia de Llegada:
                    </label>
                    <select
                      value={newDestProvince}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setNewDestProvince(prov);
                        const match = ECUADOR_GEOGRAPHY.find((g) => g.province === prov);
                        if (match && match.cantons.length > 0) {
                          setNewDestCanton(match.cantons[0]);
                          setNewDestTerminal(`Terminal Terrestre ${match.cantons[0]}`);
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {ECUADOR_GEOGRAPHY.map((g) => (
                        <option key={g.province} value={g.province}>
                          {g.province}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Ciudad / Cantón de Llegada:
                    </label>
                    <select
                      value={newDestCanton}
                      onChange={(e) => {
                        const canton = e.target.value;
                        setNewDestCanton(canton);
                        setNewDestTerminal(`Terminal Terrestre ${canton}`);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {(
                        ECUADOR_GEOGRAPHY.find((g) => g.province === newDestProvince)?.cantons || [
                          newDestCanton,
                        ]
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Terminal / Dirección de Llegada:
                    </label>
                    <input
                      type="text"
                      required
                      value={newDestTerminal}
                      onChange={(e) => setNewDestTerminal(e.target.value)}
                      placeholder="Ej: Parque La Carolina / Quicentro, Terminal Quitumbe, etc."
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 3. HORARIO Y TARIFAS ("yo pongo los precios") */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs font-black uppercase text-amber-500 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>3. Horario de Salida y Precios Regulados (USD):</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Turnos de Salida (Horarios):
                    </label>
                    <input
                      type="text"
                      required
                      value={newDepartureTime}
                      onChange={(e) => setNewDepartureTime(e.target.value)}
                      placeholder="Ej: 06:00 AM"
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className={`text-[10px] block mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Turnos programados ({newTurnosList.length}):
                    </span>
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {['03:00 AM', '06:00 AM', '08:00 AM', '10:00 AM', '01:00 PM', '03:30 PM', '05:00 PM', '08:00 PM', '10:30 PM'].map((t) => {
                        const isIncluded = newTurnosList.includes(t) || newDepartureTime === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              if (newTurnosList.includes(t)) {
                                setNewTurnosList(newTurnosList.filter((x) => x !== t));
                              } else {
                                setNewTurnosList([...newTurnosList, t]);
                              }
                            }}
                            className={`text-[9px] px-1.5 py-0.5 rounded-lg border font-mono transition-all cursor-pointer ${
                              isIncluded
                                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                : isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                          >
                            {isIncluded ? `✓ ${t}` : `+ ${t}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Precio por Asiento (USD):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-emerald-500 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="250"
                        required
                        value={newPricePerSeatUsd}
                        onChange={(e) => setNewPricePerSeatUsd(parseFloat(e.target.value) || 0)}
                        placeholder="25.00"
                        className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm font-mono font-black focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-700'
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] block mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      Precio fijado por el Administrador.
                    </span>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Anticipo de Reserva (USD):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-amber-500 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="100"
                        required
                        value={newDepositRequiredUsd}
                        onChange={(e) => setNewDepositRequiredUsd(parseFloat(e.target.value) || 0)}
                        placeholder="10.00"
                        className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm font-mono font-black focus:ring-2 focus:ring-amber-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-amber-400' : 'bg-white border-slate-300 text-amber-700'
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] block mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      Depósito a cuenta bancaria.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Tipo de Unidad / Asientos:
                    </label>
                    <select
                      value={newVehicleType}
                      onChange={(e) => setNewVehicleType(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="auto">Auto Sedán Ejecutivo (4 Asientos)</option>
                      <option value="confort">Vehículo Confort VIP / SUV (4 Asientos)</option>
                      <option value="camioneta">Camioneta Doble Cabina 4x4 (4 Asientos)</option>
                      <option value="van">Furgoneta / Van Interprovincial (6-8 Asientos)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Observaciones / Ruta:
                    </label>
                    <input
                      type="text"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Ej: Ruta directa por E35 con aire acondicionado"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Ticket */}
              <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Ticket className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-extrabold block truncate">
                      Vista previa cliente: {newOriginCanton} ➔ {newDestCanton}
                    </span>
                    <span className="text-[11px] block truncate opacity-80">
                      Salida {newDepartureTime} • Asiento ${Number(newPricePerSeatUsd || 0).toFixed(2)} USD • Anticipo ${Number(newDepositRequiredUsd || 0).toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 flex-shrink-0">
                  ${Number(newPricePerSeatUsd || 0).toFixed(2)} USD
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFrequencyModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar Frecuencia Inmediata</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

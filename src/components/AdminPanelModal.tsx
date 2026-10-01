import React, { useState, useEffect, useMemo } from 'react';
import {
  SystemTariffs,
  WalletRechargeRequest,
  AdminEncomienda,
  EncomiendaStatus,
  Driver,
  Vehicle,
  DriverDocuments,
  RechargeStatus,
  CantonTariff,
  AdminWorker,
  VerificationDocumentStatus,
  AdminActiveTrip,
  RegisteredVehicleUnit,
  AdminTripStatus,
  AdminActivityEvent,
  TripRequest,
  TripHistoryItem,
  DriverRadarOrder,
  PayoutRequest,
} from '../types';
import { DEFAULT_CANTON_TARIFFS, DEFAULT_ADMIN_WORKERS } from '../data/mockData';
import { ECUADOR_GEOGRAPHY } from '../data/ecuador_geography';
import { databaseService } from '../services/databaseService';
import { ALL_PARCEL_OFFICES } from '../data/sanCristobalOffices';
import { DriverVerificationStatus } from './DriverVerificationStatus';
import { AdminUnitsTracking } from './admin/AdminUnitsTracking';
import { AdminStaffManagement } from './admin/AdminStaffManagement';
import { AdminFinancialDashboard } from './admin/AdminFinancialDashboard';
import { AdminBankAccountsList } from './admin/AdminBankAccountsList';
import { AdminActiveRidesView } from './admin/AdminActiveRidesView';
import { DriverStatsSection } from './admin/DriverStatsSection';
import { AdminUnitRegisterModal } from './admin/AdminUnitRegisterModal';
import { AdminDailyIncomeReportModal } from './admin/AdminDailyIncomeReportModal';
import { AdminFareCalculatorModal } from './admin/AdminFareCalculatorModal';
import { AdminParcelTariffsManager } from './admin/AdminParcelTariffsManager';
import { AdminEjecutivoQuitoView } from './admin/AdminEjecutivoQuitoView';
import {
  ShieldAlert,
  ShieldCheck,
  Filter,
  Sliders,
  DollarSign,
  Wallet,
  Package,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Receipt,
  Truck,
  Car,
  Bike,
  Building2,
  Lock,
  Eye,
  Key,
  Calendar,
  Phone,
  PhoneCall,
  Radio,
  MapPin,
  Barcode,
  Sparkles,
  Download,
  X,
  CreditCard,
  Banknote,
  Send,
  Navigation,
  Crown,
  LogOut,
  UserCheck,
  BarChart3,
  Activity,
  Bell,
  ShoppingBag,
  Shield,
  AlertCircle,
  Plane,
  Trash2,
} from 'lucide-react';
import { CSVLink } from 'react-csv';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  tariffs: SystemTariffs;
  onUpdateTariffs: (newTariffs: SystemTariffs) => void;
  recharges: WalletRechargeRequest[];
  onUpdateRecharges: (newRecharges: WalletRechargeRequest[]) => void;
  payoutRequests?: PayoutRequest[];
  onUpdatePayoutRequests?: (newPayouts: PayoutRequest[]) => void;
  encomiendas: AdminEncomienda[];
  onUpdateEncomiendas: (newEncomiendas: AdminEncomienda[]) => void;
  drivers: Driver[];
  onUpdateDrivers?: (updated: Driver[]) => void;
  driverDocuments: DriverDocuments;
  onUpdateDriverDocuments?: (docs: DriverDocuments) => void;
  driverWalletBalance: number;
  onAdjustDriverWallet: (amountDelta: number, note: string) => void;
  cantonTariffs?: CantonTariff[];
  onUpdateCantonTariffs?: (updated: CantonTariff[]) => void;
  currentAdminUser?: AdminWorker | null;
  onAdminLogout?: () => void;
  adminWorkers?: AdminWorker[];
  onUpdateAdminWorkers?: (updated: AdminWorker[]) => void;
  initialTab?: string;
  adminActivityEvents?: AdminActivityEvent[];
  clientActiveTrip?: TripRequest | null;
  tripHistory?: TripHistoryItem[];
  driverRadarOrders?: DriverRadarOrder[];
  onApproveDriverRegistration?: (driverId: string) => void;
  onUpdateTripStatus?: (tripId: string, status: AdminTripStatus) => void;
  onDispatchManualTrip?: (tripData: Partial<AdminActiveTrip>) => void;
  onToggleSuspendDriver?: (driverId: string) => void;
  systemBroadcastAlert?: {
    id: string;
    active: boolean;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'emergency';
    author: string;
  } | null;
  onUpdateBroadcastAlert?: (alert: {
    active: boolean;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'emergency';
  } | null) => void;
  activeSosAlerts?: Array<{
    id: string;
    userName: string;
    userPhone: string;
    userRole: string;
    coords: { lat: number; lng: number };
    timestamp: number;
    resolved: boolean;
    tripId?: string;
    driverName?: string;
    driverPlate?: string;
  }>;
  onResolveSosAlert?: (alertId: string) => void;
  onDeleteDriver?: (driverId: string) => void;
  onDeleteAdminActivityEvent?: (id: string) => void;
  onClearAdminActivityEvents?: () => void;
  isDark?: boolean;
}

type AdminTab =
  | 'dashboard'
  | 'carreras_activas'
  | 'ejecutivo_quito'
  | 'unidades'
  | 'reportes'
  | 'recargas'
  | 'encomiendas'
  | 'conductores'
  | 'estadisticas_conductor'
  | 'tarifas'
  | 'financiero'
  | 'personal'
  | 'cuentas'
  | 'tarifas_encomiendas';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  tariffs,
  onUpdateTariffs,
  recharges,
  onUpdateRecharges,
  payoutRequests = [],
  onUpdatePayoutRequests,
  encomiendas,
  onUpdateEncomiendas,
  drivers,
  onUpdateDrivers,
  driverDocuments,
  onUpdateDriverDocuments,
  driverWalletBalance,
  onAdjustDriverWallet,
  cantonTariffs,
  onUpdateCantonTariffs,
  currentAdminUser,
  onAdminLogout,
  adminWorkers = DEFAULT_ADMIN_WORKERS,
  onUpdateAdminWorkers,
  initialTab,
  adminActivityEvents = [],
  clientActiveTrip,
  tripHistory = [],
  driverRadarOrders = [],
  onApproveDriverRegistration,
  onUpdateTripStatus: propUpdateTripStatus,
  onDispatchManualTrip,
  onToggleSuspendDriver,
  systemBroadcastAlert,
  onUpdateBroadcastAlert,
  activeSosAlerts = [],
  onResolveSosAlert,
  onDeleteDriver,
  onDeleteAdminActivityEvent,
  onClearAdminActivityEvents,
  isDark = true,
}) => {
  // Active Admin Tab - Default to dashboard or initialTab
  const [activeTab, setActiveTab] = useState<AdminTab>((initialTab as AdminTab) || 'dashboard');
  const [localWorkers, setLocalWorkers] = useState<AdminWorker[]>(adminWorkers);
  const [expandedDriverExpedienteId, setExpandedDriverExpedienteId] = useState<string | null>(null);

  // States for new encomienda provinces/cantons
  const [senderProvince, setSenderProvince] = useState<string>('Pichincha');
  const [senderCanton, setSenderCanton] = useState<string>('Quito');
  const [receiverProvince, setReceiverProvince] = useState<string>('Pichincha');
  const [receiverCanton, setReceiverCanton] = useState<string>('Quito');
  
  const senderCantons = ECUADOR_GEOGRAPHY.find(p => p.province === senderProvince)?.cantons || [];
  const receiverCantons = ECUADOR_GEOGRAPHY.find(p => p.province === receiverProvince)?.cantons || [];

  // Filtros de actividades de clientes y conductores
  const [activityFilter, setActivityFilter] = useState<
    'todos' | 'clientes' | 'conductores' | 'nuevos_conductores' | 'recargas'
  >('todos');
  const [activitySearch, setActivitySearch] = useState<string>('');

  const getEncomiendasCSVData = () => {
    let data = encomiendas;
    if (exportStartDate) {
      data = data.filter(enc => enc.createdFormatted >= exportStartDate);
    }
    if (exportEndDate) {
      data = data.filter(enc => enc.createdFormatted <= exportEndDate);
    }
    return data.map(enc => ({
      'Guía': enc.trackingNumber,
      'Fecha': enc.createdFormatted,
      'Remitente': enc.senderName,
      'Ciudad Origen': enc.senderCity,
      'Destinatario': enc.receiverName,
      'Ciudad Destino': enc.receiverCity,
      'Descripción': enc.description,
      'Peso (kg)': enc.weightKg,
      'Costo Flete ($)': enc.deliveryCostUsd,
      'Comisión 9% ($)': (enc.deliveryCostUsd * 0.09).toFixed(2),
      'Estado': enc.status
    }));
  };

  // Real-time Database Services & Modals
  const [activeTrips, setActiveTrips] = useState<AdminActiveTrip[]>(() => databaseService.getActiveTrips());
  const [, setRegisteredUnits] = useState<RegisteredVehicleUnit[]>(() => databaseService.getRegisteredUnits());
  const [showUnitRegisterModal, setShowUnitRegisterModal] = useState<boolean>(false);
  const [showIncomeReportsModal, setShowIncomeReportsModal] = useState<boolean>(false);
  const [showFareCalculatorModal, setShowFareCalculatorModal] = useState<boolean>(false);

  // Synchronize active trips from databaseService and client activities
  useEffect(() => {
    setActiveTrips(databaseService.getActiveTrips());
  }, [isOpen, clientActiveTrip, driverRadarOrders.length]);

  const handleUpdateTripStatus = (tripId: string, status: AdminTripStatus) => {
    databaseService.updateTripStatus(tripId, status);
    if (propUpdateTripStatus) {
      propUpdateTripStatus(tripId, status);
    }
    setActiveTrips(databaseService.getActiveTrips());
  };

  const handleRegisterUnit = (unit: RegisteredVehicleUnit) => {
    setRegisteredUnits((prev) => [unit, ...prev]);
    if (onUpdateDrivers) {
      const newDriver: Driver = {
        id: unit.assignedDriverId || `drv-${Date.now()}`,
        name: unit.assignedDriverName,
        phone: unit.driverPhone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        rating: 5.0,
        totalTrips: 0,
        vehicle: {
          model: unit.model,
          plate: unit.plate,
          color: unit.color,
          year: unit.year || 2023,
          type: unit.vehicleType === 'moto' ? 'moto' : 'auto',
        },
        currentCoords: { lat: -0.1807, lng: -78.4678 },
        distanceKm: 0.6,
        etaMinutes: 2,
        telemetry: {
          speedKmh: 0,
          headingDegrees: 90,
          headingDirection: 'E',
          batteryLevelPercent: 100,
          gpsSignal: 'excelente',
          operationalStatus: 'disponible',
          lastPingFormatted: 'Ahora',
          unitNumber: unit.unitNumber,
          assignedCanton: unit.plateProvince,
          assignedCooperative: unit.cooperativa,
          todayTripsCount: 0,
          todayEarningsUsd: 0,
          recentBreadcrumbs: [{ lat: -0.1807, lng: -78.4678 }],
        },
      };
      onUpdateDrivers([newDriver, ...drivers]);
    }
  };

  // Estados para la Gestión, Inspección y Clasificación Vehicular de Conductores
  const [inspectingVehicleDriverId, setInspectingVehicleDriverId] = useState<string | null>(null);
  const [driverSearchQuery, setDriverSearchQuery] = useState<string>('');
  const [driverCategoryFilter, setDriverCategoryFilter] = useState<'todos' | 'ejecutivos' | 'urbanos' | 'suspendidos'>('todos');
  const [vehicleChecklist, setVehicleChecklist] = useState<Record<string, {
    hasAirConditioning: boolean;
    hasTrunkCapacity: boolean;
    hasComfortSeats: boolean;
    hasUsbCharger: boolean;
    hasRtvApproved: boolean;
    category: 'sedan_confort' | 'vip_suv' | 'van_interprovincial';
    notes: string;
  }>>({});

  const handleAdminUpdateDocStatus = (
    docKey: 'license' | 'criminalRecord' | 'rtv',
    newStatus: VerificationDocumentStatus
  ) => {
    if (!onUpdateDriverDocuments) return;
    const updated: DriverDocuments = { ...driverDocuments };
    if (docKey === 'license') {
      updated.licenseStatus = newStatus;
      updated.isLicenseValid = newStatus === 'aprobado';
      if (newStatus === 'aprobado') {
        updated.licenseReviewerNotes = 'Aprobado por el Administrador Central de AndesMovi.';
        updated.licenseReviewedAt = 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (newStatus === 'en_revision') {
        updated.licenseReviewerNotes = 'En proceso de verificación en base de datos oficial ANT.';
      } else if (newStatus === 'pendiente') {
        updated.licenseReviewerNotes = 'Documento pendiente de verificación.';
      } else {
        updated.licenseReviewerNotes = 'Rechazado por el Administrador: Licencia no vigente o datos inconsistentes.';
      }
    } else if (docKey === 'criminalRecord') {
      updated.criminalRecordStatus = newStatus;
      updated.isCriminalRecordApproved = newStatus === 'aprobado';
      if (newStatus === 'aprobado') {
        updated.criminalRecordReviewerNotes = 'Aprobado por el Administrador (máximo 2 sin gravedad según normativa).';
        updated.criminalRecordReviewedAt = 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (newStatus === 'en_revision') {
        updated.criminalRecordReviewerNotes = 'Consultando antecedentes en la base del Ministerio del Interior.';
      } else if (newStatus === 'pendiente') {
        updated.criminalRecordReviewerNotes = 'Certificado pendiente de validación.';
      } else {
        updated.criminalRecordReviewerNotes = 'Rechazado por el Administrador: Presenta registros graves o excede el límite permitido.';
      }
    } else if (docKey === 'rtv') {
      updated.rtvDocStatus = newStatus;
      if (newStatus === 'aprobado') updated.rtvStatus = 'vigente';
      else if (newStatus === 'en_revision') updated.rtvStatus = 'en_tramite';
      else updated.rtvStatus = 'vencida';
    }

    const licOk = (updated.licenseStatus || (updated.isLicenseValid ? 'aprobado' : 'rechazado')) === 'aprobado';
    const crimOk = (updated.criminalRecordStatus || (updated.isCriminalRecordApproved ? 'aprobado' : 'rechazado')) === 'aprobado';
    const rtvOk = (updated.rtvDocStatus || (updated.rtvStatus === 'vigente' ? 'aprobado' : 'rechazado')) === 'aprobado';
    updated.isFullyVerified = licOk && crimOk && rtvOk;
    updated.overallStatus = updated.isFullyVerified
      ? 'aprobado'
      : newStatus === 'rechazado'
      ? 'rechazado'
      : newStatus === 'en_revision'
      ? 'en_revision'
      : 'pendiente';

    onUpdateDriverDocuments(updated);
  };

  useEffect(() => {
    if (initialTab && isOpen) {
      if (initialTab === 'tracking') {
        setActiveTab('unidades');
      } else {
        setActiveTab(initialTab as AdminTab);
      }
    }
  }, [initialTab, isOpen]);

  const handleUpdateWorkers = (updated: AdminWorker[]) => {
    setLocalWorkers(updated);
    if (onUpdateAdminWorkers) {
      onUpdateAdminWorkers(updated);
    }
  };

  // Canton Tariffs state
  const [currentCantonTariffs, setCurrentCantonTariffs] = useState<CantonTariff[]>(
    cantonTariffs || tariffs.cantonTariffs || DEFAULT_CANTON_TARIFFS
  );

  const handleUpdateCantonTariffsList = (updated: CantonTariff[]) => {
    setCurrentCantonTariffs(updated);
    if (onUpdateCantonTariffs) {
      onUpdateCantonTariffs(updated);
    }
    // Also synchronize into system tariffs
    onUpdateTariffs({
      ...tariffs,
      cantonTariffs: updated,
    });
  };

  // Local state for tariffs editing
  const [editableTariffs, setEditableTariffs] = useState<SystemTariffs>({ ...tariffs });
  const [tariffSaveMessage, setTariffSaveMessage] = useState<string | null>(null);

  // Manual top-up state
  const [manualRechargeUser, setManualRechargeUser] = useState<string>('Carlos Toapanta (Taxi Pichincha)');
  const [manualRechargeAmount, setManualRechargeAmount] = useState<number>(20.0);
  const [manualRechargeNote, setManualRechargeNote] = useState<string>('Recarga autorizada por gerencia');
  const [rechargeSuccessMessage, setRechargeSuccessMessage] = useState<string | null>(null);

  // Broadcast Alert & Master Control Console State
  const [broadcastTitleInput, setBroadcastTitleInput] = useState<string>(
    systemBroadcastAlert?.title || 'COMUNICADO OFICIAL ANDESMOVI'
  );
  const [broadcastMsgInput, setBroadcastMsgInput] = useState<string>(
    systemBroadcastAlert?.message || 'Operación regular en las 24 provincias. Monitoreo satelital activo.'
  );
  const [broadcastSeverityInput, setBroadcastSeverityInput] = useState<'info' | 'warning' | 'emergency'>(
    systemBroadcastAlert?.severity || 'info'
  );
  const [globalControlNotice, setGlobalControlNotice] = useState<string | null>(null);

  const handleApplyOperationalMode = (mode: 'normal' | 'lluvia' | 'pico' | 'pausa') => {
    let mult = 1.0;
    let label = 'Modo Normal (1.0x)';
    if (mode === 'lluvia') {
      mult = 1.25;
      label = 'Modo Lluvia (+25% Tarifa Nacional)';
    } else if (mode === 'pico') {
      mult = 1.15;
      label = 'Modo Hora Pico (+15% Tarifa)';
    } else if (mode === 'pausa') {
      mult = 0.01;
      label = 'Pausa Operativa de Emergencia';
    }

    const updated = { ...editableTariffs, dynamicMultiplier: mult };
    setEditableTariffs(updated);
    onUpdateTariffs(updated);
    setGlobalControlNotice(`¡${label} activado para toda la aplicación en las 24 provincias!`);
    setTimeout(() => setGlobalControlNotice(null), 3500);
  };

  const handleApplyCommissionRate = (percent: number) => {
    const updated = { ...editableTariffs, platformCommissionPercent: percent };
    setEditableTariffs(updated);
    onUpdateTariffs(updated);
    setGlobalControlNotice(`¡Comisión de AndesMovi ajustada al ${percent}% para todos los conductores!`);
    setTimeout(() => setGlobalControlNotice(null), 3500);
  };

  const handlePublishBroadcast = () => {
    if (!broadcastMsgInput.trim()) return;
    if (onUpdateBroadcastAlert) {
      onUpdateBroadcastAlert({
        active: true,
        title: broadcastTitleInput.trim() || 'ALERTA ANDESMOVI',
        message: broadcastMsgInput.trim(),
        severity: broadcastSeverityInput,
      });
      setGlobalControlNotice('¡Alerta nacional transmitida en vivo a todos los clientes y conductores!');
      setTimeout(() => setGlobalControlNotice(null), 3500);
    }
  };

  const handleDismissBroadcast = () => {
    if (onUpdateBroadcastAlert) {
      onUpdateBroadcastAlert(null);
      setGlobalControlNotice('Alerta nacional desactivada.');
      setTimeout(() => setGlobalControlNotice(null), 3500);
    }
  };

  // Encomiendas state & filters
  const [encomiendaFilter, setEncomiendaFilter] = useState<string>('todas');
  const [encomiendaSearch, setEncomiendaSearch] = useState<string>('');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [selectedEncomiendaForGuide, setSelectedEncomiendaForGuide] = useState<AdminEncomienda | null>(null);
  const [showNewEncomiendaModal, setShowNewEncomiendaModal] = useState<boolean>(false);

  // New Encomienda Form State
  const [newEncSenderName, setNewEncSenderName] = useState('');
  const [newEncSenderPhone, setNewEncSenderPhone] = useState('+593 ');
  const [newEncSenderId, setNewEncSenderId] = useState('');
  const [newEncSenderCity, setNewEncSenderCity] = useState('Quito');
  const [newEncSenderAddress, setNewEncSenderAddress] = useState('');

  const [newEncReceiverName, setNewEncReceiverName] = useState('');
  const [newEncReceiverPhone, setNewEncReceiverPhone] = useState('+593 ');
  const [newEncReceiverId, setNewEncReceiverId] = useState('');
  const [newEncReceiverCity, setNewEncReceiverCity] = useState('Cayambe');
  const [newEncReceiverAddress, setNewEncReceiverAddress] = useState('');

  const [newEncPackageType, setNewEncPackageType] = useState<AdminEncomienda['packageType']>('caja_mediana');
  const [newEncDescription, setNewEncDescription] = useState('');
  const [newEncWeightKg, setNewEncWeightKg] = useState<number>(3.5);
  const [newEncDeclaredValue, setNewEncDeclaredValue] = useState<number>(75.0);
  const [newEncCarrierName, setNewEncCarrierName] = useState('Luis Guamán (Camioneta D-Max)');
  const [newEncCarrierType, setNewEncCarrierType] = useState<AdminEncomienda['assignedCarrierType']>('conductor_andesmovi');
  const [newEncPaymentStatus, setNewEncPaymentStatus] = useState<'pagado_origen' | 'cobro_contra_entrega'>('pagado_origen');
  const [newEncOriginOfficeId, setNewEncOriginOfficeId] = useState<string>('');
  const [newEncDestinationOfficeId, setNewEncDestinationOfficeId] = useState<string>('');

  // Dynamic Real-time Calculations for Dashboard and Activity Metrics (Set to zero as requested)
  const calculatedTotalVolume = useMemo(() => {
    return 0;
  }, []);

  const calculatedCommission = useMemo(() => {
    return 0;
  }, []);

  const totalTripsCount = useMemo(() => {
    return 0;
  }, []);

  const newRegisteredDriversCount = useMemo(() => {
    return drivers.filter((d) => d.isPendingApproval).length;
  }, [drivers]);

  // Filtered Activity Events of Clients and Drivers
  const filteredActivityEvents = useMemo(() => {
    return adminActivityEvents.filter((ev) => {
      if (activityFilter === 'clientes' && ev.actorRole !== 'cliente') return false;
      if (activityFilter === 'conductores' && ev.actorRole !== 'conductor') return false;
      if (activityFilter === 'nuevos_conductores' && ev.type !== 'new_driver_registered') return false;
      if (activityFilter === 'recargas' && !ev.type.includes('recharge')) return false;

      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchDesc = ev.description.toLowerCase().includes(q);
        const matchActor = ev.actorName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchActor) return false;
      }
      return true;
    });
  }, [adminActivityEvents, activityFilter, activitySearch]);

  // Handle saving tariffs
  const handleSaveTariffs = () => {
    onUpdateTariffs(editableTariffs);
    setTariffSaveMessage('¡Tarifas y comisión del sistema actualizadas en tiempo real!');
    setTimeout(() => setTariffSaveMessage(null), 3500);
  };

  // Reset tariffs to factory defaults
  const handleResetTariffs = () => {
    const defaults: SystemTariffs = {
      platformCommissionPercent: 7.0,
      dynamicMultiplier: 1.0,
      rideBaseFareUsd: 1.25,
      rideBaseCoverageKm: 2.7,
      rideExtraPerKmUsd: 0.35,
      ridePerKmUsd: 0.35,
      ridePerMinuteUsd: 0.08,
      rideMinimumFareUsd: 1.25,
      confortExtraFeeUsd: 0.50,
      deliveryBaseFareUsd: 1.25,
      deliveryPerKmUsd: 0.35,
      deliveryRainFeeUsd: 0.50,
      parcelBaseFareUsd: 1.50,
      parcelMinimumFareUsd: 6.00,
      parcelPerKmUsd: 0.40,
      parcelExtraKgFeeUsd: 0.50,
      parcelInsurancePercent: 1.5,
      nightSurgePercent: 15.0,
    };
    setEditableTariffs(defaults);
    onUpdateTariffs(defaults);
    setTariffSaveMessage('Valores de fábrica restablecidos.');
    setTimeout(() => setTariffSaveMessage(null), 3500);
  };

  const [selectedProofDoc, setSelectedProofDoc] = useState<WalletRechargeRequest | null>(null);
  const [rejectingReq, setRejectingReq] = useState<WalletRechargeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Comprobante no se refleja en la cuenta personal bancaria.');

  // Handle recharge approve
  const handleApproveRecharge = (reqId: string) => {
    const target = recharges.find((r) => r.id === reqId);
    if (!target) return;

    // Rule: $10.00 USD bonus for every $50.00 USD in cumulative top-ups
    const topupAmount = target.amountUsd;
    
    // We calculate the bonus based on the $50 threshold
    const bonus = Math.floor(topupAmount / 50) * 10;
    const totalAmountToCredit = topupAmount + bonus;

    const updated = recharges.map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'aprobada' as RechargeStatus,
          reviewedAt: Date.now(),
          reviewedBy: currentAdminUser ? currentAdminUser.fullName : 'Jhon Sebastian Yepez Clavijo (Admin)',
          adminNotes: `Documento de transferencia verificado. Saldo activado. ${bonus > 0 ? `Bono de $10 por cada $50 de recarga aplicado: +$${bonus.toFixed(2)} USD.` : ''}`,
        };
      }
      return r;
    });

    onUpdateRecharges(updated);
    // Credit to driver wallet immediately
    onAdjustDriverWallet(totalAmountToCredit, `Recarga aprobada. ${bonus > 0 ? `Incluye Bono de $10 por cada $50 recargados: +$${bonus.toFixed(2)}` : ''}`);
    setRechargeSuccessMessage(`¡Depósito de $${target.amountUsd.toFixed(2)} USD APROBADO! ${bonus > 0 ? `+ Bono Acumulativo de $${bonus.toFixed(2)} USD.` : ''} El saldo de ${target.driverOrUserName} se ha acreditado.`);
    setSelectedProofDoc(null);
    setTimeout(() => setRechargeSuccessMessage(null), 4500);
  };

  // Handle recharge reject
  const handleRejectRecharge = (reqId: string, reason?: string) => {
    const updated = recharges.map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'rechazada' as RechargeStatus,
          reviewedAt: Date.now(),
          reviewedBy: currentAdminUser ? currentAdminUser.fullName : 'Jhon Sebastian Yepez Clavijo (Admin)',
          adminNotes: reason || 'Rechazado: El documento de transferencia no se refleja en las cuentas personales del administrador.',
        };
      }
      return r;
    });
    onUpdateRecharges(updated);
    setRejectingReq(null);
    setSelectedProofDoc(null);
    setRechargeSuccessMessage(`Solicitud de recarga rechazada.`);
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  const handleApprovePayout = (reqId: string) => {
    if (!onUpdatePayoutRequests) return;
    const target = payoutRequests.find(p => p.id === reqId);
    if (!target) return;

    const updated = payoutRequests.map(p => {
      if (p.id === reqId) {
        return {
          ...p,
          status: 'pagada' as const,
          reviewedAt: Date.now(),
          reviewedBy: currentAdminUser ? currentAdminUser.fullName : 'Jhon Sebastian Yepez Clavijo (Admin)',
          adminNotes: 'Transferencia bancaria realizada con éxito. Fondo de $10 USD conservado.',
        };
      }
      return p;
    });
    
    onUpdatePayoutRequests(updated);

    // DEDUCT THE SALDO FROM THE DRIVER WALLET IMMEDIATELY!
    onAdjustDriverWallet(-target.amountUsd, `Retiro de saldo aprobado: Liquidación transferida a ${target.bankName} N° ${target.accountNumber}`);

    setRechargeSuccessMessage(`¡Liquidación de $${target.amountUsd.toFixed(2)} USD transferida con éxito a ${target.driverName}! Se debitó de su billetera, manteniendo su fondo de $10.00 USD.`);
    setTimeout(() => setRechargeSuccessMessage(null), 4500);
  };

  const handleRejectPayout = (reqId: string) => {
    if (!onUpdatePayoutRequests) return;
    const updated = payoutRequests.map(p => {
      if (p.id === reqId) {
        return {
          ...p,
          status: 'rechazada' as const,
          reviewedAt: Date.now(),
          reviewedBy: currentAdminUser ? currentAdminUser.fullName : 'Jhon Sebastian Yepez Clavijo (Admin)',
          adminNotes: 'Rechazado: Los datos de transferencia bancaria no coinciden o no se pudo procesar.',
        };
      }
      return p;
    });
    onUpdatePayoutRequests(updated);
    setRechargeSuccessMessage(`Solicitud de liquidación rechazada.`);
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Handle delete individual recharge
  const handleDeleteRecharge = (reqId: string) => {
    const updated = recharges.filter((r) => r.id !== reqId);
    onUpdateRecharges(updated);
    setRechargeSuccessMessage('Registro de recarga eliminado.');
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Handle clear processed recharges history
  const handleClearProcessedRecharges = () => {
    const updated = recharges.filter((r) => r.status === 'pendiente');
    onUpdateRecharges(updated);
    setRechargeSuccessMessage('Historial de recargas procesadas vaciado.');
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Handle delete payout request
  const handleDeletePayout = (reqId: string) => {
    if (!onUpdatePayoutRequests) return;
    const updated = payoutRequests.filter((p) => p.id !== reqId);
    onUpdatePayoutRequests(updated);
    setRechargeSuccessMessage('Registro de liquidación eliminado.');
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Handle clear processed payouts history
  const handleClearProcessedPayouts = () => {
    if (!onUpdatePayoutRequests) return;
    const updated = payoutRequests.filter((p) => p.status === 'pendiente');
    onUpdatePayoutRequests(updated);
    setRechargeSuccessMessage('Historial de liquidaciones procesadas vaciado.');
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Handle delete encomienda
  const handleDeleteEncomienda = (encId: string) => {
    const updated = encomiendas.filter((e) => e.id !== encId);
    onUpdateEncomiendas(updated);
    setRechargeSuccessMessage('Encomienda eliminada del registro.');
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Handle clear delivered/cancelled encomiendas
  const handleClearCompletedEncomiendas = () => {
    const updated = encomiendas.filter((e) => e.status !== 'entregada' && e.status !== 'con_incidencia');
    onUpdateEncomiendas(updated);
    setRechargeSuccessMessage('Historial de encomiendas entregadas eliminado.');
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Handle delete driver
  const handleDeleteDriverItem = (driverId: string) => {
    if (onDeleteDriver) {
      onDeleteDriver(driverId);
    }
    if (onUpdateDrivers) {
      const updated = drivers.filter((d) => d.id !== driverId);
      onUpdateDrivers(updated);
    }
    // Sincronizar y limpiar de la flota ejecutiva en caso de estar registrado
    try {
      const storedExec = localStorage.getItem('andesmovi_executive_drivers');
      if (storedExec) {
        const execList = JSON.parse(storedExec);
        if (Array.isArray(execList)) {
          const filtered = execList.filter((ed: any) => ed.id !== driverId);
          localStorage.setItem('andesmovi_executive_drivers', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Error syncing executive fleet on driver deletion', e);
    }
    setRechargeSuccessMessage('Conductor eliminado del sistema con éxito.');
    setTimeout(() => setRechargeSuccessMessage(null), 3000);
  };

  // Rechazar y eliminar permanentemente una solicitud de conductor
  const handleRejectDriverRegistration = (driverId: string) => {
    const target = drivers.find((d) => d.id === driverId);
    if (!target) return;
    if (window.confirm(`¿Rechazar y eliminar la solicitud de registro del conductor ${target.name}? El registro será descartado de forma permanente.`)) {
      handleDeleteDriverItem(driverId);
      setRechargeSuccessMessage(`Solicitud de ${target.name} rechazada y eliminada del sistema.`);
      setTimeout(() => setRechargeSuccessMessage(null), 3500);
    }
  };

  // Vaciar / Rechazar todas las solicitudes pendientes de registro
  const handleClearAllPendingDrivers = () => {
    const pending = drivers.filter((d) => d.isPendingApproval);
    if (pending.length === 0) return;
    if (window.confirm(`¿Estás seguro de vaciar y rechazar las ${pending.length} solicitudes de registro pendientes?`)) {
      const remaining = drivers.filter((d) => !d.isPendingApproval);
      if (onUpdateDrivers) onUpdateDrivers(remaining);
      setRechargeSuccessMessage(`${pending.length} solicitudes de registro vaciadas.`);
      setTimeout(() => setRechargeSuccessMessage(null), 3500);
    }
  };

  // Vaciar / Eliminar todos los conductores suspendidos
  const handleClearSuspendedDrivers = () => {
    const suspended = drivers.filter((d) => d.isSuspended);
    if (suspended.length === 0) return;
    if (window.confirm(`¿Estás seguro de eliminar permanentemente a los ${suspended.length} conductores suspendidos del sistema?`)) {
      const remaining = drivers.filter((d) => !d.isSuspended);
      if (onUpdateDrivers) onUpdateDrivers(remaining);
      setRechargeSuccessMessage(`${suspended.length} conductores suspendidos eliminados del sistema.`);
      setTimeout(() => setRechargeSuccessMessage(null), 3500);
    }
  };

  // Clasificar o desclasificar vehículo para Viajes Ejecutivos
  const handleClassifyVehicleForEjecutivo = (
    driverId: string,
    approved: boolean,
    category: 'sedan_confort' | 'vip_suv' | 'van_interprovincial' | 'no_clasificado' = 'sedan_confort',
    notes: string = '',
    specs?: {
      hasAirConditioning?: boolean;
      hasTrunkCapacity?: boolean;
      hasComfortSeats?: boolean;
      hasUsbCharger?: boolean;
      hasRtvApproved?: boolean;
    }
  ) => {
    if (!onUpdateDrivers) return;
    const now = new Date().toISOString().split('T')[0];
    const updated = drivers.map((d) => {
      if (d.id === driverId) {
        const updatedVehicle: Vehicle = {
          ...d.vehicle,
          isEjecutivoApproved: approved,
          ejecutivoCategory: approved ? category : 'no_clasificado',
          ejecutivoNotes: notes || (approved ? 'Vehículo verificado y clasificado para viajes ejecutivos.' : 'Vehículo estándar no clasificado para viajes ejecutivos.'),
          hasAirConditioning: specs?.hasAirConditioning ?? (approved ? true : d.vehicle.hasAirConditioning ?? false),
          hasTrunkCapacity: specs?.hasTrunkCapacity ?? (approved ? true : d.vehicle.hasTrunkCapacity ?? true),
          hasComfortSeats: specs?.hasComfortSeats ?? (approved ? true : d.vehicle.hasComfortSeats ?? true),
          hasUsbCharger: specs?.hasUsbCharger ?? (approved ? true : d.vehicle.hasUsbCharger ?? false),
          hasRtvApproved: specs?.hasRtvApproved ?? true,
          classificationDate: now,
          classifiedBy: currentAdminUser?.fullName || 'Jhon Sebastian Yepez Clavijo (Admin)',
        };
        return {
          ...d,
          isEjecutivoApproved: approved,
          ejecutivoClassificationDate: now,
          vehicle: updatedVehicle,
        };
      }
      return d;
    });

    onUpdateDrivers(updated);

    const targetDriver = updated.find((d) => d.id === driverId);
    if (targetDriver) {
      try {
        const storedExec = localStorage.getItem('andesmovi_executive_drivers');
        const execList = storedExec ? JSON.parse(storedExec) : [];
        if (approved) {
          const alreadyIn = execList.some((ed: any) => ed.id === driverId || ed.vehiclePlate === targetDriver.vehicle.plate);
          if (!alreadyIn) {
            execList.push({
              id: targetDriver.id,
              driverName: targetDriver.name,
              cedula: targetDriver.cedula || '1004721351',
              cooperativa: targetDriver.cooperativaName || 'AndesMovi Flota Ejecutiva',
              avatar: targetDriver.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
              rating: targetDriver.rating || 4.9,
              phone: targetDriver.phone || '+593 99 000 0000',
              vehicleModel: targetDriver.vehicle.model,
              vehiclePlate: targetDriver.vehicle.plate,
              vehicleColor: targetDriver.vehicle.color,
              vehicleYear: targetDriver.vehicle.year,
              vehicleMake: targetDriver.vehicle.make || 'Toyota',
              occupiedSeats: 0,
              totalSeats: targetDriver.vehicle.capacity || 4,
              currentLocationName: targetDriver.province ? `Base ${targetDriver.province}` : 'Carchi / Tulcán',
              status: 'disponible_base',
              speedKmh: 0,
              estimatedArrivalMinutes: 5,
            });
            localStorage.setItem('andesmovi_executive_drivers', JSON.stringify(execList));
          }
        } else {
          const filteredExec = execList.filter((ed: any) => ed.id !== driverId && ed.vehiclePlate !== targetDriver.vehicle.plate);
          localStorage.setItem('andesmovi_executive_drivers', JSON.stringify(filteredExec));
        }
      } catch (e) {
        console.warn('Error syncing executive fleet', e);
      }
    }

    setRechargeSuccessMessage(
      approved
        ? `¡Vehículo de ${targetDriver?.name} (${targetDriver?.vehicle.plate}) CLASIFICADO con éxito para Viajes Ejecutivos!`
        : `Clasificación ejecutiva retirada para ${targetDriver?.name}. Ahora opera como vehículo urbano estándar.`
    );
    setTimeout(() => setRechargeSuccessMessage(null), 3500);
  };

  // Handle delete activity event
  const handleDeleteActivity = (actId: string) => {
    if (onDeleteAdminActivityEvent) {
      onDeleteAdminActivityEvent(actId);
    }
    setGlobalControlNotice('Acción eliminada del historial.');
    setTimeout(() => setGlobalControlNotice(null), 2500);
  };

  // Handle clear all activities
  const handleClearAllActivities = () => {
    if (onClearAdminActivityEvents) {
      onClearAdminActivityEvents();
    }
    setGlobalControlNotice('Historial de actividades y acciones del panel vaciado.');
    setTimeout(() => setGlobalControlNotice(null), 3000);
  };

  // Handle manual recharge submission
  const handleManualRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualRechargeAmount <= 0) return;

    // Calculate bonus: $10 USD for every $50 USD
    const bonus = Math.floor(manualRechargeAmount / 50) * 10;
    const totalAmountToCredit = manualRechargeAmount + bonus;

    const newReq: WalletRechargeRequest = {
      id: `rec-manual-${Date.now().toString().slice(-4)}`,
      driverOrUserId: 'drv-current',
      driverOrUserName: manualRechargeUser,
      driverOrUserPhone: '+593 99 876 5432',
      role: 'conductor',
      amountUsd: Number(manualRechargeAmount),
      paymentMethod: 'efectivo_agente',
      referenceNumber: `MANUAL-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'aprobada',
      requestedAt: Date.now(),
      requestedAtFormatted: 'Ahora (Inyección Admin)',
      reviewedAt: Date.now(),
      reviewedBy: 'Super Admin',
      adminNotes: `${manualRechargeNote} ${bonus > 0 ? `| Bonificación: $${bonus.toFixed(2)} USD` : ''}`,
    };

    onUpdateRecharges([newReq, ...recharges]);
    onAdjustDriverWallet(Number(totalAmountToCredit), `${manualRechargeNote} ${bonus > 0 ? `+ Bonificación: $${bonus.toFixed(2)}` : ''}`);
    setRechargeSuccessMessage(`¡Se acreditaron exitosamente $${manualRechargeAmount.toFixed(2)} USD a ${manualRechargeUser}! ${bonus > 0 ? `(Incluye Bonificación de $${bonus.toFixed(2)} USD)` : ''}`);
    setTimeout(() => setRechargeSuccessMessage(null), 3500);
  };

  // Handle create new encomienda
  const handleCreateEncomiendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEncSenderName || !newEncReceiverName) return;

    // Calculate freight cost based on current tariffs (Mínimo $6.00 USD)
    const rawCost =
      editableTariffs.parcelBaseFareUsd +
      newEncWeightKg * editableTariffs.parcelExtraKgFeeUsd +
      (newEncDeclaredValue * editableTariffs.parcelInsurancePercent) / 100 +
      4.0; // Distancia estimada interprovincial
    const calculatedCost = Math.max(editableTariffs.parcelMinimumFareUsd || 6.0, rawCost);

    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newEnc: AdminEncomienda = {
      id: `enc-adm-${Date.now().toString().slice(-4)}`,
      trackingNumber: `GUIA-EC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      senderName: newEncSenderName,
      senderPhone: newEncSenderPhone,
      senderIdNumber: newEncSenderId || '1799999999001',
      senderAddress: newEncSenderAddress || 'Oficina Terminal',
      senderCity: newEncSenderCity,

      receiverName: newEncReceiverName,
      receiverPhone: newEncReceiverPhone,
      receiverIdNumber: newEncReceiverId || '1000000000',
      receiverAddress: newEncReceiverAddress || 'Dirección de Entrega',
      receiverCity: newEncReceiverCity,

      packageType: newEncPackageType,
      description: newEncDescription || 'Paquete comercial',
      weightKg: Number(newEncWeightKg),
      declaredValueUsd: Number(newEncDeclaredValue),
      deliveryCostUsd: Number(calculatedCost.toFixed(2)),
      paymentStatus: newEncPaymentStatus,

      assignedCarrierType: newEncCarrierType,
      assignedCarrierName: newEncCarrierName,
      assignedCarrierPhone: '+593 98 000 1122',

      securityPin: randomPin,
      status: 'recepcionada',
      createdAt: Date.now(),
      createdFormatted: 'Hoy, Recién Creada',
      estimatedDeliveryFormatted: 'Hoy, 05:00 PM',
      originOfficeId: newEncOriginOfficeId,
      destinationOfficeId: newEncDestinationOfficeId,
    };

    onUpdateEncomiendas([newEnc, ...encomiendas]);
    setShowNewEncomiendaModal(false);
    setSelectedEncomiendaForGuide(newEnc);
  };

  // Update status of an encomienda
  const handleUpdateEncomiendaStatus = (encId: string, nextStatus: EncomiendaStatus) => {
    const updated = encomiendas.map((enc) => {
      if (enc.id === encId) {
        return {
          ...enc,
          status: nextStatus,
          deliveredAt: nextStatus === 'entregada' ? Date.now() : enc.deliveredAt,
          deliveredProofSignature:
            nextStatus === 'entregada'
              ? `Entregado con validación de Cédula ${enc.receiverIdNumber} en ${enc.receiverCity} (Sin PIN)`
              : enc.deliveredProofSignature,
        };
      }
      return enc;
    });
    onUpdateEncomiendas(updated);
  };

  // Filtered encomiendas
  const filteredEncomiendas = encomiendas.filter((enc) => {
    const matchesFilter =
      encomiendaFilter === 'todas' || enc.status === encomiendaFilter;
    const matchesSearch =
      enc.trackingNumber.toLowerCase().includes(encomiendaSearch.toLowerCase()) ||
      enc.senderName.toLowerCase().includes(encomiendaSearch.toLowerCase()) ||
      enc.receiverName.toLowerCase().includes(encomiendaSearch.toLowerCase()) ||
      enc.senderCity.toLowerCase().includes(encomiendaSearch.toLowerCase()) ||
      enc.receiverCity.toLowerCase().includes(encomiendaSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Financial summary numbers
  const totalRechargedApproved = recharges
    .filter((r) => r.status === 'aprobada')
    .reduce((acc, curr) => acc + curr.amountUsd, 0);

  const totalRechargePending = recharges
    .filter((r) => r.status === 'pendiente')
    .reduce((acc, curr) => acc + curr.amountUsd, 0);

  const totalEncomiendasCount = encomiendas.length;
  const totalEncomiendasTransit = encomiendas.filter(
    (e) => e.status === 'en_transito_interprovincial' || e.status === 'en_reparto_local'
  ).length;
  const totalEncomiendasDelivered = encomiendas.filter((e) => e.status === 'entregada').length;

  if (!isOpen) return null;

  // STRICT ACCESS RESTRICTION: Nobody unauthorized can access the admin panel
  if (!currentAdminUser || !currentAdminUser.isActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
        <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#221711] via-[#17120e] to-[#0f0c0a] border-2 border-red-500/50 p-6 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border-2 border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
              Acceso Exclusivo y Restringido
            </span>
            <h3 className="text-lg font-black text-white pt-2">
              Solo para Administradores
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
              No puede ingresar ninguna persona no autorizada. El ingreso está estrictamente reservado para la directiva y administradores registrados con cédula de identidad y clave autorizada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-600 transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className={`relative w-full max-w-6xl my-auto rounded-3xl border-2 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isDark ? 'bg-zinc-950 border-amber-500/60' : 'bg-white border-amber-200'
      }`}>
        
        {/* MODAL HEADER */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between flex-shrink-0 ${
          isDark ? 'bg-gradient-to-r from-[#2e1f18] via-[#1e1713] to-[#14100e] border-amber-600/40' : 'bg-slate-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-zinc-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-600/30 border border-amber-300/40">
              <ShieldAlert className="w-6 h-6 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  PANEL ADMINISTRATIVO ANDESMOVI
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                  Control Maestro
                </span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-amber-200/90' : 'text-amber-700'}`}>
                Gestión total de tarifas, recargas de billetera, división de encomiendas y personal en 24 provincias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Authenticated Admin Identity Badge */}
            {currentAdminUser && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 text-xs shadow-md ${
                isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-white border-amber-200'
              }`}>
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-zinc-950 font-black text-xs flex items-center justify-center font-mono">
                  {currentAdminUser.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left leading-tight">
                  <div className={`font-black text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>{currentAdminUser.fullName}</span>
                    <span className={`font-mono text-[10px] font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>C.I. {currentAdminUser.cedula}</span>
                  </div>
                  <div className={`text-[10px] font-medium truncate max-w-[170px] ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                    {currentAdminUser.roleTitle}
                  </div>
                </div>
                {onAdminLogout && (
                  <button
                    type="button"
                    onClick={onAdminLogout}
                    className="ml-1 px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-600 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
                    title="Cerrar sesión de administrador"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Cerrar Sesión</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className={`border-b px-3 sm:px-5 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0 ${
          isDark ? 'bg-zinc-950 border-zinc-750' : 'bg-slate-100 border-slate-300'
        }`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark 
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800' 
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Métricas & Actividades en Vivo</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            onClick={() => setActiveTab('carreras_activas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'carreras_activas'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Car className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Carreras Activas</span>
            <span className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
              isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{activeTrips.filter((t) => t.status === 'en_curso').length} en ruta</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ejecutivo_quito')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'ejecutivo_quito'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg border border-blue-300/60'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-750 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Plane className="w-4 h-4 text-blue-500" />
            <span>Ejecutivo a Quito & Aeropuerto</span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
              isDark ? 'bg-blue-500/20 text-blue-300 border-blue-400/40' : 'bg-blue-100 text-blue-800 border-blue-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              <span>Tababela VIP</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unidades')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'unidades'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Radio className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Radar Flota en Vivo (Motos & Carros)</span>
            <span className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
              isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{drivers.length} en vivo</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reportes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'reportes'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <DollarSign className={`w-4 h-4 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
            <span>Reportes de Ingresos ($)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
              isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              Imprimible
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recargas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'recargas'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Wallet className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Recargas & Billetera</span>
            {totalRechargePending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] text-white font-bold animate-pulse">
                {recharges.filter((r) => r.status === 'pendiente').length} pend.
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('encomiendas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'encomiendas'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>División Encomiendas</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              isDark ? 'bg-black/50 text-amber-200' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {totalEncomiendasCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tarifas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'tarifas'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Sliders className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Tarifas Oficiales ($1.25 / 2.7 km)</span>
          </button>

          <button
            onClick={() => setActiveTab('tarifas_encomiendas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'tarifas_encomiendas'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border border-emerald-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Package className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>Gestionar Tarifas Encomiendas</span>
          </button>

          <button
            onClick={() => setActiveTab('conductores')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'conductores'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Users className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Conductores & Documentos</span>
            {newRegisteredDriversCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                <Bell className="w-2.5 h-2.5" />
                <span>{newRegisteredDriversCount} nuevo{newRegisteredDriversCount > 1 ? 's' : ''}</span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('estadisticas_conductor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'estadisticas_conductor'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Estadísticas</span>
          </button>

          <button
            onClick={() => setActiveTab('financiero')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'financiero'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span>Tablero Financiero (Recharts)</span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Users className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Personal 24 Provincias</span>
          </button>

          <button
            onClick={() => setActiveTab('cuentas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'cuentas'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md border border-amber-300/50'
                : isDark
                  ? 'text-zinc-200 bg-zinc-900 border border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Building2 className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span>Cuentas Bancarias Oficiales</span>
          </button>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* ========================================================= */}
          {/* BANNER URGENTE ROJO DE ALERTA SOS EN VIVO (Máxima Prioridad) */}
          {/* ========================================================= */}
          {activeSosAlerts && activeSosAlerts.filter((a) => !a.resolved).length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-red-500 shadow-2xl shadow-red-900/60 text-white animate-pulse space-y-3">
              <div className="flex items-center justify-between border-b border-red-700/60 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center animate-bounce flex-shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      🚨 ALERTA SOS ACTIVADA EN TIEMPO REAL ({activeSosAlerts.filter((a) => !a.resolved).length} Emergencias)
                    </h3>
                    <p className="text-[11px] text-red-200">
                      Un pasajero o chofer ha presionado el botón de auxilio 911 en su aplicación
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-xs">
                  PRIORIDAD 1
                </span>
              </div>

              {activeSosAlerts.filter((a) => !a.resolved).map((sos) => (
                <div
                  key={sos.id}
                  className="p-3 rounded-xl bg-black/60 border border-red-500/50 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white text-xs sm:text-sm">
                        ALERTA SOS ACTIVADA - Carrera #{sos.tripId || 'CAR-001'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-red-600 text-[10px] font-black uppercase text-white">
                        {sos.userRole}
                      </span>
                    </div>
                    <p className="text-xs text-red-200">
                      Cliente: <strong className="text-white">{sos.userName}</strong> • Tel: <span className="font-mono text-amber-300">{sos.userPhone}</span>
                      {sos.driverName && (
                        <span> • Chofer: <strong className="text-white">{sos.driverName}</strong></span>
                      )}
                      {sos.driverPlate && (
                        <span> • Unidad: <strong className="text-amber-400 font-mono">[{sos.driverPlate}]</strong></span>
                      )}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>Coordenadas GPS: {sos.coords.lat.toFixed(5)}, {sos.coords.lng.toFixed(5)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('unidades')}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Ver Radar en Vivo</span>
                    </button>

                    <a
                      href="tel:911"
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Llamar ECU 911</span>
                    </a>

                    {onResolveSosAlert && (
                      <button
                        type="button"
                        onClick={() => onResolveSosAlert(sos.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Marcar Resuelto</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: ESTADÍSTICAS DE CONDUCTOR                             */}
          {/* ========================================================= */}
          {activeTab === 'estadisticas_conductor' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-750 pb-3">
                <h3 className="text-base font-black text-white">ESTADÍSTICAS DE CONDUCTORES</h3>
                <p className="text-xs text-zinc-300 font-medium">
                  Gráficos de rendimiento semanal, ingresos y cantidad de viajes
                </p>
              </div>
              <DriverStatsSection drivers={drivers} />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: GESTIÓN DE TARIFAS DE ENCOMIENDAS                    */}
          {/* ========================================================= */}
          {activeTab === 'tarifas_encomiendas' && (
            <AdminParcelTariffsManager isDark={isDark} />
          )}

          {/* ========================================================= */}
          {/* TAB: CARRERAS ACTIVAS EN VIVO ($1.25 / 2.7 KM)            */}
          {/* ========================================================= */}
          {activeTab === 'carreras_activas' && (
            <AdminActiveRidesView
              trips={activeTrips}
              onUpdateTripStatus={handleUpdateTripStatus}
              onOpenFareCalculator={() => setShowFareCalculatorModal(true)}
              isDark={isDark}
              onDispatchManualTrip={(tripData) => {
                if (onDispatchManualTrip) {
                  onDispatchManualTrip(tripData);
                } else {
                  databaseService.addOrUpdateTrip(tripData as AdminActiveTrip);
                  setActiveTrips(databaseService.getActiveTrips());
                }
              }}
              onDeleteTrip={(tripId) => {
                databaseService.deleteTrip(tripId);
                setActiveTrips(databaseService.getActiveTrips());
                setRechargeSuccessMessage(`Carrera #${tripId} eliminada del sistema.`);
                setTimeout(() => setRechargeSuccessMessage(null), 3000);
              }}
              onClearFinishedTrips={() => {
                databaseService.clearFinishedTrips();
                setActiveTrips(databaseService.getActiveTrips());
                setRechargeSuccessMessage('Historial de carreras finalizadas/canceladas vaciado.');
                setTimeout(() => setRechargeSuccessMessage(null), 3000);
              }}
              onClearAllTrips={() => {
                databaseService.clearAllTrips();
                setActiveTrips([]);
                setRechargeSuccessMessage('Todas las carreras han sido eliminadas. Monitor en CERO.');
                setTimeout(() => setRechargeSuccessMessage(null), 3000);
              }}
            />
          )}

          {/* ========================================================= */}
          {/* TAB: GESTIÓN & MONITOREO EJECUTIVO A QUITO & AEROPUERTO   */}
          {/* ========================================================= */}
          {activeTab === 'ejecutivo_quito' && (
            <AdminEjecutivoQuitoView
              drivers={drivers}
              activeTrips={activeTrips}
              onUpdateTripStatus={handleUpdateTripStatus}
              isDark={isDark}
              onDispatchManualTrip={(tripData) => {
                if (onDispatchManualTrip) {
                  onDispatchManualTrip(tripData);
                } else {
                  databaseService.addOrUpdateTrip(tripData as AdminActiveTrip);
                  setActiveTrips(databaseService.getActiveTrips());
                }
              }}
              onOpenFareCalculator={() => setShowFareCalculatorModal(true)}
            />
          )}

          {/* ========================================================= */}
          {/* TAB: REPORTES DE INGRESOS DIARIOS EN DÓLARES              */}
          {/* ========================================================= */}
          {activeTab === 'reportes' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border-2 shadow-lg ${
                isDark ? 'bg-zinc-900 border-emerald-500/40 text-white' : 'bg-emerald-50/80 border-emerald-300 text-slate-900'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      REPORTES DE INGRESOS DIARIOS Y LIQUIDACIONES EN DÓLARES
                    </h3>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Auditoría de recaudación de carreras, retención del 7% para AndesMovi, liquidación del 93% para conductores y exportación para imprimir.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-abrir-reporte-ingresos"
                  onClick={() => setShowIncomeReportsModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>Generar Reporte Imprimible (PDF)</span>
                </button>
              </div>

              <AdminFinancialDashboard
                tripsCount={activeTrips.length}
                recharges={recharges}
                platformCommissionPercent={editableTariffs.platformCommissionPercent}
                isDark={isDark}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: CUENTAS BANCARIAS OFICIALES                          */}
          {/* ========================================================= */}
          {activeTab === 'cuentas' && (
            <div className="space-y-4 animate-fadeIn">
              <AdminBankAccountsList
                title="Cuentas Bancarias Oficiales de AndesMovi Ecuador"
                subtitle="Cuentas bancarias habilitadas para recepción de transferencias y depósitos de choferes y clientes."
                isDark={isDark}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: SEGUIMIENTO EN TIEMPO REAL / RADAR DE UNIDADES       */}
          {/* ========================================================= */}
          {activeTab === 'unidades' && (
            <AdminUnitsTracking
              drivers={drivers}
              onUpdateDrivers={onUpdateDrivers}
              onOpenUnitRegister={() => setShowUnitRegisterModal(true)}
              onDeleteDriver={handleDeleteDriverItem}
              isDark={isDark}
            />
          )}

          {/* ========================================================= */}
          {/* TAB: GESTIÓN DE PERSONAL Y OPERADORES (24 PROVINCIAS)      */}
          {/* ========================================================= */}
          {activeTab === 'personal' && (
            <AdminStaffManagement
              workers={localWorkers}
              onUpdateWorkers={handleUpdateWorkers}
              currentAdminUser={currentAdminUser || localWorkers[0]}
              isDark={isDark}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 1: DIVISIÓN DE ENCOMIENDAS (APARTE)                    */}
          {/* ========================================================= */}
          {activeTab === 'encomiendas' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Division Header & Actions */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border-2 shadow-md ${
                isDark
                  ? 'bg-zinc-900 border-amber-600/50 text-white'
                  : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-amber-400 text-slate-900'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      DIVISIÓN DE ENCOMIENDAS & CARGA ANDINA
                    </h3>
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-amber-200/90' : 'text-slate-700'}`}>
                    Módulo logístico dedicado: Emisión de guías, asignación de transporte, trazabilidad nacional y entrega exclusiva con Cédula (Sin PIN)
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-amber-400 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <CSVLink
                    data={getEncomiendasCSVData()}
                    filename={`encomiendas_${new Date().toISOString().slice(0,10)}.csv`}
                    className="px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar CSV</span>
                  </CSVLink>
                  {encomiendas.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCompletedEncomiendas}
                      className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                        isDark
                          ? 'bg-zinc-800 hover:bg-red-950 text-red-300 border-zinc-700 hover:border-red-500'
                          : 'bg-slate-100 hover:bg-red-50 text-red-700 border-slate-300 hover:border-red-300'
                      }`}
                      title="Eliminar del panel las encomiendas ya entregadas o canceladas"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Eliminar Entregadas</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNewEncomiendaModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-900/50 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Nueva Encomienda (Crear Guía)</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics of Encomiendas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Total Encomiendas</span>
                  <span className={`text-2xl font-black mt-0.5 block ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalEncomiendasCount}</span>
                  <span className={`text-[10px] font-bold block mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>100% Trazables</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>En Tránsito / Reparto</span>
                  <span className={`text-2xl font-black mt-0.5 block ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{totalEncomiendasTransit}</span>
                  <span className={`text-[10px] font-medium block mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>GPS Monitoreado</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Entregadas con Éxito</span>
                  <span className={`text-2xl font-black mt-0.5 block ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{totalEncomiendasDelivered}</span>
                  <span className={`text-[10px] font-bold block mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Cédula Verificada</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Comisiones 9% (Provincias)</span>
                  <span className={`text-2xl font-black mt-0.5 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    ${encomiendas
                      .filter(e => e.status === 'en_transito_interprovincial' || e.status === 'entregada')
                      .reduce((acc, e) => acc + (e.deliveryCostUsd * 0.09), 0)
                      .toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-bold block mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Recaudado AndesMovi</span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border-2 shadow-md ${
                isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="relative w-full sm:w-80">
                  <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-300' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={encomiendaSearch}
                    onChange={(e) => setEncomiendaSearch(e.target.value)}
                    placeholder="Buscar guía, remitente, ciudad..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border-2 text-xs font-medium focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                  {[
                    { id: 'todas', label: 'Todas' },
                    { id: 'recepcionada', label: 'Recepcionadas' },
                    { id: 'en_bodega', label: 'En Bodega' },
                    { id: 'en_transito_interprovincial', label: 'En Tránsito' },
                    { id: 'en_reparto_local', label: 'En Reparto' },
                    { id: 'entregada', label: 'Entregadas' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEncomiendaFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                        encomiendaFilter === f.id
                          ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:bg-zinc-750'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Encomiendas Table / Cards */}
              <div className="space-y-3">
                {filteredEncomiendas.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border-2 ${
                    isDark ? 'bg-zinc-900 border-zinc-750 text-zinc-300' : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    <Package className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
                    <p className="text-sm font-bold">No se encontraron encomiendas con ese criterio</p>
                  </div>
                ) : (
                  filteredEncomiendas.map((enc) => {
                    const statusColors: Record<EncomiendaStatus, { bg: string; text: string; border: string }> = {
                      recepcionada: { bg: isDark ? 'bg-blue-500/25' : 'bg-blue-100', text: isDark ? 'text-blue-300' : 'text-blue-800', border: isDark ? 'border-blue-400/50' : 'border-blue-300' },
                      en_bodega: { bg: isDark ? 'bg-purple-500/25' : 'bg-purple-100', text: isDark ? 'text-purple-300' : 'text-purple-800', border: isDark ? 'border-purple-400/50' : 'border-purple-300' },
                      en_transito_interprovincial: { bg: isDark ? 'bg-amber-500/25' : 'bg-amber-100', text: isDark ? 'text-amber-300' : 'text-amber-800', border: isDark ? 'border-amber-400/50' : 'border-amber-300' },
                      en_reparto_local: { bg: isDark ? 'bg-orange-500/25' : 'bg-orange-100', text: isDark ? 'text-orange-300' : 'text-orange-800', border: isDark ? 'border-orange-400/50' : 'border-orange-300' },
                      entregada: { bg: isDark ? 'bg-emerald-500/25' : 'bg-emerald-100', text: isDark ? 'text-emerald-300' : 'text-emerald-800', border: isDark ? 'border-emerald-400/50' : 'border-emerald-300' },
                      con_incidencia: { bg: isDark ? 'bg-red-500/25' : 'bg-rose-100', text: isDark ? 'text-red-300' : 'text-rose-800', border: isDark ? 'border-red-400/50' : 'border-rose-300' },
                    };

                    const statusLabels: Record<EncomiendaStatus, string> = {
                      recepcionada: 'Recepcionada',
                      en_bodega: 'En Bodega Terminal',
                      en_transito_interprovincial: 'En Tránsito Interprovincial',
                      en_reparto_local: 'En Reparto Local',
                      entregada: 'Entregada',
                      con_incidencia: 'Con Incidencia',
                    };

                    return (
                      <div
                        key={enc.id}
                        className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700/90 hover:border-amber-500/70'
                            : 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'
                        }`}
                      >
                        <div className="space-y-2.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded border ${
                              isDark ? 'text-amber-300 bg-amber-500/20 border-amber-500/40' : 'text-amber-800 bg-amber-50 border-amber-300'
                            }`}>
                              {enc.trackingNumber}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusColors[enc.status].bg} ${statusColors[enc.status].text} ${statusColors[enc.status].border}`}
                            >
                              {statusLabels[enc.status]}
                            </span>
                            <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
                              Creado: {enc.createdFormatted}
                            </span>
                          </div>

                          {/* Route & City Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className={`p-3 rounded-xl border-2 shadow-inner ${
                              isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className={`text-[10px] font-black uppercase tracking-wider block ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>REMITENTE (ORIGEN)</span>
                              <p className={`font-black text-sm truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{enc.senderName}</p>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-200' : 'text-slate-600'}`}>
                                {enc.senderCity} • <span className="font-mono">{enc.senderPhone}</span>
                              </p>
                            </div>

                            <div className={`p-3 rounded-xl border-2 shadow-inner ${
                              isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className={`text-[10px] font-black uppercase tracking-wider block ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>DESTINATARIO (DESTINO)</span>
                              <p className={`font-black text-sm truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{enc.receiverName}</p>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-200' : 'text-slate-600'}`}>
                                {enc.receiverCity} • <span className="font-mono">{enc.receiverPhone}</span>
                              </p>
                            </div>
                          </div>

                          {/* Package description & Carrier */}
                          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs p-2.5 rounded-xl border ${
                            isDark ? 'text-zinc-200 bg-zinc-850 border-zinc-750' : 'text-slate-700 bg-slate-100 border-slate-200'
                          }`}>
                            <span>
                              <strong className={isDark ? 'text-zinc-300' : 'text-slate-900'}>Contenido:</strong> {enc.description} ({enc.weightKg} kg)
                            </span>
                            <span>
                              <strong className={isDark ? 'text-zinc-300' : 'text-slate-900'}>Valor Declarado:</strong> ${enc.declaredValueUsd.toFixed(2)}
                            </span>
                            <span>
                              <strong className={isDark ? 'text-zinc-300' : 'text-slate-900'}>Transportista:</strong> {enc.assignedCarrierName}
                            </span>
                            <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                              isDark ? 'text-emerald-300 bg-black/40 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                            }`}>
                              Entrega: Cédula {enc.receiverIdNumber} (Sin PIN)
                            </span>
                          </div>
                        </div>

                        {/* Price & State Selector */}
                        <div className={`flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 ${
                          isDark ? 'border-zinc-750' : 'border-slate-200'
                        } flex-shrink-0`}>
                          <div className="text-left lg:text-right">
                            <span className={`text-xs font-medium block ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>Costo de Flete</span>
                            <span className={`text-xl font-black ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                              ${enc.deliveryCostUsd.toFixed(2)} USD
                            </span>
                            <span className={`text-[10px] font-medium block mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
                              {enc.paymentStatus === 'pagado_origen' ? 'Pagado en origen' : 'Cobro contra entrega'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {/* Action: Print Guía */}
                            <button
                              onClick={() => setSelectedEncomiendaForGuide(enc)}
                              className={`px-3 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-650'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                              title="Ver Guía de Remisión Oficial"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Ver Guía</span>
                            </button>

                            {/* Status Changer Select */}
                            <select
                              value={enc.status}
                              onChange={(e) => handleUpdateEncomiendaStatus(enc.id, e.target.value as EncomiendaStatus)}
                              className={`px-3 py-2 rounded-xl border-2 text-xs font-bold hover:border-amber-400 focus:outline-none focus:border-amber-400 shadow-inner cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800 border-zinc-650 text-amber-300'
                                  : 'bg-slate-50 border-slate-300 text-slate-900'
                              }`}
                            >
                              <option value="recepcionada">1. Recepcionada</option>
                              <option value="en_bodega">2. En Bodega</option>
                              <option value="en_transito_interprovincial">3. En Tránsito</option>
                              <option value="en_reparto_local">4. En Reparto</option>
                              <option value="entregada">5. Entregada</option>
                              <option value="con_incidencia">6. Con Incidencia</option>
                            </select>

                            {/* Action: Delete Encomienda */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar la encomienda #${enc.trackingNumber} del sistema?`)) {
                                  handleDeleteEncomienda(enc.id);
                                }
                              }}
                              className={`px-2.5 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-400'
                              }`}
                              title="Eliminar encomienda del registro"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CONFIGURACIÓN DE TARIFAS Y COMISIONES              */}
          {/* ========================================================= */}
          {activeTab === 'tarifas' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
                isDark ? 'border-zinc-750' : 'border-slate-200'
              }`}>
                <div>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>CONFIGURACIÓN DE TARIFAS DEL SISTEMA</h3>
                  <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Ajuste de comisiones, tarifas por kilómetro y multiplicadores dinámicos que rigen las cotizaciones
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetTariffs}
                    className={`px-3.5 py-2 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                      isDark ? 'bg-zinc-800 border-zinc-650 hover:bg-zinc-700 text-zinc-200 hover:text-white' : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restablecer Fábrica</span>
                  </button>
                  <button
                    onClick={handleSaveTariffs}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>Guardar Tarifas en Tiempo Real</span>
                  </button>
                </div>
              </div>

              {tariffSaveMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/25 border-2 border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{tariffSaveMessage}</span>
                </div>
              )}

              {/* 1. COMISIÓN GENERAL DE ANDESMOVI & MULTIPLICADOR */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-md ${
                isDark ? 'bg-zinc-900 border-amber-500/40 text-white' : 'bg-white border-amber-300 text-slate-900'
              }`}>
                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${
                    isDark ? 'text-amber-300' : 'text-amber-800'
                  }`}>
                    Comisiones Oficiales AndesMovi
                  </label>
                  <p className={`text-xs mb-3 font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Políticas de retención y cobros sobre los servicios completados por conductores.
                  </p>
                  <div className={`p-3 mb-3 rounded-xl border space-y-1.5 text-[11px] ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex justify-between items-center ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      <span>🛵 Carreras Urbanas y Delivery / Domicilio:</span>
                      <span className={`font-mono font-black ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>7% Comisión</span>
                    </div>
                    <div className={`flex justify-between items-center ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      <span>📦 Encomiendas Interprovinciales:</span>
                      <span className={`font-mono font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>9% Comisión</span>
                    </div>
                    <div className={`flex justify-between items-center ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      <span>💳 Fondo de Seguridad Obligatorio:</span>
                      <span className={`font-mono font-black ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>$10.00 USD</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="30"
                      value={editableTariffs.platformCommissionPercent}
                      onChange={(e) =>
                        setEditableTariffs({
                          ...editableTariffs,
                          platformCommissionPercent: Number(e.target.value),
                        })
                      }
                      className={`w-24 px-3 py-2 rounded-xl border-2 font-black text-base focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-amber-300' : 'bg-slate-50 border-slate-300 text-amber-800'
                      }`}
                    />
                    <span className={`text-[11px] font-bold leading-tight ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      Base general: {editableTariffs.platformCommissionPercent}% de comisión para servicios locales. Las encomiendas interprovinciales aplican tarifa fija del 9%.
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-wider mb-1 ${
                    isDark ? 'text-amber-300' : 'text-amber-800'
                  }`}>
                    Multiplicador de Demanda Dinámica (Surge Pricing)
                  </label>
                  <p className={`text-xs mb-2 font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Factor multiplicador sobre todas las cotizaciones de la app (ej: lluvia, horas pico).
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { val: 1.0, label: '1.0x Normal' },
                      { val: 1.2, label: '1.2x Alta Demanda' },
                      { val: 1.5, label: '1.5x Lluvia / Fiestas' },
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setEditableTariffs({ ...editableTariffs, dynamicMultiplier: m.val })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                          editableTariffs.dynamicMultiplier === m.val
                            ? 'bg-amber-500 text-zinc-950 font-black'
                            : isDark
                            ? 'bg-zinc-800 text-zinc-200 border-2 border-zinc-700 hover:bg-zinc-750'
                            : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. GRID DE TARIFAS POR SERVICIO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Carreras Urbanas */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/90 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}>
                  <div className={`flex items-center gap-2 border-b pb-2.5 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
                    <Car className={`w-5 h-5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Carreras de Pasajeros</h4>
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      Tarifa Base ($1.25 Oficial)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={editableTariffs.rideBaseFareUsd}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, rideBaseFareUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      Km Cubiertos por Tarifa Base (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableTariffs.rideBaseCoverageKm ?? 2.7}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, rideBaseCoverageKm: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-black focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-amber-500/60 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                    />
                    <span className={`text-[10px] font-bold block mt-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      Oficial: 2.7 km cubiertos por $1.25
                    </span>
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      Precio Km Excedente (USD/km)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editableTariffs.rideExtraPerKmUsd ?? editableTariffs.ridePerKmUsd}
                      onChange={(e) =>
                        setEditableTariffs({
                          ...editableTariffs,
                          rideExtraPerKmUsd: Number(e.target.value),
                          ridePerKmUsd: Number(e.target.value),
                        })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className={`text-[10px] block mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Aplica a partir de superar los 2.7 km
                    </span>
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Tarifa Mínima Carrera (USD)</label>
                    <input
                      type="number"
                      step="0.25"
                      value={editableTariffs.rideMinimumFareUsd}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, rideMinimumFareUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFareCalculatorModal(true)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Probar Calculadora $1.25 / 2.7 km</span>
                  </button>
                </div>

                {/* Domicilios / Delivery */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/90 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}>
                  <div className={`flex items-center gap-2 border-b pb-2.5 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
                    <Bike className={`w-5 h-5 ${isDark ? 'text-sky-300' : 'text-sky-600'}`} />
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Delivery / Domicilios</h4>
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Tarifa Base Delivery (USD)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editableTariffs.deliveryBaseFareUsd}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, deliveryBaseFareUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Precio por Kilómetro (USD/km)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editableTariffs.deliveryPerKmUsd}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, deliveryPerKmUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Recargo por Lluvia (USD)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={editableTariffs.deliveryRainFeeUsd}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, deliveryRainFeeUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Encomiendas y Paquetería */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/90 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}>
                  <div className={`flex items-center gap-2 border-b pb-2.5 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
                    <Package className={`w-5 h-5 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Encomiendas & Carga</h4>
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Tarifa Base Encomienda (USD)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editableTariffs.parcelBaseFareUsd}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, parcelBaseFareUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Tarifa Mínima Flete / Envío (USD)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="6"
                      value={editableTariffs.parcelMinimumFareUsd || 6.0}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, parcelMinimumFareUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-emerald-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Cargo por kg adicional (USD/kg)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editableTariffs.parcelExtraKgFeeUsd}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, parcelExtraKgFeeUsd: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Bonos por Recarga */}
                  <div className={`pt-2 border-t mt-2 space-y-3.5 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <Wallet className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
                      <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Reglas de Bonos (Recargas)</h4>
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold block mb-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Umbral (USD)</label>
                      <input
                        type="number"
                        step="5"
                        value={editableTariffs.rechargeBonusRules?.thresholdUsd || 50}
                        onChange={(e) =>
                          setEditableTariffs({
                            ...editableTariffs,
                            rechargeBonusRules: {
                              ...editableTariffs.rechargeBonusRules,
                              thresholdUsd: Number(e.target.value),
                              bonusUsd: editableTariffs.rechargeBonusRules?.bonusUsd || 5,
                            },
                          })
                        }
                        className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 ${
                          isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-bold block mb-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Bono (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableTariffs.rechargeBonusRules?.bonusUsd || 5}
                        onChange={(e) =>
                          setEditableTariffs({
                            ...editableTariffs,
                            rechargeBonusRules: {
                              ...editableTariffs.rechargeBonusRules,
                              thresholdUsd: editableTariffs.rechargeBonusRules?.thresholdUsd || 50,
                              bonusUsd: Number(e.target.value),
                            },
                          })
                        }
                        className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 ${
                          isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Seguro de Carga (% Valor Declarado)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editableTariffs.parcelInsurancePercent}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, parcelInsurancePercent: Number(e.target.value) })
                      }
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Servicio Ejecutivo Tulcán ⇄ Quito & Aeropuerto */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3.5 shadow-md ${
                  isDark ? 'bg-zinc-900 border-blue-500/50 text-white' : 'bg-white border-blue-200 text-slate-900 shadow-sm'
                }`}>
                  <div className={`flex items-center gap-2 border-b pb-2.5 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
                    <Plane className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Ejecutivo Tulcán ⇄ Quito & Aeropuerto</h4>
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Tarifa Fija por Asiento (USD)</label>
                    <input
                      type="number"
                      step="1.00"
                      value={editableTariffs.executiveQuitoFixedFareUsd ?? 25.0}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, executiveQuitoFixedFareUsd: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800 border-2 border-blue-500/40 hover:border-blue-400 text-xs font-bold text-white focus:outline-none focus:border-blue-400 shadow-inner"
                    />
                    <span className="text-[10px] text-zinc-400 block mt-1">
                      Tarifa fija pactada oficial por cupo ($25.00 USD sugerido)
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-200 font-bold block mb-1">Tarifa Auto Completo / Puerta a Puerta (USD)</label>
                    <input
                      type="number"
                      step="5.00"
                      value={editableTariffs.executiveQuitoWholeCarFareUsd ?? 100.0}
                      onChange={(e) =>
                        setEditableTariffs({ ...editableTariffs, executiveQuitoWholeCarFareUsd: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800 border-2 border-blue-500/40 hover:border-blue-400 text-xs font-bold text-white focus:outline-none focus:border-blue-400 shadow-inner"
                    />
                    <span className="text-[10px] text-zinc-400 block mt-1">
                      Reserva de los 4 cupos exclusivos ($100.00 USD sugerido)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: RECARGAS Y BILLETERAS DIGITALES                    */}
          {/* ========================================================= */}
          {activeTab === 'recargas' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-zinc-750 pb-3">
                <h3 className="text-base font-black text-white">RECARGAS DE BILLETERAS Y CAJA</h3>
                <p className="text-xs text-zinc-300 font-medium">
                  Aprobación de pagos bancarios (DeUna, Pichincha, Guayaquil, Produbanco) e inyección manual de saldo
                </p>
              </div>

              {rechargeSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/25 border-2 border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{rechargeSuccessMessage}</span>
                </div>
              )}

              {/* Top summary box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-xs block font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Total Recargas Aprobadas</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-0.5 block">${totalRechargedApproved.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold block mt-1">Saldo en circulación activa</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-xs block font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Recargas Pendientes</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-0.5 block">${totalRechargePending.toFixed(2)}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-300 font-bold block mt-1">Requieren verificación</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-xs block font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Billetera Conductor Actual</span>
                  <span className="text-2xl font-black text-sky-600 dark:text-sky-300 mt-0.5 block">${driverWalletBalance.toFixed(2)}</span>
                  <span className={`text-[10px] font-bold block mt-1 ${isDark ? 'text-sky-200' : 'text-sky-700'}`}>Saldo disponible para retiros</span>
                </div>
              </div>

              {/* Cuentas Bancarias Oficiales de Administrador (Jhon Sebastian Yepez Clavijo) */}
              <AdminBankAccountsList
                title="Cuentas Bancarias Oficiales de Administrador para Depósitos"
                subtitle="Cuentas registradas a nombre de Jhon Sebastian Yepez Clavijo (C.I. 1004721351) para validación de depósitos y acreditaciones"
                isDark={isDark}
              />

              {/* Solicitudes Pendientes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                    isDark ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <span>Solicitudes de Recarga con Documento de Transferencia</span>
                  </h4>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Depósitos a cuentas de Jhon Sebastian Yepez Clavijo
                  </span>
                </div>

                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  isDark ? 'bg-amber-950/30 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>
                    <strong>Instrucción de Seguridad:</strong> Inspecciona el documento de transferencia presentado por el conductor y confirma la acreditación en tu cuenta personal antes de activar el saldo.
                  </span>
                </div>

                {recharges.filter((r) => r.status === 'pendiente').length === 0 ? (
                  <div className={`p-6 text-center rounded-2xl border-2 shadow-sm ${
                    isDark ? 'bg-zinc-900 border-zinc-750 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-bold">No hay solicitudes de recarga pendientes por verificar</p>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Todos los documentos de transferencia han sido procesados.</p>
                  </div>
                ) : (
                  recharges
                    .filter((r) => r.status === 'pendiente')
                    .map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 sm:p-5 rounded-2xl border-2 shadow-md flex flex-col justify-between gap-4 transition-all ${
                          isDark
                            ? 'bg-zinc-900 border-amber-500/60 hover:border-amber-400'
                            : 'bg-white border-amber-300 hover:border-amber-500 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{req.driverOrUserName}</span>
                              <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                                isDark ? 'bg-amber-500/25 text-amber-300 border-amber-500/50' : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {req.role}
                              </span>
                              <span className={`text-[11px] font-medium flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                <Clock className="w-3 h-3 text-zinc-400" />
                                {req.requestedAtFormatted}
                              </span>
                            </div>

                            <div className={`text-xs space-y-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                              <p className="flex flex-wrap items-center gap-2">
                                <span>Canal: <strong className={`uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{req.paymentMethod}</strong></span>
                                <span>• Banco origen: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{req.bankName || 'Banca Móvil'}</strong></span>
                                <span>• N° Comprobante: <strong className={`font-mono px-2 py-0.5 rounded border text-xs font-black ${
                                  isDark ? 'text-amber-300 bg-black/60 border-amber-500/40' : 'text-amber-900 bg-amber-50 border-amber-300'
                                }`}>{req.transferVoucherNumber || req.referenceNumber}</strong></span>
                              </p>
                              <div className={`p-2 rounded-xl border text-[11px] ${
                                isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>
                                <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Cuenta Personal Receptora:</span>
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {req.destinationBank || req.bankName || 'Banco Pichincha'} • N° {req.destinationAccountNumber || '2207472368'}
                                </span>
                                <span className={`block text-[10px] ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                  Titular: {req.destinationAccountHolder || 'Jhon Sebastian Yepez Clavijo (C.I. 1004721351)'}
                                </span>
                              </div>
                            </div>

                            {req.adminNotes && (
                              <p className={`text-xs italic ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Nota del Chofer: {req.adminNotes}</p>
                            )}
                          </div>

                          <div className="text-right flex flex-col items-end flex-shrink-0">
                            <span className={`text-xs font-bold uppercase block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Monto a Activar</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300 block">${req.amountUsd.toFixed(2)} USD</span>
                          </div>
                        </div>

                        {/* Document inspection strip & action buttons */}
                        <div className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDark ? 'border-zinc-800' : 'border-slate-200'
                        }`}>
                          <div>
                            {req.proofImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedProofDoc(req)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors group shadow-sm ${
                                  isDark ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                                }`}
                              >
                                <FileText className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                <span>📄 Inspeccionar Documento de Transferencia</span>
                              </button>
                            ) : (
                              <span className={`text-[11px] flex items-center gap-1 italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />
                                Sin documento adjunto (comprobante solo numérico)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteRecharge(req.id)}
                              className={`p-2 rounded-xl border-2 text-xs transition-all shadow-sm active:scale-95 cursor-pointer ${
                                isDark ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500' : 'bg-slate-100 hover:bg-red-50 text-red-600 border-slate-300 hover:border-red-300'
                              }`}
                              title="Eliminar solicitud del registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingReq(req)}
                              className={`px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                                isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/50' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
                              }`}
                            >
                              Rechazar Comprobante
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveRecharge(req.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Aprobar Depósito • Subir Saldo Inmediatamente</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Formulario de Recarga Manual Directa */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-4 shadow-md ${
                isDark ? 'bg-zinc-900 border-zinc-700/90' : 'bg-white border-slate-200'
              }`}>
                <div className={`flex items-center gap-2 border-b pb-2.5 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Inyección / Recarga Manual Directa desde el Panel
                  </h4>
                </div>
                <form onSubmit={handleManualRechargeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Destinatario</label>
                    <input
                      type="text"
                      value={manualRechargeUser}
                      onChange={(e) => setManualRechargeUser(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs focus:outline-none focus:border-amber-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Monto en USD</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={manualRechargeAmount}
                      onChange={(e) => setManualRechargeAmount(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-black focus:outline-none focus:border-emerald-400 shadow-inner ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-emerald-300' : 'bg-slate-50 border-slate-300 text-emerald-700'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Concepto / Motivo</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualRechargeNote}
                        onChange={(e) => setManualRechargeNote(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border-2 text-xs focus:outline-none focus:border-amber-400 shadow-inner ${
                          isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex-shrink-0 transition-transform active:scale-95 shadow-md cursor-pointer"
                      >
                        Recargar
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Historial de recargas procesadas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Historial de Recargas Procesadas
                  </h4>
                  {recharges.filter((r) => r.status !== 'pendiente').length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearProcessedRecharges}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                        isDark ? 'bg-zinc-800 hover:bg-red-950/60 text-zinc-300 hover:text-red-400 border-zinc-700' : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-300'
                      }`}
                      title="Eliminar todo el historial de recargas procesadas"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpiar Historial</span>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {recharges
                    .filter((r) => r.status !== 'pendiente')
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-xl border-2 flex items-center justify-between text-xs shadow-sm ${
                          isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${r.status === 'aprobada' ? 'bg-emerald-500' : 'bg-red-500'}`}
                          />
                          <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.driverOrUserName}</span>
                          <span className={`font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>• {r.referenceNumber}</span>
                          <span className={isDark ? 'text-zinc-300' : 'text-slate-600'}>({r.requestedAtFormatted})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.proofImageUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedProofDoc(r)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                                isDark ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                              }`}
                              title="Ver documento de transferencia presentado"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Comprobante</span>
                            </button>
                          )}
                          <span className="font-black text-emerald-600 dark:text-emerald-300 text-sm">${r.amountUsd.toFixed(2)} USD</span>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                              r.status === 'aprobada'
                                ? isDark ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isDark ? 'bg-red-500/25 text-red-300 border-red-500/40' : 'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            {r.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecharge(r.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isDark ? 'bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 border-zinc-700' : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-300'
                            }`}
                            title="Eliminar registro de recarga"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* GESTIÓN DE LIQUIDACIÓN DE SALDO EXCEDENTE (CONSERVAR $10) */}
              <div className={`space-y-3 border-t pt-5 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Solicitudes de Liquidación de Saldo (Retiro Excedente)</span>
                  </h4>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Manteniendo fondo mínimo obligatorio de $10.00 USD
                  </span>
                </div>

                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  isDark ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <ShieldAlert className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>
                    <strong>Instrucción para Jhon Sebastian:</strong> Transfiere el excedente solicitado a la cuenta bancaria del conductor y haz clic en <strong>"Confirmar Transferencia"</strong> para debitar su billetera digital automáticamente.
                  </span>
                </div>

                {/* Pendientes de Liquidar */}
                <div className="space-y-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Solicitudes Pendientes de Pago</span>
                  {payoutRequests.filter(p => p.status === 'pendiente').length === 0 ? (
                    <div className={`p-4 rounded-xl border text-center text-xs font-bold ${
                      isDark ? 'bg-zinc-900/50 border-zinc-850 text-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      No hay solicitudes de liquidación pendientes de transferencia bancaria
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payoutRequests.filter(p => p.status === 'pendiente').map(p => (
                        <div
                          key={p.id}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                            isDark ? 'bg-zinc-900 border-emerald-500/30' : 'bg-white border-emerald-300'
                          }`}
                        >
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.driverName}</span>
                              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>• {p.driverPhone}</span>
                            </div>
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 p-2.5 rounded-xl border ${
                              isDark ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              <div><strong>Banco:</strong> {p.bankName}</div>
                              <div><strong>Tipo Cuenta:</strong> {p.accountType}</div>
                              <div><strong>N° Cuenta:</strong> <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.accountNumber}</span></div>
                              <div><strong>Titular:</strong> {p.accountHolderName} ({p.accountHolderCedula})</div>
                            </div>
                            <span className={`text-[10px] block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Solicitado el {p.requestedAtFormatted}</span>
                          </div>

                          <div className="flex flex-col items-end gap-2 text-right shrink-0">
                            <div>
                              <span className={`text-xs block font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Monto Neto a Transferirle:</span>
                              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${p.amountUsd.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeletePayout(p.id)}
                                className={`p-1.5 rounded-xl border cursor-pointer ${
                                  isDark ? 'bg-zinc-950 hover:bg-red-950 text-zinc-400 hover:text-red-400 border-zinc-800' : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-300'
                                }`}
                                title="Eliminar solicitud"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectPayout(p.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                                  isDark ? 'bg-zinc-950 hover:bg-zinc-800 text-red-400 border-zinc-800' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                }`}
                              >
                                Rechazar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprovePayout(p.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shadow-md shadow-emerald-500/20 cursor-pointer"
                              >
                                Confirmar Transferencia
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historial de Liquidaciones Procesadas */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Historial de Liquidaciones Transferidas</span>
                    {payoutRequests.filter(p => p.status !== 'pendiente').length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearProcessedPayouts}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                          isDark ? 'bg-zinc-800 hover:bg-red-950/60 text-zinc-300 hover:text-red-400 border-zinc-700' : 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-300'
                        }`}
                        title="Eliminar todo el historial de liquidaciones procesadas"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Limpiar Historial</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {payoutRequests.filter(p => p.status !== 'pendiente').length === 0 ? (
                      <div className={`text-[11px] font-medium italic ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Ninguna liquidación procesada previamente.</div>
                    ) : (
                      payoutRequests.filter(p => p.status !== 'pendiente').map(p => (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            isDark ? 'bg-zinc-900/50 border-zinc-850 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${p.status === 'pagada' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.driverName}</span>
                              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>• {p.bankName}</span>
                            </div>
                            <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Procesado por {p.reviewedBy || 'Jhon Sebastian'} • Ref: Fondo de $10 USD dejado</p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className={`font-mono font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>${p.amountUsd.toFixed(2)} USD</span>
                            <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded border ${
                              p.status === 'pagada'
                                ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-800 border-red-300'
                            }`}>
                              {p.status === 'pagada' ? 'transferida' : 'rechazada'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePayout(p.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isDark ? 'bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 border-zinc-700' : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-300'
                              }`}
                              title="Eliminar registro de liquidación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CONDUCTORES & VALIDACIÓN DE DOCUMENTOS            */}
          {/* ========================================================= */}
          {activeTab === 'conductores' && (
            <div className="space-y-5 animate-fadeIn">
              <div className={`border-b pb-3 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>GESTIÓN Y VERIFICACIÓN DE CONDUCTORES</h3>
                <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  Control estricto de antecedentes penales (máximo 2 sin gravedad), licencias vigentes y RTV 2026
                </p>
              </div>

              {/* Verification Rule Notice */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 flex items-start gap-3 shadow-md ${
                isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-amber-50 border-amber-300'
              }`}>
                <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5">
                  <h4 className={`font-black text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>POLÍTICA OFICIAL DE SEGURIDAD ANDESMOVI</h4>
                  <p className={`leading-relaxed font-normal ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    Para ser habilitado en la plataforma, cada conductor debe contar con <strong className={isDark ? 'text-white' : 'text-slate-900'}>Licencia Vigente</strong> y un
                    certificado de <strong className={isDark ? 'text-white' : 'text-slate-900'}>Antecedentes Penales con MÁXIMO 2 registros menores SIN gravedad</strong> (como contravenciones
                    leves de tránsito). Conductores con antecedentes graves quedan bloqueados de forma inmediata e irrevocable.
                  </p>
                </div>
              </div>

              {/* Highlight Banner if there are newly registered drivers pending approval */}
              {drivers.filter((d) => d.isPendingApproval).length > 0 && (
                <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-xl space-y-3 ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-950/70 via-zinc-900 to-zinc-950 border-amber-500'
                    : 'bg-gradient-to-r from-amber-50 via-white to-amber-50 border-amber-400'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <h4 className={`text-sm font-black uppercase tracking-wide ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                        ¡ATENCIÓN! Nuevos Conductores Registrados ({drivers.filter((d) => d.isPendingApproval).length})
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        isDark ? 'text-amber-200 bg-amber-500/20 border-amber-500/40' : 'text-amber-900 bg-amber-100 border-amber-300'
                      }`}>
                        Pendiente de Activación
                      </span>
                      {drivers.filter((d) => d.isPendingApproval).length > 1 && (
                        <button
                          type="button"
                          onClick={handleClearAllPendingDrivers}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                          title="Vaciar todas las solicitudes de registro pendientes"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Vaciar Solicitudes ({drivers.filter((d) => d.isPendingApproval).length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Los siguientes conductores han creado su cuenta nueva y esperan activación para comenzar a recibir solicitudes en el radar:
                  </p>
                  <div className="space-y-2.5">
                    {drivers
                      .filter((d) => d.isPendingApproval)
                      .map((pDrv) => (
                        <div
                          key={pDrv.id}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                            isDark ? 'bg-zinc-950 border-amber-500/40' : 'bg-white border-amber-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{pDrv.name}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                              }`}>
                                C.I. {pDrv.cedula || 'En verificación'}
                              </span>
                              <span className={`text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                📍 {pDrv.province || 'Ecuador'}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                              Vehículo: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{pDrv.vehicle?.model}</strong> ({pDrv.vehicle?.year || 2023}) • Placa:{' '}
                              <strong className={`font-mono px-1.5 py-0.5 rounded border ${
                                isDark ? 'text-amber-300 bg-black/40 border-amber-500/30' : 'text-amber-900 bg-amber-50 border-amber-300'
                              }`}>{pDrv.vehicle?.plate}</strong> • Tel:{' '}
                              <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{pDrv.phone}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingVehicleDriverId(inspectingVehicleDriverId === pDrv.id ? null : pDrv.id);
                              }}
                              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                                inspectingVehicleDriverId === pDrv.id
                                  ? 'bg-blue-600 text-white border-blue-500 font-black'
                                  : isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              <Car className="w-3.5 h-3.5 text-amber-400" />
                              <span>{inspectingVehicleDriverId === pDrv.id ? 'Cerrar Inspección' : 'Evaluar Carro'}</span>
                            </button>
                            {onApproveDriverRegistration && (
                              <button
                                type="button"
                                onClick={() => {
                                  onApproveDriverRegistration(pDrv.id);
                                  setRechargeSuccessMessage(`¡Conductor ${pDrv.name} aprobado y habilitado con éxito!`);
                                  setTimeout(() => setRechargeSuccessMessage(null), 3500);
                                }}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>Aprobar Conductor</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRejectDriverRegistration(pDrv.id)}
                              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                              title="Rechazar y eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Rechazar y Eliminar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Drivers Filter & Search Bar */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                    <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      value={driverSearchQuery}
                      onChange={(e) => setDriverSearchQuery(e.target.value)}
                      placeholder="Buscar por conductor, placa, auto, cédula..."
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none transition-all ${
                        isDark
                          ? 'bg-zinc-950 border-zinc-750 text-white placeholder-zinc-500 focus:border-amber-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setDriverCategoryFilter('todos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        driverCategoryFilter === 'todos'
                          ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      Todos ({drivers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverCategoryFilter('ejecutivos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        driverCategoryFilter === 'ejecutivos'
                          ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-800 text-amber-400 hover:text-amber-300' : 'bg-white text-amber-700 hover:text-amber-900 border border-slate-200'
                      }`}
                    >
                      <span>⭐ Apto Ejecutivos</span>
                      <span>({drivers.filter((d) => d.vehicle?.isEjecutivoApproved || d.isEjecutivoApproved).length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverCategoryFilter('urbanos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        driverCategoryFilter === 'urbanos'
                          ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      <span>🚗 Urbano Estándar</span>
                      <span>({drivers.filter((d) => !d.vehicle?.isEjecutivoApproved && !d.isEjecutivoApproved).length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverCategoryFilter('suspendidos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        driverCategoryFilter === 'suspendidos'
                          ? 'bg-rose-500 text-white font-black shadow-sm'
                          : isDark ? 'bg-zinc-800 text-rose-400 hover:text-rose-300' : 'bg-white text-rose-700 hover:text-rose-900 border border-slate-200'
                      }`}
                    >
                      <span>🚫 Suspendidos</span>
                      <span>({drivers.filter((d) => d.isSuspended).length})</span>
                    </button>
                  </div>
                </div>

                {/* Batch Deletion: Clear Suspended Drivers */}
                {drivers.filter((d) => d.isSuspended).length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSuspendedDrivers}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer flex-shrink-0"
                    title="Eliminar permanentemente a todos los conductores suspendidos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar Suspendidos ({drivers.filter((d) => d.isSuspended).length})</span>
                  </button>
                )}
              </div>

              {/* Drivers List */}
              <div className="space-y-3">
                {drivers
                  .filter((drv) => {
                    if (driverCategoryFilter === 'ejecutivos' && !drv.vehicle?.isEjecutivoApproved && !drv.isEjecutivoApproved) return false;
                    if (driverCategoryFilter === 'urbanos' && (drv.vehicle?.isEjecutivoApproved || drv.isEjecutivoApproved)) return false;
                    if (driverCategoryFilter === 'suspendidos' && !drv.isSuspended) return false;

                    if (driverSearchQuery.trim()) {
                      const q = driverSearchQuery.toLowerCase();
                      const mName = drv.name.toLowerCase().includes(q);
                      const mPlate = drv.vehicle?.plate?.toLowerCase().includes(q);
                      const mModel = drv.vehicle?.model?.toLowerCase().includes(q);
                      const mCedula = drv.cedula?.toLowerCase().includes(q);
                      const mProv = drv.province?.toLowerCase().includes(q);
                      if (!mName && !mPlate && !mModel && !mCedula && !mProv) return false;
                    }
                    return true;
                  })
                  .map((drv) => {
                    const isApproved =
                      driverDocuments.isCriminalRecordApproved && driverDocuments.isLicenseValid;
                    const isEjecutivo = Boolean(drv.vehicle?.isEjecutivoApproved || drv.isEjecutivoApproved);
                    const isVehicleInspecting = inspectingVehicleDriverId === drv.id;
                    const vYear = drv.vehicle?.year || 2023;
                    const isYearOptimal = vYear >= 2018;

                    // Checklist state for this driver
                    const currentSpecs = vehicleChecklist[drv.id] || {
                      hasAirConditioning: drv.vehicle?.hasAirConditioning ?? true,
                      hasTrunkCapacity: drv.vehicle?.hasTrunkCapacity ?? true,
                      hasComfortSeats: drv.vehicle?.hasComfortSeats ?? true,
                      hasUsbCharger: drv.vehicle?.hasUsbCharger ?? true,
                      hasRtvApproved: drv.vehicle?.hasRtvApproved ?? true,
                      category: (drv.vehicle?.ejecutivoCategory as any) || 'sedan_confort',
                      notes: drv.vehicle?.ejecutivoNotes || '',
                    };

                    return (
                      <div
                        key={drv.id}
                        className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col gap-4 shadow-md transition-all ${
                          isDark ? 'bg-zinc-900 border-zinc-700/90 hover:border-zinc-600' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={drv.avatar}
                              alt={drv.name}
                              className={`w-12 h-12 rounded-xl object-cover border-2 ${isDark ? 'border-zinc-650' : 'border-slate-200'}`}
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{drv.name}</span>
                                <span className="text-xs font-bold text-amber-500">★ {drv.rating.toFixed(1)}</span>
                                {drv.isSuspended ? (
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                    isDark ? 'bg-rose-500/30 text-rose-300 border-rose-500/60' : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}>
                                    🚫 Suspendido por Admin
                                  </span>
                                ) : (
                                  <span
                                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                      isApproved
                                        ? isDark ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : isDark ? 'bg-red-500/25 text-red-300 border-red-500/50' : 'bg-red-100 text-red-800 border-red-300'
                                    }`}
                                  >
                                    {isApproved ? 'Habilitado & Activo' : 'En Revisión / Bloqueado'}
                                  </span>
                                )}

                                {/* Executive Classification Badge */}
                                {isEjecutivo ? (
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-sm ${
                                    isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}>
                                    <span>⭐ Apto Viajes Ejecutivos</span>
                                    <span className="opacity-75">
                                      ({drv.vehicle?.ejecutivoCategory === 'vip_suv'
                                        ? 'SUV VIP'
                                        : drv.vehicle?.ejecutivoCategory === 'van_interprovincial'
                                        ? 'Van Premium'
                                        : 'Sedán Confort'})
                                    </span>
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-500 border-slate-300'
                                  }`}>
                                    🚗 Urbano Convencional
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                                Vehículo: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{drv.vehicle.model}</strong> ({vYear})
                                {' '}&bull; Placa:{' '}
                                <strong className={`font-mono px-2 py-0.5 rounded border ${
                                  isDark ? 'text-amber-300 bg-black/40 border-amber-500/30' : 'text-amber-900 bg-amber-50 border-amber-300'
                                }`}>{drv.vehicle.plate}</strong>
                                {' '}&bull; {drv.vehicle.color || 'Color estándar'}
                              </p>
                              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                                Licencia:{' '}
                                <span className="text-emerald-600 dark:text-emerald-300 font-bold">
                                  {driverDocuments.licenseType} ({driverDocuments.licenseStatus || (driverDocuments.isLicenseValid ? 'aprobado' : 'rechazado')})
                                </span>{' '}
                                &bull; Antecedentes:{' '}
                                <span className="text-emerald-600 dark:text-emerald-300 font-bold">
                                  {driverDocuments.criminalRecordCount} registro(s) ({driverDocuments.criminalRecordStatus || (driverDocuments.isCriminalRecordApproved ? 'aprobado' : 'rechazado')})
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Review and Classify Vehicle for Executive Trips Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingVehicleDriverId(isVehicleInspecting ? null : drv.id);
                              }}
                              className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                isVehicleInspecting
                                  ? 'bg-blue-600 text-white border-blue-500 font-black'
                                  : isEjecutivo
                                  ? isDark
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border-zinc-650'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                              title="Inspeccionar y clasificar vehículo para Viajes Ejecutivos Tulcán - Quito"
                            >
                              <Car className="w-3.5 h-3.5 text-amber-400" />
                              <span>
                                {isVehicleInspecting
                                  ? 'Ocultar Inspección'
                                  : isEjecutivo
                                  ? '⭐ Carro Ejecutivo (Revisar)'
                                  : '🔍 Clasificar Carro Ejecutivo'}
                              </span>
                            </button>

                            {onToggleSuspendDriver && (
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleSuspendDriver(drv.id);
                                  setRechargeSuccessMessage(
                                    `Estado de ${drv.name} actualizado: ${drv.isSuspended ? 'Reactivado' : 'Suspendido'}.`
                                  );
                                  setTimeout(() => setRechargeSuccessMessage(null), 3000);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border cursor-pointer ${
                                  drv.isSuspended
                                    ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                    : isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                }`}
                              >
                                {drv.isSuspended ? '✓ Reactivar' : '🚫 Suspender'}
                              </button>
                            )}

                            <button
                              onClick={() => {
                                onAdjustDriverWallet(10, 'Bono de bienvenida admin');
                                setRechargeSuccessMessage(`Se acreditó un bono de $10 a ${drv.name}`);
                                setTimeout(() => setRechargeSuccessMessage(null), 3000);
                              }}
                              className={`px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer ${
                                isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              + Abonar $10
                            </button>

                            <button
                              onClick={() => {
                                setExpandedDriverExpedienteId(
                                  expandedDriverExpedienteId === drv.id ? null : drv.id
                                );
                              }}
                              className={`px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                expandedDriverExpedienteId === drv.id
                                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                                  : isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border-zinc-650'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                            >
                              <span>
                                {expandedDriverExpedienteId === drv.id ? 'Ocultar Expediente' : 'Ver Expediente'}
                              </span>
                            </button>

                            {/* Full Deletion of Driver */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar permanentemente al conductor ${drv.name} (${drv.vehicle.plate}) del sistema AndesMovi?`)) {
                                  handleDeleteDriverItem(drv.id);
                                }
                              }}
                              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                isDark ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/50' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                              }`}
                              title="Eliminar Conductor"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>

                        {/* PANEL DE INSPECCIÓN Y CLASIFICACIÓN VEHICULAR PARA VIAJES EJECUTIVOS */}
                        {isVehicleInspecting && (
                          <div className={`p-4 sm:p-5 rounded-2xl border-2 space-y-4 animate-fadeIn ${
                            isDark
                              ? 'bg-zinc-950 border-amber-500/50 shadow-inner'
                              : 'bg-amber-50/40 border-amber-300 shadow-sm'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-amber-500/30">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Car className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                  <h4 className={`text-sm font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <span>INSPECCIÓN Y CLASIFICACIÓN: VIAJES EJECUTIVOS</span>
                                    <span className="text-amber-500 font-mono text-xs">(Ruta Tulcán - Ibarra - Quito - Aeropuerto)</span>
                                  </h4>
                                  <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                                    Revisa si el vehículo del conductor califica para el servicio interprovincial ejecutivo con climatización y confort.
                                  </p>
                                </div>
                              </div>

                              <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-xl border ${
                                isEjecutivo
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}>
                                {isEjecutivo ? '✓ CLASIFICADO PARA VIAJES EJECUTIVOS' : 'EN EVALUACIÓN POR EL ADMINISTRADOR'}
                              </span>
                            </div>

                            {/* Vehicle Technical Review Card */}
                            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border text-xs ${
                              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                            }`}>
                              <div>
                                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Marca y Modelo</span>
                                <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {drv.vehicle.make ? `${drv.vehicle.make} ` : ''}{drv.vehicle.model}
                                </span>
                              </div>
                              <div>
                                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Año de Fabricación</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`font-black text-sm font-mono ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{vYear}</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                    isYearOptimal
                                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                  }`}>
                                    {isYearOptimal ? '✓ Óptimo (>=2018)' : '⚠️ Más de 7 años'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Placa Oficial ANT</span>
                                <span className={`font-black text-sm font-mono px-2 py-0.5 rounded border inline-block mt-0.5 ${
                                  isDark ? 'bg-black/50 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}>
                                  {drv.vehicle.plate}
                                </span>
                              </div>
                              <div>
                                <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Capacidad / Color</span>
                                <span className={`font-bold block ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                                  {drv.vehicle.capacity || 4} Pasajeros &bull; {drv.vehicle.color || 'Plata'}
                                </span>
                              </div>
                            </div>

                            {/* Executive Standards Checklist */}
                            <div className="space-y-2">
                              <h5 className={`text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>Lista de Verificación de Requisitos para Viajes Ejecutivos</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                  currentSpecs.hasAirConditioning
                                    ? isDark ? 'bg-blue-950/40 border-blue-500/50 text-white' : 'bg-blue-50 border-blue-300 text-blue-950'
                                    : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-600'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={currentSpecs.hasAirConditioning}
                                    onChange={(e) => {
                                      setVehicleChecklist((prev) => ({
                                        ...prev,
                                        [drv.id]: { ...currentSpecs, hasAirConditioning: e.target.checked },
                                      }));
                                    }}
                                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold block">❄️ Aire Acondicionado / Climatizador</span>
                                    <span className="text-[11px] opacity-75">100% operativo para ruta E35 sierra/valle</span>
                                  </div>
                                </label>

                                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                  currentSpecs.hasTrunkCapacity
                                    ? isDark ? 'bg-amber-950/40 border-amber-500/50 text-white' : 'bg-amber-50 border-amber-300 text-amber-950'
                                    : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-600'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={currentSpecs.hasTrunkCapacity}
                                    onChange={(e) => {
                                      setVehicleChecklist((prev) => ({
                                        ...prev,
                                        [drv.id]: { ...currentSpecs, hasTrunkCapacity: e.target.checked },
                                      }));
                                    }}
                                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold block">🧳 Maletero Amplio</span>
                                    <span className="text-[11px] opacity-75">Capacidad para 2-3 valijas grandes de viaje</span>
                                  </div>
                                </label>

                                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                  currentSpecs.hasComfortSeats
                                    ? isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-white' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                    : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-600'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={currentSpecs.hasComfortSeats}
                                    onChange={(e) => {
                                      setVehicleChecklist((prev) => ({
                                        ...prev,
                                        [drv.id]: { ...currentSpecs, hasComfortSeats: e.target.checked },
                                      }));
                                    }}
                                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold block">💺 Confort y Tapicería Limpia</span>
                                    <span className="text-[11px] opacity-75">Asientos ergonómicos limpios sin olores</span>
                                  </div>
                                </label>

                                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                  currentSpecs.hasRtvApproved
                                    ? isDark ? 'bg-emerald-950/40 border-emerald-500/50 text-white' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                    : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-600'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={currentSpecs.hasRtvApproved}
                                    onChange={(e) => {
                                      setVehicleChecklist((prev) => ({
                                        ...prev,
                                        [drv.id]: { ...currentSpecs, hasRtvApproved: e.target.checked },
                                      }));
                                    }}
                                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold block">📋 RTV y Matrícula 2026 Vigente</span>
                                    <span className="text-[11px] opacity-75">Revisión técnica vehicular aprobada</span>
                                  </div>
                                </label>

                                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                  currentSpecs.hasUsbCharger
                                    ? isDark ? 'bg-purple-950/40 border-purple-500/50 text-white' : 'bg-purple-50 border-purple-300 text-purple-950'
                                    : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-600'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={currentSpecs.hasUsbCharger}
                                    onChange={(e) => {
                                      setVehicleChecklist((prev) => ({
                                        ...prev,
                                        [drv.id]: { ...currentSpecs, hasUsbCharger: e.target.checked },
                                      }));
                                    }}
                                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                                  />
                                  <div className="text-xs">
                                    <span className="font-bold block">🔌 Cargador USB para Pasajeros</span>
                                    <span className="text-[11px] opacity-75">Conectividad activa durante el viaje</span>
                                  </div>
                                </label>
                              </div>
                            </div>

                            {/* Classification Options & Category Selector */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div>
                                <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                                  Categoría Ejecutiva Asignada:
                                </label>
                                <select
                                  value={currentSpecs.category}
                                  onChange={(e) => {
                                    setVehicleChecklist((prev) => ({
                                      ...prev,
                                      [drv.id]: {
                                        ...currentSpecs,
                                        category: e.target.value as any,
                                      },
                                    }));
                                  }}
                                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none ${
                                    isDark ? 'bg-zinc-900 border-zinc-750 text-white' : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <option value="sedan_confort">Sedán Ejecutivo Confort (4 Pasajeros)</option>
                                  <option value="vip_suv">SUV Ejecutivo VIP (4 Pasajeros)</option>
                                  <option value="van_interprovincial">Van Interprovincial Premium (7+ Pasajeros)</option>
                                </select>
                              </div>

                              <div>
                                <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                                  Notas de Inspección del Administrador:
                                </label>
                                <input
                                  type="text"
                                  value={currentSpecs.notes}
                                  onChange={(e) => {
                                    setVehicleChecklist((prev) => ({
                                      ...prev,
                                      [drv.id]: {
                                        ...currentSpecs,
                                        notes: e.target.value,
                                      },
                                    }));
                                  }}
                                  placeholder="Ej: Carro verificado en sede Tulcán, A/C al 100%, excelente confort..."
                                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                                    isDark ? 'bg-zinc-900 border-zinc-750 text-white placeholder-zinc-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Classification Decision Actions */}
                            <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                Al clasificar el carro, el conductor se añadirá automáticamente a la flota autorizada para viajes ejecutivos a Quito.
                              </span>

                              <div className="flex items-center gap-2">
                                {isEjecutivo ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleClassifyVehicleForEjecutivo(
                                          drv.id,
                                          true,
                                          currentSpecs.category,
                                          currentSpecs.notes,
                                          currentSpecs
                                        );
                                      }}
                                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Actualizar Clasificación</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`¿Retirar la clasificación ejecutiva de ${drv.name}? El vehículo quedará habilitado únicamente para carreras urbanas convencionales.`)) {
                                          handleClassifyVehicleForEjecutivo(drv.id, false);
                                        }
                                      }}
                                      className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      <span>Revocar y Pasar a Urbano</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleClassifyVehicleForEjecutivo(
                                        drv.id,
                                        true,
                                        currentSpecs.category,
                                        currentSpecs.notes || 'Vehículo verificado y clasificado para viajes ejecutivos interprovinciales.',
                                        currentSpecs
                                      );
                                    }}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-zinc-950 font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                                    <span>Aprobar y Clasificar para Viajes Ejecutivos</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expediente de Verificación de Documentos para el Administrador */}
                        {expandedDriverExpedienteId === drv.id && (
                          <div className={`pt-3 border-t animate-fadeIn ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                            <DriverVerificationStatus
                              documents={driverDocuments}
                              onUpdateStatus={handleAdminUpdateDocStatus}
                              isDark={isDark}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: TABLERO DE CONTROL FINANCIERO (RECHARTS)             */}
          {/* ========================================================= */}
          {activeTab === 'financiero' && (
            <AdminFinancialDashboard
              platformCommissionPercent={editableTariffs.platformCommissionPercent}
              driverWalletBalance={driverWalletBalance}
              isDark={isDark}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 5: MÉTRICAS GENERALES                                 */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Shortcut Banner to Financial Control Board */}
              <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg ${
                isDark
                  ? 'bg-gradient-to-r from-purple-900/60 via-zinc-900 to-zinc-900 border-purple-500/50'
                  : 'bg-gradient-to-r from-purple-50 via-white to-purple-50 border-purple-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? 'bg-purple-500/20 text-purple-300 border-purple-400/40' : 'bg-purple-100 text-purple-800 border-purple-300'
                  }`}>
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>NUEVO: Tablero de Control Financiero (Recharts)</h4>
                    <p className={`text-xs ${isDark ? 'text-purple-200/80' : 'text-purple-800/80'}`}>
                      Visualiza ingresos recaudados por conductores, volumen de billetera y crecimiento mensual con gráficos interactivos.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('financiero')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Abrir Tablero Financiero</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CONSOLA DE CONTROL MAESTRO ANDESMOVI (GOBERNANZA GLOBAL 24 PROVINCIAS) */}
              <div className={`p-4 sm:p-5 rounded-3xl border-2 shadow-2xl space-y-4 ${
                isDark
                  ? 'bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/60'
                  : 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-400'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
                  isDark ? 'border-amber-500/30' : 'border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner flex-shrink-0 ${
                      isDark ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      <Shield className="w-5 h-5 text-amber-500 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>CONSOLA DE CONTROL MAESTRO</h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          SEDE CENTRAL CARCHI &bull; 24 PROVINCIAS
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        Gobernanza global en tiempo real: Tarifas dinámicas, difusión de alertas y control de conductores.
                      </p>
                    </div>
                  </div>

                  {globalControlNotice && (
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold animate-fadeIn ${
                      isDark ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}>
                      {globalControlNotice}
                    </div>
                  )}
                </div>

                {/* 1. MODO OPERATIVO DEL SISTEMA (Interruptor Global de Tarifas) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                        <Radio className="w-4 h-4 text-amber-500" />
                        Modo Operativo del País (Tarifa Dinámica)
                      </span>
                      <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        Multiplicador: {editableTariffs.dynamicMultiplier || 1.0}x
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyOperationalMode('normal')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                          (editableTariffs.dynamicMultiplier || 1.0) === 1.0
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm'
                            : isDark ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        ☀️ Normal (1.0x)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyOperationalMode('lluvia')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                          editableTariffs.dynamicMultiplier === 1.25
                            ? 'bg-sky-500 text-zinc-950 border-sky-400 shadow-sm'
                            : isDark ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        🌧️ Lluvia (+25%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyOperationalMode('pico')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                          editableTariffs.dynamicMultiplier === 1.15
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                            : isDark ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        🚦 Hora Pico (+15%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyOperationalMode('pausa')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                          editableTariffs.dynamicMultiplier === 0.01
                            ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                            : isDark ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        ⏸️ Pausa SOS
                      </button>
                    </div>

                    {/* Comisión de AndesMovi */}
                    <div className={`pt-2 border-t flex items-center justify-between text-xs ${isDark ? 'border-zinc-850' : 'border-slate-200'}`}>
                      <span className={`font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Comisión App:</span>
                      <div className="flex items-center gap-1.5">
                        {[5, 7, 10, 12].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleApplyCommissionRate(pct)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                              editableTariffs.platformCommissionPercent === pct
                                ? 'bg-amber-500 text-zinc-950'
                                : isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. EMISOR DE COMUNICADOS / ALERTA NACIONAL (Broadcast Banner) */}
                  <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                        <Bell className="w-4 h-4 text-emerald-500" />
                        Comunicado / Alerta Nacional a Toda la Aplicación
                      </span>
                      {systemBroadcastAlert?.active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                          Transmisión Activa
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Título de la alerta"
                        value={broadcastTitleInput}
                        onChange={(e) => setBroadcastTitleInput(e.target.value)}
                        className={`col-span-2 px-3 py-1.5 rounded-xl border text-xs focus:border-amber-400 focus:outline-none ${
                          isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <select
                        value={broadcastSeverityInput}
                        onChange={(e) => setBroadcastSeverityInput(e.target.value as any)}
                        className={`px-2 py-1.5 rounded-xl border text-xs focus:border-amber-400 focus:outline-none ${
                          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="info">ℹ️ Informativo</option>
                        <option value="warning">⚠️ Advertencia</option>
                        <option value="emergency">🚨 Emergencia</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Mensaje transmitido a todos los clientes y conductores..."
                      value={broadcastMsgInput}
                      onChange={(e) => setBroadcastMsgInput(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs focus:border-amber-400 focus:outline-none ${
                        isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />

                    <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                      {systemBroadcastAlert && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateBroadcastAlert) {
                              onUpdateBroadcastAlert(null);
                            }
                            setBroadcastTitleInput('');
                            setBroadcastMsgInput('');
                            setGlobalControlNotice('Comunicado eliminado de la aplicación.');
                            setTimeout(() => setGlobalControlNotice(null), 2500);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                            isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
                          }`}
                          title="Eliminar comunicado y limpiar campos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar Comunicado</span>
                        </button>
                      )}
                      {systemBroadcastAlert?.active && (
                        <button
                          type="button"
                          onClick={handleDismissBroadcast}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                            isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          }`}
                        >
                          Desactivar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handlePublishBroadcast}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Transmitir a Todo el País</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. MONITOR DE ALERTAS SOS EN VIVO (Si hay emergencias) */}
                {activeSosAlerts && activeSosAlerts.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/60 border-2 border-rose-500 text-rose-200 text-xs space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <h4 className="font-black text-white text-sm">
                          🚨 ALERTA SOS EN VIVO ({activeSosAlerts.filter(a => !a.resolved).length} Emergencias Activas)
                        </h4>
                      </div>
                    </div>
                    {activeSosAlerts.filter(a => !a.resolved).map((sos) => (
                      <div key={sos.id} className="p-2.5 rounded-xl bg-black/50 border border-rose-500/40 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-black text-white">{sos.userName} ({sos.userRole})</p>
                          <p className="text-[11px] text-zinc-300">
                            Teléfono: <span className="font-mono text-amber-300">{sos.userPhone}</span> &bull; GPS: {sos.coords.lat.toFixed(4)}, {sos.coords.lng.toFixed(4)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href="tel:911"
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[11px]"
                          >
                            Llamar ECU 911
                          </a>
                          {onResolveSosAlert && (
                            <button
                              type="button"
                              onClick={() => onResolveSosAlert(sos.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                            >
                              Resolver
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isDark ? 'border-zinc-750' : 'border-slate-200'
              }`}>
                <div>
                  <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>RESUMEN OPERATIVO ANDESMOVI (ECUADOR)</span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Tiempo Real</span>
                    </span>
                  </h3>
                  <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Métricas agregadas en tiempo real de facturación, comisiones y volumen de carreras
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                    isDark ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : 'text-amber-800 bg-amber-50 border-amber-300'
                  }`}>
                    Tarifa Base: $1.25 (cubre 2.7 km)
                  </span>
                </div>
              </div>

              {/* Dynamic Real-time Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Volumen Bruto USD</span>
                  <span className={`text-2xl font-black mt-0.5 block ${isDark ? 'text-white' : 'text-slate-900'}`}>${calculatedTotalVolume.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold block mt-1">+14% facturación en vivo</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Comisión AndesMovi ({editableTariffs.platformCommissionPercent}%)</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-0.5 block">${calculatedCommission.toFixed(2)}</span>
                  <span className={`text-[10px] font-medium block mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>Ingreso neto retenido</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Carreras y Encomiendas</span>
                  <span className="text-2xl font-black text-sky-600 dark:text-sky-300 mt-0.5 block">{totalTripsCount}</span>
                  <span className={`text-[10px] font-bold block mt-1 ${isDark ? 'text-sky-200' : 'text-sky-700'}`}>{activeTrips.length} activas monitoreadas</span>
                </div>
                <div className={`p-4 rounded-2xl border-2 shadow-md ${
                  isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-xs font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Conductores Habilitados</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-0.5 block">{drivers.length}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold block mt-1">
                    {newRegisteredDriversCount > 0
                      ? `⚠️ ${newRegisteredDriversCount} nuevo(s) por revisar`
                      : '100% Verificados SRI/ANT'}
                  </span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* FEED EN VIVO DE ACTIVIDADES: CLIENTES Y CONDUCTORES                       */}
              {/* ========================================================================= */}
              <div className={`p-4 sm:p-5 rounded-3xl border-2 shadow-xl space-y-4 ${
                isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-white border-slate-200'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                        isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        <Activity className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                      </div>
                      <h4 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        PANEL DE ACTIVIDADES EN VIVO: CLIENTES Y CONDUCTORES
                      </h4>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Transmisión en directo</span>
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      Reflejo instantáneo de viajes solicitados, pedidos, choferes que toman carreras, cobros y nuevos registros.
                    </p>
                  </div>

                  {/* Search inside activities */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar actividad o usuario..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-amber-400 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Filter Selector Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setActivityFilter('todos')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                        activityFilter === 'todos'
                          ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300'
                      }`}
                    >
                      <span>Todas las Actividades</span>
                      <span className="text-[10px] opacity-75 font-mono">({adminActivityEvents.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivityFilter('clientes')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                        activityFilter === 'clientes'
                          ? 'bg-sky-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-950 text-sky-300 hover:text-white border border-zinc-800' : 'bg-sky-50 text-sky-800 hover:text-sky-950 border border-sky-200'
                      }`}
                    >
                      <span>👤 Clientes</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({adminActivityEvents.filter((e) => e.actorRole === 'cliente').length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivityFilter('conductores')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                        activityFilter === 'conductores'
                          ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-950 text-emerald-300 hover:text-white border border-zinc-800' : 'bg-emerald-50 text-emerald-800 hover:text-emerald-950 border border-emerald-200'
                      }`}
                    >
                      <span>🚖 Conductores</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({adminActivityEvents.filter((e) => e.actorRole === 'conductor').length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivityFilter('nuevos_conductores')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                        activityFilter === 'nuevos_conductores'
                          ? 'bg-orange-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-950 text-orange-300 hover:text-white border border-zinc-800' : 'bg-orange-50 text-orange-800 hover:text-orange-950 border border-orange-200'
                      }`}
                    >
                      <span>🪪 Nuevos Conductores</span>
                      {newRegisteredDriversCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                          {newRegisteredDriversCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivityFilter('recargas')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                        activityFilter === 'recargas'
                          ? 'bg-purple-500 text-zinc-950 font-black shadow-sm'
                          : isDark ? 'bg-zinc-950 text-purple-300 hover:text-white border border-zinc-800' : 'bg-purple-50 text-purple-800 hover:text-purple-950 border border-purple-200'
                      }`}
                    >
                      <span>💰 Recargas</span>
                    </button>
                  </div>

                  {adminActivityEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de eliminar todo el historial de acciones y actividades del panel?')) {
                          handleClearAllActivities();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer flex-shrink-0 self-end sm:self-auto ${
                        isDark
                          ? 'bg-zinc-850 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                          : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-400'
                      }`}
                      title="Vaciar todas las acciones registradas en el panel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vaciar / Eliminar Todas las Acciones</span>
                    </button>
                  )}
                </div>

                {/* Activity Feed List */}
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {filteredActivityEvents.length === 0 ? (
                    <div className={`p-8 rounded-2xl border text-center space-y-2 ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <Clock className="w-8 h-8 text-zinc-400 mx-auto" />
                      <p className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>No hay actividades recientes para este filtro</p>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                        A medida que los clientes soliciten carreras, los choferes acepten viajes o nuevos choferes se registren, aparecerán aquí automáticamente en tiempo real.
                      </p>
                    </div>
                  ) : (
                    filteredActivityEvents.map((act) => {
                      const isNewDriver = act.type === 'new_driver_registered';
                      const isClient = act.actorRole === 'cliente';
                      const isDriver = act.actorRole === 'conductor';

                      return (
                        <div
                          key={act.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isNewDriver
                              ? isDark
                                ? 'bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 border-amber-500/80 shadow-md'
                                : 'bg-amber-50/70 border-amber-300 shadow-sm'
                              : isClient
                              ? isDark
                                ? 'bg-zinc-950/90 border-sky-500/30 hover:border-sky-500/60'
                                : 'bg-sky-50/50 border-sky-200 hover:border-sky-400'
                              : isDriver
                              ? isDark
                                ? 'bg-zinc-950/90 border-emerald-500/30 hover:border-emerald-500/60'
                                : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                              : isDark
                              ? 'bg-zinc-950/90 border-zinc-800'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-start gap-3">
                              {/* Icon Box */}
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                                  isNewDriver
                                    ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                                    : isClient
                                    ? isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-sky-800 border-sky-300'
                                    : isDriver
                                    ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                {isNewDriver ? (
                                  <UserCheck className="w-4 h-4 stroke-[2.5]" />
                                ) : act.serviceType === 'domicilio' ? (
                                  <ShoppingBag className="w-4 h-4" />
                                ) : act.serviceType === 'encomienda' ? (
                                  <Package className="w-4 h-4" />
                                ) : act.type.includes('recharge') ? (
                                  <Banknote className="w-4 h-4" />
                                ) : (
                                  <Car className="w-4 h-4" />
                                )}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Role Badge */}
                                  <span
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                      isClient
                                        ? isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-sky-800 border-sky-300'
                                        : isDriver
                                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    {act.actorRole === 'cliente'
                                      ? '👤 CLIENTE'
                                      : act.actorRole === 'conductor'
                                      ? '🚖 CONDUCTOR'
                                      : '🛡️ ADMINISTRADOR'}
                                  </span>

                                  <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{act.actorName}</span>
                                  <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{act.formattedTime}</span>
                                  </span>

                                  {act.amount !== undefined && (
                                    <span className={`text-[11px] font-black font-mono px-2 py-0.2 rounded border ${
                                      isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                                    }`}>
                                      ${act.amount.toFixed(2)} USD
                                    </span>
                                  )}
                                </div>

                                <h5 className={`text-xs font-black mt-1 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{act.title}</h5>
                                <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                                  {act.description}
                                </p>

                                {act.details && (
                                  <div className={`flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                                    {act.details.origin && (
                                      <span className={`px-2 py-0.5 rounded border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-300'}`}>
                                        📍 {act.details.origin}
                                      </span>
                                    )}
                                    {act.details.destination && (
                                      <span className={`px-2 py-0.5 rounded border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-300'}`}>
                                        🏁 {act.details.destination}
                                      </span>
                                    )}
                                    {act.details.plate && (
                                      <span className={`px-2 py-0.5 rounded border ${
                                        isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-900 border-amber-300'
                                      }`}>
                                        Placa: {act.details.plate}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Action Button for Admin */}
                            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDeleteActivity(act.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                                  isDark
                                    ? 'bg-zinc-850 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                                    : 'bg-slate-100 hover:bg-red-50 text-red-600 border-slate-300 hover:border-red-300'
                                }`}
                                title="Eliminar esta acción del historial"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>Eliminar</span>
                              </button>
                              {isNewDriver ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('conductores')}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                >
                                  <span>Revisar y Activar</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              ) : isClient || isDriver ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('carreras_activas')}
                                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition-colors cursor-pointer ${
                                    isDark ? 'bg-zinc-850 hover:bg-zinc-750 text-zinc-200 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                  }`}
                                >
                                  <span>Ver Carrera</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Platform Info Box */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md ${
                isDark ? 'bg-zinc-900 border-amber-500/40' : 'bg-white border-amber-300'
              }`}>
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>ANDESMOVI - OPERACIONES ECUADOR</h4>
                  <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-amber-200/90' : 'text-slate-600'}`}>
                    Centro de despacho y control logístico centralizado para Pichincha, Guayas, Azuay, Tungurahua e Imbabura.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-mono font-black px-3 py-1.5 rounded-xl border shadow-sm ${
                    isDark ? 'text-amber-300 bg-amber-500/20 border-amber-500/40' : 'text-amber-900 bg-amber-100 border-amber-300'
                  }`}>
                    SISTEMA ACTIVO 24/7
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className={`border-t-2 px-5 py-3.5 flex items-center justify-between flex-shrink-0 shadow-inner ${
          isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-slate-100 border-slate-300'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Panel Administrativo AndesMovi • Modo Super Administrador</span>
          </div>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs border-2 transition-all shadow-sm active:scale-95 ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-650' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-400'
            }`}
          >
            Cerrar Panel
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-MODAL 1: CREAR NUEVA GUÍA DE ENCOMIENDA               */}
      {/* ========================================================= */}
      {showNewEncomiendaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-3 overflow-y-auto backdrop-blur-sm">
          <div className={`relative w-full max-w-2xl rounded-3xl border-2 shadow-2xl p-5 space-y-4 my-auto ${
            isDark ? 'bg-zinc-900 border-amber-500/70' : 'bg-white border-amber-400'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>EMISIÓN DE GUÍA DE ENCOMIENDA OFICIAL</h3>
              </div>
              <button
                onClick={() => setShowNewEncomiendaModal(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEncomiendaSubmit} className="space-y-4">
              {/* Remitente */}
              <div className={`p-3.5 rounded-2xl border-2 space-y-2 ${
                isDark ? 'bg-zinc-850 border-zinc-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>1. Datos del Remitente (Origen)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre o Razón Social"
                    value={newEncSenderName}
                    onChange={(e) => setNewEncSenderName(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Teléfono (+593)"
                    value={newEncSenderPhone}
                    onChange={(e) => setNewEncSenderPhone(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  
                  {/* Provincia/Cantón Origen */}
                  <select
                    value={newEncSenderCity}
                    onChange={(e) => setNewEncSenderCity(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {ECUADOR_GEOGRAPHY.map(p => <option key={p.province} value={p.province}>{p.province}</option>)}
                  </select>
                </div>
              </div>

              {/* Destinatario */}
              <div className={`p-3.5 rounded-2xl border-2 space-y-2 ${
                isDark ? 'bg-zinc-850 border-zinc-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>2. Datos del Destinatario (Destino)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre Destinatario"
                    value={newEncReceiverName}
                    onChange={(e) => setNewEncReceiverName(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs focus:outline-none focus:border-sky-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Teléfono Destinatario"
                    value={newEncReceiverPhone}
                    onChange={(e) => setNewEncReceiverPhone(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs focus:outline-none focus:border-sky-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  
                  {/* Provincia/Cantón Destino */}
                  <select
                    value={receiverProvince}
                    onChange={(e) => {
                      setReceiverProvince(e.target.value);
                      setReceiverCanton(ECUADOR_GEOGRAPHY.find(p => p.province === e.target.value)?.cantons[0] || '');
                    }}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-sky-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {ECUADOR_GEOGRAPHY.map(p => <option key={p.province} value={p.province}>{p.province}</option>)}
                  </select>
                  <select
                    value={receiverCanton}
                    onChange={(e) => setReceiverCanton(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-sky-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {receiverCantons.map((c, idx) => <option key={`${c}-${idx}`} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Selección de Oficinas */}
              <div className={`p-3.5 rounded-2xl border-2 space-y-2 ${
                isDark ? 'bg-zinc-850 border-zinc-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>5. Oficinas de Encomienda (Gestión Logística)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newEncOriginOfficeId}
                    onChange={(e) => setNewEncOriginOfficeId(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-emerald-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">Seleccionar Oficina Origen</option>
                    {ALL_PARCEL_OFFICES.map(off => (
                        <option key={off.id} value={off.id}>{off.name} - {off.city}</option>
                    ))}
                  </select>
                  <select
                    value={newEncDestinationOfficeId}
                    onChange={(e) => setNewEncDestinationOfficeId(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-emerald-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">Seleccionar Oficina Destino</option>
                    {ALL_PARCEL_OFFICES.map(off => (
                        <option key={off.id} value={off.id}>{off.name} - {off.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Paquete & Flete */}
              <div className={`p-3.5 rounded-2xl border-2 space-y-2 ${
                isDark ? 'bg-zinc-850 border-zinc-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>3. Características del Bulto & Flete</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={newEncPackageType}
                    onChange={(e) => setNewEncPackageType(e.target.value as any)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-emerald-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="documentos">Documentos / Valija</option>
                    <option value="caja_mediana">Caja Mediana</option>
                    <option value="fragil">Carga Frágil</option>
                    <option value="carga_pesada">Carga Pesada / Mudanza</option>
                    <option value="electrodomestico">Electrodoméstico / Repuesto</option>
                  </select>

                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Peso en kg"
                    value={newEncWeightKg}
                    onChange={(e) => setNewEncWeightKg(Number(e.target.value))}
                    className={`px-3 py-2 rounded-xl border-2 text-xs focus:outline-none focus:border-emerald-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Valor Declarado USD"
                    value={newEncDeclaredValue}
                    onChange={(e) => setNewEncDeclaredValue(Number(e.target.value))}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-black focus:outline-none focus:border-emerald-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-emerald-300' : 'bg-white border-slate-300 text-emerald-700'
                    }`}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Descripción del contenido (ej: Ropa, repuestos, medicina)"
                  value={newEncDescription}
                  onChange={(e) => setNewEncDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border-2 text-xs mt-1 focus:outline-none focus:border-emerald-400 shadow-inner ${
                    isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Asignación de Transporte */}
              <div className={`p-3.5 rounded-2xl border-2 space-y-2 ${
                isDark ? 'bg-zinc-850 border-zinc-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>4. Asignación de Transporte</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={newEncCarrierType}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setNewEncCarrierType(type);
                      if (type === 'conductor_andesmovi') {
                        setNewEncCarrierName('Luis Guamán (Camioneta D-Max)');
                      } else if (type === 'flota_interprovincial') {
                        setNewEncCarrierName('Flota Imbabura (Bodega Terminal)');
                      } else {
                        setNewEncCarrierName('Byron Caiza (Motocicleta Delivery)');
                      }
                    }}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-purple-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="conductor_andesmovi">Conductor Camioneta AndesMovi</option>
                    <option value="flota_interprovincial">Flota Interprovincial Aliada</option>
                    <option value="mensajero_moto">Repartidor Motocicleta</option>
                  </select>

                  <select
                    value={newEncCarrierName}
                    onChange={(e) => setNewEncCarrierName(e.target.value)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-purple-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="San Cristóbal">San Cristóbal (Aliado)</option>
                    <option value="Pullman Carchi">Pullman Carchi (Aliado)</option>
                    <option value="Cita Express">Cita Express (Aliado)</option>
                    <option value="Luis Guamán (Camioneta D-Max)">Luis Guamán (AndesMovi)</option>
                  </select>

                  <select
                    value={newEncPaymentStatus}
                    onChange={(e) => setNewEncPaymentStatus(e.target.value as any)}
                    className={`px-3 py-2 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-purple-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="pagado_origen">Flete Pagado en Origen</option>
                    <option value="cobro_contra_entrega">Cobro Contra Entrega</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewEncomiendaModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-650' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-900/50"
                >
                  Generar Guía de Remisión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-MODAL 2: VISTA DE GUÍA DE REMISIÓN IMPRIMIBLE         */}
      {/* ========================================================= */}
      {selectedEncomiendaForGuide && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-3 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border-2 border-amber-500/70 shadow-2xl p-5 space-y-4 my-auto text-zinc-200">
            {/* Guide Header */}
            <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-base font-black text-white font-mono">
                    GUÍA DE REMISIÓN: {selectedEncomiendaForGuide.trackingNumber}
                  </h3>
                  <span className="text-xs text-zinc-300">ANDESMOVI LOGÍSTICA ECUADOR S.A.S.</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEncomiendaForGuide(null)}
                className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Ticket Box */}
            <div id="print-section" className="p-4 rounded-2xl bg-white text-zinc-950 space-y-3 font-sans shadow-inner">
              <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
                <div>
                  <h4 className="text-sm font-black tracking-wider">ANDESMOVI CARGA</h4>
                  <p className="text-[10px] text-zinc-600">"Tu confianza, tu seguridad, nuestro compromiso"</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black">{selectedEncomiendaForGuide.trackingNumber}</span>
                  <p className="text-[10px] text-zinc-500">{selectedEncomiendaForGuide.createdFormatted}</p>
                </div>
              </div>

              {/* Sender and Receiver */}
              <div className="grid grid-cols-2 gap-3 text-xs border-b border-zinc-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 block uppercase">Remitente:</span>
                  <p className="font-black">{selectedEncomiendaForGuide.senderName}</p>
                  <p className="text-[11px] text-zinc-600">CI/RUC: {selectedEncomiendaForGuide.senderIdNumber}</p>
                  <p className="text-[11px] text-zinc-600">Ciudad: {selectedEncomiendaForGuide.senderCity}</p>
                  <p className="text-[11px] text-zinc-600">Telf: {selectedEncomiendaForGuide.senderPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 block uppercase">Destinatario:</span>
                  <p className="font-black">{selectedEncomiendaForGuide.receiverName}</p>
                  <p className="text-[11px] text-zinc-600">CI: {selectedEncomiendaForGuide.receiverIdNumber}</p>
                  <p className="text-[11px] text-zinc-600">Ciudad: {selectedEncomiendaForGuide.receiverCity}</p>
                  <p className="text-[11px] text-zinc-600">Telf: {selectedEncomiendaForGuide.receiverPhone}</p>
                </div>
              </div>

              {/* Package Specs */}
              <div className="text-xs space-y-1 border-b border-zinc-200 pb-2">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Contenido:</span>
                  <span className="font-bold">{selectedEncomiendaForGuide.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Peso / Tipo:</span>
                  <span className="font-bold">
                    {selectedEncomiendaForGuide.weightKg} kg ({selectedEncomiendaForGuide.packageType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Valor Declarado:</span>
                  <span className="font-bold">${selectedEncomiendaForGuide.declaredValueUsd.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Transportista Asignado:</span>
                  <span className="font-bold">{selectedEncomiendaForGuide.assignedCarrierName}</span>
                </div>
              </div>

              {/* Cédula Entrega and Total */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-zinc-500 block font-bold uppercase">ENTREGA: SOLO CON CÉDULA</span>
                  <span className="text-lg font-mono font-black tracking-wider text-emerald-800 block">
                    C.I. {selectedEncomiendaForGuide.receiverIdNumber}
                  </span>
                  <span className="text-[9px] text-zinc-500 block">Sin código PIN requerido</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block font-bold uppercase">VALOR TOTAL FLETE</span>
                  <span className="text-xl font-black text-emerald-700">
                    ${selectedEncomiendaForGuide.deliveryCostUsd.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Simulated Barcode */}
              <div className="pt-2 text-center border-t border-dashed border-zinc-300">
                <div className="h-8 bg-zinc-950 flex items-center justify-center font-mono text-[10px] text-zinc-400 tracking-widest px-4">
                  ||||| | |||| ||| |||||| ||||| |||| |||||| ||||| |||
                </div>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">
                  {selectedEncomiendaForGuide.trackingNumber} - VÁLIDO PARA CONTROL POLICIAL Y PEAJES
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedEncomiendaForGuide(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold border-2 border-zinc-650"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/40"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Descargar Guía</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECCIÓN DE DOCUMENTO DE TRANSFERENCIA A CUENTAS PERSONALES */}
      {selectedProofDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className={`w-full max-w-xl border-2 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] ${
            isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-white border-amber-400'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Documento de Transferencia Bancaria</h4>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Presentado por {selectedProofDoc.driverOrUserName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofDoc(null)}
                className={`p-1.5 rounded-xl ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              {/* Document Summary Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] block font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Monto Transferido</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-300 font-mono">${selectedProofDoc.amountUsd.toFixed(2)} USD</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] block font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>N° Comprobante</span>
                  <span className={`text-xs font-black font-mono block truncate ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{selectedProofDoc.transferVoucherNumber || selectedProofDoc.referenceNumber}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] block font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Banco / Origen</span>
                  <span className={`text-xs font-black block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProofDoc.bankName || 'Banca Móvil'}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] block font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Estado</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    selectedProofDoc.status === 'aprobada' ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800') : selectedProofDoc.status === 'rechazada' ? (isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800') : (isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800')
                  }`}>
                    {selectedProofDoc.status}
                  </span>
                </div>
              </div>

              {/* Destination Personal Account Banner */}
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-zinc-200' : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  Cuenta Personal Receptora del Administrador:
                </span>
                <p>
                  <strong>{selectedProofDoc.destinationBank || 'Banco Pichincha (Ahorros)'}</strong> • N° <strong className="font-mono">{selectedProofDoc.destinationAccountNumber || '2207472368'}</strong>
                </p>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Titular: <strong className={isDark ? 'text-amber-300' : 'text-amber-800'}>{selectedProofDoc.destinationAccountHolder || 'Jhon Sebastian Yepez Clavijo (C.I. 1004721351)'}</strong>
                </p>
              </div>

              {/* High-Resolution Document Image */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center ${
                isDark ? 'bg-black/70 border-zinc-800' : 'bg-slate-100 border-slate-300'
              }`}>
                {selectedProofDoc.proofImageUrl ? (
                  <img
                    src={selectedProofDoc.proofImageUrl}
                    alt="Documento de transferencia bancaria"
                    className="max-h-[45vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-zinc-700"
                  />
                ) : (
                  <div className="py-12 text-center text-zinc-500">
                    <FileText className="w-12 h-12 mx-auto text-zinc-400 mb-2" />
                    <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>El conductor no adjuntó imagen del documento</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Verifica únicamente con el número de comprobante #{selectedProofDoc.referenceNumber}</p>
                  </div>
                )}
                {selectedProofDoc.proofDocumentName && (
                  <span className={`text-[10px] mt-2 font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{selectedProofDoc.proofDocumentName}</span>
                )}
              </div>
            </div>

            {/* Bottom Decision Bar */}
            <div className={`p-3.5 border-t flex items-center justify-between gap-3 ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedProofDoc(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cerrar Visor
              </button>

              {selectedProofDoc.status === 'pendiente' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingReq(selectedProofDoc);
                      setSelectedProofDoc(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold ${
                      isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/40' : 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300'
                    }`}
                  >
                    Rechazar Comprobante
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveRecharge(selectedProofDoc.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verificado en Cuenta • Subir Saldo Inmediatamente</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOTIVO DE RECHAZO DE COMPROBANTE */}
      {rejectingReq && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className={`w-full max-w-md border-2 rounded-3xl p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-zinc-900 border-red-500/50' : 'bg-white border-red-300'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="w-5 h-5" />
                <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Rechazar Solicitud de Recarga</h4>
              </div>
              <button
                onClick={() => setRejectingReq(null)}
                className={`p-1 rounded-lg ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Indica por qué se rechaza el comprobante <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>#{rejectingReq.transferVoucherNumber || rejectingReq.referenceNumber}</strong> de <strong>{rejectingReq.driverOrUserName}</strong> por <strong>${rejectingReq.amountUsd.toFixed(2)} USD</strong>:
            </p>

            <div className="space-y-2">
              <label className={`text-[11px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Motivo de Rechazo:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-red-500 ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'No se refleja en extracto bancario personal',
                  'Monto depositado no coincide',
                  'Comprobante duplicado o ya usado',
                  'Imagen ilegible o adulterada',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={`text-[10px] px-2 py-1 rounded-lg border ${
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                  isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRejectRecharge(rejectingReq.id, rejectReason)}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-xs shadow-md"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAR DE ALTA UNIDAD & VALIDACIÓN PLACAS ANT */}
      <AdminUnitRegisterModal
        isOpen={showUnitRegisterModal}
        onClose={() => setShowUnitRegisterModal(false)}
        onRegisterUnit={handleRegisterUnit}
        isDark={isDark}
      />

      {/* MODAL: REPORTE DIARIO DE INGRESOS EN DÓLARES (IMPRIMIBLE) */}
      <AdminDailyIncomeReportModal
        isOpen={showIncomeReportsModal}
        onClose={() => setShowIncomeReportsModal(false)}
        isDark={isDark}
      />

      {/* MODAL: CALCULADORA OFICIAL DE TARIFAS ($1.25 / 2.7 KM) */}
      <AdminFareCalculatorModal
        isOpen={showFareCalculatorModal}
        onClose={() => setShowFareCalculatorModal(false)}
        isDark={isDark}
      />
    </div>
  );
};

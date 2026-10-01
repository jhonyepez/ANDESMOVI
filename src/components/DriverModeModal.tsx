import React, { useState } from 'react';
import { formatCurrency } from '../utils/geoUtils';
import { DriverVerificationStatus } from './DriverVerificationStatus';
import { SocialRegistrationModal, SocialAuthInitialData } from './SocialRegistrationModal';
import { databaseService } from '../services/databaseService';
import {
  Vehicle,
  VehicleType,
  DriverDocuments,
  VerificationDocumentStatus,
  DriverActiveServices,
  DriverEarningsRecord,
  UserProfile,
  ServiceType,
  DriverRadarOrder,
  SystemTariffs,
  PayoutRequest,
  SanCristobalOffice,
} from '../types';
import {
  MOCK_DRIVER_DOCUMENTS,
  DEFAULT_DRIVER_SERVICES,
  MOCK_DRIVER_EARNINGS,
  DEFAULT_RADAR_ORDERS,
} from '../data/mockData';
import confetti from 'canvas-confetti';
import {
  Car,
  Bike,
  Package,
  MapPin,
  Navigation,
  Check,
  Plus,
  Minus,
  DollarSign,
  TrendingUp,
  Power,
  Clock,
  Radio,
  Star,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Gift,
  ArrowRight,
  UserCheck,
  Compass,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Upload,
  Camera,
  FileCheck,
  Phone,
  MessageSquare,
  ExternalLink,
  Printer,
  Shield,
  Wallet,
  Sliders,
  Truck,
  RotateCcw,
  CheckCircle,
  XCircle,
  Info,
  Building2,
  Calculator,
  Receipt,
  Search,
  Copy,
  X,
} from 'lucide-react';
import { ALL_PARCEL_OFFICES } from '../data/sanCristobalOffices';
import { AdminBankAccountsList } from './admin/AdminBankAccountsList';
import { WalletModal } from './WalletModal';
import { ChatModal } from './ChatModal';
import { CallModal, CallParticipant } from './CallModal';
import { WalletRechargeRequest, ChatMessage, Coordinates } from '../types';
import { getCoordinatesForEcuadorProvince } from '../data/ecuador_geography';
import { pushNotificationService } from '../services/notificationService';
import { haptic } from '../utils/haptics';
import { DriverWeeklyEarningsChart } from './DriverWeeklyEarningsChart';
import { LegalTermsModal, LegalDocType } from './LegalTermsModal';
import { SOSModal } from './SOSModal';
import { ParcelReceiptModal } from './ParcelReceiptModal';
import { CancelTripModal } from './CancelTripModal';

export interface DriverModeModalProps {
  onAcceptIncomingJob?: (job: any) => void;
  onExitDriverMode: () => void;
  walletBalance: number;
  onUpdateWalletBalance: (newBalance: number) => void;
  currentUser?: UserProfile | null;
  onUpdateUser?: (user: UserProfile) => void;
  onUpdateDriverPosition?: (coords: { lat: number; lng: number }) => void;
  driverDocuments?: DriverDocuments;
  onUpdateDriverDocuments?: (docs: DriverDocuments) => void;
  walletRecharges?: WalletRechargeRequest[];
  onAddRechargeRequest?: (req: WalletRechargeRequest) => void;
  payoutRequests?: PayoutRequest[];
  onAddPayoutRequest?: (req: PayoutRequest) => void;
  availableRadarOrders?: DriverRadarOrder[];
  onTakeOrder?: (order: DriverRadarOrder, finalPrice: number) => void;
  onRegisterNewDriver?: (driverData: {
    name: string;
    cedula: string;
    phone?: string;
    province?: string;
    vehicleType?: VehicleType;
    vehicleModel?: string;
    plate?: string;
    authProvider?: string;
  }) => void;
  systemTariffs?: SystemTariffs;
  onOpenAdminPanel?: () => void;
  isSuspendedByAdmin?: boolean;
  isOnline?: boolean;
  onToggleOnline?: () => void;
  isDark?: boolean;
  onCancelActiveTrip?: (reason?: string) => void;
  onRedeemRechargeBonus?: () => void;
  onOpenRegister?: (role: 'conductor' | 'cliente') => void;
}

export type DriverTab =
  | 'radar'
  | 'navegacion'
  | 'documentos'
  | 'vehiculo'
  | 'servicios'
  | 'ganancias'
  | 'registro';

export const DriverModeModal: React.FC<DriverModeModalProps> = ({
  onAcceptIncomingJob,
  onExitDriverMode,
  walletBalance,
  onUpdateWalletBalance,
  currentUser,
  onUpdateUser,
  onUpdateDriverPosition,
  driverDocuments: propDriverDocs,
  onUpdateDriverDocuments,
  walletRecharges = [],
  onAddRechargeRequest,
  payoutRequests = [],
  onAddPayoutRequest,
  availableRadarOrders,
  onTakeOrder,
  onRegisterNewDriver,
  systemTariffs,
  onOpenAdminPanel,
  isSuspendedByAdmin,
  isOnline: propIsOnline,
  onToggleOnline,
  isDark = true,
  onCancelActiveTrip,
  onRedeemRechargeBonus,
  onOpenRegister,
}) => {
  // Navigation tabs for the Driver / Delivery Partner Portal
  const [activeTab, setActiveTab] = useState<DriverTab>('radar');
  const [internalOnline, setInternalOnline] = useState<boolean>(true);
  const [showDemoBlockModal, setShowDemoBlockModal] = useState<boolean>(false);
  const isOnline = propIsOnline !== undefined ? propIsOnline : internalOnline;
  const toggleOnline = () => {
    if (!currentUser || currentUser.role !== 'conductor') {
      haptic.warning();
      setShowDemoBlockModal(true);
      return;
    }
    if (walletBalance <= 0.00) {
      haptic.warning();
      setShowRechargeProofModal(true);
      alert('⚠️ Saldo insuficiente ($0.00 USD en Billetera Prepago).\n\nPara ponerte en línea y empezar a trabajar debes realizar tu primera recarga de saldo.');
      return;
    }
    if (onToggleOnline) {
      onToggleOnline();
    } else {
      setInternalOnline(!internalOnline);
    }
  };
  const [showAdminBankAccounts, setShowAdminBankAccounts] = useState<boolean>(false);
  const [showRechargeProofModal, setShowRechargeProofModal] = useState<boolean>(false);
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [payoutBank, setPayoutBank] = useState<string>('Banco Pichincha');
  const [payoutAccountType, setPayoutAccountType] = useState<'ahorros' | 'corriente' | 'DeUna!'>('ahorros');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState<string>('');
  const [payoutAccountHolder, setPayoutAccountHolder] = useState<string>(currentUser?.name || '');
  const [payoutCedula, setPayoutCedula] = useState<string>(currentUser?.cedula || '');
  const [showDriverSosModal, setShowDriverSosModal] = useState<boolean>(false);
  const [showParcelReceiptModal, setShowParcelReceiptModal] = useState<boolean>(false);
  const [showDriverCancelModal, setShowDriverCancelModal] = useState<boolean>(false);
  const [driverQuotedRates, setDriverQuotedRates] = useState<Record<string, number>>({});
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // 1. REGISTRO / PERFIL DEL CONDUCTOR (Facebook, Google, iCloud, Cédula)
  const [driverProfile, setDriverProfile] = useState({
    name: currentUser?.name || 'Carlos Mendoza',
    email: currentUser?.email || 'carlos.mendoza.conductor@gmail.com',
    phone: currentUser?.phone || '+593 99 458 9012',
    cedula: currentUser?.cedula || '1724589012',
    province: currentUser?.province || 'Pichincha (Quito)',
    avatar:
      currentUser?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authProvider: currentUser?.authProvider || 'google',
    rating: 4.96,
    totalTrips: 1840,
  });

  // 2. DOCUMENTOS REQUERIDOS (Licencia Vigente, Antecedentes Penales Máximo 2 Sin Gravedad, RTV)
  const [documents, setDocuments] = useState<DriverDocuments>(
    propDriverDocs || MOCK_DRIVER_DOCUMENTS
  );
  const [licenseExpInput, setLicenseExpInput] = useState<string>(documents.licenseExpiration);
  const [criminalCountInput, setCriminalCountInput] = useState<number>(documents.criminalRecordCount);
  const [hasSevereInput, setHasSevereInput] = useState<boolean>(documents.hasSevereRecord);
  const [docSaveNotice, setDocSaveNotice] = useState<string | null>(null);

  // Verification rule: Licencia no vencida Y antecedentes máximo 2 Y sin gravedad
  const isLicenseValidDate = new Date(licenseExpInput).getTime() > Date.now();
  const isCriminalRecordValid = criminalCountInput <= 2 && !hasSevereInput;
  const isFullyApproved =
    documents.overallStatus === 'aprobado' ||
    (isLicenseValidDate && isCriminalRecordValid && documents.rtvStatus === 'vigente');

  // Document Verification Status Handler (Allows simulation of Pendiente / En Revisión / Aprobado)
  const handleUpdateDocStatus = (
    docKey: 'license' | 'criminalRecord' | 'rtv',
    newStatus: VerificationDocumentStatus
  ) => {
    setDocuments((prev) => {
      const updated: DriverDocuments = { ...prev };
      if (docKey === 'license') {
        updated.licenseStatus = newStatus;
        updated.isLicenseValid = newStatus === 'aprobado';
        if (newStatus === 'aprobado') {
          updated.licenseReviewerNotes = 'Aprobado por el Administrador. Verificado con la Agencia Nacional de Tránsito (ANT).';
          updated.licenseReviewedAt = 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (newStatus === 'en_revision') {
          updated.licenseReviewerNotes = 'Documento en cola de inspección oficial por el Administrador de AndesMovi.';
        } else if (newStatus === 'pendiente') {
          updated.licenseReviewerNotes = 'Pendiente de adjuntar fotos claras o enviar a revisión.';
        } else {
          updated.licenseReviewerNotes = 'Rechazado por el Administrador: Fecha de vigencia expirada o ilegible.';
        }
      } else if (docKey === 'criminalRecord') {
        updated.criminalRecordStatus = newStatus;
        updated.isCriminalRecordApproved = newStatus === 'aprobado';
        if (newStatus === 'aprobado') {
          updated.criminalRecordReviewerNotes = 'Aprobado por el Administrador. Récord dentro del límite legal permitido (máx. 2 sin gravedad).';
          updated.criminalRecordReviewedAt = 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (newStatus === 'en_revision') {
          updated.criminalRecordReviewerNotes = 'En verificación con la base del Ministerio del Interior y Policía Nacional.';
        } else if (newStatus === 'pendiente') {
          updated.criminalRecordReviewerNotes = 'Pendiente de adjuntar certificado de antecedentes penales actualizado.';
        } else {
          updated.criminalRecordReviewerNotes = 'Rechazado por el Administrador: Registra gravedad o excede el límite permitido.';
        }
      } else if (docKey === 'rtv') {
        updated.rtvDocStatus = newStatus;
        if (newStatus === 'aprobado') updated.rtvStatus = 'vigente';
        else if (newStatus === 'en_revision') updated.rtvStatus = 'en_tramite';
        else updated.rtvStatus = 'vencida';
      }

      const licSt = updated.licenseStatus || (updated.isLicenseValid ? 'aprobado' : 'rechazado');
      const crimSt = updated.criminalRecordStatus || (updated.isCriminalRecordApproved ? 'aprobado' : 'rechazado');
      const rtvSt = updated.rtvDocStatus || (updated.rtvStatus === 'vigente' ? 'aprobado' : 'rechazado');

      const isAllOk = licSt === 'aprobado' && crimSt === 'aprobado' && rtvSt === 'aprobado';
      updated.isFullyVerified = isAllOk;
      updated.overallStatus = isAllOk
        ? 'aprobado'
        : newStatus === 'rechazado'
        ? 'rechazado'
        : newStatus === 'en_revision'
        ? 'en_revision'
        : 'pendiente';

      onUpdateDriverDocuments?.(updated);
      return updated;
    });
  };

  // 3. REGISTRO DE VEHÍCULO
  const [vehicle, setVehicle] = useState<Vehicle>({
    type: 'auto',
    model: 'Chevrolet Sail Sedán 1.5L',
    plate: 'PBA-8321',
    color: 'Plata Brillante',
    year: 2023,
  });
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300&auto=format&fit=crop&q=80'
  );
  const [vehicleSaveNotice, setVehicleSaveNotice] = useState<string | null>(null);

  // Social Auth Mandatory SRI Registration State for Drivers
  const [socialPendingData, setSocialPendingData] = useState<SocialAuthInitialData | null>(null);

  // 4. ELEGIR QUÉ SERVICIOS DESEA REALIZAR Y EFECTIVO PARA COMPRAS EN LOCAL (DELIVERY)
  const [activeServices, setActiveServices] = useState<DriverActiveServices>(DEFAULT_DRIVER_SERVICES);
  const [hasCashForPurchases, setHasCashForPurchases] = useState<boolean>(true);
  const [availableCashAmount, setAvailableCashAmount] = useState<number>(30.00);

  // 5. SOLICITUDES CERCANAS (RADAR EN VIVO) - Compartidas con clientes y notificaciones
  const orders: DriverRadarOrder[] = availableRadarOrders && availableRadarOrders.length > 0
    ? availableRadarOrders
    : DEFAULT_RADAR_ORDERS;

  // 6. ESTADO DE OFERTAS Y CONTRAOFERTAS
  const [negotiationStates, setNegotiationStates] = useState<{
    [orderId: string]: {
      isCounterOpen: boolean;
      proposedPrice: number;
      status: 'idle' | 'waiting_passenger' | 'passenger_selected';
    };
  }>({});

  // 7. SERVICIO ACTIVO DEL CONDUCTOR (Navegación, Recogida, Entrega, Ganancias)
  const [activeJob, setActiveJob] = useState<{
    order: DriverRadarOrder;
    finalPrice: number;
    step: 'navigating_to_pickup' | 'at_pickup' | 'navigating_to_destination' | 'at_destination' | 'earnings_settled';
    currentEtaMin: number;
    distanceRemainingKm: number;
    speedKmH: number;
    pinInput: string;
    isPinVerified: boolean;
  } | null>(null);

  // Sistema de Comunicación Privada Conductor-Cliente (Chat & VoIP)
  const [driverChatMessages, setDriverChatMessages] = useState<ChatMessage[]>([]);
  const [showDriverChatModal, setShowDriverChatModal] = useState<boolean>(false);
  const [showDriverCallModal, setShowDriverCallModal] = useState<boolean>(false);
  const [unreadDriverChatCount, setUnreadDriverChatCount] = useState<number>(0);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terminos');

  // Búsqueda y selección de Oficinas Aliadas para conductor en otras provincias
  const [showAlliedOfficesSearch, setShowAlliedOfficesSearch] = useState<boolean>(false);
  const [alliedOfficeSearchQuery, setAlliedOfficeSearchQuery] = useState<string>('');
  const [alliedOfficeCarrierFilter, setAlliedOfficeCarrierFilter] = useState<string>('all');
  const [selectedAlliedOffice, setSelectedAlliedOffice] = useState<SanCristobalOffice | null>(null);
  const [copiedShippingData, setCopiedShippingData] = useState<boolean>(false);

  // Copia formateada de datos de encomienda para entregar o dictar en ventanilla de cooperativa
  const handleCopyShippingOfficeData = (parcel?: any, order?: DriverRadarOrder) => {
    if (!parcel && !order) return;
    haptic.success();
    const officeName = selectedAlliedOffice?.name || parcel?.arrivalOffice?.name || order?.destination || 'Oficina Terminal';
    const carrierName = selectedAlliedOffice?.carrier || parcel?.carrier || 'Cooperativa de Transporte';
    const textToCopy = `📦 DATOS DE ENCOMIENDA PARA OFICINA DE ENVÍO - ANDESMOVI
--------------------------------------------------
🏢 OFICINA / COOPERATIVA: ${carrierName} - ${officeName}
📍 DESTINO: ${parcel?.destinationProvince || ''} - ${selectedAlliedOffice?.city || ''}
👤 DESTINATARIO (Quién retira): ${parcel?.receiverName || 'N/A'}
🆔 CÉDULA DESTINATARIO: ${parcel?.receiverCedula || 'N/A'}
📞 TELÉFONO DESTINATARIO: ${parcel?.receiverPhone || 'N/A'}

👤 REMITENTE (Quién envía): ${parcel?.senderName || order?.clientName || 'N/A'}
🆔 CÉDULA REMITENTE: ${parcel?.senderCedula || 'N/A'}
📞 TELÉFONO REMITENTE: ${parcel?.senderPhone || order?.clientPhone || 'N/A'}
📍 ORIGEN: ${parcel?.originProvince || order?.origin || 'N/A'}

📦 DETALLE DE CARGA:
• Contenido: ${parcel?.description || 'Paquete'}
• Bultos: ${parcel?.packageCount || 1}
• Peso: ${parcel?.weightKg || 2} kg
• Frágil: ${parcel?.isFragile ? 'SÍ' : 'NO'}
• Valor Declarado: $${parcel?.declaredValueUsd || 0} USD
• Modalidad: ${parcel?.paymentTiming === 'por_cobrar_destino' ? 'POR COBRAR EN DESTINO' : 'PAGADO EN ORIGEN'}
• Flete Acordado: $${activeJob?.finalPrice?.toFixed(2) || '0.00'} USD
--------------------------------------------------
Presentado por Conductor Oficial AndesMovi`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedShippingData(true);
      setTimeout(() => setCopiedShippingData(false), 3000);
    }
  };

  const handleSendDriverChatMessage = (text: string, isLocation?: boolean, coords?: Coordinates) => {
    const newMsg: ChatMessage = {
      id: `msg-drv-${Date.now()}`,
      sender: 'conductor',
      text,
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      isLocation,
      locationCoords: coords,
      status: 'sent',
    };

    setDriverChatMessages((prev) => [...prev, newMsg]);

    // Simular respuesta rápida del cliente según el mensaje enviado
    setTimeout(() => {
      let clientReplyText = '¡Entendido! Muchas gracias por avisar.';
      if (text.includes('afuera') || text.includes('puerta')) {
        clientReplyText = '¡Perfecto! Ya voy saliendo del edificio.';
      } else if (text.includes('tráfico') || text.includes('min')) {
        clientReplyText = 'De acuerdo, no hay apuro, aquí espero.';
      } else if (text.includes('dirección') || text.includes('exacta')) {
        clientReplyText = 'Estoy justo junto a la entrada principal con chompa negra.';
      }

      const clientReply: ChatMessage = {
        id: `msg-cli-${Date.now()}`,
        sender: 'cliente',
        text: clientReplyText,
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };

      setDriverChatMessages((prev) => [...prev, clientReply]);
      pushNotificationService.playChime('chat');
      haptic.notification();

      if (!showDriverChatModal) {
        setUnreadDriverChatCount((prev) => prev + 1);
      }
    }, 1400);
  };

  // 8. HISTORIAL DE GANANCIAS DEL CONDUCTOR (con 7% comisión y 93% neto)
  const [earningsHistory, setEarningsHistory] = useState<DriverEarningsRecord[]>(MOCK_DRIVER_EARNINGS);

  // 9. FILTRO DE VEHÍCULO EN RADAR (Todos, Carros, Motos) Y ÓRDENES RECHAZADAS
  const [radarVehicleFilter, setRadarVehicleFilter] = useState<'all' | 'auto' | 'moto'>('all');
  const [dismissedOrderIds, setDismissedOrderIds] = useState<string[]>([]);

  // Switch between Carro and Moto mode for driver
  const handleSwitchVehicleType = (type: 'auto' | 'moto') => {
    if (type === 'auto') {
      setVehicle({
        type: 'auto',
        model: 'Chevrolet Sail Sedán 1.5L',
        plate: 'PBA-8321',
        color: 'Plata Brillante',
        year: 2023,
      });
      setVehiclePhotoUrl('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300&auto=format&fit=crop&q=80');
      setActiveServices((prev) => ({
        ...prev,
        viajes: true,
      }));
      setRadarVehicleFilter('all');
      setVehicleSaveNotice('Modo Conductor Carro activado (Taxi Oficial / Sedán 4 pasajeros)');
    } else {
      setVehicle({
        type: 'moto',
        model: 'Honda CB190R Repsol',
        plate: 'P-4821E',
        color: 'Naranja / Negro',
        year: 2024,
      });
      setVehiclePhotoUrl('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&auto=format&fit=crop&q=80');
      setActiveServices((prev) => ({
        ...prev,
        delivery: true,
        encomiendas: true,
      }));
      setRadarVehicleFilter('all');
      setVehicleSaveNotice('Modo Conductor Motocicleta activado (Delivery Express / Moto Pasajero)');
    }
    setTimeout(() => setVehicleSaveNotice(null), 3000);
  };

  // Filter orders by active driver services and radar vehicle filter
  const filteredOrders = orders.filter((order) => {
    if (dismissedOrderIds.includes(order.id)) return false;
    if (order.serviceType === 'viaje' && !activeServices.viajes) return false;
    if (order.serviceType === 'domicilio' && !activeServices.delivery) return false;
    if (order.serviceType === 'encomienda' && !activeServices.encomiendas) return false;
    if (order.serviceType === 'ejecutivo_quito' && !activeServices.interprovincial && !activeServices.viajes) return false;

    if (radarVehicleFilter === 'auto') {
      return order.vehicleCompatibility === 'auto' || order.vehicleCompatibility === 'both';
    }
    if (radarVehicleFilter === 'moto') {
      return order.vehicleCompatibility === 'moto' || order.vehicleCompatibility === 'both';
    }
    return true;
  });

  // Helper for negotiation state
  const getOrderState = (orderId: string, defaultOffer: number) => {
    return (
      negotiationStates[orderId] || {
        isCounterOpen: false,
        proposedPrice: defaultOffer,
        status: 'idle',
      }
    );
  };

  const updateOrderState = (orderId: string, updates: any) => {
    setNegotiationStates((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || { isCounterOpen: false, proposedPrice: 0, status: 'idle' }),
        ...updates,
      },
    }));
  };

  // 1. Social Login Handlers for Driver
  const handleSocialDriverLogin = (provider: 'facebook' | 'google' | 'icloud') => {
    let newEmail = 'conductor.quito@gmail.com';
    let newAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    let suggestedName = 'Carlos Alberto Mendoza';

    if (provider === 'facebook') {
      newEmail = 'carlos.mendoza.ec@facebook.com';
      newAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
      suggestedName = 'Carlos Mendoza Paredes';
    } else if (provider === 'icloud') {
      newEmail = 'carlos.mendoza@icloud.com';
      newAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
      suggestedName = 'Carlos Mendoza';
    }

    // 1. Verificar si ya existe en la base de datos con cédula y perfil completo
    const existingUser = databaseService.getUserByEmail(newEmail);
    if (existingUser && existingUser.cedula && existingUser.isRegistrationComplete) {
      setDriverProfile((prev) => ({
        ...prev,
        name: existingUser.name,
        email: existingUser.email || newEmail,
        avatar: existingUser.avatar || newAvatar,
        cedula: existingUser.cedula || prev.cedula,
        authProvider: provider,
      }));
      if (currentUser && onUpdateUser) {
        onUpdateUser(existingUser);
      }
      return;
    }

    // 2. Detener acceso directo y abrir pantalla obligatoria de validación de Cédula y consulta al SRI
    setSocialPendingData({
      email: newEmail,
      avatar: newAvatar,
      authProvider: provider,
      suggestedName,
      role: 'conductor',
    });
  };

  // 2. Document Save Handler
  const handleSaveDocuments = (e: React.FormEvent) => {
    e.preventDefault();
    const isDateValid = new Date(licenseExpInput).getTime() > Date.now();
    const isCriminalOk = criminalCountInput <= 2 && !hasSevereInput;

    const updatedDocs: DriverDocuments = {
      ...documents,
      licenseExpiration: licenseExpInput,
      isLicenseValid: isDateValid,
      licenseStatus: isDateValid ? 'aprobado' : 'rechazado',
      criminalRecordCount: criminalCountInput,
      hasSevereRecord: hasSevereInput,
      isCriminalRecordApproved: isCriminalOk,
      criminalRecordStatus: isCriminalOk ? 'aprobado' : 'rechazado',
      isFullyVerified: isDateValid && isCriminalOk && documents.rtvStatus === 'vigente',
      overallStatus: isDateValid && isCriminalOk && documents.rtvStatus === 'vigente' ? 'aprobado' : 'rechazado',
    };

    setDocuments(updatedDocs);
    onUpdateDriverDocuments?.(updatedDocs);
    setDocSaveNotice('¡Documentos verificados y actualizados en el sistema AndesMovi!');
    setTimeout(() => setDocSaveNotice(null), 3500);
  };

  // 3. Vehicle Save Handler
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleSaveNotice('¡Vehículo registrado con éxito para operaciones en Ecuador!');
    setTimeout(() => setVehicleSaveNotice(null), 3000);
  };

  // 6. Propose Price / Send Offer to Client
  const handleSendOffer = (order: DriverRadarOrder, finalPrice: number) => {
    if (!currentUser || currentUser.role !== 'conductor') {
      haptic.warning();
      setShowDemoBlockModal(true);
      return;
    }

    if (walletBalance <= 0.00) {
      haptic.warning();
      setShowRechargeProofModal(true);
      alert('⚠️ Saldo insuficiente ($0.00 USD).\n\nDebes recargar saldo en tu Billetera Prepago para poder enviar ofertas y recibir carreras.');
      return;
    }

    updateOrderState(order.id, {
      proposedPrice: finalPrice,
      status: 'waiting_passenger',
    });

    // Simulate client accepting offer in 2.5s
    setTimeout(() => {
      setNegotiationStates((prev) => {
        if (prev[order.id]?.status === 'waiting_passenger') {
          return {
            ...prev,
            [order.id]: {
              ...prev[order.id],
              status: 'passenger_selected',
            },
          };
        }
        return prev;
      });
    }, 2500);
  };

  // Permite al conductor cambiar o seleccionar la oficina aliada donde despachará (en otras provincias)
  const handleSelectAlliedOfficeForDriver = (office: SanCristobalOffice) => {
    setSelectedAlliedOffice(office);
    if (activeJob) {
      setActiveJob({
        ...activeJob,
        order: {
          ...activeJob.order,
          destination: `${office.carrier || 'Cooperativa'} - ${office.name} (${office.terminal})`,
          officeName: `${office.carrier || 'Cooperativa'} - ${office.name}`,
        },
      });
    }
    setShowAlliedOfficesSearch(false);
    haptic.success();
  };

  // 7. Accept Job & Start Live GPS Navigation
  const handleStartActiveJob = (order: DriverRadarOrder, price: number) => {
    if (!currentUser || currentUser.role !== 'conductor') {
      haptic.warning();
      setShowDemoBlockModal(true);
      return;
    }

    if (walletBalance <= 0.00) {
      haptic.warning();
      setShowRechargeProofModal(true);
      alert('⚠️ Saldo insuficiente ($0.00 USD).\n\nDebes recargar saldo en tu Billetera Prepago para poder aceptar carreras y empezar a trabajar.');
      return;
    }

    const isParcel = order.serviceType === 'encomienda';
    const isInterprovincialParcel = isParcel && (
      order.parcelDetails?.scope === 'interprovincial' ||
      order.isInterprovincial ||
      Boolean(order.parcelDetails?.arrivalOffice) ||
      order.distanceKm > 20
    );

    const originText = (order.parcelDetails?.originProvince || order.origin || '').toLowerCase();
    const isOriginTulcan = originText.includes('carchi') || originText.includes('tulcán') || originText.includes('tulcan');

    let effectiveOrder: DriverRadarOrder = order;

    if (isInterprovincialParcel) {
      if (isOriginTulcan) {
        // En Tulcán: Fijo y obligatorio a la Oficina Tulcanaza (Avenida Centenario)
        effectiveOrder = {
          ...order,
          destination: 'Oficina Tulcanaza (Avenida Centenario), Tulcán',
          officeName: 'Oficina Tulcanaza (Avenida Centenario)',
          distanceKm: 3.2,
          durationMin: 7,
        };
      } else {
        // En Otras Provincias: El conductor busca y selecciona dónde enviar de las oficinas aliadas
        const matchedOffice = ALL_PARCEL_OFFICES.find((o) =>
          originText.includes(o.province.toLowerCase()) || originText.includes(o.city.toLowerCase())
        ) || ALL_PARCEL_OFFICES.find((o) => o.province === 'Pichincha') || ALL_PARCEL_OFFICES[0];

        setSelectedAlliedOffice(matchedOffice);
        effectiveOrder = {
          ...order,
          destination: `${matchedOffice.carrier || 'Cooperativa'} - ${matchedOffice.name} (${matchedOffice.terminal})`,
          officeName: `${matchedOffice.carrier || 'Cooperativa'} - ${matchedOffice.name}`,
          distanceKm: 4.2,
          durationMin: 10,
        };
      }
    }

    const jobState = {
      order: effectiveOrder,
      finalPrice: price,
      step: 'navigating_to_pickup' as const,
      currentEtaMin: effectiveOrder.etaPickupMin,
      distanceRemainingKm: effectiveOrder.distanceFromDriverKm,
      speedKmH: 38,
      pinInput: '',
      isPinVerified: false,
    };

    setActiveJob(jobState);
    setActiveTab('navegacion');

    if (onTakeOrder) {
      onTakeOrder(effectiveOrder, price);
    }

    if (onAcceptIncomingJob) {
      onAcceptIncomingJob({
        ...effectiveOrder,
        finalPrice: price,
      });
    }
  };

  // 8. Navigation Step Updates:
  // Step A: Driver arrives at pickup
  const handleArriveAtPickup = () => {
    if (!activeJob) return;
    setActiveJob({
      ...activeJob,
      step: 'at_pickup',
      distanceRemainingKm: 0,
      currentEtaMin: 0,
      speedKmH: 0,
    });
  };

  // Inspección de documento comercial para Encomiendas (Regla S/F y NDV)
  const handleDriverVerifyInvoice = (status: 'factura_verificada' | 'sin_factura_ndv') => {
    if (!activeJob) return;
    haptic.selection();

    const currentParcel = activeJob.order.parcelDetails || {
      scope: 'urbano',
      size: 'pequeno',
      weightKg: 2,
      description: 'Paquete encomienda',
      isFragile: false,
      senderName: activeJob.order.clientName,
      senderCedula: '1710000001',
      receiverName: 'Destinatario',
      receiverPhone: activeJob.order.clientPhone,
      photoUrls: [],
    };

    let updatedDescription = currentParcel.description || '';
    if (status === 'sin_factura_ndv') {
      if (!updatedDescription.includes('S/F - NDV')) {
        updatedDescription = `${updatedDescription} [S/F - NDV (Sin Factura - No Declara Valor)]`.trim();
      }
    } else {
      updatedDescription = updatedDescription.replace(' [S/F - NDV (Sin Factura - No Declara Valor)]', '').replace('[S/F - NDV (Sin Factura - No Declara Valor)]', '').trim();
    }

    const updatedParcel = {
      ...currentParcel,
      driverCommercialInspection: status,
      hasInvoiceAttached: status === 'factura_verificada',
      declaredValueUsd: status === 'sin_factura_ndv' ? 0 : (currentParcel.declaredValueUsd || 50),
      description: updatedDescription,
      commercialDisclaimerNote: status === 'sin_factura_ndv'
        ? 'Transporte bajo responsabilidad del remitente por falta de comprobante de venta.'
        : undefined,
    };

    setActiveJob({
      ...activeJob,
      order: {
        ...activeJob.order,
        parcelDetails: updatedParcel,
      },
    });
  };

  // Step B: Confirm Pickup (Pasajero a bordo / Pedido retirado / Paquete recibido) con PIN de seguridad
  const handleConfirmPickup = () => {
    if (!activeJob) return;
    const isParcel = activeJob.order.serviceType === 'encomienda';
    const isInterprovincialParcel = isParcel && (
      activeJob.order.parcelDetails?.scope === 'interprovincial' ||
      activeJob.order.isInterprovincial ||
      Boolean(activeJob.order.parcelDetails?.arrivalOffice) ||
      activeJob.order.distanceKm > 20
    );

    if (!isParcel) {
      const expectedPin = String(activeJob.order.pickupPin || '1234');
      if (enteredPin.trim() !== expectedPin) {
        setPinError('PIN incorrecto. Solicite al pasajero/usuario el PIN correcto de 4 dígitos.');
        return;
      }
    }
    setPinError(null);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });

    // Para encomiendas interprovinciales: En Tulcán es la Oficina Tulcanaza, en otras provincias la oficina aliada seleccionada
    const originText = (activeJob.order.parcelDetails?.originProvince || activeJob.order.origin || '').toLowerCase();
    const isOriginTulcan = originText.includes('carchi') || originText.includes('tulcán') || originText.includes('tulcan');

    const finalDest = isInterprovincialParcel
      ? (isOriginTulcan
          ? 'Oficina Tulcanaza (Avenida Centenario), Tulcán'
          : (activeJob.order.officeName || activeJob.order.destination))
      : activeJob.order.destination;

    setActiveJob({
      ...activeJob,
      order: {
        ...activeJob.order,
        destination: finalDest,
      },
      step: 'navigating_to_destination',
      distanceRemainingKm: isInterprovincialParcel ? 3.2 : activeJob.order.distanceKm,
      currentEtaMin: isInterprovincialParcel ? 7 : activeJob.order.durationMin,
      speedKmH: 35,
      isPinVerified: true,
    });
  };

  // Step C: Driver arrives at destination
  const handleArriveAtDestination = () => {
    if (!activeJob) return;
    setActiveJob({
      ...activeJob,
      step: 'at_destination',
      distanceRemainingKm: 0,
      currentEtaMin: 0,
      speedKmH: 0,
    });
  };

  // Step D: Confirm Delivery & Receive Earnings
  const handleCompleteAndSettleEarnings = () => {
    if (!activeJob) return;

    const isInterprovincial = activeJob.order.isInterprovincial || activeJob.order.distanceKm > 20;
    const isEncomienda = activeJob.order.serviceType === 'encomienda' || activeJob.order.id?.includes('parcel') || String(activeJob.order.serviceType).includes('encomienda');
    const isInterprovincialEncomienda = isInterprovincial && isEncomienda;
    const isEjecutivo = (activeJob.order.serviceType as any) === 'ejecutivo_quito' || (activeJob.order.serviceType as any) === 'ejecutivo' || activeJob.order.id?.includes('exec') || activeJob.order.id?.includes('ejec');
    const isDelivery = activeJob.order.serviceType === 'domicilio';

    // Desglose para Delivery: Producto comprado vs Tarifa de carrera
    const productSubtotal = isDelivery
      ? (activeJob.order.deliverySubtotalUsd || activeJob.order.deliveryItems?.reduce((acc, it) => acc + (it.item?.price || 0) * (it.quantity || 1), 0) || 0)
      : 0;
    const deliveryFareOnly = isDelivery
      ? (activeJob.order.deliveryFeeUsd || (activeJob.finalPrice > productSubtotal && productSubtotal > 0 ? activeJob.finalPrice - productSubtotal : activeJob.order.suggestedFair || 1.25))
      : activeJob.finalPrice;

    // Cantidad de pasajeros en servicio ejecutivo (1 pax = $3, 2 pax = $6, 3 pax = $9, 4 pax = $12)
    const executiveSeats = activeJob.order.seats || activeJob.order.passengerCount || (activeJob.order.isWholeCar ? 4 : (activeJob.finalPrice >= 90 ? 4 : Math.max(1, Math.round(activeJob.finalPrice / 25))));
    const executivePaxCount = isEjecutivo ? Math.min(4, Math.max(1, executiveSeats)) : 1;

    // Bono Especial de Comisión: Mantén saldo positivo mayor a $50 USD para tarifas preferenciales (5% en vez de 7%)
    const isPreferentialActive = walletBalance >= 50.00;
    const baseCommission = isPreferentialActive ? 5 : (systemTariffs?.platformCommissionPercent ?? 7);
    const commissionPercent = isEjecutivo ? 0 : (isInterprovincialEncomienda ? 9 : baseCommission);
    const gross = activeJob.finalPrice;

    // Débito de Comisión:
    // - Delivery: El repartidor compra el producto y cobra al cliente (Producto + Carrera). La comisión se descuenta ÚNICAMENTE de la carrera (0% de comisión sobre el producto comprado).
    // - Ejecutivo: $3.00 USD por pasajero
    // - Encomiendas interprovinciales: 9%
    // - Carreras urbanas: 7% (o 5% con saldo > $50 USD)
    const commission = isEjecutivo
      ? Number((3.00 * executivePaxCount).toFixed(2))
      : isDelivery
      ? Number((deliveryFareOnly * (commissionPercent / 100)).toFixed(2))
      : Number((gross * (commissionPercent / 100)).toFixed(2));
    const net = Number((gross - commission).toFixed(2));

    // Acreditar el valor neto de la carrera a la billetera del conductor
    const updatedWallet = Number((walletBalance + net).toFixed(2));
    onUpdateWalletBalance(updatedWallet);

    // New earnings record
    const newRecord: DriverEarningsRecord = {
      id: `earn-${Date.now()}`,
      tripId: activeJob?.order?.id || `JOB-${Date.now()}`,
      serviceType: activeJob.order.serviceType,
      clientName: activeJob.order.clientName,
      clientAvatar: activeJob.order.clientAvatar,
      clientPhone: activeJob.order.clientPhone,
      originName: activeJob.order.origin,
      destinationName: activeJob.order.destination,
      distanceKm: activeJob.order.distanceKm,
      grossAmountUsd: gross,
      commissionPercent: isEjecutivo ? undefined : commissionPercent,
      commissionAmountUsd: commission,
      netEarnedUsd: net,
      paymentMethod: activeJob.order.paymentMethodType,
      timestamp: Date.now(),
      dateFormatted: 'Recién completado',
      status: 'completado',
      ratingReceived: 5.0,
    };

    setEarningsHistory([newRecord, ...earningsHistory]);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
    });

    setActiveJob({
      ...activeJob,
      step: 'earnings_settled',
    });
  };

  return (
    <div className="w-full flex flex-col gap-3.5 animate-fadeIn">
      {/* ========================================================================= */}
      {/* UNIFIED DRIVER COCKPIT (CABINA DE CONTROL DEL CONDUCTOR)                  */}
      {/* ========================================================================= */}
      <div className={`p-3.5 sm:p-4 rounded-3xl border shadow-xl flex flex-col gap-3 transition-colors ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Row 1: Profile & Vehicle Identity + Radar Power Switch */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={driverProfile.avatar || null}
                alt={driverProfile.name}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-sm"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                  isDark ? 'border-zinc-900' : 'border-white'
                } ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                }`}
                title={isOnline ? 'Radar Conectado' : 'Desconectado'}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-black text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{driverProfile.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isFullyApproved ? '✓ Habilitado' : '⚠ Revisar'}
                </span>
              </div>
              <p className={`text-[11px] truncate flex items-center gap-1 mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{vehicle.model}</span>
                <span className={isDark ? 'text-zinc-600' : 'text-slate-300'}>•</span>
                <span className="text-amber-500 dark:text-amber-400 font-mono font-bold">{vehicle.plate}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Botón SOS de Emergencia para el Conductor (Mismos términos y protocolos de seguridad) */}
            <button
              id="btn-driver-cockpit-sos"
              type="button"
              onClick={() => {
                haptic.warning();
                setShowDriverSosModal(true);
              }}
              className="h-7 sm:h-8 px-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-400/50 flex items-center gap-1.5 font-black text-[11px] flex-shrink-0 shadow-lg shadow-red-600/30 animate-pulse active:scale-95 cursor-pointer"
              title="Botón de Pánico y Auxilio SOS Conductor (Mismos términos, ECU 911 y evidencia)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span className="font-extrabold tracking-tight">SOS</span>
            </button>

            {/* Botón muy pequeño para conductor: Activo / Fuera de servicio */}
            <button
              id="btn-driver-power-toggle"
              type="button"
              disabled={isSuspendedByAdmin}
              onClick={toggleOnline}
              className={`h-7 sm:h-8 px-2.5 rounded-xl border transition-all flex items-center gap-1.5 font-black text-[11px] flex-shrink-0 shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/50 hover:bg-rose-500/25'
              }`}
              title={isOnline ? 'Conductor en línea (Activo para recibir carreras)' : 'Conductor Fuera de servicio'}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="font-extrabold tracking-tight">{isOnline ? 'Activo' : 'Fuera de servicio'}</span>
            </button>
          </div>
        </div>

        {/* ALERTA DE SUSPENSIÓN ADMINISTRATIVA (Si el Administrador bloqueó al conductor) */}
        {isSuspendedByAdmin && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 text-rose-200 text-xs flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-bounce" />
            <div className="flex-1">
              <p className="font-black text-rose-300 text-sm">CUENTA SUSPENDIDA POR ADMINISTRACIÓN</p>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Esta unidad ha sido pausada desde la central administrativa por verificación de documentos o revisión operativa. Contacta a soporte matriz en Tulcán.
              </p>
            </div>
          </div>
        )}

        {/* Row 2: Modality Segmented Selector (Carro vs Moto) */}
        <div className={`p-1 rounded-2xl border flex items-center gap-1 transition-colors ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            id="btn-driver-switch-car"
            onClick={() => handleSwitchVehicleType('auto')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${
              vehicle.type === 'auto'
                ? 'bg-sky-500 text-zinc-950 shadow-md ring-1 ring-sky-300'
                : isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span className="truncate">Modo Carro (Taxi / 4 Pax)</span>
          </button>

          <button
            type="button"
            id="btn-driver-switch-moto"
            onClick={() => handleSwitchVehicleType('moto')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all min-h-[36px] ${
              vehicle.type === 'moto'
                ? 'bg-amber-400 text-zinc-950 shadow-md ring-1 ring-amber-300'
                : isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span className="truncate">Modo Moto (Delivery / 1 Pax)</span>
          </button>
        </div>

        {/* Row 3: Quick Metrics & Taxímetro Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Card 1: Billetera Prepago */}
          <button
            type="button"
            onClick={() => setActiveTab('ganancias')}
            className={`p-2.5 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
              isDark ? 'bg-zinc-950 border-zinc-850 hover:bg-zinc-850/80' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm'
            }`}
            title="Ir a Billetera y Ganancias"
          >
            <div className={`flex items-center justify-between text-[10px] uppercase font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span>Billetera Prepago</span>
              <Wallet className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono font-black text-emerald-500 text-sm">{formatCurrency(walletBalance)}</span>
              <span className="text-[10px] text-emerald-400/80 font-bold underline">Recargar</span>
            </div>
          </button>

          {/* Card 2: Comisión App */}
          <div className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between text-[10px] uppercase font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span>Comisiones App</span>
              <span className="text-[9px] text-emerald-400 font-bold">Transparente</span>
            </div>
            <div className="mt-1">
              <span className="font-mono font-black text-rose-400 text-[10.5px] block leading-tight">
                7% Urbano • 9% Encomiendas • $3/pax Ejecutivo
              </span>
              <span className={`text-[9px] block truncate mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                100% cobro directo al chofer
              </span>
            </div>
          </div>

          {/* Card 3: Calificación */}
          <div className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between text-[10px] uppercase font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span>Calificación</span>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            </div>
            <div className="mt-1">
              <span className="font-black text-amber-500 text-sm">4.96 ★</span>
              <span className={`text-[9px] block truncate ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>1,840 carreras</span>
            </div>
          </div>

          {/* Card 4: Carreras Completadas */}
          <div className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-slate-50 border-slate-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between text-[10px] uppercase font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span>Carreras</span>
              <Check className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="mt-1">
              <span className={`font-mono font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{earningsHistory.length}</span>
              <span className={`text-[9px] block truncate ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Completadas hoy</span>
            </div>
          </div>
        </div>

        {/* Low / Zero prepaid balance alert */}
        {walletBalance <= 0.00 ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <Wallet className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <strong className="text-amber-300 block text-xs">Saldo Inicial: $0.00 USD (Recarga Requerida)</strong>
                <span className="text-[11px] text-zinc-300">
                  Para conectarte en línea y recibir carreras debes realizar tu primera recarga de saldo en tu Billetera Prepago.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRechargeProofModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex-shrink-0 cursor-pointer shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <span>⚡ Recargar Saldo</span>
            </button>
          </div>
        ) : walletBalance < 2.00 && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-between text-xs text-rose-200 animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="truncate text-[11px]">
                <strong>Saldo bajo ({formatCurrency(walletBalance)} USD):</strong> Tu saldo es menor a $2.00. Recarga pronto para seguir operando sin interrupciones.
              </span>
            </div>
            <button
              onClick={() => setShowRechargeProofModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-[11px] flex-shrink-0 ml-2"
            >
              Recargar Ahora
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2-TIER HIGH-ERGONOMICS NAVIGATION HUB                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-1.5">
        {/* Tier 1: Live Operational Tabs (Radar, Navegación, Ganancias) */}
        <div className={`p-1 rounded-2xl border grid grid-cols-3 gap-1 text-xs transition-colors ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            id="tab-driver-radar"
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`py-2.5 px-2 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all min-h-[42px] ${
              activeTab === 'radar'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : isDark
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="truncate">Radar</span>
            {filteredOrders.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === 'radar' ? 'bg-zinc-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {filteredOrders.length}
              </span>
            )}
          </button>

          <button
            id="tab-driver-nav"
            type="button"
            onClick={() => setActiveTab('navegacion')}
            className={`py-2.5 px-2 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all min-h-[42px] relative ${
              activeTab === 'navegacion'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : isDark
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="truncate">En Ruta</span>
            {activeJob && activeJob.step !== 'earnings_settled' && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
            )}
          </button>

          <button
            id="tab-driver-earnings"
            type="button"
            onClick={() => setActiveTab('ganancias')}
            className={`py-2.5 px-2 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all min-h-[42px] ${
              activeTab === 'ganancias'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : isDark
                ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="truncate">Ganancias</span>
          </button>
        </div>

        {/* Tier 2: Unit Configuration & Management (Servicios, Vehículo, Documentos, Perfil) */}
        <div className={`p-1 rounded-2xl border grid grid-cols-4 gap-1 text-[11px] transition-colors ${
          isDark ? 'bg-zinc-950/80 border-zinc-850' : 'bg-slate-200/50 border-slate-300'
        }`}>
          <button
            id="tab-driver-services"
            type="button"
            onClick={() => setActiveTab('servicios')}
            className={`py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all min-h-[34px] ${
              activeTab === 'servicios'
                ? isDark ? 'bg-zinc-200 text-zinc-950 font-black shadow-sm' : 'bg-white text-slate-950 shadow-sm font-black'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Servicios</span>
          </button>

          <button
            id="tab-driver-vehicle"
            type="button"
            onClick={() => setActiveTab('vehiculo')}
            className={`py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all min-h-[34px] ${
              activeTab === 'vehiculo'
                ? isDark ? 'bg-zinc-200 text-zinc-950 font-black shadow-sm' : 'bg-white text-slate-950 shadow-sm font-black'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Car className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Vehículo</span>
          </button>

          <button
            id="tab-driver-docs"
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all min-h-[34px] ${
              activeTab === 'documentos'
                ? isDark ? 'bg-zinc-200 text-zinc-950 font-black shadow-sm' : 'bg-white text-slate-950 shadow-sm font-black'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Docs ANT</span>
          </button>

          <button
            id="tab-driver-profile"
            type="button"
            onClick={() => setActiveTab('registro')}
            className={`py-1.5 px-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all min-h-[34px] ${
              activeTab === 'registro'
                ? isDark ? 'bg-zinc-200 text-zinc-950 font-black shadow-sm' : 'bg-white text-slate-950 shadow-sm font-black'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Perfil</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RADAR DE SOLICITUDES CERCANAS + OFERTAS / CONTRAOFERTAS           */}
      {/* ========================================================================= */}
      {activeTab === 'radar' && (
        <div className="flex flex-col gap-3.5">
          {/* AVISO MODO DEMO / SOLO VISUALIZACIÓN PARA CONDUCTORES */}
          {(!currentUser || currentUser.role !== 'conductor') && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/40">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <strong className="text-amber-400 font-black block text-xs uppercase tracking-wider">
                    Modo Demo Conductor (Solo Visualización)
                  </strong>
                  <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                    Puedes explorar el radar, mapas y pedidos simulados. Para operar, negociar y recibir carreras reales debes registrarte con tu licencia de conducir.
                  </span>
                </div>
              </div>
              {onOpenRegister && (
                <button
                  type="button"
                  onClick={() => onOpenRegister('conductor')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Registrarme como Conductor
                </button>
              )}
            </div>
          )}

          {/* Alerta de Estado de Verificación si no está 100% aprobado */}
          {(!documents.isFullyVerified ||
            documents.licenseStatus !== 'aprobado' ||
            documents.criminalRecordStatus !== 'aprobado') && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-amber-200">
                  Estado de Documentos:{' '}
                  <strong>
                    {documents.licenseStatus === 'en_revision' || documents.criminalRecordStatus === 'en_revision'
                      ? 'En Revisión por el Administrador'
                      : 'Pendiente de Validación'}
                  </strong>
                  . Tus documentos están en proceso de auditoría oficial.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('registro')}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all self-start sm:self-auto flex-shrink-0"
              >
                Ver Estado
              </button>
            </div>
          )}

          {/* Live Dispatch Broadcast Notice */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-sky-950/60 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-2 flex-wrap">
                  <span>Despacho de Carreras & Pedidos AndesMovi</span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Notificando a toda la flota en tiempo real
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  Cuando un cliente solicita una carrera, pedido o encomienda, todos los conductores reciben la notificación para poder tomar la carrera directamente aquí.
                </p>
              </div>
            </div>
          </div>

          {/* Radar Header & Vehicle Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Solicitudes en Radar ({filteredOrders.length} disponibles)
            </span>

            {/* Quick Filter: Carros vs Motos */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
              <button
                type="button"
                id="btn-filter-radar-all"
                onClick={() => setRadarVehicleFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  radarVehicleFilter === 'all'
                    ? 'bg-zinc-200 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({orders.length})
              </button>
              <button
                type="button"
                id="btn-filter-radar-auto"
                onClick={() => setRadarVehicleFilter('auto')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                  radarVehicleFilter === 'auto'
                    ? 'bg-sky-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Car className="w-3 h-3" />
                <span>Carros</span>
              </button>
              <button
                type="button"
                id="btn-filter-radar-moto"
                onClick={() => setRadarVehicleFilter('moto')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                  radarVehicleFilter === 'moto'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bike className="w-3 h-3" />
                <span>Motos</span>
              </button>
            </div>
          </div>

          {/* Quick Bar: Efectivo Disponible para Compras en Local (Delivery) */}
          {activeServices.delivery && (
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${hasCashForPurchases ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-xs">
                    Efectivo para Compras en Locales: <strong className={hasCashForPurchases ? 'text-emerald-400 font-mono' : 'text-zinc-500'}>
                      {hasCashForPurchases ? `$${availableCashAmount.toFixed(2)} USD` : 'Desactivado'}
                    </strong>
                  </span>
                  <span className="text-[10px] text-zinc-400 leading-tight block">
                    Pagas en el local al retirar y cobras el 100% al cliente en Efectivo o Transferencia Directa
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    haptic.tap();
                    setHasCashForPurchases(!hasCashForPurchases);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    hasCashForPurchases
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {hasCashForPurchases ? '✓ Con Efectivo' : 'Sin Efectivo'}
                </button>
                {hasCashForPurchases && (
                  <div className="flex items-center gap-1">
                    {[20, 30, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          setAvailableCashAmount(amt);
                        }}
                        className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold border transition-colors ${
                          availableCashAmount === amt
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredOrders.length === 0 ? (
            <div className={`p-6 rounded-2xl border text-center ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600 shadow-sm'
            }`}>
              <Sliders className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
              <p className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>No hay solicitudes para los filtros activos.</p>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Prueba seleccionando "Todos" o cambiando a otra modalidad de vehículo.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredOrders.map((order) => {
                const state = getOrderState(order.id, order.passengerOffer);
                const isTrip = order.serviceType === 'viaje';
                const isDelivery = order.serviceType === 'domicilio';
                const isParcel = order.serviceType === 'encomienda';
                const isEjecutivo = order.serviceType === 'ejecutivo_quito';

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-3xl border transition-all flex flex-col gap-3 shadow-lg ${
                      isDark ? 'bg-zinc-900' : 'bg-white text-slate-900 shadow-md'
                    } ${
                      state.status === 'passenger_selected'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : state.status === 'waiting_passenger'
                        ? 'border-amber-500/50'
                        : isDark
                        ? 'border-zinc-800 hover:border-zinc-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Realtime Request Banner */}
                    {order.isRealtimeClientOrder && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
                          <span>¡Solicitud en Tiempo Real! Notificado a todos los conductores</span>
                        </div>
                        <span className="text-[10px] bg-emerald-400 text-zinc-950 font-black px-2 py-0.5 rounded shadow">EN VIVO</span>
                      </div>
                    )}

                    {/* Header: Client & Offered Price */}
                    <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={order.clientAvatar || null}
                          alt={order.clientName}
                          className={`w-10 h-10 rounded-xl object-cover border flex-shrink-0 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.clientName}</span>
                            <span className="text-[10px] text-amber-500 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {order.clientRating} ★
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">
                              {isEjecutivo ? '✈️ Turno Ejecutivo Quito / Aeropuerto' : isTrip ? '🚖 Viaje Urbano' : isDelivery ? '🛵 Delivery Repartidor' : '📦 Encomienda'}
                            </span>
                            {order.vehicleCompatibility === 'auto' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-0.5">
                                <Car className="w-2.5 h-2.5" /> Carro / Taxi
                              </span>
                            )}
                            {order.vehicleCompatibility === 'moto' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-0.5">
                                <Bike className="w-2.5 h-2.5" /> Moto Express
                              </span>
                            )}
                            {order.vehicleCompatibility === 'both' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                                <Car className="w-2.5 h-2.5" /> / <Bike className="w-2.5 h-2.5" /> Carro o Moto
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {order.serviceType === 'encomienda' ? (
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] block font-semibold text-amber-400 uppercase tracking-wider">Cotización Chofer</span>
                          <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
                            Tarifa Pendiente
                          </span>
                        </div>
                      ) : (
                        <div className="text-right flex-shrink-0">
                          <span className={`text-[10px] block font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Oferta Cliente</span>
                          <span className="text-base font-black text-emerald-500 font-mono">
                            {formatCurrency(order.passengerOffer)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Route Details */}
                    <div className={`p-3 rounded-2xl border flex flex-col gap-2 text-xs relative ${
                      isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-start gap-2.5 relative">
                        <div className="flex flex-col items-center mt-1 flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          <div className={`w-0.5 h-6 my-0.5 ${isDark ? 'bg-zinc-800' : 'bg-slate-300'}`} />
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
                        </div>
                        <div className="flex flex-col gap-2 min-w-0 flex-1">
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] block uppercase font-black tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                Recogida / Abordaje (Origen)
                              </span>
                              <div className="flex items-center gap-1">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.origin)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-1"
                                  title="Abrir punto de abordaje en Google Maps"
                                >
                                  <span>🗺️ Google Maps</span>
                                </a>
                                <a
                                  href={`https://waze.com/ul?q=${encodeURIComponent(order.origin)}&navigate=yes`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded-lg hover:bg-cyan-900 transition-colors flex items-center gap-1"
                                  title="Abrir punto de abordaje en Waze"
                                >
                                  <span>🧭 Waze</span>
                                </a>
                              </div>
                            </div>
                            <p className={`font-medium truncate text-xs ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{order.origin}</p>
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[10px] block uppercase font-black tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Destino</span>
                            <p className={`font-medium truncate text-xs ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{order.destination}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method of Client */}
                      <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                        isDark ? 'border-zinc-850/80' : 'border-slate-200'
                      }`}>
                        <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          <Wallet className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>
                            {order.serviceType === 'encomienda'
                              ? `Modalidad: `
                              : `Pago: `}
                            <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                              {order.parcelDetails?.paymentTiming === 'por_cobrar_destino'
                                ? 'Por Cobrar en Destino'
                                : order.parcelDetails?.paymentTiming === 'pago_origen'
                                ? 'Pago en Origen'
                                : order.paymentMethodName}
                            </strong>
                          </span>
                        </span>
                        <span className="text-emerald-500 font-black">
                          A {order.distanceFromDriverKm} km (~{order.etaPickupMin} min)
                        </span>
                      </div>

                      {/* Encomienda Detailed Specifications for Driver Inspection */}
                      {order.serviceType === 'encomienda' && order.parcelDetails && (
                        <div className="pt-2 border-t border-zinc-800 space-y-2 text-xs">
                          {/* Remitente & Destinatario Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] space-y-0.5">
                              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">
                                👤 Remitente (Envía):
                              </span>
                              <p className="font-bold text-white text-xs">{order.parcelDetails.senderName || order.clientName}</p>
                              <p className="text-zinc-400 font-mono text-[10px]">C.I.: {order.parcelDetails.senderCedula || 'N/A'}</p>
                              <p className="text-zinc-400 font-mono text-[10px]">Tel: {order.parcelDetails.senderPhone || order.clientPhone}</p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] space-y-0.5">
                              <span className="text-[10px] text-rose-400 font-black uppercase tracking-wider block">
                                🎯 Destinatario (Recibe):
                              </span>
                              <p className="font-bold text-white text-xs">{order.parcelDetails.receiverName || 'N/A'}</p>
                              <p className="text-emerald-400 font-mono text-[10px] font-bold">Cédula: {order.parcelDetails.receiverCedula || 'N/A'}</p>
                              <p className="text-zinc-400 font-mono text-[10px]">Tel: {order.parcelDetails.receiverPhone || 'N/A'}</p>
                              {order.parcelDetails.deliveryCityOrStop && (
                                <p className="text-zinc-300 text-[10px] truncate">
                                  <strong>Entrega:</strong> {order.parcelDetails.deliveryCityOrStop}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Detalle del Paquete */}
                          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-bold">Detalle de Carga:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono font-bold text-[10px]">
                                  {order.parcelDetails.packageCount || 1} bulto(s)
                                </span>
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono font-bold text-[10px]">
                                  {order.parcelDetails.weightKg || 2} kg
                                </span>
                                {order.parcelDetails.isFragile && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-black text-[10px] border border-rose-500/30">
                                    ⚠️ Frágil
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-zinc-200 italic bg-black/30 p-1.5 rounded-lg border border-zinc-800/80">
                              "{order.parcelDetails.description || 'Sin descripción'}"
                            </p>
                            {order.parcelDetails.hasDeclaredValue && (
                              <p className="text-[10px] text-amber-400 font-mono">
                                💰 Valor declarado: ${order.parcelDetails.declaredValueUsd?.toFixed(2) || '0.00'} USD
                                {order.parcelDetails.hasInvoiceAttached ? ' (Con factura física)' : ' (S/F - NDV)'}
                              </p>
                            )}

                            {/* Regla de Cobro de Encomienda Interprovincial y Pago a Oficina */}
                            {(order.isInterprovincial || order.distanceKm > 20) && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1 mt-2">
                                <div className="flex items-center gap-1.5 font-black uppercase text-[10px]">
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Instrucción de Encomienda Interprovincial</span>
                                </div>
                                <p className="leading-snug">
                                  💵 <strong>Cobras el 100%</strong> de la encomienda al cliente ($USD) al retirar o entregar.
                                </p>
                                <p className="leading-snug">
                                  🏢 <strong>Pagas la tarifa de envío</strong> ($4.00 - $9.00 USD según peso/flete) directamente en las <strong>oficinas aliadas</strong> (Ej. San Cristóbal, Pullman, Cita Express, Vencedores) al despachar.
                                </p>
                                <p className="leading-snug">
                                  📱 AndesMovi únicamente descuenta el <strong>9% de comisión</strong> de tu billetera prepago por coordinar el servicio.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Domicilio / Delivery Detailed Specifications & Direct Cash Purchase Model */}
                      {order.serviceType === 'domicilio' && (() => {
                        const productSubtotal = order.deliverySubtotalUsd || order.deliveryItems?.reduce((acc, it) => acc + (it.item?.price || 0) * (it.quantity || 1), 0) || 0;
                        const deliveryFee = order.deliveryFeeUsd || (order.passengerOffer > productSubtotal && productSubtotal > 0 ? order.passengerOffer - productSubtotal : order.passengerOffer);
                        const totalToCollect = productSubtotal + deliveryFee;
                        const isCashAvailableOk = hasCashForPurchases && availableCashAmount >= productSubtotal;

                        return (
                          <div className="pt-2 border-t border-zinc-800 space-y-2 text-xs">
                            {/* Tienda o Restaurante & Artículos */}
                            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">
                                  🏪 Local / Restaurante:
                                </span>
                                <span className="text-white font-bold text-xs">{order.restaurantName || 'Restaurante / Local Afiliado'}</span>
                              </div>
                              {order.deliveryItems && order.deliveryItems.length > 0 && (
                                <div className="space-y-0.5 pt-1 border-t border-zinc-850">
                                  {order.deliveryItems.map((c, i) => (
                                    <div key={i} className="flex justify-between text-[11px] text-zinc-300">
                                      <span>{c.quantity}x {c.item.name}</span>
                                      <span className="font-mono text-zinc-400">{formatCurrency(c.item.price * c.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Desglose Modelo de Compra en Local & Cobro al Cliente */}
                            <div className="p-3 rounded-2xl bg-zinc-950 border border-emerald-500/40 space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between text-zinc-300">
                                <span>🛒 1. Pagas en local al retirar (de tu bolsillo):</span>
                                <span className="font-mono font-bold text-amber-400">{formatCurrency(productSubtotal)} USD</span>
                              </div>
                              <div className="flex items-center justify-between text-zinc-300">
                                <span>🛵 2. Tarifa ganancia carrera delivery:</span>
                                <span className="font-mono font-bold text-emerald-400">+{formatCurrency(deliveryFee)} USD</span>
                              </div>
                              <div className="flex items-center justify-between text-rose-400 text-[10px]">
                                <span>📉 Comisión AndesMovi (7% SÓLO de la carrera):</span>
                                <span className="font-mono font-bold">-{formatCurrency(deliveryFee * 0.07)} USD</span>
                              </div>
                              <div className="pt-1 border-t border-zinc-800 flex items-center justify-between text-xs font-black text-white">
                                <span className="text-emerald-400">💵 Cobras al cliente al recibir (Efectivo o Transferencia):</span>
                                <span className="font-mono text-emerald-400 text-sm">{formatCurrency(totalToCollect)} USD</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 italic">
                                ↳ Recuperas el 100% de tus {formatCurrency(productSubtotal)} + {formatCurrency(deliveryFee * 0.93)} netos de carrera.
                              </div>
                            </div>

                            {/* Cash Availability Warning / Toggle if insufficient cash */}
                            {productSubtotal > 0 && !isCashAvailableOk && (
                              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] flex items-center justify-between gap-2">
                                <span>⚠️ Requiere ${productSubtotal.toFixed(2)} USD en efectivo para comprar en el local.</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHasCashForPurchases(true);
                                    setAvailableCashAmount(Math.max(50, productSubtotal + 10));
                                    haptic.tap();
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[10px] shrink-0"
                                >
                                  Tengo Efectivo
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* ENCOMIENDA: Fijación de Tarifa Directa por el Conductor */}
                    {order.serviceType === 'encomienda' ? (
                      <div className="flex flex-col gap-2.5 pt-2">
                        <div className="p-3 rounded-2xl bg-zinc-950 border border-amber-500/50 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase">
                              <Receipt className="w-4 h-4 text-amber-400" />
                              <span>Valor del Flete / Envío ($ USD)</span>
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold">
                              Cotización Conductor
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-zinc-400 text-base">$</span>
                              <input
                                type="number"
                                min="6"
                                step="0.50"
                                value={driverQuotedRates[order.id] !== undefined ? driverQuotedRates[order.id] : 6.0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setDriverQuotedRates((prev) => ({ ...prev, [order.id]: val }));
                                }}
                                placeholder="6.00"
                                className="w-full pl-7 pr-3 py-2 bg-zinc-900 border border-amber-500/60 rounded-xl text-amber-300 font-mono font-black text-base focus:outline-none focus:border-amber-400"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              {[6, 8, 10, 12, 15, 20, 25].map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => {
                                    haptic.tap();
                                    setDriverQuotedRates((prev) => ({ ...prev, [order.id]: amt }));
                                  }}
                                  className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                                    (driverQuotedRates[order.id] !== undefined ? driverQuotedRates[order.id] : 6.0) === amt
                                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                                      : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                                  }`}
                                >
                                  ${amt}
                                </button>
                              ))}
                            </div>
                          </div>

                          <span className="text-[10px] text-zinc-400 leading-tight">
                            <strong className="text-amber-400">Tarifa mínima flete: $6.00 USD.</strong> Digita el precio según peso ({order.parcelDetails?.weightKg || 2} kg), {order.parcelDetails?.packageCount || 1} bulto(s) y trayecto acordado.
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              haptic.tap();
                              setDismissedOrderIds((prev) => [...prev, order.id]);
                            }}
                            className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 border border-zinc-700 transition-colors"
                            title="Rechazar encomienda"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            id="btn-confirm-parcel-rate"
                            onClick={() => {
                              if (!currentUser || currentUser.role !== 'conductor') {
                                haptic.warning();
                                setShowDemoBlockModal(true);
                                return;
                              }
                              haptic.confirmTrip();
                              const rawPrice = driverQuotedRates[order.id] !== undefined ? driverQuotedRates[order.id] : 6.0;
                              const finalPrice = Math.max(6.0, rawPrice);
                              handleStartActiveJob({
                                ...order,
                                passengerOffer: finalPrice,
                                parcelDetails: order.parcelDetails ? {
                                  ...order.parcelDetails,
                                  driverQuotedPriceUsd: finalPrice,
                                  quotationStatus: 'cotizado_confirmado',
                                } : undefined,
                              }, finalPrice);
                            }}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              Confirmar Tarifa y Aceptar Encomienda ($
                              {Math.max(6.0, driverQuotedRates[order.id] !== undefined ? driverQuotedRates[order.id] : 6.0).toFixed(2)}{' '}
                              USD)
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Ordinary Rides / Deliveries Counter-Offer & Accept */
                      state.status === 'idle' && (
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                haptic.tap();
                                setDismissedOrderIds((prev) => [...prev, order.id]);
                              }}
                              className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-colors min-h-[42px] cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 border-zinc-700'
                                  : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
                              }`}
                              title="Rechazar y descartar del radar"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Rechazar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!currentUser || currentUser.role !== 'conductor') {
                                  haptic.warning();
                                  setShowDemoBlockModal(true);
                                  return;
                                }
                                haptic.tap();
                                updateOrderState(order.id, {
                                  isCounterOpen: !state.isCounterOpen,
                                  proposedPrice: state.proposedPrice || Number((order.passengerOffer + 0.50).toFixed(2)),
                                });
                              }}
                              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer ${
                                state.isCounterOpen
                                  ? isDark
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                  : isDark
                                  ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Contraofertar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                haptic.success();
                                handleStartActiveJob(order, order.passengerOffer);
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-transform min-h-[42px] cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>
                                {order.serviceType === 'viaje'
                                  ? '⚡ Aceptar Tarifa'
                                  : '⚡ Aceptar Pedido'}{' '}
                                ({formatCurrency(order.passengerOffer)})
                              </span>
                            </button>
                          </div>

                          {/* Counter-Offer Drawer */}
                          {state.isCounterOpen && (
                            <div className={`p-3 rounded-2xl border flex flex-col gap-2.5 animate-in fade-in ${
                              isDark ? 'bg-zinc-950 border-amber-500/40' : 'bg-amber-50/60 border-amber-300'
                            }`}>
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-amber-900'}`}>Tu propuesta de tarifa:</span>
                                <span className="text-base font-black text-amber-500 font-mono">
                                  {formatCurrency(state.proposedPrice)} USD
                                </span>
                              </div>

                              {/* Quick Price Buttons (+0.25, +0.50, +0.75, +1.00) */}
                              <div className="grid grid-cols-4 gap-1.5">
                                {[0.25, 0.50, 0.75, 1.00].map((inc) => (
                                  <button
                                    key={inc}
                                    type="button"
                                    onClick={() => {
                                      haptic.tap();
                                      updateOrderState(order.id, {
                                        proposedPrice: Number((order.passengerOffer + inc).toFixed(2)),
                                      });
                                    }}
                                    className={`py-1.5 rounded-lg active:scale-95 text-[11px] font-bold border transition-transform cursor-pointer ${
                                      isDark
                                        ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-700'
                                        : 'bg-white hover:bg-amber-100 text-amber-800 border-amber-200 shadow-sm'
                                    }`}
                                  >
                                    +{formatCurrency(inc)}
                                  </button>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  haptic.impactMedium();
                                  handleSendOffer(order, state.proposedPrice);
                                }}
                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                <span>Enviar Oferta de {formatCurrency(state.proposedPrice)} al Cliente</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {/* Waiting State */}
                    {state.status === 'waiting_passenger' && (
                      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/40 flex flex-col gap-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <Radio className="w-4 h-4 animate-pulse text-amber-400" />
                            Propuesta de {formatCurrency(state.proposedPrice)} enviada
                          </span>
                          <span className="text-[10px] text-zinc-400">Esperando al cliente...</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {order.clientName} está evaluando tu vehículo {vehicle.model} ({vehicle.plate}) y tu tarifa.
                        </p>
                      </div>
                    )}

                    {/* Passenger Accepted -> Ready to Start GPS Navigation */}
                    {state.status === 'passenger_selected' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/60 flex flex-col gap-2.5 animate-in zoom-in-95">
                        <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span>¡{order.clientName} aceptó tu servicio por {formatCurrency(state.proposedPrice)}!</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartActiveJob(order, state.proposedPrice)}
                          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                        >
                          <Compass className="w-4 h-4" />
                          <span>Iniciar Navegación GPS & Servicio</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NAVEGACIÓN ACTIVA (ORIGEN/DESTINO, RECOGIDA, ENTREGA, GANANCIAS)   */}
      {/* ========================================================================= */}
      {activeTab === 'navegacion' && (
        <div className="flex flex-col gap-3.5">
          {!activeJob ? (
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400">
              <Compass className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Sin navegación activa</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Acepta una solicitud en el Radar para iniciar la ruta GPS hacia el origen y destino del cliente.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-black"
              >
                Ir al Radar de Solicitudes
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {/* Active Service Status Badge */}
              <div className="p-4 rounded-3xl bg-zinc-900 border border-emerald-500/40 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-emerald-400 uppercase">
                      {activeJob.step === 'navigating_to_pickup' && 'Fase 1: En camino a la recogida'}
                      {activeJob.step === 'at_pickup' && 'Fase 2: En punto de recogida'}
                      {activeJob.step === 'navigating_to_destination' && 'Fase 3: En viaje al destino'}
                      {activeJob.step === 'at_destination' && 'Fase 4: En destino final'}
                      {activeJob.step === 'earnings_settled' && 'Fase 5: Servicio completado'}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-black text-white">
                    {formatCurrency(activeJob.finalPrice)} USD
                  </span>
                </div>

                {/* Client Contact Strip con Chat y Llamada por la app (VoIP) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950 p-2.5 rounded-2xl border border-zinc-850 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={activeJob.order.clientAvatar || null}
                      alt={activeJob.order.clientName}
                      className="w-9 h-9 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                    />
                    <div className="min-w-0 text-xs">
                      <span className="font-bold text-white block truncate">{activeJob.order.clientName}</span>
                      <span className="text-[10px] text-zinc-400">Cliente • {activeJob.order.clientRating} ★</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Botón Chat interno */}
                    <button
                      type="button"
                      id="btn-driver-open-client-chat"
                      onClick={() => {
                        haptic.tap();
                        setShowDriverChatModal(true);
                        setUnreadDriverChatCount(0);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-emerald-400 border border-zinc-700 flex items-center gap-1 text-[11px] font-bold transition-all active:scale-95 relative cursor-pointer"
                      title="Chat privado con el cliente"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                      {unreadDriverChatCount > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 font-black text-[9px] animate-pulse">
                          {unreadDriverChatCount}
                        </span>
                      )}
                    </button>

                    {/* Botón Llamar por la app (VoIP / WebRTC) */}
                    <button
                      type="button"
                      id="btn-driver-call-inapp"
                      onClick={() => {
                        haptic.click();
                        setShowDriverCallModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 text-[11px] font-black transition-all active:scale-95 cursor-pointer"
                      title="Llamar por la app (Voz VoIP interna)"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Llamar por la app</span>
                    </button>

                    {/* Respaldo llamada telefónica convencional */}
                    <a
                      href={`tel:${activeJob.order.clientPhone}`}
                      className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center justify-center transition-colors"
                      title="Llamada celular convencional"
                    >
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    </a>

                    {/* Botón WhatsApp directo al cliente */}
                    <a
                      href={`https://wa.me/${(activeJob.order.clientPhone || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-xl bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/40 flex items-center gap-1 text-[11px] font-black transition-all active:scale-95 cursor-pointer"
                      title="Escribir por WhatsApp al cliente"
                    >
                      <span>💬 WhatsApp</span>
                    </a>

                    {/* Botón SOS durante la ruta activa */}
                    <button
                      type="button"
                      id="btn-driver-nav-trip-sos"
                      onClick={() => {
                        haptic.warning();
                        setShowDriverSosModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 flex items-center gap-1 text-[11px] font-black transition-all active:scale-95 cursor-pointer shadow-sm"
                      title="Activar Botón de Auxilio SOS Conductor"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      <span>SOS Auxilio</span>
                    </button>
                  </div>
                </div>

                {/* Ficha Completa para Ventanilla de Envío de Encomienda Interprovincial */}
                {activeJob.order.serviceType === 'encomienda' && (() => {
                  const parcel = activeJob.order.parcelDetails;
                  const office = selectedAlliedOffice || parcel?.arrivalOffice;
                  const isInterprovincial = parcel?.scope === 'interprovincial' || activeJob.order.isInterprovincial || Boolean(office);

                  return (
                    <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-950 border border-emerald-500/50 shadow-2xl flex flex-col gap-3">
                      {/* Header de la Ficha */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <span>Ficha para Oficina de Envío</span>
                              {isInterprovincial && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-black">
                                  Interprovincial
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-zinc-400 block">
                              Datos oficiales requeridos por la cooperativa para registrar la encomienda
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          id="btn-copy-shipping-data"
                          onClick={() => handleCopyShippingOfficeData(parcel, activeJob.order)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md ${
                            copiedShippingData
                              ? 'bg-emerald-500 text-zinc-950 font-black'
                              : 'bg-zinc-850 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                          }`}
                          title="Copiar datos completos para pegar en WhatsApp o dictar en ventanilla"
                        >
                          {copiedShippingData ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Ficha</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Oficina / Cooperativa de Transporte Destino */}
                      <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 mb-0.5">
                            <Building2 className="w-3 h-3" /> Oficina / Cooperativa de Entrega:
                          </span>
                          <p className="text-xs font-bold text-white truncate">
                            {office ? `${office.carrier || 'Cooperativa'} · ${office.name}` : activeJob.order.destination}
                          </p>
                          {office && (
                            <p className="text-[11px] text-zinc-400">
                              {office.terminal} · {office.address} ({office.city})
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {office?.phone && (
                            <a
                              href={`tel:${office.phone}`}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold border border-zinc-700 flex items-center gap-1 transition-colors"
                              title="Llamar a la sucursal de encomiendas"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{office.phone}</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowAlliedOfficesSearch(true)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Search className="w-3 h-3" />
                            <span>Cambiar Oficina</span>
                          </button>
                        </div>
                      </div>

                      {/* Tarjetas Remitente y Destinatario (Los 2 datos más críticos en ventanilla) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Destinatario (Quién retira en la ventanilla de destino) */}
                        <div className="p-3 rounded-2xl bg-zinc-900 border border-emerald-500/40 relative overflow-hidden">
                          <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg bg-emerald-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider">
                            Para Ventanilla
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                            🎯 Destinatario (Retira el paquete):
                          </span>
                          <div className="space-y-1 text-xs">
                            <p className="font-black text-white text-sm">
                              {parcel?.receiverName || 'No especificado'}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-emerald-300 font-mono font-black text-xs border border-emerald-500/40">
                                C.I.: {parcel?.receiverCedula || 'Requerida en retiro'}
                              </span>
                              <span className="text-zinc-300 font-mono text-xs">
                                📞 {parcel?.receiverPhone || 'Sin teléfono'}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 pt-0.5">
                              📍 <strong>Destino:</strong> {parcel?.destinationProvince || office?.province || 'Ecuador'} · {parcel?.deliveryCityOrStop || office?.city || ''}
                            </p>
                          </div>
                        </div>

                        {/* Remitente (Quién entrega el paquete al conductor) */}
                        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                            👤 Remitente (Quien envía):
                          </span>
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-white text-sm">
                              {parcel?.senderName || activeJob.order.clientName}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-zinc-300 font-mono text-xs">
                                C.I.: <strong>{parcel?.senderCedula || 'No registrada'}</strong>
                              </span>
                              <span className="text-zinc-300 font-mono text-xs">
                                📞 {parcel?.senderPhone || activeJob.order.clientPhone}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 pt-0.5">
                              📍 <strong>Origen:</strong> {parcel?.originProvince || activeJob.order.origin}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Especificaciones del Paquete / Encomienda */}
                      <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-850 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Contenido</span>
                          <span className="font-bold text-white truncate block">
                            {parcel?.description || 'Paquete general'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Bultos y Peso</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {parcel?.packageCount || 1} bulto(s) · {parcel?.weightKg || 2} kg
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Modalidad de Flete</span>
                          <span className={`font-bold uppercase text-[11px] ${
                            parcel?.paymentTiming === 'por_cobrar_destino'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {parcel?.paymentTiming === 'por_cobrar_destino' ? 'Por cobrar en destino' : 'Pagado en origen'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Valor Declarado</span>
                          <span className="font-mono font-bold text-white">
                            ${(parcel?.declaredValueUsd || 0).toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      {/* Acciones Rápidas: Imprimir Guía Oficial */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                        <span className="text-[11px] text-zinc-400">
                          Muestra esta pantalla al agente de ventanilla en la oficina para emitir el boleto/guía.
                        </span>
                        <button
                          type="button"
                          id="btn-driver-emit-receipt"
                          onClick={() => {
                            haptic.tap();
                            setShowParcelReceiptModal(true);
                          }}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>🖨️ Ver Guía Oficial / Comprobante</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Vehicle Mode Indicator during trip */}
                <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {vehicle.type === 'moto' ? (
                      <>
                        <Bike className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-zinc-300 font-semibold">
                          Conduciendo en <strong>Moto Express</strong> ({vehicle.model} • {vehicle.plate})
                        </span>
                      </>
                    ) : (
                      <>
                        <Car className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-zinc-300 font-semibold">
                          Conduciendo en <strong>Carro / Taxi</strong> ({vehicle.model} • {vehicle.plate})
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    GPS En Vivo
                  </span>
                </div>

                {/* Telemetry Display */}
                {activeJob.step !== 'earnings_settled' && (
                  <div className="grid grid-cols-3 gap-2 text-center bg-zinc-950 p-2.5 rounded-2xl border border-zinc-850">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Distancia</span>
                      <span className="font-mono text-xs font-black text-white">{activeJob.distanceRemainingKm} km</span>
                    </div>
                    <div className="border-x border-zinc-850">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Tiempo ETA</span>
                      <span className="font-mono text-xs font-black text-emerald-400">~{activeJob.currentEtaMin} min</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Velocidad</span>
                      <span className="font-mono text-xs font-black text-amber-400">{activeJob.speedKmH} km/h</span>
                    </div>
                  </div>
                )}

                {/* Quick External GPS Links & Cancel Trip Button */}
                {activeJob.step !== 'earnings_settled' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const originText = (activeJob.order.parcelDetails?.originProvince || activeJob.order.origin || '').toLowerCase();
                        const isOriginTulcan = originText.includes('carchi') || originText.includes('tulcán') || originText.includes('tulcan');
                        const destinationQuery = activeJob.step.includes('pickup')
                          ? activeJob.order.origin
                          : (activeJob.order.serviceType === 'encomienda'
                              ? (isOriginTulcan
                                  ? 'Oficina Tulcanaza, Avenida Centenario, Tulcán, Ecuador'
                                  : (selectedAlliedOffice
                                      ? `${selectedAlliedOffice.carrier} ${selectedAlliedOffice.name}, ${selectedAlliedOffice.address}, ${selectedAlliedOffice.city}`
                                      : activeJob.order.destination))
                              : activeJob.order.destination);

                        return (
                          <>
                            <a
                              href={`https://waze.com/ul?q=${encodeURIComponent(destinationQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                              <span>Abrir en Waze</span>
                            </a>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Google Maps</span>
                            </a>
                          </>
                        );
                      })()}
                    </div>

                    {/* Botón Cancelar Viaje Activo Conductor */}
                    <button
                      type="button"
                      onClick={() => setShowDriverCancelModal(true)}
                      className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar viaje activo</span>
                    </button>
                  </div>
                )}

                {/* STAGE 1: DRIVER NAVIGATING TO PICKUP */}
                {activeJob.step === 'navigating_to_pickup' && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850 text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Punto de Recogida</span>
                      <p className="text-white font-medium">{activeJob.order.origin}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleArriveAtPickup}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md transition-all active:scale-95"
                    >
                      ✓ He llegado al punto de recogida
                    </button>
                  </div>
                )}

                {/* STAGE 2: CONFIRM PICKUP */}
                {activeJob.step === 'at_pickup' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 flex flex-col gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Estás en el origen: {activeJob.order.origin}</span>
                    </div>

                    {activeJob.order.serviceType === 'encomienda' ? (
                      <div className="flex flex-col gap-3">
                        {/* Sección de inspección de documento comercial */}
                        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase">
                              <FileText className="w-4 h-4 text-amber-400" />
                              <span>Inspección de Documento Comercial</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              Recepción Física
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 space-y-1">
                            <p>
                              <strong>Declaración del cliente en la app:</strong>{' '}
                              {activeJob.order.parcelDetails?.hasDeclaredValue && (activeJob.order.parcelDetails.declaredValueUsd || 0) > 0 ? (
                                <span className="text-emerald-400 font-bold font-mono">
                                  Valor Declarado: ${activeJob.order.parcelDetails.declaredValueUsd.toFixed(2)} USD
                                </span>
                              ) : (
                                <span className="text-zinc-400">Sin valor comercial declarado</span>
                              )}
                            </p>
                            {activeJob.order.parcelDetails?.invoiceNumber && (
                              <p className="text-zinc-400 font-mono text-[10px]">
                                Factura indicada: {activeJob.order.parcelDetails.invoiceNumber}
                              </p>
                            )}
                          </div>

                          {/* Botón de selección rápida (Radio button o Switch) */}
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">
                              ¿El cliente entrega la factura física de compra/venta?
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                id="btn-driver-invoice-verified"
                                onClick={() => handleDriverVerifyInvoice('factura_verificada')}
                                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                                  activeJob.order.parcelDetails?.driverCommercialInspection === 'factura_verificada'
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-black text-xs">
                                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                    activeJob.order.parcelDetails?.driverCommercialInspection === 'factura_verificada'
                                      ? 'border-emerald-400 bg-emerald-500 text-zinc-950'
                                      : 'border-zinc-600'
                                  }`}>
                                    {activeJob.order.parcelDetails?.driverCommercialInspection === 'factura_verificada' ? '✓' : ''}
                                  </span>
                                  <span>Factura entregada / Verificada</span>
                                </div>
                                <span className="text-[9px] text-zinc-400 leading-tight">
                                  Comprobante físico verificado en mano
                                </span>
                              </button>

                              <button
                                type="button"
                                id="btn-driver-no-invoice"
                                onClick={() => handleDriverVerifyInvoice('sin_factura_ndv')}
                                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                                  activeJob.order.parcelDetails?.driverCommercialInspection === 'sin_factura_ndv'
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-500/40'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-black text-xs">
                                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                                    activeJob.order.parcelDetails?.driverCommercialInspection === 'sin_factura_ndv'
                                      ? 'border-amber-400 bg-amber-500 text-zinc-950'
                                      : 'border-zinc-600'
                                  }`}>
                                    {activeJob.order.parcelDetails?.driverCommercialInspection === 'sin_factura_ndv' ? '✓' : ''}
                                  </span>
                                  <span>Sin Factura (S/F - NDV)</span>
                                </div>
                                <span className="text-[9px] text-zinc-400 leading-tight">
                                  No entrega factura física al chofer
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Lógica automática y leyenda de descargo */}
                          {activeJob.order.parcelDetails?.driverCommercialInspection === 'sin_factura_ndv' && (
                            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs space-y-1.5 animate-fadeIn">
                              <div className="flex items-center gap-1.5 font-black text-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <span>Régimen Aplicado: S/F - NDV (Sin Factura - No Declara Valor)</span>
                              </div>
                              <p className="text-[11px] text-zinc-200">
                                • Valor comercial anulado automáticamente: <strong>$0.00 USD</strong>.
                              </p>
                              <p className="text-[11px] text-zinc-300 italic bg-black/40 p-2 rounded-lg border border-amber-500/30">
                                "Transporte bajo responsabilidad del remitente por falta de comprobante de venta."
                              </p>
                            </div>
                          )}

                          {activeJob.order.parcelDetails?.driverCommercialInspection === 'factura_verificada' && (
                            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <span>
                                Factura física verificada con éxito. Valor declarado vigente para la guía.
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          id="btn-confirm-parcel-inspected-pickup"
                          onClick={handleConfirmPickup}
                          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-zinc-950" />
                          <span>Confirmar Inspección y Empezar Traslado de Encomienda</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] text-zinc-300 font-medium">
                          🔒 Solicite al pasajero el PIN de seguridad de 4 dígitos para autorizar e iniciar el viaje:
                        </p>

                        <div className="flex flex-col gap-1.5">
                          <input
                            type="text"
                            maxLength={4}
                            value={enteredPin}
                            onChange={(e) => {
                              setEnteredPin(e.target.value.replace(/\D/g, ''));
                              setPinError(null);
                            }}
                            placeholder="Ingrese PIN de 4 dígitos"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-center font-mono text-lg font-black text-amber-400 tracking-widest outline-none focus:border-emerald-500"
                          />
                          {pinError && (
                            <span className="text-[11px] text-red-400 font-bold bg-red-950/40 p-2 rounded-xl border border-red-500/30">
                              {pinError}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleConfirmPickup}
                          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md active:scale-95 transition-all"
                        >
                          Validar PIN e Iniciar Viaje al Destino
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* STAGE 3: DRIVER NAVIGATING TO DESTINATION */}
                {activeJob.step === 'navigating_to_destination' && (() => {
                  const isParcel = activeJob.order.serviceType === 'encomienda';
                  const isInterprovincialParcel = isParcel && (
                    activeJob.order.parcelDetails?.scope === 'interprovincial' ||
                    activeJob.order.isInterprovincial ||
                    Boolean(activeJob.order.parcelDetails?.arrivalOffice) ||
                    activeJob.order.distanceKm > 20
                  );
                  const originText = (activeJob.order.parcelDetails?.originProvince || activeJob.order.origin || '').toLowerCase();
                  const isOriginTulcan = originText.includes('carchi') || originText.includes('tulcán') || originText.includes('tulcan');

                  return (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850 text-xs">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-zinc-850">
                          <span className="text-[10px] text-emerald-400 uppercase font-black flex items-center gap-1">
                            🏢 Destino del Conductor: {isInterprovincialParcel ? (isOriginTulcan ? 'Oficina Tulcanaza (Tulcán)' : 'Oficina Aliada de Encomiendas') : 'Destino de Entrega'}
                          </span>
                          {isInterprovincialParcel && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              isOriginTulcan
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {isOriginTulcan ? 'Fijo: Oficina Tulcanaza' : (selectedAlliedOffice?.carrier || 'Cooperativas Aliadas')}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-bold text-sm">
                          {isInterprovincialParcel
                            ? (isOriginTulcan
                                ? 'Oficina San Cristóbal Tulcanaza'
                                : (activeJob.order.officeName || activeJob.order.destination))
                            : activeJob.order.destination}
                        </p>
                        {isInterprovincialParcel && (
                          <>
                            <p className="text-[11px] text-zinc-400 mt-1">
                              {isOriginTulcan
                                ? 'Dirección: Avenida Centenario (Sector Tulcanaza), Tulcán'
                                : `Dirección: ${selectedAlliedOffice?.address || 'Terminal Terrestre / Oficina Aliada'}`}
                            </p>

                            {/* En otras provincias: Botón de búsqueda de oficinas aliadas */}
                            {!isOriginTulcan && (
                              <button
                                type="button"
                                onClick={() => setShowAlliedOfficesSearch(true)}
                                className="mt-2 w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5 text-blue-400" />
                                <span>Buscar / Cambiar Oficina Aliada donde Enviar</span>
                              </button>
                            )}

                            <div className="mt-2.5 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Cobraste al remitente:</span>
                                <span className="font-mono font-bold text-emerald-400">+{formatCurrency(activeJob.finalPrice)} USD</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Pagas en ventanilla de oficina:</span>
                                <span className="font-mono font-bold text-rose-400">-{formatCurrency(activeJob.order.parcelDetails?.driverOfficeFeeUsd || 7)} USD</span>
                              </div>
                              <div className="border-t border-zinc-800 pt-1 flex items-center justify-between font-black text-amber-300">
                                <span>Tu ganancia neta en mano:</span>
                                <span>+{formatCurrency(activeJob.order.parcelDetails?.driverProfitUsd || Math.max(2, activeJob.finalPrice - 7))} USD</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleArriveAtDestination}
                        className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-zinc-950" />
                        <span>
                          {isInterprovincialParcel
                            ? (isOriginTulcan ? '✓ He llegado a la Oficina Tulcanaza' : '✓ He llegado a la Oficina Aliada')
                            : '✓ He llegado al destino de entrega'}
                        </span>
                      </button>
                    </div>
                  );
                })()}

                {/* STAGE 4: CONFIRM DELIVERY */}
                {activeJob.step === 'at_destination' && (() => {
                  const isParcel = activeJob.order.serviceType === 'encomienda';
                  const isInterprovincialParcel = isParcel && (
                    activeJob.order.parcelDetails?.scope === 'interprovincial' ||
                    activeJob.order.isInterprovincial ||
                    Boolean(activeJob.order.parcelDetails?.arrivalOffice) ||
                    activeJob.order.distanceKm > 20
                  );
                  const originText = (activeJob.order.parcelDetails?.originProvince || activeJob.order.origin || '').toLowerCase();
                  const isOriginTulcan = originText.includes('carchi') || originText.includes('tulcán') || originText.includes('tulcan');

                  return (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 flex flex-col gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          {isInterprovincialParcel
                            ? (isOriginTulcan
                                ? 'En Ventanilla: Oficina San Cristóbal Tulcanaza (Avenida Centenario)'
                                : `En Ventanilla: ${activeJob.order.officeName || activeJob.order.destination}`)
                            : `Has llegado al destino final: ${activeJob.order.destination}`}
                        </span>
                      </div>

                      {isInterprovincialParcel ? (
                        <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/30 flex flex-col gap-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 font-black flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-emerald-400" />
                              Protocolo de Despacho en Ventanilla:
                            </span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                              {isOriginTulcan ? 'Oficina Tulcanaza' : (selectedAlliedOffice?.carrier || 'Cooperativa Aliada')}
                            </span>
                          </div>
                          <ol className="text-[11px] text-zinc-300 space-y-1 list-decimal list-inside">
                            <li>Entrega el paquete a la operadora de ventanilla.</li>
                            <li>Indica los datos del destinatario: <strong>{activeJob.order.parcelDetails?.receiverName || activeJob.order.clientName}</strong>.</li>
                            <li>Paga el valor de flete de la oficina: <strong>${(activeJob.order.parcelDetails?.driverOfficeFeeUsd || 7).toFixed(2)} USD</strong>.</li>
                            <li>Recibe la <strong>Guía Física Oficial</strong> con el número de rastreo.</li>
                          </ol>
                        </div>
                      ) : activeJob.order.serviceType === 'encomienda' ? (
                        <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/30 flex flex-col gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              Entrega Local con Cédula:
                            </span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                              Sin PIN
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Exige y verifica la Cédula de Identidad original de <strong>{activeJob.order.clientName}</strong> antes de entregar la encomienda.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-zinc-900 flex items-center justify-between text-xs">
                          <span className="text-zinc-400">PIN de Entrega de Seguridad:</span>
                          <span className="font-mono font-black text-amber-400">{activeJob.order.deliveryPin}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleCompleteAndSettleEarnings}
                        className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                      >
                        {isInterprovincialParcel
                          ? '✓ Confirmar Depósito en Oficina y Finalizar Despacho'
                          : activeJob.order.serviceType === 'encomienda'
                          ? 'Confirmar Cédula Verificada y Finalizar Entrega'
                          : 'Confirmar Entrega y Recibir Ganancias'}
                      </button>
                    </div>
                  );
                })()}

                {/* STAGE 5: SETTLED EARNINGS */}
                {activeJob.step === 'earnings_settled' && (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500 flex flex-col gap-3 text-xs animate-in zoom-in-95">
                    <div className="flex items-center gap-2 text-emerald-400 font-black">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm">¡Servicio Completado & Ganancias Acreditadas!</span>
                    </div>

                    {/* Breakdown with direct client payment & 7% commission deduction */}
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/30 flex flex-col gap-2 font-mono">
                      <div className="flex items-center justify-between text-zinc-200">
                        <span className="font-sans font-medium text-xs">Cobro directo al cliente (Efectivo/Transferencia):</span>
                        <span className="font-bold text-emerald-400 text-sm">+{formatCurrency(activeJob.finalPrice)} USD</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-sans -mt-1">
                        (Dinero que recibiste al 100% en tu mano o cuenta)
                      </span>

                      {(() => {
                        const isInterprovincial = activeJob.order.isInterprovincial || activeJob.order.distanceKm > 20;
                        const isEncomienda = activeJob.order.serviceType === 'encomienda' || activeJob.order.id?.includes('parcel') || String(activeJob.order.serviceType).includes('encomienda');
                        const isInterprovincialEncomienda = isInterprovincial && isEncomienda;
                        const isEjecutivo = (activeJob.order.serviceType as any) === 'ejecutivo_quito' || (activeJob.order.serviceType as any) === 'ejecutivo' || activeJob.order.id?.includes('exec') || activeJob.order.id?.includes('ejec');
                        const isDelivery = activeJob.order.serviceType === 'domicilio';

                        const productSubtotal = isDelivery
                          ? (activeJob.order.deliverySubtotalUsd || activeJob.order.deliveryItems?.reduce((acc, it) => acc + (it.item?.price || 0) * (it.quantity || 1), 0) || 0)
                          : 0;
                        const deliveryFareOnly = isDelivery
                          ? (activeJob.order.deliveryFeeUsd || (activeJob.finalPrice > productSubtotal && productSubtotal > 0 ? activeJob.finalPrice - productSubtotal : activeJob.order.suggestedFair || 1.25))
                          : activeJob.finalPrice;

                        const executiveSeats = activeJob.order.seats || activeJob.order.passengerCount || (activeJob.order.isWholeCar ? 4 : (activeJob.finalPrice >= 90 ? 4 : Math.max(1, Math.round(activeJob.finalPrice / 25))));
                        const executivePaxCount = isEjecutivo ? Math.min(4, Math.max(1, executiveSeats)) : 1;

                        const isPreferentialActive = walletBalance >= 50.00;
                        const baseCommission = isPreferentialActive ? 5 : (systemTariffs?.platformCommissionPercent ?? 7);
                        const commPct = isEjecutivo ? 0 : (isInterprovincialEncomienda ? 9 : baseCommission);

                        const commAmount = isEjecutivo
                          ? Number((3.00 * executivePaxCount).toFixed(2))
                          : isDelivery
                          ? Number((deliveryFareOnly * (commPct / 100)).toFixed(2))
                          : Number((activeJob.finalPrice * (commPct / 100)).toFixed(2));
                        const netAmount = Number((activeJob.finalPrice - commAmount).toFixed(2));

                        return (
                          <>
                            {isDelivery && productSubtotal > 0 && (
                              <div className="border-t border-zinc-850 pt-1.5 flex items-center justify-between text-zinc-300 text-xs">
                                <span className="font-sans">🛒 Compra de productos (Reembolso 100%):</span>
                                <span className="text-amber-300 font-bold">+{formatCurrency(productSubtotal)} USD</span>
                              </div>
                            )}

                            {isDelivery && (
                              <div className="flex items-center justify-between text-zinc-300 text-xs">
                                <span className="font-sans">🛵 Tarifa de carrera de entrega:</span>
                                <span className="text-emerald-400 font-bold">+{formatCurrency(deliveryFareOnly)} USD</span>
                              </div>
                            )}

                            <div className="border-t border-zinc-800 pt-1.5 flex items-center justify-between text-rose-400 font-bold text-xs">
                              <span className="font-sans font-medium">
                                {isEjecutivo
                                  ? `Comisión AndesMovi ($3.00 × ${executivePaxCount} pax):`
                                  : isDelivery
                                  ? `Comisión AndesMovi (${commPct}% SOLO de la carrera):`
                                  : `Comisión AndesMovi debitada (${commPct}%):`}
                              </span>
                              <span>-{formatCurrency(commAmount)} USD</span>
                            </div>

                            <div className="border-t border-zinc-800 pt-1.5 flex items-center justify-between text-zinc-300 font-bold text-xs">
                              <span className="font-sans font-medium">Tu Dinero Neto en mano:</span>
                              <span className="text-white">+{formatCurrency(netAmount)} USD</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                      <p>
                        💳 <strong>Saldo restante en Billetera Prepago:</strong>{' '}
                        <span className="font-mono font-bold text-emerald-400">
                          {formatCurrency(walletBalance)} USD
                        </span>
                      </p>
                      <p className="text-[10px] text-amber-300/90 leading-tight">
                        ℹ️ El cliente te paga directamente a ti en efectivo o transferencia. La aplicación no acumula la carrera, sino que descuenta la comisión justa del 7% de tu saldo prepago.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveJob(null);
                          setActiveTab('ganancias');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs"
                      >
                        Ver en Historial
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveJob(null);
                          setActiveTab('radar');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md"
                      >
                        Volver al Radar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ELEGIR QUÉ SERVICIOS DESEA REALIZAR                                */}
      {/* ========================================================================= */}
      {activeTab === 'servicios' && (
        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Elige los Servicios que Deseas Realizar</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Activa o desactiva categorías en tiempo real. Tu radar mostrará solo las solicitudes de los servicios seleccionados.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* 1. Viajes Pasajeros */}
            <div
              onClick={() => setActiveServices({ ...activeServices, viajes: !activeServices.viajes })}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                activeServices.viajes
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeServices.viajes ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                  {vehicle.type === 'moto' ? <Bike className="w-5 h-5 text-amber-400" /> : <Car className="w-5 h-5 text-emerald-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Viajes de Pasajeros (Carreras Urbanas)</h4>
                    {vehicle.type === 'moto' ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                        🏍️ 1 Sola Persona (Casco Obligatorio)
                      </span>
                    ) : (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                        🚗 Hasta 4 Pasajeros (Sedán)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {vehicle.type === 'moto'
                      ? 'Traslado individual de 1 solo pasajero rápido en moto.'
                      : 'Traslados de personas y familias en auto o vehículo confort.'}
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${activeServices.viajes ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'border-zinc-700'}`}>
                {activeServices.viajes && '✓'}
              </div>
            </div>

            {/* 2. Delivery Repartidor */}
            <div className="flex flex-col gap-2">
              <div
                onClick={() => setActiveServices({ ...activeServices, delivery: !activeServices.delivery })}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  activeServices.delivery
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${activeServices.delivery ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">Delivery / Repartidor de Comida & Compras</h4>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        🛵 / 🚗 Habilitado Motos y Autos
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">Entregas de restaurantes, farmacias y supermercados dentro de la ciudad</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${activeServices.delivery ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'border-zinc-700'}`}>
                  {activeServices.delivery && '✓'}
                </div>
              </div>

              {/* Submódulo de Efectivo Disponible para Compras en Local */}
              {activeServices.delivery && (
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5 ml-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Efectivo Disponible para Compras en Locales</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasCashForPurchases(!hasCashForPurchases)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hasCashForPurchases
                          ? 'bg-emerald-500 text-zinc-950 font-black'
                          : 'bg-zinc-850 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {hasCashForPurchases ? 'Activado' : 'Desactivado'}
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    💡 <strong>¿Cómo funciona el modelo de compra?</strong> Llegas al restaurante, pagas la comida de tu propio bolsillo al retirar. Al entregar al cliente en su puerta, el cliente te paga el <strong>100% completo (comida + carrera) en EFECTIVO O TRANSFERENCIA DIRECTA</strong> (DeUna!, Pichincha, Guayaquil, etc.). Recuperas tu inversión y te quedas con tu ganancia neta. AndesMovi solo debita el 7% de la carrera.
                  </p>

                  {hasCashForPurchases && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                        Monto máximo que puedes adelantar en compras:
                      </span>
                      <div className="flex items-center gap-2">
                        {[10, 20, 30, 50, 100].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => {
                              haptic.tap();
                              setAvailableCashAmount(amount);
                            }}
                            className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                              availableCashAmount === amount
                                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-sm'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Encomiendas */}
            <div
              onClick={() => setActiveServices({ ...activeServices, encomiendas: !activeServices.encomiendas })}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                activeServices.encomiendas
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeServices.encomiendas ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Encomiendas Dentro de la Ciudad e Interprovinciales</h4>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      📦 Paquetería y Oficinas Aliadas
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Envíos urbanos con Cédula y despacho/recepción hacia cooperativas interprovinciales (San Cristóbal, Pullman, etc.).
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${activeServices.encomiendas ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'border-zinc-700'}`}>
                {activeServices.encomiendas && '✓'}
              </div>
            </div>

            {/* 4. Viajes Interprovinciales / Ejecutivo */}
            <div
              onClick={() => {
                if (vehicle.type === 'moto') {
                  alert('El servicio ejecutivo / interprovincial de pasajeros es exclusivo para vehículos tipo Automóvil / Sedán / Confort.');
                  return;
                }
                setActiveServices({ ...activeServices, interprovincial: !activeServices.interprovincial });
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                activeServices.interprovincial && vehicle.type !== 'moto'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : vehicle.type === 'moto'
                  ? 'bg-zinc-950 border-zinc-850 opacity-60'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeServices.interprovincial && vehicle.type !== 'moto' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-600'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Servicio Ejecutivo & Rutas Interprovinciales</h4>
                    {vehicle.type === 'moto' ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                        ⛔ Exclusivo Carros
                      </span>
                    ) : (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                        🏢 Tulcán ⇄ Quito ($25 USD)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {vehicle.type === 'moto'
                      ? 'No disponible para motocicletas. Las rutas interprovinciales de personas requieren automóvil homologado.'
                      : 'Rutas ejecutivas entre Tulcán, Quito, Aeropuerto y provincias con cobro de $3 USD comisión por pasajero.'}
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${
                vehicle.type === 'moto'
                  ? 'border-zinc-800 text-zinc-600'
                  : activeServices.interprovincial
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
                  : 'border-zinc-700'
              }`}>
                {activeServices.interprovincial && vehicle.type !== 'moto' ? '✓' : ''}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Servicios seleccionados:</span>
            <span className="font-bold text-emerald-400">
              {[activeServices.viajes && 'Viajes', activeServices.delivery && 'Delivery', activeServices.encomiendas && 'Encomiendas', activeServices.interprovincial && 'Interprovincial'].filter(Boolean).length} activos
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUBIR DOCUMENTOS REQUERIDOS (LICENCIA VIGENTE, ANTECEDENTES MÁX 2) */}
      {/* ========================================================================= */}
      {activeTab === 'documentos' && (
        <form onSubmit={handleSaveDocuments} className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Subir Documentos Requeridos del Conductor / Repartidor</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Requisitos oficiales: Licencia vigente y certificado de antecedentes penales (máximo 2 sin gravedad).
            </p>
          </div>

          {docSaveNotice && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{docSaveNotice}</span>
            </div>
          )}

          {/* Componente de Estado de Verificación de Documentos */}
          <DriverVerificationStatus
            documents={documents}
            onUpdateStatus={handleUpdateDocStatus}
            showAdminSimulator={false}
          />

          {/* REQUISITO 1: LICENCIA DE CONDUCIR VIGENTE */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileText className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-white uppercase">1. Licencia de Conducir Vigente (ANT Ecuador)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-black ${isLicenseValidDate ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isLicenseValidDate ? '✓ VIGENTE' : 'CADUCADA'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Tipo de Licencia</label>
                <select
                  value={documents.licenseType}
                  onChange={(e) => setDocuments({ ...documents, licenseType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Tipo A">Tipo A (Motos / Delivery y Repartidor)</option>
                  <option value="Tipo B">Tipo B (Automóviles particulares / Pasajeros)</option>
                  <option value="Tipo C">Tipo C (Profesional / Taxis y Furgonetas)</option>
                  <option value="Tipo D">Tipo D (Transporte de Pasajeros Interprovincial)</option>
                  <option value="Tipo E">Tipo E (Camiones y Transporte Pesado)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Fecha de Caducidad de la Licencia</label>
                <input
                  type="date"
                  value={licenseExpInput}
                  onChange={(e) => setLicenseExpInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Photos of License */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center gap-1.5 text-center">
                <img
                  src={documents.licenseFrontPhoto || null}
                  alt="Licencia Anverso"
                  className="w-full h-16 rounded-lg object-cover border border-zinc-700"
                />
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Upload className="w-3 h-3 text-emerald-400" /> Foto Anverso
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center gap-1.5 text-center">
                <img
                  src={documents.licenseBackPhoto || null}
                  alt="Licencia Reverso"
                  className="w-full h-16 rounded-lg object-cover border border-zinc-700"
                />
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Upload className="w-3 h-3 text-emerald-400" /> Foto Reverso
                </span>
              </div>
            </div>
          </div>

          {/* REQUISITO 2: ANTECEDENTES PENALES MÁXIMO 2 SIN GRAVEDAD */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-white uppercase">
                  2. Certificado de Antecedentes Penales (Policía Nacional)
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  isCriminalRecordValid
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isCriminalRecordValid ? '✓ CUMPLE NORMATIVA' : 'RECHAZADO'}
              </span>
            </div>

            {/* Policy Explanation Banner */}
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Normativa AndesMovi:</strong> Se permite un <strong>MÁXIMO DE 2 ANTECEDENTES SIN GRAVEDAD</strong> (ej. contravenciones menores de tránsito o citaciones leves). No se admiten antecedentes con gravedad o más de 2 registros.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">
                  Cantidad de Antecedentes Registrados
                </label>
                <select
                  value={criminalCountInput}
                  onChange={(e) => setCriminalCountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold focus:border-emerald-500 focus:outline-none"
                >
                  <option value={0}>0 Antecedentes (Récord Intachable)</option>
                  <option value={1}>1 Antecedente</option>
                  <option value={2}>2 Antecedentes (Límite Máximo Permitido)</option>
                  <option value={3}>3 o más Antecedentes (No admitido)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">
                  Nivel de Gravedad del Registro
                </label>
                <select
                  value={hasSevereInput ? 'grave' : 'sin_gravedad'}
                  onChange={(e) => setHasSevereInput(e.target.value === 'grave')}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="sin_gravedad">Sin gravedad (Contravención leve / citación menor)</option>
                  <option value="grave">Con gravedad (Delito penal / Grave)</option>
                </select>
              </div>
            </div>

            {/* Validation Outcome Banner */}
            {isCriminalRecordValid ? (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Aprobado: El conductor registra {criminalCountInput} antecedente(s) sin gravedad, cumpliendo el requisito estipulado.
                </span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>
                  No admitido: {hasSevereInput ? 'Los antecedentes con gravedad impiden la activación.' : 'Excede el límite de 2 antecedentes.'}
                </span>
              </div>
            )}
          </div>

          {/* REQUISITO 3: MATRÍCULA Y RTV */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileCheck className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-white block">Revisión Técnica Vehicular (RTV 2026)</span>
                <span className="text-[10px] text-zinc-400">AMT Quito / ATM Guayaquil / EMOV Cuenca</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-400">
              VIGENTE
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md active:scale-95 transition-all"
          >
            Guardar y Validar Documentos Requeridos
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REGISTRAR VEHÍCULO                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'vehiculo' && (
        <form onSubmit={handleSaveVehicle} className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>Registrar y Actualizar Vehículo de Trabajo</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Registra tu auto, motocicleta de delivery o camioneta de carga con placas de Ecuador.
            </p>
          </div>

          {/* Estado de Aprobación por el Administrador */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-white text-xs block">
                  Estado de Homologación: <strong className="text-emerald-400">✓ Aprobado por Administrador</strong>
                </span>
                <span className="text-[10px] text-zinc-300 block mt-0.5">
                  Unidad validada en la central AndesMovi para operar según su categoría oficial.
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider shrink-0 self-start sm:self-auto">
              Placas y RTV Validadas
            </span>
          </div>

          {/* Quick Profile Load Buttons */}
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <span className="text-[11px] font-bold text-zinc-400">Seleccionar Modalidad de Trabajo:</span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                id="btn-load-car-profile"
                onClick={() => handleSwitchVehicleType('auto')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  vehicle.type === 'auto'
                    ? 'bg-sky-500 text-zinc-950 border-sky-400 shadow-md font-black ring-2 ring-sky-400/30'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-sky-300 border-zinc-800'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>🚗 Carro / Taxi (4 Pasajeros)</span>
              </button>
              <button
                type="button"
                id="btn-load-moto-profile"
                onClick={() => handleSwitchVehicleType('moto')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  vehicle.type === 'moto'
                    ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md font-black ring-2 ring-amber-400/30'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-zinc-800'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>🏍️ Moto Express (1 Pax)</span>
              </button>
            </div>
          </div>

          {/* Matriz de Servicios Autorizados por Tipo de Vehículo */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
            <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Matriz de Servicios Habilitados para este Vehículo:</span>
            </span>

            {vehicle.type === 'auto' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-xl bg-sky-950/30 border border-sky-500/30 text-sky-200">
                  <strong className="text-sky-300 block">✓ Carrera Urbana de Pasajeros:</strong>
                  Capacidad para hasta 4 pasajeros y familias en auto Sedán / Confort.
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                  <strong className="text-emerald-300 block">✓ Servicio Ejecutivo Interprovincial:</strong>
                  Rutas Tulcán ⇄ Quito ($25 USD) con débito de $3 USD por pasajero.
                </div>
                <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
                  <strong className="text-purple-300 block">✓ Encomiendas y Carga:</strong>
                  Envíos locales dentro de la ciudad y despacho interprovincial a cooperativas.
                </div>
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                  <strong className="text-amber-300 block">✓ Delivery de Compras:</strong>
                  Compras en restaurantes, farmacias y supermercados.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                  <strong className="text-amber-300 block">✓ Carrera Moto (1 Sola Persona):</strong>
                  Traslado individual de 1 solo pasajero. <strong>El conductor TIENE QUE TENER UN CASCO OBLIGATORIO PARA EL CLIENTE.</strong>
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                  <strong className="text-emerald-300 block">✓ Delivery / Repartidor Express:</strong>
                  Entregas rápidas de comida, farmacias y compras dentro de la ciudad.
                </div>
                <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
                  <strong className="text-purple-300 block">✓ Encomiendas Urbanas (Dentro de la Ciudad):</strong>
                  Paquetería ligera, sobres y documentos rápidos.
                </div>
                <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200">
                  <strong className="text-blue-300 block">✓ Encomiendas Interprovinciales:</strong>
                  Despacho de encomiendas hacia oficinas aliadas (San Cristóbal, Pullman, etc.).
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Specific Safety Note */}
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs">
            {vehicle.type === 'moto' ? (
              <div className="flex items-start gap-2 text-amber-300">
                <Bike className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Modalidad Motocicleta:</strong> Equipamiento obligatorio: Casco homologado para conductor y pasajero, chaleco reflectivo reglamentario y caja/mochila térmica para pedidos o encomiendas.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sky-300">
                <Car className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Modalidad Automóvil / Taxi:</strong> Capacidad para hasta 4 pasajeros, cinturones de seguridad funcionales en todos los asientos y maletero despejado para equipaje.
                </span>
              </div>
            )}
          </div>

          {vehicleSaveNotice && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{vehicleSaveNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Tipo de Vehículo</label>
              <select
                value={vehicle.type}
                onChange={(e) => setVehicle({ ...vehicle, type: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="auto">Automóvil (Sedán / Hatchback Económico)</option>
                <option value="moto">Motocicleta (Delivery / Repartidor Express)</option>
                <option value="camioneta">Camioneta / Furgón (Carga y Encomiendas)</option>
                <option value="confort">Confort / SUV Premium con Climatizador</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Marca y Modelo</label>
              <input
                type="text"
                value={vehicle.model}
                onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                placeholder="Ej: Chevrolet Sail Sedán"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Placa Ecuatoriana Oficial</label>
              <input
                type="text"
                maxLength={8}
                value={vehicle.plate}
                onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value.toUpperCase() })}
                placeholder="PBA-8321"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-black focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Color</label>
              <input
                type="text"
                value={vehicle.color}
                onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                placeholder="Plata Brillante"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Año de Fabricación</label>
              <input
                type="number"
                min={2012}
                max={2026}
                value={vehicle.year}
                onChange={(e) => setVehicle({ ...vehicle, year: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Foto del Vehículo</label>
              <div className="flex items-center gap-2">
                <img
                  src={vehiclePhotoUrl || null}
                  alt="Vehículo"
                  className="w-10 h-10 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                />
                <button
                  type="button"
                  onClick={() => alert('Foto del vehículo cargada y verificada')}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Cambiar Foto
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md active:scale-95 transition-all"
          >
            Guardar Registro del Vehículo
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: GANANCIAS & HISTORIAL (LIQUIDACIÓN 7% COMISIÓN Y 93% NETO)          */}
      {/* ========================================================================= */}
      {activeTab === 'ganancias' && (
        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Billetera Prepago & Ganancias del Conductor</span>
              </h3>
              <p className="text-xs text-zinc-400">
                AndesMovi Transparente: El cliente te paga el 100% directamente. Débito automático: 7% Urbano/Delivery, 9% Encomiendas, y $3.00 USD por pasajero en Ejecutivo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                Saldo Prepago: {formatCurrency(walletBalance)} USD
              </span>
            </div>
          </div>

          {/* Direct Payment Notice */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 text-xs flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="font-bold text-amber-300 block text-xs">
                Comisiones de Plataforma (Débito Automático) — AndesMovi Transparente
              </span>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                💵 <strong>Pago directo al conductor:</strong> El cliente te paga el <strong>100% de la carrera directamente a ti</strong> en efectivo o mediante transferencia directa (DeUna! / Pichincha).
              </p>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                📉 <strong>Débito automático de comisión:</strong> AndesMovi descuenta de tu saldo prepago: <strong>7% para Carreras Urbanas y Delivery/Domicilio</strong>, <strong>9% para Encomiendas Interprovinciales</strong>, y <strong>$3.00 USD por pasajero en servicio ejecutivo</strong> (1 pasajero: $3, 2 pasajeros: $6, 3 pasajeros: $9, 4 pasajeros / Auto completo: $12 USD).
              </p>
              <p className="text-amber-300 text-[11px] font-bold">
                🛡️ <strong>Fondo de seguridad obligatorio:</strong> Mantén un fondo de seguridad mínimo de $10.00 USD en tu billetera prepago.
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Cobrado a Clientes</span>
              <span className="font-mono text-sm font-black text-white">
                {formatCurrency(earningsHistory.reduce((acc, curr) => acc + curr.grossAmountUsd, 0))}
              </span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">En tu bolsillo</span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Comisión Debitada</span>
              <span className="font-mono text-sm font-black text-rose-400">
                -{formatCurrency(earningsHistory.reduce((acc, curr) => acc + curr.commissionAmountUsd, 0))}
              </span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">De tu saldo prepago</span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Servicios</span>
              <span className="font-mono text-sm font-black text-emerald-400">
                {earningsHistory.length}
              </span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">Completados</span>
            </div>
          </div>

          {/* Gráfico de Barras de Ganancias Semanales en USD usando Recharts */}
          <DriverWeeklyEarningsChart
            earningsRecords={earningsHistory}
            driverName={driverProfile.name}
          />

          {/* Promociones y Bonos Activos del Conductor */}
          {(() => {
            const isPreferentialActive = walletBalance >= 50.00;
            const currentAccum = currentUser?.accumulatedRechargeAmount || 0;
            const earnedBonuses = Math.min(3, Math.floor(currentAccum / 50));
            const claimedBonuses = currentUser?.claimedRechargeBonuses || 0;
            const canClaim = earnedBonuses > claimedBonuses && claimedBonuses < 3;
            const isCapped = claimedBonuses >= 3;
            const currentInCycle = currentAccum % 50;
            const needed = 50 - currentInCycle;
            const progressPercent = isCapped ? 100 : canClaim ? 100 : Math.min(100, (currentInCycle / 50) * 100);

            return (
              <div className="space-y-3">
                {/* Bono Especial de Comisión: Tarifa Preferencial 5% */}
                <div className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs transition-all shadow-md ${
                  isPreferentialActive
                    ? 'bg-gradient-to-r from-emerald-950/50 via-zinc-950 to-zinc-900 border-emerald-500/60 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${isPreferentialActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' : 'bg-zinc-800 text-zinc-400'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-xs">Bono Especial de Comisión (Tarifa Preferencial 5%)</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPreferentialActive
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {isPreferentialActive ? '🌟 5% Activo' : '7% Estándar'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {isPreferentialActive
                          ? `¡Cumplido! Tu saldo es de $${walletBalance.toFixed(2)} USD (> $50.00 USD). Pagas únicamente el 5% de comisión en carreras urbanas.`
                          : `Mantén saldo positivo mayor a $50.00 USD para pagar solo el 5% de comisión en carreras (Saldo actual: $${walletBalance.toFixed(2)} USD).`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bono Acumulativo de Recargas ($50 = $10 USD) */}
                <div className={`p-4 rounded-2xl border-2 transition-all shadow-lg ${
                  canClaim
                    ? 'bg-gradient-to-br from-amber-950/60 via-zinc-950 to-emerald-950/60 border-amber-400 shadow-amber-500/20'
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${canClaim ? 'bg-amber-400 text-zinc-950 border-amber-300 animate-bounce' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>Bono Acumulativo de Recargas ($50 = $10 USD)</span>
                          {canClaim && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 font-black animate-pulse">
                              ¡CANJE DISPONIBLE!
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-zinc-400">
                          {isCapped
                            ? '🏆 Has canjeado el límite máximo de 3 bonos ($30 USD en total).'
                            : canClaim
                            ? '¡Completaste $50 USD en recargas! Aplasta el botón CANJEAR para recibir tus $10 USD.'
                            : `Por cada $50 USD acumulados en recargas, aplasta canjear y recibe $10 USD automáticamente.`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 flex-shrink-0">
                      {claimedBonuses}/3 Bonos
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mb-3 border border-zinc-700">
                    <div
                      className={`h-full transition-all duration-500 ${
                        canClaim
                          ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 animate-pulse'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-zinc-300">
                      {canClaim
                        ? '🎉 ¡Meta de $50 completada! Listo para canjear tus $10 USD.'
                        : isCapped
                        ? '3 de 3 bonos canjeados con éxito'
                        : `Acumulado en este ciclo: $${currentInCycle.toFixed(2)} / $50.00 USD (Faltan $${needed.toFixed(2)} USD)`}
                    </span>

                    <button
                      type="button"
                      disabled={isCapped}
                      id="btn-driver-redeem-bonus-10"
                      onClick={() => {
                        if (onRedeemRechargeBonus) {
                          onRedeemRechargeBonus();
                        } else {
                          if (!canClaim) {
                            alert(isCapped
                              ? '🏆 ¡Límite alcanzado! Has canjeado los 3 bonos de $10 USD.'
                              : `Aún no completas los $50.00 USD en recargas.\n\nTe faltan: $${needed.toFixed(2)} USD para canjear tu bono de $10 USD.`);
                            return;
                          }
                          alert('¡Bono canjeado con éxito!');
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                        canClaim
                          ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-zinc-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400 animate-pulse'
                          : isCapped
                          ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                          : 'bg-zinc-900 hover:bg-zinc-850 text-amber-300/80 border border-amber-500/30'
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${canClaim ? 'animate-spin' : 'text-amber-400'}`} />
                      <span>{canClaim ? '🎁 CANJEAR $10 USD AHORA' : isCapped ? 'Completado (3/3)' : `Canjear $10 (Faltan $${needed.toFixed(2)})`}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Transfer Proof Submission Strip for Recharge */}
          <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span className="font-black text-white text-xs">Recargar Saldo de Billetera Prepago</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Activación con Comprobante
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                El conductor debe <strong>presentar el documento de transferencia</strong> a las cuentas personales de <strong>Jhon Sebastian Yepez Clavijo</strong> para que el Administrador active su recarga.
              </p>
              {walletRecharges.filter((r) => r.status === "pendiente").length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Tienes comprobantes en proceso de verificación por el Administrador.</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <button
                type="button"
                id="btn-driver-present-voucher"
                onClick={() => setShowRechargeProofModal(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Presentar Comprobante</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const bonusAmt = (currentUser?.claimedRechargeBonuses || 0) * 10;
                  if (walletBalance - bonusAmt <= 10.00) {
                    alert(`No tienes saldo excedente para retirar.\n\nFondo obligatorio: $10.00 USD\nBono de recarga (no retirable): $${bonusAmt.toFixed(2)} USD\n\nDebes mantener el fondo obligatorio de comisiones y los bonos recibidos en tu saldo para comisiones.`);
                    return;
                  }
                  setShowPayoutModal(true);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs border border-zinc-750 transition-colors"
              >
                Retirar Excedente (Dejar $10)
              </button>
            </div>
          </div>

          {/* Cuentas Bancarias de Administrador para Depósito (Jhon Sebastian Yepez Clavijo) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdminBankAccounts(!showAdminBankAccounts)}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-900 border-2 border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-between hover:border-amber-400 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="font-bold text-white block">Cuentas Bancarias para Depósitos de Recarga</span>
                  <span className="text-[10px] text-amber-300/80 font-normal">
                    Banco Pichincha, Banco Guayaquil, Produbanco, Banco del Austro • Titular: Jhon Sebastian Yepez Clavijo
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/40">
                {showAdminBankAccounts ? 'Ocultar Cuentas' : 'Ver 4 Bancos Oficiales'}
              </span>
            </button>

            {showAdminBankAccounts && (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/30 animate-fadeIn space-y-3">
                <AdminBankAccountsList
                  title="Cuentas Oficiales para Depósitos de Saldo Prepago"
                  subtitle="Transfiere o deposita directamente a estas cuentas autorizadas de AndesMovi y notifica el comprobante:"
                  compact={true}
                  showAllDataCopy={true}
                />
              </div>
            )}
          </div>

          {/* Completed Trips History List */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-zinc-300">Historial de Servicios Completados:</span>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {earningsHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white capitalize">{item.serviceType}</span>
                      <span className="text-[10px] text-zinc-500">{item.dateFormatted}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {item.paymentMethod === 'efectivo' ? 'Cobro Directo en Efectivo' : 'Transferencia Directa'}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-400">
                      +{formatCurrency(item.grossAmountUsd)}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-300 truncate">
                    📍 {item.originName} → 🏁 {item.destinationName}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-850 pt-1.5 font-mono">
                    <span>Cobrado al cliente: <strong className="text-white">{formatCurrency(item.grossAmountUsd)}</strong></span>
                    <span className="text-rose-400 font-semibold">Comisión 7% debitada: -{formatCurrency(item.commissionAmountUsd)}</span>
                    <span className="text-emerald-400 font-bold">Neto en bolsillo: {formatCurrency(item.netEarnedUsd)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: REGISTRO CON FACEBOOK, GOOGLE, ICLOUD / APPLE ID                   */}
      {/* ========================================================================= */}
      {activeTab === 'registro' && (
        <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Registro e Inicio de Conductor / Repartidor</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Inicia sesión o regístrate rápidamente con tus cuentas sociales verificadas.
            </p>
          </div>

          {/* Social Sign-in Buttons */}
          <div className="flex flex-col gap-2.5">
            {/* GOOGLE */}
            <button
              type="button"
              onClick={() => handleSocialDriverLogin('google')}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-between shadow-md transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar como Conductor con GOOGLE</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">1-Toque</span>
            </button>

            {/* FACEBOOK */}
            <button
              type="button"
              onClick={() => handleSocialDriverLogin('facebook')}
              className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-between shadow-md transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Continuar como Conductor con FACEBOOK</span>
              </div>
              <span className="text-[10px] text-blue-100 font-semibold">1-Toque</span>
            </button>

            {/* ICLOUD / APPLE ID */}
            <button
              type="button"
              onClick={() => handleSocialDriverLogin('icloud')}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-950 hover:bg-black text-white font-bold text-xs flex items-center justify-between border border-zinc-700 shadow-md transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.68-.9 2.69 1 .08 2.02-.51 2.59-1.18z" />
                </svg>
                <span>Continuar con ICLOUD / APPLE ID</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold">Seguro</span>
            </button>
          </div>

          {/* Current Driver Data Strip */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 flex flex-col gap-2 text-xs">
            <span className="font-bold text-zinc-300">Datos Actuales Registrados:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
              <div>
                <span className="text-zinc-500 block">Nombre:</span>
                <strong className="text-white">{driverProfile.name}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block">Teléfono:</span>
                <strong className="text-white">{driverProfile.phone}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block">Cédula Ecuatoriana:</span>
                <strong className="text-emerald-400 font-mono">{driverProfile.cedula}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block">Provincia Base:</span>
                <strong className="text-white">{driverProfile.province}</strong>
              </div>
            </div>
          </div>

          {/* Legal Documentation Links for Drivers */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-zinc-400 font-medium">Marco Legal y Privacidad del Conductor:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setLegalDocType('terminos');
                  setShowLegalModal(true);
                }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Términos</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <span className="text-zinc-650">•</span>
              <button
                type="button"
                onClick={() => {
                  setLegalDocType('privacidad');
                  setShowLegalModal(true);
                }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Privacidad LOPDP</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Componente de Estado de Verificación de Documentos en el Registro de Conductor */}
          <DriverVerificationStatus
            documents={documents}
            onUpdateStatus={handleUpdateDocStatus}
            onNavigateToUpload={() => setActiveTab('documentos')}
            showAdminSimulator={false}
          />
        </div>
      )}

      {/* Exit Button back to passenger mode */}
      <button
        type="button"
        onClick={onExitDriverMode}
        className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors border border-zinc-800"
      >
        Volver a Modo Pasajero / Cliente
      </button>

      {/* Modal Presentación de Documento de Transferencia Bancaria a Cuentas Personales */}
      {showRechargeProofModal && (
        <WalletModal
          balance={walletBalance}
          onTopUp={onUpdateWalletBalance}
          onAddRechargeRequest={onAddRechargeRequest}
          walletRecharges={walletRecharges}
          currentUserName={currentUser?.name || driverProfile.name}
          currentUserPhone={currentUser?.phone || driverProfile.phone}
          onClose={() => setShowRechargeProofModal(false)}
        />
      )}

      {/* Modal Solicitud de Liquidación de Saldo Excedente (Dejar $10) */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col">
            <div className="p-5 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 relative">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Solicitar Liquidación de Saldo</h3>
              <p className="text-[11px] text-emerald-100 font-medium">AndesMovi transfiere tu excedente y tú mantienes el fondo de $10 USD</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!payoutAccountNumber || !payoutAccountHolder || !payoutCedula) {
                  alert("Por favor completa todos los campos bancarios.");
                  return;
                }
                const bonusAmt = Math.min(3, Math.floor((currentUser?.accumulatedRechargeAmount || 0) / 50)) * 10;
                const withdrawable = Number((walletBalance - 10.00 - bonusAmt).toFixed(2));
                if (withdrawable <= 0) {
                  alert(`No dispones de saldo excedente retirable.\n\nFondo obligatorio: $10.00 USD\nBono no retirable: $${bonusAmt.toFixed(2)} USD.`);
                  return;
                }

                if (onAddPayoutRequest) {
                  const req: PayoutRequest = {
                    id: `pay-${Date.now()}`,
                    driverId: currentUser?.id || 'drv-current',
                    driverName: currentUser?.name || driverProfile.name,
                    driverPhone: currentUser?.phone || driverProfile.phone,
                    amountUsd: withdrawable,
                    remainingBalanceUsd: 10.00 + bonusAmt,
                    bankName: payoutBank,
                    accountType: payoutAccountType,
                    accountNumber: payoutAccountNumber,
                    accountHolderName: payoutAccountHolder,
                    accountHolderCedula: payoutCedula,
                    status: 'pendiente',
                    requestedAt: Date.now(),
                    requestedAtFormatted: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                  };
                  onAddPayoutRequest(req);
                }

                alert(`¡Solicitud enviada! Se ha solicitado la liquidación de $${withdrawable.toFixed(2)} USD a tu cuenta de ${payoutBank}. El Administrador Jhon Sebastian verificará la transferencia. El saldo en tu billetera digital se ajustará una vez aprobada.`);
                setShowPayoutModal(false);
              }}
              className="p-5 space-y-4 overflow-y-auto max-h-[70vh]"
            >
              <div className="p-3.5 bg-zinc-900 border border-zinc-850 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Saldo Actual en Billetera:</span>
                  <span className="font-mono font-black text-white">${walletBalance.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Fondo de Seguridad Obligatorio:</span>
                  <span className="font-mono font-black text-amber-400">$10.00 USD</span>
                </div>
                {Math.min(3, Math.floor((currentUser?.accumulatedRechargeAmount || 0) / 50)) * 10 > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-bold text-amber-500">Bono de Recarga (No Retirable):</span>
                    <span className="font-mono font-black text-amber-500">
                      -${(Math.min(3, Math.floor((currentUser?.accumulatedRechargeAmount || 0) / 50)) * 10).toFixed(2)} USD
                    </span>
                  </div>
                )}
                <div className="h-px bg-zinc-800 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400">Monto Neto a Transferirte:</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    ${Math.max(0, walletBalance - 10.00 - (Math.min(3, Math.floor((currentUser?.accumulatedRechargeAmount || 0) / 50)) * 10)).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Banco de Destino</label>
                  <select
                    value={payoutBank}
                    onChange={(e) => setPayoutBank(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium"
                  >
                    <option value="Banco Pichincha">Banco Pichincha</option>
                    <option value="Banco Guayaquil">Banco Guayaquil</option>
                    <option value="Produbanco">Produbanco</option>
                    <option value="Banco del Austro">Banco del Austro</option>
                    <option value="Monedero DeUna!">Monedero DeUna! (Celular)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Tipo de Cuenta</label>
                    <select
                      value={payoutAccountType}
                      onChange={(e) => setPayoutAccountType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium"
                    >
                      <option value="ahorros">Ahorros</option>
                      <option value="corriente">Corriente</option>
                      <option value="DeUna!">DeUna! (Móvil)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 220194857"
                      value={payoutAccountNumber}
                      onChange={(e) => setPayoutAccountNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Nombre Completo del Titular</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos Pérez"
                    value={payoutAccountHolder}
                    onChange={(e) => setPayoutAccountHolder(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Cédula o RUC del Titular</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1724589012"
                    value={payoutCedula}
                    onChange={(e) => setPayoutCedula(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs border border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/10"
                >
                  Solicitar Liquidación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Legal para Conductores */}
      {showLegalModal && (
        <LegalTermsModal
          isOpen={showLegalModal}
          initialDoc={legalDocType}
          onClose={() => setShowLegalModal(false)}
        />
      )}

      {/* Modal SOS de Emergencia para Conductores (Mismos términos, ECU 911 y Grabación) */}
      {showDriverSosModal && (
        <SOSModal
          currentLocation={getCoordinatesForEcuadorProvince(driverProfile.province)}
          currentUser={currentUser}
          userRole="driver"
          driverName={driverProfile.name}
          driverPlate={vehicle.plate}
          clientName={activeJob ? activeJob.order.clientName : 'Servicio en ruta'}
          activeTrip={
            activeJob
              ? ({
                  id: activeJob.order.id,
                  origin: { name: activeJob.order.origin, lat: 0.8125, lng: -77.7165 },
                  destination: { name: activeJob.order.destination, lat: 0.8175, lng: -77.7125 },
                  selectedDriver: {
                    name: driverProfile.name,
                    vehicle: { plate: vehicle.plate, model: vehicle.model },
                  },
                } as any)
              : null
          }
          onOpenTerms={() => {
            setShowDriverSosModal(false);
            setLegalDocType('terminos');
            setShowLegalModal(true);
          }}
          onOpenPrivacy={() => {
            setShowDriverSosModal(false);
            setLegalDocType('privacidad');
            setShowLegalModal(true);
          }}
          onClose={() => setShowDriverSosModal(false)}
        />
      )}

      {/* Chat Interno Privado con el Cliente durante la Carrera Activa */}
      {showDriverChatModal && activeJob && (
        <ChatModal
          driver={{
            id: 'drv-current-profile',
            name: driverProfile.name,
            avatar: driverProfile.avatar || vehiclePhotoUrl,
            rating: 4.9,
            vehicle: {
              type: vehicle.type,
              model: vehicle.model,
              plate: vehicle.plate,
              color: vehicle.color,
              year: vehicle.year,
            },
            phone: driverProfile.phone,
            tripsCount: 142,
            isAvailable: true,
            isApproved: true,
            cedula: driverProfile.cedula,
            province: driverProfile.province,
            currentCoords: { lat: 0.8125, lng: -77.7165 },
            etaMinutes: 2,
          }}
          messages={driverChatMessages}
          onSendMessage={handleSendDriverChatMessage}
          onClose={() => setShowDriverChatModal(false)}
          onStartCall={() => {
            setShowDriverChatModal(false);
            setShowDriverCallModal(true);
          }}
          senderRole="conductor"
          clientName={activeJob.order.clientName}
          clientAvatar={activeJob.order.clientAvatar}
        />
      )}

      {/* Llamadas VoIP / WebRTC por Internet de Conductor a Cliente */}
      {showDriverCallModal && activeJob && (
        <CallModal
          participant={{
            name: activeJob.order.clientName,
            avatar: activeJob.order.clientAvatar,
            role: 'cliente',
            phoneMasked: activeJob.order.clientPhone,
          }}
          onClose={() => setShowDriverCallModal(false)}
        />
      )}

      {/* Modal Obligatorio de Registro Social (Cédula + Consulta SRI + Teléfono) para Conductor */}
      {socialPendingData && (
        <SocialRegistrationModal
          isOpen={Boolean(socialPendingData)}
          socialData={socialPendingData}
          onConfirmRegistration={(user) => {
            setSocialPendingData(null);
            setDriverProfile((prev) => ({
              ...prev,
              name: user.name,
              email: user.email || prev.email,
              phone: user.phone,
              cedula: user.cedula,
              province: user.province || prev.province,
              authProvider: user.authProvider,
              avatar: user.avatar,
            }));
            if (currentUser && onUpdateUser) {
              onUpdateUser(user);
            }
            if (onRegisterNewDriver) {
              onRegisterNewDriver({
                name: user.name,
                cedula: user.cedula || '1724589012',
                phone: user.phone,
                province: user.province || 'Pichincha',
                vehicleType: vehicle.type,
                vehicleModel: vehicle.model,
                plate: vehicle.plate,
                authProvider: user.authProvider,
              });
            }
          }}
          onCancel={() => setSocialPendingData(null)}
        />
      )}

      {/* Modal Guía Oficial de Remisión / Comprobante Conductor */}
      {showParcelReceiptModal && activeJob && (
        <ParcelReceiptModal
          trip={{
            id: activeJob?.order?.id || `JOB-${Date.now()}`,
            serviceType: 'encomienda',
            offeredPrice: activeJob.finalPrice,
            origin: { lat: 0, lng: 0, name: activeJob.order.origin, address: activeJob.order.origin },
            destination: { lat: 0, lng: 0, name: activeJob.order.destination, address: activeJob.order.destination },
            createdAt: activeJob.order.createdAt || Date.now(),
            parcelDetails: activeJob.order.parcelDetails,
          } as any}
          parcelDetails={activeJob.order.parcelDetails}
          price={activeJob.finalPrice}
          guideNumber={`GUIA-EC-${(activeJob?.order?.id || `JOB-${Date.now()}`).slice(-6).toUpperCase()}`}
          onClose={() => setShowParcelReceiptModal(false)}
          isDark={isDark}
        />
      )}

      {/* Driver Cancel Trip Modal */}
      <CancelTripModal
        isOpen={showDriverCancelModal}
        onClose={() => setShowDriverCancelModal(false)}
        onConfirmCancel={(reason) => {
          setShowDriverCancelModal(false);
          setActiveJob(null);
          setActiveTab('radar');
          onCancelActiveTrip?.(reason);
        }}
        isDriver={true}
      />

      {/* Modal de Búsqueda y Selección de Oficinas Aliadas para el Conductor (Otras Provincias) */}
      {showAlliedOfficesSearch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Oficinas Aliadas de Despacho</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Otras Provincias
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Elige la agencia o ventanilla más conveniente donde depositarás la encomienda:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAlliedOfficesSearch(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar & Cooperatives Filter */}
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-900 flex flex-col gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={alliedOfficeSearchQuery}
                  onChange={(e) => setAlliedOfficeSearchQuery(e.target.value)}
                  placeholder="Buscar por cooperativa, terminal, ciudad, calle..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                />
                {alliedOfficeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAlliedOfficeSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtro de Cooperativas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <button
                  type="button"
                  onClick={() => setAlliedOfficeCarrierFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                    alliedOfficeCarrierFilter === 'all'
                      ? 'bg-blue-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Todas ({ALL_PARCEL_OFFICES.length})
                </button>
                {Array.from(new Set(ALL_PARCEL_OFFICES.map((o) => o.carrier).filter(Boolean))).map((carrier) => (
                  <button
                    key={carrier}
                    type="button"
                    onClick={() => setAlliedOfficeCarrierFilter(carrier!)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                      alliedOfficeCarrierFilter === carrier
                        ? 'bg-blue-500 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {carrier}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Offices */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {(() => {
                const query = alliedOfficeSearchQuery.toLowerCase().trim();
                const filtered = ALL_PARCEL_OFFICES.filter((office) => {
                  if (alliedOfficeCarrierFilter !== 'all' && office.carrier !== alliedOfficeCarrierFilter) {
                    return false;
                  }
                  if (!query) return true;
                  return (
                    office.name.toLowerCase().includes(query) ||
                    office.city.toLowerCase().includes(query) ||
                    office.province.toLowerCase().includes(query) ||
                    office.terminal.toLowerCase().includes(query) ||
                    office.address.toLowerCase().includes(query) ||
                    (office.carrier && office.carrier.toLowerCase().includes(query))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-zinc-400 text-xs">
                      No se encontraron agencias que coincidan con la búsqueda.
                    </div>
                  );
                }

                return filtered.map((office) => {
                  const isSelected = selectedAlliedOffice?.id === office.id || activeJob?.order.destination.includes(office.name);
                  return (
                    <div
                      key={office.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {office.carrier || 'Cooperativa'}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{office.name}</span>
                          <span className="text-[10px] text-zinc-400">({office.city}, {office.province})</span>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          📍 {office.terminal} • {office.address}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                          <span>🕒 {office.schedule || 'Lunes a Domingo'}</span>
                          {office.phone && <span>📞 {office.phone}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectAlliedOfficeForDriver(office)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'bg-blue-500 hover:bg-blue-400 text-zinc-950'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Seleccionada' : 'Despachar Aquí'}</span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BLOQUEO DE MODO DEMO CONDUCTOR (SIN REGISTRO / SIN DOCUMENTOS) */}
      {showDemoBlockModal && (
        <div className="fixed inset-0 z-[10005] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 text-left animate-scaleUp ${
              isDark ? 'bg-zinc-950 border-amber-500/60 text-white' : 'bg-white border-amber-400 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">MODO DEMO (Solo Visualización)</h3>
                <p className="text-xs text-amber-400 font-bold">Sin cuenta de conductor no puedes operar</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Estás explorando el <strong>Panel de Conductor en Modo Demostración</strong>. Puedes ver el radar y la simulación de rutas, pero para <strong>conectarte en vivo y recibir carreras reales</strong> debes registrarte con tus documentos y licencia oficial de conducir.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              ℹ️ <strong>Requisitos de Conductor</strong>: Cédula, Licencia ANT vigente, revisión vehicular y antecedentes.
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
                    onOpenRegister('conductor');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer active:scale-95 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Registrarme como Chofer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

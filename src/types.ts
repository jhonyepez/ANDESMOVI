export type ServiceType = 'viaje' | 'ejecutivo_quito' | 'domicilio' | 'encomienda';

export type UserRole = 'cliente' | 'conductor' | 'admin';

export interface Coordinates {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export type VehicleType = 'auto' | 'moto' | 'confort' | 'camioneta' | 'mini';

export interface Vehicle {
  id?: string;
  type: VehicleType;
  make?: string;
  model: string;
  plate: string;
  color: string;
  year: number;
  capacity?: number;
  isActive?: boolean;
  // Clasificación para Viajes Ejecutivos (Tulcán - Ibarra - Quito - Aeropuerto)
  isEjecutivoApproved?: boolean;
  ejecutivoCategory?: 'sedan_confort' | 'vip_suv' | 'van_interprovincial' | 'no_clasificado';
  ejecutivoNotes?: string;
  hasAirConditioning?: boolean;
  hasTrunkCapacity?: boolean;
  hasComfortSeats?: boolean;
  hasUsbCharger?: boolean;
  hasRtvApproved?: boolean;
  classificationDate?: string;
  classifiedBy?: string;
}

export type UnitOperationalStatus =
  | 'disponible' // 🟢 Libre y en patrullaje
  | 'en_viaje' // 🔵 Con pasajero a bordo
  | 'en_encomienda' // 🟠 Entregando paquete
  | 'desconectado'; // ⚪ Fuera de servicio / descanso

export interface DriverTelemetry {
  unitNumber?: string; // Ej: "Unidad #042 - Cayambe"
  operationalStatus: UnitOperationalStatus;
  speedKmh?: number; // Ej: 38 km/h
  speedKmH?: number;
  headingDegrees: number; // 0 a 360
  headingDirection?: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  batteryLevelPercent?: number; // Ej: 86%
  batteryLevel?: number;
  altitudeMeters?: number;
  accuracyMeters?: number;
  lastGpsTick?: number;
  totalKmToday?: number;
  currentFuelLevelPercent?: number;
  gpsSignal?: 'excelente' | 'buena' | 'regular';
  assignedCanton?: string; // Ej: "Cayambe", "Quito", "Rumiñahui", "Otavalo"
  assignedCooperative?: string;
  currentAddressRef?: string; // Ej: "Av. Natalia Jarrín y Sucre, Parque Central"
  lastPingFormatted?: string; // Ej: "Hace 4 seg"
  todayTripsCount?: number;
  todayEarningsUsd?: number;
  recentBreadcrumbs?: Coordinates[];
  activeJobSummary?: string;
  emergencyAlertActive?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  avatar?: string;
  photoUrl?: string;
  rating: number;
  totalTrips?: number;
  tripsCount?: number;
  vehicle: Vehicle;
  currentCoords: Coordinates;
  etaMinutes: number;
  distanceKm?: number;
  offeredPrice?: number;
  phone: string;
  cooperativaName?: string;
  isAvailable?: boolean;
  telemetry?: DriverTelemetry;
  cedula?: string;
  isPendingApproval?: boolean;
  isApproved?: boolean;
  registeredAt?: number;
  province?: string;
  isSuspended?: boolean;
  isEjecutivoApproved?: boolean;
  ejecutivoClassificationDate?: string;
}

export type TripStatus = 
  | 'idle'
  | 'searching_drivers'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TripRating {
  stars: number;
  tags: string[];
  tipUsd?: number;
  feedback?: string;
  createdAt: number;
}

export interface TripRequest {
  id: string;
  serviceType: ServiceType;
  origin: Coordinates;
  destination: Coordinates;
  offeredPrice: number;
  suggestedPrice: number;
  distanceKm: number;
  estimatedMinutes: number;
  vehicleType: 'auto' | 'moto' | 'confort' | 'mini';
  notes?: string;
  status: TripStatus;
  selectedDriver?: Driver;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'pending' | 'processing' | 'paid';
  createdAt: number;
  
  // Toll Booths (Peajes en vía)
  hasTolls?: boolean;
  tollFeeUsd?: number;
  tollName?: string;

  // Intermediate Stops (Puntos de parada adicionales en el viaje)
  intermediateStops?: Coordinates[];

  // Interprovincial Trip (Viajes a Quito / Provincias en vehículo particular)
  isInterprovincial?: boolean;
  passengerCount?: number; // Ej: 4 personas
  pricePerPassengerUsd?: number; // Ej: $25.00 por pasajero
  commissionPerPassengerUsd?: number; // Ej: $3.00 por pasajero para AndesMovi
  departureDate?: string;
  departureTime?: string;
  luggageType?: string;
  executiveDirection?: 'tulcan_quito' | 'quito_tulcan' | string;

  // Security verification PINs (Código de inicio y finalización)
  startPin?: string;
  endPin?: string;
  isStartPinVerified?: boolean;
  isEndPinVerified?: boolean;

  // Mutual ratings (Calificación de ambas partes)
  passengerRating?: TripRating;
  driverRating?: TripRating;

  // Encomiendas specific
  parcelDetails?: ParcelDetails;
  quotationStatus?: 'esperando_cotizacion' | 'cotizado_confirmado';
  driverQuotedPriceUsd?: number;
  paymentTiming?: 'pago_origen' | 'por_cobrar_destino';
  modalidadPago?: 'pagado_en_origen' | 'pagado' | 'por_cobrar';
  
  // Domicilios specific
  deliveryItems?: CartItem[];
  restaurantName?: string;
}

export type TransportCarrier =
  | 'San Cristóbal'
  | 'Expreso Tulcán'
  | 'Flota Imbabura'
  | 'Panamericana'
  | 'Pullman Carchi'
  | 'Putumayo'
  | 'Vencedores'
  | 'Tax Gacela'
  | 'Transportes Baños'
  | 'Cita Express';

export interface SanCristobalOffice {
  id: string;
  name: string;
  carrier?: TransportCarrier;
  city: string;
  province: string;
  region: 'Costa' | 'Sierra' | 'Oriente';
  terminal: string;
  address: string;
  phone: string;
  schedule: string;
  coords: Coordinates;
}

export interface ParcelDetails {
  scope: 'urbano' | 'interprovincial';
  carrier?: TransportCarrier;
  originProvince?: string;
  destinationProvince?: string;
  arrivalOffice?: SanCristobalOffice;
  originOffice?: SanCristobalOffice;
  pickupReference?: string;
  dropoffReference?: string;
  size: 'documento' | 'pequeno' | 'mediano' | 'grande' | 'carga';
  weightKg: number;
  description: string;
  isFragile: boolean;

  // Valor Declarado & Factura Comercial (Regla S/F y NDV)
  hasDeclaredValue?: boolean;
  declaredValueUsd?: number;
  hasInvoiceAttached?: boolean;
  invoiceNumber?: string;
  driverCommercialInspection?: 'factura_verificada' | 'sin_factura_ndv';
  commercialDisclaimerNote?: string;

  // Datos de quien envía (Remitente)
  senderName: string;
  senderCedula: string;
  senderPhone?: string;

  // Datos de quien recibe (Destinatario)
  receiverName: string;
  receiverCedula?: string;
  receiverPhone: string;
  deliveryPin?: string;
  photoUrls: string[];
  signatureProof?: string;
  photoProof?: string;
  isDeliveredWithProof?: boolean;
  // Datos del paquete y modalidad de pago (Regla pago exclusivo en origen)
  packageCount?: number; // Número de bultos
  paymentTiming?: 'pago_origen' | 'por_cobrar_destino'; // Pago en origen
  modalidadPago?: 'pagado_en_origen' | 'pagado' | 'por_cobrar'; // Valor fijado
  deliveryCityOrStop?: string; // Ciudad / Parada de entrega
  driverQuotedPriceUsd?: number; // Valor del flete fijado por el conductor
  quotationStatus?: 'esperando_cotizacion' | 'cotizado_confirmado';

  // Desglose Oficina Tulcanaza & Liquidación Conductor
  officeName?: string;
  driverOfficeFeeUsd?: number;
  driverProfitUsd?: number;
  tulcanazaTariffCategory?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  restaurantId: string;
  restaurantName: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  specialNotes?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: 'Comida Rápida' | 'Farmacia' | 'Supermercado' | 'Cafetería' | 'Mascotas';
  rating: number;
  deliveryTimeMinutes: number;
  deliveryFee: number;
  imageUrl: string;
  address: string;
  coords: Coordinates;
}

export type PaymentMethodType =
  | 'deuna'
  | 'peigo'
  | 'tarjeta'
  | 'transferencia'
  | 'efectivo'
  | 'billetera'
  | 'nequi'
  | 'daviplata'
  | 'pse'
  | 'banco_pichincha'
  | 'banco_guayaquil'
  | 'produbanco';

export interface PaymentDetails {
  method: PaymentMethodType;
  amount: number;
  tip: number;
  total: number;
  referenceId: string;
  phoneNumber?: string;
  cardNumber?: string;
  cardName?: string;
  cashAmount?: number;
  changeNeeded?: number;
}

export interface ScheduledBooking {
  id: string;
  serviceType: ServiceType;
  origin: Coordinates;
  destination: Coordinates;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  offeredPrice: number;
  vehicleType?: 'auto' | 'moto' | 'confort' | 'mini';
  notes?: string;
  status: 'confirmada' | 'conductor_notificado' | 'en_progreso' | 'cancelada';
  assignedDriver?: Driver;
  notifiedDriversCount?: number;
  reminderMinutes?: number;
  createdAt: number;
  parcelDetails?: ParcelDetails;
  deliveryItems?: CartItem[];
  restaurantName?: string;
}

export interface AppBrand {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  cityFocus: string;
}

export interface ChatMessage {
  id: string;
  sender: 'cliente' | 'conductor' | 'sistema';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  isLocation?: boolean;
  locationCoords?: Coordinates;
  coords?: Coordinates;
}

export type AuthProviderType = 'google' | 'facebook' | 'icloud' | 'cedula' | 'telefono' | 'email';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string; // Ej: 'Familiar', 'Mamá', 'Papá', 'Cónyuge / Pareja', 'Hermano/a', 'Amigo/a'
  phone: string;
  isPrimary?: boolean;
  notifyBySms?: boolean;
  notifyByWhatsapp?: boolean;
}

export interface DocumentAiPreValidation {
  isLegible: boolean;
  documentCategory: 'cedula' | 'licencia' | 'otro' | 'desconocido';
  confidenceScore: number;
  detectedIdNumber?: string;
  detectedFullName?: string;
  feedback: string;
  issues: string[];
  analyzedAt: number;
  isAiValidated?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone: string;
  cedula?: string;
  cedulaVerified?: boolean;
  cedulaFrontPhoto?: string;
  cedulaBackPhoto?: string;
  cedulaAiValidation?: DocumentAiPreValidation;
  province?: string;
  canton?: string;
  avatar: string;
  authProvider: AuthProviderType;
  rating: number;
  totalTripsCompleted: number;
  isVerified: boolean;
  createdAt: number;
  emergencyContacts?: EmergencyContact[];
  role?: UserRole;
  nationalityType?: 'ecuatoriano' | 'extranjero';
  isForeignDriver?: boolean;
  isRegistrationComplete?: boolean;
  driverDocuments?: DriverDocuments;
  vehicle?: Vehicle;
  loyaltyPoints?: number;
  accumulatedRechargeAmount?: number;
  claimedRechargeBonuses?: number;
  hasActiveFreeRideCoupon?: boolean;
  activeSessionToken?: string;
  activeDeviceId?: string;
  lastDeviceName?: string;
  deviceBindingTimestamp?: number;
}

export interface ExecutiveSeatAdvanceVoucher {
  id: string;
  voucherCode: string;
  passengerName: string;
  passengerPhone: string;
  passengerCedula?: string;
  route: string;
  departureDate: string;
  departureTime: string;
  seatsCount: number;
  seatNumbers: string[];
  advanceAmountUsd: number;
  totalFareUsd: number;
  remainingAmountUsd: number;
  destinationBank: string;
  transferVoucherNumber: string;
  voucherPhotoUrl?: string;
  status: 'pendiente_verificacion' | 'aprobado' | 'rechazado';
  adminNotes?: string;
  submittedAt: number;
  submittedAtFormatted: string;
}

export interface ExecutiveTripFrequency {
  id: string;
  code: string;
  originCity: string;
  originProvince?: string;
  originTerminal: string;
  originCoords: Coordinates;
  destinationCity: string;
  destinationProvince?: string;
  destinationTerminal: string;
  destinationCoords: Coordinates;
  departureTime: string; // e.g. "06:00 AM" (Turno principal)
  departureTimes?: string[]; // e.g. ["03:00 AM", "06:00 AM", "10:00 AM", "01:00 PM", "05:00 PM"] (Turnos programados)
  pricePerSeatUsd: number; // e.g. 25.00 (Admin defined)
  depositRequiredUsd: number; // e.g. 10.00
  availableSeats: number; // e.g. 4
  daysOfWeek: string[]; // e.g. ["Todos los días"] or ["Lunes", "Martes", ...]
  vehicleType: 'auto' | 'confort' | 'camioneta' | 'van';
  notes?: string;
  isActive: boolean;
  createdAt: number;
}

export interface TripHistoryItem {
  id: string;
  serviceType: ServiceType;
  date: string; // e.g., '18 Sep 2026, 14:20'
  timestamp: number;
  origin: Coordinates;
  destination: Coordinates;
  driver: Driver;
  priceUsd: number;
  paymentMethod: PaymentMethodType;
  status: 'completado' | 'cancelado';
  starsGiven?: number;
  tagsGiven?: string[];
  notes?: string;
  receiptNumber: string;
  tipUsd?: number;
  parcelDetails?: ParcelDetails;
  deliveryItems?: CartItem[];
  restaurantName?: string;
}

export type VerificationDocumentStatus = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';

export interface DriverDocuments {
  licenseNumber: string;
  licenseType: 'Tipo A' | 'Tipo B' | 'Tipo C' | 'Tipo C1' | 'Tipo D' | 'Tipo E';
  licenseExpiration: string; // YYYY-MM-DD
  isLicenseValid: boolean;
  licenseStatus?: VerificationDocumentStatus;
  licenseReviewedAt?: string;
  licenseReviewerNotes?: string;
  licenseFrontPhoto?: string;
  licenseBackPhoto?: string;
  criminalRecordPhoto?: string;
  licenseAiValidation?: DocumentAiPreValidation;
  criminalRecordCount: number; // 0, 1, 2, or >2
  hasSevereRecord: boolean; // false = sin gravedad, true = con gravedad
  criminalRecordCertificateNumber: string;
  isCriminalRecordApproved: boolean; // <= 2 AND !hasSevereRecord
  criminalRecordStatus?: VerificationDocumentStatus;
  criminalRecordReviewedAt?: string;
  criminalRecordReviewerNotes?: string;
  rtvInspectionYear: number;
  rtvStatus: 'vigente' | 'vencida' | 'en_tramite';
  rtvDocStatus?: VerificationDocumentStatus;
  vehicleRegistrationPlate: string;
  vehicleType?: VehicleType;
  vehicleModel?: string;
  isFullyVerified: boolean;
  overallStatus?: VerificationDocumentStatus;
  adminVerificationNotes?: string;
  lastAdminReviewDate?: string;
}

export interface DriverActiveServices {
  viajes: boolean; // Pasajeros
  delivery: boolean; // Comida / Super / Farmacia
  encomiendas: boolean; // Paquetería / Carga ligera
  interprovincial: boolean; // Rutas interprovinciales
}

export interface DriverEarningsRecord {
  id: string;
  tripId: string;
  serviceType: ServiceType;
  clientName: string;
  clientAvatar?: string;
  clientPhone: string;
  originName: string;
  destinationName: string;
  distanceKm: number;
  grossAmountUsd: number;
  commissionPercent: number; // 7%
  commissionAmountUsd: number; // gross * 0.07
  netEarnedUsd: number; // gross * 0.93
  paymentMethod: PaymentMethodType;
  timestamp: number;
  dateFormatted: string;
  status: 'completado';
  ratingReceived: number;
}

// ==================== PANEL ADMINISTRATIVO ====================

export interface CantonTariff {
  id: string;
  cantonName: string; // Ej: "Cayambe", "Quito (DMQ)", "Rumiñahui", "Pedro Moncayo", "Otavalo"
  province: string; // Ej: "Pichincha", "Imbabura", "Tungurahua", "Guayas", "Azuay"
  zoneCode: string; // Ej: "CAN-CAY-01"
  baseFareUsd: number; // Tarifa base de arranque (ej: 1.25)
  perKmUsd: number; // Costo por kilómetro recorrido (ej: 0.35)
  perMinuteUsd: number; // Costo por minuto (ej: 0.08)
  minimumFareUsd: number; // Carrera mínima garantizada (ej: 1.50)
  nightSurgePercent: number; // Recargo nocturno % (ej: 15%)
  intercantonalExtraUsd: number; // Recargo de cruce o salida intercantonal (ej: 1.50)
  parcelBaseFareUsd: number; // Tarifa base encomienda cantonal (ej: 2.00)
  isActive: boolean;
  notes?: string;
  updatedAt?: number;
}

export interface SystemTariffs {
  // Comisión de AndesMovi (%)
  platformCommissionPercent: number; // e.g. 7
  dynamicMultiplier: number; // 1.0 = normal, 1.2 = alta demanda, 1.5 = lluvia/fiestas

  // Tarifas Oficiales Unificadas Ecuador: $1.25 USD cubre hasta 2.7 km
  rideBaseFareUsd: number; // 1.25 USD
  rideBaseCoverageKm: number; // 2.7 km cubiertos por la tarifa base
  rideExtraPerKmUsd: number; // 0.35 USD/km extra sobre 2.7 km
  ridePerKmUsd: number; // e.g. 0.35
  ridePerMinuteUsd: number; // e.g. 0.08
  rideMinimumFareUsd: number; // e.g. 1.25
  confortExtraFeeUsd: number; // e.g. 0.50

  // Tarifas de Delivery / Domicilios ($1.25 base hasta 2.7 km)
  deliveryBaseFareUsd: number; // e.g. 1.25
  deliveryPerKmUsd: number; // e.g. 0.35
  deliveryRainFeeUsd: number; // e.g. 0.50

  // Tarifas de Encomiendas Urbanas & Interprovinciales
  parcelBaseFareUsd: number; // e.g. 1.50
  parcelMinimumFareUsd?: number; // e.g. 6.00 USD tarifa mínima obligatoria flete/envío
  parcelPerKmUsd: number; // e.g. 0.40
  parcelExtraKgFeeUsd: number; // e.g. 0.50 por kg extra sobre 3kg
  parcelInsurancePercent: number; // e.g. 1.5% del valor declarado

  // Recargos Horarios
  nightSurgePercent: number; // e.g. 15% entre 21:00 y 05:00

  // Servicio Ejecutivo Tulcán ⇄ Quito & Aeropuerto (Tarifa Fija Oficial)
  executiveQuitoFixedFareUsd?: number; // e.g. 25.00 USD por asiento
  executiveQuitoWholeCarFareUsd?: number; // e.g. 100.00 USD auto completo (4 cupos)

  // Nota: Tarifas por cantón eliminadas según directriz oficial (Tarifa unificada nacional)
  cantonTariffs?: CantonTariff[];
  rechargeBonusRules?: {
    thresholdUsd: number;
    bonusUsd: number;
  };
}

export type RechargeStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface WalletRechargeRequest {
  id: string;
  driverOrUserId: string;
  driverOrUserName: string;
  driverOrUserPhone: string;
  role: 'conductor' | 'cliente';
  amountUsd: number;
  paymentMethod: 'deuna' | 'pichincha' | 'guayaquil' | 'produbanco' | 'banco_pichincha' | 'banco_guayaquil' | 'banco_austro' | 'efectivo_agente' | 'transferencia';
  referenceNumber: string; // Número de comprobante bancario / transferencia
  transferVoucherNumber?: string; // Número de comprobante de transferencia
  bankName?: string; // Banco Pichincha, Guayaquil, Produbanco, Austro, Deuna
  proofImageUrl?: string; // Foto o captura del documento de transferencia
  proofDocumentName?: string; // Nombre del archivo del comprobante
  destinationAccountHolder?: string; // Titular de la cuenta personal receptora (e.g. Jhon Sebastian Yepez Clavijo)
  destinationAccountNumber?: string; // N° de cuenta personal receptora
  destinationBank?: string; // Banco de la cuenta personal receptora
  status: RechargeStatus;
  requestedAt: number;
  requestedAtFormatted: string;
  reviewedAt?: number;
  reviewedBy?: string;
  adminNotes?: string;
}

export type PayoutStatus = 'pendiente' | 'pagada' | 'rechazada';

export interface PayoutRequest {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  amountUsd: number; // Saldo excedente a transferir (Total - $10)
  remainingBalanceUsd: number; // Dejando $10.00 USD en la cuenta
  bankName: string;
  accountType: 'ahorros' | 'corriente' | 'DeUna!';
  accountNumber: string;
  accountHolderName: string;
  accountHolderCedula: string;
  status: PayoutStatus;
  requestedAt: number;
  requestedAtFormatted: string;
  reviewedAt?: number;
  reviewedBy?: string;
  adminNotes?: string;
}

export type EncomiendaStatus =
  | 'recepcionada'
  | 'en_bodega'
  | 'en_transito_interprovincial'
  | 'en_reparto_local'
  | 'entregada'
  | 'con_incidencia';

export interface AdminEncomienda {
  id: string;
  trackingNumber: string; // e.g. 'GUIA-EC-2026-9104'
  senderName: string;
  senderPhone: string;
  senderIdNumber: string; // Cédula remitente
  senderAddress: string;
  senderCity: string;

  receiverName: string;
  receiverPhone: string;
  receiverIdNumber: string; // Cédula destinatario
  receiverAddress: string;
  receiverCity: string;

  packageType: 'documentos' | 'caja_mediana' | 'fragil' | 'carga_pesada' | 'electrodomestico';
  description: string;
  weightKg: number;
  declaredValueUsd: number;
  hasInvoiceAttached?: boolean;
  invoiceNumber?: string;
  driverCommercialInspection?: 'factura_verificada' | 'sin_factura_ndv';
  commercialDisclaimerNote?: string;
  deliveryCostUsd: number;
  paymentStatus: 'pagado_origen' | 'cobro_contra_entrega';

  assignedCarrierType: 'conductor_andesmovi' | 'flota_interprovincial' | 'mensajero_moto';
  assignedCarrierName: string;
  assignedCarrierPhone: string;

  securityPin: string; // PIN de 4 dígitos para entrega
  status: EncomiendaStatus;
  createdAt: number;
  createdFormatted: string;
  estimatedDeliveryFormatted: string;
  deliveredAt?: number;
  deliveredProofSignature?: string;
  incidentNotes?: string;
  originOfficeId?: string;
  destinationOfficeId?: string;
}

// ==================== PERSONAL Y ACCESO ADMINISTRATIVO (24 PROVINCIAS) ====================

export type EcuadorProvince24 =
  | 'Azuay'
  | 'Bolívar'
  | 'Cañar'
  | 'Carchi'
  | 'Chimborazo'
  | 'Cotopaxi'
  | 'El Oro'
  | 'Esmeraldas'
  | 'Galápagos'
  | 'Guayas'
  | 'Imbabura'
  | 'Loja'
  | 'Los Ríos'
  | 'Manabí'
  | 'Morona Santiago'
  | 'Napo'
  | 'Orellana'
  | 'Pastaza'
  | 'Pichincha'
  | 'Santa Elena'
  | 'Santo Domingo de los Tsáchilas'
  | 'Sucumbíos'
  | 'Tungurahua'
  | 'Zamora Chinchipe';

export type AdminWorkerRole =
  | 'super_admin'
  | 'operador_provincial'
  | 'despachador_encomiendas'
  | 'supervisor_flota'
  | 'auditor_financiero';

export interface AdminWorker {
  id: string;
  cedula: string; // e.g. "1004721351"
  fullName: string;
  role: AdminWorkerRole;
  roleTitle: string; // e.g. "Super Administrador / Fundador", "Operador Zonal"
  province: EcuadorProvince24;
  phone: string;
  email: string;
  username: string;
  passwordHash: string; // Contraseña o PIN de acceso
  isActive: boolean;
  canManageTariffs: boolean;
  canManageRecharges: boolean;
  canManageEncomiendas: boolean;
  canManageFleet: boolean;
  canManageStaff: boolean; // John Yepez y Esmeralda López
  createdAt: number;
  createdFormatted: string;
  lastLoginFormatted?: string;
  notes?: string;
}

export interface AdminBankAccount {
  id: string;
  bankName: string;
  accountType: 'Ahorros' | 'Corriente';
  accountNumber: string;
  accountHolder: string;
  identification: string;
  email: string;
  shortCode: string;
  badge?: string;
  notes?: string;
}

// ==================== CARRERAS ACTIVAS, UNIDADES & COOPERATIVAS (ADMIN DASHBOARD) ====================

export type AdminTripStatus = 'pendiente' | 'en_curso' | 'finalizado' | 'cancelado';

export interface AdminActiveTrip {
  id: string;
  tripCode: string; // e.g. "VIAJE-EC-4091"
  serviceType: ServiceType;
  passengerName: string;
  passengerPhone: string;
  passengerAvatar?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedDriverAvatar?: string;
  assignedUnitNumber?: string;
  vehiclePlate?: string;
  cooperativaName?: string;
  terminalName?: string;
  originAddress: string;
  destinationAddress: string;
  distanceKm: number;
  durationMinutes: number;
  fareBreakdown: {
    baseFareUsd: number; // 1.25 USD
    coveredKm: number; // 2.7 km
    extraKm: number;
    extraKmRateUsd: number; // 0.35 USD
    totalFareUsd: number;
  };
  status: AdminTripStatus;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'pendiente' | 'pagado';
  startSecurityPin?: string;
  endSecurityPin?: string;
  createdAt: number;
  createdFormatted: string;
  etaMinutesRemaining?: number;
  notes?: string;
}

export interface RegisteredVehicleUnit {
  id: string;
  unitNumber: string; // Ej: "Unidad #045"
  plate: string; // Ej: "PBA-4521" (Validada ANT)
  plateProvince: string; // Ej: "Pichincha"
  model: string; // Ej: "Chevrolet Sail"
  year: number; // Ej: 2024
  color: string; // Ej: "Amarillo Taxi"
  vehicleType: 'auto' | 'moto' | 'confort' | 'camioneta' | 'mini';
  cooperativa: string; // Ej: "Coop. Taxi Los Lagos"
  terminal: string; // Ej: "Terminal Carcelén (Quito)"
  assignedDriverId: string;
  assignedDriverName: string;
  assignedDriverCedula: string;
  driverPhone: string;
  isDriverApproved: boolean;
  operationalStatus: UnitOperationalStatus;
  registeredAt: number;
  registeredAtFormatted: string;
}

// ==================== SERVICIO DE NOTIFICACIONES PUSH ====================

export type NotificationCategory =
  | 'trip_status'
  | 'chat_message'
  | 'system'
  | 'safety'
  | 'driver_broadcast'
  | 'wallet'
  | 'driver_registration';

export interface AdminActivityEvent {
  id: string;
  type:
    | 'client_request'
    | 'driver_take'
    | 'trip_status'
    | 'trip_completed'
    | 'new_driver_registered'
    | 'recharge_request'
    | 'recharge_approved'
    | 'system_alert';
  actorName: string;
  actorRole: 'cliente' | 'conductor' | 'admin' | 'sistema';
  title: string;
  description: string;
  amount?: number;
  serviceType?: ServiceType;
  timestamp: number;
  formattedTime: string;
  details?: Record<string, any>;
}

export interface DriverRadarOrder {
  id: string;
  serviceType: ServiceType;
  clientName: string;
  clientAvatar: string;
  clientRating: number;
  clientTrips: number;
  clientPhone: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  distanceFromDriverKm: number;
  etaPickupMin: number;
  passengerOffer: number;
  suggestedFair: number;
  paymentMethodName: string;
  paymentMethodType: PaymentMethodType;
  pickupPin?: string;
  deliveryPin?: string;
  specialNotes?: string;
  vehicleCompatibility: 'auto' | 'moto' | 'both';
  restaurantName?: string;
  isInterprovincial?: boolean;
  seats?: number;
  passengerCount?: number;
  isWholeCar?: boolean;
  parcelDetails?: ParcelDetails;
  deliveryItems?: CartItem[];
  deliverySubtotalUsd?: number;
  deliveryFeeUsd?: number;
  totalToCollectUsd?: number;
  isRealtimeClientOrder?: boolean;
  quotationStatus?: 'esperando_cotizacion' | 'cotizado_confirmado';
  driverQuotedPriceUsd?: number;
  paymentTiming?: 'pago_origen' | 'por_cobrar_destino';
  modalidadPago?: 'pagado_en_origen' | 'pagado' | 'por_cobrar';
  officeName?: string;
  driverOfficeFeeUsd?: number;
  driverProfitUsd?: number;
  createdAt: number;
}

export interface PushNotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  icon?: string;
  actionUrl?: string;
  data?: {
    tripId?: string;
    driverName?: string;
    driverPhone?: string;
    messageText?: string;
    status?: string;
    serviceType?: ServiceType;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  tripStatusAlerts: boolean;
  chatMessageAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pushEnabled?: boolean;
  tripUpdates?: boolean;
  promotions?: boolean;
}




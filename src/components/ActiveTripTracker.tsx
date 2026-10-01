import React, { useState, useEffect, useRef } from 'react';
import { TripRequest, Driver, ChatMessage, Coordinates } from '../types';
import { formatCurrency, COMMON_TOLLS } from '../utils/geoUtils';
import { CallModal } from './CallModal';
import { ParcelProofOfDeliveryModal } from './ParcelProofOfDeliveryModal';
import { ParcelReceiptModal } from './ParcelReceiptModal';
import { RouteOptimizationModal } from './RouteOptimizationModal';
import { pushNotificationService } from '../services/notificationService';
import { CancelTripModal } from './CancelTripModal';
import {
  Phone,
  MessageSquare,
  ShieldAlert,
  Share2,
  CheckCircle2,
  Navigation,
  Clock,
  Car,
  Bike,
  Star,
  KeyRound,
  Send,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Hash,
  Package,
  Truck,
  PenTool,
  Camera,
  User,
  Copy,
  Check,
  Building2,
  Printer,
  FileText,
  DollarSign,
  Radio,
  Receipt,
  Route,
  Plus,
  Compass,
  XCircle,
} from 'lucide-react';

interface ActiveTripTrackerProps {
  trip: TripRequest;
  onUpdateDriverPosition: (newCoords: { lat: number; lng: number }) => void;
  onCompleteTrip: () => void;
  onCancelTrip: (reason?: string) => void;
  onOpenChat: () => void;
  onTriggerSOS: () => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string, isLocation?: boolean, coords?: Coordinates) => void;
  unreadCount: number;
}

export const ActiveTripTracker: React.FC<ActiveTripTrackerProps> = ({
  trip,
  onUpdateDriverPosition,
  onCompleteTrip,
  onCancelTrip,
  onOpenChat,
  onTriggerSOS,
  chatMessages,
  onSendChatMessage,
  unreadCount,
}) => {
  const driver = trip.selectedDriver;
  const [eta, setEta] = useState<number>(driver?.etaMinutes || 4);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isInlineChatOpen, setIsInlineChatOpen] = useState<boolean>(false);
  const [quickInput, setQuickInput] = useState<string>('');
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  // Security Verification Codes (Código de inicio y finalización)
  const [isStartPinVerified, setIsStartPinVerified] = useState<boolean>(false);
  const [isEndPinVerified, setIsEndPinVerified] = useState<boolean>(false);
  const [showProofOfDeliveryModal, setShowProofOfDeliveryModal] = useState<boolean>(false);
  const [deliveryProof, setDeliveryProof] = useState<{ signatureUrl: string; photoUrl: string } | null>(null);
  const [isCopiedPin, setIsCopiedPin] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [isCopiedShareLink, setIsCopiedShareLink] = useState<boolean>(false);
  const [showRouteOptModal, setShowRouteOptModal] = useState<boolean>(false);

  // Active Toll Fee state (Aumento de valor si la carrera pasa por Peaje)
  const [activeTollUsd, setActiveTollUsd] = useState<number>(trip.tollFeeUsd || 0);
  const [activeTollName, setActiveTollName] = useState<string>(trip.tollName || 'Peaje en Vía');
  const [showTollSelector, setShowTollSelector] = useState<boolean>(false);

  const effectivePrice = Number((trip.offeredPrice + activeTollUsd).toFixed(2));

  // Commission calculation (7% urban vs $1.00 per passenger for interprovincial, 9% for interprovincial encomiendas)
  const isInterprovincial = trip.isInterprovincial || trip.distanceKm > 20;
  const isEncomienda = trip.serviceType === 'encomienda' || trip.parcelDetails !== undefined || trip.id.includes('parcel') || String(trip.serviceType).includes('encomienda');
  const isInterprovincialEncomienda = isInterprovincial && isEncomienda;

  const passengerCount = trip.passengerCount || (isInterprovincial ? 4 : 1);
  const platformCommissionUsd = isInterprovincialEncomienda
    ? effectivePrice * 0.09
    : trip.commissionPerPassengerUsd !== undefined
    ? trip.commissionPerPassengerUsd * passengerCount
    : isInterprovincial
    ? 1.00 * passengerCount
    : effectivePrice * 0.07;
  const driverNetUsd = effectivePrice - platformCommissionUsd;

  // Automated "Ya estoy aquí" notification status
  const [hasSentImHere, setHasSentImHere] = useState<boolean>(false);
  const [imHereSentAt, setImHereSentAt] = useState<string | null>(null);
  const [showImHereToast, setShowImHereToast] = useState<boolean>(false);

  const startPin = trip.startPin || '5821';
  const endPin = trip.endPin || '8342';

  const isDelivery = trip.serviceType === 'domicilio';
  const isParcel = trip.serviceType === 'encomienda';
  const isRide = trip.serviceType === 'viaje';
  const isInterprovincialParcel =
    isParcel &&
    (trip.parcelDetails?.scope === 'interprovincial' || !!trip.parcelDetails?.arrivalOffice);

  // Dynamic distance calculation for real-time telemetry
  const currentDistanceDisplay =
    currentStepIndex === 0
      ? eta > 1
        ? `${(eta * 0.35).toFixed(1)} km de ti`
        : `${Math.max(150, eta * 250)} m de ti`
      : currentStepIndex === 1
      ? 'En tu ubicación'
      : `${Math.max(0.6, Number((eta * 0.4).toFixed(1)))} km al destino`;

  // Lifecycle status steps
  const statusSteps = isDelivery
    ? [
        { title: 'Repartidor asignado', subtitle: 'Aceptó tu entrega y se dirige al local' },
        { title: 'Recogiendo en el restaurante', subtitle: 'Verificando productos en cocina' },
        { title: 'En camino a tu dirección', subtitle: 'Siguiendo ruta en tiempo real' },
        { title: 'Repartidor ha llegado', subtitle: 'Por favor recibe tu pedido' },
      ]
    : isParcel
    ? [
        { title: 'Mensajero asignado', subtitle: 'En camino al punto de recogida' },
        { title: 'Paquete recibido', subtitle: 'Verificando estado y empaque' },
        {
          title: 'En tránsito hacia el destino',
          subtitle: isInterprovincialParcel
            ? 'Ruta nacional hacia agencia o terminal autorizada'
            : 'Transportando paquete con custodia y entrega con Cédula',
        },
        {
          title: 'Llegó al destino de entrega',
          subtitle: isInterprovincialParcel
            ? 'Disponible para retiro en ventanilla con Cédula original (Sin código)'
            : 'Entrega en curso: verificación exclusiva con Cédula de Identidad (Sin PIN)',
        },
      ]
    : [
        { title: 'Conductor en camino', subtitle: `Llegando en ~${eta} min al punto de recogida` },
        { title: 'Conductor en el punto de recogida', subtitle: 'Búscalo por su placa y modelo' },
        { title: 'En viaje hacia tu destino', subtitle: 'Ruta en tiempo real con monitoreo GPS' },
        { title: 'Llegando al destino', subtitle: 'Preparando descenso y finalización' },
      ];

  // Real GPS updates driver position directly without artificial math simulation
  useEffect(() => {
    if (!driver || !driver.currentCoords) return;
    onUpdateDriverPosition(driver.currentCoords);
  }, [driver?.currentCoords?.lat, driver?.currentCoords?.lng]);

  // Real-time Push Notification on step change
  const lastNotifiedStepRef = useRef<number>(0);
  useEffect(() => {
    if (currentStepIndex === lastNotifiedStepRef.current) return;
    lastNotifiedStepRef.current = currentStepIndex;

    const originName = trip.origin.name || trip.origin.address;
    const destName = trip.destination?.name || trip.destination?.address;
    const driverName = driver?.name || 'Conductor Asignado';
    const vehicleModel = driver?.vehicle?.model || 'Vehículo';
    const plate = driver?.vehicle?.plate || 'S/P';

    if (currentStepIndex === 1) {
      pushNotificationService.notifyTripStatus('driver_arrived', {
        driverName,
        vehicleModel,
        plate,
        serviceType: trip.serviceType,
        originName,
        destinationName: destName,
        tripId: trip.id,
      });
    } else if (currentStepIndex === 2) {
      pushNotificationService.notifyTripStatus('in_transit', {
        driverName,
        vehicleModel,
        plate,
        serviceType: trip.serviceType,
        originName,
        destinationName: destName,
        tripId: trip.id,
      });
    } else if (currentStepIndex === 3) {
      pushNotificationService.notifyTripStatus('arrived_destination', {
        driverName,
        vehicleModel,
        plate,
        serviceType: trip.serviceType,
        originName,
        destinationName: destName,
        tripId: trip.id,
      });
    }
  }, [currentStepIndex, driver, trip]);

  // Handler for sending automated "Ya estoy aquí" notification to the driver
  const handleSendImHereNotification = () => {
    const originLabel = trip.origin?.name || trip.origin?.address;
    const locationSuffix = originLabel ? ` en ${originLabel}` : '';

    let messageText = `📍 ¡Ya estoy aquí! Te estoy esperando en el punto de encuentro${locationSuffix}.`;
    if (isDelivery) {
      messageText = `📍 ¡Ya estoy aquí! Estoy en la dirección${locationSuffix} listo para recibir el pedido.`;
    } else if (isParcel) {
      messageText = `📍 ¡Ya estoy aquí! Estoy listo en el punto acordado${locationSuffix} con el paquete.`;
    }

    onSendChatMessage(messageText, true, trip.origin);
    setHasSentImHere(true);
    setImHereSentAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setShowImHereToast(true);
    setTimeout(() => {
      setShowImHereToast(false);
    }, 4000);
  };

  if (!driver || (trip.serviceType === 'encomienda' && trip.quotationStatus === 'esperando_cotizacion')) {
    return (
      <>
        <div className="w-full bg-zinc-900/95 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-3">
          {/* Top Banner: Status of the order */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping absolute" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 relative" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                  Estado de la Orden
                </span>
                <h3 className="text-sm font-black text-white">
                  Esperando cotización del transportista
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              En Radar
            </span>
          </div>

          {/* Live Radar animation notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-300 block">
                Tu solicitud ha sido enviada al radar de transportistas
              </span>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Los transportistas en ruta están cotizando tu envío según peso ({trip.parcelDetails?.weightKg || 2} kg), {trip.parcelDetails?.packageCount || 1} bulto(s) y trayecto. Al fijar el valor te aparecerá el precio y el estado pasará a <strong>Confirmado</strong>.
              </p>
            </div>
          </div>

          {/* Live Route Summary instead of duplicate mini-map */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Trayecto Activo</span>
                <span className="text-white font-bold">{trip.origin?.name || 'Origen'} ➔ {trip.destination?.name || 'Destino'}</span>
              </div>
            </div>
            <span className="font-mono text-emerald-400 font-black">Ruta Verificada</span>
          </div>

          {/* Resumen de Datos Registrados */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-[10px] uppercase tracking-wider font-black text-zinc-500 block">
              Datos Registrados de la Encomienda
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">👤 Remitente:</span>
                <p className="font-bold text-white">{trip.parcelDetails?.senderName || 'Remitente'}</p>
                <p className="text-zinc-400 font-mono text-[10px]">C.I.: {trip.parcelDetails?.senderCedula || 'N/A'}</p>
                <p className="text-zinc-400 font-mono text-[10px]">Tel: {trip.parcelDetails?.senderPhone || 'N/A'}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">🎯 Destinatario:</span>
                <p className="font-bold text-white">{trip.parcelDetails?.receiverName || 'Destinatario'}</p>
                <p className="text-zinc-400 font-mono text-[10px]">C.I.: {trip.parcelDetails?.receiverCedula || 'N/A'}</p>
                <p className="text-zinc-400 font-mono text-[10px]">Tel: {trip.parcelDetails?.receiverPhone || 'N/A'}</p>
                {trip.parcelDetails?.deliveryCityOrStop && (
                  <p className="text-zinc-300 text-[10px] truncate">
                    <strong>Entrega:</strong> {trip.parcelDetails.deliveryCityOrStop}
                  </p>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Detalle del Paquete:</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-mono font-bold text-[10px]">
                    {trip.parcelDetails?.packageCount || 1} bulto(s)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono font-bold text-[10px]">
                    {trip.parcelDetails?.weightKg || 2} kg
                  </span>
                  {trip.parcelDetails?.isFragile && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30">
                      ⚠️ Frágil
                    </span>
                  )}
                </div>
              </div>
              <p className="text-zinc-200 italic bg-black/30 p-2 rounded-lg border border-zinc-800/80">
                "{trip.parcelDetails?.description || 'Paquete express'}"
              </p>
              {trip.parcelDetails?.hasDeclaredValue && (
                <p className="text-[10px] text-amber-400 font-mono pt-1">
                  💰 Valor declarado: ${trip.parcelDetails.declaredValueUsd?.toFixed(2) || '0.00'} USD
                  {trip.parcelDetails.hasInvoiceAttached ? ' (Factura adjunta)' : ' (S/F - NDV)'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-850">
              <span className="text-zinc-400 font-medium">Modalidad de Pago:</span>
              <span className="font-bold text-white">
                {trip.parcelDetails?.paymentTiming === 'por_cobrar_destino'
                  ? 'Por Cobrar en Destino'
                  : 'Pago en Origen'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Valor del Flete:</span>
              <span className="font-bold text-amber-400 font-mono animate-pulse">
                Esperando cotización del chofer...
              </span>
            </div>
          </div>

          {/* Action Button: Cancelar solicitud */}
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancelar Solicitud de Encomienda</span>
          </button>
        </div>

        <CancelTripModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirmCancel={(reason) => {
            setShowCancelModal(false);
            onCancelTrip(reason);
          }}
          isDriver={false}
        />
      </>
    );
  }

  const latestDriverMessage = [...chatMessages].reverse().find((m) => m.sender === 'conductor');

  return (
    <div className="w-full bg-zinc-900/95 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-3">
      {/* Top Banner with live state indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black text-white">
                {statusSteps[currentStepIndex].title}
              </h3>
              {isParcel && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/30">
                  Estado: Confirmado
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {isParcel && trip.driverQuotedPriceUsd
                ? `Tarifa fijada por transportista: $${trip.driverQuotedPriceUsd.toFixed(2)} USD`
                : statusSteps[currentStepIndex].subtitle}
            </p>
          </div>
        </div>

        {/* ETA badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold text-white">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>~{eta} min</span>
        </div>
      </div>

      {/* Live Status Card for Client (with SOS button) */}
      <div className="w-full p-4 rounded-3xl bg-zinc-950 border border-emerald-500/40 relative shadow-2xl flex flex-col gap-3">
        {/* BOTÓN FLOTANTE ROJO SOS EMERGENCIA LLAMATIVO */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">Monitoreo en Tiempo Real</span>
          <button
            type="button"
            id="btn-floating-sos-client"
            onClick={onTriggerSOS}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-2xl shadow-red-600/70 border-2 border-red-300 active:scale-95 transition-all cursor-pointer animate-pulse"
            title="Botón de Pánico / Emergencia SOS 911"
          >
            <ShieldAlert className="w-4 h-4 text-white animate-bounce" />
            <span>SOS Emergencia</span>
          </button>
        </div>
        <p className="text-xs text-zinc-300">
          La unidad asignada se desplaza hacia tu ubicación. Sigue el progreso en el mapa principal de la derecha.
        </p>
      </div>

      {/* Prominent Live ETA & Arrival Countdown Banner */}
      <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-black shadow-lg animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Tiempo Estimado de Llegada (ETA)</span>
            <span className="text-lg font-black text-white">~{eta} {eta === 1 ? 'minuto' : 'minutos'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-zinc-400 font-medium">Unidad en aproximación</span>
          <span className="text-xs font-mono font-bold text-emerald-300">GPS En vivo</span>
        </div>
      </div>

      {/* Driver Card, Vehicle Specs, Distance, ETA & Agreed Price */}
      <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col gap-3 shadow-xl">
        {/* Driver Avatar, Name, Rating & Vehicle Info */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={driver.avatar || null}
                alt={driver.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
              />
              <div
                className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-zinc-950 text-emerald-400 border border-zinc-700"
                title="Conductor Oficial Verificado"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-black text-white truncate">{driver.name}</h4>
                <span className="flex items-center text-[10px] font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-2.5 h-2.5 fill-amber-400 mr-1" />
                  {driver.rating}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 font-medium truncate mt-0.5">
                {driver.vehicle.model} • {driver.vehicle.color}
              </p>
              <span className="text-[10px] text-zinc-400">
                {driver.totalTrips} carreras en Ecuador
              </span>
            </div>
          </div>

          {/* Ecuadorian License Plate Badge */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 shadow-inner">
              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter">EC</span>
              <span className="font-mono text-xs font-black text-amber-400 tracking-wider">
                {driver.vehicle.plate}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
              {driver.vehicle.type === 'moto' ? (
                <Bike className="w-4 h-4 text-emerald-400" />
              ) : (
                <Car className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>
        </div>

        {/* Live Distance & ETA Telemetry Strip */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-850 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Distancia en tiempo real</span>
              <span className="text-white font-bold">{currentDistanceDisplay}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Tiempo aproximado</span>
              <span className="text-emerald-400 font-black">~{eta} min de llegada</span>
            </div>
          </div>
        </div>

        {/* Agreed Price & GPS Status Card */}
        <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Precio Total Carrera</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {formatCurrency(effectivePrice)} USD
                </span>
              </div>
            </div>

            {/* GPS Satellite Status & Add Toll Toggle */}
            <div className="flex items-center gap-2 text-right">
              <button
                type="button"
                onClick={() => setShowTollSelector(!showTollSelector)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <Route className="w-3 h-3 text-amber-400" />
                <span>{activeTollUsd > 0 ? `Peaje +${formatCurrency(activeTollUsd)}` : '+ Peaje'}</span>
              </button>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hidden sm:flex">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>GPS Activo</span>
              </div>
            </div>
          </div>

          {/* Toll Selector Accordion */}
          {showTollSelector && (
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-amber-500/30 flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-amber-400" />
                  Añadir Peaje Cruzado en Carrera:
                </span>
                {activeTollUsd > 0 && (
                  <button
                    onClick={() => {
                      setActiveTollUsd(0);
                      setActiveTollName('Sin Peaje');
                    }}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Quitar Peaje
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {COMMON_TOLLS.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTollUsd(t.feeUsd);
                      setActiveTollName(t.name);
                    }}
                    className={`p-1.5 rounded-lg border font-bold text-center transition-all ${
                      activeTollUsd === t.feeUsd
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {t.name.split(' ')[1] || t.name} (+{formatCurrency(t.feeUsd)})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Toll Banner */}
          {activeTollUsd > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Route className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Incluye {activeTollName}:</span>
              </span>
              <strong className="font-mono text-amber-400 font-bold">+{formatCurrency(activeTollUsd)} USD</strong>
            </div>
          )}

          {/* Desglose Transparente del Costo (Monto Total vs Comisión AndesMovi 7% o $1/pasajero) */}
          <div className="p-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-300 font-bold flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                Desglose Transparente AndesMovi
              </span>
              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                {isInterprovincialEncomienda ? '9% Comisión Interprovincial' : isInterprovincial ? `$1.00 x ${passengerCount} pas. (${formatCurrency(platformCommissionUsd)})` : '7% Comisión'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400 block">Total Servicio</span>
                <span className="font-mono font-bold text-white">{formatCurrency(effectivePrice)}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-amber-500/30">
                <span className="text-amber-400 block font-semibold">Comisión AndesMovi</span>
                <span className="font-mono font-bold text-amber-400">-{formatCurrency(platformCommissionUsd)}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-emerald-500/30">
                <span className="text-emerald-400 block font-semibold">Neto Conductor</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(driverNetUsd)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔐 CÓDIGOS DE SEGURIDAD (Viajes de Pasajeros con PIN) vs Encomiendas (Solo con Cédula - Sin PIN) */}
      {isParcel ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-950 to-emerald-950/20 border border-emerald-500/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                Entrega de Encomienda: Solo con Cédula
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Sin Código PIN
                </span>
              </span>
              <span className="text-[10px] text-zinc-400 block">
                {isInterprovincialParcel
                  ? `Retiro en agencia/ventanilla exclusivo con Cédula original de ${trip.parcelDetails?.receiverName || 'el destinatario'}`
                  : `Entrega urbana a domicilio únicamente con Cédula original de ${trip.parcelDetails?.receiverName || 'el destinatario'}`}
              </span>
            </div>
          </div>
          <div className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-right flex-shrink-0">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block">
              {trip.parcelDetails?.receiverCedula ? `C.I. ${trip.parcelDetails.receiverCedula}` : 'Solo Cédula'}
            </span>
            <span className="text-[9px] text-zinc-500">Sin PIN</span>
          </div>
          
          {/* Instrucción de Pago en Oficina y Cobro al Cliente (Para el Conductor) */}
          {isInterprovincialParcel && (
            <div className="col-span-2 w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1 mt-2">
              <div className="flex items-center gap-1.5 font-black text-amber-400 uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Instrucción Logística de Cobro y Oficina</span>
              </div>
              <p className="leading-relaxed">
                💵 <strong>Cobras el 100%</strong> de la encomienda al cliente (${trip.offeredPrice.toFixed(2)} USD).
              </p>
              <p className="leading-relaxed">
                🏢 <strong>Pagas el valor del envío</strong> (flete de la oficina) de inmediato en las <strong>oficinas aliadas</strong> (San Cristóbal, Pullman, Vencedores, Cita Express) al despachar.
              </p>
              <p className="leading-relaxed">
                📱 AndesMovi retiene únicamente el <strong>9% de comisión</strong> de tu saldo prepago.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-950 to-emerald-950/20 border border-emerald-500/30 flex flex-col gap-2.5 shadow-lg">
          {/* Código de Inicio */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">
                  {isDelivery ? 'PIN de Inicio (Carrera Delivery)' : 'Código de Inicio de Carrera'}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {isDelivery
                    ? 'Compártelo con el repartidor para validar la recogida del pedido e iniciar la ruta'
                    : 'Indícaselo al conductor al abordar el auto'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="px-3 py-1 rounded-xl bg-zinc-900 border border-emerald-500/50 shadow-inner">
                <span className="font-mono text-base font-black tracking-widest text-emerald-400">
                  {startPin}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(startPin);
                  setIsCopiedPin(true);
                  setTimeout(() => setIsCopiedPin(false), 2000);
                }}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 text-xs"
                title="Copiar PIN"
              >
                {isCopiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Start PIN validation action */}
          {!isStartPinVerified ? (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setIsStartPinVerified(true)}
                className="w-full py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isDelivery
                    ? `Validar PIN de Inicio de Carrera Delivery (${startPin})`
                    : `Validar Código de Inicio (${startPin})`}
                </span>
              </button>
              {isDelivery && (
                <button
                  type="button"
                  onClick={() => {
                    onSendChatMessage(`🔑 Hola, mi PIN de inicio para la carrera delivery es: ${startPin}`);
                  }}
                  className="w-full py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3 text-emerald-400" />
                  <span>Enviar PIN de inicio al repartidor por chat</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {isDelivery
                    ? 'PIN de inicio validado • Repartidor en ruta con tu pedido'
                    : 'Código de inicio validado'}
                </span>
              </span>
              <span className="text-[10px] text-zinc-400">En curso</span>
            </div>
          )}

          {/* Código de Finalización (cuando llega a destino) */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span className="text-[11px]">
                {isDelivery ? 'PIN de Entrega / Recepción de Pedido:' : 'Código de llegada / entrega:'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-amber-500/30 text-xs">
                {endPin}
              </span>
              {!isEndPinVerified ? (
                <button
                  onClick={() => setIsEndPinVerified(true)}
                  className="text-[10px] font-bold text-amber-400 hover:underline"
                >
                  Confirmar
                </button>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold">✓ Confirmado</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Route Optimization Quick Action Button */}
      <button
        type="button"
        id="btn-active-trip-best-route"
        onClick={() => setShowRouteOptModal(true)}
        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 hover:from-emerald-900/60 border border-emerald-500/40 rounded-2xl text-emerald-400 text-xs font-bold flex items-center justify-between transition-all group shadow-md"
      >
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
          <span>Identificar la Mejor Ruta en Tiempo Real</span>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Analizar Vías
        </span>
      </button>

      {/* Puntos de Parada Intermedias (Puntos de Parada) */}
      {trip.intermediateStops && trip.intermediateStops.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/40 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              Puntos de Parada en Ruta ({trip.intermediateStops.length} Paradas)
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Ruta Multiparada
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Origin */}
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[10px]">
                A
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Origen</span>
                <span className="text-white font-medium truncate block">{trip.origin.name || trip.origin.address}</span>
              </div>
            </div>

            {/* Intermediate Stops */}
            {trip.intermediateStops.map((stop, idx) => (
              <div key={idx} className="flex items-center gap-2.5 pl-2 border-l-2 border-amber-500/40 ml-2.5 my-1">
                <div className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-[10px]">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-amber-400 font-bold block uppercase">
                    Parada {idx + 1}
                  </span>
                  <span className="text-zinc-200 font-medium truncate block">{stop.name || stop.address}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/20">
                  En ruta
                </span>
              </div>
            ))}

            {/* Final Destination */}
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-[10px]">
                B
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Destino Final</span>
                <span className="text-white font-medium truncate block">{trip.destination?.name || trip.destination?.address}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick In-App Communication & Actions */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenChat}
          className="relative min-h-[44px] py-2 px-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors group active:scale-95"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] truncate max-w-full">Chat en vivo</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[9px] animate-pulse shadow-md">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          id="btn-active-trip-call-inapp"
          onClick={() => setShowCallModal(true)}
          className="min-h-[44px] py-2 px-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors group active:scale-95 border border-emerald-500/20"
          title="Llamar por la app (Voz VoIP segura)"
        >
          <Phone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] text-emerald-300 font-bold">Llamar VoIP</span>
        </button>

        <button
          onClick={() => {
            const url = `https://andesmovi.ec/live/${trip.id}`;
            navigator.clipboard?.writeText(url);
            setIsCopiedShareLink(true);
            setTimeout(() => setIsCopiedShareLink(false), 2500);
          }}
          className="min-h-[44px] py-2 px-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors active:scale-95"
        >
          <Share2 className="w-4 h-4 text-zinc-300" />
          <span className="text-[10px]">{isCopiedShareLink ? '✓ Copiado' : 'Compartir'}</span>
        </button>

        <button
          id="btn-bottom-bar-sos"
          onClick={onTriggerSOS}
          className="min-h-[44px] py-2 px-1 rounded-xl bg-gradient-to-b from-red-950/80 to-rose-900/80 hover:from-red-900 hover:to-rose-800 text-rose-200 border-2 border-red-500/70 text-xs font-black flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-red-950/60 cursor-pointer"
          title="Botón de Pánico / Emergencia SOS 911"
        >
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="text-[10px] text-white font-black">SOS 911</span>
        </button>
      </div>

      {/* Botón de Notificación Automática: "Ya estoy aquí" al conductor */}
      <div className="relative">
        <button
          type="button"
          id="btn-send-im-here"
          onClick={handleSendImHereNotification}
          className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between shadow-lg group active:scale-[0.99] ${
            hasSentImHere
              ? 'bg-emerald-950/40 border-emerald-500/50 hover:bg-emerald-950/60 text-emerald-300'
              : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border-emerald-400/40 text-zinc-950 shadow-emerald-500/20 hover:shadow-emerald-500/35'
          }`}
          title="Enviar notificación automática al conductor avisando que ya estás en el punto"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105 ${
                hasSentImHere
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-950/20 text-zinc-950'
              }`}
            >
              {hasSentImHere ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in-75" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-xs">
                  {hasSentImHere ? '¡Notificación "Ya estoy aquí" enviada!' : '📍 ¡Ya estoy aquí! Avisar al conductor'}
                </span>
                {hasSentImHere && imHereSentAt && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {imHereSentAt}
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] truncate font-medium ${
                  hasSentImHere ? 'text-emerald-400/90' : 'text-zinc-950/80'
                }`}
              >
                {hasSentImHere
                  ? 'Aviso transmitido al conductor por chat • Clic para reiterar aviso'
                  : 'Envía un mensaje automático al conductor informando tu llegada al punto'}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <span
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                hasSentImHere
                  ? 'bg-zinc-900 border-emerald-500/40 text-emerald-300 hover:bg-zinc-850'
                  : 'bg-zinc-950 border-zinc-900 text-white shadow'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>{hasSentImHere ? 'Reenviar' : 'Avisar'}</span>
            </span>
          </div>
        </button>

        {/* Floating toast notification when sent */}
        {showImHereToast && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-950 px-3 py-1 rounded-full text-xs font-black shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 z-20 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>¡Notificación enviada al conductor por chat!</span>
          </div>
        )}
      </div>

      {/* Real-Time Mini Chat Bubble (Integrated Communication Drawer) */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
        <div
          onClick={() => setIsInlineChatOpen((prev) => !prev)}
          className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/60 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs truncate">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-zinc-300 truncate">
              {latestDriverMessage ? (
                <span><strong>{driver.name.split(' ')[0]}:</strong> "{latestDriverMessage.text}"</span>
              ) : (
                'Chat con el conductor en tiempo real'
              )}
            </span>
          </div>
          <button className="text-zinc-400 p-1">
            {isInlineChatOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isInlineChatOpen && (
          <div className="p-3 border-t border-zinc-800/80 flex flex-col gap-2 bg-zinc-950/80 animate-in slide-in-from-top-1">
            <div className="max-h-32 overflow-y-auto flex flex-col gap-1.5 text-xs">
              {chatMessages.slice(-3).map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl text-[11px] ${
                    m.sender === 'cliente'
                      ? 'bg-emerald-500 text-zinc-950 self-end max-w-[85%] font-medium'
                      : 'bg-zinc-800 text-white self-start max-w-[85%]'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* Quick response chips in inline chat */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                id="btn-inline-im-here"
                onClick={handleSendImHereNotification}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap active:scale-95 transition-all"
              >
                <MapPin className="w-3 h-3" />
                <span>📍 Ya estoy aquí</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendChatMessage('🚦 Voy bajando en 1 minuto, gracias por esperar.');
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium whitespace-nowrap active:scale-95 transition-all"
              >
                🚦 Voy bajando en 1 min
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (quickInput.trim()) {
                  onSendChatMessage(quickInput);
                  setQuickInput('');
                }
              }}
              className="flex items-center gap-1.5 mt-1"
            >
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Respuesta rápida..."
                className="flex-1 bg-zinc-900 border border-zinc-700/80 text-xs text-white p-2 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Encomienda Casa a Casa Details & Proof of Delivery */}
      {isParcel && trip.parcelDetails && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-400" />
              Encomienda Casa a Casa ({trip.parcelDetails.scope === 'interprovincial' ? 'Interprovincial' : 'Urbana'})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="btn-print-parcel-receipt-tracker"
                onClick={() => setShowReceiptModal(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
                title="Ver e Imprimir Comprobante Oficial de Encomienda"
              >
                <Printer className="w-3 h-3 text-emerald-400" />
                <span>Imprimir Comprobante</span>
              </button>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono font-bold">
                {trip.parcelDetails.weightKg} kg • {trip.parcelDetails.size}
              </span>
            </div>
          </div>

          {/* Recogida y Destinatario info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Remitente (Recogida)
                </span>
                {trip.parcelDetails.senderCedula && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                    C.I. {trip.parcelDetails.senderCedula}
                  </span>
                )}
              </div>
              <span className="text-zinc-200 font-semibold">{trip.parcelDetails.senderName || 'Remitente'}</span>
              <span className="text-zinc-400 text-[11px] truncate">{trip.origin.name || trip.origin.address}</span>
              {trip.parcelDetails.pickupReference && (
                <span className="text-[10px] text-zinc-400 italic">Ref: "{trip.parcelDetails.pickupReference}"</span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                  {trip.parcelDetails.arrivalOffice ? (
                    <Building2 className="w-3 h-3 text-rose-400" />
                  ) : (
                    <User className="w-3 h-3 text-rose-400" />
                  )}
                  {trip.parcelDetails.arrivalOffice
                    ? `Punto de Llegada Oficial (${trip.parcelDetails.carrier || trip.parcelDetails.arrivalOffice.carrier || 'Cooperativa Aliada'})`
                    : 'Destinatario (Entrega)'}
                </span>
                {trip.parcelDetails.receiverCedula && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                    C.I. {trip.parcelDetails.receiverCedula}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-200 font-semibold">{trip.parcelDetails.receiverName}</span>
                <span className="text-[10px] font-mono text-emerald-400">{trip.parcelDetails.receiverPhone}</span>
              </div>
              {trip.parcelDetails.arrivalOffice ? (
                <div className="mt-1 p-2 rounded-lg bg-rose-950/25 border border-rose-800/40 text-[11px] flex flex-col gap-0.5">
                  <span className="font-bold text-rose-300">
                    🏢 {trip.parcelDetails.arrivalOffice.name}
                  </span>
                  <span className="text-zinc-300 text-[10px]">
                    📍 {trip.parcelDetails.arrivalOffice.terminal} • {trip.parcelDetails.arrivalOffice.address}
                  </span>
                  <span className="text-zinc-400 text-[10px]">
                    📞 {trip.parcelDetails.arrivalOffice.phone} | 🕒 {trip.parcelDetails.arrivalOffice.schedule}
                  </span>
                  <span className="text-amber-400 text-[9px] font-medium pt-0.5">
                    Retiro en ventanilla de {trip.parcelDetails.carrier || trip.parcelDetails.arrivalOffice.carrier || 'la cooperativa'} con Cédula (Sin código requerido)
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-zinc-400 text-[11px] truncate">{trip.destination?.name || trip.destination?.address}</span>
                  {trip.parcelDetails.dropoffReference && (
                    <span className="text-[10px] text-zinc-400 italic">Ref: "{trip.parcelDetails.dropoffReference}"</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Package Photos Thumbnail Strip */}
          {trip.parcelDetails.photoUrls && trip.parcelDetails.photoUrls.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                <Camera className="w-3 h-3 text-emerald-400" />
                Fotos del paquete (constancia de envío):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {trip.parcelDetails.photoUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url || null}
                    alt={`Paquete ${i + 1}`}
                    className="w-14 h-14 rounded-lg object-cover border border-zinc-700 flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Entrega de Encomienda: Solo con Cédula (Urbano y Nacional - Sin Código) */}
          <div className="p-3 bg-zinc-900 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-white">
                  Entrega de Encomienda: Solo con Cédula
                </span>
                <span className="text-[10px] text-zinc-400">
                  {trip.parcelDetails.receiverName} recibe presentando Cédula de Identidad{' '}
                  {trip.parcelDetails.receiverCedula ? `(C.I. ${trip.parcelDetails.receiverCedula})` : 'original'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-bold whitespace-nowrap">
              Sin PIN
            </span>
          </div>

          {/* Proof of delivery status or button */}
          {deliveryProof ? (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Entrega Certificada con Foto y Firma Digital
              </span>
              <span className="text-[10px] font-mono text-emerald-400">#ENT-OK</span>
            </div>
          ) : (
            <button
              type="button"
              id="btn-open-proof-modal"
              onClick={() => setShowProofOfDeliveryModal(true)}
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Confirmar Entrega (Foto y Firma Digital)</span>
            </button>
          )}
        </div>
      )}

      {/* Final Actions */}
      <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Tarifa pactada en USD: <strong className="text-white font-mono">{formatCurrency(trip.offeredPrice)}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-complete-trip"
            onClick={() => {
              if (isParcel && !deliveryProof) {
                setShowProofOfDeliveryModal(true);
              } else {
                onCompleteTrip();
              }
            }}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar {isDelivery ? 'Entrega' : isParcel ? 'Encomienda' : 'Carrera / Viaje'}</span>
          </button>

          <button
            id="btn-cancel-active-trip"
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors"
          >
            Cancelar viaje
          </button>
        </div>
      </div>

      {/* Cancel Trip Confirmation Modal */}
      <CancelTripModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={(reason) => {
          setShowCancelModal(false);
          onCancelTrip(reason);
        }}
        isDriver={false}
      />

      {/* In-App Calling Modal (VoIP / WebRTC) */}
      {showCallModal && driver && (
        <CallModal
          participant={{
            name: driver.name,
            avatar: driver.avatar,
            role: 'conductor',
            vehicleInfo: `${driver.vehicle.model} • ${driver.vehicle.plate}`,
            phoneMasked: driver.phone,
          }}
          onClose={() => setShowCallModal(false)}
        />
      )}

      {/* Parcel Proof of Delivery Modal (Photo & Signature) */}
      {showProofOfDeliveryModal && (
        <ParcelProofOfDeliveryModal
          trip={trip}
          onConfirmDelivery={(proof) => {
            setDeliveryProof(proof);
            setShowProofOfDeliveryModal(false);
            onCompleteTrip();
          }}
          onClose={() => setShowProofOfDeliveryModal(false)}
        />
      )}

      {/* Official Parcel Receipt Modal for Printing */}
      {showReceiptModal && (
        <ParcelReceiptModal
          trip={trip}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Route Optimization Modal */}
      <RouteOptimizationModal
        isOpen={showRouteOptModal}
        onClose={() => setShowRouteOptModal(false)}
        origin={trip.origin}
        destination={trip.destination}
      />
    </div>
  );
};

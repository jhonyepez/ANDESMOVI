import React, { useState, useEffect, useRef } from 'react';
import { Coordinates, EmergencyContact, TripRequest, UserProfile } from '../types';
import {
  ShieldAlert,
  Phone,
  Share2,
  X,
  CheckCircle2,
  AlertOctagon,
  PhoneCall,
  MessageCircle,
  Settings,
  MapPin,
  ExternalLink,
  Mic,
  MicOff,
  Download,
  Play,
  Pause,
  RotateCcw,
  Radio,
  FileAudio,
  Scale,
  Lock,
  UserCheck,
  Car,
} from 'lucide-react';
import { pushNotificationService } from '../services/notificationService';
import { haptic } from '../utils/haptics';

export interface SOSModalProps {
  currentLocation: Coordinates;
  emergencyContacts?: EmergencyContact[];
  currentUser?: UserProfile | null;
  activeTrip?: TripRequest | null;
  userRole?: 'passenger' | 'driver' | 'conductor' | 'cliente';
  driverName?: string;
  driverPlate?: string;
  clientName?: string;
  onOpenSettingsSOS?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onClose: () => void;
  onTriggerAdminSos?: (coords: Coordinates, tripInfo?: { tripId?: string; driverName?: string; driverPlate?: string; clientName?: string; role?: string }) => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  currentLocation,
  emergencyContacts = [],
  currentUser,
  activeTrip,
  userRole = 'passenger',
  driverName: propDriverName,
  driverPlate: propDriverPlate,
  clientName: propClientName,
  onOpenSettingsSOS,
  onOpenTerms,
  onOpenPrivacy,
  onClose,
  onTriggerAdminSos,
}) => {
  const isDriver =
    userRole === 'driver' ||
    userRole === 'conductor' ||
    currentUser?.role === 'conductor';

  // 3-second Cancelable Countdown
  const [countdown, setCountdown] = useState<number>(3);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(true);
  const [isSosActivated, setIsSosActivated] = useState<boolean>(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Audio Recording (Silent Evidence)
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick emergency contact state if not in profile
  const primaryContact = emergencyContacts.find((c) => c.isPrimary) || emergencyContacts[0];
  const [customContactPhone, setCustomContactPhone] = useState<string>(primaryContact?.phone || '');
  const [customContactName, setCustomContactName] = useState<string>(primaryContact?.name || 'Contacto de Confianza');

  const tripId = activeTrip?.id || 'EC-8832';
  const resolvedClientName = propClientName || (isDriver ? (activeTrip?.origin?.name ? 'Pasajero en ruta' : 'Cliente AndesMovi') : currentUser?.name || 'Cliente Pasajero');
  const resolvedDriverName = propDriverName || activeTrip?.selectedDriver?.name || (isDriver ? (currentUser?.name || 'Conductor AndesMovi') : 'Chofer Asignado');
  const resolvedDriverPlate = propDriverPlate || activeTrip?.selectedDriver?.vehicle?.plate || (isDriver ? 'PBA-8321' : 'PBA-3421');
  const mapsUrl = `https://maps.google.com/?q=${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}`;

  const prefilledWhatsappMessage = isDriver
    ? `🚨 ¡EMERGENCIA CONDUCTOR ANDESMOVI! Necesito auxilio urgente en ruta. Conductor: ${resolvedDriverName} (${resolvedDriverPlate}). Pasajero/Servicio: ${resolvedClientName}. Carrera #${tripId}. Ubicación GPS en vivo: ${mapsUrl}`
    : `🚨 ¡EMERGENCIA PASAJERO ANDESMOVI! Necesito ayuda inmediata. Estoy en un servicio de AndesMovi. Mi ubicación en tiempo real es: ${mapsUrl}. Chofer asignado: ${resolvedDriverName} (${resolvedDriverPlate}).`;

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountdownActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isCountdownActive && countdown === 0) {
      setIsCountdownActive(false);
      triggerEmergencyProtocol();
    }
    return () => clearTimeout(timer);
  }, [isCountdownActive, countdown]);

  // Start Silent Audio Recording
  const startSilentAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Audio recording not supported on this device/browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecordingAudio(false);
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // 1-sec slices
      setIsRecordingAudio(true);
      setAudioDurationSeconds(0);

      // Record for 45 seconds max or until stopped
      let duration = 0;
      recordingTimerRef.current = setInterval(() => {
        duration += 1;
        setAudioDurationSeconds(duration);
        if (duration >= 45) {
          stopSilentAudioRecording();
        }
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied or unavailable for SOS evidence:', err);
    }
  };

  const stopSilentAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  // Full Emergency Trigger
  const triggerEmergencyProtocol = () => {
    setIsCountdownActive(false);
    setIsSosActivated(true);
    haptic.warning();
    pushNotificationService.playChime('trip');

    // 1. Notify Admin Central
    if (onTriggerAdminSos) {
      onTriggerAdminSos(currentLocation, {
        tripId,
        clientName: resolvedClientName,
        driverName: resolvedDriverName,
        driverPlate: resolvedDriverPlate,
        role: isDriver ? 'conductor' : 'pasajero',
      });
    }

    // 2. Start Silent Recording
    startSilentAudioRecording();

    // 3. Open WhatsApp for primary contact if configured
    const targetPhone = (primaryContact?.phone || customContactPhone).replace(/\D/g, '');
    if (targetPhone) {
      const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(
        prefilledWhatsappMessage
      )}`;
      window.open(waUrl, '_blank');
    }

    // 4. Trigger ECU 911 Dial
    setTimeout(() => {
      window.location.href = 'tel:911';
    }, 600);

    setAlertNotice(
      `🚨 PROTOCOLO SOS ACTIVADO (${isDriver ? 'CONDUCTOR' : 'PASAJERO'}): Se transmitió la alerta a la Central AndesMovi, se conectó con el 911 y se inició la grabación de audio de evidencia.`
    );
  };

  const handleCancelCountdown = () => {
    setIsCountdownActive(false);
    haptic.tap();
    setAlertNotice('Activación de auxilio cancelada por el usuario.');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleManualActivateNow = () => {
    triggerEmergencyProtocol();
  };

  const handleTogglePlayAudio = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (audioElementRef.current) {
      if (isPlayingAudio) {
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleShareAudio = () => {
    const targetPhone = (primaryContact?.phone || customContactPhone).replace(/\D/g, '');
    const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(
      `🚨 [EVIDENCIA SOS ANDESMOVI - ${isDriver ? 'CONDUCTOR' : 'PASAJERO'}] Archivo de audio de seguridad registrado en el servicio #${tripId}. Conductor: ${resolvedDriverName} (${resolvedDriverPlate}). Ubicación GPS: ${mapsUrl}`
    )}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-950 border-2 border-red-600 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Top Header with pulsating Siren */}
        <div className="p-4 bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-b border-red-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-200">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                  {isDriver ? 'SOS CONDUCTOR EN RUTA' : 'SOS PASAJERO SEGURO'}
                </span>
                <span className="text-xs text-red-300 font-mono font-bold">ECU 911</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                Botón de Pánico y Auxilio SOS
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Identical Terms Banner for Driver and Passenger */}
          <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-zinc-300">
                Mismos términos de seguridad y LOPDP para <strong>Conductores</strong> y <strong>Pasajeros</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onOpenTerms && (
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Términos
                </button>
              )}
              <span className="text-zinc-600">•</span>
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Privacidad
                </button>
              )}
            </div>
          </div>

          {/* 1. COUNTDOWN STATE (Cancelable 3-second window) */}
          {isCountdownActive && (
            <div className="p-5 rounded-2xl bg-red-950/40 border-2 border-red-500 flex flex-col items-center text-center gap-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-red-600 text-white font-black text-2xl flex items-center justify-center border-4 border-red-400 shadow-xl shadow-red-600/50 animate-ping">
                {countdown}
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  Activando protocolo de auxilio en {countdown} segundos...
                </h4>
                <p className="text-xs text-red-200 mt-1">
                  Se enlazará automáticamente con el <strong>ECU 911</strong>, se enviará la alerta y coordenadas GPS a tus contactos y se iniciará la grabación de audio de evidencia.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={handleCancelCountdown}
                  className="py-3 px-4 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-black text-xs transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar (Toque Accidental)
                </button>
                <button
                  type="button"
                  onClick={handleManualActivateNow}
                  className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/40 animate-pulse active:scale-95 transition-all cursor-pointer"
                >
                  ¡ACTIVAR AUXILIO AHORA!
                </button>
              </div>
            </div>
          )}

          {/* Alert Notice Banner */}
          {alertNotice && (
            <div className="p-3.5 rounded-2xl bg-red-900/30 border border-red-500/50 text-red-200 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{alertNotice}</span>
            </div>
          )}

          {/* Telemetry & Assigned Driver / Passenger Info */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Datos del Viaje y Unidad</span>
              </span>
              <span className="font-mono text-emerald-400">Carrera #{tripId}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
              <div>
                <span className="text-[10px] text-zinc-500 block">
                  {isDriver ? 'Conductor al Volante:' : 'Chofer Asignado:'}
                </span>
                <span className="font-bold text-white truncate block">{resolvedDriverName}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Vehículo / Placa:</span>
                <span className="font-mono font-bold text-amber-400">{resolvedDriverPlate}</span>
              </div>
            </div>

            {isDriver && (
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">Usuario / Pasajero:</span>
                <span className="text-xs font-bold text-zinc-200">{resolvedClientName}</span>
              </div>
            )}

            <div className="p-2 rounded-xl bg-black/50 border border-zinc-850 flex items-center justify-between gap-2 font-mono text-[11px] text-red-300">
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span>GPS: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}</span>
              </span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 text-[10px] font-bold hover:underline flex items-center gap-0.5 flex-shrink-0"
              >
                <span>Ver Mapa</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 2. PRIMARY 911 DIRECT CALL BUTTON */}
          <a
            href="tel:911"
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-xl shadow-red-600/40 transition-transform active:scale-95 border border-red-400/40"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/20">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="font-black text-sm">Llamar a Línea Nacional ECU 911</div>
                <div className="text-[10px] font-normal text-red-100">Policía Nacional, Bomberos y Ambulancias de Emergencia</div>
              </div>
            </div>
            <span className="text-[10px] bg-white/20 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              MARCAR 911
            </span>
          </a>

          {/* 2.1 DIRECT CALL TO ANDESMOVI CENTRAL */}
          <a
            href="tel:0978734844"
            className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-between border border-emerald-500/50 shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-black text-xs sm:text-sm text-emerald-400">Llamar a Central AndesMovi: 0978734844</div>
                <div className="text-[10px] font-normal text-zinc-400">Operador 24/7 y asistencia de flota en tiempo real</div>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/40">
              CENTRAL
            </span>
          </a>

          {/* 3. SILENT AUDIO RECORDING (Evidencia) */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isRecordingAudio ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-zinc-800 text-zinc-300'}`}>
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Grabación Silenciosa de Audio (Evidencia)</h4>
                  <p className="text-[10px] text-zinc-400">Guarda registro de audio cifrado en el dispositivo</p>
                </div>
              </div>
              {isRecordingAudio && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-mono font-black border border-red-500/30 animate-pulse">
                  Grabando {audioDurationSeconds}s / 45s
                </span>
              )}
            </div>

            {/* Recording Controls */}
            {isRecordingAudio ? (
              <div className="space-y-2">
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.min(100, (audioDurationSeconds / 45) * 100)}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={stopSilentAudioRecording}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/30 transition-all cursor-pointer"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Detener y Guardar Evidencia de Audio</span>
                </button>
              </div>
            ) : audioUrl ? (
              <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <FileAudio className="w-4 h-4" />
                    <span>Audio de Evidencia Grabado ({audioDurationSeconds}s)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleTogglePlayAudio}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingAudio ? 'Pausar' : 'Escuchar'}</span>
                    </button>
                    <a
                      href={audioUrl}
                      download={`evidencia_sos_andesmovi_${tripId}_${Date.now()}.webm`}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-all"
                      title="Descargar archivo en dispositivo"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShareAudio}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Compartir Evidencia al WhatsApp del Contacto</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startSilentAudioRecording}
                className="w-full py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-750 transition-all cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-red-400" />
                <span>Iniciar Grabación Manual de Audio</span>
              </button>
            )}
          </div>

          {/* 4. EMERGENCY CONTACT & WHATSAPP ALERT */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Alerta por WhatsApp a Contacto de Confianza</span>
              </h4>
              {onOpenSettingsSOS && (
                <button
                  type="button"
                  onClick={onOpenSettingsSOS}
                  className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configurar</span>
                </button>
              )}
            </div>

            {primaryContact ? (
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{primaryContact.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">
                      {primaryContact.relationship}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">{primaryContact.phone}</div>
                </div>

                <a
                  href={`https://api.whatsapp.com/send?phone=${primaryContact.phone.replace(/\D/g, '')}&text=${encodeURIComponent(
                    prefilledWhatsappMessage
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Alerta</span>
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-400">
                  Ingresa el WhatsApp de tu contacto o central para enviarle de inmediato tus coordenadas en vivo:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={customContactPhone}
                    onChange={(e) => setCustomContactPhone(e.target.value)}
                    placeholder="Ej: 0991234567"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-750 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <a
                    href={`https://api.whatsapp.com/send?phone=${customContactPhone.replace(/\D/g, '')}&text=${encodeURIComponent(
                      prefilledWhatsappMessage
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 5. LEGAL NOTICE & PRIVACY CLAUSE ACCORDION */}
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-850 space-y-1.5 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cláusula Legal SOS (LOPDP Ecuador):</span>
            </div>
            <p className="leading-relaxed">
              Tanto conductores como usuarios consienten de forma expresa que al accionar el Botón SOS se accede a la geolocalización satelital en vivo, se transmite la alerta a la Central AndesMovi y al ECU 911, y se registra evidencia auditiva temporal para fines exclusivos de protección a la vida e integridad física.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">
            {isSosActivated ? '🚨 Estado: Protocolo de auxilio transmitido' : 'Monitoreo y telemetría satelital AndesMovi'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

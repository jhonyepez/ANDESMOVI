import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, PhoneCall, Mic, MicOff, Volume2, VolumeX, ShieldCheck, User, Radio, Wifi } from 'lucide-react';
import { pushNotificationService } from '../services/notificationService';
import { haptic } from '../utils/haptics';

export interface CallParticipant {
  name: string;
  avatar: string;
  role: 'conductor' | 'cliente';
  vehicleInfo?: string;
  phoneMasked?: string;
}

interface CallModalProps {
  participant: CallParticipant;
  isIncoming?: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  participant,
  isIncoming = false,
  onClose,
  onAccept,
}) => {
  const [callStatus, setCallStatus] = useState<'incoming' | 'calling' | 'connected'>(
    isIncoming ? 'incoming' : 'calling'
  );
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(true);

  // Audio effects handling
  useEffect(() => {
    if (callStatus === 'incoming') {
      pushNotificationService.startRingtone();
    } else {
      pushNotificationService.stopRingtone();
    }

    return () => {
      pushNotificationService.stopRingtone();
    };
  }, [callStatus]);

  // Outgoing auto-connect simulation if not incoming
  useEffect(() => {
    if (callStatus === 'calling') {
      const timer = setTimeout(() => {
        pushNotificationService.playCallConnected();
        haptic.success();
        setCallStatus('connected');
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [callStatus]);

  // Timer when connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const handleAnswerCall = () => {
    pushNotificationService.stopRingtone();
    pushNotificationService.playCallConnected();
    haptic.success();
    setCallStatus('connected');
    if (onAccept) onAccept();
  };

  const handleHangUp = () => {
    pushNotificationService.stopRingtone();
    pushNotificationService.playCallEnded();
    haptic.warning();
    onClose();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm bg-zinc-950 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className={`absolute top-0 inset-x-0 h-40 blur-3xl pointer-events-none ${
            callStatus === 'incoming'
              ? 'bg-amber-500/20'
              : callStatus === 'calling'
              ? 'bg-emerald-500/15'
              : 'bg-teal-500/15'
          }`}
        />

        {/* Security & VoIP badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 mb-6 z-10 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Voz por Internet (VoIP / WebRTC Interna)</span>
        </div>

        {/* Participant Avatar & Ring Animation */}
        <div className="relative mb-5 z-10">
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 -m-3 rounded-full bg-emerald-500/25 animate-ping" />
          )}
          {callStatus === 'incoming' && (
            <div className="absolute inset-0 -m-6 rounded-full bg-amber-500/20 animate-pulse" />
          )}
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-800 shadow-2xl relative z-10"
          />
          <div
            className={`absolute -bottom-1 -right-1 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-zinc-950 shadow-md ${
              callStatus === 'incoming'
                ? 'bg-amber-500 text-zinc-950 animate-bounce'
                : 'bg-emerald-500 text-zinc-950'
            }`}
          >
            <Phone className="w-4 h-4" />
          </div>
        </div>

        {/* Participant Name & Role */}
        <div className="z-10 mb-2">
          <h3 className="text-lg font-black text-white tracking-tight">{participant.name}</h3>
          <p className="text-xs text-emerald-400 font-semibold mt-0.5">
            {participant.role === 'conductor' ? '🚗 Conductor Asignado' : '👤 Pasajero / Cliente'}
          </p>
          {participant.vehicleInfo && (
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{participant.vehicleInfo}</p>
          )}
        </div>

        {/* Call status / timer display */}
        <div className="mt-3 mb-7 z-10">
          {callStatus === 'incoming' ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 animate-pulse">
                <Radio className="w-4 h-4 animate-spin" />
                <span>Llamada entrante por la app...</span>
              </div>
              <span className="text-[10px] text-zinc-400">Sin costo celular ni consumo de minutos</span>
            </div>
          ) : callStatus === 'calling' ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Llamando por la app...</span>
              </div>
              <span className="text-[10px] text-zinc-400">Conectando canal de audio privado</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl font-mono font-black text-white tracking-widest bg-zinc-900/80 px-3 py-1 rounded-xl border border-zinc-800 shadow-inner">
                {formatTimer(callDuration)}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Audio HD Cifrado en Vivo</span>
              </span>
            </div>
          )}
        </div>

        {/* Controls according to state */}
        <div className="w-full z-10">
          {callStatus === 'incoming' ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* RECHAZAR */}
              <button
                type="button"
                onClick={handleHangUp}
                className="py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Rechazar</span>
              </button>

              {/* CONTESTAR */}
              <button
                type="button"
                onClick={handleAnswerCall}
                className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Contestar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5 w-full">
              {/* Connected Controls: Mute & Speaker */}
              {callStatus === 'connected' && (
                <div className="grid grid-cols-2 gap-3 w-full">
                  {/* Mute Button */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.tap();
                      setIsMuted((prev) => !prev);
                    }}
                    className={`py-3 px-3 rounded-2xl border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    <span className="text-[10px] font-bold">{isMuted ? 'Silenciado' : 'Micrófono'}</span>
                  </button>

                  {/* Speaker Button */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.tap();
                      setIsSpeaker((prev) => !prev);
                    }}
                    className={`py-3 px-3 rounded-2xl border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      isSpeaker
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
                    }`}
                  >
                    {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    <span className="text-[10px] font-bold">{isSpeaker ? 'Altavoz Activo' : 'Auricular'}</span>
                  </button>
                </div>
              )}

              {/* Colgar / Finalizar llamada */}
              <button
                type="button"
                onClick={handleHangUp}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{callStatus === 'calling' ? 'Cancelar Llamada' : 'Finalizar Llamada'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;

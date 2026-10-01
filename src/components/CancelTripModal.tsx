import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface CancelTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string, customNote?: string) => void;
  isDriver?: boolean;
}

const CLIENT_CANCELLATION_REASONS = [
  'El conductor tardó demasiado en llegar / Retraso',
  'Cambié de planes / Ya no necesito el viaje',
  'El conductor me pidió cancelar',
  'Dirección de origen o destino incorrecta',
  'Problema de pago o tarifa',
  'Otro motivo personal',
];

const DRIVER_CANCELLATION_REASONS = [
  'El pasajero no se presentó o no responde',
  'Problema con la dirección o zona de recogida inaccesible',
  'Emergencia personal o mecánica',
  'Pasajero con equipaje o bultos no declarados',
  'Cambio de planes del usuario',
  'Otro motivo operativo',
];

export const CancelTripModal: React.FC<CancelTripModalProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  isDriver = false,
}) => {
  const reasons = isDriver ? DRIVER_CANCELLATION_REASONS : CLIENT_CANCELLATION_REASONS;
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0]);
  const [customNote, setCustomNote] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    haptic.warning();
    onConfirmCancel(selectedReason, customNote.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-zinc-100 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Cancelar Viaje</h3>
              <p className="text-xs text-zinc-400">
                {isDriver ? 'Selecciona el motivo de la cancelación' : '¿Por qué deseas cancelar este viaje?'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Notice */}
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
          ⚠️ La cancelación limpiará la ruta activa del mapa y devolverá a ambas partes a sus estados de espera o búsqueda inicial.
        </div>

        {/* Reasons Radio Group */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {reasons.map((reason, idx) => (
            <label
              key={idx}
              onClick={() => {
                haptic.tap();
                setSelectedReason(reason);
              }}
              className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                selectedReason === reason
                  ? 'bg-rose-500/15 border-rose-500/50 text-white font-bold ring-1 ring-rose-500/30'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    selectedReason === reason
                      ? 'border-rose-400 bg-rose-500 text-zinc-950 font-black text-[10px]'
                      : 'border-zinc-600 bg-zinc-900'
                  }`}
                >
                  {selectedReason === reason && '✓'}
                </div>
                <span>{reason}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Optional Custom Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
            Comentarios adicionales (Opcional)
          </label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Escribe detalles adicionales..."
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
          >
            No, mantener viaje
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            Sí, cancelar viaje
          </button>
        </div>
      </div>
    </div>
  );
};

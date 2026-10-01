import React from 'react';
import { ScheduledBooking } from '../types';
import { formatCurrency } from '../utils/geoUtils';
import { Calendar, Clock, MapPin, Car, Bike, ShoppingBag, Package, Trash2, CheckCircle2, AlertCircle, X, Bell } from 'lucide-react';

interface ScheduledBookingsModalProps {
  bookings: ScheduledBooking[];
  onCancelBooking: (id: string) => void;
  onStartBookingNow: (booking: ScheduledBooking) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const ScheduledBookingsModal: React.FC<ScheduledBookingsModalProps> = ({
  bookings,
  onCancelBooking,
  onStartBookingNow,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Mis Reservas Programadas</h3>
              <p className="text-[11px] text-zinc-400">Viajes y entregas agendadas en Ecuador (USD)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
          {bookings.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No tienes viajes programados</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Puedes agendar tus viajes al aeropuerto, citas médicas o entregas con fecha y hora específicas.
                </p>
              </div>
            </div>
          ) : (
            bookings.map((b) => {
              const isViaje = b.serviceType === 'viaje';
              const isDomicilio = b.serviceType === 'domicilio';
              const isEncomienda = b.serviceType === 'encomienda';

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col gap-3"
                >
                  {/* Status & Service tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                        {isViaje ? (
                          <Car className="w-4 h-4" />
                        ) : isDomicilio ? (
                          <ShoppingBag className="w-4 h-4" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <span className="text-xs font-black text-white capitalize">
                          {b.serviceType === 'viaje' ? 'Viaje Programado' : b.serviceType === 'domicilio' ? 'Entrega Programada' : 'Encomienda Programada'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Reserva confirmada</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {formatCurrency(b.offeredPrice)}
                      </span>
                      <span className="text-[9px] text-zinc-500 block">Tarifa pactada</span>
                    </div>
                  </div>

                  {/* Scheduled Date & Time Badge */}
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">{b.scheduledDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold text-white">{b.scheduledTime}</span>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="flex flex-col gap-1.5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="truncate"><strong>Desde:</strong> {b.origin.name || b.origin.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="truncate"><strong>Hacia:</strong> {b.destination.name || b.destination.address}</span>
                    </div>
                  </div>

                  {/* Driver alert status */}
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Conductores cercanos serán notificados con anticipación.</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                    <button
                      onClick={() => onStartBookingNow(b)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-colors"
                    >
                      Iniciar Servicio Ahora
                    </button>
                    <button
                      onClick={() => onCancelBooking(b.id)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 hover:border-rose-800 border border-zinc-700 transition-colors"
                      title="Cancelar reserva"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

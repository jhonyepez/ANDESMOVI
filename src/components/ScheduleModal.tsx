import React, { useState } from 'react';
import { Coordinates, ServiceType, ScheduledBooking } from '../types';
import { formatCurrency } from '../utils/geoUtils';
import {
  Calendar,
  Clock,
  Car,
  Bike,
  Package,
  ShoppingBag,
  CheckCircle2,
  Bell,
  X,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ScheduleModalProps {
  serviceType: ServiceType;
  origin: Coordinates;
  destination: Coordinates | null;
  basePrice: number;
  onConfirmSchedule: (booking: Omit<ScheduledBooking, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  serviceType,
  origin,
  destination,
  basePrice,
  onConfirmSchedule,
  onClose,
  isDark = true,
}) => {
  // Tomorrow's date default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState<string>('08:30');
  const [vehicleType, setVehicleType] = useState<'auto' | 'moto' | 'confort'>('auto');
  const [offeredPrice, setOfferedPrice] = useState<number>(basePrice);
  const [showDiscountLimitNotice, setShowDiscountLimitNotice] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(30);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const tarifaSugerida = basePrice || 1.50;
  const descuentoMaximo = 0.25;
  const tarifaMinimaPermitida = Number(Math.max(0.50, tarifaSugerida - descuentoMaximo).toFixed(2));

  // Quick date presets
  const todayStr = new Date().toISOString().split('T')[0];
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  // Quick time presets
  const timePresets = ['07:30', '08:30', '13:00', '17:45', '19:30', '21:00'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) {
      alert('Por favor selecciona un punto de destino antes de programar.');
      return;
    }

    const bookingData: Omit<ScheduledBooking, 'id' | 'createdAt'> = {
      serviceType,
      origin,
      destination,
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
      offeredPrice,
      vehicleType,
      notes: notes ? `${notes} (Aviso con ${reminderMinutes} min de anticipación)` : `Aviso con ${reminderMinutes} min de anticipación`,
      status: 'confirmada',
    };

    setIsSuccess(true);
    setTimeout(() => {
      onConfirmSchedule(bookingData);
    }, 1200);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in ${isDark ? 'bg-black/80' : 'bg-slate-900/60'}`}>
      <div className={`w-full max-w-lg border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Programar {serviceType === 'viaje' ? 'Viaje' : serviceType === 'domicilio' ? 'Entrega' : 'Encomienda'}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Reserva con anticipación en dólares (Ecuador)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Route Summary */}
              <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Origen:</span>
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{origin.name || origin.address}</p>
                  </div>
                </div>
                <div className={`flex items-start gap-2 text-xs pt-1 border-t ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`}>
                  <MapPin className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <div>
                    <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Destino:</span>
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {destination ? (destination.name || destination.address) : 'No seleccionado en mapa'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="flex flex-col gap-2">
                <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    Fecha del Servicio
                  </span>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{selectedDate}</span>
                </div>

                {/* Quick Date Chips */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Hoy', value: todayStr },
                    { label: 'Mañana', value: defaultDateStr },
                    { label: 'En 2 días', value: dayAfterTomorrowStr }
                  ].map((date) => (
                    <button
                      key={date.value}
                      type="button"
                      onClick={() => setSelectedDate(date.value)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedDate === date.value
                          ? isDark ? 'bg-emerald-500 text-zinc-950 border-emerald-500 font-bold' : 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : isDark ? 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {date.label}
                    </button>
                  ))}
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  min={todayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`border text-xs p-2.5 rounded-xl focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              {/* Time Selection */}
              <div className="flex flex-col gap-2">
                <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    Hora de Recogida / Entrega
                  </span>
                  <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{selectedTime}</span>
                </div>

                {/* Quick Time Slots */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {timePresets.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                        selectedTime === t
                          ? isDark ? 'bg-emerald-500 text-zinc-950 border-emerald-500 font-bold' : 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : isDark ? 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={`border text-xs p-2.5 rounded-xl focus:outline-none font-mono transition-colors ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              {/* Vehicle Type (if ride) */}
              {serviceType === 'viaje' && (
                <div className="flex flex-col gap-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Tipo de Vehículo</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'auto', label: 'Auto', icon: Car },
                      { id: 'moto', label: 'Moto', icon: Bike },
                      { id: 'confort', label: 'Confort', icon: Sparkles }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setVehicleType(type.id as any)}
                        className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          vehicleType === type.id
                            ? isDark ? 'bg-emerald-500 text-zinc-950 border-emerald-500 font-bold' : 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : isDark ? 'bg-zinc-950 text-zinc-300 border-zinc-800' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        <type.icon className="w-3.5 h-3.5" />
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Offer in USD */}
              <div className="flex flex-col gap-2">
                <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span>Tu Oferta de Tarifa Programada (USD)</span>
                  <span className={`font-black text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(offeredPrice)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={offeredPrice <= tarifaMinimaPermitida}
                    onClick={() => setOfferedPrice((prev) => {
                      const next = Number((prev - 0.25).toFixed(2));
                      if (next < tarifaMinimaPermitida) {
                        setShowDiscountLimitNotice(true);
                        setTimeout(() => setShowDiscountLimitNotice(false), 3500);
                        return tarifaMinimaPermitida;
                      }
                      return next;
                    })}
                    className={`p-2 rounded-xl font-bold text-xs transition-colors ${
                      offeredPrice <= tarifaMinimaPermitida
                        ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
                        : isDark
                        ? 'bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'
                    }`}
                    title={offeredPrice <= tarifaMinimaPermitida ? `Piso alcanzado: $${tarifaMinimaPermitida.toFixed(2)}` : "Bajar $0.25"}
                  >
                    -$0.25
                  </button>
                  <input
                    type="number"
                    step="0.25"
                    min={tarifaMinimaPermitida}
                    value={offeredPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) return;
                      if (val < tarifaMinimaPermitida) {
                        setOfferedPrice(tarifaMinimaPermitida);
                        setShowDiscountLimitNotice(true);
                        setTimeout(() => setShowDiscountLimitNotice(false), 3500);
                      } else {
                        setOfferedPrice(Number(val.toFixed(2)));
                      }
                    }}
                    className={`flex-1 border text-center font-mono font-bold text-sm p-2 rounded-xl transition-colors ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-emerald-400' 
                        : 'bg-slate-50 border-slate-200 text-emerald-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setOfferedPrice((prev) => Number((prev + 0.25).toFixed(2)))}
                    className={`p-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Subir $0.25"
                  >
                    +$0.25
                  </button>
                </div>

                {showDiscountLimitNotice && (
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in">
                    <span>⚠️</span>
                    <span>El descuento máximo permitido es de $0.25 respecto al precio sugerido (Piso: ${tarifaMinimaPermitida.toFixed(2)} USD).</span>
                  </div>
                )}
              </div>

              {/* Deposit Banner Guarantee */}
              <div className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${
                isDark ? 'bg-blue-950/40 border-blue-500/40 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Garantía con Depósito ($10.00 USD)
                  </span>
                </div>
                <p className="text-[11px] leading-tight opacity-90">
                  Para asegurar la asignación de la unidad en la fecha y hora seleccionada, realiza tu abono de <strong>$10.00 USD</strong> a la cuenta oficial de la empresa (Banco Pichincha #2207472368, Banco Guayaquil #47801405, Produbanco o Austro).
                </p>
              </div>

              {/* Advance Notification Protocol */}
              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <Bell className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <span className={`font-bold block mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Notificación Anticipada a Conductores</span>
                  El sistema notificará a conductores y repartidores con{' '}
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                    className={`px-1.5 py-0.5 rounded font-bold border ${
                      isDark 
                        ? 'bg-zinc-900 border-emerald-500/40 text-emerald-300' 
                        : 'bg-white border-emerald-300 text-emerald-700'
                    }`}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora</option>
                  </select>{' '}
                  de anticipación para asegurar tu recogida puntual sin retrasos.
                </div>
              </div>

              {/* Notes */}
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones para el conductor (ej: viaje con maletas al aeropuerto)"
                className={`border text-xs p-2.5 rounded-xl focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                }`}
              />

              {/* Action Button */}
              <button
                type="submit"
                className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-2 ${
                  isDark 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                }`}
              >
                <span>Confirmar Reserva Programada ({formatCurrency(offeredPrice)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-in zoom-in-95">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>¡Reserva Confirmada Exitosamente!</h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Programado para el {selectedDate} a las {selectedTime}
                </p>
              </div>
              <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>Conductores cercanos recibirán tu solicitud con anticipación.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

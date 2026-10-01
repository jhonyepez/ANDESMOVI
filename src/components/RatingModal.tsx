import React, { useState } from 'react';
import { TripRequest, TripRating } from '../types';
import { formatCurrency } from '../utils/geoUtils';
import {
  Star,
  Sparkles,
  Heart,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Award,
  ThumbsUp,
  Printer,
  Receipt,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParcelReceiptModal } from './ParcelReceiptModal';

interface RatingModalProps {
  trip: TripRequest;
  onSubmitRating: (passengerRating: TripRating, driverRating: TripRating) => void;
  onClose: () => void;
  isDark?: boolean;
}

const RATING_TAGS = [
  '🚗 Auto limpio y climatizado',
  '🛡️ Conducción prudente y segura',
  '⚡ Llegó puntual al punto',
  '🎵 Excelente música y ambiente',
  '💬 Trato amable y respetuoso',
  '🗺️ Conoce las mejores rutas de Quito',
];

const TIP_OPTIONS = [0, 0.50, 1.00, 2.00];

export const RatingModal: React.FC<RatingModalProps> = ({
  trip,
  onSubmitRating,
  onClose,
}) => {
  const driver = trip.selectedDriver;
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '🛡️ Conducción prudente y segura',
    '⚡ Llegó puntual al punto',
  ]);
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  const starLabels: Record<number, string> = {
    1: 'Mala experiencia',
    2: 'Regular',
    3: 'Bueno',
    4: 'Muy bueno',
    5: '¡Excelente viaje!',
  };

  // Percentage-based tips based on trip offeredPrice (10%, 15%, 20%)
  const baseTripPrice = trip.offeredPrice || 3.50;
  const isInterprovincial = trip.isInterprovincial || trip.distanceKm > 20;
  const isEncomienda = trip.serviceType === 'encomienda' || trip.parcelDetails !== undefined || trip.id.includes('parcel') || String(trip.serviceType).includes('encomienda');
  const isInterprovincialEncomienda = isInterprovincial && isEncomienda;
  const passengerCount = trip.passengerCount || (isInterprovincial ? 4 : 1);
  const commissionAmount = isInterprovincialEncomienda
    ? Number((baseTripPrice * 0.09).toFixed(2))
    : trip.commissionPerPassengerUsd !== undefined
    ? Number((trip.commissionPerPassengerUsd * passengerCount).toFixed(2))
    : isInterprovincial
    ? Number((1.00 * passengerCount).toFixed(2))
    : Number((baseTripPrice * 0.07).toFixed(2));
  const netDriverAmount = Number((baseTripPrice - commissionAmount).toFixed(2));
  const tip10 = Number((baseTripPrice * 0.10).toFixed(2));
  const tip15 = Number((baseTripPrice * 0.15).toFixed(2));
  const tip20 = Number((baseTripPrice * 0.20).toFixed(2));

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    // Passenger rating
    const passengerRating: TripRating = {
      stars,
      tags: selectedTags,
      tipUsd: selectedTip,
      feedback: feedback.trim(),
      createdAt: Date.now(),
    };

    // Reciprocal driver rating to passenger
    const driverRating: TripRating = {
      stars: 5,
      tags: ['Pasajero puntual', 'Excelente comunicación', 'Trato cordial'],
      feedback: '¡Excelente pasajero! Todo en orden.',
      createdAt: Date.now(),
    };

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    setIsSubmitted(true);

    setTimeout(() => {
      onSubmitRating(passengerRating, driverRating);
    }, 1600);
  };

  if (!driver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {isSubmitted ? (
          <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-white">¡Calificación Enviada!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Tu reseña ayuda a mantener la comunidad de AndesMovi segura y de alta calidad.
            </p>

            {/* Mutual Rating Feedback Preview */}
            <div className="mt-6 w-full p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{driver.name} también te calificó:</span>
              </div>
              <p className="text-xs text-zinc-300">
                ⭐⭐⭐⭐⭐ "Pasajero puntual y muy cordial. ¡Un gusto viajar juntos!"
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Calificación Mutua del Viaje</span>
              </div>
              <h3 className="text-lg font-black text-white">¿Cómo estuvo tu viaje?</h3>
              <p className="text-xs text-zinc-400">
                Tarifa pagada: <strong className="text-white font-mono">{formatCurrency(trip.offeredPrice)}</strong>
              </p>
            </div>

            {/* Driver Profile */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
              <img
                src={driver.avatar || null}
                alt={driver.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/40"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-white truncate">{driver.name}</h4>
                <p className="text-xs text-zinc-400">
                  {driver.vehicle.model} • <span className="font-mono text-zinc-300">{driver.vehicle.plate}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">Ruta completada</span>
                <span className="text-xs font-bold text-emerald-400">En destino</span>
              </div>
            </div>

            {/* Desglose Transparente de Costos y Comisión AndesMovi */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex flex-col gap-2.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Desglose del Costo del Servicio
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Transparencia Total
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-400">Monto Base Carrera:</span>
                  <span className="font-mono font-black text-white">{formatCurrency(baseTripPrice)} USD</span>
                </div>
                <div className="flex justify-between items-center text-zinc-300 pt-1 border-t border-zinc-800">
                  <span className="text-zinc-300 font-bold">Monto Total Servicio:</span>
                  <span className="font-mono font-black text-emerald-400">{formatCurrency(baseTripPrice)} USD</span>
                </div>
                <div className="flex justify-between items-center text-amber-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Comisión AndesMovi {isInterprovincial ? `($1.00 x ${passengerCount} pas.)` : '(7%)'}:
                  </span>
                  <span className="font-mono font-bold">-{formatCurrency(commissionAmount)} USD</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400 pt-1.5 border-t border-zinc-800/80 font-bold">
                  <span>Monto Neto Conductor:</span>
                  <span className="font-mono text-xs">{formatCurrency(netDriverAmount)} USD</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 text-center">
                Monto total del servicio y, por separado, la comisión cobrada por AndesMovi {isInterprovincial ? '($1.00 por pasajero)' : '(7%)'} para garantizar total transparencia en tu transacción.
              </p>
            </div>

            {/* Star Rating Selector */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const activeStars = hoverStars || stars;
                  const isFilled = starValue <= activeStars;

                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setStars(starValue)}
                      onMouseEnter={() => setHoverStars(starValue)}
                      onMouseLeave={() => setHoverStars(0)}
                      className="p-1 text-zinc-600 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-amber-400">
                {starLabels[hoverStars || stars]}
              </span>
            </div>

            {/* Compliment Tags */}
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-2">
                ¿Qué fue lo más destacable?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RATING_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Percentage-based Tip in USD (10%, 15%, 20%) */}
            <div>
              <label className="text-[11px] font-bold text-zinc-400 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Agregar propina para el conductor
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  100% para el conductor
                </span>
              </label>

              {/* Percentage Buttons: 0%, 10%, 15%, 20% */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { percent: 0, label: '0%', amount: 0, sub: 'Sin propina' },
                  { percent: 10, label: '10%', amount: tip10, sub: `+$${tip10.toFixed(2)}` },
                  { percent: 15, label: '15%', amount: tip15, sub: `+$${tip15.toFixed(2)}` },
                  { percent: 20, label: '20%', amount: tip20, sub: `+$${tip20.toFixed(2)}` },
                ].map((opt) => {
                  const isSelected = selectedTip === opt.amount;
                  return (
                    <button
                      key={opt.percent}
                      type="button"
                      onClick={() => setSelectedTip(opt.amount)}
                      className={`p-2.5 rounded-2xl text-center border transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-lg shadow-amber-400/20 font-black'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-black">{opt.label}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-400'}`}>
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedTip > 0 && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-amber-200 font-medium">Propina adicional agregada:</span>
                  </div>
                  <span className="font-mono font-black text-amber-400">+{formatCurrency(selectedTip)} USD</span>
                </div>
              )}
            </div>

            {/* Optional Written Feedback */}
            <div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escribe un comentario opcional sobre el servicio..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-2xl focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col gap-2 pt-2">
              {trip.serviceType === 'encomienda' && trip.parcelDetails && (
                <button
                  type="button"
                  id="btn-print-receipt-from-rating"
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprobante Oficial de Encomienda</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Calificar Conductor</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Omitir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Imprimir Comprobante */}
        {showReceiptModal && (
          <ParcelReceiptModal
            trip={trip}
            onClose={() => setShowReceiptModal(false)}
          />
        )}
      </div>
    </div>
  );
};

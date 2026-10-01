import React, { useState } from 'react';
import { TripHistoryItem, ServiceType, Coordinates } from '../types';
import { formatCurrency } from '../utils/geoUtils';
import {
  X,
  History,
  Car,
  ShoppingBag,
  Package,
  Calendar,
  MapPin,
  Star,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Printer,
  RotateCcw,
  FileText,
  Search,
  ChevronRight,
} from 'lucide-react';
import { ParcelReceiptModal } from './ParcelReceiptModal';

interface TripHistoryModalProps {
  history: TripHistoryItem[];
  onRepeatTrip: (origin: Coordinates, destination: Coordinates, serviceType: ServiceType) => void;
  onClose: () => void;
  isDark?: boolean;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({
  history,
  onRepeatTrip,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | ServiceType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceiptTrip, setSelectedReceiptTrip] = useState<TripHistoryItem | null>(null);

  // Filter items
  const filteredHistory = history.filter((item) => {
    if (filter !== 'all' && item.serviceType !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const originName = (item.origin.name || item.origin.address || '').toLowerCase();
      const destName = (item.destination.name || item.destination.address || '').toLowerCase();
      const driverName = item.driver.name.toLowerCase();
      const plate = item.driver.vehicle.plate.toLowerCase();
      return (
        originName.includes(q) ||
        destName.includes(q) ||
        driverName.includes(q) ||
        plate.includes(q)
      );
    }
    return true;
  });

  // Summary Metrics
  const totalSpent = history.reduce((acc, curr) => acc + curr.priceUsd, 0);
  const totalTips = history.reduce((acc, curr) => acc + (curr.tipUsd || 0), 0);
  const completedCount = history.filter((i) => i.status === 'completado').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                <span>Historial de Solicitudes</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  🇪🇨 Ecuador
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Consulta tus viajes, domicilios y encomiendas anteriores con comprobantes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-zinc-950 border-b border-zinc-800 text-center">
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Solicitudes</span>
            <span className="text-base sm:text-lg font-black text-white">{completedCount}</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Inversión Total</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(totalSpent)} USD
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Propinas Conductor</span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
              {formatCurrency(totalTips)} USD
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Calificación Cliente</span>
            <span className="text-base sm:text-lg font-black text-amber-400 flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>4.95</span>
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Service Category Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                filter === 'all'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Todos ({history.length})
            </button>
            <button
              onClick={() => setFilter('viaje')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                filter === 'viaje'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Viajes</span>
            </button>
            <button
              onClick={() => setFilter('domicilio')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                filter === 'domicilio'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Domicilios</span>
            </button>
            <button
              onClick={() => setFilter('encomienda')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                filter === 'encomienda'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Encomiendas</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por lugar o conductor..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-300">No se encontraron solicitudes</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Prueba cambiando los filtros o solicita un nuevo viaje o encomienda.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isViaje = item.serviceType === 'viaje';
              const isDomicilio = item.serviceType === 'domicilio';
              const isEncomienda = item.serviceType === 'encomienda';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col gap-3 group"
                >
                  {/* Top Bar: Service Badge, Date, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                          isViaje
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isDomicilio
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {isViaje && <Car className="w-3 h-3" />}
                        {isDomicilio && <ShoppingBag className="w-3 h-3" />}
                        {isEncomienda && <Package className="w-3 h-3" />}
                        <span className="capitalize">{item.serviceType}</span>
                      </span>

                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completado
                      </span>
                      {(item.tipUsd || 0) > 0 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          +{formatCurrency(item.tipUsd!)} propina
                        </span>
                      )}
                      <span className="text-sm font-black text-white font-mono">
                        {formatCurrency(item.priceUsd + (item.tipUsd || 0))} USD
                      </span>
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Origen</span>
                        <p className="text-zinc-200 font-medium truncate">
                          {item.origin.name || item.origin.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400 flex-shrink-0 mt-1" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Destino</span>
                        <p className="text-zinc-200 font-medium truncate">
                          {item.destination.name || item.destination.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Card & Rating */}
                  <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.driver.avatar || null}
                        alt={item.driver.name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{item.driver.name}</h5>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {item.driver.vehicle.model} •{' '}
                          <span className="font-mono text-amber-400 font-bold">
                            {item.driver.vehicle.plate}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      {item.starsGiven ? (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(item.starsGiven)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Sin calificar</span>
                      )}
                      <span className="text-[10px] text-zinc-400 uppercase font-mono mt-0.5">
                        Pago: {item.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedReceiptTrip(item)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ver Comprobante</span>
                    </button>

                    <button
                      onClick={() => {
                        onRepeatTrip(item.origin, item.destination, item.serviceType);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pedir de Nuevo</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Embedded Comprobante / Recibo Modal */}
      {selectedReceiptTrip && (
        <ParcelReceiptModal
          trip={{
            id: selectedReceiptTrip.id,
            serviceType: selectedReceiptTrip.serviceType,
            origin: selectedReceiptTrip.origin,
            destination: selectedReceiptTrip.destination,
            offeredPrice: selectedReceiptTrip.priceUsd,
            suggestedPrice: selectedReceiptTrip.priceUsd,
            distanceKm: 4.5,
            estimatedMinutes: 15,
            vehicleType: selectedReceiptTrip.driver.vehicle.type === 'moto' ? 'moto' : 'auto',
            status: 'completed',
            selectedDriver: selectedReceiptTrip.driver,
            paymentMethod: selectedReceiptTrip.paymentMethod,
            paymentStatus: 'paid',
            createdAt: selectedReceiptTrip.timestamp,
            parcelDetails: selectedReceiptTrip.parcelDetails,
            restaurantName: selectedReceiptTrip.restaurantName,
          }}
          onClose={() => setSelectedReceiptTrip(null)}
        />
      )}
    </div>
  );
};

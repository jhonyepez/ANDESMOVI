import React, { useState } from 'react';
import {
  Car,
  Phone,
  CheckCircle2,
  XCircle,
  Search,
  DollarSign,
  AlertCircle,
  User,
  Radio,
  Plus,
  X,
  Send,
  Trash2,
} from 'lucide-react';
import { AdminActiveTrip, AdminTripStatus } from '../../types';
import { formatCurrency } from '../../utils/geoUtils';
import { ECUADOR_COOPERATIVAS, ECUADOR_TERMINALES } from '../../services/databaseService';

interface AdminActiveRidesViewProps {
  trips: AdminActiveTrip[];
  onUpdateTripStatus: (tripId: string, status: AdminTripStatus) => void;
  onOpenFareCalculator?: () => void;
  onDispatchManualTrip?: (tripData: Partial<AdminActiveTrip>) => void;
  onDeleteTrip?: (tripId: string) => void;
  onClearFinishedTrips?: () => void;
  onClearAllTrips?: () => void;
  isDark?: boolean;
}

export const AdminActiveRidesView: React.FC<AdminActiveRidesViewProps> = ({
  trips,
  onUpdateTripStatus,
  onOpenFareCalculator,
  onDispatchManualTrip,
  onDeleteTrip,
  onClearFinishedTrips,
  onClearAllTrips,
  isDark = true,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | AdminTripStatus>('todos');
  const [cooperativaFilter, setCooperativaFilter] = useState<string>('todos');
  const [terminalFilter, setTerminalFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Manual Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [manualPassenger, setManualPassenger] = useState('Cliente Central');
  const [manualPhone, setManualPhone] = useState('+593 99 123 4567');
  const [manualOrigin, setManualOrigin] = useState('Terminal Terrestre Tulcán');
  const [manualDestination, setManualDestination] = useState('Parque Central Tulcán');
  const [manualPrice, setManualPrice] = useState('1.50');
  const [manualVehicleType, setManualVehicleType] = useState<'auto' | 'moto' | 'camioneta'>('auto');

  // Cancel Confirmation State
  const [confirmCancelTripId, setConfirmCancelTripId] = useState<string | null>(null);

  // Filtrado reactivo de carreras
  const filteredTrips = trips.filter((trip) => {
    if (statusFilter !== 'todos' && trip.status !== statusFilter) return false;
    if (cooperativaFilter !== 'todos' && trip.cooperativaName !== cooperativaFilter) return false;
    if (terminalFilter !== 'todos' && trip.terminalName !== terminalFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = trip.tripCode.toLowerCase().includes(q);
      const matchPass = trip.passengerName.toLowerCase().includes(q);
      const matchDriver = trip.assignedDriverName?.toLowerCase().includes(q) || false;
      const matchPlate = trip.vehiclePlate?.toLowerCase().includes(q) || false;
      const matchUnit = trip.assignedUnitNumber?.toLowerCase().includes(q) || false;
      if (!matchCode && !matchPass && !matchDriver && !matchPlate && !matchUnit) return false;
    }
    return true;
  });

  const countEnCurso = trips.filter((t) => t.status === 'en_curso').length;
  const countPendiente = trips.filter((t) => t.status === 'pendiente').length;
  const countFinalizado = trips.filter((t) => t.status === 'finalizado').length;

  const handleFinishTrip = (tripId: string) => {
    onUpdateTripStatus(tripId, 'finalizado');
    setActionSuccessMessage(`Carrera ${tripId} finalizada y liquidada correctamente.`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleExecuteCancelTrip = (tripId: string) => {
    onUpdateTripStatus(tripId, 'cancelado');
    setConfirmCancelTripId(null);
    setActionSuccessMessage(`Carrera ${tripId} cancelada administrativamente.`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleCreateManualTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrigin.trim() || !manualDestination.trim()) return;

    const price = parseFloat(manualPrice) || 1.25;
    const newTripData: Partial<AdminActiveTrip> = {
      id: `TRP-MANUAL-${Date.now().toString().slice(-4)}`,
      tripCode: `VIAJE-M-${Date.now().toString().slice(-4)}`,
      serviceType: 'viaje',
      passengerName: manualPassenger.trim() || 'Cliente Central',
      passengerPhone: manualPhone.trim() || '+593 99 123 4567',
      originAddress: manualOrigin.trim(),
      destinationAddress: manualDestination.trim(),
      distanceKm: 2.5,
      durationMinutes: 7,
      status: 'pendiente',
      paymentMethod: 'efectivo',
      paymentStatus: 'pendiente',
      cooperativaName: 'Cooperativa Rápido Nacional',
      terminalName: 'Terminal Terrestre Tulcán',
      fareBreakdown: {
        baseFareUsd: 1.25,
        coveredKm: 2.7,
        extraKm: 0,
        extraKmRateUsd: 0.35,
        totalFareUsd: price,
      },
      createdAt: Date.now(),
      createdFormatted: 'Ahora',
    };

    if (onDispatchManualTrip) {
      onDispatchManualTrip(newTripData);
    }
    setShowDispatchModal(false);
    setActionSuccessMessage(`¡Carrera manual para ${newTripData.passengerName} despachada al radar exitosamente!`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Encabezado */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
        isDark ? 'border-zinc-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              MONITOREO DE CARRERAS ACTIVAS EN VIVO
            </h3>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tiempo Real</span>
            </span>
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            Supervisión de viajes urbanos e intercantonales • Tarifa oficial: <strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>$1.25 cubre hasta 2.7 km</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onDispatchManualTrip && (
            <button
              type="button"
              onClick={() => setShowDispatchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Despachar Carrera Manual</span>
            </button>
          )}

          {onOpenFareCalculator && (
            <button
              type="button"
              onClick={onOpenFareCalculator}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                isDark 
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50' 
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span>Calculadora ($1.25 / 2.7 km)</span>
            </button>
          )}

          {onClearAllTrips && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Seguro que deseas eliminar todas las tarjetas de carreras activas y dejar en CERO el monitor?')) {
                  onClearAllTrips();
                  setActionSuccessMessage('Se han eliminado todas las tarjetas de carreras. Monitor en cero.');
                  setTimeout(() => setActionSuccessMessage(null), 3000);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Eliminar todas las tarjetas y dejar en cero"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Dejar en Cero</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            En Curso (Pasajero a bordo)
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-500 font-mono">{countEnCurso}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Car className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Pendientes de Chofer
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-amber-500 font-mono">{countPendiente}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
            }`}>
              <Radio className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Finalizadas Hoy
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-sky-500 font-mono">{countFinalizado}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Tarifa Base Nacional
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xl font-black font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>$1.25 USD</span>
            <span className={`text-[10px] font-bold ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}>Hasta 2.7 km</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros por Cooperativa, Terminal, Estado y Búsqueda */}
      <div className={`p-4 rounded-2xl border space-y-3 shadow-sm ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar carrera, placa, chofer..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-750 text-white focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-750 text-white focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            >
              <option value="todos">Todos los Estados ({trips.length})</option>
              <option value="en_curso">En Curso ({countEnCurso})</option>
              <option value="pendiente">Pendientes ({countPendiente})</option>
              <option value="finalizado">Finalizados ({countFinalizado})</option>
            </select>
          </div>

          {/* Filtro Cooperativa */}
          <div>
            <select
              value={cooperativaFilter}
              onChange={(e) => setCooperativaFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-750 text-white focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            >
              <option value="todos">Todas las Cooperativas</option>
              {ECUADOR_COOPERATIVAS.map((coop) => (
                <option key={coop} value={coop}>
                  {coop}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Terminal */}
          <div>
            <select
              value={terminalFilter}
              onChange={(e) => setTerminalFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-750 text-white focus:border-amber-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            >
              <option value="todos">Todos los Terminales</option>
              {ECUADOR_TERMINALES.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Finished / Cancelled Trips Quick Action */}
        {onClearFinishedTrips && trips.filter((t) => t.status === 'finalizado' || t.status === 'cancelado').length > 0 && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas eliminar del registro todas las carreras finalizadas y canceladas?')) {
                  onClearFinishedTrips();
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-400'
              }`}
              title="Eliminar todas las carreras finalizadas o canceladas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Carreras Finalizadas ({trips.filter((t) => t.status === 'finalizado' || t.status === 'cancelado').length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Listado de Carreras Activas */}
      <div className="space-y-3.5">
        {filteredTrips.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border-2 border-dashed ${
            isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-300 text-slate-500 shadow-xs'
          }`}>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Car className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              🟢 MONITOR EN VIVO EN CERO (0) CARRERAS ACTIVAS
            </h4>
            <p className={`text-xs mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              No existen tarjetas de carreras activas en este momento. El sistema está limpio y listo para recibir nuevas solicitudes.
            </p>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const isEnCurso = trip.status === 'en_curso';
            const isPendiente = trip.status === 'pendiente';

            return (
              <div
                key={trip.id}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-md ${
                  isDark ? 'bg-zinc-900' : 'bg-white'
                } ${
                  isEnCurso
                    ? (isDark ? 'border-emerald-500/60 shadow-emerald-500/5' : 'border-emerald-400 shadow-emerald-50')
                    : isPendiente
                    ? (isDark ? 'border-amber-500/60 shadow-amber-500/5' : 'border-amber-400 shadow-amber-50')
                    : (isDark ? 'border-zinc-800 opacity-90' : 'border-slate-200 opacity-90')
                }`}
              >
                {/* Cabecera de la carrera */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-sm font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.tripCode}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        isEnCurso
                          ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                          : isPendiente
                          ? (isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300')
                          : (isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300')
                      }`}
                    >
                      {trip.status === 'en_curso'
                        ? 'En Curso (A bordo)'
                        : trip.status === 'pendiente'
                        ? 'Buscando Conductor'
                        : trip.status === 'finalizado'
                        ? 'Completado'
                        : 'Cancelado'}
                    </span>
                    <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{trip.createdFormatted}</span>
                  </div>

                  {/* Tarifa Oficial Desglosada */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                    isDark ? 'bg-black/40 border-zinc-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Tarifa:</span>
                    <span className="text-base font-black text-emerald-500 font-mono">
                      {formatCurrency(trip.fareBreakdown.totalFareUsd)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      isDark ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : 'text-amber-800 bg-amber-100 border-amber-300'
                    }`}>
                      {trip.distanceKm <= 2.7
                        ? '$1.25 Base (<=2.7 km)'
                        : `$1.25 base + $${(trip.fareBreakdown.extraKm * trip.fareBreakdown.extraKmRateUsd).toFixed(2)} extra`}
                    </span>
                  </div>
                </div>

                {/* Ruta: Origen y Destino */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className={`text-[10px] font-bold block uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Origen:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.originAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className={`text-[10px] font-bold block uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Destino:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.destinationAddress}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 text-[11px] pt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      <span>Distancia: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{trip.distanceKm} km</strong></span>
                      <span>•</span>
                      <span>Duración est.: <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{trip.durationMinutes} min</strong></span>
                      {trip.startSecurityPin && (
                        <>
                          <span>•</span>
                          <span>PIN Inicio: <strong className={`font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{trip.startSecurityPin}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Datos del Pasajero y Conductor Asignado */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border text-xs ${
                    isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {/* Pasajero */}
                    <div className="space-y-1">
                      <span className={`text-[10px] font-bold uppercase block flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <User className="w-3 h-3 text-sky-500" />
                        <span>Pasajero</span>
                      </span>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.passengerName}</p>
                      <p className={`text-[11px] font-mono flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{trip.passengerPhone}</span>
                      </p>
                    </div>

                    {/* Conductor y Unidad */}
                    <div className="space-y-1">
                      <span className={`text-[10px] font-bold uppercase block flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <Car className="w-3 h-3 text-amber-500" />
                        <span>Conductor & Unidad</span>
                      </span>
                      {trip.assignedDriverName ? (
                        <>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.assignedDriverName}</p>
                          <p className={`text-[11px] font-mono ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                            {trip.assignedUnitNumber || 'Unidad'} • Placa: <strong className={`px-1.5 py-0.5 rounded border ${
                              isDark ? 'text-white bg-black border-zinc-700' : 'text-slate-900 bg-slate-200 border-slate-300'
                            }`}>{trip.vehiclePlate}</strong>
                          </p>
                          <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{trip.cooperativaName}</p>
                        </>
                      ) : (
                        <p className={`italic text-[11px] ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>En espera de asignación de chofer...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pie con Acciones Administrativas */}
                <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-3 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <span>Pago: <strong className={`uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{trip.paymentMethod}</strong></span>
                    <span>•</span>
                    <span
                      className={`font-bold ${
                        trip.paymentStatus === 'pagado' ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {trip.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente de cobro'}
                    </span>
                    {trip.notes && (
                      <>
                        <span>•</span>
                        <span className={`italic ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>"{trip.notes}"</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {isEnCurso && (
                      <button
                        type="button"
                        onClick={() => handleFinishTrip(trip.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
                        <span>Finalizar Carrera</span>
                      </button>
                    )}
                    {(isEnCurso || isPendiente) && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelTripId(trip.id)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                    {onDeleteTrip && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar permanentemente la carrera #${trip.tripCode || trip.id} del panel?`)) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-400'
                        }`}
                        title="Eliminar carrera del registro"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMACIÓN DE CANCELACIÓN DE CARRERA */}
      {confirmCancelTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm rounded-2xl border-2 border-red-500/50 p-5 space-y-4 shadow-2xl text-center ${
            isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/40">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>¿Cancelar Carrera Administrativamente?</h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                La carrera #{confirmCancelTripId} será cancelada en el cliente y retirada del radar de conductores.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelTripId(null)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                No, Volver
              </button>
              <button
                type="button"
                onClick={() => handleExecuteCancelTrip(confirmCancelTripId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESPACHO DE CARRERA MANUAL (CENTRAL DE OPERACIONES) */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl border-2 border-emerald-500/60 p-5 space-y-4 shadow-2xl ${
            isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-500" />
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>DESPACHO DE CARRERA MANUAL</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTrip} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Nombre Pasajero</label>
                  <input
                    type="text"
                    value={manualPassenger}
                    onChange={(e) => setManualPassenger(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-400' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Teléfono Pasajero</label>
                  <input
                    type="text"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-400' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Punto de Origen (Recogida)</label>
                <input
                  type="text"
                  value={manualOrigin}
                  onChange={(e) => setManualOrigin(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-400' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className={`font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Punto de Destino</label>
                <input
                  type="text"
                  value={manualDestination}
                  onChange={(e) => setManualDestination(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-400' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Tarifa Ofrecida (USD)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.00"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-emerald-500 font-black text-sm focus:outline-none ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-700 focus:border-emerald-400' 
                        : 'bg-slate-50 border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Vehículo Solicitado</label>
                  <select
                    value={manualVehicleType}
                    onChange={(e) => setManualVehicleType(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-400' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  >
                    <option value="auto">Auto / Taxi (4 Pax)</option>
                    <option value="moto">Moto (1 Pax)</option>
                    <option value="camioneta">Camioneta</option>
                  </select>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-[11px] ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                Al despachar, la carrera se transmitirá en vivo a todos los conductores activos en el radar GPS de la provincia.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className={`flex-1 py-2.5 rounded-xl font-bold cursor-pointer ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Despachar al Radar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

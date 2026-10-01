import React, { useState, useRef } from 'react';
import {
  Driver,
  UnitOperationalStatus,
  Coordinates,
} from '../../types';
import {
  fleetSimulationService,
  SimulatedVehicle,
  TelemetryLogEntry,
} from '../../services/fleetSimulationService';
import { MapComponent } from '../MapComponent';
import {
  Radio,
  Navigation,
  Compass,
  Phone,
  Car,
  Bike,
  ShieldCheck,
  Battery,
  BatteryCharging,
  Zap,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Maximize2,
  CheckCircle2,
  Activity,
  Layers,
  Crosshair,
  Trash2,
  Plus,
  X,
  Gauge,
  Globe,
  UserCheck,
} from 'lucide-react';

interface AdminUnitsTrackingProps {
  drivers: Driver[];
  onUpdateDrivers?: (updated: Driver[]) => void;
  onOpenUnitRegister?: () => void;
  onDeleteDriver?: (driverId: string) => void;
  isDark?: boolean;
}

export const AdminUnitsTracking: React.FC<AdminUnitsTrackingProps> = ({
  drivers: initialDrivers,
  onUpdateDrivers,
  onOpenUnitRegister,
  onDeleteDriver,
  isDark = true,
}) => {
  // Helper to map real drivers to standard vehicle display structure
  const mapDriversToVehicles = (drvs: Driver[]): SimulatedVehicle[] => {
    return drvs.map((d) => {
      const isMoto = d.vehicle?.type === 'moto';
      const opStatus: 'disponible' | 'en_viaje' | 'en_encomienda' | 'desconectado' =
        d.isAvailable === false ? 'desconectado' : 'disponible';
      return {
        id: d.id,
        name: d.name,
        photoUrl: d.avatar || d.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128',
        phone: '+593 99 123 4567',
        rating: d.rating,
        tripsCount: d.tripsCount || d.totalTrips || 120,
        vehicleType: isMoto ? 'moto' : 'auto',
        make: d.vehicle?.make || 'Chevrolet',
        model: d.vehicle?.model || 'Sail',
        plate: d.vehicle?.plate || 'PBA-0000',
        color: d.vehicle?.color || 'Amarillo',
        cooperativa: (d as any).assignedCooperative || 'Coop. AndesMovi',
        currentCoords: d.currentCoords,
        previousCoords: d.currentCoords,
        headingDegrees: d.telemetry?.headingDegrees || 0,
        targetHeadingDegrees: d.telemetry?.headingDegrees || 0,
        speedKmH: d.telemetry?.speedKmH || d.telemetry?.speedKmh || 0,
        operationalStatus: opStatus,
        batteryPercent: d.telemetry?.batteryLevelPercent || 100,
        altitudeMeters: d.telemetry?.altitudeMeters || 2950,
        routeWaypoints: [],
        currentWaypointIndex: 0,
        lastPingTime: Date.now(),
      };
    });
  };

  // Real-time fleet state derived from actual drivers in system
  const [vehicles, setVehicles] = useState<SimulatedVehicle[]>(() =>
    mapDriversToVehicles(initialDrivers)
  );
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEntry[]>([]);

  // Selection & focus
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || ''
  );
  const [followedVehicleId, setFollowedVehicleId] = useState<string | null>(null);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<'all' | 'moto' | 'auto'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationBanner(msg);
    setTimeout(() => setNotificationBanner(null), 3800);
  };

  const handleDeleteVehicle = (vehId: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar permanentemente la unidad/conductor "${name}" del radar satelital?`)) {
      if (onDeleteDriver) {
        onDeleteDriver(vehId);
      } else if (onUpdateDrivers) {
        onUpdateDrivers(initialDrivers.filter((d) => d.id !== vehId));
      }
      showNotification(`Unidad "${name}" eliminada del radar satelital.`);
    }
  };

  // Synchronize state when drivers database is updated and append live logs
  React.useEffect(() => {
    const updatedVehicles = mapDriversToVehicles(initialDrivers);
    setVehicles(updatedVehicles);

    // Populate actual telemetry logs based on actual coordinate updates
    if (initialDrivers.length > 0) {
      const activeSample = initialDrivers[Math.floor(Math.random() * initialDrivers.length)];
      if (activeSample) {
        const timeStr = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const log: TelemetryLogEntry = {
          id: `log-real-${Date.now()}-${activeSample.id}`,
          vehicleId: activeSample.id,
          driverName: activeSample.name,
          vehicleType: activeSample.vehicle?.type === 'moto' ? 'moto' : 'auto',
          plate: activeSample.vehicle?.plate || 'PBA-0000',
          coords: activeSample.currentCoords,
          headingDegrees: activeSample.telemetry?.headingDegrees || 0,
          speedKmH: activeSample.telemetry?.speedKmH || activeSample.telemetry?.speedKmh || 35,
          timestamp: Date.now(),
          timeFormatted: timeStr,
          status: activeSample.isAvailable === false ? 'desconectado' : 'disponible',
        };
        setTelemetryLogs((prev) => [log, ...prev.slice(0, 49)]);
      }
    }
  }, [initialDrivers]);

  // Selected vehicle object
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0] || null;

  // Filtered vehicles list
  const filteredVehicles = vehicles.filter((v) => {
    if (statusFilter === 'taxis' && v.vehicleType === 'moto') return false;
    if (statusFilter === 'motos' && v.vehicleType !== 'moto') return false;
    if (statusFilter === 'disponibles' && v.operationalStatus !== 'disponible') return false;
    if (statusFilter === 'en_carrera' && v.operationalStatus !== 'en_viaje' && v.operationalStatus !== 'en_encomienda') return false;

    if (typeFilter === 'moto' && v.vehicleType !== 'moto') return false;
    if (typeFilter === 'auto' && v.vehicleType === 'moto') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.name.toLowerCase().includes(q);
      const matchPlate = v.plate.toLowerCase().includes(q);
      const matchModel = v.model.toLowerCase().includes(q);
      const matchCoop = v.cooperativa.toLowerCase().includes(q);
      if (!matchName && !matchPlate && !matchModel && !matchCoop) return false;
    }

    return true;
  });

  const handleFocusVehicle = (v: SimulatedVehicle) => {
    setSelectedVehicleId(v.id);
    showNotification(`🎯 Unidad seleccionada: ${v.name} (${v.plate})`);
  };

  const handleStatusChange = (newStatus: UnitOperationalStatus) => {
    if (!selectedVehicle) return;
    fleetSimulationService.setVehicleOperationalStatus(selectedVehicle.id, newStatus);
    showNotification(`🔄 Estado de unidad actualizado a "${newStatus}"`);
  };

  const totalCount = vehicles.length;
  const motosCount = vehicles.filter((v) => v.vehicleType === 'moto').length;
  const carsCount = vehicles.filter((v) => v.vehicleType !== 'moto').length;
  const activeCount = vehicles.filter((v) => v.operationalStatus !== 'desconectado').length;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner with Fleet Stats and Actions */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl border-2 shadow-2xl ${
          isDark
            ? 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-amber-500/50'
            : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-amber-400 text-slate-900'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-amber-500 text-slate-950 border-amber-600'
              }`}
            >
              <Radio className={`w-5 h-5 animate-pulse ${isDark ? 'text-amber-400' : 'text-slate-950'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CENTRO DE MONITOREO Y TELEMETRÍA DE FLOTA (GPS EN VIVO)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border ${
                    isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>GPS EN TIEMPO REAL</span>
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Visualización exclusiva de conductores y repartidores activos sobre el mapa oficial del Ecuador
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Total Units Badges */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {activeCount} Activos
            </span>
            <span className="opacity-40">|</span>
            <span>{totalCount} Registrados</span>
          </div>

          {/* Spawn / Register Unit Button */}
          {onOpenUnitRegister && (
            <button
              type="button"
              onClick={onOpenUnitRegister}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Unidad</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notificationBanner && (
        <div
          className={`p-3 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg ${
            isDark
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
              : 'bg-amber-100 border-amber-400 text-amber-900'
          }`}
        >
          <Radio className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* Main Grid: Left Filters & Vehicle List, Center/Right Google Map & Live Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: VEHICLE ROSTER & FILTERS (4/12 COLS)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-3">
          {/* Quick Vehicle Type Filters */}
          <div
            className={`p-3.5 rounded-2xl border-2 space-y-3 ${
              isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <span>Filtrar Unidades</span>
              </span>
              <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {filteredVehicles.length} de {totalCount} unidades
              </span>
            </div>

            {/* Type Buttons: All, Motos, Carros */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-black'
                    : isDark
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>Todas</span>
                </div>
                <span className="text-[10px] opacity-80">({totalCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('moto')}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border cursor-pointer ${
                  typeFilter === 'moto'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-black'
                    : isDark
                    ? 'bg-zinc-800 text-amber-300 border-zinc-700 hover:border-zinc-500'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motos</span>
                </div>
                <span className="text-[10px] opacity-80">({motosCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('auto')}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border cursor-pointer ${
                  typeFilter === 'auto'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-black'
                    : isDark
                    ? 'bg-zinc-800 text-sky-300 border-zinc-700 hover:border-zinc-500'
                    : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  <span>Carros</span>
                </div>
                <span className="text-[10px] opacity-80">({carsCount})</span>
              </button>
            </div>

            {/* Status Tabs */}
            <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'disponibles', label: 'Libres' },
                { id: 'en_carrera', label: 'En Viaje' },
                { id: 'motos', label: 'Envíos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? isDark
                        ? 'bg-zinc-700 text-white font-black'
                        : 'bg-slate-200 text-slate-900 font-black'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por chofer, placa, modelo..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border-2 text-xs focus:outline-none ${
                  isDark
                    ? 'bg-zinc-800/90 border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-400'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Vehicle List */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredVehicles.length === 0 && (
              <div
                className={`p-6 rounded-2xl border-2 text-center text-xs ${
                  isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                No se encontraron unidades con los filtros seleccionados.
              </div>
            )}

            {filteredVehicles.map((vehicle) => {
              const isSelected = vehicle.id === selectedVehicleId;
              const isFollowed = vehicle.id === followedVehicleId;
              const isMoto = vehicle.vehicleType === 'moto';

              const statusColor =
                vehicle.operationalStatus === 'disponible'
                  ? 'bg-emerald-500'
                  : vehicle.operationalStatus === 'en_viaje'
                  ? 'bg-sky-500'
                  : vehicle.operationalStatus === 'en_encomienda'
                  ? 'bg-amber-500'
                  : 'bg-zinc-500';

              const statusLabel =
                vehicle.operationalStatus === 'disponible'
                  ? 'Disponible'
                  : vehicle.operationalStatus === 'en_viaje'
                  ? 'En Carrera'
                  : vehicle.operationalStatus === 'en_encomienda'
                  ? 'Encomienda'
                  : 'Desconectado';

              return (
                <div
                  key={vehicle.id}
                  onClick={() => handleFocusVehicle(vehicle)}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-amber-500/15 border-amber-400/90 shadow-md shadow-amber-500/10'
                        : 'bg-amber-50 border-amber-500 shadow-md'
                      : isDark
                      ? 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={vehicle.photoUrl}
                          alt={vehicle.name}
                          className={`w-9 h-9 rounded-xl object-cover border ${
                            isSelected ? 'border-amber-400' : 'border-zinc-700'
                          }`}
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                            isDark ? 'border-zinc-900' : 'border-white'
                          } ${statusColor}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4
                            className={`text-xs font-black truncate ${
                              isSelected
                                ? isDark
                                  ? 'text-amber-300'
                                  : 'text-amber-900'
                                : isDark
                                ? 'text-white'
                                : 'text-slate-900'
                            }`}
                          >
                            {vehicle.name}
                          </h4>
                          <span
                            className={`text-[10px] font-mono px-1 py-0.2 rounded border font-bold ${
                              isDark
                                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            {vehicle.plate}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          {isMoto ? '🏍️ Moto' : '🚗 Carro'} &bull; {vehicle.model} &bull; {vehicle.cooperativa}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          vehicle.operationalStatus === 'disponible'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : vehicle.operationalStatus === 'en_viaje'
                            ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                            : vehicle.operationalStatus === 'en_encomienda'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-zinc-700/40 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                        <span>{statusLabel}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteVehicle(vehicle.id, vehicle.name, e)}
                        className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 border-zinc-700 hover:border-red-500'
                            : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-300'
                        }`}
                        title="Eliminar unidad del radar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER/RIGHT COLUMN: GOOGLE MAP & HUD (8/12 COLS)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-3">
          {/* Map Top Bar */}
          <div
            className={`p-2.5 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-2 text-xs ${
              isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                <Globe className="w-4 h-4 text-amber-500" />
                <span>Mapa Satelital AndesMovi (Solo Unidades Activas)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Sin rutas fijas &bull; Flota en vivo</span>
              </div>
            </div>
          </div>

          {/* Map Canvas with ONLY active vehicles (No Point A, No Point B, No route polylines) */}
          <div
            className={`relative w-full h-[540px] rounded-3xl overflow-hidden border-2 shadow-2xl ${
              isDark ? 'border-zinc-700 bg-zinc-950' : 'border-slate-300 bg-slate-100'
            }`}
          >
            <MapComponent
              isAdminMap={true}
              isDarkMode={isDark}
            />

            {/* Selected Vehicle Float HUD over Map */}
            {selectedVehicle && (
              <div
                className={`absolute bottom-3 left-3 right-3 z-10 p-3.5 rounded-2xl backdrop-blur-xl border-2 shadow-2xl flex flex-col gap-2.5 ${
                  isDark
                    ? 'bg-zinc-950/95 border-amber-500/70 text-white'
                    : 'bg-white/95 border-amber-400 text-slate-900 shadow-slate-200'
                }`}
              >
                <div
                  className={`flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b ${
                    isDark ? 'border-zinc-800' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={selectedVehicle.photoUrl}
                        alt={selectedVehicle.name}
                        className="w-11 h-11 rounded-xl object-cover border-2 border-amber-400"
                      />
                      <div className="absolute -top-1 -right-1 text-xs">
                        {selectedVehicle.vehicleType === 'moto' ? '🏍️' : '🚗'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {selectedVehicle.name}
                        </h4>
                        <span
                          className={`font-mono font-black text-[11px] px-1.5 py-0.2 rounded border ${
                            isDark
                              ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                              : 'text-amber-800 bg-amber-50 border-amber-300'
                          }`}
                        >
                          {selectedVehicle.plate}
                        </span>
                        <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          📞 {selectedVehicle.phone}
                        </span>
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        {selectedVehicle.make} {selectedVehicle.model} &bull; {selectedVehicle.cooperativa}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleStatusChange('disponible')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        selectedVehicle.operationalStatus === 'disponible'
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm font-black'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-emerald-500/50'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-emerald-50'
                      }`}
                    >
                      Disponible
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('en_viaje')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        selectedVehicle.operationalStatus === 'en_viaje'
                          ? 'bg-sky-500 text-zinc-950 border-sky-400 shadow-sm font-black'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-sky-500/50'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-sky-50'
                      }`}
                    >
                      En Viaje
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('desconectado')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        selectedVehicle.operationalStatus === 'desconectado'
                          ? 'bg-zinc-600 text-white border-zinc-500 shadow-sm font-black'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Desconectado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(selectedVehicle.id, selectedVehicle.name)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-zinc-800 hover:bg-red-950 text-red-400 border-zinc-700 hover:border-red-500'
                          : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-400'
                      }`}
                      title="Eliminar unidad del sistema y radar"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar Unidad</span>
                    </button>
                  </div>
                </div>

                {/* Quick Telemetry Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div
                    className={`p-2 rounded-xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 block font-semibold">Velocidad</span>
                    <span className="font-mono font-black text-amber-400">
                      {Math.round(selectedVehicle.speedKmH)} km/h
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 block font-semibold">Batería Móvil</span>
                    <span className="font-mono font-black text-emerald-400">
                      {selectedVehicle.batteryPercent}% ⚡
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 block font-semibold">Calificación</span>
                    <span className="font-mono font-black text-amber-400">
                      ★ {selectedVehicle.rating.toFixed(1)}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 block font-semibold">Carreras Hoy</span>
                    <span className="font-mono font-black text-sky-400">
                      {selectedVehicle.tripsCount} viajes
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  SimulatedVehicle,
  TelemetryLogEntry,
  fleetSimulationService,
} from '../services/fleetSimulationService';
import { Coordinates, VehicleType } from '../types';
import {
  Bike,
  Car,
  Play,
  Pause,
  FastForward,
  Plus,
  Send,
  Radio,
  Compass,
  Gauge,
  X,
  Crosshair,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

interface FleetTelemetryHudProps {
  vehicles: SimulatedVehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicle: SimulatedVehicle | null) => void;
  followedVehicleId: string | null;
  onToggleFollowVehicle: (vehicleId: string | null) => void;
  filterType: 'all' | 'moto' | 'auto';
  onSetFilterType: (filter: 'all' | 'moto' | 'auto') => void;
  isDarkMode?: boolean;
  mapCenter?: Coordinates;
  onDispatchToMapClick?: (vehicleId: string) => void;
  latestLog?: TelemetryLogEntry;
}

export const FleetTelemetryHud: React.FC<FleetTelemetryHudProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  followedVehicleId,
  onToggleFollowVehicle,
  filterType,
  onSetFilterType,
  isDarkMode = true,
  mapCenter,
  onDispatchToMapClick,
  latestLog,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'units' | 'telemetry' | 'dispatch' | 'spawn'>('units');
  const [isSimRunning, setIsSimRunning] = useState<boolean>(() => fleetSimulationService.isSimulationRunning());
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(() => fleetSimulationService.getSpeedMultiplier());

  // Dispatch state
  const [dispatchVehicleId, setDispatchVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [dispatchLat, setDispatchLat] = useState<string>('-0.1807');
  const [dispatchLng, setDispatchLng] = useState<string>('-78.4678');
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);

  // Spawn state
  const [spawnName, setSpawnName] = useState<string>('');
  const [spawnType, setSpawnType] = useState<VehicleType>('moto');
  const [spawnModel, setSpawnModel] = useState<string>('');
  const [spawnPlate, setSpawnPlate] = useState<string>('');
  const [spawnSuccess, setSpawnSuccess] = useState<boolean>(false);

  const motoCount = vehicles.filter((v) => v.vehicleType === 'moto').length;
  const carCount = vehicles.filter((v) => v.vehicleType !== 'moto').length;

  const filteredVehicles = vehicles.filter((v) => {
    if (filterType === 'moto') return v.vehicleType === 'moto';
    if (filterType === 'auto') return v.vehicleType !== 'moto';
    return true;
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  const handleTogglePlay = () => {
    const running = fleetSimulationService.toggleSimulation();
    setIsSimRunning(running);
  };

  const handleSpeedChange = (mult: number) => {
    fleetSimulationService.setSpeedMultiplier(mult);
    setSpeedMultiplier(mult);
  };

  const handleExecuteDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(dispatchLat);
    const lng = parseFloat(dispatchLng);
    if (isNaN(lat) || isNaN(lng) || !dispatchVehicleId) return;

    fleetSimulationService.dispatchVehicleToCoordinates(dispatchVehicleId, {
      lat,
      lng,
      address: `Coordenada despachada (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      name: 'Destino Despacho GPS',
    });

    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 3000);
  };

  const handleExecuteSpawn = (e: React.FormEvent) => {
    e.preventDefault();
    const center = mapCenter || { lat: -0.1807, lng: -78.4678 };
    const offsetLat = (Math.random() - 0.5) * 0.006;
    const offsetLng = (Math.random() - 0.5) * 0.006;

    fleetSimulationService.spawnCustomVehicle({
      name: spawnName.trim(),
      type: spawnType,
      model: spawnModel.trim(),
      plate: spawnPlate.trim().toUpperCase(),
      coords: {
        lat: center.lat + offsetLat,
        lng: center.lng + offsetLng,
      },
    });

    setSpawnSuccess(true);
    setSpawnName('');
    setSpawnModel('');
    setSpawnPlate('');
    setTimeout(() => setSpawnSuccess(false), 3000);
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-[480px] z-30 flex flex-col gap-2 pointer-events-auto">
      {/* Mini Ticker Banner (Always visible when collapsed or expanded) */}
      <div
        className={`px-3.5 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2.5 transition-all ${
          isDarkMode
            ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 shadow-black/80'
            : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl'
        }`}
      >
        {/* Left: Status & Vehicle Counts */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSimRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              } absolute`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSimRunning ? 'bg-emerald-500' : 'bg-amber-500'
              } relative`}
            />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5 font-black text-xs tracking-tight">
              <span className="text-emerald-400 font-mono text-[11px]">FLOTA GPS</span>
              <span className="text-zinc-500">•</span>
              <span className="truncate text-zinc-300">
                {vehicles.length} Unidades ({motoCount} 🏍️ / {carCount} 🚗)
              </span>
            </div>

            {/* Live Ticker Message */}
            <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1.5 font-mono">
              {latestLog ? (
                <>
                  <span className="text-emerald-400">[{latestLog.timeFormatted}]</span>
                  <span className={latestLog.vehicleType === 'moto' ? 'text-amber-300' : 'text-sky-300'}>
                    {latestLog.vehicleType === 'moto' ? '🏍️' : '🚗'} {latestLog.plate}
                  </span>
                  <span>
                    ({latestLog.coords.lat.toFixed(4)}, {latestLog.coords.lng.toFixed(4)})
                  </span>
                  <span className="text-emerald-400">{latestLog.headingDegrees}°</span>
                  <span className="text-zinc-300 font-bold">{latestLog.speedKmH}km/h</span>
                </>
              ) : (
                <span>Transmitiendo coordenadas y rotación en vivo 60 FPS...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Controls & Expand Toggle */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={handleTogglePlay}
            title={isSimRunning ? 'Pausar transmisión de coordenadas' : 'Reanudar transmisión'}
            className={`p-1.5 rounded-xl border transition-colors ${
              isSimRunning
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Speed selector */}
          <button
            type="button"
            onClick={() => handleSpeedChange(speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 4 : 1)}
            title="Ajustar velocidad de simulación"
            className="px-2 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono font-black border border-zinc-700"
          >
            {speedMultiplier}x
          </button>

          {/* Expand/Collapse HUD */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            title={isExpanded ? 'Minimizar panel' : 'Expandir telemetría y despacho'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Telemetry & Control Panel */}
      {isExpanded && (
        <div
          className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 max-h-[380px] overflow-y-auto ${
            isDarkMode
              ? 'bg-zinc-950/98 border-zinc-750 text-zinc-100 shadow-black'
              : 'bg-white/98 border-slate-300 text-slate-900 shadow-2xl'
          }`}
        >
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('units')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'units'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <span>Unidades ({vehicles.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('telemetry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'telemetry'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Log GPS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dispatch')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'dispatch'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Despachar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('spawn')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'spawn'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Añadir</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB 1: UNITS LIST */}
          {activeTab === 'units' && (
            <div className="flex flex-col gap-2.5">
              {/* Filter Pills */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSetFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      filterType === 'all'
                        ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Todos ({vehicles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetFilterType('moto')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                      filterType === 'moto'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Bike className="w-3 h-3" /> Motos ({motoCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetFilterType('auto')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                      filterType === 'auto'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-3 h-3" /> Carros ({carCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fleetSimulationService.resetFleet()}
                  title="Reiniciar flota a valores predeterminados"
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reiniciar
                </button>
              </div>

              {/* Units List */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredVehicles.map((veh) => {
                  const isMoto = veh.vehicleType === 'moto';
                  const isSelected = selectedVehicleId === veh.id;
                  const isFollowed = followedVehicleId === veh.id;

                  return (
                    <div
                      key={veh.id}
                      onClick={() => onSelectVehicle(isSelected ? null : veh)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg'
                          : isDarkMode
                          ? 'bg-zinc-900/80 border-zinc-800/80 hover:bg-zinc-800 text-zinc-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 ${
                            isMoto
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {isMoto ? '🏍️' : '🚗'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-bold truncate block">{veh.name}</strong>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
                              {veh.plate}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate flex items-center gap-2">
                            <span>{veh.model}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-mono font-bold">{veh.speedKmH} km/h</span>
                            <span>•</span>
                            <span className="text-amber-400 font-mono">{veh.headingDegrees}°</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Chase / Follow camera toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFollowVehicle(isFollowed ? null : veh.id);
                          }}
                          title={isFollowed ? 'Dejar de seguir con la cámara' : 'Seguir vehículo con la cámara'}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            isFollowed
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                          }`}
                        >
                          <Crosshair className={`w-3.5 h-3.5 ${isFollowed ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TELEMETRY LOGS */}
          {activeTab === 'telemetry' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Transmisión Continua de Coordenadas GPS (Radar AndesMovi)</span>
                <span className="font-mono text-emerald-400 font-bold">60 FPS WebGL</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto font-mono text-[10px]">
                {fleetSimulationService.getLogs().length === 0 ? (
                  <div className="p-4 text-center text-zinc-500">Esperando transmisiones...</div>
                ) : (
                  fleetSimulationService.getLogs().slice(0, 15).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2 text-zinc-300"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-emerald-400 font-bold">[{log.timeFormatted}]</span>
                        <span className={log.vehicleType === 'moto' ? 'text-amber-400' : 'text-sky-400'}>
                          {log.vehicleType === 'moto' ? '🏍️' : '🚗'} {log.plate}
                        </span>
                        <span className="truncate text-zinc-400">
                          ({log.coords.lat.toFixed(4)}, {log.coords.lng.toFixed(4)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-amber-400 font-bold">{log.headingDegrees}°</span>
                        <span className="text-emerald-400 font-bold">{log.speedKmH} km/h</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH COORDINATES */}
          {activeTab === 'dispatch' && (
            <form onSubmit={handleExecuteDispatch} className="flex flex-col gap-2.5">
              <p className="text-xs text-zinc-300">
                Selecciona una <strong>Moto</strong> o <strong>Carro</strong> y envíale coordenadas de destino.
                El vehículo rotará hacia el nuevo rumbo y se moverá automáticamente sobre las calles:
              </p>

              {dispatchSuccess && (
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> ¡Coordenadas enviadas! El vehículo inició su desplazamiento y rotación.
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-400">Vehículo a despachar:</label>
                <select
                  value={dispatchVehicleId}
                  onChange={(e) => setDispatchVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-zinc-700 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleType === 'moto' ? '🏍️' : '🚗'} {v.name} • {v.model} ({v.plate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-400">Latitud:</label>
                  <input
                    type="text"
                    value={dispatchLat}
                    onChange={(e) => setDispatchLat(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 border border-zinc-700 text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-400">Longitud:</label>
                  <input
                    type="text"
                    value={dispatchLng}
                    onChange={(e) => setDispatchLng(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 border border-zinc-700 text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const c = mapCenter || { lat: -0.1807, lng: -78.4678 };
                    setDispatchLat(c.lat.toFixed(4));
                    setDispatchLng(c.lng.toFixed(4));
                  }}
                  className="px-2.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[11px] font-bold"
                >
                  Usar Centro de Mapa
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmitir Coordenadas</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SPAWN VEHICLE */}
          {activeTab === 'spawn' && (
            <form onSubmit={handleExecuteSpawn} className="flex flex-col gap-2.5">
              <p className="text-xs text-zinc-300">
                Añade una nueva unidad a patrullar en tiempo real sobre el mapa satelital:
              </p>

              {spawnSuccess && (
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> ¡Nueva unidad en vivo agregada a la flota!
                </div>
              )}

              {/* Vehicle Type Choice */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSpawnType('moto')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    spawnType === 'moto'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-black'
                      : 'bg-zinc-900 border-zinc-750 text-zinc-400'
                  }`}
                >
                  <Bike className="w-4 h-4" /> Moto Express
                </button>

                <button
                  type="button"
                  onClick={() => setSpawnType('auto')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    spawnType === 'auto'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500 font-black'
                      : 'bg-zinc-900 border-zinc-750 text-zinc-400'
                  }`}
                >
                  <Car className="w-4 h-4" /> Taxi / Auto
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-400">Nombre del conductor:</label>
                <input
                  type="text"
                  placeholder={spawnType === 'moto' ? 'Ej: Brayan Guamán' : 'Ej: Patricio Morales'}
                  value={spawnName}
                  onChange={(e) => setSpawnName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-400">Modelo:</label>
                  <input
                    type="text"
                    placeholder={spawnType === 'moto' ? 'Yamaha FZ-25' : 'Chevrolet Sail'}
                    value={spawnModel}
                    onChange={(e) => setSpawnModel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-400">Placa:</label>
                  <input
                    type="text"
                    placeholder={spawnType === 'moto' ? 'IB-721W' : 'PBA-4512'}
                    value={spawnPlate}
                    onChange={(e) => setSpawnPlate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Lanzar Unidad a la Flota</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

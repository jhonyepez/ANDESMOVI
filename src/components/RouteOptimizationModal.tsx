import React, { useState, useEffect } from 'react';
import { Coordinates } from '../types';
import { RouteOption, getRouteAlternatives, formatCurrency } from '../utils/geoUtils';
import {
  Navigation,
  Sparkles,
  Zap,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  X,
  Printer,
  ShieldCheck,
  TrendingDown,
  Compass,
  ArrowRight,
  Route,
  Activity,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface RouteOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: Coordinates;
  destination: Coordinates | null;
  onSelectRoute?: (selectedRoute: RouteOption) => void;
}

export const RouteOptimizationModal: React.FC<RouteOptimizationModalProps> = ({
  isOpen,
  onClose,
  origin,
  destination,
  onSelectRoute,
}) => {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<'fastest' | 'shortest' | 'eco'>('fastest');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !destination) return;

    setIsAnalyzing(true);
    setAnalysisProgress(15);

    const timer1 = setTimeout(() => setAnalysisProgress(50), 300);
    const timer2 = setTimeout(() => setAnalysisProgress(85), 600);

    let isMounted = true;
    getRouteAlternatives(origin, destination).then((altRoutes) => {
      if (!isMounted) return;
      setRoutes(altRoutes);
      setAnalysisProgress(100);
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 300);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, origin, destination]);

  if (!isOpen) return null;

  const selectedRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  const handleApplyRoute = (route: RouteOption) => {
    setActiveRouteId(route.id);
    haptic.selection();
    if (onSelectRoute) {
      onSelectRoute(route);
    }
    onClose();
  };

  const handlePrintRouteTicket = () => {
    haptic.impactMedium();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-emerald-500/30 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">Identificador de la Mejor Ruta</h3>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  IA AndesMovi
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Análisis de tráfico en tiempo real, kilometraje y vías óptimas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintRouteTicket}
              title="Imprimir Hoja de Ruta"
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Origin & Destination Banner */}
        <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-zinc-400 truncate">Origen:</span>
            <span className="text-white font-medium truncate">{origin.name || origin.address}</span>
          </div>

          <ArrowRight className="w-4 h-4 text-zinc-600 hidden sm:block flex-shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="text-zinc-400 truncate">Destino:</span>
            <span className="text-white font-medium truncate">
              {destination ? destination.name || destination.address : 'Destino no seleccionado'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isAnalyzing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Navigation className="w-7 h-7 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Escaneando vías y tráfico urbano...</h4>
                <p className="text-xs text-zinc-400 max-w-sm mt-1">
                  Evaluando semáforos, flujo vehicular y tramos de menor tiempo en tiempo real.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Top Banner Recommendation */}
              <div className="bg-gradient-to-r from-emerald-900/40 via-emerald-950/20 to-zinc-900 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                      Dictamen de Ruta Inteligente
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 font-medium mt-0.5">
                    Se identificó la <strong className="text-emerald-300 font-bold">Ruta Principal</strong> como la opción más veloz y fluida. Ahorra tiempo reduciendo paradas prolongadas en tráfico.
                  </p>
                </div>
              </div>

              {/* Route Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {routes.map((route) => {
                  const isSelected = activeRouteId === route.id;
                  return (
                    <button
                      key={route.id}
                      onClick={() => setActiveRouteId(route.id)}
                      className={`text-left p-4 rounded-2xl border transition-all relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      {/* Badge Top */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider border ${
                            route.isBest
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {route.badge}
                        </span>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Title & Key Stats */}
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{route.title}</h4>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{route.description}</p>
                      </div>

                      {/* Main Metrics */}
                      <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Tiempo</span>
                          <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            ~{route.durationMin} min
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-400 block uppercase font-medium">Distancia</span>
                          <span className="text-base font-black text-white flex items-center justify-center gap-1">
                            <Route className="w-3.5 h-3.5 text-zinc-400" />
                            {route.distanceKm} km
                          </span>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-1">
                        {route.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                            <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Route Detailed Overview */}
              {selectedRoute && (
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Detalle Téte-à-Téte: {selectedRoute.title}
                    </h5>
                    <span className="text-xs text-emerald-400 font-semibold">{selectedRoute.savingsLabel}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Flujo de Tráfico</span>
                      <span className="font-bold text-emerald-400 capitalize">{selectedRoute.trafficStatus}</span>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Demora Estimada</span>
                      <span className="font-bold text-white">+{selectedRoute.trafficDelayMin} min</span>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Peajes en Vía</span>
                      <span className="font-bold text-white">
                        {selectedRoute.hasTolls ? formatCurrency(selectedRoute.tollFeeUsd) : 'Sin Peajes ($0.00)'}
                      </span>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Precisión GPS</span>
                      <span className="font-bold text-emerald-400">99.8% Calibrada</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-zinc-900/90 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Selecciona una ruta para actualizar el navegador GPS en vivo</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all"
            >
              Cancelar
            </button>

            {selectedRoute && (
              <button
                onClick={() => handleApplyRoute(selectedRoute)}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Usar {selectedRoute.title}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

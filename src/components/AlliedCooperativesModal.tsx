import React, { useState, useMemo } from 'react';
import { ALLIED_COOPERATIVES, AlliedCooperative } from '../data/alliedCooperatives';
import {
  X,
  Bus,
  Search,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  Building2,
  Navigation,
  Compass,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface AlliedCooperativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  onSelectCooperative?: (coop: AlliedCooperative) => void;
}

export const AlliedCooperativesModal: React.FC<AlliedCooperativesModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  onSelectCooperative,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'quito' | 'guayaquil' | 'ibarra' | 'oriente'>('todos');

  const filteredCooperatives = useMemo(() => {
    return ALLIED_COOPERATIVES.filter((coop) => {
      const matchSearch =
        coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coop.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coop.destinations.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
        coop.officialRoutes.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedFilter === 'quito') {
        return coop.destinations.some((d) => d.toLowerCase().includes('quito'));
      }
      if (selectedFilter === 'guayaquil') {
        return coop.destinations.some((d) => d.toLowerCase().includes('guayaquil'));
      }
      if (selectedFilter === 'ibarra') {
        return coop.destinations.some((d) => d.toLowerCase().includes('ibarra'));
      }
      if (selectedFilter === 'oriente') {
        return (
          coop.destinations.some((d) => d.toLowerCase().includes('lago agrio') || d.toLowerCase().includes('coca') || d.toLowerCase().includes('orient')) ||
          coop.type === 'interprovincial'
        );
      }

      return true;
    });
  }, [searchTerm, selectedFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 text-xl font-bold">
              📦
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2 text-blue-400">
                <span>Red de Encomiendas Aliadas AndesMovi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {ALLIED_COOPERATIVES.length} Cooperativas para Envíos
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Oficinas y ventanillas autorizadas exclusivamente para despacho y retiro de encomiendas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.tap();
              onClose();
            }}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          className={`p-4 border-b flex flex-col sm:flex-row gap-3 items-center justify-between ${
            isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-100/70 border-slate-200'
          }`}
        >
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cooperativa o ciudad (Ej: Quito, Guayaquil, Baños)..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-400'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
              }`}
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'todos', label: `Todas (${ALLIED_COOPERATIVES.length})` },
              { id: 'quito', label: '📍 Quito' },
              { id: 'guayaquil', label: '📍 Guayaquil' },
              { id: 'ibarra', label: '📍 Ibarra' },
              { id: 'oriente', label: '🌴 Oriente' },
            ].map((filter) => {
              const isSel = selectedFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setSelectedFilter(filter.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    isSel
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black'
                      : isDark
                      ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCooperatives.map((coop) => (
            <div
              key={coop.id}
              className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between gap-3.5 transition-all hover:border-blue-400/50 shadow-lg ${
                isDark ? 'bg-zinc-950/80 border-zinc-800 hover:bg-zinc-900' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-3xl flex-shrink-0">{coop.logoIcon}</span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-white truncate leading-snug">
                        {coop.name}
                      </h4>
                      <p className="text-[11px] text-blue-400 font-mono font-bold">
                        {coop.terminalLocation}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex-shrink-0">
                    {coop.badge}
                  </span>
                </div>

                {/* Description */}
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  {coop.description}
                </p>

                {/* Destinations Chips */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Destinos Principales Cobertura:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {coop.destinations.map((dest, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isDark
                            ? 'bg-zinc-900 text-emerald-300 border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        📍 {dest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Official Routes */}
                <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800/80">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Rutas Oficiales Frecuentes:
                  </span>
                  {coop.officialRoutes.map((route, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-mono">
                      <Navigation className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span>{route}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                {coop.contactPhone && (
                  <a
                    href={`tel:${coop.contactPhone.replace(/\s+/g, '')}`}
                    onClick={() => haptic.tap()}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                      isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Llamar Central</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    haptic.confirmTrip();
                    if (onSelectCooperative) {
                      onSelectCooperative(coop);
                    }
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <span>Reservar Ruta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Todas las cooperativas cuentan con permiso de operación homologado por la ANT y Terminal Terrestre Tulcán.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
            }`}
          >
            Cerrar Directorio
          </button>
        </div>
      </div>
    </div>
  );
};

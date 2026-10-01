import React from 'react';
import { AdminWorker, UserRole } from '../../types';
import {
  Shield,
  Layers,
  Package,
  Navigation,
  DollarSign,
  Users,
  Settings2,
  ExternalLink,
  LogOut,
  Car,
  User,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  BarChart3,
  Plane,
} from 'lucide-react';

interface AdminSidebarHubProps {
  currentAdminUser: AdminWorker | null;
  onOpenFullPanel: (initialTab?: string) => void;
  onSwitchRole: (role: UserRole) => void;
  onLogoutAdmin: () => void;
  pendingRechargesCount: number;
  activeEncomiendasCount: number;
  trackedDriversCount: number;
  cantonsCount?: number;
  isDark?: boolean;
}

export const AdminSidebarHub: React.FC<AdminSidebarHubProps> = ({
  currentAdminUser,
  onOpenFullPanel,
  onSwitchRole,
  onLogoutAdmin,
  pendingRechargesCount,
  activeEncomiendasCount,
  trackedDriversCount,
  cantonsCount,
  isDark = true,
}) => {
  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* 1. ADMIN IDENTITY & LEVEL CARD */}
      <div className={`p-4 rounded-2xl border-2 shadow-lg relative overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-purple-950/80 via-zinc-900 to-zinc-900 border-purple-500/50' : 'bg-gradient-to-br from-purple-50 to-white border-purple-200'
      }`}>
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
          isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'
        }`} />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black shadow-md text-base ${
                isDark ? 'bg-purple-900/60 border-purple-400 text-purple-200' : 'bg-purple-100 border-purple-300 text-purple-700'
              }`}>
                {currentAdminUser?.fullName
                  ? currentAdminUser.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
                  : 'AD'}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isDark ? 'bg-emerald-500 border-zinc-900' : 'bg-emerald-500 border-white'
              }`}>
                <CheckCircle2 className="w-2.5 h-2.5 text-zinc-950" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentAdminUser?.fullName || 'Super Administrador'}
                </span>
              </div>
              <p className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                <Shield className="w-3.5 h-3.5" />
                <span>
                  {currentAdminUser?.roleTitle || 'Super Administrador Nacional'}
                </span>
              </p>
              <p className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                CI: {currentAdminUser?.cedula || '1004721351'} • Sede Matriz Carchi (Tulcán)
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-700 border-purple-200'
          }`}>
            ACTIVO
          </span>
        </div>

        {/* Action button inside card */}
        <div className={`mt-3.5 pt-3 border-t flex items-center justify-between ${isDark ? 'border-purple-500/30' : 'border-purple-200'}`}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className={`text-[11px] font-bold ${isDark ? 'text-purple-200/90' : 'text-purple-700'}`}>
              Matriz Tulcán (Carchi)
            </span>
          </div>
          <button
            onClick={() => onOpenFullPanel()}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-950 transition-transform active:scale-95"
          >
            <span>Panel Maestro</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME OPERATIONAL METRICS */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onOpenFullPanel('recargas')}
          className={`p-3 rounded-2xl border-2 hover:border-amber-500/50 text-left transition-all group shadow-sm ${
            isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Recargas</span>
            <DollarSign className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className={`text-xl font-black block ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{pendingRechargesCount}</span>
          <span className={`text-[10px] font-semibold block ${isDark ? 'text-amber-300/80' : 'text-amber-500'}`}>
            {pendingRechargesCount > 0 ? 'Requieren revisión' : 'Todo al día'}
          </span>
        </button>

        <button
          onClick={() => onOpenFullPanel('encomiendas')}
          className={`p-3 rounded-2xl border-2 hover:border-sky-500/50 text-left transition-all group shadow-sm ${
            isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Encomiendas</span>
            <Package className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className={`text-xl font-black block ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>{activeEncomiendasCount}</span>
          <span className={`text-[10px] font-semibold block ${isDark ? 'text-sky-300/80' : 'text-sky-500'}`}>Guías en curso</span>
        </button>

        <button
          onClick={() => onOpenFullPanel('tracking')}
          className={`p-3 rounded-2xl border-2 hover:border-emerald-500/50 text-left transition-all group shadow-sm ${
            isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Unidades GPS</span>
            <Navigation className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className={`text-xl font-black block ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{trackedDriversCount}</span>
          <span className={`text-[10px] font-semibold block ${isDark ? 'text-emerald-300/80' : 'text-emerald-500'}`}>En telemetría</span>
        </button>

        <button
          onClick={() => onOpenFullPanel('tarifas')}
          className={`p-3 rounded-2xl border-2 hover:border-amber-500/50 text-left transition-all group shadow-sm ${
            isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tarifas</span>
            <DollarSign className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className={`text-xl font-black block ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>$1.25</span>
          <span className={`text-[10px] font-semibold block ${isDark ? 'text-amber-300/80' : 'text-amber-500'}`}>Oficial Ecuador</span>
        </button>
      </div>

      {/* 3. CORE MANAGEMENT SHORTCUTS */}
      <div className={`p-4 rounded-2xl border-2 space-y-2.5 shadow-sm ${
        isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
      }`}>
        <h4 className={`text-xs font-black uppercase tracking-wider flex items-center justify-between ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
          <span>Módulos de Gestión Rápida</span>
          <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>24 Provincias</span>
        </h4>

        <div className="space-y-1.5">
          <button
            onClick={() => onOpenFullPanel('ejecutivo_quito')}
            className={`w-full p-2.5 rounded-xl border-2 flex items-center justify-between text-xs transition-all group shadow-md cursor-pointer ${
              isDark 
                ? 'bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-zinc-850 hover:from-blue-900/90 hover:to-zinc-800 border-blue-500/50 text-zinc-200' 
                : 'bg-gradient-to-r from-blue-50 to-white hover:bg-blue-100 border-blue-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border group-hover:scale-105 transition-transform ${
                isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-100 text-blue-600 border-blue-200'
              }`}>
                <Plane className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className={`font-bold block flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>Ejecutivo a Quito & Aeropuerto</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold border ${
                    isDark ? 'bg-blue-500/20 text-blue-300 border-blue-400/40' : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    VIP
                  </span>
                </span>
                <span className={`text-[10px] ${isDark ? 'text-blue-300/80' : 'text-blue-600'}`}>Monitoreo de choferes y despacho Tababela ($25/asiento)</span>
              </div>
            </div>
            <span className={`text-[11px] font-bold group-hover:translate-x-0.5 transition-transform ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Despacho →</span>
          </button>

          <button
            onClick={() => onOpenFullPanel('financiero')}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all group shadow-sm ${
              isDark 
                ? 'bg-gradient-to-r from-purple-950/60 to-zinc-850 hover:from-purple-900/80 hover:to-zinc-800 border-purple-500/40 text-zinc-200' 
                : 'bg-gradient-to-r from-purple-50 to-white hover:bg-purple-100 border-purple-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className={`w-4 h-4 group-hover:scale-110 transition-transform ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <div className="text-left">
                <span className={`font-bold block flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span>Tablero de Control Financiero</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                    isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-700 border-purple-200'
                  }`}>
                    Recharts
                  </span>
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Ingresos choferes, billetera virtual y crecimiento</span>
              </div>
            </div>
            <span className={`text-[11px] font-bold group-hover:translate-x-0.5 transition-transform ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Ver →</span>
          </button>

          <button
            onClick={() => onOpenFullPanel('encomiendas')}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all group ${
              isDark ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Emitir / Gestionar Encomiendas</span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Guías de remisión oficiales con PIN</span>
              </div>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400 group-hover:text-amber-300' : 'text-slate-400 group-hover:text-amber-600'}`}>Ir →</span>
          </button>

          <button
            onClick={() => onOpenFullPanel('tracking')}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all group ${
              isDark ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Navigation className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Monitoreo Satelital de Flota</span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Rastreo GPS en tiempo real de unidades</span>
              </div>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400 group-hover:text-emerald-300' : 'text-slate-400 group-hover:text-emerald-600'}`}>Ir →</span>
          </button>

          <button
            onClick={() => onOpenFullPanel('recargas')}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all group ${
              isDark ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Aprobación de Recargas & Caja</span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>DeUna, Banco Pichincha, Guayaquil</span>
              </div>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400 group-hover:text-sky-300' : 'text-slate-400 group-hover:text-sky-600'}`}>Ir →</span>
          </button>

          <button
            onClick={() => onOpenFullPanel('tarifas')}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all group ${
              isDark ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Tarifas Oficiales & Recargos</span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tarifa base $1.25, nocturna y festivos</span>
              </div>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400 group-hover:text-amber-300' : 'text-slate-400 group-hover:text-amber-600'}`}>Ir →</span>
          </button>

          <button
            onClick={() => onOpenFullPanel('personal')}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all group ${
              isDark ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              <div className="text-left">
                <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Equipo de Trabajo (24 Provincias)</span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>John Yepez, Esmeralda López y personal</span>
              </div>
            </div>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400 group-hover:text-rose-300' : 'text-slate-400 group-hover:text-rose-600'}`}>Ir →</span>
          </button>
        </div>
      </div>

      {/* 4. SWITCH ROLE OR LOG OUT */}
      <div className={`p-4 rounded-2xl border-2 space-y-3 shadow-sm ${
        isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-white border-slate-200'
      }`}>
        <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Cambiar a otra vista
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSwitchRole('cliente')}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <User className="w-4 h-4 text-emerald-400" />
            <span>Ver como Cliente</span>
          </button>

          <button
            onClick={() => onSwitchRole('conductor')}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Car className="w-4 h-4 text-amber-400" />
            <span>Ver como Conductor</span>
          </button>
        </div>

        <button
          onClick={onLogoutAdmin}
          className="w-full p-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-xs font-bold text-red-500 flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión de Administrador</span>
        </button>
      </div>
    </div>
  );
};

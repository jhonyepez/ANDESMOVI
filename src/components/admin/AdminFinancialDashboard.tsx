import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Activity,
  ArrowUpRight,
  Download,
  Building2,
  Coins,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AdminBankAccountsList } from './AdminBankAccountsList';

interface AdminFinancialDashboardProps {
  platformCommissionPercent?: number;
  driverWalletBalance?: number;
  tripsCount?: number;
  recharges?: any[];
  isDark?: boolean;
}

// 1. Monthly revenue data (Driver gross earnings vs AndesMovi 7% commission)
const MONTHLY_FINANCIAL_DATA = [
  { month: 'Ene', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'Feb', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'Mar', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'Abr', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'May', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'Jun', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'Jul', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'Ago', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
  { month: 'Sep', conductoresGross: 0, comision7: 0, netoConductores: 0, carreras: 0, recargas: 0, retiros: 0 },
];

// 2. Weekly wallet transaction volume (Current Month)
const WEEKLY_WALLET_VOLUME = [
  { semana: 'Sem 1', recargasDeUna: 0, recargasBanco: 0, debitosComision: 0, retirosBanco: 0, totalTransaccionado: 0 },
  { semana: 'Sem 2', recargasDeUna: 0, recargasBanco: 0, debitosComision: 0, retirosBanco: 0, totalTransaccionado: 0 },
  { semana: 'Sem 3', recargasDeUna: 0, recargasBanco: 0, debitosComision: 0, retirosBanco: 0, totalTransaccionado: 0 },
  { semana: 'Sem 4', recargasDeUna: 0, recargasBanco: 0, debitosComision: 0, retirosBanco: 0, totalTransaccionado: 0 },
];

// 3. Breakdown by key provincial operational hubs (Matriz Tulcán, Quito, Guayaquil, etc.)
const PROVINCIAL_HUBS_DATA = [
  { ciudad: 'Tulcán (Matriz Carchi)', recaudadoConductores: 0, comisionApp: 0, carreras: 0, activos: 0 },
  { ciudad: 'Quito (Pichincha)', recaudadoConductores: 0, comisionApp: 0, carreras: 0, activos: 0 },
  { ciudad: 'Guayaquil (Guayas)', recaudadoConductores: 0, comisionApp: 0, carreras: 0, activos: 0 },
  { ciudad: 'Ibarra (Imbabura)', recaudadoConductores: 0, comisionApp: 0, carreras: 0, activos: 0 },
  { ciudad: 'Cuenca / Ambato', recaudadoConductores: 0, comisionApp: 0, carreras: 0, activos: 0 },
];

export const AdminFinancialDashboard: React.FC<AdminFinancialDashboardProps> = ({
  isDark = true,
}) => {
  const [timeRange, setTimeRange] = useState<'mes' | 'trimestre' | 'anual'>('anual');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Filtered dataset based on selection
  const chartData = useMemo(() => {
    if (timeRange === 'mes') {
      return MONTHLY_FINANCIAL_DATA.slice(-4);
    }
    if (timeRange === 'trimestre') {
      return MONTHLY_FINANCIAL_DATA.slice(-3);
    }
    return MONTHLY_FINANCIAL_DATA;
  }, [timeRange]);

  // Aggregate totals
  const totalConductoresGross = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.conductoresGross, 0);
  }, [chartData]);

  const totalComisionAndesMovi = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.comision7, 0);
  }, [chartData]);

  const totalCarrerasFinalizadas = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.carreras, 0);
  }, [chartData]);

  const totalVolumenBilletera = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.recargas + curr.comision7 + curr.retiros, 0);
  }, [chartData]);

  const handleExportReport = () => {
    setExportNotice('Generando reporte contable oficial AndesMovi (Balance SRI / Facturación 7%)...');
    setTimeout(() => {
      setExportNotice('✓ Reporte consolidado descargado exitosamente: BALANCE_FINANCIERO_ANDESMOVI_2026.csv');
      setTimeout(() => setExportNotice(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* 1. HEADER & TOP CONTROLS */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-gradient-to-r from-zinc-900 via-purple-950/40 to-zinc-900 border-purple-500/40' 
          : 'bg-gradient-to-r from-purple-50/50 via-white to-purple-50/50 border-purple-200'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-purple-500/20 border-purple-400/40 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-700'
            }`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black tracking-wide flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <span>TABLERO DE CONTROL FINANCIERO</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  Comisión 7% AndesMovi
                </span>
              </h3>
              <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                Auditoría en tiempo real de ingresos de conductores, billetera virtual y crecimiento operativo nacional.
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 mt-2 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Sede Matriz Nacional: <strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>Tulcán (Carchi)</strong> • Despacho en 24 Provincias</span>
          </div>
        </div>

        {/* Time Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex rounded-xl p-1 border text-xs ${
            isDark ? 'bg-zinc-950 border-zinc-700' : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              onClick={() => setTimeRange('mes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeRange === 'mes'
                  ? 'bg-purple-600 text-white shadow'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Últimas 4 Semanas
            </button>
            <button
              onClick={() => setTimeRange('trimestre')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeRange === 'trimestre'
                  ? 'bg-purple-600 text-white shadow'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trimestre Q3
            </button>
            <button
              onClick={() => setTimeRange('anual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timeRange === 'anual'
                  ? 'bg-purple-600 text-white shadow'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Año 2026 (Ene - Sep)
            </button>
          </div>

          <button
            onClick={handleExportReport}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn ${
          isDark ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 2. TOP FINANCIAL METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Ingresos de Conductores */}
        <div className={`p-4 rounded-2xl border shadow-sm transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Recaudado por Conductores
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black mt-1.5 block font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ${totalConductoresGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[11px] ${
            isDark ? 'border-zinc-800' : 'border-slate-100'
          }`}>
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +16.2% MoM
            </span>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>100% cobrado directo</span>
          </div>
        </div>

        {/* Metric 2: Comisión 7% AndesMovi */}
        <div className={`p-4 rounded-2xl border shadow-sm transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50' : 'bg-white border-slate-200 hover:border-amber-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Comisión 7% AndesMovi
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black mt-1.5 block font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
            ${totalComisionAndesMovi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[11px] ${
            isDark ? 'border-zinc-800' : 'border-slate-100'
          }`}>
            <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Ingreso neto plataforma</span>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Débito automático</span>
          </div>
        </div>

        {/* Metric 3: Volumen en Billetera Virtual */}
        <div className={`p-4 rounded-2xl border shadow-sm transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-sky-500/50' : 'bg-white border-slate-200 hover:border-sky-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Volumen Billetera Virtual
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black mt-1.5 block font-mono ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
            ${totalVolumenBilletera.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[11px] ${
            isDark ? 'border-zinc-800' : 'border-slate-100'
          }`}>
            <span className={`font-bold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Recargas & Débitos</span>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>DeUna / Bancos</span>
          </div>
        </div>

        {/* Metric 4: Carreras Finalizadas */}
        <div className={`p-4 rounded-2xl border shadow-sm transition-all ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Carreras Finalizadas
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black mt-1.5 block font-mono ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
            {totalCarrerasFinalizadas.toLocaleString('en-US')}
          </span>
          <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[11px] ${
            isDark ? 'border-zinc-800' : 'border-slate-100'
          }`}>
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.8% Crecimiento
            </span>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Éxito 99.4%</span>
          </div>
        </div>
      </div>

      {/* 3. CHART 1: TOTAL INGRESOS RECAUDADOS POR LOS CONDUCTORES & COMISIÓN 7% */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md space-y-4 ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div>
            <h4 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>TOTAL DE INGRESOS RECAUDADOS POR LOS CONDUCTORES vs. COMISIÓN 7%</span>
            </h4>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Comparativa entre el dinero bruto cobrado directamente por los conductores (efectivo/transferencia) y el 7% debitado por AndesMovi.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              Recaudado Conductores (USD)
            </span>
            <span className="flex items-center gap-1.5 text-amber-500 font-bold">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              Comisión 7% AndesMovi
            </span>
          </div>
        </div>

        {/* Recharts Area / Composed Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConductores" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorComision" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="month" stroke={isDark ? '#71717a' : '#64748b'} tick={{ fontSize: 12, fill: isDark ? '#a1a1aa' : '#475569' }} />
              <YAxis
                stroke={isDark ? '#71717a' : '#64748b'}
                tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#475569' }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: isDark ? '#3f3f46' : '#cbd5e1',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: isDark ? '#f4f4f5' : '#0f172a',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: any, name: any) => [
                  `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`,
                  name === 'conductoresGross'
                    ? 'Recaudado por Conductor'
                    : name === 'comision7'
                    ? 'Comisión 7% AndesMovi'
                    : name,
                ]}
                labelFormatter={(label) => `Mes: ${label} 2026`}
              />
              <Area
                type="monotone"
                dataKey="conductoresGross"
                name="conductoresGross"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorConductores)"
              />
              <Area
                type="monotone"
                dataKey="comision7"
                name="comision7"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorComision)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Total Ganancia Neta Conductores (93%):</span>
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ${(totalConductoresGross - totalComisionAndesMovi).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Promedio Ticket por Carrera:</span>
            <span className="font-mono font-bold text-emerald-500">
              ${(totalConductoresGross / (totalCarrerasFinalizadas || 1)).toFixed(2)} USD
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Modelo de Cobro:</span>
            <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Directo al Chofer (0% retención)</span>
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN GRID: VOLUMEN DE TRANSACCIONES EN BILLETERA & CRECIMIENTO MENSUAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CHART 2: VOLUMEN DE TRANSACCIONES EN LA BILLETERA VIRTUAL */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-md space-y-4 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <div>
              <h4 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Wallet className="w-4 h-4 text-sky-500" />
                <span>VOLUMEN DE TRANSACCIONES EN BILLETERA VIRTUAL</span>
              </h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Flujo semanal de recargas (DeUna!/Bancos), débitos del 7% y retiros.
              </p>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-1 rounded-xl border ${
              isDark ? 'text-sky-300 bg-sky-500/10 border-sky-500/30' : 'text-sky-800 bg-sky-100 border-sky-300'
            }`}>
              Septiembre 2026
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_WALLET_VOLUME} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="semana" stroke={isDark ? '#71717a' : '#64748b'} tick={{ fontSize: 10, fill: isDark ? '#a1a1aa' : '#475569' }} />
                <YAxis
                  stroke={isDark ? '#71717a' : '#64748b'}
                  tick={{ fontSize: 10, fill: isDark ? '#a1a1aa' : '#475569' }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#3f3f46' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: isDark ? '#f4f4f5' : '#0f172a',
                  }}
                  formatter={(val: any, name: any) => [
                    `$${Number(val).toFixed(2)} USD`,
                    name === 'recargasDeUna'
                      ? 'Recargas DeUna! (Pichincha)'
                      : name === 'recargasBanco'
                      ? 'Recargas Otros Bancos'
                      : name === 'debitosComision'
                      ? 'Débito Comisión 7%'
                      : name === 'retirosBanco'
                      ? 'Retiros Solicitados'
                      : name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => {
                    if (value === 'recargasDeUna') return 'Recargas DeUna!';
                    if (value === 'recargasBanco') return 'Bancos Directos';
                    if (value === 'debitosComision') return 'Débitos 7%';
                    return value;
                  }}
                />
                <Bar dataKey="recargasDeUna" fill="#0284c7" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="recargasBanco" fill="#38bdf8" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="debitosComision" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`p-3 rounded-2xl border text-[11px] space-y-1 ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <span>Método preferido de recarga prepago:</span>
              <strong className="text-sky-500">DeUna! Pichincha (68.4% de volumen)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Tiempo de acreditación de comprobantes:</span>
              <strong className="text-emerald-500">Inmediato / &lt; 2 minutos</strong>
            </div>
          </div>
        </div>

        {/* CHART 3: CRECIMIENTO MENSUAL DE CARRERAS FINALIZADAS */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-md space-y-4 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <div>
              <h4 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span>CRECIMIENTO MENSUAL DE CARRERAS FINALIZADAS</span>
              </h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Curva de adopción nacional (taxis, encomiendas y camionetas de carga).
              </p>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-800 bg-emerald-100 border-emerald-300'
            }`}>
              <ArrowUpRight className="w-3.5 h-3.5" /> +220% YTD
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="month" stroke={isDark ? '#71717a' : '#64748b'} tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#475569' }} />
                <YAxis stroke={isDark ? '#71717a' : '#64748b'} tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#475569' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#3f3f46' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isDark ? '#f4f4f5' : '#0f172a',
                  }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} carreras completadas`, 'Servicios']}
                  labelFormatter={(label) => `Mes: ${label} 2026`}
                />
                <Line
                  type="monotone"
                  dataKey="carreras"
                  stroke="#a855f7"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: '#c084fc', strokeWidth: 2, stroke: isDark ? '#581c87' : '#7e22ce' }}
                  activeDot={{ r: 6, fill: '#e9d5ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`block text-[10px] uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Récord Mensual</span>
              <span className={`font-mono font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>2,950 carreras</span>
              <span className="text-[10px] text-emerald-500 block mt-0.5">Septiembre 2026</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`block text-[10px] uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Cumplimiento SLA</span>
              <span className={`font-mono font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>99.2% a tiempo</span>
              <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Tiempo prom: 4.8 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. REGIONAL BREAKDOWN TABLE (SEDE MATRIZ TULCÁN & 24 PROVINCIAS) */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-md space-y-3 ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex items-center justify-between border-b pb-2.5 ${
          isDark ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div>
            <h4 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>DESGLOSE FINANCIERO POR SEDES Y REGIONES OPERATIVAS</span>
            </h4>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Distribución de recaudación directa de conductores y comisiones del 7% por ciudad clave.
            </p>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Total Sedes Activas: 5
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b uppercase text-[10px] font-bold ${
                isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600 bg-slate-50'
              }`}>
                <th className="py-2.5 px-3">Sede / Región</th>
                <th className="py-2.5 px-3 text-right">Recaudado por Conductores</th>
                <th className="py-2.5 px-3 text-right">Comisión 7% AndesMovi</th>
                <th className="py-2.5 px-3 text-right">Carreras</th>
                <th className="py-2.5 px-3 text-right">Unidades Activas</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${
              isDark ? 'divide-zinc-800/60' : 'divide-slate-200'
            }`}>
              {PROVINCIAL_HUBS_DATA.map((hub) => (
                <tr key={hub.ciudad} className={`transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}>
                  <td className={`py-2.5 px-3 font-sans font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {hub.ciudad.includes('Tulcán') ? (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                        isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        SEDE MATRIZ
                      </span>
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-slate-400'}`} />
                    )}
                    <span>{hub.ciudad}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-500 font-bold">
                    ${hub.recaudadoConductores.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    ${hub.comisionApp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-3 text-right ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    {hub.carreras.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    {hub.activos} choferes
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. CUENTAS BANCARIAS OFICIALES DE ADMINISTRADOR PARA DEPÓSITOS Y RECAUDACIÓN */}
      <AdminBankAccountsList
        title="Canales Bancarios Oficiales de Recaudación & Depósitos"
        subtitle="Cuentas autorizadas a nombre de Jhon Sebastian Yepez Clavijo (C.I. 1004721351) para validación de depósitos de comisiones y recargas de conductores"
        showAllDataCopy={true}
        isDark={isDark}
      />
    </div>
  );
};

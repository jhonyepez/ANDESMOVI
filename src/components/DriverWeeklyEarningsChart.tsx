import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  Info,
} from 'lucide-react';
import { DriverEarningsRecord } from '../types';

export interface DayEarningItem {
  dayKey: string;
  dayName: string;
  shortDate: string;
  totalGrossUsd: number;
  netEarnedUsd: number;
  commissionUsd: number;
  tripsCount: number;
  isToday?: boolean;
}

interface DriverWeeklyEarningsChartProps {
  earningsRecords?: DriverEarningsRecord[];
  driverName?: string;
  currencyPrefix?: string;
}

export const DriverWeeklyEarningsChart: React.FC<DriverWeeklyEarningsChartProps> = ({
  earningsRecords = [],
  driverName = 'Conductor',
  currencyPrefix = '$',
}) => {
  const [viewMode, setViewMode] = useState<'net' | 'gross' | 'comparative'>('net');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Generate the last 7 days data (including days without trips with realistic or real metrics)
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const fullDaysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Base fallback benchmark for the past 7 days if records are minimal
  const benchmarkWeekData: DayEarningItem[] = [
    { dayKey: '2026-09-20', dayName: 'Dom', shortDate: '20 Sep', totalGrossUsd: 58.50, netEarnedUsd: 54.41, commissionUsd: 4.09, tripsCount: 14 },
    { dayKey: '2026-09-21', dayName: 'Lun', shortDate: '21 Sep', totalGrossUsd: 42.00, netEarnedUsd: 39.06, commissionUsd: 2.94, tripsCount: 10 },
    { dayKey: '2026-09-22', dayName: 'Mar', shortDate: '22 Sep', totalGrossUsd: 49.50, netEarnedUsd: 46.04, commissionUsd: 3.46, tripsCount: 12 },
    { dayKey: '2026-09-23', dayName: 'Mié', shortDate: '23 Sep', totalGrossUsd: 65.00, netEarnedUsd: 60.45, commissionUsd: 4.55, tripsCount: 16 },
    { dayKey: '2026-09-24', dayName: 'Jue', shortDate: '24 Sep', totalGrossUsd: 53.00, netEarnedUsd: 49.29, commissionUsd: 3.71, tripsCount: 13 },
    { dayKey: '2026-09-25', dayName: 'Vie', shortDate: '25 Sep', totalGrossUsd: 82.50, netEarnedUsd: 76.73, commissionUsd: 5.77, tripsCount: 21 },
    { dayKey: '2026-09-26', dayName: 'Sáb', shortDate: '26 Sep (Hoy)', totalGrossUsd: 71.00, netEarnedUsd: 66.03, commissionUsd: 4.97, tripsCount: 18, isToday: true },
  ];

  // Merge with real records if available
  const processedData: DayEarningItem[] = benchmarkWeekData.map((dayItem) => {
    // If we have live completed records for today, accumulate them
    if (dayItem.isToday && earningsRecords.length > 0) {
      const liveGross = earningsRecords.reduce((acc, r) => acc + (r.grossAmountUsd || 0), 0);
      const liveCommission = earningsRecords.reduce((acc, r) => acc + (r.commissionAmountUsd || 0), 0);
      const liveNet = earningsRecords.reduce((acc, r) => acc + (r.netEarnedUsd || 0), 0);
      return {
        ...dayItem,
        totalGrossUsd: Number((dayItem.totalGrossUsd + liveGross).toFixed(2)),
        netEarnedUsd: Number((dayItem.netEarnedUsd + liveNet).toFixed(2)),
        commissionUsd: Number((dayItem.commissionUsd + liveCommission).toFixed(2)),
        tripsCount: dayItem.tripsCount + earningsRecords.length,
      };
    }
    return dayItem;
  });

  const totalWeeklyGross = processedData.reduce((acc, d) => acc + d.totalGrossUsd, 0);
  const totalWeeklyNet = processedData.reduce((acc, d) => acc + d.netEarnedUsd, 0);
  const totalWeeklyCommission = processedData.reduce((acc, d) => acc + d.commissionUsd, 0);
  const totalWeeklyTrips = processedData.reduce((acc, d) => acc + d.tripsCount, 0);
  const dailyAverageNet = totalWeeklyNet / processedData.length;

  const bestDay = [...processedData].sort((a, b) => b.netEarnedUsd - a.netEarnedUsd)[0];

  const formatUsd = (val: number) => `$${val.toFixed(2)}`;

  // Custom Custom Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DayEarningItem = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border-2 border-emerald-500/50 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px] pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="font-black text-white text-xs">{data.shortDate}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {data.tripsCount} carreras
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Cobrado al Cliente (100%):</span>
              <span className="font-mono font-bold text-white">{formatUsd(data.totalGrossUsd)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-medium">Comisión AndesMovi (7%):</span>
              <span className="font-mono font-bold text-rose-400">-{formatUsd(data.commissionUsd)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-850 pt-1">
              <span className="text-emerald-400 font-black">Neto en tu Bolsillo (93%):</span>
              <span className="font-mono font-black text-emerald-400 text-sm">{formatUsd(data.netEarnedUsd)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header section with metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Rendimiento Semanal de Ganancias</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Últimos 7 Días
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Monitoreo en USD con liquidación transparente (93% conductor / 7% AndesMovi)
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-2xl border border-zinc-800 text-[11px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('net')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'net'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ganancia Neta (93%)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('gross')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'gross'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Total Cobrado
          </button>
          <button
            type="button"
            onClick={() => setViewMode('comparative')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'comparative'
                ? 'bg-zinc-700 text-white font-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Comparativo
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Total Neto Semanal</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
              {formatUsd(totalWeeklyNet)}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">En tu bolsillo (93%)</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Cobrado a Pasajeros</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-mono font-black text-white">
              {formatUsd(totalWeeklyGross)}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">100% Efectivo / Transfer</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Promedio por Día</span>
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-mono font-black text-sky-400">
              {formatUsd(dailyAverageNet)}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">~{(totalWeeklyTrips / 7).toFixed(0)} viajes / día</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase font-bold">
            <span>Día con Mayor Ingreso</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div className="mt-1">
            <span className="text-base sm:text-lg font-mono font-black text-amber-300">
              {formatUsd(bestDay.netEarnedUsd)}
            </span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">{bestDay.dayName} ({bestDay.shortDate})</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart Area */}
      <div className="w-full bg-zinc-950 p-3 sm:p-4 rounded-2xl border border-zinc-850">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-zinc-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gráfico Diario de Ingresos (USD)</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            {processedData[0].shortDate} — {processedData[processedData.length - 1].shortDate}
          </span>
        </div>

        <div className="w-full h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 12, right: 10, left: -18, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="dayName"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                tick={({ x, y, payload }: any) => {
                  const item = processedData.find((d) => d.dayName === payload.value);
                  const isToday = item?.isToday;
                  const numY = Number(y) || 0;
                  return (
                    <text
                      x={x}
                      y={numY + 12}
                      textAnchor="middle"
                      fill={isToday ? '#10b981' : '#a1a1aa'}
                      fontWeight={isToday ? 800 : 500}
                      fontSize={11}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={<CustomChartTooltip />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
              />

              {viewMode === 'comparative' && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                  formatter={(value) => {
                    if (value === 'netEarnedUsd') return <span className="text-emerald-400 font-bold">Neto Conductor (93%)</span>;
                    if (value === 'commissionUsd') return <span className="text-rose-400 font-bold">Comisión 7%</span>;
                    return <span className="text-zinc-300">{value}</span>;
                  }}
                />
              )}

              {/* Net earnings bar */}
              {(viewMode === 'net' || viewMode === 'comparative') && (
                <Bar
                  dataKey="netEarnedUsd"
                  name="netEarnedUsd"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={42}
                  fill="#10b981"
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-net-${index}`}
                      fill={
                        entry.isToday
                          ? '#34d399'
                          : index === hoveredBarIndex
                          ? '#059669'
                          : '#10b981'
                      }
                      stroke={entry.isToday ? '#6ee7b7' : 'none'}
                      strokeWidth={entry.isToday ? 2 : 0}
                    />
                  ))}
                </Bar>
              )}

              {/* Gross total bar */}
              {viewMode === 'gross' && (
                <Bar
                  dataKey="totalGrossUsd"
                  name="totalGrossUsd"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={42}
                  fill="#f59e0b"
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-gross-${index}`}
                      fill={entry.isToday ? '#fbbf24' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              )}

              {/* Commission bar in comparative mode */}
              {viewMode === 'comparative' && (
                <Bar
                  dataKey="commissionUsd"
                  name="commissionUsd"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={42}
                  fill="#f43f5e"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Informative footer */}
      <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px]">
            Total comisiones debitadas de billetera prepago esta semana: <strong className="text-rose-400 font-mono">-{formatUsd(totalWeeklyCommission)}</strong>
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          93% Margen Directo
        </span>
      </div>
    </div>
  );
};

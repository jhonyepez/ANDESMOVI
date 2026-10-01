import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Driver } from '../../types';
import { TrendingUp } from 'lucide-react';

interface DriverStatsSectionProps {
  drivers: Driver[];
  isDark?: boolean;
}

export const DriverStatsSection: React.FC<DriverStatsSectionProps> = ({ drivers, isDark = true }) => {
  // Generate dummy weekly data based on current driver stats
  const weeklyData = [
    { name: 'Lun', ingresos: 120, viajes: 15 },
    { name: 'Mar', ingresos: 150, viajes: 18 },
    { name: 'Mié', ingresos: 110, viajes: 12 },
    { name: 'Jue', ingresos: 180, viajes: 22 },
    { name: 'Vie', ingresos: 250, viajes: 30 },
    { name: 'Sáb', ingresos: 300, viajes: 35 },
    { name: 'Dom', ingresos: 200, viajes: 25 },
  ];

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.telemetry?.operationalStatus !== 'desconectado').length;
  const totalTrips = drivers.reduce((acc, d) => acc + (d.telemetry?.todayTripsCount || 0), 0);
  const totalEarnings = drivers.reduce((acc, d) => acc + (d.telemetry?.todayEarningsUsd || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <h4 className={`text-xs font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Conductores Activos</h4>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeDrivers} / {totalDrivers}</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <h4 className={`text-xs font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Viajes Hoy</h4>
          <p className="text-2xl font-black text-emerald-500 mt-1">{totalTrips}</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <h4 className={`text-xs font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Ingresos Hoy</h4>
          <p className="text-2xl font-black text-amber-500 mt-1">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <h3 className={`font-black text-lg mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <TrendingUp className="text-amber-500" />
          Rendimiento Semanal (Ingresos vs Viajes)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e2e8f0'} />
              <XAxis dataKey="name" stroke={isDark ? '#888' : '#64748b'} />
              <YAxis stroke={isDark ? '#888' : '#64748b'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: isDark ? '#333' : '#cbd5e1',
                  color: isDark ? '#ffffff' : '#0f172a',
                  borderRadius: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos ($)" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                {weeklyData.map((_, index) => <Cell key={`cell-${index}`} fill="#f59e0b" />)}
              </Bar>
              <Bar dataKey="viajes" name="Viajes" fill="#10b981" radius={[4, 4, 0, 0]}>
                {weeklyData.map((_, index) => <Cell key={`cell-v-${index}`} fill="#10b981" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

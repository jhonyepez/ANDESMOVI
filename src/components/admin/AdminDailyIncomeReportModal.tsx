import React, { useState } from 'react';
import {
  Printer,
  Calendar,
  DollarSign,
  Building2,
  MapPin,
  X,
  Percent,
} from 'lucide-react';
import { formatCurrency } from '../../utils/geoUtils';
import { ECUADOR_COOPERATIVAS, ECUADOR_TERMINALES } from '../../services/databaseService';

interface AdminDailyIncomeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

// Datos simulados de ingresos diarios por fecha y cooperativa en Ecuador (USD)
const DAILY_INCOME_DATA = [
  {
    date: '2026-09-22',
    dateFormatted: 'Hoy, 22 Sep 2026',
    totalTrips: 0,
    grossFareUsd: 0,
    platformCommissionUsd: 0,
    driverNetUsd: 0,
    cooperativa: 'Coop. Taxi Los Lagos',
    terminal: 'Terminal Carcelén (Quito)',
    topService: 'Carrera Urbana ($1.25 base)',
  },
  {
    date: '2026-09-21',
    dateFormatted: 'Ayer, 21 Sep 2026',
    totalTrips: 0,
    grossFareUsd: 0,
    platformCommissionUsd: 0,
    driverNetUsd: 0,
    cooperativa: 'Coop. Taxi Atahualpa',
    terminal: 'Terminal Terrestre Ibarra',
    topService: 'Carrera Urbana ($1.25 base)',
  },
  {
    date: '2026-09-20',
    dateFormatted: 'Dom, 20 Sep 2026',
    totalTrips: 0,
    grossFareUsd: 0,
    platformCommissionUsd: 0,
    driverNetUsd: 0,
    cooperativa: 'Coop. Ciudad de Tulcán',
    terminal: 'Terminal Terrestre Tulcán',
    topService: 'Frontera Rumichaca',
  },
  {
    date: '2026-09-19',
    dateFormatted: 'Sáb, 19 Sep 2026',
    totalTrips: 0,
    grossFareUsd: 0,
    platformCommissionUsd: 0,
    driverNetUsd: 0,
    cooperativa: 'Coop. Taxi Pichincha',
    terminal: 'Terminal Quitumbe (Quito)',
    topService: 'Intercantonal & Delivery',
  },
  {
    date: '2026-09-18',
    dateFormatted: 'Vie, 18 Sep 2026',
    totalTrips: 0,
    grossFareUsd: 0,
    platformCommissionUsd: 0,
    driverNetUsd: 0,
    cooperativa: 'Coop. San Cristóbal Delivery',
    terminal: 'Terminal Terrestre Otavalo',
    topService: 'Encomiendas & Domicilios',
  },
  {
    date: '2026-09-17',
    dateFormatted: 'Jue, 17 Sep 2026',
    totalTrips: 0,
    grossFareUsd: 0,
    platformCommissionUsd: 0,
    driverNetUsd: 0,
    cooperativa: 'Coop. Taxi Los Lagos',
    terminal: 'Terminal Carcelén (Quito)',
    topService: 'Carrera Urbana ($1.25 base)',
  },
];

export const AdminDailyIncomeReportModal: React.FC<AdminDailyIncomeReportModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const [selectedCooperativa, setSelectedCooperativa] = useState<string>('todos');
  const [selectedTerminal, setSelectedTerminal] = useState<string>('todos');

  if (!isOpen) return null;

  const filteredData = DAILY_INCOME_DATA.filter((item) => {
    if (selectedCooperativa !== 'todos' && item.cooperativa !== selectedCooperativa) return false;
    if (selectedTerminal !== 'todos' && item.terminal !== selectedTerminal) return false;
    return true;
  });

  const totalGross = filteredData.reduce((acc, curr) => acc + curr.grossFareUsd, 0);
  const totalCommission = filteredData.reduce((acc, curr) => acc + curr.platformCommissionUsd, 0);
  const totalNetDrivers = filteredData.reduce((acc, curr) => acc + curr.driverNetUsd, 0);
  const totalTrips = filteredData.reduce((acc, curr) => acc + curr.totalTrips, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className={`w-full max-w-4xl max-h-[94vh] border rounded-3xl shadow-2xl flex flex-col overflow-hidden ${
        isDark ? 'bg-zinc-900 border-zinc-750 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                REPORTE OFICIAL DE INGRESOS DIARIOS (USD $)
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Auditoría financiera de carreras, comisión 7% AndesMovi y liquidación a conductores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="btn-print-official-report"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Reporte (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 print:p-0 print:bg-white print:text-black">
          {/* Printable Header */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <div>
                <span className={`text-xs font-black tracking-wider uppercase ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  AndesMovi Ecuador S.A.S. • R.U.C. 1004721351001
                </span>
                <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Balance Diario Consolidado de Transporte & Logística
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Responsable Financiero: Jhon Sebastian Yepez Clavijo • Moneda Oficial: Dólares de los Estados Unidos (USD)
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Fecha de emisión:</span>
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {new Date().toLocaleDateString('es-EC', { dateStyle: 'full' })}
                </span>
                <span className="text-[10px] text-emerald-500 block font-bold">Estado: AUDITADO & CONCILIADO</span>
              </div>
            </div>

            {/* Filtros por Cooperativa y Terminal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 print:hidden">
              <div className="space-y-1">
                <label className={`text-[11px] font-bold flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Filtrar por Cooperativa de Transporte:</span>
                </label>
                <select
                  value={selectedCooperativa}
                  onChange={(e) => setSelectedCooperativa(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-750 text-white focus:border-amber-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                >
                  <option value="todos">Todas las Cooperativas Consolidadas</option>
                  {ECUADOR_COOPERATIVAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-bold flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span>Filtrar por Terminal Terrestre:</span>
                </label>
                <select
                  value={selectedTerminal}
                  onChange={(e) => setSelectedTerminal(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-750 text-white focus:border-amber-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                >
                  <option value="todos">Todos los Terminales Terrestres</option>
                  {ECUADOR_TERMINALES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen Ejecutivo en Dólares */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border shadow-sm ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Recaudación Bruta Total
              </span>
              <span className={`text-2xl font-black font-mono mt-1 block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCurrency(totalGross)}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{totalTrips} servicios completados</span>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm ${
              isDark ? 'bg-zinc-950 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <span className={`text-[11px] font-bold block uppercase tracking-wider flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                <Percent className="w-3 h-3" />
                <span>Comisión AndesMovi (7%)</span>
              </span>
              <span className={`text-2xl font-black font-mono mt-1 block ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {formatCurrency(totalCommission)}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>Ingreso neto de la plataforma</span>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm ${
              isDark ? 'bg-zinc-950 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                Liquidado a Choferes (93%)
              </span>
              <span className="text-2xl font-black text-emerald-500 font-mono mt-1 block">
                {formatCurrency(totalNetDrivers)}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Recibido en mano / transferencias</span>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <span className={`text-[11px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Ticket Promedio
              </span>
              <span className={`text-2xl font-black font-mono mt-1 block ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                {totalTrips > 0 ? formatCurrency(totalGross / totalTrips) : '$0.00'}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-sky-300/80' : 'text-sky-700'}`}>Base oficial: $1.25 / 2.7 km</span>
            </div>
          </div>

          {/* Tabla Desglosada de Ingresos Diarios */}
          <div className={`rounded-2xl border overflow-hidden shadow-sm ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Desglose Cronológico de Recaudación y Liquidaciones</span>
              </span>
              <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Mostrando {filteredData.length} jornadas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-bold ${
                    isDark ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Servicios</th>
                    <th className="py-3 px-4">Cooperativa / Terminal</th>
                    <th className="py-3 px-4 text-right">Recaudación Bruta (USD)</th>
                    <th className="py-3 px-4 text-right">Comisión 7% (USD)</th>
                    <th className="py-3 px-4 text-right">Neto Conductor (USD)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-850' : 'divide-slate-200'}`}>
                  {filteredData.map((item, idx) => (
                    <tr key={idx} className={`transition-colors ${
                      isDark ? 'hover:bg-zinc-900/40' : 'hover:bg-slate-50'
                    }`}>
                      <td className={`py-3 px-4 font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.dateFormatted}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{item.totalTrips}</td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.cooperativa}</span>
                        <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{item.terminal}</span>
                      </td>
                      <td className={`py-3 px-4 text-right font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(item.grossFareUsd)}
                      </td>
                      <td className={`py-3 px-4 text-right font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        {formatCurrency(item.platformCommissionUsd)}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-500">
                        {formatCurrency(item.driverNetUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 font-bold text-xs ${
                    isDark ? 'border-zinc-700 bg-zinc-900 text-white' : 'border-slate-300 bg-slate-100 text-slate-900'
                  }`}>
                    <td className="py-3 px-4">TOTAL CONSOLIDADO</td>
                    <td className="py-3 px-4 font-mono">{totalTrips}</td>
                    <td className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Filtro aplicado</td>
                    <td className="py-3 px-4 text-right font-mono font-black">
                      {formatCurrency(totalGross)}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {formatCurrency(totalCommission)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-500">
                      {formatCurrency(totalNetDrivers)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Firmas y Sellos Administrativos (Para Imprimir) */}
          <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`border-t pt-2 text-center ${isDark ? 'border-zinc-750' : 'border-slate-300'}`}>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Jhon Sebastian Yepez Clavijo</span>
              <span className={`text-[11px] block font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>C.I. 1004721351</span>
              <span className={`text-[10px] font-bold block uppercase ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                Administrador General AndesMovi Ecuador
              </span>
            </div>

            <div className={`border-t pt-2 text-center ${isDark ? 'border-zinc-750' : 'border-slate-300'}`}>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Departamento de Finanzas & Conciliación</span>
              <span className={`text-[11px] block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Auditoría de Pagos y Billeteras Prepago</span>
              <span className="text-[10px] text-emerald-500 font-bold block uppercase">
                Certificación Digital Válida
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

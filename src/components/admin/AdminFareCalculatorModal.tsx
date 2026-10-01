import React, { useState } from 'react';
import {
  Calculator,
  X,
  Sparkles,
} from 'lucide-react';
import { getOfficialTariffBreakdown, formatCurrency } from '../../utils/geoUtils';
import { ServiceType, VehicleType } from '../../types';

interface AdminFareCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const AdminFareCalculatorModal: React.FC<AdminFareCalculatorModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const [distanceKm, setDistanceKm] = useState<number>(4.2);
  const [serviceType, setServiceType] = useState<ServiceType>('viaje');
  const [vehicleType, setVehicleType] = useState<VehicleType>('auto');

  if (!isOpen) return null;

  const breakdown = getOfficialTariffBreakdown(distanceKm, serviceType, vehicleType);
  const commissionUsd = Number((breakdown.totalFareUsd * 0.07).toFixed(2));
  const driverNetUsd = Number((breakdown.totalFareUsd - commissionUsd).toFixed(2));

  // Distancias de prueba típicas en Ecuador
  const sampleDistances = [1.5, 2.7, 3.8, 5.5, 8.0, 12.0, 20.0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-2xl max-h-[92vh] border rounded-3xl shadow-2xl flex flex-col overflow-hidden ${
        isDark ? 'bg-zinc-900 border-zinc-750 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                CALCULADORA OFICIAL DE TARIFAS ANDESMOVI
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Regla Nacional: <strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>$1.25 USD cubre hasta 2.7 km</strong> (+ $0.35 por km adicional)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Parámetros de simulación */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Distancia del Trayecto:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="150"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Math.max(0.1, Number(e.target.value)))}
                    className={`w-20 px-2 py-1 rounded-lg border font-mono font-bold text-sm text-center focus:outline-none ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-700 text-amber-300 focus:border-amber-500' 
                        : 'bg-white border-slate-300 text-amber-700 focus:border-amber-500'
                    }`}
                  />
                  <span className={`text-xs font-bold font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>km</span>
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                <span>0.5 km</span>
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>2.7 km (Límite Base $1.25)</span>
                <span>25 km</span>
              </div>
            </div>

            {/* Servicio y Tipo de Vehículo */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className={`text-[11px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Tipo de Servicio:</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-750 text-white focus:border-amber-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                >
                  <option value="viaje">Carrera Urbana / Taxi</option>
                  <option value="domicilio">Delivery / Domicilio</option>
                  <option value="encomienda">Encomienda / Paquetería</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Tipo de Vehículo:</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-750 text-white focus:border-amber-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                  }`}
                >
                  <option value="auto">Auto Taxi Convencional</option>
                  <option value="confort">Confort Ejecutivo (+0.50)</option>
                  <option value="moto">Moto Delivery</option>
                  <option value="mini">Mini Van / Utilitario</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resultado Principal en Grande */}
          <div className={`p-5 rounded-2xl border-2 shadow-md space-y-3 ${
            isDark 
              ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/30 border-amber-500/40' 
              : 'bg-gradient-to-br from-amber-50/60 via-white to-amber-50/60 border-amber-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Tarifa Oficial Sugerida al Pasajero
                </span>
                <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {formatCurrency(breakdown.totalFareUsd)}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Distancia Total</span>
                <span className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{distanceKm.toFixed(1)} km</span>
              </div>
            </div>

            {/* Desglose paso a paso de la fórmula */}
            <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
              isDark ? 'bg-black/60 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-[11px] font-bold block border-b pb-1.5 flex items-center gap-1.5 ${
                isDark ? 'border-zinc-800 text-amber-300' : 'border-slate-200 text-amber-700'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Desglose Matemático de la Regla $1.25 / 2.7 km:</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`flex justify-between ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span>Tarifa Base:</span>
                  <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>${breakdown.baseFareUsd.toFixed(2)}</strong>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span>Cobertura Base:</span>
                  <strong className="text-emerald-500 font-mono">{breakdown.baseCoverageKm} km</strong>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span>Km Excedentes:</span>
                  <strong className="text-amber-500 font-mono">{breakdown.excessKm.toFixed(2)} km</strong>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <span>Tarifa / Km Excedente:</span>
                  <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>${breakdown.perExtraKmUsd.toFixed(2)}</strong>
                </div>
                <div className={`flex justify-between col-span-2 pt-1 border-t ${
                  isDark ? 'border-zinc-800 text-zinc-300' : 'border-slate-200 text-slate-700'
                }`}>
                  <span>Costo por Km Adicionales:</span>
                  <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {breakdown.excessKm > 0
                      ? `${breakdown.excessKm.toFixed(2)} km × $${breakdown.perExtraKmUsd.toFixed(2)} = $${(breakdown.excessKm * breakdown.perExtraKmUsd).toFixed(2)}`
                      : '$0.00 (cubierto por la base)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Reparto de Comisiones 7% vs 93% */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
              }`}>
                <span className={`text-[10px] font-bold block uppercase ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  Comisión AndesMovi (7%)
                </span>
                <span className={`text-lg font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  {formatCurrency(commissionUsd)}
                </span>
                <span className={`text-[10px] block ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>Descontado de billetera prepago</span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <span className={`text-[10px] font-bold block uppercase ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  Ganancia Neta Chofer (93%)
                </span>
                <span className="text-lg font-black text-emerald-500 font-mono">
                  {formatCurrency(driverNetUsd)}
                </span>
                <span className={`text-[10px] block ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Cobro en efectivo / transferencia</span>
              </div>
            </div>
          </div>

          {/* Tabla Comparativa Rápida para Distancias Habituales */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tabla de Referencia Rápida en Ecuador</span>
              <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Auto Convencional</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-bold ${
                    isDark ? 'border-zinc-800 text-zinc-400 bg-zinc-950' : 'border-slate-200 text-slate-600 bg-slate-50'
                  }`}>
                    <th className="py-2 px-3">Distancia</th>
                    <th className="py-2 px-3">Tipo Trayecto</th>
                    <th className="py-2 px-3 text-right">Tarifa Pasajero</th>
                    <th className="py-2 px-3 text-right">Comisión 7%</th>
                    <th className="py-2 px-3 text-right">Neto Chofer</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-850' : 'divide-slate-200'}`}>
                  {sampleDistances.map((d) => {
                    const sampleBreakdown = getOfficialTariffBreakdown(d, 'viaje', 'auto');
                    const cUsd = sampleBreakdown.totalFareUsd * 0.07;
                    const dUsd = sampleBreakdown.totalFareUsd - cUsd;
                    const isSelected = Math.abs(d - distanceKm) < 0.2;

                    return (
                      <tr
                        key={d}
                        onClick={() => setDistanceKm(d)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? (isDark ? 'bg-amber-500/20 font-bold' : 'bg-amber-100 font-bold') 
                            : (isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-slate-50')
                        }`}
                      >
                        <td className={`py-2 px-3 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.toFixed(1)} km</td>
                        <td className={`py-2 px-3 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          {d <= 2.7 ? 'Urbano Corto (Base $1.25)' : `Urbano Extendido (+${(d - 2.7).toFixed(1)} km)`}
                        </td>
                        <td className={`py-2 px-3 text-right font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {formatCurrency(sampleBreakdown.totalFareUsd)}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {formatCurrency(cUsd)}
                        </td>
                        <td className="py-2 px-3 text-right font-black font-mono text-emerald-500">
                          {formatCurrency(dUsd)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors cursor-pointer"
            >
              Cerrar Calculadora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

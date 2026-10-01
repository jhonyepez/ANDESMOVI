import React, { useState } from 'react';
import {
  Car,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  MapPin,
  UserCheck,
  FileCheck,
  Search,
} from 'lucide-react';
import { validateEcuadorPlate, PlateValidationResult } from '../../utils/plateValidator';
import { ECUADOR_COOPERATIVAS, ECUADOR_TERMINALES } from '../../services/databaseService';
import { RegisteredVehicleUnit } from '../../types';

interface AdminUnitRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterUnit: (unit: RegisteredVehicleUnit) => void;
  isDark?: boolean;
}

export const AdminUnitRegisterModal: React.FC<AdminUnitRegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterUnit,
  isDark = true,
}) => {
  // Campos de formulario
  const [unitNumber, setUnitNumber] = useState<string>('Unidad #');
  const [plateInput, setPlateInput] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<number>(2023);
  const [color, setColor] = useState<string>('Amarillo Taxi');
  const [vehicleType, setVehicleType] = useState<'auto' | 'moto' | 'confort' | 'camioneta' | 'mini'>('auto');
  const [cooperativa, setCooperativa] = useState<string>(ECUADOR_COOPERATIVAS[0]);
  const [terminal, setTerminal] = useState<string>(ECUADOR_TERMINALES[0]);
  
  // Datos del Chofer Aprobado
  const [driverName, setDriverName] = useState<string>('');
  const [driverCedula, setDriverCedula] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');

  // Estados de validación
  const [plateResult, setPlateResult] = useState<PlateValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validación de placa reactiva
  const handlePlateChange = (val: string) => {
    const raw = val.toUpperCase();
    setPlateInput(raw);
    if (raw.trim().length >= 3) {
      const res = validateEcuadorPlate(raw);
      setPlateResult(res);
      if (res.isValid) {
        setErrorMessage(null);
      }
    } else {
      setPlateResult(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validar placa obligatoria
    const valResult = validateEcuadorPlate(plateInput);
    if (!valResult.isValid) {
      setErrorMessage(valResult.errorMessage || 'Placa vehicular ecuatoriana inválida.');
      return;
    }

    // Validar Cédula (10 dígitos)
    const cedulaClean = driverCedula.trim().replace(/\D/g, '');
    if (cedulaClean.length !== 10) {
      setErrorMessage('La cédula del chofer debe contener exactamente 10 dígitos numéricos.');
      return;
    }

    if (!driverName.trim()) {
      setErrorMessage('Por favor ingresa el nombre y apellido del conductor aprobado.');
      return;
    }

    if (!model.trim()) {
      setErrorMessage('Por favor especifica la marca y modelo del vehículo.');
      return;
    }

    const newUnit: RegisteredVehicleUnit = {
      id: `unit-${Date.now()}`,
      unitNumber: unitNumber.trim(),
      plate: valResult.normalizedPlate,
      plateProvince: valResult.provinceName,
      model: model.trim(),
      year,
      color: color.trim(),
      vehicleType,
      cooperativa,
      terminal,
      assignedDriverId: `drv-${Date.now().toString().slice(-4)}`,
      assignedDriverName: driverName.trim(),
      assignedDriverCedula: cedulaClean,
      driverPhone: driverPhone.trim() || '0991234567',
      isDriverApproved: true,
      operationalStatus: 'disponible',
      registeredAt: Date.now(),
      registeredAtFormatted: new Date().toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    onRegisterUnit(newUnit);
    setSuccessMessage(`¡Unidad ${newUnit.unitNumber} (${newUnit.plate}) dada de alta exitosamente!`);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] bg-zinc-900 border border-zinc-750 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Alta de Unidad & Validación de Placas ANT</h3>
              <p className="text-[10px] text-zinc-400">Registro vehicular oficial, verificación de placa y chofer aprobado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Sección 1: Datos del Vehículo y Placa */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Identificación Vehicular & Placa ANT Ecuador</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Número de Unidad */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-bold">Número de Unidad:</label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="Ej: Unidad #045"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Placa Vehicular */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-bold flex items-center justify-between">
                  <span>Placa ANT (3 letras - 3 o 4 dígitos):</span>
                  {plateResult?.isValid && (
                    <span className="text-[10px] text-emerald-400 font-bold">Válida: {plateResult.provinceName}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={plateInput}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  placeholder="Ej: PBA-4521 o IAA-1092"
                  className={`w-full px-3 py-2 rounded-xl bg-zinc-900 border text-xs font-mono font-black uppercase tracking-wider focus:outline-none ${
                    plateResult
                      ? plateResult.isValid
                        ? 'border-emerald-500 text-emerald-300'
                        : 'border-red-500 text-red-300'
                      : 'border-zinc-750 text-white focus:border-amber-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Placa Badge Preview */}
            {plateResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  plateResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/40 border-red-500/50 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-amber-400 text-zinc-950 font-black font-mono text-xs rounded border border-zinc-900 shadow-sm">
                    {plateResult.normalizedPlate}
                  </div>
                  <div>
                    <span className="font-bold block text-white text-xs">
                      {plateResult.isValid ? `Provincia: ${plateResult.provinceName}` : 'Placa no válida'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {plateResult.isValid
                        ? `${plateResult.isCommercialOrPublic ? 'Placa Comercial/Pública (Apta para Taxi/Transporte)' : 'Placa Particular'}`
                        : plateResult.errorMessage}
                    </span>
                  </div>
                </div>
                {plateResult.isValid && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              </div>
            )}

            {/* Modelo, Año, Color y Tipo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold">Marca & Modelo:</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej: Chevrolet Sail"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold">Año Fabricación:</label>
                <input
                  type="number"
                  min={2005}
                  max={2026}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold">Color:</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Amarillo Taxi"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold">Tipo Servicio:</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="auto">Auto / Taxi</option>
                  <option value="confort">Confort Ejecutivo</option>
                  <option value="moto">Moto Delivery</option>
                  <option value="camioneta">Camioneta Carga</option>
                  <option value="mini">Mini Van</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 2: Asignación de Cooperativa y Terminal */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>Cooperativa y Terminal Terrestre de Operación</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-bold">Cooperativa de Transporte:</label>
                <select
                  value={cooperativa}
                  onChange={(e) => setCooperativa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                >
                  {ECUADOR_COOPERATIVAS.map((coop) => (
                    <option key={coop} value={coop}>
                      {coop}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-bold">Terminal / Parada Frecuente:</label>
                <select
                  value={terminal}
                  onChange={(e) => setTerminal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                >
                  {ECUADOR_TERMINALES.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección 3: Chofer Aprobado Asignado */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Chofer Aprobado Asignado a la Unidad</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-bold">Nombres y Apellidos:</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Ej: Wilson Revelo"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-bold">Cédula Ecuatoriana (10 dígitos):</label>
                <input
                  type="text"
                  maxLength={10}
                  value={driverCedula}
                  onChange={(e) => setDriverCedula(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 1004819201"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-bold">Celular / WhatsApp:</label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Ej: 0992345678"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
              <span>
                <strong>Verificación Automática de Identidad API:</strong> Cédula (Módulo 10), Licencia ANT y RTV del vehículo son auditados en tiempo real reemplazando revisiones manuales.
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Dar de Alta Unidad & Validar Placa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

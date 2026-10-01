import React, { useState } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { TULCANAZA_PARCEL_TARIFFS, TulcanazaParcelTariffItem } from '../../data/tulcanazaTariffs';

interface AdminParcelTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminParcelTariffModal: React.FC<AdminParcelTariffModalProps> = ({ isOpen, onClose }) => {
  const [tariffs, setTariffs] = useState<TulcanazaParcelTariffItem[]>(TULCANAZA_PARCEL_TARIFFS);

  const handlePriceChange = (id: string, field: 'clientPaysDriverUsd' | 'driverPaysOfficeUsd', value: number) => {
    setTariffs(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: value };
        // Recalculate profit
        updated.driverProfitUsd = Number((updated.clientPaysDriverUsd - updated.driverPaysOfficeUsd).toFixed(2));
        return updated;
      }
      return t;
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
          <h3 className="text-lg font-black text-white">Gestionar Tarifas de Encomiendas</h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white"><X /></button>
        </div>
        <div className="p-4 overflow-y-auto">
          <table className="w-full text-white text-xs">
            <thead>
              <tr className="text-zinc-400 uppercase text-[10px]">
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-right">Precio Cliente</th>
                <th className="p-2 text-right">Costo Oficina</th>
                <th className="p-2 text-right">Ganancia Chofer</th>
              </tr>
            </thead>
            <tbody>
              {tariffs.map(t => (
                <tr key={t.id} className="border-t border-zinc-800">
                  <td className="p-2">{t.name}</td>
                  <td className="p-2 text-right">
                    <input 
                      type="number" 
                      value={t.clientPaysDriverUsd} 
                      onChange={(e) => handlePriceChange(t.id, 'clientPaysDriverUsd', parseFloat(e.target.value))}
                      className="w-16 bg-zinc-800 p-1 rounded text-right font-mono"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <input 
                      type="number" 
                      value={t.driverPaysOfficeUsd} 
                      onChange={(e) => handlePriceChange(t.id, 'driverPaysOfficeUsd', parseFloat(e.target.value))}
                      className="w-16 bg-zinc-800 p-1 rounded text-right font-mono"
                    />
                  </td>
                  <td className="p-2 text-right font-mono text-emerald-400">${t.driverProfitUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-zinc-700 flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm">
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

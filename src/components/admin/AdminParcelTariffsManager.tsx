import React, { useState } from 'react';
import { TULCANAZA_PARCEL_TARIFFS, TulcanazaParcelTariffItem } from '../../data/tulcanazaTariffs';
import { Trash2, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AdminParcelTariffsManagerProps {
  isDark?: boolean;
}

export const AdminParcelTariffsManager: React.FC<AdminParcelTariffsManagerProps> = ({ isDark = true }) => {
  const [tariffs, setTariffs] = useState<TulcanazaParcelTariffItem[]>(() => {
    try {
      const stored = localStorage.getItem('andesmovi_parcel_tariffs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return TULCANAZA_PARCEL_TARIFFS;
  });

  const [newCatName, setNewCatName] = useState('');
  const [newClientPrice, setNewClientPrice] = useState('5.00');
  const [newOfficeCost, setNewOfficeCost] = useState('2.00');
  const [showAddRow, setShowAddRow] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const saveTariffs = (updated: TulcanazaParcelTariffItem[]) => {
    setTariffs(updated);
    try {
      localStorage.setItem('andesmovi_parcel_tariffs', JSON.stringify(updated));
    } catch {}
  };

  const handlePriceChange = (id: string, field: 'clientPaysDriverUsd' | 'driverPaysOfficeUsd', value: number) => {
    const updated = tariffs.map(t => {
      if (t.id === id) {
        const item = { ...t, [field]: value };
        item.driverProfitUsd = Number((item.clientPaysDriverUsd - item.driverPaysOfficeUsd).toFixed(2));
        return item;
      }
      return t;
    });
    saveTariffs(updated);
  };

  const handleDeleteTariff = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la tarifa para "${name}"?`)) {
      const updated = tariffs.filter(t => t.id !== id);
      saveTariffs(updated);
      setNotice(`Tarifa "${name}" eliminada.`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleResetTariffs = () => {
    if (window.confirm('¿Restablecer todas las tarifas de encomiendas a los valores oficiales?')) {
      saveTariffs(TULCANAZA_PARCEL_TARIFFS);
      setNotice('Tarifas restablecidas a valores de fábrica.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleAddTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const clientPrice = parseFloat(newClientPrice) || 5.0;
    const officeCost = parseFloat(newOfficeCost) || 2.0;
    const newTariff: TulcanazaParcelTariffItem = {
      id: `custom-tar-${Date.now()}`,
      name: newCatName.trim(),
      shortName: newCatName.trim().slice(0, 15),
      category: 'kg_5',
      clientPaysDriverUsd: clientPrice,
      driverPaysOfficeUsd: officeCost,
      driverProfitUsd: Number((clientPrice - officeCost).toFixed(2)),
      weightApproxKg: 5,
      description: 'Tarifa configurada por administración',
      badge: 'Personalizada',
    };
    saveTariffs([...tariffs, newTariff]);
    setNewCatName('');
    setShowAddRow(false);
    setNotice(`Nueva tarifa "${newTariff.name}" creada.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${isDark ? 'border-zinc-750' : 'border-slate-200'}`}>
        <div>
          <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            GESTIÓN DE TARIFAS DE ENCOMIENDAS
          </h3>
          <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            Controla los valores cobrados por cada tipo de paquete y regula el valor por KG.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetTariffs}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddRow(!showAddRow)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarifa</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {showAddRow && (
        <form onSubmit={handleAddTariff} className={`p-4 rounded-2xl border-2 space-y-3 ${
          isDark ? 'bg-zinc-900 border-emerald-500/40 text-white' : 'bg-white border-emerald-300 text-slate-900'
        }`}>
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500">Crear Nueva Categoría de Encomienda</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold block mb-1">Nombre Categoría</label>
              <input
                type="text"
                placeholder="Ej: Televisor 55 pulgadas / Maquinaria"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className={`w-full p-2 rounded-xl text-xs border font-medium outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">Precio Cliente (USD)</label>
              <input
                type="number"
                step="0.25"
                value={newClientPrice}
                onChange={(e) => setNewClientPrice(e.target.value)}
                className={`w-full p-2 rounded-xl text-xs border font-bold font-mono outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">Costo Oficina (USD)</label>
              <input
                type="number"
                step="0.25"
                value={newOfficeCost}
                onChange={(e) => setNewOfficeCost(e.target.value)}
                className={`w-full p-2 rounded-xl text-xs border font-bold font-mono outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddRow(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-md"
            >
              Guardar Tarifa
            </button>
          </div>
        </form>
      )}

      <div className={`border rounded-3xl overflow-hidden shadow-sm ${
        isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <thead>
              <tr className={`uppercase text-[10px] font-bold ${
                isDark ? 'text-zinc-400 bg-zinc-800' : 'text-slate-600 bg-slate-100'
              }`}>
                <th className="p-3.5 text-left">Categoría</th>
                <th className="p-3.5 text-right">Precio Cliente ($)</th>
                <th className="p-3.5 text-right">Costo Oficina ($)</th>
                <th className="p-3.5 text-right">Ganancia Chofer ($)</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tariffs.map(t => (
                <tr key={t.id} className={`border-t transition-colors ${
                  isDark ? 'border-zinc-800 hover:bg-zinc-800/50' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <td className="p-3.5 font-medium">{t.name}</td>
                  <td className="p-3.5 text-right">
                    <input 
                      type="number" 
                      step="0.25"
                      value={t.clientPaysDriverUsd} 
                      onChange={(e) => handlePriceChange(t.id, 'clientPaysDriverUsd', parseFloat(e.target.value) || 0)}
                      className={`w-24 p-1.5 rounded-xl text-right font-mono font-bold border outline-none ${
                        isDark 
                          ? 'bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </td>
                  <td className="p-3.5 text-right">
                    <input 
                      type="number" 
                      step="0.25"
                      value={t.driverPaysOfficeUsd} 
                      onChange={(e) => handlePriceChange(t.id, 'driverPaysOfficeUsd', parseFloat(e.target.value) || 0)}
                      className={`w-24 p-1.5 rounded-xl text-right font-mono font-bold border outline-none ${
                        isDark 
                          ? 'bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-500 font-black text-sm">
                    ${t.driverProfitUsd.toFixed(2)}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteTariff(t.id, t.name)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 border-zinc-700 hover:border-red-500'
                          : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-300'
                      }`}
                      title="Eliminar tarifa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

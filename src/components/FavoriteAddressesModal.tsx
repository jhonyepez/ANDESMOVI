import React, { useState } from 'react';
import { Coordinates } from '../types';
import {
  Heart,
  MapPin,
  Plus,
  Trash2,
  X,
  Check,
  Navigation,
  Sparkles,
  Home,
  Briefcase,
  GraduationCap,
  Dumbbell,
  ShoppingBag,
  Utensils,
  Hospital,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

export interface FavoritePlace {
  id: string;
  name: string;
  category: 'home' | 'work' | 'study' | 'gym' | 'health' | 'shop' | 'food' | 'custom';
  icon: string;
  address: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}

export const DEFAULT_FAVORITE_PLACES: FavoritePlace[] = [
  {
    id: 'fav-home',
    name: 'Casa',
    category: 'home',
    icon: '🏠',
    address: 'Calle Sucre y Bolívar, Tulcán, Carchi',
    lat: 0.8118,
    lng: -77.7162,
    isDefault: true,
  },
  {
    id: 'fav-work',
    name: 'Trabajo / Oficina',
    category: 'work',
    icon: '🏢',
    address: 'Municipio de Tulcán / Parque Central',
    lat: 0.8122,
    lng: -77.7170,
    isDefault: true,
  },
  {
    id: 'fav-study',
    name: 'Universidad (UPEC)',
    category: 'study',
    icon: '🎓',
    address: 'Campus Universitario UPEC, Av. Universitaria',
    lat: 0.8250,
    lng: -77.7200,
  },
  {
    id: 'fav-terminal',
    name: 'Terminal Terrestre',
    category: 'custom',
    icon: '🚌',
    address: 'Av. Veintimilla y Fray Vacas Galindo, Tulcán',
    lat: 0.8119,
    lng: -77.7173,
  },
  {
    id: 'fav-hospital',
    name: 'Hospital Luis G. Dávila',
    category: 'health',
    icon: '🏥',
    address: 'Av. Manabí y 10 de Agosto, Tulcán',
    lat: 0.8160,
    lng: -77.7190,
  },
];

const PRESET_ICONS = [
  { icon: '🏠', label: 'Casa', category: 'home' as const },
  { icon: '🏢', label: 'Trabajo', category: 'work' as const },
  { icon: '🎓', label: 'Estudio', category: 'study' as const },
  { icon: '🏋️', label: 'Gym', category: 'gym' as const },
  { icon: '🏥', label: 'Salud', category: 'health' as const },
  { icon: '🛍️', label: 'Tienda', category: 'shop' as const },
  { icon: '🍽️', label: 'Comida', category: 'food' as const },
  { icon: '📍', label: 'Favorito', category: 'custom' as const },
];

interface FavoriteAddressesModalProps {
  favorites: FavoritePlace[];
  onSaveFavorites: (updated: FavoritePlace[]) => void;
  onSelectFavorite: (place: FavoritePlace, target: 'destination' | 'origin') => void;
  onClose: () => void;
  currentAddressCandidate?: { name: string; address: string; lat: number; lng: number } | null;
  isDark?: boolean;
}

export const FavoriteAddressesModal: React.FC<FavoriteAddressesModalProps> = ({
  favorites,
  onSaveFavorites,
  onSelectFavorite,
  onClose,
  currentAddressCandidate,
  isDark = true,
}) => {
  const [isAddingNew, setIsAddingNew] = useState<boolean>(!!currentAddressCandidate);
  const [newName, setNewName] = useState<string>(currentAddressCandidate ? 'Mi Lugar Favorito' : '');
  const [newAddress, setNewAddress] = useState<string>(currentAddressCandidate?.address || currentAddressCandidate?.name || '');
  const [newLat, setNewLat] = useState<number>(currentAddressCandidate?.lat || 0.8116);
  const [newLng, setNewLng] = useState<number>(currentAddressCandidate?.lng || -77.7173);
  const [selectedIcon, setSelectedIcon] = useState<string>('🏠');
  const [selectedCategory, setSelectedCategory] = useState<FavoritePlace['category']>('home');

  // Address search suggestions inside modal
  const [searchQuery, setSearchQuery] = useState<string>(newAddress);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      setIsSearchingAddress(true);
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=0.8116&lon=-77.7173&limit=5`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features) {
          const list = data.features.map((f: any) => {
            const p = f.properties;
            const name = p.name || p.street || p.city || query;
            const address = [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(', ');
            return {
              id: f.properties.osm_id || Math.random().toString(),
              name,
              address,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            };
          });
          setSuggestions(list);
        }
      }
    } catch {
      // Ignorar
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleCreateFavorite = () => {
    if (!newName.trim()) return;
    const finalAddress = newAddress.trim() || searchQuery.trim() || 'Tulcán, Carchi';
    const newPlace: FavoritePlace = {
      id: `fav-${Date.now()}`,
      name: newName.trim(),
      category: selectedCategory,
      icon: selectedIcon,
      address: finalAddress,
      lat: newLat,
      lng: newLng,
    };

    const updated = [newPlace, ...favorites];
    onSaveFavorites(updated);
    haptic.success();
    setIsAddingNew(false);
    setNewName('');
    setNewAddress('');
  };

  const handleDeleteFavorite = (id: string) => {
    haptic.tap();
    const updated = favorites.filter((f) => f.id !== id);
    onSaveFavorites(updated);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Heart className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Direcciones Favoritas</h3>
              <p className="text-xs text-zinc-400">Guarda tus lugares frecuentes para pedir viajes en 1 clic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
          {/* Action button to show Add form */}
          {!isAddingNew && (
            <button
              onClick={() => {
                haptic.tap();
                setIsAddingNew(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Guardar Nueva Dirección Favorita</span>
            </button>
          )}

          {/* Add New Favorite Form */}
          {isAddingNew && (
            <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 ${isDark ? 'bg-zinc-950/80 border-emerald-500/40' : 'bg-slate-50 border-emerald-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Nuevo Lugar Favorito
                </span>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-zinc-400 hover:text-white p-1"
                >
                  Cancelar
                </button>
              </div>

              {/* Icon selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-zinc-400">Elige un icono:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {PRESET_ICONS.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(item.icon);
                        setSelectedCategory(item.category);
                        if (!newName || PRESET_ICONS.some((p) => p.label === newName)) {
                          setNewName(item.label);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedIcon === item.icon
                          ? 'bg-emerald-500/30 border-emerald-400 text-white font-black shadow-md ring-1 ring-emerald-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-400">Nombre del lugar:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Casa, Trabajo, Casa de Mamá, Gimnasio..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-400' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Address Search / Input */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-[11px] font-bold text-zinc-400">Dirección o calle:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      setNewAddress(val);
                      fetchSuggestions(val);
                    }}
                    placeholder="Escribe la calle, barrio o punto de referencia..."
                    className={`w-full p-2.5 pr-8 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-400' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <MapPin className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Suggestions dropdown inside modal */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-50 p-2 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {suggestions.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery(sug.name);
                          setNewAddress(sug.address || sug.name);
                          setNewLat(sug.lat);
                          setNewLng(sug.lng);
                          setSuggestions([]);
                        }}
                        className="text-left w-full p-2 rounded-lg hover:bg-zinc-900 text-xs text-zinc-200"
                      >
                        <span className="font-bold text-white block text-xs">{sug.name}</span>
                        <span className="text-[10px] text-zinc-400 block truncate">{sug.address}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={handleCreateFavorite}
                disabled={!newName.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Lugar Favorito</span>
              </button>
            </div>
          )}

          {/* List of existing favorite places */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Lugares Guardados ({favorites.length})
            </span>

            {favorites.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs">
                No tienes direcciones favoritas guardadas aún.
              </div>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isDark ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                      {fav.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-white truncate block">{fav.name}</span>
                        {fav.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                            Frecuente
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 truncate block mt-0.5">{fav.address}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.success();
                        onSelectFavorite(fav, 'destination');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      title="Usar como Destino"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Destino</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.success();
                        onSelectFavorite(fav, 'origin');
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      title="Usar como Origen"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Origen</span>
                    </button>

                    {!fav.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFavorite(fav.id)}
                        className="p-1.5 rounded-xl hover:bg-red-950 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Eliminar favorito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs text-zinc-400 ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-100 bg-slate-50'}`}>
          <span>⭐ Guardado permanente en tu dispositivo</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

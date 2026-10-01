import React, { useState, useEffect } from 'react';
import { CartItem, Coordinates, MenuItem, Restaurant, SystemTariffs, UserProfile, PaymentMethodType } from '../types';
import { RESTAURANTS, MENU_ITEMS } from '../data/mockData';
import { formatCurrency } from '../utils/geoUtils';
import { ShoppingBag, Plus, Minus, Trash2, MapPin, Clock, Star, ArrowRight, Sparkles, Calendar, ShieldCheck, KeyRound, Lock, User, Wallet, Banknote, Smartphone, Check, Info } from 'lucide-react';
import { getTulcanazaTariffByWeight } from '../data/tulcanazaTariffs';

interface DeliveryBookingProps {
  userLocation: Coordinates;
  onConfirmOrder: (orderData: {
    restaurantName: string;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    notes: string;
    paymentMethodType?: PaymentMethodType;
    paymentMethodName?: string;
  }) => void;
  onOpenSchedule?: (subtotal: number, items: CartItem[], restaurantName: string) => void;
  systemTariffs?: SystemTariffs;
  currentUser?: UserProfile | null;
  onOpenRegister?: () => void;
  isDark?: boolean;
}

export const DeliveryBooking: React.FC<DeliveryBookingProps> = ({
  userLocation,
  onConfirmOrder,
  onOpenSchedule,
  systemTariffs,
  currentUser,
  onOpenRegister,
  isDark = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customRequest, setCustomRequest] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [showDemoBlockModal, setShowDemoBlockModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setShowDemoBlockModal(false);
    }
  }, [currentUser]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  
  const baseDeliveryFare = systemTariffs?.deliveryBaseFareUsd ?? 1.25;
  const multiplier = systemTariffs?.dynamicMultiplier ?? 1.0;
  const initialDeliveryOffer = Number((baseDeliveryFare * multiplier).toFixed(2));
  const [deliveryOffer, setDeliveryOffer] = useState<number>(initialDeliveryOffer);
  const [showDiscountLimitNotice, setShowDiscountLimitNotice] = useState<boolean>(false);

  const tarifaSugerida = Number(((systemTariffs?.deliveryBaseFareUsd || 1.25) * (systemTariffs?.dynamicMultiplier || 1.0)).toFixed(2));
  const tarifaMinima = systemTariffs?.deliveryBaseFareUsd ?? 1.25;
  const isCarreraMinima = tarifaSugerida <= tarifaMinima;
  const pisoPermitido = isCarreraMinima
    ? tarifaMinima
    : Math.max(tarifaMinima, Number((tarifaSugerida - 0.25).toFixed(2)));

  const handleUpdateWeight = (weight: number) => {
    const tariff = getTulcanazaTariffByWeight(weight);
    setDeliveryOffer(tariff.clientPaysDriverUsd);
  };

  useEffect(() => {
    if (systemTariffs) {
      setDeliveryOffer(Number(((systemTariffs.deliveryBaseFareUsd || 1.25) * (systemTariffs.dynamicMultiplier || 1.0)).toFixed(2)));
    }
  }, [systemTariffs]);

  const categories = ['Todos', 'Comida Rápida', 'Farmacia', 'Supermercado'];

  const filteredMenuItems =
    selectedCategory === 'Todos'
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const total = subtotal + deliveryOffer;

  const handleCheckout = () => {
    if (cart.length === 0 && !customRequest.trim()) {
      return;
    }
    if (!currentUser) {
      setShowDemoBlockModal(true);
      return;
    }
    const storeName = cart.length > 0 ? cart[0].item.restaurantName : 'Encargo Especial Express';
    onConfirmOrder({
      restaurantName: storeName,
      items: cart,
      subtotal,
      deliveryFee: deliveryOffer,
      total,
      notes: `${deliveryNotes} ${customRequest ? `[Encargo especial: ${customRequest}]` : ''}`.trim(),
      paymentMethodType: selectedPaymentMethod === 'efectivo' ? 'efectivo' : 'transferencia',
      paymentMethodName: selectedPaymentMethod === 'efectivo' ? 'Efectivo al recibir' : 'Transferencia Directa (DeUna! / Pichincha / Guayaquil / Produbanco)',
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* AVISO DE MODO DEMO */}
      {!currentUser && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <strong className="text-amber-400 font-black block text-xs uppercase tracking-wider">
                Modo Demo (Solo Visualización)
              </strong>
              <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                Puedes ver restaurantes y menús. Para pedir a domicilio debes registrarte.
              </span>
            </div>
          </div>
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Registrarme
            </button>
          )}
        </div>
      )}
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? isDark ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800' : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Popular Partner Stores Bar */}
      <div className={`${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'} border p-3 rounded-2xl`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Tiendas y Restaurantes Cercanos
        </span>
        <div className="grid grid-cols-2 gap-2">
          {RESTAURANTS.slice(0, 2).map((rest) => (
            <div
              key={rest.id}
              className={`p-2 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-slate-50 border-slate-200'}`}
            >
              <img
                src={rest.imageUrl}
                alt={rest.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <h5 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{rest.name}</h5>
                <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <span className="flex items-center text-amber-400 font-semibold">
                    <Star className={`w-2.5 h-2.5 mr-0.5 ${isDark ? 'fill-amber-400' : 'fill-amber-500'}`} />
                    {rest.rating}
                  </span>
                  <span>~{rest.deliveryTimeMinutes}m</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Catalog */}
      <div className="flex flex-col gap-2.5">
        <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Menú y Artículos para Domicilio</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredMenuItems.map((product) => {
            const inCart = cart.find((i) => i.item.id === product.id);
            return (
              <div
                key={product.id}
                className={`p-3 rounded-2xl border flex gap-3 transition-all ${
                  isDark 
                    ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-18 h-18 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h5 className={`text-xs font-bold leading-snug line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{product.name}</h5>
                    <p className={`text-[10px] line-clamp-2 mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{product.description}</p>
                  </div>
                  <div className={`flex items-center justify-between mt-2 pt-1 border-t ${isDark ? 'border-zinc-800/60' : 'border-slate-100'}`}>
                    <span className={`text-xs font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {formatCurrency(product.price)}
                    </span>
                    {inCart ? (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                        <button
                          onClick={() => handleUpdateQuantity(product.id, -1)}
                          className={`${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'} p-0.5`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`text-xs font-bold px-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{inCart.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(product.id, 1)}
                          className={`${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'} p-0.5`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-transform active:scale-95 ${
                          isDark 
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weight Quick Adjust Buttons */}
      <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
        <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Peso aproximado:</span>
        <div className="flex items-center gap-1.5">
          {[0.5, 2, 5, 10, 20, 35].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => handleUpdateWeight(w)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                deliveryOffer === getTulcanazaTariffByWeight(w).clientPaysDriverUsd
                  ? isDark ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'bg-emerald-600 text-white border-emerald-600'
                  : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800' : 'bg-white text-slate-500 hover:text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              {w} kg
            </button>
          ))}
        </div>
      </div>

      {/* Custom Errand / Any Item Input ("Pide lo que sea") */}
      <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>¿No lo encuentras? Pide lo que necesites</span>
        </div>
        <input
          type="text"
          value={customRequest}
          onChange={(e) => setCustomRequest(e.target.value)}
          placeholder="Ej. 'Cajetilla de cigarrillos y 2 Gatorade de uva de la tienda de la esquina'"
          className={`w-full text-xs p-2.5 rounded-xl focus:outline-none border ${
            isDark 
              ? 'bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500' 
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
          }`}
        />
      </div>

      {/* Cart & Checkout Summary */}
      {(cart.length > 0 || customRequest.trim()) && (
        <div className={`border p-4 rounded-2xl shadow-2xl flex flex-col gap-3 ${
          isDark 
            ? 'bg-zinc-900 border-emerald-500/40' 
            : 'bg-white border-emerald-500/30'
        }`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <ShoppingBag className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              Resumen de tu Pedido
            </span>
            <button
              onClick={() => {
                setCart([]);
                setCustomRequest('');
              }}
              className={`text-[11px] flex items-center gap-1 transition-colors ${isDark ? 'text-zinc-400 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Vaciar</span>
            </button>
          </div>

          {/* Delivery Fee Offer Slider in USD (InDrive Delivery Style) */}
          <div className="space-y-1.5">
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tarifa de entrega (Repartidor en USD)</span>
                <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {isCarreraMinima
                    ? `Tarifa mínima: $${tarifaMinima.toFixed(2)} USD (Fija)`
                    : `Sugerida: $${tarifaSugerida.toFixed(2)} • Piso: $${pisoPermitido.toFixed(2)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={deliveryOffer <= pisoPermitido}
                  onClick={() => {
                    if (deliveryOffer <= pisoPermitido) {
                      setShowDiscountLimitNotice(true);
                      setTimeout(() => setShowDiscountLimitNotice(false), 3500);
                    } else {
                      setDeliveryOffer((prev) => {
                        const next = Number((prev - 0.25).toFixed(2));
                        if (next < pisoPermitido) {
                          setShowDiscountLimitNotice(true);
                          setTimeout(() => setShowDiscountLimitNotice(false), 3500);
                          return pisoPermitido;
                        }
                        return next;
                      });
                    }
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    deliveryOffer <= pisoPermitido
                      ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
                      : isDark
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'
                  }`}
                  title={
                    isCarreraMinima || deliveryOffer <= tarifaMinima
                      ? `La tarifa mínima de entrega es de $${tarifaMinima.toFixed(2)} y no admite descuentos`
                      : `Descuento máximo de $0.25 alcanzado (Piso: $${pisoPermitido.toFixed(2)})`
                  }
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className={`text-xs font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {formatCurrency(deliveryOffer)}
                </span>
                <button
                  type="button"
                  onClick={() => setDeliveryOffer((prev) => Number((prev + 0.25).toFixed(2)))}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                  title="Subir $0.25"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showDiscountLimitNotice && (
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 animate-in fade-in">
                <span>⚠️</span>
                <span>
                  {isCarreraMinima || deliveryOffer <= tarifaMinima
                    ? `La tarifa mínima de entrega es de $${tarifaMinima.toFixed(2)} y no admite descuentos.`
                    : `El descuento máximo permitido es de $0.25 respecto al precio sugerido (Piso: $${pisoPermitido.toFixed(2)} USD).`}
                </span>
              </div>
            )}
          </div>
          
          {/* Método de Pago: Efectivo o Transferencias Directas */}
          <div className={`p-3 rounded-2xl border space-y-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Forma de Pago al Recibir (100% Directo al Repartidor)
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Sin intermediarios
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('efectivo')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  selectedPaymentMethod === 'efectivo'
                    ? isDark
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-xs font-bold leading-tight">Efectivo</span>
                  <span className="block text-[9px] text-zinc-400">Pago en mano</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('transferencia')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  selectedPaymentMethod === 'transferencia'
                    ? isDark
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                    : isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="text-left">
                  <span className="block text-xs font-bold leading-tight">Transferencia</span>
                  <span className="block text-[9px] text-zinc-400">DeUna! / Pichincha</span>
                </div>
              </button>
            </div>
          </div>

          {/* Breakdown for Delivery (7% Commission only on delivery fare) */}
          <div className={`border p-3.5 rounded-2xl animate-in fade-in space-y-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Desglose Transparente AndesMovi
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-mono">
                <span>Comisión 7% sólo en carrera</span>
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className={isDark ? 'text-zinc-300' : 'text-slate-600'}>
                  1. Valor Comida / Productos en Local:
                </span>
                <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 italic pl-2">
                ↳ El repartidor lo paga de su propio bolsillo al retirar en el local
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className={isDark ? 'text-zinc-300' : 'text-slate-600'}>
                  2. Tarifa de Carrera / Entrega:
                </span>
                <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(deliveryOffer)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-rose-400 pl-2">
                <span className="text-[11px]">Comisión AndesMovi (7% SÓLO del envío):</span>
                <span className="font-mono font-bold">-{formatCurrency(deliveryOffer * 0.07)}</span>
              </div>

              <div className={`flex justify-between text-xs pt-2 border-t ${isDark ? 'border-zinc-850' : 'border-slate-200'}`}>
                <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Ganancia Neta del Repartidor:
                </span>
                <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {formatCurrency(deliveryOffer * 0.93)}
                </span>
              </div>
            </div>

            {/* Banner explicativo del modelo de compra y pago directo */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                <strong>Modelo de Pago Directo:</strong> Le pagas el total de <strong>{formatCurrency(total)} USD</strong> directamente al repartidor al recibir en mano (en efectivo o transferencia). El repartidor recupera sus {formatCurrency(subtotal)} de la comida y se queda con el neto de su carrera.
              </p>
            </div>
          </div>

          {/* Delivery Address & Notes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span className={`truncate ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                Entrega en: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{userLocation.address || 'Tu dirección en Quito'}</strong>
              </span>
            </div>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Instrucciones para el repartidor (Apto, torre, portería...)"
              className={`w-full border text-xs p-2 rounded-xl focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-600'
              }`}
            />
          </div>

          {/* Seguridad: PIN de Inicio de Carrera Delivery */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
            isDark 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <div>
                <span className={`font-bold block text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>Seguridad: PIN de Inicio de Carrera Delivery</span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Recibirás un código PIN para que el repartidor inicie la entrega con tu validación</span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold whitespace-nowrap ${
              isDark 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-emerald-700 bg-emerald-100 border-emerald-200'
            }`}>
              PIN Activo
            </span>
          </div>

          {/* Total & Action */}
          <div className={`pt-2 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
            <div>
              <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total a Pagar (USD)</span>
              <p className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(total)}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenSchedule && (
                <button
                  type="button"
                  onClick={() => {
                    const storeName = cart.length > 0 ? cart[0].item.restaurantName : 'Encargo Especial Express';
                    onOpenSchedule(total, cart, storeName);
                  }}
                  className={`px-3.5 py-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    isDark 
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border-zinc-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Programar</span>
                </button>
              )}
              <button
                id="btn-confirm-delivery"
                onClick={handleCheckout}
                className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                  isDark 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                }`}
              >
                <span>Pedir Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BLOQUEO DE MODO DEMO */}
      {showDemoBlockModal && (
        <div className="fixed inset-0 z-[10005] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 text-left animate-scaleUp ${
              isDark ? 'bg-zinc-950 border-amber-500/60 text-white' : 'bg-white border-amber-400 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">MODO DEMO (Solo Visualización)</h3>
                <p className="text-xs text-amber-400 font-bold">Sin datos no puedes pedir a domicilio</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Estás en <strong>Modo Demostración</strong>. Puedes ver los menús y restaurantes asociados, pero para <strong>confirmar pedidos de comida o compras a domicilio</strong> debes ingresar tus datos personales.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDemoBlockModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Seguir en Demo
              </button>
              {onOpenRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoBlockModal(false);
                    onOpenRegister();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer active:scale-95 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>Registrarme (1 Paso)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

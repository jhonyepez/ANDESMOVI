import React, { useState } from 'react';
import {
  Sparkles,
  Gift,
  X,
  Award,
  CheckCircle2,
  TrendingUp,
  Coins,
  Shield,
  Percent,
  Flame,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';
import { haptic } from '../utils/haptics';

interface LoyaltyPromosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  isDark?: boolean;
  walletBalance?: number;
  onRedeemRechargeBonus?: () => void;
}

export const LoyaltyPromosModal: React.FC<LoyaltyPromosModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  isDark = true,
  walletBalance = 25.50,
  onRedeemRechargeBonus,
}) => {
  const [activeTab, setActiveTab] = useState<'cliente' | 'conductor'>(
    currentUser?.role === 'conductor' ? 'conductor' : 'cliente'
  );
  const [redeemedNotice, setRedeemedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const points = currentUser?.loyaltyPoints || 0;

  // Niveles de fidelidad del cliente
  const getClientLevel = (pts: number) => {
    if (pts >= 120) return { name: 'Andes VIP 👑', discount: '5% automático', color: 'from-amber-500 to-yellow-600', nextAt: 9999 };
    if (pts >= 60) return { name: 'Oro 🏆', discount: '3% automático', color: 'from-yellow-500 to-amber-600', nextAt: 120 };
    if (pts >= 20) return { name: 'Plata 🥈', discount: '1.5% automático', color: 'from-slate-400 to-zinc-500', nextAt: 60 };
    return { name: 'Bronce 🥉', discount: 'Tarifa básica', color: 'from-amber-600 to-orange-700', nextAt: 20 };
  };

  const clientLevel = getClientLevel(points);

  const rewards = [
    { id: 'r1', name: 'Bono Descuento $1.00 USD', cost: 25, desc: 'Descuento inmediato de $1.00 USD en cualquier carrera o pedido.' },
    { id: 'r2', name: 'Bono Descuento $2.50 USD', cost: 50, desc: 'Descuento de $2.50 USD ideal para tus rutas urbanas e intercantonales.' },
    { id: 'r3', name: 'Carrera Gratis (< $5.00 USD)', cost: 100, desc: '¡Canjea 100 monedas por una carrera urbana o delivery 100% gratis de hasta $5.00 USD!' },
  ];

  const totalRechargeBonusesEarned = Math.min(3, Math.floor((currentUser?.accumulatedRechargeAmount || 0) / 50));
  const claimedBonuses = currentUser?.claimedRechargeBonuses || 0;
  const canClaimRechargeBonus = totalRechargeBonusesEarned > claimedBonuses && claimedBonuses < 3;
  const isRechargeBonusCapped = claimedBonuses >= 3;
  const currentAccumulatedInCycle = (currentUser?.accumulatedRechargeAmount || 0) % 50;
  const neededForNextBonus = 50 - currentAccumulatedInCycle;

  const isPreferentialActive = walletBalance >= 50.00;

  const driverPromos = [
    {
      id: 'dp1',
      title: 'Bono Acumulativo de Recargas ($50 = $10 USD)',
      desc: 'Por cada $50 USD acumulados en recargas prepago, aplasta el botón y canjea $10 USD de inmediato automáticamente a tu billetera (Máximo 3 veces por conductor).',
      reward: isRechargeBonusCapped ? 'Completado (3/3 Canjeados 🏆)' : '+$10.00 USD de Bono por cada $50 de recarga',
      progress: isRechargeBonusCapped
        ? '3/3 Bonos Canjeados'
        : canClaimRechargeBonus
        ? '¡Meta $50 alcanzada! Listo para canjear'
        : `${claimedBonuses}/3 Bonos ($${currentAccumulatedInCycle.toFixed(2)}/$50.00 USD)`,
      progressPercent: isRechargeBonusCapped ? 100 : canClaimRechargeBonus ? 100 : Math.min(100, (currentAccumulatedInCycle / 50) * 100),
      badge: isRechargeBonusCapped
        ? 'Límite Alcanzado 🏆'
        : canClaimRechargeBonus
        ? '¡Canjear Disponible! 🎁'
        : 'Acumulando',
      canClaim: canClaimRechargeBonus,
      isCapped: isRechargeBonusCapped,
      needed: neededForNextBonus,
    },
    {
      id: 'dp2',
      title: 'Bono Especial de Comisión',
      desc: 'Mantén saldo positivo mayor a $50 USD para tarifas preferenciales.',
      reward: 'Comisión reducida al 5% automático',
      progress: isPreferentialActive
        ? `Activo: Saldo $${walletBalance.toFixed(2)} USD (> $50 USD)`
        : `Saldo actual: $${walletBalance.toFixed(2)} / $50.00 USD (Faltan $${Math.max(0, 50.00 - walletBalance).toFixed(2)})`,
      progressPercent: isPreferentialActive ? 100 : Math.min(100, (walletBalance / 50.00) * 100),
      badge: isPreferentialActive ? 'Cumplido ✔ - 5% Activo' : 'Pendiente',
      canClaim: false,
      isCapped: false,
      needed: 0,
    },
  ];

  const handleRedeemReward = (rewardName: string, cost: number) => {
    if (!currentUser) return;
    if (points < cost) {
      haptic.error();
      alert('Puntos insuficientes para este canje.');
      return;
    }

    haptic.success();
    const updatedUser = {
      ...currentUser,
      loyaltyPoints: points - cost,
      hasActiveFreeRideCoupon: rewardName.includes('Gratis') ? true : currentUser.hasActiveFreeRideCoupon,
    };
    onUpdateUser(updatedUser);
    setRedeemedNotice(
      rewardName.includes('Gratis')
        ? `¡Canjeaste exitosamente tu Carrera Gratis (< $5.00 USD)! El valor será cubierto automáticamente al finalizar el viaje.`
        : `¡Canjeaste exitosamente tu "${rewardName}"! Código de bono: ${Math.floor(100000 + Math.random() * 900000)}`
    );
    
    setTimeout(() => {
      setRedeemedNotice(null);
    }, 8000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl overflow-hidden border-2 shadow-2xl flex flex-col max-h-[88vh] ${
          isDark ? 'bg-zinc-950 border-amber-500/50 text-zinc-100' : 'bg-slate-50 border-amber-400 text-slate-900 shadow-2xl'
        }`}
      >
        
        {/* Decorative Header Banner */}
        <div className="p-5 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 relative overflow-hidden shadow-md">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,#fff,transparent)] pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptic.tap();
              onClose();
            }}
            className="absolute top-3.5 right-3.5 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all cursor-pointer active:scale-90 border border-white/30 shadow-md flex items-center justify-center"
            title="Cerrar modal"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3 relative z-10 pr-10">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner">
              <Gift className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Club AndesMovi Rewards
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-100 font-bold">
                Fidelización de Clientes y Bonos para Conductores Asociados
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className={`grid grid-cols-2 border-b-2 p-1 gap-1 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-200/80 border-slate-300'
        }`}>
          <button
            onClick={() => {
              setActiveTab('cliente');
              haptic.tap();
            }}
            className={`py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'cliente'
                ? isDark
                  ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/60 font-black shadow-sm'
                  : 'bg-white text-slate-950 border-2 border-amber-500 font-black shadow-md'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border-2 border-transparent'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent font-bold'
            }`}
          >
            <Coins className={`w-4 h-4 ${activeTab === 'cliente' ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Fidelidad Cliente</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('conductor');
              haptic.tap();
            }}
            className={`py-2.5 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'conductor'
                ? isDark
                  ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/60 font-black shadow-sm'
                  : 'bg-white text-slate-950 border-2 border-orange-500 font-black shadow-md'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border-2 border-transparent'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent font-bold'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === 'conductor' ? 'text-orange-500' : 'text-slate-400'}`} />
            <span>Promos Conductor</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {redeemedNotice && (
            <div className={`p-3.5 rounded-2xl border-2 text-xs font-extrabold flex items-start gap-2.5 animate-fadeIn shadow-md ${
              isDark
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-50 border-emerald-400 text-emerald-950'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-emerald-900 dark:text-emerald-300">¡Transacción Realizada!</span>
                <p className={`text-[11px] font-bold mt-0.5 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  {redeemedNotice}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cliente' ? (
            <div className="space-y-4">
              {/* User Loyalty Balance Card */}
              <div className={`p-4 rounded-3xl border-2 flex items-center justify-between gap-4 shadow-lg relative overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-amber-500/40 text-white'
                  : 'bg-gradient-to-r from-amber-100/70 via-orange-50 to-amber-100 border-amber-300 text-slate-950'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1.5 z-10">
                  <span className={`text-[10px] uppercase font-black tracking-wider block ${
                    isDark ? 'text-amber-400' : 'text-amber-900'
                  }`}>
                    Tu Billetera de Puntos
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl sm:text-4xl font-black font-mono ${
                      isDark ? 'text-amber-300' : 'text-amber-900'
                    }`}>
                      {points}
                    </span>
                    <span className={`text-xs font-black uppercase ${
                      isDark ? 'text-zinc-300' : 'text-slate-800'
                    }`}>
                      AndesMovi Coins
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r ${clientLevel.color} text-white shadow-sm`}>
                      Rango {clientLevel.name}
                    </span>
                    <span className={`text-[11px] font-bold ${
                      isDark ? 'text-zinc-300' : 'text-slate-800'
                    }`}>
                      • Beneficio: {clientLevel.discount}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl border-2 flex flex-col items-center shrink-0 shadow-md ${
                  isDark
                    ? 'bg-zinc-900 border-amber-500/40 text-amber-400'
                    : 'bg-white border-amber-300 text-amber-800'
                }`}>
                  <Award className="w-7 h-7 text-amber-500" />
                  <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Nivel Activo</span>
                </div>
              </div>

              {/* Progress Slider to next reward */}
              {clientLevel.nextAt < 9999 && (
                <div className={`p-3.5 rounded-2xl border-2 text-xs shadow-sm ${
                  isDark
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1.5">
                    <span className={isDark ? 'text-zinc-200' : 'text-slate-800 font-bold'}>
                      Siguiente Rango de Fidelidad ({clientLevel.nextAt} pts)
                    </span>
                    <span className={`font-mono font-black ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      {points}/{clientLevel.nextAt} pts
                    </span>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden border-2 ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-200 border-slate-300'
                  }`}>
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (points / clientLevel.nextAt) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Redeemable Rewards Section */}
              <div className="space-y-2.5">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-zinc-200' : 'text-slate-900'
                }`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Canjear Premios Disponibles</span>
                </h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {rewards.map((reward) => {
                    const canAfford = points >= reward.cost;
                    return (
                      <div
                        key={reward.id}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                          canAfford
                            ? isDark
                              ? 'bg-zinc-900 border-amber-500/40 hover:border-amber-400 shadow-md text-white'
                              : 'bg-white border-amber-300 hover:border-amber-500 shadow-md text-slate-900'
                            : isDark
                            ? 'bg-zinc-950/60 border-zinc-800 opacity-60 text-zinc-400'
                            : 'bg-slate-100/80 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-black ${
                              canAfford
                                ? isDark ? 'text-white' : 'text-slate-950'
                                : isDark ? 'text-zinc-400' : 'text-slate-600 font-bold'
                            }`}>
                              {reward.name}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-black ${
                              canAfford
                                ? isDark
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-amber-100 text-amber-950 border-amber-400'
                                : isDark
                                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                : 'bg-slate-200 text-slate-600 border-slate-300'
                            }`}>
                              {reward.cost} pts
                            </span>
                          </div>
                          <p className={`text-[11px] leading-tight ${
                            canAfford
                              ? isDark ? 'text-zinc-300' : 'text-slate-700 font-medium'
                              : isDark ? 'text-zinc-400' : 'text-slate-500'
                          }`}>
                            {reward.desc}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => handleRedeemReward(reward.name, reward.cost)}
                          className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap shrink-0 border-2 ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-amber-400 active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer font-black'
                              : isDark
                              ? 'bg-zinc-850 text-zinc-500 border-zinc-800 cursor-not-allowed'
                              : 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed font-bold'
                          }`}
                        >
                          Canjear
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* How to Accumulate Info */}
              <div className={`p-3.5 rounded-2xl border-2 text-[11px] flex items-start gap-2.5 shadow-sm ${
                isDark
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className={isDark ? 'text-white' : 'text-slate-950'}>¿Cómo acumular puntos?</strong> Recibes AndesMovi Coins automáticamente en cada servicio: <strong className={isDark ? 'text-amber-300' : 'text-amber-900 font-black'}>5 pts</strong> por Carrera Urbana, <strong className={isDark ? 'text-amber-300' : 'text-amber-900 font-black'}>7 pts</strong> por Encomienda Urbana, <strong className={isDark ? 'text-amber-300' : 'text-amber-900 font-black'}>10 pts</strong> por Encomienda Interprovincial y <strong className={isDark ? 'text-amber-300' : 'text-amber-900 font-black'}>10 pts</strong> por Bus Ejecutivo.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Driver Active Promotion Headline */}
              <div className={`p-4 rounded-3xl border-2 text-xs shadow-md ${
                isDark
                  ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-500/40 text-white'
                  : 'bg-gradient-to-r from-amber-100/70 via-orange-50 to-amber-100 border-amber-300 text-slate-950'
              }`}>
                <div className={`flex items-center gap-2 font-black uppercase mb-1 text-sm ${
                  isDark ? 'text-amber-300' : 'text-amber-900'
                }`}>
                  <Zap className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span>Campaña Especial "Llama del Carchi"</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${
                  isDark ? 'text-zinc-300' : 'text-slate-700 font-medium'
                }`}>
                  Todos los conductores registrados participan automáticamente. Consigue bonos semanales en dólares que se abonan de manera directa e instantánea a tu Billetera Digital AndesMovi.
                </p>
              </div>

              {/* Active Drivers Challenges Grid */}
              <div className="space-y-2.5">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-zinc-200' : 'text-slate-900'
                }`}>
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>Desafíos y Metas Vigentes</span>
                </h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {driverPromos.map((promo) => (
                    <div
                      key={promo.id}
                      className={`p-4 rounded-2xl border-2 flex flex-col gap-2.5 shadow-md ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-800 text-white'
                          : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className={`text-xs font-black block ${
                            isDark ? 'text-white' : 'text-slate-950'
                          }`}>
                            {promo.title}
                          </span>
                          <p className={`text-[11px] mt-0.5 ${
                            isDark ? 'text-zinc-300' : 'text-slate-600 font-medium'
                          }`}>
                            {promo.desc}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border flex-shrink-0 ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-amber-100 text-amber-950 border-amber-400 font-black'
                        }`}>
                          {promo.badge}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold pt-1">
                        <span className={`font-black ${
                          isDark ? 'text-emerald-400' : 'text-emerald-800'
                        }`}>
                          {promo.reward}
                        </span>
                        <span className={`font-mono text-[11px] font-bold ${
                          isDark ? 'text-zinc-400' : 'text-slate-700'
                        }`}>
                          {promo.progress}
                        </span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className={`w-full h-2 rounded-full overflow-hidden border ${
                        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-200 border-slate-300'
                      }`}>
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${promo.progressPercent}%` }}
                        />
                      </div>

                      {/* Botón de Canje de Bono de $10 USD para dp1 */}
                      {promo.id === 'dp1' && (
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {promo.isCapped
                              ? '🏆 Máximo de 3 bonos canjeados ($30 USD recibidos)'
                              : promo.canClaim
                              ? '¡Meta de $50 alcanzada! Aplasta para canjear.'
                              : `Faltan $${promo.needed.toFixed(2)} USD para desbloquear.`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onRedeemRechargeBonus) {
                                onRedeemRechargeBonus();
                              } else {
                                if (!promo.canClaim) {
                                  haptic.warning();
                                  alert(promo.isCapped
                                    ? '🏆 ¡Límite alcanzado! Has canjeado los 3 bonos de $10 USD ($30 USD en total).'
                                    : `Aún no completas los $50.00 USD en recargas.\n\nTe faltan: $${promo.needed.toFixed(2)} USD en recargas para canjear tu bono de $10 USD.`);
                                  return;
                                }
                                const newClaimed = (currentUser?.claimedRechargeBonuses || 0) + 1;
                                const updated = { ...currentUser!, claimedRechargeBonuses: newClaimed };
                                onUpdateUser(updated);
                                haptic.success();
                                alert('🎉 ¡Felicidades! Has canjeado tu bono de $10.00 USD exitosamente.');
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                              promo.canClaim
                                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-zinc-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400 animate-pulse'
                                : promo.isCapped
                                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                                : isDark
                                ? 'bg-zinc-800 hover:bg-zinc-750 text-amber-300/80 border border-amber-500/30'
                                : 'bg-slate-100 hover:bg-slate-200 text-amber-900 border border-amber-300'
                            }`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${promo.canClaim ? 'animate-spin' : 'text-amber-400'}`} />
                            <span>{promo.canClaim ? '🎁 CANJEAR $10 USD' : promo.isCapped ? 'Completado (3/3)' : `Canjear $10 (Faltan $${promo.needed.toFixed(2)})`}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Terms Banner */}
              <div className={`p-3.5 rounded-2xl border-2 text-[11px] text-center font-bold ${
                isDark
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                Los bonos de desempeño y las promociones son liquidados automáticamente cada lunes a las 08:00 AM.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Banner */}
        <div className={`p-4 border-t-2 text-center ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-slate-200 shadow-inner'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 rounded-2xl text-xs font-black transition-all border-2 cursor-pointer active:scale-98 shadow-md ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-700 hover:text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 hover:border-black font-black'
            }`}
          >
            Cerrar Portal de Premios
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { formatCurrency } from '../utils/geoUtils';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  X,
  CreditCard,
  CheckCircle2,
  Building2,
  ChevronDown,
  ChevronUp,
  Receipt,
  AlertCircle,
  Clock,
  Upload,
  Camera,
  FileText,
  Eye,
  Trash2,
  ExternalLink,
  Info,
  Gift,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AdminBankAccountsList } from './admin/AdminBankAccountsList';
import { WalletRechargeRequest, UserProfile } from '../types';
import { OFFICIAL_ADMIN_BANK_ACCOUNTS } from '../data/mockData';

interface WalletModalProps {
  balance: number;
  onTopUp?: (amount: number, details?: { bank: string; referenceNumber: string }) => void;
  onAddRechargeRequest?: (req: WalletRechargeRequest) => void;
  walletRecharges?: WalletRechargeRequest[];
  currentUserName?: string;
  currentUserPhone?: string;
  currentUser?: UserProfile | null;
  onRedeemRechargeBonus?: () => void;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  balance,
  onTopUp,
  onAddRechargeRequest,
  walletRecharges = [],
  currentUserName = 'Conductor AndesMovi',
  currentUserPhone = '0991234567',
  currentUser,
  onRedeemRechargeBonus,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'presentar' | 'historial'>('presentar');
  const [rechargeAmount, setRechargeAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('bank-pichincha');
  const [voucherNumber, setVoucherNumber] = useState<string>('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [previewingDocUrl, setPreviewingDocUrl] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<WalletRechargeRequest | null>(null);
  const [showBankAccounts, setShowBankAccounts] = useState<boolean>(true);

  // Selected personal bank object
  const selectedBankObj = OFFICIAL_ADMIN_BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || OFFICIAL_ADMIN_BANK_ACCOUNTS[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
      if (voucherError) setVoucherError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVoucher = voucherNumber.trim();
    const finalAmount = customAmount ? parseFloat(customAmount) : rechargeAmount;

    if (!finalAmount || finalAmount <= 0) {
      setVoucherError('Por favor ingresa un monto válido a recargar.');
      return;
    }

    if (!cleanVoucher || cleanVoucher.length < 4) {
      setVoucherError('Debes ingresar el número de comprobante o autorización de la transferencia bancaria (mínimo 4 caracteres).');
      return;
    }

    if (!proofImage) {
      setVoucherError('¡Obligatorio! Debes presentar la foto o archivo del documento de transferencia realizado a las cuentas de Jhon Sebastian Yepez Clavijo para poder activar la recarga.');
      return;
    }

    setVoucherError(null);

    const newRequest: WalletRechargeRequest = {
      id: `rec-${Date.now()}`,
      driverOrUserId: 'drv-current',
      driverOrUserName: currentUserName,
      driverOrUserPhone: currentUserPhone,
      role: 'conductor',
      amountUsd: finalAmount,
      paymentMethod: selectedBankObj.id.includes('pichincha')
        ? 'pichincha'
        : selectedBankObj.id.includes('guayaquil')
        ? 'guayaquil'
        : selectedBankObj.id.includes('produbanco')
        ? 'produbanco'
        : 'transferencia',
      referenceNumber: cleanVoucher,
      transferVoucherNumber: cleanVoucher,
      bankName: selectedBankObj.bankName,
      proofImageUrl: proofImage,
      proofDocumentName: proofFileName || 'comprobante_transferencia.jpg',
      destinationAccountHolder: selectedBankObj.accountHolder,
      destinationAccountNumber: selectedBankObj.accountNumber,
      destinationBank: `${selectedBankObj.bankName} (${selectedBankObj.accountType})`,
      status: 'pendiente', // Always starts pending verification by admin
      requestedAt: Date.now(),
      requestedAtFormatted: new Date().toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      adminNotes: `Transferencia presentada por conductor hacia ${selectedBankObj.bankName} (${selectedBankObj.accountNumber}) a nombre de ${selectedBankObj.accountHolder}. N° Comprobante: ${cleanVoucher}`,
    };

    if (onAddRechargeRequest) {
      onAddRechargeRequest(newRequest);
    }

    setSubmittedRequest(newRequest);
    setVoucherNumber('');
    setProofImage(null);
    setProofFileName('');
    setCustomAmount('');
  };

  // Filter requests submitted by this driver
  const myRechargeRequests = walletRecharges.filter(
    (r) => r.driverOrUserId === 'drv-current' || r.driverOrUserName.includes(currentUserName) || r.role === 'conductor'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl max-h-[94vh] bg-zinc-900 border border-zinc-750 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Billetera Prepago del Conductor</h3>
              <p className="text-[10px] text-zinc-400">Recarga de saldo mediante presentación de comprobante bancario</p>
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
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Balance card */}
          {(() => {
            const isPreferentialActive = balance >= 50.00;
            const currentAccum = currentUser?.accumulatedRechargeAmount || 0;
            const earnedBonuses = Math.min(3, Math.floor(currentAccum / 50));
            const claimedBonuses = currentUser?.claimedRechargeBonuses || 0;
            const canClaim = earnedBonuses > claimedBonuses && claimedBonuses < 3;
            const isCapped = claimedBonuses >= 3;
            const currentInCycle = currentAccum % 50;
            const needed = 50 - currentInCycle;
            const progressPercent = isCapped ? 100 : canClaim ? 100 : Math.min(100, (currentInCycle / 50) * 100);

            return (
              <>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col gap-1 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Saldo Prepago Activo</span>
                    {isPreferentialActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400 flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>🌟 Tarifa Preferencial 5% Activa (Saldo &gt; $50)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Comisión 7% AndesMovi
                      </span>
                    )}
                  </div>
                  <span className="text-3xl font-black text-white tracking-tight font-mono">{formatCurrency(balance)}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 mt-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      {isPreferentialActive
                        ? '¡Excelente! Al mantener saldo mayor a $50 USD disfrutas de comisión reducida al 5% en tus carreras urbanas.'
                        : 'El cliente te paga el 100% en mano/transferencia. Bono Especial: Mantén saldo mayor a $50 USD para comisión preferencial del 5%.'}
                    </span>
                  </div>
                </div>

                {/* Bono Acumulativo de Recargas ($50 = $10 USD) */}
                <div className={`p-4 rounded-2xl border-2 transition-all shadow-lg ${
                  canClaim
                    ? 'bg-gradient-to-br from-amber-950/60 via-zinc-950 to-emerald-950/60 border-amber-400 shadow-amber-500/20'
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl border ${canClaim ? 'bg-amber-400 text-zinc-950 border-amber-300 animate-bounce' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>Bono de Recargas ($50 = $10 USD)</span>
                          {canClaim && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 font-black animate-pulse">
                              ¡LISTO!
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-zinc-400">
                          {isCapped
                            ? '🏆 Máximo de 3 bonos canjeados ($30 USD recibidos)'
                            : canClaim
                            ? '¡Completaste los $50 USD! Aplasta el botón para canjear tus $10 USD.'
                            : `Acumula $50 en recargas y canjea $10 USD automáticamente (Faltan $${needed.toFixed(2)} USD).`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 flex-shrink-0">
                      {claimedBonuses}/3 Bonos
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-3 border border-zinc-700">
                    <div
                      className={`h-full transition-all duration-500 ${
                        canClaim
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-400">
                      {canClaim
                        ? '🎁 ¡Bono de $10 USD disponible para canjear!'
                        : isCapped
                        ? '3 de 3 bonos canjeados'
                        : `Acumulado ciclo: $${currentInCycle.toFixed(2)} / $50.00 USD`}
                    </span>

                    <button
                      type="button"
                      disabled={isCapped}
                      onClick={() => {
                        if (onRedeemRechargeBonus) {
                          onRedeemRechargeBonus();
                        } else {
                          if (!canClaim) {
                            alert(isCapped
                              ? '🏆 ¡Límite alcanzado! Has canjeado los 3 bonos de $10 USD.'
                              : `Aún no completas los $50 USD en recargas.\n\nTe faltan: $${needed.toFixed(2)} USD para canjear tus $10 USD.`);
                            return;
                          }
                          alert('¡Bono canjeado!');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                        canClaim
                          ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-zinc-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400 animate-pulse'
                          : isCapped
                          ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                          : 'bg-zinc-900 hover:bg-zinc-850 text-amber-300/80 border border-amber-500/30'
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${canClaim ? 'animate-spin' : 'text-amber-400'}`} />
                      <span>{canClaim ? '🎁 CANJEAR $10 USD' : isCapped ? 'Completado (3/3)' : `Canjear $10 (Faltan $${needed.toFixed(2)})`}</span>
                    </button>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Comisiones de Plataforma (Débito Automático) — AndesMovi Transparente */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs flex flex-col gap-2.5 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <span className="font-black text-white text-xs flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Comisiones de Plataforma (Débito Automático)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AndesMovi Transparente
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              El cliente te paga el <strong>100% de la carrera directamente a ti</strong>. AndesMovi descuenta de tu saldo prepago: <strong>7% para Carreras Urbanas y Delivery/Domicilio</strong>, <strong>9% para Encomiendas Interprovinciales</strong>, y <strong>$3.00 USD por pasajero en servicio ejecutivo</strong> (1 pasajero: $3, 2 pasajeros: $6, 3 pasajeros: $9, 4 pasajeros / Auto completo: $12 USD).
            </p>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-bold flex items-center gap-2">
              <span>🛡️</span>
              <span>Mantén un <strong>fondo de seguridad mínimo de $10.00 USD</strong> en tu billetera prepago.</span>
            </div>
          </div>

          {/* Core Business Rule Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5 shadow-md">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-amber-300 block text-xs uppercase tracking-wide">
                Requisito Obligatorio para Activar Recargas
              </span>
              <p className="text-[11px] text-zinc-200 leading-relaxed">
                El conductor <strong>debe presentar el documento de transferencia bancaria</strong> a las cuentas personales del administrador (<strong>Jhon Sebastian Yepez Clavijo</strong>). La recarga se activará inmediatamente una vez cotejado el comprobante en su banca.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-2xl bg-zinc-950 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('presentar')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'presentar'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Presentar Comprobante</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'historial'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Mis Comprobantes ({myRechargeRequests.length})</span>
            </button>
          </div>

          {/* TAB 1: PRESENTAR DOCUMENTO DE TRANSFERENCIA */}
          {activeTab === 'presentar' && (
            <div className="space-y-4">
              {/* Submitted Request Confirmation Banner */}
              {submittedRequest && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/70 text-emerald-200 text-xs animate-fadeIn space-y-2.5 shadow-xl">
                  <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>¡Documento de Transferencia Presentado!</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    Hemos registrado tu solicitud de recarga por <strong className="text-white">${submittedRequest.amountUsd.toFixed(2)} USD</strong> con comprobante <strong className="text-amber-300 font-mono">#{submittedRequest.transferVoucherNumber}</strong> hacia <strong className="text-white">{submittedRequest.destinationBank}</strong> a nombre de <strong className="text-white">{submittedRequest.destinationAccountHolder}</strong>.
                  </p>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center gap-2 text-[11px] text-amber-300 font-medium">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>Estado: <strong>Pendiente de verificación</strong>. El Administrador verificará el depósito en su cuenta personal para activar tu recarga.</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('historial')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-black hover:bg-emerald-400 shadow-md transition-all"
                    >
                      Ver en Mis Comprobantes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmittedRequest(null)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
                    >
                      Cerrar Aviso
                    </button>
                  </div>
                </div>
              )}

              {/* Official Personal Bank Accounts of Jhon Sebastian Yepez Clavijo */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowBankAccounts(!showBankAccounts)}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 hover:from-amber-900/60 hover:to-zinc-900 border-2 border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-between transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <span className="font-bold block text-white text-xs">Cuentas Personales Oficiales para Transferencias</span>
                      <span className="text-[10px] text-amber-300/80 font-normal">
                        Titular: Jhon Sebastian Yepez Clavijo (C.I. 1004721351)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-300 font-bold flex-shrink-0">
                    <span>{showBankAccounts ? 'Ocultar' : 'Ver Cuentas'}</span>
                    {showBankAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showBankAccounts && (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/30 animate-fadeIn space-y-3">
                    <AdminBankAccountsList
                      title="Cuentas Personales Autorizadas"
                      subtitle="Transfiere el valor a cualquiera de estas cuentas personales y adjunta el comprobante abajo:"
                      compact={true}
                      showAllDataCopy={true}
                    />
                  </div>
                )}
              </div>

              {/* Formulario de Presentación de Documento */}
              <form onSubmit={handleSubmitRecharge} className="space-y-4 p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Formulario de Presentación de Comprobante</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                    Activación por Admin
                  </span>
                </div>

                {/* 1. Destination Personal Account Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-300 font-bold flex items-center justify-between">
                    <span>1. Cuenta Personal a la que transferiste:</span>
                    <span className="text-[10px] text-amber-300 font-mono">Titular: Jhon Sebastian Yepez Clavijo</span>
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border-2 border-zinc-700 hover:border-zinc-600 focus:border-amber-400 text-white text-xs font-semibold focus:outline-none"
                  >
                    {OFFICIAL_ADMIN_BANK_ACCOUNTS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountType} #{b.accountNumber} ({b.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Amount Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-300 font-bold">2. Monto Transferido en USD:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, 50].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => {
                          setRechargeAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all font-mono ${
                          rechargeAmount === amt && !customAmount
                            ? 'bg-amber-500 text-zinc-950 border-amber-500 font-black shadow-md'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        +{formatCurrency(amt)}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1">
                    <input
                      type="number"
                      step="0.50"
                      min="1"
                      placeholder="O ingresa otro monto en USD (ej: 15.00)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400 placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* 3. Voucher / Transaction Number */}
                <div className="space-y-1">
                  <label htmlFor="recharge-voucher-input" className="text-[11px] text-amber-300 font-black flex items-center gap-1">
                    <span>3. Número de Comprobante / Transacción de la Transferencia</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="recharge-voucher-input"
                      type="text"
                      value={voucherNumber}
                      onChange={(e) => {
                        setVoucherNumber(e.target.value);
                        if (voucherError) setVoucherError(null);
                      }}
                      placeholder="Ej: 00984124 o PICH-8849201"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border-2 border-amber-500/50 focus:border-amber-400 text-white text-xs font-mono font-bold tracking-wider placeholder:text-zinc-600 focus:outline-none shadow-inner"
                      required
                    />
                    <div className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none">
                      <Receipt className="w-4 h-4 text-amber-400/80" />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Número de autorización o movimiento generado por la app del banco o ventanilla.
                  </p>
                </div>

                {/* 4. Upload Transfer Document / Voucher Image */}
                <div className="space-y-2">
                  <label className="text-[11px] text-amber-300 font-black flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>4. Documento de Transferencia (Foto / Captura / PDF)</span>
                      <span className="text-red-400">*</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">Banca móvil o papeleta</span>
                  </label>

                  {proofImage ? (
                    <div className="p-3 rounded-2xl bg-zinc-900 border-2 border-emerald-500/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={proofImage}
                          alt="Comprobante"
                          className="w-14 h-14 rounded-xl object-cover border border-emerald-500/30 flex-shrink-0 cursor-pointer"
                          onClick={() => setPreviewingDocUrl(proofImage)}
                        />
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-white block truncate">
                            {proofFileName || 'documento_transferencia.jpg'}
                          </span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Documento adjuntado listo para enviar
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewingDocUrl(proofImage)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                          title="Ver documento en grande"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProofImage(null);
                            setProofFileName('');
                          }}
                          className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400"
                          title="Eliminar documento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-900/90 border-2 border-dashed border-amber-500/50 hover:border-amber-400 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-2 text-amber-400 group-hover:scale-105 transition-transform mb-1.5">
                          <Camera className="w-5 h-5" />
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white group-hover:text-amber-300">
                          Seleccionar o Tomar Foto del Comprobante
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">
                          JPG, PNG, WebP o captura de pantalla de la banca móvil
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {voucherError && (
                    <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{voucherError}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-transfer-voucher"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  <span>
                    Presentar Documento de Transferencia ({formatCurrency(customAmount ? parseFloat(customAmount) || 0 : rechargeAmount)})
                  </span>
                </button>
                <p className="text-[10px] text-center text-zinc-400">
                  El Administrador cotejará el documento con sus cuentas personales para activar la recarga de tu saldo.
                </p>
              </form>
            </div>
          )}

          {/* TAB 2: HISTORIAL DE COMPROBANTES PRESENTADOS */}
          {activeTab === 'historial' && (
            <div className="space-y-3">
              <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Tus Documentos de Transferencia Registrados</span>
                <span className="text-[10px] text-zinc-500 font-mono">{myRechargeRequests.length} registros</span>
              </div>

              {myRechargeRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-zinc-500" />
                  <p className="text-xs font-bold text-zinc-300">No has presentado documentos de transferencia todavía</p>
                  <p className="text-[11px] text-zinc-500">
                    Realiza una transferencia a las cuentas personales de Jhon Sebastian Yepez Clavijo y sube tu comprobante para activar saldo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('presentar')}
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition-colors"
                  >
                    Presentar Comprobante Ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {myRechargeRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-zinc-950 border-2 border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{req.bankName || 'Banco Ecuador'}</span>
                            <span
                              className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                                req.status === 'aprobada'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : req.status === 'rechazada'
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {req.status === 'aprobada'
                                ? 'Activada en Billetera'
                                : req.status === 'rechazada'
                                ? 'Rechazada'
                                : 'Pendiente de Activación'}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block">
                            N° Comprobante: <strong className="text-amber-300 font-mono">{req.transferVoucherNumber || req.referenceNumber}</strong>
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            Presentado: {req.requestedAtFormatted}
                          </span>
                        </div>
                        <span className="text-base font-black font-mono text-emerald-400 flex-shrink-0">
                          +{formatCurrency(req.amountUsd)}
                        </span>
                      </div>

                      {/* Destination account note */}
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-850 text-[10px] text-zinc-300 flex items-center justify-between gap-2">
                        <span>
                          Destino: <strong>{req.destinationBank || 'Cuenta personal'}</strong> • Titular: {req.destinationAccountHolder || 'Jhon Sebastian Yepez Clavijo'}
                        </span>
                        {req.proofImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewingDocUrl(req.proofImageUrl || null)}
                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold flex items-center gap-1 flex-shrink-0 border border-amber-500/30 text-[10px]"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver Documento</span>
                          </button>
                        )}
                      </div>

                      {req.adminNotes && (
                        <div className="text-[10px] text-zinc-400 italic">
                          Nota Admin: {req.adminNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Lightbox Modal */}
      {previewingDocUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white">Documento de Transferencia Bancaria</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingDocUrl(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/60 max-h-[70vh] overflow-auto">
              <img
                src={previewingDocUrl}
                alt="Documento de transferencia"
                className="max-w-full max-h-[60vh] object-contain rounded-xl border border-zinc-800 shadow-2xl"
              />
            </div>
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-400">
                Presentado para cotejo con cuentas de Jhon Sebastian Yepez Clavijo
              </span>
              <button
                type="button"
                onClick={() => setPreviewingDocUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

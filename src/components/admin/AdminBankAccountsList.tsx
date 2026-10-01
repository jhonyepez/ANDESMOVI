import React, { useState } from 'react';
import { OFFICIAL_ADMIN_BANK_ACCOUNTS } from '../../data/mockData';
import { AdminBankAccount } from '../../types';
import {
  Building2,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
  User,
  Hash,
  Mail,
  Info,
} from 'lucide-react';

interface AdminBankAccountsListProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  showAllDataCopy?: boolean;
  isDark?: boolean;
}

export const AdminBankAccountsList: React.FC<AdminBankAccountsListProps> = ({
  title = 'Cuentas de Administrador para Depósito & Transferencia',
  subtitle = 'Cuentas oficiales autorizadas para recargas de saldo prepago de conductores AndesMovi',
  compact = false,
  showAllDataCopy = true,
  isDark = true,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleCopyAll = (bank: AdminBankAccount) => {
    const fullDetails = `DATOS PARA TRANSFERENCIA / DEPÓSITO ANDESMOVI:
Banco: ${bank.bankName}
Tipo de Cuenta: ${bank.accountType}
Número de Cuenta: ${bank.accountNumber}
Titular: ${bank.accountHolder}
Cédula de Identidad: ${bank.identification}
Correo de Notificación: ${bank.email}
Concepto: Recarga Saldo Prepago Conductor`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullDetails);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const getBankColor = (shortCode: string) => {
    switch (shortCode) {
      case 'PICHINCHA':
        return {
          border: isDark ? 'border-amber-500/50' : 'border-amber-300',
          bg: isDark ? 'bg-amber-950/20' : 'bg-amber-50',
          badge: isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300',
          accent: isDark ? 'text-amber-400' : 'text-amber-600',
          glow: isDark ? 'hover:border-amber-400' : 'hover:border-amber-400 shadow-sm',
        };
      case 'GUAYAQUIL':
        return {
          border: isDark ? 'border-pink-500/50' : 'border-pink-300',
          bg: isDark ? 'bg-pink-950/20' : 'bg-pink-50',
          badge: isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-pink-100 text-pink-800 border-pink-300',
          accent: isDark ? 'text-pink-400' : 'text-pink-600',
          glow: isDark ? 'hover:border-pink-400' : 'hover:border-pink-400 shadow-sm',
        };
      case 'PRODUBANCO':
        return {
          border: isDark ? 'border-emerald-500/50' : 'border-emerald-300',
          bg: isDark ? 'bg-emerald-950/20' : 'bg-emerald-50',
          badge: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
          accent: isDark ? 'text-emerald-400' : 'text-emerald-600',
          glow: isDark ? 'hover:border-emerald-400' : 'hover:border-emerald-400 shadow-sm',
        };
      case 'AUSTRO':
        return {
          border: isDark ? 'border-red-500/50' : 'border-red-300',
          bg: isDark ? 'bg-red-950/20' : 'bg-red-50',
          badge: isDark ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-red-100 text-red-800 border-red-300',
          accent: isDark ? 'text-red-400' : 'text-red-600',
          glow: isDark ? 'hover:border-red-400' : 'hover:border-red-400 shadow-sm',
        };
      default:
        return {
          border: isDark ? 'border-zinc-700' : 'border-slate-300',
          bg: isDark ? 'bg-zinc-900' : 'bg-slate-50',
          badge: isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300',
          accent: isDark ? 'text-zinc-300' : 'text-slate-600',
          glow: isDark ? 'hover:border-zinc-600' : 'hover:border-slate-400 shadow-sm',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info Block */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-md ${
        isDark 
          ? 'bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-amber-500/40' 
          : 'bg-gradient-to-r from-amber-50/50 via-white to-amber-50/50 border-amber-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
              isDark ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>4 Bancos Nacionales</span>
                </span>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="text-left sm:text-right">
              <span className={`text-[10px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Titular Maestro Oficial
              </span>
              <span className={`text-xs font-black block ${isDark ? 'text-white' : 'text-slate-900'}`}>Jhon Sebastian Yepez Clavijo</span>
              <span className={`text-[10px] font-mono block font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>C.I. 1004721351</span>
            </div>
          </div>
        </div>

        {/* Global Notice */}
        <div className={`mt-3.5 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] ${
          isDark ? 'border-zinc-800 text-zinc-300' : 'border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>
              Realiza tu depósito o transferencia interbancaria directa. Las transferencias entre el mismo banco son inmediatas.
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
            isDark ? 'text-zinc-300 bg-black/40 border-zinc-800' : 'text-slate-700 bg-slate-100 border-slate-300'
          }`}>
            Correo: <strong className={isDark ? 'text-zinc-200' : 'text-slate-900'}>jhonsevadtisn@gmail.com</strong>
          </span>
        </div>
      </div>

      {/* Grid of 4 Official Bank Accounts */}
      <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-3.5`}>
        {OFFICIAL_ADMIN_BANK_ACCOUNTS.map((bank) => {
          const style = getBankColor(bank.shortCode);
          const isCopiedNum = copiedId === `num-${bank.id}`;
          const isCopiedCed = copiedId === `ced-${bank.id}`;

          return (
            <div
              key={bank.id}
              className={`p-4 rounded-2xl border-2 ${style.border} ${style.glow} flex flex-col justify-between gap-3 shadow-md transition-all relative overflow-hidden group ${
                isDark ? 'bg-zinc-900' : 'bg-white'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center border ${style.border}`}>
                    <CreditCard className={`w-4 h-4 ${style.accent}`} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black transition-colors ${
                      isDark ? 'text-white group-hover:text-amber-200' : 'text-slate-900 group-hover:text-amber-700'
                    }`}>
                      {bank.bankName}
                    </h4>
                    <span className={`text-[11px] font-semibold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Cuenta de {bank.accountType}
                    </span>
                  </div>
                </div>

                {bank.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${style.badge}`}>
                    {bank.badge}
                  </span>
                )}
              </div>

              {/* Account Number Focus Box */}
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-inner ${
                isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`text-[10px] font-bold block uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Número de Cuenta ({bank.accountType}):
                  </span>
                  <span className={`text-base font-black font-mono tracking-wider block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {bank.accountNumber}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(bank.accountNumber, `num-${bank.id}`)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer ${
                    isCopiedNum
                      ? 'bg-emerald-500 text-zinc-950'
                      : isDark
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800 hover:text-slate-900 border border-slate-300'
                  }`}
                  title="Copiar número de cuenta"
                >
                  {isCopiedNum ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Beneficiary Details */}
              <div className={`space-y-1.5 text-xs pt-1 border-t ${
                isDark ? 'border-zinc-800/80 text-zinc-300' : 'border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <User className="w-3 h-3" />
                    <span>Titular:</span>
                  </span>
                  <span className={`font-bold text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{bank.accountHolder}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <Hash className="w-3 h-3" />
                    <span>C.I. / RUC:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{bank.identification}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.identification, `ced-${bank.id}`)}
                      className={`p-1 rounded cursor-pointer ${
                        isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title="Copiar Cédula"
                    >
                      {isCopiedCed ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <Mail className="w-3 h-3" />
                    <span>Correo:</span>
                  </span>
                  <span className={`font-mono text-[10px] ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{bank.email}</span>
                </div>
              </div>

              {/* Notes & Quick Copy All */}
              {showAllDataCopy && (
                <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-zinc-800' : 'border-slate-200'
                }`}>
                  <span className={`text-[10px] italic truncate max-w-[200px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {bank.notes}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAll(bank)}
                    className={`text-[10px] font-bold underline flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                      isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-700 hover:text-amber-800'
                    }`}
                  >
                    <span>Copiar todos los datos</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {copiedAll && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>¡Todos los datos bancarios fueron copiados al portapapeles con formato listo para banca móvil!</span>
        </div>
      )}
    </div>
  );
};

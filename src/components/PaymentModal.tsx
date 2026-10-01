import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PaymentDetails, PaymentMethodType } from '../types';
import { formatCurrency } from '../utils/geoUtils';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Banknote,
  Wallet,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Building2,
  X,
  Share2,
  Download,
  ShieldCheck,
} from 'lucide-react';

interface PaymentModalProps {
  amount: number;
  serviceTitle: string;
  walletBalance: number;
  onPaymentSuccess: (details: PaymentDetails) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  serviceTitle,
  walletBalance,
  onPaymentSuccess,
  onClose,
}) => {
  // The client pays in cash (al contado) or direct bank transfer; digital wallet is driver-only
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('efectivo');
  const [tip, setTip] = useState<number>(0.50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [paymentDone, setPaymentDone] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<PaymentDetails | null>(null);

  // Card details state
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8841');
  const [cardHolder, setCardHolder] = useState<string>('Carlos Andrade');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('742');

  // Phone for DeUna! / peigo (Ecuador +593)
  const [phoneNumber, setPhoneNumber] = useState<string>('099 892 0145');

  // Cash change state in USD bills
  const [cashBill, setCashBill] = useState<number>(10);

  // Bank for Transferencia Directa Ecuador
  const [selectedBank, setSelectedBank] = useState<string>('Banco Pichincha');

  // Percentage tips for payment flow (10%, 15%, 20%) based on amount
  const tip10 = Number((amount * 0.10).toFixed(2));
  const tip15 = Number((amount * 0.15).toFixed(2));
  const tip20 = Number((amount * 0.20).toFixed(2));

  const total = Number((amount + tip).toFixed(2));

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setProcessStep(
      selectedMethod === 'efectivo'
        ? 'Confirmando pago al contado (efectivo en dólares)...'
        : 'Verificando datos de transferencia bancaria directa...'
    );

    setTimeout(() => {
      setProcessStep('Verificando fondos y token de seguridad 3D Secure...');
    }, 1200);

    setTimeout(() => {
      setProcessStep('Confirmando transacción y emitiendo comprobante fiscal...');
    }, 2400);

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentDone(true);

      const refId = `EC-USD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const receipt: PaymentDetails = {
        method: selectedMethod,
        amount,
        tip,
        total,
        referenceId: refId,
        phoneNumber: selectedMethod === 'deuna' || selectedMethod === 'peigo' ? phoneNumber : undefined,
        cardNumber: selectedMethod === 'tarjeta' ? cardNumber : undefined,
        cardName: selectedMethod === 'tarjeta' ? cardHolder : undefined,
        cashAmount: selectedMethod === 'efectivo' ? cashBill : undefined,
        changeNeeded: selectedMethod === 'efectivo' ? Math.max(0, Number((cashBill - total).toFixed(2))) : undefined,
      };

      setReceiptData(receipt);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 3500);
  };

  const handleFinish = () => {
    if (receiptData) {
      onPaymentSuccess(receiptData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Pasarela de Pagos Ecuador (USD)</h3>
              <p className="text-[11px] text-zinc-400">Tarifas en dólares con cifrado bancario seguro</p>
            </div>
          </div>
          {!isProcessing && !paymentDone && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {!paymentDone && !isProcessing && (
            <>
              {/* Order amount overview */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Servicio</span>
                  <h4 className="text-xs font-bold text-white">{serviceTitle}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Tarifa Acordada</span>
                  <p className="text-base font-black text-emerald-400 font-mono">{formatCurrency(amount)}</p>
                </div>
              </div>

              {/* Percentage-based Tip Selection in USD (10%, 15%, 20%) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Propina voluntaria para el conductor:
                  </span>
                  <span className="font-bold text-amber-400 font-mono">
                    {tip > 0 ? `+${formatCurrency(tip)}` : 'Sin propina'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '0%', amount: 0, sub: 'Sin propina' },
                    { label: '10%', amount: tip10, sub: `+$${tip10.toFixed(2)}` },
                    { label: '15%', amount: tip15, sub: `+$${tip15.toFixed(2)}` },
                    { label: '20%', amount: tip20, sub: `+$${tip20.toFixed(2)}` },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setTip(opt.amount)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                        tip === opt.amount
                          ? 'bg-amber-400 text-zinc-950 border-amber-400 font-black shadow-md'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-black">{opt.label}</span>
                      <span className={`text-[10px] font-mono ${tip === opt.amount ? 'text-zinc-950 font-bold' : 'text-zinc-400'}`}>
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informative Rule Notice */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white block">Regla de Pago AndesMovi:</span>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
                    El cliente paga directamente al conductor <strong>Al Contado (Efectivo USD)</strong> o por <strong>Transferencia Bancaria Directa / DeUna!</strong>. La Billetera Digital es exclusiva para el conductor.
                  </p>
                </div>
              </div>

              {/* Payment Methods - Al Contado vs Transferencia */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-zinc-300">Selecciona tu Forma de Pago</span>
                <div className="grid grid-cols-2 gap-3">
                  {/* Efectivo Cash en Dólares (Al Contado) */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('efectivo')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all text-center ${
                      selectedMethod === 'efectivo'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                      <Banknote className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black block text-white">Al Contado</span>
                      <span className="text-[10px] text-emerald-400 font-medium">Efectivo en Dólares USD</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      Pago en mano
                    </span>
                  </button>

                  {/* Transferencia Directa / DeUna! */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('transferencia')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all text-center ${
                      selectedMethod === 'transferencia' || selectedMethod === 'deuna'
                        ? 'bg-blue-950/40 border-blue-500 text-blue-300 ring-2 ring-blue-500/40 shadow-lg shadow-blue-950/50'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black block text-white">Transferencia</span>
                      <span className="text-[10px] text-blue-300 font-medium">Bancos Ecuador / DeUna!</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                      Directo al conductor
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic Method Form Details */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col gap-3">
                {selectedMethod === 'efectivo' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Pago Al Contado (Billetes en USD)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                        Efectivo Exacto o con Cambio
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      Indica con qué denominación pagarás para que el conductor lleve el vuelto preparado:
                    </span>
                    <div className="flex gap-2">
                      {[5, 10, 20, 50].map((bill) => (
                        <button
                          type="button"
                          key={bill}
                          onClick={() => setCashBill(bill)}
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold font-mono transition-all ${
                            cashBill === bill
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-500 shadow-md shadow-emerald-500/20 scale-105'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {formatCurrency(bill)}
                        </button>
                      ))}
                    </div>
                    {cashBill >= total ? (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                        <span className="text-xs text-zinc-300">Vuelto que recibirás:</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {formatCurrency(cashBill - total)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-400 font-medium">
                        El billete de {formatCurrency(cashBill)} no cubre el total de {formatCurrency(total)}. Por favor selecciona una denominación mayor.
                      </p>
                    )}
                  </div>
                )}

                {(selectedMethod === 'transferencia' || selectedMethod === 'deuna') && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300 font-black">Transferencia Directa / DeUna!</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 font-black px-2 py-0.5 rounded">
                        Directo al Chofer
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 leading-relaxed space-y-2">
                      <p className="font-bold">📱 ¿Cómo funciona el pago?</p>
                      <p>
                        Transferirás el valor de la carrera directamente al conductor al finalizar el viaje. 
                        <strong> No es necesario ingresar ningún dato de cuenta bancaria o comprobante en esta aplicación.</strong>
                      </p>
                      <p className="text-[11px] text-blue-300/80">
                        Los detalles de transferencia (cuenta, banco o código QR de DeUna!) se coordinan directamente con el conductor a bordo.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Summary and Submit Button */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Total a Pagar (USD)</span>
                  <p className="text-xl font-black text-white font-mono">{formatCurrency(total)}</p>
                </div>
                <button
                  id="btn-process-payment"
                  onClick={handleProcessPayment}
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <span>Pagar {formatCurrency(total)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Processing State Animation */}
          {isProcessing && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Procesando Pago Seguro</h4>
                <p className="text-xs text-emerald-400 font-medium mt-1">{processStep}</p>
                <p className="text-[10px] text-zinc-500 mt-2">No cierres esta ventana mientras confirmamos con el banco</p>
              </div>
            </div>
          )}

          {/* Payment Done Receipt Screen */}
          {paymentDone && receiptData && (
            <div className="flex flex-col gap-4 animate-in zoom-in-95">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">¡Pago Realizado con Éxito!</h4>
                  <p className="text-xs text-emerald-400 font-mono mt-0.5">Ref: {receiptData.referenceId}</p>
                </div>
              </div>

              {/* Receipt Details Box */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Concepto</span>
                  <span className="font-bold text-white">{serviceTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Método de pago</span>
                  <span className="font-bold text-emerald-400">
                    {receiptData.method === 'efectivo'
                      ? 'Al Contado (Efectivo USD)'
                      : receiptData.method === 'transferencia' || receiptData.method === 'deuna'
                      ? 'Transferencia Directa / DeUna!'
                      : receiptData.method}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="font-mono text-zinc-300">{formatCurrency(receiptData.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Propina</span>
                  <span className="font-mono text-zinc-300">{formatCurrency(receiptData.tip)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-sm font-black">
                  <span className="text-white">Total Pagado (USD)</span>
                  <span className="text-emerald-400 font-mono">{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              {/* Action */}
              <button
                id="btn-finish-payment"
                onClick={handleFinish}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <span>Finalizar y Volver al Inicio</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

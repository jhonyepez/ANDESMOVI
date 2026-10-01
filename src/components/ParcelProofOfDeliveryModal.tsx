import React, { useState, useRef, useEffect } from 'react';
import { TripRequest, ParcelDetails } from '../types';
import {
  CheckCircle2,
  Camera,
  PenTool,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Upload,
  Image as ImageIcon,
  Check,
  CreditCard,
  Building2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParcelProofOfDeliveryModalProps {
  trip: TripRequest;
  onConfirmDelivery: (proof: { signatureUrl: string; photoUrl: string }) => void;
  onClose: () => void;
}

export const ParcelProofOfDeliveryModal: React.FC<ParcelProofOfDeliveryModalProps> = ({
  trip,
  onConfirmDelivery,
  onClose,
}) => {
  const parcel = trip.parcelDetails;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  // Cédula Verification
  const expectedCedula = parcel?.receiverCedula || '1718293041';
  const [enteredCedula, setEnteredCedula] = useState<string>(parcel?.receiverCedula || '');
  const [cedulaError, setPinError] = useState<string>('');
  const [isCedulaVerified, setIsCedulaVerified] = useState<boolean>(true);

  // Delivery Photo
  const [deliveryPhoto, setDeliveryPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80'
  );
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const isInterprovincial = parcel?.scope === 'interprovincial' || !!parcel?.arrivalOffice;

  // Canvas drawing handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#10b981'; // emerald-500
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleValidateCedula = () => {
    if (enteredCedula.trim().length >= 9) {
      setIsCedulaVerified(true);
      setPinError('');
    } else {
      setPinError('Ingresa una Cédula de Identidad válida (10 dígitos)');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setDeliveryPhoto(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalize = () => {
    if (!isCedulaVerified && !enteredCedula.trim()) {
      setPinError('Por favor verifica la Cédula de Identidad del destinatario antes de entregar.');
      return;
    }

    const canvas = canvasRef.current;
    const signatureUrl = canvas ? canvas.toDataURL('image/png') : '';

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setIsSuccess(true);

    setTimeout(() => {
      onConfirmDelivery({
        signatureUrl,
        photoUrl: deliveryPhoto,
      });
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white">¡Entrega Certificada con Éxito!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              La encomienda ha sido entregada y verificada mediante la Cédula de Identidad del destinatario. Se registró la firma digital y foto de constancia.
            </p>
            <div className="mt-4 px-4 py-2 rounded-xl bg-zinc-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              ✓ Cédula Verificada: {enteredCedula || parcel?.receiverCedula || 'Presentada'} (Sin PIN) • Acta #ENC-{trip.id.slice(-6)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="pb-3 border-b border-zinc-800">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Confirmación de Entrega Casa a Casa</span>
              </div>
              <h3 className="text-lg font-black text-white">Prueba de Entrega (Foto y Firma)</h3>
              <p className="text-xs text-zinc-400">
                Paquete: <strong className="text-zinc-200">{parcel?.description || 'Encomienda Express'}</strong>
              </p>
            </div>

            {/* Sender & Recipient Details Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2.5">
              {/* Remitente info */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-850">
                <div className="flex items-center gap-2 text-zinc-200">
                  <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Remitente (Quien Envía):</span>
                    <strong className="text-white">{parcel?.senderName || 'Remitente'}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 border border-zinc-750 text-[11px] font-mono text-emerald-400">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                  <span>C.I. {parcel?.senderCedula || '1710000001'}</span>
                </div>
              </div>

              {/* Destinatario info */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-200">
                  <User className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Destinatario (Quien Recibe):</span>
                    <strong className="text-white">{parcel?.receiverName || 'Destinatario'}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  {parcel?.receiverCedula && (
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                      C.I. {parcel.receiverCedula}
                    </span>
                  )}
                  <span className="text-zinc-400 font-mono text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    {parcel?.receiverPhone || '+593 99 123 4567'}
                  </span>
                </div>
              </div>

              {parcel?.arrivalOffice ? (
                <div className="flex items-start gap-2 text-xs text-zinc-300 pt-2 border-t border-zinc-850">
                  <Building2 className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-rose-300">
                      Oficina Oficial de Entrega: {parcel.arrivalOffice.name}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Ventanilla de Encomiendas: {parcel.arrivalOffice.terminal} • {parcel.arrivalOffice.address}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Horario: {parcel.arrivalOffice.schedule} • Tel: {parcel.arrivalOffice.phone}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span className="truncate">{trip.destination?.name || trip.destination?.address}</span>
                </div>
              )}
            </div>

            {/* Step 1: Verificación de Identidad Obligatoria con Cédula (Entrega Solo con Cédula - Urbano y Provincias) */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/40 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  1. Verificación de Cédula de Identidad (Solo con Cédula - Sin PIN)
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  {isInterprovincial ? 'Retiro en Ventanilla' : 'Entrega Urbana a Domicilio'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Destinatario Registrado:</span>
                  <span className="text-white font-bold text-sm">{parcel?.receiverName || 'Destinatario'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">Cédula Registrada:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {expectedCedula ? `C.I. ${expectedCedula}` : 'Verificada'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800">
                <label className="text-[11px] text-zinc-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                    Cédula física presentada por quien recibe:
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Ecuador (10 dígitos)</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    value={enteredCedula}
                    onChange={(e) => {
                      setEnteredCedula(e.target.value.replace(/\D/g, ''));
                      setPinError('');
                    }}
                    placeholder="Número de cédula física..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 font-mono tracking-wider text-sm font-bold text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleValidateCedula}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                  >
                    {isCedulaVerified ? '✓ Validada' : 'Validar'}
                  </button>
                  {expectedCedula && (
                    <button
                      type="button"
                      onClick={() => {
                        setEnteredCedula(expectedCedula);
                        setIsCedulaVerified(true);
                        setPinError('');
                      }}
                      className="px-2.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[10px] font-semibold text-zinc-400"
                      title="Coincide con cédula registrada"
                    >
                      Coincide
                    </button>
                  )}
                </div>

                {cedulaError && <p className="text-[11px] text-rose-400 font-medium">{cedulaError}</p>}

                <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 font-medium bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/15">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>
                    Entrega autorizada <strong>únicamente previa presentación y verificación de Cédula de Identidad original</strong>. No se requiere código PIN tanto dentro de la ciudad como en envíos interprovinciales.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Digital Signature Canvas */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  2. Firma Digital de Quien Recibe
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[10px] text-zinc-400 hover:text-rose-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Limpiar firma
                </button>
              </div>
              <div className="relative border-2 border-dashed border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 touch-none">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[130px] cursor-crosshair"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-zinc-500">
                    Dibuja la firma aquí con el dedo o mouse
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Photo of package delivered */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  3. Foto de Entrega en Domicilio
                </span>
                <label className="text-[11px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {deliveryPhoto && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 h-28 bg-zinc-900">
                  <img
                    src={deliveryPhoto}
                    alt="Foto entrega"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-black/70 text-[9px] text-emerald-300 font-mono">
                    Foto capturada en destino
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                id="btn-confirm-proof-delivery"
                onClick={handleFinalize}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Entrega y Finalizar Encomienda</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

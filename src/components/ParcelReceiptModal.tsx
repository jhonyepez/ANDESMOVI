import React, { useRef } from 'react';
import { TripRequest, ParcelDetails } from '../types';
import { formatCurrency } from '../utils/geoUtils';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Box,
  QrCode,
  FileText,
  Truck,
  Share2,
  Clock,
} from 'lucide-react';

interface ParcelReceiptModalProps {
  trip?: TripRequest;
  parcelDetails?: ParcelDetails;
  price?: number;
  guideNumber?: string;
  onClose: () => void;
  isDark?: boolean;
}

export const ParcelReceiptModal: React.FC<ParcelReceiptModalProps> = ({
  trip,
  parcelDetails: propParcel,
  price: propPrice,
  guideNumber: propGuide,
  onClose,
  isDark = true,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const parcel = propParcel || trip?.parcelDetails;
  const price = propPrice ?? trip?.offeredPrice ?? 7.5;
  const guideNumber =
    propGuide ||
    (trip?.id
      ? trip.id.replace('pkg-', 'GUIA-').toUpperCase()
      : `EC-${Math.floor(100000 + Math.random() * 900000)}`);
  const issueDate = new Date(trip?.createdAt || Date.now()).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const carrierName = parcel?.carrier || parcel?.arrivalOffice?.carrier || 'San Cristóbal';
  
  // Condicionar según tipo de servicio: 'urbana' vs 'interprovincial'
  const tipoServicio: 'urbana' | 'interprovincial' =
    parcel?.scope === 'interprovincial' || (parcel?.scope !== 'urbano' && !!parcel?.arrivalOffice)
      ? 'interprovincial'
      : 'urbana';
  const isInterprovincial = tipoServicio === 'interprovincial';

  const [ticketFormat, setTicketFormat] = React.useState<'standard' | 'thermal'>('standard');

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppRemitente = () => {
    const phoneRaw = parcel?.senderPhone || '';
    const cleanPhone = phoneRaw.replace(/[^\d]/g, '');
    const formattedPhone = cleanPhone.startsWith('593')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `593${cleanPhone.slice(1)}`
      : cleanPhone ? `593${cleanPhone}` : '593978734844';

    const text = encodeURIComponent(
      `🏔️ *ANDESMOVI - GUÍA DE REMISIÓN OFICIAL*\n` +
      `📦 *Tipo de Servicio:* ${tipoServicio === 'urbana' ? 'ENCOMIENDA LOCAL URBANA' : 'ENCOMIENDA INTERPROVINCIAL'}\n` +
      `📄 *Guía N°:* ${guideNumber}\n` +
      `📅 *Fecha y Hora:* ${issueDate}\n\n` +
      `👤 *REMITENTE (Envía):*\n` +
      `• Nombre: ${parcel?.senderName || 'N/A'}\n` +
      `• Cédula: ${parcel?.senderCedula || 'N/A'}\n` +
      `• Teléfono: ${parcel?.senderPhone || 'N/A'}\n\n` +
      `🎯 *DESTINATARIO (Recibe):*\n` +
      `• Nombre: ${parcel?.receiverName || 'N/A'}\n` +
      `• Cédula: ${parcel?.receiverCedula || 'N/A'}\n` +
      `• Teléfono: ${parcel?.receiverPhone || 'N/A'}\n` +
      `• ${tipoServicio === 'urbana' ? 'Dirección de Entrega Local' : 'Destino / Terminal'}: ${parcel?.deliveryCityOrStop || parcel?.arrivalOffice?.name || parcel?.destinationProvince || 'Entrega a Domicilio'}\n\n` +
      `📦 *DETALLE DE LA CARGA:*\n` +
      `• Descripción: ${parcel?.description || 'Encomienda'}\n` +
      `• Número de Bultos: ${parcel?.packageCount || 1} bulto(s)\n` +
      `• Peso aproximado: ${parcel?.weightKg || 2} kg\n` +
      `• ¿Frágil?: ${parcel?.isFragile ? 'SÍ (Manejo cuidadoso)' : 'NO'}\n` +
      `• Declaración: ${parcel?.driverCommercialInspection === 'sin_factura_ndv' || !parcel?.hasInvoiceAttached ? 'S/F - NDV' : 'Factura Verificada'}\n\n` +
      `💳 *ESTADO DEL FLETE:* PAGADO EN ORIGEN\n` +
      `💵 *VALOR A COBRAR EN DESTINO:* $0.00 (ENTREGA SIN COSTO ADICIONAL)\n` +
      `💰 *VALOR TOTAL DEL FLETE:* $${price.toFixed(2)} USD\n\n` +
      `⚠️ *Cláusula:* Entrega al destinatario únicamente con presentación de Cédula de Identidad original.`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  const handleShare = async () => {
    const text = `Comprobante ${tipoServicio === 'urbana' ? 'Encomienda Urbana AndesMovi' : `Encomienda ${carrierName}`}\nGuía N°: ${guideNumber}\nRemitente: ${parcel?.senderName || 'N/A'}\nDestinatario: ${parcel?.receiverName || 'N/A'}\nDestino: ${parcel?.deliveryCityOrStop || parcel?.arrivalOffice?.name || parcel?.destinationProvince || 'Entrega'}\nTotal Flete: $${price.toFixed(2)} USD (PAGADO EN ORIGEN)`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Comprobante Encomienda ${guideNumber}`,
          text,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      navigator.clipboard?.writeText(text);
      alert('Información del comprobante copiada al portapapeles');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto print:hidden ${
      isDark ? 'bg-black/80' : 'bg-slate-900/60'
    }`}>
      <div className={`border rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto ${
        isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
      }`}>
        {/* Modal Toolbar (No impreso en print) */}
        <div className={`p-3.5 border-b flex items-center justify-between print:hidden ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Comprobante Oficial de Encomienda
              </h3>
              <p className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Guía: <strong className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{guideNumber}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-zinc-800 p-0.5 rounded-xl border border-zinc-700 text-[10px] font-bold mr-1">
              <button
                type="button"
                onClick={() => setTicketFormat('standard')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  ticketFormat === 'standard' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                A4 / PDF
              </button>
              <button
                type="button"
                onClick={() => setTicketFormat('thermal')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  ticketFormat === 'thermal' ? 'bg-amber-500 text-zinc-950 font-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ticket 58/80mm
              </button>
            </div>

            <button
              type="button"
              id="btn-whatsapp-receipt-remitente"
              onClick={handleWhatsAppRemitente}
              className="px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Enviar comprobante por WhatsApp al remitente"
            >
              <span>📲 WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200'
              }`}
              title="Compartir Comprobante"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
                isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ml-1 ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RECEIPT CONTENT CONTAINER (Apto para impresión térmica o A4) */}
        <div className={`p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white flex justify-center ${
          isDark ? 'bg-zinc-950/40' : 'bg-slate-100'
        }`}>
          <div
            ref={receiptRef}
            id="printable-parcel-receipt"
            className={`${
              ticketFormat === 'thermal'
                ? 'w-full max-w-[350px] text-[11px] font-mono border-dashed'
                : 'w-full max-w-xl text-xs'
            } bg-white text-zinc-900 p-5 sm:p-7 rounded-2xl shadow-xl border border-zinc-300 flex flex-col gap-4 font-sans print:shadow-none print:border-0 print:p-2 print:m-0 print:absolute print:top-0 print:left-0 print:w-full print:h-full`}
          >
            {/* Header del Ticket / Guía según tipoServicio */}
            {tipoServicio === 'urbana' ? (
              <div className="header-logo-container text-center mb-2 pb-3 border-b-2 border-dashed border-zinc-300">
                <div className="flex flex-col items-center justify-center gap-1">
                  <img
                    src="/assets/logo-andesmovi.png"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/andesmovi-3d-logo.svg';
                    }}
                    alt="AndesMovi"
                    style={{ maxHeight: '48px', objectFit: 'contain' }}
                    className="mx-auto"
                  />
                  <div>
                    <span className="text-xl font-black tracking-tight text-emerald-900 block leading-tight">
                      AndesMovi
                    </span>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }} className="font-black text-emerald-800 tracking-wider uppercase">
                      ENCOMIENDA LOCAL URBANA
                    </p>
                    <span className="text-[10px] font-bold text-zinc-500 block">
                      Servicio Urbano AndesMovi • Entrega Local Directa
                    </span>
                  </div>
                </div>

                <div className="text-center mt-2 pt-1 border-t border-zinc-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                    GUÍA DE REMISIÓN URBANA
                  </span>
                  <span className="text-2xl font-black font-mono text-zinc-950 tracking-wider block">
                    {guideNumber}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    {issueDate}
                  </span>
                </div>
              </div>
            ) : (
              <div className="header-logo-container border-b-2 border-dashed border-zinc-300 pb-3 mb-2">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src="/assets/logo-andesmovi.png"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/andesmovi-3d-logo.svg';
                      }}
                      alt="AndesMovi"
                      style={{ maxHeight: '40px', objectFit: 'contain' }}
                    />
                    <div>
                      <span className="text-base font-black text-emerald-900 leading-tight block">
                        AndesMovi
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 block">
                        Plataforma Central
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="text-sm font-black text-amber-900 leading-tight block">
                        {carrierName.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 block">
                        Cooperativa / Agencia Aliada
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-sm shadow-sm border border-amber-300">
                      <span>🏢</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-1 border-t border-zinc-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                    GUÍA DE REMISIÓN INTERPROVINCIAL
                  </span>
                  <span className="text-2xl font-black font-mono text-zinc-950 tracking-wider block">
                    {guideNumber}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    {issueDate}
                  </span>
                </div>
              </div>
            )}

            {/* Aviso de Modalidad de Entrega (Cédula de Identidad) */}
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block font-black text-amber-900">
                  ENTREGA EXCLUSIVA CON CÉDULA ORIGINAL
                </strong>
                <p className="text-[11px] text-amber-800 leading-snug">
                  {tipoServicio === 'urbana'
                    ? 'Servicio Urbano AndesMovi: La entrega se realiza de forma directa al destinatario previa verificación de su Cédula de Identidad original. Flete 100% pagado en origen ($0.00 en destino).'
                    : 'El destinatario debe presentar su Cédula de Identidad original en ventanilla de la agencia/cooperativa aliada. Flete pagado en origen.'}
                </p>
              </div>
            </div>

            {/* Datos Remitente y Destinatario */}
            <div className="grid grid-cols-1 gap-3">
              {/* Remitente */}
              <div className="p-3 rounded-xl border-2 border-zinc-900 bg-zinc-50 flex flex-col gap-0.5">
                <span className="uppercase text-[11px] font-black tracking-wider text-zinc-500">REMITENTE (ENVÍA)</span>
                <span className="font-black text-zinc-950 text-lg">{parcel?.senderName || 'N/A'}</span>
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-700">
                  <span>C.I.: {parcel?.senderCedula || 'N/A'}</span>
                  <span>Tel: {parcel?.senderPhone || 'N/A'}</span>
                </div>
              </div>

              {/* Destinatario */}
              <div className="p-3 rounded-xl border-2 border-zinc-900 bg-zinc-50 flex flex-col gap-0.5">
                <span className="uppercase text-[11px] font-black tracking-wider text-zinc-500">DESTINATARIO (RECIBE)</span>
                <span className="font-black text-zinc-950 text-lg">{parcel?.receiverName || 'N/A'}</span>
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-700">
                  <span className="text-emerald-800 font-black">Cédula: {parcel?.receiverCedula || 'N/A'}</span>
                  <span>Tel: {parcel?.receiverPhone || 'N/A'}</span>
                </div>
              </div>
              
              {/* Destino / Dirección de Entrega */}
              <div className="p-3 rounded-xl border-2 border-zinc-900 bg-zinc-50 flex flex-col gap-0.5">
                <span className={`uppercase text-[11px] font-black tracking-wider ${
                  tipoServicio === 'urbana' ? 'text-emerald-800' : 'text-zinc-500'
                }`}>
                  {tipoServicio === 'urbana' ? 'DIRECCIÓN DE ENTREGA LOCAL (URBANO)' : 'DESTINO / PARADA DE ENTREGA'}
                </span>
                <span className="font-black text-zinc-950 text-base">
                  {parcel?.deliveryCityOrStop || parcel?.arrivalOffice?.name || parcel?.destinationProvince || trip?.destination.address || trip?.destination.name || 'Entrega a Domicilio'}
                </span>
                {tipoServicio === 'urbana' ? (
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ✓ Servicio Local Puerta a Puerta en Ciudad • Despacho directo sin escalas
                  </span>
                ) : (
                  parcel?.arrivalOffice && (
                    <span className="text-[10px] text-zinc-600">
                      Agencia Aliada: {parcel.arrivalOffice.terminal} • {parcel.arrivalOffice.address}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Descripción del Paquete y Flete */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200 text-[10px] uppercase">
                    <th className="p-2">Descripción de la Carga</th>
                    <th className="p-2 text-center">Bultos</th>
                    <th className="p-2 text-center">Peso</th>
                    <th className="p-2 text-right">Flete Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-[11px]">
                  <tr>
                    <td className="p-2 font-medium text-zinc-900">
                      {parcel?.description || 'Paquete con documentos y mercadería general'}
                      {parcel?.isFragile && (
                        <span className="ml-1.5 text-[9px] font-black uppercase text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                          Frágil
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center font-bold text-zinc-800">
                      {parcel?.packageCount ? `${parcel.packageCount} bulto(s)` : '1 bulto'}
                    </td>
                    <td className="p-2 text-center font-mono text-zinc-700">
                      {parcel?.weightKg ? `${parcel.weightKg} kg` : '3 kg'}
                    </td>
                    <td className="p-2 text-right font-black font-mono text-zinc-950 text-sm">
                      {formatCurrency(price)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Declaración Comercial: Factura vs Regla S/F y NDV */}
            <div className={`p-3 rounded-xl border text-xs ${
              parcel?.driverCommercialInspection === 'sin_factura_ndv' || !parcel?.hasInvoiceAttached || !parcel?.declaredValueUsd
                ? 'bg-zinc-50 border-zinc-400 text-zinc-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}>
              <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5 mb-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-600">
                  DECLARACIÓN COMERCIAL & FACTURA:
                </span>
                {parcel?.driverCommercialInspection === 'sin_factura_ndv' || !parcel?.hasInvoiceAttached || !parcel?.declaredValueUsd ? (
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-zinc-900 text-white">
                    RÉGIMEN S/F - NDV
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-emerald-700 text-white">
                    FACTURA VERIFICADA
                  </span>
                )}
              </div>

              {parcel?.driverCommercialInspection === 'sin_factura_ndv' || !parcel?.hasInvoiceAttached || !parcel?.declaredValueUsd ? (
                <div className="space-y-1">
                  <p className="font-black text-xs text-zinc-950 uppercase tracking-tight">
                    ESTADO: S/F - NDV (SIN FACTURA / NO DECLARA VALOR)
                  </p>
                  <p className="text-[11px] text-zinc-700">
                    <strong>Valor Declarado:</strong> $0.00 USD • Encomienda sin comprobante de compra/venta físico entregado.
                  </p>
                  <p className="text-[10px] text-zinc-500 italic">
                    Transporte bajo responsabilidad del remitente por falta de comprobante de venta.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-black text-xs text-emerald-950">
                    Valor Declarado: ${parcel.declaredValueUsd.toFixed(2)} USD | Factura N°: {parcel.invoiceNumber || 'Física adjunta verificada'}
                  </p>
                  <p className="text-[10px] text-emerald-800">
                    Factura física de compra/venta entregada al transportista para respaldo de aduana y tránsito.
                  </p>
                </div>
              )}
            </div>

            {/* Total y Resumen de Pago */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-100 border border-zinc-300 gap-2">
              <div className="text-xs space-y-0.5">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">
                  ESTADO DEL FLETE
                </span>
                <span className="font-black text-emerald-800 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PAGADO EN ORIGEN
                </span>
                <span className="text-[10px] font-bold text-zinc-600 block">
                  VALOR A COBRAR EN DESTINO: <strong className="text-emerald-700">$0.00 USD (ENTREGA SIN COSTO ADICIONAL)</strong>
                </span>
                <p className="text-[9px] text-zinc-500 italic">
                  Entregar al destinatario únicamente con presentación de cédula y número de guía sin solicitar ningún pago.
                </p>
              </div>
              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                  VALOR TOTAL DEL FLETE (USD)
                </span>
                <span className="text-2xl font-black font-mono text-zinc-950 block">
                  {formatCurrency(price)}
                </span>
                <span className="text-[9px] font-bold text-emerald-700 block">
                  ✓ Flete Cancelado
                </span>
              </div>
            </div>

            {/* Cláusula Legal Oficial de Transporte & Descargo S/F - NDV */}
            <div className="p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-[10px] leading-relaxed text-zinc-700 space-y-1">
              <strong className="block text-zinc-900 font-bold uppercase tracking-wider text-[10px]">
                Cláusula Oficial de Transporte:
              </strong>
              <p>
                La empresa y el transportista no se responsabilizan por decomisos aduaneros, retenciones de tránsito ni valores comerciales en envíos catalogados como <strong>S/F - NDV</strong>.
              </p>
            </div>

            {/* Código QR Simulado de Rastreo y Firmas */}
            <div className="border-t-2 border-dashed border-zinc-300 pt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-zinc-900 text-white rounded-lg p-1 flex flex-col items-center justify-center font-mono text-[8px] text-center">
                  <QrCode className="w-7 h-7 text-white" />
                  <span>{guideNumber.slice(-6)}</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  <strong className="block text-zinc-800 text-[11px]">Control de Entrega</strong>
                  <span>Escanee para verificar entrega en destino</span>
                  <p className="font-mono text-[9px] text-zinc-400">AndesMovi • Custodia Segura</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-center text-[10px] text-zinc-500">
                <div className="space-y-1">
                  <div className="border-b border-zinc-400 w-24 pt-4"></div>
                  <span className="block font-medium">Firma Conductor</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-zinc-400 w-28 pt-4"></div>
                  <span className="block font-medium">Firma Recibido Destinatario</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <button
            type="button"
            id="btn-footer-whatsapp-remitente"
            onClick={handleWhatsAppRemitente}
            className="w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span>📲 Enviar comprobante por WhatsApp al remitente</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
                isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Comprobante</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

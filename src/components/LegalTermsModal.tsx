import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Mic,
  Trash2,
  ExternalLink,
  Search,
  Scale,
  Car,
  UserCheck,
  CreditCard,
  Building,
  HelpCircle,
  Download,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

export type LegalDocType = 'terminos' | 'privacidad';

interface LegalTermsModalProps {
  isOpen: boolean;
  initialDoc?: LegalDocType;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
  isDark?: boolean;
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({
  isOpen,
  initialDoc = 'terminos',
  onClose,
  onAccept,
  showAcceptButton = false,
  isDark = true,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const handleAccept = () => {
    haptic.success();
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-fadeIn ${
      isDark ? 'bg-black/85' : 'bg-slate-900/60'
    }`}>
      <div className={`w-full max-w-3xl border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex flex-col gap-3 ${
          isDark ? 'bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl border ${
                isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}>
                    Documento Legal Oficial
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Ecuador 2026</span>
                </div>
                <h2 className={`text-base sm:text-lg font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Centro Legal y Políticas AndesMovi
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-850' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
              title="Cerrar ventana legal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className={`flex items-center p-1 rounded-2xl border text-xs font-bold w-full sm:w-auto ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  setActiveDoc('terminos');
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeDoc === 'terminos'
                    ? isDark ? 'bg-emerald-500 text-zinc-950 font-black shadow-md' : 'bg-emerald-600 text-white font-black shadow-sm'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Términos y Condiciones</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  setActiveDoc('privacidad');
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeDoc === 'privacidad'
                    ? isDark ? 'bg-emerald-500 text-zinc-950 font-black shadow-md' : 'bg-emerald-600 text-white font-black shadow-sm'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Políticas de Privacidad (LOPDP)</span>
              </button>
            </div>

            {/* Search filter in legal text */}
            <div className="relative flex-1 sm:max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en el documento (ej. GPS, SOS)..."
                className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className={`p-4 sm:p-6 overflow-y-auto space-y-6 text-xs leading-relaxed font-sans select-text ${
          isDark ? 'text-zinc-300' : 'text-slate-600'
        }`}>
          {/* ========================================================= */}
          {/* TÉRMINOS Y CONDICIONES DE USO                             */}
          {/* ========================================================= */}
          {activeDoc === 'terminos' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Document Subheader Badge */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <ShieldCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div className="text-xs">
                  <span className={`font-black block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    CONTRATO DE ADHESIÓN Y TÉRMINOS DE USO DE LA PLATAFORMA TECNOLÓGICA ANDESMOVI
                  </span>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Última actualización: Septiembre 2026. Válido y vinculante en las 24 provincias de la República del Ecuador.
                  </p>
                </div>
              </div>

              {/* 1. Identificación del Servicio */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <Building className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>1. Identificación del Servicio y Naturaleza Jurídica</span>
                </h3>
                <p>
                  <strong>AndesMovi</strong> (operada bajo la denominación comercial <em>Andes Move Ecuador</em>) es una plataforma tecnológica de software e intermediación digital cuyo propósito principal es vincular digitalmente a usuarios solicitantes de movilidad con prestadores independientes de servicios de transporte, taxis convencionales y ejecutivos cooperados, servicios de encomienda intercantonal e interprovincial, envíos a domicilio (delivery) y traslados ejecutivos.
                </p>
                <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                  AndesMovi <strong>no es una empresa de transporte público ni propietario de flota vehicular</strong>; actúa estrictamente como intermediario tecnológico que proporciona la infraestructura digital, algoritmos de cálculo tarifario orientativo, canal de comunicación cifrado y herramientas de seguridad en tiempo real.
                </p>
              </section>

              {/* 2. Obligaciones del Usuario / Cliente */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <UserCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>2. Obligaciones y Deberes del Usuario / Pasajero</span>
                </h3>
                <ul className={`list-disc list-inside space-y-1.5 pl-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <li>
                    <strong>Uso Responsable y Respeto:</strong> Mantener un trato cordial, respetuoso y libre de discriminación hacia los conductores y personal de soporte.
                  </li>
                  <li>
                    <strong>Prohibición Estricta de Cargas Ilícitas:</strong> Queda terminantemente prohibido solicitar el transporte o envío de sustancias sujetas a fiscalización (estupefacientes), armas de fuego, municiones, materiales explosivos o inflamables, contrabando o cualquier objeto penado por las leyes ecuatorianas (COIP).
                  </li>
                  <li>
                    <strong>Cumplimiento y Puntualidad de Pagos:</strong> Cancelar el valor acordado de la carrera en efectivo, transferencia directa o billetera electrónica al finalizar el trayecto.
                  </li>
                  <li>
                    <strong>Cuidado de la Unidad:</strong> Responder por cualquier daño deliberado ocasionado al vehículo durante el viaje.
                  </li>
                </ul>
              </section>

              {/* 3. Obligaciones del Conductor Asociado */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <Car className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>3. Obligaciones y Requisitos del Conductor Profesional</span>
                </h3>
                <ul className={`list-disc list-inside space-y-1.5 pl-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <li>
                    <strong>Documentación Vigente ante la ANT:</strong> Contar en todo momento con Licencia de Conducir legal (Tipo B, C o superior), Matrícula vehicular anual al día y Seguro Obligatorio de Accidentes de Tránsito (SOAT / SPPAT).
                  </li>
                  <li>
                    <strong>Estado Óptimo de la Unidad:</strong> Mantener el vehículo (auto, camioneta o motocicleta) en condiciones mecánicas y de aseo impecables, con cinturones de seguridad operativos y llantas con labrado reglamentario.
                  </li>
                  <li>
                    <strong>Cobro de Tarifas Oficiales:</strong> Respetar el valor pactado o generado por el taxímetro digital de AndesMovi, sin recargos arbitrarios injustificados.
                  </li>
                  <li>
                    <strong>Comisión de Uso Tecnológico (7%):</strong> El conductor reconoce y acepta que AndesMovi retiene una comisión tecnológica fija del 7% sobre el valor bruto generado por cada carrera finalizada con éxito, manteniendo el 93% neto para el conductor.
                  </li>
                </ul>
              </section>

              {/* 4. Métodos de Pago, Recargas y Cancelaciones */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <CreditCard className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>4. Métodos de Pago, Transferencias y Cancelaciones</span>
                </h3>
                <p>
                  <strong>Moneda de Operación:</strong> Todas las transacciones se cotizan y liquidan exclusivamente en Dólares de los Estados Unidos de América (USD).
                </p>
                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Política de Cancelaciones:</span>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    El cliente podrá cancelar un viaje sin costo dentro de los primeros 2 minutos de haber sido aceptado. En caso de cancelaciones reiteradas cuando el conductor ya ha recorrido más del 50% de la ruta hacia el punto de recogida, la cuenta podrá acumular advertencias o recargos de compensación por combustible.
                  </p>
                </div>
              </section>

              {/* 5. Limitación de Responsabilidad */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <span>5. Limitación de Responsabilidad y Cláusula de Arbitraje</span>
                </h3>
                <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                  AndesMovi no asume responsabilidad directa por siniestros de tránsito, retrasos por manifestaciones viales, condiciones meteorológicas adversas o disputas civiles entre particulares, facilitando en tales casos los datos de telemetría y geolocalización a las autoridades competentes (Fiscalía General del Estado y Policía Nacional del Ecuador).
                </p>
              </section>
            </div>
          )}

          {/* ========================================================= */}
          {/* POLÍTICAS DE PRIVACIDAD Y PROTECCIÓN DE DATOS (LOPDP)     */}
          {/* ========================================================= */}
          {activeDoc === 'privacidad' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Privacy Header Badge */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50 border-emerald-100'
              }`}>
                <Lock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div className="text-xs">
                  <span className={`font-black block ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                    POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES (LEY ORGÁNICA LOPDP ECUADOR)
                  </span>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    En estricto apego al Reglamento de la Ley Orgánica de Protección de Datos Personales de la República del Ecuador y a las directrices de privacidad de Google Play Store y Apple App Store.
                  </p>
                </div>
              </div>

              {/* 1. Recopilación de Información */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <UserCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>1. Información que Recopilamos</span>
                </h3>
                <p>
                  Para prestar los servicios de intermediación de forma segura, AndesMovi recopila:
                </p>
                <ul className={`list-disc list-inside space-y-1 pl-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <li><strong>Datos de Identidad:</strong> Nombres completos, correo electrónico y número de teléfono celular.</li>
                  <li>
                    <strong>Cédula de Identidad Ecuatoriana (10 Dígitos):</strong> Validada algorítmicamente mediante el algoritmo oficial de Módulo 10 del Registro Civil para prevenir perfiles falsos y garantizar la seguridad del pasaje.
                  </li>
                  <li><strong>Datos de Vehículo (para Conductores):</strong> Placa, modelo, tipo de unidad, SOAT y fotografías de matrícula.</li>
                  <li><strong>Información de Pago:</strong> Comprobantes de transferencias bancarias para recargas de saldo de billetera.</li>
                </ul>
              </section>

              {/* 2. Uso de Geolocalización / GPS (Primer y Segundo Plano) */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <MapPin className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>2. Uso de Geolocalización y Rastreo GPS (Foreground / Background)</span>
                </h3>
                <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <p>
                    AndesMovi requiere acceso a la <strong>ubicación precisa del dispositivo (GPS)</strong> para:
                  </p>
                  <ul className={`list-disc list-inside space-y-1 text-[11px] pl-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    <li>Calcular la distancia en kilómetros y el tiempo estimado de llegada (ETA) de la ruta.</li>
                    <li>Asignar el conductor más cercano y permitir al cliente ver en tiempo real el desplazamiento de la unidad.</li>
                    <li>
                      <strong>Acceso en Segundo Plano (Background Location):</strong> Únicamente para conductores activos durante el trayecto de un viaje, garantizando la navegación continua y la seguridad del pasajero incluso cuando la app esté minimizada.
                    </li>
                  </ul>
                  <p className={`text-[10px] italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Al finalizar o cancelar el servicio, el rastreo en vivo de la ubicación cesa de inmediato.
                  </p>
                </div>
              </section>

              {/* 3. Acceso al Micrófono y Grabación Silenciosa SOS (Pasajero y Conductor) */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <Mic className="w-4 h-4 text-red-400" />
                  <span>3. Botón de Auxilio SOS y Grabación de Evidencia</span>
                </h3>
                <div className={`p-3.5 rounded-2xl border space-y-2.5 text-xs ${
                  isDark ? 'bg-red-950/30 border-red-500/40 text-red-200' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase">
                      Igualdad de Protección
                    </span>
                    <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-red-900'}`}>Consentimiento Mutuo</span>
                  </div>
                  <p>
                    Tanto el <strong>Conductor Asociado</strong> como el <strong>Usuario / Pasajero</strong> disponen de un <strong>Botón de Pánico SOS</strong> operativo las 24 horas durante el servicio. Ambos aceptan y consienten expresamente que al accionarlo:
                  </p>
                  <ul className={`list-disc list-inside space-y-1.5 text-[11px] pl-1 ${isDark ? 'text-red-100' : 'text-red-600'}`}>
                    <li>
                      <strong>Transmisión Inmediata de Coordenadas:</strong> Se envía la ubicación satelital GPS en tiempo real a la Central de Monitoreo AndesMovi y al <strong>ECU 911</strong>.
                    </li>
                    <li>
                      <strong>Grabación de Audio como Evidencia Legal:</strong> La app activa temporalmente el micrófono por un lapso de hasta 45 segundos para generar una pista de audio cifrada.
                    </li>
                    <li>
                      <strong>Alerta por WhatsApp a Contactos de Emergencia:</strong> Se genera el enlace directo con el mensaje de socorro.
                    </li>
                  </ul>
                  <p className={`text-[10px] italic ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    El micrófono jamás se activa en segundo plano sin la pulsación voluntaria del botón SOS.
                  </p>
                </div>
              </section>

              {/* 4. Almacenamiento Seguro y Protección de Datos */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>4. Seguridad, Cifrado y Protección de Datos</span>
                </h3>
                <p>
                  Implementamos protocolos de seguridad estándar de la industria (cifrado SSL/TLS de 256 bits, encriptación de credenciales y aislamiento de bases de datos). AndesMovi <strong>no vende ni alquila datos personales a terceros</strong>.
                </p>
              </section>

              {/* 5. Eliminación de Cuenta y Derechos ARCO */}
              <section className="space-y-2">
                <h3 className={`text-sm font-black flex items-center gap-2 border-b pb-1.5 ${
                  isDark ? 'text-white border-zinc-800' : 'text-slate-800 border-slate-100'
                }`}>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>5. Derechos ARCO y Eliminación de Cuenta</span>
                </h3>
                <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <p>
                    Todo titular de datos tiene derecho a:
                  </p>
                  <ul className={`list-disc list-inside space-y-1 text-[11px] pl-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    <li><strong>Acceso:</strong> Conocer los datos personales que reposan en nuestros servidores.</li>
                    <li><strong>Rectificación:</strong> Actualizar datos inexactos o incompletos desde su perfil.</li>
                    <li><strong>Eliminación Total:</strong> Solicitar la eliminación definitiva de su cuenta desde <em>Configuración &gt; Perfil &gt; Eliminar mi cuenta</em>.</li>
                  </ul>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 flex-wrap ${
          isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>AndesMovi Ecuador • Protección y Cumplimiento Legal</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                isDark ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Cerrar
            </button>

            {showAcceptButton && (
              <button
                type="button"
                id="btn-accept-legal-modal"
                onClick={handleAccept}
                className={`px-5 py-2 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all cursor-pointer ${
                  isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                }`}
              >
                Entendido y Aceptar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

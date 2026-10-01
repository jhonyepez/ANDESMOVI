import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  X,
  Sparkles,
  Send,
  Car,
  Package,
  ShoppingBag,
  ShieldCheck,
  Banknote,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Bot,
  User,
  ArrowRight,
  ChevronRight,
  Phone,
  Building2,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

interface AppExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AppExplanationModal: React.FC<AppExplanationModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'taxi' | 'ejecutivo' | 'encomienda' | 'delivery' | 'pagos' | 'ai_chat'
  >('overview');

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: '¡Hola! Soy la Guía IA Inteligente de AndesMovi 🤖. Puedo explicarte cómo funciona cualquiera de nuestros 4 servicios, los métodos de pago en efectivo/transferencia o el registro de conductores. ¿En qué te puedo ayudar hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'ai_chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  // Handler para consultar a Gemini IA vía servidor
  const handleSendQuestion = async (customPrompt?: string) => {
    const textToAsk = (customPrompt || inputQuestion).trim();
    if (!textToAsk || isAskingAi) return;

    haptic.tap();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToAsk,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputQuestion('');
    setIsAskingAi(true);

    try {
      const response = await fetch('/api/ai/explain-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToAsk }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.answer || 'AndesMovi opera en las 24 provincias de Ecuador con tarifa oficial regulada de $1.25 USD hasta 2.7 km.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        haptic.success();
      } else {
        throw new Error('Error al conectar con la IA de AndesMovi');
      }
    } catch {
      // Fallback inteligente
      const fallbackText = getLocalAiAnswer(textToAsk);
      const aiMsg: ChatMessage = {
        id: `ai-fb-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10010] bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
      <div
        className={`w-full max-w-3xl max-h-[92vh] rounded-3xl border-2 shadow-2xl flex flex-col overflow-hidden ${
          isDark
            ? 'bg-zinc-950 border-amber-500/50 text-zinc-100'
            : 'bg-white border-amber-400 text-slate-900'
        }`}
      >
        {/* HEADER MODAL CON LOGO Y TÍTULO */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-400 truncate">
                ¿Cómo Funciona AndesMovi Ecuador?
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                Guía completa interactiva de los 4 servicios y Asistente IA 24/7
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGACIÓN PESTAÑAS (CATEGORÍAS DE EXPLICACIÓN) */}
        <div className="flex items-center gap-1.5 p-2 overflow-x-auto border-b border-zinc-800/80 bg-zinc-900/60 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab('overview');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <span>⭐ Resumen General</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab('taxi');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'taxi'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>🚖 Taxi Urbana</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab('ejecutivo');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ejecutivo'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <span>🚘 Ejecutivo Quito</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab('encomienda');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'encomienda'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>📦 Encomiendas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab('delivery');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'delivery'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>🍔 Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab('pagos');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pagos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>💳 Pagos y Compras</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.tap();
              setActiveTab('ai_chat');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ai_chat'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md animate-pulse'
                : 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🤖 Preguntar a la IA</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL DINÁMICO */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
          {/* 1. RESUMEN GENERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AndesMovi: La Super App Ecuatoriana 4 en 1</span>
                </h3>
                <p className="text-zinc-300">
                  AndesMovi es una plataforma tecnológica 100% ecuatoriana diseñada para conectar a pasajeros, conductores, locales comerciales y agencias de paquetería en las 24 provincias de Ecuador.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="font-extrabold text-emerald-400 block text-xs">
                    🚖 1. Taxi y Carrera Urbana
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Ofrece tu tarifa o usa la tarifa regulada ANT ($1.25 USD mín. hasta 2.7 km). GPS en vivo y choferes verificados con récord policial.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="font-extrabold text-blue-400 block text-xs">
                    🚘 2. Servicio Ejecutivo Interprovincial
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Rutas fijas Tulcán - Ibarra - Quito ($25 USD) y Aeropuerto Tababela ($30 USD). Reserva tu asiento VIP en cabina con anticipo de $10 USD.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="font-extrabold text-purple-400 block text-xs">
                    📦 3. Encomiendas y Carga
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    Despacho urbano inmediato y guías interprovinciales con agencias aliadas (San Cristóbal, Pullman, Cita) y Oficina Tulcanaza.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="font-extrabold text-orange-400 block text-xs">
                    🍔 4. Delivery de Compras y Comida
                  </span>
                  <p className="text-zinc-300 text-[11px]">
                    El repartidor compra tu producto de su propio bolsillo en el local y tú le pagas el total al recibir en tu puerta.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-sky-400 shrink-0" />
                  <span className="text-xs text-sky-200">
                    ¿Tienes alguna duda específica sobre cómo usar la app?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai_chat')}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-black text-xs shrink-0 cursor-pointer"
                >
                  Consultar a la IA
                </button>
              </div>
            </div>
          )}

          {/* 2. TAXI URBANA */}
          {activeTab === 'taxi' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                <span>¿Cómo pedir Carrera Urbana o Taxi?</span>
              </h3>

              <div className="space-y-2 text-zinc-300">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">1. Selecciona Origen y Destino:</strong>
                  <span>Toca en el buscador o selecciona directamente en el mapa tu punto de recogida y meta.</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">2. Elige tu Vehículo (Auto o Moto Express):</strong>
                  <span>Auto/Taxi para hasta 4 pasajeros ($1.25 USD mín.) o Moto Express para 1 persona. En moto el conductor lleva obligatoriamente un casco limpio extra para ti.</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">3. Ofrece o Acepta tu Tarifa:</strong>
                  <span>Usa los botones -$0.25 / +$0.25 para ajustar el precio según tu presupuesto. La tarifa sugerida se calcula en base a la normativa vigente ANT.</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">4. Sigue a tu Conductor en Mapa GPS:</strong>
                  <span>Visualiza el automóvil en tiempo real, el tiempo estimado de llegada y la placa verificada de la unidad.</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. VIAJES EJECUTIVOS */}
          {activeTab === 'ejecutivo' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="text-sm font-black text-blue-400 flex items-center gap-2">
                <span>🚘 Servicio Ejecutivo Tulcán - Ibarra - Quito</span>
              </h3>

              <div className="space-y-2 text-zinc-300">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">Tarifa Regulada por Asiento:</strong>
                  <span>$25.00 USD por asiento individual hacia Quito / La Carolina o $30.00 USD hacia el Aeropuerto Tababela y Quitumbe. Opcional de alquilar el Auto Completo VIP (4 Asientos).</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">Croquis Interactivo de Asientos:</strong>
                  <span>Selecciona exactamente en la cabina si deseas ir en el Copiloto (Asiento 1) o en la fila trasera (Ventana Izq., Centro o Ventana Der.).</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">Reserva de Asiento con Depósito ($10 USD):</strong>
                  <span>Para garantizar tu cupo en el turno seleccionado, realizas un depósito de anticipo de $10 USD a las cuentas oficiales de AndesMovi (Banco Pichincha, Guayaquil, DeUna!). El saldo restante se cancela al abordar.</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. ENCOMIENDAS */}
          {activeTab === 'encomienda' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="text-sm font-black text-purple-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                <span>¿Cómo funciona el envío de Encomiendas?</span>
              </h3>

              <div className="space-y-2 text-zinc-300">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">Encomiendas Urbanas (Inmediatas):</strong>
                  <span>Un repartidor retira sobres, documentos o paquetes pequeños en tu puerta y los entrega en minutos dentro de la misma ciudad.</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">Encomiendas Interprovinciales (Oficina Tulcanaza & Cooperativas Aliadas):</strong>
                  <span>Despacho seguro nacional hacia las 24 provincias mediante la Oficina Tulcanaza de AndesMovi y cooperativas aliadas (San Cristóbal, Pullman Carchi, Cita Express, etc.).</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">Modalidades de Pago de Flete:</strong>
                  <span>Puedes pagar la encomienda en el Origen al enviar o seleccionar la modalidad "Por Cobrar en Destino" al momento de la entrega.</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. DELIVERY */}
          {activeTab === 'delivery' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="text-sm font-black text-orange-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                <span>¿Cómo pedir Delivery y Compras?</span>
              </h3>

              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 font-medium">
                ⭐ <strong>Modelo de Compra en el Local:</strong>
                <p className="text-xs text-zinc-300 mt-1">
                  En AndesMovi el repartidor llega al restaurante o tienda física, <strong>compra el producto de su propio bolsillo</strong> y retira el pedido. Luego viaja a tu casa y tú le pagas el total completo (comida + flete de entrega) en efectivo o transferencia.
                </p>
              </div>

              <div className="space-y-2 text-zinc-300">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <strong className="text-white block">Encargos Especiales:</strong>
                  <span>Si el producto que buscas no está en el catálogo, puedes escribir un encargo personalizado (ej. "Comprar medicina en la farmacia de turno").</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. PAGOS */}
          {activeTab === 'pagos' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Métodos de Pago y Seguridad</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <strong className="text-white block mb-1">💵 Efectivo Directo:</strong>
                  <span>Pago directo al conductor al finalizar la carrera o al recibir el pedido.</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <strong className="text-white block mb-1">📱 Transferencia DeUna! / Bancos:</strong>
                  <span>Transferencia directa a Banco Pichincha, Guayaquil, Produbanco o DeUna!.</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <strong className="text-white block mb-1">💳 Billetera Digital Prepago:</strong>
                  <span>Recarga tu saldo AndesMovi para pagos instantáneos con bonos por volumen.</span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <strong className="text-white block mb-1">🪪 Seguridad Garantizada:</strong>
                  <span>Conductores validados en vivo con Cédula de Identidad en el SRI y Récord Policial.</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. CHAT CON IA DE EXPLICACIÓN EN VIVO */}
          {activeTab === 'ai_chat' && (
            <div className="flex flex-col h-[380px] sm:h-[420px] rounded-2xl border border-purple-500/30 bg-zinc-900/90 overflow-hidden">
              {/* HISTORIAL DE CHAT */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                        msg.sender === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isAskingAi && (
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold p-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>AndesMovi IA respondiendo...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* BOTONES DE PREGUNTAS FRECUENTES RÁPIDAS */}
              <div className="p-2 border-t border-zinc-800 bg-zinc-950 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSendQuestion('¿Cuánto cuesta la carrera mínima de taxi en Ecuador?')}
                  className="px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                >
                  💡 ¿Cuánto cuesta la carrera mínima?
                </button>

                <button
                  type="button"
                  onClick={() => handleSendQuestion('¿Cómo compro comida a domicilio con pago en efectivo?')}
                  className="px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                >
                  💡 ¿Cómo funciona el delivery?
                </button>

                <button
                  type="button"
                  onClick={() => handleSendQuestion('¿Cómo reservo un asiento VIP para viajar a Quito?')}
                  className="px-2.5 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                >
                  💡 ¿Cómo viajo a Quito?
                </button>
              </div>

              {/* INPUT DE PREGUNTA AL CHATBOT */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuestion();
                }}
                className="p-2.5 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Escribe tu pregunta sobre AndesMovi..."
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isAskingAi}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-950 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Soporte Oficial AndesMovi 24/7 • WhatsApp: 0978734844</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer active:scale-95 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Generador local de respuestas frecuentes si la API externa no está disponible
 */
function getLocalAiAnswer(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('mínima') || q.includes('minima') || q.includes('precio') || q.includes('costo') || q.includes('tarifa')) {
    return 'La carrera mínima urbana regulada por la ANT en Ecuador es de $1.25 USD hasta 2.7 km. Si el recorrido supera esa distancia, se aplica un incremento progresivo por kilómetro. En AndesMovi puedes ofrecer o acordar la tarifa con tu conductor.';
  }

  if (q.includes('quito') || q.includes('ejecutivo') || q.includes('asiento') || q.includes('reserva')) {
    return 'El Servicio Ejecutivo a Quito opera con tarifas reguladas de $25.00 USD por asiento (La Carolina / Quito Norte) y $30.00 USD (Aeropuerto Tababela / Quitumbe). Puedes elegir tu asiento exacto en el croquis de cabina y reservar abonando un depósito de $10 USD a las cuentas oficiales de AndesMovi.';
  }

  if (q.includes('delivery') || q.includes('comida') || q.includes('compra') || q.includes('local')) {
    return 'En el servicio de Delivery, el repartidor llega al local físico, compra los productos de su propio bolsillo y te entrega el pedido en tu puerta. Tú le pagas el total (comida + flete) en efectivo o transferencia directamente al recibir.';
  }

  if (q.includes('encomienda') || q.includes('paquete') || q.includes('tulcanaza') || q.includes('envio')) {
    return 'Las encomiendas urbanas se entregan en minutos dentro de la ciudad. Para envíos nacionales interprovinciales, AndesMovi despacha mediante la Oficina Tulcanaza y cooperativas aliadas (San Cristóbal, Pullman, Cita Express) a las 24 provincias. Puedes pagar en origen o por cobrar en destino.';
  }

  if (q.includes('moto') || q.includes('casco')) {
    return 'En las carreras urbanas en moto solo se traslada a 1 persona. Es obligatorio que el conductor lleve un casco limpio y homologado adicional exclusivo para uso del cliente.';
  }

  if (q.includes('pago') || q.includes('transferencia') || q.includes('efectivo') || q.includes('deuna')) {
    return 'Aceptamos pago en efectivo directo al conductor, transferencias instantáneas DeUna!, Banco Pichincha, Guayaquil, Produbanco, Peigo y saldo en tu Billetera Digital AndesMovi.';
  }

  return 'AndesMovi ofrece 4 servicios principales: Taxi Urbano ($1.25 mín.), Ejecutivo a Quito ($25 USD), Encomiendas Nacionales y Delivery de comida/compras. ¿Te gustaría saber detalles sobre alguno de estos servicios?';
}

import React, { useState, useEffect, useRef } from 'react';
import { Driver, ChatMessage, Coordinates } from '../types';
import { QUICK_CHAT_MESSAGES_CLIENT, QUICK_CHAT_MESSAGES_DRIVER } from '../data/mockData';
import { haptic } from '../utils/haptics';
import { pushNotificationService } from '../services/notificationService';
import {
  Send,
  X,
  CheckCheck,
  MapPin,
  Smile,
  Phone,
  Paperclip,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Radio,
  PhoneCall,
} from 'lucide-react';

interface ChatModalProps {
  driver: Driver;
  messages: ChatMessage[];
  onSendMessage: (text: string, isLocation?: boolean, coords?: Coordinates) => void;
  userLocation?: Coordinates;
  onClose: () => void;
  onStartCall?: () => void;
  senderRole?: 'cliente' | 'conductor';
  clientName?: string;
  clientAvatar?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  driver,
  messages,
  onSendMessage,
  userLocation,
  onClose,
  onStartCall,
  senderRole = 'cliente',
  clientName = 'Cliente',
  clientAvatar,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isDriverTyping, setIsDriverTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isDriverTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    haptic.sendMessage();
    pushNotificationService.playChime('chat');
    onSendMessage(text);
    setInputText('');
  };

  const handleShareLocation = () => {
    haptic.sendMessage();
    pushNotificationService.playChime('chat');
    if (userLocation) {
      onSendMessage(
        `📍 Mi ubicación GPS exacta: ${userLocation.name || userLocation.address || 'Aquí en el mapa'}`,
        true,
        userLocation
      );
    } else {
      onSendMessage(
        senderRole === 'conductor'
          ? '📍 Estoy ubicado en el punto de encuentro esperando con intermitentes.'
          : '📍 Estoy esperándote en la puerta principal del edificio.'
      );
    }
  };

  const isClientView = senderRole === 'cliente';
  const otherPartyName = isClientView ? driver.name : clientName;
  const otherPartyAvatar = isClientView
    ? driver.avatar
    : clientAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
  const otherPartySubtitle = isClientView
    ? `${driver.vehicle.model} • ${driver.vehicle.plate}`
    : 'Pasajero asignado • Canal privado temporal';

  const quickChips = isClientView ? QUICK_CHAT_MESSAGES_CLIENT : QUICK_CHAT_MESSAGES_DRIVER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col h-[580px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={otherPartyAvatar}
                alt={otherPartyName}
                className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shadow-sm"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white truncate">{otherPartyName}</h4>
              <p className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1">
                <span>{otherPartySubtitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* BOTÓN LLAMAR POR LA APP (VoIP / WebRTC Interna) */}
            {onStartCall && (
              <button
                type="button"
                id="btn-chat-in-app-call"
                onClick={() => {
                  haptic.click();
                  onStartCall();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Llamar por la app (Voz VoIP segura sin gastar saldo)"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Llamar por la app</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Alert: Closed temporal channel */}
        <div className="px-3 py-1.5 bg-zinc-950/80 border-b border-zinc-800/60 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="truncate">Canal cerrado temporal: Se destruye al finalizar el viaje</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5 bg-zinc-950/40">
          {messages.map((msg) => {
            const isMe = msg.sender === senderRole;
            const isSystem = msg.sender === 'sistema';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-1 animate-in fade-in">
                  <span className="text-[10px] bg-zinc-850 text-zinc-300 px-3 py-1 rounded-full border border-zinc-750">
                    ℹ️ {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in`}
              >
                <div
                  className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-emerald-500 text-zinc-950 font-semibold rounded-br-none shadow-md shadow-emerald-500/10'
                      : 'bg-zinc-800 text-white rounded-bl-none border border-zinc-750 shadow-md'
                  }`}
                >
                  {msg.isLocation && (
                    <div className="flex items-center gap-1 text-[11px] font-bold pb-1 mb-1 border-b border-black/10">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ubicación GPS</span>
                    </div>
                  )}
                  {msg.text}
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1">
                  {msg.timestamp}
                  {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                </span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isDriverTyping && (
            <div className="flex items-center gap-2 p-2 bg-zinc-800/60 rounded-2xl w-fit border border-zinc-700 text-xs text-zinc-300 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-zinc-400 ml-1">{otherPartyName} está escribiendo...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (Predefinidos por Rol) */}
        <div className="px-3 py-2 bg-zinc-950 border-t border-zinc-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={handleShareLocation}
            className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer active:scale-95"
          >
            <MapPin className="w-3 h-3" />
            <span>Enviar GPS</span>
          </button>

          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] whitespace-nowrap border border-zinc-800 transition-colors flex-shrink-0 cursor-pointer active:scale-95 font-medium"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Escribe a ${otherPartyName.split(' ')[0]}...`}
            className="flex-1 bg-zinc-900 border border-zinc-750 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

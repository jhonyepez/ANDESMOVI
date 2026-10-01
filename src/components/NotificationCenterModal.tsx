import React, { useState, useEffect } from 'react';
import { PushNotificationItem, NotificationPreferences } from '../types';
import { pushNotificationService } from '../services/notificationService';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Smartphone,
  MessageSquare,
  Car,
  Package,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Send,
  Wallet,
  Radio,
} from 'lucide-react';

interface NotificationCenterModalProps {
  onClose: () => void;
  onOpenChat?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  onClose,
  onOpenChat,
}) => {
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    pushNotificationService.getPreferences()
  );
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    pushNotificationService.getPermissionStatus()
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [testSentNotice, setTestSentNotice] = useState<string | null>(null);

  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = () => {
    setNotifications(pushNotificationService.getStoredNotifications());
    setPreferences(pushNotificationService.getPreferences());
    setPermissionStatus(pushNotificationService.getPermissionStatus());
  };

  useEffect(() => {
    loadData();
    const unsub = pushNotificationService.subscribe(() => {
      setNotifications(pushNotificationService.getStoredNotifications());
    });
    const unsubPrefs = pushNotificationService.subscribePreferences((p) => {
      setPreferences(p);
    });
    return () => {
      unsub();
      unsubPrefs();
    };
  }, []);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    const status = await pushNotificationService.requestPermission();
    setPermissionStatus(status);
    setIsRequestingPermission(false);
  };

  const handleTogglePreference = (key: keyof NotificationPreferences) => {
    const updated = pushNotificationService.updatePreferences({
      [key]: !preferences[key],
    });
    setPreferences(updated);
  };

  const handleMarkAllRead = () => {
    pushNotificationService.markAllAsRead();
    setNotifications(pushNotificationService.getStoredNotifications());
    setFeedbackMsg('Todas las alertas marcadas como leídas');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleClearAll = () => {
    pushNotificationService.clearHistory();
    setNotifications([]);
    setConfirmClear(false);
    setFeedbackMsg('Historial de alertas eliminado por completo');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pushNotificationService.deleteNotification(id);
    setNotifications(pushNotificationService.getStoredNotifications());
    setFeedbackMsg('Alerta eliminada');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleSendTestNotification = (type: 'trip' | 'chat') => {
    if (type === 'trip') {
      pushNotificationService.notifyTripStatus('driver_assigned', {
        driverName: 'Edison Patricio Alvear',
        vehicleModel: 'Chevrolet Aveo Emotion',
        plate: 'PBA-3891',
        serviceType: 'viaje',
        tripId: 'test-trip-1',
      });
      setTestSentNotice('¡Notificación de prueba de Viaje enviada con sonido y vibración!');
    } else {
      pushNotificationService.notifyChatMessage({
        senderName: 'Edison Patricio (Conductor)',
        text: '¡Hola! Ya estoy a 2 cuadras del parque central. Voy con intermitentes.',
        driverPhone: '+593 99 824 1902',
        tripId: 'test-trip-1',
      });
      setTestSentNotice('¡Notificación de prueba de Chat enviada!');
    }

    setTimeout(() => {
      setTestSentNotice(null);
    }, 3500);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Notificaciones Push</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Avisos en tiempo real sobre tu conductor, viaje y mensajes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* 1. Browser Native Permission Status Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border mt-0.5 ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                    : permissionStatus === 'denied'
                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-400'
                    : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                }`}
              >
                {permissionStatus === 'granted' ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Permisos del Navegador</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      permissionStatus === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : permissionStatus === 'denied'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {permissionStatus === 'granted'
                      ? 'Activadas'
                      : permissionStatus === 'denied'
                      ? 'Bloqueadas'
                      : 'Sin Configurar'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {permissionStatus === 'granted'
                    ? 'Recibirás notificaciones nativas en pantalla completa y segundo plano.'
                    : permissionStatus === 'denied'
                    ? 'Permiso denegado por el navegador. Puedes habilitarlo en el icono de candado de tu navegador.'
                    : 'Permite que AndesMovi te avise cuando tu carro llegue o el chofer te hable.'}
                </p>
              </div>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                disabled={isRequestingPermission}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{isRequestingPermission ? 'Activando...' : 'Activar Push'}</span>
              </button>
            )}
          </div>

          {/* Test Notice Toast */}
          {testSentNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{testSentNotice}</span>
            </div>
          )}

          {/* 2. Push Preferences Toggles */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
              Canales y Preferencias
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Trip status */}
              <button
                onClick={() => handleTogglePreference('tripStatusAlerts')}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  preferences.tripStatusAlerts
                    ? 'bg-zinc-800/80 border-emerald-500/40 text-white'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Estado de Viaje</span>
                </div>
                <div
                  className={`w-7 h-4 rounded-full transition-colors relative ${
                    preferences.tripStatusAlerts ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                      preferences.tripStatusAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </div>
              </button>

              {/* Chat messages */}
              <button
                onClick={() => handleTogglePreference('chatMessageAlerts')}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  preferences.chatMessageAlerts
                    ? 'bg-zinc-800/80 border-emerald-500/40 text-white'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Mensajes de Chat</span>
                </div>
                <div
                  className={`w-7 h-4 rounded-full transition-colors relative ${
                    preferences.chatMessageAlerts ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                      preferences.chatMessageAlerts ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </div>
              </button>

              {/* Sound */}
              <button
                onClick={() => handleTogglePreference('soundEnabled')}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  preferences.soundEnabled
                    ? 'bg-zinc-800/80 border-emerald-500/40 text-white'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Timbre Acústico</span>
                </div>
                <div
                  className={`w-7 h-4 rounded-full transition-colors relative ${
                    preferences.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                      preferences.soundEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </div>
              </button>

              {/* Vibration */}
              <button
                onClick={() => handleTogglePreference('vibrationEnabled')}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  preferences.vibrationEnabled
                    ? 'bg-zinc-800/80 border-emerald-500/40 text-white'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Vibración Háptica</span>
                </div>
                <div
                  className={`w-7 h-4 rounded-full transition-colors relative ${
                    preferences.vibrationEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-zinc-950 absolute top-0.5 transition-transform ${
                      preferences.vibrationEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Test push notification buttons */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] text-zinc-400 font-medium">Probar en este dispositivo:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendTestNotification('trip')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Probar Viaje</span>
                </button>
                <button
                  onClick={() => handleSendTestNotification('chat')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Probar Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Notifications History List */}
          <div className="space-y-2">
            {feedbackMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                <span>{feedbackMsg}</span>
                <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                Historial de Alertas ({notifications.length})
              </h4>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Marcar leídas</span>
                  </button>
                  <span className="text-zinc-600">•</span>
                  {!confirmClear ? (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="text-[11px] text-rose-400 hover:underline font-bold flex items-center gap-1"
                      title="Eliminar todas las alertas guardadas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vaciar historial</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded-lg text-[10px]">
                      <span className="text-rose-200">¿Eliminar todo?</span>
                      <button
                        onClick={handleClearAll}
                        className="font-bold text-rose-300 hover:text-rose-100 underline"
                      >
                        Sí, vaciar
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="text-zinc-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col items-center justify-center gap-2">
                <BellOff className="w-8 h-8 text-zinc-600" />
                <p className="text-xs font-bold text-zinc-400">Sin notificaciones aún</p>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  Cuando pidas un viaje o tu chofer te escriba, aquí verás todas tus alertas con hora y detalles.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => {
                  const isChat = item.category === 'chat_message';
                  const isWallet = item.category === 'wallet';
                  const isBroadcast = item.category === 'driver_broadcast';
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        pushNotificationService.markAsRead(item.id);
                        if (isChat && onOpenChat) {
                          onClose();
                          onOpenChat();
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group ${
                        item.read
                          ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900'
                          : 'bg-zinc-900 border-emerald-500/40 text-white shadow-md hover:border-emerald-500/60'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl border flex-shrink-0 ${
                          isChat
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                            : isWallet
                            ? 'bg-sky-950/80 border-sky-500/40 text-sky-400'
                            : isBroadcast
                            ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                            : 'bg-zinc-950 border-zinc-800 text-emerald-400'
                        }`}
                      >
                        {isChat ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : isWallet ? (
                          <Wallet className="w-4 h-4" />
                        ) : isBroadcast ? (
                          <Radio className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Car className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-black truncate">{item.title}</h5>
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{item.body}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(item.id, e)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar esta alerta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Push Web API & Service Worker activo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

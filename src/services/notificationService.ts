import { PushNotificationItem, NotificationPreferences, NotificationCategory, ServiceType } from '../types';

const STORAGE_KEY_PREFS = 'andesmovi_notification_prefs_v1';
const STORAGE_KEY_ITEMS = 'andesmovi_notifications_history_v1';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  tripStatusAlerts: false,
  chatMessageAlerts: false,
  soundEnabled: false,
  vibrationEnabled: false,
  pushEnabled: false,
  tripUpdates: false,
  promotions: false,
};

type NotificationListener = (item: PushNotificationItem) => void;
type PreferencesListener = (prefs: NotificationPreferences) => void;

class PushNotificationService {
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private notificationListeners: Set<NotificationListener> = new Set();
  private preferencesListeners: Set<PreferencesListener> = new Set();
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.loadPreferences();
    this.initServiceWorker();
  }

  // Load saved preferences
  private loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFS);
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      this.preferences = DEFAULT_PREFERENCES;
    }
  }

  // Save preferences
  public updatePreferences(newPrefs: Partial<NotificationPreferences>): NotificationPreferences {
    this.preferences = { ...this.preferences, ...newPrefs };
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(this.preferences));
    } catch (e) {
      console.warn('Error saving notification preferences:', e);
    }
    this.preferencesListeners.forEach((listener) => listener(this.preferences));
    return this.preferences;
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Check if browser notifications are supported
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  // Current permission status
  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  // Request browser permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.updatePreferences({ enabled: true });
        // Send a welcome notification
        this.notify({
          category: 'system',
          title: '🔔 Notificaciones AndesMovi Activadas',
          body: 'Recibirás avisos instantáneos cuando tu conductor esté cerca o te escriba.',
        });
      }
      return permission;
    } catch (error) {
      console.warn('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Initialize service worker
  private async initServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
    } catch {
      // Graceful fallback if SW registration fails (e.g. strict sandbox)
      this.swRegistration = null;
    }
  }

  private ringtoneInterval: NodeJS.Timeout | null = null;
  private ringtoneAudioCtx: AudioContext | null = null;

  // Play audio chime using Web Audio API synth
  public playChime(type: 'trip' | 'chat' = 'trip') {
    if (!this.preferences.soundEnabled) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'chat') {
        // High-pitched friendly chat bubble pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else {
        // Multi-frequency harmonic trip alert chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.18); // G5
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {
      // AudioContext blocked or not allowed until user interaction
    }
  }

  // Realistic phone ringtone loop using Web Audio API
  public startRingtone() {
    this.stopRingtone();
    if (!this.preferences.soundEnabled) return;

    const playTone = () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Dual frequency North American / Andean telephone ring standard (440Hz + 480Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        // Ring pattern: Ring (1.2s), Pause (2s)
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);

        this.vibrate();
      } catch {
        // Handled silently
      }
    };

    playTone();
    this.ringtoneInterval = setInterval(playTone, 2800);
  }

  public stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Call connected sound
  public playCallConnected() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  // Call ended / hang up sound
  public playCallEnded() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  // Vibrate mobile device if enabled
  public vibrate() {
    if (!this.preferences.vibrationEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 75, 150]);
      } catch {
        // Ignore vibration errors
      }
    }
  }

  // Send a push notification
  public async notify(item: {
    category: NotificationCategory;
    title: string;
    body: string;
    icon?: string;
    actionUrl?: string;
    data?: PushNotificationItem['data'];
  }): Promise<PushNotificationItem> {
    const notification: PushNotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: item.category,
      title: item.title,
      body: item.body,
      timestamp: Date.now(),
      read: false,
      icon: item.icon || '/icon.svg',
      actionUrl: item.actionUrl,
      data: item.data,
    };

    // Check category preferences
    if (!this.preferences.enabled) {
      return notification;
    }

    if (item.category === 'trip_status' && !this.preferences.tripStatusAlerts) {
      return notification;
    }

    if (item.category === 'chat_message' && !this.preferences.chatMessageAlerts) {
      return notification;
    }

    // 1. Play sound
    this.playChime(item.category === 'chat_message' ? 'chat' : 'trip');

    // 2. Vibrate
    this.vibrate();

    // 3. Save to localStorage history
    this.saveNotification(notification);

    // 4. Trigger in-app listeners (for floating banner & badge updates)
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.warn('Error executing notification listener:', err);
      }
    });

    // 5. Send native Browser / System Push Notification if permission is granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        if (this.swRegistration && 'showNotification' in this.swRegistration) {
          await (this.swRegistration as any).showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            tag: `andesmovi-${notification.category}`,
            renotify: true,
            data: {
              url: notification.actionUrl || '/',
              ...notification.data,
            },
          });
        } else {
          new Notification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/icon.svg',
            tag: `andesmovi-${notification.category}`,
          });
        }
      } catch (e) {
        console.warn('Native push notification error, fallback to in-app toast:', e);
      }
    }

    return notification;
  }

  // Generic local notification helper
  public async sendLocalNotification(item: {
    title: string;
    body: string;
    category?: NotificationCategory;
    icon?: string;
  }): Promise<PushNotificationItem> {
    return this.notify({
      category: item.category || 'system',
      title: item.title,
      body: item.body,
      icon: item.icon,
    });
  }

  // Specific helpers for trip status transitions
  public notifyTripStatus(
    status:
      | 'driver_assigned'
      | 'driver_arrived'
      | 'in_transit'
      | 'arrived_destination'
      | 'completed'
      | 'cancelled',
    details: {
      driverName?: string;
      vehicleModel?: string;
      plate?: string;
      serviceType?: ServiceType;
      originName?: string;
      destinationName?: string;
      tripId?: string;
    }
  ) {
    const serviceLabel =
      details.serviceType === 'domicilio'
        ? 'domicilio'
        : details.serviceType === 'encomienda'
        ? 'encomienda'
        : 'viaje';

    const driverName = details.driverName || 'Tu conductor';
    const vehicleInfo = details.vehicleModel
      ? `${details.vehicleModel} (${details.plate || 'Placa verificada'})`
      : '';

    switch (status) {
      case 'driver_assigned':
        this.notify({
          category: 'trip_status',
          title: `🚗 ${driverName} aceptó tu ${serviceLabel}`,
          body: vehicleInfo
            ? `Va en camino en su ${vehicleInfo}. ¡Prepárate!`
            : 'Va en camino a tu ubicación de partida.',
          data: {
            tripId: details.tripId,
            driverName,
            status,
            serviceType: details.serviceType,
          },
        });
        break;

      case 'driver_arrived':
        this.notify({
          category: 'trip_status',
          title: `📍 ¡${driverName} ha llegado!`,
          body: `Está esperándote en ${details.originName || 'el punto de partida'}. Búscalo por ${vehicleInfo || 'su vehículo'}.`,
          data: {
            tripId: details.tripId,
            driverName,
            status,
            serviceType: details.serviceType,
          },
        });
        break;

      case 'in_transit':
        this.notify({
          category: 'trip_status',
          title: `🛣️ ${details.serviceType === 'domicilio' ? 'Pedido en camino' : 'Viaje en curso'}`,
          body: `Hacia ${details.destinationName || 'tu destino'} con monitoreo satelital en tiempo real.`,
          data: {
            tripId: details.tripId,
            driverName,
            status,
            serviceType: details.serviceType,
          },
        });
        break;

      case 'arrived_destination':
        this.notify({
          category: 'trip_status',
          title: `🏁 Llegando a tu destino`,
          body: `Estás en ${details.destinationName || 'tu destino'}. Recuerda revisar tus pertenencias personales.`,
          data: {
            tripId: details.tripId,
            driverName,
            status,
            serviceType: details.serviceType,
          },
        });
        break;

      case 'completed':
        this.notify({
          category: 'trip_status',
          title: `✅ ${details.serviceType === 'encomienda' ? 'Encomienda entregada' : 'Viaje finalizado'}`,
          body: `Gracias por confiar en AndesMovi. ¿Cómo fue tu experiencia con ${driverName}?`,
          data: {
            tripId: details.tripId,
            driverName,
            status,
            serviceType: details.serviceType,
          },
        });
        break;

      case 'cancelled':
        this.notify({
          category: 'trip_status',
          title: `❌ Servicio cancelado`,
          body: `El servicio de ${serviceLabel} fue cancelado. Si hubo cargos, fueron reembolsados.`,
          data: {
            tripId: details.tripId,
            status,
            serviceType: details.serviceType,
          },
        });
        break;
    }
  }

  // Specific helper for incoming chat messages
  public notifyChatMessage(details: {
    senderName: string;
    text: string;
    driverPhone?: string;
    tripId?: string;
  }) {
    this.notify({
      category: 'chat_message',
      title: `💬 Mensaje de ${details.senderName}`,
      body: details.text,
      data: {
        driverName: details.senderName,
        messageText: details.text,
        driverPhone: details.driverPhone,
        tripId: details.tripId,
      },
    });
  }

  // Real-time broadcast to all drivers when a client requests a carrera, pedido, or encomienda
  public notifyDriverBroadcast(details: {
    serviceType: ServiceType;
    clientName: string;
    origin: string;
    destination: string;
    price: number;
    vehicleType?: string;
    driversCount?: number;
    tripId?: string;
  }) {
    const isTrip = details.serviceType === 'viaje';
    const isDelivery = details.serviceType === 'domicilio';
    const serviceName = isTrip ? 'Carrera' : isDelivery ? 'Pedido Delivery' : 'Encomienda';
    const iconBadge = isTrip ? '🚨' : isDelivery ? '🍔' : '📦';
    const driversNotified = details.driversCount || 12;

    this.notify({
      category: 'driver_broadcast',
      title: `${iconBadge} ¡NUEVA ${serviceName.toUpperCase()}! ($${details.price.toFixed(2)} USD)`,
      body: `${details.clientName} solicita ${serviceName.toLowerCase()} de "${details.origin}" a "${details.destination}". Notificado a los ${driversNotified} conductores activos para tomar la carrera en el Radar.`,
      data: {
        tripId: details.tripId,
        driverName: details.clientName,
        serviceType: details.serviceType,
      },
    });
  }

  // Real-time notification when administrator approves deposit / recharge
  public notifyWalletRecharge(details: {
    amount: number;
    newBalance: number;
    adminName?: string;
    reference?: string;
  }) {
    this.notify({
      category: 'wallet',
      title: `💰 ¡Depósito Aprobado Inmediatamente!`,
      body: `El administrador ${details.adminName || 'Jhon Sebastian Yepez'} aprobó tu recarga de $${details.amount.toFixed(2)} USD. Saldo acreditado inmediatamente: $${details.newBalance.toFixed(2)} USD.`,
    });
  }

  // Real-time notification to administrator when a new driver creates their account
  public notifyNewDriverRegistered(details: {
    driverName: string;
    cedula: string;
    phone?: string;
    vehicleModel?: string;
    plate?: string;
    province?: string;
    authProvider?: string;
  }) {
    const vehicleText = details.vehicleModel
      ? `${details.vehicleModel} [Placa: ${details.plate || 'En trámite'}]`
      : 'Vehículo en proceso de registro';

    this.notify({
      category: 'driver_registration',
      title: `🚖 ¡NUEVO CONDUCTOR REGISTRADO!`,
      body: `${details.driverName} (C.I. ${details.cedula}) acaba de crear su cuenta de conductor en ${details.province || 'Ecuador'}. ${vehicleText}. Revisa y autoriza en el Panel de Administrador.`,
      data: {
        driverName: details.driverName,
        driverPhone: details.phone,
      },
    });
  }

  // History storage operations
  public getStoredNotifications(): PushNotificationItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore JSON error
    }
    return [];
  }

  private saveNotification(item: PushNotificationItem) {
    try {
      const list = this.getStoredNotifications();
      // Keep up to 50 most recent notifications
      const updated = [item, ...list.filter((n) => n.id !== item.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error storing notification:', e);
    }
  }

  public markAsRead(id: string) {
    try {
      const list = this.getStoredNotifications();
      const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error marking notification as read:', e);
    }
  }

  public markAllAsRead() {
    try {
      const list = this.getStoredNotifications();
      const updated = list.map((n) => ({ ...n, read: true }));
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error marking all as read:', e);
    }
  }

  public deleteNotification(id: string) {
    try {
      const list = this.getStoredNotifications();
      const updated = list.filter((n) => n.id !== id);
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  }

  public clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY_ITEMS);
    } catch (e) {
      console.warn('Error clearing notifications:', e);
    }
  }

  // Subscriptions
  public subscribe(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  public subscribePreferences(listener: PreferencesListener): () => void {
    this.preferencesListeners.add(listener);
    return () => {
      this.preferencesListeners.delete(listener);
    };
  }
}

export const pushNotificationService = new PushNotificationService();

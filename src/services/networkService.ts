/**
 * Servicio Oficial de Monitoreo de Red, Conectividad Móvil / Wi-Fi
 * y Política de Reintentos Automáticos (Exponential Backoff) para AndesMovi
 */

export interface NetworkState {
  isOnline: boolean;
  type: 'wifi' | 'cellular' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  lastChanged: number;
}

type NetworkListener = (state: NetworkState) => void;

class NetworkService {
  private listeners: Set<NetworkListener> = new Set();
  private currentState: NetworkState;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.currentState = {
      isOnline,
      type: this.detectConnectionType(),
      effectiveType: this.detectEffectiveType(),
      lastChanged: Date.now(),
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Listener de cambio de tipo de conexión (Wi-Fi <-> Datos Móviles)
      const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (navConn) {
        navConn.addEventListener('change', this.handleConnectionChange);
      }
    }
  }

  private detectConnectionType(): 'wifi' | 'cellular' | 'unknown' {
    if (typeof navigator === 'undefined') return 'unknown';
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn && conn.type) {
      if (conn.type === 'cellular' || conn.type === 'wimax') return 'cellular';
      if (conn.type === 'wifi' || conn.type === 'ethernet') return 'wifi';
    }
    return 'unknown';
  }

  private detectEffectiveType(): '2g' | '3g' | '4g' | '5g' | 'unknown' {
    if (typeof navigator === 'undefined') return 'unknown';
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn && conn.effectiveType) {
      if (['slow-2g', '2g'].includes(conn.effectiveType)) return '2g';
      if (conn.effectiveType === '3g') return '3g';
      if (conn.effectiveType === '4g') return '4g';
      if (conn.effectiveType === '5g') return '5g';
    }
    return '4g';
  }

  private handleOnline = () => {
    const newState: NetworkState = {
      isOnline: true,
      type: this.detectConnectionType(),
      effectiveType: this.detectEffectiveType(),
      lastChanged: Date.now(),
    };
    this.currentState = newState;
    this.notifyListeners();

    // Trigger auto-reconnect dispatch for GPS and WebSockets sync
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('andesmovi-network-reconnected', { detail: newState }));
    }, 300);
  };

  private handleOffline = () => {
    const newState: NetworkState = {
      isOnline: false,
      type: this.detectConnectionType(),
      effectiveType: this.detectEffectiveType(),
      lastChanged: Date.now(),
    };
    this.currentState = newState;
    this.notifyListeners();
  };

  private handleConnectionChange = () => {
    const newState: NetworkState = {
      isOnline: navigator.onLine,
      type: this.detectConnectionType(),
      effectiveType: this.detectEffectiveType(),
      lastChanged: Date.now(),
    };
    this.currentState = newState;
    this.notifyListeners();
  };

  public getNetworkState(): NetworkState {
    return this.currentState;
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState);
      } catch (err) {
        console.error('[NetworkService Listener Error]:', err);
      }
    });
  }

  /**
   * Petición HTTP resiliente con reintentos automáticos (Exponential Backoff)
   * Especial para carreteras, zonas rurales o fluctuaciones de datos móviles
   */
  public async fetchWithRetry<T = any>(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    baseDelayMs: number = 800
  ): Promise<T> {
    // Garantiza que la URL sea relativa o HTTPS pública sin hardcodear localhost
    const publicUrl = url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')
      ? url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '')
      : url;

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const response = await fetch(publicUrl, options);
        if (response.ok) {
          return (await response.json()) as T;
        }
        // Si es error de cliente 4xx que no sea 429, no reintentar innecesariamente
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          throw err;
        }
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error(`Fallo tras ${maxRetries} reintentos de red.`);
  }
}

export const networkService = new NetworkService();

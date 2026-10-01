import React, { useState, useEffect } from 'react';
import { networkService, NetworkState } from '../services/networkService';
import { Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(() =>
    networkService.getNetworkState()
  );
  const [showReconnectedBanner, setShowReconnectedBanner] = useState<boolean>(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const unsub = networkService.subscribe((state) => {
      setNetworkState((prevState) => {
        if (!prevState.isOnline && state.isOnline) {
          setShowReconnectedBanner(true);
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setShowReconnectedBanner(false);
          }, 3500);
        }
        return state;
      });
    });

    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (networkState.isOnline && !showReconnectedBanner) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[11000] max-w-md w-[calc(100%-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      {!networkState.isOnline ? (
        /* BANNER SIN SEÑAL / OFFLINE */
        <div className="p-3 rounded-2xl bg-zinc-950/95 border-2 border-rose-500/80 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 ring-4 ring-rose-500/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-black text-rose-300 flex items-center gap-1">
                <span>Sin Conexión a Datos Móviles / Wi-Fi</span>
              </div>
              <div className="text-[10px] text-zinc-300 truncate font-medium">
                Reintentando automáticamente en carretera o túnel...
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 shrink-0">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Reintentando</span>
          </div>
        </div>
      ) : (
        /* BANNER RECONECTADO CON ÉXITO */
        <div className="p-3 rounded-2xl bg-zinc-950/95 border-2 border-emerald-500/80 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 ring-4 ring-emerald-500/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-4 h-4 animate-bounce text-amber-400" />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-black text-emerald-300 flex items-center gap-1">
                <span>Conexión Restablecida</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200 font-mono">
                  {networkState.effectiveType.toUpperCase()}
                </span>
              </div>
              <div className="text-[10px] text-zinc-300 truncate font-medium">
                GPS y WebSockets sincronizados en tiempo real.
              </div>
            </div>
          </div>

          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 shrink-0">
            ✓ Online
          </span>
        </div>
      )}
    </div>
  );
};

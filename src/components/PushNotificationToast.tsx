import React, { useEffect, useState } from 'react';
import { PushNotificationItem } from '../types';
import {
  MessageSquare,
  Car,
  Package,
  ShieldAlert,
  X,
} from 'lucide-react';

interface PushNotificationToastProps {
  notification: PushNotificationItem | null;
  onClose: () => void;
  onClickAction?: (notification: PushNotificationItem) => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notification,
  onClose,
  onClickAction,
}) => {
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 6500; // 6.5s display time
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const intervalTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, intervalTime);

    const dismissTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(intervalTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification?.id, onClose]);

  if (!notification) return null;

  const isChat = notification.category === 'chat_message';
  const isTrip = notification.category === 'trip_status';
  const isSafety = notification.category === 'safety';

  const getIcon = () => {
    if (isChat) return <MessageSquare className="w-5 h-5 text-emerald-400" />;
    if (isSafety) return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    if (notification.data?.serviceType === 'encomienda') {
      return <Package className="w-5 h-5 text-amber-400" />;
    }
    return <Car className="w-5 h-5 text-emerald-400" />;
  };

  const getBorderColor = () => {
    if (isChat) return 'border-emerald-500/50 shadow-emerald-950/40';
    if (isSafety) return 'border-rose-500/50 shadow-rose-950/40';
    return 'border-emerald-500/60 shadow-emerald-950/50';
  };

  return (
    <aside
      aria-label="Notificación Push"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-md pointer-events-auto transition-all animate-in slide-in-from-top-4 duration-300"
    >
      <div
        onClick={() => {
          if (onClickAction) {
            onClickAction(notification);
          }
          onClose();
        }}
        className={`relative overflow-hidden bg-zinc-950/95 border-2 ${getBorderColor()} rounded-2xl shadow-2xl backdrop-blur-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-900/95 transition-colors`}
      >
        {/* Animated Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
          <div
            className={`h-full transition-all duration-75 ${
              isChat ? 'bg-emerald-400' : isSafety ? 'bg-rose-500' : 'bg-emerald-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 min-w-0 pt-0.5">
          {/* Icon Avatar */}
          <div
            className={`p-2 rounded-xl border flex-shrink-0 ${
              isChat
                ? 'bg-emerald-950/70 border-emerald-500/40'
                : isSafety
                ? 'bg-rose-950/70 border-rose-500/40'
                : 'bg-emerald-950/70 border-emerald-500/40'
            }`}
          >
            {getIcon()}
          </div>

          {/* Title & Body */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-white truncate">{notification.title}</h4>
            <p className="text-xs text-zinc-300 leading-snug line-clamp-2 mt-0.5 font-medium">
              {notification.body}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0 cursor-pointer"
          title="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

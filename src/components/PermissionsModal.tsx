import React, { useState, useEffect } from 'react';
import { haptic } from '../utils/haptics';

interface PermissionsModalProps {
  onPermissionsGranted?: (coords?: { lat: number; lng: number }) => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ onPermissionsGranted }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    try {
      const yaAutorizo = localStorage.getItem('andesmovi_permisos_ok');
      if (!yaAutorizo) {
        // Mostrar modal tras un breve retardo para una entrada suave
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignorar
    }
  }, []);

  const ejecutarSecuenciaDePermisos = async () => {
    haptic.tap();
    setIsLoading(true);
    let userCoords: { lat: number; lng: number } | undefined = undefined;

    // 1. Si está compilada como App Nativa Android (Capacitor / Cordova)
    if ((window as any).Capacitor?.Plugins) {
      try {
        const { Geolocation, Camera } = (window as any).Capacitor.Plugins;
        if (Geolocation?.requestPermissions) {
          await Geolocation.requestPermissions();
        }
        if (Camera?.requestPermissions) {
          await Camera.requestPermissions();
        }
      } catch (err) {
        console.warn('Permisos nativos Capacitor:', err);
      }
    }
    // 2. Si corre en Navegador Web / PWA
    else {
      // Solicitar GPS
      if ('geolocation' in navigator) {
        userCoords = await new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            },
            () => resolve(undefined),
            { enableHighAccuracy: true, timeout: 6000 }
          );
        });
      }

      // Solicitar Cámara (para encomiendas y fotos de entregas)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop()); // apagar de inmediato tras autorización
        } catch {
          console.warn('Cámara no autorizada o no disponible en este dispositivo.');
        }
      }

      // Solicitar Notificaciones Web Push
      if ('Notification' in window && Notification.permission !== 'granted') {
        try {
          await Notification.requestPermission();
        } catch {}
      }
    }

    // Guardar para que nunca vuelva a molestar al usuario
    try {
      localStorage.setItem('andesmovi_permisos_ok', 'true');
    } catch {}

    haptic.success();
    setIsFadingOut(true);

    setTimeout(() => {
      setIsOpen(false);
      setIsLoading(false);
      if (onPermissionsGranted) {
        onPermissionsGranted(userCoords);
      }
    }, 280);
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-permisos-andesmovi"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.25s ease',
      }}
    >
      <div
        style={{
          background: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '20px',
          maxWidth: '400px',
          width: '100%',
          padding: '24px 20px',
          color: '#F8FAFC',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          textAlign: 'center',
          animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Ícono / Logo de la App */}
        <div
          style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #059669, #10B981)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 20px rgba(5, 150, 105, 0.4)',
          }}
        >
          🚖
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
          Bienvenido a AndesMovi
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94A3B8', lineHeight: 1.4 }}>
          Para brindarte viajes seguros, entregas de encomiendas y cálculo de rutas sin costo, necesitamos habilitar estas funciones:
        </p>

        {/* Lista explicativa de permisos (Exigencia de Google Play / Android) */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          {/* Ubicación */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', background: '#0F172A', padding: '6px', borderRadius: '10px', lineHeight: 1 }}>📍</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>Ubicación GPS</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.3 }}>
                Para ubicar tu punto de recogida y trazar la ruta más rápida sin peajes.
              </div>
            </div>
          </div>

          {/* Cámara y Fotos */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', background: '#0F172A', padding: '6px', borderRadius: '10px', lineHeight: 1 }}>📸</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>Cámara y Archivos</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.3 }}>
                Para fotografiar paquetes de encomiendas y registrar comprobantes de entrega.
              </div>
            </div>
          </div>

          {/* Contactos */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', background: '#0F172A', padding: '6px', borderRadius: '10px', lineHeight: 1 }}>👥</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>Contactos de confianza</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.3 }}>
                Para compartir el viaje en tiempo real por seguridad y contactos de emergencia SOS.
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', background: '#0F172A', padding: '6px', borderRadius: '10px', lineHeight: 1 }}>🔔</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>Notificaciones en vivo</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.3 }}>
                Para avisarte cuando la unidad asignada o el paquete llegue a tu puerta.
              </div>
            </div>
          </div>
        </div>

        {/* Botón de acción principal */}
        <button
          id="btn-activar-permisos"
          onClick={ejecutarSecuenciaDePermisos}
          disabled={isLoading}
          style={{
            width: '100%',
            background: '#059669',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 700,
            padding: '14px',
            border: 'none',
            borderRadius: '14px',
            cursor: isLoading ? 'default' : 'pointer',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
            transition: 'all 0.2s',
            opacity: isLoading ? 0.8 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Configurando...</span>
            </>
          ) : (
            'Habilitar y Continuar'
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * AndesMovi Haptics Engine - Retroalimentación Táctil (navigator.vibrate)
 * Diseñado especialmente para optimizar la respuesta táctil en dispositivos móviles en Ecuador
 * al confirmar carreras, despachar mensajes, activar SOS o interactuar con botones clave.
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'confirmTrip'
  | 'sendMessage'
  | 'warning'
  | 'error'
  | 'sos';

const VIBRATION_PATTERNS: Record<HapticType, number | number[]> = {
  // Toque suave para tabs o botones secundarios
  light: 12,
  // Clic firme en botones primarios
  medium: 25,
  // Presión fuerte en acciones importantes
  heavy: 45,
  // Selección ultra-sutil al deslizar o cambiar opción
  selection: 8,
  // Éxito / Operación completada (doble pulso armónico)
  success: [25, 45, 35],
  // Confirmación de carrera o pedido en AndesMovi (patrón rítmico de confirmación)
  confirmTrip: [40, 50, 30, 50, 70],
  // Envío de mensaje en el chat con el conductor o soporte (doble toque)
  sendMessage: [18, 30, 22],
  // Advertencia o cambio de estado
  warning: [50, 40, 50],
  // Error de validación o fallo de pago
  error: [70, 50, 70, 50, 100],
  // Emergencia SOS / Asistencia vial en la ruta
  sos: [150, 60, 150, 60, 300],
};

/**
 * Ejecuta una vibración háptica segura usando la API nativa navigator.vibrate()
 */
export function triggerHaptic(type: HapticType = 'medium'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Comprobar soporte nativo de la Vibration API del navegador
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    const pattern = VIBRATION_PATTERNS[type] || 25;
    return navigator.vibrate(pattern);
  } catch (err) {
    // Silently ignore if browser restricts vibration due to user settings or iframe sandbox
    return false;
  }
}

/**
 * Atajos directos y semánticos para eventos clave en la aplicación
 */
export const haptic = {
  /** Toque de botón estándar */
  tap: () => triggerHaptic('light'),
  /** Clic en botón de acción */
  click: () => triggerHaptic('medium'),
  /** Cambio de pestaña o selector */
  select: () => triggerHaptic('selection'),
  selection: () => triggerHaptic('selection'),
  /** Impactos hápticos suaves, medios y fuertes */
  light: () => triggerHaptic('light'),
  impactLight: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  impactMedium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  impactHeavy: () => triggerHaptic('heavy'),
  /** Confirmar carrera, viaje o encomienda */
  confirmTrip: () => triggerHaptic('confirmTrip'),
  /** Enviar mensaje en chat */
  sendMessage: () => triggerHaptic('sendMessage'),
  /** Notificación de éxito */
  success: () => triggerHaptic('success'),
  /** Alerta o advertencia */
  warning: () => triggerHaptic('warning'),
  /** Error o acción no permitida */
  error: () => triggerHaptic('error'),
  /** Botón de Pánico o SOS */
  sos: () => triggerHaptic('sos'),
  /** Notificaciones genéricas */
  notification: (type: 'success' | 'warning' | 'error' = 'success') => triggerHaptic(type),
};

export default triggerHaptic;

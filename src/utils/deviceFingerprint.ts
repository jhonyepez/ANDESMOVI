/**
 * Utility for Device Fingerprinting & Binding in AndesMovi Ecuador
 * Generates a unique, persistent Device ID and human-readable device name
 * to prevent concurrent multi-device logins and enforce single-session security.
 */

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  screenResolution: string;
  timeZone: string;
}

/**
 * Fast string hashing helper
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Detects friendly browser & OS device name
 */
export function getFriendlyDeviceName(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Dispositivo Web Desconocido';
  }

  const ua = navigator.userAgent || '';
  let os = 'Navegador Web';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS (iPhone/iPad)';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/windows/i.test(ua)) os = 'Windows PC';
  else if (/linux/i.test(ua)) os = 'Linux PC';

  let browser = 'Browser';
  if (/chrome|crios/i.test(ua) && !/edge|opr\//i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';

  const screenRes = typeof window.screen !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';

  return `${browser} en ${os} (${screenRes})`;
}

/**
 * Returns the unique Device Fingerprint for the current browser/device.
 * Guarantees a persistent ID stored in localStorage or generated deterministically.
 */
export function getDeviceFingerprint(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'dev-ssr-unknown',
      deviceName: 'Servidor / SSR',
      userAgent: 'unknown',
      screenResolution: '0x0',
      timeZone: 'UTC',
    };
  }

  const STORAGE_KEY = 'andesmovi_device_fingerprint_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);

  const ua = navigator.userAgent || '';
  const language = navigator.language || '';
  const screenRes = window.screen ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` : '0x0';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Guayaquil';

  if (!deviceId) {
    const rawFingerprint = `${ua}_${screenRes}_${language}_${timeZone}_${Date.now()}_${Math.random()}`;
    const hash = simpleHash(rawFingerprint);
    deviceId = `DEV-EC-${hash}-${Date.now().toString(36).slice(-5)}`;
    try {
      localStorage.setItem(STORAGE_KEY, deviceId);
    } catch (e) {
      console.warn('Could not persist device fingerprint to localStorage:', e);
    }
  }

  return {
    deviceId,
    deviceName: getFriendlyDeviceName(),
    userAgent: ua,
    screenResolution: screenRes,
    timeZone,
  };
}

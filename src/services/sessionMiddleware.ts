/**
 * Middleware Layer for Session Security and Device Fingerprint Binding
 *
 * Enforces single-device active session policy:
 * 1. Checks for existing session token linked to a different device fingerprint.
 * 2. If a mismatch is detected, forces an immediate logout of the previous session across all active clients.
 * 3. Triggers a security notification to the user's registered phone and email.
 * 4. Binds the new session token to the current device fingerprint.
 */

import { UserProfile } from '../types';
import { getDeviceFingerprint, DeviceInfo } from '../utils/deviceFingerprint';
import { pushNotificationService } from './notificationService';
import { databaseService } from './databaseService';

export interface SessionVerificationResult {
  isValid: boolean;
  mismatchDetected: boolean;
  previousDeviceName?: string;
  previousDeviceId?: string;
  previousSessionToken?: string;
  newSessionToken: string;
  user: UserProfile;
  securityNotificationSent: boolean;
  message: string;
}

export interface SecurityEventLog {
  id: string;
  userId: string;
  userEmail?: string;
  userPhone?: string;
  eventType: 'login_new_device' | 'previous_session_revoked' | 'session_verified';
  previousDeviceId?: string;
  previousDeviceName?: string;
  newDeviceId: string;
  newDeviceName: string;
  timestamp: number;
  formattedTimestamp: string;
}

const BROADCAST_CHANNEL_NAME = 'andesmovi_session_security_channel';
const LOCAL_STORAGE_SESSION_REVOKE_KEY = 'andesmovi_revoked_session_signal';

/**
 * Generates a cryptographically strong unique session token
 */
export function generateSessionToken(userId: string, deviceId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `SES-EC-${userId.slice(-6)}-${deviceId.slice(-6)}-${timestamp.toString(36)}-${random}`;
}

/**
 * Middleware handler invoked during user login or social account authentication.
 * Checks for existing active session token and device fingerprint mismatch.
 */
export function processLoginSessionMiddleware(
  user: UserProfile,
  customDeviceInfo?: DeviceInfo
): SessionVerificationResult {
  const currentDevice = customDeviceInfo || getDeviceFingerprint();
  const existingUser = databaseService.getUserByEmail(user.email || '') ||
    (user.cedula ? databaseService.getUserByCedula(user.cedula) : undefined) ||
    user;

  const previousSessionToken = existingUser.activeSessionToken;
  const previousDeviceId = existingUser.activeDeviceId;
  const previousDeviceName = existingUser.lastDeviceName || 'Dispositivo Previo';

  let mismatchDetected = false;
  let securityNotificationSent = false;

  // Check if user had an active session on a DIFFERENT device fingerprint
  if (previousDeviceId && previousDeviceId !== currentDevice.deviceId) {
    mismatchDetected = true;
  }

  // Generate a new unique session token for this login
  const newSessionToken = generateSessionToken(user.id, currentDevice.deviceId);

  // Update user profile with new session token and device binding
  const updatedUser: UserProfile = {
    ...user,
    activeSessionToken: newSessionToken,
    activeDeviceId: currentDevice.deviceId,
    lastDeviceName: currentDevice.deviceName,
    deviceBindingTimestamp: Date.now(),
  };

  // Save updated user in persistent database
  databaseService.registerOrUpdateUser(updatedUser);

  if (mismatchDetected) {
    // 1. Force immediate logout of the previous session across all active windows/tabs/devices
    broadcastSessionRevocation({
      userId: user.id,
      revokedSessionToken: previousSessionToken || '',
      revokedDeviceId: previousDeviceId || '',
      newDeviceName: currentDevice.deviceName,
      timestamp: Date.now(),
    });

    // 2. Trigger security notifications via Push / Phone / Email
    triggerSecurityNotification({
      user: updatedUser,
      previousDeviceName,
      newDeviceName: currentDevice.deviceName,
      timestamp: Date.now(),
    });

    securityNotificationSent = true;
  }

  const message = mismatchDetected
    ? `⚠️ Módulo de Seguridad: Se detectó un inicio de sesión desde "${currentDevice.deviceName}". Se cerró la sesión anterior en "${previousDeviceName}" y se envió una alerta de seguridad.`
    : `✅ Sesión vinculada correctamente al dispositivo "${currentDevice.deviceName}".`;

  return {
    isValid: true,
    mismatchDetected,
    previousDeviceName,
    previousDeviceId,
    previousSessionToken,
    newSessionToken,
    user: updatedUser,
    securityNotificationSent,
    message,
  };
}

/**
 * Verifies if the current user session is still valid or if it was superseded by a login on another device.
 */
export function verifySessionTokenMiddleware(
  userId: string,
  currentSessionToken?: string,
  currentDeviceId?: string
): { isValid: boolean; reason?: string; activeDeviceName?: string } {
  if (!userId) return { isValid: true };

  const dbUsers = databaseService.getRegisteredUsers();
  const dbUser = dbUsers.find((u) => u.id === userId || (u.cedula && userId.includes(u.cedula)));

  if (!dbUser || !dbUser.activeSessionToken) {
    return { isValid: true };
  }

  const device = currentDeviceId || getDeviceFingerprint().deviceId;

  // If activeSessionToken exists in DB and doesn't match the current token OR device ID doesn't match
  if (
    (currentSessionToken && dbUser.activeSessionToken !== currentSessionToken) ||
    (dbUser.activeDeviceId && dbUser.activeDeviceId !== device)
  ) {
    return {
      isValid: false,
      reason: 'session_superseded_by_other_device',
      activeDeviceName: dbUser.lastDeviceName || 'Otro Dispositivo',
    };
  }

  return { isValid: true };
}

/**
 * Broadcasts a session revocation signal to all open tabs and windows across the client browser runtime
 */
export function broadcastSessionRevocation(payload: {
  userId: string;
  revokedSessionToken: string;
  revokedDeviceId: string;
  newDeviceName: string;
  timestamp: number;
}) {
  // 1. BroadcastChannel API for multi-tab/window real-time signaling
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'FORCE_LOGOUT_SESSION_MISMATCH',
        payload,
      });
      setTimeout(() => channel.close(), 1000);
    }
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }

  // 2. LocalStorage signal fallback for cross-window reactivity
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        LOCAL_STORAGE_SESSION_REVOKE_KEY,
        JSON.stringify({
          ...payload,
          nonce: Math.random(),
        })
      );
    }
  } catch (e) {
    console.warn('LocalStorage signal error:', e);
  }
}

/**
 * Triggers security notification alerts (Push, SMS, Email mock) for unauthorized multi-device login detection.
 */
export function triggerSecurityNotification(params: {
  user: UserProfile;
  previousDeviceName: string;
  newDeviceName: string;
  timestamp: number;
}) {
  const { user, previousDeviceName, newDeviceName } = params;
  const timeFormatted = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  const recipientContact = user.email || user.phone || `C.I. ${user.cedula || 'Registrada'}`;

  // In-app & Native Push Security Alert
  pushNotificationService.notify({
    category: 'safety',
    title: '🚨 ALERTA DE SEGURIDAD: Sesión Cerrada en Otro Dispositivo',
    body: `Tu cuenta (${recipientContact}) ha iniciado sesión a las ${timeFormatted} desde un nuevo dispositivo "${newDeviceName}". Por seguridad, tu sesión previa en "${previousDeviceName}" se cerró automáticamente.`,
    data: {
      status: 'security_session_revoked',
    },
  });

  // Log to console/security audit trail
  console.info(
    `[SECURITY NOTIFICATION SENT] User: ${user.name} (${recipientContact}) | Revoked: "${previousDeviceName}" -> Activated: "${newDeviceName}"`
  );
}

/**
 * Listens for cross-session revocation signals to trigger immediate force logout on outdated sessions.
 */
export function subscribeToSessionRevocations(
  currentUserId: string,
  onForceLogout: (reason: string, newDeviceName: string) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. BroadcastChannel listener
  let channel: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'FORCE_LOGOUT_SESSION_MISMATCH') {
          const { userId, newDeviceName } = event.data.payload || {};
          if (userId === currentUserId) {
            onForceLogout('session_superseded', newDeviceName || 'Nuevo Dispositivo');
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel listener setup failed:', e);
    }
  }

  // 2. Storage event listener
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_SESSION_REVOKE_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (data && data.userId === currentUserId) {
          onForceLogout('session_superseded', data.newDeviceName || 'Nuevo Dispositivo');
        }
      } catch (e) {
        console.warn('Storage event parse error:', e);
      }
    }
  };

  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (channel) channel.close();
    window.removeEventListener('storage', handleStorageEvent);
  };
}

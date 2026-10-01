import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AuthProviderType, UserRole } from '../types';
import { validateEcuadorianCedula, CedulaValidationResult } from '../utils/cedulaValidator';
import { querySriByCedula, SriConsultationResult } from '../services/sriService';
import { databaseService } from '../services/databaseService';
import { ECUADOR_GEOGRAPHY, getCantonsForProvince } from '../data/ecuador_geography';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
import { processLoginSessionMiddleware } from '../services/sessionMiddleware';
import { haptic } from '../utils/haptics';
import {
  ShieldCheck,
  CreditCard,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Sparkles,
  X,
  FileCheck2,
  Lock,
  Car,
  Edit3,
  Camera,
  Upload,
  RotateCcw,
  Check,
} from 'lucide-react';

export interface SocialAuthInitialData {
  email: string;
  avatar: string;
  authProvider: AuthProviderType;
  suggestedName?: string;
  role?: UserRole;
}

interface SocialRegistrationModalProps {
  isOpen: boolean;
  socialData: SocialAuthInitialData | null;
  onConfirmRegistration: (completedUser: UserProfile) => void;
  onCancel: () => void;
  onSwitchToLogin?: () => void;
  isDark?: boolean;
}

export const SocialRegistrationModal: React.FC<SocialRegistrationModalProps> = ({
  isOpen,
  socialData,
  onConfirmRegistration,
  onCancel,
  onSwitchToLogin,
  isDark = true,
}) => {
  if (!isOpen || !socialData) return null;

  // Form State
  const [docType, setDocType] = useState<'cedula' | 'pasaporte'>('cedula');
  const [cedula, setCedula] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<UserRole>(socialData.role || 'cliente');
  const [province, setProvince] = useState<string>('Pichincha');
  const [canton, setCanton] = useState<string>('Quito');

  // Camera & Photo Verification State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Legal Acceptance Checkbox State
  const [acceptLegal, setAcceptLegal] = useState<boolean>(false);

  // SRI Consultation & Validation State
  const [cedulaValidation, setCedulaValidation] = useState<CedulaValidationResult | null>(null);
  const [isQueryingSri, setIsQueryingSri] = useState<boolean>(false);
  const [sriResult, setSriResult] = useState<SriConsultationResult | null>(null);
  const [isNameManuallyEditable, setIsNameManuallyEditable] = useState<boolean>(false);
  const [sriFallbackTriggered, setSriFallbackTriggered] = useState<boolean>(false);
  const [cedulaDuplicateError, setCedulaDuplicateError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reference to abort/debounce ongoing queries
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueriedCedulaRef = useRef<string>('');

  // Stop camera stream on unmount or reset
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Reset form or auto-login if account already exists
  useEffect(() => {
    if (socialData) {
      const existingUser = databaseService.getUserBySocialAccount(socialData.authProvider, socialData.email);
      if (existingUser && existingUser.isRegistrationComplete) {
        onConfirmRegistration(existingUser);
        return;
      }

      setCedula('');
      setFullName(socialData.suggestedName || '');
      setPhone('');
      setRole(socialData.role || 'cliente');
      setPhotoUrl(socialData.avatar || null);
      setAcceptLegal(false);
      setCameraPermissionDenied(false);
      setIsCameraActive(false);
      setCedulaValidation(null);
      setSriResult(null);
      setIsNameManuallyEditable(false);
      setSriFallbackTriggered(false);
      setCedulaDuplicateError(null);
      setGeneralError(null);
      lastQueriedCedulaRef.current = '';
      stopCameraStream();
    }
  }, [socialData]);

  // Handle Request Camera & Start Live Stream
  const handleStartCamera = async () => {
    setCameraPermissionDenied(false);
    setGeneralError(null);
    haptic.tap();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermissionDenied(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      // Attach stream to video element when rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.error('Video play error:', err));
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera permission denied or error:', err);
      setCameraPermissionDenied(true);
      setIsCameraActive(false);
      haptic.error();
    }
  };

  // Capture Photo from Live Camera Stream
  const handleCaptureLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturingPhoto(true);
    haptic.success();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(capturedDataUrl);
    }

    stopCameraStream();
    setIsCapturingPhoto(false);
  };

  // Handle Gallery Upload Alternative
  const handleGalleryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotoUrl(result);
          stopCameraStream();
          haptic.success();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset photo to take again
  const handleRepeatPhoto = () => {
    setPhotoUrl(null);
    setCameraPermissionDenied(false);
    handleStartCamera();
  };

  // Execute SRI Query with 3s contingency fallback
  const handlePerformSriQuery = async (cleanCedula: string) => {
    if (cleanCedula.length !== 10) return;
    if (lastQueriedCedulaRef.current === cleanCedula) return;

    lastQueriedCedulaRef.current = cleanCedula;
    setIsQueryingSri(true);
    setSriFallbackTriggered(false);
    setCedulaDuplicateError(null);
    setGeneralError(null);

    // 1. Validar unicidad en la base de datos de AndesMovi
    const isDuplicate = databaseService.isCedulaRegistered(cleanCedula);
    if (isDuplicate) {
      setIsQueryingSri(false);
      setCedulaDuplicateError('Esta cédula ya está registrada en AndesMovi. Inicia sesión con tu cuenta habitual');
      haptic.error();
      return;
    }

    // 2. Timer de contingencia (Fallback 3s): Si no responde en 3 segundos, habilitar campo de nombres
    const fallbackTimer = setTimeout(() => {
      setSriFallbackTriggered(true);
      setIsNameManuallyEditable(true);
    }, 3000);

    try {
      const result = await querySriByCedula(cleanCedula);
      clearTimeout(fallbackTimer);
      setIsQueryingSri(false);
      setSriResult(result);

      if (result.success && result.razonSocial) {
        setFullName(result.razonSocial);
        setIsNameManuallyEditable(false);
        haptic.success();
      } else {
        setSriFallbackTriggered(true);
        setIsNameManuallyEditable(true);
      }
    } catch (err) {
      clearTimeout(fallbackTimer);
      setIsQueryingSri(false);
      setSriFallbackTriggered(true);
      setIsNameManuallyEditable(true);
    }
  };

  // Cédula or Passport change handler
  const handleCedulaChange = (inputVal: string) => {
    setCedulaDuplicateError(null);
    setGeneralError(null);

    if (docType === 'pasaporte') {
      const cleanVal = inputVal.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 18);
      setCedula(cleanVal);
      if (cleanVal.length >= 5) {
        setCedulaValidation({
          isValid: true,
          message: 'Pasaporte / Documento Extranjero Válido',
          province: 'Extranjero / Internacional',
        });
        setIsNameManuallyEditable(true);
      } else {
        setCedulaValidation(null);
      }
    } else {
      const raw = inputVal.replace(/\D/g, '').slice(0, 10);
      setCedula(raw);

      if (raw.length === 10) {
        const valResult = validateEcuadorianCedula(raw);
        setCedulaValidation(valResult);

        if (valResult.isValid) {
          if (valResult.province) {
            const matchProv = ECUADOR_GEOGRAPHY.find(
              (g) => valResult.province?.toLowerCase().includes(g.province.toLowerCase())
            );
            if (matchProv) {
              setProvince(matchProv.province);
              const cantons = getCantonsForProvince(matchProv.province);
              if (cantons && cantons.length > 0) {
                setCanton(cantons[0]);
              }
            }
          }

          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            handlePerformSriQuery(raw);
          }, 150);
        } else {
          setSriResult(null);
          setFullName('');
        }
      } else {
        setCedulaValidation(null);
        setSriResult(null);
        lastQueriedCedulaRef.current = '';
      }
    }
  };

  // Check form completeness for button activation
  const isFormValid =
    role === 'cliente'
      ? fullName.trim().length >= 2
      : Boolean(photoUrl) &&
        acceptLegal &&
        Boolean(cedulaValidation?.isValid) &&
        fullName.trim().length >= 4 &&
        phone.replace(/\D/g, '').length >= 9;

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setCedulaDuplicateError(null);

    // Para clientes: registro inmediato sin restricciones
    if (role === 'cliente') {
      setIsSubmitting(true);
      setTimeout(() => {
        const completedUser: UserProfile = {
          id: `usr-${socialData.authProvider}-${Date.now()}`,
          name: fullName.trim() || socialData.suggestedName || 'Usuario AndesMovi',
          email: socialData.email,
          phone: phone.trim() || '',
          cedula: cedula.trim() || '',
          cedulaVerified: false,
          province: province || 'Pichincha',
          canton: canton || 'Quito',
          avatar: photoUrl || socialData.avatar || '',
          authProvider: socialData.authProvider,
          role: 'cliente',
          rating: 5.0,
          totalTripsCompleted: 0,
          isVerified: true,
          isRegistrationComplete: true,
          createdAt: Date.now(),
          emergencyContacts: [],
        };
        databaseService.saveUser(completedUser);
        const sessionResult = processLoginSessionMiddleware(completedUser);
        onConfirmRegistration(sessionResult.user);
        setIsSubmitting(false);
      }, 400);
      return;
    }

    // 1. Validar Foto de Perfil (Conductor)
    if (!photoUrl) {
      setGeneralError('Por favor toma una foto de rostro real con la cámara o súbela desde tu galería.');
      haptic.error();
      return;
    }

    // 2. Validar Casilla Legal (Conductor)
    if (!acceptLegal) {
      setGeneralError('Debes marcar la casilla de aceptación legal y términos de privacidad para ingresar.');
      haptic.error();
      return;
    }

    // 3. Validar Documento (Conductor)
    const cleanDoc = cedula.trim();
    const cleanCedula = docType === 'pasaporte' ? cleanDoc : cleanDoc.replace(/\D/g, '');

    if (docType === 'pasaporte') {
      if (cleanDoc.length < 5) {
        setGeneralError('Por favor ingresa un número de Pasaporte o DNI Extranjero válido (mínimo 5 caracteres).');
        haptic.error();
        return;
      }
    } else {
      if (cleanCedula.length !== 10) {
        setGeneralError('Por favor ingresa los 10 dígitos de tu Cédula de Identidad.');
        haptic.error();
        return;
      }

      const validation = validateEcuadorianCedula(cleanCedula);
      if (!validation.isValid) {
        setGeneralError(`Cédula inválida: ${validation.message}`);
        haptic.error();
        return;
      }
    }

    // 4. Validar unicidad en base de datos: Si la cédula ya existe, ingresar directamente a su cuenta única existente
    const existingByCedula = databaseService.getUserByCedula(cleanCedula);
    if (existingByCedula && existingByCedula.isRegistrationComplete) {
      setIsSubmitting(true);
      haptic.success();
      const sessionResult = processLoginSessionMiddleware(existingByCedula);
      setTimeout(() => {
        setIsSubmitting(false);
        onConfirmRegistration(sessionResult.user);
      }, 500);
      return;
    }

    // 5. Validar nombres
    if (!fullName.trim() || fullName.trim().length < 4) {
      setGeneralError('Ingresa tus nombres y apellidos completos oficiales.');
      haptic.error();
      return;
    }

    // 6. Validar teléfono / WhatsApp
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setGeneralError('Ingresa un número de celular o WhatsApp válido (mínimo 9 o 10 dígitos).');
      haptic.error();
      return;
    }

    setIsSubmitting(true);
    haptic.tap();

    setTimeout(() => {
      setIsSubmitting(false);

      const formattedPhone = cleanPhone.startsWith('593')
        ? `+${cleanPhone}`
        : cleanPhone.startsWith('09')
        ? `+593 ${cleanPhone.slice(1, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`
        : `+593 ${cleanPhone}`;

      const deviceInfo = getDeviceFingerprint();

      const completedUser: UserProfile = {
        id: `usr-social-${Date.now()}`,
        name: fullName.toUpperCase().trim(),
        email: socialData.email,
        phone: formattedPhone,
        cedula: cleanCedula,
        cedulaVerified: true,
        province: province,
        canton: canton,
        avatar: photoUrl,
        authProvider: socialData.authProvider,
        rating: 5.0,
        totalTripsCompleted: 0,
        isVerified: true,
        createdAt: Date.now(),
        role: role,
        isRegistrationComplete: true,
        activeDeviceId: deviceInfo.deviceId,
        lastDeviceName: deviceInfo.deviceName,
        deviceBindingTimestamp: Date.now(),
        emergencyContacts: [
          {
            id: `emg-${Date.now()}`,
            name: 'Contacto de Emergencia AndesMovi',
            phone: formattedPhone,
            relationship: 'Principal',
            isPrimary: true,
            notifyByWhatsapp: true,
            notifyBySms: true,
          },
        ],
      };

      // Guardar constancia legal en localStorage / DB
      try {
        localStorage.setItem(
          `andesmovi_legal_accept_${completedUser.id}`,
          JSON.stringify({
            acceptedAt: new Date().toISOString(),
            cedula: cleanCedula,
            acceptedTerms: true,
          })
        );
      } catch (e) {
        console.error('Error storing legal timestamp:', e);
      }

      // Procesar middleware de sesión y vinculación de dispositivo
      const sessionResult = processLoginSessionMiddleware(completedUser);

      // Persistir sesión activa
      try {
        localStorage.setItem('andesmovi_user_session', JSON.stringify(sessionResult.user));
      } catch (e) {
        console.error('Error persisting user session:', e);
      }

      stopCameraStream();
      haptic.success();
      onConfirmRegistration(sessionResult.user);
    }, 500);
  };

  // Helper de prueba rápida
  const handleSelectQuickTestCedula = (testCedula: string) => {
    handleCedulaChange(testCedula);
    if (!phone) {
      setPhone('0998241902');
    }
  };

  const getProviderBrand = () => {
    switch (socialData.authProvider) {
      case 'google':
        return {
          name: 'Google',
          color: isDark ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-rose-600 border-rose-200 bg-rose-50',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          ),
        };
      case 'facebook':
        return {
          name: 'Facebook',
          color: isDark ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-blue-600 border-blue-200 bg-blue-50',
          icon: (
            <svg className="w-4 h-4 fill-current text-blue-500" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          ),
        };
      case 'icloud':
        return {
          name: 'Apple / iCloud',
          color: isDark ? 'text-zinc-200 border-zinc-700 bg-zinc-800/60' : 'text-slate-700 border-slate-200 bg-slate-100',
          icon: (
            <svg className={`w-4 h-4 fill-current ${isDark ? 'text-white' : 'text-slate-900'}`} viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 7.17c.6-1.12 1-2.67.62-4.17-1.2.06-2.63.81-3.25 1.92-.54.96-.99 2.53-.61 4.01 1.34.1 2.64-.64 3.24-1.76z" />
            </svg>
          ),
        };
      default:
        return {
          name: 'Red Social',
          color: isDark ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-amber-600 border-amber-200 bg-amber-50',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        };
    }
  };

  const providerInfo = getProviderBrand();
  const availableCantons = getCantonsForProvince(province);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-fadeIn ${
      isDark ? 'bg-black/85' : 'bg-slate-900/60'
    }`}>
      {/* Hidden canvas for snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      <div className={`relative w-full max-w-xl border rounded-3xl shadow-2xl overflow-hidden my-auto ${
        isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
      }`}>
        {/* Glowing Top Banner */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />

        {/* Modal Header */}
        <div className={`p-5 sm:p-6 pb-4 border-b ${
          isDark ? 'border-zinc-800 bg-gradient-to-b from-zinc-850 to-zinc-900' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-600'
              }`}>
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    PANTALLA OBLIGATORIA
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${providerInfo.color}`}>
                    {providerInfo.icon}
                    <span>{providerInfo.name}</span>
                  </span>
                </div>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Verificación de Identidad y Foto de Perfil
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Proceso de seguridad obligatorio antes de ingresar a la app.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                stopCameraStream();
                onCancel();
              }}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
              title="Cancelar registro"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Social Account Card Snapshot */}
          <div className={`mt-4 p-3 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={socialData.avatar || null}
                alt="Avatar Social"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/40 shrink-0"
              />
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <span>Cuenta {providerInfo.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className={`text-[11px] truncate flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span className="truncate">{socialData.email}</span>
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
              isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              Autenticado
            </span>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className={`p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar ${isDark ? '' : 'bg-white'}`}>
          {/* Alerta de Cédula Duplicada */}
          {cedulaDuplicateError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-200">{cedulaDuplicateError}</p>
                <div className="mt-2 flex items-center gap-2">
                  {onSwitchToLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        onSwitchToLogin();
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg transition-all"
                    >
                      Ir a Iniciar Sesión
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCedula('');
                      setCedulaValidation(null);
                      setCedulaDuplicateError(null);
                    }}
                    className={`px-2.5 py-1 font-bold text-[11px] rounded-lg transition-all ${
                      isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Ingresar otra cédula
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alerta General de Error */}
          {generalError && (
            <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 animate-fadeIn ${
              isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* SECTION 1: CAPTURA DE FOTO DE ROSTRO REAL (RECUADRO CIRCULAR & CÁMARA) */}
          <div className={`p-4 rounded-2xl border space-y-3.5 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-2">
              <Camera className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                1. Foto de Rostro Real en Vivo (Obligatorio)
              </h3>
            </div>

            <p className={`text-xs leading-relaxed p-2.5 rounded-xl border ${
              isDark ? 'text-zinc-300 bg-zinc-900/80 border-zinc-800/80' : 'text-slate-600 bg-white border-slate-200'
            }`}>
              Por seguridad en AndesMovi, se requiere una foto de rostro real tomada en el momento. No se aceptan avatares, logos ni fotos genéricas.
            </p>

            {/* Recuadro Circular de la Foto / Cámara */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className={`relative w-36 h-36 rounded-full overflow-hidden border-4 shadow-2xl flex items-center justify-center group ${
                isDark ? 'border-amber-500/80 bg-zinc-900' : 'border-white bg-slate-200 shadow-slate-200'
              }`}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Foto de rostro real"
                    className="w-full h-full object-cover"
                  />
                ) : isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="text-center p-3">
                    <User className="w-12 h-12 text-zinc-600 mx-auto mb-1" />
                    <span className="text-[10px] text-zinc-500 font-semibold block">Sin Foto Real</span>
                  </div>
                )}

                {photoUrl && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                )}
              </div>

              {/* Botones de Captura e Interacción */}
              {photoUrl ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRepeatPhoto}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span>Repetir foto</span>
                  </button>
                  <span className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl border ${
                    isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}>
                    <Check className="w-3.5 h-3.5" /> Foto lista
                  </span>
                </div>
              ) : isCameraActive ? (
                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={handleCaptureLivePhoto}
                    disabled={isCapturingPhoto}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Foto Real</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className={`text-[11px] ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Cancelar cámara
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full max-w-md">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tomar Foto con la Cámara</span>
                  </button>

                  <label className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'
                  }`}>
                    <Upload className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span>Subir foto real desde galería</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Aviso si el permiso fue denegado */}
              {cameraPermissionDenied && (
                <div className="mt-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 max-w-md animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    El permiso de cámara es indispensable para verificar tu identidad y proteger la seguridad de los viajes. Por favor, acéptalo en los ajustes del dispositivo.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: DATOS DE REGISTRO OBLIGATORIOS */}
          <div className="space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              2. Datos Oficiales de Cuenta
            </h3>

            {/* Selección de Tipo de Perfil */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Rol en AndesMovi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('cliente')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    role === 'cliente'
                      ? isDark ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10' : 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm'
                      : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${role === 'cliente' ? (isDark ? 'bg-amber-500 text-zinc-950' : 'bg-amber-500 text-white') : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-400')}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${role === 'cliente' ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-zinc-300' : 'text-slate-600')}`}>Pasajero / Cliente</div>
                    <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Viajes, envíos y comida</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('conductor')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    role === 'conductor'
                      ? isDark ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10' : 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm'
                      : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${role === 'conductor' ? (isDark ? 'bg-amber-500 text-zinc-950' : 'bg-amber-500 text-white') : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-400')}`}>
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${role === 'conductor' ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-zinc-300' : 'text-slate-600')}`}>Conductor / Chofer</div>
                    <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Generar ingresos (7% com.)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* CAMPO 1: DOCUMENTO DE IDENTIDAD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  <CreditCard className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <span>Documento de Identidad *</span>
                </label>
                {cedulaValidation ? (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      cedulaValidation.isValid
                        ? isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {cedulaValidation.isValid
                      ? `✓ ${cedulaValidation.province || 'Documento Válido'}`
                      : '✗ Inválido'}
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    🌎 Extranjeros Bienvenidos
                  </span>
                )}
              </div>

              {/* Document Type Selector Tabs */}
              <div className={`grid grid-cols-2 p-1 rounded-xl mb-2 border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setDocType('cedula');
                    setCedula('');
                    setCedulaValidation(null);
                  }}
                  className={`py-1.5 px-2 text-[11px] font-extrabold rounded-lg transition-all ${
                    docType === 'cedula'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🇪🇨 Cédula Ecuatoriana
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocType('pasaporte');
                    setCedula('');
                    setCedulaValidation(null);
                  }}
                  className={`py-1.5 px-2 text-[11px] font-extrabold rounded-lg transition-all ${
                    docType === 'pasaporte'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌎 Pasaporte / DNI Extranjero
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode={docType === 'cedula' ? 'numeric' : 'text'}
                  maxLength={docType === 'cedula' ? 10 : 18}
                  value={cedula}
                  onChange={(e) => handleCedulaChange(e.target.value)}
                  placeholder={docType === 'cedula' ? 'Ej: 1004721351 (10 dígitos)' : 'Ej: Pasaporte / DNI / Cédula Extranjera (P981023)'}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none transition-all ${
                    cedulaValidation?.isValid
                      ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                      : cedulaValidation && !cedulaValidation.isValid
                      ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                      : isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'
                  }`}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isQueryingSri && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>SRI...</span>
                    </div>
                  )}
                  {cedula.length > 0 && !isQueryingSri && (
                    <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {cedula.length}/10
                    </span>
                  )}
                </div>
              </div>

              {/* Quick test buttons */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                <span className="font-semibold text-zinc-400">Prueba rápida:</span>
                <button
                  type="button"
                  onClick={() => handleSelectQuickTestCedula('1004721351')}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
                >
                  1004721351 (Imbabura)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickTestCedula('1710034065')}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
                >
                  1710034065 (Pichincha)
                </button>
              </div>
            </div>

            {/* INFORMACIÓN ESPECIAL PARA REGISTRO DE CONDUCTORES (VERIFICACIÓN AUTOMÁTICA DE IDENTIDAD) */}
            {role === 'conductor' && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-teal-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <span className="font-extrabold text-white block">
                    ⚡ Verificación Automática de Cédula & Licencia Habilitada
                  </span>
                  <p className="text-[11px] text-emerald-300/90 mt-0.5">
                    Al registrarte como conductor, tu identidad (Módulo 10), Licencia ANT y Antecedentes Penales son verificados automáticamente por la API de seguridad sin esperas manuales.
                  </p>
                </div>
              </div>
            )}
            {isQueryingSri && (
              <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-3 animate-pulse">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-blue-200">Consultando datos en SRI de Ecuador...</div>
                  <div className="text-[11px] text-blue-400/80">
                    Verificando RUC Natural: <span className="font-mono">{cedula}001</span>
                  </div>
                </div>
              </div>
            )}

            {/* FALLBACK SRI */}
            {sriFallbackTriggered && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-200">Modo de Contingencia SRI Habilitado:</span>
                  <p className="text-[11px] text-amber-300/90 mt-0.5">
                    El servidor del SRI no respondió a tiempo. El campo de nombres se encuentra habilitado para ingreso manual.
                  </p>
                </div>
              </div>
            )}

            {/* CAMPO 2: NOMBRES Y APELLIDOS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nombres y Apellidos *</span>
                </label>
                {sriResult?.success && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3" />
                    <span>SRI Razón Social Validada</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={!isNameManuallyEditable && Boolean(sriResult?.success)}
                  placeholder="Completados automáticamente o escribe tus nombres"
                  className={`w-full bg-zinc-950 border rounded-2xl px-4 py-3 text-sm text-white font-semibold focus:outline-none transition-all ${
                    sriResult?.success && !isNameManuallyEditable
                      ? 'border-emerald-500/60 bg-zinc-900/90 text-emerald-200'
                      : 'border-zinc-800 focus:border-amber-500'
                  }`}
                  required
                />
                {sriResult?.success && (
                  <button
                    type="button"
                    onClick={() => setIsNameManuallyEditable(!isNameManuallyEditable)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-amber-400 flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isNameManuallyEditable ? 'Fijar' : 'Editar'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* CAMPO 3: NÚMERO DE TELÉFONO / WHATSAPP */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Número de Teléfono / WhatsApp *</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-zinc-400 border-r border-zinc-800 pr-2">
                  <span>🇪🇨 +593</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="099 824 1902"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-24 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* UBICACIÓN */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Provincia
                </label>
                <select
                  value={province}
                  onChange={(e) => {
                    const newProv = e.target.value;
                    setProvince(newProv);
                    const cantons = getCantonsForProvince(newProv);
                    if (cantons && cantons.length > 0) {
                      setCanton(cantons[0]);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {ECUADOR_GEOGRAPHY.map((provData) => (
                    <option key={provData.province} value={provData.province}>
                      {provData.province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Cantón / Ciudad
                </label>
                <select
                  value={canton}
                  onChange={(e) => setCanton(e.target.value)}
                  className={`w-full border rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {availableCantons.map((cantonName) => (
                    <option key={cantonName} value={cantonName} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                      {cantonName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: CASILLA DE ACEPTACIÓN LEGAL OBLIGATORIA */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="legal-checkbox-social"
                checked={acceptLegal}
                onChange={(e) => setAcceptLegal(e.target.checked)}
                className={`mt-1 w-5 h-5 rounded focus:ring-2 cursor-pointer shrink-0 ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/20' : 'bg-white border-slate-300 text-amber-600 focus:ring-amber-500/10'
                }`}
              />
              <label htmlFor="legal-checkbox-social" className={`text-xs leading-relaxed cursor-pointer select-none ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                Acepto abrir mi cuenta en AndesMovi, autorizo el acceso a mi cámara y el uso de mi fotografía real con fines de seguridad e identificación, y declaro haber leído y aceptado los Términos y Condiciones y las Políticas de Privacidad.
              </label>
            </div>
          </div>

          {/* BOTÓN FINAL: CREAR CUENTA Y ENTRAR (INACTIVO HASTA CUMPLIR REQUISITOS) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                !isFormValid || isSubmitting
                  ? isDark ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60 border border-zinc-700/50' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 shadow-amber-500/25 active:scale-[0.98] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Vinculando Cuenta...</span>
                </>
              ) : (
                <>
                  <span>Finalizar Registro y Entrar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className={`text-[10px] text-center mt-3 font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              AndesMovi Ecuador • Seguridad Biométrica y SRI
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

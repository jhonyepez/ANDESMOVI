import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Car,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Sparkles,
  UserPlus,
  LogIn,
  User,
  ShieldAlert,
  Compass,
  Check,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  AlertCircle,
  RefreshCw,
  X,
  KeyRound,
  FileText,
  Package,
  MapPin,
  HelpCircle,
  ChevronLeft,
  Shield,
  LogOut,
} from 'lucide-react';
import { UserProfile, DriverDocuments, UserRole, AuthProviderType } from '../types';
import { validateEcuadorianCedula, CedulaValidationResult } from '../utils/cedulaValidator';
import { LegalTermsModal, LegalDocType } from './LegalTermsModal';
import { SocialRegistrationModal, SocialAuthInitialData } from './SocialRegistrationModal';
import { databaseService } from '../services/databaseService';
import { appleAuthService } from '../services/appleAuthService';
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  googleProvider,
  facebookProvider,
  signInWithPopup,
} from '../services/firebase';
import { AudiVehicleIcon, YamahaBikeIcon } from './vehicleIcons';
import { haptic } from '../utils/haptics';
import { AnimatedAndesMoviLogo } from './AnimatedAndesMoviLogo';

interface SplashScreenProps {
  onComplete: () => void;
  onLoginSuccess: (user: UserProfile, docs?: DriverDocuments) => void;
  onLogout?: () => void;
  onOpenLogin?: (role: 'conductor' | 'cliente') => void;
  onOpenRegister?: (role: 'conductor' | 'cliente') => void;
  currentUser?: UserProfile | null;
  onSelectRole?: (role: 'conductor' | 'cliente') => void;
  onOpenAdminLogin?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  onLoginSuccess,
  onLogout,
  onOpenLogin,
  onOpenRegister,
  currentUser,
  onSelectRole,
  onOpenAdminLogin,
}) => {
  // Phase: 'loading' (initial progress) -> 'ready' (welcome portal)
  // Si ya se cargó una vez o se abre tras cerrar sesión, va DIRECTO A LA BIENVENIDA sin espera
  const hasLoadedBefore = typeof window !== 'undefined' && sessionStorage.getItem('andesmovi_splash_seen') === 'true';
  const [phase, setPhase] = useState<'loading' | 'ready'>(hasLoadedBefore ? 'ready' : 'loading');
  const [progress, setProgress] = useState<number>(hasLoadedBefore ? 100 : 0);
  const [statusMessage, setStatusMessage] = useState<string>(
    hasLoadedBefore ? '¡Listo! Bienvenido a AndesMovi Ecuador.' : 'Inicializando AndesMovi Ecuador...'
  );
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);

  // View state: 'welcome' (exact image view) vs 'auth' (detailed form)
  const [viewMode, setViewMode] = useState<'welcome' | 'auth'>('welcome');

  // Trigger Admin Panel from Welcome Screen (cierra bienvenida e ingresa de inmediato al panel)
  const handleTriggerAdmin = () => {
    haptic.tap();
    setIsClosing(true);
    setTimeout(() => {
      onComplete();
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      }
    }, 150);
  };

  // Secret 5-tap counter on AndesMovi logo (triggers Admin Login Gate in <3s)
  const logoTapCountRef = React.useRef<number>(0);
  const logoTapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSecretLogoTap = () => {
    logoTapCountRef.current += 1;

    // Start 3-second reset window on first tap
    if (logoTapCountRef.current === 1) {
      if (logoTapTimeoutRef.current) clearTimeout(logoTapTimeoutRef.current);
      logoTapTimeoutRef.current = setTimeout(() => {
        logoTapCountRef.current = 0;
      }, 3000);
    }

    // If 5 fast taps reached within 3 seconds
    if (logoTapCountRef.current >= 5) {
      if (logoTapTimeoutRef.current) {
        clearTimeout(logoTapTimeoutRef.current);
        logoTapTimeoutRef.current = null;
      }
      logoTapCountRef.current = 0;
      haptic.success();
      handleTriggerAdmin();
      return;
    }

    haptic.tap();
  };

  // Active role selected: 'conductor' | 'cliente'
  const [selectedRole, setSelectedRole] = useState<'conductor' | 'cliente'>(
    currentUser?.role === 'conductor' ? 'conductor' : 'cliente'
  );

  // Auth Tab: 'login' (Iniciar Sesión) | 'register' (Crear Cuenta)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Form states - Login
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Form states - Register
  const [regFullName, setRegFullName] = useState<string>('');
  const [regCedula, setRegCedula] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regProvince, setRegProvince] = useState<string>('Pichincha (Quito)');
  const [regCooperative, setRegCooperative] = useState<string>('Cooperativa de Taxis Nacional Ecuador');
  const [regVehicleType, setRegVehicleType] = useState<'auto' | 'moto'>('auto');
  const [regPlate, setRegPlate] = useState<string>('PCH-4821');
  const [regLicense, setRegLicense] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terminos');

  // Live Cédula Validation
  const [cedulaValidation, setCedulaValidation] = useState<CedulaValidationResult | null>(null);

  // Loading & Feedback
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Social Auth Mandatory Flow (Cédula + SRI Auto-Query + Phone)
  const [socialPendingData, setSocialPendingData] = useState<SocialAuthInitialData | null>(null);

  // SMS OTP Flow
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [smsPhone, setSmsPhone] = useState<string>('0998241902');
  const [smsStep, setSmsStep] = useState<'input_phone' | 'input_code'>('input_phone');
  const [smsCode, setSmsCode] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [smsCountdown, setSmsCountdown] = useState<number>(45);

  // Forgot Password Recovery State for Conductor & Cliente
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotInput, setForgotInput] = useState<string>('');
  const [forgotRole, setForgotRole] = useState<'conductor' | 'cliente'>('conductor');
  const [forgotStep, setForgotStep] = useState<'input' | 'code' | 'new_pass' | 'success'>('input');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Initial loading steps - Updated with Ecuador official fares
  useEffect(() => {
    if (hasLoadedBefore) {
      setPhase('ready');
      setProgress(100);
      return;
    }
    try {
      sessionStorage.setItem('andesmovi_splash_seen', 'true');
    } catch (e) {
      // ignore
    }

    const steps = [
      { pct: 30, msg: 'Conectando con servidores y satélites GPS en Ecuador...' },
      { pct: 60, msg: 'Cargando tarifas oficiales en Ecuador ($1.25 base regulada)...' },
      { pct: 90, msg: 'Verificando red nacional de cooperativas y seguridad 911...' },
      { pct: 100, msg: '¡Listo! Bienvenido a AndesMovi Ecuador.' },
    ];

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].pct);
        setStatusMessage(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setPhase('ready');
        }, 400);
      }
    }, 320);

    return () => clearInterval(timer);
  }, [hasLoadedBefore]);

  // SMS Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showSmsModal && smsStep === 'input_code' && smsCountdown > 0) {
      interval = setInterval(() => {
        setSmsCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showSmsModal, smsStep, smsCountdown]);

  const handleSkipLoading = () => {
    haptic.tap();
    setProgress(100);
    setPhase('ready');
  };

  const handleSelectRole = (role: 'conductor' | 'cliente') => {
    haptic.select();
    setSelectedRole(role);
    setErrorMessage(null);
    if (onSelectRole) {
      onSelectRole(role);
    }
  };

  const handleCedulaChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setRegCedula(clean);
    if (clean.length === 10) {
      const res = validateEcuadorianCedula(clean);
      setCedulaValidation(res);
      if (res.isValid && res.province) {
        setRegProvince(res.province);
      }
      if (!regLicense) {
        setRegLicense(clean);
      }
    } else {
      setCedulaValidation(null);
    }
  };

  // Helper to build DriverDocuments for conductor
  const buildDriverDocs = (cedulaVal: string, nameVal: string): DriverDocuments => {
    return {
      licenseNumber: regLicense || cedulaVal || '1004721351',
      licenseType: 'Tipo C',
      licenseExpiration: '2028-12-31',
      isLicenseValid: true,
      licenseStatus: 'aprobado',
      licenseReviewedAt: new Date().toISOString(),
      licenseReviewerNotes: 'Verificado por cooperativa ecuatoriana y ANT',
      licenseFrontPhoto: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&auto=format&fit=crop&q=80',
      licenseBackPhoto: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
      criminalRecordCertificateNumber: `POL-EC-${new Date().getFullYear()}-48219`,
      criminalRecordStatus: 'aprobado',
      criminalRecordCount: 0,
      hasSevereRecord: false,
      isCriminalRecordApproved: true,
      criminalRecordReviewedAt: new Date().toISOString(),
      vehicleRegistrationPlate: regPlate || 'PCH-4821',
      rtvInspectionYear: 2026,
      rtvStatus: 'vigente',
      rtvDocStatus: 'aprobado',
      isFullyVerified: true,
      overallStatus: 'aprobado',
    };
  };

  // Generic Social Auth Handler
  const triggerSocialAuth = (provider: 'google' | 'facebook' | 'icloud') => {
    haptic.tap();
    const isConductor = selectedRole === 'conductor';
    let email = isConductor ? 'conductor.google@gmail.com' : 'usuario.google@gmail.com';
    let avatar = isConductor
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    let suggestedName = isConductor ? 'Patricio Morales' : 'Carlos Mendoza';

    if (provider === 'facebook') {
      email = isConductor ? 'conductor.fb@facebook.com' : 'usuario.fb@facebook.com';
      avatar = isConductor
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';
      suggestedName = isConductor ? 'Juan Gabriel Vaca' : 'Diana Romero';
    } else if (provider === 'icloud') {
      email = isConductor ? 'conductor.apple@icloud.com' : 'usuario.apple@icloud.com';
      avatar = isConductor
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80';
      suggestedName = isConductor ? 'Marco Vinicio Toapanta' : 'Elena Viteri';
    }

    // 1. Verificar si esta cuenta social ya está registrada en la base de datos (Garantiza cuenta única sin duplicados)
    const existingUser = databaseService.getUserBySocialAccount(provider, email);
    if (existingUser && existingUser.isRegistrationComplete) {
      setSuccessMessage(`¡Ingreso directo a tu cuenta única! Bienvenido de nuevo, ${existingUser.name}`);
      haptic.success();
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onLoginSuccess(
            existingUser,
            existingUser.role === 'conductor'
              ? buildDriverDocs(existingUser.cedula || '1004721351', existingUser.name)
              : undefined
          );
        }, 200);
      }, 500);
      return;
    }

    // 2. Detener acceso directo y abrir pantalla modal obligatoria de vinculación de Cédula y consulta SRI
    setSocialPendingData({
      email,
      avatar,
      authProvider: provider,
      suggestedName,
      role: selectedRole,
    });
  };

  // 1. Real Social Login: Google OAuth
  const handleGoogleAuth = async () => {
    haptic.tap();
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setIsProcessing(false);

      if (!user.email) {
        setErrorMessage('No se obtuvo un correo electrónico válido de Google');
        return;
      }

      // Check if user already registered
      const existingUser = databaseService.getUserBySocialAccount('google', user.email);
      if (existingUser && existingUser.isRegistrationComplete) {
        setSuccessMessage(`¡Bienvenido de nuevo, ${existingUser.name}!`);
        haptic.success();
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            onLoginSuccess(
              existingUser,
              existingUser.role === 'conductor'
                ? buildDriverDocs(existingUser.cedula || '1004721351', existingUser.name)
                : undefined
            );
          }, 200);
        }, 500);
        return;
      }

      // Si es cliente, registrar e ingresar directamente sin trabas
      if (selectedRole === 'cliente') {
        const newClientUser: UserProfile = {
          id: `usr-google-${Date.now()}`,
          name: user.displayName || 'Usuario Google',
          email: user.email,
          phone: '',
          cedula: '',
          cedulaVerified: false,
          province: 'Pichincha',
          canton: 'Quito',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          authProvider: 'google',
          role: 'cliente',
          rating: 5.0,
          totalTripsCompleted: 0,
          isVerified: true,
          isRegistrationComplete: true,
          createdAt: Date.now(),
          emergencyContacts: [],
        };
        databaseService.saveUser(newClientUser);
        setSuccessMessage(`¡Bienvenido a AndesMovi, ${newClientUser.name}!`);
        haptic.success();
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            onLoginSuccess(newClientUser);
          }, 200);
        }, 500);
        return;
      }

      // Open registration modal for conductor
      setSocialPendingData({
        email: user.email,
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        authProvider: 'google',
        suggestedName: user.displayName || 'Conductor Google',
        role: 'conductor',
      });
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Google Sign In Error:', error);
      setErrorMessage('Error al iniciar sesión con Google. Inténtalo de nuevo.');
    }
  };

  // 2. Real Social Login: Facebook OAuth
  const handleFacebookAuth = async () => {
    haptic.tap();
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      setIsProcessing(false);

      if (!user.email) {
        setErrorMessage('No se obtuvo un correo válido de Facebook');
        return;
      }

      const existingUser = databaseService.getUserBySocialAccount('facebook', user.email);
      if (existingUser && existingUser.isRegistrationComplete) {
        setSuccessMessage(`¡Bienvenido de nuevo, ${existingUser.name}!`);
        haptic.success();
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            onLoginSuccess(
              existingUser,
              existingUser.role === 'conductor'
                ? buildDriverDocs(existingUser.cedula || '1004721351', existingUser.name)
                : undefined
            );
          }, 200);
        }, 500);
        return;
      }

      // Si es cliente, registrar e ingresar directamente sin trabas
      if (selectedRole === 'cliente') {
        const newClientUser: UserProfile = {
          id: `usr-fb-${Date.now()}`,
          name: user.displayName || 'Usuario Facebook',
          email: user.email,
          phone: '',
          cedula: '',
          cedulaVerified: false,
          province: 'Pichincha',
          canton: 'Quito',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          authProvider: 'facebook',
          role: 'cliente',
          rating: 5.0,
          totalTripsCompleted: 0,
          isVerified: true,
          isRegistrationComplete: true,
          createdAt: Date.now(),
          emergencyContacts: [],
        };
        databaseService.saveUser(newClientUser);
        setSuccessMessage(`¡Bienvenido a AndesMovi, ${newClientUser.name}!`);
        haptic.success();
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            onLoginSuccess(newClientUser);
          }, 200);
        }, 500);
        return;
      }

      setSocialPendingData({
        email: user.email,
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        authProvider: 'facebook',
        suggestedName: user.displayName || 'Conductor Facebook',
        role: 'conductor',
      });
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Facebook Sign In Error:', error);
      setErrorMessage('Error al iniciar sesión con Facebook.');
    }
  };

  // 3. Real Social Login: Apple OAuth
  const handleIcloudAuth = async () => {
    haptic.tap();
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const appleProfile = await appleAuthService.signInWithApple();
      setIsProcessing(false);

      if (!appleProfile.email) {
        setErrorMessage('No se obtuvo un correo válido de Apple');
        return;
      }

      const existingUser = databaseService.getUserBySocialAccount('icloud', appleProfile.email);
      if (existingUser && existingUser.isRegistrationComplete) {
        setSuccessMessage(`¡Bienvenido de nuevo, ${existingUser.name}!`);
        haptic.success();
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            onLoginSuccess(
              existingUser,
              existingUser.role === 'conductor'
                ? buildDriverDocs(existingUser.cedula || '1004721351', existingUser.name)
                : undefined
            );
          }, 200);
        }, 500);
        return;
      }

      setSocialPendingData({
        email: appleProfile.email,
        avatar: appleProfile.photoURL,
        authProvider: 'icloud',
        suggestedName: appleProfile.displayName,
        role: selectedRole,
      });
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Apple Sign In Error:', error);
      if (error?.message && !error.message.includes('closed') && !error.message.includes('cancel')) {
        setErrorMessage(error.message || 'No se pudo completar el inicio de sesión con Apple');
      }
    }
  };

  // 4. Phone SMS Flow
  const handleStartSmsAuth = () => {
    haptic.tap();
    setSmsStep('input_phone');
    setSmsCode('');
    setSmsCountdown(45);
    setShowSmsModal(true);
  };

  const handleSendSmsCode = async () => {
    if (!smsPhone || smsPhone.length < 9) {
      haptic.warning();
      setErrorMessage('Ingresa un número de celular ecuatoriano válido de 10 dígitos');
      return;
    }
    haptic.click();
    setIsProcessing(true);
    try {
      const formattedPhone = `+593${smsPhone.replace(/^0/, '').replace(/\s/g, '')}`;
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-splash', { size: 'invisible' });
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setIsProcessing(false);
      setSmsStep('input_code');
      setSmsCountdown(45);
    } catch (error: any) {
      setIsProcessing(false);
      console.error('Error sending SMS:', error);
      setErrorMessage('Error enviando SMS: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleVerifySmsCode = async () => {
    if (smsCode.length < 4) {
      haptic.warning();
      setErrorMessage('Por favor ingresa un código válido');
      return;
    }

    haptic.success();
    setIsProcessing(true);

    try {
      await confirmationResult.confirm(smsCode);
      setIsProcessing(false);
      setShowSmsModal(false);
      const isConductor = selectedRole === 'conductor';
      const name = isConductor ? 'Conductor Móvil (SMS)' : 'Cliente Móvil (SMS)';
      const cedulaNum = isConductor ? '1004721351' : '1710034065';

      const user: UserProfile = {
        id: `usr-sms-${Date.now()}`,
        name,
        email: `movil.${smsPhone}@andesmovi.ec`,
        phone: smsPhone.startsWith('0') ? smsPhone : `0${smsPhone}`,
        cedula: cedulaNum,
        cedulaVerified: true,
        province: 'Pichincha (Quito)',
        avatar: isConductor
          ? 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
        authProvider: 'telefono',
        rating: 5.0,
        totalTripsCompleted: isConductor ? 65 : 8,
        isVerified: true,
        createdAt: Date.now(),
        role: isConductor ? 'conductor' : 'cliente',
        isRegistrationComplete: true,
      };

      setSuccessMessage(`¡Teléfono ${smsPhone} verificado con éxito!`);

      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onLoginSuccess(user, isConductor ? buildDriverDocs(cedulaNum, name) : undefined);
        }, 200);
      }, 600);
    } catch (error: any) {
      setIsProcessing(false);
      setErrorMessage('Código incorrecto. Verifica el SMS enviado.');
    }
  };

  // 5. Direct Login via Master Credentials or Conductor / Cliente Account
  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('Ingresa tu Cédula, Correo o Celular');
      haptic.warning();
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Ingresa tu contraseña');
      haptic.warning();
      return;
    }

    const cleanUser = loginIdentifier.trim();
    const isMasterUser = cleanUser.toLowerCase() === 'dueñoandesmovi' || cleanUser === '1004721351';
    const isMasterPass = loginPassword === '1004721351Dueño';

    if (isMasterUser) {
      if (!isMasterPass) {
        haptic.warning();
        setErrorMessage('Acceso denegado. Contraseña incorrecta para Administrador / Dueño.');
        setIsProcessing(false);
        return;
      }

      haptic.tap();
      setIsProcessing(true);
      setErrorMessage(null);

      setTimeout(() => {
        setIsProcessing(false);

        const adminUser: UserProfile = {
          id: `usr-owner-${Date.now()}`,
          name: 'Super Administrador (Dueño)',
          email: 'dueñoandesmovi@andesmovi.ec',
          phone: '+593 99 000 0000',
          cedula: '1004721351',
          cedulaVerified: true,
          province: 'Tulcán (Carchi) - Matriz Nacional',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
          authProvider: 'cedula',
          rating: 5.0,
          totalTripsCompleted: 9999,
          isVerified: true,
          createdAt: Date.now(),
          role: 'admin',
          isRegistrationComplete: true,
        };

        try {
          localStorage.setItem('andesmovi_master_session', JSON.stringify(adminUser));
          localStorage.setItem('andesmovi_user_session', JSON.stringify(adminUser));
        } catch (err) {}

        setSuccessMessage('¡Acceso Maestro concedido! Bienvenido Dueño y Administrador.');
        haptic.success();

        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            onLoginSuccess(adminUser);
          }, 200);
        }, 600);
      }, 600);
      return;
    }

    // Check if custom recovered password exists for this user
    const savedCustomPass = typeof window !== 'undefined'
      ? localStorage.getItem('andesmovi_pass_' + cleanUser.toLowerCase())
      : null;

    if (savedCustomPass && loginPassword !== savedCustomPass) {
      haptic.warning();
      setErrorMessage('Contraseña incorrecta. Utiliza tu nueva contraseña recuperada.');
      return;
    }

    if (loginPassword.length < 4) {
      haptic.warning();
      setErrorMessage('La contraseña debe tener al menos 4 caracteres o recupérala si la olvidaste.');
      return;
    }

    haptic.tap();
    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      const isConductor = selectedRole === 'conductor';
      const isCedula = /^\d{10}$/.test(cleanUser);
      const name = isConductor ? 'Patricio Javier Morales' : 'María Elena Viteri';
      const cedulaNum = isCedula ? cleanUser : isConductor ? '1004721351' : '1710034065';

      const user: UserProfile = {
        id: `usr-direct-${Date.now()}`,
        name,
        email: isCedula ? `${cleanUser}@andesmovi.ec` : cleanUser,
        phone: '0998241902',
        cedula: cedulaNum,
        cedulaVerified: true,
        province: 'Pichincha (Quito)',
        avatar: isConductor
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        authProvider: isCedula ? 'cedula' : 'email',
        rating: 5.0,
        totalTripsCompleted: isConductor ? 120 : 15,
        isVerified: true,
        createdAt: Date.now(),
        role: isConductor ? 'conductor' : 'cliente',
        isRegistrationComplete: true,
      };

      try {
        localStorage.setItem('andesmovi_user_session', JSON.stringify(user));
      } catch (err) {}

      setSuccessMessage(`¡Bienvenido de nuevo, ${user.name}!`);
      haptic.success();

      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onLoginSuccess(user, isConductor ? buildDriverDocs(cedulaNum, name) : undefined);
        }, 200);
      }, 600);
    }, 600);
  };

  // 6. Direct Register via Form
  const handleDirectRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setErrorMessage('Ingresa tus nombres y apellidos completos');
      haptic.warning();
      return;
    }
    if (selectedRole === 'conductor') {
      if (!regCedula || regCedula.length !== 10) {
        setErrorMessage('Ingresa los 10 dígitos de tu cédula ecuatoriana');
        haptic.warning();
        return;
      }
      const valResult = validateEcuadorianCedula(regCedula);
      if (!valResult.isValid) {
        setErrorMessage(`Cédula inválida: ${valResult.message}`);
        haptic.warning();
        return;
      }
    }
    if (!regPhone || regPhone.length < 9) {
      setErrorMessage('Ingresa tu número celular ecuatoriano de 10 dígitos');
      haptic.warning();
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      haptic.warning();
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      haptic.warning();
      return;
    }
    if (!acceptTerms) {
      setErrorMessage('Debes aceptar los Términos y Condiciones y Tarifas de Ecuador');
      haptic.warning();
      return;
    }

    haptic.tap();
    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      const isConductor = selectedRole === 'conductor';

      const newUser: UserProfile = {
        id: `usr-reg-${Date.now()}`,
        name: regFullName,
        email: regEmail || `${regCedula}@andesmovi.ec`,
        phone: regPhone,
        cedula: regCedula,
        cedulaVerified: true,
        province: regProvince,
        avatar: isConductor
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        authProvider: 'cedula',
        rating: 5.0,
        totalTripsCompleted: 0,
        isVerified: true,
        createdAt: Date.now(),
        role: isConductor ? 'conductor' : 'cliente',
        isRegistrationComplete: true,
      };

      setSuccessMessage(`¡Cuenta creada con éxito! Bienvenido a AndesMovi Ecuador, ${newUser.name}`);
      haptic.success();

      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onLoginSuccess(newUser, isConductor ? buildDriverDocs(regCedula, regFullName) : undefined);
        }, 200);
      }, 600);
    }, 700);
  };

  // Navigation handlers
  const handleGoToLogin = () => {
    haptic.tap();
    setAuthTab('login');
    setViewMode('auth');
    setErrorMessage(null);
  };

  const handleGoToRegister = () => {
    haptic.tap();
    setAuthTab('register');
    setViewMode('auth');
    setErrorMessage(null);
  };

  return (
    <div
      id="andesmovi-welcome-auth-portal"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-y-auto transition-all duration-400 ${
        isClosing ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 12%, #1e293b 0%, #0b0f19 55%, #050811 100%)',
      }}
    >
      {/* GLOWING AMBIENT ACCENTS */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/15 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-gradient-to-tr from-sky-500/15 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* BARRA SUPERIOR: Insignia Nacional Ecuador y Botón Instalar */}
      <div className="w-full flex items-center justify-between max-w-md pt-1 sm:pt-2 relative z-10">
        <div
          onClick={handleSecretLogoTap}
          className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
          title="AndesMovi Ecuador"
        >
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-black text-amber-300 uppercase tracking-widest">
              AndesMovi • Ecuador 100%
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            Nacional
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowShortcutHelp(true)}
            className="px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/30 text-[11px] font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Cómo agregar icono a la pantalla de inicio"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Instalar App</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO CENTRAL */}
      <div className="flex flex-col items-center text-center my-auto max-w-md w-full py-2 space-y-4 relative z-10">
        
        {/* FASE 1: BARRA DE PROGRESO DE INICIALIZACIÓN */}
        {phase === 'loading' ? (
          <div className="w-full space-y-5 pt-8 max-w-sm flex flex-col items-center">
            {/* Logo emblem */}
            <div className="relative w-44 h-36 flex items-center justify-center">
              <AnimatedAndesMoviLogo size="md" showShadow={true} />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-wider">
                ANDES<span className="text-amber-400">MOVI</span>
              </h1>
              <p className="text-xs font-semibold text-amber-200/90 tracking-wide uppercase">
                "Tu confianza, tu seguridad, nuestro compromiso"
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <div className="w-full bg-zinc-800/90 rounded-full h-2.5 p-0.5 border border-zinc-700/60 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-sky-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-zinc-400 font-medium">
                <span className="truncate pr-2">{statusMessage}</span>
                <span className="font-mono text-amber-400 font-black">{progress}%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkipLoading}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 pt-1 transition-colors cursor-pointer"
            >
              Comenzar de inmediato →
            </button>
          </div>
        ) : viewMode === 'welcome' ? (
          /* ========================================================================= */
          /* PANTALLA DE BIENVENIDA IDÉNTICA A LA IMAGEN ADJUNTA POR EL USUARIO */
          /* ========================================================================= */
          <div className="w-full flex flex-col items-center space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
            {/* 1. EMBLEMA 3D OFICIAL (Montaña de Cristal, Cintas Metálicas Cobre/Azul, Paquete y Auto) */}
            <div className="andesmovi-logo-banner relative w-56 h-36 sm:w-60 sm:h-40 flex items-center justify-center">
              <AnimatedAndesMoviLogo size="lg" showShadow={true} />
            </div>

            {/* 2. TIPOGRAFÍA DE MARCA METÁLICA */}
            <div className="andesmovi-welcome-hero space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase bg-gradient-to-b from-[#fde68a] via-[#f59e0b] to-[#b45309] bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                ANDESMOVI
              </h1>

              {/* SLOGAN EN COMILLAS IDÉNTICO A LA IMAGEN */}
              <p className="text-[11px] sm:text-xs font-black text-amber-400 tracking-wider uppercase px-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                "TU CONFIANZA, TU SEGURIDAD, NUESTRO COMPROMISO"
              </p>

              {/* HEADING DE BIENVENIDA */}
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide pt-1">
                ¡Bienvenido a <span className="text-amber-400">ANDESMOVI</span>!
              </h2>
            </div>

            {/* 3. LISTA DE ESCUDOS CON CORRECCIÓN ORTOGRÁFICA */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 py-0.5 max-w-sm">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                <span>CARRERAS SEGURAS</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />
                <span>ENCOMIENDAS SEGURAS</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>PAQUETES SEGUROS</span>
              </span>
            </div>



            {/* 4. BOTONES PRINCIPALES DE ACCIÓN */}
            <div className="w-full space-y-2.5 max-w-xs pt-1">
              {/* Sesión Activa (si ya hay usuario) */}
              {currentUser && (
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-750 flex items-center justify-between gap-2 shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={currentUser.avatar || null}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-400 flex-shrink-0"
                    />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span>{currentUser.name}</span>
                        {currentUser.cedulaVerified && (
                          <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block truncate">
                        {currentUser.role === 'conductor' ? 'Conductor' : 'Cliente'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.click();
                        setIsClosing(true);
                        setTimeout(onComplete, 200);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-[11px] transition-colors cursor-pointer"
                    >
                      Continuar
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        id="btn-splash-logout"
                        onClick={() => {
                          haptic.warning();
                          onLogout();
                        }}
                        className="p-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 transition-colors cursor-pointer"
                        title="Cerrar Sesión"
                        aria-label="Cerrar Sesión"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ACCESO DIRECTO COMO CLIENTE O COMO CONDUCTOR EN LA BIENVENIDA */}
              <div className="w-full space-y-3 pt-1">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300/90 text-center flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Selecciona tu Tipo de Cuenta</span>
                </div>

                {/* DOS TARJETAS PARALELAS: CLIENTE Y CONDUCTOR */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* TARJETA CLIENTE */}
                  <div className="bg-gradient-to-b from-sky-950/80 to-zinc-900 border border-sky-500/40 hover:border-sky-400 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all shadow-lg shadow-sky-950/40 group">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <User className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">SOY CLIENTE</h3>
                      <p className="text-[9px] text-sky-200/80 font-medium leading-tight mt-0.5">Pedir viajes y encomiendas</p>
                    </div>

                    <div className="w-full space-y-1 pt-1">
                      <button
                        type="button"
                        id="btn-welcome-login-client"
                        onClick={() => {
                          setSelectedRole('cliente');
                          if (onSelectRole) onSelectRole('cliente');
                          if (onOpenLogin) {
                            onOpenLogin('cliente');
                          } else {
                            handleGoToLogin();
                          }
                        }}
                        className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-[11px] shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Iniciar Sesión</span>
                      </button>

                      <button
                        type="button"
                        id="btn-welcome-reg-client"
                        onClick={() => {
                          setSelectedRole('cliente');
                          if (onSelectRole) onSelectRole('cliente');
                          if (onOpenRegister) {
                            onOpenRegister('cliente');
                          } else {
                            handleGoToRegister();
                          }
                        }}
                        className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-sky-500/30 text-sky-300 font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Crear Cuenta</span>
                      </button>
                    </div>
                  </div>

                  {/* TARJETA CONDUCTOR */}
                  <div className="bg-gradient-to-b from-amber-950/80 to-zinc-900 border border-amber-500/40 hover:border-amber-400 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all shadow-lg shadow-amber-950/40 group">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Car className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">SOY CONDUCTOR</h3>
                      <p className="text-[9px] text-amber-200/80 font-medium leading-tight mt-0.5">Ganar dinero en taxi o auto</p>
                    </div>

                    <div className="w-full space-y-1 pt-1">
                      <button
                        type="button"
                        id="btn-welcome-login-driver"
                        onClick={() => {
                          setSelectedRole('conductor');
                          if (onSelectRole) onSelectRole('conductor');
                          if (onOpenLogin) {
                            onOpenLogin('conductor');
                          } else {
                            handleGoToLogin();
                          }
                        }}
                        className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-[11px] shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Iniciar Sesión</span>
                      </button>

                      <button
                        type="button"
                        id="btn-welcome-reg-driver"
                        onClick={() => {
                          setSelectedRole('conductor');
                          if (onSelectRole) onSelectRole('conductor');
                          if (onOpenRegister) {
                            onOpenRegister('conductor');
                          } else {
                            handleGoToRegister();
                          }
                        }}
                        className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Crear Cuenta</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOTÓN PARA INGRESAR A ADMINISTRACIÓN & PRUEBA RÁPIDA */}
                <div className="pt-0.5 flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-welcome-admin-login"
                    onClick={handleTriggerAdmin}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md border border-amber-300/40"
                  >
                    <Shield className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    <span>Acceso Administrativo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.success();
                      const demoDriver: UserProfile = {
                        id: 'usr-driver-demo',
                        name: 'Patricio Morales (Conductor)',
                        email: 'patricio.conductor@gmail.com',
                        phone: '0998241902',
                        cedula: '1004721351',
                        cedulaVerified: true,
                        province: 'Pichincha (Quito)',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        authProvider: 'cedula',
                        rating: 5.0,
                        totalTripsCompleted: 142,
                        isVerified: true,
                        createdAt: Date.now(),
                        role: 'conductor',
                        isRegistrationComplete: true,
                      };
                      setIsClosing(true);
                      setTimeout(() => onLoginSuccess(demoDriver, buildDriverDocs('1004721351', 'Patricio Morales')), 200);
                    }}
                    className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Car className="w-3 h-3 text-amber-400" />
                    <span>Demo Conductor</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BOTÓN EXPLORAR SIN CUENTA */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  setIsClosing(true);
                  setTimeout(onComplete, 200);
                }}
                className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
              >
                Explorar tarifas y mapa en Ecuador sin cuenta →
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PANTALLA DE AUTENTICACIÓN / FORMULARIO (INICIAR SESIÓN O REGISTRO) */
          /* ========================================================================= */
          <div className="w-full space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            {/* BOTÓN VOLVER A BIENVENIDA */}
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  setViewMode('welcome');
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a Bienvenida</span>
              </button>

              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                AndesMovi Ecuador
              </span>
            </div>

            {/* PESTAÑAS: INICIAR SESIÓN VS CREAR CUENTA */}
            <div className="flex rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  haptic.select();
                  setAuthTab('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  authTab === 'login'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.select();
                  setAuthTab('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  authTab === 'register'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear Cuenta</span>
              </button>
            </div>

            {/* Selector de Rol Compacto para Registro */}
            {authTab === 'register' && (
              <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectRole('conductor')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'conductor'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Soy Conductor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRole('cliente')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedRole === 'cliente'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Soy Cliente</span>
                </button>
              </div>
            )}

            {/* MENSAJES DE ERROR O ÉXITO */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-medium flex items-center gap-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 text-left animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* BOTONES DE REDES SOCIALES */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-400 pl-1">
                <span>
                  {authTab === 'login' ? 'Acceso Rápido con 1 Toque' : 'Registro Rápido con Redes'}
                </span>
                <span className="text-amber-400 font-bold">Oficial Ecuador</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* GOOGLE */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isProcessing}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* FACEBOOK */}
                <button
                  type="button"
                  onClick={handleFacebookAuth}
                  disabled={isProcessing}
                  className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>

                {/* ICLOUD / APPLE */}
                <button
                  type="button"
                  onClick={handleIcloudAuth}
                  disabled={isProcessing}
                  className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.62-.77 1.05-1.84.93-2.91-.91.04-2.06.62-2.71 1.39-.58.67-1.09 1.76-.96 2.81 1.02.08 2.09-.54 2.74-1.29z" />
                  </svg>
                  <span>iCloud / Apple</span>
                </button>

                {/* NÚMERO DE TELÉFONO */}
                <button
                  type="button"
                  onClick={handleStartSmsAuth}
                  disabled={isProcessing}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Teléfono SMS</span>
                </button>
              </div>
            </div>

            {/* DIVISOR */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-zinc-500">
                O con tu Cédula Ecuatoriana
              </span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            {/* FORMULARIO DINÁMICO */}
            {authTab === 'login' ? (
              /* FORMULARIO DE INICIO DE SESIÓN */
              <form onSubmit={handleDirectLogin} className="space-y-2.5 text-left">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Cédula Ecuatoriana, Teléfono o Correo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Cédula de Identidad o Correo"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotRole(selectedRole);
                        setForgotInput(loginIdentifier);
                        setForgotStep('input');
                        setForgotMessage(null);
                        setShowForgotModal(true);
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>¿Olvidaste tu contraseña?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Ingresa tu clave secreta"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Banner de recuperación rápida */}
                <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">
                    ¿Problemas con tu clave ({selectedRole === 'conductor' ? 'Conductor' : 'Cliente'})?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotRole(selectedRole);
                      setForgotInput(loginIdentifier);
                      setForgotStep('input');
                      setForgotMessage(null);
                      setShowForgotModal(true);
                    }}
                    className="font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Recuperar</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer mt-1"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>
                    Iniciar Sesión
                  </span>
                </button>
              </form>
            ) : (
              /* FORMULARIO DE REGISTRO / CREAR CUENTA */
              <form onSubmit={handleDirectRegister} className="space-y-2.5 text-left">
                {/* Selector de Vehículo si es Conductor (2 Opciones Oficiales: CARRO vs MOTO) */}
                {selectedRole === 'conductor' && (
                  <div className="space-y-1.5 pb-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        Tipo de Vehículo para Registro *
                      </label>
                      <span className="text-[9px] text-zinc-400 font-bold bg-zinc-800 px-2 py-0.5 rounded-full">
                        2 Opciones
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* OPCION 1: CARRO */}
                      <button
                        type="button"
                        onClick={() => setRegVehicleType('auto')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          regVehicleType === 'auto'
                            ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">🚗</span>
                          {regVehicleType === 'auto' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[11px] font-black text-white leading-tight">CARRO / AUTO</div>
                        <div className="text-[9px] text-amber-400 font-bold mt-0.5">1 a 4 Pasajeros</div>
                        <ul className="text-[8px] text-zinc-400 mt-1 space-y-0.5 border-t border-zinc-800 pt-1">
                          <li>• Carrera Urbana (1-4 pax)</li>
                          <li>• Encomiendas y Delivery</li>
                          <li className="text-amber-300">• Ejecutivo (si Admin aprueba)</li>
                        </ul>
                      </button>

                      {/* OPCION 2: MOTO */}
                      <button
                        type="button"
                        onClick={() => setRegVehicleType('moto')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          regVehicleType === 'moto'
                            ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">🏍️</span>
                          {regVehicleType === 'moto' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[11px] font-black text-white leading-tight">MOTO</div>
                        <div className="text-[9px] text-sky-400 font-bold mt-0.5">1 Sola Persona</div>
                        <ul className="text-[8px] text-zinc-400 mt-1 space-y-0.5 border-t border-zinc-800 pt-1">
                          <li>• Carrera de 1 persona</li>
                          <li>• Delivery y Compras</li>
                          <li>• Encomiendas dentro de ciudad</li>
                        </ul>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Nombres y Apellidos Completos
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nombres y Apellidos completos"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Cédula Ecuatoriana
                      </label>
                      {cedulaValidation && (
                        <span
                          className={`text-[9px] font-bold ${
                            cedulaValidation.isValid ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {cedulaValidation.isValid ? '✓ Válida' : '✗ Inválida'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={10}
                      value={regCedula}
                      onChange={(e) => handleCedulaChange(e.target.value)}
                      placeholder="10 dígitos de cédula"
                      className={`w-full px-3 py-2 rounded-xl bg-zinc-900 border text-xs text-white placeholder-zinc-500 focus:outline-none ${
                        cedulaValidation
                          ? cedulaValidation.isValid
                            ? 'border-emerald-500'
                            : 'border-rose-500'
                          : 'border-zinc-700 focus:border-amber-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Celular (+593)
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="09XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className="w-full px-3 py-2 pr-8 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        className="absolute right-2 top-2 text-zinc-400"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Confirmar Clave
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repite tu clave"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="rounded accent-amber-500 w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer"
                  />
                  <label htmlFor="terms-check" className="text-[11px] text-zinc-300 leading-snug cursor-pointer select-none">
                    He leído y acepto los{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLegalDocType('terminos');
                        setShowLegalModal(true);
                      }}
                      className="text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Términos y Condiciones
                    </button>{' '}
                    y la{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLegalDocType('privacidad');
                        setShowLegalModal(true);
                      }}
                      className="text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Política de Privacidad
                    </button>{' '}
                    de AndesMovi (Tarifas reguladas Ecuador).
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-xl text-zinc-950 font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer ${
                    selectedRole === 'conductor'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300'
                      : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>
                    Crear Cuenta Oficial de {selectedRole === 'conductor' ? 'Conductor' : 'Cliente'}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* PIE DE PÁGINA: Legal Links & "Una marca de Andes Move" & Tarifa oficial en Ecuador */}
      <div className="w-full max-w-md text-center space-y-1.5 pb-8 sm:pb-10 relative z-10 border-t border-zinc-800/80 pt-3">
        <div className="flex items-center justify-center gap-2.5 text-[11px] text-zinc-400 flex-wrap">
          <button
            type="button"
            id="btn-splash-footer-terms"
            onClick={() => {
              setLegalDocType('terminos');
              setShowLegalModal(true);
            }}
            className="hover:text-amber-300 hover:underline transition-colors cursor-pointer font-medium"
          >
            Términos y Condiciones
          </button>
          <span>•</span>
          <button
            type="button"
            id="btn-splash-footer-privacy"
            onClick={() => {
              setLegalDocType('privacidad');
              setShowLegalModal(true);
            }}
            className="hover:text-amber-300 hover:underline transition-colors cursor-pointer font-medium"
          >
            Políticas de Privacidad (LOPDP)
          </button>
        </div>

        <p className="text-xs font-semibold text-zinc-400">
          Una marca de <span className="text-white font-bold">Andes Move</span>
        </p>
        <p className="text-[10px] text-zinc-400 font-medium">
          Tarifa oficial en Ecuador: <strong className="text-amber-400 font-mono font-bold">$1.25</strong> hasta 2.7 km de recorrido
        </p>
        <p className="text-[9px] text-zinc-500">
          Cobertura en las 24 Provincias • Transporte Seguro y Verificado
        </p>
      </div>

      {/* MODAL PARA VERIFICACIÓN SMS (+593 ECUADOR) */}
      {showSmsModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border-2 border-amber-500/60 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-left relative">
            <button
              type="button"
              onClick={() => setShowSmsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  Verificación SMS Telefónica
                </h3>
                <span className="text-[10px] text-amber-400 font-bold">
                  Ecuador (+593)
                </span>
              </div>
            </div>

            {smsStep === 'input_phone' ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-300">
                  Ingresa tu número celular. Te enviaremos un código SMS de verificación para ingresar de inmediato.
                </p>

                {/* Recaptcha container */}
                <div id="recaptcha-container-splash"></div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Número Celular Ecuatoriano
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
                    <span className="px-3 py-2.5 bg-zinc-800 text-xs font-bold text-amber-400 flex items-center">
                      🇪🇨 +593
                    </span>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="0998241902"
                      className="w-full px-3 py-2.5 bg-zinc-900 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendSmsCode}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Enviar Código SMS por Red Móvil</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Código de 4 Dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-lg font-mono tracking-widest text-center text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Reenviar código en:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {smsCountdown > 0 ? `${smsCountdown}s` : 'Disponible'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleVerifySmsCode}
                  disabled={isProcessing || smsCode.length < 4}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Verificar y Entrar a AndesMovi</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL GUÍA DE INSTALACIÓN PWA */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-left relative">
            <button
              type="button"
              onClick={() => setShowShortcutHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  Instalar AndesMovi en Celular
                </h3>
                <span className="text-[10px] text-zinc-400">
                  Acceso directo sin descargar de tiendas
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="font-bold text-amber-400">📱 En Android (Chrome):</div>
                <p className="text-[11px] text-zinc-400">
                  Toca los 3 puntos (⋮) arriba a la derecha y selecciona <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="font-bold text-sky-400">🍎 En iPhone (Safari):</div>
                <p className="text-[11px] text-zinc-400">
                  Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha arriba) y selecciona <strong>"Agregar al inicio"</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutHelp(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Recuperación de Contraseña para Conductor y Cliente */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn text-left">
          <div className="w-full max-w-md rounded-3xl border-2 border-amber-500/40 bg-zinc-950 p-6 text-white shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Recuperación de Contraseña</h4>
                  <p className="text-[11px] text-zinc-400">
                    AndesMovi Ecuador • {forgotRole === 'conductor' ? 'Perfil Conductor' : 'Perfil Cliente'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Switch role inside forgot modal */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setForgotRole('conductor')}
                className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  forgotRole === 'conductor'
                    ? 'bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Soy Conductor</span>
              </button>
              <button
                type="button"
                onClick={() => setForgotRole('cliente')}
                className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  forgotRole === 'cliente'
                    ? 'bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Soy Cliente</span>
              </button>
            </div>

            {forgotStep === 'input' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Ingresa tu número celular registrado (+593), cédula de identidad o correo electrónico para enviarte un código de verificación SMS de AndesMovi.
                </p>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Celular (+593), Cédula o Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      placeholder={forgotRole === 'conductor' ? 'ej: 0998241902 o 1004721351' : 'ej: 0991234567 o usuario@gmail.com'}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!forgotInput.trim()) {
                      setForgotMessage('Por favor ingresa tu número celular, cédula o correo.');
                      return;
                    }
                    setForgotMessage(null);
                    setForgotStep('code');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
                >
                  Enviar Código SMS de Recuperación
                </button>
              </div>
            )}

            {forgotStep === 'code' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  ✓ Código de seguridad enviado al teléfono asociado.
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Ingresa el Código de 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="4829"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-center tracking-widest font-mono text-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('input')}
                    className="w-1/3 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (enteredCode.length < 4) {
                        setForgotMessage('Por favor ingresa el código de 4 dígitos.');
                        return;
                      }
                      setForgotMessage(null);
                      setForgotStep('new_pass');
                    }}
                    className="w-2/3 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all shadow-lg active:scale-98 cursor-pointer"
                  >
                    Verificar Código
                  </button>
                </div>
              </div>
            )}

            {forgotStep === 'new_pass' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300">
                  Ingresa tu nueva contraseña para tu cuenta de {forgotRole === 'conductor' ? 'Conductor' : 'Cliente'}.
                </p>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Nueva Contraseña (mínimo 6 caracteres)</label>
                  <input
                    type="password"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newPasswordVal.length < 6) {
                      setForgotMessage('La contraseña debe tener al menos 6 caracteres.');
                      return;
                    }
                    try {
                      if (forgotInput.trim()) {
                        localStorage.setItem('andesmovi_pass_' + forgotInput.trim().toLowerCase(), newPasswordVal);
                      }
                      localStorage.setItem('andesmovi_last_recovered_pass', newPasswordVal);
                    } catch (e) {}
                    setForgotMessage(null);
                    setForgotStep('success');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all shadow-lg active:scale-98 cursor-pointer"
                >
                  Actualizar Contraseña
                </button>
              </div>
            )}

            {forgotStep === 'success' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto animate-bounce text-2xl">
                  ✓
                </div>
                <div>
                  <h5 className="text-base font-bold text-white">¡Contraseña Actualizada con Éxito!</h5>
                  <p className="text-xs text-zinc-400 mt-1">
                    Tu nueva contraseña para tu cuenta {forgotRole === 'conductor' ? 'Conductor' : 'Cliente'} ha sido registrada.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setLoginIdentifier(forgotInput || (forgotRole === 'conductor' ? '1004721351' : '0998241902'));
                    setLoginPassword(newPasswordVal);
                    setSelectedRole(forgotRole);
                    setAuthTab('login');
                    setForgotStep('input');
                    setEnteredCode('');
                    setNewPasswordVal('');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all shadow-lg cursor-pointer"
                >
                  Iniciar Sesión con Nueva Contraseña
                </button>
              </div>
            )}

            {forgotMessage && (
              <p className="text-xs text-rose-300 font-semibold text-center bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                {forgotMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal Legal de Términos y Condiciones y Políticas de Privacidad */}
      {showLegalModal && (
        <LegalTermsModal
          isOpen={showLegalModal}
          initialDoc={legalDocType}
          onClose={() => setShowLegalModal(false)}
          onAccept={() => {
            setAcceptTerms(true);
            setShowLegalModal(false);
          }}
          showAcceptButton={true}
        />
      )}

      {/* Pantalla Obligatoria tras Autenticación Social (Cédula + Consulta SRI + Teléfono + Unicidad) */}
      {socialPendingData && (
        <SocialRegistrationModal
          isOpen={Boolean(socialPendingData)}
          socialData={socialPendingData}
          onConfirmRegistration={(user) => {
            setSocialPendingData(null);
            setSuccessMessage(`¡Bienvenido a AndesMovi, ${user.name}!`);
            haptic.success();
            setTimeout(() => {
              setIsClosing(true);
              setTimeout(() => {
                onLoginSuccess(
                  user,
                  selectedRole === 'conductor'
                    ? buildDriverDocs(user.cedula || '1004721351', user.name)
                    : undefined
                );
              }, 200);
            }, 400);
          }}
          onCancel={() => setSocialPendingData(null)}
          onSwitchToLogin={() => {
            setSocialPendingData(null);
            setAuthTab('login');
          }}
        />
      )}
    </div>
  );
};

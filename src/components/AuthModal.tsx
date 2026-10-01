import React, { useState } from 'react';
import { UserProfile, AuthProviderType } from '../types';
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  googleProvider,
  facebookProvider,
  signInWithPopup,
} from '../services/firebase';
import {
  validateEcuadorianCedula,
  CedulaValidationResult,
  ECUADOR_PROVINCE_CODES,
} from '../utils/cedulaValidator';
import { ECUADOR_GEOGRAPHY, getCantonsForProvince } from '../data/ecuador_geography';
import { LegalTermsModal, LegalDocType } from './LegalTermsModal';
import { SocialRegistrationModal, SocialAuthInitialData } from './SocialRegistrationModal';
import { databaseService } from '../services/databaseService';
import { processLoginSessionMiddleware } from '../services/sessionMiddleware';
import {
  X,
  ShieldCheck,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  Star,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Car,
  MapPin,
  Mail,
  KeyRound,
  Radio,
  Info,
  Building2,
  Smartphone,
} from 'lucide-react';

interface AuthModalProps {
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  onClose: () => void;
  isDark?: boolean;
  onRegisterNewDriver?: (driverData: {
    name: string;
    cedula: string;
    phone?: string;
    province?: string;
    vehicleType?: 'auto' | 'moto' | 'confort' | 'camioneta';
    vehicleModel?: string;
    plate?: string;
    avatar?: string;
    authProvider?: string;
  }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onClose,
  isDark = true,
  onRegisterNewDriver,
}) => {
  // Mode selection: 'login' | 'register' | 'profile' | 'sms' | 'cedula_only'
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile' | 'sms'>(
    currentUser ? 'profile' : 'login'
  );

  // Toggle for the GPS "Carritos" explanation banner
  const [showGpsExplanation, setShowGpsExplanation] = useState<boolean>(true);

  // --- LOGIN FORM STATE ---
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [socialAuthError, setSocialAuthError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginRoleMode, setLoginRoleMode] = useState<'cliente' | 'conductor'>('cliente');

  // --- FORGOT PASSWORD STATE ---
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotInput, setForgotInput] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<'input' | 'code' | 'new_pass' | 'success'>('input');
  const [forgotVerificationCode] = useState<string>('4829');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // --- REGISTER FORM STATE ---
  const [regAccountType, setRegAccountType] = useState<'cliente' | 'conductor'>('cliente');
  const [regVehicleType, setRegVehicleType] = useState<'auto' | 'moto' | 'camioneta'>('auto');
  const [regVehicleModel, setRegVehicleModel] = useState<string>('Chevrolet Sail Sedán');
  const [regVehiclePlate, setRegVehiclePlate] = useState<string>('PBA-8321');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regDocType, setRegDocType] = useState<'cedula' | 'pasaporte'>('cedula');
  const [regCedula, setRegCedula] = useState<string>('');
  const [regLicenseNumber, setRegLicenseNumber] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regProvince, setRegProvince] = useState<string>('Pichincha');
  const [regCanton, setRegCanton] = useState<string>('Quito');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terminos');
  const [cedulaValidation, setCedulaValidation] = useState<CedulaValidationResult | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // --- SMS OTP FORM STATE ---
  const [smsPhone, setSmsPhone] = useState<string>('0998241902');
  const [smsStep, setSmsStep] = useState<'input_phone' | 'input_code'>('input_phone');
  const [smsCode, setSmsCode] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(45);
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);

  // Status message
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Social Auth Mandatory Flow State (Cédula + SRI Auto-Query + Phone)
  const [socialPendingData, setSocialPendingData] = useState<SocialAuthInitialData | null>(null);

  // Password strength calculation helper
  const getPasswordStrength = (pwd: string): { label: string; color: string; percent: number } => {
    if (!pwd) return { label: 'Ingresa contraseña', color: 'bg-zinc-700', percent: 0 };
    if (pwd.length < 6) return { label: 'Muy débil (mínimo 6)', color: 'bg-rose-500', percent: 25 };
    const hasNum = /\d/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = (pwd.length >= 8 ? 1 : 0) + (hasNum ? 1 : 0) + (hasUpper ? 1 : 0) + (hasSpecial ? 1 : 0);

    if (score <= 1) return { label: 'Básica', color: 'bg-amber-500', percent: 45 };
    if (score === 2) return { label: 'Media', color: 'bg-yellow-400', percent: 70 };
    return { label: 'Fuerte y segura', color: 'bg-emerald-400', percent: 100 };
  };

  // Document input handler with support for Cédula Ecuatoriana or Pasaporte / DNI Extranjero
  const handleCedulaInputChange = (value: string) => {
    if (regDocType === 'pasaporte') {
      const cleanVal = value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 18);
      setRegCedula(cleanVal);
      if (cleanVal.length >= 5) {
        setCedulaValidation({
          isValid: true,
          message: 'Pasaporte / Documento Extranjero Válido',
          province: 'Extranjero / Internacional',
        });
      } else {
        setCedulaValidation(null);
      }
    } else {
      const raw = value.replace(/\D/g, '').slice(0, 10);
      setRegCedula(raw);
      if (raw.length === 10) {
        const result = validateEcuadorianCedula(raw);
        setCedulaValidation(result);
        if (result.isValid && result.province) {
          setRegProvince(result.province);
          const cantons = getCantonsForProvince(result.province);
          if (cantons.length > 0) {
            setRegCanton(cantons[0]);
          }
        }
      } else {
        setCedulaValidation(null);
      }
    }
  };

  // Generic Social Login Trigger
  const triggerSocialAuth = async (provider: 'google' | 'facebook' | 'icloud') => {
    if (provider === 'icloud') {
      alert('Apple ID login no está configurado aún. Por favor use Google o Facebook.');
      return;
    }

    try {
      setSocialAuthError(null);
      setLoginError(null);
      setRegisterError(null);
      
      const firebaseProvider = provider === 'google' ? googleProvider : facebookProvider;
      const result = await signInWithPopup(auth, firebaseProvider);
      const user = result.user;
      
      const email = user.email || '';
      const avatar = user.photoURL || '';
      const suggestedName = user.displayName || 'Usuario';

      // 1. Verificar si esta cuenta social ya existe en la base de datos
      const existingUser = databaseService.getUserBySocialAccount(provider as AuthProviderType, email);
      if (existingUser && existingUser.isRegistrationComplete) {
        const sessionResult = processLoginSessionMiddleware(existingUser);
        setFeedbackSuccess(`¡Ingreso directo! Bienvenido de nuevo, ${sessionResult.user.name}`);
        setTimeout(() => {
          onLoginSuccess(sessionResult.user);
        }, 500);
        return;
      }

      // 2. Si es cliente, registrar e iniciar sesión directamente sin restricciones de Registro Civil o SRI
      if (regAccountType === 'cliente') {
        const newClient: UserProfile = {
          id: `usr-${provider}-${Date.now()}`,
          name: suggestedName || 'Usuario AndesMovi',
          email: email,
          phone: '',
          cedula: '',
          cedulaVerified: false,
          province: regProvince || 'Pichincha',
          canton: regCanton || 'Quito',
          avatar: avatar || '',
          authProvider: provider as AuthProviderType,
          role: 'cliente',
          rating: 5.0,
          totalTripsCompleted: 0,
          isVerified: true,
          isRegistrationComplete: true,
          createdAt: Date.now(),
          emergencyContacts: [],
        };
        databaseService.saveUser(newClient);
        const sessionResult = processLoginSessionMiddleware(newClient);
        setFeedbackSuccess(`¡Bienvenido a AndesMovi, ${newClient.name}! Cuenta creada exitosamente.`);
        setTimeout(() => {
          onLoginSuccess(sessionResult.user);
        }, 500);
        return;
      }

      // 3. Para conductores, solicitar datos de unidad y verificación vehicular
      setSocialPendingData({
        email,
        avatar,
        authProvider: provider as AuthProviderType,
        suggestedName,
        role: 'conductor',
      });
    } catch (error: any) {
      console.error(`Error in ${provider} auth:`, error);
      let errorMessage = 'Ocurrió un error al intentar iniciar sesión.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'La ventana de inicio de sesión fue cerrada.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = `El inicio de sesión con ${provider} no está habilitado. Por favor, contacte al soporte para activar el proveedor en Firebase Console.`;
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Este dominio no está autorizado para el inicio de sesión. Agregue el dominio actual a la lista de dominios autorizados en Firebase Console.';
      }

      setSocialAuthError(errorMessage);
    }
  };

  // 1. CUENTA GOOGLE LOGIN / REGISTER
  const handleGoogleLogin = () => {
    triggerSocialAuth('google');
  };

  // 2. FACEBOOK LOGIN
  const handleFacebookLogin = () => {
    triggerSocialAuth('facebook');
  };

  // 3. ICLOUD / APPLE LOGIN
  const handleIcloudLogin = () => {
    triggerSocialAuth('icloud');
  };

  // 4. SUBMIT INICIAR SESIÓN CON VALIDACIÓN ESTRICTA DE CREDENCIALES
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = loginIdentifier.trim().toLowerCase();
    const cleanDigits = loginIdentifier.replace(/\D/g, '');

    if (!cleanId) {
      setLoginError('Ingresa tu correo, cédula o número de celular');
      return;
    }
    if (!loginPassword) {
      setLoginError('Ingresa tu contraseña');
      return;
    }

    // Cuentas predefinidas del sistema AndesMovi
    const predefinedAccounts = [
      {
        id: 'usr-jhon-admin',
        name: 'Jhon Sebastian',
        email: 'jhonsevadtisn@gmail.com',
        cedula: '0401567890',
        phone: '+593 99 841 2091',
        password: 'AndesMovi2026!',
        role: 'admin' as const,
        province: 'Carchi',
        canton: 'Tulcán',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr-admin-master',
        name: 'Administrador AndesMovi',
        email: 'admin@andesmovi.ec',
        cedula: '0401999888',
        phone: '+593 99 000 0001',
        password: 'Admin2026*',
        role: 'admin' as const,
        province: 'Carchi',
        canton: 'Tulcán',
      },
      {
        id: 'usr-client-mateo',
        name: 'Mateo Morales',
        email: 'mateo.morales.ec@gmail.com',
        cedula: '1724589012',
        phone: '+593 99 824 1902',
        password: 'AndesMovi2026!',
        role: 'cliente' as const,
        province: 'Pichincha',
        canton: 'Quito',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr-client-maria',
        name: 'María Belén Vaca',
        email: 'cliente@andesmovi.ec',
        cedula: '1004721351',
        phone: '+593 98 765 4321',
        password: 'Cliente2026*',
        role: 'cliente' as const,
        province: 'Imbabura',
        canton: 'Ibarra',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'usr-driver-carlos',
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@andesmovi.ec',
        cedula: '0401894562',
        phone: '+593 99 123 4567',
        password: 'Conductor2026*',
        role: 'conductor' as const,
        province: 'Carchi',
        canton: 'Tulcán',
        vehicleModel: 'Chevrolet Sail Sedán',
        plate: 'PBA-8321',
        vehicleType: 'auto',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
    ];

    // Cuentas registradas por los usuarios en la aplicación
    let dynamicRegisteredAccounts: any[] = [];
    try {
      const stored = localStorage.getItem('andesmovi_user_registry');
      if (stored) {
        dynamicRegisteredAccounts = JSON.parse(stored);
      }
    } catch {}

    const allValidAccounts = [...predefinedAccounts, ...dynamicRegisteredAccounts];

    // Validación estricta: Coincidencia por correo electrónico, cédula de 10 dígitos o número de teléfono
    const matchedAccount = allValidAccounts.find((acc) => {
      const aEmail = (acc.email || '').toLowerCase().trim();
      const aCedula = (acc.cedula || '').replace(/\D/g, '');
      const aPhone = (acc.phone || '').replace(/\D/g, '');

      const matchesEmail = Boolean(aEmail && aEmail === cleanId);
      const matchesCedula = Boolean(cleanDigits.length === 10 && aCedula && aCedula === cleanDigits);
      const matchesPhone = Boolean(cleanDigits.length >= 7 && aPhone && aPhone.includes(cleanDigits));

      return matchesEmail || matchesCedula || matchesPhone;
    });

    // Si el usuario no existe o la contraseña no coincide exactamente: DENEGAR ACCESO
    if (!matchedAccount || matchedAccount.password !== loginPassword) {
      setLoginError('Credenciales incorrectas');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    setTimeout(() => {
      setIsLoggingIn(false);

      const loggedUser: UserProfile = {
        id: matchedAccount.id || `usr-${Date.now()}`,
        name: matchedAccount.name || 'Usuario AndesMovi',
        email: matchedAccount.email || '',
        phone: matchedAccount.phone || '',
        cedula: matchedAccount.cedula || '1724589012',
        cedulaVerified: true,
        province: matchedAccount.province || 'Pichincha',
        canton: matchedAccount.canton || 'Quito',
        avatar: matchedAccount.avatar || '',
        authProvider: 'email',
        role: matchedAccount.role || loginRoleMode || 'cliente',
        rating: 5.0,
        totalTripsCompleted: 0,
        isVerified: true,
        isRegistrationComplete: true,
        createdAt: Date.now(),
        emergencyContacts: [],
      };

      const sessionResult = processLoginSessionMiddleware(loggedUser);
      setFeedbackSuccess(`¡Bienvenido, ${loggedUser.name}! Sesión iniciada correctamente.`);
      setTimeout(() => {
        onLoginSuccess(sessionResult.user);
      }, 700);
    }, 600);
  };

  // 5. SUBMIT CREAR CUENTA NUEVA
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!regFullName.trim()) {
      setRegisterError('Por favor ingresa tus nombres y apellidos');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegisterError('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegisterError('Las contraseñas no coinciden');
      return;
    }
    if (!acceptTerms) {
      setRegisterError('Debes aceptar los términos y condiciones');
      return;
    }

    // Validación de Cédula/Documento: Exclusivo para conductores
    if (regAccountType === 'conductor') {
      if (!regCedula || !regCedula.trim()) {
        setRegisterError(
          regDocType === 'pasaporte'
            ? 'Por favor ingresa tu número de Pasaporte o Documento Extranjero'
            : 'La Cédula de Identidad Ecuatoriana (10 dígitos) es obligatoria para conductores'
        );
        return;
      }

      if (regDocType === 'pasaporte') {
        if (regCedula.trim().length < 5) {
          setRegisterError('El Pasaporte o Documento Extranjero debe tener al menos 5 caracteres');
          return;
        }
        if (!regLicenseNumber || !regLicenseNumber.trim()) {
          setRegisterError(
            'Conductor Extranjero: En Ecuador, la Ley Orgánica de Transporte exige obligatoriamente disponer de una LICENCIA ECUATORIANA (ANT) vigente. Ingresa tu número de Licencia Ecuatoriana.'
          );
          return;
        }
      } else {
        const val = validateEcuadorianCedula(regCedula);
        if (!val.isValid) {
          setRegisterError(`Cédula ecuatoriana inválida: ${val.message}`);
          return;
        }
      }
    }

    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);

      const formattedPhone = regPhone
        ? regPhone.startsWith('+593')
          ? regPhone
          : `+593 ${regPhone.replace(/^0/, '')}`
        : '';

      const newUser: UserProfile = {
        id: `usr-reg-${Date.now()}`,
        name: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: formattedPhone,
        cedula: regCedula.trim(),
        cedulaVerified: true,
        province: regProvince,
        canton: regCanton,
        avatar: '',
        authProvider: 'email',
        rating: 5.0,
        totalTripsCompleted: 0,
        isVerified: true,
        role: regAccountType,
        nationalityType: regDocType === 'pasaporte' ? 'extranjero' : 'ecuatoriano',
        isForeignDriver: regDocType === 'pasaporte' && regAccountType === 'conductor',
        isRegistrationComplete: true,
        createdAt: Date.now(),
        emergencyContacts: [],
      };

      if (regAccountType === 'conductor' && onRegisterNewDriver) {
        onRegisterNewDriver({
          name: regFullName.trim(),
          cedula: regCedula.trim(),
          phone: formattedPhone,
          province: `${regProvince} (${regCanton})`,
          vehicleType: regVehicleType,
          vehicleModel: regVehicleModel,
          plate: regVehiclePlate,
          authProvider: 'email',
        });
      }

      // Guardar en el registro de usuarios verificados para validación estricta de inicio de sesión
      try {
        const storedRegistry = localStorage.getItem('andesmovi_user_registry');
        const list = storedRegistry ? JSON.parse(storedRegistry) : [];
        list.push({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          cedula: newUser.cedula,
          phone: newUser.phone,
          password: regPassword,
          role: regAccountType,
          province: newUser.province,
          canton: newUser.canton,
          avatar: newUser.avatar,
          vehicleModel: regVehicleModel,
          plate: regVehiclePlate,
          vehicleType: regVehicleType,
        });
        localStorage.setItem('andesmovi_user_registry', JSON.stringify(list));
      } catch (err) {
        console.warn('Error saving to user registry', err);
      }

      const sessionResult = processLoginSessionMiddleware(newUser);
      setFeedbackSuccess(
        regAccountType === 'conductor'
          ? `¡Cuenta de conductor creada con éxito! El administrador ha sido notificado para la activación de tu unidad.`
          : `¡Cuenta creada con éxito! Bienvenido a AndesMovi, ${sessionResult.user.name}.`
      );
      setTimeout(() => {
        onLoginSuccess(sessionResult.user);
      }, 800);
    }, 900);
  };

  // 6. ENVIAR SMS OTP
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSms(true);
    try {
      const formattedPhone = `+593${smsPhone.replace(/^0/, '').replace(/\s/g, '')}`;
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setSmsStep('input_code');
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Error enviando SMS: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsSendingSms(false);
    }
  };

  // 7. VERIFICAR SMS OTP
  const handleVerifySmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await confirmationResult.confirm(smsCode);
      setFeedbackSuccess('¡Verificación exitosa!');
      onLoginSuccess({
        id: 'user-' + smsPhone,
        name: currentUser?.name || 'Usuario SMS',
        phone: smsPhone,
        cedula: currentUser?.cedula || '',
        cedulaVerified: Boolean(currentUser?.cedulaVerified),
        province: currentUser?.province || 'Pichincha',
        avatar: currentUser?.avatar || '',
        authProvider: 'telefono',
        rating: currentUser?.rating || 5.0,
        totalTripsCompleted: currentUser?.totalTripsCompleted || 0,
        isVerified: true,
        isRegistrationComplete: true,
        createdAt: currentUser?.createdAt || Date.now(),
        emergencyContacts: currentUser?.emergencyContacts || [],
      });
    } catch (error) {
      console.error('Error verifying code:', error);
      alert('Código incorrecto');
    }
  };

  const passwordStrength = getPasswordStrength(regPassword);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in ${isDark ? 'bg-black/80' : 'bg-slate-900/60'}`}>
      <div className={`border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-zinc-800 bg-zinc-950/80' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>Acceso y Cuentas</span>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                  isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  🇪🇨 Ecuador
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {currentUser ? 'Perfil de usuario activo' : 'Inicia sesión o regístrate en AndesMovi'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Feedback Alert */}
        {feedbackSuccess && (
          <div className={`mx-4 mt-3 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {/* EXPLICACIÓN OFICIAL: CARROS EN TIEMPO REAL (GPS + RADAR ANDESMOVI) */}
        {showGpsExplanation && (
          <div className={`mx-4 mt-3 p-3.5 rounded-2xl border relative overflow-hidden shadow-inner ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-950/60 to-zinc-900 border-emerald-500/35' 
              : 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200 shadow-sm'
          }`}>
            <div className="flex items-start justify-between gap-2 relative z-10">
              <div className="flex items-start gap-2.5">
                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 relative ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Car className="w-4 h-4" />
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                </div>
                <div className="text-xs space-y-1">
                  <div className={`flex items-center gap-1.5 font-black ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    <span>Rastreo de Conductores en Vivo</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                      isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      GPS + Radar AndesMovi
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    Los pequeños vehículos o <strong>"carritos"</strong> que ves moviéndose en tiempo real sobre la pantalla representan a los <strong>conductores activos</strong> que están cerca de tu ubicación. Esto se logra mediante el sistema satelital de mapas y GPS de alta precisión.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGpsExplanation(false)}
                className={`p-1 flex-shrink-0 transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'}`}
                title="Cerrar explicación"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Primary Segmented Tabs */}
        <div className={`p-2 border-b grid grid-cols-4 gap-1 text-xs ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-100 bg-slate-50'}`}>
          <button
            type="button"
            id="tab-login"
            onClick={() => setActiveTab('login')}
            className={`py-2 px-2 rounded-xl font-bold transition-all text-center truncate ${
              activeTab === 'login'
                ? isDark ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' : 'bg-emerald-600 text-white shadow-sm font-black'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>

          <button
            type="button"
            id="tab-register"
            onClick={() => setActiveTab('register')}
            className={`py-2 px-2 rounded-xl font-bold transition-all text-center truncate ${
              activeTab === 'register'
                ? isDark ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' : 'bg-emerald-600 text-white shadow-sm font-black'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Crear Cuenta
          </button>

          <button
            type="button"
            id="tab-sms"
            onClick={() => setActiveTab('sms')}
            className={`py-2 px-2 rounded-xl font-bold transition-all text-center truncate ${
              activeTab === 'sms'
                ? isDark ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' : 'bg-emerald-600 text-white shadow-sm font-black'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Código SMS
          </button>

          <button
            type="button"
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-2 rounded-xl font-bold transition-all text-center truncate ${
              activeTab === 'profile'
                ? isDark ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' : 'bg-emerald-600 text-white shadow-sm font-black'
                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {currentUser ? 'Mi Perfil' : 'Ver Perfil'}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className={`p-4 sm:p-5 overflow-y-auto space-y-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          {/* ============================================================== */}
          {/* TAB 1: INICIAR SESIÓN                                         */}
          {/* ============================================================== */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div className="text-center pb-1">
                <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Ingresa a tu cuenta de AndesMovi</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Accede para solicitar viajes, negociar tarifas y rastrear taxis en tiempo real</p>
              </div>

              {/* Role Toggle: Cliente vs Conductor */}
              <div className={`grid grid-cols-2 gap-2 p-1 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setLoginRoleMode('cliente');
                    setLoginIdentifier('mateo.morales.ec@gmail.com');
                    setLoginPassword('AndesMovi2026!');
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loginRoleMode === 'cliente'
                      ? isDark ? 'bg-emerald-500 text-zinc-950 shadow-md font-black' : 'bg-emerald-600 text-white shadow-sm font-black'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Acceso Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginRoleMode('conductor');
                    setLoginIdentifier('carlos.mendoza@andesmovi.ec');
                    setLoginPassword('Conductor2026*');
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loginRoleMode === 'conductor'
                      ? isDark ? 'bg-blue-600 text-white shadow-md font-black' : 'bg-blue-700 text-white shadow-sm font-black'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Acceso Conductor</span>
                </button>
              </div>

              {/* Quick Forgot Password Banner */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-2xl border text-xs ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>¿Problemas para acceder ({loginRoleMode === 'cliente' ? 'Cliente' : 'Conductor'})?</span>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className={`font-bold hover:underline cursor-pointer flex items-center gap-1.5 ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800'}`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>¿Olvidaste tu contraseña?</span>
                </button>
              </div>

              {/* Social Error Reporting */}
              {socialAuthError && (
                <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{socialAuthError}</span>
                </div>
              )}

              {loginError && (
                <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Correo, Cédula de Identidad o Celular
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-login-identifier"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="ej: mateo@gmail.com o 1724589012"
                      className={`w-full border rounded-2xl pl-10 pr-3.5 py-3 text-sm focus:outline-none transition-colors ${
                        isDark 
                          ? 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Contraseña</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className={`text-[11px] hover:underline cursor-pointer ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="input-login-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full border rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none transition-colors ${
                        isDark 
                          ? 'bg-zinc-950 border-zinc-700 text-white focus:border-emerald-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className={`absolute right-3.5 top-3.5 transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className={`flex items-center justify-between text-xs pt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`w-4 h-4 rounded focus:ring-0 ${isDark ? 'bg-zinc-950 border-zinc-700 text-emerald-500' : 'bg-white border-slate-300 text-emerald-600'}`}
                    />
                    <span>Recordar sesión</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier('mateo.morales.ec@gmail.com');
                      setLoginPassword('AndesMovi2026!');
                    }}
                    className={`text-[11px] hover:underline font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                  >
                    Usar credencial de prueba
                  </button>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoggingIn}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all min-h-[46px] ${
                    isDark 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Separador */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`} />
                </div>
                <span className={`relative px-3 text-[11px] font-bold uppercase tracking-wider ${isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400'}`}>
                  O accede al instante con
                </span>
              </div>

              {/* Botones de Acceso Rápido Social */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className={`p-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 border ${
                    isDark ? 'bg-white hover:bg-zinc-100 text-zinc-900 border-transparent' : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  className={`p-2.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 ${
                    isDark ? 'bg-[#1877F2] hover:bg-[#166fe5]' : 'bg-[#1877F2] hover:bg-[#166fe5]'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={handleIcloudLogin}
                  className={`p-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 border ${
                    isDark ? 'bg-zinc-950 hover:bg-black text-white border-zinc-700' : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 0.6-2.65 1.35-.58.67-1.09 1.74-.95 2.77 1.01.08 2.05-.52 2.67-1.27z" />
                  </svg>
                  <span>Apple ID</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>¿No tienes cuenta aún? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`text-xs font-bold hover:underline ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
                >
                  Crear cuenta gratis aquí
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CREAR CUENTA NUEVA                                     */}
          {/* ============================================================== */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              <div className="text-center pb-1">
                <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Registro de Nueva Cuenta</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Crea tu cuenta de pasajero o conductor en Ecuador</p>
              </div>

              {/* Social Error Reporting */}
              {socialAuthError && (
                <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                  isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{socialAuthError}</span>
                </div>
              )}

              {registerError && (
                <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                  isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Selector de Tipo de Cuenta: Pasajero o Conductor */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    ¿Qué tipo de cuenta deseas crear? *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegAccountType('cliente')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        regAccountType === 'cliente'
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-md'
                          : isDark 
                            ? 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-900' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Pasajero / Cliente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegAccountType('conductor')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        regAccountType === 'conductor'
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md'
                          : isDark
                            ? 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span>Conductor / Repartidor</span>
                    </button>
                  </div>
                </div>

                {/* Campos Adicionales para Conductor: Selección de Tipo de Unidad (Carro vs Moto) */}
                {regAccountType === 'conductor' && (
                  <div className={`p-3.5 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
                    isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-xs font-black ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        <Car className="w-4 h-4" />
                        <span>Selecciona tu Tipo de Vehículo para Registro *</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-200/60 text-amber-800'}`}>
                        2 Opciones Oficiales
                      </span>
                    </div>

                    {/* Selector Visual de 2 Opciones: CARRO vs MOTO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* OPCIÓN 1: CARRO / AUTO */}
                      <div
                        onClick={() => setRegVehicleType('auto')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          regVehicleType === 'auto' || regVehicleType === 'camioneta'
                            ? isDark
                              ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                              : 'bg-amber-100/70 border-amber-500 shadow-sm'
                            : isDark
                              ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 opacity-70'
                              : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🚗</span>
                            <div>
                              <h5 className={`text-xs font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                CARRO / AUTO
                              </h5>
                              <span className="text-[10px] text-amber-500 font-bold">1 a 4 Pasajeros</span>
                            </div>
                          </div>
                          {(regVehicleType === 'auto' || regVehicleType === 'camioneta') && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </div>

                        <ul className="space-y-1 text-[10px] text-zinc-400 dark:text-zinc-300 border-t border-zinc-800/60 pt-1.5">
                          <li className="flex items-center gap-1">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Carrera Urbana:</strong> 1-4 pasajeros ($3-$12)</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Encomiendas:</strong> Dentro de ciudad e interprovincial</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Delivery:</strong> Compras en locales y comida</span>
                          </li>
                          <li className="flex items-center gap-1 text-amber-400 font-semibold">
                            <span>⭐</span>
                            <span><strong>Ejecutivo:</strong> Si el Admin aprueba el vehículo</span>
                          </li>
                        </ul>
                      </div>

                      {/* OPCIÓN 2: MOTO */}
                      <div
                        onClick={() => setRegVehicleType('moto')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          regVehicleType === 'moto'
                            ? isDark
                              ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                              : 'bg-amber-100/70 border-amber-500 shadow-sm'
                            : isDark
                              ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 opacity-70'
                              : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🏍️</span>
                            <div>
                              <h5 className={`text-xs font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                MOTO / MOTOCICLETA
                              </h5>
                              <span className="text-[10px] text-sky-400 font-bold">1 Sola Persona</span>
                            </div>
                          </div>
                          {regVehicleType === 'moto' && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </div>

                        <ul className="space-y-1 text-[10px] text-zinc-400 dark:text-zinc-300 border-t border-zinc-800/60 pt-1.5">
                          <li className="flex items-center gap-1 font-semibold text-sky-300">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Carrera Urbana:</strong> 1 sola persona (máx 1 pax)</span>
                          </li>
                          <li className="flex items-center gap-1 font-semibold text-amber-300 bg-amber-500/10 p-1 rounded-md border border-amber-500/30 my-0.5">
                            <span>🪖</span>
                            <span><strong>Casco Obligatorio:</strong> El conductor debe llevar casco extra para el cliente</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Delivery:</strong> Comida y compras directas en locales</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Encomiendas:</strong> Encomienda ciudad e interprovincial</span>
                          </li>
                          <li className="flex items-center gap-1 text-zinc-500">
                            <span className="text-rose-400">✗</span>
                            <span>Sin servicio ejecutivo (solo autos)</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                          Marca y Modelo {regVehicleType === 'moto' ? 'de la Moto' : 'del Auto'} *
                        </label>
                        <input
                          type="text"
                          value={regVehicleModel}
                          onChange={(e) => setRegVehicleModel(e.target.value)}
                          placeholder={regVehicleType === 'moto' ? 'Ej: Honda CB160 / Suzuki GN125' : 'Ej: Chevrolet Sail / Kia Soluto'}
                          className={`w-full border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 ${
                            isDark
                              ? 'bg-zinc-950 border-zinc-700 text-white focus:ring-emerald-500'
                              : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                          Placa Oficial Ecuatoriana *
                        </label>
                        <input
                          type="text"
                          value={regVehiclePlate}
                          onChange={(e) => setRegVehiclePlate(e.target.value.toUpperCase())}
                          placeholder={regVehicleType === 'moto' ? 'Ej: IB-123A o AB-456C' : 'Ej: PBA-8321 o ABC-1234'}
                          maxLength={8}
                          className={`w-full border rounded-xl px-2.5 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 ${
                            isDark
                              ? 'bg-zinc-950 border-zinc-700 text-amber-300 focus:ring-emerald-500'
                              : 'bg-white border-slate-200 text-amber-700 focus:ring-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Nombre Completo */}
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Nombres y Apellidos Completos *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-reg-fullname"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Ej: Mateo Sebastián Morales"
                      className={`w-full border rounded-2xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="input-reg-email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="tucorreo@gmail.com"
                      className={`w-full border rounded-2xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Contraseña & Confirmar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="input-reg-password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className={`w-full border rounded-2xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                      <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className={`absolute right-3 top-3.5 ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        id="input-reg-confirm-password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className={`w-full border rounded-2xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Seguridad: {passwordStrength.label}</span>
                      <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>{passwordStrength.percent}%</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Documento de Identidad (Cédula o Pasaporte / Extranjero) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span>Documento de Identidad</span>
                    </label>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      🌎 Extranjeros Bienvenidos
                    </span>
                  </div>

                  {/* Document Type Selector Tabs */}
                  <div className={`grid grid-cols-2 p-1 rounded-xl mb-2 border ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setRegDocType('cedula');
                        setRegCedula('');
                        setCedulaValidation(null);
                      }}
                      className={`py-1.5 px-2 text-[11px] font-extrabold rounded-lg transition-all ${
                        regDocType === 'cedula'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🇪🇨 Cédula Ecuatoriana
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegDocType('pasaporte');
                        setRegCedula('');
                        setCedulaValidation(null);
                      }}
                      className={`py-1.5 px-2 text-[11px] font-extrabold rounded-lg transition-all ${
                        regDocType === 'pasaporte'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🌎 Pasaporte / DNI Extranjero
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      id="input-reg-cedula"
                      inputMode={regDocType === 'cedula' ? 'numeric' : 'text'}
                      maxLength={regDocType === 'cedula' ? 10 : 18}
                      value={regCedula}
                      onChange={(e) => handleCedulaInputChange(e.target.value)}
                      placeholder={regDocType === 'cedula' ? 'Ej: 1724589012 (10 dígitos)' : 'Ej: Pasaporte / DNI / Cédula Extranjera (P9821034)'}
                      className={`w-full border rounded-2xl pl-10 pr-9 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    {cedulaValidation && (
                      <div className="absolute right-3 top-3">
                        {cedulaValidation.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Validation result feedback */}
                  {cedulaValidation && regAccountType === 'conductor' ? (
                    <p
                      className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                        cedulaValidation.isValid ? 'text-emerald-400' : 'text-rose-600'
                      }`}
                    >
                      <span>{cedulaValidation.message}</span>
                    </p>
                  ) : (
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {regAccountType === 'cliente'
                        ? 'Registro libre y rápido para clientes sin restricciones ni papeleo.'
                        : regDocType === 'pasaporte'
                        ? 'Aceptamos Pasaporte, DNI o Cédula Extranjera + Licencia Ecuatoriana ANT.'
                        : '10 dígitos con verificación para conductores.'}
                    </p>
                  )}
                </div>

                {/* Campo Obligatorio de Licencia Ecuatoriana ANT para Conductor Extranjero */}
                {regDocType === 'pasaporte' && regAccountType === 'conductor' && (
                  <div className={`p-3 rounded-2xl border space-y-2 animate-in fade-in ${
                    isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <label className={`block text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>Licencia Ecuatoriana ANT Obligatoria (Conductor Extranjero) *</span>
                    </label>
                    <p className={`text-[10px] leading-tight ${isDark ? 'text-amber-200/90' : 'text-amber-700'}`}>
                      ⚠️ Para conducir en Ecuador, la Ley Orgánica de Transporte Terrestre exige que los conductores extranjeros dispongan obligatoriamente de una <strong>Licencia Ecuatoriana (ANT)</strong> vigente homologada o canjeada.
                    </p>
                    <input
                      type="text"
                      required
                      value={regLicenseNumber}
                      onChange={(e) => setRegLicenseNumber(e.target.value)}
                      placeholder="Número de Licencia Ecuatoriana ANT (Ej: 1718293041)"
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white focus:border-amber-400' : 'bg-white border-amber-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                )}

                {/* Teléfono Celular & Provincia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Teléfono Celular (WhatsApp)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className={`px-2.5 py-2.5 rounded-2xl border text-xs font-bold flex-shrink-0 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        🇪🇨 +593
                      </div>
                      <input
                        type="tel"
                        id="input-reg-phone"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="0998241902"
                        className={`w-full border rounded-2xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Provincia Base
                      </label>
                      <select
                        id="select-reg-province"
                        value={regProvince}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setRegProvince(prov);
                          const cantons = getCantonsForProvince(prov);
                          if (cantons.length > 0) {
                            setRegCanton(cantons[0]);
                          }
                        }}
                        className={`w-full border rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        {ECUADOR_GEOGRAPHY.map((item) => (
                          <option key={item.province} value={item.province} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                            {item.province}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        Cantón / Ciudad
                      </label>
                      <select
                        id="select-reg-canton"
                        value={regCanton}
                        onChange={(e) => setRegCanton(e.target.value)}
                        className={`w-full border rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        {getCantonsForProvince(regProvince).map((cantonName) => (
                          <option key={cantonName} value={cantonName} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                            {cantonName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Informative Map Adaptation Badge */}
                  <div className={`p-2.5 rounded-2xl border flex items-center gap-2 text-[11px] ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  }`}>
                    <MapPin className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span>
                      <strong>Adaptación Automática:</strong> El mapa se centrará directamente en <strong>{regCanton}, {regProvince}</strong> para que no tengas que buscarlo.
                    </span>
                  </div>
                </div>

                {/* Mandatory Checkbox: Terms and Conditions & Privacy Policy */}
                <div className={`p-3 rounded-2xl border space-y-1.5 ${
                  isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <label className={`flex items-start gap-2.5 text-xs cursor-pointer select-none ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    <input
                      type="checkbox"
                      id="checkbox-accept-terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className={`w-4 h-4 mt-0.5 rounded focus:ring-0 flex-shrink-0 ${
                        isDark ? 'bg-zinc-900 border-zinc-700 text-emerald-500' : 'bg-white border-slate-300 text-emerald-600'
                      }`}
                    />
                    <span className={`text-[11px] leading-tight ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      He leído y acepto los{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLegalDocType('terminos');
                          setShowLegalModal(true);
                        }}
                        className={`font-bold hover:underline cursor-pointer ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
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
                        className={`font-bold hover:underline cursor-pointer ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
                      >
                        Política de Privacidad
                      </button>{' '}
                      de AndesMovi (Ley LOPDP Ecuador).
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  id="btn-submit-register"
                  disabled={isRegistering}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all min-h-[46px] active:scale-98 ${
                    isDark 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando cuenta en Ecuador...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Crear Cuenta en AndesMovi</span>
                    </>
                  )}
                </button>
              </form>

              {/* Registro Rápido */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`} />
                </div>
                <span className={`relative px-3 text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400'
                }`}>
                  O registro rápido con
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className={`p-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 border ${
                    isDark 
                      ? 'bg-white hover:bg-zinc-100 text-zinc-900 border-transparent' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  className="p-2.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <span>Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={handleIcloudLogin}
                  className={`p-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 border ${
                    isDark 
                      ? 'bg-zinc-950 hover:bg-black text-white border-zinc-700' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
                  }`}
                >
                  <span>Apple ID</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>¿Ya tienes una cuenta registrada? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`text-xs font-bold hover:underline ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
                >
                  Inicia sesión aquí
                </button>
              </div>
            </div>
          )}


          {/* ============================================================== */}
          {/* TAB 3: CÓDIGO SMS OTP                                         */}
          {/* ============================================================== */}
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="text-center pb-1">
                <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Acceso Rápido por Celular</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Recibe un código de 4 dígitos vía SMS sin necesidad de recordar contraseña</p>
              </div>

              {smsStep === 'input_phone' ? (
                <form onSubmit={handleSendSms} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Número Celular de Ecuador (+593)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-3 py-3 rounded-2xl border text-sm font-bold flex-shrink-0 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <span>🇪🇨 +593</span>
                      </div>
                      <input
                        type="tel"
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        placeholder="099 123 4567"
                        className={`w-full border rounded-2xl px-3.5 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500 ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingSms || !smsPhone}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                      isDark 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {isSendingSms ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enviando SMS al +593...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Código SMS</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifySmsCode} className="space-y-4">
                  <div className={`p-3 rounded-2xl border text-xs ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Código SMS enviado a: +593 {smsPhone}</p>
                    <p className={`${isDark ? 'text-zinc-400' : 'text-slate-500'} mt-0.5`}>Ingresa los 4 dígitos que recibiste en tu celular.</p>
                  </div>

                  {/* Recaptcha container */}
                  <div id="recaptcha-container"></div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 text-center ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      Código de 4 dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className={`w-full text-center tracking-[1em] text-2xl font-mono border rounded-2xl py-3 focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className={`flex items-center justify-between text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <span>Reenviar en {countdown}s</span>
                    <button
                      type="button"
                      onClick={() => setSmsStep('input_phone')}
                      className={`font-bold hover:underline ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}
                    >
                      Cambiar número
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={smsCode.length < 4}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                      isDark 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } disabled:opacity-50`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Ingresar</span>
                  </button>
                </form>
              )}
            </div>
          )}


          {/* ============================================================== */}
          {/* TAB 4: MI PERFIL                                              */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {currentUser ? (
                <>
                  <div className={`p-4 rounded-3xl border flex items-center gap-4 ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="relative flex-shrink-0">
                      <img
                        src={currentUser.avatar || null}
                        alt={currentUser.name}
                        className={`w-16 h-16 rounded-2xl object-cover border-2 ${isDark ? 'border-emerald-500/50' : 'border-emerald-500/30'}`}
                      />
                      <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${isDark ? 'bg-emerald-500 text-zinc-950' : 'bg-emerald-600 text-white'}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`text-base font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser.name}</h4>
                      <p className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{currentUser.email || currentUser.phone}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          isDark 
                            ? 'text-amber-400 bg-amber-400/10 border-amber-500/20' 
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}>
                          <Star className={`w-3 h-3 mr-1 ${isDark ? 'fill-amber-400' : 'fill-amber-600'}`} />
                          {currentUser.rating}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {currentUser.totalTripsCompleted} viajes en Ecuador
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Credentials */}
                  <div className="space-y-2">
                    <h5 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Credenciales Verificadas en Ecuador
                    </h5>

                    {/* Cédula */}
                    <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-100'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <CreditCard className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <div>
                          <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>Cédula de Identidad</span>
                          <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {currentUser.cedula || 'No registrada'} • {currentUser.province || 'Ecuador'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        isDark 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Validada</span>
                      </span>
                    </div>

                    {/* Teléfono */}
                    <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-100'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <Phone className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <div>
                          <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>Teléfono Móvil</span>
                          <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{currentUser.phone}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        isDark 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>SMS Activo</span>
                      </span>
                    </div>

                    {/* Proveedor Auth */}
                    <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-100'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <Lock className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <div>
                          <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>Método de Acceso</span>
                          <span className={`text-[11px] uppercase font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                            {currentUser.authProvider}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDark ? 'text-zinc-400 bg-zinc-900 border-zinc-700' : 'text-slate-500 bg-slate-50 border-slate-200'
                      }`}>
                        Conectado
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={onLogout}
                      className={`w-full py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                        isDark 
                          ? 'bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border-zinc-700 hover:border-rose-800/40' 
                          : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200 shadow-sm'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                    isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No has iniciado sesión</h4>
                    <p className={`text-xs mt-1 max-w-xs mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Inicia sesión con tu cuenta o crea una nueva para tener tu perfil verificado.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className={`px-4 py-2 rounded-xl font-bold text-xs ${
                        isDark ? 'bg-emerald-500 text-zinc-950' : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                      }`}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className={`px-4 py-2 rounded-xl font-bold text-xs border ${
                        isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      Crear Cuenta
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn ${
          isDark ? 'bg-black/85' : 'bg-slate-900/60'
        }`}>
          <div className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-5 animate-scaleUp ${
            isDark ? 'bg-zinc-950 border-emerald-500/40 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  isDark ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Recuperación de Contraseña</h4>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>AndesMovi • Seguridad Ecuador</p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                ✕
              </button>
            </div>

            {forgotStep === 'input' && (
              <div className="space-y-4">
                <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  Ingresa tu número celular registrado (+593) o correo electrónico para enviarte un código de verificación SMS.
                </p>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Celular o Cédula / Correo</label>
                  <input
                    type="text"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="ej: +593 99 123 4567 o usuario@gmail.com"
                    className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!forgotInput.trim()) {
                      setForgotMessage('Por favor ingresa tu número o correo.');
                      return;
                    }
                    setForgotMessage(null);
                    setForgotStep('code');
                  }}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg ${
                    isDark 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  Enviar Código SMS de Recuperación
                </button>
              </div>
            )}

            {forgotStep === 'code' && (
              <div className="space-y-4">
                <div className={`p-3 rounded-xl border text-xs ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  ✓ Código de verificación enviado al número asociado.
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Ingresa el Código de 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="4829"
                    className={`w-full border rounded-2xl px-4 py-3 text-center tracking-widest font-mono text-lg focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
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
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg ${
                    isDark 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  Verificar Código
                </button>
              </div>
            )}

            {forgotStep === 'new_pass' && (
              <div className="space-y-4">
                <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Ingresa tu nueva contraseña segura para acceder a tu cuenta AndesMovi.</p>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
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
                      const cleanForgot = forgotInput.trim().toLowerCase();
                      const cleanDigits = forgotInput.replace(/\D/g, '');
                      const stored = localStorage.getItem('andesmovi_user_registry');
                      let list = stored ? JSON.parse(stored) : [];
                      let found = false;
                      list = list.map((acc: any) => {
                        if (
                          (acc.email && acc.email.toLowerCase().trim() === cleanForgot) ||
                          (cleanDigits.length === 10 && acc.cedula?.replace(/\D/g, '') === cleanDigits) ||
                          (cleanDigits.length >= 7 && acc.phone?.replace(/\D/g, '')?.includes(cleanDigits))
                        ) {
                          found = true;
                          return { ...acc, password: newPasswordVal };
                        }
                        return acc;
                      });
                      if (!found) {
                        list.push({
                          id: `usr-recov-${Date.now()}`,
                          name: cleanForgot.includes('@') ? cleanForgot.split('@')[0] : 'Usuario AndesMovi',
                          email: cleanForgot.includes('@') ? cleanForgot : '',
                          cedula: cleanDigits.length === 10 ? cleanDigits : '1724589012',
                          phone: cleanDigits.length !== 10 ? cleanDigits : '',
                          password: newPasswordVal,
                          role: loginRoleMode || 'cliente',
                          province: 'Pichincha',
                        });
                      }
                      localStorage.setItem('andesmovi_user_registry', JSON.stringify(list));
                    } catch (e) {
                      console.warn('Error updating password in registry', e);
                    }
                    setForgotStep('success');
                  }}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg ${
                    isDark 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  Actualizar Contraseña
                </button>
              </div>
            )}

            {forgotStep === 'success' && (
              <div className="space-y-4 text-center py-4">
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto animate-bounce ${
                  isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                  ✓
                </div>
                <div>
                  <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>¡Contraseña Actualizada con Éxito!</h5>
                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep('input');
                    setForgotInput('');
                    setEnteredCode('');
                    setNewPasswordVal('');
                  }}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg ${
                    isDark 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            )}

            {forgotMessage && (
              <p className={`text-xs font-semibold text-center p-2 rounded-xl border animate-shake ${
                isDark ? 'text-rose-400 bg-red-950/40 border-red-500/30' : 'text-rose-600 bg-rose-50 border-rose-200'
              }`}>
                {forgotMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Términos y Condiciones y Políticas de Privacidad */}
      {showLegalModal && (
        <LegalTermsModal
          isOpen={showLegalModal}
          initialDoc={legalDocType}
          onClose={() => setShowLegalModal(false)}
          showAcceptButton={true}
          isDark={isDark}
          onAccept={() => {
            setAcceptTerms(true);
            setShowLegalModal(false);
          }}
        />
      )}

      {/* Pantalla Obligatoria tras Autenticación Social (Cédula + Consulta SRI + Teléfono + Unicidad) */}
      {socialPendingData && (
        <SocialRegistrationModal
          isOpen={Boolean(socialPendingData)}
          socialData={socialPendingData}
          isDark={isDark}
          onConfirmRegistration={(user) => {
            setSocialPendingData(null);
            setFeedbackSuccess(`¡Bienvenido a AndesMovi, ${user.name}!`);
            setTimeout(() => {
              onLoginSuccess(user);
            }, 300);
          }}
          onCancel={() => setSocialPendingData(null)}
          onSwitchToLogin={() => {
            setSocialPendingData(null);
            setActiveTab('login');
          }}
        />
      )}

    </div>
  );
};

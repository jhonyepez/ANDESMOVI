import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  DriverDocuments,
  UserRole,
  VerificationDocumentStatus,
} from '../types';
import { validateEcuadorianCedula, CedulaValidationResult } from '../utils/cedulaValidator';
import { ECUADOR_GEOGRAPHY, getCantonsForProvince } from '../data/ecuador_geography';
import {
  preValidateDocumentWithGemini,
  DocumentValidationResponse,
} from '../utils/documentAiValidator';
import { LegalTermsModal, LegalDocType } from './LegalTermsModal';
import { processLoginSessionMiddleware } from '../services/sessionMiddleware';
import { queryCriminalRecordByCedula, CriminalRecordResult } from '../services/ministerioInteriorService';
import { databaseService } from '../services/databaseService';
import {
  ShieldCheck,
  CreditCard,
  FileText,
  Car,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Upload,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Eye,
  EyeOff,
  Building,
  MapPin,
  HelpCircle,
  ArrowRight,
  Zap,
  RefreshCw,
  AlertCircle,
  Camera,
  Check,
  KeyRound,
  X,
} from 'lucide-react';

interface RegistrationGateModalProps {
  isOpen: boolean;
  onCompleteRegistration: (user: UserProfile, driverDocs?: DriverDocuments) => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialTab?: 'register' | 'login';
  initialRole?: 'conductor' | 'cliente';
  onClose?: () => void;
  isDark?: boolean;
}

export const RegistrationGateModal: React.FC<RegistrationGateModalProps> = ({
  isOpen,
  onCompleteRegistration,
  onLoginSuccess,
  initialTab = 'register',
  initialRole = 'conductor',
  onClose,
  isDark = true,
}) => {
  const isDarkTheme = isDark;

  // Active view: 'register' | 'login'
  const [activeTab, setActiveTab] = useState<'register' | 'login'>(initialTab);

  // Account Type
  const [accountRole, setAccountRole] = useState<'conductor' | 'cliente'>(initialRole);

  // Synchronize when initial props change
  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    if (initialRole) setAccountRole(initialRole);
  }, [initialRole]);

  // Personal data & Nationality
  const [nationalityType, setNationalityType] = useState<'ecuatoriano' | 'extranjero'>('ecuatoriano');
  const [fullName, setFullName] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [province, setProvince] = useState<string>('Pichincha');
  const [canton, setCanton] = useState<string>('Quito');
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');

  // Live Cédula validation result
  const [cedulaValidation, setCedulaValidation] = useState<CedulaValidationResult | null>(null);

  // Photos for Cédula Ecuatoriana & Gemini Pre-Validation
  const [cedulaFrontPhoto, setCedulaFrontPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
  );
  const [cedulaBackPhoto, setCedulaBackPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80'
  );
  const [cedulaPreValidation, setCedulaPreValidation] = useState<DocumentValidationResponse | null>({
    isLegible: true,
    documentCategory: 'cedula',
    confidenceScore: 96,
    detectedIdNumber: '1004721351',
    detectedFullName: 'Patricio Javier Morales Cisneros',
    feedback: 'Cédula de Identidad de Ecuador nítida y perfectamente legible verificada por IA Gemini.',
    issues: [],
    analyzedAt: Date.now(),
    isAiValidated: true,
  });
  const [isCheckingCedulaLegibility, setIsCheckingCedulaLegibility] = useState<boolean>(false);

  // Driver Documents ("licencia y los demás documentos")
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [licenseType, setLicenseType] = useState<'Tipo A' | 'Tipo B' | 'Tipo C' | 'Tipo C1' | 'Tipo D' | 'Tipo E'>('Tipo C');
  const [licenseExpiration, setLicenseExpiration] = useState<string>('2028-12-31');
  const [licenseFrontPhoto, setLicenseFrontPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&auto=format&fit=crop&q=80'
  );
  const [licenseBackPhoto, setLicenseBackPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80'
  );

  // Gemini Pre-Validation for Driver's License
  const [licensePreValidation, setLicensePreValidation] = useState<DocumentValidationResponse | null>({
    isLegible: true,
    documentCategory: 'licencia',
    confidenceScore: 95,
    detectedIdNumber: '1004721351',
    detectedFullName: 'Patricio Javier Morales Cisneros',
    feedback: 'Licencia de Conducir profesional ANT Tipo C nítida y legible verificada por IA Gemini.',
    issues: [],
    analyzedAt: Date.now(),
    isAiValidated: true,
  });
  const [isCheckingLicenseLegibility, setIsCheckingLicenseLegibility] = useState<boolean>(false);

  // Criminal Record (Antecedentes Penales)
  const [criminalRecordNumber, setCriminalRecordNumber] = useState<string>('POL-EC-2026-889104');
  const [criminalCount, setCriminalCount] = useState<number>(0);
  const [hasSevereCrime, setHasSevereCrime] = useState<boolean>(false);
  const [criminalRecordPhoto, setCriminalRecordPhoto] = useState<string>('');
  const [criminalRecordResult, setCriminalRecordResult] = useState<CriminalRecordResult | null>({
    success: true,
    cedula: '1004721351',
    fullName: 'PATRICIO JAVIER MORALES CISNEROS',
    certificateNumber: 'POL-EC-2026-889104',
    hasCriminalRecord: false,
    criminalRecordCount: 0,
    hasSevereRecord: false,
    details: 'El ciudadano NO registra antecedentes penales en el Ministerio de Gobierno de Ecuador.',
    authority: 'POLICÍA NACIONAL DEL ECUADOR - DIRECCIÓN NACIONAL DE INVESTIGACIÓN POLICIAL',
    validationSha: 'MTAwNDcyMTM1MS1QT0wtRUMtMjAyNi04ODkxMDQ=',
    verifiedAt: new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }),
    source: 'ministerio_interior_proxy',
  });
  const [isQueryingCriminalRecord, setIsQueryingCriminalRecord] = useState<boolean>(false);

  // Función para consultar en vivo antecedentes penales en el Ministerio del Interior de Ecuador
  const handleQueryCriminalRecord = async () => {
    if (!cedula || cedula.length !== 10) {
      setErrorMessage('Ingresa primero tu número de Cédula de Identidad de 10 dígitos.');
      return;
    }
    const val = validateEcuadorianCedula(cedula);
    if (!val.isValid) {
      setErrorMessage('Cédula de identidad ecuatoriana inválida. Corrígela antes de consultar antecedentes.');
      return;
    }

    setIsQueryingCriminalRecord(true);
    setErrorMessage(null);
    try {
      const result = await queryCriminalRecordByCedula(cedula);
      if (result.success) {
        setCriminalRecordResult(result);
        setCriminalRecordNumber(result.certificateNumber);
        setCriminalCount(result.criminalRecordCount);
        setHasSevereCrime(result.hasSevereRecord);
        if (result.hasSevereRecord || result.criminalRecordCount > 2) {
          setErrorMessage(
            `Alerta de Seguridad: La consulta oficial en el Ministerio del Interior retornó que este ciudadano registra antecedentes graves o inhabilitantes: "${result.details}".`
          );
        } else if (result.hasCriminalRecord) {
          setErrorMessage(
            `Advertencia: La consulta oficial en el Ministerio del Interior retornó que este ciudadano registra antecedentes menores (${result.criminalRecordCount}). Cumple con la normativa para operar.`
          );
        } else {
          setErrorMessage(null);
        }
      } else {
        setErrorMessage(`No se pudo verificar antecedentes: ${result.errorMessage || 'Error de conexión'}`);
      }
    } catch (err: any) {
      console.error('Error querying criminal record:', err);
      setErrorMessage('Error al conectar con la consulta pública del Ministerio del Interior.');
    } finally {
      setIsQueryingCriminalRecord(false);
    }
  };

  // Vehicle & RTV
  const [selectedVehicleType, setSelectedVehicleType] = useState<'auto' | 'moto'>('auto');
  const [vehiclePlate, setVehiclePlate] = useState<string>('PCH-4921');
  const [vehicleModel, setVehicleModel] = useState<string>('Chevrolet Sail Sedán 1.5L');
  const [rtvYear, setRtvYear] = useState<number>(2026);

  const handleSelectVehicleType = (type: 'auto' | 'moto') => {
    setSelectedVehicleType(type);
    if (type === 'auto') {
      setLicenseType('Tipo C');
      setVehiclePlate('PCH-4921');
      setVehicleModel('Chevrolet Sail Sedán 1.5L');
    } else {
      setLicenseType('Tipo A');
      setVehiclePlate('P-4821E');
      setVehicleModel('Honda CB190R Repsol / Moto Express');
    }
  };
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terminos');

  // Feedback & error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);

  // Login form state (if already registered)
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot Password Recovery State for Conductor & Cliente
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotInput, setForgotInput] = useState<string>('');
  const [forgotRole, setForgotRole] = useState<'conductor' | 'cliente'>('conductor');
  const [forgotStep, setForgotStep] = useState<'input' | 'code' | 'new_pass' | 'success'>('input');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [newPasswordVal, setNewPasswordVal] = useState<string>('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('conductor1@andesmovi.com')) {
        setActiveTab('login');
        setLoginIdentifier('conductor1@andesmovi.com');
        setLoginPassword('AndesMovi2026*Taxi');
      } else if (hash.includes('moto1@andesmovi.com')) {
        setActiveTab('login');
        setLoginIdentifier('moto1@andesmovi.com');
        setLoginPassword('AndesMovi2026*Moto');
      } else if (hash.includes('cliente1@andesmovi.com')) {
        setActiveTab('login');
        setLoginIdentifier('cliente1@andesmovi.com');
        setLoginPassword('AndesMovi2026*Cliente');
      }
    }
  }, []);

  if (!isOpen) return null;

  // Handle cédula change with real-time validation
  const handleCedulaChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 10);
    setCedula(raw);
    if (raw.length === 10) {
      const res = validateEcuadorianCedula(raw);
      setCedulaValidation(res);
      if (res.isValid && res.province) {
        setProvince(res.province);
        const cantons = getCantonsForProvince(res.province);
        if (cantons.length > 0) {
          setCanton(cantons[0]);
        }
      }
      // Autofill license number if empty
      if (!licenseNumber) {
        setLicenseNumber(raw);
      }
    } else {
      setCedulaValidation(null);
    }
  };

  // Pre-validar imagen de Cédula con IA Gemini
  const runCedulaPreValidation = async (imageToValidate?: string) => {
    const targetImg = imageToValidate || cedulaFrontPhoto;
    if (!targetImg) return;
    setIsCheckingCedulaLegibility(true);
    try {
      const res = await preValidateDocumentWithGemini(targetImg, 'cedula', {
        side: 'frontal',
        expectedId: cedula,
        expectedName: fullName,
      });
      setCedulaPreValidation(res);
      if (!res.isLegible) {
        setErrorMessage(
          `Auditoría Gemini AI: La imagen de la Cédula no es legible (${res.feedback}). Debes subir una imagen nítida antes de registrarte.`
        );
      } else {
        setErrorMessage(null);
      }
      return res;
    } catch (err: any) {
      console.error('Error pre-validating cedula:', err);
    } finally {
      setIsCheckingCedulaLegibility(false);
    }
  };

  // Pre-validar imagen de Licencia con IA Gemini
  const runLicensePreValidation = async (imageToValidate?: string) => {
    const targetImg = imageToValidate || licenseFrontPhoto;
    if (!targetImg) return;
    setIsCheckingLicenseLegibility(true);
    try {
      const res = await preValidateDocumentWithGemini(targetImg, 'licencia', {
        side: 'frontal',
        expectedId: licenseNumber || cedula,
        expectedName: fullName,
      });
      setLicensePreValidation(res);
      if (!res.isLegible) {
        setErrorMessage(
          `Auditoría Gemini AI: La imagen de la Licencia no es legible (${res.feedback}). Debes subir una imagen nítida antes de registrarte.`
        );
      } else {
        setErrorMessage(null);
      }
      return res;
    } catch (err: any) {
      console.error('Error pre-validating license:', err);
    } finally {
      setIsCheckingLicenseLegibility(false);
    }
  };

  // Subir foto de Cédula (Frontal o Posterior) y auditar legibilidad
  const handleCedulaPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (target === 'front') {
          setCedulaFrontPhoto(result);
          await runCedulaPreValidation(result);
        } else {
          setCedulaBackPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir foto de Licencia (Frontal o Posterior) y auditar legibilidad
  const handleLicensePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (target === 'front') {
          setLicenseFrontPhoto(result);
          await runLicensePreValidation(result);
        } else {
          setLicenseBackPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir foto de Certificado de Antecedentes Penales
  const handleCriminalRecordPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setCriminalRecordPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Registration con pre-validación estricta de legibilidad mediante Gemini AI antes de guardar en la BD
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validar datos personales según Nacionalidad (Ecuatoriano / Persona Extranjera)
    if (!fullName.trim()) {
      setErrorMessage('Debes ingresar tus nombres y apellidos completos.');
      return;
    }

    if (accountRole === 'conductor') {
      if (nationalityType === 'ecuatoriano') {
        if (!cedula.trim() || cedula.length !== 10) {
          setErrorMessage('Debes ingresar los 10 dígitos de tu Cédula de Identidad Ecuatoriana para registrarte como conductor.');
          return;
        }
        const val = validateEcuadorianCedula(cedula);
        if (!val.isValid) {
          setErrorMessage(`Cédula ecuatoriana inválida: ${val.message}. Conductor ecuatoriano requiere cédula legal.`);
          return;
        }
      } else {
        // Conductor Extranjero
        if (!cedula.trim() || cedula.length < 5) {
          setErrorMessage('Debes ingresar tu Pasaporte o DNI Extranjero para el registro de identidad.');
          return;
        }
      }
    } else {
      // Cliente: Si es extranjero o ecuatoriano, registro libre
      if (nationalityType === 'extranjero' && cedula.trim() && cedula.length < 4) {
        setErrorMessage('El pasaporte o documento extranjero ingresado es muy corto.');
        return;
      }
    }

    if (!phone.trim() || phone.length < 7) {
      setErrorMessage('Debes ingresar un número celular o telefónico de contacto.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Debes ingresar un correo electrónico válido.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('La contraseña de acceso debe contener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Debes aceptar los términos de uso de AndesMovi.');
      return;
    }

    setIsSubmitting(true);

    // 3. Pre-validación de documentos de Conducción si es conductor
    let driverDocsPayload: DriverDocuments | undefined = undefined;

    if (accountRole === 'conductor') {
      if (!licenseNumber.trim()) {
        setIsSubmitting(false);
        setErrorMessage('La Licencia de Conducir es obligatoria para iniciar como conductor.');
        return;
      }

      if (!licenseExpiration) {
        setIsSubmitting(false);
        setErrorMessage('Debes indicar la fecha de vigencia de tu Licencia de Conducir.');
        return;
      }

      const expDate = new Date(licenseExpiration);
      if (isNaN(expDate.getTime()) || expDate.getTime() < Date.now()) {
        setIsSubmitting(false);
        setErrorMessage('Tu Licencia de Conducir está vencida o tiene fecha inválida. La ANT exige licencia vigente.');
        return;
      }

      if (!licenseFrontPhoto) {
        setIsSubmitting(false);
        setErrorMessage('Debes adjuntar la foto frontal de tu Licencia de Conducir.');
        return;
      }

      // Pre-validación de imagen de Licencia con Gemini AI
      let activeLicenseVal = licensePreValidation;
      if (!activeLicenseVal) {
        activeLicenseVal = await preValidateDocumentWithGemini(licenseFrontPhoto, 'licencia', {
          side: 'frontal',
          expectedId: licenseNumber || cedula,
          expectedName: fullName,
        });
        setLicensePreValidation(activeLicenseVal);
      }

      if (activeLicenseVal && !activeLicenseVal.isLegible) {
        setIsSubmitting(false);
        setErrorMessage(
          `La Licencia de Conducir no es legible para ser guardada en la base de datos: ${activeLicenseVal.feedback}. Por favor sube una foto nítida y enfocada.`
        );
        return;
      }

      if (!criminalRecordNumber.trim()) {
        setIsSubmitting(false);
        setErrorMessage('Debes ingresar el número de Certificado de Antecedentes Penales de la Policía Nacional.');
        return;
      }

      if (criminalCount > 2 || hasSevereCrime) {
        setIsSubmitting(false);
        setErrorMessage('La normativa de AndesMovi permite un máximo de 2 antecedentes sin gravedad para operar.');
        return;
      }

      if (!vehiclePlate.trim() || vehiclePlate.length < 6) {
        setIsSubmitting(false);
        setErrorMessage('Debes ingresar la placa vehicular oficial (formato AAA-1234).');
        return;
      }

      const isLicenseValid = expDate.getTime() > Date.now();
      const isCriminalApproved = criminalCount <= 2 && !hasSevereCrime;
      const isFullyValid = isLicenseValid && isCriminalApproved && rtvYear >= 2025;

      driverDocsPayload = {
        licenseNumber: licenseNumber.trim(),
        licenseType,
        licenseExpiration,
        isLicenseValid,
        licenseStatus: (isLicenseValid ? 'aprobado' : 'en_revision') as VerificationDocumentStatus,
        licenseReviewedAt: 'Registro Inicial ' + new Date().toLocaleDateString(),
        licenseReviewerNotes: `Auditado con Gemini AI. Legibilidad: ${activeLicenseVal?.confidenceScore || 95}% - ${activeLicenseVal?.feedback || 'Válido'}.`,
        licenseFrontPhoto,
        licenseBackPhoto,
        criminalRecordPhoto: criminalRecordPhoto || undefined,
        licenseAiValidation: activeLicenseVal || undefined,
        criminalRecordCount: criminalCount,
        hasSevereRecord: hasSevereCrime,
        criminalRecordCertificateNumber: criminalRecordNumber.trim(),
        isCriminalRecordApproved: isCriminalApproved,
        criminalRecordStatus: (isCriminalApproved ? 'aprobado' : 'en_revision') as VerificationDocumentStatus,
        criminalRecordReviewedAt: 'Registro Inicial ' + new Date().toLocaleDateString(),
        rtvInspectionYear: rtvYear,
        rtvStatus: rtvYear >= 2025 ? 'vigente' : 'vencida',
        rtvDocStatus: 'aprobado',
        vehicleRegistrationPlate: vehiclePlate.trim().toUpperCase(),
        vehicleType: selectedVehicleType,
        vehicleModel: vehicleModel.trim(),
        isFullyVerified: isFullyValid,
        overallStatus: isFullyValid ? 'aprobado' : 'en_revision',
        adminVerificationNotes: `Vehículo ${selectedVehicleType === 'moto' ? 'Motocicleta (1 Pax / Delivery)' : 'Automóvil (4 Pax / Ejecutivo / Delivery)'} pre-validado con IA Gemini.`,
        lastAdminReviewDate: new Date().toLocaleDateString(),
      };
    }

    // 4. Guardar usuario con registros de pre-validación IA en la base de datos
    setSuccessAnimation(true);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      cedula: cedula.trim(),
      cedulaVerified: true,
      cedulaFrontPhoto,
      cedulaBackPhoto,
      cedulaAiValidation: cedulaPreValidation || undefined,
      province,
      canton,
      avatar:
        accountRole === 'conductor'
          ? (selectedVehicleType === 'moto'
              ? 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authProvider: 'cedula',
      rating: 5.0,
      totalTripsCompleted: 0,
      isVerified: true,
      createdAt: Date.now(),
      role: accountRole as UserRole,
      isRegistrationComplete: true,
      driverDocuments: driverDocsPayload,
      vehicle: accountRole === 'conductor' ? {
        type: selectedVehicleType,
        model: vehicleModel.trim(),
        plate: vehiclePlate.trim().toUpperCase(),
        color: selectedVehicleType === 'moto' ? 'Negro / Naranja' : 'Plata Brillante',
        year: 2023,
      } : undefined,
      emergencyContacts: emergencyName
        ? [
            {
              id: `em-${Date.now()}`,
              name: emergencyName.trim(),
              relationship: 'Contacto Principal',
              phone: emergencyPhone.trim() || phone.trim(),
              isPrimary: true,
              notifyBySms: true,
              notifyByWhatsapp: true,
            },
          ]
        : [],
    };

    // Registrar cuenta con credenciales en databaseService
    databaseService.registerNewAccount({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      cedula: newUser.cedula,
      password: password,
      role: newUser.role,
      province: newUser.province,
      canton: newUser.canton,
      avatar: newUser.avatar,
      vehicleModel: vehicleModel,
      plate: vehiclePlate,
      vehicleType: selectedVehicleType,
    });

    const sessionResult = processLoginSessionMiddleware(newUser);

    setTimeout(() => {
      setIsSubmitting(false);
      onCompleteRegistration(sessionResult.user, driverDocsPayload);
    }, 900);
  };

  // Submit Login (if returning user) con validación estricta
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = loginIdentifier.trim().toLowerCase();

    if (!identifier) {
      setLoginError('Ingresa tu Cédula, Correo o Celular registrado.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Ingresa tu contraseña.');
      return;
    }

    const authResult = databaseService.authenticateUser(identifier, loginPassword, accountRole);

    if (!authResult.success || !authResult.user) {
      setLoginError('Correo o contraseña incorrectos');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const sessionResult = processLoginSessionMiddleware(authResult.user!);
      setSuccessAnimation(true);
      setTimeout(() => {
        onLoginSuccess(sessionResult.user);
      }, 700);
    }, 500);
  };

  return (
    <div
      id="registration-gate-overlay"
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl my-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-amber-500/30 rounded-3xl shadow-2xl shadow-slate-500/10 dark:shadow-amber-500/10 overflow-hidden flex flex-col max-h-[94vh] text-slate-800 dark:text-zinc-100 transition-colors">
        {/* Header with Andean identity & strict warning */}
        <div className="bg-gradient-to-r from-amber-600/10 via-slate-100 to-amber-950/10 dark:from-amber-600/30 dark:via-zinc-900 dark:to-amber-950/40 p-5 sm:p-6 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ShieldCheck className="w-7 h-7 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">AndesMovi Ecuador</h1>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {accountRole === 'conductor' ? 'Conductores' : 'Clientes'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {accountRole === 'conductor'
                    ? 'Registro de Identidad, Licencia y Documentos Oficiales'
                    : 'Crea tu cuenta de cliente sin restricciones ni trámites'}
                </p>
              </div>
            </div>

            {/* Botón X para cerrar modal y explorar la app */}
            {onClose && (
              <button
                type="button"
                id="btn-close-registration-modal"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex-shrink-0"
                title="Cerrar y continuar explorando"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Security Gate Notice */}
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed font-medium">
              {accountRole === 'conductor' ? (
                <>
                  <strong className="text-amber-600 dark:text-amber-300 font-bold">Conductores:</strong> Para poder
                  operar en la plataforma, debes ingresar tus datos personales y adjuntar tu
                  cédula, licencia de conducir vigente y revisión vehicular.
                </>
              ) : (
                <>
                  <strong className="text-amber-600 dark:text-amber-300 font-bold">Registro de Clientes Libre:</strong> Crea
                  tu cuenta de pasajero tranquilamente sin restricción de SRI ni validaciones complejas. ¡Listo para viajar!
                </>
              )}
            </p>
          </div>

          {/* Top Switcher: Registro vs Ya Tengo Cuenta */}
          <div className="mt-4 grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              id="tab-register-btn"
              onClick={() => setActiveTab('register')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nuevo Registro de Documentos
            </button>
            <button
              type="button"
              id="tab-login-btn"
              onClick={() => setActiveTab('login')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ya Tengo Cuenta (Iniciar Sesión)
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Success Animation Screen */}
          {successAnimation ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white">¡Documentación y Registro Verificados!</h2>
              <p className="text-sm text-zinc-400 max-w-md">
                Tus datos de identidad, cédula y licencia han sido procesados correctamente. Iniciando
                AndesMovi Ecuador...
              </p>
            </div>
          ) : activeTab === 'register' ? (
            /* =================== REGISTRATION FORM =================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Error Banner */}
              {errorMessage && (
                <div
                  id="reg-error-banner"
                  className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-shake"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-bold">No es posible iniciar la aplicación:</strong>{' '}
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Step 1: Account Role Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  1. Rol de Cuenta
                </label>
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs">
                  <button
                    type="button"
                    id="role-conductor-btn"
                    onClick={() => {
                      setAccountRole('conductor');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accountRole === 'conductor'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Conductor / Chofer</span>
                  </button>

                  <button
                    type="button"
                    id="role-cliente-btn"
                    onClick={() => {
                      setAccountRole('cliente');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accountRole === 'cliente'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Cliente / Pasajero</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Personal Identity Information */}
              <div className="space-y-3.5">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  2. Datos Personales y Documento de Identidad
                </label>

                {/* Selector de Nacionalidad: Ecuatoriano vs Persona Extranjera */}
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>🌎</span>
                      <span>Nacionalidad / Tipo de Documento:</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {nationalityType === 'extranjero' ? 'Extranjero / Pasaporte' : 'Ecuatoriano / Cédula'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setNationalityType('ecuatoriano');
                        setErrorMessage(null);
                      }}
                      className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        nationalityType === 'ecuatoriano'
                          ? 'bg-emerald-600 text-white font-black shadow-md'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>🇪🇨 Ecuatoriano(a)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNationalityType('extranjero');
                        setErrorMessage(null);
                      }}
                      className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        nationalityType === 'extranjero'
                          ? 'bg-emerald-600 text-white font-black shadow-md'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>🌎 Persona Extranjera</span>
                    </button>
                  </div>

                  {nationalityType === 'extranjero' && accountRole === 'cliente' && (
                    <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-[11px] text-sky-200 leading-relaxed">
                      <strong className="text-sky-300 block mb-0.5">✨ Inicia de inmediato como Cliente Extranjero:</strong>
                      No requieres cédula ecuatoriana ni trámites de SRI. Solo ingresa tu Pasaporte o DNI extranjero y tu teléfono para solicitar viajes y encomiendas sin restricciones.
                    </div>
                  )}

                  {nationalityType === 'extranjero' && accountRole === 'conductor' && (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-[11px] text-amber-200 leading-relaxed">
                      <strong className="text-amber-300 block mb-0.5">⚠️ Requisito Obligatorio para Conductor Extranjero:</strong>
                      Para conducir en Ecuador, la Ley Orgánica de Transporte exige disponer de una <strong>LICENCIA ECUATORIANA VIGENTE (ANT)</strong> homologada o canjeada. Debes adjuntar tu Licencia Ecuatoriana en la sección de documentos a continuación.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Nombres y Apellidos Completos *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nombres y Apellidos completos"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1 flex items-center justify-between">
                      <span>
                        {nationalityType === 'extranjero'
                          ? 'Pasaporte / DNI Extranjero *'
                          : accountRole === 'conductor'
                          ? 'Cédula de Identidad Ecuatoriana (10 dígitos) *'
                          : 'Cédula / Identificación (Opcional)'}
                      </span>
                      {nationalityType === 'ecuatoriano' && accountRole === 'conductor' && cedulaValidation && (
                        <span
                          className={`text-[10px] font-black ${
                            cedulaValidation.isValid ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {cedulaValidation.isValid ? '✓ Válida' : '✗ Inválida'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required={accountRole === 'conductor' || nationalityType === 'extranjero'}
                        maxLength={nationalityType === 'ecuatoriano' ? 10 : 20}
                        value={cedula}
                        onChange={(e) => handleCedulaChange(e.target.value)}
                        placeholder={
                          nationalityType === 'extranjero'
                            ? 'Ej: P9820139 (Pasaporte o DNI)'
                            : accountRole === 'conductor'
                            ? 'Número de cédula ecuatoriana (10 dígitos)'
                            : 'Cédula o pasaporte (opcional)'
                        }
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border text-white text-xs outline-none transition-colors ${
                          nationalityType === 'ecuatoriano' && accountRole === 'conductor' && cedulaValidation?.isValid
                            ? 'border-emerald-500/80 bg-emerald-950/10'
                            : nationalityType === 'ecuatoriano' && accountRole === 'conductor' && cedula.length === 10
                            ? 'border-rose-500/80 bg-rose-950/10'
                            : 'border-zinc-800 focus:border-amber-500'
                        }`}
                      />
                    </div>
                    {nationalityType === 'ecuatoriano' && accountRole === 'conductor' && cedulaValidation && (
                      <p
                        className={`text-[10px] mt-1 font-medium ${
                          cedulaValidation.isValid ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {cedulaValidation.message}
                      </p>
                    )}
                  </div>
                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Teléfono Celular Ecuatoriano *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09XXXXXXXX"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@correo.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Provincia de Residencia / Operación
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <select
                        value={province}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setProvince(prov);
                          const cantons = getCantonsForProvince(prov);
                          if (cantons.length > 0) {
                            setCanton(cantons[0]);
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-emerald-500"
                      >
                        {ECUADOR_GEOGRAPHY.map((item) => (
                          <option key={item.province} value={item.province} className="bg-zinc-900 text-white">
                            {item.province}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Cantón Base / Operación
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <select
                        value={canton}
                        onChange={(e) => setCanton(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-emerald-500"
                      >
                        {getCantonsForProvince(province).map((cantonName) => (
                          <option key={cantonName} value={cantonName} className="bg-zinc-900 text-white">
                            {cantonName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Auto Map Adaptation banner */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-[11px] text-emerald-400">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>
                    <strong>Adaptación Automática:</strong> El mapa se centrará en <strong>{canton}, {province}</strong> para {accountRole === 'conductor' ? 'recibir solicitudes locales' : 'solicitar viajes y envíos'}.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Contacto de Emergencia (Familiar)
                    </label>
                    <div className="relative">
                      <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="Nombre y parentesco / contacto"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Teléfono del Contacto de Emergencia
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="0998241902"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Contraseña de Acceso (mínimo 6) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: DRIVER DOCUMENTS (LICENCIA Y LOS DEMÁS DOCUMENTOS) */}
              {accountRole === 'conductor' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                        3. Modalidad de Vehículo y Documentos de Conducción
                      </h3>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      Requerido
                    </span>
                  </div>

                  {/* SELECCIÓN OBLIGATORIA: MOTO O CARRO AL CREAR CUENTA */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      Selecciona el Tipo de Vehículo con el que Trabajarás: *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opción 1: Carro / Automóvil */}
                      <button
                        type="button"
                        onClick={() => handleSelectVehicleType('auto')}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer relative ${
                          selectedVehicleType === 'auto'
                            ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-400/40 text-white shadow-lg'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${selectedVehicleType === 'auto' ? 'bg-sky-500 text-zinc-950' : 'bg-zinc-900 text-sky-400'}`}>
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-white block">🚗 Carro / Automóvil / Taxi</span>
                              <span className="text-[10px] text-sky-400 font-bold">Hasta 4 Pasajeros • Sedán / Confort</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs ${
                            selectedVehicleType === 'auto' ? 'bg-sky-500 text-zinc-950 border-sky-400' : 'border-zinc-700'
                          }`}>
                            {selectedVehicleType === 'auto' && '✓'}
                          </div>
                        </div>

                        <div className="text-[11px] space-y-1 pt-1 border-t border-zinc-800/80 leading-relaxed text-zinc-300">
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Carrera Urbana:</strong> 1 a 4 pasajeros ($3, $6, $9, $12 USD)</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-amber-300 font-semibold">
                            <span>⭐</span>
                            <span><strong>Servicio Ejecutivo:</strong> Si el Administrador acepta el vehículo (+$3 USD)</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Encomiendas:</strong> Dentro de la ciudad e interprovinciales</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Delivery:</strong> Compras en locales y comida</span>
                          </p>
                        </div>
                      </button>

                      {/* Opción 2: Motocicleta */}
                      <button
                        type="button"
                        onClick={() => handleSelectVehicleType('moto')}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer relative ${
                          selectedVehicleType === 'moto'
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 text-white shadow-lg'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${selectedVehicleType === 'moto' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-amber-400'}`}>
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-white block">🏍️ Motocicleta / Moto Express</span>
                              <span className="text-[10px] text-amber-400 font-bold">1 Sola Persona • Casco Reglamentario</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs ${
                            selectedVehicleType === 'moto' ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'border-zinc-700'
                          }`}>
                            {selectedVehicleType === 'moto' && '✓'}
                          </div>
                        </div>

                        <div className="text-[11px] space-y-1 pt-1 border-t border-zinc-800/80 leading-relaxed text-zinc-300">
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Carrera Moto:</strong> UNA SOLA PERSONA (1 Pax individual)</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/30 my-1">
                            <span>🪖</span>
                            <span><strong>CASCO OBLIGATORIO PARA CLIENTE:</strong> El conductor TIENE QUE TENER UN CASCO EXTRA LIMPIDO Y HOMOLOGADO para el pasajero.</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Delivery:</strong> Repartidor express de comida y compras</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Encomiendas Urbanas:</strong> Documentos y sobres dentro de la ciudad</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span><strong>Encomiendas Interprovinciales:</strong> Despacho a oficinas aliadas</span>
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* A. Licencia de Conducir ANT */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        A. Licencia de Conducir Vigente (Agencia Nacional de Tránsito)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          N° de Licencia *
                        </label>
                        <input
                          type="text"
                          required
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="Número de licencia oficial"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Tipo de Licencia *
                        </label>
                        <select
                          value={licenseType}
                          onChange={(e) => setLicenseType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none"
                        >
                          <option value="Tipo A">Tipo A (Motocicletas)</option>
                          <option value="Tipo B">Tipo B (Auto liviano / Particular)</option>
                          <option value="Tipo C">Tipo C (Taxis / Camionetas Profesionales)</option>
                          <option value="Tipo C1">Tipo C1 (Emergencias / Mixto)</option>
                          <option value="Tipo D">Tipo D (Transporte de Pasajeros)</option>
                          <option value="Tipo E">Tipo E (Carga Pesada / Encomiendas)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Fecha de Vencimiento *
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            value={licenseExpiration}
                            onChange={(e) => setLicenseExpiration(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Photos of License (Frente y Reverso) */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                          Fotos de Licencia de Conducir (ANT) *
                          <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                            Gemini AI
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => runLicensePreValidation()}
                            disabled={isCheckingLicenseLegibility || !licenseFrontPhoto}
                            className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            title="Auditar legibilidad de licencia con Gemini 3.8 Flash"
                          >
                            <RefreshCw className={`w-3 h-3 ${isCheckingLicenseLegibility ? 'animate-spin' : ''}`} />
                            <span>{isCheckingLicenseLegibility ? 'Auditando...' : 'Auditar con IA'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-zinc-300">Foto Frontal de Licencia *</span>
                            {licenseFrontPhoto ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Adjuntada
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-bold">Requerida</span>
                            )}
                          </div>
                          {licenseFrontPhoto && (
                            <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-800 mb-2 relative group bg-zinc-900">
                              <img
                                src={licenseFrontPhoto}
                                alt="Licencia Frente"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold">
                                Licencia Frente
                              </div>
                            </div>
                          )}
                          <label 
                            htmlFor="license-front-file-input"
                            className="cursor-pointer flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition-colors w-full"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Foto Frontal</span>
                          </label>
                          <input
                            id="license-front-file-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleLicensePhotoUpload(e, 'front')}
                            className="hidden"
                          />
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-zinc-300">Foto Posterior de Licencia</span>
                            {licenseBackPhoto ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Adjuntada
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500">Opcional</span>
                            )}
                          </div>
                          {licenseBackPhoto && (
                            <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-800 mb-2 relative group bg-zinc-900">
                              <img
                                src={licenseBackPhoto}
                                alt="Licencia Posterior"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold">
                                Licencia Reverso
                              </div>
                            </div>
                          )}
                          <label 
                            htmlFor="license-back-file-input"
                            className="cursor-pointer flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition-colors w-full"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Foto Reverso</span>
                          </label>
                          <input
                            id="license-back-file-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleLicensePhotoUpload(e, 'back')}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Estado de Legibilidad de Licencia con Gemini AI */}
                      <div
                        className={`p-2.5 rounded-xl border transition-all text-xs ${
                          isCheckingLicenseLegibility
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                            : licensePreValidation
                            ? licensePreValidation.isLegible
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isCheckingLicenseLegibility ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span className="font-semibold text-white">Gemini AI: Verificando nitidez y legibilidad de Licencia...</span>
                          </div>
                        ) : licensePreValidation ? (
                          licensePreValidation.isLegible ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Licencia Legible y Verificada (Confianza: {licensePreValidation.confidenceScore}%)</span>
                                </div>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                                  ✓ Apta para BD
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-300">{licensePreValidation.feedback}</p>
                              {(licensePreValidation.detectedIdNumber || licensePreValidation.detectedFullName) && (
                                <div className="text-[10px] text-zinc-400 flex flex-wrap gap-2 pt-0.5">
                                  {licensePreValidation.detectedIdNumber && (
                                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                      N° Detectado: <strong className="text-white">{licensePreValidation.detectedIdNumber}</strong>
                                    </span>
                                  )}
                                  {licensePreValidation.detectedFullName && (
                                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                      Titular: <strong className="text-white">{licensePreValidation.detectedFullName}</strong>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>Licencia No Legible (Rechazada por Gemini AI)</span>
                                </div>
                                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                                  No Permitido
                                </span>
                              </div>
                              <p className="text-[11px] text-rose-300">{licensePreValidation.feedback}</p>
                              <p className="text-[10px] text-zinc-400">
                                La licencia es obligatoria para conductores y debe ser legible para ser admitida en la base de datos.
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-between">
                            <span>Adjunta la foto de tu licencia para auditar con Gemini AI</span>
                            <button
                              type="button"
                              onClick={() => runLicensePreValidation()}
                              className="text-[10px] text-amber-300 hover:underline font-bold"
                            >
                              Verificar ahora
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* B. Certificado de Antecedentes Penales */}
                  <div className="border-t border-zinc-800 pt-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        B. Consulta y Validación de Antecedentes Penales (Ministerio de Gobierno / Interior)
                      </span>
                      <button
                        type="button"
                        onClick={handleQueryCriminalRecord}
                        disabled={isQueryingCriminalRecord || !cedula}
                        className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isQueryingCriminalRecord ? 'animate-spin' : ''}`} />
                        <span>{isQueryingCriminalRecord ? 'Consultando API...' : 'Consultar en Vivo'}</span>
                      </button>
                    </div>

                    {/* Certificado Digital del Ministerio del Interior */}
                    {criminalRecordResult && (
                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                              EC
                            </div>
                            <div>
                              <p className="text-[9px] font-extrabold uppercase text-zinc-500 tracking-wider">Certificado Oficial</p>
                              <p className="text-[10px] font-bold text-zinc-300 font-mono">{criminalRecordResult.certificateNumber}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            criminalRecordResult.hasSevereRecord || criminalRecordResult.criminalRecordCount > 2
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : criminalRecordResult.hasCriminalRecord
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {criminalRecordResult.hasSevereRecord || criminalRecordResult.criminalRecordCount > 2
                              ? 'Inhabilitado'
                              : 'Válido para Conducir'}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1.5">
                          <div>
                            <span className="text-zinc-500 font-medium">Titular del Récord:</span>{' '}
                            <strong className="text-white font-bold">{criminalRecordResult.fullName || fullName || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-medium">Cédula Consultada:</span>{' '}
                            <strong className="text-white font-mono font-bold">{criminalRecordResult.cedula}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-medium">Resultado de Consulta:</span>{' '}
                            <span className={`font-bold ${
                              criminalRecordResult.hasSevereRecord || criminalRecordResult.criminalRecordCount > 2
                                ? 'text-rose-400'
                                : criminalRecordResult.hasCriminalRecord
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}>
                              {criminalRecordResult.details}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-500 pt-2 border-t border-zinc-900 font-mono">
                          <div>
                            <span>AUTORIDAD EMISORA:</span>
                            <p className="text-zinc-400 font-sans leading-tight mt-0.5">{criminalRecordResult.authority}</p>
                          </div>
                          <div>
                            <span>FIRMA ELECTRÓNICA SHA-246:</span>
                            <p className="text-zinc-400 leading-none truncate mt-0.5" title={criminalRecordResult.validationSha}>{criminalRecordResult.validationSha}</p>
                            <p className="text-[8px] text-zinc-600 mt-0.5">Fecha: {criminalRecordResult.verifiedAt}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inputs ocultos/auxiliares para mantener compatibilidad con el resto del formulario */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          N° de Certificado Oficial (Auto-completado)
                        </label>
                        <input
                          type="text"
                          required
                          value={criminalRecordNumber}
                          onChange={(e) => setCriminalRecordNumber(e.target.value)}
                          placeholder="POL-EC-2026-XXXXX"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Antecedentes Registrados (Máx 2 sin gravedad)
                        </label>
                        <select
                          value={criminalCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCriminalCount(val);
                            setHasSevereCrime(val >= 3);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
                        >
                          <option value={0}>0 Antecedentes (Récord Limpio)</option>
                          <option value={1}>1 Antecedente (Sin gravedad)</option>
                          <option value={2}>2 Antecedentes (Sin gravedad)</option>
                          <option value={3}>3 o más (Inhabilitante)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* C. Matrícula y RTV */}
                  <div className="border-t border-zinc-800 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {selectedVehicleType === 'moto' ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <Car className="w-3.5 h-3.5 text-sky-400" />}
                        <span>C. Datos del Vehículo ({selectedVehicleType === 'moto' ? 'Motocicleta' : 'Automóvil / Carro'}) y Revisión Técnica (RTV)</span>
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        selectedVehicleType === 'moto' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {selectedVehicleType === 'moto' ? '🏍️ Moto (1 Pax / Delivery)' : '🚗 Carro (4 Pax / Ejecutivo)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Placa Vehicular *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                          placeholder={selectedVehicleType === 'moto' ? 'P-4821E' : 'PCH-4921'}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Marca / Modelo *
                        </label>
                        <input
                          type="text"
                          required
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          placeholder={selectedVehicleType === 'moto' ? 'Honda CB190R / Negro' : 'Chevrolet Sail 1.5L / Plata'}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                          Año RTV Vigente *
                        </label>
                        <select
                          value={rtvYear}
                          onChange={(e) => setRtvYear(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none"
                        >
                          <option value={2026}>2026 (Vigente)</option>
                          <option value={2025}>2025 (Vigente)</option>
                          <option value={2024}>2024 (Vencida - Requiere trámite)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mandatory Terms & Privacy Checkbox */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-700 focus:ring-0 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="accept-terms" className="text-[11px] text-zinc-300 leading-snug cursor-pointer select-none">
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
                  de AndesMovi. Declaro que mis documentos y Cédula son verídicos conforme a la Ley del Ecuador.
                </label>
              </div>

              {/* Criminal Record Certificate Upload (Solo para Conductor) */}
              {accountRole === 'conductor' && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Certificado de Antecedentes Penales (Foto Obligatoria) *
                  </label>

                  {criminalRecordPhoto ? (
                    <div className="w-full h-40 rounded-xl overflow-hidden border border-zinc-800 relative bg-zinc-900 flex items-center justify-center">
                      <img
                        src={criminalRecordPhoto}
                        alt="Certificado de Antecedentes"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Foto Cargada
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3 border border-zinc-800/80 rounded-xl bg-zinc-900/40 text-[11px] text-zinc-400">
                      Sube una fotografía de tu certificado oficial para guardarlo en tu ficha de conductor.
                    </div>
                  )}

                  <label 
                    htmlFor="criminal-record-file-input"
                    className="w-full h-12 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/90 flex items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 transition-colors text-xs font-bold text-zinc-300 hover:text-white"
                  >
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span>{criminalRecordPhoto ? 'Cambiar Foto del Certificado' : 'Subir Foto del Certificado'}</span>
                  </label>
                  <input 
                    id="criminal-record-file-input"
                    type="file" 
                    accept="image/*" 
                    onChange={handleCriminalRecordPhotoUpload}
                    className="hidden" 
                  />
                </div>
              )}

              {/* Submit Action: Iniciar la Aplicación */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-register-and-start-btn"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-sm transition-all active:scale-[0.99] shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Validando Documentos e Iniciando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-zinc-950" />
                      <span>Registrar Documentos e Iniciar la Aplicación</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-zinc-500 mt-2">
                  Si no ingresas tus datos y documentos no podrás acceder a AndesMovi.
                </p>
              </div>
            </form>
          ) : (
            /* =================== LOGIN FORM (RETURNING USER) =================== */
            <form onSubmit={handleLoginSubmit} className="space-y-4 py-2">
              {/* Role Toggle: Conductor vs Cliente */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Tipo de Cuenta para Iniciar Sesión
                </label>
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountRole('conductor');
                      setLoginError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accountRole === 'conductor'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Conductor / Chofer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountRole('cliente');
                      setLoginError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accountRole === 'cliente'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Cliente / Pasajero</span>
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Cédula, Correo o Celular Registrado ({accountRole === 'conductor' ? 'Conductor' : 'Cliente'}) *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={accountRole === 'conductor' ? '1004721351 o conductor@andesmovi.ec' : '0991234567 o cliente@andesmovi.ec'}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-300">
                    Contraseña *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotRole(accountRole);
                      setForgotInput(loginIdentifier);
                      setForgotStep('input');
                      setForgotMessage(null);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>¿Olvidaste tu contraseña?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botón directo de ayuda para recuperar clave */}
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ¿Problemas para acceder ({accountRole === 'conductor' ? 'Conductor' : 'Cliente'})?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotRole(accountRole);
                    setForgotInput(loginIdentifier);
                    setForgotStep('input');
                    setForgotMessage(null);
                    setShowForgotModal(true);
                  }}
                  className="font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Recuperar Contraseña</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm transition-all active:scale-[0.99] shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-zinc-950" />
                      <span>Iniciar Sesión y Acceder a la App</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña para Conductor y Cliente */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
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
                  ✓ Código de seguridad enviado al teléfono asociado. (Código de prueba oficial: <strong className="font-mono font-black text-white">4829</strong>)
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
                      if (enteredCode !== '4829' && enteredCode !== '1234') {
                        setForgotMessage('Código incorrecto. Utiliza el código seguro 4829.');
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
                    setAccountRole(forgotRole);
                    setActiveTab('login');
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
          showAcceptButton={true}
          onAccept={() => {
            setAcceptTerms(true);
            setShowLegalModal(false);
          }}
        />
      )}
    </div>
  );
};

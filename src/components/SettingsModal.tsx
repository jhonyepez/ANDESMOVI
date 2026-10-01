import React, { useState, useRef } from 'react';
import {
  UserProfile,
  UserRole,
  Vehicle,
  PaymentMethodType,
  TripHistoryItem,
  EmergencyContact,
} from '../types';
import { formatCurrency } from '../utils/geoUtils';
import { ECUADOR_GEOGRAPHY, getCantonsForProvince } from '../data/ecuador_geography';
import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  getTranslation,
} from '../utils/i18n';
import {
  Settings,
  User,
  Wallet,
  Globe2,
  Bell,
  Shield,
  CreditCard,
  Car,
  History,
  HelpCircle,
  FileText,
  Lock,
  LogOut,
  X,
  CheckCircle2,
  Percent,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Building2,
  Smartphone,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Camera,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Banknote,
  Upload,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
  Send,
  UserPlus,
  PhoneCall,
  AlertOctagon,
  Share2,
  Sparkles,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Heart,
  Coins,
  Info,
  Bike,
  ArrowLeft,
} from 'lucide-react';
import { AdminBankAccountsList } from './admin/AdminBankAccountsList';
import { WalletModal } from './WalletModal';
import { WalletRechargeRequest } from '../types';
import { pushNotificationService } from '../services/notificationService';
import { haptic } from '../utils/haptics';
import { validateEcuadorianCedula, CedulaValidationResult } from '../utils/cedulaValidator';
import { DriverWeeklyEarningsChart } from './DriverWeeklyEarningsChart';
import { LegalTermsModal, LegalDocType } from './LegalTermsModal';

export type SettingsSection =
  | 'perfil'
  | 'contactos_sos'
  | 'billetera'
  | 'idioma'
  | 'notificaciones'
  | 'seguridad'
  | 'metodos_pago'
  | 'vehiculo'
  | 'historial'
  | 'ayuda'
  | 'terminos'
  | 'privacidad';

interface SettingsModalProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  walletBalance: number;
  onUpdateWallet: (newBalance: number) => void;
  userRole: UserRole;
  onToggleRole: () => void;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  tripHistory: TripHistoryItem[];
  onOpenHistoryDirectly?: () => void;
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onClose: () => void;
  initialSection?: SettingsSection;
  isDark?: boolean;
  walletRecharges?: WalletRechargeRequest[];
  onAddRechargeRequest?: (req: WalletRechargeRequest) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  onUpdateUser,
  walletBalance,
  onUpdateWallet,
  userRole,
  onToggleRole,
  language,
  onChangeLanguage,
  tripHistory,
  onOpenHistoryDirectly,
  onLogout,
  onDeleteAccount,
  onClose,
  initialSection = 'perfil',
  isDark = true,
  walletRecharges = [],
  onAddRechargeRequest,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);

  // Delete Account State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  const handleConfirmDeleteAccount = () => {
    setDeleteError(null);
    const inputUpper = deleteConfirmInput.trim().toUpperCase();

    // Check confirmation: word ELIMINAR or password >= 4 chars
    if (inputUpper !== 'ELIMINAR' && deleteConfirmInput.trim().length < 4) {
      setDeleteError('Para confirmar, escribe exactamente la palabra "ELIMINAR" o tu contraseña actual.');
      haptic.error();
      return;
    }

    setIsDeletingAccount(true);
    haptic.warning();

    setTimeout(() => {
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false);
      if (onDeleteAccount) {
        onDeleteAccount();
      } else {
        onLogout();
      }
      onClose();
    }, 600);
  };

  // Profile Form State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileCedula, setProfileCedula] = useState(currentUser?.cedula || '');
  const [cedulaValidation, setCedulaValidation] = useState<CedulaValidationResult | null>(() => {
    return currentUser?.cedula ? validateEcuadorianCedula(currentUser.cedula) : null;
  });
  const [profileProvince, setProfileProvince] = useState(currentUser?.province || 'Pichincha');
  const [profileCanton, setProfileCanton] = useState(currentUser?.canton || 'Quito');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  // Real-time Cedula validation (Algoritmo Módulo 10 Ecuador)
  const handleProfileCedulaChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 10);
    setProfileCedula(raw);
    if (raw.length === 10) {
      const res = validateEcuadorianCedula(raw);
      setCedulaValidation(res);
      if (res.isValid && res.province) {
        setProfileProvince(res.province);
        const cantons = getCantonsForProvince(res.province);
        if (cantons.length > 0) {
          setProfileCanton(cantons[0]);
        }
      }
    } else {
      setCedulaValidation(null);
    }
  };

  // Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPasswordInput) {
      setPasswordError('La contraseña actual no es correcta.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPasswordInput === currentPasswordInput) {
      setPasswordError('La nueva contraseña no puede ser idéntica a la contraseña actual.');
      return;
    }

    const isMasterAdmin = currentUser?.role === 'admin';
    const validCurrent = isMasterAdmin ? (currentPasswordInput === '1004721351Dueño' || currentPasswordInput === 'AndesMovi2026!') : currentPasswordInput.length >= 4;

    if (!validCurrent && isMasterAdmin) {
      setPasswordError('La contraseña actual no es correcta.');
      return;
    }

    setPasswordSuccess('¡Contraseña actualizada con éxito!');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');

    setTimeout(() => {
      setPasswordSuccess(null);
    }, 4500);
  };

  // Photo upload & custom avatar state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [photoUploadNotice, setPhotoUploadNotice] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Emergency Contacts state linked to SOS Button
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    if (currentUser?.emergencyContacts && currentUser.emergencyContacts.length > 0) {
      return currentUser.emergencyContacts;
    }
    return [];
  });

  // Form state for creating / editing emergency contacts
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactRelationship, setContactRelationship] = useState('Familiar');
  const [contactPhone, setContactPhone] = useState('');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);
  const [contactNotifySms, setContactNotifySms] = useState(true);
  const [contactNotifyWhatsapp, setContactNotifyWhatsapp] = useState(true);
  const [testAlertSent, setTestAlertSent] = useState<string | null>(null);
  const [showLegalPopup, setShowLegalPopup] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terminos');

  // Pre-configured Avatars
  const sampleAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  ];

  // Vehicle Fleet State (para que conductores gestionen múltiples vehículos: autos y motos)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const stored = localStorage.getItem('andes_movi_driver_vehicles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading driver vehicles', e);
    }
    return [
      {
        id: 'veh-1',
        type: 'auto',
        model: 'Chevrolet Sail 1.5L',
        plate: 'PBC-4921',
        color: 'Amarillo Taxi / Techo Blanco',
        year: 2023,
        isActive: true,
      },
      {
        id: 'veh-2',
        type: 'moto',
        model: 'Honda CB125F Twister',
        plate: 'IH-882M',
        color: 'Rojo Carmesí',
        year: 2024,
        isActive: false,
      },
    ];
  });

  // State for Add / Edit Vehicle Drawer/Form
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{
    type: 'auto' | 'moto';
    model: string;
    color: string;
    plate: string;
    year: number;
  }>({
    type: 'auto',
    model: '',
    color: '',
    plate: '',
    year: 2023,
  });

  const [vehicleData, setVehicleData] = useState<Vehicle>({
    type: 'auto',
    model: 'Chevrolet Sail 1.5L',
    plate: 'PBC-4921',
    color: 'Plata Metálico',
    year: 2022,
  });
  const [rtvVerified, setRtvVerified] = useState(true);

  // Helper CRUD methods for vehicles
  const saveVehiclesToStorage = (updatedList: Vehicle[]) => {
    setVehicles(updatedList);
    try {
      localStorage.setItem('andes_movi_driver_vehicles', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error saving vehicles to storage', e);
    }
  };

  const handleOpenAddVehicle = () => {
    haptic.tap();
    setVehicleForm({
      type: 'auto',
      model: '',
      color: '',
      plate: '',
      year: new Date().getFullYear(),
    });
    setEditingVehicleId(null);
    setIsVehicleFormOpen(true);
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    haptic.tap();
    setVehicleForm({
      type: veh.type === 'moto' ? 'moto' : 'auto',
      model: veh.model,
      color: veh.color,
      plate: veh.plate,
      year: veh.year || 2023,
    });
    setEditingVehicleId(veh.id || null);
    setIsVehicleFormOpen(true);
  };

  const handleSaveVehicleForm = () => {
    if (!vehicleForm.model.trim()) {
      showFeedback('Por favor ingresa el modelo del vehículo (Ej: Chevrolet Sail o Honda CB125F).');
      return;
    }
    if (!vehicleForm.plate.trim()) {
      showFeedback('Por favor ingresa el número de placa ecuatoriana (Ej: PBC-4921 o IH-882M).');
      return;
    }
    if (!vehicleForm.color.trim()) {
      showFeedback('Por favor ingresa el color del vehículo.');
      return;
    }

    haptic.success();
    let updatedList: Vehicle[];

    if (editingVehicleId) {
      updatedList = vehicles.map((v) =>
        v.id === editingVehicleId
          ? {
              ...v,
              type: vehicleForm.type,
              model: vehicleForm.model.trim(),
              color: vehicleForm.color.trim(),
              plate: vehicleForm.plate.trim().toUpperCase(),
              year: vehicleForm.year,
            }
          : v
      );
      showFeedback('¡Vehículo actualizado correctamente!');
    } else {
      const newVeh: Vehicle = {
        id: `veh-${Date.now()}`,
        type: vehicleForm.type,
        model: vehicleForm.model.trim(),
        color: vehicleForm.color.trim(),
        plate: vehicleForm.plate.trim().toUpperCase(),
        year: vehicleForm.year,
        isActive: vehicles.length === 0,
      };
      updatedList = [...vehicles, newVeh];
      showFeedback('¡Nuevo vehículo añadido a tu flota con éxito!');
    }

    saveVehiclesToStorage(updatedList);
    setIsVehicleFormOpen(false);
    setEditingVehicleId(null);
  };

  const handleDeleteVehicle = (id?: string) => {
    if (!id) return;
    haptic.warning();
    if (vehicles.length <= 1) {
      showFeedback('Debes conservar al menos un vehículo registrado para poder operar como conductor.');
      return;
    }
    const filtered = vehicles.filter((v) => v.id !== id);
    const hasActive = filtered.some((v) => v.isActive);
    if (!hasActive && filtered.length > 0) {
      filtered[0].isActive = true;
    }
    saveVehiclesToStorage(filtered);
    showFeedback('Vehículo eliminado de tu cuenta.');
  };

  const handleSetActiveVehicle = (id?: string) => {
    if (!id) return;
    haptic.click();
    const updated = vehicles.map((v) => ({
      ...v,
      isActive: v.id === id,
    }));
    saveVehiclesToStorage(updated);
    const activeVeh = updated.find((v) => v.id === id);
    showFeedback(`Vehículo activo: ${activeVeh?.model} (${activeVeh?.plate})`);
  };

  // Digital Wallet State (7% commission metrics & withdrawals)
  const [totalEarnings, setTotalEarnings] = useState<number>(348.50);
  const [totalExpenses, setTotalExpenses] = useState<number>(68.20);
  const [totalWithdrawals, setTotalWithdrawals] = useState<number>(180.00);

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState<number>(25);
  const [withdrawBank, setWithdrawBank] = useState<string>('Banco Pichincha');
  const [accountType, setAccountType] = useState<'Ahorros' | 'Corriente'>('Ahorros');
  const [accountNumber, setAccountNumber] = useState<string>('2205819034');
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);

  // Wallet topup
  const [topupAmount, setTopupAmount] = useState<number>(10);
  const [topupSuccess, setTopupSuccess] = useState<boolean>(false);

  // Wallet transactions list (Comisión del 7% debitada del saldo prepago; cobro directo al cliente)
  const [walletTransactions, setWalletTransactions] = useState([
    { id: 'w-tx-1', desc: 'Descuento Comisión 7% AndesMovi (Viaje Tulcán - Huaca: $8.50 cobrado en mano al cliente)', amount: -0.60, type: 'comision', date: 'Hoy, 14:10' },
    { id: 'w-tx-2', desc: 'Descuento Comisión 7% AndesMovi (Carrera Rumichaca - Centro: $5.00 cobrado en mano)', amount: -0.35, type: 'comision', date: 'Hoy, 11:30' },
    { id: 'w-tx-3', desc: 'Recarga DeUna! / Banco Pichincha (Saldo Prepago Comisiones)', amount: 20.00, type: 'recarga', date: 'Ayer, 09:15' },
    { id: 'w-tx-4', desc: 'Descuento Comisión 7% AndesMovi (Encomienda Tulcán - Ibarra: $10.00 cobrado en mano)', amount: -0.70, type: 'comision', date: '18 Sep, 16:40' },
    { id: 'w-tx-5', desc: 'Recarga Banco Guayaquil (Saldo Prepago)', amount: 15.00, type: 'recarga', date: '16 Sep, 10:20' },
  ]);

  // Notifications toggles - synced with pushNotificationService
  const [notifPush, setNotifPush] = useState(() => pushNotificationService.getPreferences().pushEnabled);
  const [notifSound, setNotifSound] = useState(() => pushNotificationService.getPreferences().soundEnabled);
  const [notifDriverOffers, setNotifDriverOffers] = useState(() => pushNotificationService.getPreferences().tripUpdates);
  const [notifPromos, setNotifPromos] = useState(() => pushNotificationService.getPreferences().promotions);
  const [notifSecurity, setNotifSecurity] = useState(true);

  // Security toggles & state
  const [twoFactorActive, setTwoFactorActive] = useState(true);
  const [safetyPinRequired, setSafetyPinRequired] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState('+593 98 456 7890 (Familiar)');

  // Selected payment method
  const [defaultPayment, setDefaultPayment] = useState<PaymentMethodType>('deuna');

  // Helper translation shortcut
  const t = (key: string) => getTranslation(key, language);

  // Driver tips calculations across completed trip history
  const totalTipsContributed = tripHistory.reduce((sum, item) => sum + (item.tipUsd || 0), 0);
  const tripsWithTipsCount = tripHistory.filter((item) => (item.tipUsd || 0) > 0).length;

  const showFeedback = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Handle Photo File Upload
  const handleProcessPhotoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. El límite máximo permitido es 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setProfileAvatar(dataUrl);
        setPhotoUploadNotice('¡Fotografía cargada correctamente! Guarda los cambios para sincronizar.');
        setTimeout(() => setPhotoUploadNotice(null), 4000);
        if (currentUser) {
          onUpdateUser({
            ...currentUser,
            avatar: dataUrl,
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessPhotoFile(file);
    }
  };

  const handleDropPhoto = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessPhotoFile(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customAvatarUrl.trim()) return;
    setProfileAvatar(customAvatarUrl.trim());
    setPhotoUploadNotice('¡URL de imagen aplicada!');
    setTimeout(() => setPhotoUploadNotice(null), 3000);
    setShowUrlInput(false);
    setCustomAvatarUrl('');
  };

  // Handle Saving Profile with Ecuadorian Cedula Validation
  const handleSaveProfile = () => {
    if (profileCedula && profileCedula.trim()) {
      const val = validateEcuadorianCedula(profileCedula);
      if (!val.isValid) {
        alert(`Cédula Ecuatoriana Inválida (Algoritmo Módulo 10): ${val.message}`);
        return;
      }
    }

    if (currentUser) {
      const updated: UserProfile = {
        ...currentUser,
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        cedula: profileCedula,
        cedulaVerified: profileCedula ? validateEcuadorianCedula(profileCedula).isValid : currentUser.cedulaVerified,
        province: profileProvince,
        canton: profileCanton,
        avatar: profileAvatar,
        emergencyContacts: emergencyContacts,
      };
      onUpdateUser(updated);
    }
    showFeedback(language === 'qu' ? '¡Kikin kawsay waqaychishka!' : '¡Perfil y cantón guardados con éxito!');
  };

  // Emergency Contacts Handlers (SOS vinculados)
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      alert('Por favor ingresa el nombre de la persona o contacto de emergencia.');
      return;
    }
    if (!contactPhone.trim() || contactPhone.trim().length < 8) {
      alert('Ingresa un número telefónico ecuatoriano válido (ej: +593 99 824 1902 o 0998241902).');
      return;
    }

    let updatedList: EmergencyContact[];
    if (editingContactId) {
      updatedList = emergencyContacts.map((c) => {
        if (c.id === editingContactId) {
          return {
            ...c,
            name: contactName.trim(),
            relationship: contactRelationship,
            phone: contactPhone.trim(),
            isPrimary: contactIsPrimary,
            notifyBySms: contactNotifySms,
            notifyByWhatsapp: contactNotifyWhatsapp,
          };
        }
        return contactIsPrimary ? { ...c, isPrimary: false } : c;
      });
    } else {
      const newContact: EmergencyContact = {
        id: `emg-${Date.now()}`,
        name: contactName.trim(),
        relationship: contactRelationship,
        phone: contactPhone.trim(),
        isPrimary: contactIsPrimary || emergencyContacts.length === 0,
        notifyBySms: contactNotifySms,
        notifyByWhatsapp: contactNotifyWhatsapp,
      };
      if (newContact.isPrimary) {
        updatedList = [newContact, ...emergencyContacts.map((c) => ({ ...c, isPrimary: false }))];
      } else {
        updatedList = [...emergencyContacts, newContact];
      }
    }

    setEmergencyContacts(updatedList);
    if (currentUser) {
      onUpdateUser({
        ...currentUser,
        emergencyContacts: updatedList,
      });
    }

    // Keep emergencyPhone synced with primary contact
    const primary = updatedList.find((c) => c.isPrimary) || updatedList[0];
    if (primary) {
      setEmergencyPhone(`${primary.phone} (${primary.name})`);
    }

    setShowContactForm(false);
    setEditingContactId(null);
    setContactName('');
    setContactPhone('');
    setContactIsPrimary(false);
    showFeedback('Contacto de emergencia SOS vinculado correctamente');
  };

  const handleStartEditContact = (c: EmergencyContact) => {
    setEditingContactId(c.id);
    setContactName(c.name);
    setContactRelationship(c.relationship);
    setContactPhone(c.phone);
    setContactIsPrimary(Boolean(c.isPrimary));
    setContactNotifySms(c.notifyBySms !== false);
    setContactNotifyWhatsapp(c.notifyByWhatsapp !== false);
    setShowContactForm(true);
  };

  const handleDeleteContact = (id: string) => {
    const updatedList = emergencyContacts.filter((c) => c.id !== id);
    if (updatedList.length > 0 && !updatedList.some((c) => c.isPrimary)) {
      updatedList[0].isPrimary = true;
    }
    setEmergencyContacts(updatedList);
    if (currentUser) {
      onUpdateUser({
        ...currentUser,
        emergencyContacts: updatedList,
      });
    }
    const primary = updatedList.find((c) => c.isPrimary) || updatedList[0];
    if (primary) {
      setEmergencyPhone(`${primary.phone} (${primary.name})`);
    }
    showFeedback('Contacto de emergencia eliminado');
  };

  const handleSetPrimaryContact = (id: string) => {
    const updatedList = emergencyContacts.map((c) => ({
      ...c,
      isPrimary: c.id === id,
    }));
    setEmergencyContacts(updatedList);
    if (currentUser) {
      onUpdateUser({
        ...currentUser,
        emergencyContacts: updatedList,
      });
    }
    const primary = updatedList.find((c) => c.id === id);
    if (primary) {
      setEmergencyPhone(`${primary.phone} (${primary.name})`);
    }
    showFeedback('Contacto principal de SOS asignado');
  };

  const handleSimulateSOS = () => {
    const primary = emergencyContacts.find((c) => c.isPrimary) || emergencyContacts[0];
    const targetName = primary ? `${primary.name} (${primary.relationship})` : 'Central ECU 911';
    setTestAlertSent(
      `¡Simulación Exitosa! Se ha emitido la alerta satelital SOS con enlace GPS en vivo a ${targetName} y a todos los números registrados (${emergencyContacts.length} contactos).`
    );
    setTimeout(() => setTestAlertSent(null), 6000);
  };

  // Handle withdrawal
  const handleRequestWithdrawal = () => {
    if (withdrawAmount <= 0) return;
    if (withdrawAmount > walletBalance) {
      alert(language === 'qu' ? 'Puchuk kullkika mana aypanchu' : 'El monto a retirar supera su saldo disponible en la billetera.');
      return;
    }
    const newBal = Number((walletBalance - withdrawAmount).toFixed(2));
    onUpdateWallet(newBal);
    setTotalWithdrawals((prev) => Number((prev + withdrawAmount).toFixed(2)));

    const newTx = {
      id: `w-tx-${Date.now()}`,
      desc: `Retiro a ${withdrawBank} (${accountType})`,
      amount: -withdrawAmount,
      type: 'retiro',
      date: 'Hace un momento',
    };
    setWalletTransactions([newTx, ...walletTransactions]);
    setWithdrawSuccess(true);
    setTimeout(() => setWithdrawSuccess(false), 3000);
    showFeedback(
      language === 'qu'
        ? `¡${formatCurrency(withdrawAmount)} kullki bankuman kachashka!`
        : `¡Retiro de ${formatCurrency(withdrawAmount)} enviado a ${withdrawBank} con éxito!`
    );
  };

  // Handle wallet topup
  const handleTopup = () => {
    if (topupAmount <= 0) return;
    const newBal = Number((walletBalance + topupAmount).toFixed(2));
    onUpdateWallet(newBal);
    const newTx = {
      id: `w-tx-${Date.now()}`,
      desc: 'Recarga DeUna! / Tarjeta en USD',
      amount: topupAmount,
      type: 'recarga',
      date: 'Hace un momento',
    };
    setWalletTransactions([newTx, ...walletTransactions]);
    setTopupSuccess(true);
    setTimeout(() => setTopupSuccess(false), 2500);
    showFeedback(
      language === 'qu'
        ? `¡${formatCurrency(topupAmount)} kullki yapachishka!`
        : `¡Recarga de ${formatCurrency(topupAmount)} realizada con éxito!`
    );
  };

  // Sections navigation items
  const menuItems: { id: SettingsSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'perfil', label: t('profile'), icon: <User className="w-4 h-4" /> },
    {
      id: 'contactos_sos',
      label: 'Contactos SOS',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      badge: `${emergencyContacts.length} Vinculados`,
    },
    {
      id: 'billetera',
      label: userRole === 'conductor' ? t('driver_wallet_title') : t('digital_wallet'),
      icon: <Wallet className="w-4 h-4 text-emerald-400" />,
      badge: userRole === 'conductor' ? '7% Fee' : 'Solo Conductor',
    },
    { id: 'idioma', label: t('language'), icon: <Globe2 className="w-4 h-4 text-sky-400" />, badge: 'Kichwa' },
    { id: 'notificaciones', label: t('notifications'), icon: <Bell className="w-4 h-4" /> },
    { id: 'seguridad', label: t('security'), icon: <Shield className="w-4 h-4 text-amber-400" /> },
    {
      id: 'metodos_pago',
      label: t('payment_methods'),
      icon: <CreditCard className="w-4 h-4" />,
      badge: userRole === 'cliente' ? 'Contado / Transf' : undefined,
    },
    {
      id: 'vehiculo',
      label: 'Vehículos',
      icon: <Car className="w-4 h-4 text-amber-400" />,
      badge: `${vehicles.length} ${vehicles.length === 1 ? 'Registrado' : 'Registrados'}`,
    },
    { id: 'historial', label: t('service_history'), icon: <History className="w-4 h-4" /> },
    { id: 'ayuda', label: t('help_support'), icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'terminos', label: t('terms_conditions'), icon: <FileText className="w-4 h-4" /> },
    { id: 'privacidad', label: t('privacy_policy'), icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl h-[92vh] max-h-[750px] ${
          isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        } border rounded-3xl shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Modal Top Header */}
        <div
          className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-[#111827]'}`}>{t('settings')} AndesMovi</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}>
                  Ecuador
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#4B5563]'}`}>
                {language === 'qu' ? 'Tukuy ruraykuna shuklla pampapi' : 'Gestión integral de cuenta, billetera 7%, vehículo e idioma'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveSuccess}</span>
              </div>
            )}
            <button
              onClick={() => {
                // If nested section, go back to main menu, else close
                if (activeSection !== 'perfil') {
                    setActiveSection('perfil');
                } else {
                    onClose();
                }
              }}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-200'
              }`}
              title="Atrás"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              id="btn-close-settings-modal"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-200'
              }`}
              title={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Left Nav Menu + Right Detail Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation Bar (Desktop: Sidebar, Mobile: Horizontal Bar) */}
          <aside
            className={`w-full md:w-64 border-b md:border-b-0 md:border-r p-2 sm:p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 flex-shrink-0 ${
              isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            {menuItems.map((item) => {
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-settings-${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left whitespace-nowrap flex-shrink-0 md:w-full ${
                    isSelected
                      ? 'bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/10'
                      : isDark
                      ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <span className={isSelected ? 'text-zinc-950' : isDark ? 'text-zinc-400' : 'text-slate-500'}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-zinc-950 text-emerald-400'
                          : isDark
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Logout button in sidebar */}
            <div className="md:mt-auto pt-2 border-t md:border-zinc-800/80">
              <button
                id="btn-settings-logout"
                type="button"
                onClick={() => {
                  setShowLogoutConfirmModal(true);
                }}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-800/30 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </aside>

          {/* Right Section Content View */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* 1. PERFIL (Profile & Photo Upload) */}
            {activeSection === 'perfil' && (
              <div className="space-y-5 animate-fadeIn">
                <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div>
                    <h3 className={`text-base font-black ${isDark ? 'text-zinc-100' : 'text-[#111827]'}`}>{t('profile')}</h3>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                      {language === 'qu' ? 'Kikin shutita, rikchakta, willaykunata allichina' : 'Administra tus datos personales, foto de perfil y contacto en Ecuador'}
                    </p>
                  </div>
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                    isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cuenta Verificada
                  </span>
                </div>

                {/* Upload Notice Feedback */}
                {photoUploadNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{photoUploadNotice}</span>
                  </div>
                )}

                {/* Avatar & Photo Upload Component */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isDraggingPhoto
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                      : isDark 
                        ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Photo Preview & Click to upload */}
                    <div className="relative group flex-shrink-0">
                      <img
                        src={profileAvatar}
                        alt={profileName}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl shadow-emerald-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Subir foto desde archivo"
                        className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      >
                        <Camera className="w-6 h-6 mb-1 text-emerald-400" />
                        <span className="text-[10px] font-bold">Cambiar</span>
                      </button>
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-emerald-500 text-zinc-950 shadow-md">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                    </div>
 
                    {/* Upload Controls & Presets */}
                    <div className="flex-1 text-center sm:text-left space-y-2.5">
                      <div>
                        <h4 className={`text-sm font-bold flex items-center justify-center sm:justify-start gap-2 ${isDark ? 'text-zinc-100' : 'text-[#111827]'}`}>
                          <span>{t('avatar_photo')}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            Foto Activa
                          </span>
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                          Carga tu fotografía desde tu dispositivo (PNG, JPG o WEBP, máx. 5MB) o elige uno de los avatares predeterminados.
                        </p>
                      </div>

                      {/* Hidden Real File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          id="btn-upload-profile-photo"
                          onClick={() => fileInputRef.current?.click()}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Foto desde Archivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {showUrlInput ? 'Cerrar URL' : 'Pegar Enlace URL'}
                        </button>
                      </div>

                      {/* Optional URL Input */}
                      {showUrlInput && (
                        <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                          <input
                            type="url"
                            value={customAvatarUrl}
                            onChange={(e) => setCustomAvatarUrl(e.target.value)}
                            placeholder="https://mi-servidor.com/mi-foto.jpg"
                            className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCustomUrl}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-400 border border-emerald-500/30"
                          >
                            Aplicar
                          </button>
                        </div>
                      )}

                      {/* Quick Sample Avatars */}
                      <div className="pt-1">
                        <span className={`text-[11px] block mb-1.5 ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>Avatares Rápidos:</span>
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                          {sampleAvatars.map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setProfileAvatar(av);
                                setPhotoUploadNotice('Avatar seleccionado');
                                setTimeout(() => setPhotoUploadNotice(null), 2500);
                              }}
                              className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                                profileAvatar === av
                                  ? 'border-emerald-500 scale-105 ring-2 ring-emerald-500/30'
                                  : isDark ? 'border-zinc-800 opacity-60 hover:opacity-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={av} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Personal Data Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      {t('full_name')}
                    </label>
                    <input
                      id="input-settings-name"
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {t('phone_contact')}
                    </label>
                    <input
                      id="input-settings-phone"
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+593 99..."
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      {t('email_address')}
                    </label>
                    <input
                      id="input-settings-email"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {t('cedula_id')} (Ecuador)
                      </label>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {profileCedula.length}/10 dígitos
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="input-settings-cedula"
                        type="text"
                        maxLength={10}
                        value={profileCedula}
                        onChange={(e) => handleProfileCedulaChange(e.target.value)}
                        placeholder="1004721351"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none transition-all ${
                          cedulaValidation?.isValid
                            ? 'border-emerald-500/80 text-emerald-400 focus:border-emerald-400'
                            : profileCedula.length === 10
                            ? 'border-rose-500/80 text-rose-400 focus:border-rose-400'
                            : isDark 
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-emerald-500' 
                              : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500 shadow-sm'
                        }`}
                      />
                      {cedulaValidation && (
                        <span
                          className={`absolute right-3 top-2.5 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            cedulaValidation.isValid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {cedulaValidation.isValid ? '✓ Módulo 10 Válido' : '✗ Inválida'}
                        </span>
                      )}
                    </div>
                    {/* Mensaje dinámico de verificación Módulo 10 y provincia */}
                    {cedulaValidation && (
                      <p
                        className={`text-[10px] mt-1.5 font-medium flex items-center gap-1 ${
                          cedulaValidation.isValid ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <span>{cedulaValidation.isValid ? '✓' : '⚠️'}</span>
                        <span>{cedulaValidation.message}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Provincia Base
                    </label>
                    <select
                      id="select-settings-province"
                      value={profileProvince}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setProfileProvince(prov);
                        const cantons = getCantonsForProvince(prov);
                        if (cantons.length > 0) {
                          setProfileCanton(cantons[0]);
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
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
                    <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Cantón / Ciudad
                    </label>
                    <select
                      id="select-settings-canton"
                      value={profileCanton}
                      onChange={(e) => setProfileCanton(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                      }`}
                    >
                      {getCantonsForProvince(profileProvince).map((cantonName) => (
                        <option key={cantonName} value={cantonName} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                          {cantonName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Informative Map Adaptation Badge */}
                  <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>
                      <strong>Mapa Adaptado:</strong> AndesMovi centra el mapa y el radar de unidades automáticamente en <strong>{profileCanton}, {profileProvince}</strong>.
                    </span>
                  </div>
                </div>

                {/* Loyalty Program Section */}
                <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                  isDark ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-500" />
                      <h4 className={`text-sm font-black ${isDark ? 'text-emerald-100' : 'text-emerald-900'}`}>Billetera de Fidelidad: AndesMovi Coins</h4>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                      100 puntos = 1 viaje gratis
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className={`text-[11px] ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        Acumula puntos en cada servicio: 5 pts Carrera Urbana, 7 pts Encomienda Urbana, 10 pts Encomienda Interprovincial y 10 pts Bus Ejecutivo. ¡Al completar 100 puntos, canjea tu carrera gratis!
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-emerald-500 block">{currentUser?.loyaltyPoints || 0}</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Puntos Actuales</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showFeedback('¡Tu solicitud de canje ha sido enviada!')}
                    disabled={(currentUser?.loyaltyPoints || 0) < 100}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/10"
                  >
                    Canjear Puntos por Descuento
                  </button>
                </div>

                {/* Emergency Contacts Quick Link Card inside Profile */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isDark ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : 'bg-rose-100 text-rose-600 border-rose-200'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-rose-900'}`}>
                        <span>Contactos de Emergencia SOS vinculados</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                          isDark ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : 'bg-rose-500/10 text-rose-600 border-rose-200'
                        }`}>
                          {emergencyContacts.length} Registrados
                        </span>
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-rose-700/80'}`}>
                        {emergencyContacts.find((c) => c.isPrimary)
                          ? `Principal: ${emergencyContacts.find((c) => c.isPrimary)?.name} (${emergencyContacts.find((c) => c.isPrimary)?.phone})`
                          : 'No tienes contacto principal asignado'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('contactos_sos')}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition-all whitespace-nowrap"
                  >
                    <span>Editar Contactos SOS</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Active Session & Logout Card inside Profile */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-750' : 'bg-white text-slate-500 border-slate-200'
                    }`}>
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>Sesión Activa en este dispositivo</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                        Conectado como <strong className={isDark ? 'text-zinc-200' : 'text-[#1F2937]'}>{currentUser?.name || profileName}</strong> {currentUser?.cedula ? `(C.I. ${currentUser.cedula})` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="btn-profile-logout"
                    onClick={() => setShowLogoutConfirmModal(true)}
                    className={`min-h-[38px] px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${
                      isDark ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>

                {/* ZONA DE PELIGRO: ELIMINAR CUENTA DEFINITIVAMENTE */}
                <div className={`p-4 rounded-2xl border-2 space-y-3 ${
                  isDark ? 'bg-rose-950/20 border-rose-500/40' : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${
                      isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-600 border-rose-200'
                    }`}>
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-rose-200' : 'text-rose-900'}`}>
                          Zona de Peligro
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-600 border-rose-200'
                        }`}>
                          Irreversible
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-rose-800'}`}>
                        Eliminación definitiva de cuenta y borrado legal de datos personales, historial y registros conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP Ecuador) y directrices de Google Play / App Store.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      id="btn-delete-account-perfil"
                      onClick={() => {
                        haptic.warning();
                        setShowDeleteAccountModal(true);
                        setDeleteConfirmInput('');
                        setDeleteError(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar mi cuenta definitivamente</span>
                    </button>
                  </div>
                </div>

                {/* Save Profile Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-save-profile"
                    onClick={handleSaveProfile}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('save_changes')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* SECCIÓN DEDICADA: CONTACTOS DE EMERGENCIA VINCULADOS AL BOTÓN SOS */}
            {activeSection === 'contactos_sos' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Header */}
                <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl border ${
                      isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-600 border-rose-200'
                    }`}>
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>Contactos de Emergencia y Botón SOS</h3>
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                        Configura las personas de confianza que recibirán auxilio prioritario con tu ubicación GPS en vivo al pulsar SOS
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContactId(null);
                      setContactName('');
                      setContactPhone('');
                      setContactRelationship('Familiar');
                      setContactIsPrimary(emergencyContacts.length === 0);
                      setShowContactForm(true);
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Añadir Contacto</span>
                  </button>
                </div>

                {/* Protocol Info Banner */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isDark ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-100'
                }`}>
                  <AlertOctagon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                  <div className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-rose-800'}`}>
                    <p className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-rose-900'}`}>
                      Protocolo de Seguridad y Monitoreo Satelital 24/7 (Ecuador)
                    </p>
                    Al presionar el botón de <strong className={isDark ? 'text-rose-400' : 'text-rose-700'}>Auxilio SOS</strong> (en el mapa, viaje activo o barra superior):
                    <ul className={`list-disc list-inside mt-1.5 space-y-1 ${isDark ? 'text-zinc-400' : 'text-rose-800/80'}`}>
                      <li>
                        Tus contactos recibirán un <strong>SMS automático y notificación WhatsApp</strong> con tus coordenadas exactas de latitud y longitud.
                      </li>
                      <li>
                        Se genera un enlace directo a <strong>Google Maps</strong> con rastreo en vivo de tu vehículo o ubicación a pie.
                      </li>
                      <li>
                        Se habilita una llamada de emergencia prioritaria de un toque con la central <strong>ECU 911</strong> o tu contacto principal.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Simulation Feedback Alert */}
                {testAlertSent && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>{testAlertSent}</span>
                  </div>
                )}

                {/* Add / Edit Contact Form Modal / Inline */}
                {showContactForm && (
                  <form
                    onSubmit={handleSaveContact}
                    className={`p-4 sm:p-5 rounded-2xl border-2 shadow-xl space-y-4 animate-fadeIn ${
                      isDark ? 'border-rose-500/50 bg-zinc-900/90' : 'border-rose-200 bg-white'
                    }`}
                  >
                    <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <h4 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-rose-900'}`}>
                        <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                        {editingContactId ? 'Editar Contacto de Emergencia SOS' : 'Nuevo Contacto de Emergencia SOS'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowContactForm(false);
                          setEditingContactId(null);
                        }}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {/* Name */}
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Ej: Carolina Morales"
                          className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-zinc-950 border-zinc-800 focus:border-rose-500 text-white' 
                              : 'bg-slate-50 border-slate-200 focus:border-rose-400 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Relationship */}
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Parentesco / Relación
                        </label>
                        <select
                          value={contactRelationship}
                          onChange={(e) => setContactRelationship(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-zinc-950 border-zinc-800 focus:border-rose-500 text-white' 
                              : 'bg-slate-50 border-slate-200 focus:border-rose-400 text-slate-900'
                          }`}
                        >
                          <option value="Mamá">Mamá</option>
                          <option value="Papá">Papá</option>
                          <option value="Cónyuge / Pareja">Cónyuge / Pareja</option>
                          <option value="Hermano/a">Hermano / Hermana</option>
                          <option value="Hijo/a">Hijo / Hija</option>
                          <option value="Familiar">Familiar Cercano</option>
                          <option value="Amigo/a de Confianza">Amigo/a de Confianza</option>
                          <option value="Trabajo / Otro">Trabajo / Otro</option>
                        </select>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Teléfono Celular (Ecuador) *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+593 99 824 1902"
                            className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                              isDark 
                                ? 'bg-zinc-950 border-zinc-800 focus:border-rose-500 text-white' 
                                : 'bg-slate-50 border-slate-200 focus:border-rose-400 text-slate-900'
                            }`}
                          />
                          <span className={`absolute right-2.5 top-2 text-[10px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>
                            🇪🇨 EC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notification Switches */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <label className={`flex items-center gap-2 text-xs font-medium cursor-pointer p-2.5 rounded-xl border transition-all ${
                        isDark ? 'text-zinc-300 bg-zinc-950/60 border-zinc-800' : 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={contactIsPrimary}
                          onChange={(e) => setContactIsPrimary(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-zinc-900 border-zinc-700"
                        />
                        <span>⭐ Contacto Principal</span>
                      </label>

                      <label className={`flex items-center gap-2 text-xs font-medium cursor-pointer p-2.5 rounded-xl border transition-all ${
                        isDark ? 'text-zinc-300 bg-zinc-950/60 border-zinc-800' : 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={contactNotifySms}
                          onChange={(e) => setContactNotifySms(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-zinc-900 border-zinc-700"
                        />
                        <span>💬 SMS con GPS</span>
                      </label>

                      <label className={`flex items-center gap-2 text-xs font-medium cursor-pointer p-2.5 rounded-xl border transition-all ${
                        isDark ? 'text-zinc-300 bg-zinc-950/60 border-zinc-800' : 'text-slate-700 bg-slate-50 border-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={contactNotifyWhatsapp}
                          onChange={(e) => setContactNotifyWhatsapp(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-zinc-900 border-zinc-700"
                        />
                        <span>🟢 Alerta WhatsApp</span>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowContactForm(false);
                          setEditingContactId(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Guardar Contacto</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Emergency Contacts List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
                    <span>Contactos Vinculados ({emergencyContacts.length})</span>
                    <span>Acciones de Emergencia</span>
                  </div>

                  {emergencyContacts.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-2">
                      <ShieldAlert className="w-8 h-8 text-zinc-500 mx-auto" />
                      <p className="text-xs font-bold text-zinc-300">No tienes contactos de emergencia registrados</p>
                      <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                        Agrega al menos a un familiar o amigo para que reciba tu ubicación satelital en vivo si pulsas el botón SOS.
                      </p>
                    </div>
                  ) : (
                    emergencyContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          contact.isPrimary
                            ? 'bg-rose-950/20 border-rose-800/80 shadow-md shadow-rose-950/30'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {/* Contact info */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                              contact.isPrimary
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {contact.name.substring(0, 2).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs sm:text-sm font-black text-white">{contact.name}</h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {contact.relationship}
                              </span>
                              {contact.isPrimary && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                                  ⭐ Principal SOS
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                              <a
                                href={`tel:${contact.phone}`}
                                className="flex items-center gap-1 font-mono font-medium hover:text-emerald-400 transition-colors"
                              >
                                <Phone className="w-3 h-3 text-emerald-400" />
                                {contact.phone}
                              </a>
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                {contact.notifyBySms !== false && (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">SMS GPS</span>
                                )}
                                {contact.notifyByWhatsapp !== false && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">WhatsApp</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                          {/* Call Button */}
                          <a
                            href={`tel:${contact.phone}`}
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
                            title={`Llamar a ${contact.name}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">Llamar</span>
                          </a>

                          {/* WhatsApp SOS Test */}
                          <a
                            href={`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `🚨 ALERTA SOS AndesMovi: Auxilio solicitado por ${profileName}. Ubicación GPS: ${profileProvince}. Enlace satelital de auxilio activo.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 text-xs font-bold flex items-center gap-1"
                            title="Probar mensaje de auxilio por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden md:inline text-[11px]">WhatsApp</span>
                          </a>

                          {/* Make Primary Toggle */}
                          {!contact.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryContact(contact.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold border border-zinc-700"
                              title="Asignar como contacto principal"
                            >
                              ⭐ Principal
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleStartEditContact(contact)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                            title="Editar contacto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-900/50 text-rose-400 text-xs transition-colors"
                            title="Eliminar contacto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Vista Previa de Despacho SOS */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-rose-400" />
                      Vista Previa de Alerta Satelital SOS (SMS / WhatsApp)
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Este es el mensaje transmitido a tus contactos y al ECU 911 en tiempo real al pulsar el botón SOS:
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-rose-300 leading-relaxed">
                    🚨 <strong>ALERTA SOS AndesMovi Ecuador:</strong> {profileName} ha activado una señal de emergencia.{' '}
                    <strong>Ubicación GPS:</strong> {profileProvince}, Lat: -0.22985, Lng: -78.52495.{' '}
                    <strong>Rastreo en vivo:</strong> https://maps.google.com/?q=-0.22985,-78.52495
                  </div>
                </div>

                {/* Official Ecuador Emergency Services */}
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-300">Centrales Oficiales de Emergencia (Ecuador)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <a
                      href="tel:911"
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 flex flex-col items-center justify-center text-center transition-all group"
                    >
                      <span className="text-xs font-black text-rose-400 group-hover:scale-105 transition-transform">
                        ECU 911
                      </span>
                      <span className="text-[10px] text-zinc-400">Nacional Unificado</span>
                    </a>
                    <a
                      href="tel:101"
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 flex flex-col items-center justify-center text-center transition-all group"
                    >
                      <span className="text-xs font-black text-emerald-400 group-hover:scale-105 transition-transform">
                        101
                      </span>
                      <span className="text-[10px] text-zinc-400">Policía Nacional</span>
                    </a>
                    <a
                      href="tel:102"
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 flex flex-col items-center justify-center text-center transition-all group"
                    >
                      <span className="text-xs font-black text-amber-400 group-hover:scale-105 transition-transform">
                        102
                      </span>
                      <span className="text-[10px] text-zinc-400">Cuerpo Bomberos</span>
                    </a>
                    <a
                      href="tel:131"
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-sky-500/50 flex flex-col items-center justify-center text-center transition-all group"
                    >
                      <span className="text-xs font-black text-sky-400 group-hover:scale-105 transition-transform">
                        131
                      </span>
                      <span className="text-[10px] text-zinc-400">Cruz Roja EC</span>
                    </a>
                  </div>
                </div>

                {/* Save Contacts Confirmation Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Cambios de Seguridad</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. BILLETERA DIGITAL (Digital Wallet, 7% Commission, Withdrawals, History) */}
            {activeSection === 'billetera' && (
              <div className="space-y-5 animate-fadeIn">
                {userRole === 'cliente' ? (
                  <div className="space-y-4">
                    <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                      <div>
                        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('driver_wallet_title')}</h3>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                          {language === 'qu'
                            ? 'Kullki allichina antawakukpalla kan'
                            : 'Exclusiva para conductores para recibir pagos y liquidar comisión del 7%'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${
                        isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        Solo Conductor
                      </span>
                    </div>

                    {/* Notice Card for Client */}
                    <div className={`p-6 rounded-3xl space-y-4 shadow-xl border ${
                      isDark 
                        ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/20 border-amber-500/30' 
                        : 'bg-gradient-to-br from-amber-50 to-white border-amber-200'
                    }`}>
                      <div className="flex items-start gap-3.5">
                        <div className={`p-3 rounded-2xl border flex-shrink-0 ${
                          isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-600'
                        }`}>
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-amber-900'}`}>
                            {language === 'qu'
                              ? 'Kullki allichina antawakukpalla kan'
                              : 'Solo el conductor dispone de Billetera Digital'}
                          </h4>
                          <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-amber-800'}`}>
                            {t('driver_only_wallet_notice')}
                          </p>
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-zinc-950/70 border-zinc-800/80' : 'bg-white border-amber-200/60'
                      }`}>
                        <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Modalidad de pago oficial del Cliente en AndesMovi:</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                          {t('client_payment_rule')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className={`p-2 rounded-lg border ${
                              isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                              <span className={`text-xs font-black block ${isDark ? 'text-white' : 'text-slate-900'}`}>Al Contado</span>
                              <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Efectivo en billetes o monedas USD</span>
                            </div>
                          </div>

                          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className={`p-2 rounded-lg border ${
                              isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <span className={`text-xs font-black block ${isDark ? 'text-white' : 'text-slate-900'}`}>Transferencia Bancaria</span>
                              <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>DeUna! o banco del conductor</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveSection('metodos_pago')}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Ver Métodos de Pago del Cliente</span>
                        </button>
                        <button
                          type="button"
                          onClick={onToggleRole}
                          className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          <Car className="w-4 h-4 text-emerald-400" />
                          <span>Cambiar a Modo Conductor</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                      <div>
                        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('driver_wallet_title')} (USD)</h3>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                          {language === 'qu' ? 'Puchuk kullki, yaykuna, llukshina, patsakmanta 7% allichiy' : 'Control de saldo, comisiones del 7%, ingresos y retiros a bancos del Ecuador'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}>
                        7% Fee Justo
                      </span>
                    </div>

                    {/* Main Balance Banner */}
                    <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
                      isDark 
                        ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/50 border-emerald-500/30' 
                        : 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500 text-white shadow-emerald-200'
                    }`}>
                      <div>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-emerald-100'}`}>{t('available_balance')}</span>
                        <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-white'}`}>
                          {formatCurrency(walletBalance)}
                        </div>
                        <div className={`flex items-center gap-1.5 text-[11px] mt-2 font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-50'}`}>
                          <ShieldCheck className="w-4 h-4" />
                          <span>{t('commission_badge')}</span>
                        </div>
                      </div>

                      {/* Document Presentation for Recharge */}
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-emerald-50'}`}>
                          Recarga con Comprobante Bancario:
                        </span>
                        <button
                          type="button"
                          id="btn-settings-present-voucher"
                          onClick={() => setShowRechargeModal(true)}
                          className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                            isDark 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/20' 
                              : 'bg-white hover:bg-emerald-50 text-emerald-700 shadow-emerald-800/20'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Presentar Comprobante de Transferencia</span>
                        </button>
                      </div>
                    </div>

                    {/* Requisite directive banner */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-300 block text-xs">
                          Requisito de Activación de Recargas
                        </span>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          El conductor tiene que <strong>presentar el documento de transferencia</strong> a las cuentas personales de <strong>Jhon Sebastian Yepez Clavijo</strong> para poder activar la recarga. El Administrador verificará el comprobante bancario antes de acreditar tu saldo.
                        </p>
                      </div>
                    </div>

                {/* 7% Commission Focus Card */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-zinc-950 flex-shrink-0 mt-0.5">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-emerald-400">{t('commission_title')}</h4>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                        AndesMovi Transparente
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{t('commission_desc')}</p>
                    <div className="pt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="block text-[10px] text-zinc-400 font-bold">Por cada $10.00 USD</span>
                        <span className="font-mono font-black text-white">$10.00</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                        <span className="block text-[10px] text-emerald-300 font-bold">Conductor/Comercio (93%)</span>
                        <span className="font-mono font-black text-emerald-400">$9.30</span>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="block text-[10px] text-zinc-400 font-bold">AndesMovi (7%)</span>
                        <span className="font-mono font-black text-zinc-300">$0.70</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics 3-Grid: Ingresos, Gastos, Retiros */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                      <span>{t('earnings')}</span>
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xl font-black font-mono text-emerald-400">
                      +{formatCurrency(totalEarnings)}
                    </span>
                    <span className="text-[10px] text-zinc-500">Total servicios realizados</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                      <span>{t('expenses')}</span>
                      <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-xl font-black font-mono text-rose-400">
                      -{formatCurrency(totalExpenses)}
                    </span>
                    <span className="text-[10px] text-zinc-500">Viajes y comida pagada</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                      <span>{t('withdrawals')}</span>
                      <Building2 className="w-4 h-4 text-sky-400" />
                    </div>
                    <span className="text-xl font-black font-mono text-sky-400">
                      {formatCurrency(totalWithdrawals)}
                    </span>
                    <span className="text-[10px] text-zinc-500">Transferido a cuentas bancarias</span>
                  </div>
                </div>

                {/* Gráfica de Barras de Rendimiento Semanal (Recharts) */}
                <DriverWeeklyEarningsChart
                  driverName={currentUser?.name || profileName}
                />

                {/* Bank Withdrawal Section */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span>{t('withdraw_btn')} a Cuenta Bancaria de Ecuador</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Retira tus ganancias directamente a cualquier banco o cooperativa nacional de Ecuador sin costo adicional.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Entidad Bancaria</label>
                      <select
                        value={withdrawBank}
                        onChange={(e) => setWithdrawBank(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Banco Pichincha">Banco Pichincha (Inmediato)</option>
                        <option value="Banco Guayaquil">Banco Guayaquil</option>
                        <option value="Produbanco">Produbanco (Grupo Promerica)</option>
                        <option value="Cooperativa JEP">Cooperativa JEP</option>
                        <option value="Banco del Pacífico">Banco del Pacífico</option>
                        <option value="DeUna! (Móvil)">Billetera DeUna! (Pichincha)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Tipo de Cuenta</label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value as 'Ahorros' | 'Corriente')}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Ahorros">Cuenta de Ahorros</option>
                        <option value="Corriente">Cuenta Corriente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Número de Cuenta</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">Monto a Retirar en USD</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={walletBalance}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(Math.floor(walletBalance))}
                          className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-300"
                        >
                          Máx
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-confirm-withdraw"
                    onClick={handleRequestWithdrawal}
                    disabled={withdrawSuccess || walletBalance < withdrawAmount}
                    className="w-full min-h-[44px] py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all mt-2"
                  >
                    {withdrawSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Retiro Procesado con Éxito!</span>
                      </>
                    ) : (
                      <>
                        <Landmark className="w-4 h-4" />
                        <span>Solicitar Retiro de {formatCurrency(withdrawAmount)} a {withdrawBank}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Digital Wallet Transaction History */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{t('tx_history')}</h4>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {walletTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-lg ${
                              tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {tx.amount > 0 ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{tx.desc}</span>
                            <span className="text-[10px] text-zinc-500">{tx.date}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-black ${
                              tx.amount > 0 ? 'text-emerald-400' : 'text-zinc-300'
                            }`}
                          >
                            {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

            {/* 3. SELECCIÓN DE IDIOMA (Language Selection with Quechua / Kichwa) */}
            {activeSection === 'idioma' && (
              <div className="space-y-5 animate-fadeIn">
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('language')}</h3>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${
                      isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      Multilingüe Andino
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                    {language === 'qu'
                      ? 'Kikin rimayta akllay: Runa Shimi (Kichwa), Kastilla Shimi (Español), English, Português'
                      : 'Selecciona tu idioma preferido. Incluye soporte nativo de Kichwa / Quechua para pueblos andinos del Ecuador.'}
                  </p>
                </div>

                {/* Cultural Badge for Kichwa */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isDark ? 'bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-sky-500/10 border-emerald-500/30' : 'bg-gradient-to-r from-amber-50 via-emerald-50 to-sky-50 border-emerald-100'
                }`}>
                  <span className="text-2xl">🏔️</span>
                  <div>
                    <h4 className={`text-xs font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      Runa Shimi / Kichwa: Allikay Shamushka!
                    </h4>
                    <p className={`text-[11px] leading-relaxed mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      AndesMovi honra la identidad milenaria del Ecuador integrando la variante unificada del Kichwa
                      andino (Otavalo, Cotopaxi, Chimborazo, Cañar, Azuay y Amazonía). Toda la navegación y tarifas se adaptan a tu lengua.
                    </p>
                  </div>
                </div>

                {/* Languages Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPPORTED_LANGUAGES.map((langOpt) => {
                    const isSelected = language === langOpt.code;
                    return (
                      <button
                        key={langOpt.code}
                        id={`btn-select-lang-${langOpt.code}`}
                        onClick={() => {
                          onChangeLanguage(langOpt.code);
                          showFeedback(
                            langOpt.code === 'qu'
                              ? '¡Kichwa Runa Shimi akllashka!'
                              : `Idioma cambiado a ${langOpt.name}`
                          );
                        }}
                        className={`min-h-[64px] p-4 rounded-2xl border text-left flex items-start justify-between transition-all active:scale-98 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                            : isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{langOpt.flag}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isSelected ? (isDark ? 'text-white' : 'text-emerald-700') : (isDark ? 'text-white' : 'text-slate-900')}`}>{langOpt.name}</span>
                              {langOpt.code === 'qu' && (
                                <span className={`text-[9px] border px-1.5 py-0.2 rounded font-black ${
                                  isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                  Andes
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-semibold block mt-0.5 ${isSelected ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-emerald-400' : 'text-slate-500')}`}>
                              {langOpt.nativeName}
                            </span>
                            <span className={`text-[10px] block mt-1 leading-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              {langOpt.description}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="p-1 rounded-full bg-emerald-500 text-zinc-950">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. NOTIFICACIONES (Push, SMS, Promos, Trips) */}
            {activeSection === 'notificaciones' && (
              <div className="space-y-5 animate-fadeIn">
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('notifications')}</h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                    {language === 'qu' ? 'Willaykunata charina antawapi' : 'Configura alertas de llegada, sonido, chat y promociones'}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      id: 'push',
                      title: 'Notificaciones Push en Tiempo Real',
                      desc: 'Alertas inmediatas al asignar conductor, inicio de ruta y entrega de encomienda.',
                      state: notifPush,
                      toggle: async () => {
                        const next = !notifPush;
                        setNotifPush(next);
                        if (next) {
                          await pushNotificationService.requestPermission();
                        }
                        pushNotificationService.updatePreferences({ pushEnabled: next });
                      },
                    },
                    {
                      id: 'sound',
                      title: 'Alertas Sonoras de Radar y Llegada',
                      desc: 'Sonido característico andino cuando el conductor esté a 2 minutos de tu puerta.',
                      state: notifSound,
                      toggle: () => {
                        const next = !notifSound;
                        setNotifSound(next);
                        pushNotificationService.updatePreferences({ soundEnabled: next });
                      },
                    },
                    {
                      id: 'offers',
                      title: 'Contraofertas y Actualizaciones de Viajes',
                      desc: 'Avisos en pantalla cuando un conductor proponga una tarifa alternativa en USD.',
                      state: notifDriverOffers,
                      toggle: () => {
                        const next = !notifDriverOffers;
                        setNotifDriverOffers(next);
                        pushNotificationService.updatePreferences({ tripUpdates: next });
                      },
                    },
                    {
                      id: 'security',
                      title: 'Alertas de Seguridad y Monitoreo ECU 911',
                      desc: 'Notificaciones críticas durante desvíos inesperados o paradas prolongadas.',
                      state: notifSecurity,
                      toggle: () => setNotifSecurity(!notifSecurity),
                    },
                    {
                      id: 'promos',
                      title: 'Descuentos y Tarifas Promo en tu Ciudad',
                      desc: 'Promociones especiales para fines de semana, fiestas de Quito y feriados nacionales.',
                      state: notifPromos,
                      toggle: () => {
                        const next = !notifPromos;
                        setNotifPromos(next);
                        pushNotificationService.updatePreferences({ promotions: next });
                      },
                    },
                  ].map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notif.title}</h4>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{notif.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={notif.toggle}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                          notif.state ? 'bg-emerald-500' : (isDark ? 'bg-zinc-800' : 'bg-slate-200')
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            notif.state ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Test Trigger */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Probar Notificaciones Push</h4>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Envía un banner de prueba en tiempo real con audio andino para verificar la configuración.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      pushNotificationService.sendLocalNotification({
                        title: '🔔 Notificación de Prueba',
                        body: 'El servicio de notificaciones push de AndesMovi está activo y funcionando.',
                        category: 'system',
                      });
                      showFeedback('Notificación de prueba enviada con éxito');
                    }}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-black transition-colors flex-shrink-0 active:scale-95 ${
                      isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/40' : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                    }`}
                  >
                    Probar Ahora
                  </button>
                </div>

                {/* Clear Alert History in Settings */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Eliminar Historial de Alertas</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Borra todas las alertas, avisos de carreras y notificaciones almacenadas en el dispositivo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      pushNotificationService.clearHistory();
                      showFeedback('Historial de alertas eliminado');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors flex-shrink-0 active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar Alertas</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. SEGURIDAD (PIN, 2FA, Cédula, SOS ECU 911) */}
            {activeSection === 'seguridad' && (
              <div className="space-y-5 animate-fadeIn">
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('security')}</h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                    {language === 'qu' ? 'Allikay kamachiy, PIN yupaykuna, ECU 911 willay' : 'Protocolos de bioseguridad, validación de cédula y código PIN de abordaje'}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-100'
                }`}>
                  <div className={`p-2 rounded-xl border ${
                    isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-600 border-rose-200'
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-rose-300' : 'text-rose-900'}`}>Monitoreo Satelital y Botón de Auxilio ECU 911</h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-rose-800/80'}`}>
                      Cada viaje en AndesMovi cuenta con georreferenciación encriptada, telemetría de velocidad y enlace
                      directo con las unidades de respuesta del ECU 911 en las 24 provincias del Ecuador.
                    </p>
                  </div>
                </div>

                {/* Cambiar Contraseña Card */}
                <div className={`p-5 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                    <div className={`p-2.5 rounded-xl border ${
                      isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>Cambiar Contraseña / Seguridad de Cuenta</h4>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>Actualiza tu clave de acceso para proteger tu cuenta ({currentUser?.role || 'usuario'})</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5">
                    {passwordError && (
                      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Contraseña Actual</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          placeholder="Ingresa tu contraseña actual"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">Nueva Contraseña (mín. 6 carac.)</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl pl-10 pr-10 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">Confirmar Nueva Contraseña</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            placeholder="Repite tu nueva contraseña"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-98 cursor-pointer mt-2"
                    >
                      Actualizar Contraseña de Cuenta
                    </button>
                  </form>
                </div>

                <div className="space-y-3">
                  {/* Safety PIN toggle */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{t('safety_pins')} (4 dígitos)</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Exigir un PIN verbal antes de que el conductor inicie el viaje o entregue un paquete.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSafetyPinRequired(!safetyPinRequired)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                        safetyPinRequired ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          safetyPinRequired ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2FA SMS */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{t('two_factor_auth')}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Enviar código SMS o WhatsApp a tu teléfono móvil ecuatoriano al ingresar desde un dispositivo nuevo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorActive(!twoFactorActive)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                        twoFactorActive ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          twoFactorActive ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-white">{t('emergency_contacts')}</h4>
                    <p className="text-[11px] text-zinc-400">
                      Contacto al cual se le enviará un SMS automático con tu ubicación GPS al pulsar el botón SOS.
                    </p>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* ZONA DE PELIGRO: ELIMINAR CUENTA DEFINITIVAMENTE (DENTRO DE SEGURIDAD) */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border-2 border-rose-500/40 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                        <AlertOctagon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-rose-200 uppercase tracking-wider">
                            Zona de Peligro
                          </h4>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                            Irreversible
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">
                          Eliminar tu cuenta borrará definitivamente tus datos biométricos, número de cédula, billetera digital e historial de viajes de AndesMovi.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        id="btn-delete-account-seguridad"
                        onClick={() => {
                          haptic.warning();
                          setShowDeleteAccountModal(true);
                          setDeleteConfirmInput('');
                          setDeleteError(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar mi cuenta definitivamente</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. MÉTODOS DE PAGO (Efectivo Al Contado, Transferencia, DeUna) */}
            {activeSection === 'metodos_pago' && (
              <div className="space-y-5 animate-fadeIn">
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('payment_methods')} (Ecuador USD)</h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                    {language === 'qu'
                      ? 'Kullki kuna ñankuna: Chawpi kullki (efectivo), Yaykuchiy (transferencia)'
                      : 'Administra tus formas de pago preferidas para viajes y entregas'}
                  </p>
                </div>

                {/* Policy Notice Box */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                  }`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-xs font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {userRole === 'cliente' ? 'Modalidad del Cliente: Contado y Transferencia' : 'Modalidad del Conductor: Billetera Digital y Cobros Directos'}
                    </h4>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      {userRole === 'cliente'
                        ? 'En AndesMovi, el cliente realiza sus pagos directamente al conductor al contado (efectivo) o mediante transferencia bancaria (DeUna! o banco). La billetera digital con comisiones es exclusiva del conductor.'
                        : 'Como conductor, tus ganancias y la comisión justa del 7% se gestionan en tu Billetera Digital. Puedes recibir dinero de los clientes en efectivo o por transferencia a tu cuenta.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(userRole === 'cliente'
                    ? [
                        {
                          id: 'efectivo' as PaymentMethodType,
                          name: 'Al Contado (Efectivo USD)',
                          desc: 'Pago directo en billetes o monedas al conductor al iniciar o terminar la carrera.',
                          icon: <Landmark className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />,
                          badge: 'Principal / Contado',
                        },
                        {
                          id: 'transferencia' as PaymentMethodType,
                          name: 'Transferencia Bancaria Directa',
                          desc: 'Transfiere al número de cuenta del conductor (Pichincha, Guayaquil, Produbanco, JEP).',
                          icon: <Building2 className={`w-5 h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />,
                          badge: 'Acreditación Directa',
                        },
                        {
                          id: 'deuna' as PaymentMethodType,
                          name: 'DeUna! (Transferencia Móvil)',
                          desc: 'Pago rápido mediante QR o número de celular registrado sin costo interbancario.',
                          icon: <Smartphone className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />,
                          badge: 'Rápido',
                        },
                        {
                          id: 'tarjeta' as PaymentMethodType,
                          name: 'Tarjeta de Crédito o Débito (Visa / Mastercard)',
                          desc: 'Tarjeta registrada terminada en •••• 4192 (Débito Banco Pichincha)',
                          icon: <CreditCard className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />,
                        },
                      ]
                    : [
                        {
                          id: 'billetera' as PaymentMethodType,
                          name: 'Billetera Digital AndesMovi (Conductor)',
                          desc: `Saldo actual disponible: ${formatCurrency(walletBalance)} con comisión del 7% y retiros bancarios.`,
                          icon: <Wallet className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />,
                          badge: 'Conductor 7%',
                        },
                        {
                          id: 'efectivo' as PaymentMethodType,
                          name: 'Cobro en Efectivo (Al Contado)',
                          desc: 'Recibir pago en efectivo de los clientes al completar el servicio.',
                          icon: <Landmark className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />,
                          badge: 'Cobro Directo',
                        },
                        {
                          id: 'transferencia' as PaymentMethodType,
                          name: 'Transferencias Bancarias de Clientes',
                          desc: 'Recibir transferencias interbancarias directas a tu cuenta nacional.',
                          icon: <Building2 className={`w-5 h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />,
                        },
                        {
                          id: 'deuna' as PaymentMethodType,
                          name: 'Cobro por DeUna! (QR Conductor)',
                          desc: 'Presenta tu código QR de DeUna! al cliente en el vehículo.',
                          icon: <Smartphone className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />,
                        },
                      ]
                  ).map((pm) => {
                    const isSelected = defaultPayment === pm.id;
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setDefaultPayment(pm.id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                            : isDark ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'
                          }`}>
                            {pm.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pm.name}</span>
                              {pm.badge && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                  isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                  {pm.badge}
                                </span>
                              )}
                            </div>
                            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{pm.desc}</span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? (isDark ? 'border-emerald-500 bg-emerald-500 text-zinc-950' : 'border-emerald-500 bg-emerald-500 text-white') : (isDark ? 'border-zinc-700' : 'border-slate-300')
                          }`}
                        >
                          {isSelected && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-zinc-950' : 'bg-white'}`} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cuentas Bancarias Oficiales de Depósito y Recarga (Jhon Sebastian Yepez Clavijo) */}
                <div className="pt-2">
                  <AdminBankAccountsList
                    title="Cuentas Oficiales de Administrador para Depósito / Recarga"
                    subtitle="Cuentas registradas a nombre de Jhon Sebastian Yepez Clavijo (C.I. 1004721351) autorizadas para depósitos directos:"
                    compact={true}
                    showAllDataCopy={true}
                  />
                </div>
              </div>
            )}

            {/* 7. GESTIÓN DIFERENCIADA DE VEHÍCULOS (Autos y Motos para Conductores) */}
            {activeSection === 'vehiculo' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Header visualmente diferenciado con temática automotriz y ANT Ecuador */}
                <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-lg space-y-3 transition-all ${
                  isDark 
                    ? 'bg-gradient-to-r from-amber-500/15 via-zinc-900/90 to-emerald-500/15 border-amber-500/40' 
                    : 'bg-gradient-to-r from-amber-50 via-white to-emerald-50 border-amber-200 shadow-amber-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md font-black flex-shrink-0 ${
                        isDark ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950' : 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                      }`}>
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                            Mis Vehículos y Flota Registrada
                          </h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            ANT Ecuador
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-300' : 'text-[#4B5563]'}`}>
                          Gestiona tus automóviles (carreras de taxi) y motocicletas (delivery express) autorizados para operar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenAddVehicle}
                        className={`min-h-[40px] px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                          isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Añadir Vehículo</span>
                      </button>

                      <button
                        type="button"
                        onClick={onToggleRole}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          isDark ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{userRole === 'conductor' ? 'Conductor' : 'Cliente'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Barra de métricas rápidas de flota */}
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs ${isDark ? 'border-zinc-800/80' : 'border-slate-100'}`}>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Registrados</span>
                      <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{vehicles.length} unidades</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-amber-50 border-amber-100'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-amber-700'}`}>Autos / Taxis</span>
                      <span className={`text-sm font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        {vehicles.filter((v) => v.type === 'auto').length} autos
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-sky-50 border-sky-100'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-sky-700'}`}>Motos Express</span>
                      <span className={`text-sm font-black ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                        {vehicles.filter((v) => v.type === 'moto').length} motos
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-emerald-500/30 bg-emerald-500/5' : 'bg-emerald-50 border-emerald-200'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Unidad Activa</span>
                      <span className={`text-sm font-black truncate block ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        {vehicles.find((v) => v.isActive)?.plate || 'Ninguna'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FORMULARIO DE AÑADIR / EDITAR VEHÍCULO */}
                {isVehicleFormOpen && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border-2 border-emerald-500/60 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          {editingVehicleId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">
                            {editingVehicleId ? 'Editar Vehículo' : 'Añadir Nuevo Vehículo a tu Flota'}
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            Completa los datos requeridos por la Agencia Nacional de Tránsito de Ecuador.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsVehicleFormOpen(false);
                          setEditingVehicleId(null);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 1. SELECCIÓN DE TIPO: AUTO O MOTO (Tarjetas Visuales) */}
                    <div>
                      <label className="block text-xs font-black text-zinc-300 uppercase tracking-wider mb-2">
                        1. Tipo de Vehículo (Selecciona Auto o Moto)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Tarjeta Auto */}
                        <button
                          type="button"
                          onClick={() => {
                            haptic.tap();
                            setVehicleForm({ ...vehicleForm, type: 'auto' });
                          }}
                          className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                            vehicleForm.type === 'auto'
                              ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                              : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl flex-shrink-0 ${
                              vehicleForm.type === 'auto'
                                ? 'bg-amber-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <Car className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">Automóvil / Taxi</span>
                              {vehicleForm.type === 'auto' && (
                                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 block mt-0.5">
                              Sedán, Hatchback o SUV (4 pasajeros). Para servicio de viajes y taxis en la provincia.
                            </span>
                          </div>
                        </button>

                        {/* Tarjeta Moto */}
                        <button
                          type="button"
                          onClick={() => {
                            haptic.tap();
                            setVehicleForm({ ...vehicleForm, type: 'moto' });
                          }}
                          className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer ${
                            vehicleForm.type === 'moto'
                              ? 'border-sky-400 bg-sky-500/15 shadow-md shadow-sky-500/10'
                              : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl flex-shrink-0 ${
                              vehicleForm.type === 'moto'
                                ? 'bg-sky-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <Bike className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white">Motocicleta</span>
                              {vehicleForm.type === 'moto' && (
                                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 block mt-0.5">
                              Moto urbana o de ruta. Ideal para encomiendas rápidas y entregas de domicilios express.
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 2. CAMPOS: MODELO, COLOR, PLACA, AÑO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Modelo con sugerencias rápidas */}
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Modelo del Vehículo <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.model}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                          placeholder={vehicleForm.type === 'auto' ? 'Ej: Chevrolet Sail 1.5L' : 'Ej: Honda CB125F Twister'}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-zinc-950 border-zinc-750 text-white focus:border-emerald-500' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400'
                          }`}
                        />
                        {/* Chips de sugerencias */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {(vehicleForm.type === 'auto'
                            ? ['Chevrolet Sail', 'Kia Rio', 'Suzuki Forza', 'Hyundai Grand i10']
                            : ['Honda CB125F', 'Yamaha FZ-S', 'Suzuki Gixxer', 'Bajaj Pulsar 150']
                          ).map((sugg) => (
                            <button
                              key={sugg}
                              type="button"
                              onClick={() => setVehicleForm({ ...vehicleForm, model: sugg })}
                              className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                                isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              + {sugg}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color con paleta rápida */}
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Color del Vehículo <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.color}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                          placeholder="Ej: Amarillo Taxi, Blanco, Negro, Rojo"
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-zinc-950 border-zinc-750 text-white focus:border-emerald-500' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400'
                          }`}
                        />
                        {/* Swatches de color */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {[
                            { name: 'Amarillo Taxi', hex: '#eab308' },
                            { name: 'Blanco', hex: '#ffffff' },
                            { name: 'Plata Metálico', hex: '#94a3b8' },
                            { name: 'Negro', hex: '#18181b' },
                            { name: 'Rojo Carmesí', hex: '#ef4444' },
                            { name: 'Azul Eléctrico', hex: '#3b82f6' },
                          ].map((col) => (
                            <button
                              key={col.name}
                              type="button"
                              onClick={() => setVehicleForm({ ...vehicleForm, color: col.name })}
                              className={`text-[10px] px-2 py-0.5 rounded-md hover:text-white flex items-center gap-1 border transition-colors ${
                                isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/40 flex-shrink-0"
                                style={{ backgroundColor: col.hex }}
                              />
                              <span>{col.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Placa Ecuatoriana con previsualización oficial */}
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Placa de Identificación (Ecuador) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.plate}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
                          placeholder={vehicleForm.type === 'auto' ? 'PBC-4921' : 'IH-882M'}
                          maxLength={8}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono font-black tracking-wider focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-zinc-950 border-zinc-750 text-amber-400 focus:border-emerald-500' 
                              : 'bg-slate-50 border-slate-200 text-amber-600 focus:border-emerald-400'
                          }`}
                        />
                        <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Iniciales: P = Pichincha (Quito/Cayambe), I = Imbabura, G = Guayas.
                        </span>
                      </div>

                      {/* Año del Vehículo */}
                      <div className="space-y-1.5">
                        <label className={`block text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Año de Fabricación
                        </label>
                        <input
                          type="number"
                          min={2010}
                          max={2026}
                          value={vehicleForm.year}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-zinc-950 border-zinc-750 text-white focus:border-emerald-500' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400'
                          }`}
                        />
                        <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          <CheckCircle2 className="w-3 h-3" />
                          Cumple normativa ANT (menor a 15 años de antigüedad).
                        </span>
                      </div>
                    </div>

                    {/* Previsualización de la Placa Ecuatoriana */}
                    {vehicleForm.plate && (
                      <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-400">Previsualización de Placa Oficial:</span>
                        <div className="inline-flex flex-col items-center bg-zinc-100 text-zinc-950 px-3 py-1 rounded-lg border-2 border-zinc-900 shadow-md">
                          <div className="w-full flex items-center justify-between text-[8px] font-black tracking-widest text-zinc-700 border-b border-zinc-400 pb-0.5">
                            <span>ECUADOR</span>
                            <div className="flex gap-0.5">
                              <span className="w-2 h-1 bg-amber-400" />
                              <span className="w-2 h-1 bg-blue-600" />
                              <span className="w-2 h-1 bg-red-600" />
                            </div>
                          </div>
                          <span className="font-mono text-sm font-black tracking-wider text-zinc-950 pt-0.5">
                            {vehicleForm.plate}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción del formulario */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsVehicleFormOpen(false);
                          setEditingVehicleId(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveVehicleForm}
                        className="min-h-[40px] px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingVehicleId ? 'Guardar Cambios' : 'Registrar Vehículo'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* LISTA VISUAL DE VEHÍCULOS REGISTRADOS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                      Unidades en tu Cuenta ({vehicles.length})
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      Haz clic en "Activar" para poner una unidad en radar
                    </span>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-3">
                      <Car className="w-10 h-10 text-zinc-600 mx-auto" />
                      <p className="text-sm font-bold text-zinc-400">No tienes vehículos registrados aún.</p>
                      <button
                        type="button"
                        onClick={handleOpenAddVehicle}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Añadir mi primer vehículo</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {vehicles.map((veh) => {
                        const isAuto = veh.type === 'auto';
                        return (
                          <div
                            key={veh.id || veh.plate}
                            className={`p-4 rounded-2xl border-2 transition-all relative ${
                              veh.isActive
                                ? 'bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 border-emerald-500 shadow-md shadow-emerald-500/10'
                                : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* Izquierda: Placa oficial & Datos de la unidad */}
                              <div className="flex items-center gap-3.5">
                                {/* Placa ecuatoriana estilizada */}
                                <div className="inline-flex flex-col items-center bg-zinc-100 text-zinc-950 px-3 py-1.5 rounded-xl border-2 border-zinc-900 shadow flex-shrink-0 min-w-[95px]">
                                  <div className="w-full flex items-center justify-between text-[7px] font-black tracking-widest text-zinc-600 border-b border-zinc-400 pb-0.5">
                                    <span>ECUADOR</span>
                                    <div className="flex gap-0.5">
                                      <span className="w-1.5 h-1 bg-amber-400" />
                                      <span className="w-1.5 h-1 bg-blue-600" />
                                      <span className="w-1.5 h-1 bg-red-600" />
                                    </div>
                                  </div>
                                  <span className="font-mono text-sm font-black tracking-wider text-zinc-950 pt-0.5">
                                    {veh.plate}
                                  </span>
                                </div>

                                {/* Información del modelo y tipo */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="text-sm font-black text-white">
                                      {veh.model}
                                    </h5>
                                    {/* Badge tipo */}
                                    <span
                                      className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                        isAuto
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                      }`}
                                    >
                                      {isAuto ? <Car className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                                      <span>{isAuto ? 'Auto / Taxi' : 'Motocicleta'}</span>
                                    </span>

                                    {/* Estado Activo */}
                                    {veh.isActive && (
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>En Servicio Activo</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black/40" />
                                      <span>Color: <strong className="text-zinc-200">{veh.color}</strong></span>
                                    </span>
                                    {veh.year && (
                                      <span>Año: <strong className="text-zinc-200">{veh.year}</strong></span>
                                    )}
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                      <FileCheck className="w-3.5 h-3.5" />
                                      RTV ANT 2026 Vigente
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Derecha: Botones de Activar, Editar y Eliminar */}
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {!veh.isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetActiveVehicle(veh.id)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-750 transition-colors cursor-pointer"
                                    title="Poner esta unidad en servicio activo"
                                  >
                                    Activar Unidad
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVehicle(veh)}
                                  className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-750 transition-colors cursor-pointer"
                                  title="Editar datos del vehículo"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteVehicle(veh.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                                  title="Eliminar vehículo de la flota"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Caja informativa de normativa ANT Ecuador */}
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-200">Requisito Oficial de Movilidad en Ecuador:</span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Todos los autos y motos registrados deben contar con matrícula vigente, Revisión Técnica Vehicular (RTV) aprobada y póliza SPPAT activa. AndesMovi verifica los registros con la base de datos de la ANT.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. HISTORIAL DE SERVICIOS (Service History) */}
            {activeSection === 'historial' && (
              <div className="space-y-5 animate-fadeIn">
                <div className={`border-b pb-3 flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div>
                    <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('service_history')}</h3>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                      {language === 'qu' ? 'Tukuy ruraykunamanta kawsay' : 'Consulta tus viajes, domicilios de comida y encomiendas completadas'}
                    </p>
                  </div>
                  {onOpenHistoryDirectly && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenHistoryDirectly();
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>Abrir Visor Completo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* DRIVER TIPS SUMMARY (Resumen de Propinas a Conductores) */}
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
                  isDark 
                    ? 'bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900/90 border-amber-500/30' 
                    : 'bg-gradient-to-br from-amber-50 to-white border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-amber-900'}`}>
                          <span>Driver Tips • Propinas a Conductores</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            100% Directo
                          </span>
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Propinas Contribuidas</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-xl font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          {formatCurrency(totalTipsContributed)}
                        </span>
                        <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>USD</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Viajes con Propina</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {tripsWithTipsCount}
                        </span>
                        <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>
                          de {tripHistory.length} servicios
                        </span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Promedio por Viaje</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-xl font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatCurrency(tripsWithTipsCount > 0 ? totalTipsContributed / tripsWithTipsCount : 0)}
                        </span>
                        <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>USD</span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 text-[11px] pt-1 border-t ${isDark ? 'text-zinc-400 border-zinc-800/80' : 'text-slate-500 border-slate-100'}`}>
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 flex-shrink-0" />
                    <span>El 100% de las propinas va directamente a los conductores sin comisiones ni retenciones.</span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {tripHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white capitalize">{item.serviceType}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">#{item.receiptNumber}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            Completado
                          </span>
                          {(item.tipUsd || 0) > 0 && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              Propina: +{formatCurrency(item.tipUsd!)} USD
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-300 font-medium">
                          📍 {item.origin.name || item.origin.address} → 🏁 {item.destination.name || item.destination.address}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {item.date} • Conductor: {item.driver.name} ({item.driver.vehicle.model})
                        </p>
                      </div>

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {formatCurrency(item.priceUsd + (item.tipUsd || 0))}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold">
                            Pago: {item.paymentMethod}
                          </span>
                          {(item.tipUsd || 0) > 0 && (
                            <span className="text-[10px] text-amber-400 font-bold">
                              (incl. propina)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. AYUDA Y SOPORTE (Help & Support 24/7) */}
            {activeSection === 'ayuda' && (
              <div className="space-y-5 animate-fadeIn">
                <div className={`border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t('help_support')} AndesMovi 24/7</h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-[#6B7280]'}`}>
                    {language === 'qu' ? 'Yanapay antawata, willaykuna' : 'Centro de atención al cliente y soporte para Ecuador'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="https://wa.me/593978734844?text=Hola%20Central%20AndesMovi%20Ecuador"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20 text-left flex items-start gap-3 transition-colors group cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-500 text-zinc-950 group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-400">Chat WhatsApp Oficial Ecuador</h4>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        Atención en vivo 24/7 con Central AndesMovi (0978734844 / +593 97 873 4844).
                      </p>
                    </div>
                  </a>

                  <a
                    href="tel:0978734844"
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all hover:border-emerald-500/50 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border ${
                      isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Central Telefónica AndesMovi</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                        Línea directa: <strong className="text-emerald-500 font-mono">0978734844</strong> (+593 97 873 4844) disponible 24/7 para asistencia.
                      </p>
                    </div>
                  </a>
                </div>

                {/* FAQ list */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Preguntas Frecuentes</h4>
                  {[
                    {
                      q: '¿Cómo funciona la comisión justa del 7%?',
                      a: 'AndesMovi retiene únicamente el 7% por servicio finalizado para el mantenimiento de la app y servidores. El 93% restante va íntegro al conductor o comercio.',
                    },
                    {
                      q: '¿Cómo pago con DeUna! o tarjeta?',
                      a: 'Puedes escanear el código QR que muestra el conductor o asociar tu tarjeta Visa/Mastercard para débito automático en USD.',
                    },
                    {
                      q: '¿Cómo reportar un objeto extraviado?',
                      a: 'Escribe a nuestro canal de WhatsApp indicando el código de recibo de tu viaje para contactar al conductor en menos de 15 minutos.',
                    },
                  ].map((faq, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl border text-xs ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`font-bold block mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Q: {faq.q}</span>
                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. TÉRMINOS Y CONDICIONES (Terms & Conditions) */}
            {activeSection === 'terminos' && (
              <div className="space-y-4 animate-fadeIn">
                <div className={`border-b pb-3 flex items-center justify-between flex-wrap gap-2 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div>
                    <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <FileText className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span>{t('terms_conditions')}</span>
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {language === 'qu' ? 'Kamachikuna Ecuador mamallaktapi' : 'Términos, Condiciones y Contrato Oficial de Intermediación Tecnológica en el Ecuador'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalDocType('terminos');
                      setShowLegalPopup(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                      isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span>Abrir en Pantalla Completa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`p-4 rounded-2xl border text-xs space-y-4 leading-relaxed max-h-[420px] overflow-y-auto pr-2 ${
                  isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-100 border-emerald-200'
                  }`}>
                    <ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <div>
                      <span className={`font-bold text-xs block ${isDark ? 'text-white' : 'text-emerald-900'}`}>
                        Plataforma Tecnológica de Intermediación AndesMovi
                      </span>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-300' : 'text-emerald-800'}`}>
                        Cobertura en las 24 provincias de la República del Ecuador. Servicios de taxis, movilidad particular, encomiendas seguras, delivery y viajes ejecutivos interprovinciales.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. Objeto y Naturaleza del Servicio</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      AndesMovi opera como facilitador y plataforma tecnológica digital que conecta a pasajeros y remitentes con conductores profesionales y repartidores independientes. AndesMovi no es una empresa de transporte público tradicional ni propietaria de los vehículos.
                    </p>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Obligaciones y Conducta del Usuario/Cliente</p>
                    <ul className={`list-disc list-inside text-[11px] space-y-1 pl-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      <li>Trato respetuoso hacia el conductor y cuidado de las instalaciones del vehículo.</li>
                      <li>Prohibición absoluta de transportar sustancias ilícitas, drogas, armas, explosivos o cargas no declaradas.</li>
                      <li>Obligación de pago puntual en Dólares (USD) acordado o marcado por taxímetro.</li>
                    </ul>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Obligaciones del Conductor y Comisión del 7%</p>
                    <ul className={`list-disc list-inside text-[11px] space-y-1 pl-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      <li>Portar Licencia de Conducir, Matrícula anual y SOAT/SPPAT vigentes ante la ANT.</li>
                      <li>Mantener el vehículo en perfecto estado técnico-mecánico y de limpieza.</li>
                      <li>Aceptación de la comisión del 7% por uso de software tecnológico, reservando el 93% neto al conductor.</li>
                    </ul>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>4. Tarifas, Métodos de Pago y Cancelaciones</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Operaciones en USD mediante efectivo, transferencias bancarias directas (Banco Pichincha, DeUna) y saldo prepago. Cancelaciones indebidas reiteradas una vez despachada la unidad podrán generar sanciones de cuenta.
                    </p>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>5. Limitación de Responsabilidad</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      AndesMovi colabora activamente con las autoridades judiciales y el ECU 911 en caso de incidentes o emergencias viales mediante telemetría satelital verificada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 11. POLÍTICA DE PRIVACIDAD (Privacy Policy LOPDP) */}
            {activeSection === 'privacidad' && (
              <div className="space-y-4 animate-fadeIn">
                <div className={`border-b pb-3 flex items-center justify-between flex-wrap gap-2 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div>
                    <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <Lock className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span>{t('privacy_policy')}</span>
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {language === 'qu' ? 'Pakalla kamachiy willaykunata waqaychina' : 'Tratamiento de Datos Personales (Ley Orgánica de Protección de Datos Personales - LOPDP Ecuador)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalDocType('privacidad');
                      setShowLegalPopup(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                      isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span>Abrir en Pantalla Completa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`p-4 rounded-2xl border text-xs space-y-4 leading-relaxed max-h-[420px] overflow-y-auto pr-2 ${
                  isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-100 border-emerald-200'
                  }`}>
                    <ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <div>
                      <span className={`font-bold text-xs block ${isDark ? 'text-white' : 'text-emerald-900'}`}>Cumplimiento LOPDP Ecuador & Stores</span>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-300' : 'text-emerald-800'}`}>
                        Tus datos personales y de ubicación están protegidos con cifrado SSL/TLS de 256 bits y no se comercializan a terceros.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. Recopilación de Información</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Recopilamos nombres completos, teléfono, correo, Cédula de Identidad de 10 dígitos (validada por algoritmo oficial de Módulo 10 del Registro Civil) y comprobantes de transferencias bancarias.
                    </p>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Geolocalización y GPS en Primer y Segundo Plano</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      El acceso a la ubicación exacta en tiempo real se utiliza para calcular distancias, rutas óptimas y conectar al conductor más cercano. En conductores se utiliza en segundo plano durante carreras activas para mantener el monitoreo continuo de seguridad del pasajero.
                    </p>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Acceso al Micrófono y Grabación SOS de Evidencia</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      El usuario consiente expresamente que al presionar el Botón de Pánico SOS durante un viaje, la app puede grabar temporalmente audio del entorno como evidencia de seguridad para transmitir a la central, al ECU 911 y a sus contactos de emergencia.
                    </p>
                  </div>

                  <div>
                    <p className={`font-black text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>4. Seguridad y Cifrado</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Almacenamiento seguro en servidores protegidos con estrictas políticas de acceso y auditoría periódica de ciberseguridad.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
                  }`}>
                    <p className="font-black text-rose-400 text-xs mb-1">5. Derechos ARCO y Eliminación de Cuenta</p>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      Tienes derecho a acceder, rectificar o eliminar tu cuenta en cualquier momento dirigiéndote a <em>Configuración &gt; Perfil &gt; Eliminar mi cuenta</em> o enviando tu solicitud a <code>privacidad@andesmovi.ec</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal Pantalla Completa de Términos y Privacidad */}
      {showLegalPopup && (
        <LegalTermsModal
          isOpen={showLegalPopup}
          initialDoc={legalDocType}
          onClose={() => setShowLegalPopup(false)}
        />
      )}

      {/* Modal Presentación de Documento de Transferencia Bancaria */}
      {showRechargeModal && (
        <WalletModal
          balance={walletBalance}
          onTopUp={onUpdateWallet}
          onAddRechargeRequest={onAddRechargeRequest}
          walletRecharges={walletRecharges}
          currentUserName={currentUser?.name}
          currentUserPhone={currentUser?.phone}
          onClose={() => setShowRechargeModal(false)}
        />
      )}

      {/* Confirmation Modal: Cerrar Sesión */}
      {showLogoutConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-logout-dialog-title"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowLogoutConfirmModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border-2 p-5 shadow-2xl space-y-4 animate-scaleUp ${
              isDark ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-inner border ${
              isDark ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              <LogOut className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 id="settings-logout-dialog-title" className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {language === 'qu' ? '¿Allillachu llukshiyta munanki?' : '¿Cerrar Sesión en AndesMovi?'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {language === 'qu'
                  ? 'Kikinpa tantanakuy puchukankami. Kutin yaykuyta ushanki.'
                  : 'Se cerrará tu sesión en este dispositivo. Podrás volver a ingresar en cualquier momento.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {language === 'qu' ? 'Manaraq' : 'Cancelar'}
              </button>
              <button
                type="button"
                id="btn-settings-confirm-logout"
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  onLogout();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'qu' ? 'Ari, Llukshina' : 'Sí, Cerrar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Warning Modal: Eliminar Cuenta Definitivamente */}
      {showDeleteAccountModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => !isDeletingAccount && setShowDeleteAccountModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border-2 border-rose-500/50 bg-zinc-950 p-5 sm:p-6 text-white shadow-2xl space-y-4 animate-scaleUp overflow-hidden relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/60">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-2">
              <h3 id="delete-account-title" className="text-lg font-black text-rose-200">
                ¿Estás seguro de que deseas eliminar tu cuenta de AndesMovi?
              </h3>
              <p className="text-xs text-rose-300 font-semibold bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl">
                Esta acción es irreversible. Se borrarán tus datos personales, historial de viajes y saldo disponible.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-2 text-zinc-300">
              <div className="font-bold text-zinc-200 text-[11px] uppercase tracking-wider">
                Consecuencias del borrado permanente:
              </div>
              <ul className="space-y-1.5 text-[11px] text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Borrado definitivo de tu Cédula y datos personales del registro.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Eliminación de saldo en billetera (${walletBalance.toFixed(2)} USD) y puntos.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Pérdida permanente del historial de carreras, facturas y calificaciones.</span>
                </li>
                {userRole === 'conductor' && (
                  <li className="flex items-center gap-2 text-amber-300">
                    <span className="text-amber-400 font-bold">✕</span>
                    <span>Baja inmediata de tu unidad vehicular del mapa y radar de despachos.</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Input de confirmación */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                {currentUser?.authProvider && ['google', 'facebook', 'icloud'].includes(currentUser.authProvider)
                  ? 'Para confirmar, escribe la palabra ELIMINAR en mayúsculas:'
                  : 'Ingresa tu contraseña actual (o escribe la palabra ELIMINAR):'}
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => {
                  setDeleteConfirmInput(e.target.value);
                  setDeleteError(null);
                }}
                placeholder="Escribe ELIMINAR para confirmar"
                className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm focus:border-rose-500 focus:outline-none"
                disabled={isDeletingAccount}
              />
              {deleteError && (
                <p className="text-xs text-rose-400 font-bold animate-fadeIn">{deleteError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteAccountModal(false)}
                className="py-3 px-4 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-account-action"
                disabled={isDeletingAccount || !deleteConfirmInput.trim()}
                onClick={handleConfirmDeleteAccount}
                className={`py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/30 cursor-pointer ${
                  isDeletingAccount || !deleteConfirmInput.trim()
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
                }`}
              >
                {isDeletingAccount ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

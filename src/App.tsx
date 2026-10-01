/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Coordinates,
  ServiceType,
  UserRole,
  TripRequest,
  Driver,
  PaymentDetails,
  CartItem,
  ParcelDetails,
  ScheduledBooking,
  AppBrand,
  ChatMessage,
  UserProfile,
  TripHistoryItem,
  SystemTariffs,
  WalletRechargeRequest,
  AdminEncomienda,
  CantonTariff,
  AdminWorker,
  DriverDocuments,
  DriverRadarOrder,
  AdminActivityEvent,
  AdminTripStatus,
  AdminActiveTrip,
  PayoutRequest,
  PaymentMethodType,
} from './types';
import { databaseService } from './services/databaseService';
import {
  DEFAULT_COORDS,
  POPULAR_LOCATIONS,
  MOCK_DRIVERS,
  FALLBACK_DRIVER,
  ECUADOR_BRANDS,
  QUICK_CHAT_MESSAGES,
  DEFAULT_USER_PROFILE,
  MOCK_TRIP_HISTORY,
  DEFAULT_SYSTEM_TARIFFS,
  DEFAULT_CANTON_TARIFFS,
  MOCK_WALLET_RECHARGES,
  MOCK_PAYOUT_REQUESTS,
  MOCK_ADMIN_ENCOMIENDAS,
  MOCK_DRIVER_DOCUMENTS,
  DEFAULT_ADMIN_WORKERS,
  DEFAULT_RADAR_ORDERS,
} from './data/mockData';
import { formatCurrency, calculateDistanceKm, estimateDurationMinutes, calculateSuggestedPrice } from './utils/geoUtils';
import { getCoordinatesForEcuadorProvince } from './data/ecuador_geography';
import { fleetSimulationService } from './services/fleetSimulationService';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { RideBooking } from './components/RideBooking';
import { ExecutiveBookingView } from './components/ExecutiveBookingView';
import { DeliveryBooking } from './components/DeliveryBooking';
import { ParcelBooking } from './components/ParcelBooking';
import { AndesMoviHomeHub } from './components/AndesMoviHomeHub';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminLoginGateModal } from './components/admin/AdminLoginGateModal';
import { AdminSidebarHub } from './components/admin/AdminSidebarHub';
import { ActiveTripTracker } from './components/ActiveTripTracker';
import { PaymentModal } from './components/PaymentModal';
import { DriverModeModal } from './components/DriverModeModal';
import { ChatModal } from './components/ChatModal';
import { CallModal, CallParticipant } from './components/CallModal';
import { WalletModal } from './components/WalletModal';
import { SOSModal } from './components/SOSModal';
import { ScheduleModal } from './components/ScheduleModal';
import { ScheduledBookingsModal } from './components/ScheduledBookingsModal';
import { RatingModal } from './components/RatingModal';
import { AuthModal } from './components/AuthModal';
import { RegistrationGateModal } from './components/RegistrationGateModal';
import { TripHistoryModal } from './components/TripHistoryModal';
import { AlliedCooperativesModal } from './components/AlliedCooperativesModal';
import { MobileSdkGuideModal } from './components/MobileSdkGuideModal';
import { FlutterAppDesignModal } from './components/FlutterAppDesignModal';
import { LoyaltyPromosModal } from './components/LoyaltyPromosModal';
import { SettingsModal, SettingsSection } from './components/SettingsModal';
import { SplashScreen } from './components/SplashScreen';
import { PushNotificationToast } from './components/PushNotificationToast';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { pushNotificationService } from './services/notificationService';
import { subscribeToSessionRevocations, verifySessionTokenMiddleware } from './services/sessionMiddleware';
import { getDeviceFingerprint } from './utils/deviceFingerprint';
import { LanguageCode, getStoredLanguage, saveStoredLanguage } from './utils/i18n';
import { haptic } from './utils/haptics';
import {
  Map as MapIcon,
  Columns,
  LayoutList,
  Radio,
  X,
  Bell,
  CheckCircle2,
  Sparkles,
  Shield,
  AlertTriangle,
  Car,
  Package,
  ShoppingBag,
  Power,
  LocateFixed,
} from 'lucide-react';
import {
  getStoredThemePreference,
  getSystemTheme,
  saveThemePreference,
  applyThemeToDOM,
  ThemePreference,
  EffectiveTheme,
} from './utils/themeManager';
import confetti from 'canvas-confetti';

export default function App() {
  // Mobile adaptive layout view mode: 'split' (50/50), 'map' (full map), 'panel' (full form/tracker)
  const [mobileView, setMobileView] = useState<'split' | 'map' | 'panel'>('split');

  // Sync map canvas size whenever view mode changes so the map never shrinks or deforms
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 80);
    return () => clearTimeout(timer);
  }, [mobileView]);

  // Gesto táctil Swipe Down (exclusivo para Modo Móvil/Android <= 768px)
  const touchStartYRef = useRef<number | null>(null);

  const handlePanelTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) return; // Desactivado en Web y Tablet (> 768px)
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handlePanelTouchEnd = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) return; // Desactivado en Web y Tablet (> 768px)
    if (touchStartYRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartYRef.current;
    touchStartYRef.current = null;

    // Si desliza deliberadamente hacia abajo más de 80px en el tirador móvil, alternar a vista 'map'
    if (deltaY > 80 && mobileView !== 'map') {
      haptic.tap();
      setMobileView('map');
    }
  };

  // Push Notification live state & notification center
  const [activePushToast, setActivePushToast] = useState<import('./types').PushNotificationItem | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(() => {
    return pushNotificationService.getStoredNotifications().filter((n) => !n.read).length;
  });

  // Subscribe to push notifications for live floating toasts and badge count
  useEffect(() => {
    const unsub = pushNotificationService.subscribe((item) => {
      setActivePushToast(item);
      setUnreadNotificationCount(
        pushNotificationService.getStoredNotifications().filter((n) => !n.read).length
      );
    });
    return unsub;
  }, []);

  // Theme Preference: Default to Light High-Contrast Daylight Mode
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const stored = getStoredThemePreference();
    return stored === 'dark' ? 'dark' : 'light';
  });
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('light');
  const [showMobileSdkGuide, setShowMobileSdkGuide] = useState<boolean>(false);

  // Brand identity state (Ecuadorian Market in USD)
  const [currentBrand, setCurrentBrand] = useState<AppBrand>(ECUADOR_BRANDS[0]);

  // Customer Profile & Authentication (Google, Facebook, iCloud, Cédula, Teléfono SMS)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_user_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.id || parsed.email || parsed.cedula || parsed.name)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Persist user session changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('andesmovi_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('andesmovi_user_session');
    }
  }, [currentUser]);

  // Handle direct hash login links
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('andesmovi.com')) {
        try {
          localStorage.removeItem('andesmovi_user_session');
        } catch {}
        setCurrentUser(null);
        setShowSplashScreen(false);
      }
    }
  }, []);

  // Limpieza preventiva de tokens/claves antiguas de servicios de mapas obsoletos
  useEffect(() => {
    try {
      localStorage.removeItem('andesmovi_aws_geo_key');
      localStorage.removeItem('mapbox_token');
      localStorage.removeItem('google_maps_key');
      localStorage.removeItem('aws_tracking_key');
    } catch {
      // Ignorar
    }
  }, []);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [registrationGateTab, setRegistrationGateTab] = useState<'register' | 'login'>('register');
  const [registrationGateRole, setRegistrationGateRole] = useState<'conductor' | 'cliente'>('cliente');
  const [isRegistrationDismissed, setIsRegistrationDismissed] = useState<boolean>(false);

  // Handlers for Mandatory Registration Gate
  const handleCompleteRegistration = (newUser: UserProfile, docs?: DriverDocuments) => {
    try {
      localStorage.setItem('andesmovi_user_session', JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(newUser);
    if (docs) {
      handleUpdateDriverDocuments(docs);
    }
    if (newUser.role === 'conductor') {
      setUserRole('conductor');
      handleUpdateWallet(0.00);
      try {
        localStorage.setItem('andesmovi_wallet_balance', '0.00');
      } catch {}
    }
    // Adapta automáticamente el mapa al conductor y al cliente según la provincia y cantón que creen cuenta
    if (newUser.province || newUser.canton) {
      const provinceCoords = getCoordinatesForEcuadorProvince(newUser.province, newUser.canton);
      setOrigin(provinceCoords);
      setDestination(null);
      fleetSimulationService.setFleetCenter(provinceCoords);
    }
    pushNotificationService.sendLocalNotification({
      title: '✅ Registro e Ingreso de Documentos Exitoso',
      body: `Bienvenido a AndesMovi, ${newUser.name}. Tus documentos (Cédula de Identidad y Licencia) han sido verificados.`,
      category: 'system',
    });
  };

  const handleLogoutUser = () => {
    try {
      localStorage.removeItem('andesmovi_user_session');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setUserRole('cliente');
    setShowSettingsModal(false);
    setShowAuthModal(false);
    setShowHistoryModal(false);
    setShowAdminPanel(false);
    setShowAdminLoginGate(false);
    setShowHomeHub(true);
    setRegistrationGateTab('login');
    // Cierre de sesión completamente silencioso: limpia credenciales y redirige a la Bienvenida de inmediato sin ningún aviso emergente
    setShowSplashScreen(true);
  };

  // Monitor de Seguridad de Sesión en Tiempo Real (Detector de Fingerprint y Cierre de Sesión Forzado)
  useEffect(() => {
    if (!currentUser?.id) return;

    const performForceLogoutForMismatch = (deviceName: string) => {
      handleLogoutUser();
      pushNotificationService.notify({
        category: 'safety',
        title: '🚨 Sesión Cerrada por Seguridad',
        body: `Tu cuenta ha sido abierta en otro dispositivo ("${deviceName}"). La sesión en este dispositivo fue cerrada automáticamente para proteger tu cuenta.`,
      });
    };

    // 1. Suscripción a eventos de revocación en tiempo real (BroadcastChannel & LocalStorage Events)
    const unsubscribe = subscribeToSessionRevocations(currentUser?.id || '', (_reason, newDeviceName) => {
      performForceLogoutForMismatch(newDeviceName);
    });

    // 2. Verificación periódica de token de sesión en segundo plano
    const checkInterval = setInterval(() => {
      const currentDevice = getDeviceFingerprint();
      const check = verifySessionTokenMiddleware(
        currentUser?.id || '',
        currentUser?.activeSessionToken,
        currentDevice.deviceId
      );

      if (!check.isValid) {
        performForceLogoutForMismatch(check.activeDeviceName || 'Nuevo Dispositivo');
      }
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, [currentUser?.id, currentUser?.activeSessionToken]);

  const handleDeleteAccount = () => {
    if (currentUser) {
      databaseService.deleteUser(currentUser.id, currentUser.cedula);
      if (userRole === 'conductor') {
        setTrackedDrivers((prev) => prev.filter((d) => d.id !== currentUser.id && d.name !== currentUser.name));
      }
      setActiveTrip(null);
    }
    try {
      localStorage.removeItem('andesmovi_user_session');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setUserRole('cliente');
    setWalletBalance(0);
    setShowSettingsModal(false);
    setShowAuthModal(false);
    setShowHistoryModal(false);
    setShowAdminPanel(false);
    setShowAdminLoginGate(false);
    setShowHomeHub(true);
    setRegistrationGateTab('login');
    setShowSplashScreen(true);
  };

  // Customer Request & Trip History
  const [tripHistory, setTripHistory] = useState<TripHistoryItem[]>(MOCK_TRIP_HISTORY);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Language & Andean Multilingual (Español, Kichwa / Quechua, English, Português)
  const [language, setLanguage] = useState<LanguageCode>(getStoredLanguage);
  const handleLanguageChange = (newLang: LanguageCode) => {
    setLanguage(newLang);
    saveStoredLanguage(newLang);
  };

  // Unified Modal Management
  const handleCloseAllModals = () => {
    setShowHistoryModal(false);
    setShowMobileSdkGuide(false);
    setShowFlutterDesignModal(false);
    setShowSettingsModal(false);
    setShowAdminPanel(false);
    setShowAdminLoginGate(false);
    setIsNotificationCenterOpen(false);
    setShowAuthModal(false);
    setShowSOSModal(false);
    setShowScheduleModal(false);
    setShowScheduledBookingsModal(false);
    setTripToRate(null);
  };

  // Unified Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<SettingsSection>('perfil');
  const handleOpenSettings = (section: SettingsSection = 'perfil') => {
    setSettingsInitialSection(section);
    setShowSettingsModal(true);
  };

  // Service mode & user role
  const [activeService, setActiveService] = useState<ServiceType>('viaje');
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) {
          return parsed.role;
        }
      }
    } catch {}
    return 'cliente';
  });
  // Driver online / active state (Activo o Fuera de servicio)
  const [isDriverActive, setIsDriverActive] = useState<boolean>(true);
  // Official AndesMovi Home Portal inspired by Volcán Cayembe
  const [showHomeHub, setShowHomeHub] = useState<boolean>(true);
  // Initial Welcome Animation & Splash Screen:
  // Siempre mostrar la pantalla de bienvenida al cargar la aplicación por primera vez en la sesión
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);

  // Verificación adicional al montar el componente para asegurar el estado inicial correcto
  useEffect(() => {
    try {
      // Forzar visualización de la bienvenida al inicio
      setShowSplashScreen(true);
      setShowHomeHub(true);
    } catch (e) {
      console.warn('Error configurando estado inicial', e);
    }
  }, []);

  // Coordinates (Punto A en tiempo real GPS del usuario)
  const [origin, setOrigin] = useState<Coordinates>(() => {
    try {
      const savedGps = localStorage.getItem('andesmovi_last_gps_coords');
      if (savedGps) {
        const parsed = JSON.parse(savedGps);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          // Si estaba guardado por error en Julio Andrade pero el usuario es de Tulcán, usar Tulcán Centro
          if (parsed.name?.toLowerCase().includes('julio andrade') || (parsed.lat >= 0.70 && parsed.lat <= 0.77 && parsed.lng <= -77.65 && parsed.lng >= -77.78)) {
            return DEFAULT_COORDS;
          }
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_COORDS;
  });
  const hasInitializedGpsRef = useRef<boolean>(false);

  // Solicitud inmediata y robusta de GPS al iniciar la app (con fallback automático para móvil)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation || hasInitializedGpsRef.current) return;

    const processPosition = async (pos: GeolocationPosition) => {
      hasInitializedGpsRef.current = true;
      let latActual = pos.coords.latitude;
      let lngActual = pos.coords.longitude;
      let streetName = 'Mi ubicación actual';
      let fullAddress = 'Mi ubicación GPS, Ecuador';

      // DETECCIÓN Y CORRECCIÓN AUTOMÁTICA DE ANTENA CELULAR EN JULIO ANDRADE (CARCHI)
      // En Carchi, las antenas y servidores móviles (Claro, CNT, Movistar) suelen reportar la torre de Julio Andrade
      // cuando el usuario en realidad está en Tulcán. Si detectamos esa zona o el nombre, reajustamos a Tulcán Centro.
      const isCellTowerJulioAndrade =
        latActual >= 0.70 && latActual <= 0.77 && lngActual <= -77.65 && lngActual >= -77.78;

      if (isCellTowerJulioAndrade) {
        latActual = DEFAULT_COORDS.lat;
        lngActual = DEFAULT_COORDS.lng;
        streetName = DEFAULT_COORDS.name;
        fullAddress = DEFAULT_COORDS.address;
      }

      try {
        if (!isCellTowerJulioAndrade) {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latActual}&lon=${lngActual}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          );
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.address) {
              const displayNameLower = (nomData.display_name || '').toLowerCase();
              if (displayNameLower.includes('julio andrade')) {
                // Redirigir a Tulcán Centro
                latActual = DEFAULT_COORDS.lat;
                lngActual = DEFAULT_COORDS.lng;
                streetName = DEFAULT_COORDS.name;
                fullAddress = DEFAULT_COORDS.address;
              } else {
                const road = nomData.address.road || nomData.address.pedestrian || nomData.address.suburb || nomData.address.neighbourhood;
                let city = nomData.address.city || nomData.address.town || nomData.address.village || nomData.address.county || 'Ecuador';
                if (latActual >= 0.78 && latActual <= 0.85 && lngActual >= -77.75 && lngActual <= -77.66) {
                  city = 'Tulcán';
                }
                if (road) {
                  streetName = `${road}, ${city}`;
                } else if (nomData.display_name) {
                  streetName = nomData.display_name.split(',')[0];
                }
                fullAddress = nomData.display_name || `${streetName}, ${city}`;
              }
            }
          }
        }
      } catch {
        try {
          if (!isCellTowerJulioAndrade) {
            const revRes = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lngActual},${latActual}?number=1`);
            if (revRes.ok) {
              const data = await revRes.json();
              if (data.waypoints && data.waypoints[0] && data.waypoints[0].name) {
                streetName = data.waypoints[0].name.trim();
                fullAddress = `${streetName}, Ecuador`;
              }
            }
          }
        } catch {}
      }

      const userCoords: Coordinates = {
        lat: latActual,
        lng: lngActual,
        name: streetName,
        address: fullAddress,
      };

      setOrigin(userCoords);
      fleetSimulationService.setFleetCenter(userCoords);
      try {
        localStorage.setItem('andesmovi_last_gps_coords', JSON.stringify(userCoords));
      } catch {}
    };

    // Intento 1: Alta precisión
    navigator.geolocation.getCurrentPosition(
      (pos) => processPosition(pos),
      (errHigh) => {
        console.warn('GPS alta precisión demoró o falló, intentando geolocalización estándar:', errHigh.message);
        // Intento 2: Red móvil / Wi-Fi / IP inmediata sin bloqueo satelital
        navigator.geolocation.getCurrentPosition(
          (pos) => processPosition(pos),
          (errLow) => {
            console.warn('Geolocalización estándar falló:', errLow.message);
            if (currentUser?.province || currentUser?.canton) {
              const provinceCoords = getCoordinatesForEcuadorProvince(currentUser.province, currentUser.canton);
              setOrigin(provinceCoords);
              fleetSimulationService.setFleetCenter(provinceCoords);
            }
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
    );
  }, [currentUser?.province, currentUser?.canton]);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [intermediateStops, setIntermediateStops] = useState<Coordinates[]>([]);
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | 'stop' | null>(null);

  // 🎯 Estado Global Único (Single Source of Truth para Tarifa, Oferta e Info de Ruta OSRM)
  const [tarifaCalculada, setTarifaCalculada] = useState<number>(1.25);
  const [ofertaUsuario, setOfertaUsuario] = useState<number>(1.25);
  const [esPrecioFijo, setEsPrecioFijo] = useState<boolean>(false);
  const [infoRuta, setInfoRuta] = useState<{ km: number | string; min: number; origen: string; destino: string }>({
    km: 0,
    min: 0,
    origen: '',
    destino: '',
  });

  const handleRouteCalculated = (
    fare: number,
    distanceKm: number,
    durationMin: number,
    originName?: string,
    destName?: string
  ) => {
    const km = Number(distanceKm.toFixed(1));
    const destLower = (destName || destination?.name || destination?.address || '').toLowerCase();
    
    // Detección de Turno Ejecutivo a Quito y tarifas fijas
    const isExecQuito = activeService === 'ejecutivo_quito' || destLower.includes('quito') || destLower.includes('carolina') || destLower.includes('quitumbe') || destLower.includes('tababela') || destLower.includes('aeropuerto');
    
    let finalFare = fare;
    let isFixed = false;

    if (isExecQuito) {
      isFixed = true;
      if (destLower.includes('quitumbe') || destLower.includes('tababela') || destLower.includes('aeropuerto')) {
        finalFare = 30.00;
      } else {
        finalFare = 25.00; // La Carolina y Quito Norte
      }
    } else if (activeService === 'viaje') {
      const date = new Date();
      const hourDecimal = date.getHours() + (date.getMinutes() / 60);
      const isDay = hourDecimal >= 6.0167 && hourDecimal < 19.0;
      if (isDay) {
        if (distanceKm <= 2.7) {
          finalFare = 1.25;
        } else {
          finalFare = 1.25 + ((distanceKm - 2.7) * 0.34) + (durationMin * 0.07);
        }
        finalFare = Math.max(1.25, Number(finalFare.toFixed(2)));
      } else {
        if (distanceKm <= 2.7) {
          finalFare = 1.50;
        } else {
          finalFare = 1.50 + ((distanceKm - 2.7) * 0.44) + (durationMin * 0.08);
        }
        finalFare = Math.max(1.50, Number(finalFare.toFixed(2)));
      }
    } else if (activeService === 'domicilio') {
      if (distanceKm <= 2.7) {
        finalFare = 1.25;
      } else {
        finalFare = 1.25 + ((distanceKm - 2.7) * 0.35) + (durationMin * 0.04);
      }
      finalFare = Math.max(1.25, Number(finalFare.toFixed(2)));
    }

    setEsPrecioFijo(isFixed);
    setInfoRuta({
      km,
      min: durationMin,
      origen: originName || origin.name || origin.address || 'Origen',
      destino: destName || destination?.name || destination?.address || 'Destino',
    });
    setTarifaCalculada(finalFare);
    setOfertaUsuario(finalFare);
  };

  const handleUserOfferChange = (newOffer: number) => {
    if (esPrecioFijo) return; // Bloqueado para precio fijo
    setOfertaUsuario(newOffer);
  };

  // Adapta automáticamente el mapa al centro de flota sin sobreescribir la posición GPS física
  useEffect(() => {
    if (currentUser?.province || currentUser?.canton) {
      const provinceCoords = getCoordinatesForEcuadorProvince(currentUser.province, currentUser.canton);
      if (!hasInitializedGpsRef.current) {
        setOrigin(provinceCoords);
      }
      fleetSimulationService.setFleetCenter(provinceCoords);
    }
  }, [currentUser?.province, currentUser?.canton, userRole]);

  // Active Trip / Order state
  const [activeTrip, setActiveTrip] = useState<TripRequest | null>(null);
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);
  const [isSearchingRides, setIsSearchingRides] = useState<boolean>(false);

  // Scheduled Bookings state
  const [scheduledBookings, setScheduledBookings] = useState<ScheduledBooking[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduleContext, setScheduleContext] = useState<{
    serviceType: ServiceType;
    origin: Coordinates;
    destination: Coordinates | null;
    basePrice: number;
    notes?: string;
    deliveryItems?: CartItem[];
    restaurantName?: string;
    parcelDetails?: ParcelDetails;
  } | null>(null);
  const [showScheduledBookingsModal, setShowScheduledBookingsModal] = useState<boolean>(false);
  const [showAlliedCooperativesModal, setShowAlliedCooperativesModal] = useState<boolean>(false);

  // Real-time Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Payment flow
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    amount: number;
    title: string;
    onSuccess: (details: PaymentDetails) => void;
  } | null>(null);

  // Digital Wallet in USD (Sincronizada con localStorage para persistencia instantánea)
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_wallet_balance');
      if (saved !== null && !isNaN(Number(saved))) {
        return Number(saved);
      }
      return 0.00;
    } catch {
      return 0.00;
    }
  });

  const handleUpdateWallet = (newBal: number | ((prev: number) => number)) => {
    setWalletBalance((prev) => {
      const val = typeof newBal === 'function' ? newBal(prev) : newBal;
      const rounded = Number(Math.max(0, val).toFixed(2));
      try {
        localStorage.setItem('andesmovi_wallet_balance', String(rounded));
      } catch (e) {
        console.warn('Error saving wallet balance to localStorage', e);
      }
      return rounded;
    });
  };

  // Ajuste y acreditación inmediata de saldo por administración
  const handleAdjustDriverWallet = (delta: number, note: string) => {
    setWalletBalance((prev) => {
      const newBal = Number(Math.max(0, prev + delta).toFixed(2));
      try {
        localStorage.setItem('andesmovi_wallet_balance', String(newBal));

        // Registrar en historial de transacciones de billetera digital
        const existingTxStr = localStorage.getItem('andesmovi_wallet_transactions');
        const existingTx = existingTxStr ? JSON.parse(existingTxStr) : [];
        const newTx = {
          id: `tx-${Date.now()}`,
          type: delta >= 0 ? 'recarga' : 'comision',
          amount: Math.abs(delta),
          description: note || 'Acreditación aprobada por administración',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
          balanceAfter: newBal,
          status: 'completada',
        };
        localStorage.setItem('andesmovi_wallet_transactions', JSON.stringify([newTx, ...existingTx]));
      } catch (e) {
        console.warn('Error saving wallet balance to localStorage', e);
      }

      // Enviar notificación push inmediata de saldo acreditado
      if (delta > 0) {
        pushNotificationService.notifyWalletRecharge({
          amount: delta,
          newBalance: newBal,
          adminName: currentAdminUser?.fullName || 'Jhon Sebastian Yepez Clavijo',
          reference: note,
        });

        // Track accumulated recharge amount for the driver's bonus program
        if (currentUser && currentUser.role === 'conductor') {
          const currentAccum = currentUser.accumulatedRechargeAmount || 0;
          const newAccum = currentAccum + delta;
          
          const prevBonuses = Math.min(3, Math.floor(currentAccum / 50));
          const newBonuses = Math.min(3, Math.floor(newAccum / 50));
          
          if (newBonuses > prevBonuses) {
            // Notificar al conductor que completó los $50 y tiene listo su bono de $10 USD para canjear por botón
            setTimeout(() => {
              pushNotificationService.playChime('trip');
              pushNotificationService.sendLocalNotification({
                title: '🎁 ¡Bono de $10 USD Listo para Canjear!',
                body: `¡Felicidades! Acumulaste $50.00 USD en recargas. Entra a tu billetera prepago y aplasta el botón CANJEAR para acreditar tus $10.00 USD automáticamente.`,
              });
            }, 500);
          }

          const updatedUser = {
            ...currentUser,
            accumulatedRechargeAmount: newAccum,
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('andesmovi_current_user', JSON.stringify(updatedUser));
        }
      }

      return newBal;
    });
  };

  // Canje manual por botón del bono de recarga ($50 acumulados = $10 USD acreditados automáticamente)
  const handleRedeemRechargeBonus = () => {
    if (!currentUser || currentUser.role !== 'conductor') {
      alert('Esta promoción es exclusiva para conductores de AndesMovi.');
      return;
    }
    const currentAccum = currentUser.accumulatedRechargeAmount || 0;
    const earnedBonuses = Math.min(3, Math.floor(currentAccum / 50));
    const claimedBonuses = currentUser.claimedRechargeBonuses || 0;

    if (claimedBonuses >= 3) {
      haptic.warning();
      alert('🏆 Has alcanzado el límite máximo de 3 bonos de recarga canjeados ($30.00 USD en total). ¡Gracias por tu compromiso con AndesMovi!');
      return;
    }

    if (earnedBonuses <= claimedBonuses) {
      haptic.warning();
      const currentInCycle = currentAccum % 50;
      const needed = 50 - currentInCycle;
      alert(`⚠️ Aún no completas los $50.00 USD en recargas para desbloquear tu siguiente bono de $10 USD.\n\nLlevas acumulado en este ciclo: $${currentInCycle.toFixed(2)} USD\nTe faltan: $${needed.toFixed(2)} USD en recargas para aplastar el botón y canjear tus $10 USD.`);
      return;
    }

    const newClaimed = claimedBonuses + 1;
    const bonusAmount = 10.00;

    // Acreditar automáticamente los $10 a la billetera digital
    handleAdjustDriverWallet(
      bonusAmount,
      `🎁 BONO CANJEADO: $50 en recargas completados (+ $10.00 USD) (Bono ${newClaimed}/3)`
    );

    const updatedUser = {
      ...currentUser,
      claimedRechargeBonuses: newClaimed,
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('andesmovi_current_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error(e);
    }

    haptic.success();
    pushNotificationService.playChime('trip');
    pushNotificationService.sendLocalNotification({
      title: '🎁 ¡Bono Canjeado Exitosamente!',
      body: `¡Se han acreditado $10.00 USD a tu saldo prepago automáticamente! (Bono ${newClaimed} de 3 canjeados).`,
    });
    alert(`🎉 ¡BONO CANJEADO CON ÉXITO!\n\nHas completado los $50.00 USD en recargas y se han acreditado $10.00 USD automáticamente a tu billetera prepago.\n\nBonos canjeados: ${newClaimed} de 3 máximo.`);
  };

  // Shared Radar Orders pool for drivers (Viajes, Domicilios y Encomiendas)
  const [driverRadarOrders, setDriverRadarOrders] = useState<DriverRadarOrder[]>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_radar_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar órdenes mock anteriores
          return parsed.filter((o) => o && !String(o.id).startsWith('radar-'));
        }
      }
      return DEFAULT_RADAR_ORDERS;
    } catch {
      return DEFAULT_RADAR_ORDERS;
    }
  });

  const handleUpdateRadarOrders = (orders: DriverRadarOrder[]) => {
    setDriverRadarOrders(orders);
    try {
      localStorage.setItem('andesmovi_radar_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Error saving radar orders', e);
    }
  };

  // Global Realtime Broadcast Alert Banner (Notificación a todos los conductores)
  const [broadcastAlertNotice, setBroadcastAlertNotice] = useState<{
    title: string;
    message: string;
    serviceType: ServiceType;
    price: number;
    driversCount: number;
  } | null>(null);

  // Modals & Real-time Communication
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [showVoIPCallModal, setShowVoIPCallModal] = useState<boolean>(false);
  const [voIPCallParticipant, setVoIPCallParticipant] = useState<CallParticipant | null>(null);
  const [isVoIPCallIncoming, setIsVoIPCallIncoming] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showSOSModal, setShowSOSModal] = useState<boolean>(false);
  const [showFlutterDesignModal, setShowFlutterDesignModal] = useState<boolean>(false);
  const [showLoyaltyPromosModal, setShowLoyaltyPromosModal] = useState<boolean>(false);
  const [showExecutiveAdvanceModal, setShowExecutiveAdvanceModal] = useState<boolean>(false);
  const [tripToRate, setTripToRate] = useState<TripRequest | null>(null);

  // Master Administrative Panel States (Tarifas, Recargas, División Encomiendas, Cantones, Telemetría)
  const [systemTariffs, setSystemTariffs] = useState<SystemTariffs>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_system_tariffs');
      return saved ? JSON.parse(saved) : DEFAULT_SYSTEM_TARIFFS;
    } catch {
      return DEFAULT_SYSTEM_TARIFFS;
    }
  });
  const [cantonTariffs, setCantonTariffs] = useState<CantonTariff[]>(DEFAULT_CANTON_TARIFFS);
  const [trackedDrivers, setTrackedDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_tracked_drivers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return MOCK_DRIVERS;
    } catch {
      return MOCK_DRIVERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('andesmovi_tracked_drivers', JSON.stringify(trackedDrivers));
    } catch (e) {
      console.warn('Error saving tracked drivers', e);
    }
  }, [trackedDrivers]);
  const [walletRecharges, setWalletRecharges] = useState<WalletRechargeRequest[]>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_wallet_recharges');
      return saved ? JSON.parse(saved) : MOCK_WALLET_RECHARGES;
    } catch {
      return MOCK_WALLET_RECHARGES;
    }
  });

  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_payout_requests');
      return saved ? JSON.parse(saved) : MOCK_PAYOUT_REQUESTS;
    } catch {
      return MOCK_PAYOUT_REQUESTS;
    }
  });

  const handleUpdatePayoutRequests = (updated: PayoutRequest[]) => {
    setPayoutRequests(updated);
    try {
      localStorage.setItem('andesmovi_payout_requests', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving payout requests', e);
    }
  };

  // Real-time Activities of Clients and Drivers for Admin Monitor
  const [adminActivityEvents, setAdminActivityEvents] = useState<AdminActivityEvent[]>(() => [
    {
      id: 'act-init-1',
      type: 'trip_completed',
      actorName: 'Carlos Alberto Mendoza',
      actorRole: 'conductor',
      title: 'Viaje Completado con Éxito',
      description: 'Carrera finalizada de Av. Amazonas a Tababela. Cobro $22.50 USD. Comisión 7%: $1.58 USD.',
      amount: 22.5,
      serviceType: 'viaje',
      timestamp: Date.now() - 25 * 60 * 1000,
      formattedTime: 'Hace 25 min',
      details: { origin: 'Av. Amazonas, Quito', destination: 'Aeropuerto Tababela', plate: 'PBA-8321' },
    },
    {
      id: 'act-init-2',
      type: 'recharge_approved',
      actorName: 'Jhon Sebastian Yepez (Admin)',
      actorRole: 'admin',
      title: 'Recarga de Saldo Prepago Aprobada',
      description: 'Aprobación de depósito Banco Pichincha $50.00 USD para el chofer Nelson Gualli.',
      amount: 50.0,
      timestamp: Date.now() - 40 * 60 * 1000,
      formattedTime: 'Hace 40 min',
    },
    {
      id: 'act-init-3',
      type: 'client_request',
      actorName: 'María Fernanda Cárdenas',
      actorRole: 'cliente',
      title: 'Nueva Carrera Solicitada',
      description: 'Cliente solicitó auto en Plaza Foch con oferta de $3.50 USD.',
      amount: 3.5,
      serviceType: 'viaje',
      timestamp: Date.now() - 60 * 60 * 1000,
      formattedTime: 'Hace 1 hora',
      details: { origin: 'Plaza Foch', destination: 'González Suárez' },
    },
  ]);

  const logAdminActivity = (
    event: Omit<AdminActivityEvent, 'id' | 'timestamp' | 'formattedTime'> & { customTime?: string }
  ) => {
    const newEvent: AdminActivityEvent = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: event.type,
      actorName: event.actorName,
      actorRole: event.actorRole,
      title: event.title,
      description: event.description,
      amount: event.amount,
      serviceType: event.serviceType,
      timestamp: Date.now(),
      formattedTime: event.customTime || 'Ahora mismo',
      details: event.details,
    };
    setAdminActivityEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
  };

  const handleAddRechargeRequest = (newRequest: WalletRechargeRequest) => {
    setWalletRecharges((prev) => {
      const updated = [newRequest, ...prev];
      try {
        localStorage.setItem('andesmovi_wallet_recharges', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving recharge request', e);
      }
      return updated;
    });

    logAdminActivity({
      type: 'recharge_request',
      actorName: currentUser?.name || 'Conductor AndesMovi',
      actorRole: 'conductor',
      title: 'Comprobante de Recarga Enviado',
      description: `Comprobante de depósito de $${newRequest.amountUsd.toFixed(2)} USD presentado en ${newRequest.bankName || 'Banco Pichincha'}.`,
      amount: newRequest.amountUsd,
    });
  };

  const handleAddNewPayoutRequest = (newRequest: PayoutRequest) => {
    setPayoutRequests((prev) => {
      const updated = [newRequest, ...prev];
      try {
        localStorage.setItem('andesmovi_payout_requests', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving payout request', e);
      }
      return updated;
    });

    logAdminActivity({
      type: 'recharge_request',
      actorName: currentUser?.name || 'Conductor AndesMovi',
      actorRole: 'conductor',
      title: 'Solicitud de Retiro de Saldo Excedente',
      description: `El conductor solicita liquidación de $${newRequest.amountUsd.toFixed(2)} USD, dejando un fondo de $10.00 USD. Destino: ${newRequest.bankName}.`,
      amount: newRequest.amountUsd,
    });
  };

  const handleUpdateRecharges = (updated: WalletRechargeRequest[]) => {
    setWalletRecharges(updated);
    try {
      localStorage.setItem('andesmovi_wallet_recharges', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving recharges', e);
    }

    logAdminActivity({
      type: 'recharge_approved',
      actorName: currentAdminUser?.fullName || 'Super Administrador',
      actorRole: 'admin',
      title: 'Recargas y Saldo de Billetera Actualizado',
      description: 'El administrador procesó las transferencias y actualizó el saldo prepago.',
    });
  };

  // Handler for registering new drivers (from AuthModal or DriverModeModal)
  const handleRegisterNewDriver = (driverData: {
    name: string;
    cedula: string;
    phone?: string;
    province?: string;
    vehicleType?: 'auto' | 'moto' | 'confort' | 'camioneta' | 'mini';
    vehicleModel?: string;
    plate?: string;
    authProvider?: string;
  }) => {
    const driverCoords = driverData.province
      ? getCoordinatesForEcuadorProvince(driverData.province)
      : origin;

    const newDriver: Driver = {
      id: `drv-new-${Date.now()}`,
      name: driverData.name,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      totalTrips: 0,
      vehicle: {
        type: driverData.vehicleType || 'auto',
        model: driverData.vehicleModel || 'Vehículo Por Definir',
        plate: driverData.plate || 'EN TRÁMITE',
        color: 'Plata Metálico',
        year: 2024,
      },
      currentCoords: {
        lat: driverCoords.lat + (Math.random() - 0.5) * 0.006,
        lng: driverCoords.lng + (Math.random() - 0.5) * 0.006,
      },
      etaMinutes: 4,
      phone: driverData.phone || '+593 99 000 0000',
      cedula: driverData.cedula,
      isPendingApproval: true,
      isApproved: false,
      registeredAt: Date.now(),
      province: driverData.province || 'Pichincha',
    };

    setTrackedDrivers((prev) => [newDriver, ...prev]);
    handleUpdateWallet(0.00);
    try {
      localStorage.setItem('andesmovi_wallet_balance', '0.00');
    } catch {}

    // Adapta automáticamente el mapa al nuevo conductor registrado en su provincia y cantón
    if (driverData.province) {
      setOrigin(driverCoords);
      setDestination(null);
      fleetSimulationService.setFleetCenter(driverCoords);
    }

    // Push notification to Admin
    pushNotificationService.notifyNewDriverRegistered({
      driverName: driverData.name,
      cedula: driverData.cedula,
      phone: driverData.phone,
      vehicleModel: driverData.vehicleModel,
      plate: driverData.plate,
      province: driverData.province,
      authProvider: driverData.authProvider,
    });

    // Log Activity for Admin Feed
    logAdminActivity({
      type: 'new_driver_registered',
      actorName: driverData.name,
      actorRole: 'conductor',
      title: '🚖 ¡NUEVO CONDUCTOR REGISTRADO!',
      description: `${driverData.name} (C.I. ${driverData.cedula}) creó una cuenta de conductor en ${driverData.province || 'Ecuador'}. Vehículo: ${driverData.vehicleModel || 'En trámite'} [Placa: ${driverData.plate || 'En trámite'}]. Requiere revisión y activación en el Panel de Administrador.`,
      serviceType: 'viaje',
      details: {
        plate: driverData.plate,
        cedula: driverData.cedula,
        province: driverData.province,
      },
    });

    // Broadcast toast notice
    setBroadcastAlertNotice({
      title: '🚖 ¡NUEVO CONDUCTOR REGISTRADO!',
      message: `${driverData.name} (C.I. ${driverData.cedula}) ha creado su cuenta de conductor. Disponible para revisión en el Panel de Administrador.`,
      serviceType: 'viaje',
      price: 0,
      driversCount: trackedDrivers.length + 1,
    });
    setTimeout(() => setBroadcastAlertNotice(null), 6500);
  };

  // Handler for Admin approving new driver
  const handleApproveDriverRegistration = (driverId: string) => {
    setTrackedDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, isPendingApproval: false, isApproved: true } : d))
    );
    const approvedDrv = trackedDrivers.find((d) => d && d.id === driverId);
    logAdminActivity({
      type: 'system_alert',
      actorName: currentAdminUser?.fullName || 'Super Administrador',
      actorRole: 'admin',
      title: 'Conductor Habilitado para Operar',
      description: `El administrador aprobó y activó la unidad de ${approvedDrv?.name || 'Conductor'} para recibir carreras y encomiendas en AndesMovi.`,
    });
  };
  const [adminEncomiendas, setAdminEncomiendas] = useState<AdminEncomienda[]>(MOCK_ADMIN_ENCOMIENDAS);
  const [driverDocuments, setDriverDocuments] = useState<DriverDocuments>(() => {
    try {
      const saved = localStorage.getItem('andesmovi_driver_docs');
      return saved ? JSON.parse(saved) : MOCK_DRIVER_DOCUMENTS;
    } catch {
      return MOCK_DRIVER_DOCUMENTS;
    }
  });

  const handleUpdateDriverDocuments = (updatedDocs: DriverDocuments) => {
    setDriverDocuments(updatedDocs);
    try {
      localStorage.setItem('andesmovi_driver_docs', JSON.stringify(updatedDocs));
    } catch (e) {
      console.error(e);
    }
  };
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<string>('dashboard');

  // Administrative Access & Staff Management (Requiere autenticación secreta de Dueño/Admin)
  const [adminWorkers, setAdminWorkers] = useState<AdminWorker[]>(DEFAULT_ADMIN_WORKERS);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminWorker | null>(null);
  const [showAdminLoginGate, setShowAdminLoginGate] = useState<boolean>(false);

  // Broadcast Alert System-wide (Banner Nacional de Comunicación en Toda la App)
  const [systemBroadcastAlert, setSystemBroadcastAlert] = useState<{
    id: string;
    active: boolean;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'emergency';
    author: string;
  } | null>(null);

  // Active SOS Alerts monitored by Admin
  const [activeSosAlerts, setActiveSosAlerts] = useState<Array<{
    id: string;
    userName: string;
    userPhone: string;
    userRole: string;
    coords: { lat: number; lng: number };
    timestamp: number;
    resolved: boolean;
  }>>([]);

  const handleAdminUpdateTripStatus = (tripId: string, status: AdminTripStatus) => {
    databaseService.updateTripStatus(tripId, status);
    if (activeTrip && (activeTrip.id === tripId || (activeTrip as any).tripCode === tripId)) {
      if (status === 'cancelado') {
        setActiveTrip(null);
        setIsSearchingRides(false);
        pushNotificationService.sendLocalNotification({
          title: 'Carrera Cancelada por el Administrador',
          body: `La carrera #${tripId} fue cancelada administrativamente desde la central AndesMovi.`,
          category: 'safety',
        });
      } else if (status === 'finalizado') {
        setActiveTrip((prev) => (prev ? { ...prev, status: 'completed' } : null));
        setTripToRate(activeTrip);
      }
    }
    if (status === 'cancelado' || status === 'finalizado') {
      setDriverRadarOrders((prev) => prev.filter((o) => o && o.id !== tripId));
    }
    logAdminActivity({
      type: status === 'cancelado' ? 'system_alert' : 'trip_completed',
      title: `Carrera #${tripId} ${status === 'cancelado' ? 'cancelada' : 'finalizada'} por Administrador`,
      description: `El Administrador central (${currentAdminUser?.fullName || 'Super Admin'}) cambió el estado a ${status.toUpperCase()}.`,
      actorName: currentAdminUser?.fullName || 'Super Administrador',
      actorRole: 'admin',
    });
  };

  const handleAdminDispatchManualTrip = (tripData: Partial<AdminActiveTrip>) => {
    const newTrip: AdminActiveTrip = {
      id: tripData.id || `TRP-M-${Date.now().toString().slice(-4)}`,
      tripCode: tripData.tripCode || `VIAJE-M-${Date.now().toString().slice(-4)}`,
      serviceType: tripData.serviceType || 'viaje',
      passengerName: tripData.passengerName || 'Cliente Central',
      passengerPhone: tripData.passengerPhone || '+593 99 123 4567',
      originAddress: tripData.originAddress || 'Terminal Terrestre Tulcán',
      destinationAddress: tripData.destinationAddress || 'Parque Central Tulcán',
      distanceKm: tripData.distanceKm || 2.5,
      durationMinutes: tripData.durationMinutes || 7,
      status: 'pendiente',
      paymentMethod: tripData.paymentMethod || 'efectivo',
      paymentStatus: 'pendiente',
      cooperativaName: tripData.cooperativaName || 'Cooperativa Rápido Nacional',
      terminalName: tripData.terminalName || 'Terminal Terrestre Tulcán',
      fareBreakdown: tripData.fareBreakdown || {
        baseFareUsd: 1.25,
        coveredKm: 2.7,
        extraKm: 0,
        extraKmRateUsd: 0.35,
        totalFareUsd: 1.50,
      },
      createdAt: Date.now(),
      createdFormatted: 'Ahora',
    };

    databaseService.addOrUpdateTrip(newTrip);

    // Add to radar orders for all drivers
    const radarOrder: DriverRadarOrder = {
      id: newTrip?.id || `trip-${Date.now()}`,
      serviceType: newTrip.serviceType || 'viaje',
      clientName: newTrip.passengerName,
      clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      clientRating: 5.0,
      clientTrips: 1,
      clientPhone: newTrip.passengerPhone,
      origin: newTrip.originAddress,
      destination: newTrip.destinationAddress,
      distanceKm: newTrip.distanceKm,
      durationMin: newTrip.durationMinutes,
      distanceFromDriverKm: 0.8,
      etaPickupMin: 3,
      passengerOffer: newTrip.fareBreakdown.totalFareUsd,
      suggestedFair: newTrip.fareBreakdown.totalFareUsd,
      paymentMethodName: 'Efectivo',
      paymentMethodType: 'efectivo',
      pickupPin: '1234',
      deliveryPin: '5678',
      vehicleCompatibility: 'both',
      isRealtimeClientOrder: true,
      createdAt: Date.now(),
    };

    setDriverRadarOrders((prev) => [radarOrder, ...prev]);

    logAdminActivity({
      type: 'client_request',
      title: `Carrera manual despachada (${newTrip.tripCode})`,
      description: `Administrador despachó carrera de ${newTrip.originAddress} a ${newTrip.destinationAddress} por $${newTrip.fareBreakdown.totalFareUsd}.`,
      amount: newTrip.fareBreakdown.totalFareUsd,
      actorName: currentAdminUser?.fullName || 'Super Administrador',
      actorRole: 'admin',
    });

    pushNotificationService.sendLocalNotification({
      title: 'Nueva Carrera Despachada desde Central',
      body: `Origen: ${newTrip.originAddress} - Destino: ${newTrip.destinationAddress} ($${newTrip.fareBreakdown.totalFareUsd})`,
      category: 'driver_broadcast',
    });
  };

  const handleToggleSuspendDriver = (driverId: string) => {
    setTrackedDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const isSusp = !d.isSuspended;
          logAdminActivity({
            type: 'system_alert',
            title: `Conductor ${d.name} ${isSusp ? 'SUSPENDIDO' : 'REACTIVADO'}`,
            description: `El Administrador modificó el estado operativo del conductor.`,
            actorName: currentAdminUser?.fullName || 'Super Administrador',
            actorRole: 'admin',
          });
          return { ...d, isSuspended: isSusp };
        }
        return d;
      })
    );
  };

  const handleResolveSosAlert = (alertId: string) => {
    setActiveSosAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
    logAdminActivity({
      type: 'system_alert',
      title: 'Alerta SOS resuelta por Administrador',
      description: `La emergencia fue atendida y marcada como resuelta por la central.`,
      actorName: currentAdminUser?.fullName || 'Super Administrador',
      actorRole: 'admin',
    });
  };

  const handleTriggerAdminSos = (
    coords: Coordinates,
    tripInfo?: { tripId?: string; driverName?: string; driverPlate?: string; clientName?: string }
  ) => {
    const tripId = tripInfo?.tripId || activeTrip?.id || 'CAR-001';
    const clientName = tripInfo?.clientName || currentUser?.name || 'Cliente Pasajero';
    const driverPlate = tripInfo?.driverPlate || activeTrip?.selectedDriver?.vehicle?.plate || 'PBA-3421';
    const driverName = tripInfo?.driverName || activeTrip?.selectedDriver?.name || 'Chofer Asignado';

    const newSos = {
      id: `sos-${Date.now()}`,
      userName: clientName,
      userPhone: currentUser?.phone || '+593 99 000 0000',
      userRole: userRole,
      tripId: tripId,
      driverName: driverName,
      driverPlate: driverPlate,
      coords: { lat: coords.lat, lng: coords.lng },
      timestamp: Date.now(),
      resolved: false,
    };
    setActiveSosAlerts((prev) => [newSos, ...prev]);
    logAdminActivity({
      type: 'system_alert',
      title: `🚨 ALERTA SOS ACTIVADA - Carrera #${tripId} - Cliente: ${clientName} - Unidad: ${driverPlate}`,
      description: `Emergencia en vivo reportada. Chofer: ${driverName}. Coordenadas: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}.`,
      actorName: clientName,
      actorRole: 'sistema',
    });
    pushNotificationService.playChime('trip');
    pushNotificationService.sendLocalNotification({
      title: `🚨 ALERTA SOS ACTIVADA - Carrera #${tripId}`,
      body: `Cliente: ${clientName} - Unidad: ${driverPlate}. ¡Atención de emergencia requerida!`,
      category: 'safety',
    });
  };

  const handleOpenAdminPanel = (initialTab?: string) => {
    if (initialTab) setAdminInitialTab(initialTab);
    const isOwnerOrWorker = currentAdminUser && currentAdminUser.isActive;
    
    if (!isOwnerOrWorker) {
      setShowAdminLoginGate(true);
      return;
    }

    setUserRole('admin');
    setShowAdminPanel(true);
  };

  const handleAdminLoginSuccess = (worker: AdminWorker) => {
    setCurrentAdminUser(worker);
    setUserRole('admin');
    setShowAdminLoginGate(false);
    setShowAdminPanel(true);
    setShowSplashScreen(false);
  };

  const handleAdminLogout = () => {
    setCurrentAdminUser(null);
    setUserRole('cliente');
    setShowAdminPanel(false);
    setShowAdminLoginGate(false);
    setShowSplashScreen(true);
  };

  const handleSelectRole = (newRole: UserRole) => {
    if (newRole === 'admin') {
      if (currentAdminUser && currentAdminUser.isActive) {
        setUserRole('admin');
        setShowAdminPanel(true);
      } else {
        setShowAdminLoginGate(true);
      }
    } else if (newRole === 'conductor') {
      setUserRole('conductor');
      setShowHomeHub(false);
      setShowAdminPanel(false);
      if (currentUser && currentUser.role !== 'conductor') {
        setCurrentUser({ ...currentUser, role: 'conductor' });
      }
      if (currentUser?.province || currentUser?.canton) {
        const provinceCoords = getCoordinatesForEcuadorProvince(currentUser.province, currentUser.canton);
        setOrigin(provinceCoords);
        fleetSimulationService.setFleetCenter(provinceCoords);
      }
    } else {
      setUserRole('cliente');
      setShowAdminPanel(false);
      if (currentUser && currentUser.role !== 'cliente') {
        setCurrentUser({ ...currentUser, role: 'cliente' });
      }
      if (currentUser?.province || currentUser?.canton) {
        const provinceCoords = getCoordinatesForEcuadorProvince(currentUser.province, currentUser.canton);
        setOrigin(provinceCoords);
        fleetSimulationService.setFleetCenter(provinceCoords);
      }
    }
  };

  // Strict Role Guard & Sync: Cliente only accesses Cliente, Conductor only Conductor, Admin only Admin
  useEffect(() => {
    if (userRole === 'admin' && (!currentAdminUser || !currentAdminUser.isActive)) {
      setUserRole(currentUser?.role === 'conductor' ? 'conductor' : 'cliente');
      setShowAdminPanel(false);
    }
  }, [userRole, currentAdminUser, currentUser]);

  // OS System Theme Preference Detection and Dynamic Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const targetTheme: EffectiveTheme = themePreference === 'dark' ? 'dark' : 'light';
    setEffectiveTheme(targetTheme);
    applyThemeToDOM(targetTheme);
  }, [themePreference]);

  // Cycle Theme Preference (system -> dark -> light -> system)
  const handleCycleTheme = () => {
    setThemePreference((prev) => {
      let next: ThemePreference = 'system';
      if (prev === 'system') next = 'dark';
      else if (prev === 'dark') next = 'light';
      else if (prev === 'light') next = 'system';
      saveThemePreference(next);
      return next;
    });
  };

  // Sync initial welcome message in chat when a driver is assigned
  useEffect(() => {
    if (activeDriver && chatMessages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'conductor',
        text: `¡Hola! Soy ${activeDriver.name}, ya voy en camino en mi ${activeDriver.vehicle.model} (${activeDriver.vehicle.color}). ¿Me confirmas tu punto exacto?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };
      setChatMessages([welcomeMsg]);
      setUnreadChatCount(1);

      // Trigger Push Notification for conductor's initial message
      pushNotificationService.notifyChatMessage({
        senderName: activeDriver.name,
        text: welcomeMsg.text,
        driverPhone: activeDriver.phone,
        tripId: activeTrip?.id,
      });
    }
  }, [activeDriver]);

  // Handle sending chat message
  const handleSendChatMessage = (text: string, isLocation?: boolean, coords?: Coordinates) => {
    if (!activeDriver) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'cliente',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isLocation,
      locationCoords: coords,
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // Simulate driver reply after 1.5 seconds
    setTimeout(() => {
      const replies = [
        '¡Listo pana! Ya voy llegando, estoy a 2 minutos.',
        'Perfecto, te espero en la puerta principal.',
        'Entendido, voy con las luces de parqueo encendidas.',
        '¡Excelente! Gracias por la indicación.',
        'Ya estoy en la esquina, carro plata con placa ' + activeDriver.vehicle.plate,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const driverReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'conductor',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };

      setChatMessages((prev) => [...prev, driverReply]);

      // Trigger Push Notification for incoming conductor message
      pushNotificationService.notifyChatMessage({
        senderName: activeDriver.name,
        text: randomReply,
        driverPhone: activeDriver.phone,
        tripId: activeTrip?.id,
      });

      // If chat modal is closed, increment unread counter
      if (!showChatModal) {
        setUnreadChatCount((prev) => prev + 1);
      }
    }, 1500);
  };

  // Open Chat and mark as read
  const handleOpenChat = () => {
    setShowChatModal(true);
    setUnreadChatCount(0);
  };

  // Handle map click coordinate selection (Origen, Destino o Parada con 1 Clic)
  const handleSelectCoordinatesFromMap = (coords: Coordinates, mode: 'origin' | 'destination' | 'stop') => {
    if (mode === 'origin') {
      setOrigin(coords);
      setDestination(null);
      haptic.tap();
      pushNotificationService.sendLocalNotification({
        title: '📍 Origen Fijado (Punto A)',
        body: `Haz un 2do clic en el mapa para marcar tu Destino con la Bandera de Meta (Punto B).`,
        category: 'system',
      });
      // Mantener vista de mapa abierta en móvil para permitir el 2do clic de destino
    } else if (mode === 'destination') {
      setDestination(coords);
      haptic.success();
      pushNotificationService.sendLocalNotification({
        title: '🏁 Destino Fijado (Punto B)',
        body: `¡Meta fijada con éxito! Ruta calculada en el mapa.`,
        category: 'system',
      });
      setSelectionMode(null);
    } else if (mode === 'stop') {
      haptic.success();
      setIntermediateStops((prev) => {
        if (prev.length >= 4) return prev;
        const nextIdx = prev.length + 1;
        const newStop: Coordinates = {
          lat: coords.lat,
          lng: coords.lng,
          name: coords.name || coords.address || `Parada ${nextIdx} (Mapa)`,
          address: coords.address || coords.name || `Punto en mapa (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        };
        return [...prev, newStop];
      });
      pushNotificationService.sendLocalNotification({
        title: '📍 Parada Registrada con 1 Clic',
        body: `Se agregó ${coords.name || coords.address || 'Punto en mapa'} a tu ruta de viaje.`,
        category: 'system',
      });
      setSelectionMode(null);
    }
  };

  // 1. VIAJES FLOW: Start searching drivers (Publish offer & Broadcast to all drivers)
  const handleStartRideSearch = (bookingData: {
    vehicleType: 'auto' | 'moto' | 'confort' | 'mini';
    offeredPrice: number;
    notes: string;
    distanceKm: number;
    estimatedMinutes: number;
  }) => {
    if (!destination) return;

    setIsSearchingRides(true);

    const newTrip: TripRequest = {
      id: `trip-${Date.now()}`,
      serviceType: 'viaje',
      origin,
      destination,
      offeredPrice: bookingData.offeredPrice,
      suggestedPrice: bookingData.offeredPrice,
      distanceKm: bookingData.distanceKm,
      estimatedMinutes: bookingData.estimatedMinutes,
      vehicleType: bookingData.vehicleType,
      notes: bookingData.notes,
      status: 'searching_drivers',
      paymentMethod: 'deuna',
      paymentStatus: 'pending',
      startPin: '5821',
      endPin: '8342',
      createdAt: Date.now(),
    };

    setActiveTrip(newTrip);

    // Create radar order for all drivers in fleet
    const newRadarOrder: DriverRadarOrder = {
      id: newTrip?.id || `trip-${Date.now()}`,
      serviceType: 'viaje',
      clientName: currentUser?.name || 'Cliente AndesMovi',
      clientAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      clientRating: currentUser?.rating || 4.95,
      clientTrips: currentUser?.totalTripsCompleted || 12,
      clientPhone: currentUser?.phone || '+593 97 873 4844',
      origin: origin.name || origin.address || 'Quito',
      destination: destination.name || destination.address || 'Destino seleccionado',
      distanceKm: bookingData.distanceKm,
      durationMin: bookingData.estimatedMinutes,
      distanceFromDriverKm: 1.1,
      etaPickupMin: 3,
      passengerOffer: bookingData.offeredPrice,
      suggestedFair: bookingData.offeredPrice,
      paymentMethodName: 'DeUna! / Banco Pichincha',
      paymentMethodType: 'deuna',
      pickupPin: '5821',
      deliveryPin: '8342',
      specialNotes: bookingData.notes || 'Carrera solicitada en tiempo real.',
      vehicleCompatibility: bookingData.vehicleType === 'moto' ? 'moto' : 'auto',
      isRealtimeClientOrder: true,
      createdAt: Date.now(),
    };

    handleUpdateRadarOrders([newRadarOrder, ...driverRadarOrders.filter((o) => o && o.id !== newRadarOrder.id)]);

    // Sync trip into DatabaseService for real-time reflection in Admin Panel
    databaseService.addOrUpdateTrip({
      id: newTrip?.id || `trip-${Date.now()}`,
      tripCode: `CARR-${(newTrip?.id || `trip-${Date.now()}`).slice(-4).toUpperCase()}`,
      serviceType: 'viaje',
      passengerName: currentUser?.name || 'Cliente AndesMovi',
      passengerPhone: currentUser?.phone || '+593 97 873 4844',
      originAddress: origin.name || origin.address || 'Quito',
      destinationAddress: destination.name || destination.address || 'Destino seleccionado',
      distanceKm: bookingData.distanceKm,
      durationMinutes: bookingData.estimatedMinutes,
      fareBreakdown: {
        baseFareUsd: 1.25,
        coveredKm: 2.7,
        extraKm: Math.max(0, bookingData.distanceKm - 2.7),
        extraKmRateUsd: 0.35,
        totalFareUsd: bookingData.offeredPrice,
      },
      status: 'pendiente',
      paymentMethod: 'deuna',
      paymentStatus: 'pendiente',
      cooperativaName: 'Coop. Taxi Pichincha',
      terminalName: 'Terminal Carcelén (Quito)',
      startSecurityPin: '5821',
      createdAt: Date.now(),
      createdFormatted: 'Ahora mismo',
      notes: bookingData.notes,
    });

    // Log Activity into Admin Real-time Feed
    logAdminActivity({
      type: 'client_request',
      actorName: currentUser?.name || 'Cliente AndesMovi',
      actorRole: 'cliente',
      title: 'Cliente Solicitó Carrera en Vivo',
      description: `Carrera solicitada: ${origin.name || origin.address || 'Quito'} → ${destination.name || destination.address} ($${bookingData.offeredPrice.toFixed(2)} USD). Notificada a ${trackedDrivers.length} choferes.`,
      amount: bookingData.offeredPrice,
      serviceType: 'viaje',
      details: {
        origin: origin.name || origin.address,
        destination: destination.name || destination.address,
      },
    });

    // Broadcast push notification to ALL drivers
    pushNotificationService.notifyDriverBroadcast({
      serviceType: 'viaje',
      clientName: currentUser?.name || 'Cliente AndesMovi',
      origin: origin.name || origin.address || 'Quito',
      destination: destination.name || destination.address || 'Destino',
      price: bookingData.offeredPrice,
      vehicleType: bookingData.vehicleType,
      driversCount: trackedDrivers.length,
      tripId: newTrip.id,
    });

    // Show realtime broadcast banner
    setBroadcastAlertNotice({
      title: '🚨 ¡CARRERA NOTIFICADA A TODOS LOS CONDUCTORES!',
      message: `Solicitud de carrera por $${bookingData.offeredPrice.toFixed(2)} USD transmitida en tiempo real a los ${trackedDrivers.length} conductores activos para que puedan tomarla en el Radar.`,
      serviceType: 'viaje',
      price: bookingData.offeredPrice,
      driversCount: trackedDrivers.length,
    });
    setTimeout(() => setBroadcastAlertNotice(null), 6500);
  };

  // 1a-2. EJECUTIVO A QUITO FLOW: Confirmación de Asientos con Tarifa Fija Oficial (Sin Mapa)
  const handleConfirmExecutiveBooking = (data: {
    origin: Coordinates;
    destination: Coordinates;
    seats: number;
    price: number;
    departureDate: string;
    departureTime: string;
    luggageType: string;
    notes: string;
    direction: 'tulcan_quito' | 'quito_tulcan' | string;
  }) => {
    setOrigin(data.origin);
    setDestination(data.destination);
    setIsSearchingRides(true);

    const newTrip: TripRequest = {
      id: `exec-${Date.now()}`,
      serviceType: 'ejecutivo_quito',
      origin: data.origin,
      destination: data.destination,
      offeredPrice: data.price,
      suggestedPrice: data.price,
      distanceKm: 240.0,
      estimatedMinutes: 240,
      vehicleType: 'auto',
      notes: data.notes,
      status: 'searching_drivers',
      paymentMethod: 'deuna',
      paymentStatus: 'pending',
      startPin: '7412',
      endPin: '9635',
      createdAt: Date.now(),
      isInterprovincial: true,
      passengerCount: data.seats,
      pricePerPassengerUsd: data.price / data.seats,
      commissionPerPassengerUsd: 3.0,
      departureDate: data.departureDate,
      departureTime: data.departureTime,
      luggageType: data.luggageType,
      executiveDirection: data.direction,
    };

    setActiveTrip(newTrip);

    // Create radar order for executive units
    const newRadarOrder: DriverRadarOrder = {
      id: newTrip?.id || `trip-${Date.now()}`,
      serviceType: 'ejecutivo_quito',
      clientName: currentUser?.name || 'Cliente Ejecutivo AndesMovi',
      clientAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      clientRating: currentUser?.rating || 4.98,
      clientTrips: currentUser?.totalTripsCompleted || 15,
      clientPhone: currentUser?.phone || '+593 97 873 4844',
      origin: data.origin.name || data.origin.address || 'Tulcán',
      destination: data.destination.name || data.destination.address || 'Quito',
      distanceKm: 240.0,
      durationMin: 240,
      distanceFromDriverKm: 1.5,
      etaPickupMin: 15,
      passengerOffer: data.price,
      suggestedFair: data.price,
      paymentMethodName: 'DeUna! / Banco Pichincha',
      paymentMethodType: 'deuna',
      pickupPin: '7412',
      deliveryPin: '9635',
      specialNotes: data.notes,
      vehicleCompatibility: 'auto',
      isRealtimeClientOrder: true,
      createdAt: Date.now(),
    };

    handleUpdateRadarOrders([newRadarOrder, ...driverRadarOrders.filter((o) => o && o.id !== newRadarOrder.id)]);

    databaseService.addOrUpdateTrip({
      id: newTrip?.id || `trip-${Date.now()}`,
      tripCode: `EXEC-${(newTrip?.id || `trip-${Date.now()}`).slice(-4).toUpperCase()}`,
      serviceType: 'ejecutivo_quito',
      passengerName: currentUser?.name || 'Cliente Ejecutivo AndesMovi',
      passengerPhone: currentUser?.phone || '+593 97 873 4844',
      originAddress: data.origin.name || data.origin.address || 'Tulcán',
      destinationAddress: data.destination.name || data.destination.address || 'Quito',
      distanceKm: 240.0,
      durationMinutes: 240,
      fareBreakdown: {
        baseFareUsd: data.price,
        coveredKm: 240.0,
        extraKm: 0,
        extraKmRateUsd: 0,
        totalFareUsd: data.price,
      },
      status: 'pendiente',
      paymentMethod: 'deuna',
      paymentStatus: 'pendiente',
      cooperativaName: 'Flota Ejecutiva AndesMovi Carchi-Pichincha',
      terminalName: data.direction === 'tulcan_quito' ? 'Terminal Terrestre Tulcán' : 'Terminal Carcelén (Quito)',
      startSecurityPin: '7412',
      createdAt: Date.now(),
      createdFormatted: 'Ahora mismo',
      notes: data.notes,
    });

    logAdminActivity({
      type: 'client_request',
      actorName: currentUser?.name || 'Cliente Ejecutivo AndesMovi',
      actorRole: 'cliente',
      title: 'Reserva Ejecutiva Tulcán ⇄ Quito Confirmada',
      description: `Reserva ejecutiva confirmada: ${data.seats} asiento(s) (${data.direction === 'tulcan_quito' ? 'Tulcán ➔ Quito' : 'Quito ➔ Tulcán'}) por $${data.price}.00 USD. Salida: ${data.departureDate} ${data.departureTime}.`,
      amount: data.price,
      serviceType: 'ejecutivo_quito',
      details: {
        tripId: newTrip?.id || `trip-${Date.now()}`,
        seats: data.seats,
        date: data.departureDate,
        time: data.departureTime,
        fare: data.price,
      },
    });

    // Broadcast push notification to executive drivers
    pushNotificationService.notifyDriverBroadcast({
      serviceType: 'ejecutivo_quito',
      clientName: currentUser?.name || 'Cliente Ejecutivo AndesMovi',
      origin: data.origin.name || data.origin.address || 'Tulcán',
      destination: data.destination.name || data.destination.address || 'Quito',
      price: data.price,
      vehicleType: 'auto',
      driversCount: trackedDrivers.length,
      tripId: newTrip?.id || `trip-${Date.now()}`,
    });

    setBroadcastAlertNotice({
      title: '🚙 ¡RESERVA EJECUTIVA TULCÁN ⇄ QUITO!',
      message: `Reserva de ${data.seats} asiento(s) por $${data.price}.00 USD para la ruta ${data.direction === 'tulcan_quito' ? 'Tulcán ➔ Quito' : 'Quito ➔ Tulcán'} transmitida a la flota ejecutiva.`,
      serviceType: 'ejecutivo_quito',
      price: data.price,
      driversCount: trackedDrivers.length,
    });
    setTimeout(() => setBroadcastAlertNotice(null), 6500);
  };

  // 1b. Accept a driver offer -> Opens Payment Modal first!
  const handleAcceptDriverOffer = (driver: Driver, finalPrice: number) => {
    if (!activeTrip) return;

    setIsSearchingRides(false);

    // Prompt payment modal with integrated Ecuadorian options
    setPendingPaymentData({
      amount: finalPrice,
      title: `Viaje con ${driver.name} (${driver.vehicle.model})`,
      onSuccess: (paymentDetails) => {
        if (paymentDetails.method === 'billetera') {
          handleUpdateWallet((prev) => Math.max(0, Number((prev - paymentDetails.total).toFixed(2))));
        }

        const startedTrip: TripRequest = {
          ...activeTrip,
          offeredPrice: finalPrice,
          selectedDriver: {
            ...driver,
            currentCoords: {
              lat: origin.lat + 0.005,
              lng: origin.lng + 0.005,
            },
          },
          status: 'driver_assigned',
          paymentMethod: paymentDetails.method,
          paymentStatus: 'paid',
        };

        setActiveTrip(startedTrip);
        setActiveDriver(startedTrip.selectedDriver || null);
        setPendingPaymentData(null);
        setChatMessages([]);

        pushNotificationService.playChime('trip');
        haptic.success();

        // Real-time Push Notification: Driver assigned
        pushNotificationService.notifyTripStatus('driver_assigned', {
          driverName: driver.name,
          vehicleModel: driver.vehicle.model,
          plate: driver.vehicle.plate,
          serviceType: 'viaje',
          originName: origin.name || origin.address,
          destinationName: destination?.name || destination?.address,
          tripId: startedTrip?.id || `trip-${Date.now()}`,
        });
      },
    });
  };

  // Handler when a driver takes a carrera, pedido or encomienda from the radar
  const handleDriverTakeOrder = (order: DriverRadarOrder, finalPrice: number) => {
    const driverName = currentUser?.name && currentUser.role === 'conductor' ? currentUser.name : 'Carlos Mendoza';
    const driverVehicle = 'Chevrolet Sail Sedán';
    const driverPlate = 'PBA-8321';

    const assignedDriver: Driver = {
      id: 'drv-current-active',
      name: driverName,
      avatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 4.96,
      totalTrips: 1840,
      vehicle: {
        type: order.vehicleCompatibility === 'moto' ? 'moto' : 'auto',
        model: driverVehicle,
        plate: driverPlate,
        color: 'Plata Brillante',
        year: 2023,
      },
      currentCoords: {
        lat: origin.lat + 0.004,
        lng: origin.lng + 0.004,
      },
      etaMinutes: 3,
      phone: currentUser?.phone || '+593 99 458 9012',
    };

    if (activeTrip) {
      const isEncomienda = activeTrip.serviceType === 'encomienda' || order.serviceType === 'encomienda';
      const updatedTrip: TripRequest = {
        ...activeTrip,
        offeredPrice: finalPrice,
        suggestedPrice: finalPrice,
        driverQuotedPriceUsd: finalPrice,
        quotationStatus: isEncomienda ? 'cotizado_confirmado' : activeTrip.quotationStatus,
        status: 'driver_assigned',
        selectedDriver: assignedDriver,
        parcelDetails: order.parcelDetails ? {
          ...order.parcelDetails,
          driverQuotedPriceUsd: finalPrice,
          quotationStatus: 'cotizado_confirmado',
        } : activeTrip.parcelDetails ? {
          ...activeTrip.parcelDetails,
          driverQuotedPriceUsd: finalPrice,
          quotationStatus: 'cotizado_confirmado',
        } : undefined,
      };

      setActiveTrip(updatedTrip);
      setActiveDriver(assignedDriver);
      setIsSearchingRides(false);

      pushNotificationService.playChime('trip');
      haptic.success();

      if (isEncomienda) {
        setBroadcastAlertNotice({
          title: '✅ Encomienda Cotizada y Confirmada',
          message: `El conductor ${driverName} cotizó el flete en $${finalPrice.toFixed(2)} USD. ¡Tu envío ha pasado a estado Confirmado!`,
          serviceType: 'encomienda',
          price: finalPrice,
          driversCount: trackedDrivers.length,
        });
      }

      // Real-time Push Notification to client: Driver took the ride / quoted parcel
      pushNotificationService.notifyTripStatus('driver_assigned', {
        driverName,
        vehicleModel: driverVehicle,
        plate: driverPlate,
        serviceType: activeTrip.serviceType,
        originName: order.origin,
        destinationName: order.destination,
        tripId: updatedTrip?.id || `trip-${Date.now()}`,
      });

      // Update DatabaseService for Admin Panel
      databaseService.updateTripStatus(updatedTrip?.id || `trip-${Date.now()}`, 'en_curso');
    }

    // Log Activity into Admin Real-time Feed
    logAdminActivity({
      type: 'driver_take',
      actorName: driverName,
      actorRole: 'conductor',
      title: 'Conductor Tomó Servicio en el Radar',
      description: `${driverName} aceptó la solicitud de ${order.clientName} (${order.origin} → ${order.destination}) por $${finalPrice.toFixed(2)} USD. Unidad en camino.`,
      amount: finalPrice,
      serviceType: order.serviceType,
      details: {
        origin: order.origin,
        destination: order.destination,
        plate: driverPlate,
      },
    });

    // Remove from active open radar orders
    handleUpdateRadarOrders(driverRadarOrders.filter((o) => o && o.id !== order.id));
  };

  // 2. DOMICILIOS FLOW: Confirm cart order -> Payment Modal -> Broadcast to all drivers & Dispatch
  const handleConfirmDeliveryOrder = (orderData: {
    restaurantName: string;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    notes: string;
    paymentMethodType?: PaymentMethodType;
    paymentMethodName?: string;
  }) => {
    const courierDriver = MOCK_DRIVERS[3] || trackedDrivers[0] || FALLBACK_DRIVER; // Julián Camilo (Yamaha)

    setPendingPaymentData({
      amount: orderData.total,
      title: `Domicilio de ${orderData.restaurantName} (${orderData.items.length} productos)`,
      onSuccess: (paymentDetails) => {
        if (paymentDetails.method === 'billetera') {
          handleUpdateWallet((prev) => Math.max(0, Number((prev - paymentDetails.total).toFixed(2))));
        }

        const deliveryTripId = `deliv-${Date.now()}`;
        const deliveryTrip: TripRequest = {
          id: deliveryTripId,
          serviceType: 'domicilio',
          origin: {
            lat: origin.lat + 0.006,
            lng: origin.lng - 0.004,
            name: orderData.restaurantName,
            address: 'Local comercial en Quito',
          },
          destination: origin,
          offeredPrice: orderData.deliveryFee,
          suggestedPrice: orderData.deliveryFee,
          distanceKm: 3.2,
          estimatedMinutes: 20,
          vehicleType: 'moto',
          notes: orderData.notes,
          status: 'driver_assigned',
          selectedDriver: {
            ...courierDriver,
            currentCoords: {
              lat: origin.lat + 0.008,
              lng: origin.lng - 0.006,
            },
          },
          paymentMethod: (orderData.paymentMethodType || paymentDetails.method) as any,
          paymentStatus: 'paid',
          deliveryItems: orderData.items,
          restaurantName: orderData.restaurantName,
          startPin: '6149',
          endPin: '9025',
          createdAt: Date.now(),
        };

        setActiveTrip(deliveryTrip);
        setActiveDriver(deliveryTrip.selectedDriver || null);
        setPendingPaymentData(null);
        setChatMessages([]);

        // Create Radar order for all drivers/couriers
        const newRadarOrder: DriverRadarOrder = {
          id: deliveryTripId,
          serviceType: 'domicilio',
          clientName: currentUser?.name || 'Cliente AndesMovi',
          clientAvatar:
            currentUser?.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          clientRating: 4.95,
          clientTrips: 18,
          clientPhone: currentUser?.phone || '+593 99 876 5432',
          origin: orderData.restaurantName,
          destination: origin.name || origin.address || 'Ubicación del cliente',
          distanceKm: 3.2,
          durationMin: 20,
          distanceFromDriverKm: 0.8,
          etaPickupMin: 2,
          passengerOffer: orderData.total,
          suggestedFair: orderData.deliveryFee,
          paymentMethodName: orderData.paymentMethodName || 'Efectivo o Transferencia Directa',
          paymentMethodType: orderData.paymentMethodType || 'efectivo',
          pickupPin: '6149',
          deliveryPin: '9025',
          specialNotes: `Pedido de ${orderData.restaurantName} (${orderData.items.length} productos). [Compra en local: $${orderData.subtotal.toFixed(2)} + Carrera: $${orderData.deliveryFee.toFixed(2)} = Cobro Total: $${orderData.total.toFixed(2)} USD en Efectivo/Transferencia]. ${orderData.notes || ''}`,
          vehicleCompatibility: 'moto',
          restaurantName: orderData.restaurantName,
          deliveryItems: orderData.items,
          deliverySubtotalUsd: orderData.subtotal,
          deliveryFeeUsd: orderData.deliveryFee,
          totalToCollectUsd: orderData.total,
          isRealtimeClientOrder: true,
          createdAt: Date.now(),
        };
        handleUpdateRadarOrders([newRadarOrder, ...driverRadarOrders.filter((o) => o && o.id !== newRadarOrder.id)]);

        // Sync into DatabaseService for Admin Panel
        databaseService.addOrUpdateTrip({
          id: deliveryTripId,
          tripCode: `DOM-${deliveryTripId.slice(-4).toUpperCase()}`,
          serviceType: 'domicilio',
          passengerName: `${currentUser?.name || 'Cliente'} / ${orderData.restaurantName}`,
          passengerPhone: currentUser?.phone || '+593 99 876 5432',
          originAddress: orderData.restaurantName,
          destinationAddress: origin.name || origin.address || 'Ubicación del cliente',
          distanceKm: 3.2,
          durationMinutes: 20,
          fareBreakdown: {
            baseFareUsd: 1.25,
            coveredKm: 2.7,
            extraKm: 0.5,
            extraKmRateUsd: 0.35,
            totalFareUsd: orderData.deliveryFee,
          },
          status: 'en_curso',
          paymentMethod: 'transferencia',
          paymentStatus: 'pagado',
          cooperativaName: 'Coop. San Cristóbal Delivery',
          terminalName: 'Terminal Terrestre Ibarra',
          assignedDriverName: courierDriver.name,
          vehiclePlate: courierDriver.vehicle.plate,
          assignedUnitNumber: 'MOTO-12',
          startSecurityPin: '6149',
          createdAt: Date.now(),
          createdFormatted: 'Ahora mismo',
        });

        // Log Activity into Admin Real-time Feed
        logAdminActivity({
          type: 'client_request',
          actorName: currentUser?.name || 'Cliente AndesMovi',
          actorRole: 'cliente',
          title: 'Cliente Solicitó Pedido de Domicilio',
          description: `Pedido de ${orderData.restaurantName} (${orderData.items.length} productos). Tarifa entrega: $${orderData.deliveryFee.toFixed(2)} USD. Total: $${orderData.total.toFixed(2)} USD. Asignado a ${courierDriver.name}.`,
          amount: orderData.total,
          serviceType: 'domicilio',
          details: {
            origin: orderData.restaurantName,
            destination: origin.name || origin.address,
          },
        });

        // Broadcast to all drivers
        pushNotificationService.notifyDriverBroadcast({
          serviceType: 'domicilio',
          clientName: currentUser?.name || 'Cliente AndesMovi',
          origin: orderData.restaurantName,
          destination: origin.name || origin.address || 'Tu dirección',
          price: orderData.deliveryFee,
          vehicleType: 'moto',
          driversCount: trackedDrivers.length,
          tripId: deliveryTrip.id,
        });

        // Show realtime broadcast banner
        setBroadcastAlertNotice({
          title: '🍔 ¡PEDIDO NOTIFICADO A TODOS LOS CONDUCTORES!',
          message: `Pedido de ${orderData.restaurantName} ($${orderData.deliveryFee.toFixed(2)} USD entrega) alertado a los ${trackedDrivers.length} repartidores y conductores para tomar el pedido.`,
          serviceType: 'domicilio',
          price: orderData.deliveryFee,
          driversCount: trackedDrivers.length,
        });
        setTimeout(() => setBroadcastAlertNotice(null), 6500);

        // Real-time Push Notification: Delivery dispatched
        pushNotificationService.notifyTripStatus('driver_assigned', {
          driverName: courierDriver.name,
          vehicleModel: courierDriver.vehicle.model,
          plate: courierDriver.vehicle.plate,
          serviceType: 'domicilio',
          originName: orderData.restaurantName,
          destinationName: origin.name || origin.address,
          tripId: deliveryTrip.id,
        });
      },
    });
  };

  // 3. ENCOMIENDAS FLOW: Cliente registra datos -> Orden esperando cotización del transportista -> Chofer cotiza y emite guía
  const handleConfirmParcelOrder = (parcelData: {
    parcelDetails: ParcelDetails;
    distanceKm: number;
    estimatedMinutes: number;
    offeredPrice: number;
  }) => {
    const isInterprovincial = parcelData.parcelDetails.scope === 'interprovincial';
    const originText = (parcelData.parcelDetails.originProvince || origin.name || origin.address || '').toLowerCase();
    const isOriginTulcan = originText.includes('carchi') || originText.includes('tulcán') || originText.includes('tulcan');

    // En Tulcán: Fijo a la Oficina Tulcanaza
    const tulcanazaOfficeCoords = {
      lat: 0.8145,
      lng: -77.7145,
      name: 'Oficina Tulcanaza (Avenida Centenario)',
      address: 'Avenida Centenario (Sector Tulcanaza), Tulcán, Carchi',
    };

    // En otras provincias: El conductor busca dónde enviar en las oficinas aliadas
    const originOfficeCoords = parcelData.parcelDetails.originOffice?.coords || {
      lat: origin.lat,
      lng: origin.lng,
      name: parcelData.parcelDetails.originOffice?.name || 'Oficina Aliada por Seleccionar',
      address: parcelData.parcelDetails.originOffice?.address || 'Terminal Terrestre / Oficina Aliada',
    };

    const targetDest = isInterprovincial
      ? (isOriginTulcan ? tulcanazaOfficeCoords : originOfficeCoords)
      : destination || {
          lat: 0.8145,
          lng: -77.7145,
          name: parcelData.parcelDetails.deliveryCityOrStop
            ? parcelData.parcelDetails.deliveryCityOrStop
            : parcelData.parcelDetails.destinationProvince
            ? `${parcelData.parcelDetails.destinationProvince}, Ecuador`
            : 'Destino de Entrega',
          address: parcelData.parcelDetails.deliveryCityOrStop || 'Dirección de Entrega en Destino',
        };

    const parcelTripId = `pkg-${Date.now()}`;
    const parcelTrip: TripRequest = {
      id: parcelTripId,
      serviceType: 'encomienda',
      origin,
      destination: targetDest,
      offeredPrice: 0,
      suggestedPrice: 0,
      distanceKm: isInterprovincial ? 3.5 : parcelData.distanceKm,
      estimatedMinutes: isInterprovincial ? 8 : parcelData.estimatedMinutes,
      vehicleType: parcelData.parcelDetails.weightKg > 15 ? 'auto' : 'moto',
      status: 'searching_drivers',
      quotationStatus: 'esperando_cotizacion',
      paymentTiming: parcelData.parcelDetails.paymentTiming || 'pago_origen',
      parcelDetails: {
        ...parcelData.parcelDetails,
        quotationStatus: 'esperando_cotizacion',
      },
      paymentMethod: parcelData.parcelDetails.paymentTiming === 'por_cobrar_destino' ? 'efectivo' : 'efectivo',
      paymentStatus: 'pending',
      createdAt: Date.now(),
    };

    setActiveTrip(parcelTrip);
    setActiveDriver(null);
    setPendingPaymentData(null);
    setChatMessages([]);

    // Add to Admin Encomiendas state as pendiente de cotización
    const newAdminEncomienda: AdminEncomienda = {
      id: parcelTripId,
      trackingNumber: `GUIA-EC-${new Date().getFullYear()}-${parcelTripId.slice(-4).toUpperCase()}`,
      senderName: parcelData.parcelDetails.senderName || 'Remitente',
      senderPhone: parcelData.parcelDetails.senderPhone || '',
      senderIdNumber: parcelData.parcelDetails.senderCedula || '',
      senderAddress: origin.address || 'Origen',
      senderCity: origin.name || 'Ciudad',
      receiverName: parcelData.parcelDetails.receiverName || 'Destinatario',
      receiverPhone: parcelData.parcelDetails.receiverPhone || '',
      receiverIdNumber: parcelData.parcelDetails.receiverCedula || '',
      receiverAddress: targetDest.address || 'Destino',
      receiverCity: targetDest.name || 'Ciudad',
      packageType: 'caja_mediana',
      description: `${parcelData.parcelDetails.description || 'Encomienda'} (${parcelData.parcelDetails.packageCount || 1} bultos)`,
      weightKg: parcelData.parcelDetails.weightKg || 0,
      declaredValueUsd: parcelData.parcelDetails.declaredValueUsd || 0,
      deliveryCostUsd: 0,
      paymentStatus: parcelData.parcelDetails.paymentTiming === 'por_cobrar_destino' ? 'cobro_contra_entrega' : 'pagado_origen',
      assignedCarrierType: 'conductor_andesmovi',
      assignedCarrierName: 'Por asignar / cotizar',
      assignedCarrierPhone: '',
      securityPin: '',
      status: 'recepcionada',
      createdAt: Date.now(),
      createdFormatted: 'Ahora mismo',
      estimatedDeliveryFormatted: '24-48 horas',
    };
    setAdminEncomiendas(prev => [newAdminEncomienda, ...prev]);

    // Create Radar order for all drivers in fleet awaiting driver quote
    const newRadarOrder: DriverRadarOrder = {
      id: parcelTripId,
      serviceType: 'encomienda',
      clientName: parcelData.parcelDetails.senderName || currentUser?.name || 'Remitente',
      clientAvatar:
        currentUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      clientRating: 4.98,
      clientTrips: 15,
      clientPhone: parcelData.parcelDetails.senderPhone || '+593 99 765 4321',
      origin: origin.name || origin.address || 'Punto de recojo',
      destination: targetDest.name || targetDest.address || 'Punto de entrega',
      distanceKm: parcelData.distanceKm,
      durationMin: parcelData.estimatedMinutes,
      distanceFromDriverKm: 1.4,
      etaPickupMin: 4,
      passengerOffer: 0,
      suggestedFair: 0,
      quotationStatus: 'esperando_cotizacion',
      paymentTiming: parcelData.parcelDetails.paymentTiming || 'pago_origen',
      paymentMethodName: parcelData.parcelDetails.paymentTiming === 'por_cobrar_destino' ? 'Por cobrar en destino' : 'Pago en origen',
      paymentMethodType: 'efectivo',
      pickupPin: undefined,
      deliveryPin: undefined,
      specialNotes: `Encomienda: ${parcelData.parcelDetails.description} (${parcelData.parcelDetails.weightKg} kg, ${parcelData.parcelDetails.packageCount || 1} bultos). Destinatario: ${parcelData.parcelDetails.receiverName}`,
      vehicleCompatibility: parcelData.parcelDetails.weightKg > 15 ? 'auto' : 'both',
      parcelDetails: {
        ...parcelData.parcelDetails,
        quotationStatus: 'esperando_cotizacion',
      },
      isRealtimeClientOrder: true,
      createdAt: Date.now(),
    };
    handleUpdateRadarOrders([newRadarOrder, ...driverRadarOrders.filter((o) => o && o.id !== newRadarOrder.id)]);

    // Sync into DatabaseService for Admin Panel
    databaseService.addOrUpdateTrip({
      id: parcelTripId,
      tripCode: `ENC-${parcelTripId.slice(-4).toUpperCase()}`,
      serviceType: 'encomienda',
      passengerName: `${parcelData.parcelDetails.senderName || 'Remitente'} (Para: ${parcelData.parcelDetails.receiverName || 'Destinatario'})`,
      passengerPhone: parcelData.parcelDetails.senderPhone || '+593 99 765 4321',
      originAddress: origin.name || origin.address || 'Punto de recojo',
      destinationAddress: targetDest.name || targetDest.address || 'Punto de entrega',
      distanceKm: parcelData.distanceKm,
      durationMinutes: parcelData.estimatedMinutes,
      fareBreakdown: {
        baseFareUsd: 0,
        coveredKm: 0,
        extraKm: 0,
        extraKmRateUsd: 0,
        totalFareUsd: 0,
      },
      status: 'pendiente',
      paymentMethod: 'efectivo',
      paymentStatus: 'pendiente',
      cooperativaName: 'AndesMovi Encomiendas Express',
      terminalName: 'Despacho Directo',
      assignedDriverName: 'Por cotizar',
      vehiclePlate: 'S/P',
      createdAt: Date.now(),
      createdFormatted: 'Ahora mismo',
      notes: `Encomienda: ${parcelData.parcelDetails.description} (${parcelData.parcelDetails.weightKg} kg, ${parcelData.parcelDetails.packageCount || 1} bulto/s)`,
    });

    // Log Activity into Admin Real-time Feed
    logAdminActivity({
      type: 'client_request',
      actorName: parcelData.parcelDetails.senderName || 'Remitente',
      actorRole: 'cliente',
      title: 'Solicitud de Encomienda (Esperando Cotización)',
      description: `Encomienda: ${parcelData.parcelDetails.description} (${parcelData.parcelDetails.weightKg} kg, ${parcelData.parcelDetails.packageCount || 1} bultos). Modalidad: ${parcelData.parcelDetails.paymentTiming === 'por_cobrar_destino' ? 'Por cobrar en destino' : 'Pago en origen'}. Para: ${parcelData.parcelDetails.receiverName}. Esperando cotización del chofer.`,
      amount: 0,
      serviceType: 'encomienda',
      details: {
        origin: origin.name || origin.address,
        destination: targetDest.name || targetDest.address,
      },
    });

    setBroadcastAlertNotice({
      title: '📦 Solicitud de Encomienda Generada',
      message: 'Tu solicitud ha sido enviada al radar. Esperando que un transportista cotice y fije la tarifa del flete.',
      serviceType: 'encomienda',
      price: 0,
      driversCount: trackedDrivers.length,
    });
  };

  // Driver positions movement update
  const handleUpdateDriverPosition = (newCoords: { lat: number; lng: number }) => {
    setActiveDriver((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentCoords: {
          ...prev.currentCoords,
          lat: newCoords.lat,
          lng: newCoords.lng,
        },
      };
    });
  };

  // Complete Trip / Order
  const handleCompleteTrip = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    });

    if (activeTrip && currentUser) {
      // Calculate loyalty points based on service type:
      // - Carrera Urbana / Domicilio: 5 pts
      // - Encomienda Urbana (dentro de la ciudad): 7 pts
      // - Encomienda Interprovincial: 10 pts
      // - Bus Ejecutivo / Ruta Interprovincial: 10 pts
      let earnedPoints = 5;
      const isEncomienda = activeTrip.serviceType === 'encomienda' || activeTrip.id.includes('parcel') || String(activeTrip.serviceType).includes('encomienda');
      const isEjecutivo = activeTrip.serviceType === 'ejecutivo_quito' || String(activeTrip.serviceType).includes('ejecutivo');
      const isInterprovincial =
        (activeTrip as any).parcelDetails?.routeType === 'interprovincial' ||
        (activeTrip as any).routeType === 'interprovincial' ||
        (activeTrip as any).originCanton !== (activeTrip as any).destinationCanton ||
        isEjecutivo;

      if (isEncomienda) {
        earnedPoints = isInterprovincial ? 10 : 7;
      } else if (isEjecutivo) {
        earnedPoints = 10;
      } else {
        earnedPoints = 5; // Carrera Urbana / Domicilio
      }

      const newPoints = (currentUser.loyaltyPoints || 0) + earnedPoints;
      
      // Check if client had an active free ride coupon
      const hadCoupon = currentUser.hasActiveFreeRideCoupon;
      
      const updatedUser = {
        ...currentUser,
        loyaltyPoints: newPoints,
        hasActiveFreeRideCoupon: false, // Reset after use
      };
      
      setCurrentUser(updatedUser);
      localStorage.setItem('andesmovi_current_user', JSON.stringify(updatedUser));
      
      // If the client used a free ride, platform administrator Jhon Sebastian Yepez Clavijo pays the driver $5 USD!
      if (hadCoupon) {
        handleAdjustDriverWallet(5.00, 'Reembolso por Carrera Gratis canjeada por Cliente (Pagado por Admin Jhon Sebastian)');
        pushNotificationService.sendLocalNotification({
          title: '🎁 Carrera de Fidelidad Pagada',
          body: 'El pasajero utilizó su Carrera Gratis. El Administrador Jhon Sebastian ha abonado $5.00 USD directamente a tu saldo.',
        });
      }
      
      setTripToRate(activeTrip);
      // Real-time Push Notification: Trip completed
      pushNotificationService.notifyTripStatus('completed', {
        driverName: activeDriver?.name,
        serviceType: activeTrip.serviceType,
        tripId: activeTrip.id,
      });
    }
    setActiveTrip(null);
    setActiveDriver(null);
    setChatMessages([]);
  };

  // Cancel Trip with predefined reasons modal & map route clearing
  const handleCancelTrip = (reason?: string) => {
    haptic.warning();
    if (activeTrip) {
      logAdminActivity({
        type: 'system_alert',
        title: `Viaje #${activeTrip.id} cancelado`,
        description: `Cancelado por ${userRole === 'conductor' ? 'el conductor' : 'el cliente'}. Motivo: ${reason || 'No especificado'}`,
        actorName: currentUser?.name || 'Usuario',
        actorRole: userRole,
      });
      databaseService.updateTripStatus(activeTrip.id, 'cancelado');
      pushNotificationService.notifyTripStatus('cancelled', {
        serviceType: activeTrip.serviceType,
        tripId: activeTrip.id,
      });
    }

    // 1. Clear active trip and driver
    setActiveTrip(null);
    setActiveDriver(null);
    setIsSearchingRides(false);
    setChatMessages([]);

    // 2. Clean map routes and destination
    setDestination(null);
    setIntermediateStops([]);
    setInfoRuta({
      km: 0,
      min: 0,
      origen: '',
      destino: '',
    });

    // 3. Local notification toast
    pushNotificationService.sendLocalNotification({
      title: 'Viaje Cancelado',
      body: reason ? `Motivo: ${reason}` : 'El viaje ha sido cancelado y el mapa ha sido reiniciado.',
      category: 'safety',
    });
  };

  // Scheduling Handlers
  const handleOpenScheduleViaje = () => {
    const distanceKm = destination ? calculateDistanceKm(origin, destination) : 4.5;
    const basePrice = calculateSuggestedPrice(distanceKm, 'viaje', 'auto');
    setScheduleContext({
      serviceType: 'viaje',
      origin,
      destination,
      basePrice,
    });
    setShowScheduleModal(true);
  };

  const handleOpenScheduleDelivery = (totalPrice: number, items: CartItem[], restaurantName: string) => {
    setScheduleContext({
      serviceType: 'domicilio',
      origin: {
        lat: origin.lat + 0.005,
        lng: origin.lng - 0.004,
        name: restaurantName,
        address: 'Local comercial',
      },
      destination: origin,
      basePrice: totalPrice,
      deliveryItems: items,
      restaurantName,
    });
    setShowScheduleModal(true);
  };

  const handleOpenScheduleParcel = (parcelDetails: ParcelDetails, price: number) => {
    setScheduleContext({
      serviceType: 'encomienda',
      origin,
      destination,
      basePrice: price,
      parcelDetails,
    });
    setShowScheduleModal(true);
  };

  const handleConfirmScheduleBooking = (bookingData: Omit<ScheduledBooking, 'id' | 'createdAt'>) => {
    const newBooking: ScheduledBooking = {
      ...bookingData,
      id: `sched-${Date.now()}`,
      createdAt: Date.now(),
      deliveryItems: scheduleContext?.deliveryItems,
      restaurantName: scheduleContext?.restaurantName,
      parcelDetails: scheduleContext?.parcelDetails,
    };

    setScheduledBookings((prev) => [newBooking, ...prev]);
    setShowScheduleModal(false);
    setScheduleContext(null);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    alert(`📅 ¡Reserva programada con éxito para el ${newBooking.scheduledDate} a las ${newBooking.scheduledTime}! Se notificó a conductores cercanos en Ecuador.`);
  };

  const handleCancelScheduledBooking = (id: string) => {
    if (confirm('¿Deseas cancelar esta reserva programada?')) {
      setScheduledBookings((prev) => prev.filter((b) => b && b.id !== id));
    }
  };

  const handleStartBookingNow = (booking: ScheduledBooking) => {
    setShowScheduledBookingsModal(false);

    // Instantly transform scheduled booking into active trip
    const assignedDriver = booking.assignedDriver || trackedDrivers[0] || FALLBACK_DRIVER;
    const instantTrip: TripRequest = {
      id: `trip-${Date.now()}`,
      serviceType: booking.serviceType,
      origin: booking.origin,
      destination: booking.destination || DEFAULT_COORDS,
      offeredPrice: booking.offeredPrice,
      suggestedPrice: booking.offeredPrice,
      distanceKm: 5.2,
      estimatedMinutes: 18,
      vehicleType: booking.vehicleType || 'auto',
      notes: booking.notes,
      status: 'driver_assigned',
      selectedDriver: assignedDriver,
      paymentMethod: 'deuna',
      paymentStatus: 'paid',
      startPin: '4190',
      endPin: '7351',
      createdAt: Date.now(),
      restaurantName: booking.restaurantName,
      deliveryItems: booking.deliveryItems,
      parcelDetails: booking.parcelDetails,
    };

    setActiveTrip(instantTrip);
    setActiveDriver(assignedDriver);
    setChatMessages([]);
  };

  // Driver Mode accepts incoming job
  const handleDriverAcceptJob = (job: any) => {
    if (!job) return;
    setUserRole('cliente');

    const newJobTrip: TripRequest = {
      id: job.id,
      serviceType: job.serviceType,
      origin: { lat: origin.lat, lng: origin.lng, address: job.origin, name: job.origin },
      destination: { lat: destination?.lat || -0.1292, lng: destination?.lng || -78.3575, address: job.destination, name: job.destination },
      offeredPrice: job.finalPrice || job.passengerOffer,
      suggestedPrice: job.suggestedFair,
      distanceKm: job.distanceKm,
      estimatedMinutes: job.durationMin,
      vehicleType: job.serviceType === 'viaje' ? 'auto' : 'moto',
      status: 'driver_assigned',
      paymentMethod: 'deuna',
      paymentStatus: 'paid',
      startPin: '5821',
      endPin: '8342',
      createdAt: Date.now(),
      selectedDriver: trackedDrivers[0] || FALLBACK_DRIVER,
    };

    setActiveTrip(newJobTrip);
    setActiveDriver(newJobTrip.selectedDriver || null);
    setChatMessages([]);
  };

  // Repeat trip from History
  const handleRepeatTrip = (orig: Coordinates, dest: Coordinates, sType: ServiceType) => {
    setActiveService(sType);
    setOrigin(orig);
    setDestination(dest);
    setUserRole('cliente');
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className={`flex flex-col h-screen h-[100dvh] max-h-[100dvh] w-screen overflow-hidden ${effectiveTheme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-[#FFFFFF] text-[#111827]'}`}>
      {/* Top Navigation */}
      <Navbar
        activeService={activeService}
        onSelectService={(service) => {
          setActiveService(service);
          setIsSearchingRides(false);
          setShowHomeHub(false);
        }}
        userRole={userRole}
        onToggleRole={() => handleSelectRole(userRole === 'cliente' ? 'conductor' : 'cliente')}
        onSelectRole={handleSelectRole}
        walletBalance={walletBalance}
        onOpenWallet={() => handleOpenSettings('billetera')}
        onTriggerSOS={() => setShowSOSModal(true)}
        hasActiveTrip={Boolean(activeTrip)}
        currentBrand={currentBrand}
        scheduledCount={scheduledBookings.length}
        onOpenScheduledBookings={() => setShowScheduledBookingsModal(true)}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenSettings('perfil')}
        onOpenHistory={() => handleOpenSettings('historial')}
        historyCount={tripHistory.length}
        themePreference={themePreference}
        effectiveTheme={effectiveTheme}
        onCycleTheme={handleCycleTheme}
        onOpenMobileSdkGuide={() => setShowMobileSdkGuide(true)}
        onOpenSettings={handleOpenSettings}
        language={language}
        showHomeHub={showHomeHub}
        onToggleHomeHub={() => setShowHomeHub((prev) => !prev)}
        onOpenAdminPanel={handleOpenAdminPanel}
        onOpenSplashScreen={() => setShowSplashScreen(true)}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onCloseAllModals={handleCloseAllModals}
        onOpenFlutterDesign={() => setShowFlutterDesignModal(true)}
        onLogout={handleLogoutUser}
      />

      {/* BANNER NACIONAL DE DIFUSIÓN / ALERTA EN VIVO DEL ADMINISTRADOR (Control Todo el País) */}
      {systemBroadcastAlert && systemBroadcastAlert.active && (
        <div
          className={`w-full px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-lg z-40 border-b animate-in slide-in-from-top duration-200 ${
            systemBroadcastAlert.severity === 'emergency'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-400'
              : systemBroadcastAlert.severity === 'warning'
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white border-amber-400'
              : 'bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 text-white border-sky-400'
          }`}
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto overflow-hidden text-ellipsis">
            <span className="text-base flex-shrink-0">
              {systemBroadcastAlert.severity === 'emergency' ? '🚨' : systemBroadcastAlert.severity === 'warning' ? '⚠️' : '📢'}
            </span>
            <div className="truncate">
              <strong className="uppercase tracking-wider mr-1.5">{systemBroadcastAlert.title}:</strong>
              <span>{systemBroadcastAlert.message}</span>
            </div>
            <span className="text-[10px] opacity-80 font-mono hidden md:inline flex-shrink-0">
              &bull; Emitido por Central AndesMovi ({systemBroadcastAlert.author})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <button
              onClick={() => handleOpenAdminPanel('dashboard')}
              className="px-2.5 py-1 rounded-lg bg-black/35 hover:bg-black/55 text-white text-[10px] font-black border border-white/20 transition-colors cursor-pointer"
            >
              Control Admin
            </button>
            <button
              onClick={() => setSystemBroadcastAlert((prev) => (prev ? { ...prev, active: false } : null))}
              className="p-1 text-white/80 hover:text-white rounded cursor-pointer"
              title="Ocultar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Active Role Status Banner (Unmistakable Mode Context) */}
      {userRole === 'conductor' && (
        <div className="w-full bg-amber-500/15 border-b-2 border-amber-500/40 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-amber-200 z-30 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-black tracking-wide text-amber-300">MODO CONDUCTOR</span>
            <span className="text-zinc-500 hidden sm:inline">•</span>

            {/* Botón muy pequeño para conductor: Activo / Fuera de servicio */}
            <button
              id="btn-conductor-status-header"
              type="button"
              onClick={() => {
                haptic.tap();
                setIsDriverActive((prev) => !prev);
              }}
              className={`h-6 sm:h-7 px-2 sm:px-2.5 rounded-lg border text-[10px] sm:text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer ${
                isDriverActive
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/60 ring-1 ring-rose-500/30'
              }`}
              title="Toca para cambiar entre Activo y Fuera de servicio"
            >
              <span className={`w-2 h-2 rounded-full ${isDriverActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <Power className="w-3 h-3" />
              <span>{isDriverActive ? 'Activo' : 'Fuera de servicio'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenSettings('billetera')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 font-bold border border-amber-500/40 transition-colors"
            >
              Saldo: {formatCurrency(walletBalance)}
            </button>
            <button
              onClick={() => handleSelectRole('cliente')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold border border-zinc-700 transition-colors"
            >
              Cambiar a Cliente
            </button>
          </div>
        </div>
      )}

      {userRole === 'admin' && (
        <div className="w-full bg-purple-950/70 border-b-2 border-purple-500/50 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-purple-200 z-30 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-black tracking-wide text-purple-300">MODO ADMINISTRADOR</span>
            <span className="text-zinc-500 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-purple-200 font-medium">
              {currentAdminUser?.fullName || 'Super Administrador'} • Sede Matriz: Tulcán (Carchi) • Control Operativo 24 Provincias
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdminPanel()}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black shadow-sm transition-colors cursor-pointer"
            >
              Abrir Panel Maestro
            </button>
            <button
              onClick={() => handleSelectRole('cliente')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold border border-zinc-700 transition-colors"
            >
              Salir a Cliente
            </button>
          </div>
        </div>
      )}

      {/* Floating Broadcast Notification Banner (Alerta a todos los conductores) */}
      {broadcastAlertNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-2xl bg-zinc-950/95 border-2 border-emerald-500 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white ring-4 ring-emerald-500/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-emerald-300">{broadcastAlertNotice.title}</span>
                  <span className="text-[10px] bg-emerald-500 text-zinc-950 font-black px-2 py-0.5 rounded-full">
                    {broadcastAlertNotice.driversCount} Conductores en Línea
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug line-clamp-2">
                  {broadcastAlertNotice.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setBroadcastAlertNotice(null)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors flex-shrink-0"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main App Body: Sidebar Panel + Full Interactive Map (El mapa permanece siempre montado para no perder posición ni sensibilidad al pedir carrera, encomienda, ejecutivo o delivery) */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Operational Sidebar */}
        <aside
          id="client-booking-sidebar"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          className={`w-full ${
            userRole === 'conductor'
              ? 'md:w-[390px] lg:w-[450px] xl:w-[500px]'
              : 'md:w-[350px] lg:w-[400px] xl:w-[450px]'
          } ${
            mobileView === 'map'
              ? 'hidden md:flex md:h-full md:order-1'
              : mobileView === 'panel'
              ? 'flex flex-1 h-full'
              : 'flex h-[56vh] md:h-full order-2 md:order-1'
          } overflow-y-auto ${
            effectiveTheme === 'dark'
              ? 'bg-zinc-950 border-zinc-800/80 text-zinc-100'
              : 'bg-[#FFFFFF] border-[#E5E7EB] text-[#111827]'
          } border-r p-3 sm:p-4 pb-24 flex-col gap-4 z-20 shadow-sm flex-shrink-0 transition-all duration-200`}
        >
          {/* Barra de arrastre exclusiva para Móvil (<= 768px): Toca únicamente esta barra para alternar a mapa */}
          <div
            id="btn-mobile-drag-handle"
            onTouchStart={handlePanelTouchStart}
            onTouchEnd={handlePanelTouchEnd}
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                haptic.tap();
                setMobileView('map');
              }
            }}
            className="md:hidden flex flex-col items-center justify-center py-2 -mt-1 cursor-pointer select-none group active:opacity-70"
            title="Toca o desliza esta barra para alternar al mapa"
          >
            <div className={`w-14 h-1.5 rounded-full transition-colors ${effectiveTheme === 'dark' ? 'bg-zinc-600 group-hover:bg-emerald-400' : 'bg-slate-400 group-hover:bg-emerald-600'}`} />
            <span className="text-[9px] text-zinc-400 group-hover:text-emerald-400 pt-0.5 font-bold tracking-tight">Toca aquí para ver mapa</span>
          </div>

          {/* Quick Notice when in full Panel mode to return to map or split */}
          {mobileView === 'panel' && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Panel Completo Activo
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-return-split-tablet"
                  onClick={() => {
                    haptic.tap();
                    setMobileView('split');
                  }}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center gap-1 active:scale-95 text-xs transition-transform cursor-pointer border border-zinc-700"
                  title="Dividir pantalla: mapa y panel"
                >
                  <Columns className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Dividido</span>
                </button>
                <button
                  id="btn-return-map-mobile"
                  onClick={() => {
                    haptic.tap();
                    setMobileView('map');
                  }}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-500 text-zinc-950 font-black flex items-center gap-1 active:scale-95 shadow-sm text-xs transition-transform cursor-pointer"
                  title="Ver mapa completo"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Ver Mapa</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Trip Tracker takes precedence if a service is underway or encomienda awaiting quote */}
          {activeTrip && activeTrip.status !== 'idle' && (activeTrip.serviceType === 'encomienda' || activeTrip.status !== 'searching_drivers') && userRole === 'cliente' ? (
            <ActiveTripTracker
              trip={activeTrip}
              onUpdateDriverPosition={handleUpdateDriverPosition}
              onCompleteTrip={handleCompleteTrip}
              onCancelTrip={handleCancelTrip}
              onOpenChat={handleOpenChat}
              onTriggerSOS={() => setShowSOSModal(true)}
              chatMessages={chatMessages}
              onSendChatMessage={handleSendChatMessage}
              unreadCount={unreadChatCount}
            />
          ) : userRole === 'conductor' ? (
            /* Driver Radar & Operations Portal */
            <DriverModeModal
              onAcceptIncomingJob={(job) => {
                // Keep coordinates in sync on the map
                if (job) {
                  setDestination({
                    lat: -0.1292,
                    lng: -78.3575,
                    name: job.destination,
                    address: job.destination,
                  });
                }
              }}
              onTakeOrder={handleDriverTakeOrder}
              availableRadarOrders={driverRadarOrders}
              onExitDriverMode={() => handleSelectRole('cliente')}
              walletBalance={walletBalance}
              onUpdateWalletBalance={handleUpdateWallet}
              currentUser={currentUser}
              onUpdateUser={setCurrentUser}
              driverDocuments={driverDocuments}
              onUpdateDriverDocuments={handleUpdateDriverDocuments}
              walletRecharges={walletRecharges}
              onAddRechargeRequest={handleAddRechargeRequest}
              payoutRequests={payoutRequests}
              onAddPayoutRequest={handleAddNewPayoutRequest}
              onRegisterNewDriver={handleRegisterNewDriver}
              systemTariffs={systemTariffs}
              onOpenAdminPanel={() => handleOpenAdminPanel()}
              isSuspendedByAdmin={Boolean(trackedDrivers.find((d) => d.name === currentUser?.name)?.isSuspended)}
              isOnline={isDriverActive}
              onToggleOnline={() => setIsDriverActive((prev) => !prev)}
              isDark={effectiveTheme === 'dark'}
              onCancelActiveTrip={handleCancelTrip}
              onRedeemRechargeBonus={handleRedeemRechargeBonus}
              onOpenRegister={() => {
                setUserRole('conductor');
                setRegistrationGateRole('conductor');
                setRegistrationGateTab('register');
                setIsRegistrationDismissed(false);
              }}
            />
          ) : userRole === 'admin' ? (
            /* Master Administrative Sidebar Hub */
            <AdminSidebarHub
              currentAdminUser={currentAdminUser}
              onOpenFullPanel={(initialTab) => {
                handleOpenAdminPanel(initialTab);
              }}
              onSwitchRole={handleSelectRole}
              onLogoutAdmin={handleAdminLogout}
              pendingRechargesCount={walletRecharges.filter((r) => r.status === 'pendiente').length}
              activeEncomiendasCount={adminEncomiendas.filter((e) => e.status !== 'entregada').length}
              trackedDriversCount={trackedDrivers.length}
              cantonsCount={cantonTariffs.length}
              isDark={effectiveTheme === 'dark'}
            />
          ) : (
            /* Passenger / Customer Modes */
            showHomeHub ? (
              <AndesMoviHomeHub
                isDark={effectiveTheme === 'dark'}
                onSelectService={(service) => {
                  setActiveService(service);
                  setShowHomeHub(false);
                }}
                onOpenAuth={() => {
                  handleOpenSettings('perfil');
                }}
                onOpenSupport={() => setShowSOSModal(true)}
                onOpenInterprovincial={() => {
                  setActiveService('ejecutivo_quito');
                  setShowHomeHub(false);
                }}
                onStartBookingNow={() => setShowHomeHub(false)}
                currentUser={currentUser}
                onOpenLoyaltyPromos={() => setShowLoyaltyPromosModal(true)}
                onOpenAdminPanel={handleOpenAdminPanel}
                onOpenFlutterDesign={() => setShowFlutterDesignModal(true)}
              />
            ) : (
              <>
                {/* BARRA DE SELECCIÓN DE VIAJES 4 EN 1 VISIBLE EN PANTALLA */}
                <div
                  className={`mx-3 sm:mx-4 mt-3 mb-2 p-2.5 rounded-2xl border-2 shadow-sm transition-all ${
                    effectiveTheme === 'dark'
                      ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-black/40'
                      : 'bg-white border-slate-300 text-slate-950 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span className={`text-[11px] font-black uppercase tracking-wider ${
                        effectiveTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'
                      }`}>
                        Selección de Viajes
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border ${
                        effectiveTheme === 'dark'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
                      }`}>
                        4 en 1
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          haptic.tap();
                          setShowHomeHub(true);
                        }}
                        className={`text-[11px] font-black transition-colors cursor-pointer ${
                          effectiveTheme === 'dark'
                            ? 'text-zinc-400 hover:text-zinc-200'
                            : 'text-slate-700 hover:text-slate-950'
                        }`}
                        title="Volver a la portada de inicio"
                      >
                        ← Inicio
                      </button>
                    </div>
                  </div>

                  {/* 4 servicios mostrados claramente en la pantalla */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* 1. Taxi */}
                    <button
                      id="btn-service-screen-taxi"
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        setActiveService('viaje');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                        activeService === 'viaje'
                          ? effectiveTheme === 'dark'
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20'
                            : 'bg-emerald-600 text-white border-emerald-700 font-black shadow-md ring-2 ring-emerald-500/30'
                          : effectiveTheme === 'dark'
                          ? 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 font-bold hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span className="text-[11px] font-black leading-tight">Taxi</span>
                    </button>

                    {/* 2. Ejecutivo (Quito / Interprovincial) */}
                    <button
                      id="btn-service-screen-ejecutivo"
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        setActiveService('ejecutivo_quito');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                        activeService === 'ejecutivo_quito'
                          ? effectiveTheme === 'dark'
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                            : 'bg-amber-600 text-white border-amber-700 font-black shadow-md ring-2 ring-amber-500/30'
                          : effectiveTheme === 'dark'
                          ? 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 font-bold hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      <div className="relative">
                        <Car className="w-4 h-4" />
                        <span className="absolute -top-1 -right-1 text-[8px] font-black text-amber-300">★</span>
                      </div>
                      <span className="text-[11px] font-black leading-tight">Ejecutivo</span>
                    </button>

                    {/* 3. Encomiendas */}
                    <button
                      id="btn-service-screen-encomienda"
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        setActiveService('encomienda');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                        activeService === 'encomienda'
                          ? effectiveTheme === 'dark'
                            ? 'bg-blue-500 text-white border-blue-400 font-black shadow-md shadow-blue-500/20'
                            : 'bg-blue-600 text-white border-blue-700 font-black shadow-md ring-2 ring-blue-500/30'
                          : effectiveTheme === 'dark'
                          ? 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 font-bold hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span className="text-[11px] font-black leading-tight">Encomienda</span>
                    </button>

                    {/* 4. Domicilios */}
                    <button
                      id="btn-service-screen-domicilio"
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        setActiveService('domicilio');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                        activeService === 'domicilio'
                          ? effectiveTheme === 'dark'
                            ? 'bg-purple-500 text-white border-purple-400 font-black shadow-md shadow-purple-500/20'
                            : 'bg-purple-600 text-white border-purple-700 font-black shadow-md ring-2 ring-purple-500/30'
                          : effectiveTheme === 'dark'
                          ? 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300 font-bold hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span className="text-[11px] font-black leading-tight">Domicilio</span>
                    </button>
                  </div>
                </div>

                {(activeService === 'viaje' || activeService === 'ejecutivo_quito') && (
                  <>
                    {activeService === 'ejecutivo_quito' && (
                      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 shadow-xs mb-1 ${
                        effectiveTheme === 'dark'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            ★
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black leading-tight truncate">Viajes Ejecutivos</p>
                            <p className="text-[10px] opacity-80 leading-tight">Turnos y rutas interprovinciales en Ecuador</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            haptic.tap();
                            setShowExecutiveAdvanceModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer"
                        >
                          Ver Turnos y Asientos
                        </button>
                      </div>
                    )}
                    <RideBooking
                      isDark={effectiveTheme === 'dark'}
                      origin={origin}
                      destination={destination}
                      intermediateStops={intermediateStops}
                      onChangeIntermediateStops={setIntermediateStops}
                      onSelectOrigin={setOrigin}
                      onSelectDestination={setDestination}
                      onRequestPickOnMap={(mode) => {
                        setSelectionMode(mode);
                        setMobileView('map');
                      }}
                      onStartSearch={handleStartRideSearch}
                      isSearching={isSearchingRides}
                      onCancelSearch={() => {
                        setIsSearchingRides(false);
                        setActiveTrip(null);
                      }}
                      onAcceptDriverOffer={handleAcceptDriverOffer}
                      onOpenSchedule={handleOpenScheduleViaje}
                      systemTariffs={systemTariffs}
                      initialInterprovincial={activeService === 'ejecutivo_quito'}
                      tarifaCalculada={tarifaCalculada}
                      ofertaUsuario={ofertaUsuario}
                      onUserOfferChange={handleUserOfferChange}
                      infoRuta={infoRuta}
                      esPrecioFijo={esPrecioFijo}
                      currentUser={currentUser}
                      onOpenRegister={() => {
                        setUserRole('cliente');
                        setRegistrationGateRole('cliente');
                        setRegistrationGateTab('register');
                        setIsRegistrationDismissed(false);
                      }}
                    />
                  </>
                )}

                {activeService === 'domicilio' && (
                  <DeliveryBooking
                    isDark={effectiveTheme === 'dark'}
                    userLocation={origin}
                    onConfirmOrder={handleConfirmDeliveryOrder}
                    onOpenSchedule={handleOpenScheduleDelivery}
                    systemTariffs={systemTariffs}
                    currentUser={currentUser}
                    onOpenRegister={() => {
                      setUserRole('cliente');
                      setRegistrationGateRole('cliente');
                      setRegistrationGateTab('register');
                      setIsRegistrationDismissed(false);
                    }}
                  />
                )}

                {activeService === 'encomienda' && (
                  <ParcelBooking
                    isDark={effectiveTheme === 'dark'}
                    origin={origin}
                    destination={destination}
                    onSelectOrigin={setOrigin}
                    onSelectDestination={setDestination}
                    onRequestPickOnMap={(mode) => {
                      setSelectionMode(mode);
                      setMobileView('map');
                    }}
                    onConfirmParcel={handleConfirmParcelOrder}
                    onOpenSchedule={handleOpenScheduleParcel}
                    onOpenAlliedCooperatives={() => setShowAlliedCooperativesModal(true)}
                    systemTariffs={systemTariffs}
                    currentUser={currentUser}
                    onOpenRegister={() => {
                      setUserRole('cliente');
                      setRegistrationGateRole('cliente');
                      setRegistrationGateTab('register');
                      setIsRegistrationDismissed(false);
                    }}
                  />
                )}
              </>
            )
          )}
        </aside>

        {/* Right Map Canvas (Live GPS & Route) */}
        <main
          className={`map-container flex-1 min-w-0 min-h-0 ${
            mobileView === 'panel'
              ? 'hidden md:flex md:h-full md:order-2'
              : mobileView === 'map'
              ? 'flex h-full w-full'
              : 'flex h-[44vh] md:h-full order-1 md:order-2'
          } relative transition-all duration-200`}
          style={{ width: '100%', height: '100%', minHeight: mobileView === 'split' ? '220px' : '400px' }}
        >
          <MapComponent
            origin={origin}
            destination={destination}
            intermediateStops={intermediateStops}
            activeDriver={activeDriver}
            tripStatus={activeTrip?.status || 'idle'}
            onSelectCoordinates={handleSelectCoordinatesFromMap}
            selectionMode={selectionMode}
            serviceType={activeService}
            systemTariffs={systemTariffs}
            isDarkMode={effectiveTheme === 'dark'}
            effectiveTheme={effectiveTheme}
            tarifaCalculada={tarifaCalculada}
            ofertaUsuario={ofertaUsuario}
            onUserOfferChange={handleUserOfferChange}
            onRouteCalculated={handleRouteCalculated}
            isSidePanelVisible={mobileView !== 'map'}
            onOpenMobileSdkGuide={() => setShowMobileSdkGuide(true)}
            isDriverMode={userRole === 'conductor'}
            onRequestRide={(_offeredFare) => {
              haptic.confirmTrip();
              setMobileView('panel');
            }}
          />

          {/* Botón flotante para conductor en el mapa: Activo / Fuera de servicio (muy visible) */}
          {userRole === 'conductor' && (
            <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-30 pointer-events-auto">
              <button
                id="btn-map-driver-status-toggle"
                type="button"
                onClick={() => {
                  haptic.tap();
                  setIsDriverActive((prev) => !prev);
                }}
                className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-2xl border-2 text-xs font-black flex items-center gap-2 transition-all active:scale-95 backdrop-blur-xl cursor-pointer select-none shadow-[0_8px_30px_rgb(0,0,0,0.45)] ring-2 ${
                  isDriverActive
                    ? effectiveTheme === 'dark'
                      ? 'bg-zinc-950/95 text-emerald-400 border-emerald-400 ring-emerald-500/50 shadow-emerald-950/80'
                      : 'bg-white text-emerald-700 border-emerald-500 ring-emerald-400/40 shadow-emerald-900/30'
                    : effectiveTheme === 'dark'
                    ? 'bg-zinc-950/95 text-rose-300 border-rose-400 ring-rose-500/50 shadow-rose-950/80'
                    : 'bg-white text-rose-700 border-rose-500 ring-rose-400/40 shadow-rose-900/30'
                }`}
                title="Estado del conductor: Toca para cambiar entre Activo y Fuera de servicio"
              >
                <span className={`w-2.5 h-2.5 rounded-full ring-2 ${
                  isDriverActive
                    ? 'bg-emerald-400 ring-emerald-400/40 animate-pulse'
                    : 'bg-rose-500 ring-rose-500/40'
                }`} />
                <Power className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="tracking-wide">{isDriverActive ? 'Activo' : 'Fuera de servicio'}</span>
              </button>
            </div>
          )}
        </main>

        {/* Floating Glassmorphic View Controller Bar (Mapa | Dividido | Panel) - Posicionado más abajo del mapa en modo móvil */}
        <div
          className={`absolute ${
            mobileView === 'split'
              ? 'top-[41vh] md:top-4 scale-[0.82] sm:scale-100'
              : 'top-3 md:top-4 scale-[0.82] sm:scale-100'
          } left-1/2 -translate-x-1/2 z-45 pointer-events-none flex justify-center w-auto max-w-[95%] transition-all duration-200`}
        >
          <div
            className="view-controller-container pointer-events-auto flex items-center p-0.5 sm:p-1 rounded-full border shadow-xl backdrop-blur-md transition-all gap-0.5 sm:gap-1 select-none"
            style={
              effectiveTheme === 'dark'
                ? {
                    background: 'rgba(18, 18, 18, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                  }
                : {
                    background: '#FFFFFF',
                    border: '2px solid #E5E7EB',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                  }
            }
          >
            <button
              id="btn-view-map"
              type="button"
              onClick={() => {
                haptic.tap();
                setMobileView('map');
              }}
              className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer border-none view-controller-btn ${
                mobileView === 'map'
                  ? 'text-white font-bold'
                  : effectiveTheme === 'dark'
                  ? 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
                  : 'text-[#374151] hover:text-[#111827] font-bold hover:bg-[#F4F6F9]'
              }`}
              style={
                mobileView === 'map'
                  ? { background: '#0052FF', color: '#FFFFFF', fontWeight: 800 }
                  : undefined
              }
              title="Ver mapa en pantalla completa"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Mapa</span>
            </button>

            <button
              id="btn-view-split"
              type="button"
              onClick={() => {
                haptic.tap();
                setMobileView('split');
              }}
              className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer border-none view-controller-btn ${
                mobileView === 'split'
                  ? 'text-white font-bold'
                  : effectiveTheme === 'dark'
                  ? 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
                  : 'text-[#374151] hover:text-[#111827] font-bold hover:bg-[#F4F6F9]'
              }`}
              style={
                mobileView === 'split'
                  ? { background: '#0052FF', color: '#FFFFFF', fontWeight: 800 }
                  : undefined
              }
              title="Vista dividida (Mapa + Panel)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dividido</span>
            </button>

            <button
              id="btn-view-panel"
              type="button"
              onClick={() => {
                haptic.tap();
                setMobileView('panel');
              }}
              className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer border-none view-controller-btn ${
                mobileView === 'panel'
                  ? 'text-white font-bold'
                  : effectiveTheme === 'dark'
                  ? 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
                  : 'text-[#374151] hover:text-[#111827] font-bold hover:bg-[#F4F6F9]'
              }`}
              style={
                mobileView === 'panel'
                  ? { background: '#0052FF', color: '#FFFFFF', fontWeight: 800 }
                  : undefined
              }
              title="Ver panel completo con opciones y formulario"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Panel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Avanzado de Turno Ejecutivo (Croquis de Asientos, Voucher y Cuentas Bancarias) */}
      {showExecutiveAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowExecutiveAdvanceModal(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors shadow-md"
              title="Cerrar y volver al mapa"
            >
              <X className="w-5 h-5" />
            </button>
            <ExecutiveBookingView
              isDark={effectiveTheme === 'dark'}
              activeService={activeService}
              onChangeService={(svc) => {
                setActiveService(svc);
                setShowExecutiveAdvanceModal(false);
              }}
              systemTariffs={systemTariffs}
              onConfirmBooking={(data) => {
                handleConfirmExecutiveBooking(data);
                setShowExecutiveAdvanceModal(false);
              }}
              onCancelBooking={() => setShowExecutiveAdvanceModal(false)}
              isSearching={isSearchingRides || activeTrip?.status === 'searching_drivers'}
              currentUser={currentUser}
              onSelectOrigin={setOrigin}
              onSelectDestination={setDestination}
            />
          </div>
        </div>
      )}

      {/* Payment Processing Modal (Ecuador USD Gateway) */}
      {pendingPaymentData && (
        <PaymentModal
          amount={pendingPaymentData.amount}
          serviceTitle={pendingPaymentData.title}
          walletBalance={walletBalance}
          onPaymentSuccess={pendingPaymentData.onSuccess}
          onClose={() => setPendingPaymentData(null)}
        />
      )}

      {/* Driver/Customer Real-Time Closed Chat Modal */}
      {showChatModal && activeDriver && (
        <ChatModal
          driver={activeDriver}
          messages={chatMessages}
          onSendMessage={handleSendChatMessage}
          userLocation={origin}
          onClose={() => setShowChatModal(false)}
          onStartCall={() => {
            setShowChatModal(false);
            setVoIPCallParticipant({
              name: activeDriver.name,
              avatar: activeDriver.avatar,
              role: 'conductor',
              vehicleInfo: `${activeDriver.vehicle.model} • ${activeDriver.vehicle.plate}`,
              phoneMasked: activeDriver.phone,
            });
            setIsVoIPCallIncoming(false);
            setShowVoIPCallModal(true);
          }}
          senderRole="cliente"
          clientName={currentUser?.name || 'Cliente Pasajero'}
          clientAvatar={currentUser?.avatar}
        />
      )}

      {/* In-App VoIP / WebRTC Call Modal (Client & Driver) */}
      {showVoIPCallModal && voIPCallParticipant && (
        <CallModal
          participant={voIPCallParticipant}
          isIncoming={isVoIPCallIncoming}
          onClose={() => {
            setShowVoIPCallModal(false);
            setVoIPCallParticipant(null);
            setIsVoIPCallIncoming(false);
          }}
        />
      )}

      {/* Digital Wallet Modal */}
      {showWalletModal && (
        <WalletModal
          balance={walletBalance}
          onTopUp={(amt) => setWalletBalance((prev) => Number((prev + amt).toFixed(2)))}
          onAddRechargeRequest={handleAddRechargeRequest}
          walletRecharges={walletRecharges}
          currentUserName={currentUser?.name}
          currentUserPhone={currentUser?.phone}
          currentUser={currentUser}
          onRedeemRechargeBonus={handleRedeemRechargeBonus}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      {/* SOS Emergency Security Modal (ECU 911) */}
      {showSOSModal && (
        <SOSModal
          currentLocation={origin}
          emergencyContacts={currentUser?.emergencyContacts}
          currentUser={currentUser}
          userRole={userRole === 'conductor' ? 'driver' : 'passenger'}
          activeTrip={activeTrip}
          onOpenSettingsSOS={() => {
            setShowSOSModal(false);
            handleOpenSettings('contactos_sos');
          }}
          onClose={() => setShowSOSModal(false)}
          onTriggerAdminSos={handleTriggerAdminSos}
        />
      )}

      {/* Schedule Booking Modal */}
      {showScheduleModal && scheduleContext && (
        <ScheduleModal
          serviceType={scheduleContext.serviceType}
          origin={scheduleContext.origin}
          destination={scheduleContext.destination}
          basePrice={scheduleContext.basePrice}
          isDark={effectiveTheme === 'dark'}
          onConfirmSchedule={handleConfirmScheduleBooking}
          onClose={() => {
            setShowScheduleModal(false);
            setScheduleContext(null);
          }}
        />
      )}

      {/* Scheduled Bookings Overview List */}
      {showScheduledBookingsModal && (
        <ScheduledBookingsModal
          bookings={scheduledBookings}
          isDark={effectiveTheme === 'dark'}
          onCancelBooking={handleCancelScheduledBooking}
          onStartBookingNow={handleStartBookingNow}
          onClose={() => setShowScheduledBookingsModal(false)}
        />
      )}

      {/* Mutual Rating Modal (Passenger & Driver) */}
      {tripToRate && (
        <RatingModal
          trip={tripToRate}
          isDark={effectiveTheme === 'dark'}
          onSubmitRating={(passengerRating, _driverRating) => {
              if (tripToRate && tripToRate.selectedDriver) {
              const completedItem: TripHistoryItem = {
                id: tripToRate.id,
                serviceType: tripToRate.serviceType,
                date: new Date().toLocaleDateString('es-EC', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                timestamp: Date.now(),
                origin: tripToRate.origin,
                destination: tripToRate.destination,
                driver: tripToRate.selectedDriver,
                priceUsd: tripToRate.offeredPrice,
                paymentMethod: tripToRate.paymentMethod,
                status: 'completado',
                starsGiven: passengerRating.stars,
                tagsGiven: passengerRating.tags,
                notes: passengerRating.feedback,
                receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
                tipUsd: passengerRating.tipUsd || 0,
                parcelDetails: tripToRate.parcelDetails,
                deliveryItems: tripToRate.deliveryItems,
                restaurantName: tripToRate.restaurantName,
              };
              setTripHistory((prev) => [completedItem, ...prev]);

              // Update DatabaseService for Admin Panel
              if (tripToRate) {
                databaseService.updateTripStatus(tripToRate.id, 'finalizado');
              }

              // Log trip completed activity for Admin Feed
              const isInterprovincial = tripToRate.isInterprovincial || tripToRate.distanceKm > 20;
              const isEncomienda = tripToRate.serviceType === 'encomienda' || tripToRate.parcelDetails !== undefined || tripToRate.id.includes('parcel') || String(tripToRate.serviceType).includes('encomienda');
              const isInterprovincialEncomienda = isInterprovincial && isEncomienda;
              const calculatedCommissionRate = isInterprovincialEncomienda ? 0.09 : 0.07;
              const commissionLabel = isInterprovincialEncomienda ? 'Comisión Encomienda Interprovincial 9%' : 'Comisión 7%';

              logAdminActivity({
                type: 'trip_completed',
                actorName: tripToRate.selectedDriver?.name || 'Conductor AndesMovi',
                actorRole: 'conductor',
                title: 'Servicio Concluido y Liquidado',
                description: `Viaje finalizado (${tripToRate.origin.name || 'Origen'} → ${tripToRate.destination.name || 'Destino'}). Cobrado: $${completedItem.priceUsd.toFixed(2)} USD. ${commissionLabel}: $${(completedItem.priceUsd * calculatedCommissionRate).toFixed(2)} USD. Calificación: ${passengerRating.stars} estrellas.`,
                amount: completedItem.priceUsd,
                serviceType: tripToRate.serviceType,
              });
            }
            setTripToRate(null);
          }}
          onClose={() => setTripToRate(null)}
        />
      )}

      {/* Customer Authentication & Verification Modal (Google, Facebook, iCloud, Cédula, Teléfono) */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          isDark={effectiveTheme === 'dark'}
          onLoginSuccess={(user) => {
            try {
              localStorage.setItem('andesmovi_user_session', JSON.stringify(user));
            } catch (e) {
              console.error(e);
            }
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
          onRegisterNewDriver={handleRegisterNewDriver}
          onLogout={() => {
            handleLogoutUser();
            setShowAuthModal(false);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Customer Request History Modal (Consultar historial) */}
      {showHistoryModal && (
        <TripHistoryModal
          history={tripHistory}
          isDark={effectiveTheme === 'dark'}
          onRepeatTrip={handleRepeatTrip}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Loyalty Program and Driver Promotions Modal */}
      {showLoyaltyPromosModal && (
        <LoyaltyPromosModal
          isOpen={showLoyaltyPromosModal}
          onClose={() => setShowLoyaltyPromosModal(false)}
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('andesmovi_current_user', JSON.stringify(updated));
          }}
          isDark={effectiveTheme === 'dark'}
          walletBalance={walletBalance}
          onRedeemRechargeBonus={handleRedeemRechargeBonus}
        />
      )}

      {/* Unified Settings & Configuration Modal (Perfil, Billetera 7%, Idioma Quechua, Notificaciones, etc.) */}
      {showSettingsModal && (
        <SettingsModal
          currentUser={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          walletBalance={walletBalance}
          onUpdateWallet={(newBal) => setWalletBalance(newBal)}
          userRole={userRole}
          onToggleRole={() => setUserRole((prev) => (prev === 'cliente' ? 'conductor' : 'cliente'))}
          language={language}
          onChangeLanguage={handleLanguageChange}
          tripHistory={tripHistory}
          onOpenHistoryDirectly={() => setShowHistoryModal(true)}
          onLogout={() => {
            handleLogoutUser();
            setShowSettingsModal(false);
          }}
          onDeleteAccount={handleDeleteAccount}
          onClose={() => setShowSettingsModal(false)}
          initialSection={settingsInitialSection}
          isDark={effectiveTheme === 'dark'}
          walletRecharges={walletRecharges}
          onAddRechargeRequest={handleAddRechargeRequest}
        />
      )}

      {/* Master Admin Control Panel Modal (Tarifas, Recargas, División de Encomiendas, Cantones y Telemetría) */}
      {showAdminPanel && (
        <AdminPanelModal
          isOpen={showAdminPanel}
          isDark={effectiveTheme === 'dark'}
          onClose={() => setShowAdminPanel(false)}
          tariffs={systemTariffs}
          onUpdateTariffs={(newTariffs) => {
            setSystemTariffs(newTariffs);
            try {
              localStorage.setItem('andesmovi_system_tariffs', JSON.stringify(newTariffs));
            } catch (e) {
              console.warn('Error saving system tariffs', e);
            }
            logAdminActivity({
              type: 'system_alert',
              actorName: currentAdminUser?.fullName || 'Super Administrador',
              actorRole: 'admin',
              title: 'Tarifas del Sistema Actualizadas en Vivo',
              description: `Base: $${newTariffs.rideBaseFareUsd} • Km: $${newTariffs.rideExtraPerKmUsd ?? newTariffs.ridePerKmUsd} • Comisión: ${newTariffs.platformCommissionPercent}%`,
            });
          }}
          cantonTariffs={cantonTariffs}
          onUpdateCantonTariffs={(newCantonTariffs) => setCantonTariffs(newCantonTariffs)}
          recharges={walletRecharges}
          onUpdateRecharges={handleUpdateRecharges}
          payoutRequests={payoutRequests}
          onUpdatePayoutRequests={handleUpdatePayoutRequests}
          encomiendas={adminEncomiendas}
          onUpdateEncomiendas={(newEnc) => setAdminEncomiendas(newEnc)}
          drivers={trackedDrivers}
          onUpdateDrivers={(updated) => setTrackedDrivers(updated)}
          driverDocuments={driverDocuments}
          onUpdateDriverDocuments={handleUpdateDriverDocuments}
          driverWalletBalance={walletBalance}
          onAdjustDriverWallet={handleAdjustDriverWallet}
          currentAdminUser={currentAdminUser}
          onAdminLogout={handleAdminLogout}
          adminWorkers={adminWorkers}
          onUpdateAdminWorkers={(updated) => setAdminWorkers(updated)}
          initialTab={adminInitialTab}
          adminActivityEvents={adminActivityEvents}
          clientActiveTrip={activeTrip}
          tripHistory={tripHistory}
          driverRadarOrders={driverRadarOrders}
          onApproveDriverRegistration={handleApproveDriverRegistration}
          onUpdateTripStatus={handleAdminUpdateTripStatus}
          onDispatchManualTrip={handleAdminDispatchManualTrip}
          onToggleSuspendDriver={handleToggleSuspendDriver}
          systemBroadcastAlert={systemBroadcastAlert}
          onUpdateBroadcastAlert={(alert) =>
            setSystemBroadcastAlert(
              alert
                ? {
                    ...alert,
                    id: `alert-${Date.now()}`,
                    author: currentAdminUser?.fullName || 'Super Admin',
                  }
                : null
            )
          }
          activeSosAlerts={activeSosAlerts}
          onResolveSosAlert={handleResolveSosAlert}
          onDeleteDriver={(driverId) => setTrackedDrivers((prev) => prev.filter((d) => d.id !== driverId))}
          onDeleteAdminActivityEvent={(id) => setAdminActivityEvents((prev) => prev.filter((e) => e.id !== id))}
          onClearAdminActivityEvents={() => setAdminActivityEvents([])}
        />
      )}

      {/* Admin Login Gate Modal (Restringido para John Yepez 1004721351, Esmeralda López 1004567663 y Trabajadores 24 Provincias) */}
      {showAdminLoginGate && (
        <AdminLoginGateModal
          isOpen={showAdminLoginGate}
          onClose={() => {
            setShowAdminLoginGate(false);
            if (userRole === 'admin' && (!currentAdminUser || !currentAdminUser.isActive)) {
              setUserRole('cliente');
            }
          }}
          onLoginSuccess={handleAdminLoginSuccess}
          workers={adminWorkers}
        />
      )}

      {/* Pantalla de Bienvenida / Splash Screen Animada AndesMovi (Portal de Acceso y Autenticación) */}
      {showSplashScreen && (
        <SplashScreen
          currentUser={currentUser}
          onComplete={() => setShowSplashScreen(false)}
          onLoginSuccess={(user, docs) => {
            handleCompleteRegistration(user, docs);
            setShowSplashScreen(false);
          }}
          onLogout={handleLogoutUser}
          onOpenLogin={(role) => {
            setUserRole(role);
            setRegistrationGateRole(role);
            setRegistrationGateTab('login');
            setIsRegistrationDismissed(false);
            setShowSplashScreen(false);
          }}
          onOpenRegister={(role) => {
            setUserRole(role);
            setRegistrationGateRole(role);
            setRegistrationGateTab('register');
            setIsRegistrationDismissed(false);
            setShowSplashScreen(false);
          }}
          onSelectRole={(role) => {
            setUserRole(role);
            setRegistrationGateRole(role);
            setIsRegistrationDismissed(false);
          }}
          onOpenAdminLogin={() => {
            setShowSplashScreen(false);
            handleOpenAdminPanel();
          }}
        />
      )}

      {/* Live Connectivity (3G/4G/5G/Wi-Fi) Floating Network Status Banner */}
      <NetworkStatusBanner />

      {/* Floating Real-time Push Notification Toast Banner */}
      <PushNotificationToast
        notification={activePushToast}
        onClose={() => setActivePushToast(null)}
        onClickAction={(notif) => {
          if (notif.category === 'chat_message') {
            handleOpenChat();
          } else {
            setMobileView('split');
          }
        }}
      />

      {/* Push Notification Center & Preferences Modal */}
      {isNotificationCenterOpen && (
        <NotificationCenterModal
          onClose={() => {
            setIsNotificationCenterOpen(false);
            setUnreadNotificationCount(
              pushNotificationService.getStoredNotifications().filter((n) => !n.read).length
            );
          }}
          onOpenChat={handleOpenChat}
        />
      )}

      {/* Modal Directorio de Cooperativas Aliadas (11 Empresas) */}
      <AlliedCooperativesModal
        isOpen={showAlliedCooperativesModal}
        onClose={() => setShowAlliedCooperativesModal(false)}
        isDark={effectiveTheme === 'dark'}
        onSelectCooperative={(coop) => {
          setActiveService('encomienda');
          setShowHomeHub(false);
        }}
      />

      {/* Bloqueo Obligatorio de Registro y Documentos (Cédula de Identidad, Licencia y Documentos Oficiales) */}
      <RegistrationGateModal
        isOpen={!showSplashScreen && !currentUser && !isRegistrationDismissed}
        isDark={effectiveTheme === 'dark'}
        initialTab={registrationGateTab}
        initialRole={registrationGateRole}
        onClose={() => setIsRegistrationDismissed(true)}
        onCompleteRegistration={handleCompleteRegistration}
        onLoginSuccess={(loggedUser) => {
          try {
            localStorage.setItem('andesmovi_user_session', JSON.stringify(loggedUser));
          } catch (e) {
            console.error(e);
          }
          setCurrentUser(loggedUser);
          if (loggedUser.role === 'conductor') {
            setUserRole('conductor');
          }
        }}
      />

      {/* FLOATING MASTER ADMIN CONTROLLER (Control Maestro Ubicuo en Toda la Aplicación) */}
      {userRole === 'admin' && (
        <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2">
          <button
            id="btn-floating-master-admin"
            onClick={() => handleOpenAdminPanel()}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs flex items-center gap-2 shadow-2xl shadow-orange-950/80 border-2 border-amber-300/60 active:scale-95 transition-all group backdrop-blur-md cursor-pointer"
            title="Panel Maestro de Administrador (Gobernanza Total de Toda la Aplicación)"
          >
            <Shield className="w-4 h-4 text-yellow-300 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Control Maestro Admin</span>
            <span className="sm:hidden">Admin</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] text-amber-200 font-mono">
              {trackedDrivers.length} unidades
            </span>
          </button>

          {systemBroadcastAlert?.active && (
            <button
              onClick={() => handleOpenAdminPanel('dashboard')}
              className="px-2.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold border border-red-400 flex items-center gap-1 shadow-lg animate-pulse cursor-pointer"
              title="Alerta nacional activa - Click para ver"
            >
              <span>📢</span>
              <span className="hidden md:inline">Alerta Activa</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

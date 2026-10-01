import React, { useState, useRef, useEffect } from 'react';
import { ServiceType, UserRole, AppBrand, UserProfile } from '../types';
import { ThemePreference, EffectiveTheme } from '../utils/themeManager';
import { formatCurrency } from '../utils/geoUtils';
import { LanguageCode, getTranslation } from '../utils/i18n';
import { SettingsSection } from './SettingsModal';
import { haptic } from '../utils/haptics';
import { AndesMovi3DLogoSVG } from './AnimatedAndesMoviLogo';
import {
  Car,
  ShoppingBag,
  Package,
  ShieldAlert,
  Wallet,
  RefreshCw,
  Calendar,
  Sparkles,
  User,
  History,
  ShieldCheck,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Settings,
  Banknote,
  Mountain,
  Menu,
  X,
  ChevronDown,
  Shield,
  LogOut,
  Sliders,
  Calculator,
  Bell,
  MoreVertical,
  Heart,
  Check,
  Lock,
  FileText,
  ArrowLeft,
  Phone,
} from 'lucide-react';

interface NavbarProps {
  activeService: ServiceType;
  onSelectService: (service: ServiceType) => void;
  userRole: UserRole;
  onToggleRole?: () => void;
  onSelectRole: (role: UserRole) => void;
  walletBalance: number;
  onOpenWallet: () => void;
  onTriggerSOS: () => void;
  hasActiveTrip: boolean;
  currentBrand: AppBrand;
  scheduledCount: number;
  onOpenScheduledBookings: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  themePreference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  onCycleTheme: () => void;
  onOpenMobileSdkGuide: () => void;
  onOpenSettings: (section?: SettingsSection) => void;
  language: LanguageCode;
  showHomeHub?: boolean;
  onToggleHomeHub?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenSplashScreen?: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenFlutterDesign?: () => void;
  onLogout?: () => void;
  onCloseAllModals?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeService,
  onSelectService,
  userRole,
  onToggleRole,
  onSelectRole,
  walletBalance,
  onOpenWallet,
  onTriggerSOS,
  hasActiveTrip,
  currentBrand,
  scheduledCount,
  onOpenScheduledBookings,
  currentUser,
  onOpenAuth,
  onOpenHistory,
  historyCount,
  themePreference,
  effectiveTheme,
  onCycleTheme,
  onOpenMobileSdkGuide,
  onOpenSettings,
  language,
  showHomeHub,
  onToggleHomeHub,
  onOpenAdminPanel,
  onOpenSplashScreen,
  unreadNotificationCount,
  onOpenNotifications,
  onOpenFlutterDesign,
  onLogout,
  onCloseAllModals,
}) => {
  const isDark = effectiveTheme === 'dark';
  const t = (k: string) => getTranslation(k, language);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Unified Services Dropdown State (Viajes, Encomiendas y Domicilios en un solo botón)
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileServicesDropdownOpen, setIsMobileServicesDropdownOpen] = useState(false);
  const mobileServicesDropdownRef = useRef<HTMLDivElement>(null);


  // Secret 5-tap counter on AndesMovi logo (triggers Admin Login Gate in <3s)
  const logoTapCountRef = useRef<number>(0);
  const logoTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = (e: React.MouseEvent) => {
    e.preventDefault();
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
      if (onOpenAdminPanel) {
        onOpenAdminPanel();
      }
      return;
    }

    // Standard single tap behavior
    haptic.tap();
    if (onToggleHomeHub) {
      onToggleHomeHub();
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target as Node)) {
        setIsServicesDropdownOpen(false);
      }
      if (mobileServicesDropdownRef.current && !mobileServicesDropdownRef.current.contains(event.target as Node)) {
        setIsMobileServicesDropdownOpen(false);
      }
    };
    if (isMenuOpen || isServicesDropdownOpen || isMobileServicesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isServicesDropdownOpen, isMobileServicesDropdownOpen]);

  return (
    <header
      className={`w-full border-b backdrop-blur-md px-3 sm:px-5 py-2 pt-safe sticky top-0 z-40 transition-colors duration-200 ${
        isDark
          ? 'bg-zinc-950/95 border-zinc-800/80 text-zinc-100'
          : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* BOTÓN DE RETROCESO A BIENVENIDA & BRAND LOGO */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="z-50 pointer-events-auto">
            <button
              id="btn-navbar-retroceso-bienvenida"
              type="button"
              onClick={() => {
                haptic.impactLight();
                if (onCloseAllModals) {
                  onCloseAllModals();
                }
                if (onOpenSplashScreen) {
                  onOpenSplashScreen();
                } else if (window.history.length > 1) {
                  window.history.back();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 border border-amber-500/40 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Boton de Retroceso: Regresar a la Pantalla de Bienvenida"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5] text-amber-400" />
              <span className="hidden xs:inline tracking-tight">Bienvenida</span>
            </button>
          </div>

          <div className="pointer-events-none">
            <button
              id="brand-home-link"
              onClick={handleLogoTap}
              className="flex items-center gap-2 group text-left transition-transform active:scale-95 cursor-pointer pointer-events-auto select-none"
              title="AndesMovi Ecuador"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-950 font-black text-xl flex items-center justify-center tracking-tighter shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform border border-amber-500/40 flex-shrink-0 p-0.5 overflow-hidden">
                <AndesMovi3DLogoSVG className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-lg sm:text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentBrand.name}
                </span>
                <span className="hidden xs:block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30">
                  CAYEMBE
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* BOTÓN DIRECTO "🗺️ MAPA GPS" EN BARRAS DE NAVEGACIÓN */}
        <button
          id="btn-navbar-ver-mapa-directo"
          type="button"
          onClick={() => {
            haptic.tap();
            if (showHomeHub && onToggleHomeHub) onToggleHomeHub();
            if (onCloseAllModals) onCloseAllModals();
          }}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-transform cursor-pointer shrink-0"
          title="Abrir mapa interactivo GPS en vivo"
        >
          <span className="text-sm">🗺️</span>
          <span>Mapa GPS</span>
        </button>
        {userRole === 'cliente' ? (
          <nav
            aria-label="Servicios Principales"
            className={`hidden md:flex items-center p-1 rounded-xl border transition-colors ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {onToggleHomeHub && (
              <button
                id="tab-service-inicio"
                onClick={onToggleHomeHub}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showHomeHub
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm font-bold border border-amber-400/40'
                    : isDark
                    ? 'text-amber-300 hover:text-white hover:bg-zinc-800/60'
                    : 'text-amber-800 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>
            )}

            {/* BOTÓN UNIFICADO: VIAJES, ENCOMIENDAS Y DOMICILIOS EN UN SOLO BOTÓN */}
            <div className="relative" ref={servicesDropdownRef}>
              <button
                id="btn-unified-services-desktop"
                type="button"
                onClick={() => {
                  haptic.tap();
                  setIsServicesDropdownOpen((prev) => !prev);
                }}
                disabled={hasActiveTrip}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  !showHomeHub
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm font-black'
                    : isDark
                    ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/70 border border-zinc-750'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-300'
                } ${hasActiveTrip ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Servicios: Viajes, Encomiendas y Domicilios (Clic para cambiar servicio)"
              >
                <div className="flex items-center gap-1.5">
                  {activeService === 'viaje' ? (
                    <Car className="w-3.5 h-3.5" />
                  ) : activeService === 'encomienda' ? (
                    <Package className="w-3.5 h-3.5" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {activeService === 'viaje'
                      ? 'Taxi'
                      : activeService === 'ejecutivo_quito'
                      ? 'Ejecutivo'
                      : activeService === 'encomienda'
                      ? 'Encomiendas'
                      : 'Domicilios'}
                  </span>
                </div>

                {/* 4 en 1 indicator tag */}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black tracking-tight ${
                  !showHomeHub
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  4 en 1
                </span>

                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isServicesDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>

              {/* POPUP SELECTOR DE LOS SERVICIOS EN EL MISMO BOTON */}
              {isServicesDropdownOpen && (
                <div
                  className={`absolute left-0 mt-2 w-64 rounded-2xl border-2 shadow-2xl backdrop-blur-xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 ${
                    isDark
                      ? 'bg-zinc-950/98 border-zinc-700 text-zinc-100 shadow-black/80'
                      : 'bg-white/98 border-slate-300 text-slate-900 shadow-xl'
                  }`}
                >
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800/60 flex items-center justify-between">
                    <span>Servicio Activo</span>
                    <span className="text-emerald-400 font-bold">AndesMovi</span>
                  </div>

                  {/* 1. Taxi */}
                  <button
                    id="service-option-viaje"
                    type="button"
                    onClick={() => {
                      haptic.click();
                      setIsServicesDropdownOpen(false);
                      onSelectService('viaje');
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      !showHomeHub && activeService === 'viaje'
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                        : isDark
                        ? 'hover:bg-zinc-900 text-zinc-200'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        !showHomeHub && activeService === 'viaje' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black">Taxi</div>
                        <div className={`text-[10px] ${!showHomeHub && activeService === 'viaje' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                          Taxis y carreras en la ciudad
                        </div>
                      </div>
                    </div>
                    {!showHomeHub && activeService === 'viaje' && (
                      <span className="text-[10px] font-black bg-zinc-950/20 px-1.5 py-0.5 rounded">Activo</span>
                    )}
                  </button>

                  {/* 2. Viaje Ejecutivo a Quito */}
                  <button
                    id="service-option-ejecutivo-quito"
                    type="button"
                    onClick={() => {
                      haptic.click();
                      setIsServicesDropdownOpen(false);
                      onSelectService('ejecutivo_quito');
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      !showHomeHub && activeService === 'ejecutivo_quito'
                        ? 'bg-blue-600 text-white font-black shadow-sm'
                        : isDark
                        ? 'hover:bg-zinc-900 text-zinc-200'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        !showHomeHub && activeService === 'ejecutivo_quito' ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black flex items-center gap-1">
                          <span>Ejecutivo a Quito</span>
                          <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-300 font-extrabold">$25/pas</span>
                        </div>
                        <div className={`text-[10px] ${!showHomeHub && activeService === 'ejecutivo_quito' ? 'text-blue-100' : 'text-zinc-400'}`}>
                          Auto particular interprovincial
                        </div>
                      </div>
                    </div>
                    {!showHomeHub && activeService === 'ejecutivo_quito' && (
                      <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded">Activo</span>
                    )}
                  </button>

                  {/* 2. Encomiendas */}
                  <button
                    id="service-option-encomienda"
                    type="button"
                    onClick={() => {
                      haptic.click();
                      setIsServicesDropdownOpen(false);
                      onSelectService('encomienda');
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      !showHomeHub && activeService === 'encomienda'
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                        : isDark
                        ? 'hover:bg-zinc-900 text-zinc-200'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        !showHomeHub && activeService === 'encomienda' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black">Encomiendas</div>
                        <div className={`text-[10px] ${!showHomeHub && activeService === 'encomienda' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                          Paquetería y envíos seguros
                        </div>
                      </div>
                    </div>
                    {!showHomeHub && activeService === 'encomienda' && (
                      <span className="text-[10px] font-black bg-zinc-950/20 px-1.5 py-0.5 rounded">Activo</span>
                    )}
                  </button>

                  {/* 3. Domicilios */}
                  <button
                    id="service-option-domicilio"
                    type="button"
                    onClick={() => {
                      haptic.click();
                      setIsServicesDropdownOpen(false);
                      onSelectService('domicilio');
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      !showHomeHub && activeService === 'domicilio'
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                        : isDark
                        ? 'hover:bg-zinc-900 text-zinc-200'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        !showHomeHub && activeService === 'domicilio' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-sky-500/20 text-sky-400'
                      }`}>
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black">Domicilios</div>
                        <div className={`text-[10px] ${!showHomeHub && activeService === 'domicilio' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                          Entregas de comida y compras
                        </div>
                      </div>
                    </div>
                    {!showHomeHub && activeService === 'domicilio' && (
                      <span className="text-[10px] font-black bg-zinc-950/20 px-1.5 py-0.5 rounded">Activo</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </nav>
        ) : userRole === 'conductor' ? (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-300 text-xs font-black shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>MODO CONDUCTOR ACTIVO • RADAR DE CARRERAS</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-500/15 border-2 border-purple-500/40 text-purple-300 text-xs font-black shadow-sm">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>MODO ADMINISTRADOR • 24 PROVINCIAS</span>
          </div>
        )}

        {/* RIGHT CONTROLS: ACTIVE ROLE INDICATOR + BOTÓN DE TRES PUNTOS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* ROL ACTIVO EXCLUSIVO (Informativo, sin selector invasivo) */}
          {userRole === 'conductor' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Modo Conductor</span>
            </div>
          ) : userRole === 'admin' ? (
            <button
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 text-xs font-black shadow-sm cursor-pointer transition-all active:scale-95"
              title="Abrir Panel de Administrador"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Modo Admin • Abrir</span>
            </button>
          ) : null}

          {/* BOTÓN DE LOS TRES PUNTOS: PERFIL, SOS, NOTIFICACIONES, DONACIONES Y AJUSTES */}
          <div className="relative" ref={menuRef}>
            <button
              id="btn-three-dots-config"
              onClick={() => {
                haptic.tap();
                setIsMenuOpen((prev) => !prev);
              }}
              className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm relative cursor-pointer ${
                isMenuOpen
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-emerald-500/25'
                  : isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-600 text-white shadow-emerald-600/30'
              }`}
              title="Menú de Tres Puntos (Perfil, Seguridad SOS, Notificaciones, Ajustes)"
              aria-label="Menú de Tres Puntos"
              aria-expanded={isMenuOpen}
            >
              {/* TRES PUNTITOS ICON */}
              <MoreVertical className={`w-5 h-5 transition-transform ${isMenuOpen ? 'text-zinc-950' : isDark ? 'text-emerald-400' : 'text-white'}`} />

              <span className={`hidden sm:inline font-bold text-xs ${isMenuOpen ? 'text-zinc-950' : isDark ? 'text-zinc-300' : 'text-white'}`}>
                Menú
              </span>

              {/* Notification Badge on the 3 dots button */}
              {unreadNotificationCount !== undefined && unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-zinc-950" />
                </span>
              )}
            </button>

            {/* UNIFIED FLYOUT MENU MODAL / POP-OVER CON TRES PUNTITOS */}
            {isMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-76 sm:w-88 rounded-2xl border-2 shadow-2xl backdrop-blur-xl p-3.5 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto ${
                  isDark
                    ? 'bg-zinc-950/98 border-zinc-700 text-zinc-100 shadow-black/90'
                    : 'bg-white/98 border-slate-300 text-slate-900 shadow-xl'
                }`}
              >
                {/* ============================================================== */}
                {/* 1. SECCIÓN PRINCIPAL: PERFIL DE USUARIO (SOLO EN LOS 3 PUNTOS)  */}
                {/* ============================================================== */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors shadow-sm ${
                    isDark
                      ? 'bg-zinc-900/90 border-zinc-750'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    onClick={() => {
                      haptic.click();
                      setIsMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  >
                    {currentUser ? (
                      <img
                        src={currentUser.avatar || null}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500/60 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 text-left">
                      <div className={`font-black text-xs truncate flex items-center gap-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                        <span>{currentUser ? currentUser.name : 'Iniciar Sesión'}</span>
                        {currentUser?.cedulaVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <span className={`text-[10px] block truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {currentUser ? `C.I. ${currentUser.cedula || 'Verificada'}` : 'Registra tu perfil y cédula'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      id="btn-three-dots-profile"
                      onClick={() => {
                        haptic.click();
                        setIsMenuOpen(false);
                        onOpenAuth();
                      }}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {currentUser ? 'Mi Perfil' : 'Ingresar'}
                    </button>
                    {currentUser && onLogout && (
                      <button
                        type="button"
                        id="btn-menu-header-logout"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.warning();
                          setIsMenuOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="text-[10px] p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white transition-colors cursor-pointer"
                        title="Cerrar Sesión"
                        aria-label="Cerrar Sesión"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 2. MODO DE ROL ACTIVO (Cambio exclusivo dentro de los 3 puntos: SOLO CLIENTE Y CONDUCTOR) */}
                {/* ============================================================== */}
                <div className={`p-2.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-zinc-900/80 border-zinc-750' : 'bg-slate-50 border-slate-200 shadow-inner'
                }`}>
                  <div className={`flex items-center justify-between text-[10px] font-black uppercase tracking-wider ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    <span>Modo de la Aplicación</span>
                    <span className="text-emerald-500 font-bold capitalize">
                      {userRole === 'conductor' ? 'Solo Conductor' : 'Solo Cliente'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="menu-role-cliente"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSelectRole('cliente');
                      }}
                      className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        userRole === 'cliente'
                          ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm ring-2 ring-emerald-400/50'
                          : isDark 
                            ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="text-xs font-black">Cliente</span>
                    </button>
                    <button
                      id="menu-role-conductor"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSelectRole('conductor');
                      }}
                      className={`p-2.5 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        userRole === 'conductor'
                          ? 'bg-amber-500 text-zinc-950 font-black shadow-sm ring-2 ring-amber-400/50'
                          : isDark 
                            ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Car className="w-5 h-5" />
                      <span className="text-xs font-black">Conductor</span>
                    </button>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* 3. SECCIÓN DE ACCIONES DE LOS TRES PUNTOS: SOS, CAMPANA Y DON */}
                {/* ============================================================== */}
                <div className="space-y-2 pb-2.5 border-b border-zinc-800/80">
                  {/* A) SOS: BOTÓN DE SEGURIDAD Y EMERGENCIA 911 */}
                  <button
                    id="menu-item-sos"
                    onClick={() => {
                      haptic.warning();
                      setIsMenuOpen(false);
                      onTriggerSOS();
                    }}
                    className="w-full p-2.5 rounded-xl bg-gradient-to-r from-rose-950/90 via-red-900/70 to-rose-950/90 hover:from-rose-900 hover:to-red-800 text-rose-100 border-2 border-rose-500/70 flex items-center justify-between transition-all active:scale-95 shadow-md shadow-rose-950/50 group cursor-pointer"
                    title="Activar Asistencia Inmediata 911 y Alerta SOS"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/25 border border-rose-400/50 flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform flex-shrink-0">
                        <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>Botón de Emergencia SOS</span>
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        </div>
                        <div className="text-[10px] text-rose-300 font-semibold">
                          Asistencia Inmediata 911 • Policía
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-rose-500 text-zinc-950 font-black text-[11px] shadow-sm">
                      SOS
                    </span>
                  </button>

                  {/* B) LA CAMPANA: CENTRO DE NOTIFICACIONES */}
                  {onOpenNotifications && (
                    <button
                      id="menu-item-campana"
                      onClick={() => {
                        haptic.tap();
                        setIsMenuOpen(false);
                        onOpenNotifications();
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        unreadNotificationCount && unreadNotificationCount > 0
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/25'
                          : isDark
                          ? 'bg-zinc-900/80 border-zinc-750 hover:bg-zinc-800 text-zinc-200'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                      title="Centro de Notificaciones Push"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center relative flex-shrink-0">
                          <Bell className="w-4 h-4" />
                          {unreadNotificationCount !== undefined && unreadNotificationCount > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Campana de Notificaciones</span>
                            {unreadNotificationCount !== undefined && unreadNotificationCount > 0 && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Alertas push y novedades en tiempo real
                          </div>
                        </div>
                      </div>
                      {unreadNotificationCount !== undefined && unreadNotificationCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black">
                          {unreadNotificationCount} nuevas
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-medium">Al día</span>
                      )}
                    </button>
                  )}


                  <button
                    id="menu-item-configuracion"
                    onClick={() => {
                      haptic.tap();
                      setIsMenuOpen(false);
                      onOpenSettings();
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900/90 border-zinc-750 hover:bg-zinc-800 text-zinc-100'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-sm'
                    }`}
                    title="Abrir Configuración General del Sistema"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Configuración del Sistema
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Perfil, seguridad, tarifas y opciones
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      Ajustes
                    </span>
                  </button>
                </div>
                {/* 4. Wallet & Payment row */}
                <div className="flex items-center gap-2">
                  {userRole === 'conductor' ? (
                    <button
                      id="btn-wallet"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenWallet();
                      }}
                      className={`flex-1 p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className={`text-[10px] block font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Billetera Conductor</span>
                          <span className="text-xs font-mono font-bold text-emerald-500">{formatCurrency(walletBalance)}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        Comisión 7%
                      </span>
                    </button>
                  ) : (
                    <button
                      id="btn-client-payment-badge"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings('metodos_pago');
                      }}
                      className={`flex-1 p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-500" />
                        <div>
                          <span className={`text-[10px] block font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Forma de Pago</span>
                          <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Efectivo / Transferencia</span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                        isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-white text-slate-600 border-slate-200 shadow-sm'
                      }`}>
                        Configurar
                      </span>
                    </button>
                  )}
                </div>

                {/* 3. Section: Activity & Operations */}
                <div className="flex flex-col gap-1 border-t border-zinc-800/80 pt-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                    Mi Actividad
                  </span>

                  {/* Historial */}
                  <button
                    id="btn-history-desktop"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHistory();
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-500" />
                      <span>Historial de Viajes</span>
                    </div>
                    {historyCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                        {historyCount}
                      </span>
                    )}
                  </button>

                  {/* Programados */}
                  <button
                    id="btn-scheduled-bookings-desktop"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenScheduledBookings();
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>Viajes Programados</span>
                    </div>
                    {scheduledCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono">
                        {scheduledCount}
                      </span>
                    )}
                  </button>

                  {/* Notificaciones Push */}
                  {onOpenNotifications && (
                    <button
                      id="btn-notifications-menu"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenNotifications();
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-500" />
                        <span>Notificaciones Push</span>
                      </div>
                      {unreadNotificationCount !== undefined && unreadNotificationCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black">
                          {unreadNotificationCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Pantalla de Bienvenida (Splash Screen) */}
                  {onOpenSplashScreen && (
                    <button
                      id="btn-open-splash-desktop"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSplashScreen();
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Pantalla de Bienvenida</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Splash
                      </span>
                    </button>
                  )}
                </div>

                {/* 4. Section: Tools & Preferences */}
                <div className="flex flex-col gap-1 border-t border-zinc-800/80 pt-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                    Preferencias
                  </span>

                  {/* Theme Switcher Quick Row */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-xs">
                    <span className="text-zinc-400">Tema Visual</span>
                    <button
                      id="btn-theme-desktop"
                      onClick={onCycleTheme}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                          : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      {themePreference === 'system' ? (
                        <>
                          <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Sistema</span>
                        </>
                      ) : themePreference === 'dark' ? (
                        <>
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Oscuro</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Claro</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Central Telefónica Direct Call */}
                  <a
                    id="btn-call-central-navbar"
                    href="tel:0978734844"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border mt-1 cursor-pointer ${
                      isDark
                        ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/50'
                        : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>Central AndesMovi</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-black bg-blue-500/20 text-blue-400">
                      0978734844
                    </span>
                  </a>

                  {/* Configuración Completa */}
                  <button
                    id="btn-settings-desktop"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings();
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors border mt-1 ${
                      isDark
                        ? 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 text-zinc-100'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-500" />
                      <span>{t('settings')}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                      {language === 'qu' ? '🏔️ Kichwa' : '🇪🇨 ES'}
                    </span>
                  </button>

                  {/* Términos y Condiciones Legal Direct Link */}
                  <button
                    id="btn-menu-terms"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings('terminos');
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isDark ? 'hover:bg-zinc-900 text-zinc-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Términos y Condiciones</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">
                      Legal
                    </span>
                  </button>

                  {/* Políticas de Privacidad Direct Link */}
                  <button
                    id="btn-menu-privacy"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings('privacidad');
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isDark ? 'hover:bg-zinc-900 text-zinc-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Políticas de Privacidad (LOPDP)</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                      Ecuador
                    </span>
                  </button>

                  {/* CERRAR SESIÓN DIRECTO DESDE EL MENÚ DE TRES PUNTOS */}
                  {currentUser && onLogout && (
                    <button
                      id="btn-menu-logout-bottom"
                      type="button"
                      onClick={() => {
                        haptic.warning();
                        setIsMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/25 hover:bg-rose-900/40 text-rose-300 flex items-center justify-between transition-all cursor-pointer mt-1 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-rose-200 block leading-tight">Cerrar Sesión</span>
                          <span className="text-[10px] text-zinc-400 block truncate max-w-[150px]">
                            {currentUser.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        Salir
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE ONLY: BOTON UNICO DE SERVICIOS (VIAJES, ENCOMIENDAS & DOMICILIOS) */}
      {userRole === 'cliente' && (
        <nav
          aria-label="Servicios Móviles"
          className="md:hidden mt-2 pt-1 border-t border-zinc-800/40 flex items-center justify-center gap-1.5 w-full relative"
        >
          {onToggleHomeHub && (
            <button
              onClick={onToggleHomeHub}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                showHomeHub
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm border border-amber-400/40'
                  : isDark
                  ? 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </button>
          )}

          {/* UN SOLO BOTÓN PARA VIAJES, ENCOMIENDAS Y DOMICILIOS EN MÓVIL */}
          <div className="flex-1 relative" ref={mobileServicesDropdownRef}>
            <button
              id="btn-unified-services-mobile"
              type="button"
              onClick={() => {
                haptic.tap();
                setIsMobileServicesDropdownOpen((prev) => !prev);
              }}
              disabled={hasActiveTrip}
              className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-between gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                !showHomeHub
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm'
                  : isDark
                  ? 'bg-zinc-900 text-zinc-200 border-zinc-750 hover:bg-zinc-850'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              } ${hasActiveTrip ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {activeService === 'viaje' ? (
                  <Car className="w-4 h-4 flex-shrink-0" />
                ) : activeService === 'encomienda' ? (
                  <Package className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate">
                  {activeService === 'viaje'
                    ? 'Viajes'
                    : activeService === 'encomienda'
                    ? 'Encomiendas'
                    : 'Domicilios'}
                </span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                  !showHomeHub ? 'bg-zinc-950/20 text-zinc-950' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  3 en 1
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${isMobileServicesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* POPUP DE SERVICIOS EN MÓVIL */}
            {isMobileServicesDropdownOpen && (
              <div
                className={`absolute left-0 right-0 mt-2 rounded-2xl border-2 shadow-2xl backdrop-blur-xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 ${
                  isDark
                    ? 'bg-zinc-950/98 border-zinc-700 text-zinc-100 shadow-black/90'
                    : 'bg-white/98 border-slate-300 text-slate-900 shadow-xl'
                }`}
              >
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800/60 flex items-center justify-between">
                  <span>Selecciona Servicio</span>
                  <span className="text-emerald-400 font-bold">AndesMovi</span>
                </div>

                {/* 1. Viajes Urbanos */}
                <button
                  type="button"
                  id="mobile-service-option-viaje"
                  onClick={() => {
                    haptic.click();
                    setIsMobileServicesDropdownOpen(false);
                    onSelectService('viaje');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                    !showHomeHub && activeService === 'viaje'
                      ? 'bg-emerald-500 text-zinc-950 font-black'
                      : isDark
                      ? 'hover:bg-zinc-900 text-zinc-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-black">Viajes Urbanos</div>
                      <div className={`text-[10px] ${!showHomeHub && activeService === 'viaje' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        Taxis y carreras urbanas/rurales
                      </div>
                    </div>
                  </div>
                  {!showHomeHub && activeService === 'viaje' && (
                    <span className="text-[10px] font-black bg-zinc-950/20 px-1.5 py-0.5 rounded">Activo</span>
                  )}
                </button>

                {/* 2. Viaje Ejecutivo a Quito */}
                <button
                  type="button"
                  id="mobile-service-option-ejecutivo-quito"
                  onClick={() => {
                    haptic.click();
                    setIsMobileServicesDropdownOpen(false);
                    onSelectService('ejecutivo_quito');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                    !showHomeHub && activeService === 'ejecutivo_quito'
                      ? 'bg-blue-600 text-white font-black'
                      : isDark
                      ? 'hover:bg-zinc-900 text-zinc-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-black flex items-center gap-1">
                        <span>Ejecutivo a Quito</span>
                        <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-300 font-extrabold">$25/pas</span>
                      </div>
                      <div className={`text-[10px] ${!showHomeHub && activeService === 'ejecutivo_quito' ? 'text-blue-100' : 'text-zinc-400'}`}>
                        Auto particular interprovincial
                      </div>
                    </div>
                  </div>
                  {!showHomeHub && activeService === 'ejecutivo_quito' && (
                    <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded">Activo</span>
                  )}
                </button>

                {/* 2. Encomiendas */}
                <button
                  type="button"
                  id="mobile-service-option-encomienda"
                  onClick={() => {
                    haptic.click();
                    setIsMobileServicesDropdownOpen(false);
                    onSelectService('encomienda');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                    !showHomeHub && activeService === 'encomienda'
                      ? 'bg-emerald-500 text-zinc-950 font-black'
                      : isDark
                      ? 'hover:bg-zinc-900 text-zinc-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-black">Encomiendas</div>
                      <div className={`text-[10px] ${!showHomeHub && activeService === 'encomienda' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        Paquetería local e interprovincial
                      </div>
                    </div>
                  </div>
                  {!showHomeHub && activeService === 'encomienda' && (
                    <span className="text-[10px] font-black bg-zinc-950/20 px-1.5 py-0.5 rounded">Activo</span>
                  )}
                </button>

                {/* 3. Domicilios */}
                <button
                  type="button"
                  id="mobile-service-option-domicilio"
                  onClick={() => {
                    haptic.click();
                    setIsMobileServicesDropdownOpen(false);
                    onSelectService('domicilio');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                    !showHomeHub && activeService === 'domicilio'
                      ? 'bg-emerald-500 text-zinc-950 font-black'
                      : isDark
                      ? 'hover:bg-zinc-900 text-zinc-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-black">Domicilios</div>
                      <div className={`text-[10px] ${!showHomeHub && activeService === 'domicilio' ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        Restaurantes y compras express
                      </div>
                    </div>
                  </div>
                  {!showHomeHub && activeService === 'domicilio' && (
                    <span className="text-[10px] font-black bg-zinc-950/20 px-1.5 py-0.5 rounded">Activo</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* DIÁLOGO MODAL DE CONFIRMACIÓN: CERRAR SESIÓN */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border-2 p-5 shadow-2xl space-y-4 animate-scaleUp ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 id="logout-dialog-title" className="text-base font-black">¿Cerrar Sesión en AndesMovi?</h3>
              <p className="text-xs text-zinc-400">
                Tu sesión actual será finalizada en este dispositivo. Podrás volver a ingresar en cualquier momento con tus credenciales.
              </p>

              {currentUser && (
                <div className={`mt-3 p-2.5 rounded-xl border text-left flex items-center gap-2.5 ${
                  isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <img
                    src={currentUser.avatar || null}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1">
                      <span>{currentUser.name}</span>
                      {currentUser.cedulaVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {currentUser.cedula ? `C.I. ${currentUser.cedula}` : currentUser.email}
                    </div>
                    <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                      {currentUser.role === 'conductor' ? 'Conductor' : 'Cliente'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-logout-action"
                onClick={() => {
                  haptic.success();
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

import React, { useState } from 'react';
import { AdminWorker } from '../../types';
import { haptic } from '../../utils/haptics';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react';

interface AdminLoginGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (worker: AdminWorker) => void;
  workers: AdminWorker[];
}

export const AdminLoginGateModal: React.FC<AdminLoginGateModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  workers,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedUser) {
      setErrorMessage('Por favor ingresa tu nombre de usuario.');
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Check for Master Credentials:
      // Usuario: Dueñoandesmovi (case-insensitive & accent-insensitive)
      // Contraseña: 1004721351Dueño (also allowing DUEÑOANDESMOVI / 1004721351Dueño)
      const normalizedUser = trimmedUser.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isMasterUser =
        normalizedUser === 'duenoandesmovi' ||
        trimmedUser.toLowerCase() === 'dueñoandesmovi' ||
        trimmedUser.toLowerCase() === 'johnyepez' ||
        trimmedUser === '1004721351';

      const isMasterPass =
        trimmedPass === '1004721351Dueño' ||
        trimmedPass === '1004721351Dueno' ||
        trimmedPass === '1004721351dueño' ||
        trimmedPass === 'DUEÑOANDESMOVI' ||
        trimmedPass === 'dueñoandesmovi' ||
        trimmedPass === 'Duenoandesmovi';

      if (isMasterUser && isMasterPass) {
        // Master Admin found
        const masterWorker: AdminWorker = workers.find((w) => w.cedula === '1004721351') || {
          id: 'adm-john',
          cedula: '1004721351',
          fullName: 'Jhon Sebastian Yepez Clavijo',
          role: 'super_admin',
          roleTitle: 'Super Administrador / Dueño AndesMovi',
          province: 'Carchi',
          phone: '+593 99 472 1351',
          email: 'john.yepez@andesmovi.ec',
          username: 'Dueñoandesmovi',
          passwordHash: '1004721351Dueño',
          isActive: true,
          canManageTariffs: true,
          canManageRecharges: true,
          canManageEncomiendas: true,
          canManageFleet: true,
          canManageStaff: true,
          createdAt: 1704067200000,
          createdFormatted: '01 Ene 2024',
          lastLoginFormatted: 'Ahora',
          notes: 'Propietario y Fundador General AndesMovi Ecuador.',
        };

        haptic.success();
        setIsLoading(false);
        onLoginSuccess(masterWorker);
        return;
      }

      // 2. Check other registered workers
      const foundWorker = workers.find(
        (w) =>
          w.username.toLowerCase() === trimmedUser.toLowerCase() ||
          w.cedula === trimmedUser ||
          w.email.toLowerCase() === trimmedUser.toLowerCase()
      );

      if (foundWorker) {
        if (!foundWorker.isActive) {
          setIsLoading(false);
          setErrorMessage('Esta cuenta administrativa se encuentra temporalmente inactiva.');
          return;
        }

        const validWorkerPass =
          trimmedPass === foundWorker.passwordHash ||
          (foundWorker.cedula === '1004721351' && isMasterPass);

        if (validWorkerPass) {
          haptic.success();
          setIsLoading(false);
          onLoginSuccess(foundWorker);
          return;
        }
      }

      // Invalid credentials
      haptic.warning();
      setIsLoading(false);
      setErrorMessage('Credenciales incorrectas. Verifique el usuario y la contraseña ingresados.');
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black/80 overflow-hidden flex flex-col">
        {/* Subtle glowing accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            haptic.tap();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 pb-2 text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 p-0.5 shadow-lg shadow-orange-950/40 mb-2.5">
            <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <h2 className="text-lg font-black text-white tracking-tight">
            Acceso Administrativo
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Sistema de control y gestión AndesMovi
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mb-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 pt-3 space-y-4">
          {/* Usuario */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-zinc-200 block">
              Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoFocus
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-750 hover:border-zinc-600 text-white placeholder-zinc-500 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-zinc-200 block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-750 hover:border-zinc-600 text-white placeholder-zinc-500 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                <span>Verificando...</span>
              </span>
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

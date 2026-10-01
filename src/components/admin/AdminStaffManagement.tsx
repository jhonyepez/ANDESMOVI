import React, { useState } from 'react';
import { AdminWorker, AdminWorkerRole, EcuadorProvince24 } from '../../types';
import { ECUADOR_24_PROVINCES_LIST } from '../../data/mockData';
import { validateEcuadorianCedula } from '../../utils/cedulaValidator';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  Sparkles,
  AlertTriangle,
  Crown,
  Eye,
  EyeOff,
  Briefcase,
  X,
  FileText,
} from 'lucide-react';

interface AdminStaffManagementProps {
  workers: AdminWorker[];
  onUpdateWorkers: (updated: AdminWorker[]) => void;
  currentAdminUser: AdminWorker;
  isDark?: boolean;
}

export const AdminStaffManagement: React.FC<AdminStaffManagementProps> = ({
  workers,
  onUpdateWorkers,
  currentAdminUser,
  isDark = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<string>('todas');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal for hiring/creating worker
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCedula, setNewCedula] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newProvince, setNewProvince] = useState<EcuadorProvince24>('Pichincha');
  const [newRole, setNewRole] = useState<AdminWorkerRole>('operador_provincial');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newCanManageTariffs, setNewCanManageTariffs] = useState(false);
  const [newCanManageRecharges, setNewCanManageRecharges] = useState(true);
  const [newCanManageEncomiendas, setNewCanManageEncomiendas] = useState(true);
  const [newCanManageFleet, setNewCanManageFleet] = useState(true);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Modal for editing password
  const [editingWorker, setEditingWorker] = useState<AdminWorker | null>(null);
  const [editPasswordInput, setEditPasswordInput] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Toast alert
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3500);
  };

  // Filtered workers list
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.cedula.includes(searchQuery) ||
      worker.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.roleTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince =
      provinceFilter === 'todas' || worker.province === provinceFilter;

    const matchesRole =
      roleFilter === 'todos' || worker.role === roleFilter;

    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'activo' && worker.isActive) ||
      (statusFilter === 'suspendido' && !worker.isActive);

    return matchesSearch && matchesProvince && matchesRole && matchesStatus;
  });

  // Calculate stats
  const totalStaff = workers.length;
  const activeStaff = workers.filter((w) => w.isActive).length;
  const uniqueProvincesCount = new Set(workers.map((w) => w.province)).size;

  // Toggle active/suspended
  const handleToggleStatus = (worker: AdminWorker) => {
    if (worker.cedula === '1004721351' || worker.cedula === '1004567663') {
      showAlert('⚠️ No se puede suspender a los Directores Generales de AndesMovi.');
      return;
    }

    const updated = workers.map((w) =>
      w.id === worker.id ? { ...w, isActive: !w.isActive } : w
    );
    onUpdateWorkers(updated);
    showAlert(
      `Estado de ${worker.fullName} cambiado a ${
        !worker.isActive ? 'ACTIVO' : 'SUSPENDIDO'
      }.`
    );
  };

  // Delete worker
  const handleDeleteWorker = (worker: AdminWorker) => {
    if (worker.cedula === '1004721351' || worker.cedula === '1004567663') {
      showAlert('⚠️ Los Directores Generales tienen acceso vitalicio y no pueden ser eliminados.');
      return;
    }

    if (
      confirm(
        `¿Confirmas la rescisión de contrato y eliminación de ${worker.fullName} (C.I. ${worker.cedula})? Ya no podrá acceder al sistema.`
      )
    ) {
      const updated = workers.filter((w) => w.id !== worker.id);
      onUpdateWorkers(updated);
      showAlert(`Trabajador ${worker.fullName} retirado del sistema.`);
    }
  };

  // Save new password
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    if (!editPasswordInput.trim() || editPasswordInput.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const updated = workers.map((w) =>
      w.id === editingWorker.id
        ? { ...w, passwordHash: editPasswordInput.trim() }
        : w
    );
    onUpdateWorkers(updated);
    showAlert(`Contraseña actualizada con éxito para ${editingWorker.fullName}.`);
    setEditingWorker(null);
    setEditPasswordInput('');
  };

  // Create worker handler
  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCedula = newCedula.trim().replace(/\D/g, '');
    if (cleanCedula.length !== 10) {
      setFormError('La cédula ecuatoriana debe tener exactamente 10 dígitos numéricos.');
      return;
    }

    // Validar con algoritmo oficial de Módulo 10 del Registro Civil del Ecuador
    const cedulaVal = validateEcuadorianCedula(cleanCedula);
    if (!cedulaVal.isValid) {
      setFormError(`Cédula ecuatoriana no válida (Algoritmo Módulo 10): ${cedulaVal.message}`);
      return;
    }

    // Check duplicate
    if (workers.some((w) => w.cedula === cleanCedula)) {
      setFormError(`Ya existe un trabajador registrado con la cédula ${cleanCedula}.`);
      return;
    }

    if (!newFullName.trim()) {
      setFormError('Por favor ingresa los nombres y apellidos del trabajador.');
      return;
    }

    if (!newUsername.trim()) {
      setFormError('Por favor define un nombre de usuario para el acceso.');
      return;
    }

    if (workers.some((w) => w.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setFormError('Ese nombre de usuario ya está en uso. Elige otro.');
      return;
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setFormError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const assignedTitle =
      newRoleTitle.trim() ||
      (newRole === 'operador_provincial'
        ? `Operador Zonal ${newProvince}`
        : newRole === 'despachador_encomiendas'
        ? `Despachador de Encomiendas ${newProvince}`
        : newRole === 'supervisor_flota'
        ? `Supervisor de Flota ${newProvince}`
        : `Auditor Financiero ${newProvince}`);

    const newWorkerRecord: AdminWorker = {
      id: `adm-worker-${Date.now()}`,
      cedula: cleanCedula,
      fullName: newFullName.trim(),
      role: newRole,
      roleTitle: assignedTitle,
      province: newProvince,
      phone: newPhone.trim() || '+593 99 000 0000',
      email: newEmail.trim() || `${newUsername.trim()}@andesmovi.ec`,
      username: newUsername.trim(),
      passwordHash: newPassword.trim(),
      isActive: true,
      canManageTariffs: newCanManageTariffs,
      canManageRecharges: newCanManageRecharges,
      canManageEncomiendas: newCanManageEncomiendas,
      canManageFleet: newCanManageFleet,
      canManageStaff: false, // Solo John Yepez y Esmeralda López
      createdAt: Date.now(),
      createdFormatted: 'Hoy, recién registrado',
      notes: newNotes.trim() || `Contratado para cobertura provincial en ${newProvince}.`,
    };

    const updated = [...workers, newWorkerRecord];
    onUpdateWorkers(updated);
    showAlert(`¡Trabajador ${newFullName} contratado y habilitado con éxito para ${newProvince}!`);

    // Reset Form
    setNewCedula('');
    setNewFullName('');
    setNewProvince('Pichincha');
    setNewRole('operador_provincial');
    setNewRoleTitle('');
    setNewPhone('');
    setNewEmail('');
    setNewUsername('');
    setNewPassword('');
    setNewNotes('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ALERT TOAST */}
      {alertMessage && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* HEADER WITH SUMMARY */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border shadow-xl ${
        isDark 
          ? 'bg-gradient-to-r from-[#241a14] via-[#1a1410] to-[#14100e] border-amber-600/40 text-white' 
          : 'bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border-amber-300 text-slate-900 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h3 className={`text-base sm:text-lg font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
              GESTIÓN DE PERSONAL & TRABAJADORES (24 PROVINCIAS DEL ECUADOR)
            </h3>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              Acceso con Cédula
            </span>
          </div>
          <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${isDark ? 'text-amber-200/80' : 'text-slate-600'}`}>
            Administración de cuentas con acceso al panel: directores generales <strong className={isDark ? 'text-white' : 'text-slate-900'}>John Yepez (1004721351)</strong>, <strong className={isDark ? 'text-white' : 'text-slate-900'}>Esmeralda López (1004567663)</strong> y personal contratado con usuario y contraseña en todas las provincias de Ecuador.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-orange-950/40 active:scale-95 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Contratar / Registrar Trabajador</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl border-2 shadow-md flex flex-col ${
          isDark ? 'bg-zinc-900 border-zinc-700/80' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
            Personal Total
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalStaff}</span>
            <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>usuarios</span>
          </div>
          <span className={`text-[11px] mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Directorio nacional</span>
        </div>

        <div className={`p-3.5 rounded-2xl border-2 shadow-md flex flex-col ${
          isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-white border-amber-300'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            👑 Directores Maestros
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-black ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>2</span>
            <span className={`text-xs font-bold ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>fundadores</span>
          </div>
          <span className={`text-[11px] mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>John Yepez & Esmeralda López</span>
        </div>

        <div className={`p-3.5 rounded-2xl border-2 shadow-md flex flex-col ${
          isDark ? 'bg-zinc-900 border-emerald-500/40' : 'bg-white border-emerald-300'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            🟢 Trabajadores Activos
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-500">{activeStaff}</span>
            <span className={`text-xs font-bold ${isDark ? 'text-emerald-400/90' : 'text-emerald-600'}`}>habilitados</span>
          </div>
          <span className={`text-[11px] mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Con acceso al sistema</span>
        </div>

        <div className={`p-3.5 rounded-2xl border-2 shadow-md flex flex-col ${
          isDark ? 'bg-zinc-900 border-sky-500/40' : 'bg-white border-sky-300'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
            🇪🇨 Provincias Cubiertas
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-sky-500">{uniqueProvincesCount}</span>
            <span className={`text-xs font-bold ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>/ 24 Provincias</span>
          </div>
          <span className={`text-[11px] mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Cobertura en Ecuador</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border ${
        isDark ? 'bg-zinc-900 border-zinc-750' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre, usuario, provincia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-3 py-2.5 rounded-xl border-2 text-xs font-medium focus:outline-none focus:border-amber-400 shadow-inner ${
              isDark 
                ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Province Filter */}
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className={`py-2 px-3 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
              isDark ? 'bg-zinc-800 border-zinc-650 text-zinc-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todas">🇪🇨 Las 24 Provincias</option>
            {ECUADOR_24_PROVINCES_LIST.map((prov) => (
              <option key={prov.name} value={prov.name}>
                {prov.name} ({prov.region})
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`py-2 px-3 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
              isDark ? 'bg-zinc-800 border-zinc-650 text-zinc-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todos">Todos los Cargos</option>
            <option value="super_admin">Super Administrador</option>
            <option value="operador_provincial">Operador Provincial</option>
            <option value="despachador_encomiendas">Despachador de Encomiendas</option>
            <option value="supervisor_flota">Supervisor de Flota</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`py-2 px-3 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
              isDark ? 'bg-zinc-800 border-zinc-650 text-zinc-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todos">Todos los Estados</option>
            <option value="activo">🟢 Activos</option>
            <option value="suspendido">🔴 Suspendidos</option>
          </select>
        </div>
      </div>

      {/* WORKERS LIST & CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => {
          const isMasterAdmin =
            worker.cedula === '1004721351' || worker.cedula === '1004567663';

          return (
            <div
              key={worker.id}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between shadow-md ${
                isMasterAdmin
                  ? isDark
                    ? 'border-amber-500/80 bg-gradient-to-b from-[#271d16] via-[#1d1612] to-zinc-900 shadow-lg shadow-amber-950/40'
                    : 'border-amber-400 bg-gradient-to-b from-amber-50/60 to-white shadow-md'
                  : worker.isActive
                  ? isDark 
                    ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                    : 'bg-white border-slate-200 hover:border-slate-400'
                  : isDark
                    ? 'bg-zinc-900/80 border-red-500/40 opacity-80'
                    : 'bg-red-50/40 border-red-200 opacity-90'
              }`}
            >
              <div>
                {/* Top Role & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      isMasterAdmin
                        ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                        : isDark ? 'bg-zinc-800 text-zinc-200 border border-zinc-650' : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {isMasterAdmin ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>Directorio General</span>
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{worker.role.replace('_', ' ')}</span>
                      </>
                    )}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      worker.isActive
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isDark ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-red-100 text-red-800 border-red-300'
                    }`}
                  >
                    {worker.isActive ? '🟢 Activo' : '🔴 Suspendido'}
                  </span>
                </div>

                {/* Worker Identity */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${
                      isMasterAdmin
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-zinc-950 font-mono shadow-md border-amber-300'
                        : isDark ? 'bg-zinc-800 text-zinc-100 border-zinc-650' : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {worker.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-black truncate flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>{worker.fullName}</span>
                      {isMasterAdmin && <span title="Acceso Vitalicio">⭐</span>}
                    </h4>
                    <span className={`text-xs font-bold block truncate mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      {worker.roleTitle}
                    </span>
                  </div>
                </div>

                {/* Province & Cédula chips */}
                <div className={`mt-3 p-3 rounded-xl border-2 space-y-2 text-xs shadow-inner ${
                  isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
                      CÉDULA ECUADOR
                    </span>
                    <strong className={`font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded border ${
                      isDark ? 'text-amber-300 bg-zinc-900 border-zinc-700' : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}>
                      {worker.cedula}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
                      PROVINCIA ASIGNADA
                    </span>
                    <strong className={`font-bold text-xs flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{worker.province}</span>
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
                      USUARIO DE ACCESO
                    </span>
                    <span className={`font-mono font-bold text-xs ${isDark ? 'text-zinc-100' : 'text-slate-700'}`}>
                      @{worker.username}
                    </span>
                  </div>
                </div>

                {/* Permissions Indicators */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                      worker.canManageTariffs
                        ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                        : isDark ? 'bg-zinc-800 text-zinc-500 line-through border-zinc-700' : 'bg-slate-100 text-slate-400 line-through border-slate-200'
                    }`}
                  >
                    Tarifas
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                      worker.canManageRecharges
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isDark ? 'bg-zinc-800 text-zinc-500 line-through border-zinc-700' : 'bg-slate-100 text-slate-400 line-through border-slate-200'
                    }`}
                  >
                    Recargas
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                      worker.canManageEncomiendas
                        ? isDark ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-sky-100 text-sky-800 border-sky-300'
                        : isDark ? 'bg-zinc-800 text-zinc-500 line-through border-zinc-700' : 'bg-slate-100 text-slate-400 line-through border-slate-200'
                    }`}
                  >
                    Encomiendas
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                      worker.canManageFleet
                        ? isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-300'
                        : isDark ? 'bg-zinc-800 text-zinc-500 line-through border-zinc-700' : 'bg-slate-100 text-slate-400 line-through border-slate-200'
                    }`}
                  >
                    Radar GPS
                  </span>
                </div>

                {/* Notes or Contacts */}
                {worker.notes && (
                  <p className={`text-xs p-2.5 rounded-xl border italic mt-3 line-clamp-2 ${
                    isDark ? 'text-zinc-300 bg-zinc-850 border-zinc-700' : 'text-slate-600 bg-slate-50 border-slate-200'
                  }`}>
                    "{worker.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-1.5 ${
                isDark ? 'border-zinc-700/80' : 'border-slate-200'
              }`}>
                {/* Edit Password Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingWorker(worker);
                    setEditPasswordInput(worker.passwordHash || '');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isDark 
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border-zinc-750' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="Cambiar contraseña de acceso"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Clave</span>
                </button>

                {/* Status Toggle (Activate / Suspend) */}
                {!isMasterAdmin && (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(worker)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                      worker.isActive
                        ? isDark ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30' : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                        : isDark ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {worker.isActive ? 'Suspender' : 'Reactivar'}
                  </button>
                )}

                {/* Delete Worker (Protected for master admins) */}
                {!isMasterAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteWorker(worker)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border-red-500/30' 
                        : 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
                    }`}
                    title="Eliminar trabajador y revocar contrato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: REGISTRAR / CONTRATAR NUEVO TRABAJADOR */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className={`relative w-full max-w-lg rounded-3xl border-2 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? 'bg-zinc-950 border-amber-500/60 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-zinc-700/80 bg-gradient-to-r from-[#2a1e16] via-[#1d1612] to-zinc-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <div>
                <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <UserPlus className="w-5 h-5 text-amber-500" />
                  <span>Contratar & Registrar Trabajador</span>
                </h3>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-amber-200/90' : 'text-slate-600'}`}>
                  Asigna acceso a la plataforma en cualquiera de las 24 provincias de Ecuador.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in form */}
            {formError && (
              <div className="m-4 p-3 rounded-xl bg-red-500/20 border-2 border-red-500/40 text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateWorker} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cédula */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    Número de Cédula Ecuatoriana *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="10 dígitos (ej. 1718293041)"
                    value={newCedula}
                    onChange={(e) => setNewCedula(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Nombres y Apellidos */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    Nombres y Apellidos Completos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Xavier Morales"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Provincia de las 24 y Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    Provincia Asignada (de las 24) *
                  </label>
                  <select
                    value={newProvince}
                    onChange={(e) => setNewProvince(e.target.value as EcuadorProvince24)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-amber-300' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    {ECUADOR_24_PROVINCES_LIST.map((prov) => (
                      <option key={prov.name} value={prov.name}>
                        {prov.name} ({prov.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    Rol / Cargo en AndesMovi *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminWorkerRole)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="operador_provincial">Operador Provincial Zonal</option>
                    <option value="despachador_encomiendas">Despachador de Encomiendas</option>
                    <option value="supervisor_flota">Supervisor de Flota & Radar</option>
                    <option value="auditor_financiero">Auditor de Recargas y Finanzas</option>
                  </select>
                </div>
              </div>

              {/* Teléfono y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    Teléfono Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+593 99 123 4567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-medium focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="trabajador@andesmovi.ec"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-medium focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Usuario y Contraseña para login */}
              <div className={`p-4 rounded-2xl border-2 space-y-3 shadow-md ${
                isDark ? 'bg-zinc-900 border-amber-500/50' : 'bg-amber-50/50 border-amber-200'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
                  isDark ? 'text-amber-300' : 'text-amber-800'
                }`}>
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>Credenciales de Inicio de Sesión</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      Usuario de Acceso *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. rmorales"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 ${
                        isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Mínimo 4 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full px-3 py-2 pr-9 rounded-xl border-2 text-xs focus:outline-none focus:border-amber-400 ${
                          isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permisos Asignados */}
              <div className="space-y-2">
                <label className={`text-xs font-bold block uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                  Permisos del Trabajador:
                </label>
                <div className={`grid grid-cols-2 gap-2.5 text-xs ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer shadow-sm ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newCanManageTariffs}
                      onChange={(e) => setNewCanManageTariffs(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="font-bold">Modificar Tarifas</span>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer shadow-sm ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newCanManageRecharges}
                      onChange={(e) => setNewCanManageRecharges(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="font-bold">Aprobar Recargas</span>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer shadow-sm ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newCanManageEncomiendas}
                      onChange={(e) => setNewCanManageEncomiendas(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="font-bold">Gestión Encomiendas</span>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer shadow-sm ${
                    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newCanManageFleet}
                      onChange={(e) => setNewCanManageFleet(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="font-bold">Radar & Flota Satelital</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className={`pt-3 flex items-center justify-end gap-3 border-t ${
                isDark ? 'border-zinc-700/80' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-orange-950/40 border border-amber-300/30"
                >
                  Confirmar Contrato y Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CAMBIAR / RESETEAR CONTRASEÑA */}
      {editingWorker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className={`relative w-full max-w-sm rounded-3xl border-2 shadow-2xl p-6 ${
            isDark ? 'bg-zinc-950 border-amber-500/60 text-white' : 'bg-white border-amber-300 text-slate-900'
          }`}>
            <h3 className={`text-base font-black flex items-center gap-2 mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Key className="w-5 h-5 text-amber-500" />
              <span>Cambiar Contraseña de Acceso</span>
            </h3>
            <p className={`text-xs mb-4 font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              Trabajador: <strong className={isDark ? 'text-amber-300' : 'text-amber-700'}>{editingWorker.fullName}</strong> (C.I. {editingWorker.cedula})
            </p>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={editPasswordInput}
                    onChange={(e) => setEditPasswordInput(e.target.value)}
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 shadow-inner ${
                      isDark ? 'bg-zinc-800 border-zinc-650 text-white placeholder-zinc-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
                isDark ? 'border-zinc-700/80' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shadow-lg"
                >
                  Guardar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

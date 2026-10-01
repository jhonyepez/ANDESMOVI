import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  FileCheck,
  Eye,
  RefreshCw,
  Info,
  Calendar,
  Building2,
  UserCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DriverDocuments, VerificationDocumentStatus } from '../types';
import { verifyDriverIdentityAndDocuments } from '../services/identityVerificationService';
import { haptic } from '../utils/haptics';

interface DriverVerificationStatusProps {
  documents: DriverDocuments;
  onUpdateStatus?: (documentKey: 'license' | 'criminalRecord' | 'rtv', newStatus: VerificationDocumentStatus) => void;
  showAdminSimulator?: boolean;
  onNavigateToUpload?: () => void;
  className?: string;
  compact?: boolean;
  isDark?: boolean;
}

export const DriverVerificationStatus: React.FC<DriverVerificationStatusProps> = ({
  documents,
  onUpdateStatus,
  onNavigateToUpload,
  className = '',
  compact = false,
  isDark = true,
}) => {
  const [expandedDoc, setExpandedDoc] = useState<'license' | 'criminal' | 'rtv' | null>(null);
  const [isAutoVerifying, setIsAutoVerifying] = useState<boolean>(false);
  const [autoVerificationSuccess, setAutoVerificationSuccess] = useState<string | null>(null);

  const handleRunAutoVerification = async () => {
    setIsAutoVerifying(true);
    setAutoVerificationSuccess(null);
    haptic.tap();

    try {
      const res = await verifyDriverIdentityAndDocuments({
        cedulaNumber: documents.vehicleRegistrationPlate || '1004721351',
        driverFullName: 'CONDUCTOR ANDESMOVI',
        licenseFrontPhoto: documents.licenseFrontPhoto,
        licenseBackPhoto: documents.licenseBackPhoto,
      });

      if (res.status === 'aprobado' && onUpdateStatus) {
        onUpdateStatus('license', 'aprobado');
        onUpdateStatus('criminalRecord', 'aprobado');
        onUpdateStatus('rtv', 'aprobado');
        setAutoVerificationSuccess(res.verificationBadge);
        haptic.success();
      }
    } catch (err) {
      console.error('Error auto verifying:', err);
    } finally {
      setIsAutoVerifying(false);
    }
  };

  // Status values with fallbacks
  const licenseStatus: VerificationDocumentStatus =
    documents.licenseStatus ||
    (documents.isLicenseValid ? 'aprobado' : 'rechazado');

  const criminalStatus: VerificationDocumentStatus =
    documents.criminalRecordStatus ||
    (documents.isCriminalRecordApproved ? 'aprobado' : 'rechazado');

  const rtvStatus: VerificationDocumentStatus =
    documents.rtvDocStatus ||
    (documents.rtvStatus === 'vigente'
      ? 'aprobado'
      : documents.rtvStatus === 'en_tramite'
      ? 'en_revision'
      : 'rechazado');

  // Overall Status Calculation
  const isAnyRejected =
    licenseStatus === 'rechazado' ||
    criminalStatus === 'rechazado' ||
    rtvStatus === 'rechazado';
  const isAnyUnderReview =
    licenseStatus === 'en_revision' ||
    criminalStatus === 'en_revision' ||
    rtvStatus === 'en_revision';
  const isAnyPending =
    licenseStatus === 'pendiente' ||
    criminalStatus === 'pendiente' ||
    rtvStatus === 'pendiente';
  const isAllApproved =
    licenseStatus === 'aprobado' &&
    criminalStatus === 'aprobado' &&
    rtvStatus === 'aprobado';

  let overallStatus: VerificationDocumentStatus = 'pendiente';
  if (isAnyRejected) overallStatus = 'rechazado';
  else if (isAllApproved) overallStatus = 'aprobado';
  else if (isAnyUnderReview) overallStatus = 'en_revision';
  else if (isAnyPending) overallStatus = 'pendiente';

  // Helper config for visual representation
  const getStatusBadge = (status: VerificationDocumentStatus) => {
    switch (status) {
      case 'aprobado':
        return {
          label: 'Aprobado por el Administrador',
          shortLabel: 'Aprobado',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          dotColor: 'bg-emerald-400',
          desc: 'Validado satisfactoriamente por el equipo de administración de AndesMovi.',
        };
      case 'en_revision':
        return {
          label: 'En Revisión por el Administrador',
          shortLabel: 'En Revisión',
          color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          badgeBg: 'bg-sky-500/20 text-sky-300',
          icon: <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />,
          dotColor: 'bg-sky-400',
          desc: 'Documento en cola de inspección oficial. Tiempo estimado de revisión: 15 a 30 minutos.',
        };
      case 'pendiente':
        return {
          label: 'Pendiente de Subir / Validar',
          shortLabel: 'Pendiente',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          badgeBg: 'bg-amber-500/20 text-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
          dotColor: 'bg-amber-400',
          desc: 'Aún no has adjuntado el documento o requiere confirmación antes de la revisión.',
        };
      case 'rechazado':
      default:
        return {
          label: 'Rechazado por el Administrador',
          shortLabel: 'Rechazado',
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          badgeBg: 'bg-rose-500/20 text-rose-300',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          dotColor: 'bg-rose-400',
          desc: 'No cumple los requisitos estipulados por la plataforma o documento caducado.',
        };
    }
  };

  const overallBadge = getStatusBadge(overallStatus);

  // Quick stats: Approved count
  const approvedDocsCount = [
    licenseStatus === 'aprobado',
    criminalStatus === 'aprobado',
    rtvStatus === 'aprobado',
  ].filter(Boolean).length;

  return (
    <div
      id="driver-verification-status-component"
      className={`rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-all text-slate-800 dark:text-zinc-100 ${className}`}
    >
      {/* Header Banner */}
      <div
        className={`p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          overallStatus === 'aprobado'
            ? 'bg-gradient-to-r from-emerald-500/5 via-slate-50 to-slate-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900'
            : overallStatus === 'en_revision'
            ? 'bg-gradient-to-r from-sky-500/5 via-slate-50 to-slate-50 dark:from-sky-950/40 dark:via-zinc-900 dark:to-zinc-900'
            : overallStatus === 'rechazado'
            ? 'bg-gradient-to-r from-rose-500/5 via-slate-50 to-slate-50 dark:from-rose-950/40 dark:via-zinc-900 dark:to-zinc-900'
            : 'bg-gradient-to-r from-amber-500/5 via-slate-50 to-slate-50 dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-2xl border ${
              overallStatus === 'aprobado'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-500/40'
                : overallStatus === 'en_revision'
                ? 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 dark:border-sky-500/40'
                : overallStatus === 'rechazado'
                ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/40'
                : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/40'
            }`}
          >
            {overallStatus === 'aprobado' ? (
              <ShieldCheck className="w-5 h-5" />
            ) : overallStatus === 'en_revision' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : overallStatus === 'rechazado' ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Estado de Verificación de Conductor
              </h3>
              <span
                className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${overallBadge.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${overallBadge.dotColor}`} />
                <span>{overallBadge.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Auditoría oficial de documentos exigidos por la legislación ecuatoriana y AndesMovi
            </p>
          </div>
        </div>

        {/* Quick progress counter */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs">
          <span className="text-slate-500 dark:text-zinc-400 text-[11px] font-semibold">Progreso Documental:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-100 dark:bg-zinc-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${
                  approvedDocsCount === 3
                    ? 'bg-emerald-400'
                    : approvedDocsCount > 0
                    ? 'bg-sky-400'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${(approvedDocsCount / 3) * 100}%` }}
              />
            </div>
            <span className="font-mono font-black text-slate-800 dark:text-white text-xs">
              {approvedDocsCount}/3 Aprobados
            </span>
          </div>
        </div>
      </div>

      {/* Auto Verification Trigger Banner */}
      <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-zinc-900 to-indigo-950/80 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Validación Automática de Documentos vía API</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AI + REGISTRO CIVIL & ANT
              </span>
            </span>
            <p className="text-[11px] text-zinc-300">
              Verificación instantánea en tiempo real de Cédula (Módulo 10), Licencia ANT y Antecedentes Penales sin esperas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRunAutoVerification}
          disabled={isAutoVerifying}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-zinc-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
        >
          {isAutoVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Verificando con API...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-zinc-950 text-zinc-950" />
              <span>⚡ Ejecutar Verificación Automática API</span>
            </>
          )}
        </button>
      </div>

      {autoVerificationSuccess && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{autoVerificationSuccess}</span>
        </div>
      )}

      {/* Main Content: Breakdown by Document */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* DOCUMENT 1: LICENCIA DE CONDUCIR ANT */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/90 transition-all hover:border-slate-300 dark:hover:border-zinc-700 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-800 dark:text-white">
                    1. Licencia de Conducir (ANT Ecuador)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                    {documents.licenseType}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                  Cédula/Licencia: <strong className="text-slate-700 dark:text-zinc-300 font-mono">{documents.licenseNumber}</strong> • Caduca:{' '}
                  <strong className={documents.isLicenseValid ? 'text-slate-700 dark:text-zinc-300' : 'text-rose-500 dark:text-rose-400'}>
                    {documents.licenseExpiration}
                  </strong>
                </span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${getStatusBadge(licenseStatus).color}`}
              >
                {getStatusBadge(licenseStatus).icon}
                <span>{getStatusBadge(licenseStatus).shortLabel}</span>
              </span>

              <button
                type="button"
                onClick={() => setExpandedDoc(expandedDoc === 'license' ? null : 'license')}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors"
                title="Ver detalle del documento"
              >
                {expandedDoc === 'license' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Description / Admin feedback */}
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-850 text-xs flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-zinc-300">
                {documents.licenseReviewerNotes || getStatusBadge(licenseStatus).desc}
              </p>
              {documents.licenseReviewedAt && (
                <span className="text-[10px] text-zinc-500 block">
                  Última revisión: {documents.licenseReviewedAt} por Auditoría AndesMovi
                </span>
              )}
            </div>
          </div>

          {/* Expanded detail with photo preview */}
          {expandedDoc === 'license' && (
            <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400">Anverso de la Licencia:</span>
                <img
                  src={documents.licenseFrontPhoto || null}
                  alt="Licencia Anverso"
                  className="w-full h-20 object-cover rounded-xl border border-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400">Reverso de la Licencia:</span>
                <img
                  src={documents.licenseBackPhoto || null}
                  alt="Licencia Reverso"
                  className="w-full h-20 object-cover rounded-xl border border-zinc-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* DOCUMENT 2: ANTECEDENTES PENALES */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 transition-all hover:border-zinc-700 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white">
                    2. Antecedentes Penales (Policía Nacional del Ecuador)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Máx 2 sin gravedad
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 block">
                  Certificado:{' '}
                  <strong className="text-zinc-300 font-mono">
                    {documents.criminalRecordCertificateNumber}
                  </strong>{' '}
                  • Registros:{' '}
                  <strong
                    className={
                      documents.criminalRecordCount <= 2 && !documents.hasSevereRecord
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }
                  >
                    {documents.criminalRecordCount} {documents.hasSevereRecord ? '(Con Gravedad)' : '(Sin Gravedad)'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${getStatusBadge(criminalStatus).color}`}
              >
                {getStatusBadge(criminalStatus).icon}
                <span>{getStatusBadge(criminalStatus).shortLabel}</span>
              </span>

              <button
                type="button"
                onClick={() => setExpandedDoc(expandedDoc === 'criminal' ? null : 'criminal')}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors"
                title="Ver detalle del certificado"
              >
                {expandedDoc === 'criminal' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Description / Admin feedback */}
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-850 text-xs flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-zinc-300">
                {documents.criminalRecordReviewerNotes || getStatusBadge(criminalStatus).desc}
              </p>
              {documents.criminalRecordReviewedAt && (
                <span className="text-[10px] text-zinc-500 block">
                  Última revisión: {documents.criminalRecordReviewedAt} por Auditoría AndesMovi
                </span>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {expandedDoc === 'criminal' && (
            <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-300 space-y-1.5 animate-fadeIn">
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span>Normativa Oficial AndesMovi:</span>
                <span className="font-bold text-emerald-400">Acepta hasta 2 contravenciones menores sin dolo</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Verificación cruzada con la base de datos de la Policía Nacional y Ministerio de Gobierno del Ecuador.
              </p>
            </div>
          )}
        </div>

        {/* DOCUMENT 3: REVISIÓN TÉCNICA VEHICULAR (RTV) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 transition-all hover:border-zinc-700 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white">
                    3. Revisión Técnica Vehicular y Matrícula
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Año {documents.rtvInspectionYear}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 block">
                  Placa vehicular: <strong className="text-amber-300 font-mono">{documents.vehicleRegistrationPlate}</strong> • RTV:{' '}
                  <strong className="text-zinc-300 capitalize">{documents.rtvStatus}</strong>
                </span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${getStatusBadge(rtvStatus).color}`}
              >
                {getStatusBadge(rtvStatus).icon}
                <span>{getStatusBadge(rtvStatus).shortLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Callout Banner based on Overall Status */}
        {overallStatus === 'aprobado' ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-emerald-200 font-medium">
                ¡Tu cuenta de conductor está <strong>100% Verificada y Aprobada</strong>! Puedes recibir viajes y pedidos en el radar.
              </span>
            </div>
          </div>
        ) : overallStatus === 'en_revision' ? (
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 text-sky-400 animate-spin flex-shrink-0" />
              <span className="text-sky-200 font-medium">
                Tus documentos están <strong>En Revisión por el Administrador</strong>. Recibirás una notificación en cuanto se complete la verificación.
              </span>
            </div>
          </div>
        ) : overallStatus === 'pendiente' ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-amber-200 font-medium">
                Tienes documentos <strong>Pendientes de Validación</strong>. Sube tus archivos para iniciar la revisión del administrador.
              </span>
            </div>
            {onNavigateToUpload && (
              <button
                type="button"
                onClick={onNavigateToUpload}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-1 flex-shrink-0"
              >
                <span>Subir Documentos</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="text-rose-200 font-medium">
                Uno o más documentos fueron <strong>Rechazados por el Administrador</strong>. Por favor actualízalos para reactivar tu cuenta.
              </span>
            </div>
            {onNavigateToUpload && (
              <button
                type="button"
                onClick={onNavigateToUpload}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition-all flex items-center justify-center gap-1 flex-shrink-0"
              >
                <span>Corregir Documentos</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

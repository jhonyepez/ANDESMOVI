import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Check,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  FlipHorizontal,
  Smartphone,
  Eye,
} from 'lucide-react';
import { haptic } from '../utils/haptics';

export interface CameraPhotoCaptureProps {
  value?: string | null;
  onChange: (photoDataUrl: string) => void;
  onClear?: () => void;
  label?: string;
  description?: string;
  required?: boolean;
  shape?: 'circle' | 'rectangle';
  isDark?: boolean;
  className?: string;
  accountRole?: string;
}

export const CameraPhotoCapture: React.FC<CameraPhotoCaptureProps> = ({
  value,
  onChange,
  onClear,
  label = 'Foto de Rostro en Tiempo Real',
  description = 'Por seguridad en AndesMovi, tómate una foto nítida de tu rostro con la cámara de tu dispositivo.',
  required = false,
  shape = 'circle',
  isDark = true,
  className = '',
  accountRole = 'cliente',
}) => {
  // Modal state for live camera viewfinder
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isStartingStream, setIsStartingStream] = useState<boolean>(false);

  // Temporary captured photo inside the modal before accepting
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingStream(false);
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Start live camera stream
  const startLiveCamera = async (targetFacing: 'user' | 'environment' = facingMode) => {
    setPermissionError(null);
    setIsStartingStream(true);
    stopLiveCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso directo a la cámara WebRTC.');
      }

      // Constraints with facingMode: 'user' as requested
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: targetFacing,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback for devices without strict facingMode support
        console.warn('Fallback to generic video constraint:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsStartingStream(false);
      setFacingMode(targetFacing);

      // Connect stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((playErr) => {
            console.error('Error auto-playing live video stream:', playErr);
          });
        }
      }, 150);
    } catch (err: any) {
      console.error('getUserMedia permission error:', err);
      setIsStartingStream(false);
      setIsCameraActive(false);
      let errMsg = 'No se pudo acceder a la cámara frontal.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Permiso denegado por el navegador o dispositivo. Concede permiso a la cámara en los ajustes.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No se encontró ninguna cámara disponible en tu dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'La cámara está siendo utilizada por otra aplicación en tu dispositivo.';
      }
      setPermissionError(errMsg);
      haptic.warning();
    }
  };

  // Open the Live Camera Viewfinder Modal
  const handleOpenLiveCameraModal = () => {
    haptic.tap();
    setTempPhotoUrl(null);
    setPermissionError(null);
    setIsOpenModal(true);
    startLiveCamera('user');
  };

  // Close Live Camera Viewfinder Modal
  const handleCloseModal = () => {
    stopLiveCamera();
    setTempPhotoUrl(null);
    setIsOpenModal(false);
  };

  // Toggle between front and back camera
  const handleToggleFacingMode = () => {
    haptic.selection();
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    startLiveCamera(nextFacing);
  };

  // Capture photo from the live video stream onto canvas
  const handleCaptureLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror horizontally for natural portrait orientation
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Get optimized jpeg base64
    const capturedData = canvas.toDataURL('image/jpeg', 0.88);
    haptic.success();

    // Show preview with "Volver a tomar" or "Aceptar"
    setTempPhotoUrl(capturedData);
    stopLiveCamera();
  };

  // User clicks "Volver a tomar"
  const handleRetakePhoto = () => {
    haptic.tap();
    setTempPhotoUrl(null);
    startLiveCamera(facingMode);
  };

  // User clicks "Aceptar foto"
  const handleAcceptPhoto = () => {
    if (!tempPhotoUrl) return;
    haptic.success();
    onChange(tempPhotoUrl);
    setIsOpenModal(false);
    setTempPhotoUrl(null);
    stopLiveCamera();
  };

  // Handler for direct native mobile capture: <input type="file" accept="image/*" capture="user">
  const handleNativeCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        haptic.success();
        // Open the preview confirmation modal with 'Volver a tomar' and 'Aceptar'
        setTempPhotoUrl(dataUrl);
        setIsOpenModal(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value to allow re-selection
    e.target.value = '';
  };

  // Handler for gallery file upload
  const handleGalleryUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        haptic.success();
        setTempPhotoUrl(dataUrl);
        setIsOpenModal(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden Native Mobile Camera Input: <input type="file" accept="image/*" capture="user"> */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleNativeCaptureChange}
        className="hidden"
        id="native-camera-capture-input"
      />

      {/* Hidden Gallery Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryUploadChange}
        className="hidden"
        id="gallery-file-input"
      />

      {/* Header and Label */}
      <div className="flex items-center justify-between">
        <label className={`block text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-amber-300' : 'text-amber-700'
        }`}>
          <Camera className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {value ? (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> Foto Capturada
          </span>
        ) : (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isDark ? 'text-zinc-400 bg-zinc-800' : 'text-slate-500 bg-slate-100'
          }`}>
            {accountRole === 'conductor' ? 'Obligatoria' : 'Recomendada'}
          </span>
        )}
      </div>

      {description && (
        <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          {description}
        </p>
      )}

      {/* Current Photo Display & Primary Action Buttons */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 transition-all ${
        isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Photo Thumbnail / Preview Circle */}
        <div className="relative group shrink-0">
          <div
            className={`w-28 h-28 overflow-hidden border-2 shadow-lg flex items-center justify-center relative transition-all ${
              shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            } ${
              value
                ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                : isDark
                ? 'border-zinc-700 bg-zinc-900'
                : 'border-slate-300 bg-slate-100'
            }`}
          >
            {value ? (
              <img
                src={value}
                alt="Foto de perfil del usuario"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-500">
                <Camera className="w-8 h-8 mb-1 opacity-70" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Sin foto</span>
              </div>
            )}
          </div>

          {value && (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-zinc-950 p-1 rounded-full shadow-md">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-1 w-full space-y-2">
          {/* PRIMARY BUTTON: "Tomar foto con la cámara" */}
          <button
            type="button"
            id="btn-open-camera-viewfinder"
            onClick={handleOpenLiveCameraModal}
            className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Tomar foto con la cámara</span>
          </button>

          {/* SECONDARY ROW: Native Camera & Gallery Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Native Mobile Camera trigger (<input type="file" capture="user">) */}
            <button
              type="button"
              id="btn-trigger-native-camera"
              onClick={() => {
                haptic.tap();
                nativeCameraInputRef.current?.click();
              }}
              className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-500" />
              <span>Cámara directa (Móvil)</span>
            </button>

            {/* Gallery Upload Option */}
            <button
              type="button"
              id="btn-trigger-gallery-upload"
              onClick={() => {
                haptic.tap();
                galleryInputRef.current?.click();
              }}
              className={`py-2 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Subir de archivos</span>
            </button>
          </div>

          {value && onClear && (
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  haptic.tap();
                  onClear();
                }}
                className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Eliminar foto actual</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =============================================================== */}
      {/* LIVE CAMERA VIEWFINDER & PHOTO CONFIRMATION MODAL OVERLAY       */}
      {/* =============================================================== */}
      {isOpenModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    {tempPhotoUrl ? 'Vista Previa de la Foto' : 'Visor de Cámara en Vivo'}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {tempPhotoUrl
                      ? 'Confirma que tu rostro esté nítido y reconocible'
                      : 'Encuadra tu rostro dentro del visor'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'
                }`}
                title="Cerrar cámara"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Live Viewfinder or Photo Preview */}
            <div className="p-4 sm:p-5 flex flex-col items-center justify-center overflow-y-auto space-y-4">
              {/* Permission Error Display */}
              {permissionError && (
                <div className="w-full p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Acceso a la cámara:</strong>
                      <p className="text-[11px] text-rose-200 leading-relaxed mt-0.5">{permissionError}</p>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => startLiveCamera(facingMode)}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reintentar Permiso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        nativeCameraInputRef.current?.click();
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Abrir Cámara Nativa</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Viewfinder Container */}
              <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-black border-2 border-amber-500/60 shadow-2xl flex items-center justify-center">
                {/* 1. Captured Photo Preview Mode */}
                {tempPhotoUrl ? (
                  <img
                    src={tempPhotoUrl}
                    alt="Foto capturada"
                    className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-200"
                  />
                ) : (
                  /* 2. Live Video Viewfinder Mode */
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        facingMode === 'user' ? 'transform -scale-x-100' : ''
                      }`}
                    />

                    {/* Face Framing Overlay with Oval Guide */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                      {/* Oval face guide */}
                      <div className="w-48 h-60 rounded-full border-2 border-dashed border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center justify-center relative">
                        {/* Eye level guidance line */}
                        <div className="w-16 h-0.5 bg-amber-400/50 absolute top-20" />
                        {/* Target badge */}
                        <div className="absolute -top-3 bg-amber-500 text-zinc-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                          Rostro Aquí
                        </div>
                      </div>

                      {/* Bottom hint inside viewfinder */}
                      <div className="absolute bottom-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-amber-300 font-bold border border-amber-500/30">
                        {facingMode === 'user' ? '👤 Cámara Frontal' : '📷 Cámara Posterior'}
                      </div>
                    </div>

                    {/* Loading spinner while stream starts */}
                    {isStartingStream && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-amber-400 text-xs font-bold">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span>Iniciando cámara frontal...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Viewfinder Controls / Action Buttons */}
              {tempPhotoUrl ? (
                /* PREVIEW CONFIRMATION BUTTONS: "Volver a tomar" o "Aceptar" */
                <div className="w-full space-y-2.5 pt-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Excelente captura! ¿Deseas usar esta foto?</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      id="btn-retake-photo"
                      onClick={handleRetakePhoto}
                      className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4 text-amber-500" />
                      <span>Volver a tomar</span>
                    </button>

                    <button
                      type="button"
                      id="btn-accept-photo"
                      onClick={handleAcceptPhoto}
                      className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Aceptar foto</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* LIVE STREAM CAPTURE CONTROLS */
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center gap-4 w-full">
                    {/* Toggle camera facing button (Front/Back) */}
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                      title="Girar cámara (Frontal / Trasera)"
                    >
                      <FlipHorizontal className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">Girar cámara</span>
                    </button>

                    {/* BIG SHUTTER CAPTURE BUTTON */}
                    <button
                      type="button"
                      id="btn-capture-live-photo"
                      onClick={handleCaptureLivePhoto}
                      disabled={!isCameraActive || isStartingStream}
                      className="flex-1 max-w-[200px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4 shrink-0" />
                      <span>Capturar foto</span>
                    </button>

                    {/* Direct Native Camera Fallback */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        nativeCameraInputRef.current?.click();
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                      title="Abrir cámara nativa de Android/iOS"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="hidden sm:inline">Nativa</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-400 text-center">
                    💡 Asegúrate de estar en un lugar con buena iluminación y mirar directamente a la cámara.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  X,
  Code2,
  Play,
  Layers,
  Car,
  Bike,
  Sparkles,
  Compass,
  Zap,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface MobileSdkGuideModalProps {
  onClose: () => void;
  onOpenFlutterDesign?: () => void;
  isDark?: boolean;
}

export const MobileSdkGuideModal: React.FC<MobileSdkGuideModalProps> = ({
  onClose,
  onOpenFlutterDesign,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'demo'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [demoVehicle, setDemoVehicle] = useState<'auto' | 'moto'>('auto');
  const [demoMode, setDemoMode] = useState<'smooth' | 'jumpy'>('smooth');
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const ANDROID_KOTLIN_CODE = `// =========================================================================
// Maps SDK for Android - Animación Fluida de Marcador de Auto o Moto
// Reemplaza la flecha predeterminada por imagen de vehículo y anima entre coordenadas
// =========================================================================

package com.andesmovi.tracking.maps

import android.animation.TypeEvaluator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.core.content.ContextCompat
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import kotlin.math.*

class VehicleMarkerManager(
    private val context: Context,
    private val googleMap: GoogleMap
) {
    private var vehicleMarker: Marker? = null
    private var currentAnimator: ValueAnimator? = null
    private var currentBearing: Float = 0f

    /**
     * Crea o actualiza el marcador con icono de Auto o Moto
     */
    fun setupVehicleMarker(
        startPosition: LatLng,
        vehicleType: String // "auto" o "moto"
    ): Marker {
        val iconDrawableId = if (vehicleType == "moto") {
            R.drawable.ic_moto_marker // Vector o PNG de moto (vista cenital)
        } else {
            R.drawable.ic_car_marker  // Vector o PNG de auto (vista cenital)
        }

        val iconBitmap = bitmapFromVector(context, iconDrawableId)

        val markerOptions = MarkerOptions()
            .position(startPosition)
            .icon(iconBitmap)
            .anchor(0.5f, 0.5f) // Centrado geométrico para rotación precisa
            .flat(true)         // Permite rotar plano sobre el mapa con el rumbo
            .zIndex(10f)

        vehicleMarker = googleMap.addMarker(markerOptions)
        return vehicleMarker!!
    }

    /**
     * Anima fluidamente la posición y rotación del marcador entre coordenadas (GPS / WebSocket)
     * Duración recomendada: 1500ms - 2500ms (igual al intervalo de emisión del backend)
     */
    fun animateMarker(
        newPosition: LatLng,
        durationMs: Long = 2000L
    ) {
        val marker = vehicleMarker ?: return
        val startPosition = marker.position

        // Cancela animación anterior si llega una actualización antes de terminar
        currentAnimator?.cancel()

        // 1. Calcula rumbo (bearing) hacia la nueva posición
        val targetBearing = computeBearing(startPosition, newPosition)

        // 2. Evaluador de coordenadas LatLng (interpolación esférica)
        val latLngEvaluator = TypeEvaluator<LatLng> { fraction, start, end ->
            val lat = start.latitude + (end.latitude - start.latitude) * fraction
            val lng = start.longitude + (end.longitude - start.longitude) * fraction
            LatLng(lat, lng)
        }

        // 3. ValueAnimator a 60 FPS con aceleración/desaceleración suave
        currentAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = durationMs
            interpolator = AccelerateDecelerateInterpolator()

            addUpdateListener { animator ->
                val v = animator.animatedFraction
                
                // Actualiza posición interpolada sin saltos
                marker.position = latLngEvaluator.evaluate(v, startPosition, newPosition)

                // Rota suavemente el vehículo hacia la dirección del movimiento
                marker.rotation = interpolateAngle(currentBearing, targetBearing, v)
            }

            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) {
                    currentBearing = targetBearing
                }
            })

            start()
        }
    }

    /**
     * Cálculo de Bearing esférico entre coordenadas
     */
    private fun computeBearing(from: LatLng, to: LatLng): Float {
        val lat1 = Math.toRadians(from.latitude)
        val lng1 = Math.toRadians(from.longitude)
        val lat2 = Math.toRadians(to.latitude)
        val lng2 = Math.toRadians(to.longitude)

        val dLng = lng2 - lng1
        val y = sin(dLng) * cos(lat2)
        val x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLng)
        var brng = Math.toDegrees(atan2(y, x)).toFloat()
        brng = (brng + 360f) % 360f
        return brng
    }

    /**
     * Interpolación de ángulo evitando giros bruscos de 360 grados
     */
    private fun interpolateAngle(startAngle: Float, endAngle: Float, fraction: Float): Float {
        var diff = (endAngle - startAngle) % 360f
        if (diff > 180f) diff -= 360f
        if (diff < -180f) diff += 360f
        return (startAngle + diff * fraction + 360f) % 360f
    }

    private fun bitmapFromVector(context: Context, vectorResId: Int): BitmapDescriptor {
        val drawable = ContextCompat.getDrawable(context, vectorResId)!!
        drawable.setBounds(0, 0, drawable.intrinsicWidth, drawable.intrinsicHeight)
        val bitmap = Bitmap.createBitmap(
            drawable.intrinsicWidth,
            drawable.intrinsicHeight,
            Bitmap.Config.ARGB_8888
        )
        val canvas = Canvas(bitmap)
        drawable.draw(canvas)
        return BitmapDescriptorFactory.fromBitmap(bitmap)
    }
}`;

  const IOS_SWIFT_CODE = `// =========================================================================
// Maps SDK for iOS - Animación Fluida de Marcador de Auto o Moto
// Reemplaza la clásica flecha por imagen de vehículo y anima con CATransaction
// =========================================================================

import Foundation
import UIKit
import GoogleMaps

final class VehicleMarkerManager {
    private weak var mapView: GMSMapView?
    private var vehicleMarker: GMSMarker?
    private var currentBearing: CLLocationDegrees = 0.0

    init(mapView: GMSMapView) {
        self.mapView = mapView
    }

    /**
     * Inicializa el marcador sustituyendo la flecha clásica por imagen de Auto o Moto
     */
    func setupVehicleMarker(
        at coordinate: CLLocationCoordinate2D,
        vehicleType: String // "auto" o "moto"
    ) -> GMSMarker {
        let imageName = (vehicleType == "moto") ? "ic_moto_marker" : "ic_car_marker"
        guard let vehicleImage = UIImage(named: imageName) else {
            fatalError("Asset de vehículo no encontrado")
        }

        let marker = GMSMarker(position: coordinate)
        marker.icon = vehicleImage
        marker.groundAnchor = CGPoint(x: 0.5, y: 0.5) // Eje central para rotación realista
        marker.isFlat = true                           // Se apoya en plano sobre el mapa
        marker.zIndex = 10
        marker.map = mapView

        self.vehicleMarker = marker
        return marker
    }

    /**
     * Anima suavemente el marcador a la nueva coordenada con CATransaction de Core Animation
     * Evita que el marcador se vea 'saltón' aplicando interpolación fluida a 60 FPS
     */
    func animateTo(
        newCoordinate: CLLocationCoordinate2D,
        duration: CFTimeInterval = 2.0
    ) {
        guard let marker = self.vehicleMarker else { return }

        // Calcula el ángulo de rumbo (bearing) hacia la nueva coordenada
        let targetBearing = computeBearing(from: marker.position, to: newCoordinate)

        // CATransaction proporciona animación implícita nativa de Google Maps SDK
        CATransaction.begin()
        CATransaction.setAnimationDuration(duration)
        CATransaction.setAnimationTimingFunction(
            CAMediaTimingFunction(name: .easeInEaseOut)
        )

        // 1. Actualiza posición (Maps SDK for iOS interpola automáticamente con CATransaction)
        marker.position = newCoordinate

        // 2. Rota el vehículo para mirar hacia la nueva dirección
        marker.rotation = targetBearing

        CATransaction.setCompletionBlock { [weak self] in
            self?.currentBearing = targetBearing
        }

        CATransaction.commit()
    }

    /**
     * Calcula rumbo (bearing) en grados (0 - 360)
     */
    private func computeBearing(
        from: CLLocationCoordinate2D,
        to: CLLocationCoordinate2D
    ) -> CLLocationDegrees {
        let lat1 = from.latitude * .pi / 180.0
        let lon1 = from.longitude * .pi / 180.0
        let lat2 = to.latitude * .pi / 180.0
        let lon2 = to.longitude * .pi / 180.0

        let dLon = lon2 - lon1
        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        let radiansBearing = atan2(y, x)
        var degrees = radiansBearing * 180.0 / .pi
        degrees = (degrees + 360.0).truncatingRemainder(dividingBy: 360.0)
        return degrees
    }
}`;

  // Run interactive demo
  const startDemo = () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    setDemoProgress(0);

    const startTime = Date.now();
    const duration = 2400;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (demoMode === 'jumpy') {
        // Teleport at intervals
        if (progress < 0.33) setDemoProgress(0);
        else if (progress < 0.66) setDemoProgress(0.5);
        else setDemoProgress(1);
      } else {
        // Fluid interpolated
        const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        setDemoProgress(eased);
      }

      if (progress >= 1) {
        clearInterval(interval);
        setIsDemoRunning(false);
      }
    }, 16);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  SDK Móvil: Android & iOS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Maps SDK
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Sustitución de flechas por Auto o Moto con movimiento fluido sin saltos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-zinc-800 bg-zinc-950/30">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'android'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span>🤖 Android (Kotlin)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ios'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span>🍎 iOS (Swift)</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'demo'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulador de Fluidez</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'android' && (
            <div className="space-y-4">
              {/* Google Play Android 16 (API 36) Target API Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-teal-950/60 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/40">
                      GOOGLE PLAY CONSOLE: API 36
                    </span>
                    <span className="text-xs font-black text-white">Requisitos de API Objetivo Android 16 (API 36)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Configurado para Google Play con <code className="text-emerald-300 font-mono">compileSdk = 36</code>, <code className="text-emerald-300 font-mono">targetSdk = 36</code>, soporte de páginas de memoria de 16 KB y Foreground Service de Ubicación.
                  </p>
                </div>
                {onOpenFlutterDesign && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFlutterDesign();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-md"
                  >
                    <span>Ver Configuración Gradle</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-zinc-300 font-medium">
                    Implementación completa con <strong>ValueAnimator</strong> y <strong>TypeEvaluator</strong>
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(ANDROID_KOTLIN_CODE, 'android')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold self-start sm:self-auto transition-colors"
                >
                  {copiedKey === 'android' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Kotlin</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>VehicleMarkerManager.kt (Maps SDK for Android)</span>
                  <span className="text-emerald-400 font-mono">60 FPS Interpolation</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[50vh] leading-relaxed">
                  {ANDROID_KOTLIN_CODE}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-zinc-300 font-medium">
                    Implementación completa con <strong>CATransaction</strong> y <strong>GMSMarker</strong>
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(IOS_SWIFT_CODE, 'ios')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold self-start sm:self-auto transition-colors"
                >
                  {copiedKey === 'ios' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Swift</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>VehicleMarkerManager.swift (Maps SDK for iOS)</span>
                  <span className="text-emerald-400 font-mono">CoreAnimation Smooth</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[50vh] leading-relaxed">
                  {IOS_SWIFT_CODE}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Comparativa en Vivo: ¿Por qué animar el marcador?</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  En aplicaciones de movilidad (como Uber o DiDi), las actualizaciones GPS llegan cada 2 a 4 segundos.
                  Si colocas las coordenadas de golpe, el vehículo da saltos bruscos. Con interpolación continua,
                  el vehículo se desplaza y gira suavemente a 60 FPS por la calle.
                </p>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
                    <button
                      onClick={() => setDemoVehicle('auto')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        demoVehicle === 'auto' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>Auto</span>
                    </button>
                    <button
                      onClick={() => setDemoVehicle('moto')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        demoVehicle === 'moto' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Moto</span>
                    </button>
                  </div>

                  <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1">
                    <button
                      onClick={() => setDemoMode('smooth')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        demoMode === 'smooth'
                          ? 'bg-emerald-500 text-zinc-950 font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      ✨ Animación Fluida
                    </button>
                    <button
                      onClick={() => setDemoMode('jumpy')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        demoMode === 'jumpy'
                          ? 'bg-rose-500 text-white font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      ⚠️ Saltón (Sin animar)
                    </button>
                  </div>

                  <button
                    onClick={startDemo}
                    disabled={isDemoRunning}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isDemoRunning ? 'Simulando viaje...' : 'Iniciar Movimiento'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Visual Runway */}
              <div className="relative h-44 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col justify-center px-8">
                {/* Street lane markings */}
                <div className="absolute inset-x-0 h-20 bg-zinc-900/80 border-y border-zinc-800 flex items-center">
                  <div className="w-full border-t border-dashed border-zinc-700/60" />
                </div>

                {/* Pickup and Destination Points */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-xs font-black text-emerald-400">
                    A
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 font-semibold">Origen</span>
                </div>

                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-xs font-black text-rose-400">
                    B
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 font-semibold">Destino</span>
                </div>

                {/* Animated Vehicle Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 z-20 transition-all pointer-events-none"
                  style={{
                    left: `calc(48px + ${demoProgress} * (100% - 140px))`,
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Ripple halo */}
                    <div className="absolute w-12 h-12 rounded-full bg-amber-500/20 animate-ping pointer-events-none" />

                    {/* Vehicle SVG Icon */}
                    <div className="w-11 h-11 rounded-2xl bg-zinc-950 border-2 border-amber-400 shadow-xl flex items-center justify-center text-amber-400 transform transition-transform">
                      {demoVehicle === 'auto' ? (
                        <Car className="w-6 h-6" />
                      ) : (
                        <Bike className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary note */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Integrado en AndesMovi:</strong> Este mismo principio de interpolación matemática suave se encuentra activo en el mapa en vivo de AndesMovi (tanto en Google Maps SDK como en radar de contingencia).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compatible con Google Maps SDK v3+ (Android & iOS)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

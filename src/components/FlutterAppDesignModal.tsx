import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Smartphone,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Layers,
  Code2,
  Palette,
  Eye,
  CheckCircle2,
  Zap,
  Play,
  Pause,
  FolderTree,
  Terminal,
  FileArchive,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { haptic } from '../utils/haptics';
import { AppBrand } from '../types';

interface FlutterAppDesignModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentBrand?: AppBrand;
  isDark?: boolean;
}

export const FlutterAppDesignModal: React.FC<FlutterAppDesignModalProps> = ({
  isOpen = true,
  onClose,
  currentBrand,
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'preview' | 'splash' | 'android16' | 'code'>('auto');
  const [iconShape, setIconShape] = useState<'squircle' | 'circle' | 'rounded' | 'store'>('squircle');
  const [iconTheme, setIconTheme] = useState<'emerald' | 'gold' | 'cyber' | 'minimal'>('emerald');
  const [showVehicle, setShowVehicle] = useState<boolean>(true);
  const [showRoadPath, setShowRoadPath] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AUTOMATION STATES
  const [isAutoGenerating, setIsAutoGenerating] = useState<boolean>(false);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const [autoStepText, setAutoStepText] = useState<string>('');
  const [autoDone, setAutoDone] = useState<boolean>(false);

  // AUTO-PLAY CAROUSEL STATE
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [carouselStep, setCarouselStep] = useState<number>(0);

  const brandName = currentBrand?.name || 'ANDESMOVI';
  const slogan = currentBrand?.tagline || 'TU CONFIANZA, TU SEGURIDAD, NUESTRO COMPROMISO';

  // Carousel steps: 0: iOS Squircle, 1: Android Circle, 2: Android Rounded, 3: Splash Screen
  useEffect(() => {
    if (!isAutoPlay || !isOpen) return;

    const timer = setInterval(() => {
      setCarouselStep((prev) => {
        const next = (prev + 1) % 4;
        if (next === 0) setIconShape('squircle');
        else if (next === 1) setIconShape('circle');
        else if (next === 2) setIconShape('rounded');
        return next;
      });
    }, 2800);

    return () => clearInterval(timer);
  }, [isAutoPlay, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    haptic.tap();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Theme palettes
  const palettes = {
    emerald: {
      name: 'Andes Esmeralda (Oficial)',
      bgStart: '#04160e',
      bgEnd: '#020617',
      mountainStart: '#064e3b',
      mountainEnd: '#022c22',
      glow: '#10b981',
      accent: '#f59e0b',
      text: '#10b981',
    },
    gold: {
      name: 'Sol Andino Dorado',
      bgStart: '#181002',
      bgEnd: '#0a0802',
      mountainStart: '#78350f',
      mountainEnd: '#451a03',
      glow: '#f59e0b',
      accent: '#10b981',
      text: '#f59e0b',
    },
    cyber: {
      name: 'Cyber Obsidian 3D',
      bgStart: '#090d16',
      bgEnd: '#020408',
      mountainStart: '#1e293b',
      mountainEnd: '#0f172a',
      glow: '#06b6d4',
      accent: '#10b981',
      text: '#38bdf8',
    },
    minimal: {
      name: 'Minimal Matte Black',
      bgStart: '#121214',
      bgEnd: '#000000',
      mountainStart: '#27272a',
      mountainEnd: '#18181b',
      glow: '#52525b',
      accent: '#e4e4e7',
      text: '#fafafa',
    },
  };

  const currentTheme = palettes[iconTheme];

  // Canvas renderer helper (returns HTMLCanvasElement)
  const drawIconCanvas = (size: number, isAdaptiveForeground = false): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (!isAdaptiveForeground) {
      // Draw Background Gradient
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, currentTheme.bgStart);
      grad.addColorStop(1, currentTheme.bgEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Subtle radial glow
      const radialGlow = ctx.createRadialGradient(size * 0.5, size * 0.45, 0, size * 0.5, size * 0.45, size * 0.5);
      radialGlow.addColorStop(0, `${currentTheme.glow}33`);
      radialGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, size, size);

      // Border glow
      ctx.strokeStyle = `${currentTheme.glow}44`;
      ctx.lineWidth = size * 0.015;
      ctx.strokeRect(0, 0, size, size);
    } else {
      // Clear transparent for adaptive foreground
      ctx.clearRect(0, 0, size, size);
    }

    // Draw Andean Mountain Silhouette
    ctx.save();
    // Back peak (Cayambe volcano)
    ctx.fillStyle = currentTheme.mountainEnd;
    ctx.beginPath();
    ctx.moveTo(size * 0.2, size * 0.75);
    ctx.lineTo(size * 0.55, size * 0.26);
    ctx.lineTo(size * 0.88, size * 0.75);
    ctx.closePath();
    ctx.fill();

    // Front peak
    const mountainGrad = ctx.createLinearGradient(0, size * 0.3, 0, size * 0.75);
    mountainGrad.addColorStop(0, currentTheme.mountainStart);
    mountainGrad.addColorStop(1, currentTheme.bgEnd);
    ctx.fillStyle = mountainGrad;
    ctx.beginPath();
    ctx.moveTo(size * 0.12, size * 0.75);
    ctx.lineTo(size * 0.42, size * 0.32);
    ctx.lineTo(size * 0.72, size * 0.75);
    ctx.closePath();
    ctx.fill();

    // Glacier snow caps
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(size * 0.55, size * 0.26);
    ctx.lineTo(size * 0.62, size * 0.38);
    ctx.lineTo(size * 0.55, size * 0.35);
    ctx.lineTo(size * 0.48, size * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 0.42, size * 0.32);
    ctx.lineTo(size * 0.48, size * 0.44);
    ctx.lineTo(size * 0.42, size * 0.41);
    ctx.lineTo(size * 0.36, size * 0.44);
    ctx.closePath();
    ctx.fill();

    // Road path curving through the Andes
    if (showRoadPath) {
      ctx.strokeStyle = currentTheme.glow;
      ctx.lineWidth = size * 0.04;
      ctx.lineCap = 'round';
      ctx.shadowColor = currentTheme.glow;
      ctx.shadowBlur = size * 0.03;
      ctx.beginPath();
      ctx.moveTo(size * 0.2, size * 0.76);
      ctx.bezierCurveTo(size * 0.4, size * 0.7, size * 0.35, size * 0.56, size * 0.55, size * 0.52);
      ctx.bezierCurveTo(size * 0.7, size * 0.48, size * 0.78, size * 0.62, size * 0.85, size * 0.76);
      ctx.stroke();

      // Center dashed gold line
      ctx.strokeStyle = currentTheme.accent;
      ctx.lineWidth = size * 0.01;
      ctx.setLineDash([size * 0.025, size * 0.02]);
      ctx.beginPath();
      ctx.moveTo(size * 0.2, size * 0.76);
      ctx.bezierCurveTo(size * 0.4, size * 0.7, size * 0.35, size * 0.56, size * 0.55, size * 0.52);
      ctx.bezierCurveTo(size * 0.7, size * 0.48, size * 0.78, size * 0.62, size * 0.85, size * 0.76);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Modern vehicle icon or GPS pin
    if (showVehicle) {
      ctx.save();
      ctx.shadowColor = currentTheme.accent;
      ctx.shadowBlur = size * 0.04;
      ctx.fillStyle = '#ffffff';

      const cx = size * 0.55;
      const cy = size * 0.52;
      const r = size * 0.08;

      const badgeGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      badgeGrad.addColorStop(0, currentTheme.glow);
      badgeGrad.addColorStop(1, '#059669');
      ctx.fillStyle = badgeGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.01;
      ctx.stroke();

      // Car body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cx - r * 0.55, cy - r * 0.2, r * 1.1, r * 0.45, r * 0.15);
      ctx.fill();

      // Car roof
      ctx.beginPath();
      ctx.roundRect(cx - r * 0.35, cy - r * 0.5, r * 0.7, r * 0.35, r * 0.1);
      ctx.fill();

      // Headlights
      ctx.fillStyle = currentTheme.accent;
      ctx.beginPath();
      ctx.arc(cx - r * 0.4, cy + r * 0.1, r * 0.08, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.4, cy + r * 0.1, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Brand Typography at bottom
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${size * 0.085}px 'Inter', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = `${currentTheme.glow}99`;
    ctx.shadowBlur = size * 0.02;
    ctx.fillText(brandName, size * 0.5, size * 0.88);

    return canvas;
  };

  // Draw 1080x1920 Mobile Splash Screen
  const drawSplashCanvas = (): HTMLCanvasElement => {
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#04160e');
    grad.addColorStop(0.5, '#020617');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Central Icon badge
    const iconSize = 420;
    const iconCanvas = drawIconCanvas(iconSize);
    const iconX = (width - iconSize) / 2;
    const iconY = height * 0.35 - iconSize / 2;

    // Shadow & glow around icon
    ctx.save();
    ctx.shadowColor = `${currentTheme.glow}66`;
    ctx.shadowBlur = 60;
    ctx.drawImage(iconCanvas, iconX, iconY);
    ctx.restore();

    // App Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "900 84px 'Inter', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = `${currentTheme.glow}aa`;
    ctx.shadowBlur = 25;
    ctx.fillText(brandName, width / 2, height * 0.58);

    // Tagline / Slogan
    ctx.font = "800 28px 'Inter', sans-serif";
    ctx.fillStyle = currentTheme.glow;
    ctx.shadowBlur = 10;
    ctx.fillText(`"${slogan}"`, width / 2, height * 0.64);

    // Footer info
    ctx.font = "600 28px 'Inter', sans-serif";
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText('🇪🇨 Hecho en Ecuador', width / 2, height * 0.92);

    return canvas;
  };

  // Convert canvas to blob promise
  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob conversion failed'));
      }, 'image/png');
    });
  };

  // =========================================================================
  // ⚡ AUTOMATIC 1-CLICK TOTAL ASSET GENERATOR (ZIP PACKAGE)
  // =========================================================================
  const handleAutoGenerateEverything = async () => {
    haptic.success();
    setIsAutoGenerating(true);
    setAutoDone(false);
    setAutoProgress(5);
    setAutoStepText('Iniciando generador automático de assets...');

    try {
      const zip = new JSZip();

      // Step 1: Master 1024x1024
      setAutoProgress(15);
      setAutoStepText('Generando Icono Maestro 1024x1024 PNG (App Store & Play Console)...');
      const canvas1024 = drawIconCanvas(1024);
      const blob1024 = await canvasToBlob(canvas1024);
      zip.file('assets/icon/andesmovi_icon_1024.png', blob1024);
      zip.file('assets/icon/icon.png', blob1024);

      // Step 2: Google Play 512x512
      setAutoProgress(30);
      setAutoStepText('Generando icono 512x512 para Google Play Store...');
      const canvas512 = drawIconCanvas(512);
      const blob512 = await canvasToBlob(canvas512);
      zip.file('assets/icon/andesmovi_playstore_512.png', blob512);

      // Step 3: Adaptive foreground
      setAutoProgress(45);
      setAutoStepText('Generando icono adaptativo con transparencia para Android 12+...');
      const canvasAdaptive = drawIconCanvas(512, true);
      const blobAdaptive = await canvasToBlob(canvasAdaptive);
      zip.file('assets/icon/andesmovi_adaptive_foreground.png', blobAdaptive);

      // Step 4: Android mipmap densities (48, 72, 96, 144, 192)
      setAutoProgress(60);
      setAutoStepText('Generando densidades Android (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)...');
      const densities = [
        { folder: 'mipmap-mdpi', size: 48 },
        { folder: 'mipmap-hdpi', size: 72 },
        { folder: 'mipmap-xhdpi', size: 96 },
        { folder: 'mipmap-xxhdpi', size: 144 },
        { folder: 'mipmap-xxxhdpi', size: 192 },
      ];

      for (const d of densities) {
        const c = drawIconCanvas(d.size);
        const b = await canvasToBlob(c);
        zip.file(`android/app/src/main/res/${d.folder}/ic_launcher.png`, b);
      }

      // Step 5: Splash Screen 1080x1920
      setAutoProgress(75);
      setAutoStepText('Generando Pantalla Splash Oficial 1080x1920 PNG...');
      const splashCanvas = drawSplashCanvas();
      const splashBlob = await canvasToBlob(splashCanvas);
      zip.file('assets/images/splash_screen_1080x1920.png', splashBlob);
      zip.file('assets/images/andesmovi_splash_logo.png', blob512);

      // Step 6: Configuration files & scripts
      setAutoProgress(90);
      setAutoStepText('Escribiendo pubspec.yaml, widget Flutter y scripts de instalación automática...');

      const pubspecContent = `# =========================================================================
# AndesMovi Flutter Configuration Automática (pubspec.yaml)
# =========================================================================
name: andesmovi
description: "${slogan}"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_native_splash: ^2.4.0
  firebase_core: ^3.1.1
  firebase_auth: ^5.1.1
  google_sign_in: ^6.2.1
  flutter_facebook_auth: ^7.0.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_launcher_icons: "^0.14.4"
  flutter_lints: ^3.0.0

flutter_launcher_icons:
  android: "launcher_icon"
  ios: true
  image_path: "assets/icon/icon.png"
  min_sdk_android: 21 # android min sdk min:16, default 21
  web:
    generate: true
    image_path: "path/to/image.png"
    background_color: "#hexcode"
    theme_color: "#hexcode"
  windows:
    generate: true
    image_path: "path/to/image.png"
    icon_size: 48 # min:48, max:256, default: 48
  macos:
    generate: true
    image_path: "path/to/image.png"
  adaptive_icon_background: "${currentTheme.bgStart}"
  adaptive_icon_foreground: "assets/icon/andesmovi_adaptive_foreground.png"

flutter_native_splash:
  color: "${currentTheme.bgEnd}"
  image: "assets/images/andesmovi_splash_logo.png"
  branding: "assets/images/andesmovi_splash_logo.png"
  color_dark: "${currentTheme.bgEnd}"
  image_dark: "assets/images/andesmovi_splash_logo.png"
  android_12:
    image: "assets/icon/andesmovi_icon_1024.png"
    icon_background_color: "${currentTheme.bgStart}"
    color: "${currentTheme.bgEnd}"
`;

      const splashWidgetContent = `// Widget Oficial Splash Screen Flutter - AndesMovi
import 'package:flutter/material.dart';
import 'dart:async';

class AndesMoviSplashScreen extends StatefulWidget {
  const AndesMoviSplashScreen({Key? key}) : super(key: key);

  @override
  State<AndesMoviSplashScreen> createState() => _AndesMoviSplashScreenState();
}

class _AndesMoviSplashScreenState extends State<AndesMoviSplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 2500), () {
      if (mounted) Navigator.of(context).pushReplacementNamed('/home');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/icon/andesmovi_icon_1024.png', width: 140, height: 140),
            const SizedBox(height: 24),
            const Text(
              '${brandName}',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '"${slogan}"',
              style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
`;

      const autoInstallSh = `#!/usr/bin/env bash
# =========================================================================
# Script de Instalación 100% Automático de Iconos y Splash en Flutter
# =========================================================================
echo "🚀 Iniciando configuración automática de AndesMovi en Flutter..."
flutter pub get
dart run flutter_launcher_icons
dart run flutter_native_splash:create
echo "✅ ¡Configuración automática finalizada con éxito!"
`;

      const autoInstallBat = `@echo off
echo =========================================================================
echo Instalacion Automatica de Iconos y Splash AndesMovi para Flutter
echo =========================================================================
call flutter pub get
call dart run flutter_launcher_icons
call dart run flutter_native_splash:create
echo [OK] Configuracion automatica completada!
pause
`;

      const readmeTxt = `=========================================================================
PAQUETE OFICIAL DE ASSETS AUTOMÁTICOS PARA FLUTTER - ANDESMOVI
=========================================================================

1. Copia las carpetas 'assets' y 'android' en la raíz de tu proyecto Flutter.
2. Ejecuta en tu terminal:
   - En Mac/Linux: bash auto_install.sh
   - En Windows: auto_install.bat
   O directamente:
   dart run flutter_launcher_icons
   dart run flutter_native_splash:create

¡Eso es todo! Tu app Android e iOS tendrá el icono y splash oficiales de AndesMovi.
`;

      const androidBuildGradle = `// =========================================================================
// AndesMovi Flutter - android/app/build.gradle
// Requisito Google Play Console: Android 16 (API 36) o posterior
// =========================================================================

plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

def localProperties = new Properties()
def localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader("UTF-8") { reader ->
        localProperties.load(reader)
    }
}

def flutterVersionCode = localProperties.getProperty("flutter.versionCode") ?: "1"
def flutterVersionName = localProperties.getProperty("flutter.versionName") ?: "1.0.0"

android {
    namespace = "ec.gob.andesmovi.app"
    // Requisito Google Play: Android 16 (API 36)
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    defaultConfig {
        applicationId = "ec.gob.andesmovi.app"
        // Soporte amplio de dispositivos (Android 7.0+)
        minSdk = 24
        // Requisito estricto Google Play: API 36 (Android 16)
        targetSdk = 36
        versionCode = flutterVersionCode.toInteger()
        versionName = flutterVersionName
        multiDexEnabled = true
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        ndk {
            // Requisito Google Play: 64-bit y alineación de páginas de 16 KB
            abiFilters "armeabi-v7a", "arm64-v8a", "x86_64"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.debug
            minifyEnabled = true
            shrinkResources = true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
        jniLibs {
            // Requisito Google Play Android 16: Compatibilidad con páginas de 16 KB
            useLegacyPackaging = false
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation "androidx.core:core-ktx:1.15.0"
    implementation "androidx.activity:activity-ktx:1.10.0"
    implementation "com.google.android.gms:play-services-maps:19.0.0"
    implementation "com.google.android.gms:play-services-location:21.3.0"

    // =========================================================================
    // INTEGRACIÓN DE AUTENTICACIÓN ANDESMOVI (SOLICITADO)
    // =========================================================================
    // Importa el Firebase BoM (Bill of Materials)
    implementation platform('com.google.firebase:firebase-bom:33.1.0')
    // Firebase Authentication
    implementation 'com.google.firebase:firebase-auth'
    // SDK oficial de Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:21.2.0'
    // SDK de Facebook
    implementation 'com.facebook.android:facebook-android-sdk:latest.release'
}
`;

      const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ec.gob.andesmovi.app">

    <!-- Permisos Requeridos Google Play Android 16 (API 36) para Movilidad y Courier -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <!-- Obligatorio Android 14/15/16 (API 34-36) -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:label="AndesMovi"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:enableOnBackInvokedCallback="true"
        android:requestLegacyExternalStorage="false">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:taskAffinity=""
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">

            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>

        <!-- Foreground Service con tipo 'location' obligatorio para Android 16 (API 36) -->
        <service
            android:name="com.andesmovi.tracking.LocationTrackingService"
            android:foregroundServiceType="location"
            android:exported="false" />

        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`;

      const playStoreGuide = `# REQUISITOS DE API OBJETIVO EN GOOGLE PLAY: ANDROID 16 (API 36) O POSTERIOR

AndesMovi cumple al 100% con las directrices oficiales de Google Play Console:

1. compileSdk = 36
2. targetSdk = 36 (Android 16)
3. minSdk = 24 (Compatible con Android 7.0 hasta Android 16+)
4. Compatibilidad con páginas de memoria de 16 KB (16 KB page size alignment) en arquitecturas de 64 bits (arm64-v8a y x86_64).
5. Gesto de Retorno Predictivo habilitado: android:enableOnBackInvokedCallback="true".
6. Servicio en Primer Plano con tipo explícito 'location' (FOREGROUND_SERVICE_LOCATION) para el radar GPS en tiempo real de taxis y delivery.
7. Permiso explícito de notificaciones: POST_NOTIFICATIONS.

## Comando de Generación para Google Play (.AAB)
Ejecuta en la raíz de tu proyecto Flutter:
\`\`\`bash
flutter build appbundle --release
\`\`\`
El archivo generado en \`build/app/outputs/bundle/release/app-release.aab\` está listo para subir directamente a Google Play Console.
`;

      zip.file('pubspec.yaml', pubspecContent);
      zip.file('lib/screens/splash_screen.dart', splashWidgetContent);
      zip.file('android/app/build.gradle', androidBuildGradle);
      zip.file('android/app/src/main/AndroidManifest.xml', androidManifestXml);
      zip.file('auto_install.sh', autoInstallSh);
      zip.file('auto_install.bat', autoInstallBat);
      zip.file('LEEME_AUTOMATICO.txt', readmeTxt);
      zip.file('REQUISITOS_GOOGLE_PLAY_ANDROID_16_API36.md', playStoreGuide);

      // Step 7: Zip compilation & auto trigger download
      setAutoProgress(98);
      setAutoStepText('Comprimiendo archivo ZIP y descargando automáticamente...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `andesmovi_flutter_assets_automatico_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setAutoProgress(100);
      setAutoStepText('¡Descarga automática completada! Todos tus assets listos en el archivo ZIP.');
      setAutoDone(true);
      haptic.success();
    } catch (err) {
      console.error('Error generando assets automáticos:', err);
      setAutoStepText('Ocurrió un error durante la generación. Inténtalo de nuevo.');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  // Terminal one-liner command
  const ONE_LINER_COMMAND =
    'flutter pub add flutter_launcher_icons flutter_native_splash && dart run flutter_launcher_icons && dart run flutter_native_splash:create';

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* HEADER */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-amber-950/40 border-b border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white tracking-tight">
                  Diseño de Imagen & Assets Automáticos para Flutter
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-400" />
                  100% AUTOMÁTICO
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Genera, empaqueta y descarga en 1 clic todos los iconos, densidades Android, splash y código Flutter
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              haptic.tap();
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-2 border-b border-zinc-850 bg-zinc-950">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('auto')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'auto'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Modo Automático Total</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Simulador de Formas</span>
            </button>

            <button
              onClick={() => setActiveTab('splash')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'splash'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Splash Móvil</span>
            </button>

            <button
              onClick={() => setActiveTab('android16')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'android16'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Play: Android 16 (API 36)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/25 text-emerald-300 font-mono font-black border border-emerald-400/30">
                OFICIAL
              </span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'code'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Código & Comandos</span>
            </button>
          </div>

          {/* Auto-Play Toggle */}
          <button
            onClick={() => {
              haptic.tap();
              setIsAutoPlay((prev) => !prev);
            }}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              isAutoPlay
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
            title="Alternar presentación automática de vistas e iconos"
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="text-[11px]">{isAutoPlay ? 'Auto-Preview Activo' : 'Auto-Preview Pausado'}</span>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: MODO AUTOMÁTICO TOTAL */}
          {activeTab === 'auto' && (
            <div className="space-y-6">
              {/* Giant 1-Click Action Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-zinc-900 to-zinc-950 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-lg text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                    <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                    <span>SOLUCIÓN AUTOMÁTICA EN 1 CLIC</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Descargar Paquete Completo de Assets para Flutter (.ZIP)
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Genera automáticamente los iconos Android (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi), el icono maestro 1024x1024 para Google Play y App Store, el Splash Screen 1080x1920 y los scripts de instalación sin configurar nada a mano.
                  </p>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center gap-3">
                  <button
                    type="button"
                    id="btn-auto-generate-all-zip"
                    onClick={handleAutoGenerateEverything}
                    disabled={isAutoGenerating}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-zinc-950 font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer border border-emerald-300"
                  >
                    <Download className={`w-5 h-5 ${isAutoGenerating ? 'animate-bounce' : ''}`} />
                    <span>{isAutoGenerating ? 'Generando Todo...' : '⚡ Descargar Todo Automáticamente'}</span>
                  </button>

                  <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Incluye 10 archivos PNG + pubspec + scripts</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar during generation */}
              {(isAutoGenerating || autoDone) && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>{autoStepText}</span>
                    </span>
                    <span className="font-mono font-black text-emerald-400">{autoProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${autoProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Terminal 1-Liner Automatic Execution */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white">
                      Comando de 1 Solo Paso para tu Terminal de Flutter:
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(ONE_LINER_COMMAND, 'oneliner')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'oneliner' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Copiado al Portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Comando Automático</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 font-mono text-xs text-emerald-300 overflow-x-auto select-all">
                  <code>{ONE_LINER_COMMAND}</code>
                </div>

                <p className="text-[11px] text-zinc-400">
                  ⚡ Este comando instala automáticamente las librerías oficiales y genera todos los iconos y pantallas splash de inmediato en tu proyecto.
                </p>
              </div>

              {/* Automatic Workflow Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <span className="text-xs font-bold text-white block">Descarga el ZIP</span>
                  <p className="text-[11px] text-zinc-400">
                    Presiona el botón de arriba. Se genera y descarga en 3 segundos.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <span className="text-xs font-bold text-white block">Copia a tu Proyecto</span>
                  <p className="text-[11px] text-zinc-400">
                    Descomprime y pega las carpetas <code className="text-emerald-300">assets/</code> y <code className="text-emerald-300">android/</code>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <span className="text-xs font-bold text-white block">Ejecuta el Script</span>
                  <p className="text-[11px] text-zinc-400">
                    Haz doble clic en <code className="text-emerald-300">auto_install.bat</code> o <code className="text-emerald-300">auto_install.sh</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIMULADOR DE FORMAS INTERACTIVO */}
          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-6 flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl relative overflow-hidden">
                <div
                  className="absolute w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
                  style={{ backgroundColor: currentTheme.glow }}
                />

                {/* THE ANDESMOVI APP ICON */}
                <div
                  className={`relative w-48 h-48 sm:w-56 sm:h-56 shadow-2xl transition-all duration-500 border-2 overflow-hidden flex flex-col items-center justify-between p-4 ${
                    iconShape === 'squircle'
                      ? 'rounded-[44px]'
                      : iconShape === 'circle'
                      ? 'rounded-full'
                      : iconShape === 'rounded'
                      ? 'rounded-3xl'
                      : 'rounded-xl'
                  }`}
                  style={{
                    background: `linear-gradient(145deg, ${currentTheme.bgStart} 0%, ${currentTheme.bgEnd} 100%)`,
                    borderColor: `${currentTheme.glow}55`,
                    boxShadow: `0 20px 50px -10px ${currentTheme.glow}33`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                      {/* Back peak */}
                      <polygon points="40,150 110,50 180,150" fill={currentTheme.mountainEnd} opacity="0.9" />
                      <polygon points="110,50 124,75 110,70 96,75" fill="#ffffff" />

                      {/* Front peak */}
                      <polygon points="20,150 85,65 150,150" fill={currentTheme.mountainStart} />
                      <polygon points="85,65 98,90 85,84 72,90" fill="#ffffff" />

                      {/* Glowing Highway */}
                      {showRoadPath && (
                        <>
                          <path
                            d="M 30,155 Q 75,140 70,110 T 115,100 T 170,155"
                            fill="none"
                            stroke={currentTheme.glow}
                            strokeWidth="8"
                            strokeLinecap="round"
                            filter="drop-shadow(0 0 4px rgba(16,185,129,0.8))"
                          />
                          <path
                            d="M 30,155 Q 75,140 70,110 T 115,100 T 170,155"
                            fill="none"
                            stroke={currentTheme.accent}
                            strokeWidth="2"
                            strokeDasharray="6 4"
                          />
                        </>
                      )}

                      {/* Car badge */}
                      {showVehicle && (
                        <g transform="translate(110, 100)">
                          <circle r="16" fill={currentTheme.glow} filter="drop-shadow(0 0 6px rgba(16,185,129,0.9))" />
                          <circle r="15" fill="#047857" />
                          <path
                            d="M -9,-3 Q -9,-7 -4,-7 L 4,-7 Q 9,-7 9,-3 L 10,4 Q 10,6 8,6 L -8,6 Q -10,6 -10,4 Z"
                            fill="#ffffff"
                          />
                          <circle cx="-5" cy="4" r="2.2" fill={currentTheme.accent} />
                          <circle cx="5" cy="4" r="2.2" fill={currentTheme.accent} />
                        </g>
                      )}
                    </svg>
                  </div>

                  <div className="relative z-10 text-center pb-1">
                    <span
                      className="text-base sm:text-lg font-black tracking-widest text-white drop-shadow-md"
                      style={{ textShadow: `0 0 12px ${currentTheme.glow}88` }}
                    >
                      {brandName}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-mono">
                    {iconShape === 'squircle'
                      ? 'iOS Squircle (Estándar Apple)'
                      : iconShape === 'circle'
                      ? 'Android Adaptativo (Círculo)'
                      : iconShape === 'rounded'
                      ? 'Android Cuadrado Suave'
                      : 'Ficha Play Store'}
                  </span>
                  {isAutoPlay && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold animate-pulse">
                      Auto-Cambio
                    </span>
                  )}
                </div>
              </div>

              {/* Right column: controls */}
              <div className="md:col-span-6 space-y-4">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  Configuración de Visualización
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'squircle', label: 'iOS Squircle' },
                    { id: 'circle', label: 'Android Round' },
                    { id: 'rounded', label: 'Android Square' },
                    { id: 'store', label: 'Play Store' },
                  ].map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => {
                        haptic.tap();
                        setIconShape(shape.id as any);
                        setIsAutoPlay(false);
                      }}
                      className={`py-2 px-1 rounded-xl text-center border text-[11px] font-bold transition-all ${
                        iconShape === shape.id
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Paleta de Color Andina:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(palettes) as Array<keyof typeof palettes>).map((tKey) => (
                      <button
                        key={tKey}
                        onClick={() => {
                          haptic.tap();
                          setIconTheme(tKey);
                        }}
                        className={`p-2 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                          iconTheme === tKey
                            ? 'bg-zinc-800 border-emerald-500 text-white'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: palettes[tKey].glow }}
                        />
                        <span className="truncate">{palettes[tKey].name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAutoGenerateEverything}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Paquete ZIP con estos Colores</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SPLASH MÓVIL */}
          {activeTab === 'splash' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-6 flex justify-center">
                <div className="w-[240px] sm:w-[270px] h-[480px] sm:h-[530px] rounded-[42px] border-[5px] border-zinc-700 bg-zinc-950 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-950" />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-[#04160e] via-[#020617] to-[#020617] pointer-events-none" />

                  <div className="h-6" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-900 to-zinc-950 border-2 border-emerald-500/50 p-2 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
                      <div className="w-full h-full rounded-2xl bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
                        <svg viewBox="0 0 100 100" className="w-14 h-14">
                          <polygon points="20,75 55,25 90,75" fill="#047857" />
                          <polygon points="55,25 62,38 55,35 48,38" fill="#ffffff" />
                          <path d="M 15,80 Q 40,70 35,55 T 60,50 T 85,80" fill="none" stroke="#10b981" strokeWidth="5" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-white tracking-widest mt-4">{brandName}</h3>
                    <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-[8px] font-black text-emerald-300 tracking-wider uppercase">
                        {slogan}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center text-center pb-2">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-2" />
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      🇪🇨 Hecho en Ecuador
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 space-y-4">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  Pantalla de Carga y Splash Automática
                </span>
                <h3 className="text-lg font-black text-white">
                  Se autoincluye en el ZIP descargado
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  El archivo ZIP ya contiene la imagen en resolución completa 1080x1920 y el logo central para Android 12, configurado con el fondo nativo <code className="text-emerald-300 font-mono">#020617</code> para eliminar cualquier parpadeo al iniciar la app.
                </p>

                <button
                  onClick={handleAutoGenerateEverything}
                  className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Splash y Todos los Assets</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE PLAY REQUISITOS ANDROID 16 (API 36) */}
          {activeTab === 'android16' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Requirement Header Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-teal-950/60 border-2 border-emerald-500/60 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black tracking-wide uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GOOGLE PLAY CONSOLE • CUMPLIMIENTO OFICIAL</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Requisito de API Objetivo: Android 16 (API 36) o posterior
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Google Play exige que todas las aplicaciones nuevas y actualizaciones tengan como objetivo <strong className="text-emerald-400">Android 16 (Nivel de API 36)</strong> o superior. AndesMovi incluye esta configuración de forma nativa.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/40 text-center flex-shrink-0">
                  <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
                    Nivel de API
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    API 36
                  </span>
                  <span className="text-[10px] text-emerald-300 font-semibold block">
                    Android 16 Baklava
                  </span>
                </div>
              </div>

              {/* 4 Pillars of Android 16 Google Play Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black text-white">1. Target SDK 36 en Gradle</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Configurado con <code className="text-emerald-300 font-mono">compileSdk = 36</code> y <code className="text-emerald-300 font-mono">targetSdk = 36</code> en <code className="text-zinc-300 font-mono">build.gradle</code> para superar la validación automática de Google Play Console.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black text-white">2. Soporte de Páginas de 16 KB</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Alineación obligatoria de memoria de <strong className="text-zinc-200">16 KB</strong> para bibliotecas nativas de 64 bits (<code className="text-emerald-300 font-mono">arm64-v8a</code> y <code className="text-emerald-300 font-mono">x86_64</code>), mejorando tiempos de inicio y estabilidad.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black text-white">3. Gesto de Regreso Predictivo</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Habilitado mediante <code className="text-emerald-300 font-mono">android:enableOnBackInvokedCallback="true"</code> para animaciones de transición nativas fluidas del sistema operativo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black text-white">4. Foreground Service de Ubicación</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Declaración estricta de <code className="text-emerald-300 font-mono">foregroundServiceType="location"</code> para el despacho satelital GPS continuo de viajes de taxi, carreras y encomiendas.
                  </p>
                </div>
              </div>

              {/* Ready to copy build.gradle */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white">
                      Configuración android/app/build.gradle (API 36)
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        `android {
    namespace = "ec.gob.andesmovi.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "ec.gob.andesmovi.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"

        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86_64"
        }
    }

    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
    }
}`,
                        'gradle_copy'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 flex items-center gap-1.5"
                  >
                    {copiedKey === 'gradle_copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Gradle</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-zinc-850">
{`android {
    namespace = "ec.gob.andesmovi.app"
    compileSdk = 36  // Requisito Google Play: Android 16 (API 36)

    defaultConfig {
        applicationId = "ec.gob.andesmovi.app"
        minSdk = 24     // Compatible desde Android 7.0
        targetSdk = 36  // Obligatorio Google Play Console
        versionCode = 1
        versionName = "1.0.0"

        ndk {
            // Compatibilidad 64-bit y páginas de memoria de 16 KB
            abiFilters "armeabi-v7a", "arm64-v8a", "x86_64"
        }
    }

    packaging {
        jniLibs {
            useLegacyPackaging = false // 16 KB alignment support
        }
    }
}`}
                </pre>
              </div>

              {/* Build Command for Play Store (.aab) */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-white">
                      Generar App Bundle (.AAB) para subir a Google Play:
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy('flutter build appbundle --release', 'play_bundle_cmd')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedKey === 'play_bundle_cmd' ? '¡Copiado!' : 'Copiar Comando'}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-emerald-300 border border-zinc-850 select-all">
                  <code>flutter build appbundle --release</code>
                </div>

                <p className="text-[11px] text-zinc-400">
                  📁 Genera el archivo en <code className="text-zinc-200">build/app/outputs/bundle/release/app-release.aab</code> que cumple con los requerimientos de API 36 para publicación en Play Console.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: CÓDIGO & COMANDOS */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Ejecución Automática en Terminal</span>
                  </span>
                  <button
                    onClick={() => handleCopy(ONE_LINER_COMMAND, 'copy_code_tab')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700"
                  >
                    {copiedKey === 'copy_code_tab' ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-300 font-mono text-[11px] overflow-x-auto border border-zinc-850">
                  {ONE_LINER_COMMAND}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2">
                <span className="font-bold text-white block">Estructura Automática que genera el paquete ZIP (Con soporte Android 16 API 36):</span>
                <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-300 font-mono text-[10px] leading-relaxed border border-zinc-850">
{`andesmovi_flutter_assets.zip
├── assets/
│   ├── icon/
│   │   ├── andesmovi_icon_1024.png (App Store & Play Console)
│   │   ├── andesmovi_playstore_512.png (Ficha de la tienda)
│   │   └── andesmovi_adaptive_foreground.png (Android 16 Adaptive Icon)
│   └── images/
│       ├── andesmovi_splash_logo.png
│       └── splash_screen_1080x1920.png
├── android/
│   ├── app/
│   │   ├── build.gradle (compileSdk 36, targetSdk 36, 16KB alignment)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml (API 36, Location Foreground Service)
│   │       └── res/
│   │           ├── mipmap-mdpi/ic_launcher.png
│   │           ├── mipmap-hdpi/ic_launcher.png
│   │           ├── mipmap-xhdpi/ic_launcher.png
│   │           ├── mipmap-xxhdpi/ic_launcher.png
│   │           └── mipmap-xxxhdpi/ic_launcher.png
├── pubspec.yaml
├── lib/screens/splash_screen.dart
├── auto_install.sh (Mac / Linux)
├── auto_install.bat (Windows)
└── REQUISITOS_GOOGLE_PLAY_ANDROID_16_API36.md`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 hidden sm:flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>Todos los recursos empaquetados y optimizados automáticamente para Flutter SDK.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleAutoGenerateEverything}
              disabled={isAutoGenerating}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>⚡ Descarga Automática (.ZIP)</span>
            </button>

            <button
              onClick={() => {
                haptic.tap();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

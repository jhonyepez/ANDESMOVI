// ============================================================================
// ANDESMOVI - 3D Driver Navigation Map View
// File: lib/andesmovi_map_view.dart
// Stack: Flutter + flutter_map + latlong2 (100% Free OpenSource Stack)
// Features: Day/Night Theme Switching & Dynamic 3D Perspective Driver Navigation
// ============================================================================

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class AndesMoviMapView extends StatefulWidget {
  const AndesMoviMapView({super.key});

  @override
  State<AndesMoviMapView> createState() => _AndesMoviMapViewState();
}

class _AndesMoviMapViewState extends State<AndesMoviMapView> {
  final MapController _mapController = MapController();

  LatLng _currentVehiclePos = const LatLng(0.8116, -77.7173); // Tulcán, Carchi
  final LatLng _destinationPos = const LatLng(0.8220, -77.7115);

  double _vehicleHeading = 42.0;
  double _currentSpeedKmH = 38.5;

  bool _isManualThemeOverride = false;
  bool _isNightMode = false;
  bool _isNavigationMode = true;

  static const String _osmDayTileUrl =
      'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';
  static const String _osmNightTileUrl =
      'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';

  Timer? _gpsTimer;
  int _step = 0;

  final List<LatLng> _simulatedRoute = const [
    LatLng(0.8116, -77.7173),
    LatLng(0.8130, -77.7160),
    LatLng(0.8155, -77.7145),
    LatLng(0.8180, -77.7130),
    LatLng(0.8200, -77.7120),
    LatLng(0.8220, -77.7115),
  ];

  @override
  void initState() {
    super.initState();
    _checkSystemTheme();
    _startGpsSimulation();
  }

  @override
  void dispose() {
    _gpsTimer?.cancel();
    _mapController.dispose();
    super.dispose();
  }

  void _checkSystemTheme() {
    if (_isManualThemeOverride) return;
    final int hour = DateTime.now().hour;
    setState(() {
      _isNightMode = hour >= 18 || hour < 6;
    });
  }

  void _toggleDayNightTheme() {
    setState(() {
      _isManualThemeOverride = true;
      _isNightMode = !_isNightMode;
    });
  }

  void _toggle3DNavigationMode() {
    setState(() {
      _isNavigationMode = !_isNavigationMode;
    });

    if (_isNavigationMode) {
      _mapController.move(_currentVehiclePos, 17.5);
      _mapController.rotate(-_vehicleHeading);
    } else {
      _mapController.move(_currentVehiclePos, 16.0);
      _mapController.rotate(0.0);
    }
  }

  void _recenterOnVehicle() {
    _mapController.move(_currentVehiclePos, _isNavigationMode ? 17.5 : 16.5);
    if (_isNavigationMode) {
      _mapController.rotate(-_vehicleHeading);
    }
  }

  void _startGpsSimulation() {
    _gpsTimer = Timer.periodic(const Duration(milliseconds: 2200), (timer) {
      if (!mounted) return;

      _step = (_step + 1) % _simulatedRoute.length;
      final LatLng nextPos = _simulatedRoute[_step];
      final LatLng prevPos = _currentVehiclePos;

      final double heading = _calculateBearing(prevPos, nextPos);

      setState(() {
        _currentVehiclePos = nextPos;
        _vehicleHeading = heading;
        _currentSpeedKmH = 28.0 + (math.Random().nextDouble() * 18.0);
      });

      if (_isNavigationMode) {
        _mapController.move(_currentVehiclePos, 17.5);
        _mapController.rotate(-_vehicleHeading);
      }
    });
  }

  double _calculateBearing(LatLng start, LatLng end) {
    final double startLat = start.latitude * (math.pi / 180.0);
    final double startLng = start.longitude * (math.pi / 180.0);
    final double endLat = end.latitude * (math.pi / 180.0);
    final double endLng = end.longitude * (math.pi / 180.0);

    final double dLng = endLng - startLng;
    final double y = math.sin(dLng) * math.cos(endLat);
    final double x = math.cos(startLat) * math.sin(endLat) -
        math.sin(startLat) * math.cos(endLat) * math.cos(dLng);

    return ((math.atan2(y, x) * (180.0 / math.pi)) + 360) % 360;
  }

  @override
  Widget build(BuildContext context) {
    final String tileUrl = _isNightMode ? _osmNightTileUrl : _osmDayTileUrl;

    return Scaffold(
      body: Stack(
        children: [
          // 3D Perspective Map Container
          AnimatedContainer(
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeInOutCubic,
            child: Transform(
              alignment: Alignment.center,
              transform: _isNavigationMode
                  ? (Matrix4.identity()
                    ..setEntry(3, 2, 0.0018)
                    ..rotateX(0.75))
                  : Matrix4.identity(),
              child: FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: _currentVehiclePos,
                  initialZoom: 17.5,
                  maxZoom: 19.0,
                  minZoom: 4.0,
                  interactionOptions: const InteractionOptions(
                    flags: InteractiveFlag.all,
                  ),
                ),
                children: [
                  TileLayer(
                    urlTemplate: tileUrl,
                    userAgentPackageName: 'com.andesmovi.app',
                    tileProvider: NetworkTileProvider(),
                  ),
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: _simulatedRoute,
                        strokeWidth: 5.5,
                        color: const Color(0xFF10B981),
                      ),
                    ],
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _destinationPos,
                        width: 90,
                        height: 60,
                        alignment: Alignment.topCenter,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDC2626),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white, width: 1.5),
                              ),
                              child: const Text(
                                '🏁 Llegada',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                            const Icon(Icons.location_on,
                                color: Color(0xFFDC2626), size: 26),
                          ],
                        ),
                      ),
                      Marker(
                        point: _currentVehiclePos,
                        width: 50,
                        height: 50,
                        alignment: Alignment.center,
                        child: Transform.rotate(
                          angle: _vehicleHeading * (math.pi / 180.0),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x6610B981),
                                  blurRadius: 10,
                                  spreadRadius: 3,
                                )
                              ],
                            ),
                            child: const Icon(
                              Icons.directions_car_filled_rounded,
                              color: Color(0xFF09090B),
                              size: 24,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Top Header Status
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF09090B).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.5)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.navigation,
                            color: Color(0xFF10B981), size: 18),
                        const SizedBox(width: 6),
                        const Text(
                          'ANDESMOVI 3D NAV',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  FloatingActionButton.small(
                    heroTag: 'btn3DThemeToggle',
                    onPressed: _toggleDayNightTheme,
                    backgroundColor: const Color(0xFF09090B).withOpacity(0.85),
                    foregroundColor:
                        _isNightMode ? Colors.amber : const Color(0xFF10B981),
                    child: Icon(
                      _isNightMode ? Icons.nightlight_round : Icons.wb_sunny,
                      size: 18,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Right Map Controls
          Positioned(
            right: 16,
            bottom: 140,
            child: Column(
              children: [
                FloatingActionButton(
                  heroTag: 'btn3DToggleNav',
                  onPressed: _toggle3DNavigationMode,
                  backgroundColor: _isNavigationMode
                      ? const Color(0xFF10B981)
                      : const Color(0xFF18181B).withOpacity(0.9),
                  foregroundColor:
                      _isNavigationMode ? const Color(0xFF09090B) : Colors.white,
                  child: const Icon(Icons.threed_rotation),
                ),
                const SizedBox(height: 10),
                FloatingActionButton.small(
                  heroTag: 'btnRecenter3D',
                  onPressed: _recenterOnVehicle,
                  backgroundColor: const Color(0xFF18181B).withOpacity(0.9),
                  foregroundColor: Colors.white,
                  child: const Icon(Icons.my_location),
                ),
              ],
            ),
          ),

          // Bottom Driver Telemetry Card
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B).withOpacity(0.95),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF10B981), width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF09090B),
                      border: Border.all(
                          color: const Color(0xFF10B981), width: 2),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _currentSpeedKmH.toStringAsFixed(0),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const Text(
                          'KM/H',
                          style: TextStyle(
                            color: Color(0xFF10B981),
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Navegación Conductor 3D',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Sigue la ruta en tiempo real con orientación automática.',
                          style: TextStyle(color: Colors.white60, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

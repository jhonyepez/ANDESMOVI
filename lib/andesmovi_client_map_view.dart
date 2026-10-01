// ============================================================================
// ANDESMOVI - 2D Client Map View & Bidding HUD
// File: lib/andesmovi_client_map_view.dart
// Stack: Flutter + flutter_map + latlong2 (100% Free OpenSource Stack)
// Features: Strict 2D Flat Perspective, Day/Night Theme, GPS & City Selector
// ============================================================================

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class AndesMoviClientMapView extends StatefulWidget {
  const AndesMoviClientMapView({super.key});

  @override
  State<AndesMoviClientMapView> createState() => _AndesMoviClientMapViewState();
}

class _AndesMoviClientMapViewState extends State<AndesMoviClientMapView> {
  final MapController _mapController = MapController();

  // Ubicación dinámica de recogida (Punto A) y destino (Punto B)
  LatLng _pickupLocation = const LatLng(0.0425, -78.1458); // Cayambe por defecto
  LatLng _dropoffLocation = const LatLng(0.0495, -78.1400);
  LatLng _driverPosition = const LatLng(0.0390, -78.1470);
  double _driverHeading = 45.0;

  String _currentCityName = 'Cayambe';
  String _selectedService = 'viaje';
  double _offeredFareUsd = 2.50;
  bool _isNightMode = false;

  static const String _osmDayTileUrl =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const String _osmNightTileUrl =
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png';

  Timer? _driverTimer;
  int _step = 0;

  List<LatLng> _simulatedDriverRoute = [
    const LatLng(0.0390, -78.1470),
    const LatLng(0.0400, -78.1465),
    const LatLng(0.0410, -78.1460),
    const LatLng(0.0420, -78.1459),
    const LatLng(0.0425, -78.1458),
  ];

  final List<Map<String, dynamic>> _ecuadorCities = const [
    {'name': '🏔️ Cayambe', 'lat': 0.0425, 'lng': -78.1458},
    {'name': '🏛️ Quito Norte', 'lat': -0.1807, 'lng': -78.4678},
    {'name': '🏛️ Quito Sur', 'lat': -0.2891, 'lng': -78.5492},
    {'name': '🌸 Ibarra', 'lat': 0.3517, 'lng': -78.1223},
    {'name': '🧶 Otavalo', 'lat': 0.2346, 'lng': -78.2625},
    {'name': '🌾 Tabacundo', 'lat': 0.0469, 'lng': -78.2192},
    {'name': '🏰 Tulcán', 'lat': 0.8122, 'lng': -77.7175},
    {'name': '⛰️ San Gabriel', 'lat': 0.5956, 'lng': -77.8306},
    {'name': '🌊 Guayaquil', 'lat': -2.1894, 'lng': -79.8833},
    {'name': '⛪ Cuenca', 'lat': -2.8974, 'lng': -79.0044},
    {'name': '🌺 Ambato', 'lat': -1.2491, 'lng': -78.6168},
    {'name': '🌴 Sto. Domingo', 'lat': -0.2530, 'lng': -79.1754},
  ];

  @override
  void initState() {
    super.initState();
    final hour = DateTime.now().hour;
    _isNightMode = hour >= 18 || hour < 6;
    _generateRouteFromCenter(_pickupLocation);
    _startDriverSimulation();
  }

  @override
  void dispose() {
    _driverTimer?.cancel();
    _mapController.dispose();
    super.dispose();
  }

  void _generateRouteFromCenter(LatLng center) {
    _simulatedDriverRoute = [
      LatLng(center.latitude - 0.0035, center.longitude - 0.0025),
      LatLng(center.latitude - 0.0025, center.longitude - 0.0018),
      LatLng(center.latitude - 0.0015, center.longitude - 0.0010),
      LatLng(center.latitude - 0.0005, center.longitude - 0.0003),
      center,
    ];
    _driverPosition = _simulatedDriverRoute.first;
    _step = 0;
  }

  void _changeCity(String name, double lat, double lng) {
    final newCenter = LatLng(lat, lng);
    final newDropoff = LatLng(lat + 0.007, lng + 0.005);
    setState(() {
      _currentCityName = name.replaceAll(RegExp(r'^[^\w\s]+'), '').trim();
      _pickupLocation = newCenter;
      _dropoffLocation = newDropoff;
      _generateRouteFromCenter(newCenter);
    });
    try {
      _mapController.move(newCenter, 15.5);
    } catch (_) {}
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Ubicación fijada en $_currentCityName'),
        duration: const Duration(seconds: 2),
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  void _startDriverSimulation() {
    _driverTimer?.cancel();
    _driverTimer = Timer.periodic(const Duration(milliseconds: 2500), (timer) {
      if (!mounted || _simulatedDriverRoute.isEmpty) return;

      _step = (_step + 1) % _simulatedDriverRoute.length;
      final LatLng newPos = _simulatedDriverRoute[_step];
      final LatLng prevPos = _driverPosition;

      final double heading = _calculateBearing(prevPos, newPos);

      setState(() {
        _driverPosition = newPos;
        _driverHeading = heading;
      });
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
    final String activeTileUrl = _isNightMode ? _osmNightTileUrl : _osmDayTileUrl;

    return Scaffold(
      body: Stack(
        children: [
          // Strict 2D Flat Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _pickupLocation,
              initialZoom: 15.5,
              maxZoom: 19.0,
              minZoom: 5.0,
              onTap: (tapPosition, point) {
                setState(() {
                  _pickupLocation = point;
                  _dropoffLocation = LatLng(point.latitude + 0.007, point.longitude + 0.005);
                  _generateRouteFromCenter(point);
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Punto de recogida actualizado en el mapa'),
                    duration: Duration(milliseconds: 1500),
                    backgroundColor: Color(0xFF10B981),
                  ),
                );
              },
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.drag |
                    InteractiveFlag.pinchZoom |
                    InteractiveFlag.doubleTapZoom,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: activeTileUrl,
                userAgentPackageName: 'com.andesmovi.client',
                tileProvider: NetworkTileProvider(),
              ),
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: [_pickupLocation, _dropoffLocation],
                    strokeWidth: 5.0,
                    color: const Color(0xFF10B981),
                  ),
                ],
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _pickupLocation,
                    width: 110,
                    height: 55,
                    alignment: Alignment.topCenter,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: const [
                              BoxShadow(color: Colors.black26, blurRadius: 4)
                            ],
                          ),
                          child: const Text('DE AKÍ (Punto A)',
                              style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900)),
                        ),
                        const Icon(Icons.location_on_rounded,
                            color: Color(0xFF10B981), size: 30),
                      ],
                    ),
                  ),
                  Marker(
                    point: _dropoffLocation,
                    width: 100,
                    height: 55,
                    alignment: Alignment.topCenter,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0052FF),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: const [
                              BoxShadow(color: Colors.black26, blurRadius: 4)
                            ],
                          ),
                          child: const Text('LLEGADA (B)',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900)),
                        ),
                        const Icon(Icons.flag_rounded,
                            color: Color(0xFF0052FF), size: 28),
                      ],
                    ),
                  ),
                  // Animated Driver Vehicle
                  Marker(
                    point: _driverPosition,
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    child: Transform.rotate(
                      angle: _driverHeading * (math.pi / 180.0),
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.directions_car_filled_rounded,
                            color: Color(0xFF09090B), size: 22),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top Header Service Bar & City Selector
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF09090B).withOpacity(0.92),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.4)),
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.of(context).maybePop(),
                          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'ANDESMOVI CLIENTE',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12),
                            ),
                            Text(
                              'Punto A: $_currentCityName',
                              style: const TextStyle(
                                  color: Color(0xFF10B981),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _isNightMode ? 'Modo Noche' : 'Modo Día',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Horizontal City & Canton Selector Bar
                  Container(
                    height: 38,
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _ecuadorCities.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 6),
                      itemBuilder: (context, index) {
                        final city = _ecuadorCities[index];
                        final isSelected = _currentCityName.toLowerCase().contains(
                            city['name'].toString().toLowerCase().replaceAll(RegExp(r'^[^\w\s]+'), '').trim());
                        return InkWell(
                          onTap: () => _changeCity(
                            city['name'] as String,
                            city['lat'] as double,
                            city['lng'] as double,
                          ),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFF18181B).withOpacity(0.90),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected
                                    ? Colors.white
                                    : Colors.white12,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                city['name'] as String,
                                style: TextStyle(
                                  color: isSelected ? Colors.black : Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Service Category Tabs
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B).withOpacity(0.92),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Row(
                      children: [
                        _buildTab('viaje', 'Taxi', Icons.directions_car),
                        _buildTab('ejecutivo', 'Ejecutivo', Icons.star_rounded),
                        _buildTab('encomienda', 'Encomienda', Icons.inventory_2),
                        _buildTab('domicilio', 'Delivery', Icons.two_wheeler),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Floating GPS / Recenter Button
          Positioned(
            right: 16,
            bottom: 115,
            child: FloatingActionButton.small(
              backgroundColor: const Color(0xFF18181B),
              foregroundColor: const Color(0xFF10B981),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
              ),
              onPressed: () {
                try {
                  _mapController.move(_pickupLocation, 16.0);
                } catch (_) {}
              },
              child: const Icon(Icons.my_location_rounded, size: 20),
            ),
          ),

          // Bottom Fare Bidding Panel
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B).withOpacity(0.96),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                    color: const Color(0xFF10B981).withOpacity(0.4), width: 1.5),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.circle, color: Color(0xFF10B981), size: 10),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Punto de recogida: $_currentCityName (Toca el mapa para mover)',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white10, height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('TU OFERTA',
                              style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold)),
                          Text('\$${_offeredFareUsd.toStringAsFixed(2)}',
                              style: const TextStyle(
                                  color: Color(0xFF10B981),
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900)),
                        ],
                      ),
                      Row(
                        children: [
                          IconButton(
                            onPressed: () {
                              if (_offeredFareUsd > 1.25) {
                                setState(() => _offeredFareUsd -= 0.25);
                              }
                            },
                            icon: const Icon(Icons.remove_circle_outline),
                            color: Colors.white70,
                          ),
                          IconButton(
                            onPressed: () {
                              setState(() => _offeredFareUsd += 0.25);
                            },
                            icon: const Icon(Icons.add_circle_outline),
                            color: const Color(0xFF10B981),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(String key, String label, IconData icon) {
    final bool isSelected = _selectedService == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedService = key),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF10B981) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  size: 16,
                  color: isSelected ? const Color(0xFF09090B) : Colors.white60),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? const Color(0xFF09090B) : Colors.white60,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

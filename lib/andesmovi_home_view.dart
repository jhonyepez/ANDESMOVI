// ============================================================================
// ANDESMOVI - Home Dashboard (Inicio)
// File: lib/andesmovi_home_view.dart
// Features: Service Categories, Search Bar, Promotional Banners
// ============================================================================

import 'package:flutter/material.dart';

class AndesMoviHomeView extends StatelessWidget {
  final Function(String) onServiceSelected;

  const AndesMoviHomeView({super.key, required this.onServiceSelected});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Bar / Welcome
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hola, Cliente',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      '¿A dónde vamos hoy?',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.notifications_none_rounded, color: Color(0xFF10B981)),
                ),
              ],
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: const Row(
                children: [
                  Icon(Icons.search_rounded, color: Color(0xFF10B981)),
                  SizedBox(width: 12),
                  Text(
                    'Buscar destino...',
                    style: TextStyle(color: Colors.white38, fontSize: 16),
                  ),
                  Spacer(),
                  VerticalDivider(color: Colors.white10, indent: 5, endIndent: 5),
                  SizedBox(width: 10),
                  Icon(Icons.access_time_rounded, color: Colors.white38, size: 20),
                ],
              ),
            ),
          ),

          // Services Grid
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Text(
              'Servicios Disponibles',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ),

          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            mainAxisSpacing: 10,
            crossAxisSpacing: 0,
            children: [
              _buildServiceItem(context, 'viaje', 'Taxi', Icons.directions_car_filled_rounded, const Color(0xFF10B981)),
              _buildServiceItem(context, 'ejecutivo', 'Ejecutivo', Icons.star_rounded, const Color(0xFFF59E0B)),
              _buildServiceItem(context, 'encomienda', 'Envíos', Icons.inventory_2_rounded, const Color(0xFF3B82F6)),
              _buildServiceItem(context, 'moto', 'Moto', Icons.two_wheeler_rounded, const Color(0xFFEC4899)),
              _buildServiceItem(context, 'domicilio', 'Delivery', Icons.restaurant_rounded, const Color(0xFF8B5CF6)),
              _buildServiceItem(context, 'salud', 'Salud', Icons.medical_services_rounded, const Color(0xFFEF4444)),
              _buildServiceItem(context, 'compras', 'Compras', Icons.shopping_bag_rounded, const Color(0xFF10B981)),
              _buildServiceItem(context, 'mas', 'Más', Icons.grid_view_rounded, Colors.white38),
            ],
          ),

          // Promo Banner
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Container(
              width: double.infinity,
              height: 140,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF059669), Color(0xFF10B981)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                image: const DecorationImage(
                  image: NetworkImage('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=300'),
                  fit: BoxFit.cover,
                  opacity: 0.2,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      '50% DESCUENTO',
                      style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                    ),
                    const Text(
                      'En tu primer viaje con AndesMovi',
                      style: TextStyle(color: Colors.whiteEms, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Usar ahora',
                        style: TextStyle(color: Color(0xFF059669), fontSize: 12, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Frequent Destinations
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Text(
              'Destinos Recientes',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ),

          _buildRecentItem('Centro Histórico', 'Calle Principal #123, Tulcán', Icons.history_rounded),
          _buildRecentItem('Terminal Terrestre', 'Av. de los Carros s/n', Icons.directions_bus_rounded),
          const SizedBox(height: 100), // Spacing for bottom nav
        ],
      ),
    );
  }

  Widget _buildServiceItem(BuildContext context, String id, String label, IconData icon, Color color) {
    return GestureDetector(
      onTap: () => onServiceSelected(id),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withOpacity(0.2)),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentItem(String title, String subtitle, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white38, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Colors.white12),
        ],
      ),
    );
  }
}

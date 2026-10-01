// ============================================================================
// ANDESMOVI - Profile & Settings
// File: lib/andesmovi_profile_view.dart
// Features: User Profile, Payment Methods, App Settings
// ============================================================================

import 'package:flutter/material.dart';

class AndesMoviProfileView extends StatelessWidget {
  const AndesMoviProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 40),
          // Profile Header
          const CircleAvatar(
            radius: 50,
            backgroundColor: Color(0xFF10B981),
            child: Text(
              'AC',
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Andes Cliente',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const Text(
            '+593 99 999 9999',
            style: TextStyle(color: Colors.white54, fontSize: 14),
          ),
          const SizedBox(height: 32),

          // Balance / Stats
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatItem('Puntos', '1,250', Icons.stars_rounded, Colors.amber),
                  const VerticalDivider(color: Colors.white10, width: 1),
                  _buildStatItem('Viajes', '48', Icons.route_rounded, const Color(0xFF10B981)),
                  const VerticalDivider(color: Colors.white10, width: 1),
                  _buildStatItem('Calif.', '4.9', Icons.star_rounded, Colors.amber),
                ],
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Menu List
          _buildMenuItem(Icons.payment_rounded, 'Métodos de Pago', 'Visa **** 4421', const Color(0xFF3B82F6)),
          _buildMenuItem(Icons.local_offer_rounded, 'Promociones', '3 disponibles', const Color(0xFF10B981)),
          _buildMenuItem(Icons.security_rounded, 'Seguridad y Privacidad', 'Configurar', const Color(0xFFEF4444)),
          _buildMenuItem(Icons.headset_mic_rounded, 'Soporte Técnico', 'Chat 24/7', const Color(0xFF8B5CF6)),
          _buildMenuItem(Icons.info_outline_rounded, 'Acerca de AndesMovi', 'Versión 1.0.0', Colors.white38),
          
          const SizedBox(height: 24),
          
          TextButton(
            onPressed: () {},
            child: const Text(
              'Cerrar Sesión',
              style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.w900),
            ),
          ),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10)),
      ],
    );
  }

  Widget _buildMenuItem(IconData icon, String title, String subtitle, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B).withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  Text(subtitle, style: const TextStyle(color: Colors.white38, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.white12),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// ANDESMOVI - Activity View (Actividad)
// File: lib/andesmovi_activity_view.dart
// Features: Trip History, Status Tracking
// ============================================================================

import 'package:flutter/material.dart';

class AndesMoviActivityView extends StatelessWidget {
  const AndesMoviActivityView({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 40, 20, 20),
            child: Text(
              'Tu Actividad',
              style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
            ),
          ),

          _buildActivityItem('Taxi', 'Ayer, 18:42', '\$2.50', 'Finalizado', const Color(0xFF10B981)),
          _buildActivityItem('Encomienda', 'Ayer, 10:15', '\$5.00', 'Cancelado', const Color(0xFFEF4444)),
          _buildActivityItem('Ejecutivo', '28 Sep, 21:00', '\$4.25', 'Finalizado', const Color(0xFF10B981)),
          _buildActivityItem('Delivery', '27 Sep, 13:30', '\$1.50', 'Finalizado', const Color(0xFF10B981)),
          _buildActivityItem('Taxi', '25 Sep, 08:15', '\$2.00', 'Finalizado', const Color(0xFF10B981)),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildActivityItem(String service, String date, String price, String status, Color statusColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white10),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                service == 'Taxi' ? Icons.directions_car_filled_rounded : 
                service == 'Encomienda' ? Icons.inventory_2_rounded : 
                Icons.star_rounded,
                color: const Color(0xFF10B981),
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(service, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  Text(date, style: const TextStyle(color: Colors.white38, fontSize: 12)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(price, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                Text(status, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

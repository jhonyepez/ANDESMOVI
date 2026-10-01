// ============================================================================
// ANDESMOVI - Flutter Main Entry Point
// File: lib/main.dart
// Features: Full Navigation, Home, Activity, Profile, Map Dispatcher
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'andesmovi_home_view.dart';
import 'andesmovi_activity_view.dart';
import 'andesmovi_profile_view.dart';
import 'andesmovi_client_map_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set immersive status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF09090B),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  runApp(const AndesMoviApp());
}

class AndesMoviApp extends StatelessWidget {
  const AndesMoviApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ANDESMOVI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF09090B),
        primaryColor: const Color(0xFF10B981),
        splashColor: const Color(0xFF10B981).withOpacity(0.1),
        highlightColor: Colors.transparent,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFFF59E0B),
          surface: Color(0xFF18181B),
          background: Color(0xFF09090B),
        ),
      ),
      home: const AndesMoviRoot(),
    );
  }
}

class AndesMoviRoot extends StatefulWidget {
  const AndesMoviRoot({super.key});

  @override
  State<AndesMoviRoot> createState() => _AndesMoviRootState();
}

class _AndesMoviRootState extends State<AndesMoviRoot> {
  int _currentIndex = 0;
  bool _isMapActive = false;

  void _navigateToMap(String service) {
    setState(() {
      _isMapActive = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    // If map is active (e.g. after clicking a service), show the map view
    if (_isMapActive) {
      return WillPopScope(
        onWillPop: () async {
          setState(() => _isMapActive = false);
          return false;
        },
        child: const AndesMoviClientMapView(),
      );
    }

    final List<Widget> _views = [
      AndesMoviHomeView(onServiceSelected: _navigateToMap),
      const AndesMoviActivityView(),
      const AndesMoviProfileView(),
    ];

    return Scaffold(
      body: _views[_currentIndex],
      extendBody: true,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        height: 70,
        decoration: BoxDecoration(
          color: const Color(0xFF18181B).withOpacity(0.95),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            backgroundColor: Colors.transparent,
            selectedItemColor: const Color(0xFF10B981),
            unselectedItemColor: Colors.white30,
            showSelectedLabels: true,
            showUnselectedLabels: true,
            selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
            unselectedLabelStyle: const TextStyle(fontSize: 10),
            type: BottomNavigationBarType.fixed,
            elevation: 0,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home_filled),
                label: 'Inicio',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.receipt_long_rounded),
                label: 'Actividad',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person_rounded),
                label: 'Perfil',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import { Coordinates, Driver, VehicleType } from '../types';
import { calculateBearing, calculateDistanceKm, lerp, lerpAngle } from '../utils/geoUtils';

export interface SimulatedVehicle {
  id: string;
  name: string;
  photoUrl: string;
  phone: string;
  rating: number;
  tripsCount: number;
  vehicleType: VehicleType;
  make: string;
  model: string;
  plate: string;
  color: string;
  cooperativa: string;
  currentCoords: Coordinates;
  targetCoords?: Coordinates;
  previousCoords: Coordinates;
  headingDegrees: number;
  targetHeadingDegrees: number;
  speedKmH: number;
  operationalStatus: 'disponible' | 'en_viaje' | 'en_encomienda' | 'desconectado';
  batteryPercent: number;
  altitudeMeters: number;
  routeWaypoints: Coordinates[];
  currentWaypointIndex: number;
  isCustomDispatched?: boolean;
  lastPingTime: number;
  trailHistory?: Coordinates[];
  tripInfo?: {
    clientName: string;
    clientPhone: string;
    origin: string;
    destination: string;
    etaMinutes: number;
  };
}

export interface TelemetryLogEntry {
  id: string;
  vehicleId: string;
  driverName: string;
  vehicleType: VehicleType;
  plate: string;
  coords: Coordinates;
  headingDegrees: number;
  speedKmH: number;
  timestamp: number;
  timeFormatted: string;
  status: string;
}

// Initial realistic patrol trajectories in Tulcán, Carchi, Ecuador (0.8119, -77.7173)
const BASE_FLEET_UNITS: SimulatedVehicle[] = [
  {
    id: 'unit-1',
    name: 'Carlos Mendoza',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    phone: '+593 99 123 4567',
    rating: 4.9,
    tripsCount: 1420,
    vehicleType: 'auto',
    make: 'Chevrolet',
    model: 'Sail Taxi Matriz',
    plate: 'PBA-8321',
    color: 'Amarillo Institucional',
    cooperativa: 'Coop. Taxi Pichincha Tulcán',
    currentCoords: { lat: 0.8119, lng: -77.7173, name: 'Parque Central Tulcán' },
    previousCoords: { lat: 0.8105, lng: -77.7160 },
    headingDegrees: 45,
    targetHeadingDegrees: 45,
    speedKmH: 38,
    operationalStatus: 'en_viaje',
    batteryPercent: 92,
    altitudeMeters: 2950,
    routeWaypoints: [
      { lat: 0.8119, lng: -77.7173 },
      { lat: 0.8150, lng: -77.7140 },
      { lat: 0.8180, lng: -77.7100 },
      { lat: 0.8130, lng: -77.7120 },
      { lat: 0.8119, lng: -77.7173 },
    ],
    currentWaypointIndex: 1,
    lastPingTime: Date.now(),
    trailHistory: [
      { lat: 0.8100, lng: -77.7150 },
      { lat: 0.8110, lng: -77.7165 },
      { lat: 0.8119, lng: -77.7173 },
    ],
    tripInfo: {
      clientName: 'María Fernanda Benalcázar',
      clientPhone: '+593 98 765 4321',
      origin: 'Parque Central Tulcán',
      destination: 'Terminal Terrestre Interprovincial',
      etaMinutes: 4,
    },
  },
  {
    id: 'unit-2',
    name: 'Javier Alvear Grijalva',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    phone: '+593 98 456 7890',
    rating: 4.8,
    tripsCount: 980,
    vehicleType: 'moto',
    make: 'Yamaha',
    model: 'FZ-25 250cc',
    plate: 'IB-402W',
    color: 'Naranja / Negro',
    cooperativa: 'AndesMovi Moto Express DMQ',
    currentCoords: { lat: 0.8085, lng: -77.7120, name: 'Agencia Tulcanaza' },
    previousCoords: { lat: 0.8070, lng: -77.7105 },
    headingDegrees: 120,
    targetHeadingDegrees: 120,
    speedKmH: 52,
    operationalStatus: 'en_encomienda',
    batteryPercent: 88,
    altitudeMeters: 2940,
    routeWaypoints: [
      { lat: 0.8085, lng: -77.7120 },
      { lat: 0.8050, lng: -77.7080 },
      { lat: 0.8030, lng: -77.7150 },
      { lat: 0.8085, lng: -77.7120 },
    ],
    currentWaypointIndex: 1,
    lastPingTime: Date.now(),
    trailHistory: [
      { lat: 0.8070, lng: -77.7105 },
      { lat: 0.8080, lng: -77.7115 },
      { lat: 0.8085, lng: -77.7120 },
    ],
    tripInfo: {
      clientName: 'Cooperativa San Cristóbal (Encomienda)',
      clientPhone: '+593 6 298 1122',
      origin: 'Agencia Tulcanaza',
      destination: 'Oficina Central Encomiendas',
      etaMinutes: 6,
    },
  },
  {
    id: 'unit-3',
    name: 'Wilson Enríquez',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    phone: '+593 99 987 6543',
    rating: 5.0,
    tripsCount: 2150,
    vehicleType: 'auto',
    make: 'Hyundai',
    model: 'Grand Atos Taxi',
    plate: 'PBA-1492',
    color: 'Amarillo',
    cooperativa: 'Coop. Pullman Carchi',
    currentCoords: { lat: 0.8140, lng: -77.7200, name: 'Sector Norte Tulcán' },
    previousCoords: { lat: 0.8130, lng: -77.7190 },
    headingDegrees: 200,
    targetHeadingDegrees: 200,
    speedKmH: 24,
    operationalStatus: 'disponible',
    batteryPercent: 95,
    altitudeMeters: 2960,
    routeWaypoints: [
      { lat: 0.8140, lng: -77.7200 },
      { lat: 0.8100, lng: -77.7220 },
      { lat: 0.8140, lng: -77.7200 },
    ],
    currentWaypointIndex: 1,
    lastPingTime: Date.now(),
    trailHistory: [
      { lat: 0.8130, lng: -77.7190 },
      { lat: 0.8140, lng: -77.7200 },
    ],
  },
  {
    id: 'unit-4',
    name: 'Dayana Paspuel',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '+593 98 111 2233',
    rating: 4.9,
    tripsCount: 740,
    vehicleType: 'moto',
    make: 'Suzuki',
    model: 'GIXXER 150',
    plate: 'IB-912K',
    color: 'Azul / Negro',
    cooperativa: 'AndesMovi Moto Express',
    currentCoords: { lat: 0.8110, lng: -77.7140, name: 'Centro Comercial Tulcán' },
    previousCoords: { lat: 0.8100, lng: -77.7130 },
    headingDegrees: 310,
    targetHeadingDegrees: 310,
    speedKmH: 48,
    operationalStatus: 'en_viaje',
    batteryPercent: 85,
    altitudeMeters: 2945,
    routeWaypoints: [
      { lat: 0.8110, lng: -77.7140 },
      { lat: 0.8160, lng: -77.7180 },
      { lat: 0.8110, lng: -77.7140 },
    ],
    currentWaypointIndex: 1,
    lastPingTime: Date.now(),
    trailHistory: [
      { lat: 0.8100, lng: -77.7130 },
      { lat: 0.8110, lng: -77.7140 },
    ],
    tripInfo: {
      clientName: 'Esteban Rosero',
      clientPhone: '+593 99 444 5566',
      origin: 'Centro Comercial',
      destination: 'Barrio Obrero',
      etaMinutes: 3,
    },
  },
];

class FleetSimulationService {
  private vehicles: SimulatedVehicle[] = [...BASE_FLEET_UNITS];
  private isRunning: boolean = true;
  private timerId: NodeJS.Timeout | null = null;
  private simulationSpeedMultiplier: number = 1.0; // 1x, 2x, 4x
  private telemetryLogs: TelemetryLogEntry[] = [];
  private listeners: Set<(vehicles: SimulatedVehicle[], latestLog?: TelemetryLogEntry) => void> = new Set();
  private maxLogs: number = 40;

  constructor() {
    this.startSimulation();
  }

  public getVehicles(): SimulatedVehicle[] {
    return this.vehicles;
  }

  public getLogs(): TelemetryLogEntry[] {
    return this.telemetryLogs;
  }

  public getTelemetryLogs(): TelemetryLogEntry[] {
    return this.telemetryLogs;
  }

  public isSimulationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Adapta las unidades de la flota activa a la provincia y cantón del conductor y cliente
   */
  public setFleetCenter(center: { lat: number; lng: number }): void {
    if (!center || !center.lat || !center.lng) return;
    const offsets = [
      { dLat: 0.003, dLng: 0.003, heading: 45 },
      { dLat: -0.004, dLng: 0.002, heading: 135 },
      { dLat: 0.002, dLng: -0.004, heading: 225 },
      { dLat: -0.003, dLng: -0.003, heading: 315 },
      { dLat: 0.005, dLng: -0.001, heading: 90 },
    ];
    this.vehicles.forEach((veh, idx) => {
      const off = offsets[idx % offsets.length];
      const newLat = center.lat + off.dLat;
      const newLng = center.lng + off.dLng;
      veh.currentCoords = {
        lat: newLat,
        lng: newLng,
        name: `Unidad ${veh.plate}`,
        address: `Sector Local`,
      };
      veh.previousCoords = { lat: newLat - 0.0005, lng: newLng - 0.0005 };
      veh.headingDegrees = off.heading;
      veh.routeWaypoints = [
        { lat: newLat, lng: newLng },
        { lat: newLat + 0.003, lng: newLng + 0.003 },
        { lat: newLat + 0.005, lng: newLng + 0.001 },
        { lat: newLat + 0.002, lng: newLng - 0.004 },
        { lat: newLat, lng: newLng },
      ];
      veh.currentWaypointIndex = 1;
    });
    this.notifyListeners();
  }

  public getSpeedMultiplier(): number {
    return this.simulationSpeedMultiplier;
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.simulationSpeedMultiplier = Math.max(0.5, Math.min(10, multiplier));
  }

  public toggleSimulation(enable?: boolean): boolean {
    if (enable !== undefined) {
      this.isRunning = enable;
    } else {
      this.isRunning = !this.isRunning;
    }

    if (this.isRunning && !this.timerId) {
      this.startSimulation();
    } else if (!this.isRunning && this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.notifyListeners();
    return this.isRunning;
  }

  public subscribe(callback: (vehicles: SimulatedVehicle[], latestLog?: TelemetryLogEntry) => void): () => void {
    this.listeners.add(callback);
    callback(this.vehicles, this.telemetryLogs[0]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeTelemetryLog(callback: (log: TelemetryLogEntry) => void): () => void {
    const wrapper = (_vehicles: SimulatedVehicle[], latestLog?: TelemetryLogEntry) => {
      if (latestLog) {
        callback(latestLog);
      }
    };
    this.listeners.add(wrapper);
    if (this.telemetryLogs[0]) {
      callback(this.telemetryLogs[0]);
    }
    return () => {
      this.listeners.delete(wrapper);
    };
  }

  public setVehicleOperationalStatus(
    vehicleId: string,
    status: 'disponible' | 'en_viaje' | 'en_encomienda' | 'desconectado'
  ): boolean {
    const index = this.vehicles.findIndex((v) => v.id === vehicleId);
    if (index === -1) return false;
    this.vehicles[index] = {
      ...this.vehicles[index],
      operationalStatus: status,
    };
    this.notifyListeners();
    return true;
  }

  public injectLiveCoordinates(
    vehicleId: string,
    coords: Coordinates,
    heading?: number,
    speed?: number
  ): boolean {
    const index = this.vehicles.findIndex((v) => v.id === vehicleId);
    if (index === -1) return false;

    const veh = this.vehicles[index];
    const prevCoords = { ...veh.currentCoords };
    const finalHeading = heading !== undefined ? heading : calculateBearing(prevCoords, coords);
    const finalSpeed = speed !== undefined ? speed : veh.speedKmH;

    this.vehicles[index] = {
      ...veh,
      previousCoords: prevCoords,
      currentCoords: coords,
      headingDegrees: finalHeading,
      targetHeadingDegrees: finalHeading,
      speedKmH: finalSpeed,
      lastPingTime: Date.now(),
    };

    const timeStr = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: TelemetryLogEntry = {
      id: `inject-${Date.now()}-${veh.id}-${Math.random().toString(36).substring(2, 7)}`,
      vehicleId: veh.id,
      driverName: veh.name,
      vehicleType: veh.vehicleType,
      plate: veh.plate,
      coords,
      headingDegrees: finalHeading,
      speedKmH: finalSpeed,
      timestamp: Date.now(),
      timeFormatted: timeStr,
      status: veh.operationalStatus,
    };

    this.addLog(log);
    this.notifyListeners(log);
    return true;
  }

  private notifyListeners(latestLog?: TelemetryLogEntry): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.vehicles], latestLog);
      } catch (err) {
        console.error('Error in fleet listener:', err);
      }
    });
  }

  /**
   * Main simulation tick loop: Moves all vehicles along their waypoints,
   * calculates dynamic bearing / heading, updates telemetry speed and broadcasts coordinates.
   */
  private startSimulation(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    // Tick every 1.5 seconds for continuous broadcast
    this.timerId = setInterval(() => {
      if (!this.isRunning) return;

      this.stepSimulation();
    }, 1500);
  }

  private stepSimulation(): void {
    const now = Date.now();
    let sampleLog: TelemetryLogEntry | undefined;

    this.vehicles = this.vehicles.map((veh, index) => {
      const waypoints = veh.routeWaypoints;
      if (!waypoints || waypoints.length === 0) return veh;

      const currentTarget = veh.targetCoords || waypoints[veh.currentWaypointIndex % waypoints.length];
      const prevCoords = { ...veh.currentCoords };

      // Distance to current target waypoint
      const distance = calculateDistanceKm(prevCoords, currentTarget);

      // Step distance based on speed and simulation multiplier
      const stepKm = (veh.speedKmH / 3600) * 1.5 * this.simulationSpeedMultiplier;

      let nextLat = prevCoords.lat;
      let nextLng = prevCoords.lng;
      let nextWaypointIndex = veh.currentWaypointIndex;
      let isTargetReached = false;

      if (distance <= stepKm || distance < 0.02) {
        // Waypoint reached -> advance to next waypoint
        nextLat = currentTarget.lat;
        nextLng = currentTarget.lng;
        nextWaypointIndex = (veh.currentWaypointIndex + 1) % waypoints.length;
        if (veh.isCustomDispatched) {
          isTargetReached = true;
        }
      } else {
        // Interpolate towards target
        const t = Math.min(1, stepKm / distance);
        nextLat = lerp(prevCoords.lat, currentTarget.lat, t);
        nextLng = lerp(prevCoords.lng, currentTarget.lng, t);
      }

      // Calculate bearing / heading in degrees (0-360)
      const nextCoords = { lat: nextLat, lng: nextLng, address: veh.currentCoords.address, name: veh.currentCoords.name };
      const calculatedHeading = calculateBearing(prevCoords, nextCoords);
      const headingToUse = distance > 0.001 ? calculatedHeading : veh.headingDegrees;

      // Random speed fluctuations between 28 km/h and 58 km/h
      const speedVariation = (Math.random() - 0.5) * 4;
      const baseSpeed = veh.vehicleType === 'moto' ? 48 : 38;
      const currentSpeed = Math.round(Math.max(20, Math.min(70, baseSpeed + speedVariation)));

      // Slight battery decay simulation
      const currentBattery = Math.max(15, veh.batteryPercent - (Math.random() < 0.1 ? 1 : 0));

      const updatedVehicle: SimulatedVehicle = {
        ...veh,
        previousCoords: prevCoords,
        currentCoords: nextCoords,
        headingDegrees: headingToUse,
        targetHeadingDegrees: headingToUse,
        speedKmH: currentSpeed,
        batteryPercent: currentBattery,
        currentWaypointIndex: nextWaypointIndex,
        isCustomDispatched: isTargetReached ? false : veh.isCustomDispatched,
        targetCoords: isTargetReached ? undefined : veh.targetCoords,
        lastPingTime: now,
      };

      // Create broadcast log entry for first or alternating vehicles
      if (index === 0 || Math.random() < 0.35) {
        const timeStr = new Date(now).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const logEntry: TelemetryLogEntry = {
          id: `log-${now}-${veh.id}-${Math.random().toString(36).substring(2, 7)}`,
          vehicleId: veh.id,
          driverName: veh.name,
          vehicleType: veh.vehicleType,
          plate: veh.plate,
          coords: nextCoords,
          headingDegrees: headingToUse,
          speedKmH: currentSpeed,
          timestamp: now,
          timeFormatted: timeStr,
          status: veh.operationalStatus,
        };
        sampleLog = logEntry;
        this.addLog(logEntry);
      }

      return updatedVehicle;
    });

    this.notifyListeners(sampleLog);
  }

  private addLog(entry: TelemetryLogEntry): void {
    this.telemetryLogs = [entry, ...this.telemetryLogs].slice(0, this.maxLogs);
  }

  /**
   * Allows the user to dispatch a custom destination coordinate to any vehicle.
   * The vehicle will immediately rotate and drive to that coordinate!
   */
  public dispatchVehicleToCoordinates(vehicleId: string, destination: Coordinates): boolean {
    const index = this.vehicles.findIndex((v) => v.id === vehicleId);
    if (index === -1) return false;

    const veh = this.vehicles[index];
    const initialBearing = calculateBearing(veh.currentCoords, destination);

    // Create route waypoints to the new coordinate
    const midLat = (veh.currentCoords.lat + destination.lat) / 2;
    const midLng = (veh.currentCoords.lng + destination.lng) / 2;

    const newWaypoints: Coordinates[] = [
      { lat: midLat + 0.001, lng: midLng + 0.001 },
      destination,
      { lat: destination.lat + 0.002, lng: destination.lng + 0.001 },
      veh.currentCoords,
    ];

    this.vehicles[index] = {
      ...veh,
      targetCoords: destination,
      headingDegrees: initialBearing,
      targetHeadingDegrees: initialBearing,
      routeWaypoints: newWaypoints,
      currentWaypointIndex: 0,
      isCustomDispatched: true,
      operationalStatus: 'en_viaje',
    };

    const timeStr = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: TelemetryLogEntry = {
      id: `dispatch-${Date.now()}-${veh.id}-${Math.random().toString(36).substring(2, 7)}`,
      vehicleId: veh.id,
      driverName: veh.name,
      vehicleType: veh.vehicleType,
      plate: veh.plate,
      coords: destination,
      headingDegrees: initialBearing,
      speedKmH: veh.speedKmH,
      timestamp: Date.now(),
      timeFormatted: timeStr,
      status: 'Despachado a nueva coordenada',
    };

    this.addLog(log);
    this.notifyListeners(log);
    return true;
  }

  /**
   * Spawns a new custom vehicle (Carro or Moto) at specified coordinates.
   */
  public spawnCustomVehicle(params: {
    name: string;
    type: VehicleType;
    model: string;
    plate: string;
    coords: Coordinates;
  }): SimulatedVehicle {
    const isMoto = params.type === 'moto';
    const id = `custom-${params.type}-${Date.now()}`;
    const initialBearing = Math.floor(Math.random() * 360);

    const radius = 0.006;
    const waypoints: Coordinates[] = [
      params.coords,
      { lat: params.coords.lat + radius, lng: params.coords.lng + radius },
      { lat: params.coords.lat + radius, lng: params.coords.lng - radius },
      { lat: params.coords.lat - radius, lng: params.coords.lng - radius },
      { lat: params.coords.lat - radius, lng: params.coords.lng + radius },
      params.coords,
    ];

    const newVehicle: SimulatedVehicle = {
      id,
      name: params.name || (isMoto ? 'Piloto Moto Express' : 'Conductor Taxi Oficial'),
      photoUrl: isMoto
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      phone: '+593 99 ' + Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7),
      rating: 5.0,
      tripsCount: 1,
      vehicleType: params.type,
      make: isMoto ? 'Yamaha' : 'Chevrolet',
      model: params.model || (isMoto ? 'FZ-25 250cc' : 'Sail Sedán'),
      plate: params.plate || (isMoto ? 'IB-' + Math.floor(100 + Math.random() * 899) + 'W' : 'PBA-' + Math.floor(1000 + Math.random() * 8999)),
      color: isMoto ? 'Naranja Andes / Negro' : 'Amarillo Taxi / Negro',
      cooperativa: isMoto ? 'AndesMovi Moto Express' : 'Coop. Taxi Pichincha Oficial',
      currentCoords: params.coords,
      previousCoords: { lat: params.coords.lat - 0.0005, lng: params.coords.lng - 0.0005 },
      headingDegrees: initialBearing,
      targetHeadingDegrees: initialBearing,
      speedKmH: isMoto ? 45 : 35,
      operationalStatus: 'disponible',
      batteryPercent: 100,
      altitudeMeters: 2810,
      routeWaypoints: waypoints,
      currentWaypointIndex: 0,
      lastPingTime: Date.now(),
    };

    this.vehicles = [newVehicle, ...this.vehicles];
    this.notifyListeners();
    return newVehicle;
  }

  public resetFleet(): void {
    this.vehicles = [...BASE_FLEET_UNITS];
    this.telemetryLogs = [];
    this.notifyListeners();
  }

  public removeVehicle(id: string): void {
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    this.notifyListeners();
  }
}

export const fleetSimulationService = new FleetSimulationService();

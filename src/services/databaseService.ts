/**
 * Servicio Central de Base de Datos y Lógica de Negocio AndesMovi Ecuador
 * Sincronizado en tiempo real con Firebase Firestore y Auth, con fallback local robusto.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';

import {
  AdminActiveTrip,
  RegisteredVehicleUnit,
  WalletRechargeRequest,
  AdminTripStatus,
  ServiceType,
  PaymentMethodType,
  UserProfile,
  AuthProviderType,
  ExecutiveTripFrequency,
} from '../types';
import { validateEcuadorPlate, PlateValidationResult } from '../utils/plateValidator';
import { getOfficialTariffBreakdown } from '../utils/geoUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanPayload<T>(obj: T): Record<string, any> {
  return JSON.parse(JSON.stringify(obj));
}

export interface RegisteredAccountEntry {
  id: string;
  name: string;
  email: string;
  cedula?: string;
  phone?: string;
  password?: string;
  role: 'cliente' | 'conductor' | 'admin';
  province?: string;
  canton?: string;
  avatar?: string;
  vehicleType?: 'auto' | 'moto';
  plate?: string;
  vehicleModel?: string;
}

export const OFFICIAL_AUTHENTICATION_ACCOUNTS: RegisteredAccountEntry[] = [
  {
    id: 'usr-admin-founder-1',
    name: 'JHON JAVIER YEPEZ MORALES (Dueño)',
    email: 'jhonsevadtisn@gmail.com',
    cedula: '1004721351',
    phone: '0998241902',
    password: '1004721351Dueño',
    role: 'admin',
    province: 'Carchi',
    canton: 'Tulcán',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-admin-master-2',
    name: 'Administrador AndesMovi Ecuador',
    email: 'admin@andesmovi.ec',
    cedula: '0401999888',
    phone: '+593 99 000 0001',
    password: 'Admin2026*',
    role: 'admin',
    province: 'Carchi',
    canton: 'Tulcán',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-driver-carlos-1',
    name: 'Carlos Mendoza (Unidad 01 Taxi Tulcán)',
    email: 'conductor1@andesmovi.com',
    cedula: '0401894562',
    phone: '+593 99 123 4567',
    password: 'AndesMovi2026*Taxi',
    role: 'conductor',
    province: 'Carchi',
    canton: 'Tulcán',
    vehicleType: 'auto',
    vehicleModel: 'Chevrolet Sail Sedán',
    plate: 'PBA-8321',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-driver-carlos-2',
    name: 'Carlos Mendoza (Taxi Tulcán)',
    email: 'carlos.mendoza@andesmovi.ec',
    cedula: '0401894563',
    phone: '+593 99 123 4568',
    password: 'Conductor2026*',
    role: 'conductor',
    province: 'Carchi',
    canton: 'Tulcán',
    vehicleType: 'auto',
    vehicleModel: 'Chevrolet Sail Sedán',
    plate: 'PBA-8321',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-driver-moto-1',
    name: 'Bryan Revelo (Moto Express Tulcán)',
    email: 'moto@andesmovi.ec',
    cedula: '0401992233',
    phone: '+593 99 555 4321',
    password: 'Moto2026*',
    role: 'conductor',
    province: 'Carchi',
    canton: 'Tulcán',
    vehicleType: 'moto',
    vehicleModel: 'Yamaha FZ 150',
    plate: 'IC-452B',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-driver-moto-2',
    name: 'Javier Alvear (Moto Reparto Tulcán)',
    email: 'moto1@andesmovi.com',
    cedula: '1004567663',
    phone: '+593 98 456 7890',
    password: 'AndesMovi2026*Moto',
    role: 'conductor',
    province: 'Carchi',
    canton: 'Tulcán',
    vehicleType: 'moto',
    vehicleModel: 'Bajaj Pulsar 200',
    plate: 'IC-789A',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-client-mateo-1',
    name: 'Mateo Morales',
    email: 'cliente@andesmovi.ec',
    cedula: '1724589012',
    phone: '+593 98 765 4321',
    password: 'Cliente2026*',
    role: 'cliente',
    province: 'Carchi',
    canton: 'Tulcán',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-client-alt-2',
    name: 'María Fernanda Benalcázar',
    email: 'cliente1@andesmovi.com',
    cedula: '1710034065',
    phone: '+593 98 765 4322',
    password: 'AndesMovi2026*Cliente',
    role: 'cliente',
    province: 'Carchi',
    canton: 'Tulcán',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-client-maria-1',
    name: 'María Belén Vaca',
    email: 'mateo.morales.ec@gmail.com',
    cedula: '1004721351',
    phone: '0998241902',
    password: 'AndesMovi2026!',
    role: 'cliente',
    province: 'Carchi',
    canton: 'Tulcán',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_REGISTERED_USERS: UserProfile[] = OFFICIAL_AUTHENTICATION_ACCOUNTS.map((acc) => ({
  id: acc.id,
  name: acc.name,
  email: acc.email,
  phone: acc.phone || '0998241902',
  cedula: acc.cedula || '1004721351',
  cedulaVerified: true,
  province: acc.province || 'Carchi',
  canton: acc.canton || 'Tulcán',
  avatar: acc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  authProvider: 'email',
  rating: 5.0,
  totalTripsCompleted: acc.role === 'conductor' ? 140 : 15,
  isVerified: true,
  createdAt: Date.now() - 86400000 * 30,
  role: acc.role,
  isRegistrationComplete: true,
}));

export const ECUADOR_COOPERATIVAS = [
  'Coop. Taxi Los Lagos',
  'Coop. Taxi Atahualpa',
  'Coop. Ciudad de Tulcán',
  'Coop. Taxi Pichincha',
  'Coop. San Cristóbal Delivery',
  'Coop. 11 de Junio',
  'Coop. Taxis Rumiñahui',
  'Coop. Aeropuerto Mariscal Sucre',
];

export const ECUADOR_TERMINALES = [
  'Terminal Carcelén (Quito)',
  'Terminal Quitumbe (Quito)',
  'Terminal Terrestre Ibarra',
  'Terminal Terrestre Tulcán',
  'Terminal Terrestre Otavalo',
  'Terminal Terrestre Guayaquil',
  'Terminal Terrestre Ambato',
];

export const INITIAL_EXECUTIVE_FREQUENCIES: ExecutiveTripFrequency[] = [
  // 1. TULCÁN ➔ QUITO
  {
    id: 'freq-tul-uio-01',
    code: 'FREQ-TUL-UIO-01',
    originCity: 'Tulcán',
    originProvince: 'Carchi',
    originTerminal: 'Terminal Terrestre Tulcán (Matriz AndesMovi)',
    originCoords: {
      lat: 0.8118,
      lng: -77.7173,
      name: 'Terminal Terrestre Tulcán',
      address: 'Av. Veintimilla y Cotopaxi, Tulcán',
    },
    destinationCity: 'Quito',
    destinationProvince: 'Pichincha',
    destinationTerminal: 'Parque La Carolina / Quicentro (Av. de los Shyris)',
    destinationCoords: {
      lat: -0.1807,
      lng: -78.4678,
      name: 'Parque La Carolina / Quicentro',
      address: 'Av. de los Shyris y Naciones Unidas, Quito',
    },
    departureTime: '',
    departureTimes: [],
    pricePerSeatUsd: 25.0,
    depositRequiredUsd: 10.0,
    availableSeats: 4,
    daysOfWeek: ['Todos los días'],
    vehicleType: 'auto',
    notes: 'Ruta directa Panamericana E35 Tulcán a Quito (La Carolina / Quicentro). Aire acondicionado y maletero amplio.',
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
  },

  // 2. QUITO ➔ TULCÁN
  {
    id: 'freq-uio-tul-01',
    code: 'FREQ-UIO-TUL-01',
    originCity: 'Quito',
    originProvince: 'Pichincha',
    originTerminal: 'Parque La Carolina / Quicentro (Av. de los Shyris)',
    originCoords: {
      lat: -0.1807,
      lng: -78.4678,
      name: 'Parque La Carolina / Quicentro',
      address: 'Av. de los Shyris y Naciones Unidas, Quito',
    },
    destinationCity: 'Tulcán',
    destinationProvince: 'Carchi',
    destinationTerminal: 'Terminal Terrestre Tulcán (Matriz AndesMovi)',
    destinationCoords: {
      lat: 0.8118,
      lng: -77.7173,
      name: 'Terminal Terrestre Tulcán',
      address: 'Av. Veintimilla y Cotopaxi, Tulcán',
    },
    departureTime: '',
    departureTimes: [],
    pricePerSeatUsd: 25.0,
    depositRequiredUsd: 10.0,
    availableSeats: 4,
    daysOfWeek: ['Todos los días'],
    vehicleType: 'auto',
    notes: 'Retorno directo Quito (La Carolina) hacia Tulcán y Frontera Rumichaca.',
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
  },

  // 3. IBARRA ➔ QUITO
  {
    id: 'freq-iba-uio-01',
    code: 'FREQ-IBA-UIO-01',
    originCity: 'Ibarra',
    originProvince: 'Imbabura',
    originTerminal: 'Terminal Terrestre Ibarra (Parque Moncayo)',
    originCoords: {
      lat: 0.3517,
      lng: -78.1223,
      name: 'Terminal Terrestre Ibarra',
      address: 'Av. Teodoro Gómez y Fray Vacas Galindo, Ibarra',
    },
    destinationCity: 'Quito',
    destinationProvince: 'Pichincha',
    destinationTerminal: 'Terminal Terrestre Carcelén / La Carolina',
    destinationCoords: {
      lat: -0.0984,
      lng: -78.4789,
      name: 'Terminal Terrestre Carcelén',
      address: 'Av. Eloy Alfaro y Galo Plaza Lasso, Quito Norte',
    },
    departureTime: '',
    departureTimes: [],
    pricePerSeatUsd: 15.0,
    depositRequiredUsd: 5.0,
    availableSeats: 4,
    daysOfWeek: ['Todos los días'],
    vehicleType: 'auto',
    notes: 'Ruta exprés Panamericana Norte E35 Ibarra hacia Quito.',
    isActive: true,
    createdAt: Date.now() - 86400000 * 2,
  },

  // 4. QUITO ➔ IBARRA
  {
    id: 'freq-uio-iba-01',
    code: 'FREQ-UIO-IBA-01',
    originCity: 'Quito',
    originProvince: 'Pichincha',
    originTerminal: 'Terminal Terrestre Carcelén / La Carolina',
    originCoords: {
      lat: -0.0984,
      lng: -78.4789,
      name: 'Terminal Terrestre Carcelén',
      address: 'Av. Eloy Alfaro y Galo Plaza Lasso, Quito Norte',
    },
    destinationCity: 'Ibarra',
    destinationProvince: 'Imbabura',
    destinationTerminal: 'Terminal Terrestre Ibarra (Parque Moncayo)',
    destinationCoords: {
      lat: 0.3517,
      lng: -78.1223,
      name: 'Terminal Terrestre Ibarra',
      address: 'Av. Teodoro Gómez y Fray Vacas Galindo, Ibarra',
    },
    departureTime: '',
    departureTimes: [],
    pricePerSeatUsd: 15.0,
    depositRequiredUsd: 5.0,
    availableSeats: 4,
    daysOfWeek: ['Todos los días'],
    vehicleType: 'auto',
    notes: 'Retorno desde Quito hacia la Ciudad Blanca de Ibarra.',
    isActive: true,
    createdAt: Date.now() - 86400000 * 2,
  },

  // 5. IBARRA ➔ TULCÁN
  {
    id: 'freq-iba-tul-01',
    code: 'FREQ-IBA-TUL-01',
    originCity: 'Ibarra',
    originProvince: 'Imbabura',
    originTerminal: 'Terminal Terrestre Ibarra (Parque Moncayo)',
    originCoords: {
      lat: 0.3517,
      lng: -78.1223,
      name: 'Terminal Terrestre Ibarra',
      address: 'Av. Teodoro Gómez y Fray Vacas Galindo, Ibarra',
    },
    destinationCity: 'Tulcán',
    destinationProvince: 'Carchi',
    destinationTerminal: 'Terminal Terrestre Tulcán (Matriz AndesMovi)',
    destinationCoords: {
      lat: 0.8118,
      lng: -77.7173,
      name: 'Terminal Terrestre Tulcán',
      address: 'Av. Veintimilla y Cotopaxi, Tulcán',
    },
    departureTime: '',
    departureTimes: [],
    pricePerSeatUsd: 10.0,
    depositRequiredUsd: 5.0,
    availableSeats: 4,
    daysOfWeek: ['Todos los días'],
    vehicleType: 'auto',
    notes: 'Ruta interprovincial Ibarra a Tulcán (Carchi / Frontera).',
    isActive: true,
    createdAt: Date.now() - 86400000,
  },

  // 6. TULCÁN ➔ IBARRA
  {
    id: 'freq-tul-iba-01',
    code: 'FREQ-TUL-IBA-01',
    originCity: 'Tulcán',
    originProvince: 'Carchi',
    originTerminal: 'Terminal Terrestre Tulcán (Matriz AndesMovi)',
    originCoords: {
      lat: 0.8118,
      lng: -77.7173,
      name: 'Terminal Terrestre Tulcán',
      address: 'Av. Veintimilla y Cotopaxi, Tulcán',
    },
    destinationCity: 'Ibarra',
    destinationProvince: 'Imbabura',
    destinationTerminal: 'Terminal Terrestre Ibarra (Parque Moncayo)',
    destinationCoords: {
      lat: 0.3517,
      lng: -78.1223,
      name: 'Terminal Terrestre Ibarra',
      address: 'Av. Teodoro Gómez y Fray Vacas Galindo, Ibarra',
    },
    departureTime: '',
    departureTimes: [],
    pricePerSeatUsd: 10.0,
    depositRequiredUsd: 5.0,
    availableSeats: 4,
    daysOfWeek: ['Todos los días'],
    vehicleType: 'auto',
    notes: 'Ruta directa Tulcán a Ibarra por Panamericana Norte E35.',
    isActive: true,
    createdAt: Date.now() - 86400000,
  },
];

export class DatabaseService {
  private activeTrips: AdminActiveTrip[] = [];
  private registeredUnits: RegisteredVehicleUnit[] = [];
  private registeredUsers: UserProfile[] = [...INITIAL_REGISTERED_USERS];
  private executiveFrequencies: ExecutiveTripFrequency[] = [];

  constructor() {
    this.loadExecutiveFrequenciesFromCache();
    this.initFirestoreSync();
  }

  private loadExecutiveFrequenciesFromCache() {
    try {
      const CURRENT_VERSION = 'v7_official_6_routes_empty_turnos_admin_sets';
      const storedVersion = localStorage.getItem('andesmovi_frequencies_version');
      if (storedVersion !== CURRENT_VERSION) {
        localStorage.removeItem('andesmovi_executive_frequencies');
        localStorage.setItem('andesmovi_frequencies_version', CURRENT_VERSION);
      } else {
        const cached = localStorage.getItem('andesmovi_executive_frequencies');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.executiveFrequencies = parsed.map((f: ExecutiveTripFrequency) => ({
              ...f,
              departureTimes: Array.isArray(f.departureTimes) ? f.departureTimes : [],
              departureTime: f.departureTime || '',
            }));
            return;
          }
        }
      }
    } catch {}
    this.executiveFrequencies = INITIAL_EXECUTIVE_FREQUENCIES.map((f) => ({
      ...f,
      departureTimes: Array.isArray(f.departureTimes) ? f.departureTimes : [],
      departureTime: f.departureTime || '',
    }));
  }

  private async initFirestoreSync() {
    try {
      // Test server connection as per guidelines
      await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});

      // Sync Trips
      onSnapshot(collection(db, 'trips'), (snapshot) => {
        const trips: AdminActiveTrip[] = [];
        snapshot.forEach((docSnap) => {
          trips.push(docSnap.data() as AdminActiveTrip);
        });
        this.activeTrips = trips;
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'trips');
      });

      // Sync Units
      onSnapshot(collection(db, 'units'), (snapshot) => {
        const units: RegisteredVehicleUnit[] = [];
        snapshot.forEach((docSnap) => {
          units.push(docSnap.data() as RegisteredVehicleUnit);
        });
        if (units.length > 0) {
          this.registeredUnits = units;
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'units');
      });

      // Sync Users
      onSnapshot(collection(db, 'users'), (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as UserProfile);
        });
        if (users.length > 0) {
          this.registeredUsers = users;
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });

      // Sync Executive Frequencies (filtering out deprecated old sample routes)
      onSnapshot(collection(db, 'executive_frequencies'), (snapshot) => {
        const freqs: ExecutiveTripFrequency[] = [];
        const deprecatedIds = new Set([
          'freq-uio-gye-01',
          'freq-cue-gye-01',
          'freq-tul-tab-01',
          'freq-tul-uio-02',
          'freq-tul-uio-03',
          'freq-uio-tul-02',
        ]);
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ExecutiveTripFrequency;
          if (data && !deprecatedIds.has(data.id)) {
            freqs.push(data);
          }
        });
        if (freqs.length > 0) {
          this.executiveFrequencies = freqs;
          this.notifyFrequenciesChanged(false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'executive_frequencies');
      });
    } catch (e) {
      console.warn('Firestore sync init fallback to local state:', e);
    }
  }

  // ==================== GESTIÓN DE CARRERAS ====================

  public getActiveTrips(): AdminActiveTrip[] {
    return [...this.activeTrips];
  }

  public getTripsByStatus(status: AdminTripStatus): AdminActiveTrip[] {
    return this.activeTrips.filter((t) => t.status === status);
  }

  public updateTripStatus(tripId: string, newStatus: AdminTripStatus): AdminActiveTrip | null {
    const trip = this.activeTrips.find((t) => t.id === tripId);
    if (!trip) return null;
    trip.status = newStatus;
    if (newStatus === 'finalizado') {
      trip.paymentStatus = 'pagado';
    }

    // Persist to Firestore
    setDoc(doc(db, 'trips', trip.id), cleanPayload(trip)).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `trips/${trip.id}`);
    });

    return { ...trip };
  }

  public addOrUpdateTrip(trip: AdminActiveTrip) {
    const idx = this.activeTrips.findIndex((t) => t.id === trip.id);
    if (idx >= 0) {
      this.activeTrips[idx] = trip;
    } else {
      this.activeTrips.unshift(trip);
    }

    setDoc(doc(db, 'trips', trip.id), cleanPayload(trip)).catch((error) => {
      handleFirestoreError(error, OperationType.WRITE, `trips/${trip.id}`);
    });
  }

  public deleteTrip(tripId: string) {
    this.activeTrips = this.activeTrips.filter((t) => t.id !== tripId);
    deleteDoc(doc(db, 'trips', tripId)).catch((error) => {
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
    });
  }

  public clearFinishedTrips() {
    const toDelete = this.activeTrips.filter((t) => t.status === 'finalizado' || t.status === 'cancelado');
    this.activeTrips = this.activeTrips.filter((t) => t.status !== 'finalizado' && t.status !== 'cancelado');
    toDelete.forEach((t) => {
      deleteDoc(doc(db, 'trips', t.id)).catch(() => {});
    });
  }

  public clearAllTrips() {
    const toDelete = [...this.activeTrips];
    this.activeTrips = [];
    toDelete.forEach((t) => {
      deleteDoc(doc(db, 'trips', t.id)).catch(() => {});
    });
  }

  public createTrip(params: {
    serviceType: ServiceType;
    passengerName: string;
    passengerPhone: string;
    originAddress: string;
    destinationAddress: string;
    distanceKm: number;
    durationMinutes: number;
    paymentMethod: PaymentMethodType;
    cooperativaName?: string;
    terminalName?: string;
    notes?: string;
  }): AdminActiveTrip {
    const breakdown = getOfficialTariffBreakdown(params.distanceKm, params.serviceType, 'auto');
    const tripId = `trip-${Date.now()}`;
    const newTrip: AdminActiveTrip = {
      id: tripId,
      tripCode: `CARR-EC-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceType: params.serviceType,
      passengerName: params.passengerName,
      passengerPhone: params.passengerPhone,
      originAddress: params.originAddress,
      destinationAddress: params.destinationAddress,
      distanceKm: params.distanceKm,
      durationMinutes: params.durationMinutes,
      fareBreakdown: {
        baseFareUsd: breakdown.baseFareUsd,
        coveredKm: breakdown.baseCoverageKm,
        extraKm: breakdown.excessKm,
        extraKmRateUsd: breakdown.perExtraKmUsd,
        totalFareUsd: breakdown.totalFareUsd,
      },
      status: 'pendiente',
      paymentMethod: params.paymentMethod,
      paymentStatus: 'pendiente',
      cooperativaName: params.cooperativaName || 'Coop. Taxi Los Lagos',
      terminalName: params.terminalName || 'Terminal Carcelén (Quito)',
      startSecurityPin: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: Date.now(),
      createdFormatted: 'Ahora mismo',
      notes: params.notes,
    };

    this.activeTrips.unshift(newTrip);

    setDoc(doc(db, 'trips', tripId), cleanPayload(newTrip)).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `trips/${tripId}`);
    });

    return newTrip;
  }

  // ==================== GESTIÓN DE UNIDADES Y PLACAS ====================

  public getRegisteredUnits(): RegisteredVehicleUnit[] {
    return [...this.registeredUnits];
  }

  public registerNewUnit(params: {
    unitNumber: string;
    plate: string;
    model: string;
    year: number;
    color: string;
    vehicleType: 'auto' | 'moto' | 'confort' | 'camioneta' | 'mini';
    cooperativa: string;
    terminal: string;
    assignedDriverName: string;
    assignedDriverCedula: string;
    driverPhone: string;
  }): { success: boolean; unit?: RegisteredVehicleUnit; error?: string } {
    const plateValidation: PlateValidationResult = validateEcuadorPlate(params.plate);
    if (!plateValidation.isValid) {
      return { success: false, error: plateValidation.errorMessage || 'Placa vehicular inválida' };
    }

    const exists = this.registeredUnits.some(
      (u) => u.plate.toUpperCase() === plateValidation.normalizedPlate.toUpperCase()
    );
    if (exists) {
      return { success: false, error: `La placa ${plateValidation.normalizedPlate} ya se encuentra registrada en el sistema.` };
    }

    const unitId = `unit-${Date.now()}`;
    const newUnit: RegisteredVehicleUnit = {
      id: unitId,
      unitNumber: params.unitNumber.trim(),
      plate: plateValidation.normalizedPlate,
      plateProvince: plateValidation.provinceName,
      model: params.model.trim(),
      year: params.year,
      color: params.color.trim(),
      vehicleType: params.vehicleType,
      cooperativa: params.cooperativa,
      terminal: params.terminal,
      assignedDriverId: `drv-${Date.now().toString().slice(-4)}`,
      assignedDriverName: params.assignedDriverName.trim(),
      assignedDriverCedula: params.assignedDriverCedula.trim(),
      driverPhone: params.driverPhone.trim(),
      isDriverApproved: true,
      operationalStatus: 'disponible',
      registeredAt: Date.now(),
      registeredAtFormatted: new Date().toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    this.registeredUnits.unshift(newUnit);

    setDoc(doc(db, 'units', unitId), cleanPayload(newUnit)).catch((error) => {
      handleFirestoreError(error, OperationType.CREATE, `units/${unitId}`);
    });

    return { success: true, unit: newUnit };
  }

  // ==================== GESTIÓN DE USUARIOS Y UNICIDAD DE CÉDULA ====================

  public getRegisteredUsers(): UserProfile[] {
    return [...this.registeredUsers];
  }

  public isCedulaRegistered(cedula: string, excludeUserId?: string): boolean {
    const cleanCedula = (cedula || '').replace(/\D/g, '').trim();
    if (!cleanCedula) return false;
    return this.registeredUsers.some(
      (u) => u.cedula?.replace(/\D/g, '') === cleanCedula && (!excludeUserId || u.id !== excludeUserId)
    );
  }

  public getUserByCedula(cedula: string): UserProfile | undefined {
    const cleanCedula = (cedula || '').replace(/\D/g, '').trim();
    return this.registeredUsers.find((u) => u.cedula?.replace(/\D/g, '') === cleanCedula);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    if (!email) return undefined;
    return this.registeredUsers.find((u) => u.email?.toLowerCase().trim() === email.toLowerCase().trim());
  }

  public getUserBySocialAccount(provider: AuthProviderType, email?: string): UserProfile | undefined {
    if (email) {
      const byEmail = this.getUserByEmail(email);
      if (byEmail) return byEmail;
    }
    return this.registeredUsers.find(
      (u) => u.authProvider === provider && u.isRegistrationComplete
    );
  }

  public bindUserToDevice(userId: string, deviceId: string, deviceName: string): UserProfile | null {
    const user = this.registeredUsers.find((u) => u.id === userId || (u.cedula && userId.includes(u.cedula)));
    if (!user) return null;

    user.activeDeviceId = deviceId;
    user.lastDeviceName = deviceName;
    user.deviceBindingTimestamp = Date.now();

    setDoc(doc(db, 'users', user.id), cleanPayload(user)).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    });

    return { ...user };
  }

  public verifyUserDeviceSession(
    userId: string,
    currentDeviceId: string
  ): { isValid: boolean; activeDeviceName?: string; activeDeviceId?: string } {
    const user = this.registeredUsers.find((u) => u.id === userId || (u.cedula && userId.includes(u.cedula)));
    if (!user || !user.activeDeviceId) {
      return { isValid: true };
    }

    if (user.activeDeviceId !== currentDeviceId) {
      return {
        isValid: false,
        activeDeviceName: user.lastDeviceName || 'Otro Dispositivo Autorizado',
        activeDeviceId: user.activeDeviceId,
      };
    }

    return { isValid: true };
  }

  public registerOrUpdateUser(user: UserProfile): UserProfile {
    const idx = this.registeredUsers.findIndex(
      (u) =>
        u.id === user.id ||
        (u.cedula && user.cedula && u.cedula.replace(/\D/g, '') === user.cedula.replace(/\D/g, '')) ||
        (u.email && user.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (u.authProvider && user.authProvider && u.authProvider === user.authProvider && ['google', 'facebook', 'icloud'].includes(user.authProvider))
    );
    if (idx >= 0) {
      this.registeredUsers[idx] = { ...this.registeredUsers[idx], ...user };
    } else {
      this.registeredUsers.unshift(user);
    }

    setDoc(doc(db, 'users', user.id), cleanPayload(user)).catch((error) => {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    });

    return user;
  }

  public saveUser(user: UserProfile): UserProfile {
    return this.registerOrUpdateUser(user);
  }

  public authenticateUser(
    identifier: string,
    pass: string,
    requestedRole?: 'cliente' | 'conductor' | 'admin'
  ): { success: boolean; user?: UserProfile; error?: string } {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanDigits = (identifier || '').replace(/\D/g, '');

    if (!cleanId) {
      return { success: false, error: 'Ingresa tu correo, cédula o número de celular' };
    }
    if (!pass) {
      return { success: false, error: 'Ingresa tu contraseña' };
    }

    // 1. Obtener todas las cuentas registradas en la app (LocalStorage y Firestore)
    let dynamicAccounts: RegisteredAccountEntry[] = [];
    try {
      const stored = localStorage.getItem('andesmovi_user_registry');
      if (stored) {
        dynamicAccounts = JSON.parse(stored);
      }
    } catch {}

    const allAccounts: RegisteredAccountEntry[] = [
      ...OFFICIAL_AUTHENTICATION_ACCOUNTS,
      ...dynamicAccounts,
    ];

    // Alias maestro para Dueño
    const isMasterAlias =
      cleanId === 'dueñoandesmovi' ||
      cleanId === 'duenoandesmovi' ||
      cleanId === '1004721351' ||
      cleanId === 'jhonsevadtisn@gmail.com' ||
      cleanId === 'admin@andesmovi.ec';

    // 2. Buscar coincidencia por email, cédula, teléfono o alias
    const matchedAccount = allAccounts.find((acc) => {
      const aEmail = (acc.email || '').toLowerCase().trim();
      const aCedula = (acc.cedula || '').replace(/\D/g, '');
      const aPhone = (acc.phone || '').replace(/\D/g, '');

      if (isMasterAlias && (acc.role === 'admin' || acc.cedula === '1004721351')) {
        return true;
      }

      const matchEmail = Boolean(aEmail && aEmail === cleanId);
      const matchCedula = Boolean(cleanDigits.length === 10 && aCedula && aCedula === cleanDigits);
      const matchPhone = Boolean(cleanDigits.length >= 7 && aPhone && aPhone.includes(cleanDigits));

      return matchEmail || matchCedula || matchPhone;
    });

    if (!matchedAccount) {
      return { success: false, error: 'Correo o contraseña incorrectos' };
    }

    // 3. Validar contraseña: contra cuenta o contra clave recuperada
    let validPassword = matchedAccount.password;
    try {
      const customPass = localStorage.getItem('andesmovi_pass_' + cleanId);
      if (customPass) {
        validPassword = customPass;
      }
    } catch {}

    // Si es Dueño, admitir también la contraseña maestra
    const isMasterPassword = isMasterAlias && (pass === '1004721351Dueño' || pass === 'AndesMovi2026!');
    const passwordMatches = isMasterPassword || (validPassword && validPassword === pass);

    if (!passwordMatches) {
      return { success: false, error: 'Correo o contraseña incorrectos' };
    }

    // 4. Construir perfil de usuario autenticado
    const role = matchedAccount.role || requestedRole || 'cliente';
    const authenticatedUser: UserProfile = {
      id: matchedAccount.id || `usr-${Date.now()}`,
      name: matchedAccount.name,
      email: matchedAccount.email,
      phone: matchedAccount.phone || '0998241902',
      cedula: matchedAccount.cedula || '1004721351',
      cedulaVerified: true,
      province: matchedAccount.province || 'Carchi',
      canton: matchedAccount.canton || 'Tulcán',
      avatar: matchedAccount.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authProvider: 'email',
      role,
      rating: 5.0,
      totalTripsCompleted: role === 'conductor' ? 120 : 15,
      isVerified: true,
      createdAt: Date.now(),
      isRegistrationComplete: true,
    };

    // Actualizar en cache y Firestore
    this.registerOrUpdateUser(authenticatedUser);

    try {
      localStorage.setItem('andesmovi_user_session', JSON.stringify(authenticatedUser));
      if (role === 'admin') {
        localStorage.setItem('andesmovi_master_session', JSON.stringify(authenticatedUser));
      }
    } catch {}

    return { success: true, user: authenticatedUser };
  }

  public registerNewAccount(account: RegisteredAccountEntry): UserProfile {
    // 1. Guardar en registro persistente con credenciales
    try {
      let currentRegistry: RegisteredAccountEntry[] = [];
      const stored = localStorage.getItem('andesmovi_user_registry');
      if (stored) {
        currentRegistry = JSON.parse(stored);
      }
      const existingIdx = currentRegistry.findIndex(
        (a) =>
          a.id === account.id ||
          (a.email && a.email.toLowerCase() === account.email.toLowerCase()) ||
          (a.cedula && account.cedula && a.cedula === account.cedula)
      );
      if (existingIdx >= 0) {
        currentRegistry[existingIdx] = { ...currentRegistry[existingIdx], ...account };
      } else {
        currentRegistry.push(account);
      }
      localStorage.setItem('andesmovi_user_registry', JSON.stringify(currentRegistry));
    } catch {}

    // 2. Construir perfil público
    const profile: UserProfile = {
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone || '',
      cedula: account.cedula || '',
      cedulaVerified: true,
      province: account.province || 'Carchi',
      canton: account.canton || 'Tulcán',
      avatar: account.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authProvider: 'email',
      role: account.role,
      rating: 5.0,
      totalTripsCompleted: 0,
      isVerified: true,
      createdAt: Date.now(),
      isRegistrationComplete: true,
    };

    return this.registerOrUpdateUser(profile);
  }

  public deleteUser(userId: string, cedula?: string): boolean {
    const initialLen = this.registeredUsers.length;
    const cleanCedula = cedula ? cedula.replace(/\D/g, '') : null;
    
    let targetId = userId;
    this.registeredUsers = this.registeredUsers.filter((u) => {
      if (u.id === userId) {
        targetId = u.id;
        return false;
      }
      if (cleanCedula && u.cedula && u.cedula.replace(/\D/g, '') === cleanCedula) {
        targetId = u.id;
        return false;
      }
      return true;
    });

    deleteDoc(doc(db, 'users', targetId)).catch((error) => {
      handleFirestoreError(error, OperationType.DELETE, `users/${targetId}`);
    });

    return this.registeredUsers.length < initialLen;
  }

  // ==================== GESTIÓN DE FRECUENCIAS EJECUTIVAS ====================

  private notifyFrequenciesChanged(broadcast = true) {
    try {
      localStorage.setItem('andesmovi_executive_frequencies', JSON.stringify(this.executiveFrequencies));
      if (broadcast && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('andesmovi_frequencies_updated', {
            detail: [...this.executiveFrequencies],
          })
        );
      }
    } catch {}
  }

  public getExecutiveFrequencies(): ExecutiveTripFrequency[] {
    return [...this.executiveFrequencies];
  }

  public addExecutiveFrequency(frequency: ExecutiveTripFrequency): void {
    const idx = this.executiveFrequencies.findIndex((f) => f.id === frequency.id);
    if (idx >= 0) {
      this.executiveFrequencies[idx] = frequency;
    } else {
      this.executiveFrequencies.unshift(frequency);
    }

    this.notifyFrequenciesChanged(true);

    setDoc(doc(db, 'executive_frequencies', frequency.id), cleanPayload(frequency)).catch((error) => {
      handleFirestoreError(error, OperationType.WRITE, `executive_frequencies/${frequency.id}`);
    });
  }

  public updateExecutiveFrequency(frequency: ExecutiveTripFrequency): void {
    this.addExecutiveFrequency(frequency);
  }

  public toggleExecutiveFrequencyStatus(frequencyId: string): boolean {
    const freq = this.executiveFrequencies.find((f) => f.id === frequencyId);
    if (!freq) return false;
    freq.isActive = !freq.isActive;
    this.notifyFrequenciesChanged(true);

    setDoc(doc(db, 'executive_frequencies', freq.id), cleanPayload(freq)).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `executive_frequencies/${freq.id}`);
    });

    return freq.isActive;
  }

  public deleteExecutiveFrequency(frequencyId: string): boolean {
    const prevLen = this.executiveFrequencies.length;
    this.executiveFrequencies = this.executiveFrequencies.filter((f) => f.id !== frequencyId);
    this.notifyFrequenciesChanged(true);

    deleteDoc(doc(db, 'executive_frequencies', frequencyId)).catch((error) => {
      handleFirestoreError(error, OperationType.DELETE, `executive_frequencies/${frequencyId}`);
    });

    return this.executiveFrequencies.length < prevLen;
  }

  public addTurnoToFrequency(frequencyId: string, rawTurno: string): boolean {
    const freq = this.executiveFrequencies.find((f) => f.id === frequencyId);
    if (!freq) return false;
    const turno = rawTurno.trim();
    if (!turno) return false;

    const currentTimes = freq.departureTimes ? [...freq.departureTimes] : [freq.departureTime].filter(Boolean);
    if (!currentTimes.includes(turno)) {
      currentTimes.push(turno);
    }
    freq.departureTimes = currentTimes;
    if (!freq.departureTime) {
      freq.departureTime = turno;
    }

    this.notifyFrequenciesChanged(true);
    setDoc(doc(db, 'executive_frequencies', freq.id), cleanPayload(freq)).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `executive_frequencies/${freq.id}`);
    });
    return true;
  }

  public removeTurnoFromFrequency(frequencyId: string, turno: string): boolean {
    const freq = this.executiveFrequencies.find((f) => f.id === frequencyId);
    if (!freq || !freq.departureTimes) return false;

    freq.departureTimes = freq.departureTimes.filter((t) => t !== turno);
    if (freq.departureTime === turno) {
      freq.departureTime = freq.departureTimes[0] || '';
    }

    this.notifyFrequenciesChanged(true);
    setDoc(doc(db, 'executive_frequencies', freq.id), cleanPayload(freq)).catch((error) => {
      handleFirestoreError(error, OperationType.UPDATE, `executive_frequencies/${freq.id}`);
    });
    return true;
  }

  public resetToOfficialFrequencies() {
    this.executiveFrequencies = INITIAL_EXECUTIVE_FREQUENCIES.map((f) => ({
      ...f,
      departureTimes: Array.isArray(f.departureTimes) ? f.departureTimes : [],
      departureTime: f.departureTime || '',
    }));
    this.notifyFrequenciesChanged(true);

    INITIAL_EXECUTIVE_FREQUENCIES.forEach((freq) => {
      setDoc(doc(db, 'executive_frequencies', freq.id), cleanPayload(freq)).catch(() => {});
    });

    const deprecatedIds = [
      'freq-uio-gye-01',
      'freq-cue-gye-01',
      'freq-tul-tab-01',
      'freq-tul-uio-02',
      'freq-tul-uio-03',
      'freq-uio-tul-02',
    ];
    deprecatedIds.forEach((id) => {
      deleteDoc(doc(db, 'executive_frequencies', id)).catch(() => {});
    });
  }
}

export const databaseService = new DatabaseService();

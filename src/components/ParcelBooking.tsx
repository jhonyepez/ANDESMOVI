import React, { useState } from 'react';
import { Coordinates, ParcelDetails, SanCristobalOffice, TransportCarrier, SystemTariffs } from '../types';
import { ECUADOR_GEOGRAPHY } from '../data/ecuador_geography';
import {
  TULCANAZA_PARCEL_TARIFFS,
  TULCANAZA_OFFICE_DETAILS,
  TulcanazaParcelTariffItem,
} from '../data/tulcanazaTariffs';
import {
  calculateDistanceKm,
  estimateDurationMinutes,
  calculateSuggestedPrice,
  formatCurrency,
} from '../utils/geoUtils';
import {
  POPULAR_LOCATIONS,
  ECUADOR_PROVINCES,
  SAN_CRISTOBAL_OFFICES,
  PULLMAN_CARCHI_OFFICES,
  CITA_EXPRESS_OFFICES,
  ALL_PARCEL_OFFICES,
  CARRIERS_CONFIG,
  SAMPLE_PACKAGE_PHOTOS,
  EcuadorProvince,
} from '../data/mockData';
import {
  Package,
  FileText,
  Box,
  Truck,
  ShieldCheck,
  MapPin,
  Navigation,
  Plus,
  Minus,
  ArrowRight,
  AlertTriangle,
  KeyRound,
  Calendar,
  Camera,
  Upload,
  X,
  Building2,
  Phone,
  User,
  CheckCircle2,
  Globe,
  CreditCard,
  Search,
  Printer,
  Wallet,
  Info,
  ChevronDown,
  Lock,
  Sparkles,
} from 'lucide-react';
import { ParcelReceiptModal } from './ParcelReceiptModal';
import { UserProfile } from '../types';
import { haptic } from '../utils/haptics';

interface ParcelBookingProps {
  currentUser?: UserProfile | null;
  onOpenRegister?: () => void;
  origin: Coordinates;
  destination: Coordinates | null;
  onSelectOrigin: (coords: Coordinates) => void;
  onSelectDestination: (coords: Coordinates) => void;
  onRequestPickOnMap: (mode: 'origin' | 'destination') => void;
  onConfirmParcel: (parcelData: {
    parcelDetails: ParcelDetails;
    distanceKm: number;
    estimatedMinutes: number;
    offeredPrice: number;
  }) => void;
  onOpenSchedule?: (parcelDetails: ParcelDetails, price: number) => void;
  onOpenAlliedCooperatives?: () => void;
  systemTariffs?: SystemTariffs;
  isDark?: boolean;
}

export const ParcelBooking: React.FC<ParcelBookingProps> = ({
  currentUser,
  onOpenRegister,
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  onRequestPickOnMap,
  onConfirmParcel,
  onOpenSchedule,
  onOpenAlliedCooperatives,
  systemTariffs,
  isDark = true,
}) => {
  const [showDemoBlockModal, setShowDemoBlockModal] = useState<boolean>(false);

  React.useEffect(() => {
    if (currentUser) {
      setShowDemoBlockModal(false);
    }
  }, [currentUser]);
  // Scope: Urbano (Dentro de la ciudad) vs Interprovincial (Entre provincias / Nacional)
  const [scope, setScope] = useState<'urbano' | 'interprovincial'>('interprovincial');
  
  // Province & Canton selection
  const [originProvince, setOriginProvince] = useState<string>('Pichincha');
  const [originCanton, setOriginCanton] = useState<string>('Quito');
  const [destProvince, setDestProvince] = useState<string>('Guayas');
  const [destCanton, setDestCanton] = useState<string>('Guayaquil');

  // Helper para cantones
  const originCantons = ECUADOR_GEOGRAPHY.find(p => p.province === originProvince)?.cantons || [];
  const destCantons = ECUADOR_GEOGRAPHY.find(p => p.province === destProvince)?.cantons || [];

  // Oficina San Cristóbal Internacional de Llegada (Exclusiva a Nivel Nacional)
  const [selectedArrivalOfficeId, setSelectedArrivalOfficeId] = useState<string>(
    'sc-guayaquil-matriz'
  );
  // Tipo de Origen: Recogida en Domicilio vs Entrega en Oficina Tulcanaza
  const [originDispatchType, setOriginDispatchType] = useState<'domicilio' | 'oficina'>('domicilio');
  const [selectedOriginOfficeId, setSelectedOriginOfficeId] = useState<string>(
    'sc-sierra-tulcan-tulcanaza'
  );

  // Tarifas Oficiales Despacho Oficina Tulcanaza
  const [selectedTulcanazaTariff, setSelectedTulcanazaTariff] = useState<TulcanazaParcelTariffItem>(
    TULCANAZA_PARCEL_TARIFFS[1] // Paquete 2 kg ($8.50)
  );

  // Filtros de búsqueda para agencias
  const [arrivalCarrierFilter, setArrivalCarrierFilter] = useState<'all' | TransportCarrier>('all');
  const [arrivalRegionFilter, setArrivalRegionFilter] = useState<'all' | 'Costa' | 'Sierra' | 'Oriente'>('all');
  const [arrivalOfficeSearch, setArrivalOfficeSearch] = useState<string>('');
  const [arrivalProvinceFilter, setArrivalProvinceFilter] = useState<string>('all');
  const [originOfficeSearch, setOriginOfficeSearch] = useState<string>('');
  const [showOfficeDirectoryModal, setShowOfficeDirectoryModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [directoryCarrierFilter, setDirectoryCarrierFilter] = useState<'all' | TransportCarrier>('all');
  const [directoryRegionFilter, setDirectoryRegionFilter] = useState<'all' | 'Costa' | 'Sierra' | 'Oriente'>('all');
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [directoryProvinceFilter, setDirectoryProvinceFilter] = useState<string>('all');

  // Recogida en Domicilio y Datos del Remitente (Quien Envía)
  const [senderName, setSenderName] = useState<string>('');
  const [senderCedula, setSenderCedula] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [pickupReference, setPickupReference] = useState<string>('');

  // Destinatario (Quien Recibe)
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverCedula, setReceiverCedula] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [dropoffReference, setDropoffReference] = useState<string>('');
  const [deliveryCityOrStop, setDeliveryCityOrStop] = useState<string>('');

  // Detalle del Paquete: Bultos, Tamaño y Peso
  const [packageCount, setPackageCount] = useState<number>(1);
  const [paymentTiming, setPaymentTiming] = useState<'pago_origen' | 'por_cobrar_destino'>('pago_origen');
  const [parcelSize, setParcelSize] = useState<
    'documento' | 'pequeno' | 'mediano' | 'grande' | 'carga'
  >('pequeno');
  const [weightKg, setWeightKg] = useState<number>(2);
  const [description, setDescription] = useState<string>('');
  const [isFragile, setIsFragile] = useState<boolean>(false);

  // Valor Declarado & Factura Comercial (Regla S/F y NDV)
  const [hasDeclaredValue, setHasDeclaredValue] = useState<boolean>(false);
  const [declaredValueUsd, setDeclaredValueUsd] = useState<number>(50);
  const [hasInvoiceAttached, setHasInvoiceAttached] = useState<boolean>(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // Fotos del Paquete
  const [photos, setPhotos] = useState<string[]>([SAMPLE_PACKAGE_PHOTOS[0]]);

  // Security 4-digit PIN for package delivery
  const [securityPin] = useState<string>(
    () => Math.floor(1000 + Math.random() * 9000).toString()
  );

  // Dynamic distance & price calculation based on scope
  const isInterprovincial = scope === 'interprovincial';

  const selectedArrivalOffice: SanCristobalOffice =
    ALL_PARCEL_OFFICES.find((o) => o.id === selectedArrivalOfficeId) ||
    ALL_PARCEL_OFFICES[0];

  const selectedOriginOffice: SanCristobalOffice =
    ALL_PARCEL_OFFICES.find((o) => o.id === selectedOriginOfficeId) ||
    ALL_PARCEL_OFFICES[0];

  // Lista de provincias únicas que poseen agencias autorizadas
  const uniqueProvincesWithOffices = Array.from(
    new Set(ALL_PARCEL_OFFICES.map((o) => o.province))
  ).sort();

  const filteredArrivalOffices = ALL_PARCEL_OFFICES.filter((office) => {
    const matchesCarrier =
      arrivalCarrierFilter === 'all' || office.carrier === arrivalCarrierFilter;
    const matchesRegion =
      arrivalRegionFilter === 'all' || office.region === arrivalRegionFilter;
    const matchesProvince =
      arrivalProvinceFilter === 'all' ||
      office.province.toLowerCase() === arrivalProvinceFilter.toLowerCase();
    const searchLower = arrivalOfficeSearch.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      office.name.toLowerCase().includes(searchLower) ||
      office.city.toLowerCase().includes(searchLower) ||
      office.province.toLowerCase().includes(searchLower) ||
      office.terminal.toLowerCase().includes(searchLower) ||
      office.address.toLowerCase().includes(searchLower) ||
      (office.carrier && office.carrier.toLowerCase().includes(searchLower));
    return matchesCarrier && matchesRegion && matchesProvince && matchesSearch;
  });

  const filteredOriginOffices = ALL_PARCEL_OFFICES.filter((office) => {
    const matchesCarrier =
      arrivalCarrierFilter === 'all' || office.carrier === arrivalCarrierFilter;
    const searchLower = originOfficeSearch.trim().toLowerCase();
    return (
      matchesCarrier &&
      (!searchLower ||
        office.name.toLowerCase().includes(searchLower) ||
        office.city.toLowerCase().includes(searchLower) ||
        office.province.toLowerCase().includes(searchLower) ||
        office.terminal.toLowerCase().includes(searchLower) ||
        office.address.toLowerCase().includes(searchLower) ||
        (office.carrier && office.carrier.toLowerCase().includes(searchLower)))
    );
  });

  const filteredDirectoryOffices = ALL_PARCEL_OFFICES.filter((office) => {
    const matchesCarrier =
      directoryCarrierFilter === 'all' || office.carrier === directoryCarrierFilter;
    const matchesRegion =
      directoryRegionFilter === 'all' || office.region === directoryRegionFilter;
    const matchesProvince =
      directoryProvinceFilter === 'all' ||
      office.province.toLowerCase() === directoryProvinceFilter.toLowerCase();
    const searchLower = directorySearch.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      office.name.toLowerCase().includes(searchLower) ||
      office.city.toLowerCase().includes(searchLower) ||
      office.province.toLowerCase().includes(searchLower) ||
      office.terminal.toLowerCase().includes(searchLower) ||
      office.address.toLowerCase().includes(searchLower) ||
      (office.carrier && office.carrier.toLowerCase().includes(searchLower));
    return matchesCarrier && matchesRegion && matchesProvince && matchesSearch;
  });

  const handleSelectArrivalOffice = (officeId: string) => {
    setSelectedArrivalOfficeId(officeId);
    const office = ALL_PARCEL_OFFICES.find((o) => o.id === officeId);
    if (office) {
      setDestProvince(office.province);
      onSelectDestination(office.coords);
    }
  };

  const handleSelectOriginOffice = (officeId: string) => {
    setSelectedOriginOfficeId(officeId);
    const office = ALL_PARCEL_OFFICES.find((o) => o.id === officeId);
    if (office) {
      setOriginProvince(office.province);
      onSelectOrigin(office.coords);
    }
  };

  const handleDestProvinceChange = (newProvince: string) => {
    setDestProvince(newProvince);
    setArrivalProvinceFilter(newProvince);
    const officeInProvince = ALL_PARCEL_OFFICES.find(
      (o) => o.province.toLowerCase() === newProvince.toLowerCase()
    );
    if (officeInProvince) {
      setSelectedArrivalOfficeId(officeInProvince.id);
      onSelectDestination(officeInProvince.coords);
    } else {
      const p = ECUADOR_PROVINCES.find((item) => item.name === newProvince);
      if (p) onSelectDestination(p.coords);
    }
  };

  const handleOriginProvinceChange = (newProvince: string) => {
    setOriginProvince(newProvince);
    const officeInProvince = ALL_PARCEL_OFFICES.find(
      (o) => o.province.toLowerCase() === newProvince.toLowerCase()
    );
    if (officeInProvince) {
      setSelectedOriginOfficeId(officeInProvince.id);
      if (originDispatchType === 'oficina') {
        onSelectOrigin(officeInProvince.coords);
      }
    } else {
      const p = ECUADOR_PROVINCES.find((item) => item.name === newProvince);
      if (p && originDispatchType === 'oficina') {
        onSelectOrigin(p.coords);
      }
    }
  };

  const calculateInterprovincialDistance = () => {
    if (originProvince === destProvince) return 35;
    if (
      (originProvince === 'Pichincha' && destProvince === 'Guayas') ||
      (originProvince === 'Guayas' && destProvince === 'Pichincha')
    )
      return 425;
    if (
      (originProvince === 'Pichincha' && destProvince === 'Azuay') ||
      (originProvince === 'Azuay' && destProvince === 'Pichincha')
    )
      return 460;
    if (
      (originProvince === 'Pichincha' && destProvince === 'Tungurahua') ||
      (originProvince === 'Tungurahua' && destProvince === 'Pichincha')
    )
      return 138;
    return 210;
  };

  const distanceKm = isInterprovincial
    ? calculateInterprovincialDistance()
    : destination
    ? calculateDistanceKm(origin, destination)
    : 4.8;

  const estimatedMinutes = isInterprovincial
    ? Math.round(distanceKm * 0.9)
    : estimateDurationMinutes(distanceKm);

  // Base pricing
  const baseSuggestedPrice = isInterprovincial
    ? Math.max(8.0, Number((distanceKm * 0.045 + weightKg * 0.75 + 6.0).toFixed(2)))
    : calculateSuggestedPrice(distanceKm, 'encomienda', 'moto', systemTariffs) +
      (weightKg > 5 ? (systemTariffs?.parcelExtraKgFeeUsd ?? 1.0) : 0);

  const [offeredPrice, setOfferedPrice] = useState<number>(() =>
    selectedTulcanazaTariff.clientPaysDriverUsd
  );

  // Update offered price whenever scope or weight changes significantly
  const handleScopeChange = (newScope: 'urbano' | 'interprovincial') => {
    setScope(newScope);
    if (newScope === 'interprovincial') {
      const pDest = ECUADOR_PROVINCES.find((p) => p.name === destProvince);
      if (pDest) {
        onSelectDestination(pDest.coords);
      }
      setOfferedPrice(18.5);
    } else {
      setOfferedPrice(3.0);
    }
  };

  const handleAdjustPrice = (delta: number) => {
    setOfferedPrice((prev) => {
      const newPrice = Number((prev + delta).toFixed(2));
      // Price cannot be lower than $1.00 absolute
      // Price cannot be lower than (baseSuggestedPrice - 1.00)
      const minAllowed = Math.max(1.0, baseSuggestedPrice - 1.00);
      return Math.max(minAllowed, newPrice);
    });
  };

  const handleSelectTulcanazaTariff = (item: TulcanazaParcelTariffItem) => {
    setSelectedTulcanazaTariff(item);
    setWeightKg(item.weightApproxKg);
    setOfferedPrice(item.clientPaysDriverUsd);
    if (item.category === 'sobre_manila') {
      setParcelSize('documento');
      setDescription((prev) => (prev ? prev : 'Sobre de manila con documentos oficiales'));
    } else if (item.category === 'quintal_papa') {
      setParcelSize('carga');
      setDescription((prev) => (prev ? prev : 'Quintal de papa tradicional (100 lb / ~45 kg)'));
    } else if (item.category === 'kg_2') {
      setParcelSize('pequeno');
      setDescription((prev) => (prev ? prev : 'Paquete 2 kg'));
    } else if (item.category === 'kg_5' || item.category === 'kg_10') {
      setParcelSize('mediano');
      setDescription((prev) => (prev ? prev : `Paquete encomienda ${item.badge}`));
    } else if (item.category === 'kg_20') {
      setParcelSize('grande');
      setDescription((prev) => (prev ? prev : 'Bulto grande 20 kg'));
    } else if (item.category === 'kg_35') {
      setParcelSize('carga');
      setDescription((prev) => (prev ? prev : 'Carga pesada 35 kg'));
    }
  };

  const handleAddSamplePhoto = () => {
    const unused = SAMPLE_PACKAGE_PHOTOS.find((p) => !photos.includes(p));
    if (unused) {
      setPhotos((prev) => [...prev, unused]);
    } else {
      setPhotos((prev) => [...prev, SAMPLE_PACKAGE_PHOTOS[0]]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            setPhotos((prev) => [...prev, uploadEvent.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const buildParcelDetails = (): ParcelDetails => ({
    scope,
    carrier: isInterprovincial ? (selectedArrivalOffice.carrier || 'San Cristóbal') : undefined,
    originProvince: isInterprovincial ? originProvince : undefined,
    destinationProvince: isInterprovincial ? destProvince : undefined,
    arrivalOffice: isInterprovincial ? selectedArrivalOffice : undefined,
    originOffice: originDispatchType === 'oficina' ? selectedOriginOffice : undefined,
    pickupReference: originDispatchType === 'oficina'
      ? `Depósito en ventanilla ${selectedOriginOffice.carrier || 'San Cristóbal'} - ${selectedOriginOffice.name} (${selectedOriginOffice.terminal})`
      : pickupReference,
    dropoffReference: isInterprovincial
      ? `Retiro en Ventanilla de Encomiendas ${selectedArrivalOffice.carrier || 'San Cristóbal'}: ${selectedArrivalOffice.terminal} (${selectedArrivalOffice.address})`
      : dropoffReference,
    size: parcelSize,
    weightKg,
    packageCount: Math.max(1, packageCount),
    paymentTiming,
    deliveryCityOrStop: deliveryCityOrStop.trim() || (isInterprovincial ? (selectedArrivalOffice?.name || destCanton) : (destination?.address || 'Entrega a Domicilio')),
    description: description.trim() || 'Paquete express',
    isFragile,
    hasDeclaredValue,
    declaredValueUsd: hasDeclaredValue ? Number(declaredValueUsd) : 0,
    hasInvoiceAttached: hasDeclaredValue ? hasInvoiceAttached : false,
    invoiceNumber: hasDeclaredValue && invoiceNumber ? invoiceNumber.trim() : undefined,
    driverCommercialInspection: hasDeclaredValue && hasInvoiceAttached ? 'factura_verificada' : 'sin_factura_ndv',
    commercialDisclaimerNote: hasDeclaredValue && hasInvoiceAttached
      ? undefined
      : 'S/F - NDV (Sin Factura - No Declara Valor): Transporte bajo responsabilidad del remitente por falta de comprobante de venta.',
    driverQuotedPriceUsd: 0,
    quotationStatus: 'esperando_cotizacion',
    senderName: senderName.trim() || 'Remitente',
    senderCedula: senderCedula.trim() || '1710000001',
    senderPhone: senderPhone.trim() || '+593 99 000 0000',
    receiverName: receiverName.trim() || 'Destinatario',
    receiverCedula: receiverCedula.trim() || undefined,
    receiverPhone: receiverPhone.trim() || '+593 99 123 4567',
    deliveryPin: undefined, // Encomiendas se entregan exclusivamente con Cédula (dentro de la ciudad y entre provincias)
    photoUrls: photos,
    officeName: TULCANAZA_OFFICE_DETAILS.name,
    driverOfficeFeeUsd: selectedTulcanazaTariff.driverPaysOfficeUsd,
    driverProfitUsd: selectedTulcanazaTariff.driverProfitUsd,
    tulcanazaTariffCategory: selectedTulcanazaTariff.category,
  });

  const handleProceed = () => {
    if (!destination && !isInterprovincial) {
      alert('Por favor selecciona la dirección exacta de entrega en el mapa.');
      return;
    }
    if (!receiverCedula.trim()) {
      alert('La entrega de encomiendas se realiza ÚNICAMENTE con Cédula de Identidad (tanto dentro de la ciudad como entre provincias). Por favor ingresa la cédula del destinatario.');
      return;
    }
    if (receiverCedula.trim().length < 10) {
      alert('La Cédula de Identidad ecuatoriana debe tener 10 dígitos.');
      return;
    }
    if (!description.trim()) {
      alert('Por favor describe brevemente qué contiene el paquete.');
      return;
    }

    if (!currentUser) {
      haptic.warning();
      setShowDemoBlockModal(true);
      return;
    }

    onConfirmParcel({
      parcelDetails: buildParcelDetails(),
      distanceKm,
      estimatedMinutes,
      offeredPrice: 0,
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* AVISO MODO DEMO / VISUALIZACIÓN */}
      {!currentUser && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <strong className="text-amber-400 font-black block text-xs uppercase tracking-wider">
                Modo Demo (Solo Visualización)
              </strong>
              <span className="text-zinc-300 text-[11px] leading-tight block mt-0.5">
                Puedes cotizar encomiendas y consultar oficinas aliadas. Para solicitar el despacho debes registrarte.
              </span>
            </div>
          </div>
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shrink-0 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Registrarme
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => window.history.back()}
        className={`self-start text-xs flex items-center gap-1 mb-2 px-2 transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
      >
        <X className="w-3 h-3" />
        Volver
      </button>

      {/* 1. Scope Selector: Modelo Oficial de Despacho en Oficinas Autorizadas */}
      <div className={`border p-3.5 rounded-2xl shadow-xl flex flex-col gap-2.5 ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Building2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Despacho en Oficinas Autorizadas
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            Conductor Entrega en Oficina
          </span>
        </div>

        {/* Banner Informativo del Modelo Operativo */}
        <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
          isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300' : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <span className="text-base flex-shrink-0">🏢</span>
          <p className="text-[11px] leading-snug">
            <strong>Modelo Oficial AndesMovi:</strong> El conductor retira la encomienda en tu domicilio y la deposita de inmediato en la <strong>Oficina Tulcanaza (Avenida Centenario)</strong> o ventanilla de la cooperativa. El destinatario la retira en la oficina de destino con su cédula.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleScopeChange('interprovincial')}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              scope === 'interprovincial'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/40' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-400'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Entre Provincias (Oficinas)</span>
          </button>

          <button
            type="button"
            onClick={() => handleScopeChange('urbano')}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              scope === 'urbano'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/40' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-400'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dentro de la Ciudad (Local)</span>
          </button>
        </div>

        {/* Interprovincial Province Dropdowns */}
        {isInterprovincial && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
            {/* Origen */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Provincia Origen</label>
              <select
                value={originProvince}
                onChange={(e) => {
                  setOriginProvince(e.target.value);
                  setOriginCanton(ECUADOR_GEOGRAPHY.find(p => p.province === e.target.value)?.cantons[0] || '');
                }}
                className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none font-medium ${
                  isDark ? 'bg-zinc-950 border-zinc-700/80 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                }`}
              >
                {ECUADOR_GEOGRAPHY.map((p) => (
                  <option key={p.province} value={p.province}>{p.province}</option>
                ))}
              </select>
              <select
                value={originCanton}
                onChange={(e) => setOriginCanton(e.target.value)}
                className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none font-medium ${
                  isDark ? 'bg-zinc-950 border-zinc-700/80 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                }`}
              >
                {originCantons.map((c, idx) => (
                  <option key={`${c}-${idx}`} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Destino */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Provincia Destino</label>
              <select
                value={destProvince}
                onChange={(e) => {
                  setDestProvince(e.target.value);
                  setDestCanton(ECUADOR_GEOGRAPHY.find(p => p.province === e.target.value)?.cantons[0] || '');
                }}
                className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none font-medium ${
                  isDark ? 'bg-zinc-950 border-zinc-700/80 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                }`}
              >
                {ECUADOR_GEOGRAPHY.map((p) => (
                  <option key={p.province} value={p.province}>{p.province}</option>
                ))}
              </select>
              <select
                value={destCanton}
                onChange={(e) => setDestCanton(e.target.value)}
                className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none font-medium ${
                  isDark ? 'bg-zinc-950 border-zinc-700/80 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                }`}
              >
                {destCantons.map((c, idx) => (
                  <option key={`${c}-${idx}`} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 2. Origen del Paquete y Datos de Quien Envía (Remitente) */}
      <div className={`border p-4 rounded-2xl shadow-xl flex flex-col gap-3 ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center justify-between pb-1 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Package className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Punto de Origen y Datos del Remitente
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'}`}>
            Remitente
          </span>
        </div>

        {/* Sender Personal Information (Nombres y Cédula) */}
        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <User className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Datos Personales del Remitente (Quien Envía)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className={`flex items-center gap-2 border p-2 rounded-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <User className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nombres completos remitente"
                className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
            <div className={`flex items-center gap-2 border p-2 rounded-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <CreditCard className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <input
                type="text"
                maxLength={10}
                value={senderCedula}
                onChange={(e) => setSenderCedula(e.target.value.replace(/\D/g, ''))}
                placeholder="Cédula de Identidad (10 dígitos)"
                className={`w-full bg-transparent text-xs font-mono focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
            <div className={`flex items-center gap-2 border p-2 rounded-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="Teléfono / Celular (+593)"
                className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
          </div>
        </div>

        {/* Origin Dispatch Type Tabs: Domicilio vs Oficina San Cristóbal */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOriginDispatchType('domicilio')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              originDispatchType === 'domicilio'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Recogida en Domicilio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginDispatchType('oficina');
              handleSelectOriginOffice(selectedOriginOfficeId);
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              originDispatchType === 'oficina'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Oficina San Cristóbal Origen</span>
          </button>
        </div>

        {/* Conditional Origin View */}
        {originDispatchType === 'domicilio' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 pt-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Dirección de Recogida en Domicilio
                </span>
                <input
                  type="text"
                  value={origin.name || origin.address || ''}
                  onChange={(e) =>
                    onSelectOrigin({ ...origin, name: e.target.value, address: e.target.value })
                  }
                  className={`w-full bg-transparent text-sm font-semibold focus:outline-none truncate ${isDark ? 'text-white' : 'text-slate-900'}`}
                  placeholder="Calle principal, número de casa, barrio..."
                />
              </div>
              <button
                type="button"
                onClick={() => onRequestPickOnMap('origin')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                <Navigation className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>

            <input
              type="text"
              value={pickupReference}
              onChange={(e) => setPickupReference(e.target.value)}
              placeholder="Referencia de recogida (ej. Casa blanca de 2 pisos, timbre 3, garita 1)"
              className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
              }`}
            />
          </div>
        ) : (
          <div className={`p-3 border rounded-xl flex flex-col gap-2 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <label className={`text-[10px] font-bold block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Oficina de Despacho (Origen):
              </label>
              <button
                type="button"
                onClick={() => {
                  setDirectoryProvinceFilter(originProvince || 'all');
                  setShowOfficeDirectoryModal(true);
                }}
                className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                  isDark 
                    ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}
              >
                <Search className="w-3 h-3" />
                <span>Ver Directorio ({ALL_PARCEL_OFFICES.length} Agencias)</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={originOfficeSearch}
                onChange={(e) => setOriginOfficeSearch(e.target.value)}
                placeholder="Filtrar por cooperativa, ciudad, terminal, provincia..."
                className={`w-full border text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none placeholder:text-zinc-500 transition-colors ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-600'
                }`}
              />
            </div>

            <select
              value={selectedOriginOfficeId}
              onChange={(e) => handleSelectOriginOffice(e.target.value)}
              className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none font-semibold transition-colors ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-600'
              }`}
            >
              {filteredOriginOffices.map((office) => (
                <option key={office.id} value={office.id}>
                  [{office.carrier || 'San Cristóbal'}] {office.name} — {office.city} ({office.province}) • {office.terminal}
                </option>
              ))}
            </select>
            <div className={`p-2.5 rounded-lg text-xs flex flex-col gap-1 border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{selectedOriginOffice.terminal}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  selectedOriginOffice.carrier === 'Pullman Carchi'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : selectedOriginOffice.carrier === 'Cita Express'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {selectedOriginOffice.carrier || 'San Cristóbal'}
                </span>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{selectedOriginOffice.address}</span>
              <span className={`text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Horario: {selectedOriginOffice.schedule}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Datos del Destinatario y Punto de Llegada (Oficinas Autorizadas) */}
      <div className={`border p-4 rounded-2xl shadow-xl flex flex-col gap-3 ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center justify-between pb-1 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Building2 className={`w-4 h-4 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
            {isInterprovincial
              ? 'Punto de Llegada Nacional (Oficinas Autorizadas)'
              : 'Datos del Destinatario y Entrega'}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? 'text-rose-400 bg-rose-500/10' : 'text-rose-700 bg-rose-50'}`}>
            {isInterprovincial ? 'Red de Encomiendas' : 'Destinatario'}
          </span>
        </div>

        {/* Banner Cooperativas Autorizadas */}
        {isInterprovincial && (
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDark 
              ? 'bg-gradient-to-r from-rose-950/40 via-zinc-900 to-emerald-950/30 border-zinc-750' 
              : 'bg-gradient-to-r from-rose-50 via-white to-emerald-50 border-slate-200'
          }`}>
            <ShieldCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
            <div className="text-xs flex flex-col gap-1 w-full">
              <span className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>
                Red Oficial de Encomiendas Interprovinciales
              </span>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                Selecciona la cooperativa de transporte para el retiro de tu encomienda en ventanilla de terminal o agencia autorizada:
              </p>
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                  🚌 {ALL_PARCEL_OFFICES.length} Agencias Nacionales Integradas (10 Cooperativas Aliadas)
                </span>
                {onOpenAlliedCooperatives && (
                  <button
                    type="button"
                    onClick={() => onOpenAlliedCooperatives()}
                    className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all cursor-pointer shadow-sm flex items-center gap-1 ml-auto"
                  >
                    <span>📋 Ver Cooperativas Aliadas (10)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selector de Oficina de Llegada */}
        {isInterprovincial ? (
          <div className={`p-3 border rounded-xl flex flex-col gap-2.5 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Oficina de Llegada para Retiro:
              </label>
              <button
                type="button"
                onClick={() => {
                  setDirectoryCarrierFilter(arrivalCarrierFilter);
                  setDirectoryProvinceFilter(destProvince || 'all');
                  setShowOfficeDirectoryModal(true);
                }}
                className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all ${
                  isDark 
                    ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10 border-rose-500/20' 
                    : 'text-rose-700 hover:text-rose-800 bg-rose-50 border-rose-200'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Directorio Completo ({ALL_PARCEL_OFFICES.length} Agencias)</span>
              </button>
            </div>

            {/* Selector de Cooperativa de Envíos (Menú Desplegable / Barra Única) */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                1. Selecciona la Cooperativa de Envíos:
              </label>
              <div className="relative w-full">
                <select
                  value={arrivalCarrierFilter}
                  onChange={(e) => setArrivalCarrierFilter(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none appearance-none cursor-pointer pr-10 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white focus:border-blue-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 shadow-sm'
                  }`}
                >
                  <option value="all">⭐ Todas las Cooperativas Aliadas ({ALL_PARCEL_OFFICES.length} Agencias)</option>
                  {Object.entries(CARRIERS_CONFIG).map(([carrierKey, config]) => {
                    const count = ALL_PARCEL_OFFICES.filter((o) => o.carrier === carrierKey).length;
                    return (
                      <option key={carrierKey} value={carrierKey}>
                        {config.icon} {config.name} ({count} Agencias)
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Dynamic Carrier Info Banner for Selected Cooperative */}
            {arrivalCarrierFilter !== 'all' && CARRIERS_CONFIG[arrivalCarrierFilter] && (
              <div className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition-all animate-fadeIn ${
                isDark ? 'bg-blue-950/40 border-blue-500/40 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-900'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-xs sm:text-sm flex items-center gap-1.5 text-blue-300">
                    <span>{CARRIERS_CONFIG[arrivalCarrierFilter].icon}</span>
                    <span>{CARRIERS_CONFIG[arrivalCarrierFilter].name}</span>
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-400/30 flex-shrink-0">
                    {ALL_PARCEL_OFFICES.filter((o) => o.carrier === arrivalCarrierFilter).length} Agencias Disponibles
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-tight text-blue-200/90 font-medium">
                  {CARRIERS_CONFIG[arrivalCarrierFilter].tagline}
                </p>
              </div>
            )}

            {/* Selector de Región y Provincia (Paso 2) */}
            <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800/50">
              <div className="flex items-center justify-between">
                <label className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  2. Filtra por Provincia o Región de Destino:
                </label>
                {arrivalProvinceFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setArrivalProvinceFilter('all')}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                  >
                    <span>Ver todas las provincias</span>
                  </button>
                )}
              </div>

              {/* Fast Selector Pills for Top Destination Provinces */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => {
                    setArrivalProvinceFilter('all');
                    setArrivalRegionFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    arrivalProvinceFilter === 'all' && arrivalRegionFilter === 'all'
                      ? isDark ? 'bg-blue-600 text-white shadow-md font-black' : 'bg-blue-600 text-white shadow-md font-black'
                      : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  <span>📌 Todas ({ALL_PARCEL_OFFICES.filter((o) => arrivalCarrierFilter === 'all' || o.carrier === arrivalCarrierFilter).length})</span>
                </button>

                {uniqueProvincesWithOffices.map((prov) => {
                  const count = ALL_PARCEL_OFFICES.filter(
                    (o) =>
                      o.province.toLowerCase() === prov.toLowerCase() &&
                      (arrivalCarrierFilter === 'all' || o.carrier === arrivalCarrierFilter)
                  ).length;
                  if (count === 0) return null;
                  const isSel = arrivalProvinceFilter.toLowerCase() === prov.toLowerCase();

                  return (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => {
                        setArrivalProvinceFilter(prov);
                        // find region for this province
                        const match = ALL_PARCEL_OFFICES.find((o) => o.province.toLowerCase() === prov.toLowerCase());
                        if (match) setArrivalRegionFilter(match.region);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer border ${
                        isSel
                          ? isDark ? 'bg-emerald-600 text-white border-emerald-400 shadow-md font-black' : 'bg-emerald-600 text-white border-emerald-500 shadow-md font-black'
                          : isDark ? 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span>📍 {prov}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSel ? 'bg-emerald-800/80 text-emerald-100' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Region Pills + Search Bar + Province Select Menu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className={`text-[10px] font-bold uppercase whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Provincia:</span>
                  <select
                    value={arrivalProvinceFilter}
                    onChange={(e) => {
                      setArrivalProvinceFilter(e.target.value);
                      if (e.target.value !== 'all') {
                        const match = ALL_PARCEL_OFFICES.find((o) => o.province.toLowerCase() === e.target.value.toLowerCase());
                        if (match) setArrivalRegionFilter(match.region);
                      }
                    }}
                    className={`w-full bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    <option value="all" className={isDark ? 'bg-zinc-900' : 'bg-white text-slate-900'}>
                      🌐 Mostrar todas las provincias ({uniqueProvincesWithOffices.length})
                    </option>
                    {uniqueProvincesWithOffices.map((prov) => {
                      const count = ALL_PARCEL_OFFICES.filter(
                        (o) =>
                          o.province.toLowerCase() === prov.toLowerCase() &&
                          (arrivalCarrierFilter === 'all' || o.carrier === arrivalCarrierFilter)
                      ).length;
                      return (
                        <option key={prov} value={prov} className={isDark ? 'bg-zinc-900' : 'bg-white text-slate-900'}>
                          📍 Provincia: {prov} ({count} Agencias)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className={`relative flex items-center border rounded-xl px-3 py-1.5 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <Search className="w-4 h-4 text-zinc-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={arrivalOfficeSearch}
                    onChange={(e) => setArrivalOfficeSearch(e.target.value)}
                    placeholder="Buscar por agencia, ciudad o calle..."
                    className={`w-full bg-transparent text-xs focus:outline-none placeholder:text-zinc-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
                  />
                  {arrivalOfficeSearch && (
                    <button
                      type="button"
                      onClick={() => setArrivalOfficeSearch('')}
                      className={`${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Region Selector Pills (Costa, Sierra, Oriente) */}
            <div className="flex items-center gap-1.5 text-xs pt-1">
              <span className={`text-[10px] uppercase font-bold mr-1 flex-shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Regiones:</span>
              <button
                type="button"
                onClick={() => {
                  setArrivalRegionFilter('all');
                  setArrivalProvinceFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                  arrivalRegionFilter === 'all' && arrivalProvinceFilter === 'all'
                    ? isDark ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-600 text-white shadow-sm'
                    : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200 shadow-sm'
                }`}
              >
                Todas las regiones
              </button>
              <button
                type="button"
                onClick={() => {
                  setArrivalRegionFilter('Costa');
                  setArrivalProvinceFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                  arrivalRegionFilter === 'Costa'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200 shadow-sm'
                }`}
              >
                Costa ({ALL_PARCEL_OFFICES.filter((o) => o.region === 'Costa' && (arrivalCarrierFilter === 'all' || o.carrier === arrivalCarrierFilter)).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setArrivalRegionFilter('Sierra');
                  setArrivalProvinceFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                  arrivalRegionFilter === 'Sierra'
                    ? isDark ? 'bg-sky-500 text-white shadow-sm font-black' : 'bg-sky-600 text-white shadow-sm font-black'
                    : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200 shadow-sm'
                }`}
              >
                Sierra ({ALL_PARCEL_OFFICES.filter((o) => o.region === 'Sierra' && (arrivalCarrierFilter === 'all' || o.carrier === arrivalCarrierFilter)).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setArrivalRegionFilter('Oriente');
                  setArrivalProvinceFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                  arrivalRegionFilter === 'Oriente'
                    ? isDark ? 'bg-emerald-500 text-zinc-950 shadow-sm font-black' : 'bg-emerald-600 text-white shadow-sm font-black'
                    : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200 shadow-sm'
                }`}
              >
                Oriente ({ALL_PARCEL_OFFICES.filter((o) => o.region === 'Oriente' && (arrivalCarrierFilter === 'all' || o.carrier === arrivalCarrierFilter)).length})
              </button>
            </div>

            <div className={`flex items-center justify-between text-[11px] px-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span>
                Agencias disponibles:{' '}
                <strong className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{filteredArrivalOffices.length}</strong>
              </span>
              {(arrivalProvinceFilter !== 'all' || arrivalRegionFilter !== 'all' || arrivalCarrierFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setArrivalCarrierFilter('all');
                    setArrivalProvinceFilter('all');
                    setArrivalRegionFilter('all');
                  }}
                  className={`text-[10px] hover:underline ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
                >
                  Restablecer filtros ({ALL_PARCEL_OFFICES.length})
                </button>
              )}
            </div>

            <select
              value={selectedArrivalOfficeId}
              onChange={(e) => handleSelectArrivalOffice(e.target.value)}
              className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none font-semibold transition-colors ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-700 text-white focus:border-rose-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-rose-600'
              }`}
            >
              {filteredArrivalOffices.map((office) => (
                <option key={office.id} value={office.id} className={isDark ? 'bg-zinc-900' : 'bg-white text-slate-900'}>
                  [{office.carrier || 'San Cristóbal'}] {office.name} — {office.city} ({office.province}) • {office.terminal}
                </option>
              ))}
            </select>

            {/* Selected Arrival Office Full Details Card */}
            <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Building2 className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                  {selectedArrivalOffice.name}
                </span>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    selectedArrivalOffice.carrier === 'Pullman Carchi'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : selectedArrivalOffice.carrier === 'Cita Express'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {selectedArrivalOffice.carrier || 'San Cristóbal'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {selectedArrivalOffice.city}, {selectedArrivalOffice.province}
                  </span>
                </div>
              </div>

              <div className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                <MapPin className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                <span>{selectedArrivalOffice.terminal} • {selectedArrivalOffice.address}</span>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1 border-t ${isDark ? 'text-zinc-400 border-zinc-800' : 'text-slate-500 border-slate-100'}`}>
                <div>
                  <strong className={isDark ? 'text-zinc-300' : 'text-slate-700'}>Horario:</strong> {selectedArrivalOffice.schedule}
                </div>
                <div>
                  <strong className={isDark ? 'text-zinc-300' : 'text-slate-700'}>Teléfono:</strong> {selectedArrivalOffice.phone}
                </div>
              </div>

              <div className={`text-[10px] p-2 rounded-lg border mt-1 ${isDark ? 'text-amber-300/90 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                ℹ️ <strong>Requisitos de Retiro (Sin Código):</strong> El destinatario deberá presentarse en ventanilla de encomiendas de <strong>{selectedArrivalOffice.carrier || 'San Cristóbal'}</strong> únicamente con su <strong>Cédula de Identidad original</strong>. En envíos entre provincias <strong>no se requiere código PIN</strong>.
              </div>
            </div>
          </div>
        ) : (
          /* Urban dropoff address */
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Dirección Exacta de Entrega en Domicilio
                </span>
                <input
                  type="text"
                  value={destination ? destination.name || destination.address || '' : ''}
                  onChange={(e) =>
                    onSelectDestination({
                      lat: destination?.lat || -0.1807,
                      lng: destination?.lng || -78.4678,
                      name: e.target.value,
                      address: e.target.value,
                    })
                  }
                  className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none truncate"
                  placeholder="¿Dónde entregamos la encomienda?"
                />
              </div>
              <button
                type="button"
                onClick={() => onRequestPickOnMap('destination')}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>

            <input
              type="text"
              value={dropoffReference}
              onChange={(e) => setDropoffReference(e.target.value)}
              placeholder="Referencia de entrega (ej. Conjunto Los Cipreses, casa 12)"
              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Recipient Personal Information (Quien Retira en Ventanilla o Recibe) */}
        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <User className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              Datos del Destinatario (Persona Autorizada para Recibir)
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              Cédula Requerida
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className={`flex items-center gap-2 border p-2 rounded-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <User className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Nombres destinatario"
                className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
            <div className={`flex items-center gap-2 border p-2 rounded-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <CreditCard className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              <input
                type="text"
                maxLength={10}
                value={receiverCedula}
                onChange={(e) => setReceiverCedula(e.target.value.replace(/\D/g, ''))}
                placeholder="Cédula destinatario (10 dígitos) *"
                className={`w-full bg-transparent text-xs font-mono focus:outline-none placeholder:text-zinc-500 ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
            <div className={`flex items-center gap-2 border p-2 rounded-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="Celular / WhatsApp (+593)"
                className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
            </div>
          </div>

          {/* Ciudad / Parada de entrega */}
          <div className={`flex items-center gap-2 border p-2 rounded-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <input
              type="text"
              id="input-delivery-city-stop"
              value={deliveryCityOrStop}
              onChange={(e) => setDeliveryCityOrStop(e.target.value)}
              placeholder="Ciudad / Parada o Dirección de entrega (ej. Terminal Carcelén Quito, Centro Tulcán, etc.)"
              className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
            />
          </div>

          <div className={`text-[10px] p-2 rounded-lg border flex items-center gap-1.5 ${isDark ? 'text-zinc-400 bg-zinc-900/60 border-zinc-800' : 'text-slate-500 bg-white border-slate-200'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>
              <strong>Entrega Segura:</strong> Tanto dentro de la ciudad como entre provincias, la encomienda se entregará <strong>únicamente previa presentación física o digital de la Cédula</strong> de identidad de la persona registrada. Sin código PIN.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tamaño y Peso del Paquete */}
      <div className={`border p-4 rounded-2xl shadow-xl flex flex-col gap-3 ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tamaño y Peso del Paquete</span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50'}`}>
            {weightKg} kg
          </span>
        </div>

        {/* Size Category Chips */}
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectTulcanazaTariff(TULCANAZA_PARCEL_TARIFFS[0])} // Sobre de Manila
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center ${
              selectedTulcanazaTariff.category === 'sobre_manila'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Doc</span>
            <span className="text-[8px] opacity-70">&lt;1 kg</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTulcanazaTariff(TULCANAZA_PARCEL_TARIFFS[1])} // 2kg
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center ${
              selectedTulcanazaTariff.category === 'kg_2'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Pequeño</span>
            <span className="text-[8px] opacity-70">1-5 kg</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTulcanazaTariff(TULCANAZA_PARCEL_TARIFFS[2])} // 5kg
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center ${
              selectedTulcanazaTariff.category === 'kg_5'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Box className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <span className="text-[10px] font-bold">Mediano</span>
            <span className="text-[8px] opacity-70">5-15 kg</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTulcanazaTariff(TULCANAZA_PARCEL_TARIFFS[4])} // 20kg
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center ${
              selectedTulcanazaTariff.category === 'kg_20'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Box className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
            <span className="text-[10px] font-bold">Grande</span>
            <span className="text-[8px] opacity-70">15-30 kg</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTulcanazaTariff(TULCANAZA_PARCEL_TARIFFS[5])} // 35kg
            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-center ${
              selectedTulcanazaTariff.category === 'kg_35'
                ? isDark ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                : isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Truck className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span className="text-[10px] font-bold">Carga</span>
            <span className="text-[8px] opacity-70">&gt;30 kg</span>
          </button>
        </div>

        {/* Weight Quick Adjust Buttons */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Peso aproximado:</span>
          <div className="flex items-center gap-1.5">
            {[0.5, 2, 5, 10, 20, 35].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeightKg(w)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  weightKg === w
                    ? isDark ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-white text-slate-500 hover:text-slate-700 border-slate-200 shadow-sm'
                }`}
              >
                {w} kg
              </button>
            ))}
          </div>
        </div>

        {/* Número de Bultos */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
          <div>
            <span className={`text-xs font-bold block ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
              Número de bultos:
            </span>
            <span className="text-[10px] text-zinc-400">Cantidad de paquetes / cajas</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setPackageCount(cnt)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all border ${
                  packageCount === cnt
                    ? isDark ? 'bg-emerald-500 text-zinc-950 border-emerald-500' : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {cnt}
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="99"
              value={packageCount}
              onChange={(e) => setPackageCount(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-10 h-7 text-center text-xs font-mono font-bold rounded-lg border focus:outline-none ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Description & Fragile flag */}
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Qué contiene el paquete? (ej. Ropa, repuesto mecánico, documentos, artesanía...)"
            className={`w-full border text-xs p-2.5 rounded-xl focus:outline-none transition-colors ${
              isDark 
                ? 'bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
            }`}
          />

          <label className={`flex items-center gap-2 text-xs cursor-pointer select-none p-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            <input
              type="checkbox"
              checked={isFragile}
              onChange={(e) => setIsFragile(e.target.checked)}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className={`flex items-center gap-1 font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
              <AlertTriangle className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              Contenido frágil (manejo cuidadoso y embalaje acolchado)
            </span>
          </label>

          {/* Declaración de Valor Comercial & Factura (Regla S/F y NDV) */}
          <div className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-colors ${
            hasDeclaredValue
              ? isDark ? 'bg-amber-950/20 border-amber-500/40' : 'bg-amber-50 border-amber-300'
              : isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-has-declared-value"
                  checked={hasDeclaredValue}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasDeclaredValue(checked);
                    if (!checked) {
                      setHasInvoiceAttached(false);
                      setInvoiceNumber('');
                    }
                  }}
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className={`text-xs font-black flex items-center gap-1.5 ${
                  hasDeclaredValue
                    ? 'text-amber-400'
                    : isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}>
                  <span>💰</span> ¿Tiene valor declarado? (Mercadería / Equipos)
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                hasDeclaredValue
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
              }`}>
                {hasDeclaredValue ? 'Con Valor Comercial' : 'Opcional'}
              </span>
            </label>

            {hasDeclaredValue && (
              <div className="flex flex-col gap-2.5 pt-1 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Valor aproximado ($ USD) <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.50"
                        value={declaredValueUsd}
                        onChange={(e) => setDeclaredValueUsd(Math.max(0, Number(e.target.value)))}
                        placeholder="Ej: 50.00"
                        className={`w-full pl-7 pr-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none transition-colors ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-amber-300 focus:border-amber-400'
                            : 'bg-white border-amber-300 text-amber-900 focus:border-amber-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase font-bold block mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      N° Factura comercial / RUC (Opcional)
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Ej: 001-002-0001425"
                      className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition-colors ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-amber-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Aviso obligatorio en pantalla */}
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-200 font-black">
                      ⚠️ Aviso Obligatorio de Facturación:
                    </strong>
                    <span>
                      Si declara valor comercial, debe entregar la factura física o autorizada al conductor al momento de entregar el paquete. Si no la presenta, el envío se catalogará como <strong>S/F - NDV</strong> (Sin Factura - No Declara Valor).
                    </span>
                  </div>
                </div>

                {/* Checkbox de confirmación obligatorio */}
                <label className="flex items-center gap-2 cursor-pointer select-none p-1">
                  <input
                    type="checkbox"
                    id="chk-has-invoice-attached"
                    checked={hasInvoiceAttached}
                    onChange={(e) => setHasInvoiceAttached(e.target.checked)}
                    className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className={`text-xs font-black ${hasInvoiceAttached ? 'text-emerald-400' : isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Entrego factura de compra/venta adjunta.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Fotos del Paquete (Constancia del Estado) */}
      <div className={`border p-4 rounded-2xl shadow-xl flex flex-col gap-3 ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Camera className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              Fotos del Paquete
            </span>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Constancia visual del estado físico del paquete antes del retiro
            </p>
          </div>
          <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {photos.length} fotos
          </span>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-4 gap-2">
          {photos.map((url, idx) => (
            <div
              key={idx}
              className={`relative aspect-square rounded-xl overflow-hidden border group ${isDark ? 'border-zinc-700 bg-zinc-950' : 'border-slate-200 bg-slate-50'}`}
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add photo upload button */}
          <label className={`aspect-square rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            isDark 
              ? 'border-zinc-700 bg-zinc-950 hover:border-emerald-500 hover:bg-emerald-500/5 text-zinc-400 hover:text-emerald-400' 
              : 'border-slate-300 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'
          }`}>
            <Upload className="w-4 h-4" />
            <span className="text-[9px] font-bold">Subir</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 6. Protocolo de Entrega de Encomiendas: Exclusivo con Cédula (Sin PIN) */}
      <div className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-lg ${
        isDark 
          ? 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-emerald-500/40' 
          : 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-emerald-500/30'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Entrega de Encomienda: Solo con Cédula
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
                Dentro de la Ciudad y Provincias
              </span>
            </div>
            <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {isInterprovincial
                ? `Retiro en ventanilla presentando Cédula de ${receiverName || 'el destinatario'}. Sin código PIN.`
                : `Entrega urbana a domicilio únicamente con Cédula de ${receiverName || 'el destinatario'}. Sin código PIN.`}
            </span>
          </div>
        </div>
        <div className={`px-3 py-1.5 border rounded-xl text-right flex-shrink-0 ${isDark ? 'bg-zinc-950 border-emerald-500/30' : 'bg-white border-emerald-200'}`}>
          <span className={`font-mono text-xs font-bold block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {receiverCedula ? `C.I. ${receiverCedula}` : 'Solo Cédula'}
          </span>
          <span className={`text-[9px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Sin PIN</span>
        </div>
      </div>

      {/* 7. Modalidad de Pago & Cotización por el Conductor */}
      <div className={`border p-4 rounded-2xl shadow-xl flex flex-col gap-3 ${isDark ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center justify-between pb-1 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Wallet className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Modalidad de Pago del Flete
          </span>
          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Cotiza el Conductor
          </span>
        </div>

        {/* Modalidad de pago seleccionable: "Pago en origen" o "Por cobrar en destino" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            id="btn-payment-pago-origen"
            onClick={() => setPaymentTiming('pago_origen')}
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
              paymentTiming === 'pago_origen'
                ? isDark
                  ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                  : 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                : isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                  paymentTiming === 'pago_origen' ? 'border-emerald-400 bg-emerald-500 text-zinc-950 font-black' : 'border-zinc-600'
                }`}>
                  {paymentTiming === 'pago_origen' ? '✓' : ''}
                </span>
                Pago en Origen
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">Remitente</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-snug">
              El remitente cancela el valor del flete acordado al entregar el paquete físicamente al transportista.
            </p>
          </button>

          <button
            type="button"
            id="btn-payment-por-cobrar-destino"
            onClick={() => setPaymentTiming('por_cobrar_destino')}
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
              paymentTiming === 'por_cobrar_destino'
                ? isDark
                  ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/40'
                  : 'bg-sky-50 border-sky-500 text-sky-950 ring-1 ring-sky-400'
                : isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                  paymentTiming === 'por_cobrar_destino' ? 'border-sky-400 bg-sky-500 text-zinc-950 font-black' : 'border-zinc-600'
                }`}>
                  {paymentTiming === 'por_cobrar_destino' ? '✓' : ''}
                </span>
                Por Cobrar en Destino
              </span>
              <span className="text-[10px] font-mono font-bold text-sky-400">Destinatario</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-snug">
              El flete se cancela al momento de la entrega en destino (en ventanilla oficial o a domicilio).
            </p>
          </button>
        </div>

        {/* Mensaje informativo de cotización por transportista */}
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
          isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="block text-xs font-bold text-emerald-400">
              Cotización por Transportista (Tarifa Mínima: $6.00 USD):
            </strong>
            <p className="text-[11px] text-zinc-400 leading-snug">
              El cliente no ingresa precio ni paga por adelantado. El conductor cotizará el valor justo del flete (mínimo $6.00 USD) al recibir la solicitud según peso ({weightKg} kg), {packageCount} bulto(s) y trayecto acordado, y emitirá la guía oficial de remisión.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button: Solicitar Encomienda / Generar Orden */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <button
          id="btn-confirm-parcel"
          type="button"
          onClick={handleProceed}
          className={`flex-1 w-full py-4 rounded-xl font-black text-sm tracking-wide shadow-xl active:scale-98 flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 shadow-emerald-500/20 ring-1 ring-emerald-400/40' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Solicitar Encomienda / Generar Orden</span>
          <ArrowRight className="w-4 h-4" />
        </button>

          <button
            type="button"
            id="btn-preview-receipt-form"
            onClick={() => setShowReceiptModal(true)}
            className={`w-full sm:w-auto px-3.5 py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors ${
              isDark 
                ? 'bg-zinc-800 hover:bg-zinc-750 text-emerald-400 border-zinc-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-emerald-700 border-slate-200'
            }`}
            title="Vista previa e impresión de Comprobante / Guía de Encomienda"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Guía</span>
          </button>

          {onOpenSchedule && (
            <button
              type="button"
              onClick={() => {
                onOpenSchedule(buildParcelDetails(), offeredPrice);
              }}
              className={`w-full sm:w-auto px-4 py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors ${
                isDark 
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Calendar className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span>Programar</span>
            </button>
          )}
        </div>

      {/* Modal Directorio Nacional de Agencias de Encomiendas */}
      {showOfficeDirectoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-750 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    Directorio Nacional de Encomiendas
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full">
                      {ALL_PARCEL_OFFICES.length} Agencias
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    San Cristóbal Internacional ({SAN_CRISTOBAL_OFFICES.length}) • Pullman Carchi ({PULLMAN_CARCHI_OFFICES.length}) • Cita Express ({CITA_EXPRESS_OFFICES.length})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOfficeDirectoryModal(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters Bar */}
            <div className="p-3 bg-zinc-950/70 border-b border-zinc-800/80 flex flex-col gap-2.5">
              {/* Carrier Selector Pills in Modal */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
                <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 flex-shrink-0">Cooperativa:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDirectoryCarrierFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                    directoryCarrierFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  ⭐ Todas ({ALL_PARCEL_OFFICES.length})
                </button>
                {Object.entries(CARRIERS_CONFIG).map(([carrierKey, config]) => {
                  const count = ALL_PARCEL_OFFICES.filter((o) => o.carrier === carrierKey).length;
                  const isSel = directoryCarrierFilter === carrierKey;
                  return (
                    <button
                      key={carrierKey}
                      type="button"
                      onClick={() => {
                        setDirectoryCarrierFilter(carrierKey as TransportCarrier);
                      }}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1 cursor-pointer ${
                        isSel
                          ? 'bg-blue-600 text-white shadow-sm font-black ring-1 ring-blue-400'
                          : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>{config.icon}</span>
                      <span>{config.shortName} ({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Region Pills in Modal */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 flex-shrink-0">Región:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDirectoryRegionFilter('all');
                    setDirectoryProvinceFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                    directoryRegionFilter === 'all'
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Todas ({ALL_PARCEL_OFFICES.filter((o) => directoryCarrierFilter === 'all' || o.carrier === directoryCarrierFilter).length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectoryRegionFilter('Costa');
                    setDirectoryProvinceFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                    directoryRegionFilter === 'Costa'
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Costa ({ALL_PARCEL_OFFICES.filter((o) => o.region === 'Costa' && (directoryCarrierFilter === 'all' || o.carrier === directoryCarrierFilter)).length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectoryRegionFilter('Sierra');
                    setDirectoryProvinceFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                    directoryRegionFilter === 'Sierra'
                      ? 'bg-sky-500 text-white shadow-sm font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Sierra ({ALL_PARCEL_OFFICES.filter((o) => o.region === 'Sierra' && (directoryCarrierFilter === 'all' || o.carrier === directoryCarrierFilter)).length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectoryRegionFilter('Oriente');
                    setDirectoryProvinceFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                    directoryRegionFilter === 'Oriente'
                      ? 'bg-emerald-500 text-white shadow-sm font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Oriente ({ALL_PARCEL_OFFICES.filter((o) => o.region === 'Oriente' && (directoryCarrierFilter === 'all' || o.carrier === directoryCarrierFilter)).length})
                </button>
              </div>

              {/* Tulcán 3 offices callout banner */}
              {(directoryRegionFilter === 'Sierra' ||
                directoryProvinceFilter === 'Carchi' ||
                directorySearch.toLowerCase().includes('tulcan') ||
                directorySearch.toLowerCase().includes('tulcán')) && (
                <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">⭐ Sede Carchi / Tulcán:</span>
                    <span>San Cristóbal (Tulcanaza, Terminal, Centro) • Pullman Carchi</span>
                  </div>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full">
                    Carchi
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400">Provincia:</span>
                  <select
                    value={directoryProvinceFilter}
                    onChange={(e) => setDirectoryProvinceFilter(e.target.value)}
                    className="w-full bg-transparent text-xs text-white font-medium focus:outline-none"
                  >
                    <option value="all" className="bg-zinc-900">
                      {directoryRegionFilter === 'all'
                        ? `Todas las Provincias (${uniqueProvincesWithOffices.length})`
                        : `Provincias de ${directoryRegionFilter}`}
                    </option>
                    {Array.from(
                      new Set(
                        ALL_PARCEL_OFFICES.filter(
                          (o) =>
                            (directoryCarrierFilter === 'all' || o.carrier === directoryCarrierFilter) &&
                            (directoryRegionFilter === 'all' || o.region === directoryRegionFilter)
                        ).map((o) => o.province)
                      )
                    )
                      .sort()
                      .map((prov) => (
                        <option key={prov} value={prov} className="bg-zinc-900">
                          {prov} (
                          {
                            ALL_PARCEL_OFFICES.filter(
                              (o) =>
                                o.province === prov &&
                                (directoryCarrierFilter === 'all' || o.carrier === directoryCarrierFilter) &&
                                (directoryRegionFilter === 'all' || o.region === directoryRegionFilter)
                            ).length
                          }
                          )
                        </option>
                      ))}
                  </select>
                </div>

                <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                  <Search className="w-4 h-4 text-zinc-500 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Buscar por cooperativa, ciudad o dirección..."
                    className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-zinc-500"
                  />
                  {directorySearch && (
                    <button
                      type="button"
                      onClick={() => setDirectorySearch('')}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Offices List */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-zinc-800/40">
              {filteredDirectoryOffices.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs flex flex-col items-center gap-2">
                  <Building2 className="w-8 h-8 text-zinc-600" />
                  <span>No se encontraron oficinas para los filtros seleccionados</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectoryCarrierFilter('all');
                      setDirectoryProvinceFilter('all');
                      setDirectoryRegionFilter('all');
                      setDirectorySearch('');
                    }}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Restablecer búsqueda
                  </button>
                </div>
              ) : (
                filteredDirectoryOffices.map((office) => {
                  const isSelectedArrival = selectedArrivalOfficeId === office.id;
                  const isSelectedOrigin = selectedOriginOfficeId === office.id && originDispatchType === 'oficina';
                  return (
                    <div
                      key={office.id}
                      className={`pt-2.5 first:pt-0 p-3 rounded-xl transition-all border ${
                        isSelectedArrival
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : isSelectedOrigin
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-zinc-950/50 border-zinc-800/70 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-white">{office.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                office.carrier === 'Pullman Carchi'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : office.carrier === 'Cita Express'
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {office.carrier || 'San Cristóbal'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                office.region === 'Costa'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : office.region === 'Sierra'
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {office.region}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {office.city}, {office.province}
                            </span>
                            {office.city === 'Tulcán' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Sede Tulcán
                              </span>
                            )}
                            {isSelectedArrival && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Seleccionada de Llegada
                              </span>
                            )}
                            {isSelectedOrigin && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Seleccionada de Despacho
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            <span>{office.terminal} • <span className="text-zinc-400">{office.address}</span></span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 pt-0.5">
                            <div>
                              <strong className="text-zinc-300">Horario:</strong> {office.schedule}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <a
                                href={`tel:${office.phone.replace(/[^\d+]/g, '')}`}
                                className="text-emerald-400 hover:underline font-mono"
                              >
                                {office.phone}
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col gap-1.5 justify-end flex-shrink-0 pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (office.carrier) {
                                setArrivalCarrierFilter(office.carrier);
                              }
                              handleSelectArrivalOffice(office.id);
                              setShowOfficeDirectoryModal(false);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <Building2 className="w-3 h-3" />
                            <span>Elegir como Llegada</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOriginDispatchType('oficina');
                              handleSelectOriginOffice(office.id);
                              setShowOfficeDirectoryModal(false);
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Elegir como Origen</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-[11px]">
                ℹ️ Retiro de encomiendas presencial con Cédula original en ventanilla de la cooperativa seleccionada (Sin código PIN requerido entre provincias).
              </span>
              <button
                type="button"
                onClick={() => setShowOfficeDirectoryModal(false)}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comprobante Oficial de Encomienda para Imprimir */}
      {showReceiptModal && (
        <ParcelReceiptModal
          parcelDetails={buildParcelDetails()}
          price={offeredPrice}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* MODAL DE BLOQUEO DE MODO DEMO (SIN REGISTRO / SIN DATOS) */}
      {showDemoBlockModal && (
        <div className="fixed inset-0 z-[10005] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 text-left animate-scaleUp ${
              isDark ? 'bg-zinc-950 border-amber-500/60 text-white' : 'bg-white border-amber-400 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">MODO DEMO (Solo Visualización)</h3>
                <p className="text-xs text-amber-400 font-bold">Sin cuenta no puedes enviar encomiendas</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Estás en <strong>Modo Demostración</strong>. Puedes cotizar el flete de paquetes y consultar las oficinas aliadas, pero para <strong>solicitar la recolección y despacho de encomiendas</strong> debes registrarte en la aplicación.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
              ℹ️ <strong>El registro para clientes es inmediato</strong> (sin trabas de SRI ni Registro Civil).
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDemoBlockModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Seguir en Demo
              </button>
              {onOpenRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDemoBlockModal(false);
                    onOpenRegister();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer active:scale-95 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>Registrarme Gratis</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

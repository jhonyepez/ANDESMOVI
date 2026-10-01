/**
 * Validador Oficial de Placas Vehiculares de la República del Ecuador (Normativa ANT)
 * Formato estándar: 3 letras mayúsculas + 3 o 4 dígitos (Ej: PBA-4521, IAA-1092, CAA-341, GBA-8761)
 */

export interface PlateValidationResult {
  isValid: boolean;
  normalizedPlate: string;
  provinceCode: string;
  provinceName: string;
  serviceType: 'comercial_taxi' | 'publico_bus' | 'particular' | 'oficial_estado';
  serviceTypeLabel: string;
  isCommercialOrPublic: boolean;
  errorMessage?: string;
}

const ECUADOR_PROVINCES_BY_CODE: Record<string, string> = {
  A: 'Azuay',
  B: 'Bolívar',
  U: 'Cañar',
  C: 'Carchi',
  X: 'Cotopaxi',
  H: 'Chimborazo',
  O: 'El Oro',
  E: 'Esmeraldas',
  W: 'Galápagos',
  G: 'Guayas',
  I: 'Imbabura',
  L: 'Loja',
  R: 'Los Ríos',
  M: 'Manabí',
  V: 'Morona Santiago',
  N: 'Napo',
  S: 'Pastaza',
  P: 'Pichincha',
  Y: 'Santa Elena',
  J: 'Santo Domingo de los Tsáchilas',
  K: 'Sucumbíos',
  Q: 'Orellana',
  T: 'Tungurahua',
  Z: 'Zamora Chinchipe',
};

export function validateEcuadorPlate(inputPlate: string): PlateValidationResult {
  const clean = inputPlate.trim().toUpperCase().replace(/\s+/g, '');
  
  // Format check: 3 letters, optional hyphen, 3 or 4 digits (e.g. PBA-1234 or PBA1234)
  const regex = /^([A-Z]{3})-?([0-9]{3,4})$/;
  const match = clean.match(regex);

  if (!match) {
    return {
      isValid: false,
      normalizedPlate: clean,
      provinceCode: '',
      provinceName: 'Desconocida',
      serviceType: 'particular',
      serviceTypeLabel: 'Formato Inválido',
      isCommercialOrPublic: false,
      errorMessage: 'Formato incorrecto. Debe tener 3 letras y 3 o 4 dígitos (Ej: PBA-4521, IAA-1092, CAA-341)',
    };
  }

  const letters = match[1];
  const numbers = match[2];
  const normalizedPlate = `${letters}-${numbers}`;

  const firstLetter = letters[0];
  const secondLetter = letters[1];

  const provinceName = ECUADOR_PROVINCES_BY_CODE[firstLetter];
  if (!provinceName) {
    return {
      isValid: false,
      normalizedPlate,
      provinceCode: firstLetter,
      provinceName: 'No identificada',
      serviceType: 'particular',
      serviceTypeLabel: 'Provincia Inválida',
      isCommercialOrPublic: false,
      errorMessage: `La primera letra "${firstLetter}" no corresponde a ninguna provincia del Ecuador según la ANT.`,
    };
  }

  // 2nd letter in Ecuador classification:
  // A, Z, etc. represent Commercial (Taxis, Buses, Transporte comercial)
  // E represents Government / Estado
  let serviceType: PlateValidationResult['serviceType'] = 'particular';
  let serviceTypeLabel = 'Vehículo Particular (Fondo Blanco)';

  if (secondLetter === 'A' || secondLetter === 'Z' || secondLetter === 'U') {
    serviceType = 'comercial_taxi';
    serviceTypeLabel = 'Transporte Comercial / Taxi / Servicio Público (Fondo Naranja)';
  } else if (secondLetter === 'E') {
    serviceType = 'oficial_estado';
    serviceTypeLabel = 'Vehículo Oficial del Estado (Fondo Dorado)';
  } else if (secondLetter === 'M') {
    serviceType = 'oficial_estado';
    serviceTypeLabel = 'Vehículo Municipal / GAD';
  }

  return {
    isValid: true,
    normalizedPlate,
    provinceCode: firstLetter,
    provinceName,
    serviceType,
    serviceTypeLabel,
    isCommercialOrPublic: serviceType === 'comercial_taxi',
  };
}

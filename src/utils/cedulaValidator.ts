/**
 * Validador oficial del algoritmo de Cédula de Identidad de la República del Ecuador
 * Algoritmo Módulo 10 del Registro Civil del Ecuador
 */

export interface CedulaValidationResult {
  isValid: boolean;
  province?: string;
  provinceCode?: string;
  message: string;
}

export const ECUADOR_PROVINCE_CODES: Record<string, string> = {
  '01': 'Azuay (Cuenca)',
  '02': 'Bolívar (Guaranda)',
  '03': 'Cañar (Azogues)',
  '04': 'Carchi (Tulcán)',
  '05': 'Cotopaxi (Latacunga)',
  '06': 'Chimborazo (Riobamba)',
  '07': 'El Oro (Machala)',
  '08': 'Esmeraldas',
  '09': 'Guayas (Guayaquil)',
  '10': 'Imbabura (Ibarra)',
  '11': 'Loja',
  '12': 'Los Ríos (Babahoyo)',
  '13': 'Manabí (Portoviejo/Manta)',
  '14': 'Morona Santiago (Macas)',
  '15': 'Napo (Tena)',
  '16': 'Pastaza (Puyo)',
  '17': 'Pichincha (Quito)',
  '18': 'Tungurahua (Ambato)',
  '19': 'Zamora Chinchipe',
  '20': 'Galápagos',
  '21': 'Sucumbíos (Nueva Loja)',
  '22': 'Orellana (El Coca)',
  '23': 'Santo Domingo de los Tsáchilas',
  '24': 'Santa Elena',
  '30': 'Ecuatorianos en el Exterior',
};

export function validateEcuadorianCedula(cedulaInput: string): CedulaValidationResult {
  const cleanCedula = (cedulaInput || '').replace(/\D/g, '');

  if (cleanCedula.length === 0) {
    return {
      isValid: false,
      message: 'Ingresa los 10 dígitos de tu cédula ecuatoriana',
    };
  }

  if (cleanCedula.length !== 10) {
    return {
      isValid: false,
      message: `Debe tener 10 dígitos (actualmente: ${cleanCedula.length})`,
    };
  }

  const provinceCode = cleanCedula.substring(0, 2);
  const provinceName = ECUADOR_PROVINCE_CODES[provinceCode];

  // Validate province code range 01-24 or 30
  const provNum = parseInt(provinceCode, 10);
  if ((provNum < 1 || provNum > 24) && provNum !== 30) {
    return {
      isValid: false,
      message: `Código de provincia inválido (${provinceCode}). Debe ser entre 01 y 24.`,
    };
  }

  // Third digit must be natural person (0 to 5)
  const thirdDigit = parseInt(cleanCedula[2], 10);
  if (thirdDigit >= 6) {
    return {
      isValid: false,
      message: 'El tercer dígito debe ser menor a 6 para personas naturales.',
    };
  }

  // Modulo 10 verification
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const digit = parseInt(cleanCedula[i], 10);
    let product = digit * coefficients[i];
    if (product >= 10) {
      product -= 9;
    }
    sum += product;
  }

  const verifierDigit = parseInt(cleanCedula[9], 10);
  const nextTen = Math.ceil(sum / 10) * 10;
  let expectedVerifier = nextTen - sum;
  if (expectedVerifier === 10) {
    expectedVerifier = 0;
  }

  if (verifierDigit !== expectedVerifier) {
    return {
      isValid: false,
      province: provinceName,
      provinceCode,
      message: `Dígito verificador incorrecto. Se esperaba ${expectedVerifier}, recibido ${verifierDigit}.`,
    };
  }

  return {
    isValid: true,
    province: provinceName,
    provinceCode,
    message: `Cédula válida de ${provinceName}`,
  };
}

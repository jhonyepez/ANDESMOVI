/**
 * Tarifas Oficiales de Encomiendas - Agencia Tulcanaza & AndesMovi
 * Regla de Despacho y Liquidación:
 * 1. El cliente entrega el valor total al conductor.
 * 2. El conductor paga el valor correspondiente a la operadora de envío al dejar la encomienda.
 * 3. La diferencia es la ganancia neta líquida del conductor por recogida y transporte.
 */

export interface TulcanazaParcelTariffItem {
  id: string;
  name: string;
  shortName: string;
  category: 'sobre_manila' | 'kg_2' | 'kg_5' | 'kg_10' | 'kg_20' | 'kg_35' | 'quintal_papa';
  clientPaysDriverUsd: number; // Cliente entrega al conductor
  driverPaysOfficeUsd: number; // Conductor paga a la oficina de envío Tulcanaza
  driverProfitUsd: number;     // Ganancia neta para el conductor
  weightApproxKg: number;
  description: string;
  badge: string;
}

export const TULCANAZA_OFFICE_DETAILS = {
  id: 'sc-sierra-tulcan-tulcanaza',
  name: 'Oficina San Cristóbal - Tulcán (Tulcanaza)',
  shortName: 'Oficina Tulcanaza',
  agencyCode: 'TLZ-04',
  city: 'Tulcán',
  province: 'Carchi',
  address: 'Avenida Centenario (Sector Tulcanaza)',
  phone: '098 481 0656 / (06) 298-0273',
  schedule: 'Lunes a Sábado 06:00 - 20:00 • Domingo 07:00 - 18:00',
  description: 'Agencia matriz de recepción y despacho de encomiendas interprovinciales e intercantonales.',
};

export const TULCANAZA_PARCEL_TARIFFS: TulcanazaParcelTariffItem[] = [
  {
    id: 'sobre-manila',
    name: 'Sobre de Manila (Documentos)',
    shortName: 'Sobre Manila',
    category: 'sobre_manila',
    clientPaysDriverUsd: 6.00,
    driverPaysOfficeUsd: 4.00,
    driverProfitUsd: 2.00,
    weightApproxKg: 0.5,
    description: 'Documentos oficiales, cartas, contratos, cédulas y trámites ligeros.',
    badge: 'Doc < 1 kg',
  },
  {
    id: 'paquete-2kg',
    name: 'Paquete 2 kg (Funda / Caja pequeña)',
    shortName: '2 kg',
    category: 'kg_2',
    clientPaysDriverUsd: 9.50,
    driverPaysOfficeUsd: 7.00,
    driverProfitUsd: 2.50,
    weightApproxKg: 2,
    description: 'Medicinas, repuestos pequeños, ropa ligera o accesorios.',
    badge: '2 kg',
  },
  {
    id: 'paquete-5kg',
    name: 'Paquete 5 kg (Caja mediana)',
    shortName: '5 kg',
    category: 'kg_5',
    clientPaysDriverUsd: 9.50,
    driverPaysOfficeUsd: 8.00,
    driverProfitUsd: 1.50,
    weightApproxKg: 5,
    description: 'Calzado, alimentos no perecibles, paquetería estándar.',
    badge: '5 kg',
  },
  {
    id: 'paquete-10kg',
    name: 'Paquete 10 kg (Caja encomienda)',
    shortName: '10 kg',
    category: 'kg_10',
    clientPaysDriverUsd: 22.50,
    driverPaysOfficeUsd: 9.00,
    driverProfitUsd: 13.50,
    weightApproxKg: 10,
    description: 'Bultos medianos, mercancía comercial, repuestos mecánicos.',
    badge: '10 kg',
  },
  {
    id: 'paquete-20kg',
    name: 'Paquete 20 kg (Bulto grande)',
    shortName: '20 kg',
    category: 'kg_20',
    clientPaysDriverUsd: 22.50,
    driverPaysOfficeUsd: 18.00,
    driverProfitUsd: 4.50,
    weightApproxKg: 20,
    description: 'Maletas grandes, cajas voluminosas, electrodomésticos.',
    badge: '20 kg',
  },
  {
    id: 'paquete-35kg',
    name: 'Paquete 35 kg (Carga pesada)',
    shortName: '35 kg',
    category: 'kg_35',
    clientPaysDriverUsd: 35.00,
    driverPaysOfficeUsd: 28.00,
    driverProfitUsd: 7.00,
    weightApproxKg: 35,
    description: 'Carga pesada interprovincial, sacos, maquinaria o bultos industriales.',
    badge: '35 kg',
  },
  {
    id: 'quintal-papa',
    name: 'Quintal de Papa (100 lb / ~45 kg)',
    shortName: 'Quintal de Papa',
    category: 'quintal_papa',
    clientPaysDriverUsd: 9.00,
    driverPaysOfficeUsd: 7.00,
    driverProfitUsd: 2.00,
    weightApproxKg: 45,
    description: 'Saco agrícola / quintal de papa tradicional de Tulcán y Carchi para despacho.',
    badge: 'Quintal (45 kg)',
  },
];

/**
 * Encuentra la tarifa oficial de Tulcanaza más cercana según el peso o categoría
 */
export function getTulcanazaTariffByWeight(weightKg: number, isPotatoSack = false): TulcanazaParcelTariffItem {
  if (isPotatoSack) {
    return TULCANAZA_PARCEL_TARIFFS.find((t) => t.category === 'quintal_papa')!;
  }
  if (weightKg <= 1) {
    return TULCANAZA_PARCEL_TARIFFS.find((t) => t.category === 'sobre_manila')!;
  }
  if (weightKg <= 3) {
    return TULCANAZA_PARCEL_TARIFFS.find((t) => t.category === 'kg_2')!;
  }
  if (weightKg <= 7) {
    return TULCANAZA_PARCEL_TARIFFS.find((t) => t.category === 'kg_5')!;
  }
  if (weightKg <= 15) {
    return TULCANAZA_PARCEL_TARIFFS.find((t) => t.category === 'kg_10')!;
  }
  if (weightKg <= 28) {
    return TULCANAZA_PARCEL_TARIFFS.find((t) => t.category === 'kg_20')!;
  }
  return TULCANAZA_PARCEL_TARIFFS.find((t) => t.category === 'kg_35')!;
}

/**
 * Calcula desglose de liquidación según la tarifa del cliente
 */
export function calculateTulcanazaBreakdown(clientPays: number): {
  clientPays: number;
  officeFee: number;
  driverProfit: number;
} {
  // Busca si coincide exactamente con alguna tarifa
  const match = TULCANAZA_PARCEL_TARIFFS.find((t) => Math.abs(t.clientPaysDriverUsd - clientPays) < 0.05);
  if (match) {
    return {
      clientPays: match.clientPaysDriverUsd,
      officeFee: match.driverPaysOfficeUsd,
      driverProfit: match.driverProfitUsd,
    };
  }

  // Estimación proporcional si el cliente negoció otra cifra
  const platformCommissionPercent = 0.09; // 9% commission for Andes Movi
  const platformCommission = Number((clientPays * platformCommissionPercent).toFixed(2));
  
  // El conductor paga la tarifa a la oficina, el resto es su ganancia tras la comisión de AndesMovi
  // Basado en el requerimiento: Cliente paga -> Conductor paga a oficina -> 9% a AndesMovi
  // El saldo restante tras pagar a la oficina y a AndesMovi es para el conductor.
  
  // Asumimos que el costo de oficina es fijo o un porcentaje basado en la tarifa original.
  // Aquí usamos el 78% de la tarifa original como referencia de 'officeFee' proporcional si no hay tarifa fija.
  const officeFee = Number((clientPays * 0.70).toFixed(2)); 
  const driverProfit = Number((clientPays - officeFee - platformCommission).toFixed(2));
  
  return {
    clientPays,
    officeFee,
    driverProfit,
  };
}

/**
 * ============================================================================
 * ANDESMOVI - MÓDULO EXCLUSIVO DE ENCOMIENDAS (URBANO E INTERPROVINCIAL)
 * ============================================================================
 * Reglas de Negocio:
 * 1. Pago estricto en efectivo en el punto de origen (remitente).
 * 2. Encomienda Urbana: Tarifa de taxi calculada por OSRM + recargo fijo de $0.75.
 * 3. Encomienda Interprovincial: No va a domicilio. Va directo a la agencia oficial.
 *    - En Tulcán con San Cristóbal: Exclusivamente a la Agencia Tulcanaza.
 *    - En Tulcán con otras empresas (Pullman Carchi, Cita Express, Expreso Tulcán, 
 *      Vencedores): A sus respectivas oficinas/terminal.
 * 4. El conductor no edita puntos en el mapa; la app lo guía en 2 etapas.
 * 5. Registro obligatorio de S/F-NDV (Sin Factura - No Declara Valor) si no hay nota de venta.
 */

import L from 'leaflet';

// 1. DIRECTORIO OFICIAL DE AGENCIAS DE ENCOMIENDAS
export const AGENCIAS_ENCOMIENDAS = {
  tulcan: {
    SAN_CRISTOBAL: {
      empresa: "Cooperativa San Cristóbal",
      sucursal: "Agencia Tulcanaza",
      direccion: "Av. Centenario (Sector Tulcanaza)",
      lat: 0.8085,
      lng: -77.7120
    },
    PULLMAN_CARCHI: {
      empresa: "Cooperativa Pullman Carchi",
      sucursal: "Oficina Pullman Carchi Tulcán",
      direccion: "Sector Terminal Terrestre Tulcán",
      lat: 0.8122,
      lng: -77.7153
    },
    CITA_EXPRESS: {
      empresa: "Cooperativa Cita Express",
      sucursal: "Oficina Cita Express Tulcán",
      direccion: "Oficina de Encomiendas Tulcán",
      lat: 0.8130,
      lng: -77.7160
    },
    EXPRESO_TULCAN: {
      empresa: "Cooperativa Expreso Tulcán",
      sucursal: "Oficina Encomiendas Expreso Tulcán",
      direccion: "Sector Terminal Terrestre Tulcán",
      lat: 0.8125,
      lng: -77.7156
    },
    TRANS_VENCEDORES: {
      empresa: "Transportes Vencedores",
      sucursal: "Oficina Encomiendas Vencedores",
      direccion: "Sector Terminal Terrestre Tulcán",
      lat: 0.8120,
      lng: -77.7148
    }
  },
  ibarra: {
    SAN_CRISTOBAL: {
      empresa: "Cooperativa San Cristóbal",
      sucursal: "Agencia Bomba de Los Olivos",
      direccion: "Sector Bomba Los Olivos",
      lat: 0.3612,
      lng: -78.1180
    }
  },
  quito: {
    SAN_CRISTOBAL: {
      empresa: "Cooperativa San Cristóbal",
      sucursal: "Agencia Carcelén (Eloy Alfaro)",
      direccion: "Sector Carcelén / Av. Eloy Alfaro",
      lat: -0.1065,
      lng: -78.4720
    }
  }
};

// 2. ESTADO DEL PEDIDO DE ENCOMIENDA
export const EncomiendaState = {
  tipo: 'urbana' as 'urbana' | 'interprovincial', // 'urbana' o 'interprovincial'
  ciudadOrigen: 'tulcan',
  cooperativa: 'SAN_CRISTOBAL',
  remitente: { nombre: '', telefono: '', direccion: '', lat: null as number | null, lng: null as number | null },
  destinatario: { nombre: '', telefono: '', direccion: '', lat: null as number | null, lng: null as number | null },
  paquete: {
    descripcion: '',
    tieneFactura: false,
    declaracionValor: 'S/F-NDV', // Sin Factura - No Declara Valor por defecto
    fotoPaqueteUrl: null as string | null
  },
  costoEnvio: 0.00,
  estadoEnvio: 'creado' // 'creado', 'conductor_en_camino', 'retirado', 'entregado'
};

// 3. CÁLCULO DE TARIFA DE ENCOMIENDA
export function calcularTarifaEncomienda(distanciaKm: number, tiempoMin: number, onUpdate?: (cost: number) => void): number {
  if (EncomiendaState.tipo === 'urbana') {
    const tarifaBase = 1.00;
    const valorKm = 0.35;
    const valorMin = 0.05;
    const recargoEncomienda = 0.75; // Fijo para paquetes locales

    let total = tarifaBase + (distanciaKm * valorKm) + (tiempoMin * valorMin) + recargoEncomienda;
    
    if (total < 2.00) {
      total = 2.00;
    }
    
    EncomiendaState.costoEnvio = Number(total.toFixed(2));
  } else {
    let fleteHaciaAgencia = 1.25 + (distanciaKm * 0.35);
    if (fleteHaciaAgencia < 1.50) fleteHaciaAgencia = 1.50;
    
    EncomiendaState.costoEnvio = Number(fleteHaciaAgencia.toFixed(2));
  }

  if (onUpdate) {
    onUpdate(EncomiendaState.costoEnvio);
  }

  return EncomiendaState.costoEnvio;
}

// 4. CONFIGURACIÓN DEL DESTINO PARA EL MAPA (OSRM)
export function prepararDestinoEncomienda(map: L.Map, markerB: L.Marker | null): void {
  if (EncomiendaState.tipo === 'interprovincial') {
    const ciudadObj = (AGENCIAS_ENCOMIENDAS as any)[EncomiendaState.ciudadOrigen] || AGENCIAS_ENCOMIENDAS.tulcan;
    const agencia = ciudadObj[EncomiendaState.cooperativa] || ciudadObj.SAN_CRISTOBAL;

    EncomiendaState.destinatario.lat = agencia.lat;
    EncomiendaState.destinatario.lng = agencia.lng;
    EncomiendaState.destinatario.direccion = `${agencia.empresa} (${agencia.sucursal})`;

    const iconoAgencia = L.divIcon({
      className: 'pin-agencia',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; pointer-events:none; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
          <div style="background:#1D4ED8; color:#FFF; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:bold; white-space:nowrap; border: 1.5px solid #FFFFFF;">
            🏢 ${agencia.sucursal}
          </div>
          <div style="font-size:28px; line-height:1; margin-top:2px;">📦</div>
        </div>`,
      iconSize: [140, 60],
      iconAnchor: [70, 52]
    });

    if (markerB) {
      markerB.setIcon(iconoAgencia);
      markerB.setLatLng([agencia.lat, agencia.lng]);
      if (markerB.dragging) {
        markerB.dragging.disable(); // El usuario no puede mover la agencia oficial
      }
    }
  }
}

// 5. FLUJO ASISTIDO DEL CONDUCTOR (EN 2 FASES)
export function flujoConductorEncomienda(etapa: 'FASE_1_RETIRO' | 'FASE_2_ENTREGA', coordsConductor: { lat: number; lng: number }, trazarRutaOSRM: (orig: { lat: number; lng: number }, dest: { lat: number; lng: number }) => void, mostrarPantallaConductor: (info: any) => void): void {
  if (etapa === 'FASE_1_RETIRO') {
    if (EncomiendaState.remitente.lat && EncomiendaState.remitente.lng) {
      trazarRutaOSRM(coordsConductor, { lat: EncomiendaState.remitente.lat, lng: EncomiendaState.remitente.lng });
    }
    mostrarPantallaConductor({
      titulo: "RETIRAR PAQUETE",
      contacto: EncomiendaState.remitente.nombre,
      telefono: EncomiendaState.remitente.telefono,
      direccion: EncomiendaState.remitente.direccion,
      cobroEfectivo: `$${EncomiendaState.costoEnvio.toFixed(2)} (COBRAR EN EFECTIVO AL RETIRAR)`,
      botonAccion: "📦 PAQUETE RETIRADO Y COBRADO"
    });
  } else if (etapa === 'FASE_2_ENTREGA') {
    if (EncomiendaState.remitente.lat && EncomiendaState.remitente.lng && EncomiendaState.destinatario.lat && EncomiendaState.destinatario.lng) {
      trazarRutaOSRM(
        { lat: EncomiendaState.remitente.lat, lng: EncomiendaState.remitente.lng },
        { lat: EncomiendaState.destinatario.lat, lng: EncomiendaState.destinatario.lng }
      );
    }
    
    const textoDestino = EncomiendaState.tipo === 'interprovincial' 
      ? `ENTREGAR EN AGENCIA: ${EncomiendaState.destinatario.direccion}`
      : `ENTREGAR A DOMICILIO: ${EncomiendaState.destinatario.direccion}`;

    mostrarPantallaConductor({
      titulo: "EN CAMINO A DESTINO",
      destino: textoDestino,
      botonAccion: EncomiendaState.tipo === 'interprovincial' 
        ? "🏢 SUBIR FOTO DE GUÍA DE AGENCIA" 
        : "✅ CONFIRMAR ENTREGA FINAL"
    });
  }
}

// 6. GENERADOR DE COMPROBANTE DIGITAL / TICKET ANDESMOVI
export function generarComprobanteEncomienda(idGuia: string) {
  return {
    titulo: "ANDESMOVI EXPRESS - ENCOMIENDAS",
    guia: idGuia,
    fecha: new Date().toLocaleString('es-EC'),
    tipo: EncomiendaState.tipo.toUpperCase(),
    remitente: EncomiendaState.remitente.nombre,
    destinatario: EncomiendaState.destinatario.nombre,
    destinoFinal: EncomiendaState.destinatario.direccion,
    cooperativaDespacho: EncomiendaState.tipo === 'interprovincial' ? EncomiendaState.cooperativa : 'ANDESMOVI URBANO',
    declaracion: EncomiendaState.paquete.tieneFactura ? "CON FACTURA" : "S/F-NDV (NO DECLARA VALOR)",
    totalCancelado: `$${EncomiendaState.costoEnvio.toFixed(2)} USD (PAGADO EN ORIGEN)`
  };
}

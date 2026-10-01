-- =====================================================================================
-- ANDESMOVI ECUADOR - ESQUEMA DE BASE DE DATOS RELACIONAL (POSTGRESQL / SUPABASE / CLOUD SQL)
-- Plataforma de Transporte, Taxis Cooperados, Delivery y Encomiendas 24 Provincias
-- =====================================================================================

-- Extensión para generación de UUIDs criptográficos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: usuarios (Clientes, Conductores, Operadores, Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cedula VARCHAR(10) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(150) UNIQUE,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('cliente', 'conductor', 'operador', 'admin_general', 'superadmin')),
    avatar_url TEXT,
    saldo_billetera_usd NUMERIC(10, 2) DEFAULT 0.00 CHECK (saldo_billetera_usd >= 0.00),
    es_activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: conductores_perfil (Documentos, Licencia, RTV, Cooperativa)
CREATE TABLE IF NOT EXISTS conductores_perfil (
    usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_licencia VARCHAR(5) NOT NULL CHECK (tipo_licencia IN ('B', 'C', 'C1', 'D', 'E', 'F')),
    estado_licencia VARCHAR(20) DEFAULT 'en_revision' CHECK (estado_licencia IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    licencia_frente_url TEXT,
    licencia_reverso_url TEXT,
    estado_antecedentes VARCHAR(20) DEFAULT 'en_revision' CHECK (estado_antecedentes IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    antecedentes_pdf_url TEXT,
    estado_rtv VARCHAR(20) DEFAULT 'en_revision' CHECK (estado_rtv IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    rtv_doc_url TEXT,
    cooperativa_nombre VARCHAR(120),
    terminal_asignado VARCHAR(120),
    calificacion_promedio NUMERIC(3, 2) DEFAULT 5.00,
    total_carreras_completadas INTEGER DEFAULT 0,
    estado_aprobacion_general VARCHAR(20) DEFAULT 'en_revision' CHECK (estado_aprobacion_general IN ('pendiente', 'en_revision', 'aprobado', 'suspendido', 'rechazado')),
    observaciones_admin TEXT,
    verificado_por UUID REFERENCES usuarios(id),
    verificado_at TIMESTAMP WITH TIME ZONE
);

-- 3. TABLA: unidades_vehiculares (Control de Unidades y Placas Validadas ANT)
CREATE TABLE IF NOT EXISTS unidades_vehiculares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_unidad VARCHAR(30) NOT NULL, -- Ej: "Unidad #045"
    placa VARCHAR(10) UNIQUE NOT NULL, -- Formato ANT: PBA-4521
    provincia_placa VARCHAR(60) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio INTEGER NOT NULL CHECK (anio >= 2005 AND anio <= 2026),
    color VARCHAR(40) NOT NULL,
    tipo_vehiculo VARCHAR(30) NOT NULL CHECK (tipo_vehiculo IN ('auto', 'moto', 'confort', 'camioneta', 'mini')),
    cooperativa VARCHAR(120) NOT NULL,
    terminal VARCHAR(120) NOT NULL,
    chofer_asignado_id UUID REFERENCES usuarios(id),
    es_chofer_aprobado BOOLEAN DEFAULT TRUE,
    estado_operativo VARCHAR(30) DEFAULT 'disponible' CHECK (estado_operativo IN ('disponible', 'en_viaje', 'en_encomienda', 'desconectado')),
    latitud NUMERIC(10, 7),
    longitud NUMERIC(10, 7),
    rumbo_grados NUMERIC(5, 2) DEFAULT 0,
    velocidad_kmh NUMERIC(5, 2) DEFAULT 0,
    nivel_bateria_porcentaje INTEGER DEFAULT 95 CHECK (nivel_bateria_porcentaje BETWEEN 0 AND 100),
    ultimo_ping_gps TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: carreras (Viajes Urbanos, Intercantonales y Domicilios)
-- Regla oficial tarifaria AndesMovi: $1.25 USD cubre hasta 2.7 km + $0.35 por km adicional
CREATE TABLE IF NOT EXISTS carreras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_carrera VARCHAR(30) UNIQUE NOT NULL, -- Ej: "CARR-EC-2026-4091"
    cliente_id UUID NOT NULL REFERENCES usuarios(id),
    conductor_id UUID REFERENCES usuarios(id),
    unidad_id UUID REFERENCES unidades_vehiculares(id),
    tipo_servicio VARCHAR(30) NOT NULL CHECK (tipo_servicio IN ('viaje', 'domicilio', 'encomienda')),
    tipo_vehiculo VARCHAR(30) NOT NULL CHECK (tipo_vehiculo IN ('auto', 'moto', 'confort', 'mini')),
    origen_direccion TEXT NOT NULL,
    origen_lat NUMERIC(10, 7) NOT NULL,
    origen_lng NUMERIC(10, 7) NOT NULL,
    destino_direccion TEXT NOT NULL,
    destino_lat NUMERIC(10, 7) NOT NULL,
    destino_lng NUMERIC(10, 7) NOT NULL,
    distancia_km NUMERIC(6, 2) NOT NULL,
    duracion_estimada_min INTEGER NOT NULL,
    
    -- Desglose Tarifario Oficial ($1.25 cubre hasta 2.7 km)
    tarifa_base_usd NUMERIC(6, 2) DEFAULT 1.25,
    km_cubiertos_base NUMERIC(4, 2) DEFAULT 2.70,
    km_excedentes NUMERIC(6, 2) DEFAULT 0.00,
    precio_km_excedente_usd NUMERIC(6, 2) DEFAULT 0.35,
    precio_sugerido_usd NUMERIC(6, 2) NOT NULL,
    precio_pactado_usd NUMERIC(6, 2) NOT NULL,
    comision_app_porcentaje NUMERIC(4, 2) DEFAULT 7.00, -- 7% AndesMovi
    comision_app_monto_usd NUMERIC(6, 2) NOT NULL, -- 7% del precio pactado
    ingreso_neto_chofer_usd NUMERIC(6, 2) NOT NULL, -- 93% del precio pactado
    
    metodo_pago VARCHAR(30) NOT NULL CHECK (metodo_pago IN ('efectivo', 'deuna', 'banco_pichincha', 'banco_guayaquil', 'tarjeta')),
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado')),
    estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'en_camino', 'en_curso', 'finalizado', 'cancelado')),
    
    pin_seguridad_inicio VARCHAR(4), -- PIN que cliente da al conductor para iniciar
    pin_seguridad_fin VARCHAR(4),
    cooperativa_nombre VARCHAR(120),
    terminal_nombre VARCHAR(120),
    calificacion_cliente INTEGER CHECK (calificacion_cliente BETWEEN 1 AND 5),
    comentario_cliente TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    iniciada_at TIMESTAMP WITH TIME ZONE,
    finalizada_at TIMESTAMP WITH TIME ZONE
);

-- 5. TABLA: encomiendas (División Nacional de Encomiendas)
CREATE TABLE IF NOT EXISTS encomiendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_guia VARCHAR(40) UNIQUE NOT NULL, -- Ej: "ENC-EC-2026-98124"
    remitente_id UUID REFERENCES usuarios(id),
    remitente_nombre VARCHAR(150) NOT NULL,
    remitente_cedula VARCHAR(10) NOT NULL,
    remitente_telefono VARCHAR(20) NOT NULL,
    remitente_ciudad VARCHAR(80) NOT NULL,
    
    destinatario_nombre VARCHAR(150) NOT NULL,
    destinatario_cedula VARCHAR(10),
    destinatario_telefono VARCHAR(20) NOT NULL,
    destinatario_ciudad VARCHAR(80) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    
    descripcion_contenido TEXT NOT NULL,
    tipo_paquete VARCHAR(30) NOT NULL CHECK (tipo_paquete IN ('sobre', 'paquete_chico', 'caja_mediana', 'carga_pesada')),
    peso_kg NUMERIC(6, 2) NOT NULL,
    valor_declarado_usd NUMERIC(8, 2) NOT NULL,
    costo_envio_usd NUMERIC(6, 2) NOT NULL,
    comision_app_usd NUMERIC(6, 2) NOT NULL,
    
    estado_pago VARCHAR(30) NOT NULL CHECK (estado_pago IN ('pagado_origen', 'cobro_contra_entrega')),
    estado VARCHAR(40) DEFAULT 'recepcionada' CHECK (estado IN ('recepcionada', 'en_bodega', 'en_transito_interprovincial', 'en_reparto_local', 'entregada', 'devuelta')),
    
    transportista_asignado_id UUID REFERENCES usuarios(id),
    unidad_asignada_id UUID REFERENCES unidades_vehiculares(id),
    terminal_origen VARCHAR(120),
    terminal_destino VARCHAR(120),
    cooperativa_transporte VARCHAR(120),
    pin_seguridad_entrega VARCHAR(6) NOT NULL, -- PIN obligatorio para receptor
    firma_receptor_url TEXT,
    fecha_recepcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP WITH TIME ZONE
);

-- 6. TABLA: mensajes_chat (Mensajería en Tiempo Real entre Pasajero y Chofer)
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrera_id UUID NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
    remitente_id UUID NOT NULL REFERENCES usuarios(id),
    tipo_remitente VARCHAR(20) NOT NULL CHECK (tipo_remitente IN ('cliente', 'conductor', 'sistema', 'operador')),
    contenido TEXT NOT NULL,
    es_coordenadas BOOLEAN DEFAULT FALSE,
    latitud NUMERIC(10, 7),
    longitud NUMERIC(10, 7),
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA: recargas_billetera (Validación Obligatoria con Número de Comprobante)
CREATE TABLE IF NOT EXISTS recargas_billetera (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conductor_id UUID NOT NULL REFERENCES usuarios(id),
    monto_usd NUMERIC(8, 2) NOT NULL CHECK (monto_usd > 0.00),
    banco_origen VARCHAR(80) NOT NULL, -- Pichincha, Guayaquil, Produbanco, Austro, DeUna!
    metodo_pago VARCHAR(40) NOT NULL,
    numero_comprobante VARCHAR(60) NOT NULL, -- "NUMERO DE COMPROBANTE DE TRANSFERENCIA"
    comprobante_imagen_url TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    cuenta_administrador_destino VARCHAR(80) DEFAULT 'Jhon Sebastian Yepez Clavijo (C.I. 1004721351)',
    solicitada_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revisada_at TIMESTAMP WITH TIME ZONE,
    revisada_por UUID REFERENCES usuarios(id),
    notas_admin TEXT
);

-- ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_carreras_estado ON carreras(estado);
CREATE INDEX IF NOT EXISTS idx_carreras_conductor ON carreras(conductor_id);
CREATE INDEX IF NOT EXISTS idx_carreras_cliente ON carreras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_unidades_operativo ON unidades_vehiculares(estado_operativo);
CREATE INDEX IF NOT EXISTS idx_unidades_cooperativa ON unidades_vehiculares(cooperativa);
CREATE INDEX IF NOT EXISTS idx_unidades_terminal ON unidades_vehiculares(terminal);
CREATE INDEX IF NOT EXISTS idx_recargas_estado ON recargas_billetera(estado);
CREATE INDEX IF NOT EXISTS idx_recargas_comprobante ON recargas_billetera(numero_comprobante);
CREATE INDEX IF NOT EXISTS idx_encomiendas_guia ON encomiendas(numero_guia);
CREATE INDEX IF NOT EXISTS idx_encomiendas_estado ON encomiendas(estado);
CREATE INDEX IF NOT EXISTS idx_chat_carrera ON mensajes_chat(carrera_id, created_at);

-- =====================================================================================
-- ANDESMOVI ECUADOR - REGLAS DE SEGURIDAD Y POLÍTICAS ROW-LEVEL SECURITY (RLS)
-- Protección integral de datos de Clientes, Choferes, Ubicaciones y Finanzas
-- =====================================================================================

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_vehiculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE carreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE encomiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE recargas_billetera ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PARA: usuarios
-- Un usuario puede leer su propio perfil; el Administrador puede leer todos.
CREATE POLICY usuarios_select_policy ON usuarios
    FOR SELECT
    USING (
        auth.uid() = id
        OR (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin', 'operador')
    );

-- Solo el propio usuario puede actualizar campos no críticos (avatar, teléfono)
CREATE POLICY usuarios_update_policy ON usuarios
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        -- No puede auto-modificarse el saldo ni el rol
        saldo_billetera_usd = (SELECT saldo_billetera_usd FROM usuarios WHERE id = auth.uid())
        AND rol = (SELECT rol FROM usuarios WHERE id = auth.uid())
    );

-- 2. POLÍTICAS PARA: conductores_perfil
-- Documentos y antecedentes solo son visibles para el conductor dueño y el Administrador
CREATE POLICY conductores_select_policy ON conductores_perfil
    FOR SELECT
    USING (
        auth.uid() = usuario_id
        OR (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin')
    );

-- Solo administradores pueden aprobar o rechazar documentos (Licencia, Antecedentes, RTV)
CREATE POLICY conductores_update_admin_policy ON conductores_perfil
    FOR UPDATE
    USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin'));

-- 3. POLÍTICAS PARA: carreras
-- Un cliente solo ve sus carreras creadas; un conductor ve carreras disponibles o asignadas a él
CREATE POLICY carreras_select_policy ON carreras
    FOR SELECT
    USING (
        auth.uid() = cliente_id
        OR auth.uid() = conductor_id
        OR (estado = 'pendiente' AND (SELECT rol FROM usuarios WHERE id = auth.uid()) = 'conductor')
        OR (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin', 'operador')
    );

-- Clientes pueden crear carreras (solicitudes de viaje)
CREATE POLICY carreras_insert_cliente_policy ON carreras
    FOR INSERT
    WITH CHECK (auth.uid() = cliente_id);

-- Solo el cliente o conductor involucrado pueden actualizar el estado de su carrera
CREATE POLICY carreras_update_involucrados_policy ON carreras
    FOR UPDATE
    USING (
        auth.uid() = cliente_id
        OR auth.uid() = conductor_id
        OR (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin')
    );

-- 4. POLÍTICAS PARA: mensajes_chat
-- Solo los participantes activos de la carrera pueden leer o escribir mensajes
CREATE POLICY chat_select_policy ON mensajes_chat
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM carreras c
            WHERE c.id = carrera_id
            AND (c.cliente_id = auth.uid() OR c.conductor_id = auth.uid())
        )
        OR (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin')
    );

CREATE POLICY chat_insert_policy ON mensajes_chat
    FOR INSERT
    WITH CHECK (
        auth.uid() = remitente_id
        AND EXISTS (
            SELECT 1 FROM carreras c
            WHERE c.id = carrera_id
            AND (c.cliente_id = auth.uid() OR c.conductor_id = auth.uid())
        )
    );

-- 5. POLÍTICAS PARA: encomiendas
-- Remitentes ven sus guías; receptores pueden consultar con número de guía y PIN
CREATE POLICY encomiendas_select_policy ON encomiendas
    FOR SELECT
    USING (
        auth.uid() = remitente_id
        OR auth.uid() = transportista_asignado_id
        OR (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin', 'operador')
    );

-- 6. POLÍTICAS PARA: recargas_billetera
-- Choferes pueden crear solicitudes con su NÚMERO DE COMPROBANTE DE TRANSFERENCIA
CREATE POLICY recargas_insert_conductor_policy ON recargas_billetera
    FOR INSERT
    WITH CHECK (auth.uid() = conductor_id);

-- Choferes ven sus propias recargas
CREATE POLICY recargas_select_conductor_policy ON recargas_billetera
    FOR SELECT
    USING (
        auth.uid() = conductor_id
        OR (SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin')
    );

-- Solo administradores pueden APROBAR o RECHAZAR recargas de billetera
CREATE POLICY recargas_update_admin_only_policy ON recargas_billetera
    FOR UPDATE
    USING ((SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin'))
    WITH CHECK ((SELECT rol FROM usuarios WHERE id = auth.uid()) IN ('admin_general', 'superadmin'));

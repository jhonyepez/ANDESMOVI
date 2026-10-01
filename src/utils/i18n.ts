export type LanguageCode = 'es' | 'qu' | 'en' | 'pt';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
  description: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español (Ecuador)',
    region: 'Ecuador / Latinoamérica',
    flag: '🇪🇨',
    description: 'Español estándar de Ecuador con moneda en dólares (USD).',
  },
  {
    code: 'qu',
    name: 'Kichwa / Quechua',
    nativeName: 'Runa Shimi / Kichwa',
    region: 'Andes del Ecuador / Tawantinsuyu',
    flag: '🏔️',
    description: 'Lengua ancestral de los pueblos andinos de Ecuador (Sierra y Amazonía).',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US)',
    region: 'International / USA',
    flag: '🇺🇸',
    description: 'International travelers and English-speaking tourists in Ecuador.',
  },
  {
    code: 'pt',
    name: 'Português',
    nativeName: 'Português',
    region: 'Brasil / Portugal',
    flag: '🇧🇷',
    description: 'Para turistas e usuários de língua portuguesa na América do Sul.',
  },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  es: {
    // Navigation & General
    settings: 'Configuración',
    profile: 'Perfil de Usuario',
    digital_wallet: 'Billetera Digital',
    language: 'Idioma y Dialecto',
    notifications: 'Notificaciones',
    security: 'Seguridad y Privacidad',
    payment_methods: 'Métodos de Pago',
    vehicle_data: 'Datos del Vehículo',
    service_history: 'Historial de Servicios',
    help_support: 'Ayuda y Soporte',
    terms_conditions: 'Términos y Condiciones',
    privacy_policy: 'Política de Privacidad',
    logout: 'Cerrar Sesión',
    save_changes: 'Guardar Cambios',
    saved: '¡Guardado!',
    cancel: 'Cancelar',
    close: 'Cerrar',
    
    // Services
    rides: 'Viajes',
    delivery: 'Domicilios',
    parcels: 'Encomiendas',
    driver_mode: 'Modo Conductor',
    client_mode: 'Modo Cliente',
    sos_button: 'Auxilio SOS 911',
    scheduled: 'Programados',
    history: 'Historial',
    
    // Profile
    full_name: 'Nombre Completo',
    avatar_photo: 'Fotografía de Perfil',
    phone_contact: 'Teléfono de Contacto',
    email_address: 'Correo Electrónico',
    cedula_id: 'Cédula de Identidad (Ecuador)',
    province_city: 'Provincia / Ciudad',
    verified_identity: 'Identidad Verificada con Registro Civil',
    change_photo: 'Cambiar Fotografía',

    // Wallet & 7% Commission
    available_balance: 'Saldo Prepago Disponible',
    driver_wallet_title: 'Billetera Prepago del Conductor (7% y 9%)',
    driver_only_wallet_notice: 'El cliente le paga el 100% de la carrera directamente al conductor (en efectivo o transferencia). La aplicación no aumenta el saldo con la carrera, sino que descuenta la comisión justa (7% Urbano/Delivery y 9% Encomiendas Interprovinciales) de la billetera prepago.',
    client_payment_rule: 'El cliente paga directamente al conductor (Efectivo o DeUna/Transferencia)',
    cash_on_delivery: 'Al Contado (Efectivo directo al conductor)',
    bank_transfer_full: 'Transferencia Bancaria / DeUna! (Directo al Conductor)',
    commission_badge: 'La comisión más justa (7% Urbano/Delivery, 9% Interprovincial y $3/pax Ejecutivo)',
    commission_title: 'Comisiones de Plataforma (Débito Automático)',
    commission_desc: 'El cliente te paga el 100% de la carrera directamente a ti. AndesMovi descuenta de tu saldo prepago: 7% para Carreras Urbanas y Delivery/Domicilio, 9% para Encomiendas Interprovinciales, y $3.00 USD por pasajero en servicio ejecutivo (1 pasajero: $3, 2 pasajeros: $6, 3 pasajeros: $9, 4 pasajeros: $12). Mantén un fondo de seguridad mínimo de $10 USD.',
    earnings: 'Ingresos Totales',
    expenses: 'Gastos en Servicios',
    withdrawals: 'Retiros a Banco',
    withdraw_btn: 'Solicitar Retiro',
    recharge_btn: 'Recargar Saldo',
    tx_history: 'Historial de Movimientos',
    bank_account: 'Cuenta Bancaria Ecuador',
    select_bank: 'Seleccionar Banco o Cooperativa',
    bank_pichincha: 'Banco Pichincha',
    bank_guayaquil: 'Banco Guayaquil',
    bank_produbanco: 'Produbanco',
    bank_jep: 'Cooperativa JEP',
    bank_pacifico: 'Banco del Pacífico',
    wallet_deuna: 'DeUna! (Pichincha)',

    // Vehicle
    vehicle_type: 'Tipo de Vehículo',
    vehicle_model: 'Marca y Modelo',
    vehicle_plate: 'Placa Ecuatoriana (Ej: PBC-4921)',
    vehicle_color: 'Color del Vehículo',
    vehicle_year: 'Año de Fabricación',
    vehicle_rtv: 'Revisión Técnica Vehicular (RTV)',
    vehicle_status_verified: 'Documentación Aprobada ANT',

    // Security
    two_factor_auth: 'Verificación 2FA por SMS',
    safety_pins: 'Código PIN de Seguridad de Viaje',
    emergency_contacts: 'Contactos de Emergencia (ECU 911)',
    change_password: 'Cambiar Contraseña',

    // Language selection info
    kichwa_badge: '¡Kichwa / Quechua disponible para los Andes!',
  },
  qu: {
    // Navigation & General
    settings: 'Allichina',
    profile: 'Kikin Runa Kawsay',
    digital_wallet: 'Kullki Churana',
    language: 'Runa Shimi / Rimay',
    notifications: 'Willaykuna',
    security: 'Allikay Kamak',
    payment_methods: 'Kullki Kuna Ñan',
    vehicle_data: 'Antawa Willaykuna',
    service_history: 'Ñawpa Ruraykuna',
    help_support: 'Yanapay',
    terms_conditions: 'Kamachikuna',
    privacy_policy: 'Pakalla Kamachiy',
    logout: 'Llukshina',
    save_changes: 'Waqaychina',
    saved: '¡Waqaychishka!',
    cancel: 'Ama ruray',
    close: 'Wichkana',
    
    // Services
    rides: 'Puriykuna',
    delivery: 'Wasi Chayachiy',
    parcels: 'Apaykuna',
    driver_mode: 'Antawata Pushak',
    client_mode: 'Rantipak Runa',
    sos_button: 'Yanapay SOS 911',
    scheduled: 'Churashka Puriy',
    history: 'Ñawpa Kawsay',
    
    // Profile
    full_name: 'Kikin Shuti',
    avatar_photo: 'Rikchak / Kikin Rikcha',
    phone_contact: 'Kayana Willay (Karuyari)',
    email_address: 'Antanikik Willay (Email)',
    cedula_id: 'Kikin Cédula (Ecuador)',
    province_city: 'Kitilli / Marka',
    verified_identity: 'Alli Runa Kamachishka',
    change_photo: 'Rikchakta Shukyachina',

    // Wallet & 7% Commission
    available_balance: 'Puchuk Kullki (USD)',
    driver_wallet_title: 'Antawata Pushakpa Kullki Churana (7%)',
    driver_only_wallet_notice: 'Antawata pushakllami digital kullki churanata charin. Rantipak runaka makipi kullkita churan mana kashpaka banku churanawan.',
    client_payment_rule: 'Rantipak runaka makipi kullkita churan mana kashpaka banku churanawan',
    cash_on_delivery: 'Makipi Kullki (USD)',
    bank_transfer_full: 'Banku Chaskina / DeUna! (Pushakpak)',
    commission_badge: 'Ecuador Mamallaktapi ashalla kullki mañay (Patsakmanta 7%)',
    commission_title: 'Alli Kullki: Patsakmanta 7%',
    commission_desc: 'AndesMovi patsakmanta 7 kullkillata charin. 93% tukuy kullkika antawata pushakpa makipi sakirin.',
    earnings: 'Yaykuna Kullki',
    expenses: 'Llukshina Kullki',
    withdrawals: 'Kullki Surkuna',
    withdraw_btn: 'Kullkita Surkuna',
    recharge_btn: 'Kullkita Yapachina',
    tx_history: 'Kullki Ruraykuna Ñawpa',
    bank_account: 'Banku Churanakuna Ecuador',
    select_bank: 'Bankuta akllana',
    bank_pichincha: 'Banco Pichincha',
    bank_guayaquil: 'Banco Guayaquil',
    bank_produbanco: 'Produbanco',
    bank_jep: 'Cooperativa JEP',
    bank_pacifico: 'Banco del Pacífico',
    wallet_deuna: 'DeUna! (Pichincha)',

    // Vehicle
    vehicle_type: 'Antawa Sami',
    vehicle_model: 'Antawa Shuti Modelo',
    vehicle_plate: 'Antawa Wankana (Ej: PBC-4921)',
    vehicle_color: 'Antawa Tulu (Color)',
    vehicle_year: 'Watapa Wata',
    vehicle_rtv: 'Antawa Rikushka Kamachiy (RTV)',
    vehicle_status_verified: 'Alli Kamachishka ANT',

    // Security
    two_factor_auth: '2FA Karuyaripi Willana',
    safety_pins: 'Pakalla Yupay PIN Purinapaq',
    emergency_contacts: 'Kayana Runakuna (ECU 911)',
    change_password: 'Pakalla Shimita Shukyachina',

    // Language selection info
    kichwa_badge: '¡Alli Shamushka Kichwa Runa Shimi Andes Suyupi!',
  },
  en: {
    // Navigation & General
    settings: 'Settings',
    profile: 'User Profile',
    digital_wallet: 'Digital Wallet',
    language: 'Language & Region',
    notifications: 'Notifications',
    security: 'Security & Privacy',
    payment_methods: 'Payment Methods',
    vehicle_data: 'Vehicle Details',
    service_history: 'Service History',
    help_support: 'Help & Support',
    terms_conditions: 'Terms & Conditions',
    privacy_policy: 'Privacy Policy',
    logout: 'Log Out',
    save_changes: 'Save Changes',
    saved: 'Saved!',
    cancel: 'Cancel',
    close: 'Close',
    
    // Services
    rides: 'Rides',
    delivery: 'Food & Delivery',
    parcels: 'Parcels & Courier',
    driver_mode: 'Driver Mode',
    client_mode: 'Passenger Mode',
    sos_button: 'SOS 911 Alert',
    scheduled: 'Scheduled',
    history: 'History',
    
    // Profile
    full_name: 'Full Name',
    avatar_photo: 'Profile Picture',
    phone_contact: 'Contact Phone',
    email_address: 'Email Address',
    cedula_id: 'Ecuadorian ID / Passport',
    province_city: 'Province / City',
    verified_identity: 'Identity Verified with Civil Registry',
    change_photo: 'Change Photo',

    // Wallet & 7% Commission
    available_balance: 'Available Balance',
    driver_wallet_title: 'Driver Digital Wallet (7%)',
    driver_only_wallet_notice: 'Only drivers have a digital wallet in AndesMovi to collect earnings, handle the 7% fair fee, and withdraw to Ecuadorian banks. Passengers pay in cash or direct transfer.',
    client_payment_rule: 'Passenger pays in cash or direct bank transfer',
    cash_on_delivery: 'Cash on Delivery / Ride (USD)',
    bank_transfer_full: 'Direct Bank Transfer / DeUna! (To Driver)',
    commission_badge: "Ecuador's Lowest Platform Fee (Only 7%)",
    commission_title: 'Fair 7% Commission Fee',
    commission_desc: 'AndesMovi takes only a 7% platform fee per completed service (compared to 25%-30% charged by legacy apps). 93% net goes directly to the driver or merchant.',
    earnings: 'Total Earnings',
    expenses: 'Trip Expenses',
    withdrawals: 'Bank Payouts',
    withdraw_btn: 'Request Payout',
    recharge_btn: 'Top Up Balance',
    tx_history: 'Transaction History',
    bank_account: 'Ecuadorian Bank Account',
    select_bank: 'Select Bank or Credit Union',
    bank_pichincha: 'Banco Pichincha',
    bank_guayaquil: 'Banco Guayaquil',
    bank_produbanco: 'Produbanco',
    bank_jep: 'Cooperativa JEP',
    bank_pacifico: 'Banco del Pacífico',
    wallet_deuna: 'DeUna! (Pichincha)',

    // Vehicle
    vehicle_type: 'Vehicle Category',
    vehicle_model: 'Make & Model',
    vehicle_plate: 'License Plate (e.g. PBC-4921)',
    vehicle_color: 'Exterior Color',
    vehicle_year: 'Model Year',
    vehicle_rtv: 'Technical Inspection (RTV)',
    vehicle_status_verified: 'ANT Approved & Certified',

    // Security
    two_factor_auth: '2FA SMS Verification',
    safety_pins: 'Trip Safety PIN Codes',
    emergency_contacts: 'Emergency Contacts (ECU 911)',
    change_password: 'Change Password',

    // Language selection info
    kichwa_badge: 'Native Kichwa / Quechua supported for Andean highlands!',
  },
  pt: {
    // Navigation & General
    settings: 'Configurações',
    profile: 'Perfil do Usuário',
    digital_wallet: 'Carteira Digital',
    language: 'Idioma e Região',
    notifications: 'Notificações',
    security: 'Segurança e Privacidade',
    payment_methods: 'Métodos de Pagamento',
    vehicle_data: 'Dados do Veículo',
    service_history: 'Histórico de Serviços',
    help_support: 'Ajuda e Suporte',
    terms_conditions: 'Termos e Condições',
    privacy_policy: 'Política de Privacidade',
    logout: 'Sair da Conta',
    save_changes: 'Salvar Alterações',
    saved: 'Salvo!',
    cancel: 'Cancelar',
    close: 'Fechar',
    
    // Services
    rides: 'Corridas',
    delivery: 'Entregas',
    parcels: 'Encomendas',
    driver_mode: 'Modo Motorista',
    client_mode: 'Modo Passageiro',
    sos_button: 'Emergência SOS 911',
    scheduled: 'Agendados',
    history: 'Histórico',
    
    // Profile
    full_name: 'Nome Completo',
    avatar_photo: 'Foto do Perfil',
    phone_contact: 'Telefone de Contato',
    email_address: 'E-mail',
    cedula_id: 'Documento / Cédula',
    province_city: 'Província / Cidade',
    verified_identity: 'Identidade Verificada no Registro Civil',
    change_photo: 'Alterar Foto',

    // Wallet & 7% Commission
    available_balance: 'Saldo Disponível',
    driver_wallet_title: 'Carteira Digital do Motorista (7%)',
    driver_only_wallet_notice: 'Apenas o motorista possui carteira digital para recebimentos, taxa justa de 7% e resgates bancários. O passageiro paga em dinheiro ou transferência.',
    client_payment_rule: 'O cliente paga em dinheiro ou transferência bancária direta',
    cash_on_delivery: 'Em Dinheiro Vivo (Dólares USD)',
    bank_transfer_full: 'Transferência Bancária Direta / DeUna! (Ao Motorista)',
    commission_badge: 'Menor taxa do Equador (Apenas 7%)',
    commission_title: 'Comissão Justa de 7%',
    commission_desc: 'AndesMovi retém apenas 7% por corrida ou entrega. 93% líquido fica diretamente com o motorista ou comerciante.',
    earnings: 'Ganhos Totais',
    expenses: 'Gastos em Serviços',
    withdrawals: 'Resgates Bancários',
    withdraw_btn: 'Solicitar Saque',
    recharge_btn: 'Recarregar Saldo',
    tx_history: 'Histórico de Transações',
    bank_account: 'Conta Bancária Equador',
    select_bank: 'Selecionar Banco',
    bank_pichincha: 'Banco Pichincha',
    bank_guayaquil: 'Banco Guayaquil',
    bank_produbanco: 'Produbanco',
    bank_jep: 'Cooperativa JEP',
    bank_pacifico: 'Banco del Pacífico',
    wallet_deuna: 'DeUna! (Pichincha)',

    // Vehicle
    vehicle_type: 'Tipo de Veículo',
    vehicle_model: 'Marca e Modelo',
    vehicle_plate: 'Placa (Ex: PBC-4921)',
    vehicle_color: 'Cor do Veículo',
    vehicle_year: 'Ano do Modelo',
    vehicle_rtv: 'Inspeção Veicular (RTV)',
    vehicle_status_verified: 'Aprovado pela ANT',

    // Security
    two_factor_auth: 'Verificação 2FA por SMS',
    safety_pins: 'Código PIN de Segurança',
    emergency_contacts: 'Contatos de Emergência (ECU 911)',
    change_password: 'Alterar Senha',

    // Language selection info
    kichwa_badge: 'Kichwa / Quechua disponível para a região andina!',
  },
};

export const getStoredLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') return 'es';
  const saved = localStorage.getItem('andesmovi_lang') as LanguageCode;
  if (saved && TRANSLATIONS[saved]) return saved;
  return 'es';
};

export const saveStoredLanguage = (lang: LanguageCode): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('andesmovi_lang', lang);
  }
};

export const getTranslation = (key: string, lang: LanguageCode = 'es'): string => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.es[key] || key;
};

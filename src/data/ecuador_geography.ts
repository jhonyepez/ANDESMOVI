
export interface ProvinceWithCantons {
  province: string;
  cantons: string[];
}

export interface EcuadorLocationCoord {
  lat: number;
  lng: number;
  province: string;
  canton: string;
  name: string;
  address: string;
}

export const ECUADOR_GEOGRAPHY: ProvinceWithCantons[] = [
  { province: 'Azuay', cantons: ['Cuenca', 'Gualaceo', 'Paute', 'Santa Isabel', 'Nabón', 'Girón', 'Chordeleg', 'Sigsig', 'Pucará', 'Oña', 'El Pan', 'Guachapala', 'Sevilla de Oro', 'San Fernando', 'Ponce Enríquez'] },
  { province: 'Bolívar', cantons: ['Guaranda', 'Chillanes', 'Chimbo', 'Echeandía', 'San Miguel', 'Caluma', 'Las Naves'] },
  { province: 'Cañar', cantons: ['Azogues', 'Cañar', 'La Troncal', 'Biblián', 'El Tambo', 'Déleg', 'Suscal'] },
  { province: 'Carchi', cantons: ['Tulcán', 'Montúfar', 'Mira', 'Bolívar', 'Espejo', 'San Pedro de Huaca'] },
  { province: 'Chimborazo', cantons: ['Riobamba', 'Guano', 'Colta', 'Chambo', 'Pallatanga', 'Chunchi', 'Alausí', 'Cumandá', 'Penipe', 'Guamote'] },
  { province: 'Cotopaxi', cantons: ['Latacunga', 'Pujilí', 'Salcedo', 'Saquisilí', 'La Maná', 'Pangua', 'Sigchos'] },
  { province: 'El Oro', cantons: ['Machala', 'Pasaje', 'Santa Rosa', 'Huaquillas', 'Arenillas', 'El Guabo', 'Piñas', 'Zaruma', 'Portovelo', 'Atahualpa', 'Balsas', 'Marcabelí', 'Las Lajas', 'Chilla'] },
  { province: 'Esmeraldas', cantons: ['Esmeraldas', 'Rioverde', 'Atacames', 'Muisne', 'Quinindé', 'San Lorenzo', 'Eloy Alfaro'] },
  { province: 'Galápagos', cantons: ['Santa Cruz', 'San Cristóbal', 'Isabela'] },
  { province: 'Guayas', cantons: ['Guayaquil', 'Daule', 'Durán', 'Milagro', 'Samborondón', 'El Empalme', 'Balzar', 'El Triunfo', 'Naranjal', 'Nobol', 'Yaguachi', 'Playas', 'Naranjito', 'Colimes', 'Balao', 'Salitre', 'Lomas de Sargentillo', 'Pedro Carbo', 'Simón Bolívar', 'Marcelino Maridueño', 'Palestina', 'Santa Lucía', 'Isidro Ayora', 'Alfredo Baquerizo Moreno', 'General Antonio Elizalde (Bucay)'] },
  { province: 'Imbabura', cantons: ['Ibarra', 'Otavalo', 'Cotacachi', 'Antonio Ante', 'Pimampiro', 'San Miguel de Urcuquí'] },
  { province: 'Loja', cantons: ['Loja', 'Catamayo', 'Celica', 'Chaguarpamba', 'Espíndola', 'Gonzanamá', 'Macará', 'Paltas', 'Puyango', 'Saraguro', 'Sozoranga', 'Zapotillo', 'Pindal', 'Olmedo', 'Quilanga', 'Calvas'] },
  { province: 'Los Ríos', cantons: ['Babahoyo', 'Quevedo', 'Ventanas', 'Vinces', 'Buena Fe', 'Puebloviejo', 'Valencia', 'Mocache', 'Montalvo', 'Baba', 'Palenque', 'Urdaneta', 'Quinsaloma'] },
  { province: 'Manabí', cantons: ['Portoviejo', 'Manta', 'Chone', 'El Carmen', 'Jipijapa', 'Montecristi', 'Sucre', 'Santa Ana', 'Bolívar', 'Tosagua', 'Paján', 'Flavio Alfaro', 'San Vicente', 'Pedernales', 'Junín', 'Puerto López', 'Veinticuatro de Mayo', 'Jama', 'Olmedo', 'Pichincha', 'Jaramijó', 'Salango'] },
  { province: 'Morona Santiago', cantons: ['Macas', 'Sucúa', 'Gualaquiza', 'Limón Indanza', 'Santiago', 'Logroño', 'Taisha', 'Palora', 'Huamboya', 'San Juan Bosco', 'Tiwintza'] },
  { province: 'Napo', cantons: ['Tena', 'Archidona', 'El Chaco', 'Quijos', 'Carlos Julio Arosemena Tola'] },
  { province: 'Orellana', cantons: ['El Coca', 'Aguarico', 'La Joya de los Sachas', 'Loreto'] },
  { province: 'Pastaza', cantons: ['Puyo', 'Mera', 'Santa Clara', 'Arajuno'] },
  { province: 'Pichincha', cantons: ['Quito', 'Rumiñahui', 'Mejía', 'Cayambe', 'Pedro Moncayo', 'Puerto Quito', 'San Miguel de los Bancos', 'Pedro Vicente Maldonado'] },
  { province: 'Santa Elena', cantons: ['Santa Elena', 'La Libertad', 'Salinas'] },
  { province: 'Santo Domingo de los Tsáchilas', cantons: ['Santo Domingo', 'La Concordia'] },
  { province: 'Sucumbíos', cantons: ['Nueva Loja (Lago Agrio)', 'Cascales', 'Cuyabeno', 'Gonzalo Pizarro', 'Putumayo', 'Shushufindi', 'Sucumbíos'] },
  { province: 'Tungurahua', cantons: ['Ambato', 'Baños', 'Píllaro', 'Patate', 'Pelileo', 'Cevallos', 'Quero', 'Mocha', 'Tisaleo', 'Pueblo Viejo'] },
  { province: 'Zamora Chinchipe', cantons: ['Zamora', 'Yantzaza', 'Centinela del Cóndor', 'El Pangui', 'Nangaritza', 'Palanda', 'Chinchipe', 'Paquisha', 'Yacuambi'] }
];

export const ECUADOR_PROVINCE_COORDINATES: Record<string, EcuadorLocationCoord> = {
  carchi: { lat: 0.8122, lng: -77.7175, province: 'Carchi', canton: 'Tulcán', name: 'Tulcán (Carchi)', address: 'Tulcán, Carchi, Ecuador' },
  imbabura: { lat: 0.3517, lng: -78.1223, province: 'Imbabura', canton: 'Ibarra', name: 'Ibarra (Imbabura)', address: 'Ibarra, Imbabura, Ecuador' },
  pichincha: { lat: -0.1807, lng: -78.4678, province: 'Pichincha', canton: 'Quito', name: 'Quito (Pichincha)', address: 'Quito, Pichincha, Ecuador' },
  cotopaxi: { lat: -0.9345, lng: -78.6189, province: 'Cotopaxi', canton: 'Latacunga', name: 'Latacunga (Cotopaxi)', address: 'Latacunga, Cotopaxi, Ecuador' },
  tungurahua: { lat: -1.2491, lng: -78.6168, province: 'Tungurahua', canton: 'Ambato', name: 'Ambato (Tungurahua)', address: 'Ambato, Tungurahua, Ecuador' },
  chimborazo: { lat: -1.6635, lng: -78.6546, province: 'Chimborazo', canton: 'Riobamba', name: 'Riobamba (Chimborazo)', address: 'Riobamba, Chimborazo, Ecuador' },
  bolivar: { lat: -1.5912, lng: -79.0041, province: 'Bolívar', canton: 'Guaranda', name: 'Guaranda (Bolívar)', address: 'Guaranda, Bolívar, Ecuador' },
  canar: { lat: -2.7412, lng: -78.8475, province: 'Cañar', canton: 'Azogues', name: 'Azogues (Cañar)', address: 'Azogues, Cañar, Ecuador' },
  azuay: { lat: -2.8974, lng: -79.0044, province: 'Azuay', canton: 'Cuenca', name: 'Cuenca (Azuay)', address: 'Cuenca, Azuay, Ecuador' },
  loja: { lat: -3.9931, lng: -79.2042, province: 'Loja', canton: 'Loja', name: 'Loja (Loja)', address: 'Loja, Loja, Ecuador' },
  esmeraldas: { lat: 0.9589, lng: -79.6631, province: 'Esmeraldas', canton: 'Esmeraldas', name: 'Esmeraldas (Esmeraldas)', address: 'Esmeraldas, Ecuador' },
  manabi: { lat: -0.9677, lng: -80.7089, province: 'Manabí', canton: 'Manta', name: 'Manta / Portoviejo (Manabí)', address: 'Manta, Manabí, Ecuador' },
  santodomingo: { lat: -0.2530, lng: -79.1754, province: 'Santo Domingo de los Tsáchilas', canton: 'Santo Domingo', name: 'Santo Domingo', address: 'Santo Domingo, Ecuador' },
  losrios: { lat: -1.8021, lng: -79.5342, province: 'Los Ríos', canton: 'Babahoyo', name: 'Babahoyo / Quevedo (Los Ríos)', address: 'Los Ríos, Ecuador' },
  guayas: { lat: -2.1894, lng: -79.8833, province: 'Guayas', canton: 'Guayaquil', name: 'Guayaquil (Guayas)', address: 'Guayaquil, Guayas, Ecuador' },
  santaelena: { lat: -2.2281, lng: -80.8542, province: 'Santa Elena', canton: 'Santa Elena', name: 'Santa Elena / Salinas', address: 'Santa Elena, Ecuador' },
  eloro: { lat: -3.2581, lng: -79.9553, province: 'El Oro', canton: 'Machala', name: 'Machala (El Oro)', address: 'Machala, El Oro, Ecuador' },
  sucumbios: { lat: 0.0894, lng: -76.8851, province: 'Sucumbíos', canton: 'Nueva Loja (Lago Agrio)', name: 'Lago Agrio (Sucumbíos)', address: 'Nueva Loja, Sucumbíos, Ecuador' },
  orellana: { lat: -0.4678, lng: -76.9892, province: 'Orellana', canton: 'El Coca', name: 'El Coca (Orellana)', address: 'El Coca, Orellana, Ecuador' },
  napo: { lat: -0.9945, lng: -77.8132, province: 'Napo', canton: 'Tena', name: 'Tena (Napo)', address: 'Tena, Napo, Ecuador' },
  pastaza: { lat: -1.4875, lng: -77.9982, province: 'Pastaza', canton: 'Puyo', name: 'Puyo (Pastaza)', address: 'Puyo, Pastaza, Ecuador' },
  moronasantiago: { lat: -2.3089, lng: -78.1189, province: 'Morona Santiago', canton: 'Macas', name: 'Macas (Morona Santiago)', address: 'Macas, Morona Santiago, Ecuador' },
  zamorachinchipe: { lat: -4.0689, lng: -78.9561, province: 'Zamora Chinchipe', canton: 'Zamora', name: 'Zamora (Zamora Chinchipe)', address: 'Zamora, Zamora Chinchipe, Ecuador' },
  galapagos: { lat: -0.9022, lng: -89.6094, province: 'Galápagos', canton: 'San Cristóbal', name: 'San Cristóbal / Santa Cruz (Galápagos)', address: 'Galápagos, Ecuador' },
};

export const ECUADOR_CANTON_COORDINATES: Record<string, EcuadorLocationCoord> = {
  // Pichincha
  cayambe: { lat: 0.0425, lng: -78.1458, province: 'Pichincha', canton: 'Cayambe', name: 'Cayambe (Pichincha)', address: 'Parque Central, Cayambe, Pichincha' },
  quito: { lat: -0.1807, lng: -78.4678, province: 'Pichincha', canton: 'Quito', name: 'Quito (Pichincha)', address: 'Av. Amazonas y Naciones Unidas, Quito' },
  ruminahui: { lat: -0.3347, lng: -78.4489, province: 'Pichincha', canton: 'Rumiñahui', name: 'Sangolquí / Rumiñahui', address: 'Plaza Central de Sangolquí, Pichincha' },
  sangolqui: { lat: -0.3347, lng: -78.4489, province: 'Pichincha', canton: 'Rumiñahui', name: 'Sangolquí / Rumiñahui', address: 'Plaza Central de Sangolquí, Pichincha' },
  mejia: { lat: -0.5103, lng: -78.5672, province: 'Pichincha', canton: 'Mejía', name: 'Machachi / Mejía', address: 'Machachi, Mejía, Pichincha' },
  machachi: { lat: -0.5103, lng: -78.5672, province: 'Pichincha', canton: 'Mejía', name: 'Machachi / Mejía', address: 'Machachi, Mejía, Pichincha' },
  pedromoncayo: { lat: 0.0469, lng: -78.2192, province: 'Pichincha', canton: 'Pedro Moncayo', name: 'Tabacundo / Pedro Moncayo', address: 'Tabacundo, Pichincha' },
  tabacundo: { lat: 0.0469, lng: -78.2192, province: 'Pichincha', canton: 'Pedro Moncayo', name: 'Tabacundo / Pedro Moncayo', address: 'Tabacundo, Pichincha' },
  puertoquito: { lat: 0.1214, lng: -79.2558, province: 'Pichincha', canton: 'Puerto Quito', name: 'Puerto Quito', address: 'Puerto Quito, Pichincha' },
  sanmigueldelosbancos: { lat: 0.0219, lng: -78.8953, province: 'Pichincha', canton: 'San Miguel de los Bancos', name: 'Los Bancos', address: 'San Miguel de los Bancos, Pichincha' },

  // Imbabura
  otavalo: { lat: 0.2346, lng: -78.2625, province: 'Imbabura', canton: 'Otavalo', name: 'Otavalo (Imbabura)', address: 'Plaza de Ponchos, Otavalo, Imbabura' },
  ibarra: { lat: 0.3517, lng: -78.1223, province: 'Imbabura', canton: 'Ibarra', name: 'Ibarra (Imbabura)', address: 'Parque Pedro Moncayo, Ibarra, Imbabura' },
  cotacachi: { lat: 0.3012, lng: -78.2662, province: 'Imbabura', canton: 'Cotacachi', name: 'Cotacachi (Imbabura)', address: 'Cotacachi, Imbabura' },
  antonioante: { lat: 0.3333, lng: -78.2167, province: 'Imbabura', canton: 'Antonio Ante', name: 'Atuntaqui / Antonio Ante', address: 'Atuntaqui, Imbabura' },
  atuntaqui: { lat: 0.3333, lng: -78.2167, province: 'Imbabura', canton: 'Antonio Ante', name: 'Atuntaqui / Antonio Ante', address: 'Atuntaqui, Imbabura' },
  pimampiro: { lat: 0.3958, lng: -77.9406, province: 'Imbabura', canton: 'Pimampiro', name: 'Pimampiro', address: 'Pimampiro, Imbabura' },
  urcuqui: { lat: 0.4194, lng: -78.1925, province: 'Imbabura', canton: 'Urcuquí', name: 'Yachay / Urcuquí', address: 'Urcuquí, Imbabura' },

  // Carchi
  tulcan: { lat: 0.8122, lng: -77.7175, province: 'Carchi', canton: 'Tulcán', name: 'Tulcán (Carchi)', address: 'Parque Principal, Tulcán, Carchi' },
  montufar: { lat: 0.5956, lng: -77.8306, province: 'Carchi', canton: 'Montúfar', name: 'San Gabriel / Montúfar', address: 'San Gabriel, Montúfar, Carchi' },
  sangabriel: { lat: 0.5956, lng: -77.8306, province: 'Carchi', canton: 'Montúfar', name: 'San Gabriel / Montúfar', address: 'San Gabriel, Montúfar, Carchi' },
  mira: { lat: 0.5519, lng: -78.0417, province: 'Carchi', canton: 'Mira', name: 'Mira (Carchi)', address: 'Mira, Carchi' },
  espejo: { lat: 0.6558, lng: -77.9753, province: 'Carchi', canton: 'Espejo', name: 'El Ángel / Espejo', address: 'El Ángel, Carchi' },
  elangel: { lat: 0.6558, lng: -77.9753, province: 'Carchi', canton: 'Espejo', name: 'El Ángel / Espejo', address: 'El Ángel, Carchi' },
  bolivarcarchi: { lat: 0.5056, lng: -77.9042, province: 'Carchi', canton: 'Bolívar', name: 'Bolívar (Carchi)', address: 'Bolívar, Carchi' },
  huaca: { lat: 0.6358, lng: -77.7289, province: 'Carchi', canton: 'San Pedro de Huaca', name: 'Huaca (Carchi)', address: 'San Pedro de Huaca, Carchi' },

  // Guayas
  guayaquil: { lat: -2.1894, lng: -79.8833, province: 'Guayas', canton: 'Guayaquil', name: 'Guayaquil (Guayas)', address: 'Malecón 2000, Guayaquil, Guayas' },
  samborondon: { lat: -2.1450, lng: -79.8650, province: 'Guayas', canton: 'Samborondón', name: 'Samborondón (Guayas)', address: 'La Puntilla, Samborondón, Guayas' },
  duran: { lat: -2.1712, lng: -79.8517, province: 'Guayas', canton: 'Durán', name: 'Durán (Guayas)', address: 'Durán, Guayas' },
  daule: { lat: -1.8667, lng: -79.9833, province: 'Guayas', canton: 'Daule', name: 'La Aurora / Daule', address: 'Daule, Guayas' },
  milagro: { lat: -2.1333, lng: -79.5833, province: 'Guayas', canton: 'Milagro', name: 'Milagro (Guayas)', address: 'Milagro, Guayas' },
  playas: { lat: -2.6319, lng: -80.3881, province: 'Guayas', canton: 'Playas', name: 'Playas (General Villamil)', address: 'Playas, Guayas' },

  // Azuay
  cuenca: { lat: -2.8974, lng: -79.0044, province: 'Azuay', canton: 'Cuenca', name: 'Cuenca (Azuay)', address: 'Parque Calderón, Cuenca, Azuay' },
  gualaceo: { lat: -2.8917, lng: -78.7806, province: 'Azuay', canton: 'Gualaceo', name: 'Gualaceo (Azuay)', address: 'Gualaceo, Azuay' },
  paute: { lat: -2.7778, lng: -78.7583, province: 'Azuay', canton: 'Paute', name: 'Paute (Azuay)', address: 'Paute, Azuay' },
  santaisabel: { lat: -3.2750, lng: -79.3167, province: 'Azuay', canton: 'Santa Isabel', name: 'Santa Isabel (Azuay)', address: 'Santa Isabel, Azuay' },

  // Tungurahua
  ambato: { lat: -1.2491, lng: -78.6168, province: 'Tungurahua', canton: 'Ambato', name: 'Ambato (Tungurahua)', address: 'Parque Montalvo, Ambato, Tungurahua' },
  banos: { lat: -1.3964, lng: -78.4247, province: 'Tungurahua', canton: 'Baños de Agua Santa', name: 'Baños (Tungurahua)', address: 'Baños de Agua Santa, Tungurahua' },
  pelileo: { lat: -1.3303, lng: -78.5442, province: 'Tungurahua', canton: 'Pelileo', name: 'Pelileo (Tungurahua)', address: 'Pelileo, Tungurahua' },
  pillaro: { lat: -1.1717, lng: -78.5397, province: 'Tungurahua', canton: 'Píllaro', name: 'Píllaro (Tungurahua)', address: 'Píllaro, Tungurahua' },

  // Cotopaxi
  latacunga: { lat: -0.9345, lng: -78.6189, province: 'Cotopaxi', canton: 'Latacunga', name: 'Latacunga (Cotopaxi)', address: 'Parque Vicente León, Latacunga, Cotopaxi' },
  salcedo: { lat: -1.0456, lng: -78.5897, province: 'Cotopaxi', canton: 'Salcedo', name: 'Salcedo (Cotopaxi)', address: 'Salcedo, Cotopaxi' },
  pujili: { lat: -0.9575, lng: -78.6947, province: 'Cotopaxi', canton: 'Pujilí', name: 'Pujilí (Cotopaxi)', address: 'Pujilí, Cotopaxi' },
  saquisili: { lat: -0.8389, lng: -78.6653, province: 'Cotopaxi', canton: 'Saquisilí', name: 'Saquisilí (Cotopaxi)', address: 'Saquisilí, Cotopaxi' },

  // Chimborazo
  riobamba: { lat: -1.6635, lng: -78.6546, province: 'Chimborazo', canton: 'Riobamba', name: 'Riobamba (Chimborazo)', address: 'Parque Maldonado, Riobamba, Chimborazo' },
  guano: { lat: -1.6067, lng: -78.6361, province: 'Chimborazo', canton: 'Guano', name: 'Guano (Chimborazo)', address: 'Guano, Chimborazo' },
  alausi: { lat: -2.2039, lng: -78.8475, province: 'Chimborazo', canton: 'Alausí', name: 'Alausí (Chimborazo)', address: 'Alausí, Chimborazo' },

  // Manabí
  manta: { lat: -0.9677, lng: -80.7089, province: 'Manabí', canton: 'Manta', name: 'Manta (Manabí)', address: 'Playa El Murciélago, Manta, Manabí' },
  portoviejo: { lat: -1.0544, lng: -80.4544, province: 'Manabí', canton: 'Portoviejo', name: 'Portoviejo (Manabí)', address: 'Parque Central, Portoviejo, Manabí' },
  chone: { lat: -0.6981, lng: -80.0936, province: 'Manabí', canton: 'Chone', name: 'Chone (Manabí)', address: 'Chone, Manabí' },
  montecristi: { lat: -1.0442, lng: -80.6586, province: 'Manabí', canton: 'Montecristi', name: 'Montecristi (Manabí)', address: 'Montecristi, Manabí' },

  // Santo Domingo
  santodomingo: { lat: -0.2530, lng: -79.1754, province: 'Santo Domingo de los Tsáchilas', canton: 'Santo Domingo', name: 'Santo Domingo', address: 'Parque Zaracay, Santo Domingo' },
  laconcordia: { lat: 0.0069, lng: -79.3958, province: 'Santo Domingo de los Tsáchilas', canton: 'La Concordia', name: 'La Concordia', address: 'La Concordia, Santo Domingo' },

  // El Oro
  machala: { lat: -3.2581, lng: -79.9553, province: 'El Oro', canton: 'Machala', name: 'Machala (El Oro)', address: 'Machala, El Oro' },
  pasaje: { lat: -3.3267, lng: -79.8058, province: 'El Oro', canton: 'Pasaje', name: 'Pasaje (El Oro)', address: 'Pasaje, El Oro' },
  santarosa: { lat: -3.4489, lng: -79.9594, province: 'El Oro', canton: 'Santa Rosa', name: 'Santa Rosa (El Oro)', address: 'Santa Rosa, El Oro' },
  huaquillas: { lat: -3.4753, lng: -80.2311, province: 'El Oro', canton: 'Huaquillas', name: 'Huaquillas (El Oro)', address: 'Huaquillas, El Oro' },

  // Loja
  loja: { lat: -3.9931, lng: -79.2042, province: 'Loja', canton: 'Loja', name: 'Loja (Loja)', address: 'Parque Central, Loja' },
  catamayo: { lat: -3.9875, lng: -79.3589, province: 'Loja', canton: 'Catamayo', name: 'Catamayo (Loja)', address: 'Catamayo, Loja' },

  // Esmeraldas
  esmeraldas: { lat: 0.9589, lng: -79.6631, province: 'Esmeraldas', canton: 'Esmeraldas', name: 'Esmeraldas (Esmeraldas)', address: 'Malecón Las Palmas, Esmeraldas' },
  atacames: { lat: 0.8697, lng: -79.8458, province: 'Esmeraldas', canton: 'Atacames', name: 'Atacames (Esmeraldas)', address: 'Playa de Atacames, Esmeraldas' },

  // Los Ríos
  babahoyo: { lat: -1.8021, lng: -79.5342, province: 'Los Ríos', canton: 'Babahoyo', name: 'Babahoyo (Los Ríos)', address: 'Babahoyo, Los Ríos' },
  quevedo: { lat: -1.0286, lng: -79.4635, province: 'Los Ríos', canton: 'Quevedo', name: 'Quevedo (Los Ríos)', address: 'Quevedo, Los Ríos' },

  // Oriente
  sucumbios: { lat: 0.0894, lng: -76.8851, province: 'Sucumbíos', canton: 'Nueva Loja (Lago Agrio)', name: 'Lago Agrio (Sucumbíos)', address: 'Nueva Loja, Sucumbíos' },
  lagoagrio: { lat: 0.0894, lng: -76.8851, province: 'Sucumbíos', canton: 'Nueva Loja (Lago Agrio)', name: 'Lago Agrio (Sucumbíos)', address: 'Nueva Loja, Sucumbíos' },
  nuevaloja: { lat: 0.0894, lng: -76.8851, province: 'Sucumbíos', canton: 'Nueva Loja (Lago Agrio)', name: 'Lago Agrio (Sucumbíos)', address: 'Nueva Loja, Sucumbíos' },
  orellana: { lat: -0.4678, lng: -76.9892, province: 'Orellana', canton: 'El Coca', name: 'El Coca (Orellana)', address: 'Puerto Francisco de Orellana' },
  elcoca: { lat: -0.4678, lng: -76.9892, province: 'Orellana', canton: 'El Coca', name: 'El Coca (Orellana)', address: 'Puerto Francisco de Orellana' },
  puyo: { lat: -1.4875, lng: -77.9982, province: 'Pastaza', canton: 'Puyo', name: 'Puyo (Pastaza)', address: 'Puyo, Pastaza' },
  tena: { lat: -0.9945, lng: -77.8132, province: 'Napo', canton: 'Tena', name: 'Tena (Napo)', address: 'Tena, Napo' },
  macas: { lat: -2.3089, lng: -78.1189, province: 'Morona Santiago', canton: 'Macas', name: 'Macas (Morona Santiago)', address: 'Macas, Morona Santiago' },
  zamora: { lat: -4.0689, lng: -78.9561, province: 'Zamora Chinchipe', canton: 'Zamora', name: 'Zamora (Zamora Chinchipe)', address: 'Zamora, Zamora Chinchipe' },

  // Santa Elena & Galápagos
  salinas: { lat: -2.2281, lng: -80.8542, province: 'Santa Elena', canton: 'Salinas', name: 'Salinas / Santa Elena', address: 'Malecón de Salinas, Santa Elena' },
  santaelena: { lat: -2.2281, lng: -80.8542, province: 'Santa Elena', canton: 'Santa Elena', name: 'Santa Elena / Salinas', address: 'Santa Elena, Ecuador' },
  sancristobal: { lat: -0.9022, lng: -89.6094, province: 'Galápagos', canton: 'San Cristóbal', name: 'San Cristóbal (Galápagos)', address: 'Puerto Baquerizo Moreno' },
  santacruz: { lat: -0.7439, lng: -90.3136, province: 'Galápagos', canton: 'Santa Cruz', name: 'Puerto Ayora (Santa Cruz, Galápagos)', address: 'Puerto Ayora, Galápagos' },
};

export function getCantonsForProvince(provinceName: string): string[] {
  if (!provinceName) return ['Quito', 'Cayambe', 'Rumiñahui', 'Mejía'];
  const clean = normalizeString(provinceName);
  const found = ECUADOR_GEOGRAPHY.find((g) => normalizeString(g.province).includes(clean) || clean.includes(normalizeString(g.province)));
  return found ? found.cantons : ['Centro', 'Norte', 'Sur'];
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Retorna las coordenadas geográficas del centro del cantón/provincia registrado por el usuario
 * para que el mapa se adapte automáticamente sin que cliente ni conductor tengan que buscarlo.
 */
export function getCoordinatesForEcuadorProvince(
  searchStr?: string,
  cantonStr?: string
): { lat: number; lng: number; name: string; address: string } {
  const combined = `${searchStr || ''} ${cantonStr || ''}`.trim();
  if (!combined) {
    return {
      lat: 0.8122,
      lng: -77.7175,
      name: 'Tulcán (Carchi) - Matriz Nacional',
      address: 'Provincia de Carchi, Tulcán, Ecuador',
    };
  }

  const clean = normalizeString(combined);

  // 1. Direct match in precise canton coordinates
  for (const [cantonKey, item] of Object.entries(ECUADOR_CANTON_COORDINATES)) {
    if (clean.includes(cantonKey) || cantonKey.includes(clean)) {
      return {
        lat: item.lat,
        lng: item.lng,
        name: item.name,
        address: item.address,
      };
    }
  }

  // 2. Direct match in province coordinates
  for (const [key, item] of Object.entries(ECUADOR_PROVINCE_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return {
        lat: item.lat,
        lng: item.lng,
        name: item.name,
        address: item.address,
      };
    }
  }

  // 3. City / Canton match aliases
  const cantonAliasMap: Record<string, string> = {
    quito: 'pichincha',
    carcelen: 'pichincha',
    quitumbe: 'pichincha',
    cumbaya: 'pichincha',
    tumbaco: 'pichincha',
    cayambe: 'cayambe',
    mejia: 'mejia',
    machachi: 'machachi',
    ruminahui: 'ruminahui',
    sangolqui: 'sangolqui',
    guayaquil: 'guayaquil',
    duran: 'duran',
    samborondon: 'samborondon',
    milagro: 'milagro',
    daule: 'daule',
    cuenca: 'cuenca',
    gualaceo: 'gualaceo',
    paute: 'paute',
    manta: 'manta',
    portoviejo: 'portoviejo',
    chone: 'chone',
    montecristi: 'montecristi',
    ibarra: 'ibarra',
    otavalo: 'otavalo',
    cotacachi: 'cotacachi',
    tulcan: 'tulcan',
    sangabriel: 'sangabriel',
    montufar: 'montufar',
    mira: 'mira',
    ambato: 'ambato',
    banos: 'banos',
    pelileo: 'pelileo',
    latacunga: 'latacunga',
    salcedo: 'salcedo',
    pujili: 'pujili',
    riobamba: 'riobamba',
    guano: 'guano',
    machala: 'machala',
    pasaje: 'pasaje',
    santarosa: 'santarosa',
    huaquillas: 'huaquillas',
    loja: 'loja',
    catamayo: 'catamayo',
    santodomingo: 'santodomingo',
    laconcordia: 'laconcordia',
    babahoyo: 'babahoyo',
    quevedo: 'quevedo',
    ventanas: 'losrios',
    esmeraldas: 'esmeraldas',
    atacames: 'atacames',
    lagoagrio: 'lagoagrio',
    nuevaloja: 'nuevaloja',
    shushufindi: 'sucumbios',
    elcoca: 'elcoca',
    puyo: 'puyo',
    tena: 'tena',
    macas: 'macas',
    zamora: 'zamora',
    guaranda: 'bolivar',
    azogues: 'canar',
    latroncal: 'canar',
    salinas: 'salinas',
    lalibertad: 'salinas',
    santacruz: 'santacruz',
    sancristobal: 'sancristobal',
  };

  for (const [cantonKey, targetKey] of Object.entries(cantonAliasMap)) {
    if (clean.includes(cantonKey)) {
      const cantonMatch = ECUADOR_CANTON_COORDINATES[targetKey];
      if (cantonMatch) {
        return {
          lat: cantonMatch.lat,
          lng: cantonMatch.lng,
          name: cantonMatch.name,
          address: cantonMatch.address,
        };
      }
      const match = ECUADOR_PROVINCE_COORDINATES[targetKey];
      if (match) {
        return {
          lat: match.lat,
          lng: match.lng,
          name: match.name,
          address: match.address,
        };
      }
    }
  }

  // Fallback to Carchi default
  return {
    lat: 0.8122,
    lng: -77.7175,
    name: 'Tulcán (Carchi) - Matriz Nacional',
    address: 'Provincia de Carchi, Tulcán, Ecuador',
  };
}

/**
 * Retorna ubicaciones y cantones populares adaptados a la provincia del usuario
 */
export function getPopularLocationsForProvince(provinceOrCanton?: string): { lat: number; lng: number; name: string; address: string }[] {
  const baseCoord = getCoordinatesForEcuadorProvince(provinceOrCanton);
  const clean = normalizeString(provinceOrCanton || '');

  // Sub-locations tailored per province
  if (clean.includes('guayas') || clean.includes('guayaquil')) {
    return [
      { lat: -2.1894, lng: -79.8833, name: 'Malecón 2000 (Guayaquil)', address: 'Av. Malecón Simón Bolívar' },
      { lat: -2.1558, lng: -79.8924, name: 'Aeropuerto J.J. de Olmedo (GYE)', address: 'Av. de las Américas' },
      { lat: -2.1450, lng: -79.8650, name: 'Samborondón Plaza', address: 'Av. Samborondón' },
      { lat: -2.1700, lng: -79.8500, name: 'Durán Terminal', address: 'Vía Durán-Tambo' },
    ];
  }

  if (clean.includes('pichincha') || clean.includes('quito')) {
    return [
      { lat: -0.1807, lng: -78.4678, name: 'Parque La Carolina / Quicentro', address: 'Av. Naciones Unidas y 6 de Diciembre' },
      { lat: -0.0984, lng: -78.4721, name: 'Terminal Terrestre Carcelén', address: 'Av. Galo Plaza Lasso y N74' },
      { lat: -0.2891, lng: -78.5492, name: 'Terminal Terrestre Quitumbe', address: 'Av. Cóndor Ñan' },
      { lat: -0.1292, lng: -78.3575, name: 'Aeropuerto Mariscal Sucre (Tababela)', address: 'Tababela, Quito' },
    ];
  }

  if (clean.includes('azuay') || clean.includes('cuenca')) {
    return [
      { lat: -2.8974, lng: -79.0044, name: 'Parque Calderón (Centro Cuenca)', address: 'Calle Benigno Malo y Sucre' },
      { lat: -2.8880, lng: -78.9950, name: 'Terminal Terrestre de Cuenca', address: 'Av. España y Sebastián de Benalcázar' },
      { lat: -2.9050, lng: -79.0150, name: 'Mall del Río (Cuenca)', address: 'Autopista Cuenca-Azogues' },
      { lat: -2.9000, lng: -78.7800, name: 'Gualaceo Centro', address: 'Cantón Gualaceo, Azuay' },
    ];
  }

  if (clean.includes('manabi') || clean.includes('manta') || clean.includes('portoviejo')) {
    return [
      { lat: -0.9677, lng: -80.7089, name: 'Playa El Murciélago (Manta)', address: 'Malecón Escénico, Manta' },
      { lat: -0.9500, lng: -80.7200, name: 'Terminal Terrestre Luis Valdivieso (Manta)', address: 'Vía Manta-Rocafuerte' },
      { lat: -1.0544, lng: -80.4544, name: 'Parque Central de Portoviejo', address: 'Calle Sucre y Morales, Portoviejo' },
      { lat: -1.0400, lng: -80.8200, name: 'Montecristi Ciudad Alfaro', address: 'Montecristi, Manabí' },
    ];
  }

  if (clean.includes('imbabura') || clean.includes('ibarra') || clean.includes('otavalo')) {
    return [
      { lat: 0.3517, lng: -78.1223, name: 'Parque Pedro Moncayo (Centro Ibarra)', address: 'Calle Bolívar y Sucre, Ibarra' },
      { lat: 0.3478, lng: -78.1189, name: 'Terminal Terrestre de Ibarra', address: 'Av. Teodoro Gómez de la Torre' },
      { lat: 0.2312, lng: -78.2612, name: 'Plaza de Ponchos / Terminal Otavalo', address: 'Calle Sucre y Quiroga, Otavalo' },
      { lat: 0.3015, lng: -78.1980, name: 'Atuntaqui (Antonio Ante)', address: 'Atuntaqui, Imbabura' },
    ];
  }

  if (clean.includes('tungurahua') || clean.includes('ambato')) {
    return [
      { lat: -1.2491, lng: -78.6168, name: 'Parque Montalvo (Centro Ambato)', address: 'Calle Bolívar y Castillo, Ambato' },
      { lat: -1.2650, lng: -78.6300, name: 'Terminal Terrestre Ingahurco (Ambato)', address: 'Av. Las Américas, Ambato' },
      { lat: -1.3964, lng: -78.4247, name: 'Baños de Agua Santa', address: 'Cantón Baños, Tungurahua' },
      { lat: -1.2950, lng: -78.5400, name: 'Pelileo Centro', address: 'Pelileo, Tungurahua' },
    ];
  }

  // Default: Carchi / Sierra Norte hubs
  return [
    { lat: 0.8119, lng: -77.7173, name: 'Terminal Terrestre de Tulcán (Carchi)', address: 'Av. Veintimilla y Fray Vacas Galindo, Tulcán' },
    { lat: 0.8125, lng: -77.7165, name: 'Parque Central de Tulcán', address: 'Calle Sucre y Bolívar, Tulcán' },
    { lat: 0.6015, lng: -77.8310, name: 'San Gabriel (Montúfar)', address: 'Cantón Montúfar, Carchi' },
    { ...baseCoord, name: `${baseCoord.name} - Hub Principal`, address: baseCoord.address },
  ];
}

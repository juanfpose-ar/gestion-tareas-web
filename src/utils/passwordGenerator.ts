const WORDS = [
  // Animales
  'gato', 'perro', 'pato', 'rana', 'toro', 'puma', 'loro', 'nutria',
  'paloma', 'garza', 'zorro', 'ciervo', 'conejo', 'tortuga', 'delfin',
  'ballena', 'aguila', 'liebre', 'castor', 'iguana', 'mulita',
  // Comida & bebida
  'mate', 'torta', 'helado', 'fideos', 'sopa', 'arroz', 'poroto',
  'tomate', 'queso', 'leche', 'mango', 'limon', 'naranja', 'durazno',
  'membrillo', 'cebolla', 'zapallo', 'acelga', 'remolacha', 'milanesa',
  'chipito', 'galletita', 'empanada', 'locro', 'asado',
  // Naturaleza
  'campo', 'monte', 'lago', 'cerro', 'playa', 'pampa', 'selva', 'valle',
  'piedra', 'arena', 'lluvia', 'viento', 'fuego', 'tierra', 'luna',
  'estrella', 'ceniza', 'temblor', 'nubado',
  // Lugares & objetos
  'cielo', 'flores', 'puerta', 'camino', 'bosque', 'jardin', 'parque',
  'barrio', 'palacio', 'cancha', 'pileta', 'portero', 'balcon',
  // Tiempo & estaciones
  'verano', 'invierno', 'primavera', 'otono', 'noche', 'tarde', 'manana',
  // Adjetivos
  'lindo', 'bueno', 'nuevo', 'viejo', 'chico', 'grande', 'feliz',
  'rapido', 'suave', 'verde', 'blanco', 'negro', 'fresco', 'dulce',
  'amargo', 'picante', 'liviano', 'pesado', 'redondo',
  // Acciones / estados
  'vuelo', 'salto', 'canto', 'baile', 'sonrisa', 'carrera', 'mirada',
  'charla', 'paseo', 'abrazo', 'festejo', 'palmera',
];

function applySubstitutions(word: string): string {
  return word
    .replace(/a/g, '4')
    .replace(/e/g, '3')
    .replace(/i/g, '1')
    .replace(/o/g, '0');
  // u stays as u (no number resemblance)
}

function pickTwo(): [string, string] {
  const i = Math.floor(Math.random() * WORDS.length);
  let j = Math.floor(Math.random() * (WORDS.length - 1));
  if (j >= i) j++;
  return [WORDS[i], WORDS[j]];
}

export interface GeneratedPassword {
  word1: string;
  word2: string;
  password: string;
}

function capitalizeFirstLetter(s: string): string {
  // The first char may be a number (vowel substituted). Find the first actual letter.
  const idx = s.search(/[a-z]/);
  if (idx === -1) return s;
  return s.slice(0, idx) + s[idx].toUpperCase() + s.slice(idx + 1);
}

export function generatePassword(): GeneratedPassword {
  const [word1, word2] = pickTwo();
  const sub1 = applySubstitutions(word1);
  const sub2 = applySubstitutions(word2);

  // Capitalize first lowercase letter (may not be index 0 if word starts with a vowel)
  // + hyphen as special char → all 5 password rules always met
  const password = capitalizeFirstLetter(sub1) + '-' + sub2;

  return { word1, word2, password };
}

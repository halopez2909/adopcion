const dogProfiles = [
  { name: 'Milo', age: '2 años', sex: 'Macho', size: 'Mediano', city: 'Ciudad de México', description: 'Juguetón, curioso y listo para acompañarte en tus paseos.' },
  { name: 'Luna', age: '1 año', sex: 'Hembra', size: 'Pequeña', city: 'Guadalajara', description: 'Una compañera dulce que disfruta los días tranquilos y las caricias.' },
  { name: 'Bruno', age: '3 años', sex: 'Macho', size: 'Grande', city: 'Monterrey', description: 'Leal y cariñoso; su plan favorito es estar cerca de su familia.' },
  { name: 'Nala', age: '8 meses', sex: 'Hembra', size: 'Mediana', city: 'Puebla', description: 'Llena de energía y entusiasmo, siempre encuentra motivos para jugar.' },
  { name: 'Toby', age: '4 años', sex: 'Macho', size: 'Pequeño', city: 'Mérida', description: 'Tranquilo y sociable, ideal para compartir tardes en casa.' },
  { name: 'Kira', age: '2 años', sex: 'Hembra', size: 'Mediana', city: 'Querétaro', description: 'Amigable y aventurera; le encantará descubrir lugares contigo.' },
  { name: 'Chispa', age: '1 año', sex: 'Hembra', size: 'Pequeña', city: 'León', description: 'Pequeña de tamaño, enorme de personalidad y cariño.' },
  { name: 'Rocky', age: '5 años', sex: 'Macho', size: 'Grande', city: 'Tijuana', description: 'Un grandote noble que busca un hogar donde descansar y ser querido.' },
];

const catProfiles = [
  { name: 'Misha', age: '1 año', sex: 'Hembra', size: 'Pequeña', city: 'Ciudad de México', description: 'Curiosa y tierna; le gusta observar el mundo desde un lugar cómodo.' },
  { name: 'Simón', age: '2 años', sex: 'Macho', size: 'Mediano', city: 'Guadalajara', description: 'Un compañero relajado que ronronea con facilidad.' },
  { name: 'Canela', age: '8 meses', sex: 'Hembra', size: 'Pequeña', city: 'Monterrey', description: 'Juguetona y dulce, está lista para llenar tu hogar de alegría.' },
  { name: 'Oliver', age: '3 años', sex: 'Macho', size: 'Mediano', city: 'Puebla', description: 'Sociable y cariñoso, disfruta compartir momentos a tu lado.' },
  { name: 'Frida', age: '4 años', sex: 'Hembra', size: 'Mediana', city: 'Mérida', description: 'Independiente y tranquila; sabe cómo hacer especial cualquier rincón.' },
  { name: 'Coco', age: '1 año', sex: 'Macho', size: 'Pequeño', city: 'Querétaro', description: 'Un explorador encantador que luego de jugar busca una buena siesta.' },
  { name: 'Mora', age: '2 años', sex: 'Hembra', size: 'Pequeña', city: 'León', description: 'Gentil y observadora; solo necesita tiempo y mucho cariño.' },
  { name: 'Tigre', age: '5 años', sex: 'Macho', size: 'Grande', city: 'Tijuana', description: 'Un gato noble y sereno que busca un lugar seguro para descansar.' },
];

async function getImageUrls(url, readUrls, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`El servicio respondió con el estado ${response.status}.`);
  }

  const payload = await response.json();
  const urls = readUrls(payload).filter((imageUrl) => typeof imageUrl === 'string');
  if (urls.length === 0) {
    throw new Error('El servicio no devolvió imágenes.');
  }
  return urls;
}

function attachImages(profiles, imageUrls, species, breed) {
  return profiles.slice(0, imageUrls.length).map((profile, index) => ({
    ...profile,
    id: `${species}-${index}`,
    species,
    breed,
    image: imageUrls[index],
  }));
}

export async function fetchAnimals(signal) {
  const results = await Promise.allSettled([
    getImageUrls(
      'https://dog.ceo/api/breeds/image/random/8',
      (payload) => payload.status === 'success' && Array.isArray(payload.message) ? payload.message : [],
      signal,
    ),
    getImageUrls(
      'https://api.thecatapi.com/v1/images/search?limit=8&size=med',
      (payload) => Array.isArray(payload) ? payload.map((image) => image.url) : [],
      signal,
    ),
  ]);

  const pets = [];
  const errors = [];

  if (results[0].status === 'fulfilled') {
    pets.push(...attachImages(dogProfiles, results[0].value, 'Perro', 'Raza mixta'));
  } else {
    errors.push(`No se pudieron cargar las fotos de perros: ${results[0].reason.message}`);
  }

  if (results[1].status === 'fulfilled') {
    pets.push(...attachImages(catProfiles, results[1].value, 'Gato', 'Gato doméstico'));
  } else {
    errors.push(`No se pudieron cargar las fotos de gatos: ${results[1].reason.message}`);
  }

  return { pets, errors };
}

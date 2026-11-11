const STORAGE_KEY = 'huellitas-agent-data';

export function loadAgentData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { createdPets: [], petStatuses: {}, requests: [], error: null };
    }

    const data = JSON.parse(stored);
    return {
      createdPets: Array.isArray(data.createdPets) ? data.createdPets : [],
      petStatuses: data.petStatuses && typeof data.petStatuses === 'object' ? data.petStatuses : {},
      requests: Array.isArray(data.requests) ? data.requests : [],
      error: null,
    };
  } catch (error) {
    console.error('No se pudieron cargar los datos del agente.', error);
    return {
      createdPets: [],
      petStatuses: {},
      requests: [],
      error: `No se pudieron cargar los datos guardados: ${error.message}`,
    };
  }
}

export function saveAgentData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return null;
  } catch (error) {
    console.error('No se pudieron guardar los datos del agente.', error);
    return `No se pudieron guardar los cambios: ${error.message}`;
  }
}

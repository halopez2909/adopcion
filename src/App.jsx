import React, { useEffect, useMemo, useState } from 'react';
import { fetchAnimals } from './api/animals.js';
import AgentDashboard from './AgentDashboard.jsx';
import { loadAgentData, saveAgentData } from './agentData.js';

const filters = ['Todos', 'Perros', 'Gatos'];

function PetCard({ pet, isFavorite, onFavorite, onDetails }) {
  return (
    <article className="pet-card">
      <div className="pet-photo-wrap">
        <img className="pet-photo" src={pet.image} alt={`${pet.name}, ${pet.breed}`} loading="lazy" />
        <span className="pet-badge">{pet.species}</span>
        <button
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          type="button"
          onClick={() => onFavorite(pet.id)}
          aria-label={isFavorite ? `Quitar a ${pet.name} de favoritos` : `Agregar a ${pet.name} a favoritos`}
          aria-pressed={isFavorite}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
      <div className="pet-card-content">
        <div className="pet-heading">
          <h3>{pet.name}</h3>
          <span>{pet.age}</span>
        </div>
        <p className="pet-breed">{pet.breed} · {pet.sex}</p>
        <p className="pet-description">{pet.description}</p>
        <div className="pet-card-footer">
          <span className="pet-location">⌖ {pet.city}</span>
          <button className="text-button" type="button" onClick={() => onDetails(pet)}>
            Conocer
            <span aria-hidden="true"> →</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function PetDialog({ pet, onClose, onRequestAdoption }) {
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setApplicantName('');
    setEmail('');
    setMessage('');
    setSubmitted(false);
  }, [pet?.id]);

  useEffect(() => {
    if (!pet) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [pet, onClose]);

  if (!pet) return null;

  const goToSteps = () => {
    onClose();
    document.getElementById('proceso')?.scrollIntoView({ behavior: 'smooth' });
  };

  const submitRequest = (event) => {
    event.preventDefault();
    onRequestAdoption({ applicantName, email, message, pet });
    setSubmitted(true);
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="pet-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Cerrar perfil">×</button>
        <img className="dialog-photo" src={pet.image} alt={`${pet.name}`} />
        <div className="dialog-content">
          <span className="eyebrow">{pet.species} · {pet.city}</span>
          <h2 id="dialog-title">Hola, soy {pet.name}</h2>
          <p>{pet.description}</p>
          <div className="dialog-facts">
            <span><strong>Edad</strong>{pet.age}</span>
            <span><strong>Tamaño</strong>{pet.size}</span>
            <span><strong>Personalidad</strong>{pet.breed}</span>
          </div>
          <p className="demo-note">Esta solicitud se guarda solo en este navegador. Para una adopción real, contacta con un refugio local.</p>
          {submitted ? (
            <p className="application-success" role="status">¡Solicitud registrada! Un agente del refugio podrá verla en el panel de demostración.</p>
          ) : (
            <form className="application-form" onSubmit={submitRequest}>
              <label>Tu nombre<input required maxLength="80" autoComplete="name" value={applicantName} onChange={(event) => setApplicantName(event.target.value)} /></label>
              <label>Correo electrónico<input required type="email" maxLength="120" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label>Mensaje (opcional)<textarea maxLength="300" rows="2" value={message} onChange={(event) => setMessage(event.target.value)} /></label>
              <button className="primary-button" type="submit">Solicitar información</button>
            </form>
          )}
          <button className="dialog-steps-button" type="button" onClick={goToSteps}>Conocer los pasos de adopción</button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [savedAgentData] = useState(() => loadAgentData());
  const [pets, setPets] = useState([]);
  const [createdPets, setCreatedPets] = useState(savedAgentData.createdPets);
  const [petStatuses, setPetStatuses] = useState(savedAgentData.petStatuses);
  const [requests, setRequests] = useState(savedAgentData.requests);
  const [agentStorageError, setAgentStorageError] = useState(savedAgentData.error);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [agentMode, setAgentMode] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadPets = async () => {
      setLoading(true);
      setErrors([]);
      try {
        const result = await fetchAnimals(controller.signal);
        setPets(result.pets);
        setErrors(result.errors);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrors([`No se pudo cargar el catálogo: ${error.message}`]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadPets();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    const error = saveAgentData({ createdPets, petStatuses, requests });
    setAgentStorageError(error);
  }, [createdPets, petStatuses, requests]);

  const allPets = useMemo(() => [
    ...pets.map((pet) => ({
      ...pet,
      availability: petStatuses[pet.id] || pet.availability || 'Disponible',
    })),
    ...createdPets.map((pet) => ({
      ...pet,
      availability: petStatuses[pet.id] || pet.availability || 'Disponible',
    })),
  ], [pets, createdPets, petStatuses]);

  const visiblePets = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    return allPets.filter((pet) => {
      const matchesFilter = activeFilter === 'Todos'
        || (activeFilter === 'Perros' && pet.species === 'Perro')
        || (activeFilter === 'Gatos' && pet.species === 'Gato');
      const matchesSearch = !normalizedSearch
        || `${pet.name} ${pet.breed} ${pet.city} ${pet.description}`.toLocaleLowerCase('es').includes(normalizedSearch);
      const matchesFavorites = !showFavorites || favorites.includes(pet.id);
      return matchesFilter && matchesSearch && matchesFavorites && pet.availability === 'Disponible';
    });
  }, [allPets, activeFilter, search, showFavorites, favorites]);

  const toggleFavorite = (petId) => {
    setFavorites((current) => current.includes(petId)
      ? current.filter((id) => id !== petId)
      : [...current, petId]);
  };

  const scrollToPets = () => document.getElementById('mascotas')?.scrollIntoView({ behavior: 'smooth' });

  const addPet = (form) => {
    const id = `refugio-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
    setCreatedPets((current) => [...current, {
      ...form,
      id,
      size: 'Por definir',
      sex: 'Por definir',
      breed: form.species === 'Perro' ? 'Raza mixta' : 'Gato doméstico',
      image: form.image || (form.species === 'Perro'
        ? 'https://images.dog.ceo/breeds/retriever-golden/n02099601_7093.jpg'
        : 'https://cdn2.thecatapi.com/images/9gb.jpg'),
      availability: 'Disponible',
    }]);
  };

  const updateAvailability = (petId, availability) => {
    setPetStatuses((current) => ({ ...current, [petId]: availability }));
  };

  const addAdoptionRequest = ({ applicantName, email, message, pet }) => {
    setRequests((current) => [{
      id: `solicitud-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
      applicantName: applicantName.trim(),
      email: email.trim(),
      message: message.trim(),
      petId: pet.id,
      petName: pet.name,
      createdAt: new Date().toISOString(),
      status: 'Pendiente',
    }, ...current]);
  };

  const updateRequestStatus = (requestId, status) => {
    setRequests((current) => current.map((request) => (
      request.id === requestId ? { ...request, status } : request
    )));
    const request = requests.find((item) => item.id === requestId);
    if (status === 'Aprobada' && request) updateAvailability(request.petId, 'Adoptada');
  };

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Huellitas, inicio" onClick={() => setAgentMode(false)}>
          <span className="brand-mark" aria-hidden="true">♥</span>
          <span>huellitas<span className="brand-dot">.</span></span>
        </a>
        {!agentMode && (
          <nav className="main-nav" aria-label="Navegación principal">
            <a href="#mascotas">Encuentra tu compañero</a>
            <a href="#proceso">Cómo adoptar</a>
          </nav>
        )}
        <div className="header-actions">
          {!agentMode && (
            <button className="header-favorites" type="button" onClick={() => {
              setShowFavorites((current) => !current);
              scrollToPets();
            }}>
              <span aria-hidden="true">♡</span> Favoritos <span className="favorite-count">{favorites.length}</span>
            </button>
          )}
          <button className="agent-entry-button" type="button" onClick={() => {
            setSelectedPet(null);
            setAgentMode((current) => !current);
          }}>
            {agentMode ? '← Volver al sitio' : 'Panel del refugio'}
          </button>
        </div>
      </header>

      <main>
        {agentMode ? (
          <AgentDashboard
            pets={allPets}
            requests={requests}
            onAddPet={addPet}
            onAvailabilityChange={updateAvailability}
            onRequestStatusChange={updateRequestStatus}
            storageError={agentStorageError}
          />
        ) : (
          <>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> UN HOGAR CAMBIA TODO</span>
            <h1>Un amigo para<br />toda la <span>vida.</span></h1>
            <p>Hay una huellita esperando encontrar su lugar favorito: a tu lado.</p>
            <button className="primary-button hero-button" type="button" onClick={scrollToPets}>
              Encuentra a tu compañero <span aria-hidden="true">→</span>
            </button>
            <div className="hero-trust"><span aria-hidden="true">✦</span> Adoptar es elegir amor todos los días.</div>
          </div>
          <div className="hero-art" aria-label="Ilustración decorativa de un perro y un gato">
            <div className="hero-sun" />
            <span className="hero-spark spark-one">✳</span>
            <span className="hero-spark spark-two">✦</span>
            <div className="hero-sticker">MÁS AMOR,<br />MENOS SOLEDAD <span>♥</span></div>
            <div className="hero-image-frame">
              <img src="https://images.dog.ceo/breeds/lhasa/n02098413_21040.jpg" alt="Perro en adopción" />
              <div className="hero-paw">🐾</div>
            </div>
            <div className="hero-caption"><span className="caption-heart">♥</span><span><strong>Tu nueva historia</strong><small>empieza con una patita</small></span></div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Beneficios de adoptar">
          <div><span className="trust-icon">♡</span><span><strong>Adopta con amor</strong><small>Una segunda oportunidad</small></span></div>
          <div><span className="trust-icon">⌂</span><span><strong>Encuentra tu match</strong><small>Un compañero para ti</small></span></div>
          <div><span className="trust-icon">✿</span><span><strong>Cambia una vida</strong><small>Y la tuya también</small></span></div>
        </section>

        <section className="pets-section section-wrap" id="mascotas">
          <div className="section-heading">
            <div>
              <span className="eyebrow">AMOR A PRIMERA VISTA</span>
              <h2>Conoce a tus <span>nuevos amigos</span></h2>
              <p>Cada uno tiene una historia. ¿Cuál será la que continúa contigo?</p>
            </div>
            <span className="heading-doodle" aria-hidden="true">✳</span>
          </div>

          <div className="catalog-controls">
            <div className="filter-tabs" role="group" aria-label="Filtrar por tipo de mascota">
              {filters.map((filter) => (
                <button
                  className={`filter-tab${activeFilter === filter ? ' active' : ''}`}
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter === 'Perros' ? '🐶 ' : filter === 'Gatos' ? '🐱 ' : ''}{filter}
                </button>
              ))}
            </div>
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Busca por nombre o ciudad..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {showFavorites && (
            <div className="favorites-notice">
              Mostrando tus favoritos.
              <button type="button" onClick={() => setShowFavorites(false)}>Ver todas las mascotas</button>
            </div>
          )}

          {errors.length > 0 && (
            <div className="error-message" role="alert">
              <div><strong>Algunas fotos no están disponibles.</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>
              <button className="secondary-button" type="button" onClick={() => setReloadKey((key) => key + 1)}>Intentar de nuevo</button>
            </div>
          )}

          {loading && pets.length === 0 ? (
            <div className="catalog-message" role="status"><span className="loader" /> Buscando huellitas...</div>
          ) : visiblePets.length > 0 ? (
            <div className="pet-grid">
              {visiblePets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  isFavorite={favorites.includes(pet.id)}
                  onFavorite={toggleFavorite}
                  onDetails={setSelectedPet}
                />
              ))}
            </div>
          ) : (
            <div className="catalog-message">
              <span className="empty-paw" aria-hidden="true">🐾</span>
              <strong>{showFavorites && favorites.length === 0 ? 'Todavía no tienes favoritos' : 'No encontramos coincidencias'}</strong>
              <span>Prueba otra búsqueda o cambia el filtro.</span>
            </div>
          )}
          <p className="api-credit">Fotos obtenidas en tiempo real de Dog CEO API y The Cat API. Las fichas son datos de demostración.</p>
        </section>

        <section className="process-section" id="proceso">
          <div className="section-wrap process-inner">
            <div className="process-intro">
              <span className="eyebrow">UN CAMINO LLENO DE AMOR</span>
              <h2>Adoptar es más<br />fácil de lo que <span>imaginas.</span></h2>
              <p>Dar el primer paso puede cambiar dos vidas para siempre. Así empieza una adopción responsable:</p>
              <span className="process-heart" aria-hidden="true">♡</span>
            </div>
            <div className="process-steps">
              <article className="process-step">
                <span className="step-number">01</span>
                <div><h3>Conoce y conecta</h3><p>Visita un refugio responsable y conoce a los animales disponibles. La conexión se siente.</p></div>
                <span className="step-icon" aria-hidden="true">♡</span>
              </article>
              <article className="process-step">
                <span className="step-number">02</span>
                <div><h3>Platica con el refugio</h3><p>Pregunta por su historia, necesidades y requisitos. Ellos te acompañarán en el proceso.</p></div>
                <span className="step-icon" aria-hidden="true">☏</span>
              </article>
              <article className="process-step">
                <span className="step-number">03</span>
                <div><h3>Prepara su nuevo hogar</h3><p>Con paciencia, cuidados y mucho cariño, comienza una nueva historia juntos.</p></div>
                <span className="step-icon" aria-hidden="true">⌂</span>
              </article>
            </div>
          </div>
        </section>

        <section className="closing-cta">
          <span className="cta-paw" aria-hidden="true">🐾</span>
          <h2>El amor no se compra.<br /><span>Se adopta.</span></h2>
          <button className="primary-button" type="button" onClick={scrollToPets}>Conoce a tus nuevos amigos <span aria-hidden="true">→</span></button>
        </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark" aria-hidden="true">♥</span><span>huellitas<span className="brand-dot">.</span></span></a>
        <p>Hecho con amor y muchas huellitas <span aria-hidden="true">♥</span></p>
        <span>© 2026 Huellitas · Proyecto de demostración</span>
      </footer>

      <PetDialog
        pet={selectedPet}
        onClose={() => setSelectedPet(null)}
        onRequestAdoption={addAdoptionRequest}
      />
    </>
  );
}

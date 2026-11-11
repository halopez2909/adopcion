import React, { useState } from 'react';

const emptyPetForm = {
  name: '',
  species: 'Perro',
  age: '',
  city: '',
  description: '',
  image: '',
};

function formatDate(value) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value));
}

export default function AgentDashboard({ pets, requests, onAddPet, onAvailabilityChange, onRequestStatusChange, storageError }) {
  const [activeTab, setActiveTab] = useState('Resumen');
  const [form, setForm] = useState(emptyPetForm);
  const [formError, setFormError] = useState('');
  const pendingRequests = requests.filter((request) => request.status === 'Pendiente').length;
  const tabs = ['Resumen', 'Mascotas', 'Solicitudes'];

  const submitPet = (event) => {
    event.preventDefault();
    setFormError('');

    if (form.image) {
      try {
        const imageUrl = new URL(form.image);
        if (!['http:', 'https:'].includes(imageUrl.protocol)) {
          throw new Error('La URL de la foto debe comenzar con http o https.');
        }
      } catch (error) {
        setFormError(error.message === 'Invalid URL' ? 'Escribe una URL de imagen válida.' : error.message);
        return;
      }
    }

    onAddPet(form);
    setForm(emptyPetForm);
    setActiveTab('Mascotas');
  };

  return (
    <section className="agent-dashboard">
      <div className="agent-heading">
        <div>
          <span className="eyebrow">ESPACIO DE TRABAJO</span>
          <h1>Panel del refugio</h1>
          <p>Administra perfiles y acompaña a las familias interesadas.</p>
        </div>
        <span className="agent-avatar" aria-hidden="true">♥</span>
      </div>

      <div className="agent-demo-note" role="note">
        <strong>Modo demostración</strong>
        Los cambios se guardan en este navegador. Este panel no tiene inicio de sesión ni está conectado a una base de datos.
      </div>
      {storageError && <p className="agent-storage-error" role="alert">{storageError}</p>}

      <nav className="agent-tabs" aria-label="Secciones del panel">
        {tabs.map((tab) => (
          <button
            className={`agent-tab${activeTab === tab ? ' active' : ''}`}
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}{tab === 'Solicitudes' && pendingRequests > 0 && <span className="agent-tab-count">{pendingRequests}</span>}
          </button>
        ))}
      </nav>

      {activeTab === 'Resumen' && (
        <div className="agent-overview">
          <div className="agent-metrics">
            <article><span>Mascotas disponibles</span><strong>{pets.filter((pet) => pet.availability === 'Disponible').length}</strong><small>En el catálogo</small></article>
            <article><span>Solicitudes pendientes</span><strong>{pendingRequests}</strong><small>Por revisar</small></article>
            <article><span>Adopciones registradas</span><strong>{requests.filter((request) => request.status === 'Aprobada').length}</strong><small>En esta demostración</small></article>
          </div>
          <div className="agent-welcome">
            <div>
              <span className="eyebrow">PRÓXIMOS PASOS</span>
              <h2>Un buen encuentro empieza aquí.</h2>
              <p>Agrega mascotas, actualiza su disponibilidad y revisa los mensajes que envíen las familias.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => setActiveTab('Mascotas')}>Administrar mascotas →</button>
          </div>
          <h2 className="agent-subheading">Solicitudes recientes</h2>
          {requests.length > 0 ? (
            <RequestList requests={requests.slice(0, 4)} onStatusChange={onRequestStatusChange} />
          ) : (
            <EmptyState title="Aún no hay solicitudes" text="Cuando alguien solicite información desde el perfil de una mascota, aparecerá aquí." />
          )}
        </div>
      )}

      {activeTab === 'Mascotas' && (
        <div className="agent-content-grid">
          <section className="agent-panel">
            <h2>Agregar mascota</h2>
            <p className="agent-panel-hint">Completa los datos para publicarla en el catálogo.</p>
            <form className="agent-pet-form" onSubmit={submitPet}>
              <label>Nombre<input required maxLength="40" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <div className="agent-form-row">
                <label>Tipo<select value={form.species} onChange={(event) => setForm({ ...form, species: event.target.value })}><option>Perro</option><option>Gato</option></select></label>
                <label>Edad<input required maxLength="30" placeholder="Ej. 2 años" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} /></label>
              </div>
              <label>Ciudad<input required maxLength="60" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
              <label>Descripción<textarea required maxLength="220" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <label>URL de foto (opcional)<input type="url" placeholder="https://..." value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>
              {formError && <p className="agent-form-error" role="alert">{formError}</p>}
              <button className="primary-button" type="submit">Publicar mascota</button>
            </form>
          </section>

          <section className="agent-panel agent-pets-panel">
            <div className="agent-panel-heading"><div><h2>Mascotas del catálogo</h2><p className="agent-panel-hint">Marca como adoptada a quien ya encontró hogar.</p></div><span className="agent-total">{pets.length}</span></div>
            {pets.length > 0 ? (
              <div className="agent-table-wrap">
                <table className="agent-table">
                  <thead><tr><th>Mascota</th><th>Ubicación</th><th>Estado</th><th>Acción</th></tr></thead>
                  <tbody>
                    {pets.map((pet) => (
                      <tr key={pet.id}>
                        <td><span className="agent-pet-name">{pet.name}</span><small>{pet.species} · {pet.age}</small></td>
                        <td>{pet.city}</td>
                        <td><span className={`status-pill ${pet.availability === 'Disponible' ? 'status-available' : 'status-adopted'}`}>{pet.availability}</span></td>
                        <td><button className="agent-action" type="button" onClick={() => onAvailabilityChange(pet.id, pet.availability === 'Disponible' ? 'Adoptada' : 'Disponible')}>{pet.availability === 'Disponible' ? 'Marcar adoptada' : 'Reactivar'}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Cargando catálogo" text="Las mascotas aparecerán en cuanto se carguen las fotos de las APIs." />
            )}
          </section>
        </div>
      )}

      {activeTab === 'Solicitudes' && (
        <section className="agent-panel">
          <div className="agent-panel-heading"><div><h2>Solicitudes de adopción</h2><p className="agent-panel-hint">Contacta a las familias y actualiza cada solicitud.</p></div><span className="agent-total">{requests.length}</span></div>
          {requests.length > 0 ? (
            <RequestList requests={requests} onStatusChange={onRequestStatusChange} />
          ) : (
            <EmptyState title="Aún no hay solicitudes" text="Las solicitudes enviadas desde los perfiles aparecerán en esta lista." />
          )}
        </section>
      )}
    </section>
  );
}

function RequestList({ requests, onStatusChange }) {
  return (
    <div className="agent-requests">
      {requests.map((request) => (
        <article className="agent-request" key={request.id}>
          <div className="request-avatar" aria-hidden="true">{request.applicantName.charAt(0).toUpperCase()}</div>
          <div className="request-main">
            <div className="request-title"><strong>{request.applicantName}</strong><span className={`status-pill status-${request.status.toLowerCase()}`}>{request.status}</span></div>
            <p>Interesado/a en <strong>{request.petName}</strong> · {formatDate(request.createdAt)}</p>
            <a href={`mailto:${request.email}`}>{request.email}</a>
            {request.message && <blockquote>{request.message}</blockquote>}
          </div>
          {request.status === 'Pendiente' && (
            <div className="request-actions">
              <button className="request-approve" type="button" onClick={() => onStatusChange(request.id, 'Aprobada')}>Aprobar</button>
              <button className="request-reject" type="button" onClick={() => onStatusChange(request.id, 'Rechazada')}>Rechazar</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function EmptyState({ title, text }) {
  return <div className="agent-empty"><span aria-hidden="true">🐾</span><strong>{title}</strong><p>{text}</p></div>;
}

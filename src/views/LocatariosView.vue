<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/MainLayout.vue'
import api from '../services/api'

const locatarios = ref([])
const cargando = ref(true)
const mostrarModal = ref(false)
const locatarioEditando = ref(null)

const form = ref({ nombre: '', nit: '', representante: '', telefono: '', email: '', rubro: '', estado: 'Activo' })

const cargarLocatarios = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/locatarios')
    locatarios.value = data.data ? data.data : data // Maneja si viene paginado o directo
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

const abrirModal = (loc = null) => {
  if (loc) {
    locatarioEditando.value = loc.id
    form.value = { ...loc }
  } else {
    locatarioEditando.value = null
    form.value = { nombre: '', nit: '', representante: '', telefono: '', email: '', rubro: '', estado: 'Activo' }
  }
  mostrarModal.value = true
}

const guardar = async () => {
  try {
    if (locatarioEditando.value) {
      await api.put(`/locatarios/${locatarioEditando.value}`, form.value)
    } else {
      await api.post('/locatarios', form.value)
    }
    mostrarModal.value = false
    cargarLocatarios()
  } catch (e) {
    alert('Error al guardar. Revisa que el NIT no esté duplicado.')
  }
}

const eliminar = async (id) => {
  if (confirm('¿Estás seguro de eliminar este locatario?')) {
    await api.delete(`/locatarios/${id}`)
    cargarLocatarios()
  }
}

onMounted(cargarLocatarios)
</script>

<template>
  <MainLayout>
    <div class="page-head">
      <div>
        <h2>Gestión de Locatarios</h2>
        <p>{{ locatarios.length }} {{ locatarios.length === 1 ? 'negocio registrado' : 'negocios registrados' }}</p>
      </div>
      <button class="btn" @click="abrirModal()">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
        Nuevo Locatario
      </button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>NIT</th>
            <th>Nombre</th>
            <th>Rubro</th>
            <th>Estado</th>
            <th class="right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="5" class="state"><span class="spinner"></span> Cargando datos...</td>
          </tr>
          <tr v-else-if="locatarios.length === 0">
            <td colspan="5" class="state">No hay locatarios registrados.</td>
          </tr>
          <tr v-for="loc in locatarios" :key="loc.id">
            <td><span class="nit">{{ loc.nit }}</span></td>
            <td>
              <div class="who">
                <div class="who-avatar">{{ (loc.nombre || '?').charAt(0).toUpperCase() }}</div>
                <div>
                  <strong>{{ loc.nombre }}</strong>
                  <small v-if="loc.representante || loc.telefono">{{ loc.representante }}<template v-if="loc.representante && loc.telefono"> · </template>{{ loc.telefono }}</small>
                </div>
              </div>
            </td>
            <td><span class="badge badge-slate">{{ loc.rubro }}</span></td>
            <td>
              <span
                class="badge"
                :class="loc.estado === 'Activo' ? 'badge-green' : loc.estado === 'Suspendido' ? 'badge-amber' : 'badge-red'"
              >{{ loc.estado }}</span>
            </td>
            <td class="right">
              <div class="actions">
                <button class="btn btn-secondary btn-sm" @click="abrirModal(loc)">
                  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  Editar
                </button>
                <button class="btn btn-danger btn-sm" @click="eliminar(loc.id)">
                  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Crear/Editar -->
    <div v-if="mostrarModal" class="modal-backdrop" @click.self="mostrarModal = false">
      <div class="modal">
        <h3>{{ locatarioEditando ? 'Editar Locatario' : 'Nuevo Locatario' }}</h3>
        <form @submit.prevent="guardar">
          <div class="form-grid">
            <div>
              <label>NIT</label>
              <input v-model="form.nit" placeholder="NIT" required />
            </div>
            <div>
              <label>Rubro</label>
              <input v-model="form.rubro" placeholder="Rubro (Ej. Ropa, Comida)" />
            </div>
          </div>

          <label>Nombre / Razón Social</label>
          <input v-model="form.nombre" placeholder="Nombre / Razón Social" required />

          <label>Representante Legal</label>
          <input v-model="form.representante" placeholder="Representante Legal" />

          <div class="form-grid">
            <div>
              <label>Teléfono</label>
              <input v-model="form.telefono" placeholder="Teléfono" />
            </div>
            <div>
              <label>Correo Electrónico</label>
              <input v-model="form.email" type="email" placeholder="Correo Electrónico" />
            </div>
          </div>

          <label>Estado</label>
          <select v-model="form.estado">
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Suspendido">Suspendido</option>
          </select>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="mostrarModal = false">Cancelar</button>
            <button type="submit" class="btn">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped>
.ico { width: 15px; height: 15px; flex-shrink: 0; }
.right { text-align: right; }
.actions { display: inline-flex; gap: .45rem; }
.nit { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .82rem; color: var(--slate-600, #475569); }

.who { display: flex; align-items: center; gap: .8rem; }
.who-avatar { width: 38px; height: 38px; flex-shrink: 0; display: grid; place-items: center; font-weight: 700; color: var(--indigo-700, #4338ca); background: var(--indigo-50, #eef2ff); border-radius: 11px; }
.who strong { display: block; color: var(--slate-900, #0f172a); font-weight: 600; }
.who small { display: block; color: var(--slate-500, #64748b); font-size: .78rem; }

.state { padding: 2.5rem 1rem; text-align: center; color: var(--slate-500, #64748b); }
.spinner { display: inline-block; width: 16px; height: 16px; margin-right: .5rem; vertical-align: -3px; border: 2px solid var(--slate-300, #cbd5e1); border-top-color: var(--indigo-600, #4f46e5); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
@media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }
</style>
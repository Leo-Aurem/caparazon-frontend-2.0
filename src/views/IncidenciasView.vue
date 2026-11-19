<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/MainLayout.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const incidencias = ref([])
const cargando = ref(true)
const mostrarModal = ref(false)
const incidenciaEditando = ref(null)

const form = ref({ 
  titulo: '', descripcion: '', espacio_id: '', prioridad: 'Media' 
})

const cargarIncidencias = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/incidencias')
    incidencias.value = data.data || data
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

const abrirModal = (inc = null) => {
  if (inc) {
    incidenciaEditando.value = inc.id
    form.value = { ...inc }
  } else {
    incidenciaEditando.value = null
    form.value = { titulo: '', descripcion: '', espacio_id: '', prioridad: 'Media' }
  }
  mostrarModal.value = true
}

const guardar = async () => {
  try {
    if (incidenciaEditando.value) {
      await api.put(`/incidencias/${incidenciaEditando.value}`, form.value)
    } else {
      await api.post('/incidencias', form.value)
    }
    mostrarModal.value = false
    cargarIncidencias()
  } catch (e) {
    alert('Error al guardar. Revisa los datos.')
  }
}

const avanzarEstado = async (inc) => {
  const flujo = {
    'Pendiente': 'Asignada',
    'Asignada': 'En proceso',
    'En proceso': 'Resuelta',
    'Resuelta': 'Cerrada'
  }
  const siguiente = flujo[inc.estado]
  
  if (!siguiente) return // Si ya está Cerrada, no hace nada

  try {
    await api.patch(`/incidencias/${inc.id}/estado`, { estado: siguiente })
    cargarIncidencias()
  } catch (e) {
    alert('Error al cambiar el estado.')
  }
}

const colorEstado = (estado) => {
  if (estado === 'Pendiente') return '#fef08a' // Amarillo
  if (estado === 'Asignada') return '#bfdbfe' // Azul
  if (estado === 'En proceso') return '#fed7aa' // Naranja
  if (estado === 'Resuelta') return '#bbf7d0' // Verde
  if (estado === 'Cerrada') return '#e5e7eb' // Gris
}

onMounted(cargarIncidencias)
</script>

<template>
  <MainLayout>
    <div class="page-head">
      <div>
        <h2>Gestión de Incidencias</h2>
        <p>Reporte, seguimiento y resolución de contingencias del mall</p>
      </div>
      <button class="btn" @click="abrirModal()">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
        Reportar Incidencia
      </button>
    </div>

    <!-- Resumen por estado -->
    <div class="summary">
      <div v-for="e in ['Pendiente', 'Asignada', 'En proceso', 'Resuelta', 'Cerrada']" :key="e" class="sum-card">
        <span class="sum-dot" :style="{ backgroundColor: colorEstado(e) }"></span>
        <div>
          <strong>{{ incidencias.filter(i => i.estado === e).length }}</strong>
          <small>{{ e }}</small>
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Espacio</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th class="right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando"><td colspan="5" class="state"><span class="spinner"></span> Cargando datos...</td></tr>
          <tr v-else-if="incidencias.length === 0"><td colspan="5" class="state">No hay incidencias reportadas.</td></tr>
          <tr v-for="inc in incidencias" :key="inc.id">
            <td class="col-title">
              <strong>{{ inc.titulo }}</strong>
              <small>{{ inc.descripcion }}</small>
            </td>
            <td>
              <span class="badge badge-slate">{{ inc.espacio?.codigo || 'General' }}</span>
            </td>
            <td>
              <span
                class="badge"
                :class="inc.prioridad === 'Critica' ? 'badge-red' : inc.prioridad === 'Alta' ? 'badge-amber' : inc.prioridad === 'Media' ? 'badge-blue' : 'badge-slate'"
              >{{ inc.prioridad }}</span>
            </td>
            <td>
              <span class="pill" :style="{ backgroundColor: colorEstado(inc.estado) }">{{ inc.estado }}</span>
              <!-- Indicador de avance del flujo -->
              <div class="steps" :title="'Flujo: Pendiente → Asignada → En proceso → Resuelta → Cerrada'">
                <i
                  v-for="(p, idx) in ['Pendiente', 'Asignada', 'En proceso', 'Resuelta', 'Cerrada']"
                  :key="p"
                  :class="{ done: idx <= ['Pendiente', 'Asignada', 'En proceso', 'Resuelta', 'Cerrada'].indexOf(inc.estado) }"
                ></i>
              </div>
            </td>
            <td class="right">
              <div class="actions">
                <button v-if="inc.estado !== 'Cerrada'" class="btn btn-sm advance" @click="avanzarEstado(inc)">
                  Avanzar a {{ inc.estado === 'Pendiente' ? 'Asignada' : inc.estado === 'Asignada' ? 'En proceso' : inc.estado === 'En proceso' ? 'Resuelta' : 'Cerrada' }}
                  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
                </button>
                <button class="btn btn-secondary btn-sm" @click="abrirModal(inc)">Editar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="mostrarModal" class="modal-backdrop" @click.self="mostrarModal = false">
      <div class="modal">
        <h3>{{ incidenciaEditando ? 'Editar Incidencia' : 'Reportar Incidencia' }}</h3>
        <form @submit.prevent="guardar">
          <label>Título</label>
          <input v-model="form.titulo" placeholder="Título de la incidencia" required />

          <label>Descripción</label>
          <textarea v-model="form.descripcion" placeholder="Descripción detallada" required rows="3"></textarea>

          <div class="form-grid">
            <div>
              <label>Espacio (opcional)</label>
              <input v-model="form.espacio_id" type="number" placeholder="ID del Espacio (Opcional)" />
            </div>
            <div>
              <label>Prioridad</label>
              <select v-model="form.prioridad">
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Critica">Crítica</option>
              </select>
            </div>
          </div>

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

/* Resumen por estado */
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .8rem; margin-bottom: 1.1rem; }
.sum-card { display: flex; align-items: center; gap: .8rem; padding: .85rem 1rem; background: #fff; border: 1px solid var(--slate-200, #e2e8f0); border-radius: 12px; box-shadow: var(--shadow-sm); }
.sum-dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(15, 23, 42, .05); }
.sum-card strong { display: block; font-size: 1.35rem; font-weight: 800; line-height: 1.1; color: var(--slate-900, #0f172a); }
.sum-card small { color: var(--slate-500, #64748b); font-size: .76rem; }

.col-title { max-width: 360px; }
.col-title strong { display: block; color: var(--slate-900, #0f172a); font-weight: 600; }
.col-title small { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: .15rem; color: var(--slate-500, #64748b); font-size: .78rem; }

.pill { display: inline-block; padding: .22rem .7rem; font-size: .76rem; font-weight: 700; color: var(--slate-800, #1e293b); border-radius: 999px; }
.steps { display: flex; gap: 4px; margin-top: .5rem; }
.steps i { width: 18px; height: 4px; border-radius: 4px; background: var(--slate-200, #e2e8f0); transition: background .2s; }
.steps i.done { background: var(--indigo-500, #6366f1); }

.advance { background: #f59e0b; box-shadow: 0 1px 2px rgba(245, 158, 11, .4); }
.advance:hover { background: #d97706; box-shadow: 0 4px 10px rgba(217, 119, 6, .3); }

.state { padding: 2.5rem 1rem; text-align: center; color: var(--slate-500, #64748b); }
.spinner { display: inline-block; width: 16px; height: 16px; margin-right: .5rem; vertical-align: -3px; border: 2px solid var(--slate-300, #cbd5e1); border-top-color: var(--indigo-600, #4f46e5); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
textarea { resize: vertical; min-height: 84px; }
@media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }
</style>
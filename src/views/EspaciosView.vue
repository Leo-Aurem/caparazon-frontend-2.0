<script setup>
import { ref, onMounted, computed } from 'vue'
import MainLayout from '../components/MainLayout.vue'
import api from '../services/api'

const espacios = ref([])
const locatarios = ref([])
const cargando = ref(true)
const mostrarModal = ref(false)
const espacioEditando = ref(null)
const pisoActivo = ref('Planta Baja')
const pisos = ['Planta Baja', 'Piso 1', 'Piso 2']

const form = ref({ 
  codigo: '', piso: '', zona: '', area_m2: '', 
  coord_x: '', coord_y: '', estado: 'Disponible', locatario_id: '' 
})

const espaciosFiltrados = computed(() => {
  return espacios.value.filter(e => e.piso === pisoActivo.value)
})

const cargarDatos = async () => {
  cargando.value = true
  try {
    // 1. Espacios (Todos los roles permitidos pueden verlos)
    const resEsp = await api.get('/espacios')
    espacios.value = resEsp.data

    // 2. Locatarios (Solo Admin y Operador pueden verlos. Si falla, no rompemos la vista)
    try {
      const resLoc = await api.get('/locatarios')
      locatarios.value = resLoc.data.data || resLoc.data
    } catch (error) {
      // Si el rol es Supervisor, dará 403. Lo ignoramos y dejamos la lista vacía.
      locatarios.value = []
    }

  } catch (e) {
    console.error('Error al cargar espacios', e)
  } finally {
    cargando.value = false
  }
}

const abrirModal = (esp = null) => {
  if (esp) {
    espacioEditando.value = esp.id
    form.value = { ...esp }
  } else {
    espacioEditando.value = null
    form.value = { codigo: '', piso: pisoActivo.value, zona: '', area_m2: '', coord_x: '', coord_y: '', estado: 'Disponible', locatario_id: '' }
  }
  mostrarModal.value = true
}

const guardar = async () => {
  try {
    if (espacioEditando.value) {
      await api.put(`/espacios/${espacioEditando.value}`, form.value)
    } else {
      await api.post('/espacios', form.value)
    }
    mostrarModal.value = false
    cargarDatos()
  } catch (e) {
    alert('Error al guardar. Revisa los datos.')
  }
}

const eliminar = async (id) => {
  if (confirm('¿Eliminar este espacio?')) {
    await api.delete(`/espacios/${id}`)
    cargarDatos()
  }
}

const colorEspacio = (estado) => {
  if (estado === 'Disponible') return '#86efac' // Verde
  if (estado === 'Ocupado') return '#93c5fd' // Azul
  if (estado === 'Mantenimiento') return '#fca5a5' // Rojo
  return '#e5e7eb'
}

onMounted(cargarDatos)
</script>

<template>
  <MainLayout>
    <div class="page-head">
      <div>
        <h2>Mapa de Espacios</h2>
        <p>Estado de ocupación por piso · Mall Center Caparazón, Zona La Vita</p>
      </div>
      <button class="btn" @click="abrirModal()">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
        Nuevo Espacio
      </button>
    </div>

    <!-- Pestañas de Pisos -->
    <div class="toolbar">
      <div class="segmented">
        <button
          v-for="p in pisos" :key="p"
          class="seg"
          :class="{ active: pisoActivo === p }"
          @click="pisoActivo = p"
        >
          {{ p }}
        </button>
      </div>

      <!-- Resumen del piso -->
      <div class="stats">
        <span><b>{{ espaciosFiltrados.length }}</b> espacios</span>
        <span><b>{{ espaciosFiltrados.filter(e => e.estado === 'Disponible').length }}</b> disponibles</span>
        <span class="occ">
          Ocupación
          <b>{{ Math.round(100 * espaciosFiltrados.filter(e => e.estado === 'Ocupado').length / (espaciosFiltrados.length || 1)) }}%</b>
        </span>
      </div>
    </div>

    <!-- Leyenda -->
    <div class="legend">
      <span v-for="est in ['Disponible', 'Ocupado', 'Mantenimiento']" :key="est">
        <i :style="{ background: colorEspacio(est) }"></i> {{ est }}
      </span>
    </div>

    <!-- Mapa SVG: los locales se ordenan en cuadrícula (2 filas de hasta 10 por piso) -->
    <div class="card map-card">
      <svg
        class="map"
        :viewBox="`0 0 1000 ${450 + Math.max(0, Math.ceil(espaciosFiltrados.length / 10) - 2) * 165}`"
      >
        <!-- Pasillo Central -->
        <rect x="0" y="192" width="1000" height="66" fill="#e2e8f0" />
        <text x="500" y="230" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="700" letter-spacing="6">PASILLO CENTRAL</text>

        <g
          v-for="(esp, i) in espaciosFiltrados"
          :key="esp.id"
          class="space"
          :transform="`translate(${36 + (i % 10) * 94}, ${Math.floor(i / 10) === 0 ? 30 : 270 + (Math.floor(i / 10) - 1) * 165})`"
          @click="abrirModal(esp)"
        >
          <title>{{ esp.codigo }} · {{ esp.estado }}{{ esp.locatario ? ' · ' + esp.locatario.nombre : '' }}</title>
          <!-- El Local -->
          <rect
            class="box"
            x="0"
            y="0"
            width="84"
            height="150"
            :fill="colorEspacio(esp.estado)"
            stroke="#ffffff"
            stroke-width="2"
            rx="9"
          />
          <!-- Texto del Local -->
          <text x="42" y="68" text-anchor="middle" fill="#0f172a" font-size="14" font-weight="800">{{ esp.codigo }}</text>
          <text x="42" y="90" text-anchor="middle" fill="#334155" font-size="10" font-weight="600">{{ esp.locatario ? esp.locatario.nombre.substring(0,10) : 'Libre' }}</text>
          <text x="42" y="130" text-anchor="middle" fill="#475569" font-size="8.5" font-weight="700" letter-spacing="1">{{ esp.estado.toUpperCase() }}</text>
        </g>
      </svg>
      <p v-if="!cargando && espaciosFiltrados.length === 0" class="map-empty">No hay espacios registrados en {{ pisoActivo }}.</p>
    </div>

    <!-- Tabla de Espacios (Filtrada por piso) -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Locatario</th>
            <th>Estado</th>
            <th class="right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="esp in espaciosFiltrados" :key="esp.id">
            <td><strong class="code">{{ esp.codigo }}</strong></td>
            <td>{{ esp.locatario ? esp.locatario.nombre : 'Ninguno' }}</td>
            <td>
              <span
                class="badge"
                :class="esp.estado === 'Disponible' ? 'badge-green' : esp.estado === 'Ocupado' ? 'badge-blue' : 'badge-red'"
              >{{ esp.estado }}</span>
            </td>
            <td class="right">
              <div class="actions">
                <button class="btn btn-secondary btn-sm" @click="abrirModal(esp)">Editar</button>
                <button class="btn btn-danger btn-sm" @click="eliminar(esp.id)">Eliminar</button>
              </div>
            </td>
          </tr>
          <tr v-if="espaciosFiltrados.length === 0">
            <td colspan="4" class="state">{{ cargando ? 'Cargando datos...' : 'Sin espacios en este piso.' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="mostrarModal" class="modal-backdrop" @click.self="mostrarModal = false">
      <div class="modal">
        <h3>{{ espacioEditando ? 'Editar Espacio' : 'Nuevo Espacio' }}</h3>
        <form @submit.prevent="guardar">
          <div class="form-grid">
            <div>
              <label>Código</label>
              <input v-model="form.codigo" placeholder="Código" required />
            </div>
            <div>
              <label>Piso</label>
              <input v-model="form.piso" placeholder="Piso" required />
            </div>
          </div>

          <label>Estado</label>
          <select v-model="form.estado">
            <option value="Disponible">Disponible</option>
            <option value="Ocupado">Ocupado</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>

          <label>Locatario</label>
          <select v-model="form.locatario_id">
            <option value="">Sin Locatario</option>
            <option v-for="loc in locatarios" :key="loc.id" :value="loc.id">{{ loc.nombre }}</option>
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
.code { font-weight: 700; color: var(--slate-900, #0f172a); }

/* Pestañas de piso (control segmentado) */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: .9rem; }
.segmented { display: inline-flex; padding: 4px; gap: 2px; background: var(--slate-200, #e2e8f0); border-radius: 12px; }
.seg { padding: .5rem 1.1rem; font-size: 13px; font-weight: 600; color: var(--slate-600, #475569); background: transparent; border: 0; border-radius: 9px; box-shadow: none; }
.seg:hover { background: rgba(255, 255, 255, .55); color: var(--slate-900, #0f172a); box-shadow: none; }
.seg.active { color: var(--indigo-700, #4338ca); background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, .15); }
.stats { display: flex; gap: 1.2rem; flex-wrap: wrap; font-size: .85rem; color: var(--slate-500, #64748b); }
.stats b { color: var(--slate-900, #0f172a); font-weight: 700; }
.stats .occ b { color: var(--indigo-600, #4f46e5); }

.legend { display: flex; gap: 1.1rem; flex-wrap: wrap; margin-bottom: .9rem; font-size: .84rem; color: var(--slate-600, #475569); }
.legend i { display: inline-block; width: 13px; height: 13px; margin-right: .4rem; vertical-align: -2px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(15, 23, 42, .12); }

/* Mapa */
.map-card { padding: .75rem; margin-bottom: 1.5rem; overflow-x: auto; }
.map { display: block; width: 100%; min-width: 760px; height: auto; background: var(--slate-50, #f8fafc); border: 1px solid var(--slate-200, #e2e8f0); border-radius: 10px; }
.space { cursor: pointer; }
.space .box { transition: stroke .15s, stroke-width .15s, filter .15s; }
.space:hover .box { stroke: #4f46e5; stroke-width: 3; filter: brightness(.97) drop-shadow(0 4px 6px rgba(79, 70, 229, .25)); }
.space text { pointer-events: none; }
.map-empty { margin-top: .6rem; text-align: center; color: var(--slate-500, #64748b); font-size: .85rem; }

.state { padding: 2rem 1rem; text-align: center; color: var(--slate-500, #64748b); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
@media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }
</style>
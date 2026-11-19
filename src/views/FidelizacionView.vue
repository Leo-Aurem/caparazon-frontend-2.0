<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/MainLayout.vue'
import api from '../services/api'

const resumen = ref({ visitantes: 0, vip: 0, frecuentes: 0, en_riesgo: 0, nuevos: 0, cupones_activos: 0 })
const visitantes = ref([])
const campanas = ref([])
const cargando = ref(true)
const tab = ref('segmentos')

// Formulario de campaña
const formCampana = ref({ nombre: '', segmento_objetivo: 'vip', descuento_porcentaje: 10, fecha_inicio: '', fecha_fin: '' })
const mostrarModal = ref(false)
const codigoCanje = ref('')
const mensajeCanje = ref('')

const cargarResumen = async () => {
  try {
    const { data } = await api.get('/fidelizacion/resumen')
    resumen.value = data
  } catch (e) { console.error(e) }
}

const cargarVisitantes = async () => {
  try {
    const { data } = await api.get('/fidelizacion/visitantes')
    visitantes.value = data.data || data
  } catch (e) { console.error(e) }
}

const recalcular = async () => {
  try {
    await api.post('/fidelizacion/recalcular')
    await cargarResumen()
    alert('Segmentos recalculados con éxito.')
  } catch (e) { alert('Error al recalcular') }
}

const crearCampana = async () => {
  try {
    await api.post('/fidelizacion/campanas', formCampana.value)
    alert('Campaña creada con éxito.')
    mostrarModal.value = false
  } catch (e) { alert('Error al crear la campaña') }
}

const generarCupones = async (campanaId) => {
  try {
    const { data } = await api.post(`/fidelizacion/campanas/${campanaId}/generar-cupones`)
    alert(data.message)
    cargarResumen()
  } catch (e) { alert('Error al generar cupones') }
}

const canjearCupon = async () => {
  try {
    const { data } = await api.post('/fidelizacion/cupones/canjear', { codigo: codigoCanje.value })
    mensajeCanje.value = data.message
    codigoCanje.value = ''
    cargarResumen()
  } catch (e) {
    mensajeCanje.value = e.response?.data?.message || 'Error al canjear'
  }
}

onMounted(async () => {
  cargando.value = true
  await Promise.all([cargarResumen(), cargarVisitantes()])
  cargando.value = false
})
</script>

<template>
  <MainLayout>
    <h2>Fidelizacion y Segmentacion RFM</h2>
    
    <!-- Botones de acción -->
    <div style="display: flex; gap: 1rem; margin: 1rem 0 2rem 0;">
      <button @click="recalcular" style="background-color: #f59e0b;">Recalcular Segmentos</button>
      <button @click="mostrarModal = true" style="background-color: #16a34a;">+ Crear Campaña</button>
    </div>

    <!-- Tarjetas de resumen -->
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem;">
      <div class="card" style="max-width: 100%; text-align: center;">
        <h3 style="margin: 0; font-size: 0.875rem; color: #6b7280;">Total Visitantes</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0 0 0; color: #2563eb;">{{ resumen.visitantes }}</p>
      </div>
      <div class="card" style="max-width: 100%; text-align: center;">
        <h3 style="margin: 0; font-size: 0.875rem; color: #6b7280;">VIP</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0 0 0; color: #eab308;">{{ resumen.vip }}</p>
      </div>
      <div class="card" style="max-width: 100%; text-align: center;">
        <h3 style="margin: 0; font-size: 0.875rem; color: #6b7280;">Frecuentes</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0 0 0; color: #16a34a;">{{ resumen.frecuentes }}</p>
      </div>
      <div class="card" style="max-width: 100%; text-align: center;">
        <h3 style="margin: 0; font-size: 0.875rem; color: #6b7280;">En Riesgo</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0 0 0; color: #ef4444;">{{ resumen.en_riesgo }}</p>
      </div>
      <div class="card" style="max-width: 100%; text-align: center;">
        <h3 style="margin: 0; font-size: 0.875rem; color: #6b7280;">Cupones Activos</h3>
        <p style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0 0 0; color: #8b5cf6;">{{ resumen.cupones_activos }}</p>
      </div>
    </div>

    <div v-if="!cargando" class="card" style="max-width: 100%; padding: 0; overflow-x: auto; margin-bottom: 2rem;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <tr>
            <th style="padding: 1rem;">Nombre</th>
            <th style="padding: 1rem;">Email</th>
            <th style="padding: 1rem;">Segmento</th>
            <th style="padding: 1rem;">Última Visita</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in visitantes.slice(0, 10)" :key="v.id" style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 1rem;">{{ v.nombre }}</td>
            <td style="padding: 1rem;">{{ v.email }}</td>
            <td style="padding: 1rem;">
              <span style="background-color: #e5e7eb; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem;">{{ v.segmento }}</span>
            </td>
            <td style="padding: 1rem;">{{ v.ultima_visita ? v.ultima_visita.substring(0, 10) : 'Nunca' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear Campaña -->
    <div v-if="mostrarModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50;">
      <div class="card" style="max-width: 500px;">
        <h3 style="margin-top: 0;">Nueva Campaña</h3>
        <form @submit.prevent="crearCampana">
          <input v-model="formCampana.nombre" placeholder="Nombre de la campaña" required />
          <select v-model="formCampana.segmento_objetivo" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="vip">VIP</option>
            <option value="frecuente">Frecuente</option>
            <option value="en_riesgo">En Riesgo</option>
            <option value="ocasional">Ocasional</option>
          </select>
          <input v-model="formCampana.descuento_porcentaje" type="number" placeholder="Descuento (%)" required />
          <label style="font-size: 0.875rem;">Inicio:</label>
          <input v-model="formCampana.fecha_inicio" type="date" required />
          <label style="font-size: 0.875rem;">Fin:</label>
          <input v-model="formCampana.fecha_fin" type="date" required />
          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button type="button" @click="mostrarModal = false" style="background-color: #6b7280;">Cancelar</button>
            <button type="submit" style="background-color: #2563eb;">Crear</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Canje de cupones -->
    <div style="display: flex; gap: 1rem; margin-top: 2rem; align-items: flex-end;">
      <div style="flex: 1;">
        <label style="font-size: 0.875rem; color: #374151;">Canjear un cupón:</label>
        <input v-model="codigoCanje" placeholder="Ingresa el código del cupón" style="width: 100%; padding: 0.75rem; margin-top: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;" />
      </div>
      <button @click="canjearCupon" style="background-color: #2563eb; width: auto; padding: 0.75rem 1.5rem;">Canjear</button>
    </div>
    <div v-if="mensajeCanje" style="margin-top: 1rem; color: #16a34a; font-weight: bold;">
      {{ mensajeCanje }}
    </div>
  </MainLayout>
</template>
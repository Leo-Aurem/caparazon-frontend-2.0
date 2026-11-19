<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/MainLayout.vue'
import api from '../services/api'

const contratos = ref([])
const locatarios = ref([])
const espacios = ref([])
const cargando = ref(true)
const mostrarModal = ref(false)
const contratoEditando = ref(null)

const form = ref({ 
  locatario_id: '', espacio_id: '', codigo: '', 
  fecha_inicio: '', fecha_fin: '', monto_mensual: '', 
  estado: 'Vigente', observaciones: '' 
})

const cargarDatos = async () => {
  cargando.value = true
  try {
    const [resContratos, resLocatarios, resEspacios] = await Promise.all([
      api.get('/contratos'),
      api.get('/locatarios'),
      api.get('/espacios')
    ])
    contratos.value = resContratos.data.data || resContratos.data
    locatarios.value = resLocatarios.data.data || resLocatarios.data
    espacios.value = resEspacios.data.data || resEspacios.data
  } catch (e) {
    console.error(e)
  } finally {
    cargando.value = false
  }
}

const abrirModal = (con = null) => {
  if (con) {
    contratoEditando.value = con.id
    form.value = { 
      ...con, 
      fecha_inicio: con.fecha_inicio.split('T')[0], 
      fecha_fin: con.fecha_fin.split('T')[0] 
    }
  } else {
    contratoEditando.value = null
    form.value = { locatario_id: '', espacio_id: '', codigo: '', fecha_inicio: '', fecha_fin: '', monto_mensual: '', estado: 'Vigente', observaciones: '' }
  }
  mostrarModal.value = true
}

const guardar = async () => {
  try {
    if (contratoEditando.value) {
      await api.put(`/contratos/${contratoEditando.value}`, form.value)
    } else {
      await api.post('/contratos', form.value)
    }
    mostrarModal.value = false
    cargarDatos()
  } catch (e) {
    alert('Error al guardar. Revisa los datos.')
  }
}

const eliminar = async (id) => {
  if (confirm('¿Eliminar este contrato?')) {
    await api.delete(`/contratos/${id}`)
    cargarDatos()
  }
}

onMounted(cargarDatos)
</script>

<template>
  <MainLayout>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2 style="margin: 0;">Gestión de Contratos</h2>
      <button @click="abrirModal()" style="width: auto; padding: 0.5rem 1rem; background-color: #16a34a;">+ Nuevo Contrato</button>
    </div>

    <div class="card" style="max-width: 100%; padding: 0; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <tr>
            <th style="padding: 1rem;">Código</th>
            <th style="padding: 1rem;">Locatario</th>
            <th style="padding: 1rem;">Espacio</th>
            <th style="padding: 1rem;">Vencimiento</th>
            <th style="padding: 1rem;">Estado</th>
            <th style="padding: 1rem;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando"><td colspan="6" style="padding: 1rem; text-align: center;">Cargando datos...</td></tr>
          <tr v-else-if="contratos.length === 0"><td colspan="6" style="padding: 1rem; text-align: center;">No hay contratos.</td></tr>
          <tr v-for="con in contratos" :key="con.id" style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 1rem;">{{ con.codigo }}</td>
            <td style="padding: 1rem;">{{ con.locatario?.nombre }}</td>
            <td style="padding: 1rem;">{{ con.espacio?.codigo }}</td>
            <td style="padding: 1rem;">{{ con.fecha_fin }}</td>
            <td style="padding: 1rem;">
              <span :style="con.estado === 'Vigente' ? 'background:#dcfce7; color:#166534; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.875rem;' : (con.estado === 'Vencido' ? 'background:#fee2e2; color:#991b1b; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.875rem;' : 'background:#fef3c7; color:#92400e; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.875rem;')">
                {{ con.estado }}
              </span>
            </td>
            <td style="padding: 1rem;">
              <button @click="abrirModal(con)" style="width: auto; padding: 0.25rem 0.5rem; background-color: #3b82f6; margin-right: 0.5rem;">Editar</button>
              <button @click="eliminar(con.id)" style="width: auto; padding: 0.25rem 0.5rem; background-color: #ef4444;">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="mostrarModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50;">
      <div class="card" style="max-width: 500px;">
        <h3 style="margin-top: 0;">{{ contratoEditando ? 'Editar Contrato' : 'Nuevo Contrato' }}</h3>
        <form @submit.prevent="guardar">
          <input v-model="form.codigo" placeholder="Código (Ej. C-001)" required />
          
          <select v-model="form.locatario_id" required style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="" disabled>Seleccione Locatario</option>
            <option v-for="loc in locatarios" :key="loc.id" :value="loc.id">{{ loc.nombre }}</option>
          </select>

          <select v-model="form.espacio_id" required style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="" disabled>Seleccione Espacio</option>
            <option v-for="esp in espacios" :key="esp.id" :value="esp.id">{{ esp.codigo }} ({{ esp.piso }})</option>
          </select>

          <label style="font-size: 0.875rem;">Fecha Inicio:</label>
          <input v-model="form.fecha_inicio" type="date" required />
          
          <label style="font-size: 0.875rem;">Fecha Fin:</label>
          <input v-model="form.fecha_fin" type="date" required />
          
          <input v-model="form.monto_mensual" type="number" placeholder="Monto Mensual (Bs.)" required />
          
          <select v-model="form.estado" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #d1d5db; border-radius: 4px;">
            <option value="Vigente">Vigente</option>
            <option value="Por vencer">Por vencer</option>
            <option value="Vencido">Vencido</option>
            <option value="Rescindido">Rescindido</option>
          </select>

          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button type="button" @click="mostrarModal = false" style="background-color: #6b7280;">Cancelar</button>
            <button type="submit" style="background-color: #2563eb;">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

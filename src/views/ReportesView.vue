<script setup>
import MainLayout from '../components/MainLayout.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const token = auth.token

const descargarPDF = (tipo) => {
  window.open(`http://127.0.0.1:8000/api/reportes/${tipo}/pdf?token=${token}`, '_blank')
}
const descargarExcel = (tipo) => {
  window.open(`http://127.0.0.1:8000/api/reportes/${tipo}/excel?token=${token}`, '_blank')
}
</script>

<template>
  <MainLayout>
    <h2>Generación de Reportes</h2>
    <p style="color: #6b7280;">Selecciona el tipo de documento que deseas descargar.</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
      
      <div class="card">
        <h3>Locatarios</h3>
        <p>Listado completo de comerciantes registrados.</p>
        <div style="display: flex; gap: 1rem;">
          <button @click="descargarPDF('locatarios')" style="background-color: #ef4444;">Descargar PDF</button>
          <button @click="descargarExcel('locatarios')" style="background-color: #16a34a;">Descargar Excel</button>
        </div>
      </div>

      <div class="card">
        <h3>Incidencias</h3>
        <p>Historial de problemas reportados en el mall.</p>
        <div style="display: flex; gap: 1rem;">
          <button @click="descargarPDF('incidencias')" style="background-color: #ef4444;">Descargar PDF</button>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

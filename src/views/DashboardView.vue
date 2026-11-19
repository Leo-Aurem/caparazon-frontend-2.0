<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/MainLayout.vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const stats = ref({ locatarios: 0, espacios: 0, incidencias: 0 })

onMounted(async () => {
  try {
    // Hacemos las peticiones con un .catch para que, si el rol no tiene permiso,
    // devuelva un array vacío en lugar de lanzar un error.
    const [loc, esp, inc] = await Promise.all([
      api.get('/locatarios').catch(() => ({ data: [] })),
      api.get('/espacios').catch(() => ({ data: [] })),
      api.get('/incidencias').catch(() => ({ data: [] }))
    ])
    
    // Validamos si Laravel devuelve un paginador (.data) o un array directo
    stats.value = {
      locatarios: loc.data.total !== undefined ? loc.data.total : loc.data.length,
      espacios: esp.data.total !== undefined ? esp.data.total : esp.data.length,
      incidencias: inc.data.total !== undefined ? inc.data.total : inc.data.length
    }
  } catch (e) {
    console.error('Error general cargando KPIs', e)
  }
})
</script>

<template>
  <MainLayout>
    <!-- Bienvenida -->
    <section class="welcome">
      <div>
        <p class="welcome-date">{{ new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
        <h2>Resumen General</h2>
        <p class="welcome-sub">Hola, <strong>{{ auth.user?.name }}</strong>. Este es el estado actual del Mall Center Caparazón.</p>
      </div>
      <span class="welcome-role">{{ auth.role }}</span>
    </section>

    <div class="grid grid-kpi">

      <!-- Tarjeta Locatarios (Solo se muestra si tiene datos o si es Admin/Operador) -->
      <div v-if="['Administrador', 'Operador'].includes(auth.role)" class="card kpi">
        <div class="kpi-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="kpi-body">
          <h3>Locatarios Activos</h3>
          <p class="kpi-value">{{ stats.locatarios }}</p>
          <span class="kpi-note">Negocios registrados en el mall</span>
        </div>
      </div>

      <!-- Tarjeta Espacios -->
      <div class="card kpi">
        <div class="kpi-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z" /><path d="M8 2v16" /><path d="M16 6v16" />
          </svg>
        </div>
        <div class="kpi-body">
          <h3>Espacios Totales</h3>
          <p class="kpi-value">{{ stats.espacios }}</p>
          <span class="kpi-note">Locales y áreas comerciales</span>
        </div>
      </div>

      <!-- Tarjeta Incidencias -->
      <div class="card kpi">
        <div class="kpi-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>
        <div class="kpi-body">
          <h3>Incidencias Registradas</h3>
          <p class="kpi-value">{{ stats.incidencias }}</p>
          <span class="kpi-note">Reportes operativos del mall</span>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<style scoped>
.welcome {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  margin-bottom: 1.5rem; padding: 1.6rem 1.8rem; color: #fff; border-radius: 16px;
  background:
    radial-gradient(400px 200px at 100% 0%, rgba(139, 92, 246, .45), transparent 70%),
    linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%);
  box-shadow: 0 12px 28px -12px rgba(67, 56, 202, .55);
}
.welcome h2 { color: #fff; font-size: 1.6rem; font-weight: 800; letter-spacing: -.02em; }
.welcome-date { margin-bottom: .3rem; font-size: .78rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #a5b4fc; }
.welcome-sub { margin-top: .35rem; color: #c7d2fe; font-size: .92rem; }
.welcome-sub strong { color: #fff; }
.welcome-role { padding: .4rem .95rem; font-size: .78rem; font-weight: 600; color: #e0e7ff; background: rgba(255, 255, 255, .12); border: 1px solid rgba(255, 255, 255, .2); border-radius: 999px; }

.kpi { display: flex; align-items: center; gap: 1.1rem; padding: 1.4rem; }
.kpi:hover { transform: translateY(-2px); }
.kpi-icon { width: 54px; height: 54px; flex-shrink: 0; display: grid; place-items: center; border-radius: 15px; }
.kpi-icon svg { width: 26px; height: 26px; }
.kpi-icon.blue { color: #2563eb; background: #dbeafe; }
.kpi-icon.green { color: #16a34a; background: #dcfce7; }
.kpi-icon.orange { color: #ea580c; background: #ffedd5; }
.kpi-body h3 { font-size: .82rem; font-weight: 600; color: var(--slate-500, #64748b); letter-spacing: 0; }
.kpi-value { margin-top: .15rem; font-size: 2.3rem; font-weight: 800; line-height: 1.1; letter-spacing: -.03em; color: var(--slate-900, #0f172a); }
.kpi-note { display: block; margin-top: .2rem; font-size: .76rem; color: var(--slate-400, #94a3b8); }

@media (max-width: 560px) {
  .welcome { padding: 1.2rem; }
  .welcome h2 { font-size: 1.35rem; }
}
</style>
<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { computed, ref, onMounted } from 'vue'
import api from '../services/api'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const notificaciones = ref([])
const mostrarPanel = ref(false)

const cerrarSesion = async () => {
  await auth.logout()
  router.push('/directorio')
}

// MATRIZ DE ROLES SEGÚN TABLA 10
const menuItems = computed(() => {
  const items = [{ name: 'Dashboard', path: '/dashboard' }]
  const rol = auth.role

  // Locatarios y Contratos (Admin, Operador)
  if (rol === 'Administrador' || rol === 'Operador') {
    items.push({ name: 'Locatarios', path: '/locatarios' })
    items.push({ name: 'Contratos', path: '/contratos' })
  }

  // Espacios (Admin, Supervisor y Operador para solo lectura)
  if (rol === 'Administrador' || rol === 'Supervisor' || rol === 'Operador') {
    items.push({ name: 'Espacios', path: '/espacios' })
  }

  // Incidencias (Todos)
  if (['Administrador', 'Supervisor', 'Seguridad', 'Operador', 'Locatario'].includes(rol)) {
    items.push({ name: 'Incidencias', path: '/incidencias' })
  }

  // Fidelización (Admin, Operador)
  if (rol === 'Administrador' || rol === 'Operador') {
    items.push({ name: 'Fidelizacion', path: '/fidelizacion' })
  }

  // Reportes (Solo Admin)
  if (rol === 'Administrador') {
    items.push({ name: 'Reportes', path: '/reportes' })
  }

  return items
})

const cargarNotificaciones = async () => {
  try {
    const { data } = await api.get('/notificaciones')
    notificaciones.value = data
  } catch (e) {
    // Si da error (por ejemplo, si el rol no tiene notificaciones), no hace nada
    notificaciones.value = []
  }
}

const leerNotificacion = async (n) => {
  if (!n.leida) {
    await api.post('/notificaciones/leer', { id: n.id })
    n.leida = true
  }
  if (n.ruta) router.push(n.ruta)
  mostrarPanel.value = false
}

onMounted(cargarNotificaciones)

/* ------------------------------------------------------------------
   SOLO APOYO VISUAL (no cambian la lógica de negocio de arriba):
   menú móvil, contador de no leídas, iniciales del avatar e iconos.
------------------------------------------------------------------- */
const menuAbierto = ref(false)

const noLeidas = computed(() => notificaciones.value.filter(n => !n.leida).length)

const iniciales = computed(() =>
  (auth.user?.name || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
)

const ICONOS = {
  Dashboard: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  Locatarios: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  Contratos: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  Espacios: ['M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z', 'M8 2v16', 'M16 6v16'],
  Incidencias: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  Fidelizacion: ['M20 12v10H4V12', 'M2 7h20v5H2z', 'M12 22V7', 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z', 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'],
  Reportes: ['M12 20V10', 'M18 20V4', 'M6 20v-4'],
  Default: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0']
}
const icono = (nombre) => ICONOS[nombre] || ICONOS.Default
</script>

<template>
  <div class="shell">
    <!-- Fondo oscuro al abrir el menú en móvil -->
    <Transition name="fade">
      <div v-if="menuAbierto" class="scrim" @click="menuAbierto = false"></div>
    </Transition>

    <!-- ================= BARRA LATERAL ================= -->
    <aside class="sidebar" :class="{ open: menuAbierto }">
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 15a9 9 0 0 1 18 0" /><path d="M3 15h18" /><path d="M7 15a5 5 0 0 1 10 0" /><path d="M5 19h14" />
          </svg>
        </div>
        <div class="brand-text">
          <strong>Caparazón</strong>
          <small>Sistema Experto</small>
        </div>
      </div>

      <div class="nav-label">Menú principal</div>
      <nav class="nav">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: route.path === item.path }"
          @click="menuAbierto = false"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path v-for="(d, i) in icono(item.name)" :key="i" :d="d" />
          </svg>
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>

      <div class="side-location">
        <span class="dot"></span>
        Zona La Vita · La Paz
      </div>

      <div class="user-card">
        <div class="avatar">{{ iniciales }}</div>
        <div class="user-info">
          <p class="user-name">{{ auth.user?.name }}</p>
          <small class="user-role">{{ auth.role }}</small>
        </div>
        <button class="logout" @click="cerrarSesion" title="Cerrar sesión" aria-label="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- ================= CONTENIDO ================= -->
    <main class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="icon-btn burger" @click="menuAbierto = true" aria-label="Abrir menú">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" />
            </svg>
          </button>
          <div>
            <h1 class="page-title">{{ route.name ? route.name.toUpperCase() : 'INICIO' }}</h1>
            <p class="page-sub">Mall Center Caparazón · Zona La Vita, cerca al Puente Vita</p>
          </div>
        </div>

        <!-- Campana de Notificaciones -->
        <div class="bell-wrap">
          <button class="icon-btn bell" @click="mostrarPanel = !mostrarPanel" aria-label="Notificaciones">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span v-if="noLeidas > 0" class="bell-badge">{{ noLeidas > 9 ? '9+' : noLeidas }}</span>
          </button>

          <div v-if="mostrarPanel" class="panel-backdrop" @click="mostrarPanel = false"></div>

          <Transition name="pop">
            <div v-if="mostrarPanel" class="panel">
              <div class="panel-head">
                <span>Notificaciones</span>
                <span v-if="noLeidas > 0" class="panel-chip">{{ noLeidas }} nuevas</span>
              </div>

              <div v-if="notificaciones.length === 0" class="panel-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No tienes notificaciones.</p>
              </div>

              <div class="panel-list">
                <div
                  v-for="n in notificaciones"
                  :key="n.id"
                  class="panel-item"
                  :class="{ unread: !n.leida }"
                  @click="leerNotificacion(n)"
                >
                  <span class="item-dot"></span>
                  <span class="item-text">{{ n.texto }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </header>

      <div class="content fade-up">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Variables con valor de respaldo: funciona aunque aún no hayas pegado el style.css global */
.shell {
  --sb-bg: #0f172a;
  --accent: var(--indigo-500, #6366f1);
  display: flex; height: 100vh; overflow: hidden;
  background: var(--slate-50, #f8fafc);
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
}

/* ---------- Barra lateral ---------- */
.sidebar {
  width: 268px; flex-shrink: 0; display: flex; flex-direction: column;
  color: #cbd5e1; padding: 1.25rem .9rem;
  background:
    radial-gradient(120% 60% at 0% 0%, rgba(99, 102, 241, .22), transparent 60%),
    var(--sb-bg);
  border-right: 1px solid rgba(255, 255, 255, .05);
  z-index: 60; transition: transform .3s cubic-bezier(.4, 0, .2, 1);
}
.brand { display: flex; align-items: center; gap: .75rem; padding: .25rem .5rem 1.4rem; }
.brand-logo {
  width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, #818cf8, #4f46e5);
  box-shadow: 0 6px 16px rgba(79, 70, 229, .45), inset 0 1px 0 rgba(255, 255, 255, .25);
}
.brand-logo svg { width: 22px; height: 22px; }
.brand-text strong { display: block; color: #fff; font-size: 1.05rem; font-weight: 700; letter-spacing: -.01em; }
.brand-text small { color: #94a3b8; font-size: .75rem; }

.nav-label { padding: 0 .75rem .5rem; font-size: .68rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #64748b; }
.nav { flex: 1; display: flex; flex-direction: column; gap: .2rem; overflow-y: auto; }
.nav-link {
  position: relative; display: flex; align-items: center; gap: .8rem; padding: .66rem .8rem;
  color: #94a3b8; text-decoration: none; font-size: .9rem; font-weight: 500; border-radius: 10px;
  transition: background .18s, color .18s, transform .18s;
}
.nav-icon { width: 19px; height: 19px; flex-shrink: 0; transition: color .18s, transform .18s; }
.nav-link:hover { background: rgba(255, 255, 255, .06); color: #fff; }
.nav-link:hover .nav-icon { transform: translateX(1px) scale(1.06); }
.nav-link.active { background: rgba(99, 102, 241, .18); color: #fff; }
.nav-link.active .nav-icon { color: #a5b4fc; }
.nav-link.active::before {
  content: ''; position: absolute; left: -.9rem; top: 22%; bottom: 22%; width: 4px; border-radius: 0 4px 4px 0; background: #818cf8;
}

.side-location {
  display: flex; align-items: center; gap: .5rem; margin: .8rem .5rem; padding: .55rem .75rem;
  font-size: .75rem; color: #94a3b8; border-radius: 10px; background: rgba(255, 255, 255, .04);
}
.side-location .dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 3px rgba(52, 211, 153, .2); }

.user-card {
  display: flex; align-items: center; gap: .7rem; padding: .7rem; border-radius: 12px;
  background: rgba(255, 255, 255, .05); border: 1px solid rgba(255, 255, 255, .06);
}
.avatar {
  width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center;
  font-size: .8rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.user-info { min-width: 0; flex: 1; }
.user-name { margin: 0; font-size: .85rem; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { display: block; color: #94a3b8; font-size: .72rem; }
.logout {
  width: 34px; height: 34px; padding: 0; flex-shrink: 0; display: grid; place-items: center;
  color: #94a3b8; background: transparent; border: 0; border-radius: 9px; box-shadow: none; cursor: pointer;
  transition: background .18s, color .18s;
}
.logout svg { width: 18px; height: 18px; }
.logout:hover { background: rgba(239, 68, 68, .15); color: #fca5a5; box-shadow: none; }

/* ---------- Zona principal ---------- */
.main { flex: 1; min-width: 0; overflow-y: auto; position: relative; }
.topbar {
  position: sticky; top: 0; z-index: 40; height: 68px; padding: 0 2rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  background: rgba(255, 255, 255, .82); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--slate-200, #e2e8f0);
}
.topbar-left { display: flex; align-items: center; gap: .9rem; min-width: 0; }
/* La ruta llega en MAYÚSCULAS desde el script: se muestra como "Dashboard" */
.page-title { margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--slate-900, #0f172a); letter-spacing: -.01em; text-transform: lowercase; }
.page-title::first-letter { text-transform: uppercase; }
.page-sub { margin: 0; font-size: .75rem; color: var(--slate-500, #64748b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.icon-btn {
  position: relative; width: 40px; height: 40px; padding: 0; display: grid; place-items: center; cursor: pointer;
  color: var(--slate-600, #475569); background: #fff; border: 1px solid var(--slate-200, #e2e8f0); border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, .05); transition: background .18s, border-color .18s, transform .12s;
}
.icon-btn svg { width: 19px; height: 19px; }
.icon-btn:hover { background: var(--slate-50, #f8fafc); border-color: var(--slate-300, #cbd5e1); box-shadow: 0 1px 2px rgba(15, 23, 42, .05); }
.icon-btn:active { transform: scale(.96); }
.burger { display: none; }

.bell-badge {
  position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 5px; display: grid; place-items: center;
  font-size: .68rem; font-weight: 700; color: #fff; background: #ef4444; border: 2px solid #fff; border-radius: 999px;
}
.bell-wrap { position: relative; }
.panel-backdrop { position: fixed; inset: 0; z-index: 45; }
.panel {
  position: absolute; right: 0; top: 52px; z-index: 50; width: 340px; max-width: calc(100vw - 2rem);
  background: #fff; border: 1px solid var(--slate-200, #e2e8f0); border-radius: 14px; overflow: hidden;
  box-shadow: 0 20px 40px -12px rgba(15, 23, 42, .25); transform-origin: top right;
}
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1rem; font-weight: 700; font-size: .9rem; border-bottom: 1px solid var(--slate-100, #f1f5f9); }
.panel-chip { font-size: .7rem; font-weight: 600; color: #4338ca; background: #e0e7ff; padding: .15rem .55rem; border-radius: 999px; }
.panel-list { max-height: 360px; overflow-y: auto; }
.panel-item { display: flex; gap: .7rem; padding: .85rem 1rem; font-size: .85rem; color: var(--slate-700, #334155); cursor: pointer; border-bottom: 1px solid var(--slate-100, #f1f5f9); transition: background .15s; }
.panel-item:last-child { border-bottom: 0; }
.panel-item:hover { background: var(--slate-50, #f8fafc); }
.panel-item.unread { background: #eef2ff; font-weight: 600; color: var(--slate-900, #0f172a); }
.panel-item.unread:hover { background: #e0e7ff; }
.item-dot { width: 8px; height: 8px; margin-top: .4rem; flex-shrink: 0; border-radius: 50%; background: transparent; }
.panel-item.unread .item-dot { background: #6366f1; }
.panel-empty { display: grid; justify-items: center; gap: .5rem; padding: 2rem 1rem; color: var(--slate-400, #94a3b8); font-size: .85rem; }
.panel-empty svg { width: 34px; height: 34px; }

.content { padding: 1.75rem 2rem 3rem; max-width: 1480px; margin: 0 auto; }

/* ---------- Transiciones ---------- */
.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active, .pop-leave-active { transition: opacity .16s ease, transform .16s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-6px) scale(.97); }
.scrim { position: fixed; inset: 0; z-index: 55; background: rgba(15, 23, 42, .55); backdrop-filter: blur(3px); }

/* ---------- Responsive ---------- */
@media (max-width: 1023px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-100%); box-shadow: 0 0 40px rgba(0, 0, 0, .4); }
  .sidebar.open { transform: none; }
  .burger { display: grid; }
  .topbar { padding: 0 1rem; }
  .content { padding: 1.25rem 1rem 2.5rem; }
}
@media (max-width: 560px) {
  .page-sub { display: none; }
}
</style>
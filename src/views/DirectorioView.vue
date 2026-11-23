<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Chatbot from '../components/Chatbot.vue'

const locatarios = ref([])
const router = useRouter()
const auth = useAuthStore()

// Filtros del directorio
const busqueda = ref('')
const rubroSeleccionado = ref('Todos')

// Modal de detalle de negocio
const negocioSeleccionado = ref(null)

// Variables para el Login Modal
const mostrarLogin = ref(false)
const email = ref('admin@caparazon.bo')
const password = ref('Caparazon2026!')
const errorMsg = ref('')
const cargando = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/directorio')
    locatarios.value = data.data || data
  } catch (e) {
    console.error("Error al cargar locatarios", e)
  }
})

const rubrosUnicos = computed(() => {
  const set = new Set(locatarios.value.map(l => l.rubro).filter(Boolean))
  return ['Todos', ...Array.from(set)]
})

const locatariosFiltrados = computed(() => {
  return locatarios.value.filter(loc => {
    const coincideTexto = !busqueda.value || 
      (loc.nombre || '').toLowerCase().includes(busqueda.value.toLowerCase()) ||
      (loc.rubro || '').toLowerCase().includes(busqueda.value.toLowerCase()) ||
      (loc.descripcion || '').toLowerCase().includes(busqueda.value.toLowerCase())
    const coincideRubro = rubroSeleccionado.value === 'Todos' || loc.rubro === rubroSeleccionado.value
    return coincideTexto && coincideRubro
  })
})

const abrirDetalleNegocio = (loc) => {
  negocioSeleccionado.value = loc
}

const handleLogin = async () => {
  cargando.value = true
  errorMsg.value = ''
  try {
    await auth.login(email.value, password.value)
    mostrarLogin.value = false
    router.push('/dashboard')
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Credenciales incorrectas'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="pub">
    <!-- Barra superior -->
    <nav class="pub-nav">
      <div class="pub-nav-inner">
        <div class="pub-brand">
          <div class="pub-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 15a9 9 0 0 1 18 0" /><path d="M3 15h18" /><path d="M7 15a5 5 0 0 1 10 0" /><path d="M5 19h14" />
            </svg>
          </div>
          <span>Caparazón</span>
        </div>
        <button class="btn pub-login" @click="mostrarLogin = true" title="Acceso al Sistema">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Acceso al sistema
        </button>
      </div>
    </nav>

    <!-- Cabecera principal -->
    <header class="hero">
      <div class="hero-inner">
        <span class="hero-chip">Directorio comercial</span>
        <h1>Mall Center Caparazón</h1>
        <p class="hero-loc">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          Zona La Vita, cerca al Puente Vita, La Paz - Bolivia
        </p>
        <p class="hero-sub">Descubre los mejores locales y servicios que tenemos para ti.</p>
        <div v-if="locatarios.length" class="hero-stat">
          <strong>{{ locatarios.length }}</strong>
          <span>tiendas y servicios</span>
        </div>
      </div>
    </header>

    <!-- Directorio de Tiendas -->
    <main class="pub-main">
      <div class="section-head">
        <h2>Directorio de Tiendas</h2>
        <p>Haz clic en cualquier negocio para ver su ubicación, horarios y detalles completos.</p>
      </div>

      <!-- Barra de búsqueda y filtro -->
      <div v-if="locatarios.length > 0" class="filter-bar">
        <input 
          v-model="busqueda" 
          type="text" 
          class="filter-input" 
          placeholder="Buscar tienda por nombre o servicio..." 
        />
        <select v-model="rubroSeleccionado" class="filter-select">
          <option v-for="rubro in rubrosUnicos" :key="rubro" :value="rubro">
            {{ rubro === 'Todos' ? 'Todos los rubros' : rubro }}
          </option>
        </select>
      </div>

      <div v-if="locatarios.length === 0" class="card empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" />
        </svg>
        <p>Cargando el directorio de tiendas…</p>
      </div>

      <div v-else-if="locatariosFiltrados.length === 0" class="card empty">
        <p>No se encontraron negocios con ese criterio de búsqueda.</p>
      </div>

      <div v-else class="grid grid-cards">
        <article 
          v-for="loc in locatariosFiltrados" 
          :key="loc.id" 
          class="shop clickable"
          @click="abrirDetalleNegocio(loc)"
        >
          <div class="shop-top">
            <div class="shop-avatar">{{ (loc.nombre || '?').charAt(0).toUpperCase() }}</div>
            <span class="badge badge-green"><i class="live"></i> Abierto</span>
          </div>
          <h3>{{ loc.nombre }}</h3>
          <p class="shop-rubro"><span class="badge badge-slate">{{ loc.rubro }}</span></p>
          <p class="shop-contact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {{ loc.telefono || 'Sin teléfono registrado' }}
          </p>
          <div class="shop-more">
            <span>Ver información del negocio →</span>
          </div>
        </article>
      </div>
    </main>

    <footer class="pub-foot">
      <strong>Mall Center Caparazón</strong>
      <span>Zona La Vita, cerca al Puente Vita · La Paz, Bolivia</span>
    </footer>

    <!-- Modal de Detalle del Negocio -->
    <div v-if="negocioSeleccionado" class="modal-backdrop" @click.self="negocioSeleccionado = null">
      <div class="modal detail-modal">
        <button class="close" @click="negocioSeleccionado = null" aria-label="Cerrar">×</button>
        
        <div class="detail-head">
          <div class="shop-avatar big">{{ (negocioSeleccionado.nombre || '?').charAt(0).toUpperCase() }}</div>
          <div>
            <span class="badge badge-slate">{{ negocioSeleccionado.rubro || 'Comercio General' }}</span>
            <h2>{{ negocioSeleccionado.nombre }}</h2>
          </div>
        </div>

        <p class="detail-desc">
          {{ negocioSeleccionado.descripcion || negocioSeleccionado.observaciones || 'Local comercial autorizado dentro del Mall Center Caparazón. Visítanos para conocer nuestros productos y promociones vigentes.' }}
        </p>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Ubicación / Local</span>
            <strong>
              {{ negocioSeleccionado.espacio?.codigo ? `Local ${negocioSeleccionado.espacio.codigo} (${negocioSeleccionado.espacio.piso || 'Planta Principal'})` : (negocioSeleccionado.ubicacion || 'Planta Comercial - Mall Caparazón') }}
            </strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">Teléfono de Contacto</span>
            <strong>{{ negocioSeleccionado.telefono || 'No disponible' }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">Correo Electrónico</span>
            <strong>{{ negocioSeleccionado.email || negocioSeleccionado.correo || 'contacto@caparazon.bo' }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">Horario de Atención</span>
            <strong>{{ negocioSeleccionado.horario || 'Lunes a Domingo · 09:00 a 21:00' }}</strong>
          </div>

          <div v-if="negocioSeleccionado.propietario || negocioSeleccionado.representante" class="detail-item full">
            <span class="detail-label">Responsable / Representante</span>
            <strong>{{ negocioSeleccionado.propietario || negocioSeleccionado.representante }}</strong>
          </div>
        </div>

        <div class="detail-actions">
          <a 
            v-if="negocioSeleccionado.telefono" 
            :href="`tel:${negocioSeleccionado.telefono}`" 
            class="btn submit"
            style="text-align: center; text-decoration: none;"
          >
            Llamar al negocio
          </a>
          <button type="button" class="btn btn-secondary" @click="negocioSeleccionado = null">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Login -->
    <div v-if="mostrarLogin" class="modal-backdrop" @click.self="mostrarLogin = false">
      <div class="modal login-modal">
        <button class="close" @click="mostrarLogin = false" aria-label="Cerrar">×</button>

        <div class="login-head">
          <div class="pub-logo big">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 15a9 9 0 0 1 18 0" /><path d="M3 15h18" /><path d="M7 15a5 5 0 0 1 10 0" /><path d="M5 19h14" />
            </svg>
          </div>
          <h2>Iniciar Sesión</h2>
          <p>Acceso exclusivo para personal y locatarios</p>
        </div>

        <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>

        <form @submit.prevent="handleLogin">
          <label>Correo Electrónico</label>
          <input v-model="email" type="email" required placeholder="usuario@caparazon.bo" />

          <label>Contraseña</label>
          <input v-model="password" type="password" required placeholder="••••••••" />

          <button type="submit" class="btn btn-block submit" :disabled="cargando">
            {{ cargando ? 'Verificando...' : 'Ingresar al Sistema' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Chatbot Flotante (A la derecha) -->
    <Chatbot />
  </div>
</template>

<style scoped>
.pub { min-height: 100vh; background: var(--slate-50, #f8fafc); display: flex; flex-direction: column; }

/* ---------- Barra superior ---------- */
.pub-nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(15, 23, 42, .82); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
}
.pub-nav-inner { max-width: 1200px; margin: 0 auto; padding: .8rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
.pub-brand { display: flex; align-items: center; gap: .7rem; color: #fff; font-weight: 700; font-size: 1.05rem; letter-spacing: -.01em; }
.pub-logo {
  width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, #818cf8, #4f46e5); box-shadow: 0 6px 16px rgba(79, 70, 229, .45);
}
.pub-logo svg { width: 21px; height: 21px; }
.pub-logo.big { width: 52px; height: 52px; border-radius: 15px; margin: 0 auto .9rem; }
.pub-logo.big svg { width: 28px; height: 28px; }
.pub-login svg { width: 16px; height: 16px; }

/* ---------- Hero ---------- */
.hero {
  position: relative; overflow: hidden; color: #fff; text-align: center; padding: 4.5rem 1.5rem 5rem;
  background:
    radial-gradient(600px 300px at 15% 0%, rgba(99, 102, 241, .45), transparent 70%),
    radial-gradient(500px 300px at 90% 100%, rgba(139, 92, 246, .35), transparent 70%),
    linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
}
.hero::after {
  content: ''; position: absolute; inset: 0; opacity: .25; pointer-events: none;
  background-image: linear-gradient(rgba(255, 255, 255, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, .06) 1px, transparent 1px);
  background-size: 44px 44px; mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%); -webkit-mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
}
.hero-inner { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
.hero-chip { display: inline-block; padding: .3rem .85rem; margin-bottom: 1.1rem; font-size: .75rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #c7d2fe; background: rgba(99, 102, 241, .22); border: 1px solid rgba(165, 180, 252, .3); border-radius: 999px; }
.hero h1 { color: #fff; font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800; letter-spacing: -.03em; line-height: 1.1; }
.hero-loc { display: inline-flex; align-items: center; gap: .5rem; margin-top: 1.1rem; padding: .5rem 1rem; font-size: .92rem; color: #e0e7ff; background: rgba(255, 255, 255, .09); border: 1px solid rgba(255, 255, 255, .14); border-radius: 999px; }
.hero-loc svg { width: 17px; height: 17px; color: #a5b4fc; flex-shrink: 0; }
.hero-sub { margin-top: 1rem; color: #cbd5e1; font-size: 1.05rem; }
.hero-stat { display: inline-flex; align-items: baseline; gap: .5rem; margin-top: 1.6rem; }
.hero-stat strong { font-size: 2rem; font-weight: 800; color: #fff; }
.hero-stat span { color: #a5b4fc; font-size: .9rem; }

/* ---------- Directorio y Filtros ---------- */
.pub-main { flex: 1; width: 100%; max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem 4rem; }
.section-head { text-align: center; margin-bottom: 1.8rem; }
.section-head h2 { font-size: 1.7rem; font-weight: 800; letter-spacing: -.02em; }
.section-head p { margin-top: .4rem; color: var(--slate-500, #64748b); }

.filter-bar { display: flex; gap: .8rem; max-width: 680px; margin: 0 auto 2rem; flex-wrap: wrap; }
.filter-input { flex: 1; min-width: 220px; margin-bottom: 0; background: #fff; }
.filter-select { width: auto; min-width: 190px; padding: .7rem .9rem; border: 1px solid var(--slate-200, #e2e8f0); border-radius: 10px; background: #fff; color: var(--slate-700, #334155); font-size: .92rem; }

.shop {
  position: relative; padding: 1.35rem; background: #fff; border: 1px solid var(--slate-200, #e2e8f0); border-radius: 14px;
  box-shadow: var(--shadow-sm); transition: transform .22s var(--ease), box-shadow .22s var(--ease), border-color .22s var(--ease);
  display: flex; flex-direction: column;
}
.shop.clickable { cursor: pointer; }
.shop::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 3px; border-radius: 14px 14px 0 0; background: linear-gradient(90deg, #6366f1, #8b5cf6); opacity: 0; transition: opacity .22s; }
.shop:hover { transform: translateY(-4px); box-shadow: 0 16px 32px -12px rgba(79, 70, 229, .25); border-color: var(--indigo-300, #a5b4fc); }
.shop:hover::before { opacity: 1; }
.shop-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.shop-avatar { width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; font-weight: 800; font-size: 1.2rem; color: var(--indigo-700, #4338ca); background: var(--indigo-50, #eef2ff); flex-shrink: 0; }
.shop-avatar.big { width: 58px; height: 58px; font-size: 1.5rem; border-radius: 16px; }
.shop h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: .55rem; }
.shop-rubro { margin-bottom: .9rem; }
.shop-contact { display: flex; align-items: center; gap: .5rem; color: var(--slate-600, #475569); font-size: .88rem; }
.shop-contact svg { width: 15px; height: 15px; color: var(--slate-400, #94a3b8); flex-shrink: 0; }
.shop-more { margin-top: 1rem; padding-top: .75rem; border-top: 1px solid var(--slate-100, #f1f5f9); font-size: .82rem; font-weight: 600; color: var(--indigo-600, #4f46e5); }
.live { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34, 197, 94, .25); }

.empty { display: grid; justify-items: center; gap: .8rem; padding: 3rem 1rem; color: var(--slate-500, #64748b); text-align: center; }
.empty svg { width: 44px; height: 44px; color: var(--slate-300, #cbd5e1); }

.pub-foot { display: flex; flex-direction: column; align-items: center; gap: .25rem; padding: 1.8rem 1rem; text-align: center; color: #94a3b8; font-size: .85rem; background: #0f172a; }
.pub-foot strong { color: #e2e8f0; }

/* ---------- Modal de Detalle del Negocio ---------- */
.detail-modal { position: relative; max-width: 520px; padding: 2rem; }
.detail-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; padding-right: 1.5rem; }
.detail-head h2 { font-size: 1.45rem; font-weight: 800; margin-top: .35rem; line-height: 1.2; }
.detail-desc { color: var(--slate-600, #475569); font-size: .94rem; line-height: 1.55; margin-bottom: 1.4rem; padding: .9rem 1rem; background: var(--slate-50, #f8fafc); border-radius: 10px; border: 1px solid var(--slate-100, #f1f5f9); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.6rem; }
.detail-item { display: flex; flex-direction: column; gap: .2rem; }
.detail-item.full { grid-column: 1 / -1; }
.detail-label { font-size: .76rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--slate-400, #94a3b8); }
.detail-item strong { font-size: .92rem; color: var(--slate-800, #1e293b); }
.detail-actions { display: flex; gap: .8rem; }
.detail-actions > * { flex: 1; }
.btn-secondary { background: var(--slate-100, #f1f5f9); color: var(--slate-700, #334155); border: 1px solid var(--slate-200, #e2e8f0); box-shadow: none; }
.btn-secondary:hover { background: var(--slate-200, #e2e8f0); }

/* ---------- Modal de login ---------- */
.login-modal { position: relative; max-width: 420px; padding: 2.2rem 2rem 2rem; }
.close {
  position: absolute; top: .8rem; right: .8rem; width: 34px; height: 34px; padding: 0; display: grid; place-items: center;
  font-size: 1.4rem; line-height: 1; color: var(--slate-400, #94a3b8); background: transparent; border: 0; border-radius: 9px; box-shadow: none;
}
.close:hover { color: var(--slate-700, #334155); background: var(--slate-100, #f1f5f9); box-shadow: none; }
.login-head { text-align: center; margin-bottom: 1.5rem; }
.login-head h2 { font-size: 1.4rem; font-weight: 800; }
.login-head p { margin-top: .35rem; color: var(--slate-500, #64748b); font-size: .88rem; }
.login-error { margin-bottom: 1rem; padding: .7rem .9rem; font-size: .86rem; text-align: center; color: var(--red-700, #b91c1c); background: var(--red-50, #fef2f2); border: 1px solid var(--red-100, #fee2e2); border-radius: 10px; }
.submit { margin-top: .4rem; padding: .8rem 1rem; font-size: .95rem; }

@media (max-width: 560px) {
  .hero { padding: 3rem 1rem 3.5rem; }
  .pub-login { padding: .55rem .8rem; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
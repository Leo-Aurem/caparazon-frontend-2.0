import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/directorio', name: 'directorio', component: () => import('../views/DirectorioView.vue'), meta: { public: true } },
  { path: '/', redirect: '/dashboard' },
  
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
  
  // Locatarios y Contratos (Admin, Operador)
  { path: '/locatarios', name: 'locatarios', component: () => import('../views/LocatariosView.vue'), meta: { requiresAuth: true, roles: ['Administrador','Operador'] } },
  { path: '/contratos', name: 'contratos', component: () => import('../views/ContratosView.vue'), meta: { requiresAuth: true, roles: ['Administrador','Operador'] } },
  
  // Espacios (Admin, Supervisor, Operador)
  { path: '/espacios', name: 'espacios', component: () => import('../views/EspaciosView.vue'), meta: { requiresAuth: true, roles: ['Administrador','Supervisor','Operador'] } },
  
  // Incidencias (Todos los roles)
  { path: '/incidencias', name: 'incidencias', component: () => import('../views/IncidenciasView.vue'), meta: { requiresAuth: true, roles: ['Administrador','Supervisor','Seguridad','Operador','Locatario'] } },
  
  // Fidelización (Admin, Operador)
  { path: '/fidelizacion', name: 'fidelizacion', component: () => import('../views/FidelizacionView.vue'), meta: { requiresAuth: true, roles: ['Administrador','Operador'] } },
  
  // Reportes (Solo Admin)
  { path: '/reportes', name: 'reportes', component: () => import('../views/ReportesView.vue'), meta: { requiresAuth: true, roles: ['Administrador'] } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  
  // 1. Si no está logueado y la ruta lo requiere, al login
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' }
  
  // 2. Si la ruta requiere roles y el usuario no lo tiene, lo pateamos al dashboard
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'dashboard' }
  }
  
  // 3. Si ya está logueado e intenta ir al login, al dashboard
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'dashboard' }
  
  return true
})

export default router
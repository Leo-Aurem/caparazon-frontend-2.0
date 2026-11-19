<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('administrador@caparazon.bo')
const password = ref('Caparazon2026!')
const errorMsg = ref('')
const cargando = ref(false)

const auth = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  cargando.value = true
  errorMsg.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Error al conectar con el servidor'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div style='display: flex; height: 100vh; align-items: center; justify-content: center;'>
    <div class="card">
      <h2 style='text-align: center; margin-top: 0;'>Mall Center Caparazón</h2>
      <p style='text-align: center; color: #6b7280; margin-bottom: 2rem;'>Ingresa tus credenciales</p>
      
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

      <form @submit.prevent="handleLogin">
        <input v-model="email" type="email" placeholder="Correo electrónico" required />
        <input v-model="password" type="password" placeholder="Contraseña" required />
        <button type="submit" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
      </form>
    </div>
  </div>
</template>

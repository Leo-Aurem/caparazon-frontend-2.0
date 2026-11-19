<script setup>
import { ref, nextTick } from 'vue'
import api from '../services/api'

const abierto = ref(false)
const mensaje = ref('')
const chatRef = ref(null)
const cargando = ref(false)

const historial = ref([
  { rol: 'bot', texto: '¡Hola! Soy el asistente virtual del Mall Caparazón. Pregúntame sobre horarios, ubicación o tiendas.' }
])

const enviarMensaje = async () => {
  if (!mensaje.value.trim()) return

  const textoUsuario = mensaje.value
  historial.value.push({ rol: 'user', texto: textoUsuario })
  mensaje.value = ''
  cargando.value = true
  scrollAbajo()

  try {
    // Ahora llamamos a Laravel (puerto 8000), no a Python
    const { data } = await api.post('/chat', { mensaje: textoUsuario })
    historial.value.push({ rol: 'bot', texto: data.respuesta })
  } catch (e) {
    historial.value.push({ rol: 'bot', texto: 'Lo siento, hubo un error de conexión con el servidor.' })
  } finally {
    cargando.value = false
    scrollAbajo()
  }
}

const scrollAbajo = () => {
  nextTick(() => {
    if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight
  })
}
</script>

<template>
  <div>
    <button @click="abierto = !abierto" style="position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background-color: #2563eb; color: white; font-size: 24px; border: none; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 100;">
      💬
    </button>

    <div v-if="abierto" style="position: fixed; bottom: 90px; right: 20px; width: 350px; height: 450px; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; z-index: 100; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background-color: #1f2937; color: white; padding: 1rem; font-weight: bold;">
        Asistente Virtual IA
      </div>

      <div ref="chatRef" style="flex: 1; padding: 1rem; overflow-y: auto; background-color: #f9fafb;">
        <div v-for="(msg, i) in historial" :key="i" :style="msg.rol === 'user' ? 'text-align: right; margin-bottom: 1rem;' : 'text-align: left; margin-bottom: 1rem;'">
          <span :style="msg.rol === 'user' ? 'background-color: #2563eb; color: white; padding: 0.5rem 0.75rem; border-radius: 12px 12px 0 12px; display: inline-block; max-width: 80%;' : 'background-color: #e5e7eb; color: #374151; padding: 0.5rem 0.75rem; border-radius: 12px 12px 12px 0; display: inline-block; max-width: 80%;'">
            {{ msg.texto }}
          </span>
        </div>
        <div v-if="cargando" style="color: #6b7280; font-size: 0.875rem;">Escribiendo...</div>
      </div>

      <div style="padding: 0.5rem; border-top: 1px solid #e5e7eb; display: flex;">
        <input v-model="mensaje" @keyup.enter="enviarMensaje" placeholder="Escribe tu pregunta..." style="flex: 1; border: none; padding: 0.5rem; outline: none; margin-bottom: 0;" />
        <button @click="enviarMensaje" style="width: auto; padding: 0.5rem 1rem;">Enviar</button>
      </div>
    </div>
  </div>
</template>
import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('caparazon_token') || null,
    user: JSON.parse(localStorage.getItem('caparazon_user') || 'null'),
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
    role: (s) => s.user?.role || null,
    tieneRol: (s) => (...roles) => roles.includes(s.user?.role),
  },
  actions: {
    async login(email, password) {
      const { data } = await api.post('/login', { email, password })
      this.token = data.access_token
      this.user = data.user
      localStorage.setItem('caparazon_token', this.token)
      localStorage.setItem('caparazon_user', JSON.stringify(this.user))
      return data
    },
    async logout() {
      try { await api.post('/logout') } catch (_) {}
      this.token = null
      this.user = null
      localStorage.removeItem('caparazon_token')
      localStorage.removeItem('caparazon_user')
    },
  },
})

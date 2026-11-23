import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContratosView from '../src/views/ContratosView.vue'
import api from '../src/services/api'

// Mock del cliente Axios
vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('CC-001: Pruebas de Caja Blanca - Módulo Contratos (HU-05)', () => {
  const mockEspacios = [
    { id: 1, codigo: 'L-101', piso: 'PB', estado: 'Disponible' },
    { id: 2, codigo: 'L-102', piso: 'P1', estado: 'Ocupado' }
  ]
  const mockLocatarios = [{ id: 1, nombre: 'Tienda Alfa' }]

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => {
      if (url === '/contratos') return Promise.resolve({ data: [] })
      if (url === '/locatarios') return Promise.resolve({ data: mockLocatarios })
      if (url === '/espacios') return Promise.resolve({ data: mockEspacios })
    })
  })

  const montarComponente = async () => {
    const wrapper = mount(ContratosView, {
      global: {
        stubs: { MainLayout: { template: '<div><slot /></div>' } }
      }
    })
    await flushPromises()
    await wrapper.find('[data-testid="btn-nuevo-contrato"]').trigger('click')
    return wrapper
  }

  it('WB-10.1: Camino 1 - Rechaza cuando faltan campos obligatorios (código, locatario o espacio)', async () => {
    const wrapper = await montarComponente()
    await wrapper.find('[data-testid="form-contrato"]').trigger('submit.prevent')

    expect(wrapper.find('[data-testid="mensaje-error"]').text()).toContain('campos obligatorios')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('WB-10.2: Camino 2 - Rechaza cuando faltan fechas de inicio o fin', async () => {
    const wrapper = await montarComponente()
    await wrapper.find('[data-testid="input-codigo"]').setValue('C-010')
    await wrapper.find('[data-testid="select-locatario"]').setValue(1)
    await wrapper.find('[data-testid="select-espacio"]').setValue(1)
    await wrapper.find('[data-testid="form-contrato"]').trigger('submit.prevent')

    expect(wrapper.find('[data-testid="mensaje-error"]').text()).toContain('especificar las fechas')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('WB-10.3: Camino 3 - Rechaza cuando fecha_fin es anterior o igual a fecha_inicio (RF-12)', async () => {
    const wrapper = await montarComponente()
    await wrapper.find('[data-testid="input-codigo"]').setValue('C-010')
    await wrapper.find('[data-testid="select-locatario"]').setValue(1)
    await wrapper.find('[data-testid="select-espacio"]').setValue(1)
    await wrapper.find('[data-testid="input-fecha-inicio"]').setValue('2026-12-01')
    await wrapper.find('[data-testid="input-fecha-fin"]').setValue('2026-11-01')
    await wrapper.find('[data-testid="form-contrato"]').trigger('submit.prevent')

    expect(wrapper.find('[data-testid="mensaje-error"]').text()).toContain('posterior a la fecha de inicio')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('WB-10.4: Camino 4 - Rechaza cuando el monto mensual es menor o igual a 0', async () => {
    const wrapper = await montarComponente()
    await wrapper.find('[data-testid="input-codigo"]').setValue('C-010')
    await wrapper.find('[data-testid="select-locatario"]').setValue(1)
    await wrapper.find('[data-testid="select-espacio"]').setValue(1)
    await wrapper.find('[data-testid="input-fecha-inicio"]').setValue('2026-11-01')
    await wrapper.find('[data-testid="input-fecha-fin"]').setValue('2027-11-01')
    await wrapper.find('[data-testid="input-monto"]').setValue(0)
    await wrapper.find('[data-testid="form-contrato"]').trigger('submit.prevent')

    expect(wrapper.find('[data-testid="mensaje-error"]').text()).toContain('mayor a 0')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('WB-10.5: Camino 5 - Rechaza crear contrato si el espacio ya está Ocupado', async () => {
    const wrapper = await montarComponente()
    await wrapper.find('[data-testid="input-codigo"]').setValue('C-010')
    await wrapper.find('[data-testid="select-locatario"]').setValue(1)
    await wrapper.find('[data-testid="select-espacio"]').setValue(2) // Espacio L-102 (Ocupado)
    await wrapper.find('[data-testid="input-fecha-inicio"]').setValue('2026-11-01')
    await wrapper.find('[data-testid="input-fecha-fin"]').setValue('2027-11-01')
    await wrapper.find('[data-testid="input-monto"]').setValue(1500)
    await wrapper.find('[data-testid="form-contrato"]').trigger('submit.prevent')

    expect(wrapper.find('[data-testid="mensaje-error"]').text()).toContain('ya se encuentra ocupado')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('WB-10.6: Camino 6 - Camino válido guarda el contrato correctamente vía POST', async () => {
    api.post.mockResolvedValue({ data: { id: 99 } })
    const wrapper = await montarComponente()
    
    await wrapper.find('[data-testid="input-codigo"]').setValue('C-010')
    await wrapper.find('[data-testid="select-locatario"]').setValue(1)
    await wrapper.find('[data-testid="select-espacio"]').setValue(1) // Espacio L-101 (Disponible)
    await wrapper.find('[data-testid="input-fecha-inicio"]').setValue('2026-11-01')
    await wrapper.find('[data-testid="input-fecha-fin"]').setValue('2027-11-01')
    await wrapper.find('[data-testid="input-monto"]').setValue(1500)
    await wrapper.find('[data-testid="form-contrato"]').trigger('submit.prevent')
    await flushPromises()

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="mensaje-error"]').exists()).toBe(false)
  })
})
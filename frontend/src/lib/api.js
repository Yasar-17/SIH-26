import { API_BASE } from './constants'

const REQUEST_TIMEOUT_MS = 15000

async function json(res) {
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    const msg = detail?.detail?.message || detail?.detail || `HTTP ${res.status}`
    throw new Error(typeof msg === 'string' ? msg : `HTTP ${res.status}`)
  }
  return res.json()
}

function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  return fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal })
    .catch((error) => {
      if (error.name === 'AbortError') {
        throw new Error('The request timed out. Please try again.')
      }
      throw new Error('Unable to reach the classifier service. Please try again.')
    })
    .finally(() => clearTimeout(timeout))
}

export function getDetections(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return request(`/detections${qs ? `?${qs}` : ''}`).then(json)
}

export function getStats() {
  return request('/stats').then(json)
}

export function getDetection(id) {
  return request(`/detections/${id}`).then(json)
}

const BASE = '/api'

async function request(path, options) {
  const response = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (response.status === 204) return null

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.message ?? `Request failed (${response.status})`)
    error.fields = body?.fields ?? {}
    throw error
  }
  return body
}

export const getSyllabus = () => request('/syllabus')
export const getResults = () => request('/results')
export const saveResult = (payload) =>
  request('/results', { method: 'POST', body: JSON.stringify(payload) })
export const deleteResult = (prn) => request(`/results/${prn}`, { method: 'DELETE' })

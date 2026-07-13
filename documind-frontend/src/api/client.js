const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, { method = 'GET', body, token, isForm = false } = {}) {
  const headers = {}
  if (!isForm) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  signup: (name, email, password) =>
    request('/auth/signup', { method: 'POST', body: { name, email, password } }),
  me: (token) => request('/users/me', { token }),

  listDocuments: (token) => request('/documents', { token }),
  uploadDocument: (token, formData) =>
    request('/documents/upload', { method: 'POST', token, body: formData, isForm: true }),
  deleteDocument: (token, id) => request(`/documents/${id}`, { method: 'DELETE', token }),

  sendChatMessage: (token, chatId, message, documentId) =>
    request(`/chat/${chatId || 'new'}/message`, { method: 'POST', token, body: { message, document_id: documentId } }),
  listChats: (token) => request('/chats', { token }),
  getChat: (token, chatId) => request(`/chats/${chatId}`, { token }),

  adminListUsers: (token) => request('/admin/users', { token }),
  adminStats: (token) => request('/admin/stats', { token }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: { token, new_password: newPassword } }),
}

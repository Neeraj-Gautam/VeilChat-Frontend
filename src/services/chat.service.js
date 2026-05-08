import api from './api'

const chatService = {
  getChats: () => api.get('/chat'),
  accessChat: (userId) => api.post('/chat', { userId }),
  createGroup: (data) => api.post('/chat/group', data),
  updateGroup: (chatId, data) => api.put(`/chat/${chatId}`, data),
  updateGroupAvatar: (chatId, file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.put(`/chat/${chatId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  addMembers: (chatId, userIds) => api.put(`/chat/${chatId}/members`, { userIds }),
  removeMember: (chatId, userId) => api.delete(`/chat/${chatId}/members/${userId}`),
  leaveGroup: (chatId) => api.delete(`/chat/${chatId}/leave`),
  transferAdmin: (chatId, userId) => api.put(`/chat/${chatId}/admin`, { userId }),
  togglePinChat: (chatId) => api.put(`/chat/${chatId}/pin`),
}

export default chatService

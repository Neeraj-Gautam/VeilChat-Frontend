import api from './api'

const messageService = {
  getMessages: (chatId, page = 1) => api.get(`/message/${chatId}?page=${page}`),
  sendMessage: (data) => api.post('/message', data),
  markAsRead: (chatId) => api.put(`/message/${chatId}/read`),
  deleteMessage: (messageId, deleteFor) => api.delete(`/message/${messageId}`, { data: { deleteFor } }),
  bulkDeleteMessages: (messageIds, deleteFor) => api.post('/message/bulk-delete', { messageIds, deleteFor }),
  pinMessage: (messageId) => api.put(`/message/${messageId}/pin`),
  starMessage: (messageId) => api.put(`/message/${messageId}/star`),
  forwardMessage: (messageId, targetChatIds) => api.post(`/message/${messageId}/forward`, { targetChatIds }),
  clearChat: (chatId, clearFor) => api.delete(`/message/${chatId}/clear`, { data: { clearFor } }),
}

export default messageService

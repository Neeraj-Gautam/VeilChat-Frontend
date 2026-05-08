import api from './api'

const uploadService = {
  uploadFile: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  },

  uploadFiles: async (files) => {
    const formData = new FormData()
    ;(files || []).forEach((f) => formData.append('files', f))

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },
}

export default uploadService

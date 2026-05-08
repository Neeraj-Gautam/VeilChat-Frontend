import api from './api'

const userService = {
  getUsers: (search = '') => api.get(`/user${search ? `?search=${search}` : ''}`),
  
  updateProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.put('/user/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteAccount: (password) => api.delete('/user/account', { data: { password } }),
}

export default userService

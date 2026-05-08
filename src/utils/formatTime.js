export const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

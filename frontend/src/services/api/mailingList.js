import apiClient from './apiClient'

export const subscribeToMailingList = async (email, options = {}) => {
  return apiClient.post(
    '/mailing-list/subscribe',
    { email },
    { skipErrorToast: options.skipErrorToast === true }
  )
}

export const unsubscribeFromMailingList = async email => {
  return apiClient.post('/mailing-list/unsubscribe', { email })
}

export const getSubscribers = async (params = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page)
  if (params.limit) query.append('limit', params.limit)
  if (params.verified === true) query.append('verified', 'true')
  if (params.verified === false) query.append('verified', 'false')
  if (params.active === true) query.append('active', 'true')
  if (params.active === false) query.append('active', 'false')

  return apiClient.get(`/mailing-list/admin/subscribers?${query.toString()}`)
}

export const getSubscriberStats = async () => {
  return apiClient.get('/mailing-list/admin/stats')
}

export const verifyEmail = async token => {
  return apiClient.get(`/mailing-list/verify?token=${encodeURIComponent(token)}`)
}

export default {
  subscribeToMailingList,
  unsubscribeFromMailingList,
  getSubscribers,
  getSubscriberStats,
  verifyEmail,
}

import apiClient from './apiClient'

export const subscribeToMailingList = async (email: string, options: any = {}) => {
  return apiClient.post('/mailing-list/subscribe', { email }, {
    skipErrorToast: options.skipErrorToast === true,
  } as any)
}

export const unsubscribeFromMailingList = async (email: string) => {
  return apiClient.post('/mailing-list/unsubscribe', { email })
}

export const getSubscribers = async (params: any = {}) => {
  const query = new URLSearchParams()
  if (params.page) query.append('page', String(params.page))
  if (params.limit) query.append('limit', String(params.limit))
  if (params.verified === true) query.append('verified', 'true')
  if (params.verified === false) query.append('verified', 'false')
  if (params.active === true) query.append('active', 'true')
  if (params.active === false) query.append('active', 'false')

  return apiClient.get(`/mailing-list/admin/subscribers?${query.toString()}`)
}

export const getSubscriberStats = async () => {
  return apiClient.get('/mailing-list/admin/stats')
}

export const verifyEmail = async (token: string) => {
  return apiClient.get(`/mailing-list/verify?token=${encodeURIComponent(token)}`)
}

export default {
  subscribeToMailingList,
  unsubscribeFromMailingList,
  getSubscribers,
  getSubscriberStats,
  verifyEmail,
}

import { createInstance } from '@/data/services/instance'

export const request = createInstance(
  import.meta.env.VITE_NODE_ENV === 'production' && !window.origin.includes('stage-')
    ? import.meta.env.VITE_DR_SERITA_SERVER
    : 'https://stage-my.drserita.ir/api/'
)

export const apiGetDiseases = () => request.get(`v1/user/diseases`)

export const apiGetSitakCall = () => request.get('v1/sitak/call')

export const apiSummarizeUserChats = (userId) => request.post(`v2/user/${userId}/summarize-chats`)

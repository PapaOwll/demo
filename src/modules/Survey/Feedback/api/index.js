import { request } from '@/data/services'

export const getFeedbackList = (filters) => request.get('v1/feedback', { params: filters })

export const getTotalFeedbackCount = (filters) =>
  request.get('v1/feedback?return_count=1', { params: filters })

export const getFeedback = (id) => request.get(`v1/feedback/${id}`)

export const acceptFeedback = (id) => request.put(`v1/feedback/${id}/accept`)

export const rejectFeedback = (id) => request.put(`v1/feedback/${id}/reject`)

export const deleteFeedback = (id) => request.delete(`v1/feedback/${id}`)

export const deleteFeedbackAttachment = (feedbackId, fileId) =>
  request.delete(`v1/feedback/${feedbackId}/attachment/${fileId}`)

export const uploadFeedbackFiles = (feedbackId, fileIds) =>
  request.post(`v1/feedback/${feedbackId}/upload`, { file_ids: fileIds })

export const updateFeedback = (feedbackId, data) => request.put(`v1/feedback/${feedbackId}`, data)
export const batchAcceptFeedbacks = (ids) => request.post('v1/feedback/batch/accept', { ids })
export const batchRejectFeedbacks = (ids) => request.post('v1/feedback/batch/reject', { ids })

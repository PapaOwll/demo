import { request } from '@/data/services'

export const apiGetTasks = (filters) => request.get('v1/task', { params: filters })
export const apiGetTask = (taskId) => request.get(`v1/task/${taskId}`)
export const apiCreateTask = (data) => request.post('v1/task', data, { hadSnakize: true })
export const apiUpdateTask = (taskId, data) =>
  request.put(`v1/task/${taskId}`, data, { hadSnakize: true })
export const apiDeleteTask = (taskId) => request.delete(`v1/task/${taskId}`)
export const apiCheckHoliday = (date, branchId) =>
  request.get('v1/work-time/is-holiday', {
    params: { date, ...(branchId !== undefined && { branch_id: branchId }) },
  })
export const apiSendDueTaskTimes = (body) =>
  request.post('v1/task/due-times', body, { hadSnakize: true })

export const apiGetTaskAssignee = () => request.get('v1/task/assignee')

export const apiGetTasksTotalCount = (filters) =>
  request.get('v1/task?return_count=1', { params: filters })
export const apiGetTaskType = (params) => request.get('v1/task/types', { params })

export const apiGetFollowUpsSurvey = (taskId) => request.get(`v1/survey/followups/${taskId}`)

export const apiSubmitFollowUpAnswers = (taskId, payload) =>
  request.post(`v1/survey/followups/${taskId}/answers`, payload, { hadSnakize: true })

export const apiSetCallStatus = (taskId, payload) =>
  request.post(`v1/survey/followups/${taskId}/call`, payload, { hadSnakize: true })

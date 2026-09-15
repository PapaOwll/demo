import { request } from '@/data/services'

export const reports = (filters) => request.get('v1/report', { params: filters })

export const introductionMethodReports = (filters) =>
  request.get('v1/report/introduction-method/statistics', { params: filters })

export const advisorReports = async (filters) =>
  request.get('v1/report/introduction-method/advisor/statistics', { params: filters })

export const methodOfIntroductions = async (filters) =>
  request.get('v1/user/introduction-methods', { params: filters })

export const advisorEfficiency = async (filters) =>
  request.get('v1/report/advisor/efficiency', { params: filters })

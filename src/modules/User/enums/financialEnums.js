export const CHEQUE_TYPE = {
  PHYSICAL: 'PHYSICAL',
  DIGITAL: 'DIGITAL',
}

export const chequeTypeLabels = {
  [CHEQUE_TYPE.PHYSICAL]: 'فیزیکی',
  [CHEQUE_TYPE.DIGITAL]: 'دیجیتال',
}

export const chequeTypeColors = {
  [CHEQUE_TYPE.PHYSICAL]: 'grey',
  [CHEQUE_TYPE.DIGITAL]: 'light-blue',
}

export const chequeTypeOptions = Object.entries(chequeTypeLabels).map(([value, label]) => ({
  value,
  label,
}))

export const BALANCE_TYPE = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  SETTLED: 'settled',
}

export const balanceTypeLabels = {
  [BALANCE_TYPE.CREDIT]: 'بستانکار',
  [BALANCE_TYPE.DEBIT]: 'بدهکار',
  [BALANCE_TYPE.SETTLED]: 'تسویه',
}

export const balanceTypeColors = {
  [BALANCE_TYPE.CREDIT]: 'positive',
  [BALANCE_TYPE.DEBIT]: 'negative',
  [BALANCE_TYPE.SETTLED]: 'grey',
}

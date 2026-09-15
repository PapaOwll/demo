const BRANCH_LABELS = {
  28: 'فرانچایز',
  9: 'تهران',
}

export const getBranchLabel = (id) => BRANCH_LABELS[id] ?? 'همه شعب'

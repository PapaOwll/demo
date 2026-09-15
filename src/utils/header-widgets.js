export const mapWidgetData = (widgets) => ({
  withoutVisitUsers: {
    color: widgets?.usersWithoutVisitCount?.cols[0]?.meta?.color,
    uri: widgets?.usersWithoutVisitCount?.cols[0]?.meta?.additional?.uri,
    value: widgets?.usersWithoutVisitCount?.cols[0]?.value,
    icon: widgets?.usersWithoutVisitCount?.cols[0]?.meta?.additional?.icon,
    label: widgets?.usersWithoutVisitCount?.cols[0]?.label,
    class: 'no-visit-badge',
  },
  withoutStatusUsers: {
    color: widgets?.usersWithoutStatusCount?.cols[0]?.meta?.color,
    uri: widgets?.usersWithoutStatusCount?.cols[0]?.meta?.additional?.uri,
    value: widgets?.usersWithoutStatusCount?.cols[0]?.value,
    icon: widgets?.usersWithoutStatusCount?.cols[0]?.meta?.additional?.icon,
    label: widgets?.usersWithoutStatusCount?.cols[0]?.label,
    class: 'no-status-badge',
  },
  rawUsers: {
    color: widgets?.rawUsersCount?.cols[0]?.meta?.color,
    uri: widgets?.rawUsersCount?.cols[0]?.meta?.additional?.uri,
    value: widgets?.rawUsersCount?.cols[0]?.value,
    icon: widgets?.rawUsersCount?.cols[0]?.meta?.additional?.icon,
    label: widgets?.rawUsersCount?.cols[0]?.label,
    class: 'raw-users-badge',
  },
})

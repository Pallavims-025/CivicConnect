export function officerComplaintAccessWhere(user) {
  const scopes = [
    { assignedOfficerId: user.id },
    { workOrders: { some: { assignedByOfficerId: user.id } } },
  ];

  if (user.departmentId != null) {
    scopes.push(
      { departmentId: user.departmentId },
      { category: { departmentId: user.departmentId } },
    );
  }

  scopes.push({
    departmentId: null,
    assignedOfficerId: null,
    category: { departmentId: null },
    workOrders: { none: {} },
  });

  return { OR: scopes };
}

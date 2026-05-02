export type AppRole = 'guest' | 'host' | 'admin';

const roleWeight: Record<AppRole, number> = {
  guest: 1,
  host: 2,
  admin: 3,
};

export function hasRequiredRole(userRole: AppRole, requiredRole: AppRole) {
  return roleWeight[userRole] >= roleWeight[requiredRole];
}

export const ROOT_ADMIN_VK_ID = Number(process.env.ROOT_ADMIN_VK_ID || process.env.NEXT_PUBLIC_ROOT_ADMIN_VK_ID || 1703478);

export type HostAccessLevel = "basic" | "pro" | "extended";
export type AppUserRole = "host" | "guest" | "admin";

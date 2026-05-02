import { NextRequest } from "next/server";

import { ROOT_ADMIN_VK_ID } from "./constants";

export function getVkIdFromRequest(request: NextRequest): number | null {
  const header = request.headers.get("x-vk-id");
  if (!header) return null;

  const value = Number(header);
  return Number.isFinite(value) ? value : null;
}

export function assertRootAdmin(request: NextRequest): void {
  const vkId = getVkIdFromRequest(request);

  if (vkId !== ROOT_ADMIN_VK_ID) {
    throw new Error("Admin access denied");
  }
}

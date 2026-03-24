import { Prisma } from "../generated/prisma/client.js"; 
import { SUPER_ADMIN_ID } from "../config.js";
import prisma from "../db.js";
import type { BotContext } from "../types/session.js";
import type { Bot } from "grammy";

export async function requireAdmin(ctx: BotContext): Promise<boolean> {
  if (!await checkAdmin(ctx.from!.id)) {
    await ctx.answerCallbackQuery("⛔ Нет доступа");
    return false;
  }
  return true;
}

export async function checkAdmin(telegramId: number): Promise<boolean> {
    if(telegramId === SUPER_ADMIN_ID) return true;
    const admin = await prisma.admin.findUnique({ where: {telegramId: BigInt(telegramId)} });
    return !!admin
}

export function isSuperAdmin(telegramId: number): boolean {
    return telegramId === SUPER_ADMIN_ID;
}
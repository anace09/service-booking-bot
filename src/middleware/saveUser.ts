import prisma from "../db.js";
import type { Context, NextFunction } from "grammy";
import type { BotContext } from "../types/session.js";

export async function saveUser(ctx: BotContext, next: NextFunction) {
    if(ctx.from) {
        await prisma.user.upsert({
            where: { telegramId: BigInt(ctx.from.id) },
            update: { 
                username: ctx.from.username ?? null,
                 firstName: ctx.from.first_name },
            create: {
                telegramId: BigInt(ctx.from.id),
                username: ctx.from.username ?? null,
                firstName: ctx.from.first_name
            }
        });
    }
    await next();
}
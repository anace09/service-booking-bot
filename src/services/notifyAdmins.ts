import type { Bot } from "grammy";
import type { BotContext } from "../types/session.js";
import prisma from "../db.js";
import { SUPER_ADMIN_ID } from "../config.js";

export async function notifyAdmins(bot: Bot<BotContext>, message: string){
    const admins = await prisma.admin.findMany();
    const ids = [SUPER_ADMIN_ID, ...admins.map(a => Number(a.telegramId))];

    const unique = [...new Set(ids)];

    await Promise.all(unique.map(id => 
        bot.api.sendMessage(id, message, { parse_mode: "Markdown" })
    ));
}
import { Bot } from "grammy";
import type { BotContext } from "../types/session.js";
import { sendMainMenu } from "../handlers/core/main-menu.handler.js";


export function registerStart(bot: Bot<BotContext>) {
    bot.command("start", async (ctx) => {
        await ctx.deleteMessage();
        await sendMainMenu(ctx, "reply");
    });

}
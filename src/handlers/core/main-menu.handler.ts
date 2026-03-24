import type { Bot } from "grammy";
import { checkAdmin, isSuperAdmin } from "../../middleware/isAdmin.js";
import type { BotContext } from "../../types/session.js";
import { MESSAGES } from "./main-menu.messages.js";
import { KEYBOARDS } from "./main-menu.keyboards.js";

export async function sendMainMenu(ctx: BotContext, mode: "reply" | "edit" = "reply") {
    const userId = ctx.from!.id;
    const admin = await checkAdmin(userId);

    const text = admin ? MESSAGES.admin(ctx) : MESSAGES.user(ctx);
    const options = {
        parse_mode: "Markdown" as const,
        reply_markup: {
            inline_keyboard: admin
                ? KEYBOARDS.admin(isSuperAdmin(userId))
                : KEYBOARDS.user()
        }
    };

    mode === "reply"
        ? await ctx.reply(text, options)
        : await ctx.editMessageText(text, options);
}

export function registerMainMenu(bot: Bot<BotContext>) {
    bot.callbackQuery("main_menu", async (ctx) => {
        await sendMainMenu(ctx, "edit");
    });
}
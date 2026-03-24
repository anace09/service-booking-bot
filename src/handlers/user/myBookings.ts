import type { Bot } from "grammy";
import type { BotContext } from "../../types/session.js";
import prisma from "../../db.js";
import { notifyAdmins } from "../../services/notifyAdmins.js";

export function registerMyBookingsHandlers(bot: Bot<BotContext>) {
    
    bot.callbackQuery("my_bookings", async (ctx) => {
        const userId = BigInt(ctx.from!.id);
        const session = await prisma.session.findFirst({ where: { bookedBy: userId } });

        if(!session){
            await ctx.answerCallbackQuery("❌ Записи не найдены");
            return;
        }

        const text = `📋 *Мои бронирования*\n\nДата: *${session.date}*\nВремя: *${session.time}*`;
        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Отменить бронь", callback_data: `cancel_booking_${session.id}` }],
                    [{ text: "⬅️ Назад", callback_data: `main_menu` }]
                ]
            }
        });

    });

    bot.callbackQuery(/^cancel_booking_(\d+)$/, async (ctx) => {
        const id = Number(ctx.match[1]!);

        const slot = await prisma.session.update({
            where: { id },
            data: { isBooked: false, bookedBy: null }
        });

        const username = ctx.from!.username ? `@${ctx.from!.username}` : ctx.from!.first_name;
        await notifyAdmins(bot, `❌ *Бронь отменена*\n\nПользователь: ${username}\nДата: ${slot.date}\nВремя: ${slot.time}`);
            
        await ctx.editMessageText("✅ Бронь отменена", {
          reply_markup: {
            inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]]
          }
        });

    });

}
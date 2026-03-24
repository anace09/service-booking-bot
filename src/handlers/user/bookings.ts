import type { Bot } from "grammy";
import type { BotContext } from "../../types/session.js";
import prisma from "../../db.js";
import { notifyAdmins } from "../../services/notifyAdmins.js";

export function registerBookingHandlers(bot: Bot<BotContext>) {
    
    bot.callbackQuery("new_booking", async (ctx) => {

        const sessions = await prisma.session.findMany({ 
            where: { isBooked: false },
            orderBy: { date: "asc" }
         });

        const dates = [... new Set(sessions.map(s => s.date))];

        const keyboard = dates.map(date => ([{
          text: date,
          callback_data: `book_day_${date}`
        }]));

        keyboard.push([{ text: "⬅️ Назад", callback_data: "main_menu" }]);

        let text = "📋 *Расписание*\n\n";
        text += dates.length === 0 ? "Нет сеансов" : "Выберите дату:";

        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });

    });

    bot.callbackQuery(/^book_day_(.+)$/, async (ctx) => {
        const date = ctx.match[1]!;

        const sessions = await prisma.session.findMany({
            where: { isBooked: false, date },
            orderBy: { time: "asc" }
        });

          const keyboard = sessions.map(s => ([{
          text: s.time,
          callback_data: `book_slot_${s.id}`
        }]));

        keyboard.push([{ text: "⬅️ Назад", callback_data: "new_booking" }]);

        let text = "📋 *Расписание*\n\n";
        text += sessions.length === 0 ? "Нет сеансов" : "Выберите дату:";

        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    });

    bot.callbackQuery(/^book_slot_(\d+)$/, async (ctx) => {

        const id = Number(ctx.match[1]);
        const userId = BigInt(ctx.from!.id);

        const existing = await prisma.session.findFirst({ where: { bookedBy: userId } });
        if (existing) {
          await ctx.answerCallbackQuery(`❌ У вас уже есть бронь: ${existing.date} в ${existing.time}`);
          return;
        }

        const slot = await prisma.session.update({
            where: { id },
            data: { isBooked: true, bookedBy: userId }
        });

        const username = ctx.from!.username ? `@${ctx.from!.username}` : ctx.from!.first_name;
        await notifyAdmins(bot, `📅 *Новая бронь*\n\nПользователь: ${username}\nДата: ${slot.date}\nВремя: ${slot.time}`);

        await ctx.editMessageText(`✅ Вы записаны!\n\nДата: *${slot.date}*\nВремя: *${slot.time}*`, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[{ text: "📋 Мои бронирования", callback_data: "my_bookings" }]]
          }
        });

    });

}
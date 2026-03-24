import type { Bot } from "grammy";
import type { BotContext } from "../../types/session.js";
import { checkAdmin, requireAdmin } from "../../middleware/isAdmin.js";
import prisma from "../../db.js";

export async function registerSessionHandler(bot: Bot<BotContext>) {
    
    // management panel
    bot.callbackQuery("admin_sessions", async (ctx) => {
        if(!await checkAdmin(ctx.from!.id)){
            await ctx.answerCallbackQuery("⛔ Нет доступа");
            return;
        }

       let text = "📅 Управление сеансами\n\n"
       
       await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "➕ Добавить сеанс", callback_data: "session_add" }],
                    [{ text: "🗂 Применить пресет", callback_data: "session_preset" }],
                    [{ text: "📋 Список сеансов", callback_data: "session_list" }],
                      [{ text: "❌ Отменить день", callback_data: "session_cancel_day" }],
                    [{ text: "⬅️ Назад", callback_data: "main_menu" }]
                ]
            }
        })

    });

    // list of available sessions
    bot.callbackQuery("session_list", async (ctx) => {
        const sessions = await prisma.session.findMany({
            orderBy: { date: "asc" }
        });

        const grouped = sessions.reduce((acc, session) => {
        if (!acc[session.date]) {
          acc[session.date] = [];
        }
        acc[session.date]!.push(session);
          return acc;
        }, {} as Record<string, typeof sessions>);

        const dates = Object.keys(grouped);

        const keyboard = dates.map(date => ([{
          text: date,
          callback_data: `session_day_${date}`
        }]));

        keyboard.push([{ text: "⬅️ Назад", callback_data: "admin_sessions" }]);

        let text = "📋 *Расписание*\n\n";
        text += dates.length === 0 ? "Нет сеансов" : "Выберите дату:";

        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    });

    bot.callbackQuery("session_add", async (ctx) => {
        if (!await requireAdmin(ctx)) return;

        ctx.session.waitingFor = "session_date";

        await ctx.editMessageText("Введите дату в формате *ДД.ММ*:\nПример: 25.03", {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "❌ Отмена", callback_data: "admin_sessions" }]]
            }
        });

        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery(/^apply_preset_(\d+)$/, async (ctx) => {
        const presetId = Number(ctx.match[1]);
        const date = ctx.session.tempData?.sessionDate!;

        const preset = await prisma.preset.findUnique({ where: { id: presetId } });
        if(!preset) {
            await ctx.answerCallbackQuery("❌ Пресет не найден");
            return;
        }

        await Promise.all(preset.times.map(time =>
            prisma.session.create({ data: { date, time, presetId } })
        ));       

        ctx.session.tempData = {};

        await ctx.editMessageText(`✅ Добавлено ${preset.times.length} сеансов на *${date}*`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "📋 Расписание", callback_data: "session_list" }]]
            }
        });
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery(/^session_day_(.+)$/, async (ctx) => {
        const date = ctx.match[1]!;

        const sessions = await prisma.session.findMany({
            where: { date },
            orderBy: { time: "asc" }
        });

        let text = `📅 *${date}*\n\n`;
        const keyboard = sessions.map(s => ([{
            text: `${s.time} — ${s.isBooked ? "👤 забронено" : "✅ свободно"}`,
            callback_data: `session_slot_${s.id}`
        }]));

        keyboard.push([{ text: "❌ Отменить день", callback_data: `cancel_day_${date}` }]);
        keyboard.push([{ text: "⬅️ Назад", callback_data: "session_list" }]);

        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: keyboard }        
        });
    });
    
    bot.callbackQuery("session_preset", async (ctx) => {
        if(!await requireAdmin(ctx)) return;

        ctx.session.waitingFor = "session_preset_date";

        await ctx.editMessageText("Введите дату в формате *ДД.ММ*:\nПример: 25.03", {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "❌ Отмена", callback_data: "admin_sessions" }]]
            }
        });

        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery(/^session_slot_(\d+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);
        const session = await prisma.session.findUnique({ where: { id } })

        if(!session){
            await ctx.answerCallbackQuery("❌ Сеанс не найден");
            return;
        }

        let text = `📅 *${session.date}* — ${session.time}\n\n`;
        text += session.isBooked ? "👤 Забронено" : "✅ Свободно";

        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Отменить слот", callback_data: `cancel_slot_${id}` }],
                    [{ text: "⬅️ Назад", callback_data: `session_day_${session.date}` }]
                ]
            }
        });
    });

    bot.callbackQuery(/^cancel_slot_(\d+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);
        const session = await prisma.session.findUnique({ where: { id } });
        await prisma.session.delete({ where: { id } });
        await ctx.answerCallbackQuery("✅ Слот удалён")
        await ctx.editMessageText("✅ Слот удалён", {
            reply_markup: {
                inline_keyboard: [[{ text: "⬅️ Назад", callback_data: `session_day_${session?.date}` }]]
            }
        });
    });

    bot.callbackQuery(/^cancel_day_(.+)$/, async (ctx) => {
        const date = ctx.match[1]!;
        await prisma.session.deleteMany({ where: { date } });
        await ctx.answerCallbackQuery("✅ День отменён");
        await ctx.editMessageText(`✅ Все сеансы на *${date}* удалены`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "session_list" }]]
            }
        });
    });

    bot.callbackQuery("session_cancel_day", async (ctx) => {
      if (!await requireAdmin(ctx)) return;
    
      const sessions = await prisma.session.findMany({
        orderBy: { date: "asc" }
      });
  
      const dates = [...new Set(sessions.map(s => s.date))];
  
      if (dates.length === 0) {
        await ctx.answerCallbackQuery("Нет сеансов");
        return;
      }
  
      const keyboard = dates.map(date => ([{
        text: date,
        callback_data: `cancel_day_${date}`
      }]));
      keyboard.push([{ text: "⬅️ Назад", callback_data: "admin_sessions" }]);
  
      await ctx.editMessageText("Выберите день для отмены:", {
        reply_markup: { inline_keyboard: keyboard }
      });
      await ctx.answerCallbackQuery();
    });

}
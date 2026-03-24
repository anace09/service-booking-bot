import { Bot } from "grammy";
import type { BotContext } from "../../types/session.js";
import prisma from "../../db.js";
import { resolveUser } from "../../middleware/resolveUser.js";
import { generatePresetName } from "../../middleware/generatePresetName.js";

export function registerTextHandler(bot: Bot<BotContext>) {
  bot.on("message:text", async (ctx) => {
    switch (ctx.session.waitingFor) {

      case "add_admin": {
        ctx.session.waitingFor = null;
        const telegramId = await resolveUser(ctx.message.text);
        if (!telegramId) {
          await ctx.reply("❌ Пользователь не найден");
          return;
        }
        await prisma.admin.upsert({
          where: { telegramId },
          update: {},
          create: { telegramId }
        });
        await ctx.reply("✅ Админ добавлен!", {
          reply_markup: {
            inline_keyboard: [[{ text: "👥 К списку", callback_data: "admin_admins" }]]
          }
        });
        break;
      }
      case "preset_name": {
        const name = ctx.message.text;
        ctx.session.tempData = { presetName: name };
        ctx.session.waitingFor = "preset_times";
        await ctx.reply(`Название: *${name}*\n\nВведите времена через запятую:\nПример: 10:00, 12:00, 14:00`, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "❌ Отмена", callback_data: "admin_presets" }]
            ]
          }
        });
        break;
      }
      case "preset_times": {
        ctx.session.waitingFor = null;
        const name = ctx.session.tempData?.presetName ?? await generatePresetName();
        const times = ctx.message.text
          .split(",")
          .map(t => t.trim())
          .filter(t => /^\d{2}:\d{2}$/.test(t));

        if (times.length === 0) {
          await ctx.reply("❌ Неверный формат. Пример: 10:00, 12:00, 14:00");
          return;
        }

        await prisma.preset.create({ data: { name, times } });
        ctx.session.tempData = {};

        await ctx.reply(`✅ Пресет *${name}* создан!\nВремена: ${times.join(", ")}`, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🗂 К пресетам", callback_data: "admin_presets" }]
            ]
          }
        });
        break;
      }
      case "preset_rename": {
        ctx.session.waitingFor = null;
        const id = ctx.session.tempData?.presetId!;
        await prisma.preset.update({
            where: { id },
            data: { name: ctx.message.text }
        });
        ctx.session.tempData = {};
        await ctx.reply(`✅ Переименовано в *${ctx.message.text}*`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[{ text: "⬅️ К пресету", callback_data: `preset_${id}` }]]
            }
        });
        break;
      }
      case "preset_edit_times": {
        ctx.session.waitingFor = null;
        const id = ctx.session.tempData?.presetId!;
        const times = ctx.message.text
            .split(",")
            .map(t => t.trim())
            .filter(t => /^\d{2}:\d{2}$/.test(t));

        if (times.length === 0) {
            await ctx.reply("❌ Неверный формат. Пример: 10:00, 12:00, 14:00");
            return;
        }    

        await prisma.preset.update({
            where: {id},
            data: {times}
        });
        ctx.session.tempData = {};
        await ctx.reply(`✅ Времена обновлены: ${times.join(", ")}`, {
            reply_markup: {
                inline_keyboard: [[{ text: "⬅️ К пресету", callback_data: `preset_${id}` }]]
            }
        });
        break;
      }
      case "session_date": {
        const input = ctx.message.text.trim();
        if (!/^\d{2}\.\d{2}$/.test(input)) {
          await ctx.reply("❌ Неверный формат. Пример: 25.03");
          return;
        }
      
        const [day, month] = input.split(".").map(Number) as [number, number];;
        const now = new Date();
        let year = now.getFullYear();
      
        const inputDate = new Date(year, month - 1, day);
        if (inputDate < now) {
          year += 1;
        }
      
        const date = `${input}.${year}`;

        ctx.session.tempData = { sessionDate: date };
        ctx.session.waitingFor = "session_time";

        await ctx.reply("Введите время в формате *ЧЧ:ММ*:\nПример: 14:00", {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[{ text: "❌ Отмена", callback_data: "admin_sessions" }]]
          }
        });
        break;
      }
      case "session_time": {
        const time = ctx.message.text.trim();
        if (!/^\d{2}:\d{2}$/.test(time)) {
          await ctx.reply("❌ Неверный формат. Пример: 14:00");
          return;
        }

        const date = ctx.session.tempData?.sessionDate!;
        ctx.session.waitingFor = null;
        ctx.session.tempData = {};

        await prisma.session.create({ data: { date, time } });

        await ctx.reply(`✅ Сеанс добавлен: *${date}* в *${time}*`, { 
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[{ text: "📋 Расписание", callback_data: "session_list" }]]
          }
        });
        break;
      }
      case "session_preset_date": {
        const input =  ctx.message.text.trim();
        if (!/^\d{2}\.\d{2}$/.test(input)) {
          await ctx.reply("❌ Неверный формат. Пример: 25.03");
          return;
        }

        const[day, month] = input.split(".").map(Number) as [number, number];
        const now = new Date();
        let year = now.getFullYear();
        const inputDate = new Date(year, month - 1, day);
        if(inputDate < now) year += 1;

        const date = `${input}.${year}`
        ctx.session.tempData = { sessionDate: date };
        ctx.session.waitingFor = null;

        const presets = await prisma.preset.findMany();
        if (presets.length === 0) {
          await ctx.reply("❌ Нет пресетов. Сначала создайте пресет.");
          return;
        }

        const keyboard = presets.map(p => ([{
          text: p.name,
          callback_data: `apply_preset_${p.id}`
        }]));
        keyboard.push([{ text: "❌ Отмена", callback_data: "admin_sessions" }]);

        await ctx.reply(`Выберите пресет для *${date}*:`, {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: keyboard }
        });
        break;
      }
    }
  });
}
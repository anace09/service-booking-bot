import type { Bot } from "grammy";
import type { BotContext } from "../../types/session.js";
import prisma from "../../db.js";
import { checkAdmin } from "../../middleware/isAdmin.js";
import { generatePresetName } from "../../middleware/generatePresetName.js";

export function registerPresetHandlers(bot: Bot<BotContext>) {
    
    bot.callbackQuery("admin_presets", async (ctx) => {

        if(!await checkAdmin(ctx.from!.id)){
            await ctx.answerCallbackQuery("⛔ Нет доступа");
            return;
        }

        let text = "🗂️ Шаблоны\n\n";

        const presets = await prisma.preset.findMany()
        text += presets.length === 0 ? "Список пуст" : "Выберите пресет:";

        const keyboard = presets.map((p) => ([{
            text: p.name,
            callback_data: `preset_${p.id}`
        }]));

        keyboard.push([{ text: "➕ Создать", callback_data: "preset_create" }]);
        keyboard.push([{ text: "⬅️ Назад", callback_data: "main_menu" }]);

        await ctx.editMessageText(text, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        })

    });

    bot.callbackQuery(/^preset_(\d+)$/, async (ctx) => {
        if(!await checkAdmin(ctx.from!.id)) {
            await ctx.answerCallbackQuery("⛔ Нет доступа");
            return;
        }

        const id = Number(ctx.match[1]);
        const preset = await prisma.preset.findUnique ({ where: {id} });

        if (!preset) {
            await ctx.answerCallbackQuery("❌ Пресет не найден");
            return;
        }

        await ctx.editMessageText(`📋 *${preset.name}*\n\nВремена: ${preset.times.join(", ")}`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✏️ Переименовать", callback_data: `preset_rename_${id}` }],
                    [{ text: "🕐 Изменить времена", callback_data: `preset_edit_times_${id}` }],
                    [{ text: "🗑 Удалить", callback_data: `preset_delete_${id}` }],
                    [{ text: "⬅️ Назад", callback_data: `admin_presets` }]
                ]
            }
        });
    });

    bot.callbackQuery(/^preset_delete_(\d+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);
        await prisma.preset.delete({ where: {id} });
        await ctx.answerCallbackQuery("✅ Удалён")
        await ctx.editMessageText("✅ Пресет удалён", {
            reply_markup: {
                inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "admin_presets" }]]
            }
        });
    });

    bot.callbackQuery(/^preset_rename_(\d+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);
        ctx.session.waitingFor = "preset_rename";
        ctx.session.tempData = { presetId: id }

        await ctx.editMessageText("Введите новое название:", {
            reply_markup: {
                inline_keyboard: [[{ text: "❌ Отмена", callback_data: `preset_${id}` }]]
            }
        });
        await ctx.answerCallbackQuery();
    })

    bot.callbackQuery(/^preset_edit_times_(\d+)$/, async (ctx) => {
        const id = Number(ctx.match[1]);
        ctx.session.waitingFor = "preset_edit_times";
        ctx.session.tempData = { presetId: id };

        await ctx.editMessageText("Введите новые времена через запятую:\nПример: 10:00, 12:00, 14:00", {
            reply_markup: {
             inline_keyboard: [[{ text: "❌ Отмена", callback_data: `preset_${id}` }]]
            }
        });
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery("preset_create", async (ctx) => {

        if(!await checkAdmin(ctx.from!.id)){
            await ctx.answerCallbackQuery("⛔ Нет доступа");
            return;
        }

        ctx.session.waitingFor = "preset_name";

        await ctx.editMessageText("Введите название пресета:", {
            reply_markup: {
                inline_keyboard: [
                      [{ text: "❌ Отмена", callback_data: "admin_presets" }],
                      [{ text: "➡️ Пропустить", callback_data: "preset_skip_name" }]
                ]
            }
        })
        await ctx.answerCallbackQuery();
    });

    bot.callbackQuery("preset_skip_name", async (ctx) => {
        if (!await checkAdmin(ctx.from!.id)) {
            await ctx.answerCallbackQuery("⛔ Нет доступа");
            return;
        }

        const autoName = await generatePresetName()

        ctx.session.tempData = { presetName: autoName };
        ctx.session.waitingFor = "preset_times";

        await ctx.editMessageText(`Название: *${autoName}*\n\nВведите времена через запятую:\nПример: 10:00, 12:00, 14:00`, {
            parse_mode: "Markdown",
            reply_markup: {
            inline_keyboard: [
                [{ text: "❌ Отмена", callback_data: "admin_presets" }]
            ]
            }
        });

        await ctx.answerCallbackQuery();
    });

}
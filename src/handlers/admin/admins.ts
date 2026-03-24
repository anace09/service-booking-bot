import { Bot } from "grammy";
import prisma from "../../db.js";
import { isSuperAdmin } from "../../middleware/isAdmin.js";
import type { BotContext } from "../../types/session.js";
import { resolveUser } from "../../middleware/resolveUser.js";

export function registerAdminHandlers(bot: Bot<BotContext>) {

  bot.callbackQuery("admin_admins", async (ctx) => {
    if (!isSuperAdmin(ctx.from!.id)) {
      await ctx.answerCallbackQuery("⛔ Нет доступа");
      return;
    }

    const admins = await prisma.admin.findMany();
    let text = "👥 *Администраторы*\n\n";
    text += admins.length === 0
      ? "Список пуст"
      : admins.map((a, i) => `${i + 1}. \`${a.telegramId}\``).join("\n");

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "➕ Добавить", callback_data: "admin_add" }],
          [{ text: "➖ Удалить", callback_data: "admin_delete" }],
          [{ text: "⬅️ Назад", callback_data: "main_menu" }],
        ]
      }
    });
  });

  bot.callbackQuery("admin_add", async (ctx) => {
    if (!isSuperAdmin(ctx.from!.id)) {
      await ctx.answerCallbackQuery("⛔ Нет доступа");
      return;
    }

    ctx.session.waitingFor = "add_admin";

    await ctx.editMessageText("Введите Telegram ID или @username нового админа:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Отмена", callback_data: "admin_admins" }]
        ]
      }
    });

    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("admin_delete", async (ctx) => {
    if (!isSuperAdmin(ctx.from!.id)) {
      await ctx.answerCallbackQuery("⛔ Нет доступа");
      return;
    }

    const admins = await prisma.admin.findMany();

    if (admins.length === 0) {
      await ctx.answerCallbackQuery("Список админов пуст");
      return;
    }

    const keyboard = admins.map((a) => ([{
      text: `🗑 ${a.telegramId}`,
      callback_data: `del_admin_${a.id}`
    }]));
    keyboard.push([{ text: "⬅️ Назад", callback_data: "admin_admins" }]);

    await ctx.editMessageText("Выберите админа для удаления:", {
      reply_markup: { inline_keyboard: keyboard }
    });
  });

  bot.callbackQuery(/^del_admin_(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[1]);
    await prisma.admin.delete({ where: { id } });
    await ctx.answerCallbackQuery("✅ Админ удалён");
    await ctx.editMessageText("✅ Админ удалён", {
      reply_markup: {
        inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "admin_admins" }]]
      }
    });
  });

}
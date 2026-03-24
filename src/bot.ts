import { Bot, session, GrammyError } from "grammy";
import * as dotenv from "dotenv";
import prisma from "./db.js";
import { registerStart } from "./commands/start.command.js";
import { saveUser } from "./middleware/saveUser.js";
import type { BotContext, SessionData } from "./types/session.js";
import { registerAdminHandlers } from "./handlers/admin/admins.js";
import { registerMainMenu } from "./handlers/core/main-menu.handler.js";
import { registerPresetHandlers } from "./handlers/admin/presets.js";
import { registerTextHandler } from "./handlers/core/text.handler.js";
import { registerSessionHandler } from "./handlers/admin/sessions.handler.js";
import { registerBookingHandlers } from "./handlers/user/bookings.js";
import { registerMyBookingsHandlers } from "./handlers/user/myBookings.js";
dotenv.config();

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.use(saveUser);
bot.use(session({
  initial: (): SessionData => ({ waitingFor: null }),
}));

bot.catch((err) => {
  if (err.error instanceof GrammyError && err.error.description.includes("message is not modified")) {
    return;
  }
  console.error("Ошибка:", err.error);
});

async function main(){
  await prisma.$connect();
  console.log("БД работает");

  registerStart(bot);

  registerTextHandler(bot);

  registerMainMenu(bot);

  registerBookingHandlers(bot);
  registerMyBookingsHandlers(bot);


  registerAdminHandlers(bot);
  registerSessionHandler(bot);
  registerPresetHandlers(bot);

  bot.start();
  console.log("Бот запущен!");
}

main();
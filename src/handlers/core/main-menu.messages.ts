import { formatTimeToString } from "../../../helpers/date.helper.js";
import type { BotContext } from "../../types/session.js";

const getUsername = (ctx: BotContext) => ctx.from?.username ?? ctx.from?.first_name;

export const MESSAGES = {
    admin: (ctx: BotContext) => {
        const username = getUsername(ctx);
        return username
            ? `👋 ${formatTimeToString()}, *${username}*.\n\n⚙️ Вы находитесь в панели управления.`
            : `👋 ${formatTimeToString()}.\n\n⚙️ Вы находитесь в панели управления.`;
    },
    user: (ctx: BotContext) => {
        const username = getUsername(ctx);
        return username
            ? `👋 ${formatTimeToString()}, *${username}*.\n\nЗдесь вы можете записаться на приём или посмотреть свои визиты.`
            : `👋 ${formatTimeToString()}.\n\nЗдесь вы можете записаться на приём или посмотреть свои визиты.`;
    },
};


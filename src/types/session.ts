import type { Context, SessionFlavor } from "grammy";

export interface SessionData {
    waitingFor:
    | "add_admin"
    | "preset_name"
    | "preset_times"
    | "preset_rename"
    | "preset_edit_times"
    | "session_date"
    | "session_time"
    | "session_preset_date"
    | "session_cancel_day"
    | null;
    tempData?: {
        presetName?: string;
        presetId?: number;
        sessionDate?: string;
    };
}

export type BotContext = Context & SessionFlavor<SessionData>;
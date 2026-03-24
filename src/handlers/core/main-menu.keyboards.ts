export const KEYBOARDS = {
    admin: (isSuperAdmin: boolean) => {
        const keyboard = [
            [{ text: "📅 Бронирования", callback_data: "admin_sessions" }],
            [{ text: "🗂 Шаблоны", callback_data: "admin_presets" }],
        ];
        if (isSuperAdmin) keyboard.push([{ text: "👥 Администрация", callback_data: "admin_admins" }]);
        return keyboard;
    },
    user: () => [[
        { text: "📋 Мои бронирования", callback_data: "my_bookings" },
        { text: "➕ Забронировать", callback_data: "new_booking" },
    ]]
};

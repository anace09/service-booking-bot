import prisma from "../db.js";

export async function generatePresetName(): Promise<string> {

    const presets = await prisma.preset.findMany({ select: { name: true } });
        const numbers = presets
            .map(p => p.name.match(/^Пресет (\d+)$/))
            .filter(Boolean)
            .map(m => Number(m![1]));

        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        return `Пресет ${nextNumber}`;

}
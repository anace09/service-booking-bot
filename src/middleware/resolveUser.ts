import prisma from "../db.js";

export async function resolveUser(input: string): Promise<bigint | null>{
    input = input.trim().replace("@", "");

    if(/^\d+$/.test(input)){
        return BigInt(input);
    }

    const user = await prisma.user.findFirst({
        where: { username: input }
    });

    return user ? user.telegramId : null;
}
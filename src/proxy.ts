import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {

    const pathname = req.nextUrl.pathname;
    const roomMatch = pathname.match(/^\/room\/([^/]+)$/);
    if (!roomMatch)
        return NextResponse.redirect(new URL("/", req.url));

    const roomID = roomMatch[1];
    const room = await redis.hgetall<{ connected: string[], createdAt: number }>(`room:${roomID}`);

    if (!room)
        return NextResponse.redirect(new URL("/?error=room-not-found", req.url));

    const existingToken = req.cookies.get("X-Auth-Token")?.value;
    if (existingToken && room.connected.includes(existingToken))
        return NextResponse.next();

    if (room.connected.length === 2) {
        return NextResponse.redirect(new URL("/?error=room-full", req.url))
    }


    const response = NextResponse.next();
    const token = nanoid();
    response.cookies.set("X-Auth-Token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });


    await redis.hset(`room:${roomID}`, {
        connected: [...room.connected, token]
    })


    return response;

}


export const config = {
    matcher: "/room/:path*"
}
import { redis } from '@/lib/redis';
import { Elysia, t } from 'elysia'
import { nanoid } from 'nanoid'
import { authMiddleware } from './auth';
import { z } from "zod";
import { Message, realtime } from '@/lib/realtime';
const ROOM_TTL_SECONDS = 60 * 10;
const rooms = new Elysia({ prefix: "/room" }).post("/create", async () => {
    const roomID = nanoid();

    await redis.hset(`room:${roomID}`, {
        connected: [],
        createdAt: Date.now()
    })

    await redis.expire(`room:${roomID}`, ROOM_TTL_SECONDS)
    return { roomID }
})
    .use(authMiddleware)
    .get("/ttl",
        async ({ auth }) => {
            const ttl = await redis.ttl(`room:${auth.roomID}`);

            return { ttl: ttl > 0 ? ttl : 0 }

        }, { query: z.object({ roomID: z.string() }) })
    .delete("/", async ({ auth }) => {

        await realtime.channel(auth.roomID).emit("chat.destroy",{isDestroyed:"true"})
        await Promise.all([
            redis.del(auth.roomID),
            redis.del(`room:${auth.roomID}`),
            redis.del(`messages:${auth.roomID}`)
        ])
        
    },{query:z.object({roomID:z.string()})})

const messages = new Elysia({ prefix: "/messages" }).use(authMiddleware).post("/",
    async ({ body, auth }) => {
        const { sender, text } = body;
        //checking if room exists?

        const roomExists = await redis.exists(`room:${auth.roomID}`);
        if (!roomExists)
            throw new Error("Room Does not Exist");

        const message: Message = {
            id: nanoid(),
            sender,
            text,
            timestamp: Date.now(),
            roomID: auth.roomID
        }

        await redis.rpush(`messages:${auth.roomID}`,
            { ...message, token: auth.token })
        await realtime.channel(auth.roomID).emit("chat.message", message)


        const remaining = await redis.ttl(`room:${auth.roomID}`);
        await redis.expire(`messages:${auth.roomID}`, remaining);
        // await redis.expire(`history:${auth.roomID}`, remaining);
        await redis.expire(auth.roomID, remaining);

    }, {
    query: z.object({ roomID: z.string() }),
    body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1200)
    })
}).get("/", async ({ auth }) => {
    const message = await redis.lrange<Message>(`messages:${auth.roomID}`, 0, -1)

    return {
        message: message.map((m) => ({
            ...m,
            token: m.token === auth.token ? auth.token : undefined
        }))

    }


},
    {
        query: z.object({ roomID: z.string() })

    })



export const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages)


export const GET = app.fetch
export const POST = app.fetch
export const DELETE = app.fetch

export type App = typeof app;
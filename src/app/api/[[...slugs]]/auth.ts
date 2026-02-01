
import { redis } from "@/lib/redis";
import Elysia from "elysia";

class AuthError extends Error{
    constructor(message:string){
        super(message);
        this.name="AuthError"
    }
}

export const authMiddleware= new Elysia({name:"auth"}).error({AuthError})
        .onError(({code,set})=>{
            if(code=="AuthError"){
                set.status=401;
                return {error:"Unauthorized"}
            }
        }).derive({as:"scoped"},async ({query,cookie}) => {
            const roomID=query.roomID;
            const token=cookie["X-Auth-Token"].value as string | undefined;

            if(!roomID || !token)
                    throw new AuthError("Missing RoomID or token")
            
            const connected=await redis.hget<string[]>(`room:${roomID}`,"connected");

            if(!connected?.includes(token))
                throw new AuthError("Invalid Token")

            return {auth:{roomID,token,connected}}
        })
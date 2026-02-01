"use client"
import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";



function Lobby() {
  const router = useRouter();
  const {username}=useUsername();
  const searchParams=useSearchParams();
  const wasDestroyed=searchParams.get("destroyed")==="true"
  const error=searchParams.get("error");

  const {mutate:createRoom}=useMutation({
    
    mutationFn:async ()=>{
      const res=await client.room.create.post();
      
      if(res.status==200){
        router.push(`/room/${res.data?.roomID}`)
      }


    },
  
  })
  return (
    <main className="flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md space-y-8">
        {wasDestroyed && <div className="bg-red-950/20 border border-red-900 p-4 text-center animate-pulse">
          <p className="text-red-500 text-sm font-bold">Room Destroyed</p>
          <p className="text-white text-xs mt-1"> All messages were deleted permanently</p>
          </div>
        }
        {error==="room-not-found" && <div className="bg-red-950/20 border border-red-900 p-4 text-center animate-pulse">
          <p className="text-red-500 text-sm font-bold">Room does not exist</p>
          <p className="text-white text-xs mt-1"> This room may have expired or never existed</p>
          </div>
        }
        {error==="room-full" && <div className="bg-red-950/20 border border-red-900 p-4 text-center animate-pulse">
          <p className="text-red-500 text-sm font-bold">ROOM FULL</p>
          <p className="text-white text-xs mt-1"> Get the fuck out of here </p>
          </div>
        }
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-600">{">"}private_chat</h1>
          <p className="text-zinc-600 text-m">A private, self-destructing chat rooms. </p>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center ">Your Identity</label>
              <div className=" flex items-center gap-3">
                <div className=" flex-1 bg-zinc-600 border border-bg-zinc-400 font-mono  ">
                  {username}
                </div>
              </div>
            </div>
            <button onClick={()=>createRoom()} className="w-full bg-zinc-100 text-black p-3 text-sm font-bold hover:bg-zinc-50 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50"> 
              CREATE SECURE ROOM
              </button>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function Home(){
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Lobby />
    </Suspense>
  );
  
}


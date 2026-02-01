"use client"

import { useUsername } from "@/hooks/use-username";
import { client } from "@/lib/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation"
import { useRef, useState,useEffect } from "react";
import {format} from "date-fns"
import { useRealtime } from "@upstash/realtime/client";



function formatTimeRemaining(seconds :number):string{
  
  const mins=Math.floor(seconds/60);
  const secs=seconds%60;

  return `${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;

}



const Page = () => {
const params=useParams();
const roomID=params.roomID as string;
const [copyStatus, setCopyStatus] = useState<string>("Copy")
const [timeRemaining,settimeRemaining]=useState<number | null> (null);
const [input, setInput] = useState<string>("");
const inputRef=useRef<HTMLInputElement>(null);

const router=useRouter();
const {username}=useUsername();

const {data:ttlData}=useQuery({
  queryKey:["ttl",roomID],
  queryFn:async () => {
    const res=await client.room.ttl.get({query:{roomID}});

    return res.data
  }
})

useEffect(() => {
  if(ttlData?.ttl!==undefined)
      settimeRemaining(ttlData.ttl);

  
}, [ttlData])

useEffect(()=>{
  if(timeRemaining===null || timeRemaining<0)
      return;

  if(timeRemaining===0){
    router.push("/?destroyed=true")
    return
  }
  const interval=setInterval(()=>{
    settimeRemaining((prev)=>{
      if(prev===null || prev<=1){
        clearInterval(interval)
        return 0;
      }
      return prev-1;
    })
    
  },1000)

  return ()=>clearInterval(interval);
},[timeRemaining,router])

const {data:messages,refetch}=useQuery({
  queryKey:["messages",roomID],
  queryFn:async()=>{
    const res= await client.messages.get({query:{roomID}});
    setInput("");
    return res.data
  }
})

useRealtime({
  channels:[roomID],
  events:["chat.message","chat.destroy"],
  onData:({event})=>{
    if(event==="chat.message"){
      refetch();
    }
    if(event==="chat.destroy"){
      router.push("/?destroyed=true")
    }
  }
})





const {mutate:sendMessage,isPending}=useMutation({
  mutationFn:async ({text}:{text:string}) => {
    await client.messages.post({sender:username,text},{query:{roomID}});
  }
})

const {mutate:destroy}=useMutation({

  mutationFn:async () => {
    await client.room.delete(null,{query:{roomID}})
  }
})
const copyLink=()=>{
  const url = window.location.href;
  navigator.clipboard.writeText(url);
  setCopyStatus("Copied!!");

  setTimeout(()=>setCopyStatus("Copy"),2000);
}

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
        <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30">
           <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase">Room ID: </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-500">{roomID}</span>
                <button onClick={()=>copyLink()} className="text-[11px] bg-zinc-800 hover:bg-zinc-600 py-1 px-2 rounded text-zinc-400 hover:text-zinc-200 transition-colors">{copyStatus}</button>
              </div>
            </div>


            <div className="h-8 w-px bg-zinc-800"/>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase">Self Destruct</span>
              <span className={`text-sm font-bold flex items-center gap-2 
                ${timeRemaining !==null && timeRemaining<60 ? "text-red-600":"text-amber-400"}`}>{timeRemaining ? formatTimeRemaining(timeRemaining):"--:--"}</span>
            </div>
           </div>

                <button onClick={()=>destroy()} className="text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex item-center gap-2 disabled:opacity-50">
                  <span className="group-hover: animate-pulse ">💥</span>
                  Destroy Now
                </button>
        </header>

        {/* Messages */}
              
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          { messages?.message.length===0 &&( 
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-700 text-sm font-mono"> No messages yet , start the conversation now </p>
              </div>
                )

          }
          {
            messages?.message.map((m)=>(
              <div key={m.id} className="flex flex-col items-start">
                <div className="max-w-[80%] group">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className={`text-xs font-bold ${m.sender===username? "text-green-500 ": "text-blue-500"}`}>
                    {m.sender===username? "YOU":m.sender}
                  </span>

                  <span className="text-[10px] text-zinc-500">
                    {format(m.timestamp,"HH:mm") }
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed break-all">
                  {m.text}
                </p>
                </div>
              </div>
            ))
          }
        </div>

      <div className="p-5 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 animate-pulse">{">"}</span>
              <input 
              type="text" 
              autoFocus 
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{
                if(e.key==="Enter" && input.trim()){
                  sendMessage({text:input})
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type message..."
              className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-7 pr-5 text-m "/>
          </div>
          <button disabled={!input.trim() || isPending} className="bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">SEND</button>
        </div>
      </div>

    </main>
  )
}

export default Page
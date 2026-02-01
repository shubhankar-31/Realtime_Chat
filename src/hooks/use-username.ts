import { nanoid } from "nanoid";
import { useState,useEffect } from "react";

const ANIMALS:string[]=["wolf", "hawk", "bear", "shark"];
const STORAGE_KEY:string="chat_username";

const generateUser =()=>{
  const word=ANIMALS[Math.floor(Math.random()*ANIMALS.length)];
  return `anonymous-${word}-${nanoid(5)}`;
}
export const useUsername=()=>{
     const [username, setUsername] = useState(">");

     useEffect(() => {
         const main=()=>{
           const stored= localStorage.getItem(STORAGE_KEY);
           if(stored){
             setUsername(stored)
             return;
           }
           const gen_user=generateUser();
           localStorage.setItem(STORAGE_KEY,gen_user);
           setUsername(gen_user);
     
         }
       
         return main()
       }, [])

       return {username}
}
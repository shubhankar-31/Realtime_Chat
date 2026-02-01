import { Suspense } from "react";
import Lobby from "./Lobby";

export default function Home(){
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Lobby />
    </Suspense>
  );
  
}


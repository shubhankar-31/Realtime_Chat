import { Suspense } from "react";
import Lobby from "./lobby";

export default function Home(){
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Lobby />
    </Suspense>
  );
  
}


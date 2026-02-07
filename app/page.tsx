import { redirect } from "next/navigation";

function Home() {

  redirect("/dashboard");


  return null
}

export default Home

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMockSession } from "@/lib/localAuth";

function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getMockSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    router.replace(
      session.role === "installer" ? "/installer/dashboard" : "/store"
    );
  }, [router]);

  return null;
}

export default Home;

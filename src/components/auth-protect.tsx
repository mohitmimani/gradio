"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import RippleWaveLoader from "./mvpblocks/ripple-loader";

type AuthProtectProps = {
  children: React.ReactNode;
};

export default function AuthProtect({ children }: AuthProtectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <RippleWaveLoader />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}

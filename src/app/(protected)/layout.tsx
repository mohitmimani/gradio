"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import AuthProtect from "@/components/auth-protect";
import RoleSelectionModal from "@/components/role-selection-modal";
import { Toaster } from "@/components/ui/toaster";

function RoleGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (status === "loading" || !session?.user?.id) return;
    fetch("/api/user/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data.teams && data.teams.length > 0) {
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      });
  }, [session, status]);

  if (status === "loading") return null;
  return (
    <>
      <RoleSelectionModal open={showOnboarding} />
      {children}
      <Toaster />
    </>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProtect>
        <RoleGate>{children}</RoleGate>
      </AuthProtect>
    </SessionProvider>
  );
}

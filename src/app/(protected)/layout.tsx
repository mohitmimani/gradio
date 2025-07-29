"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import AuthProtect from "@/components/auth-protect";
import RoleSelectionModal from "@/components/role-selection-modal";

function RoleGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === "loading" || !session?.user?.id) return;
    // Check if user has any teams
    fetch("/api/user/teams")
      .then((res) => res.json())
      .then((data) => {
        setShowModal(!data.teams || data.teams.length === 0);
      });
  }, [session, status]);

  if (status === "loading") return null;
  return (
    <>
      <RoleSelectionModal open={!showModal} />
      {children}
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

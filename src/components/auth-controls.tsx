"use client";

import Image from "next/image";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

import SigninModal from "./mvpblocks/signin-modal";

type AuthControlsProps = {
  session: Session | null;
};

export const AuthControls = ({ session }: AuthControlsProps) => {
  if (!session) return <SigninModal />;

  const { user } = session;

  return (
    <>
      {user?.image && (
        <Image
          className="overflow-hidden rounded-full"
          src={user.image}
          alt={user?.name || "User"}
          width={32}
          height={32}
        />
      )}
      <Button className="cursor-pointer" onClick={async () => await signOut()}>
        Sign out
      </Button>
    </>
  );
};

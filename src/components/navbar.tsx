import { Bell, ChevronDown, Mail, Search } from "lucide-react";
import React from "react";

import { AuthControls } from "@/components/auth-controls";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";

import { AppLogo } from "./app-logo";

const Navbar = async () => {
  const session = await auth();

  return (
    <header className="container mx-auto flex items-center justify-between px-4 py-4">
      <AppLogo />
      <div className="flex items-center gap-2">
        {/* Show notification/mail/search only if authenticated */}
        {session && (
          <>
            <Button
              size="icon"
              className="relative rounded-full"
              variant="secondary"
            >
              <Badge
                className="absolute -top-1 -right-1 flex aspect-square h-5 w-5 items-center justify-center rounded-full p-0"
                variant="destructive"
              >
                3
              </Badge>
              <Bell />
            </Button>
            <Button size="icon" className="rounded-full" variant="secondary">
              <Mail />
            </Button>
            <Button size="icon" className="rounded-full" variant="secondary">
              <Search />
            </Button>
          </>
        )}
        {/* AuthControls always visible */}
        <AuthControls session={session} />
        {/* If authenticated, show dropdown menu */}
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="bg-secondary flex items-center rounded-full p-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={session.user?.image || "/avatar-male-1.jpg"}
                  />
                  <AvatarFallback>
                    {session.user?.name
                      ? session.user.name
                          .split(" ")
                          .map((n: unknown[]) => n[0])
                          .join("")
                      : "JD"}
                  </AvatarFallback>
                </Avatar>
                <p className="ml-2 px-2 text-sm font-medium">
                  {session.user?.name || "John Doe"}
                </p>
                <ChevronDown className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[150px]">
              <DropdownMenuLabel className="cursor-pointer">
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Team
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500">
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Navbar;

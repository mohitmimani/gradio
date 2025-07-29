import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db, userTeams } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { role, teamId }: { role: "educator" | "student"; teamId: string } =
    await req.json();
  // Check if user is superadmin for this team
  const userTeamResult = await db
    .select({ isSuperAdmin: userTeams.isSuperAdmin })
    .from(userTeams)
    .where(
      and(eq(userTeams.userId, session.user.id), eq(userTeams.teamId, teamId)),
    )
    .limit(1);

  const userTeam = userTeamResult[0];
  if (!userTeam?.isSuperAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Only superadmin can set role" },
      { status: 403 },
    );
  }
  if (role !== "educator" && role !== "student") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  await db
    .update(userTeams)
    .set({
      role,
      isSuperAdmin: role === "educator",
      status: "joined",
      joinedAt: new Date(),
      userId: session.user.id,
    })
    .where(
      and(
        eq(userTeams.teamId, teamId),
        eq(userTeams.inviteeEmail, session.user.email ?? ""),
      ),
    );

  return NextResponse.json({ success: true });
}

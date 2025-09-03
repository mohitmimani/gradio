import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db, teams, userTeams } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { teamName, logo, invitees } = await req.json();
  if (!teamName || typeof teamName !== "string" || teamName.trim().length < 2) {
    return NextResponse.json({ error: "Invalid team name" }, { status: 400 });
  }

  // Create team with logo
  const [team] = await db
    .insert(teams)
    .values({
      name: teamName.trim(),
      createdBy: session.user.id,
      logo: logo || null,
    })
    .returning();

  // Add creator as educator and superadmin (status: joined)
  await db.insert(userTeams).values({
    userId: session.user.id,
    teamId: team.id,
    role: "educator",
    isSuperAdmin: true,
    status: "joined",
    joinedAt: new Date(),
  });

  // Store invitees in userTeams table (status: invited, no userId yet)
  if (Array.isArray(invitees)) {
    type Invitee = { email: string; role: "educator" | "student" | "billing" };
    const inviteeRows = (invitees as Invitee[])
      .filter(
        (inv) =>
          typeof inv.email === "string" &&
          inv.email &&
          ["educator", "student", "billing"].includes(inv.role),
      )
      .map(
        (inv) =>
          ({
            userId: null, // No userId until they register
            teamId: team.id,
            role: inv.role,
            isSuperAdmin: false,
            status: "invited",
            invitedAt: new Date(),
            inviteeEmail: inv.email,
          }) as const,
      );
    if (inviteeRows.length > 0) {
      await db.insert(userTeams).values(inviteeRows);
    }
  }

  return NextResponse.json({ success: true, teamId: team.id });
}

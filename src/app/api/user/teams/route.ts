import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db, teams, userTeams } from "@/lib/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ teams: [] });
  }
  const userTeamRows = await db
    .select({
      teamId: userTeams.teamId,
      role: userTeams.role,
      isSuperAdmin: userTeams.isSuperAdmin,
    })
    .from(userTeams)
    .where(eq(userTeams.userId, session.user.id));
  if (!userTeamRows.length) {
    return NextResponse.json({ teams: [] });
  }
  const teamIds = userTeamRows.map((row) => row.teamId);
  const teamRows = await db
    .select()
    .from(teams)
    .where(inArray(teams.id, teamIds));
  // Merge role/isSuperAdmin into team objects
  const teamsWithRoles = teamRows.map((team) => {
    const userTeam = userTeamRows.find((ut) => ut.teamId === team.id);
    return {
      ...team,
      role: userTeam?.role,
      isSuperAdmin: userTeam?.isSuperAdmin,
    };
  });
  return NextResponse.json({ teams: teamsWithRoles });
}

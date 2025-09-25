"use client";

import {
  AudioWaveform,
  Brain,
  ChartBar,
  Command,
  FileQuestion,
  GalleryVerticalEnd,
  PieChart,
  Share2,
  Users,
  Upload,
  FileText,
  BarChart3,
} from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "Assignments",
    url: "/dashboard/assignments",
    icon: Upload,
    items: [
      { title: "Create Assignment", url: "/dashboard/assignments/create" },
      { title: "Assignment Library", url: "/dashboard/assignments/library" },
      { title: "Submission Analytics", url: "/dashboard/assignments/analytics" },
    ],
  },
  {
    title: "AI MCQ Generator",
    url: "/dashboard/mcq-generator",
    icon: Brain,
    items: [
      { title: "Generate New MCQ", url: "/dashboard/mcq-generator/create" },
      { title: "My Generated MCQs", url: "/dashboard/mcq-generator/library" },
      { title: "Templates", url: "/dashboard/mcq-generator/templates" },
    ],
  },
  {
    title: "Share & Track",
    url: "/dashboard/share",
    icon: Share2,
    items: [
      { title: "Share Quiz", url: "/dashboard/share/distribute" },
      { title: "Student Responses", url: "/dashboard/share/responses" },
      { title: "Analytics", url: "/dashboard/share/analytics" },
    ],
  },
];

const projects = [
  { name: "Recent Assignments", url: "/dashboard/assignments/library", icon: FileText },
  { name: "AI Detection Stats", url: "/dashboard/assignments/analytics", icon: BarChart3 },
  { name: "Recent Quizzes", url: "/dashboard/recent", icon: ChartBar },
  { name: "Student Groups", url: "/dashboard/groups", icon: Users },
];

const teamIconMap: Record<string, React.ElementType> = {
  Enterprise: GalleryVerticalEnd,
  Professional: AudioWaveform,
  Starter: PieChart,
  Free: Command,
};

type Team = {
  id: string;
  name: string;
  logo?: string | null;
  plan?: string;
  role?: "educator" | "student" | "billing";
  isSuperAdmin?: boolean;
};

export default function AppSidebar() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[] | null>(null);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/user/teams");
        const data = await res.json();
        setTeams(Array.isArray(data.teams) ? data.teams : []);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        setTeams([]);
      }
    }
    fetchTeams();
  }, []);

  return (
    <Sidebar>
      <SidebarRail />
      <SidebarHeader>
        <NavUser user={session?.user} />
        {teams !== null && (
          <TeamSwitcher
            teams={
              teams.length > 0
                ? teams.map((team) => ({
                    name: team.name,
                    logo: teamIconMap[team.plan ?? "Free"] || Command,
                    plan: team.plan || "Free",
                  }))
                : [{ name: "No Team", logo: Command, plan: "Free" }]
            }
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

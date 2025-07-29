"use client";

import {
  AudioWaveform,
  BarChart2,
  BookOpen,
  Bot,
  ClipboardList,
  Command,
  FileBarChart2,
  FileCheck2,
  Frame,
  GalleryVerticalEnd,
  GraduationCap,
  Map,
  MessageCircle,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
} from "lucide-react";
import * as React from "react";

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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

// Sidebar nav config for each role
const navConfig = {
  student: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Assignments",
      url: "/assignments",
      icon: ClipboardList,
      items: [
        { title: "Upcoming", url: "/assignments/upcoming" },
        { title: "Submitted", url: "/assignments/submitted" },
      ],
    },
    {
      title: "Grades",
      url: "/grades",
      icon: FileBarChart2,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: MessageCircle,
    },
    {
      title: "Resources",
      url: "/resources",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
  teacher: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Classes",
      url: "/classes",
      icon: Users,
      items: [
        { title: "All Classes", url: "/classes" },
        { title: "Create Class", url: "/classes/new" },
      ],
    },
    {
      title: "Assignments",
      url: "/assignments",
      icon: ClipboardList,
      items: [
        { title: "All Assignments", url: "/assignments" },
        { title: "Create Assignment", url: "/assignments/new" },
      ],
    },
    {
      title: "Submissions",
      url: "/submissions",
      icon: FileCheck2,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart2,
    },
    {
      title: "Students",
      url: "/students",
      icon: GraduationCap,
    },
    {
      title: "Resources",
      url: "/resources",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
};

export function AppSidebar({
  role = "student", // "student" | "teacher"
  ...props
}: { role?: "student" | "teacher" } & React.ComponentProps<typeof Sidebar>) {
  // You can fetch user/role from context/session in the future
  const navMain = navConfig[role];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/* Optionally, show projects for teachers only */}
        {role === "teacher" && <NavProjects projects={data.projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

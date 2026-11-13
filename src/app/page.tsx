import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";

export const metadata: Metadata = {
  title: "L Platform — AI and coding for students",
  description:
    "Free desktop app for students: a beginner AI course, coding challenges and tests from teachers. Download for Windows, macOS or Linux.",
};

export default function HomePage() {
  return <Landing />;
}

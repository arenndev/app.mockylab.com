import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design Create",
  description: "Create and remix designs with AI",
};

export default function DesignCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VORA — Your compassionate mental health companion",
  description: "VORA is an AI-powered psychological support companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

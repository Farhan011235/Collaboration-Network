import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Research Collaboration Network",
};

export default function LoginPage() {
  return <LoginForm />;
}

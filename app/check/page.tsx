import { SimpleCheck } from "@/components/SimpleCheck";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paste checker",
  description:
    "Paste a suspicious email for a multi-factor ScamShield check, evidence pack, and JSON report.",
};

export default function CheckPage() {
  return <SimpleCheck />;
}

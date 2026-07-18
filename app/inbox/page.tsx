import { GmailInbox } from "@/components/gmail/GmailInbox";

export const metadata = {
  title: "ScamShield in Mail — Gmail demo",
  description:
    "Gmail-like inbox with ScamShield side panel, trust-sender prompts, and live phishing analysis.",
};

export default function InboxPage() {
  return <GmailInbox />;
}

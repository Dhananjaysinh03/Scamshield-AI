export type EmailDemoId =
  | "bank_otp"
  | "fake_prize"
  | "temp_mail"
  | "fake_support"
  | "safe_ok";

/** One-tap featured demo on the Check tab */
export const FEATURED_DEMO_ID: EmailDemoId = "bank_otp";

/**
 * Everyday phishing samples for normal people (demo only — never send as real attacks).
 */
export const EMAIL_DEMOS: {
  id: EmailDemoId;
  label: string;
  line: string;
  raw: string;
  tone?: "attack" | "safe";
  expect?: "phishing" | "safe";
}[] = [
  {
    id: "bank_otp",
    label: "Fake bank OTP",
    line: "Asks for your OTP to “unfreeze” account",
    tone: "attack",
    expect: "phishing",
    raw: `From: "HDFC Bank Security" <alerts@hdfc-secure-login.xyz>
To: you@email.com
Subject: URGENT: Confirm OTP to stop account freeze

Dear Customer,

We detected an unusual login on your account.
Your account will be frozen within 24 hours unless you verify immediately.

Click here to verify:
https://hdfc-secure-login.xyz/otp

Or reply with the OTP / one-time password you just received on SMS.

HDFC Fraud Desk`,
  },
  {
    id: "fake_prize",
    label: "Prize / gift file",
    line: "“You won a gift” — file is malware",
    tone: "attack",
    expect: "phishing",
    raw: `From: "Rewards Desk" <claim@amazon-gift-secure.xyz>
To: you@email.com
Subject: You won a surprise gift — claim before midnight

Congratulations!

You have been selected for a surprise gift card.
Open Gift_Card.pdf.exe attached and claim yours before midnight.
Act now — offer expires in 24 hours.

Rewards Team
Attachment: Gift_Card.pdf.exe
Download: https://amazon-gift-secure.xyz/Gift_Card.pdf.exe`,
  },
  {
    id: "temp_mail",
    label: "Temp-mail bank",
    line: "Fake bank from a throwaway inbox",
    tone: "attack",
    expect: "phishing",
    raw: `From: "SBI Secure" <sbi-alerts@smailpro.com>
To: you@email.com
Reply-To: drop@guerrillamail.com
Subject: Verify OTP to keep account active

Dear Customer,

Your account will be suspended within 24 hours.
Reply with the OTP / verification code sent to your phone, or click:

https://sbi-secure-login.xyz/verify

SBI Security Team`,
  },
  {
    id: "fake_support",
    label: "Fake support",
    line: "Asks you to install AnyDesk / share screen",
    tone: "attack",
    expect: "phishing",
    raw: `From: "Paytm Customer Care" <care@paytm-helpdesk.xyz>
To: you@email.com
Subject: Refund pending — install AnyDesk to receive money

Dear User,

Your refund of ₹12,400 is pending.
Please install AnyDesk and share your screen with our executive so we can credit it immediately.

Download: https://paytm-helpdesk.xyz/anydesk
Reply with your AnyDesk ID.

Paytm Support`,
  },
  {
    id: "safe_ok",
    label: "Normal email",
    line: "Just a friend — no scam tricks",
    tone: "safe",
    expect: "safe",
    raw: `From: "Priya Sharma" <priya.shopper@gmail.com>
To: friend@example.com
Subject: Lunch tomorrow?

Hey — are we still on for lunch at 1pm near the office?
No rush, just confirm when you can.

Priya`,
  },
];

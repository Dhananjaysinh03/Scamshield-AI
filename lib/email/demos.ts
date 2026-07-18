export type EmailDemoId =
  | "bank_otp"
  | "ceo_gift"
  | "temp_mail"
  | "ceo_fraud"
  | "safe_ok";

/**
 * Judge demo rail (5): polished synthetic phishing pastes + safe contrast.
 * Demo-only samples — never send as real attacks.
 */
export const EMAIL_DEMOS: {
  id: EmailDemoId;
  label: string;
  line: string;
  raw: string;
  officialDomain?: string;
  tone?: "attack" | "safe";
  expect?: "phishing" | "safe";
}[] = [
  {
    id: "bank_otp",
    label: "Bank OTP",
    line: "Fake HDFC + OTP + freeze threat",
    tone: "attack",
    expect: "phishing",
    raw: `From: "HDFC Bank Security" <alerts@hdfc-secure-login.xyz>
To: customer@email.com
Reply-To: help@hdfc-secure-login.xyz
Subject: URGENT: Confirm OTP to stop account freeze

Dear Customer,

We detected an unusual login on your net banking.
Your account will be frozen within 24 hours unless you verify immediately.

Click here to verify your account:
https://hdfc-secure-login.xyz/otp

Or reply with the OTP / one-time password you just received on SMS.
Do not ignore this final notice.

HDFC Fraud Desk
Customer Care`,
  },
  {
    id: "ceo_gift",
    label: "CEO gift virus",
    line: "CEO@Gmail + gift .pdf.exe malware",
    tone: "attack",
    expect: "phishing",
    officialDomain: "acme.com",
    raw: `From: "Rahul Sharma, CEO" <ceo.acme.corp@gmail.com>
To: all@acme.com
Subject: Surprise gift for all employees — claim yours before EOD

Team,

I arranged a surprise gift for everyone this week.
Open the attached Gift_Card.pdf.exe and claim yours before EOD.

Keep this confidential — do not tell HR or anyone on the team yet.
I am in meetings; send confirmation when done.

Rahul Sharma
CEO, Acme
Attachment: Gift_Card.pdf.exe
Download: https://gift-claim-secure.xyz/Gift_Card.pdf.exe`,
  },
  {
    id: "temp_mail",
    label: "Temp-mail",
    line: "Smailpro From + guerrilla Reply-To",
    tone: "attack",
    expect: "phishing",
    raw: `From: "SBI Secure" <sbi-alerts@smailpro.com>
To: you@email.com
Reply-To: drop@guerrillamail.com
Subject: Verify OTP to keep account active — act now

Dear Customer,

Your account will be suspended within 24 hours.
Complete secure login and reply with the OTP / verification code sent to your phone.

Click here:
https://sbi-secure-login.xyz/verify

SBI Security Team`,
  },
  {
    id: "ceo_fraud",
    label: "CEO wire",
    line: "Boss on Gmail asks secret wire",
    tone: "attack",
    expect: "phishing",
    officialDomain: "acme.com",
    raw: `From: "Rahul Sharma, CEO" <ceo.acme.corp@gmail.com>
To: finance@acme.com
Reply-To: rahul.wiredesk@proton.me
Subject: URGENT — Wire transfer today (confidential)

Hi,

I need you to process a confidential wire transfer of $48,500 to our vendor before EOD.
Do not tell anyone on the team — keep this confidential. I am in meetings.

Send money / NEFT as discussed and confirm when done.

Rahul Sharma
CEO`,
  },
  {
    id: "safe_ok",
    label: "Normal email",
    line: "Friendly lunch — no phishing lure",
    tone: "safe",
    expect: "safe",
    raw: `From: "Priya Sharma" <priya.shopper@gmail.com>
To: friend@example.com
Subject: Lunch tomorrow?

Hey — are we still on for lunch at 1pm near the office?
No rush, just confirm when you can. Looking forward to catching up.

Priya`,
  },
];

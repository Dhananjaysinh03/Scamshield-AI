export type EmailDemoId =
  | "bank_otp"
  | "ceo_gift"
  | "temp_mail"
  | "ceo_fraud"
  | "safe_ok";

/**
 * Judge demo rail (max 5): attacks first, then safe contrast.
 * Pitch order: OTP → CEO gift → temp-mail → CEO wire → safe.
 */
export const EMAIL_DEMOS: {
  id: EmailDemoId;
  label: string;
  line: string;
  raw: string;
  officialDomain?: string;
  tone?: "attack" | "safe";
}[] = [
  {
    id: "bank_otp",
    label: "Bank OTP",
    line: "Fake bank asks for OTP",
    tone: "attack",
    raw: `From: HDFC Bank Security <alerts@hdfc-secure-login.xyz>
To: customer@email.com
Subject: URGENT: Confirm OTP to stop account freeze

Dear Customer,

We detected unusual login. Your account will be frozen within 24 hours.

Click here to verify: https://hdfc-secure-login.xyz/otp
Or reply with the OTP you received on SMS.

HDFC Fraud Desk`,
  },
  {
    id: "ceo_gift",
    label: "CEO gift virus",
    line: "CEO on Gmail — gift is malware",
    tone: "attack",
    officialDomain: "acme.com",
    raw: `From: "Rahul Sharma, CEO" <ceo.acme.corp@gmail.com>
To: all@acme.com
Subject: Surprise gift for all employees — claim yours

Team,

I arranged a gift for everyone. Open Gift_Card.pdf.exe attached and claim before EOD. Keep this confidential — do not tell HR yet.

Rahul Sharma
CEO
Attachment: Gift_Card.pdf.exe
Download: https://gift-claim-secure.xyz/Gift_Card.pdf.exe`,
  },
  {
    id: "temp_mail",
    label: "Temp-mail",
    line: "Disposable From + OTP ask",
    tone: "attack",
    raw: `From: "SBI Secure" <sbi-alerts@smailpro.com>
To: you@email.com
Reply-To: drop@guerrillamail.com
Subject: Verify OTP to keep account active

Dear Customer,

Your account will be suspended. Reply with the OTP sent to your phone or click https://sbi-secure-login.xyz/verify

SBI Security Team`,
  },
  {
    id: "ceo_fraud",
    label: "CEO wire",
    line: "Boss on Gmail asks for wire",
    tone: "attack",
    officialDomain: "acme.com",
    raw: `From: "Rahul Sharma, CEO" <ceo.acme.corp@gmail.com>
To: finance@acme.com
Reply-To: rahul.wiredesk@proton.me
Subject: URGENT — Wire transfer today (confidential)

Hi,

I need you to process a confidential wire transfer of $48,500 to our vendor before EOD.
Do not discuss this with anyone on the team — I'm in meetings.

Send confirmation when done.

Rahul Sharma
CEO`,
  },
  {
    id: "safe_ok",
    label: "Normal email",
    line: "Contrast — no phishing lure",
    tone: "safe",
    raw: `From: "Priya Sharma" <priya.shopper@gmail.com>
To: friend@example.com
Subject: Lunch tomorrow?

Hey — are we still on for lunch at 1pm near the office? No rush, just confirm when you can.

Priya`,
  },
];

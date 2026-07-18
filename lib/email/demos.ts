export type EmailDemoId =
  | "bank_otp"
  | "ceo_gift"
  | "ceo_fraud"
  | "temp_mail"
  | "invoice_malware"
  | "remote_access";

/** Pitch order: OTP → CEO gift virus → CEO wire → temp-mail → invoice → remote */
export const EMAIL_DEMOS: {
  id: EmailDemoId;
  label: string;
  line: string;
  raw: string;
  officialDomain?: string;
}[] = [
  {
    id: "bank_otp",
    label: "Bank OTP",
    line: "Fake bank asks for OTP",
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
    line: "CEO on Gmail — gift file is malware",
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
    id: "ceo_fraud",
    label: "CEO wire",
    line: "Boss on Gmail asks for urgent wire",
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
    id: "temp_mail",
    label: "Temp-mail",
    line: "Disposable From + OTP ask",
    raw: `From: "SBI Secure" <sbi-alerts@smailpro.com>
To: you@email.com
Reply-To: drop@guerrillamail.com
Subject: Verify OTP to keep account active

Dear Customer,

Your account will be suspended. Reply with the OTP sent to your phone or click https://sbi-secure-login.xyz/verify

SBI Security Team`,
  },
  {
    id: "invoice_malware",
    label: "Fake invoice",
    line: "Looks like PDF — is malware",
    raw: `From: Billing <accounts@paypal-secure-pay.xyz>
To: you@example.com
Subject: Invoice 88214 — payment overdue

Your invoice is attached. Open Invoice_88214.pdf.exe and pay immediately to avoid suspension.

Attachment: Invoice_88214.pdf.exe
Download: https://paypal-secure-pay.xyz/files/Invoice_88214.pdf.exe`,
  },
  {
    id: "remote_access",
    label: "Fake support",
    line: "Install AnyDesk / share screen",
    raw: `From: "Paytm Customer Care" <care@paytm-helpdesk.xyz>
To: you@email.com
Subject: Refund pending — install AnyDesk to receive money

Dear User,

Your refund of ₹12,400 is pending. Please install AnyDesk and share your screen with our executive so we can credit it immediately.

Download: https://paytm-helpdesk.xyz/anydesk
Reply with your AnyDesk ID.

Paytm Support`,
  },
];

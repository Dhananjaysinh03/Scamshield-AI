export type EmailDemoId =
  | "ceo_fraud"
  | "invoice_malware"
  | "bank_otp"
  | "remote_access";

export const EMAIL_DEMOS: {
  id: EmailDemoId;
  label: string;
  line: string;
  raw: string;
}[] = [
  {
    id: "ceo_fraud",
    label: "CEO fraud",
    line: "Boss on Gmail asks for an urgent wire",
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
    id: "invoice_malware",
    label: "Fake invoice",
    line: "Attachment looks like a PDF but is malware",
    raw: `From: Billing <accounts@paypal-secure-pay.xyz>
To: you@example.com
Subject: Invoice 88214 — payment overdue

Your invoice is attached. Open Invoice_88214.pdf.exe and pay immediately to avoid suspension.

Attachment: Invoice_88214.pdf.exe
Download: https://paypal-secure-pay.xyz/files/Invoice_88214.pdf.exe`,
  },
  {
    id: "bank_otp",
    label: "Bank OTP phish",
    line: "Fake bank asks for the OTP you just received",
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
    id: "remote_access",
    label: "Fake support",
    line: "Asks you to install AnyDesk / share screen",
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

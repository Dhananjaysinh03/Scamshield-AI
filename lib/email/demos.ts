export type EmailDemoId = "ceo_fraud" | "invoice_malware" | "bank_otp";

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
];

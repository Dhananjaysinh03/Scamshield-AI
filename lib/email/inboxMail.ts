/**
 * Demo mailbox for ScamShield-in-Mail (Gmail-like MVP).
 * Mixed: genuine · phishing · spam — analyzed by the real engine when opened.
 */

export type InboxCategory = "genuine" | "phishing" | "spam";

export type InboxMail = {
  id: string;
  category: InboxCategory;
  starred: boolean;
  unread: boolean;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  time: string;
  avatarColor: string;
  /** Full raw for /api/email-analyze */
  raw: string;
  bodyHtml: string;
};

export const INBOX_MAILS: InboxMail[] = [
  {
    id: "phish-hdfc",
    category: "phishing",
    starred: false,
    unread: true,
    fromName: "HDFC Bank Security",
    fromEmail: "alerts@hdfc-secure-login.xyz",
    subject: "URGENT: Confirm OTP to stop account freeze",
    snippet: "Your account will be frozen within 24 hours unless you verify…",
    time: "10:42 AM",
    avatarColor: "#c5221f",
    raw: `Return-Path: <bounce@hdfc-secure-login.xyz>
Authentication-Results: mx.google.com; spf=fail; dkim=fail; dmarc=fail
From: "HDFC Bank Security" <alerts@hdfc-secure-login.xyz>
To: you@gmail.com
Subject: URGENT: Confirm OTP to stop account freeze

Dear Customer,

We detected an unusual login on your account.
Your account will be frozen within 24 hours unless you verify immediately.

Click here to verify:
https://hdfc-secure-login.xyz/otp

Or reply with the OTP / one-time password you just received on SMS.

HDFC Fraud Desk`,
    bodyHtml: `<p>Dear Customer,</p>
<p>We detected an unusual login on your account.<br/>
Your account will be <b>frozen within 24 hours</b> unless you verify immediately.</p>
<p><a href="https://hdfc-secure-login.xyz/otp">Click here to verify</a></p>
<p>Or reply with the OTP / one-time password you just received on SMS.</p>
<p>HDFC Fraud Desk</p>`,
  },
  {
    id: "genuine-priya",
    category: "genuine",
    starred: true,
    unread: true,
    fromName: "Priya Sharma",
    fromEmail: "priya.shopper@gmail.com",
    subject: "Lunch tomorrow?",
    snippet: "Hey — are we still on for lunch at 1pm near the office?",
    time: "9:18 AM",
    avatarColor: "#1a73e8",
    raw: `Authentication-Results: mx.google.com; spf=pass; dkim=pass; dmarc=pass
From: "Priya Sharma" <priya.shopper@gmail.com>
To: you@gmail.com
Subject: Lunch tomorrow?

Hey — are we still on for lunch at 1pm near the office?
No rush, just confirm when you can.

Priya`,
    bodyHtml: `<p>Hey — are we still on for lunch at 1pm near the office?</p>
<p>No rush, just confirm when you can.</p>
<p>Priya</p>`,
  },
  {
    id: "phish-gift",
    category: "phishing",
    starred: false,
    unread: true,
    fromName: "Rewards Desk",
    fromEmail: "claim@amazon-gift-secure.xyz",
    subject: "You won a surprise gift — claim before midnight",
    snippet: "Open Gift_Card.pdf.exe attached and claim yours before midnight…",
    time: "Yesterday",
    avatarColor: "#e37400",
    raw: `Authentication-Results: mx.example.com; spf=fail; dkim=none; dmarc=fail
From: "Rewards Desk" <claim@amazon-gift-secure.xyz>
To: you@gmail.com
Subject: You won a surprise gift — claim before midnight

Congratulations! Open Gift_Card.pdf.exe attached and claim yours before midnight.
Download: https://amazon-gift-secure.xyz/Gift_Card.pdf.exe
Attachment: Gift_Card.pdf.exe`,
    bodyHtml: `<p>Congratulations!</p>
<p>You have been selected for a surprise gift card.<br/>
Open <b>Gift_Card.pdf.exe</b> attached and claim yours before midnight.</p>
<p><a href="https://amazon-gift-secure.xyz/Gift_Card.pdf.exe">Download gift</a></p>`,
  },
  {
    id: "spam-promo",
    category: "spam",
    starred: false,
    unread: false,
    fromName: "DealBlast Offers",
    fromEmail: "blast@dealblast-promo.top",
    subject: "🔥 90% OFF everything — limited stock!!!",
    snippet: "Unsubscribe if you hate savings. Click now for mega deals…",
    time: "Yesterday",
    avatarColor: "#9334e6",
    raw: `From: "DealBlast Offers" <blast@dealblast-promo.top>
To: you@gmail.com
Subject: 90% OFF everything — limited stock!!!

MEGA SALE — click https://dealblast-promo.top/now for 90% off.
Unsubscribe: https://dealblast-promo.top/unsub
Buy buy buy!!! Limited stock!!!`,
    bodyHtml: `<p><b>MEGA SALE</b> — 90% OFF everything!!!</p>
<p><a href="https://dealblast-promo.top/now">Click now for mega deals</a></p>
<p style="color:#666;font-size:12px">Unsubscribe: <a href="https://dealblast-promo.top/unsub">here</a></p>`,
  },
  {
    id: "genuine-notion",
    category: "genuine",
    starred: false,
    unread: false,
    fromName: "Notion Team",
    fromEmail: "team@makenotion.com",
    subject: "Your weekly workspace digest",
    snippet: "3 pages updated · 1 comment waiting · Here’s what happened…",
    time: "Mon",
    avatarColor: "#188038",
    raw: `Authentication-Results: mx.google.com; spf=pass; dkim=pass; dmarc=pass
From: "Notion Team" <team@makenotion.com>
To: you@gmail.com
Subject: Your weekly workspace digest

Hi — here’s your weekly digest.
3 pages were updated and 1 comment is waiting for you.
Open Notion to catch up — no password or OTP needed.

— Notion`,
    bodyHtml: `<p>Hi — here’s your weekly digest.</p>
<p>3 pages were updated and 1 comment is waiting for you.</p>
<p>Open Notion to catch up — no password or OTP needed.</p>
<p>— Notion</p>`,
  },
  {
    id: "phish-anydesk",
    category: "phishing",
    starred: false,
    unread: true,
    fromName: "Paytm Customer Care",
    fromEmail: "care@paytm-helpdesk.xyz",
    subject: "Refund pending — install AnyDesk to receive money",
    snippet: "Please install AnyDesk and share your screen with our executive…",
    time: "Mon",
    avatarColor: "#d93025",
    raw: `Authentication-Results: mx.example.com; spf=fail; dkim=fail; dmarc=fail
From: "Paytm Customer Care" <care@paytm-helpdesk.xyz>
To: you@gmail.com
Subject: Refund pending — install AnyDesk to receive money

Your refund of ₹12,400 is pending.
Please install AnyDesk and share your screen.
Download: https://paytm-helpdesk.xyz/anydesk`,
    bodyHtml: `<p>Dear User,</p>
<p>Your refund of <b>₹12,400</b> is pending.<br/>
Please install AnyDesk and share your screen with our executive.</p>
<p><a href="https://paytm-helpdesk.xyz/anydesk">Download AnyDesk</a></p>`,
  },
  {
    id: "spam-crypto",
    category: "spam",
    starred: false,
    unread: false,
    fromName: "CryptoWin Lottery",
    fromEmail: "win@cryptowin-lottery.click",
    subject: "You are selected for 2 BTC giveaway",
    snippet: "Send a small fee to unlock your bitcoin prize now…",
    time: "Sun",
    avatarColor: "#f9ab00",
    raw: `From: "CryptoWin Lottery" <win@cryptowin-lottery.click>
To: you@gmail.com
Subject: You are selected for 2 BTC giveaway

Congratulations winner! Claim 2 BTC at https://cryptowin-lottery.click/claim
Pay a small processing fee via UPI to unlock.`,
    bodyHtml: `<p>Congratulations winner!</p>
<p>Claim <b>2 BTC</b> at <a href="https://cryptowin-lottery.click/claim">this link</a>.</p>
<p>Pay a small processing fee via UPI to unlock.</p>`,
  },
  {
    id: "genuine-github",
    category: "genuine",
    starred: false,
    unread: false,
    fromName: "GitHub",
    fromEmail: "noreply@github.com",
    subject: "[GitHub] A new sign-in to your account",
    snippet: "We noticed a sign-in from a new device. If this was you, no action…",
    time: "Sun",
    avatarColor: "#24292f",
    raw: `Authentication-Results: mx.google.com; spf=pass; dkim=pass; dmarc=pass
From: "GitHub" <noreply@github.com>
To: you@gmail.com
Subject: [GitHub] A new sign-in to your account

Hi,

We noticed a sign-in from a new device in Ahmedabad, India.
If this was you, you can ignore this email.
If not, secure your account from github.com/settings/security — do not reply with passwords or OTP.

Thanks,
The GitHub Team`,
    bodyHtml: `<p>Hi,</p>
<p>We noticed a sign-in from a new device in Ahmedabad, India.</p>
<p>If this was you, you can ignore this email.<br/>
If not, secure your account from GitHub settings — <b>do not reply with passwords or OTP</b>.</p>
<p>Thanks,<br/>The GitHub Team</p>`,
  },
  {
    id: "phish-temp",
    category: "phishing",
    starred: false,
    unread: true,
    fromName: "SBI Secure",
    fromEmail: "sbi-alerts@smailpro.com",
    subject: "Verify OTP to keep account active",
    snippet: "Reply with the OTP sent to your phone, or click to verify…",
    time: "Sat",
    avatarColor: "#a50e0e",
    raw: `Authentication-Results: mx.example.com; spf=softfail; dkim=fail; dmarc=fail
From: "SBI Secure" <sbi-alerts@smailpro.com>
To: you@gmail.com
Reply-To: drop@guerrillamail.com
Subject: Verify OTP to keep account active

Your account will be suspended within 24 hours.
Reply with the OTP or click https://sbi-secure-login.xyz/verify`,
    bodyHtml: `<p>Dear Customer,</p>
<p>Your account will be suspended within 24 hours.</p>
<p>Reply with the OTP, or <a href="https://sbi-secure-login.xyz/verify">click to verify</a>.</p>`,
  },
];

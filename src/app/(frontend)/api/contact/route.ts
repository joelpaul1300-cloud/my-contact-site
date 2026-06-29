import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Resend } from 'resend'

/* ── Resend client ──────────────────────────────────────────────
   Set RESEND_API_KEY in .env
   Set CONTACT_EMAIL_RECIPIENT to change where emails are sent
   ────────────────────────────────────────────────────────────── */
const resend = new Resend(process.env.RESEND_API_KEY)

/* ── HTML email template (tabular format) ────────────────────── */
function buildEmailHTML(data: {
  name: string
  email: string
  mobile: string
  subject?: string
  message?: string
  submittedAt: string
}) {
  const rows = [
    ['Full Name', data.name],
    ['Email', data.email],
    ['Mobile', data.mobile],
    ['Submitted At', data.submittedAt],
  ]

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>New Contact Form Submission</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="
              background:linear-gradient(135deg,#6d28d9 0%,#a21caf 100%);
              border-radius:16px 16px 0 0;
              padding:32px 40px;
              text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.6);">
                New Submission
              </p>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;">
                📬 Contact Form
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="
              background:#13131f;
              border:1px solid rgba(255,255,255,0.07);
              border-top:none;
              border-radius:0 0 16px 16px;
              padding:36px 40px;">

              <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6;">
                Someone just submitted the contact form on your website. Here are the details:
              </p>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;">
                ${rows
                  .map(
                    ([label, value], i) => `
                <tr style="background:${i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent'};">
                  <td style="
                    padding:14px 18px;
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:0.06em;
                    text-transform:uppercase;
                    color:rgba(255,255,255,0.4);
                    white-space:nowrap;
                    border-right:1px solid rgba(255,255,255,0.06);
                    width:140px;">
                    ${label}
                  </td>
                  <td style="
                    padding:14px 18px;
                    font-size:14px;
                    color:#e2e2f0;
                    word-break:break-word;">
                    ${
                      label === 'Email'
                        ? `<a href="mailto:${value}" style="color:#a78bfa;text-decoration:none;">${value}</a>`
                        : value
                    }
                  </td>
                </tr>`,
                  )
                  .join('')}
              </table>

                ${data.message ? `
              <!-- Message box -->
              <div style="
                margin-top:24px;
                background:rgba(109,40,217,0.1);
                border:1px solid rgba(139,92,246,0.25);
                border-radius:12px;
                padding:20px 22px;">
                <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a78bfa;">
                  Message
                </p>
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.75;white-space:pre-wrap;">${data.message}</p>
              </div>` : ''}

              <!-- Reply CTA -->
              <div style="margin-top:28px;text-align:center;">
                <a href="mailto:${data.email}?subject=Re: New Contact"
                   style="
                     display:inline-block;
                     background:linear-gradient(135deg,#6d28d9,#a21caf);
                     color:#fff;
                     font-size:14px;
                     font-weight:700;
                     text-decoration:none;
                     padding:14px 32px;
                     border-radius:10px;
                     letter-spacing:0.01em;">
                  Reply to ${data.name} →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
                To change the recipient, update <code style="color:rgba(255,255,255,0.35);">CONTACT_EMAIL_RECIPIENT</code> in your <code style="color:rgba(255,255,255,0.35);">.env</code> file.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/* ── Validation ──────────────────────────────────────────────── */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const MOBILE_REGEX = /^[+]?[\d\s\-().]{7,15}$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, mobile, message } = body

    // Required check
    if (!name || !email || !mobile) {
      return NextResponse.json({ message: 'Name, email, and mobile are required.' }, { status: 400 })
    }

    // Email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: 'Enter a valid email address (e.g. you@example.com).' },
        { status: 400 },
      )
    }

    // Mobile format
    if (!MOBILE_REGEX.test(mobile)) {
      return NextResponse.json({ message: 'Enter a valid mobile number.' }, { status: 400 })
    }

    // ── Save to Payload / Neon DB ──
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'contact-submissions',
      data: { name, email, mobile, message },
    })

    // ── Send email via Resend ──
    const recipient = process.env.CONTACT_EMAIL_RECIPIENT || 'joelpaul0413@gmail.com'
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

    const { error: resendError } = await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>', // change to your verified domain later
      to: [recipient],
      replyTo: email,
      subject: `📬 New Contact from ${name}`,
      html: buildEmailHTML({ name, email, mobile, message, submittedAt }),
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      // DB already saved — don't fail the request over email
    }

    return NextResponse.json(
      { message: "Message received! We'll be in touch soon." },
      { status: 200 },
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ message: 'Server error. Please try again later.' }, { status: 500 })
  }
}

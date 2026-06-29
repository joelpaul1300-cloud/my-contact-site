'use client'

import React, { useState, useEffect } from 'react'
import './contact.css'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormData {
  name: string
  email: string
  mobile: string
  message: string
}

interface FieldError {
  name?: string
  email?: string
  mobile?: string
  message?: string
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const MOBILE_REGEX = /^[+]?[\d\s\-().]{7,15}$/

function validate(data: FormData): FieldError {
  const errors: FieldError = {}
  if (!data.name.trim()) errors.name = 'Full name is required.'
  if (!data.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = 'Enter a valid email (e.g. you@example.com).'
  }
  if (!data.mobile.trim()) {
    errors.mobile = 'Mobile number is required.'
  } else if (!MOBILE_REGEX.test(data.mobile)) {
    errors.mobile = 'Enter a valid mobile number.'
  }
  
  return errors
}

const FEATURES = [
  {
    icon: '🔒',
    title: 'Private & Secure',
    desc: 'Your data is encrypted and never shared.',
  },
  {
    icon: '⚡',
    title: 'Fast Response',
    desc: 'We aim to reply within one business day.',
  },
  {
    icon: '🤝',
    title: 'Real People',
    desc: 'Every message is read by our team — no bots.',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    mobile: '',
    message: '',
  })
  const [errors, setErrors] = useState<FieldError>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      const newErrors = validate({ ...formData, [name]: value })
      setErrors((prev) => ({ ...prev, [name]: newErrors[name as keyof FieldError] }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const newErrors = validate(formData)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name as keyof FieldError] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.fromEntries(Object.keys(formData).map((k) => [k, true]))
    setTouched(allTouched)
    const validationErrors = validate(formData)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Something went wrong.')
      }
      setStatus('success')
      setFormData({ name: '', email: '', mobile: '', message: '' })
      setTouched({})
      setErrors({})
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unexpected error.')
    }
  }

  return (
    <main className={`contact-page ${mounted ? 'mounted' : ''}`}>
      {/* Animated background */}
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="noise" />

      <div className="contact-container">

        {/* ── Left Info Panel ── */}
        <div className="contact-info">
          <div className="info-badge animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <span className="badge-dot" />
            We&apos;re available now
          </div>

          <h1 className="info-title animate-slide-up" style={{ animationDelay: '0.12s' }}>
            Let&apos;s build<br />
            something <span className="gradient-text">great</span><br />
            for Kachua.
          </h1>

          <p className="info-desc animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Whether it&apos;s a quick question, a new project, or just saying hi —
            we&apos;re all ears. Drop us a message and we&apos;ll get back to you.
          </p>

          <div className="feature-list animate-slide-up" style={{ animationDelay: '0.28s' }}>
            {FEATURES.map((f, i) => (
              <div className="feature-item" key={i} style={{ animationDelay: `${0.32 + i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="divider animate-slide-up" style={{ animationDelay: '0.5s' }} />

          <div className="social-row animate-slide-up" style={{ animationDelay: '0.55s' }}>
            <span className="social-label">Find us on</span>
            {[
              { label: 'Twitter', href: '#', icon: '𝕏' },
              { label: 'LinkedIn', href: '#', icon: 'in' },
              { label: 'GitHub', href: '#', icon: '⌥' },
            ].map((s) => (
              <a key={s.label} href={s.href} className="social-chip" aria-label={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* ── Right Form Card ── */}
        <div className="contact-form-card animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {status === 'success' ? (
            <div className="success-state">
              <div className="success-ring">
                <div className="success-icon">✓</div>
              </div>
              <h2>Message Sent!</h2>
              <p>Thank you for reaching out.<br />We&apos;ll reply to <strong>{formData.name || 'you'}</strong> soon.</p>
              <button className="btn-primary" onClick={() => setStatus('idle')}>
                Send Another →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" noValidate>
              <div className="form-header">
                <h2 className="form-title">Send a Message</h2>
                <p className="form-subtitle">Fill out the details below.</p>
              </div>

              {/* Row: Name + Email */}
              <div className="form-row">
                <Field
                  id="name" name="name" label="Full Name" type="text"
                  placeholder="John Doe" value={formData.name}
                  error={errors.name} touched={touched.name}
                  onChange={handleChange} onBlur={handleBlur}
                  disabled={status === 'loading'}
                />
                <Field
                  id="email" name="email" label="Email Address" type="email"
                  placeholder="you@example.com" value={formData.email}
                  error={errors.email} touched={touched.email}
                  onChange={handleChange} onBlur={handleBlur}
                  disabled={status === 'loading'}
                />
              </div>

              {/* Row: Mobile */}
              <div className="form-group">
                <Field
                  id="mobile" name="mobile" label="Mobile Number" type="tel"
                  placeholder="+91 98765 43210" value={formData.mobile}
                  error={errors.mobile} touched={touched.mobile}
                  onChange={handleChange} onBlur={handleBlur}
                  disabled={status === 'loading'}
                />
              </div>

              {/* Message */}
              <div className={`form-group ${touched.message && errors.message ? 'has-error' : touched.message && !errors.message && formData.message ? 'is-valid' : ''}`}>
                <label htmlFor="message">
                  Message (Optional)
                  {touched.message && !errors.message && formData.message && <span className="valid-tick">✓</span>}
                </label>
                <textarea
                  id="message" name="message" rows={5}
                  placeholder="Tell us more about your project or question…"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={status === 'loading'}
                />
                {touched.message && errors.message && (
                  <span className="field-error">{errors.message}</span>
                )}
              </div>

              {status === 'error' && (
                <div className="error-banner" role="alert">
                  ⚠ {errorMsg}
                </div>
              )}

              <button
                id="contact-submit-btn"
                type="submit"
                className={`btn-primary ${status === 'loading' ? 'loading' : ''}`}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <span className="spinner" />
                    Sending…
                  </>
                ) : (
                  <>Send Message <span className="btn-arrow">→</span></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

/* ── Reusable Field ── */
function Field({
  id, name, label, type, placeholder, value, error, touched, onChange, onBlur, disabled,
}: {
  id: string
  name: string
  label: string
  type: string
  placeholder: string
  value: string
  error?: string
  touched?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
}) {
  const hasError = touched && error
  const isValid = touched && !error && value
  return (
    <div className={`form-group ${hasError ? 'has-error' : isValid ? 'is-valid' : ''}`}>
      <label htmlFor={id}>
        {label}
        {isValid && <span className="valid-tick">✓</span>}
      </label>
      <input
        id={id} name={name} type={type}
        placeholder={placeholder} value={value}
        onChange={onChange} onBlur={onBlur} disabled={disabled}
        autoComplete="off"
      />
      {hasError && <span className="field-error">{error}</span>}
    </div>
  )
}

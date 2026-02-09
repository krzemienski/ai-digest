# @ai-digest/email

Newsletter email delivery with React Email templates and Resend integration.

## Overview

The email package handles all email delivery for AI Digest, including digest newsletters and welcome emails. Built with React Email for maintainable, testable templates and Resend for reliable delivery.

## Installation

This package is part of the ai-digest monorepo. It's automatically available to other workspace packages.

## Exports

### Email Templates

| Component | Description | Props |
|-----------|-------------|-------|
| `DigestEmail` | AI digest newsletter template | `DigestEmailProps` |
| `WelcomeEmail` | Welcome email for new subscribers | `WelcomeEmailProps` |

### Sending Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `sendDigestNewsletter` | Send digest to all subscribers | `(digest: Digest, subscribers: Subscriber[]) => Promise<void>` |
| `sendWelcomeEmail` | Send welcome email to new subscriber | `(email: string, name?: string) => Promise<void>` |

### Subscriber Management

| Function | Description | Parameters |
|----------|-------------|------------|
| `addResendContact` | Add contact to Resend audience | `(email: string) => Promise<void>` |
| `removeResendContact` | Remove contact from Resend audience | `(email: string) => Promise<void>` |

### Types

| Type | Description |
|------|-------------|
| `DigestEmailProps` | Props for digest email template |
| `DigestEmailItem` | Item in digest email |
| `DigestEmailSection` | Section in digest email |
| `WelcomeEmailProps` | Props for welcome email template |

## Architecture

```
src/
├── templates/           # React Email templates
│   ├── digest-email.tsx # Newsletter template
│   └── welcome-email.tsx # Welcome template
├── send.ts              # Email sending logic
├── subscribers.ts       # Resend audience management
└── index.ts             # Public API
```

**Design Patterns:**
- Component-based templates (React Email)
- Batch sending for newsletters
- Error handling with retries
- Type-safe props for templates

## Email Templates

### DigestEmail

Renders a complete AI digest newsletter with:
- Header with digest date
- Multiple topic sections
- Item cards with title, summary, source
- Responsive design
- Cyberpunk-inspired styling

**Props:**
```typescript
interface DigestEmailProps {
  digestDate: string;
  sections: DigestEmailSection[];
  unsubscribeUrl: string;
}

interface DigestEmailSection {
  topic: string;
  items: DigestEmailItem[];
}

interface DigestEmailItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  score: number;
}
```

### WelcomeEmail

Sends a welcome message to new subscribers with:
- Greeting
- Platform introduction
- Unsubscribe link

**Props:**
```typescript
interface WelcomeEmailProps {
  email: string;
  name?: string;
  unsubscribeUrl: string;
}
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `resend` | Email delivery API |
| `@react-email/components` | Email template components |
| `react` | React library |
| `react-dom` | React DOM |
| `@ai-digest/shared` | Shared types |

## Configuration

Email sending requires environment variables:
- `RESEND_API_KEY` - Resend API key (required)
- `RESEND_AUDIENCE_ID` - Audience ID for contact management (optional)

## Usage Example

```typescript
import { sendDigestNewsletter, sendWelcomeEmail } from '@ai-digest/email';

// Send digest to all subscribers
await sendDigestNewsletter(digest, subscribers);

// Send welcome email
await sendWelcomeEmail('user@example.com', 'John Doe');
```

## Error Handling

All sending functions handle errors gracefully:
- Log failed sends
- Continue on individual failures (batch sends)
- Return error details for debugging

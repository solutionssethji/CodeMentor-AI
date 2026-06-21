# CodeMentor AI - Web Frontend

This is the Next.js web application for CodeMentor AI, the world's most advanced AI-powered platform for teaching programming languages.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or whichever port Next.js assigns) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root of the `web-frontend` directory and add the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# AI Model Providers
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
MISTRAL_API_KEY=""
DEEPSEEK_API_KEY=""
XAI_API_KEY=""

# Payment Gateway
NEXT_PUBLIC_RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Database & Remote Config)
# CodeMentor-AI

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm hover:text-cyan-400 transition inline-block mb-10">← Back to Home</Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Privacy Policy
        </h1>
        
        <div className="prose prose-invert max-w-none text-slate-300 space-y-6">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          
          <p>
            Welcome to CodeMentor AI, a product by <strong>Sethji Solutions Private Limited</strong>. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect and process the following data when you register and use our platform:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Identity Data:</strong> First name and last name.</li>
            <li><strong>Contact Data:</strong> Email address.</li>
            <li><strong>Profile Data:</strong> Your chosen tech stack, experience level, preferences, and password.</li>
            <li><strong>Usage Data:</strong> Information about how you use our AI features, mock interviews, and code submissions.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">2. How We Use Your Data</h2>
          <p>We use your personal data in the following ways:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide personalized AI coding feedback and mentorship.</li>
            <li>To manage your account, including tracking your learning progress, completed challenges, and mock interviews.</li>
            <li>To securely authenticate you using Firebase Authentication.</li>
            <li>To communicate with you regarding your account, password resets, and platform updates.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">3. Third-Party Services</h2>
          <p>
            We use trusted third-party services to operate CodeMentor AI effectively:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Firebase (Google):</strong> We use Firebase Authentication to securely manage your login credentials and Firestore Database to store your profile and learning data.</li>
            <li><strong>AI Providers:</strong> Your code snippets and interview prompts are processed by our AI models (such as OpenAI) to provide real-time feedback.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">4. Data Retention and Deletion</h2>
          <p>
            We retain your personal data only for as long as necessary to fulfil the purposes we collected it for. If you choose to delete your account, your profile is marked for deletion and permanently erased from our databases within 30 days. You have the right to request immediate erasure of your personal data by contacting us.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">5. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorised way, altered, or disclosed.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us via our official website: <br />
            <a href="https://sethji-solutions.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
              https://sethji-solutions.vercel.app/
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Secured by{" "}
            <a href="https://sethji-solutions.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition">
              Sethji Solutions Private Limited
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

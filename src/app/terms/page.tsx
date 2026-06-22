import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm hover:text-cyan-400 transition inline-block mb-10">← Back to Home</Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Terms & Conditions
        </h1>
        
        <div className="prose prose-invert max-w-none text-slate-300 space-y-6">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          
          <p>
            These terms and conditions outline the rules and regulations for the use of CodeMentor AI, a product developed and operated by <strong>Sethji Solutions Private Limited</strong>.
          </p>
          <p>
            By accessing this website and using our AI mentorship tools, we assume you accept these terms and conditions. Do not continue to use CodeMentor AI if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">1. The Service</h2>
          <p>
            CodeMentor AI provides AI-powered programming assistance, code debugging, and mock interviews. The service is provided "as is" and we make no guarantees regarding the complete accuracy of the AI-generated responses. You should always verify critical code before deploying it to production environments.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">2. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service. You are responsible for safeguarding the password that you use to access the service.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">3. Acceptable Use</h2>
          <p>
            You agree not to use CodeMentor AI in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the service. You must not use the platform for any unlawful, illegal, fraudulent, or harmful purpose or activity, including attempting to abuse our AI models, bypassing rate limits, or reverse-engineering our systems.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">4. Intellectual Property Rights</h2>
          <p>
            Unless otherwise stated, Sethji Solutions Private Limited and/or its licensors own the intellectual property rights for all material on CodeMentor AI. All intellectual property rights are reserved. You may access this from CodeMentor AI for your own personal use subjected to restrictions set in these terms and conditions.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">5. Disclaimer</h2>
          <p>
            To the maximum extent permitted by applicable law, we exclude all representations, warranties, and conditions relating to our website and the use of this website. We will not be liable for any loss or damage of any nature, including data loss or coding errors resulting from the use of our AI suggestions.
          </p>

          <h2 className="text-2xl font-bold text-slate-100 mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us via our official website: <br />
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

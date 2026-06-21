import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <Link href="/" className="text-sm hover:text-cyan-400 transition inline-block mb-10">← Back to Home</Link>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Interactive Demo</h1>
        <p className="text-xl text-slate-400 mb-10">
          Experience the power of CodeMentor AI in this interactive video walkthrough.
        </p>
        
        <div className="aspect-video bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/codementor_demo.webp" 
            alt="CodeMentor AI Demo Walkthrough" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="mt-16 flex gap-4 justify-center">
          <Link href="/dashboard" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-bold shadow-lg shadow-indigo-500/30 transition">
            Try it yourself for free
          </Link>
        </div>
      </div>
    </div>
  );
}

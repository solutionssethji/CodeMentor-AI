"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/dashboard/courses", label: "My Courses" },
    { href: "/dashboard/history", label: "Course History" },
    { href: "/dashboard/challenges", label: "Daily Challenges" },
    { href: "/dashboard/ai-workspace", label: "AI Workspace" },
    { href: "/dashboard/interviews", label: "Mock Interviews" },
    { href: "/dashboard/profile", label: "Profile" },
    { href: "/dashboard/billing", label: "Package & Billing" },
    { href: "/dashboard/help", label: "Help & Support" },
  ];

  return (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`block px-4 py-2 rounded font-medium transition ${
              isActive 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      
      <div className="pt-4 mt-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 rounded hover:bg-slate-900 text-red-400 hover:text-red-300 font-medium transition"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}

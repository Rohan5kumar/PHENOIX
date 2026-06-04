"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Download, CheckCircle, ArrowRight, Activity, Shield, Zap } from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) setJoined(true);
    } catch {
      // Backend offline — silently ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <header className="px-6 py-6 border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-gray-950 font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              Φ
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">Project Phoenix</span>
          </div>
          <Link href="/dashboard" className="text-sm font-bold bg-white/10 hover:bg-white/20 transition-colors px-5 py-2.5 rounded-full flex items-center gap-2">
            Launch App <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-8 uppercase tracking-widest">
            <Activity className="w-4 h-4" /> Autonomous MLOps
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight leading-tight">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Self-Healing</span> Infrastructure.
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Zero downtime. Zero manual intervention. Project Phoenix automatically detects drift and heals your machine learning models in production.
          </p>

          <div className="max-w-xl mx-auto bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-sm shadow-2xl">
            {joined ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-emerald-500/20 p-3 rounded-full">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">You're on the list, Bhai!</h3>
                <p className="text-gray-400 mb-6">We'll notify you when beta access opens.</p>
                <a href="http://localhost:8000/waitlist/whitepaper" className="inline-flex items-center gap-2 bg-emerald-500 text-gray-950 font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Download className="w-5 h-5" /> Download Technical Whitepaper
                </a>
              </motion.div>
            ) : (
              <div className="p-6">
                <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    required
                    placeholder="Enter your best email..." 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex-1 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-lg"
                  />
                  <button 
                    disabled={loading}
                    className="bg-emerald-500 text-gray-950 font-bold px-8 py-4 rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-lg whitespace-nowrap shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  >
                    {loading ? <Activity className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Join Waitlist</>}
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-4 text-center">Join 1,000+ engineers waiting for early access.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 relative z-10">
          {[
            { icon: Shield, title: "Drift Protection", desc: "Real-time monitoring of statistical drift in production." },
            { icon: Activity, title: "Alchemist Engine", desc: "Synthesizes data to patch model vulnerabilities on the fly." },
            { icon: Zap, title: "Zero MTTR", desc: "Autonomous CI/CD loop requiring no human intervention." }
          ].map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md"
            >
              <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

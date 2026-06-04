"use client";

import { useEffect, useState } from "react";
import { CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/card";
import { motion } from "framer-motion";

export function BillingDashboard() {
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch("http://localhost:8000/billing/status");
        const data = await res.json();
        setBilling(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchBilling();
    const id = setInterval(fetchBilling, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-heading tracking-tight text-gray-900">Billing & Subscription</h2>
        <p className="text-gray-500 mt-2">Manage your Razorpay integration and Auto-Heal capacity.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <CreditCard className="w-32 h-32" />
          </div>
          <h3 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4">Current Plan</h3>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">{billing?.plan || "Loading..."}</span>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            Billed via Razorpay. Auto-Heal is locked on the Free tier.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {billing?.subscription_active ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Lock className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium text-gray-700">
                Auto-Heal capability
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-medium text-gray-700">Drift Detection</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-medium text-gray-700">Basic Analytics</span>
            </div>
          </div>

          <div className="mt-8">
            {!billing?.subscription_active ? (
              <button className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors shadow-md">
                Upgrade to Pro (Razorpay)
              </button>
            ) : (
              <button className="w-full bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Manage Subscription
              </button>
            )}
          </div>
        </Card>

        <Card className="glass-panel p-8 bg-gray-50 border-dashed">
            <h3 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-4">Webhook Testing</h3>
            <p className="text-sm text-gray-600 mb-6">
                For demonstration purposes, you can simulate a Razorpay webhook event below to lock/unlock your account.
            </p>

            <div className="space-y-3">
                <button 
                  onClick={() => fetch("http://localhost:8000/billing/webhook", {
                      method: "POST", 
                      body: JSON.stringify({ event: "subscription.charged" })
                  })}
                  className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2 px-4 rounded-md hover:bg-emerald-100 transition-colors"
                >
                    Simulate Payment Captured (Unlock)
                </button>
                <button 
                  onClick={() => fetch("http://localhost:8000/billing/webhook", {
                      method: "POST", 
                      body: JSON.stringify({ event: "subscription.halted" })
                  })}
                  className="w-full bg-red-50 text-red-700 border border-red-200 font-bold py-2 px-4 rounded-md hover:bg-red-100 transition-colors"
                >
                    Simulate Subscription Halted (Lock)
                </button>
            </div>
        </Card>
      </div>
    </div>
  );
}

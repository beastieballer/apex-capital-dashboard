"use client";
import AppShell from "@/components/AppShell";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
        <Settings size={24} className="text-amber-400" />
        Settings
      </h1>

      <div className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="section-title">Business Information</h2>
          <p className="text-sm text-slate-400 mb-4">
            Set these values in your <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-400 text-xs">.env.local</code> file.
          </p>
          <div className="space-y-3 text-sm">
            {[
              ["NEXT_PUBLIC_BUSINESS_NAME", "Business name on quotes"],
              ["NEXT_PUBLIC_BUSINESS_PHONE", "Phone number on quotes"],
              ["NEXT_PUBLIC_BUSINESS_EMAIL", "Email on quotes"],
              ["NEXT_PUBLIC_BUSINESS_ADDRESS", "Address on quotes"],
              ["NEXT_PUBLIC_BUSINESS_LICENSE", "License number on quotes"],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between items-start gap-4">
                <code className="text-amber-400 text-xs bg-slate-900 px-2 py-1 rounded">{key}</code>
                <span className="text-slate-400 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Zelle Info</h2>
          <p className="text-sm text-slate-400 mb-4">Configure in <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-400 text-xs">.env.local</code>:</p>
          <div className="space-y-3 text-sm">
            {[
              ["NEXT_PUBLIC_ZELLE_NAME", "Displayed name for Zelle"],
              ["NEXT_PUBLIC_ZELLE_PHONE", "Zelle phone number"],
              ["NEXT_PUBLIC_ZELLE_EMAIL", "Zelle email address"],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between items-start gap-4">
                <code className="text-amber-400 text-xs bg-slate-900 px-2 py-1 rounded">{key}</code>
                <span className="text-slate-400 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Stripe Payments</h2>
          <p className="text-sm text-slate-400 mb-4">Configure in <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-400 text-xs">.env.local</code>:</p>
          <div className="space-y-3 text-sm">
            {[
              ["STRIPE_SECRET_KEY", "Your Stripe secret key (sk_live_... or sk_test_...)"],
              ["STRIPE_PUBLISHABLE_KEY", "Your Stripe publishable key"],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between items-start gap-4">
                <code className="text-amber-400 text-xs bg-slate-900 px-2 py-1 rounded">{key}</code>
                <span className="text-slate-400 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">AI Window Analysis</h2>
          <p className="text-sm text-slate-400 mb-4">Requires an Anthropic API key:</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start gap-4">
              <code className="text-amber-400 text-xs bg-slate-900 px-2 py-1 rounded">ANTHROPIC_API_KEY</code>
              <span className="text-slate-400 text-xs">Get one at console.anthropic.com</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

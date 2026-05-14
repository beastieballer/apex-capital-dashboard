"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getJob, upsertJob } from "@/lib/store";
import type { Job, PaymentRecord } from "@/lib/types";
import { calcWindowSqFt } from "@/lib/cutsheet";
import AppShell from "@/components/AppShell";
import JobNav from "@/components/JobNav";
import { CreditCard, Smartphone, DollarSign, CheckCircle, Plus, Trash2, Copy } from "lucide-react";
import clsx from "clsx";

function PaymentContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeAmount, setStripeAmount] = useState("");
  const [zelleAmount, setZelleAmount] = useState("");
  const [zelleRef, setZelleRef] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashMethod, setCashMethod] = useState("cash");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setJob(getJob(id) ?? null); }, [id]);

  function patch(updates: Partial<Job>) {
    if (!job) return;
    const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
    upsertJob(updated);
    setJob(updated);
  }

  function recordPayment(method: PaymentRecord["method"], amount: number, reference?: string, notes?: string) {
    if (!job) return;
    const payment: PaymentRecord = { method, amount, date: new Date().toISOString(), reference, notes };
    const payments = [...job.payments, payment];
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    patch({ payments, status: paid >= totalDue ? "paid" : job.status });
  }

  async function launchStripe(amount: number) {
    setStripeLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: id, amount, description: job?.description }),
    });
    const { url, error } = await res.json();
    if (error) {
      alert("Stripe not configured. Add STRIPE_SECRET_KEY to .env.local");
      setStripeLoading(false);
      return;
    }
    window.location.href = url;
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  if (!job) return <p className="text-slate-400 pt-10 text-center">Job not found.</p>;

  const sqFt = calcWindowSqFt(job.windows);
  const materialCost = sqFt * job.pricePerSqFt;
  const laborCost = job.laborRate * job.laborHours;
  const subtotal = materialCost + laborCost - job.discount;
  const tax = subtotal * (job.taxRate / 100);
  const totalDue = subtotal + tax;
  const totalPaid = job.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, totalDue - totalPaid);

  const zellePhone = process.env.NEXT_PUBLIC_ZELLE_PHONE ?? "555-555-5555";
  const zelleEmail = process.env.NEXT_PUBLIC_ZELLE_EMAIL ?? "payments@profilm.com";
  const zelleName = process.env.NEXT_PUBLIC_ZELLE_NAME ?? "ProFilm Window Tinting";

  return (
    <>
      <div className="mb-2">
        <span className="font-mono text-amber-400 text-xs">{job.jobNumber}</span>
        <h1 className="text-lg font-bold text-slate-100">{job.customer.name || "Unnamed Job"}</h1>
      </div>

      <JobNav jobId={id} />

      {searchParams.get("success") && (
        <div className="mb-5 bg-green-900/30 border border-green-600 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-400" />
          <span className="text-green-300 text-sm font-medium">Card payment received via Stripe!</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Due", value: `$${totalDue.toFixed(2)}`, color: "text-slate-100" },
          { label: "Paid", value: `$${totalPaid.toFixed(2)}`, color: "text-green-400" },
          { label: "Balance", value: `$${balance.toFixed(2)}`, color: balance > 0 ? "text-amber-400" : "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-3">
            <div className={clsx("text-xl font-bold", color)}>{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stripe */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-900/50 border border-indigo-700 flex items-center justify-center">
              <CreditCard size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Credit / Debit Card</h2>
              <p className="text-xs text-slate-500">Secure checkout via Stripe</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Charge Amount ($)</label>
              <input className="input" type="number" min={0} step={0.01} placeholder={balance.toFixed(2)}
                value={stripeAmount} onChange={(e) => setStripeAmount(e.target.value)} />
            </div>
            <button
              onClick={() => launchStripe(Number(stripeAmount) || balance)}
              disabled={stripeLoading || balance <= 0}
              className="btn-primary w-full justify-center py-3">
              <CreditCard size={15} />
              {stripeLoading ? "Redirecting..." : `Pay $${(Number(stripeAmount) || balance).toFixed(2)} with Card`}
            </button>
            <p className="text-xs text-slate-600 text-center">SSL encrypted · No card data stored here</p>
          </div>
        </div>

        {/* Zelle */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-700 flex items-center justify-center">
              <Smartphone size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Zelle</h2>
              <p className="text-xs text-slate-500">Send via your bank app — instant transfer</p>
            </div>
          </div>

          {/* Zelle details card */}
          <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 rounded-xl p-4 border border-purple-800/30 mb-4">
            <div className="text-xs text-purple-400 uppercase tracking-wide mb-3 font-medium">Send payment to</div>
            <div className="space-y-2.5">
              {[
                { label: "Name", value: zelleName, key: "name" },
                { label: "Phone", value: zellePhone, key: "phone" },
                { label: "Email", value: zelleEmail, key: "email" },
              ].map(({ label, value, key }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 w-12">{label}</span>
                  <span className="font-mono text-slate-100 text-sm flex-1">{value}</span>
                  <button onClick={() => copy(value, key)}
                    className="text-slate-500 hover:text-amber-400 transition-colors shrink-0">
                    {copied === key ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-800/30">
                <span className="text-xs text-slate-400 w-12">Amount</span>
                <span className="font-bold text-green-400 text-xl">${balance > 0 ? balance.toFixed(2) : totalDue.toFixed(2)}</span>
                <button onClick={() => copy((balance > 0 ? balance : totalDue).toFixed(2), "amount")}
                  className="text-slate-500 hover:text-amber-400 transition-colors">
                  {copied === "amount" ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 w-12">Memo</span>
                <span className="text-slate-300 text-sm font-mono">{job.jobNumber}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="label">Record Received Zelle Payment</label>
            <div className="flex gap-2">
              <input className="input" type="number" placeholder="$0.00" value={zelleAmount}
                onChange={(e) => setZelleAmount(e.target.value)} />
              <input className="input" placeholder="Confirmation #" value={zelleRef}
                onChange={(e) => setZelleRef(e.target.value)} />
            </div>
            <button onClick={() => { if (!zelleAmount) return; recordPayment("zelle", Number(zelleAmount), zelleRef || undefined); setZelleAmount(""); setZelleRef(""); }}
              className="btn-secondary w-full justify-center">
              <Plus size={14} /> Record Zelle Payment
            </button>
          </div>
        </div>

        {/* Cash / Check */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-900/50 border border-green-700 flex items-center justify-center">
              <DollarSign size={18} className="text-green-400" />
            </div>
            <h2 className="font-semibold text-slate-100">Cash / Check</h2>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input className="input" type="number" placeholder="Amount" value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)} />
              <select className="input" value={cashMethod} onChange={(e) => setCashMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="cash">Money Order</option>
              </select>
            </div>
            <button onClick={() => { if (!cashAmount) return; recordPayment(cashMethod as "cash" | "check", Number(cashAmount)); setCashAmount(""); }}
              className="btn-secondary w-full justify-center">
              <Plus size={14} /> Record Payment
            </button>
          </div>
        </div>

        {/* Payment history */}
        <div className="card">
          <h2 className="section-title">Payment History</h2>
          {job.payments.length === 0 ? (
            <p className="text-slate-500 text-sm">No payments recorded.</p>
          ) : (
            <div className="space-y-2">
              {job.payments.map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-900 rounded-lg px-3 py-2.5 border border-slate-700">
                  <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center text-xs", {
                    "bg-indigo-900/50 text-indigo-400": p.method === "stripe",
                    "bg-purple-900/50 text-purple-400": p.method === "zelle",
                    "bg-green-900/50 text-green-400": p.method === "cash" || p.method === "check",
                  })}>
                    {p.method === "stripe" ? <CreditCard size={12} /> :
                     p.method === "zelle" ? <Smartphone size={12} /> : <DollarSign size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 capitalize">{p.method}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {new Date(p.date).toLocaleDateString()}{p.reference ? ` · ${p.reference}` : ""}
                    </div>
                  </div>
                  <div className="font-bold text-green-400">${p.amount.toFixed(2)}</div>
                  <button onClick={() => patch({ payments: job.payments.filter((_, j) => j !== i) })}
                    className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                <span className="text-slate-400">Total Paid</span>
                <span className="font-bold text-green-400">${totalPaid.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-slate-400">Loading...</p>}>
        <PaymentContent />
      </Suspense>
    </AppShell>
  );
}

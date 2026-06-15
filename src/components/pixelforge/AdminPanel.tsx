import { Building2, CheckCircle2, CreditCard, LockKeyhole, RefreshCcw, Save, ShieldCheck, UserCheck, UserMinus, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiAdminPaymentSettings, ApiAdminPaymentStatus, ApiManualPaymentRecord } from "@/lib/pixelforge-api";

type AdminPanelProps = {
  settings: ApiAdminPaymentSettings | null;
  status: ApiAdminPaymentStatus | null;
  manualPayments: ApiManualPaymentRecord[];
  isSaving: boolean;
  isLoadingPayments: boolean;
  onChange: (settings: ApiAdminPaymentSettings) => void;
  onSave: () => void;
  onRefreshPayments: () => void;
  onApprovePayment: (payment: ApiManualPaymentRecord) => void;
  onRejectPayment: (payment: ApiManualPaymentRecord) => void;
  onExtendSubscription: (payment: ApiManualPaymentRecord) => void;
  onDeactivateUser: (payment: ApiManualPaymentRecord) => void;
};

const AdminTextField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div>
    <Label className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">{label}</Label>
    <Input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 rounded-2xl border-violet-100 bg-white font-black text-slate-950" />
  </div>
);

const formatDate = (value: string | null) => {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const statusClass = (status: string) => {
  if (["APPROVED", "ACTIVE"].includes(status)) return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  if (["REJECTED", "DEACTIVATED"].includes(status)) return "bg-rose-100 text-rose-800 hover:bg-rose-100";
  return "bg-amber-100 text-amber-800 hover:bg-amber-100";
};

const AdminPanel = ({
  settings,
  status,
  manualPayments,
  isSaving,
  isLoadingPayments,
  onChange,
  onSave,
  onRefreshPayments,
  onApprovePayment,
  onRejectPayment,
  onExtendSubscription,
  onDeactivateUser,
}: AdminPanelProps) => {
  const pendingCount = manualPayments.filter((payment) => payment.adminVerificationStatus === "PENDING").length;

  return (
    <section className="mx-auto w-full max-w-[1560px] px-4 pb-8 sm:px-6 lg:px-8">
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="rounded-[2rem] border-white/80 bg-white/85 p-5 shadow-2xl shadow-violet-200/40 backdrop-blur-xl">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge className="mb-3 rounded-full border-0 bg-violet-600 px-3 py-1 text-white hover:bg-violet-600">
                  <LockKeyhole className="mr-1 h-3.5 w-3.5" /> Super Admin
                </Badge>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">Payment administration</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  Manage safe payment labels, manual beta activation, and owner-approved billing procedures. Secret keys and bank payout details stay outside the browser.
                </p>
              </div>
              <Button onClick={onSave} disabled={!settings || isSaving} className="rounded-2xl bg-violet-600 px-5 font-black text-white hover:bg-violet-700">
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save settings"}
              </Button>
            </div>
            {settings ? (
              <div className="grid gap-4 md:grid-cols-2">
                <AdminTextField label="Business name" value={settings.businessName} onChange={(value) => onChange({ ...settings, businessName: value })} />
                <AdminTextField label="Support email" value={settings.supportEmail} onChange={(value) => onChange({ ...settings, supportEmail: value })} />
                <AdminTextField label="Currency" value={settings.currency} onChange={(value) => onChange({ ...settings, currency: value.toUpperCase() })} />
                <AdminTextField label="Pro plan label" value={settings.proPlanLabel} onChange={(value) => onChange({ ...settings, proPlanLabel: value })} />
                <AdminTextField label="Studio plan label" value={settings.studioPlanLabel} onChange={(value) => onChange({ ...settings, studioPlanLabel: value })} />
                <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-4">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Owner access</Label>
                  <p className="mt-2 text-sm font-black text-slate-950">6nkumar.vnr@gmail.com</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">This login is treated as super admin and has unlimited generation credits.</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Payment note</Label>
                  <Textarea value={settings.paymentNote} onChange={(event) => onChange({ ...settings, paymentNote: event.target.value })} className="mt-2 min-h-28 rounded-[1.35rem] border-violet-100 bg-white font-semibold leading-6" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Manual UPI / bank procedure</Label>
                  <Textarea value={settings.bankTransferNote} onChange={(event) => onChange({ ...settings, bankTransferNote: event.target.value })} className="mt-2 min-h-28 rounded-[1.35rem] border-violet-100 bg-white font-semibold leading-6" />
                </div>
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-violet-200 bg-violet-50 p-6 text-center font-bold text-violet-700">Loading admin payment settings...</div>
            )}
          </Card>

          <Card className="rounded-[2rem] border-white/80 bg-white/85 p-5 shadow-2xl shadow-violet-200/40 backdrop-blur-xl">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge className="mb-3 rounded-full border-0 bg-amber-200 px-3 py-1 text-amber-950 hover:bg-amber-200">Manual Beta Payments</Badge>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Pending Payments</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Review receipts, approve users, reject unclear payments, extend subscriptions, or deactivate access.</p>
              </div>
              <Button onClick={onRefreshPayments} variant="outline" className="rounded-2xl border-violet-100 bg-white font-black text-violet-700 hover:bg-violet-50">
                <RefreshCcw className={`mr-2 h-4 w-4 ${isLoadingPayments ? "animate-spin" : ""}`} /> Pending Payments ({pendingCount})
              </Button>
            </div>
            <div className="space-y-3">
              {manualPayments.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">No manual payment submissions found yet.</div>
              ) : (
                manualPayments.map((payment) => (
                  <div key={payment.id} className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">{payment.customerEmail}</h3>
                          <Badge className={`rounded-full border-0 ${statusClass(payment.adminVerificationStatus)}`}>{payment.adminVerificationStatus}</Badge>
                          <Badge className="rounded-full border-0 bg-violet-100 text-violet-800 hover:bg-violet-100">{payment.selectedPlan}</Badge>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-600">{payment.amount ?? "Amount not set"} {payment.currency} · {payment.paymentMethod} · Ref: {payment.paymentReference || "not provided"}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Receipt: {payment.receiptFileName || payment.receiptFileUrl || "not uploaded"} · Submitted {formatDate(payment.createdAt)} · Valid until {formatDate(payment.validUntil)}</p>
                        {payment.rejectionReason && <p className="mt-2 text-sm font-bold text-rose-700">Reason: {payment.rejectionReason}</p>}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        <Button onClick={() => onApprovePayment(payment)} disabled={payment.adminVerificationStatus === "APPROVED"} className="rounded-2xl bg-emerald-600 font-black text-white hover:bg-emerald-700"><UserCheck className="mr-2 h-4 w-4" /> Approve User</Button>
                        <Button onClick={() => onRejectPayment(payment)} disabled={payment.adminVerificationStatus === "REJECTED"} variant="outline" className="rounded-2xl border-rose-100 bg-white font-black text-rose-700 hover:bg-rose-50"><UserX className="mr-2 h-4 w-4" /> Reject User</Button>
                        <Button onClick={() => onExtendSubscription(payment)} variant="outline" className="rounded-2xl border-violet-100 bg-white font-black text-violet-700 hover:bg-violet-50"><ShieldCheck className="mr-2 h-4 w-4" /> Extend Subscription</Button>
                        <Button onClick={() => onDeactivateUser(payment)} variant="outline" className="rounded-2xl border-slate-200 bg-white font-black text-slate-700 hover:bg-slate-50"><UserMinus className="mr-2 h-4 w-4" /> Deactivate User</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[2rem] border-white/80 bg-slate-950 p-5 text-white shadow-2xl shadow-violet-200/40">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><CreditCard className="h-5 w-5" /></div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Stripe readiness</p>
            <h3 className="mt-2 text-2xl font-black">Future payment setup</h3>
            <div className="mt-4 space-y-3">
              {[["Stripe secret key", status?.secretKeyConfigured], ["Pro price ID", status?.proPriceConfigured], ["Studio price ID", status?.studioPriceConfigured], ["Webhook secret", status?.webhookSecretConfigured]].map(([label, ready]) => (
                <div key={label as string} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-sm font-black">{label}</span>
                  <Badge className={`rounded-full border-0 ${ready ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-300" : "bg-amber-200 text-amber-950 hover:bg-amber-200"}`}>{ready ? "Ready" : "Later"}</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-[2rem] border-white/80 bg-white/85 p-5 shadow-xl shadow-violet-100/60 backdrop-blur">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Building2 className="h-5 w-5" /></div>
            <h3 className="text-xl font-black text-slate-950">Manual beta legal position</h3>
            <div className="mt-3 space-y-3 text-sm font-semibold leading-6 text-slate-600"><p>1. Personal bank / UPI / manual invoice can support small validation only.</p><p>2. Do not collect card details manually or publish private bank credentials in the repo.</p><p>3. Move to commercial account + Stripe before scaling public recurring billing.</p></div>
          </Card>
          <Card className="rounded-[2rem] border-white/80 bg-white/85 p-5 shadow-xl shadow-violet-100/60 backdrop-blur">
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" /><p className="text-sm font-semibold leading-6 text-slate-600">Every approval, rejection, extension, and deactivation is designed to create an admin audit record server-side.</p></div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;

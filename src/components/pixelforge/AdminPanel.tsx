import { Building2, CheckCircle2, CreditCard, LockKeyhole, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiAdminPaymentSettings, ApiAdminPaymentStatus } from "@/lib/pixelforge-api";

type AdminPanelProps = {
  settings: ApiAdminPaymentSettings | null;
  status: ApiAdminPaymentStatus | null;
  isSaving: boolean;
  onChange: (settings: ApiAdminPaymentSettings) => void;
  onSave: () => void;
};

const AdminTextField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div>
    <Label className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">{label}</Label>
    <Input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 rounded-2xl border-violet-100 bg-white font-black text-slate-950" />
  </div>
);

const AdminPanel = ({ settings, status, isSaving, onChange, onSave }: AdminPanelProps) => (
  <section className="mx-auto w-full max-w-[1560px] px-4 pb-8 sm:px-6 lg:px-8">
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card className="rounded-[2rem] border-white/80 bg-white/85 p-5 shadow-2xl shadow-violet-200/40 backdrop-blur-xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge className="mb-3 rounded-full border-0 bg-violet-600 px-3 py-1 text-white hover:bg-violet-600">
              <LockKeyhole className="mr-1 h-3.5 w-3.5" /> Super Admin
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Payment administration</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Manage safe payment labels and procedures shown to the team. Secret keys and bank payout details stay outside the browser.
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
              <Textarea
                value={settings.paymentNote}
                onChange={(event) => onChange({ ...settings, paymentNote: event.target.value })}
                className="mt-2 min-h-28 rounded-[1.35rem] border-violet-100 bg-white font-semibold leading-6"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Bank / payout procedure</Label>
              <Textarea
                value={settings.bankTransferNote}
                onChange={(event) => onChange({ ...settings, bankTransferNote: event.target.value })}
                className="mt-2 min-h-28 rounded-[1.35rem] border-violet-100 bg-white font-semibold leading-6"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-violet-200 bg-violet-50 p-6 text-center font-bold text-violet-700">Loading admin payment settings...</div>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="rounded-[2rem] border-white/80 bg-slate-950 p-5 text-white shadow-2xl shadow-violet-200/40">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Stripe readiness</p>
          <h3 className="mt-2 text-2xl font-black">Payment setup checklist</h3>
          <div className="mt-4 space-y-3">
            {[
              ["Stripe secret key", status?.secretKeyConfigured],
              ["Pro price ID", status?.proPriceConfigured],
              ["Studio price ID", status?.studioPriceConfigured],
              ["Webhook secret", status?.webhookSecretConfigured],
            ].map(([label, ready]) => (
              <div key={label as string} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm font-black">{label}</span>
                <Badge className={`rounded-full border-0 ${ready ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-300" : "bg-amber-200 text-amber-950 hover:bg-amber-200"}`}>
                  {ready ? "Ready" : "Needed"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[2rem] border-white/80 bg-white/85 p-5 shadow-xl shadow-violet-100/60 backdrop-blur">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-black text-slate-950">Bank account procedure</h3>
          <div className="mt-3 space-y-3 text-sm font-semibold leading-6 text-slate-600">
            <p>1. Open Stripe Dashboard → Settings → Business → Bank accounts and scheduling.</p>
            <p>2. Update payout bank account only after owner verification.</p>
            <p>3. Keep account numbers, tax IDs, and secret keys out of PixelForge chat or browser fields.</p>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-white/80 bg-white/85 p-5 shadow-xl shadow-violet-100/60 backdrop-blur">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold leading-6 text-slate-600">
              Credit limits are bypassed for the owner email only. All other users continue to use normal plan credits and billing rules.
            </p>
          </div>
        </Card>
      </div>
    </div>
  </section>
);

export default AdminPanel;

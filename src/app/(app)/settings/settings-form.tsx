'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '@/app/(auth)/actions';
import { COLOR_PRESETS, FONT_CSS, FONTS } from '@/lib/invoices/style';
import { MAX_LOGO_BYTES } from '@/lib/logo-limits';
import type { UserSettings } from '@/lib/settings';
import { changePasswordAction, removeLogoAction, saveSettingsAction, uploadLogoAction } from './actions';

const card = 'bg-white rounded-lg border border-[#C9D1C2] p-5 space-y-4';
const input =
  'w-full border border-[#BCC6B6] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5C42]/30';
const label = 'block font-mono text-[10px] font-bold text-[#5C6A5E] mb-1.5 uppercase tracking-[0.14em]';
const button =
  'px-4 py-2 rounded-md bg-[#0B5C42] text-[#F6F7F1] font-mono text-[13px] font-bold hover:bg-[#094B36] disabled:opacity-50';

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state.message) return <p className="text-sm text-[#0B5C42]">{state.message}</p>;
  return null;
}

const TEXT_FIELDS: { name: keyof UserSettings; label: string }[] = [
  { name: 'senderName', label: 'Sender name' },
  { name: 'senderTitle', label: 'Title / position' },
  { name: 'senderLocation', label: 'City / location' },
  { name: 'senderPhone', label: 'Phone' },
  { name: 'senderEmail', label: 'Email' },
  { name: 'bankName', label: 'Bank' },
  { name: 'accountNumber', label: 'Account number' },
  { name: 'accountHolder', label: 'Account holder' },
];

export function SettingsForm({ settings, logoVersion }: { settings: UserSettings; logoVersion: string | null }) {
  const [saveState, saveAction, saving] = useActionState(saveSettingsAction, {});
  const [logoState, logoAction, uploading] = useActionState(uploadLogoAction, {});
  const [removeState, removeAction] = useActionState(removeLogoAction, {});
  const [pwState, pwAction, changing] = useActionState(changePasswordAction, {});
  const [logoError, setLogoError] = useState<string | null>(null);
  const [font, setFont] = useState(settings.fontFamily);
  const [color, setColor] = useState(settings.primaryColor);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <form action={saveAction} className={card}>
        <h2 className="font-semibold text-[#19261F]">Invoice style & defaults</h2>
        <input type="hidden" name="fontFamily" value={font} />
        <input type="hidden" name="primaryColor" value={color} />
        <div>
          <p className={label}>PDF font</p>
          <div className="flex gap-2 flex-wrap">
            {FONTS.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setFont(f.value)}
                className="px-4 py-2 rounded-lg border-2 text-sm"
                style={{ fontFamily: FONT_CSS[f.value], borderColor: font === f.value ? '#0B5C42' : '#C9D1C2' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={label}>PDF color</p>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                type="button"
                key={c.value}
                title={c.label}
                onClick={() => setColor(c.value)}
                className="w-7 h-7 rounded-full"
                style={{ backgroundColor: c.value, outline: color === c.value ? `3px solid ${c.value}` : 'none', outlineOffset: 2 }}
              />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value.toUpperCase())} aria-label="Custom color" />
            <span className="text-xs font-mono text-[#8A9587]">{color}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {TEXT_FIELDS.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className={label}>{f.label}</label>
              <input id={f.name} name={f.name} defaultValue={String(settings[f.name] ?? '')} className={input} />
            </div>
          ))}
        </div>
        <Feedback state={saveState} />
        <button disabled={saving} className={button}>{saving ? 'SAVING…' : 'SAVE'}</button>
      </form>

      <div className={card}>
        <h2 className="font-semibold text-[#19261F]">Logo</h2>
        {logoVersion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/settings/logo?v=${logoVersion}`} alt="Current logo" className="h-12 object-contain" />
        ) : (
          <p className="text-sm text-[#5C6A5E]">No logo yet.</p>
        )}
        <form
          action={logoAction}
          // Server actions reject bodies over 1 MB before our code runs, so check size here first.
          onSubmit={(e) => {
            const file = (e.currentTarget.elements.namedItem('logo') as HTMLInputElement).files?.[0];
            if (file && file.size > MAX_LOGO_BYTES) {
              e.preventDefault();
              setLogoError('Logo must be 500 KB or smaller.');
            } else {
              setLogoError(null);
            }
          }}
          className="flex items-center gap-3 flex-wrap"
        >
          <input type="file" name="logo" accept="image/png,image/jpeg" className="text-sm" />
          <button disabled={uploading} className={button}>{uploading ? 'UPLOADING…' : 'UPLOAD'}</button>
        </form>
        <p className="text-xs text-[#8A9587]">PNG or JPEG, max 500 KB. Existing invoices keep their old logo.</p>
        {logoError ? <p className="text-sm text-red-700">{logoError}</p> : <Feedback state={logoState} />}
        {logoVersion && (
          <form action={removeAction}>
            <button className="text-sm text-[#5C6A5E] hover:text-red-700">Remove logo</button>
            <Feedback state={removeState} />
          </form>
        )}
      </div>

      <form action={pwAction} className={card}>
        <h2 className="font-semibold text-[#19261F]">Change password</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="currentPassword" className={label}>Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className={input} />
          </div>
          <div>
            <label htmlFor="newPassword" className={label}>New password</label>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required className={input} />
          </div>
        </div>
        <Feedback state={pwState} />
        <button disabled={changing} className={button}>{changing ? 'SAVING…' : 'CHANGE PASSWORD'}</button>
      </form>
    </main>
  );
}

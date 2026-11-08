// Automated checks for Newperson.
//  1. Bundles App.js with esbuild (react-native replaced by light stubs).
//  2. Unit-tests the pure logic (phone, dates, duplicates, validation, CSV, backup).
//  3. Renders every screen in all 3 languages with react-dom/server to catch runtime errors.
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(here, '.build', 'app.cjs');
mkdirSync(path.dirname(out), { recursive: true });

const esbuild = process.env.ESBUILD || 'npx --yes esbuild@0.24.0';
execSync([
  esbuild, JSON.stringify(path.join(root, 'App.js')),
  '--bundle', '--platform=node', '--format=cjs', '--loader:.js=jsx', '--log-level=warning',
  '--alias:react-native=' + path.join(here, 'stubs/react-native.js'),
  '--alias:@react-native-async-storage/async-storage=' + path.join(here, 'stubs/async-storage.js'),
  '--alias:@expo/vector-icons=' + path.join(here, 'stubs/vector-icons.js'),
  '--external:react', '--external:react-dom',
  '--outfile=' + JSON.stringify(out),
].join(' '), { stdio: 'inherit', cwd: root });

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const App = require(out);
const RN = require(path.join(here, 'stubs/react-native.js'));

let pass = 0; let fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};
const eq = (name, a, b) => ok(name, JSON.stringify(a) === JSON.stringify(b), { got: a, want: b });

/* ── phone ── */
eq('normalize +66', App.normalizePhone('+66 81-234-5678'), '0812345678');
eq('normalize 0066', App.normalizePhone('0066812345678'), '0812345678');
eq('normalize +95', App.normalizePhone('+95 9 123 456 789'), '09123456789');
eq('normalize spaces', App.normalizePhone(' 089 123 4567 '), '0891234567');
ok('TH valid 08', App.isValidPhone('0812345678', 'TH'));
ok('TH valid 06', App.isValidPhone('0612345678', 'TH'));
ok('TH valid 09', App.isValidPhone('0912345678', 'TH'));
ok('TH reject 9 digits', !App.isValidPhone('081234567', 'TH'));
ok('TH reject 11 digits', !App.isValidPhone('08123456789', 'TH'));
ok('TH reject landline 02', !App.isValidPhone('0212345678', 'TH'));
ok('MM valid 11', App.isValidPhone('09123456789', 'MM'));
ok('MM valid 9', App.isValidPhone('091234567', 'MM'));
ok('MM reject 08', !App.isValidPhone('08123456789', 'MM'));
eq('format TH', App.formatPhone('0812345678', 'TH'), '081-234-5678');
eq('format MM', App.formatPhone('09123456789', 'MM'), '09 123 456 789');
eq('tel TH', App.telUri('0812345678', 'TH'), 'tel:0812345678');
eq('tel MM', App.telUri('09123456789', 'MM'), 'tel:+959123456789');

/* ── dates ── */
eq('mask 8 digits', App.maskDate('01022000'), '01/02/2000');
eq('mask partial', App.maskDate('0102'), '01/02');
eq('mask strips junk', App.maskDate('01-02-2000x'), '01/02/2000');
ok('parse valid', !!App.parseDate('29/02/2024'));
ok('parse invalid leap', App.parseDate('29/02/2023') === null);
ok('parse invalid month', App.parseDate('01/13/2020') === null);
ok('parse junk', App.parseDate('abc') === null);
eq('buddhist year → gregorian', App.normalizeDate('15/06/2567'), '15/06/2024');
const now = new Date(2026, 10, 5);
eq('age before birthday', App.ageFrom('10/11/2000', now), 25);
eq('age after birthday', App.ageFrom('01/11/2000', now), 26);
eq('days until +10', App.daysUntil('15/11/2026', now), 10);
eq('days until -1', App.daysUntil('04/11/2026', now), -1);

/* ── validation ── */
const S = { ...App.__screens.DEFAULT_SETTINGS, required: { dob: true, docNo: true } };
const base = (o) => ({ ...App.__screens.emptyPerson(S), ...o });
const existing = [base({ id: 'a1', nameMm: 'မောင်မောင်', phone: '0812345678', docNo: 'MA123456', updatedAt: '2026-01-01' })];
const good = base({ nameMm: 'အေးအေး', phone: '089 111 2222', phoneConfirm: '0891112222', dob: '01/01/2000', docNo: 'MB999' });
eq('valid person passes', App.validatePerson(good, existing, S), {});
let e = App.validatePerson(base({}), existing, S);
ok('empty → name/phone/dob/doc required', e.nameMm && e.phone && e.dob && e.docNo, e);
e = App.validatePerson({ ...good, phoneConfirm: '0891112223' }, existing, S);
eq('confirm mismatch', e.phoneConfirm && e.phoneConfirm[0], 'phoneMismatch');
e = App.validatePerson({ ...good, phone: '+66812345678', phoneConfirm: '0812345678' }, existing, S);
eq('duplicate phone detected', e.phone && e.phone[0], 'dupPhone');
e = App.validatePerson({ ...good, docNo: 'ma123456' }, existing, S);
eq('duplicate doc (case-insensitive)', e.docNo && e.docNo[0], 'dupDoc');
e = App.validatePerson({ ...existing[0], phoneConfirm: '' }, existing, S, '0812345678');
ok('editing self: no dup + no confirm needed (only dob missing)', !e.phone && !e.phoneConfirm && !e.docNo, e);
e = App.validatePerson({ ...good, phone2: '0891112222' }, existing, S);
eq('phone2 same as phone', e.phone2 && e.phone2[0], 'dupPhone');
e = App.validatePerson({ ...good, dob: '31/02/2000' }, existing, S);
eq('bad date', e.dob && e.dob[0], 'badDate');
e = App.validatePerson({ ...good, fee: '12a' }, existing, S);
eq('bad fee', e.fee && e.fee[0], 'badFee');
e = App.validatePerson({ ...good, phoneCc: 'MM', phone: '0812345678', phoneConfirm: '0812345678' }, existing, S);
eq('MM rule on TH number', e.phone && e.phone[0], 'badPhoneMM');
e = App.validatePerson({ ...good, emPhone: '123', emPhoneCc: 'MM' }, existing, S);
eq('bad emergency phone', e.emPhone && e.emPhone[0], 'badPhoneMM');

/* ── alerts ── */
const al = App.personAlerts(base({ docExpiry: '20/11/2026', phoneVerified: false, status: 'started', fee: '500' }), { expiryDays: 60, feeTracking: true }, now);
eq('alerts', al.map((a) => a.type), ['expiry', 'phone', 'fee']);
eq('no alerts for left', App.personAlerts(base({ status: 'left', docExpiry: '01/01/2020' }), S, now), []);

/* ── csv / backup / pin ── */
const csv = App.toCsv([base({ nameMm: 'A, "B"', phone: '0812345678', notes: 'line1\nline2' })]);
ok('csv BOM', csv.charCodeAt(0) === 0xFEFF);
ok('csv escapes quotes', csv.includes('"A, ""B"""'));
ok('csv multiline quoted', csv.includes('"line1\nline2"'));
const merged = App.mergeBackup(existing, [{ ...existing[0], nameMm: 'new', updatedAt: '2026-02-01' }, { id: 'b2', nameMm: 'x', phone: '0899999999' }]);
ok('backup merge newer wins', merged && merged.people.find((p) => p.id === 'a1').nameMm === 'new' && merged.people.length === 2, merged);
ok('backup rejects garbage', App.mergeBackup(existing, [{ foo: 1 }]) === null && App.mergeBackup(existing, 'x') === null);
ok('pin hash stable & distinct', App.hashPin('1234') === App.hashPin('1234') && App.hashPin('1234') !== App.hashPin('1235'));

/* ── attendance ── */
eq('dayKey pads', App.dayKey(new Date(2026, 0, 5)), '2026-01-05');
eq('keyToDate roundtrip', App.dayKey(App.keyToDate('2026-11-08')), '2026-11-08');
let A = {};
A = App.setMark(A, '2026-11-08', 'p1', 'work');
A = App.setMark(A, '2026-11-08', 'p2', 'absent', '  sick kid ');
A = App.setMark(A, '2026-11-07', 'p1', 'off');
eq('setMark stores code', A['2026-11-08'].p1.c, 'work');
eq('setMark trims note', A['2026-11-08'].p2.n, 'sick kid');
eq('day counts', App.attDayCounts(A, '2026-11-08', ['p1', 'p2', 'p3']), { counts: { work: 1, absent: 1 }, none: 1 });
eq('month counts', App.attMonthCounts(A, 'p1', 2026, 10), { work: 1, off: 1 });
let B = App.setMark(A, '2026-11-07', 'p1', null);
ok('clearing last mark removes the day', !B['2026-11-07'] && A['2026-11-07'], B);
ok('setMark is immutable', A['2026-11-07'].p1.c === 'off');
const AS = { ...App.__screens.DEFAULT_SETTINGS, attOff: ['late'], attCustom: [{ id: 'c_x', label: 'OT', color: '#fff' }] };
eq('types respect off + custom', App.attTypes(AS).map((x) => x.id), ['work', 'off', 'absent', 'leave', 'sick', 'c_x']);
eq('types include off when asked', App.attTypes(AS, true).length, 7);
eq('custom label', App.attLabel(App.attFind(AS, 'c_x'), (k) => k), 'OT');
eq('merge att', App.mergeAtt({ '2026-11-01': { a: { c: 'work' } } }, { '2026-11-01': { b: { c: 'off' } }, junk: 1, '2026-11-02': { a: { c: 'sick' } } }),
  { '2026-11-01': { a: { c: 'work' }, b: { c: 'off' } }, '2026-11-02': { a: { c: 'sick' } } });
eq('merge att ignores garbage', App.mergeAtt({ x: 1 }, 'nope'), { x: 1 });

/* ── render every screen in every language ── */
const { HomeScreen, ListScreen, PersonForm, DetailScreen, AdminScreen, Onboarding, Splash } = App.__screens;
const people = [
  base({ id: 'p1', nameMm: 'မောင်မောင်', nameEn: 'MAUNG MAUNG', phone: '0812345678', status: 'started', startDate: '01/11/2026', dob: '01/01/2000', docExpiry: '20/11/2026', fee: '500', dept: 'QC', history: [{ status: 'started', at: '2026-11-01T02:00:00Z' }], createdAt: '2026-11-01T02:00:00Z', updatedAt: '2026-11-01T02:00:00Z' }),
  base({ id: 'p2', nameMm: 'အေးအေး', phone: '0891112222', phoneVerified: true, status: 'lead', emName: 'Mom', emPhone: '09123456789', notes: 'hi', history: [], createdAt: '2026-11-02T02:00:00Z', updatedAt: '2026-11-02T02:00:00Z' }),
];
const noop = () => {};
const today = App.dayKey(new Date());
let att = App.setMark({}, today, 'p1', 'leave', 'wedding');
const gr = { current: null };
for (const lang of ['my', 'th', 'en']) {
  const t = (k, p) => { let s = (App.__screens.T[lang][k] ?? App.__screens.T.en[k] ?? k); if (p) for (const x in p) s = s.split('{' + x + '}').join(p[x]); return s; };
  const settings = { ...App.__screens.DEFAULT_SETTINGS, lang, onboarded: true, factoryName: 'ABC', recruiterName: 'Kyaw', pinHash: App.hashPin('1234') };
  const cases = {
    splash: [Splash, {}],
    onboarding: [Onboarding, { settings, onDone: noop }],
    homeEmpty: [HomeScreen, { people: [], settings, t, go: noop, reduce: true }],
    home: [HomeScreen, { people, settings, t, go: noop, reduce: true }],
    homeAtt: [HomeScreen, { people, settings, t, go: noop, reduce: true, att }],
    attendEmpty: [App.__screens.AttendanceScreen, { people: [], att: {}, settings, t, onMark: noop, onBulk: noop, notify: noop }],
    attend: [App.__screens.AttendanceScreen, { people, att, settings: { ...settings, attCustom: [{ id: 'c_1', label: 'OT', color: '#fff' }] }, t, onMark: noop, onBulk: noop, notify: noop }],
    quickSheet: [App.__screens.QuickStatusSheet, { person: people[0], t, onPick: noop, onClose: noop }],
    detailAtt: [DetailScreen, { person: people[0], settings, t, back: noop, onEdit: noop, onDelete: noop, onPatch: noop, notify: noop, att, onMark: noop }],
    listEmpty: [ListScreen, { people: [], settings, t, go: noop, params: {} }],
    list: [ListScreen, { people, settings, t, go: noop, params: { alert: 'phone' } }],
    formNew: [PersonForm, { initial: null, people, settings, t, onSave: async () => true, onCancel: noop, guardRef: gr, notify: noop }],
    formEdit: [PersonForm, { initial: people[0], people, settings, t, onSave: async () => true, onCancel: noop, guardRef: gr, notify: noop }],
    detail: [DetailScreen, { person: people[0], settings, t, back: noop, onEdit: noop, onDelete: noop, onPatch: noop, notify: noop }],
    detail2: [DetailScreen, { person: people[1], settings, t, back: noop, onEdit: noop, onDelete: noop, onPatch: noop, notify: noop }],
    detailMissing: [DetailScreen, { person: undefined, settings, t, back: noop, onEdit: noop, onDelete: noop, onPatch: noop, notify: noop }],
    adminLocked: [AdminScreen, { settings, setSettings: noop, people, setPeopleAll: noop, log: [], addLog: noop, t, notify: noop, unlocked: false, setUnlocked: noop, lang, setLang: noop }],
    adminOpen: [AdminScreen, { settings, setSettings: noop, people, setPeopleAll: noop, log: [{ text: 'x', at: '2026-11-01T00:00:00Z' }], addLog: noop, t, notify: noop, unlocked: true, setUnlocked: noop, lang, setLang: noop, att, setAttAll: noop }],
  };
  for (const [name, [Comp, props]] of Object.entries(cases)) {
    try {
      const html = renderToStaticMarkup(React.createElement(Comp, props));
      ok(`render ${lang}/${name}`, html.length > 50, html.length);
      ok(`no missing translation ${lang}/${name}`, !/>(st_|dt_|att_|att[A-Z])[A-Za-z]*</.test(html), (html.match(/>(st_|dt_|att_|att[A-Z])[A-Za-z]*</) || [])[0]);
    } catch (err) { ok(`render ${lang}/${name}`, false, String(err && err.stack || err).slice(0, 400)); }
  }
}
// attendance report + CSV in every language
for (const lang of ['my', 'th', 'en']) {
  const t = (k, p) => { let s = (App.__screens.T[lang][k] ?? k); if (p) for (const x in p) s = s.split('{' + x + '}').join(p[x]); return s; };
  const settings = { ...App.__screens.DEFAULT_SETTINGS, factoryName: 'ABC' };
  const rep = App.attReportText(att, today, people, settings, t);
  ok(`report ${lang} lists leave with note`, rep.includes(t('att_leave') + ' (1)') && rep.includes('wedding'), rep);
  const d = new Date();
  const csv = App.attMonthCsv(att, people, d.getFullYear(), d.getMonth(), settings, t);
  ok(`att csv ${lang} has started person + leave`, csv.charCodeAt(0) === 0xFEFF && csv.includes('MAUNG') === false && csv.includes('မောင်မောင်') && csv.includes('wedding'), csv.slice(0, 300));
}
// App root renders (splash state first)
try { ok('render App root', renderToStaticMarkup(React.createElement(App.default)).includes('NEW·PERSON')); } catch (err) { ok('render App root', false, String(err)); }

// Every translation key exists in all languages
const keys = new Set([...Object.keys(App.__screens.T.my), ...Object.keys(App.__screens.T.th), ...Object.keys(App.__screens.T.en)]);
for (const k of keys) for (const l of ['my', 'th', 'en']) ok(`i18n ${l}.${k}`, App.__screens.T[l][k] != null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

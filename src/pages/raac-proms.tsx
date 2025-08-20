import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, Upload, Eye, ClipboardList, PlayCircle, FileDown, Loader2, Users, Mail, Calendar, BarChart3, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Head from 'next/head';

/**
 * RAAC PROMs – Patients, Oxford & WOMAC, Rappels email, Portail patient, Statistiques
 * (MVP FRONT-END – prêt pour branchement SMTP/API côté serveur)
 *
 * Nouveautés :
 *  - J+2 post‑op inclus
 *  - Commentaire patient par timepoint (visible admins)
 *  - Modèles d'e-mail personnalisables (+ aperçu)
 *  - Export de fichiers .ics pour les rappels calendrier
 *  - Filtre par articulation (hanche/genou) dans les statistiques
 *
 * Correctifs (debug) :
 *  - Regex de csvEscape corrigée (/[["\\n,]/) → évite "Unterminated regular expression"
 *  - Sauts de ligne normalisés ("\n" et CRLF pour ICS)
 *  - downloadICSFor: utilise settings.orgName au lieu d'une variable "state" hors portée
 *  - Affichage des variables de template en Settings sécurisé (pas d'évaluation JSX accidentelle)
 *  - Auto‑tests utilitaires (console) + cas supplémentaires
 *
 * 🔵 Intégration charte PCBS
 *  - Couleur primaire #004D71
 *  - Police Quicksand (Google Fonts)
 *  - Logo d'en‑tête (icône PCBS)
 */

const LOGO_URL = "/POLYCLINIQUE-COTE-BASQUE-SUD-ICONE.png"; // placer ce fichier dans public/

// -------------------- Constantes & utilitaires --------------------
const STORAGE_KEY = "raac_proms_v3";
const TIMEPOINTS = [
  { id: "preop", label: "Pré‑opératoire", offsetDays: -7 },
  { id: "d2", label: "J+2", offsetDays: 2 },
  { id: "m1", label: "1 mois", offsetDays: 30 },
  { id: "m6", label: "6 mois", offsetDays: 180 },
  { id: "y1", label: "1 an", offsetDays: 365 },
];

function uid() { return Math.random().toString(36).slice(2, 9); }
function save(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }
function load() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function downloadFile(name: string, content: string, mime = "application/json") { 
  const blob = new Blob([content], { type: mime }); 
  const url = URL.createObjectURL(blob); 
  const a = document.createElement("a"); 
  a.href = url; 
  a.download = name; 
  document.body.appendChild(a); 
  a.click(); 
  a.remove(); 
  URL.revokeObjectURL(url); 
}

// FIX: regex correctement terminée + échappement des quotes
function csvEscape(v: any): string {
  if (v == null) return "";
  const s = Array.isArray(v) ? v.join("|") : String(v);
  return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function addDays(iso: string, d: number): string{ 
  const dt = new Date(iso); 
  dt.setDate(dt.getDate()+d); 
  return dt.toISOString().slice(0,10); 
}

function fmtDate(iso: string): string{ 
  if(!iso) return "—"; 
  return new Date(iso+"T00:00:00").toLocaleDateString(); 
}

function todayISO(): string{ 
  return new Date().toISOString().slice(0,10); 
}

// Petit moteur de template: {{var}} + {{#if var}}...{{/if}}
function simpleVars(tpl: string, vars: Record<string, any>): string{
  let out = String(tpl || "");
  // blocs conditionnels
  out = out.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, inner) => {
    const v = vars[key];
    return v ? inner : "";
  });
  // remplacements simples
  for (const [k, v] of Object.entries(vars)){
    out = out.split("{{"+k+"}}").join(v ?? "");
  }
  return out;
}

// ---- Modèles d'e-mail & helpers ----
const DEFAULT_EMAIL_SUBJECT = 'Votre questionnaire {{tpLabel}} – {{orgName}}';
const DEFAULT_EMAIL_TEMPLATE = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5">
    <div style="margin-bottom:12px">
      {{#if logoUrl}}<img src="{{logoUrl}}" alt="{{orgName}}" style="max-height:48px;vertical-align:middle"/>{{/if}}
      <h2 style="margin:8px 0 0 0;font-size:18px">{{orgName}}</h2>
    </div>
    <p>Bonjour {{patientFirst}} {{patientLast}},</p>
    <p>Merci de compléter votre questionnaire (<strong>{{tpLabel}}</strong>) :</p>
    <p><a href="{{portalURL}}">Accéder à mon espace</a></p>
    <p>Échéance : <strong>{{dueDate}}</strong></p>
    <p>Cordialement,<br>{{orgName}}</p>
    <p style="font-size:12px;color:#666">Message automatique – ne pas répondre.</p>
  </div>`;

function buildEmail(state: any, patient: any, tp: any, dueISO: string){
  const portalURL = makePortalURL(patient);
  const vars = {
    orgName: state.settings.orgName || 'Clinique',
    logoUrl: state.settings.logoUrl || '',
    patientFirst: patient.prenom || '',
    patientLast: patient.nom || '',
    tpLabel: tp.label,
    portalURL,
    dueDate: fmtDate(dueISO),
  };
  const subjectTpl = state.settings.emailSubjectTemplate || DEFAULT_EMAIL_SUBJECT;
  const htmlTpl = state.settings.emailTemplate || DEFAULT_EMAIL_TEMPLATE;
  const subject = simpleVars(subjectTpl, vars);
  const text = 'Bonjour '+vars.patientFirst+' '+vars.patientLast+',\n\n'
    + 'Merci de compléter votre questionnaire ('+vars.tpLabel+') :\n'
    + vars.portalURL + '\n\n'
    + 'Échéance : ' + vars.dueDate + '\n\n'
    + vars.orgName;
  const html = simpleVars(htmlTpl, vars);
  return { subject, html, text, portalURL };
}

function toICSDate(isoDate: string, time: string): string{ 
  const parts = (isoDate||'').split('-'); 
  const y=parts[0]||'0000', m=parts[1]||'01', d=parts[2]||'01'; 
  const hm = (time||'09:00').split(':'); 
  const hh=hm[0]||'09', mm=hm[1]||'00'; 
  return y+m+d+'T'+hh+mm+'00'; 
}

function downloadICSFor(patient: any, tp: any, dueISO: string, settings: any){
  const dt = new Date();
  const pad = (n: number)=> String(n).padStart(2,'0');
  const dtstamp = dt.getUTCFullYear()+pad(dt.getUTCMonth()+1)+pad(dt.getUTCDate())+'T'+pad(dt.getUTCHours())+pad(dt.getUTCMinutes())+pad(dt.getUTCSeconds())+'Z';
  const dtstart = toICSDate(dueISO, settings.defaultHour || '09:00');
  const dtend = toICSDate(dueISO, '09:30');
  const org = settings?.orgName || 'Clinique';
  const summary = 'Rappel questionnaire '+tp.label+' – '+org;
  const description = 'Merci de compléter votre questionnaire : '+makePortalURL(patient);
  const uidStr = patient.id+'-'+tp.id+'-'+dueISO+'@raac-proms';
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RAAC PROMs//FR','BEGIN:VEVENT',
    'UID:'+uidStr,'DTSTAMP:'+dtstamp,'DTSTART:'+dtstart,'DTEND:'+dtend,
    'SUMMARY:'+summary,'DESCRIPTION:'+description,'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  downloadFile('rappel_'+tp.id+'_'+patient.nom+'_'+patient.prenom+'.ics', ics, 'text/calendar;charset=utf-8');
}

// -------------------- Auto‑tests utilitaires --------------------
function runSelfTests(){
  const tests: any[] = [];
  const eq = (name: string, a: any, b: any)=> tests.push({ name, ok: a===b, a, b });
  // csvEscape
  eq('csv no escape', csvEscape('abc'), 'abc');
  eq('csv with comma', csvEscape('a,b'), '"a,b"');
  eq('csv with quote', csvEscape('a"b'), '"a""b"');
  eq('csv with newline', csvEscape('a\nb'), '"a\nb"');
  eq('csv array join', csvEscape(['a','b']), 'a|b');
  // toICSDate
  eq('ics date', toICSDate('2025-08-19','09:00'), '20250819T090000');
  // simpleVars
  const tpl = 'Hello {{name}} {{#if extra}}X{{/if}}';
  eq('template basic', simpleVars(tpl, {name:'J', extra:''}), 'Hello J ');
  eq('template if', simpleVars(tpl, {name:'J', extra:'yes'}), 'Hello J X');
  // Résumé
  const ok = tests.filter(t=>t.ok).length;
  if (ok !== tests.length){
    console.warn('[TESTS] ÉCHECS:', tests.filter(t=>!t.ok));
  } else {
    console.log('[TESTS] OK', tests.length, 'tests');
  }
}

// -------------------- Instruments --------------------
const OXFORD_ITEMS = [
  "Courses / achats","Douleurs nocturnes","Monter/descendre escalier","S'asseoir puis se relever",
  "Boiterie","Se retourner dans le lit","S'habiller (chaussettes/chaussures)","Se laver (bain/douche)",
  "Rester debout longtemps","Marcher sur terrain irrégulier","Entrer/sortir d'un véhicule","Impact sur la vie quotidienne",
];
const OXFORD_OPTIONS = [ 
  { label: "Meilleur", value: 4 },
  { label: "Bon", value: 3 },
  { label: "Moyen", value: 2 },
  { label: "Difficile", value: 1 },
  { label: "Impossible / Très gêné", value: 0 } 
];
const WOMAC_SECTIONS = [
  { key: "douleur", label: "Douleur (5)", items: ["Marche sur plat","Escaliers","Nuit","Assis/allongé","Debout"]},
  { key: "raideur", label: "Raideur (2)", items: ["Raideur au réveil","Raideur après immobilité"]},
  { key: "fonction", label: "Fonction (17)", items: [
    "Descendre escalier","Monter escalier","Se lever d'une chaise","Se tenir debout","Se pencher en avant",
    "Marcher sur plat","Monter/descendre d'un véhicule","Faire les courses","Mettre chaussettes/bas","Se lever du lit",
    "Se coucher dans le lit","Se sécher","Aller aux toilettes","Tenue debout sans aide","Entrer/sortir bain/douche",
    "S'habiller","Tâches domestiques légères"
  ]}
];
const WOMAC_OPTIONS = [0,1,2,3,4];

// -------------------- App --------------------
export default function RaacPromsApp() {
  const [view, setView] = useState("patients"); // patients | collect | stats | settings | portal
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState(() => load() || {
    patients: [], // {id, nom, prenom, naissance, articulation, email, opDate, token}
    measures: [], // {id, patientId, timepoint, dateISO, oxford:{}, womac:{}, comment, scores:{oxford,womac}}
    settings: { 
      orgName: "Polyclinique Côte Basque Sud", 
      senderEmail: "", 
      apiEndpoint: "/.netlify/functions/send-email", 
      apiKey: "", 
      logoUrl: LOGO_URL, 
      defaultHour: "09:00", 
      emailSubjectTemplate: DEFAULT_EMAIL_SUBJECT, 
      emailTemplate: DEFAULT_EMAIL_TEMPLATE 
    },
  });

  useEffect(()=>{ 
    setSaving(true); 
    const id=setTimeout(()=>{ save(state); setSaving(false); },300); 
    return ()=>clearTimeout(id); 
  },[state]);

  useEffect(()=>{ 
    const url = new URL(window.location.href); 
    const pid=url.searchParams.get("patient"); 
    const tok=url.searchParams.get("token"); 
    if(pid && tok) setView("portal"); 
  },[]);

  useEffect(()=>{ runSelfTests(); }, []);

  return (
    <>
      <Head>
        <title>RAAC PROMs - Suivi Patient</title>
        <meta name="description" content="Système de suivi des PROMs (Patient Reported Outcome Measures) pour la chirurgie orthopédique" />
      </Head>
      
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <img 
                src={state.settings.logoUrl || LOGO_URL} 
                onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} 
                alt="Polyclinique Côte Basque Sud" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="text-xl font-semibold text-pcbs">RAAC – Suivi PROMs</h1>
                <p className="text-xs text-neutral-500">Oxford • WOMAC • Pré‑op / J+2 / 1m / 6m / 1a</p>
              </div>
            </div>
            <nav className="flex gap-3 text-sm">
              <button onClick={()=>setView("patients")} className={view==="patients"?"font-semibold text-pcbs":""}><Users className="inline mr-1" size={16}/>Patients</button>
              <button onClick={()=>setView("collect")} className={view==="collect"?"font-semibold text-pcbs":""}><PlayCircle className="inline mr-1" size={16}/>Collecte</button>
              <button onClick={()=>setView("stats")} className={view==="stats"?"font-semibold text-pcbs":""}><BarChart3 className="inline mr-1" size={16}/>Statistiques</button>
              <button onClick={()=>setView("settings")} className={view==="settings"?"font-semibold text-pcbs":""}><Mail className="inline mr-1" size={16}/>Réglages</button>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl p-4">
          {view==="patients" && <Patients state={state} setState={setState} />}
          {view==="collect" && <Collect state={state} setState={setState} />}
          {view==="stats" && <Stats state={state} />}
          {view==="settings" && <Settings state={state} setState={setState} />}
          {view==="portal" && <PatientPortal state={state} />}
        </main>

        <footer className="mx-auto max-w-6xl p-4 text-xs text-neutral-500">
          {saving? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={14}/> Sauvegarde…
            </span>
          ):(
            <span>Auto‑sauvegarde locale activée.</span>
          )}
        </footer>
      </div>
    </>
  );
}

// -------------------- Patients (CRUD + rappels) --------------------
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { 
  return <div className={`rounded-2xl border bg-white p-4 shadow-sm ${className}`}>{children}</div>; 
}

function Patients({ state, setState }: { state: any; setState: any }){
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ nom:"", prenom:"", naissance:"", articulation:"genou", email:"", opDate:"" });

  const add = () => {
    if(!form.nom || !form.prenom || !form.email){ alert("Nom, prénom et email sont obligatoires."); return; }
    const p = { id: uid(), token: uid(), ...form };
    setState({ ...state, patients: [...state.patients, p] });
    setForm({ nom:"", prenom:"", naissance:"", articulation:"genou", email:"", opDate:"" });
  };

  const patients = state.patients.filter((p: any) => `${p.nom} ${p.prenom}`.toLowerCase().includes(filter.toLowerCase()));
  const [selected, setSelected] = useState<string | null>(null);
  const sel = patients.find((p: any)=>p.id===selected) || null;

  const exportCSV = () => {
    const headers = ["patient_id","nom","prenom","email","naissance","articulation","opDate","timepoint","date","oxford","womac","commentaire"];
    const rows = state.measures.map((m: any)=>{ 
      const p = state.patients.find((x: any)=>x.id===m.patientId)||{}; 
      return [m.patientId,p.nom||"",p.prenom||"",p.email||"",p.naissance||"",p.articulation||"",p.opDate||"",m.timepoint,m.dateISO,m.scores?.oxford??"",m.scores?.womac??"", m.comment||""]; 
    });
    const csv = [headers.map(csvEscape).join(","), ...rows.map((r: any)=>r.map(csvEscape).join(","))].join("\n");
    downloadFile(`proms_raac_${todayISO()}.csv`, csv, "text/csv;charset=utf-8");
  };

  const reminders = computeReminders(state);

  return (
    <div className="grid gap-4 md:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <Card>
          <div className="text-sm font-semibold">Nouveau patient</div>
          <div className="mt-3 grid gap-2">
            <input className="rounded-xl border px-3 py-2" placeholder="Nom" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})}/>
            <input className="rounded-xl border px-3 py-2" placeholder="Prénom" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})}/>
            <input className="rounded-xl border px-3 py-2" type="date" placeholder="Naissance" value={form.naissance} onChange={e=>setForm({...form,naissance:e.target.value})}/>
            <select className="rounded-xl border px-3 py-2" value={form.articulation} onChange={e=>setForm({...form,articulation:e.target.value})}>
              <option value="genou">Genou</option>
              <option value="hanche">Hanche</option>
            </select>
            <input className="rounded-xl border px-3 py-2" type="email" required placeholder="Email (obligatoire)" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <div className="text-xs text-neutral-600">Email indispensable pour les rappels.</div>
            <label className="text-sm mt-1">Date d'opération</label>
            <input className="rounded-xl border px-3 py-2" type="date" value={form.opDate} onChange={e=>setForm({...form,opDate:e.target.value})}/>
            <button onClick={add} className="btn-pcbs">Ajouter</button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Patients ({patients.length})</div>
            <button onClick={exportCSV} className="text-sm underline">Exporter CSV</button>
          </div>
          <input className="mt-3 rounded-xl border px-3 py-2 w-full" placeholder="Rechercher…" value={filter} onChange={e=>setFilter(e.target.value)}/>
          <div className="mt-3 grid gap-2">
            {patients.map((p: any)=> (
              <button key={p.id} onClick={()=>setSelected(p.id)} className={`rounded-xl border px-3 py-2 text-left ${selected===p.id?"bg-neutral-100":""}`}>
                <div className="text-sm font-medium">{p.nom} {p.prenom}</div>
                <div className="text-xs text-neutral-500">{p.email} • {p.articulation} • Op: {fmtDate(p.opDate)}</div>
              </button>
            ))}
            {!patients.length && <div className="text-sm text-neutral-500">Aucun patient.</div>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold"><Calendar size={16}/> Rappels planifiés</div>
          <div className="mt-2 text-xs text-neutral-600">À échéance ≤ aujourd'hui et non complétés.</div>
          <div className="mt-2 grid gap-2 max-h-64 overflow-auto">
            {reminders.length? reminders.map((r: any,i: number)=> <ReminderRow key={i} r={r} state={state} setState={setState}/>) : <div className="text-sm text-neutral-500">Aucun rappel dû.</div>}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {sel ? (
          <PatientCard patient={sel} state={state} />
        ) : (
          <Card><div className="text-sm text-neutral-500">Sélectionnez un patient pour voir son suivi et générer le lien portail.</div></Card>
        )}
      </div>
    </div>
  );
}

function computeReminders(state: any){
  const out: any[] = [];
  const today = todayISO();
  for(const p of state.patients){
    if(!p.opDate) continue;
    for(const tp of TIMEPOINTS){
      const due = addDays(p.opDate, tp.offsetDays);
      const has = state.measures.some((m: any)=>m.patientId===p.id && m.timepoint===tp.id);
      if(!has && due <= today){ out.push({ patient:p, tp, due }); }
    }
  }
  return out.sort((a,b)=> a.due.localeCompare(b.due));
}

function ReminderRow({ r, state }: { r: any; state: any }){
  const email = buildEmail(state, r.patient, r.tp, r.due);
  const mailto = `mailto:${r.patient.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.text)}`;
  const sendViaAPI = async () => {
    if(!state.settings.apiEndpoint){ alert("Renseignez l'API endpoint dans Réglages."); return; }
    try{
      await fetch(state.settings.apiEndpoint, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(state.settings.apiKey? { 'Authorization': `Bearer ${state.settings.apiKey}` } : {}) },
        body: JSON.stringify({ to: r.patient.email, subject: email.subject, html: email.html, text: email.text })
      });
      alert("Requête d'envoi transmise (vérifiez les logs serveur).");
    }catch(e){ alert("Erreur lors de l'appel API."); }
  };
  const downloadICS = () => downloadICSFor(r.patient, r.tp, r.due, state.settings);
  return (
    <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
      <div><span className="font-medium">{r.patient.nom} {r.patient.prenom}</span> • {r.tp.label} • Échéance {new Date(r.due).toLocaleDateString()}</div>
      <div className="flex items-center gap-2">
        <a className="underline" href={mailto}><Mail size={16} className="inline mr-1"/>Email</a>
        <button className="rounded-xl border px-2 py-1" onClick={sendViaAPI}>API</button>
        <button className="rounded-xl border px-2 py-1" onClick={downloadICS}>.ics</button>
      </div>
    </div>
  );
}

function makePortalURL(p: any){ 
  const u = new URL(window.location.href); 
  u.searchParams.set('patient', p.id); 
  u.searchParams.set('token', p.token); 
  return u.toString(); 
}

function PatientCard({ patient, state }: { patient: any; state: any }){
  const measures = TIMEPOINTS.map(tp => state.measures.find((m: any)=>m.patientId===patient.id && m.timepoint===tp.id) || null);
  const data = TIMEPOINTS.map((tp, i) => ({ name: tp.label, Oxford: measures[i]?.scores?.oxford ?? null, WOMAC: measures[i]?.scores?.womac ?? null }));
  const portalURL = makePortalURL(patient);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{patient.nom} {patient.prenom} — {patient.articulation}</div>
          <div className="text-xs text-neutral-500">Email: {patient.email} • Op: {fmtDate(patient.opDate)} • Naissance: {fmtDate(patient.naissance)}</div>
        </div>
        <a href={portalURL} target="_blank" rel="noreferrer" className="text-sm underline">Ouvrir portail <ExternalLink className="inline" size={14}/></a>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-sm font-medium mb-2">Évolution des scores</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Oxford" dot />
                <Line type="monotone" dataKey="WOMAC" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Générer fiche imprimable</div>
          <button className="rounded-2xl border px-3 py-2 text-sm" onClick={()=>window.print()}>Imprimer / PDF</button>
        </div>
      </div>
    </Card>
  );
}

// -------------------- Collecte (saisie mesures) --------------------
function Collect({ state, setState }: { state: any; setState: any }){
  const [selected, setSelected] = useState("");
  const patient = state.patients.find((p: any)=>p.id===selected) || null;
  return (
    <div className="grid gap-4">
      <Card>
        <div className="text-sm font-semibold">Saisir Oxford + WOMAC</div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select className="rounded-xl border px-3 py-2" value={selected} onChange={e=>setSelected(e.target.value)}>
            <option value="">— Choisir un patient —</option>
            {state.patients.map((p: any)=> <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
          </select>
        </div>
      </Card>
      {patient ? <TimepointGrid patient={patient} state={state} setState={setState}/> : <Card><div className="text-sm text-neutral-500">Choisissez un patient.</div></Card>}
    </div>
  );
}

function TimepointGrid({ patient, state, setState }: { patient: any; state: any; setState: any }){
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {TIMEPOINTS.map(tp=> <MeasureBlock key={tp.id} patient={patient} tp={tp} state={state} setState={setState}/>) }
    </div>
  );
}

function MeasureBlock({ patient, tp, state, setState }: { patient: any; tp: any; state: any; setState: any }){
  const m = state.measures.find((x: any)=>x.patientId===patient.id && x.timepoint===tp.id) || null;
  const [dateISO, setDateISO] = useState(m?.dateISO || todayISO());
  const [ox, setOx] = useState(m?.oxford || Object.fromEntries(OXFORD_ITEMS.map((_,i)=>[i,2])));
  const [wm, setWm] = useState(m?.womac || Object.fromEntries(WOMAC_SECTIONS.flatMap(s=>s.items.map((_,i)=>[[s.key,i],2]))));
  const [comment, setComment] = useState(m?.comment || "");
  const scoreOxford = useMemo(()=> Object.values(ox).reduce((a: any,b: any)=>a+Number(b),0), [ox]);
  const scoreWomac = useMemo(()=> Object.values(wm).reduce((a: any,b: any)=>a+Number(b),0), [wm]);
  
  const saveMeasure = () => {
    const rec = { id: m?.id || uid(), patientId: patient.id, timepoint: tp.id, dateISO, oxford:ox, womac:wm, comment, scores:{oxford:scoreOxford, womac:scoreWomac} };
    const others = state.measures.filter((x: any)=> !(x.patientId===patient.id && x.timepoint===tp.id));
    setState({ ...state, measures: [...others, rec] });
  };

  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{tp.label}</div>
        <div className="text-xs text-neutral-500">Date <input className="rounded border px-2 py-1 ml-2" type="date" value={dateISO} onChange={e=>setDateISO(e.target.value)}/></div>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-sm font-medium mb-2">Oxford (12 items)</div>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {OXFORD_ITEMS.map((label, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-2">
                <div className="text-sm">{i+1}. {label}</div>
                <select className="rounded-xl border px-2 py-1 w-36" value={ox[i]} onChange={e=>setOx({...ox, [i]: Number(e.target.value)})}>
                  {OXFORD_OPTIONS.map(o=> <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm">Oxford: <b>{scoreOxford}</b> / 48</div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">WOMAC (24 items)</div>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {WOMAC_SECTIONS.map(sec => (
              <div key={sec.key}>
                <div className="text-xs font-semibold text-neutral-600 mb-1">{sec.label}</div>
                {sec.items.map((label, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="text-sm">{label}</div>
                    <select className="rounded-xl border px-2 py-1 w-24" value={wm[[sec.key,idx]]} onChange={e=>setWm({...wm, [[sec.key,idx]]: Number(e.target.value)})}>
                      {WOMAC_OPTIONS.map(v=> <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm">WOMAC: <b>{scoreWomac}</b> / 96 (plus bas = mieux)</div>
        </div>
      </div>
      <div className="mt-3">
        <label className="text-sm font-medium">Commentaire du patient (visible administrateurs)</label>
        <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} placeholder="Exprimez librement une remarque, douleur, difficulté…" value={comment} onChange={e=>setComment(e.target.value)} />
      </div>
      <div className="pt-3 flex items-center justify-between">
        <button onClick={saveMeasure} className="btn-pcbs">Enregistrer</button>
        <div className="text-xs text-neutral-500">Sauvegarde locale automatique</div>
      </div>
    </div>
  );
}

// -------------------- Statistiques globales --------------------
function Stats({ state }: { state: any }){
  const [artFilter, setArtFilter] = useState('all');
  const filteredMeasures = (tpId: string) => state.measures.filter((m: any)=>{
    if(m.timepoint!==tpId) return false;
    if(artFilter==='all') return true;
    const p = state.patients.find((x: any)=>x.id===m.patientId);
    return p && p.articulation===artFilter;
  });
  const rows = TIMEPOINTS.map(tp=>{
    const ms = filteredMeasures(tp.id);
    const n = ms.length || 0;
    const avgOx = n? (ms.reduce((a: any,m: any)=>a+(m.scores?.oxford||0),0)/n).toFixed(1):'—';
    const avgWm = n? (ms.reduce((a: any,m: any)=>a+(m.scores?.womac||0),0)/n).toFixed(1):'—';
    const base = artFilter==='all'? state.patients.length : state.patients.filter((p: any)=>p.articulation===artFilter).length;
    const compRate = base? Math.round(100*n/base)+'%' : '—';
    return { timepoint: tp.label, n, avgOxford: avgOx, avgWOMAC: avgWm, completude: compRate };
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Statistiques globales</div>
        <div className="text-sm">
          <label className="mr-2">Articulation:</label>
          <select className="rounded-xl border px-2 py-1" value={artFilter} onChange={e=>setArtFilter(e.target.value)}>
            <option value="all">Toutes</option>
            <option value="genou">Genou</option>
            <option value="hanche">Hanche</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-neutral-100 text-left">
              <th className="px-3 py-2">Temps</th>
              <th className="px-3 py-2">N</th>
              <th className="px-3 py-2">Oxford moyen</th>
              <th className="px-3 py-2">WOMAC moyen</th>
              <th className="px-3 py-2">Complétude</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.timepoint}</td>
                <td className="px-3 py-2">{r.n}</td>
                <td className="px-3 py-2">{r.avgOxford}</td>
                <td className="px-3 py-2">{r.avgWOMAC}</td>
                <td className="px-3 py-2">{r.completude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// -------------------- Réglages (SMTP/API + modèles) --------------------
function Settings({ state, setState }: { state: any; setState: any }){
  const s = state.settings;
  const set = (patch: any)=> setState({ ...state, settings: { ...s, ...patch } });
  const resetSubj = () => set({ emailSubjectTemplate: DEFAULT_EMAIL_SUBJECT });
  const resetTpl = () => set({ emailTemplate: DEFAULT_EMAIL_TEMPLATE });
  const samplePatient = state.patients[0] || { prenom:'Pat.', nom:'IENT', email:'patient@example.com', id:'p', token:'t', opDate: todayISO() };
  const sampleTp = TIMEPOINTS[1] || TIMEPOINTS[0];
  const due = addDays(samplePatient.opDate, sampleTp.offsetDays);
  const previewEmail = buildEmail({ ...state, settings: s }, samplePatient, sampleTp, due);

  const testAPI = async ()=>{
    if(!s.apiEndpoint){ alert("Renseignez l'URL d'API."); return; }
    try{
      await fetch(s.apiEndpoint, { 
        method:'POST', 
        headers:{ 'Content-Type':'application/json', ...(s.apiKey? { 'Authorization': `Bearer ${s.apiKey}` } : {}) }, 
        body: JSON.stringify({ to: samplePatient.email, subject: previewEmail.subject, html: previewEmail.html, text: previewEmail.text }) 
      });
      alert("Requête API envoyée (voir logs serveur)");
    }catch(e){ alert("Erreur d'appel API (voir console)."); }
  };

  return (
    <Card>
      <div className="text-sm font-semibold mb-2">Paramètres d'envoi & modèle d'e-mail</div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <input className="rounded-xl border px-3 py-2 w-full" placeholder="Nom de l'établissement" value={s.orgName} onChange={e=>set({orgName:e.target.value})}/>
          <input className="rounded-xl border px-3 py-2 w-full" placeholder="Logo URL (optionnel)" value={s.logoUrl} onChange={e=>set({logoUrl:e.target.value})}/>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2" placeholder="Expéditeur (pro@domaine.fr)" value={s.senderEmail} onChange={e=>set({senderEmail:e.target.value})}/>
            <input className="rounded-xl border px-3 py-2" placeholder="Heure par défaut (HH:MM)" value={s.defaultHour} onChange={e=>set({defaultHour:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2 w-full" placeholder="API endpoint (POST /send)" value={s.apiEndpoint} onChange={e=>set({apiEndpoint:e.target.value})}/>
            <button className="rounded-xl border px-3 py-2 text-xs" onClick={()=>set({apiEndpoint:'/.netlify/functions/send-email'})}>Utiliser Netlify Function</button>
          </div>
          <input className="rounded-xl border px-3 py-2 w-full" placeholder="API key (Bearer)" value={s.apiKey} onChange={e=>set({apiKey:e.target.value})}/>
          <input className="rounded-xl border px-3 py-2 w-full" placeholder="Sujet (templating {{tpLabel}}, {{orgName}}...)" value={s.emailSubjectTemplate} onChange={e=>set({emailSubjectTemplate:e.target.value})}/>
          <button className="rounded-xl border px-3 py-2 text-xs" onClick={resetSubj}>Réinitialiser le sujet par défaut</button>
          <label className="text-sm font-medium">Template HTML</label>
          <textarea className="rounded-xl border px-3 py-2 w-full h-48" value={s.emailTemplate} onChange={e=>set({emailTemplate:e.target.value})}/>
          <button className="rounded-xl border px-3 py-2 text-xs" onClick={resetTpl}>Réinitialiser le template par défaut</button>
          <div className="flex gap-2 mt-2">
            <a className="rounded-2xl border px-3 py-2 text-sm" href={`mailto:${encodeURIComponent('test@exemple.com')}?subject=${encodeURIComponent(previewEmail.subject)}&body=${encodeURIComponent(previewEmail.text)}`}>Tester mailto</a>
            <button className="rounded-2xl border px-3 py-2 text-sm" onClick={testAPI}>Tester envoi API</button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Aperçu rendu HTML</div>
          <div className="rounded-xl border p-3 bg-white" dangerouslySetInnerHTML={{ __html: previewEmail.html }} />
          <div className="text-xs text-neutral-500">
            <code>{`{{orgName}}, {{logoUrl}}, {{patientFirst}}, {{patientLast}}, {{tpLabel}}, {{portalURL}}, {{dueDate}}`}</code>
          </div>
        </div>
      </div>
    </Card>
  );
}

// -------------------- Portail patient (lecture seule) --------------------
function PatientPortal({ state }: { state: any }){
  const url = new URL(window.location.href);
  const pid = url.searchParams.get("patient");
  const tok = url.searchParams.get("token");
  const p = state.patients.find((x: any)=>x.id===pid);
  if(!p || p.token!==tok){ return <Card>Accès refusé.</Card>; }
  const measures = TIMEPOINTS.map(tp => state.measures.find((m: any)=>m.patientId===p.id && m.timepoint===tp.id) || null);
  const data = TIMEPOINTS.map((tp, i) => ({ name: tp.label, Oxford: measures[i]?.scores?.oxford ?? null, WOMAC: measures[i]?.scores?.womac ?? null }));
  return (
    <Card>
      <div className="text-sm">Bonjour {p.prenom} {p.nom}. Voici votre suivi.</div>
      <div className="h-64 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="Oxford" dot />
            <Line type="monotone" dataKey="WOMAC" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-xs text-neutral-500">Les données sont affichées à titre informatif.</div>
    </Card>
  );
}

// --- Added tests for csvEscape ---
(function(){
  try {
    const cases = [
      { in: null, out: "" },
      { in: undefined, out: "" },
      { in: "", out: "" },
      { in: "abc", out: "abc" },
      { in: "a,b", out: '"a,b"' },
      { in: 'a"b', out: '"a""b"' },
      { in: "a\nb", out: '"a\nb"' },
      { in: ["a","b"], out: "a|b" },
      { in: 123, out: "123" }
    ];
    let passed = 0;
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      const got = csvEscape(c.in);
      if (got !== c.out) throw new Error(`case ${i} failed: expected ${JSON.stringify(c.out)} got ${JSON.stringify(got)}`);
      passed++;
    }
    console.log(`csvEscape tests passed: ${passed}/${cases.length}`);
  } catch (e) {
    console.error('csvEscape tests failed:', e);
  }
})();
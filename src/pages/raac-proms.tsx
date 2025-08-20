import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download, Upload, Eye, ClipboardList, PlayCircle, FileDown, Loader2, Users, Mail, Calendar, BarChart3, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import Head from 'next/head';
import { Calendar, Users, BarChart3, FileText, Clock, CheckCircle, AlertCircle, TrendingUp, Download, Send, Phone, Mail, MapPin, User, Activity, Target, Linkedin, Instagram, Facebook, Menu } from 'lucide-react';
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

const completionData = [
    { name: 'Complétés', value: 78, color: '#28A745' },
    { name: 'En attente', value: 15, color: '#FFC107' },
    { name: 'En retard', value: 7, color: '#DC3545' }
];

const specialtyData = [
    { specialty: 'Hanche', patients: 45, avgOxford: 38, avgWomac: 22 },
    { specialty: 'Genou', patients: 34, avgOxford: 35, avgWomac: 25 },
    { specialty: 'Épaule', patients: 21, avgOxford: 40, avgWomac: 20 }
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
  const [selectedTimeframe, setSelectedTimeframe] = useState('6mois');
  const [showExportModal, setShowExportModal] = useState(false);
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
      
      <div className="min-h-screen bg-pcbs-gray-50 text-pcbs-gray-900">
        <header className="sticky top-0 z-10 border-b border-pcbs-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <img 
                src={state.settings.logoUrl || LOGO_URL} 
                onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}} 
                alt="Polyclinique Côte Basque Sud" 
                className="h-10 w-10 rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-xl font-bold text-pcbs">RAAC – Suivi PROMs</h1>
                <p className="text-sm text-pcbs-secondary font-medium">Polyclinique Côte Basque Sud</p>
              </div>
            </div>
            <nav className="flex gap-2 text-sm">
              <NavButton active={view==="patients"} onClick={()=>setView("patients")} icon={<Users size={18}/>} label="Patients"/>
              <NavButton active={view==="collect"} onClick={()=>setView("collect")} icon={<ClipboardList size={18}/>} label="Collecte"/>
              <NavButton active={view==="stats"} onClick={()=>setView("stats")} icon={<BarChart3 size={18}/>} label="Statistiques"/>
              <NavButton active={view==="settings"} onClick={()=>setView("settings")} icon={<Mail size={18}/>} label="Réglages"/>
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

        <footer className="mx-auto max-w-6xl p-6 border-t border-pcbs-gray-200 bg-white mt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-pcbs-secondary">
              © 2025 Polyclinique Côte Basque Sud - Système RAAC PROMs
            </div>
            <div className="text-xs text-pcbs-secondary">
          {saving? (
              <span className="inline-flex items-center gap-2 text-pcbs-primary">
                <Loader2 className="animate-spin" size={14}/> Sauvegarde en cours...
              </span>
          ):(
              <span className="inline-flex items-center gap-2">
                <div className="w-2 h-2 bg-pcbs-success rounded-full"></div>
                Données sauvegardées localement
              </span>
          )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// -------------------- Patients (CRUD + rappels) --------------------
function Card({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) { 
  return (
    <div className={`card-pcbs p-6 ${className}`}>
      {title && (
        <div className="mb-4 pb-3 border-b border-pcbs-gray-200">
          <h3 className="text-lg font-semibold text-pcbs">{title}</h3>
        </div>
      )}
      {children}
    </div>
  ); 
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        active 
          ? "bg-pcbs text-white shadow-md" 
          : "text-pcbs-secondary hover:text-pcbs hover:bg-pcbs-secondary"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
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
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <div className="space-y-6">
        <Card title="Nouveau patient">
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input-pcbs" placeholder="Nom *" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})}/>
              <input className="input-pcbs" placeholder="Prénom *" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})}/>
            </div>
            <input className="input-pcbs" type="date" placeholder="Date de naissance" value={form.naissance} onChange={e=>setForm({...form,naissance:e.target.value})}/>
            <select className="input-pcbs" value={form.articulation} onChange={e=>setForm({...form,articulation:e.target.value})}>
              <option value="genou">Genou</option>
              <option value="hanche">Hanche</option>
            </select>
            <input className="input-pcbs" type="email" required placeholder="Email *" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <div className="text-sm text-pcbs-secondary bg-pcbs-secondary p-3 rounded-lg">
              <strong>Note:</strong> L'email est indispensable pour l'envoi des rappels automatiques.
            </div>
            <div>
              <label className="block text-sm font-medium text-pcbs-secondary mb-2">Date d'opération</label>
              <input className="input-pcbs w-full" type="date" value={form.opDate} onChange={e=>setForm({...form,opDate:e.target.value})}/>
            </div>
            <button onClick={add} className="btn-pcbs w-full flex items-center justify-center gap-2">
              <Plus size={18}/>
              Ajouter le patient
            </button>
          </div>
        </Card>

        <Card title={`Patients (${patients.length})`}>
          <div className="flex items-center justify-between mb-4">
            <input className="input-pcbs flex-1 mr-3" placeholder="Rechercher un patient..." value={filter} onChange={e=>setFilter(e.target.value)}/>
            <button onClick={exportCSV} className="btn-pcbs-secondary flex items-center gap-2">
              <Download size={16}/>
              CSV
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto">
            {patients.map((p: any)=> (
              <button key={p.id} onClick={()=>setSelected(p.id)} className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selected===p.id 
                  ? "border-pcbs bg-pcbs-secondary" 
                  : "border-pcbs-gray-200 hover:border-pcbs hover:bg-pcbs-secondary/50"
              }`}>
                <div className="font-semibold text-pcbs">{p.nom} {p.prenom}</div>
                <div className="text-sm text-pcbs-secondary mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Mail size={12}/> {p.email}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{p.articulation}</span>
                  <span className="mx-2">•</span>
                  <span>Op: {fmtDate(p.opDate)}</span>
                </div>
              </button>
            ))}
            {!patients.length && (
              <div className="text-center py-8 text-pcbs-secondary">
                <Users size={48} className="mx-auto mb-3 opacity-50"/>
                <p>Aucun patient enregistré</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Rappels planifiés">
          <div className="mb-3 text-sm text-pcbs-secondary bg-pcbs-secondary p-3 rounded-lg">
            Questionnaires à échéance ≤ aujourd'hui et non complétés
          </div>
          <div className="space-y-3 max-h-64 overflow-auto">
            {reminders.length? reminders.map((r: any,i: number)=> <ReminderRow key={i} r={r} state={state} setState={setState}/>) : (
              <div className="text-center py-6 text-pcbs-secondary">
                <Calendar size={48} className="mx-auto mb-3 opacity-50"/>
                <p>Aucun rappel en attente</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {sel ? (
          <PatientCard patient={sel} state={state} />
        ) : (
          <Card>
            <div className="text-center py-12 text-pcbs-secondary">
              <Eye size={64} className="mx-auto mb-4 opacity-50"/>
              <h3 className="text-lg font-medium mb-2">Sélectionnez un patient</h3>
              <p>Choisissez un patient dans la liste pour voir son suivi détaillé et générer le lien portail.</p>
            </div>
          </Card>
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
  
  const isOverdue = r.due < todayISO();
  
  return (
    <div className={`p-4 rounded-lg border-l-4 ${isOverdue ? 'border-l-pcbs-error bg-red-50' : 'border-l-pcbs-warning bg-yellow-50'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-pcbs">{r.patient.nom} {r.patient.prenom}</div>
          <div className="text-sm text-pcbs-secondary mt-1">
            {r.tp.label} • Échéance: {fmtDate(r.due)}
            {isOverdue && <span className="badge-error ml-2">En retard</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a className="btn-pcbs-secondary text-xs px-3 py-1" href={mailto}>
            <Mail size={14} className="inline mr-1"/>Email
          </a>
          <button className="btn-pcbs-secondary text-xs px-3 py-1" onClick={sendViaAPI}>API</button>
          <button className="btn-pcbs-secondary text-xs px-3 py-1" onClick={downloadICS}>
            <Calendar size={14} className="inline mr-1"/>.ics
          </button>
        </div>
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
  
  const completedCount = measures.filter(m => m !== null).length;
  const completionRate = Math.round((completedCount / TIMEPOINTS.length) * 100);
  
  return (
    <Card title={`${patient.nom} ${patient.prenom}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="badge-success capitalize">{patient.articulation}</span>
            <span className="text-sm text-pcbs-secondary">Complétude: {completionRate}%</span>
          </div>
          <div className="text-sm text-pcbs-secondary space-y-1">
            <div><Mail size={14} className="inline mr-2"/>{patient.email}</div>
            <div><Calendar size={14} className="inline mr-2"/>Opération: {fmtDate(patient.opDate)}</div>
            <div>Naissance: {fmtDate(patient.naissance)}</div>
          </div>
        </div>
        <a href={portalURL} target="_blank" rel="noreferrer" className="btn-pcbs flex items-center gap-2">
          <ExternalLink size={16}/>
          Portail patient
        </a>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-lg font-semibold text-pcbs mb-4">Évolution des scores</h4>
          <div className="h-64 bg-pcbs-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Oxford" stroke="var(--pcbs-primary)" strokeWidth={3} dot={{ fill: 'var(--pcbs-primary)', strokeWidth: 2, r: 6 }} />
                <Line type="monotone" dataKey="WOMAC" stroke="var(--pcbs-accent)" strokeWidth={3} dot={{ fill: 'var(--pcbs-accent)', strokeWidth: 2, r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-pcbs mb-4">Actions</h4>
          <div className="space-y-3">
            <button className="btn-pcbs-secondary w-full flex items-center justify-center gap-2" onClick={()=>window.print()}>
              <FileDown size={16}/>
              Imprimer / Exporter PDF
            </button>
            <div className="bg-pcbs-secondary p-4 rounded-lg">
              <h5 className="font-medium text-pcbs mb-2">Progression du suivi</h5>
              <div className="space-y-2">
                {TIMEPOINTS.map((tp, i) => {
                  const completed = measures[i] !== null;
                  return (
                    <div key={tp.id} className="flex items-center justify-between">
                      <span className="text-sm">{tp.label}</span>
                      <span className={completed ? "badge-success" : "badge-warning"}>
                        {completed ? "Complété" : "En attente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
    <div className="space-y-6">
      <Card title="Collecte des données">
        <div className="grid gap-4 md:grid-cols-2">
          <select className="input-pcbs" value={selected} onChange={e=>setSelected(e.target.value)}>
            <option value="">— Choisir un patient —</option>
            {state.patients.map((p: any)=> <option key={p.id} value={p.id}>{p.nom} {p.prenom} ({p.articulation})</option>)}
          </select>
          {patient && (
            <div className="bg-pcbs-secondary p-4 rounded-lg">
              <div className="font-medium text-pcbs">{patient.nom} {patient.prenom}</div>
              <div className="text-sm text-pcbs-secondary">
                {patient.articulation} • Op: {fmtDate(patient.opDate)}
              </div>
            </div>
          )}
        </div>
      </Card>
      {patient ? (
        <TimepointGrid patient={patient} state={state} setState={setState}/>
      ) : (
        <Card>
          <div className="text-center py-12 text-pcbs-secondary">
            <ClipboardList size={64} className="mx-auto mb-4 opacity-50"/>
            <h3 className="text-lg font-medium mb-2">Sélectionnez un patient</h3>
            <p>Choisissez un patient pour commencer la saisie des questionnaires Oxford et WOMAC.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function TimepointGrid({ patient, state, setState }: { patient: any; state: any; setState: any }){
  return (
    <div className="grid gap-6 xl:grid-cols-2">
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

  const isCompleted = !!m;
  
  return (
    <Card className={isCompleted ? "border-l-4 border-l-pcbs-success" : ""}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-pcbs">{tp.label}</h4>
          {isCompleted && <span className="badge-success">Complété</span>}
        </div>
        <div className="flex items-center gap-2 text-sm text-pcbs-secondary">
          <Calendar size={16}/>
          <input className="input-pcbs text-sm" type="date" value={dateISO} onChange={e=>setDateISO(e.target.value)}/>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-pcbs">Oxford Hip/Knee Score</h5>
            <span className="text-sm font-semibold text-pcbs">{scoreOxford}/48</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-auto pr-2">
            {OXFORD_ITEMS.map((label, i) => (
              <div key={i} className="bg-pcbs-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-pcbs-secondary mb-2">{i+1}. {label}</div>
                <select className="input-pcbs w-full" value={ox[i]} onChange={e=>setOx({...ox, [i]: Number(e.target.value)})}>
                  {OXFORD_OPTIONS.map(o=> <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-pcbs">WOMAC Score</h5>
            <span className="text-sm font-semibold text-pcbs">{scoreWomac}/96</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-auto pr-2">
            {WOMAC_SECTIONS.map(sec => (
              <div key={sec.key}>
                <div className="text-sm font-semibold text-pcbs mb-2 bg-pcbs-secondary p-2 rounded">{sec.label}</div>
                <div className="space-y-2 ml-2">
                  {sec.items.map((label, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="text-sm text-pcbs-secondary flex-1">{label}</div>
                      <select className="input-pcbs w-20 text-sm" value={wm[[sec.key,idx]]} onChange={e=>setWm({...wm, [[sec.key,idx]]: Number(e.target.value)})}>
                      {WOMAC_OPTIONS.map(v=> <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-pcbs-secondary bg-pcbs-secondary p-2 rounded">
            Score plus bas = meilleur résultat
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <label className="block text-sm font-medium text-pcbs mb-2">Commentaire du patient</label>
        <textarea 
          className="input-pcbs w-full" 
          rows={3} 
          placeholder="Exprimez librement une remarque, douleur, difficulté…" 
          value={comment} 
          onChange={e=>setComment(e.target.value)} 
        />
        <div className="text-xs text-pcbs-secondary mt-1">Visible uniquement par les administrateurs</div>
      </div>
      
      <div className="pt-6 border-t border-pcbs-gray-200 flex items-center justify-between">
        <button onClick={saveMeasure} className="btn-pcbs flex items-center gap-2">
          <PlayCircle size={16}/>
          Enregistrer les données
        </button>
        <div className="text-xs text-pcbs-secondary">Sauvegarde automatique activée</div>
      </div>
    </Card>
  );
}

// -------------------- Statistiques globales --------------------
function Stats({ state }: { state: any }){
  const [artFilter, setArtFilter] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('6mois');
  const [showExportModal, setShowExportModal] = useState(false);
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
    <div className="space-y-6">
      <Card title="Statistiques globales">
        <div className="flex items-center justify-between mb-6">
          <div className="text-pcbs-secondary">
            Analyse des données collectées par timepoint et type d'articulation
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-pcbs-secondary">Filtrer par articulation:</label>
            <select className="input-pcbs" value={artFilter} onChange={e=>setArtFilter(e.target.value)}>
            <option value="all">Toutes</option>
            <option value="genou">Genou</option>
            <option value="hanche">Hanche</option>
          </select>
          </div>
        </div>
        
        {/* Filtres et contrôles */}
        <div className="card-pcbs p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-pcbs">Période d'analyse :</label>
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="input-pcbs"
              >
                <option value="3mois">3 mois</option>
                <option value="6mois">6 mois</option>
                <option value="12mois">12 mois</option>
                <option value="24mois">24 mois</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowExportModal(true)}
                className="btn-pcbs-secondary flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button className="btn-pcbs flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Rappels (12)
              </button>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <div className="card-pcbs p-6">
            <h3 className="text-lg font-semibold text-pcbs mb-4">Évolution des Scores Oxford</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="timepoint" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgOxford" 
                  stroke="#004d71" 
                  strokeWidth={3} 
                  dot={{ fill: '#004d71', strokeWidth: 2, r: 6 }} 
                  name="Oxford Moyen"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card-pcbs p-6">
            <h3 className="text-lg font-semibold text-pcbs mb-4">Évolution des Scores WOMAC</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="timepoint" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgWOMAC" 
                  stroke="#f08486" 
                  strokeWidth={3} 
                  dot={{ fill: '#f08486', strokeWidth: 2, r: 6 }} 
                  name="WOMAC Moyen"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analyses par spécialité et taux de complétude */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <div className="card-pcbs p-6">
            <h3 className="text-lg font-semibold text-pcbs mb-4">Analyse par Spécialité</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={specialtyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="specialty" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="patients" fill="#004d71" name="Nb Patients" />
                <Bar dataKey="avgOxford" fill="#f08486" name="Oxford Moyen" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-pcbs p-6">
            <h3 className="text-lg font-semibold text-pcbs mb-4">Taux de Complétude</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-pcbs-secondary text-left">
                <th className="px-4 py-3 font-semibold text-pcbs">Timepoint</th>
                <th className="px-4 py-3 font-semibold text-pcbs">Patients (N)</th>
                <th className="px-4 py-3 font-semibold text-pcbs">Oxford moyen</th>
                <th className="px-4 py-3 font-semibold text-pcbs">WOMAC moyen</th>
                <th className="px-4 py-3 font-semibold text-pcbs">Taux de complétude</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-t border-pcbs-gray-200 hover:bg-pcbs-gray-50">
                <td className="px-4 py-3 font-medium text-pcbs">{r.timepoint}</td>
                <td className="px-4 py-3 text-pcbs-secondary">{r.n}</td>
                <td className="px-4 py-3 text-pcbs-secondary">{r.avgOxford}</td>
                <td className="px-4 py-3 text-pcbs-secondary">{r.avgWOMAC}</td>
                <td className="px-4 py-3">
                  <span className={`badge-${r.n > 0 ? 'success' : 'warning'}`}>{r.completude}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Modal d'export */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-pcbs mb-4">Exporter les Données</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-pcbs mb-2">Format d'export</label>
                  <select className="input-pcbs w-full">
                    <option value="csv">CSV (Excel)</option>
                    <option value="pdf">PDF (Rapport)</option>
                    <option value="json">JSON (Données brutes)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-pcbs mb-2">Données à inclure</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Scores Oxford</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Scores WOMAC</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Données démographiques</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Historique des rappels</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="btn-pcbs-secondary flex-1"
                >
                  Annuler
                </button>
                <button className="btn-pcbs flex-1">
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Résumé">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-pcbs">{state.patients.length}</div>
              <div className="text-sm text-pcbs-secondary">Patients total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pcbs">{state.measures.length}</div>
              <div className="text-sm text-pcbs-secondary">Mesures collectées</div>
            </div>
          </div>
        </Card>
        
        <Card title="Répartition">
          <div className="space-y-3">
            {['genou', 'hanche'].map(art => {
              const count = state.patients.filter((p: any) => p.articulation === art).length;
              const pct = state.patients.length ? Math.round((count / state.patients.length) * 100) : 0;
              return (
                <div key={art} className="flex items-center justify-between">
                  <span className="capitalize text-pcbs-secondary">{art}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-pcbs">{count}</span>
                    <span className="text-xs text-pcbs-secondary">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        
        <Card title="Qualité des données">
          <div className="space-y-3">
            {TIMEPOINTS.map(tp => {
              const total = filteredMeasures(tp.id).length;
              const base = artFilter === 'all' ? state.patients.length : state.patients.filter((p: any) => p.articulation === artFilter).length;
              const rate = base ? Math.round((total / base) * 100) : 0;
              return (
                <div key={tp.id} className="flex items-center justify-between">
                  <span className="text-sm text-pcbs-secondary">{tp.label}</span>
                  <span className={`badge-${rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'error'}`}>
                    {rate}%
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
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
    <div className="space-y-6">
      <Card title="Configuration de l'établissement">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-pcbs mb-2">Nom de l'établissement</label>
            <input className="input-pcbs w-full" value={s.orgName} onChange={e=>set({orgName:e.target.value})}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-pcbs mb-2">URL du logo</label>
            <input className="input-pcbs w-full" placeholder="https://..." value={s.logoUrl} onChange={e=>set({logoUrl:e.target.value})}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-pcbs mb-2">Email expéditeur</label>
            <input className="input-pcbs w-full" placeholder="noreply@polyclinique-cotebasquesud.fr" value={s.senderEmail} onChange={e=>set({senderEmail:e.target.value})}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-pcbs mb-2">Heure par défaut des rappels</label>
            <input className="input-pcbs w-full" placeholder="09:00" value={s.defaultHour} onChange={e=>set({defaultHour:e.target.value})}/>
          </div>
        </div>
      </Card>
      
      <Card title="Configuration API d'envoi">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pcbs mb-2">Endpoint API</label>
            <div className="flex gap-2">
              <input className="input-pcbs flex-1" placeholder="/.netlify/functions/send-email" value={s.apiEndpoint} onChange={e=>set({apiEndpoint:e.target.value})}/>
              <button className="btn-pcbs-secondary" onClick={()=>set({apiEndpoint:'/.netlify/functions/send-email'})}>
                Netlify
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pcbs mb-2">Clé API (Bearer Token)</label>
            <input className="input-pcbs w-full" type="password" placeholder="Optionnel" value={s.apiKey} onChange={e=>set({apiKey:e.target.value})}/>
          </div>
        </div>
      </Card>
      
      <Card title="Modèles d'emails">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-pcbs mb-2">Sujet de l'email</label>
              <input className="input-pcbs w-full" value={s.emailSubjectTemplate} onChange={e=>set({emailSubjectTemplate:e.target.value})}/>
              <button className="btn-pcbs-secondary text-xs mt-2" onClick={resetSubj}>Réinitialiser</button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-pcbs mb-2">Template HTML</label>
              <textarea className="input-pcbs w-full h-64 font-mono text-sm" value={s.emailTemplate} onChange={e=>set({emailTemplate:e.target.value})}/>
              <button className="btn-pcbs-secondary text-xs mt-2" onClick={resetTpl}>Réinitialiser</button>
            </div>
            
            <div className="bg-pcbs-secondary p-4 rounded-lg">
              <h5 className="font-medium text-pcbs mb-2">Variables disponibles</h5>
              <div className="text-xs text-pcbs-secondary font-mono space-y-1">
                <div>{'{{orgName}}'} - Nom de l'établissement</div>
                <div>{'{{logoUrl}}'} - URL du logo</div>
                <div>{'{{patientFirst}}'} - Prénom du patient</div>
                <div>{'{{patientLast}}'} - Nom du patient</div>
                <div>{'{{tpLabel}}'} - Nom du timepoint</div>
                <div>{'{{portalURL}}'} - Lien vers le portail</div>
                <div>{'{{dueDate}}'} - Date d'échéance</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <a className="btn-pcbs-secondary flex items-center gap-2" href={`mailto:${encodeURIComponent('test@exemple.com')}?subject=${encodeURIComponent(previewEmail.subject)}&body=${encodeURIComponent(previewEmail.text)}`}>
                <Mail size={16}/>
                Test mailto
              </a>
              <button className="btn-pcbs flex items-center gap-2" onClick={testAPI}>
                <PlayCircle size={16}/>
                Test API
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-pcbs mb-3">Aperçu de l'email</h5>
              <div className="border border-pcbs-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-auto" dangerouslySetInnerHTML={{ __html: previewEmail.html }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// -------------------- Portail patient (lecture seule) --------------------
function PatientPortal({ state }: { state: any }){
  const url = new URL(window.location.href);
  const pid = url.searchParams.get("patient");
  const tok = url.searchParams.get("token");
  const p = state.patients.find((x: any)=>x.id===pid);
  if(!p || p.token!==tok){ 
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <AlertCircle size={64} className="mx-auto mb-4"/>
            <h3 className="text-lg font-medium">Accès non autorisé</h3>
            <p>Le lien utilisé n'est pas valide ou a expiré.</p>
          </div>
        </div>
      </Card>
    );
  }

  const measures = TIMEPOINTS.map(tp => state.measures.find((m: any)=>m.patientId===p.id && m.timepoint===tp.id) || null);
  const data = TIMEPOINTS.map((tp, i) => ({ name: tp.label, Oxford: measures[i]?.scores?.oxford ?? null, WOMAC: measures[i]?.scores?.womac ?? null }));

  return (
    <div className="space-y-6">
      <Card>
        <div className="bg-pcbs-gradient p-6 rounded-lg text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">Bonjour {p.prenom} {p.nom}</h2>
          <p className="opacity-90">Voici l'évolution de votre récupération post-opératoire</p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-pcbs mb-4">Évolution de vos scores</h3>
            <div className="h-80 bg-pcbs-gray-50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Oxford" stroke="var(--pcbs-primary)" strokeWidth={3} dot={{ fill: 'var(--pcbs-primary)', strokeWidth: 2, r: 6 }} />
                  <Line type="monotone" dataKey="WOMAC" stroke="var(--pcbs-accent)" strokeWidth={3} dot={{ fill: 'var(--pcbs-accent)', strokeWidth: 2, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pcbs rounded-full"></div>
                <span className="text-sm text-pcbs-secondary">Score Oxford</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pcbs-secondary rounded-full"></div>
                <span className="text-sm text-pcbs-secondary">Score WOMAC</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-pcbs mb-4">Votre progression</h3>
            <div className="space-y-4">
              {TIMEPOINTS.map((tp, i) => {
                const measure = measures[i];
                const completed = !!measure;
                return (
                  <div key={tp.id} className={`p-4 rounded-lg border-l-4 ${
                    completed ? "border-l-pcbs-success bg-green-50" : "border-l-pcbs-warning bg-yellow-50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-pcbs">{tp.label}</div>
                        <div className="text-sm text-pcbs-secondary mt-1">
                          {completed ? `Complété le ${fmtDate(measure.dateISO)}` : "En attente"}
                        </div>
                      </div>
                      <span className={completed ? "badge-success" : "badge-warning"}>
                        {completed ? "Complété" : "En attente"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-pcbs-secondary rounded-lg">
          <p className="text-sm text-pcbs-secondary">
            <strong>Information:</strong> Ces données sont affichées à titre informatif. 
            Pour toute question médicale, contactez votre équipe soignante.
          </p>
        </div>
      </Card>
    </div>
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlarmClock, ArrowRight, Bell, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardCheck, ClipboardList, Download, FileText, HeartPulse, LayoutDashboard, Menu, MessageCircle, Pill, Plus, Printer, Search, ShieldCheck, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { nextQuestion, retrieve, starterMessages } from './logic';
import { downloadFile, dueMedicationEvents, initialVisit, medicineCalendar, sampleMeds, sampleTasks, sampleVisits, visitText } from './visit';
import './styles.css';

const emptyMedication = () => ({ id: crypto.randomUUID(), name: '', dosage: '', instructions: '', times: ['09:00'], startDate: dayString(), endDate: '', prescribedBy: '' });
const emptyTask = () => ({ id: crypto.randomUUID(), title: '', due: '', done: false, visitId: '' });
const navigation = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'before', label: 'Before the visit', icon: CalendarDays },
  { id: 'during', label: 'During the visit', icon: ClipboardList },
  { id: 'after', label: 'After the visit', icon: CheckCircle2 },
  { id: 'meds', label: 'Medications', icon: Pill },
  { id: 'history', label: 'Visit history', icon: Activity },
  { id: 'resources', label: 'Health resources', icon: BookOpen },
];
const dayString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const formatDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not set';
const makeId = () => crypto.randomUUID();
const countDone = tasks => tasks.filter(task => task.done).length;
const defaultSession = () => ({ visits: [initialVisit()], selectedId: null, meds: [], tasks: [], logs: [], chat: starterMessages, documents: [], demo: false });

function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('carepath-visit-companion');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSession();
  });
  const [keepLocal, setKeepLocal] = useState(() => localStorage.getItem('carepath-visit-companion') !== null);
  const [page, setPage] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [editingMed, setEditingMed] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [questionDraft, setQuestionDraft] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:8000');
  const [busy, setBusy] = useState(false);
  const [remindInTab, setRemindInTab] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const shownReminders = useRef(new Set());
  const docInput = useRef(null);

  const visits = Array.isArray(session.visits) ? session.visits : [];
  const currentVisit = visits.find(v => v.id === session.selectedId) || visits[0] || initialVisit();
  const meds = Array.isArray(session.meds) ? session.meds : [];
  const tasks = Array.isArray(session.tasks) ? session.tasks : [];
  const logs = Array.isArray(session.logs) ? session.logs : [];
  const messages = Array.isArray(session.chat) ? session.chat : starterMessages;
  const documents = Array.isArray(session.documents) ? session.documents : [];
  const relevantResources = useMemo(() => retrieve([currentVisit.concerns, currentVisit.symptoms, currentVisit.notes, ...messages.map(m => m.text)].join(' '), 4), [currentVisit, messages]);
  const today = dayString(currentTime);
  const dueToday = meds.flatMap(m => (m.times || []).filter(t => (!m.startDate || m.startDate <= today) && (!m.endDate || m.endDate >= today)).map(t => ({ id: `${m.id}-${t}`, med: m, time: t, log: logs.find(l => l.medId === m.id && l.time === t && l.date === today) })));
  const pendingTasks = tasks.filter(t => !t.done);

  useEffect(() => {
    if (keepLocal) localStorage.setItem('carepath-visit-companion', JSON.stringify(session));
    else localStorage.removeItem('carepath-visit-companion');
  }, [session, keepLocal]);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!remindInTab) return;
    const due = dueMedicationEvents(meds, logs, currentTime);
    for (const reminder of due) {
      const key = `${reminder.med.id}:${reminder.date}:${reminder.time}`;
      if (shownReminders.current.has(key)) continue;
      shownReminders.current.add(key);
      setNotice(`Scheduled medication reminder: ${reminder.med.name}. Follow the instructions from your prescriber.`);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('CarePath medication reminder', { body: `${reminder.med.name} · ${reminder.time}. Check your prescription instructions.` });
    }
  }, [currentTime, remindInTab, meds, logs]);

  const updateSession = change => setSession(previous => typeof change === 'function' ? change(previous) : { ...previous, ...change });
  const updateVisit = (field, value) => updateSession(old => ({ ...old, visits: old.visits.map(v => v.id === currentVisit.id ? { ...v, [field]: value } : v) }));
  const go = target => { setPage(target); setMenuOpen(false); setNotice(''); };
  const loadDemo = () => {
    updateSession({ visits: sampleVisits(), selectedId: 'sample-visit', meds: sampleMeds(), tasks: sampleTasks(), logs: [], chat: [...starterMessages, { role: 'user', text: 'I have felt tired for about three weeks and have occasional headaches.' }, { role: 'assistant', text: 'You mentioned fatigue and headaches. When do you notice these symptoms most, and what would you like to ask your clinician?' }], documents: [{ id: 'demo-doc', title: 'Fictional visit preparation note', text: 'This is a fictional sample document. No clinical data or real test results are included.' }], demo: true });
    go('home');
    setNotice('Fictional example loaded. All example names and information are invented.');
  };
  const clearData = () => {
    if (!window.confirm('Clear every visit, medicine, note, and task from this workspace? This cannot be undone.')) return;
    updateSession(defaultSession()); localStorage.removeItem('carepath-visit-companion'); setKeepLocal(false); setNotice('Workspace cleared.'); go('home');
  };
  const addVisit = () => {
    const visit = initialVisit();
    updateSession(old => ({ ...old, visits: [...old.visits, visit], selectedId: visit.id }));
    go('before');
  };
  const deleteVisit = id => {
    if (!window.confirm('Delete this visit and its notes?')) return;
    updateSession(old => {
      const remaining = old.visits.filter(v => v.id !== id);
      return { ...old, visits: remaining.length ? remaining : [initialVisit()], selectedId: remaining[0]?.id || null, tasks: old.tasks.filter(t => t.visitId !== id) };
    });
  };
  const addQuestion = () => {
    const value = questionDraft.trim(); if (!value) return;
    updateVisit('questions', [...(currentVisit.questions || []), { id: makeId(), text: value, answered: false }]);
    setQuestionDraft('');
  };
  const toggleQuestion = id => updateVisit('questions', (currentVisit.questions || []).map(q => q.id === id ? { ...q, answered: !q.answered } : q));
  const deleteQuestion = id => updateVisit('questions', (currentVisit.questions || []).filter(q => q.id !== id));
  const addFollowUp = () => { const task = emptyTask(); task.visitId = currentVisit.id; setEditingTask(task); go('after'); };
  const saveTask = () => {
    if (!editingTask?.title.trim()) { setNotice('Add a task description first.'); return; }
    updateSession(old => ({ ...old, tasks: [...old.tasks.filter(t => t.id !== editingTask.id), editingTask] }));
    setEditingTask(null); setNotice('Follow-up task saved.');
  };
  const toggleTask = id => updateSession(old => ({ ...old, tasks: old.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  const saveMed = () => {
    const value = editingMed;
    if (!value?.name.trim() || !value.dosage.trim() || !value.times?.length || value.times.some(t => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) { setNotice('Enter the medication name, prescribed dose, and at least one valid reminder time.'); return; }
    if (value.endDate && value.startDate && value.endDate < value.startDate) { setNotice('The end date must be on or after the start date.'); return; }
    updateSession(old => ({ ...old, meds: [...old.meds.filter(m => m.id !== value.id), { ...value, times: [...new Set(value.times)].sort() }] }));
    setEditingMed(null); setNotice('Medication schedule saved as entered. Confirm it matches your prescription.');
  };
  const recordMed = (medId, time, status) => {
    updateSession(old => ({ ...old, logs: [...old.logs.filter(l => !(l.medId === medId && l.time === time && l.date === today)), { id: makeId(), medId, time, date: today, status }] }));
  };
  const requestReminders = async () => {
    if (typeof Notification === 'undefined') { setNotice('Browser notifications are not supported here. You can still export calendar reminders.'); return; }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setNotice('Notifications were not enabled. Calendar export is available below.'); return; }
    setRemindInTab(true); setNotice('Reminders enabled while this page is open. Export a calendar file for reminders outside the browser.');
  };
  const exportCalendar = () => {
    if (!meds.length) { setNotice('Add a medication schedule first.'); return; }
    downloadFile('carepath-medication-reminders.ics', medicineCalendar(meds, 30), 'text/calendar;charset=utf-8');
    setNotice('Calendar file downloaded. Import it into your calendar and confirm notifications are enabled. It contains the next 30 scheduled days.');
  };
  const exportVisit = () => downloadFile('carepath-visit-summary.txt', visitText(currentVisit, meds, tasks.filter(t => t.visitId === currentVisit.id)));
  const exportWorkspace = () => downloadFile('carepath-workspace.json', JSON.stringify({ exportedAt: new Date().toISOString(), ...session }, null, 2), 'application/json');
  const loadDocument = async file => {
    if (!file) return;
    if (!/\.(txt|pdf)$/i.test(file.name) || file.size > 2000000) { setNotice('Choose a TXT or PDF file up to 2 MB.'); return; }
    try {
      let text;
      if (/\.txt$/i.test(file.name)) text = (await file.text()).slice(0, 6000);
      else {
        if (!aiMode) { setNotice('PDF extraction requires the local backend. Switch on local AI mode to connect.'); return; }
        const form = new FormData(); form.append('file', file);
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/document`, { method: 'POST', body: form });
        if (!response.ok) throw new Error('PDF text extraction failed. Check the local backend.');
        text = (await response.json()).text.slice(0, 6000);
      }
      updateSession(old => ({ ...old, documents: [...old.documents, { id: makeId(), title: file.name, text }] }));
      setNotice('Document text imported. Review it before sharing your visit summary.');
    } catch (error) { setNotice(error.message); }
    finally { if (docInput.current) docInput.current.value = ''; }
  };
  const ask = async () => {
    const text = messageDraft.trim(); if (!text || busy) return;
    const conversation = [...messages, { role: 'user', text }];
    updateSession(old => ({ ...old, chat: conversation })); setMessageDraft(''); setBusy(true);
    try {
      let reply;
      if (aiMode) {
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: conversation, details: { concern: currentVisit.concerns, symptoms: currentVisit.symptoms, timeline: currentVisit.timeline, context: currentVisit.notes, goals: (currentVisit.questions || []).map(q => q.text).join('; ') }, document_text: documents.map(d => d.text).join('\n').slice(0, 8000) }) });
        if (!response.ok) throw new Error('Local AI backend not available');
        reply = (await response.json()).reply;
      } else reply = nextQuestion(conversation);
      updateSession(old => ({ ...old, chat: [...old.chat, { role: 'assistant', text: reply }] }));
    } catch { setNotice('The local AI backend is unavailable. You can switch back to guided demo mode.'); }
    finally { setBusy(false); }
  };

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'show' : ''}`}>
      <div className="logo"><span className="logo-icon"><HeartPulse size={22}/></span><span>carepath<span className="logo-dot">.</span><small>YOUR VISIT COMPANION</small></span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav">{navigation.map(({id,label,icon:Icon}) => <button key={id} className={`nav-link ${page === id ? 'selected' : ''}`} onClick={() => go(id)}><Icon size={19}/>{label}{page === id && <ChevronRight size={14} className="chevron"/>}</button>)}</nav>
      <div className="sidebar-foot"><div className="sidebar-security"><ShieldCheck size={19}/><span>Local-first demo<small>No account or cloud records</small></span></div><button className="text-button" onClick={clearData}><Trash2 size={15}/> Clear all data</button></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={21}/></button><span className="crumb">CarePath <ChevronRight size={14}/> {navigation.find(n => n.id === page)?.label}</span><span className="top-right"><span className="demo-indicator"/> {session.demo ? 'Fictional demo workspace' : 'Personal workspace'}</span></header>
      <div className="content">
        {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={17}/></button></div>}
        {page === 'home' && <>
          <div className="hero"><div className="eyebrow"><Sparkles size={14}/> ALL YOUR VISIT DETAILS, IN ONE PLACE</div><h1>Feel prepared.<br/><em>Leave with a plan.</em></h1><p>Organize your concerns before the appointment, capture what your clinician says, and keep track of the next steps afterward.</p><div className="hero-actions"><button className="button primary" onClick={() => go('before')}>Prepare my visit <ArrowRight size={17}/></button><button className="button ghost" onClick={loadDemo}>Explore fictional example</button></div><div className="hero-note"><ShieldCheck size={15}/> No diagnosis or medication advice. Your notes stay on your device unless you choose to connect the AI backend.</div></div>
          <div className="section-title"><div><div className="eyebrow muted">YOUR CARE JOURNEY</div><h2>One visit, three connected stages</h2></div><span className="small-tag">Before → During → After</span></div>
          <div className="journey-grid"><JourneyCard number="01" title="Before the visit" subtitle="Know what to bring up" icon={CalendarDays} color="lavender" onClick={() => go('before')} items={['Appointment details', 'Concerns and questions', 'Guided conversation']}/><JourneyCard number="02" title="During the visit" subtitle="Capture what matters" icon={ClipboardList} color="peach" onClick={() => go('during')} items={['Clinician notes', 'Questions discussed', 'Visit instructions']}/><JourneyCard number="03" title="After the visit" subtitle="Follow through with confidence" icon={CheckCircle2} color="mint" onClick={() => go('after')} items={['Follow-up tasks', 'Medication schedule', 'Visit summary']}/></div>
          <div className="dashboard-grid"><div className="panel"><div className="panel-heading"><h3>Upcoming visit</h3><button className="text-link" onClick={() => go('history')}>All visits <ArrowRight size={14}/></button></div><div className="appointment-preview"><div className="date-tile"><CalendarDays size={20}/><strong>{currentVisit.date ? new Date(`${currentVisit.date}T12:00:00`).toLocaleString('en-US',{month:'short'}) : 'TBD'}</strong><span>{currentVisit.date ? currentVisit.date.slice(-2) : '—'}</span></div><div><strong>{currentVisit.title || 'Your next appointment'}</strong><small>{currentVisit.clinician || 'Add your clinician'} · {formatDate(currentVisit.date)}</small><button className="text-link" onClick={() => go('before')}>View visit details <ArrowRight size={14}/></button></div></div></div><div className="panel"><div className="panel-heading"><h3>Today's plan</h3><span className="small-tag">{formatDate(today)}</span></div><div className="mini-stat"><Pill size={19}/><span>{dueToday.length} medication reminder{dueToday.length !== 1 ? 's' : ''} scheduled</span></div><div className="mini-stat"><ClipboardCheck size={19}/><span>{pendingTasks.length} follow-up task{pendingTasks.length !== 1 ? 's' : ''} remaining</span></div><button className="text-link" onClick={() => go('meds')}>Open medication schedule <ArrowRight size={14}/></button></div></div>
          <div className="privacy-strip"><div><h3>Your information stays in your control</h3><p>By default, everything lives only in this browser tab. Optional device storage is not encrypted. Use fictional information for the public demo.</p></div><label className="toggle-row"><input type="checkbox" checked={keepLocal} onChange={e => setKeepLocal(e.target.checked)}/> Save on this device</label></div>
        </>}
        {page === 'before' && <>
          <PageHead eyebrow="01 / BEFORE YOUR VISIT" title="Walk in with a clear plan" description="Save the details you don't want to forget. Every field is optional, and you can edit these notes anytime."/>
          <div className="panel spacious"><div className="panel-heading"><h3>Appointment details</h3><span className="small-tag">{currentVisit.status}</span></div><div className="form-grid"><Field label="Visit name" value={currentVisit.title} placeholder="Annual checkup" onChange={v => updateVisit('title', v)}/><Field label="Clinician" value={currentVisit.clinician} placeholder="Clinician's name" onChange={v => updateVisit('clinician', v)}/><Field label="Date" type="date" value={currentVisit.date} onChange={v => updateVisit('date', v)}/><Field label="Specialty" value={currentVisit.specialty} placeholder="Primary care, dermatology..." onChange={v => updateVisit('specialty', v)}/><Field label="Location / link" wide value={currentVisit.location} placeholder="Clinic address or telehealth link" onChange={v => updateVisit('location', v)}/></div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Things you want to discuss</h3><span className="small-tag">Your words, your priorities</span></div><div className="form-grid"><Field area label="Main concerns" value={currentVisit.concerns} placeholder="What made you schedule this visit?" onChange={v => updateVisit('concerns', v)}/><Field area label="Symptoms or observations" value={currentVisit.symptoms} placeholder="What have you noticed?" onChange={v => updateVisit('symptoms', v)}/><Field area wide label="Timeline" value={currentVisit.timeline} placeholder="When did it start? Has anything changed?" onChange={v => updateVisit('timeline', v)}/></div><h4>Your questions</h4><div className="list-stack">{(currentVisit.questions || []).map(q => <div className="list-entry" key={q.id}><button className={`check-box ${q.answered ? 'checked' : ''}`} onClick={() => toggleQuestion(q.id)} aria-label="Mark question discussed">{q.answered && <Check size={15}/>}</button><span className={q.answered ? 'completed' : ''}>{q.text}</span><button className="icon-button" aria-label="Remove question" onClick={() => deleteQuestion(q.id)}><X size={15}/></button></div>)}{!currentVisit.questions?.length && <p className="empty-small">No questions yet. Add anything you'd like to ask.</p>}</div><form className="inline-add" onSubmit={e => {e.preventDefault(); addQuestion();}}><input value={questionDraft} placeholder="Add a question for your clinician" onChange={e => setQuestionDraft(e.target.value)}/><button className="button dark" disabled={!questionDraft.trim()}><Plus size={16}/> Add</button></form></div>
          <div className="split-bottom"><div className="panel spacious"><div className="panel-heading"><h3>Talk it through</h3><span className="small-tag">Guided intake</span></div><div className="messages small-chat">{messages.map((m,i) => <div className={`bubble ${m.role}`} key={i}>{m.text}</div>)}</div><form className="inline-add" onSubmit={e => {e.preventDefault(); ask();}}><input value={messageDraft} placeholder="Describe your concern..." onChange={e => setMessageDraft(e.target.value)}/><button className="button dark" disabled={!messageDraft.trim() || busy}><ArrowRight size={17}/></button></form><div className="mode-line"><label><input type="checkbox" checked={aiMode} onChange={e => setAiMode(e.target.checked)}/> Use local AI backend</label>{aiMode && <input className="url-input" value={apiUrl} aria-label="Backend URL" onChange={e => setApiUrl(e.target.value)}/>}</div><p className="fine-print">Demo questions follow local rules. Actual model-generated questions require your configured backend.</p></div><div className="panel spacious"><div className="panel-heading"><h3>Bring a document</h3><FileText size={19}/></div><p className="muted-paragraph">Attach a text note to keep context in your workspace. PDF extraction works with the optional local backend.</p><button className="button ghost bordered" onClick={() => docInput.current?.click()}><Upload size={16}/> Import TXT or PDF</button><input ref={docInput} type="file" accept=".txt,.pdf" hidden onChange={e => loadDocument(e.target.files?.[0])}/><div className="document-list">{documents.map(doc => <div className="document-item" key={doc.id}><FileText size={17}/><span>{doc.title}</span><button className="icon-button" aria-label="Remove document" onClick={() => updateSession(old => ({ ...old, documents: old.documents.filter(d => d.id !== doc.id) }))}><X size={15}/></button></div>)}</div><button className="button primary full" onClick={() => go('during')}>Continue to visit notes <ArrowRight size={17}/></button></div></div>
        </>}
        {page === 'during' && <>
          <PageHead eyebrow="02 / DURING YOUR VISIT" title="A place for the details that matter" description="You or your clinician can type notes here. This app does not verify who entered the text, so review all instructions with your care team."/>
          <div className="note-banner"><ClipboardList size={21}/><div><strong>Clinician note mode</strong><span>Share your screen or device with the clinician if they agree. Ask them to confirm the final notes and medication instructions.</span></div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>{currentVisit.title || 'Current appointment'}</h3><span className="small-tag">{formatDate(currentVisit.date)}</span></div><div className="form-grid"><Field area wide label="What was discussed" placeholder="Main findings, topics covered, or explanations..." value={currentVisit.notes} onChange={v => updateVisit('notes', v)}/><Field area wide label="Instructions provided by the clinician" placeholder="Only enter directions that were actually provided. Include exact wording when possible." value={currentVisit.instructions} onChange={v => updateVisit('instructions', v)}/><Field area wide label="Follow-up plan" placeholder="Recommended follow-up visit, tests to discuss, referrals..." value={currentVisit.followUp} onChange={v => updateVisit('followUp', v)}/><Field label="Notes entered by" placeholder="Name or role (not verified)" value={currentVisit.documentedBy} onChange={v => updateVisit('documentedBy', v)}/><div className="field"><span>Note review</span><label className="checkbox-label"><input type="checkbox" checked={Boolean(currentVisit.confirmed)} onChange={e => updateVisit('confirmed', e.target.checked)}/> I reviewed these notes against my visit instructions</label></div></div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Questions to discuss</h3><span className="small-tag">{(currentVisit.questions || []).filter(q => q.answered).length} discussed</span></div><div className="list-stack">{(currentVisit.questions || []).map(q => <div className="list-entry" key={q.id}><button className={`check-box ${q.answered ? 'checked' : ''}`} onClick={() => toggleQuestion(q.id)}>{q.answered && <Check size={15}/>}</button><span>{q.text}</span></div>)}{!currentVisit.questions?.length && <p className="empty-small">Prepare questions in the Before the visit section.</p>}</div><div className="button-row"><button className="button ghost bordered" onClick={exportVisit}><Download size={16}/> Export visit notes</button><button className="button primary" onClick={() => { updateVisit('status', 'completed'); go('after'); }}>Continue to aftercare <ArrowRight size={16}/></button></div></div>
        </>}
        {page === 'after' && <>
          <PageHead eyebrow="03 / AFTER YOUR VISIT" title="Keep your next steps in sight" description="Turn your clinician's plan into an organized follow-up checklist, then keep your medication schedules together."/>
          <div className="summary-grid"><div className="summary-tile"><ClipboardCheck size={24}/><strong>{tasks.length}</strong><span>follow-up tasks</span></div><div className="summary-tile"><CheckCircle2 size={24}/><strong>{countDone(tasks)}</strong><span>completed</span></div><div className="summary-tile"><Pill size={24}/><strong>{meds.length}</strong><span>medication entries</span></div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Follow-up tasks</h3><button className="button dark small" onClick={addFollowUp}><Plus size={15}/> New task</button></div><div className="list-stack">{tasks.map(task => <div className="task-entry" key={task.id}><button className={`check-box ${task.done ? 'checked' : ''}`} onClick={() => toggleTask(task.id)}>{task.done && <Check size={15}/>}</button><div className="task-body"><strong className={task.done ? 'completed' : ''}>{task.title}</strong><small>{task.due ? `Due ${formatDate(task.due)}` : 'No due date'}</small></div><button className="text-link" onClick={() => setEditingTask({...task})}>Edit</button><button className="icon-button" aria-label="Remove task" onClick={() => updateSession(old => ({ ...old, tasks: old.tasks.filter(t => t.id !== task.id) }))}><X size={15}/></button></div>)}{tasks.length === 0 && <Empty title="No tasks yet" description="Add the steps that you and your clinician discussed, such as scheduling a follow-up appointment."/>}</div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Visit takeaways</h3><span className="small-tag">From your notes</span></div><div className="takeaway"><span>Instructions</span><p>{currentVisit.instructions || 'No clinician instructions entered yet.'}</p></div><div className="takeaway"><span>Follow-up</span><p>{currentVisit.followUp || 'No follow-up plan entered yet.'}</p></div><div className="button-row"><button className="button ghost bordered" onClick={exportVisit}><Download size={16}/> Download visit summary</button><button className="button ghost bordered" onClick={() => window.print()}><Printer size={16}/> Print</button><button className="button primary" onClick={() => go('meds')}>Medication organizer <ArrowRight size={16}/></button></div></div>
        </>}
        {page === 'meds' && <>
          <PageHead eyebrow="MEDICATION ORGANIZER" title="Keep medication schedules clear" description="Record medication names and instructions exactly as provided by your prescriber or pharmacist. CarePath never chooses doses or changes a schedule for you."/>
          <div className="note-banner amber"><Bell size={22}/><div><strong>Two ways to remember</strong><span>In-page notifications only work while the app is open. Calendar export creates 30 days of repeating reminders to import into your own calendar.</span></div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Today's schedule</h3><span className="small-tag">{formatDate(today)}</span></div><div className="list-stack">{dueToday.map(({id,med,time,log}) => <div className="med-row" key={id}><div className="med-clock"><AlarmClock size={16}/>{time}</div><div className="med-detail"><strong>{med.name}</strong><small>{med.dosage}</small></div><div className="med-actions">{log ? <span className={`state-pill ${log.status}`}>{log.status === 'taken' ? 'Marked taken' : 'Skipped'}</span> : <><button className="button dark small" onClick={() => recordMed(med.id,time,'taken')}>Mark taken</button><button className="button ghost bordered small" onClick={() => recordMed(med.id,time,'skipped')}>Skipped</button></>}{log && <button className="text-link" onClick={() => updateSession(old => ({ ...old, logs: old.logs.filter(l => !(l.medId === med.id && l.date === today && l.time === time)) }))}>Undo</button>}</div></div>)}{dueToday.length === 0 && <Empty title="Nothing scheduled today" description="Add medication details from an existing prescription to build your schedule."/>}</div><p className="fine-print">This log is only your own record, not proof of taking a dose. If you miss one, follow your medication instructions or ask a pharmacist. Do not double a dose based on this app.</p></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Medication list</h3><button className="button dark small" onClick={() => setEditingMed(emptyMedication())}><Plus size={15}/> Add medication</button></div><div className="med-grid">{meds.map(med => <div className="medicine-card" key={med.id}><div className="med-card-head"><span className="medicine-icon"><Pill size={21}/></span><button className="icon-button" onClick={() => updateSession(old => ({ ...old, meds: old.meds.filter(m => m.id !== med.id), logs: old.logs.filter(l => l.medId !== med.id) }))} aria-label="Remove medication"><Trash2 size={16}/></button></div><h4>{med.name}</h4><p>{med.dosage}</p><div className="chips">{med.times.map(t => <span className="chip" key={t}><AlarmClock size={13}/>{t}</span>)}</div><small>{med.instructions || 'No additional directions entered'}</small><button className="text-link" onClick={() => setEditingMed({...med, times: [...med.times]})}>Edit medication <ArrowRight size={14}/></button></div>)}{!meds.length && <div className="medicine-card empty-med"><Pill size={25}/><h4>No medicines added</h4><p>Add one from your existing medication list or prescription label.</p></div>}</div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Understand your prescription</h3><BookOpen size={19}/></div><p className="muted-paragraph">Keep the exact instructions from your prescription label and use these questions to clarify details with a pharmacist or clinician. CarePath does not check interactions, calculate doses, or determine what to do after a missed dose.</p><div className="med-questions"><div><strong>Questions worth asking</strong><p>What is this medication for? How should I take it? What should I do if I miss a dose? Which side effects need medical attention? Should I avoid anything while taking it?</p></div><a className="button ghost bordered" href="https://medlineplus.gov/druginformation.html" target="_blank" rel="noreferrer">MedlinePlus drug information <ArrowRight size={16}/></a></div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Reminders</h3><span className="small-tag">Stay on schedule</span></div><div className="reminder-grid"><div><div className="reminder-icon"><Bell size={21}/></div><h4>Browser reminders</h4><p>Alerts at scheduled times while this tab is open and your browser allows notifications.</p><button className="button ghost bordered" onClick={requestReminders}>{remindInTab ? 'Notifications enabled' : 'Enable notifications'}</button></div><div><div className="reminder-icon"><CalendarDays size={21}/></div><h4>Calendar reminders</h4><p>Download a calendar file with the next 30 days of medication reminders and import it into your calendar.</p><button className="button dark" onClick={exportCalendar}><Download size={16}/> Export calendar (.ics)</button></div></div></div>
        </>}
        {page === 'history' && <>
          <PageHead eyebrow="YOUR VISIT TIMELINE" title="A record you can return to" description="Review past and upcoming appointments. Everything shown here was entered by you or loaded from fictional demo information."/>
          <div className="panel spacious"><div className="panel-heading"><h3>Appointments</h3><button className="button dark small" onClick={addVisit}><Plus size={15}/> New visit</button></div><div className="history-list">{[...visits].sort((a,b) => (b.date || '').localeCompare(a.date || '')).map(visit => <div className={`history-entry ${visit.id === currentVisit.id ? 'active' : ''}`} key={visit.id}><div className="history-date"><CalendarDays size={19}/></div><div><strong>{visit.title || 'Untitled appointment'}</strong><small>{formatDate(visit.date)} · {visit.clinician || 'Clinician not entered'}</small><span className="history-status">{visit.status}</span></div><div className="history-actions"><button className="button ghost bordered small" onClick={() => {updateSession(old => ({ ...old, selectedId: visit.id })); go('before');}}>Open</button><button className="icon-button" onClick={() => deleteVisit(visit.id)} aria-label="Delete visit"><Trash2 size={17}/></button></div></div>)}</div></div>
          <div className="panel spacious"><div className="panel-heading"><h3>Your data</h3><ShieldCheck size={19}/></div><p className="muted-paragraph">Nothing is automatically saved to an account. You can download an unencrypted copy of your workspace or save it in this browser's local storage. Avoid entering real medical information in a public or shared computer.</p><div className="button-row"><button className="button ghost bordered" onClick={exportWorkspace}><Download size={16}/> Export my data</button><label className="toggle-row"><input type="checkbox" checked={keepLocal} onChange={e => setKeepLocal(e.target.checked)}/> Save on this device</label><button className="button ghost bordered danger" onClick={clearData}><Trash2 size={16}/> Delete workspace</button></div></div>
        </>}
        {page === 'resources' && <>
          <PageHead eyebrow="LEARN WITH SOURCES" title="Reliable places to learn more" description="These links lead to public MedlinePlus resources. CarePath does not diagnose conditions or interpret test results."/>
          <div className="resource-grid">{relevantResources.map(r => <a className="resource-card" href={r.url} target="_blank" rel="noreferrer" key={r.id}><div className="resource-icon"><BookOpen size={22}/></div><span className="eyebrow muted">{r.topic}</span><h3>{r.title}</h3><p>{r.description}</p><span className="resource-link">Open MedlinePlus <ArrowRight size={15}/></span></a>)}</div><div className="panel spacious"><h3>How to use this information</h3><p className="muted-paragraph">Bring unfamiliar terms or results to your clinician or pharmacist. If you're experiencing urgent or severe symptoms, seek immediate medical attention rather than waiting for a response from this app.</p></div>
        </>}
        <footer className="footer">CarePath AI · Prototype for visit organization · Not medical advice · Clinician identity and instructions are not verified</footer>
      </div>
    </main>
    {editingMed && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-label="Medication editor"><div className="modal-head"><div><div className="eyebrow muted">MEDICATION ENTRY</div><h2>{meds.some(m => m.id === editingMed.id) ? 'Edit medication' : 'Add medication'}</h2></div><button className="icon-button" onClick={() => setEditingMed(null)}><X size={20}/></button></div><p className="fine-print">Copy the exact name, dose, and directions from your prescription. CarePath will not determine a dose.</p><div className="form-grid"><Field label="Medication name" value={editingMed.name} placeholder="Name from prescription" onChange={v => setEditingMed(m => ({...m,name:v}))}/><Field label="Prescribed dose" value={editingMed.dosage} placeholder="Enter exact dose from label" onChange={v => setEditingMed(m => ({...m,dosage:v}))}/><Field label="Prescribed by" value={editingMed.prescribedBy} placeholder="Clinician or pharmacy" onChange={v => setEditingMed(m => ({...m,prescribedBy:v}))}/><Field label="Start date" type="date" value={editingMed.startDate} onChange={v => setEditingMed(m => ({...m,startDate:v}))}/><Field label="End date (optional)" type="date" value={editingMed.endDate} onChange={v => setEditingMed(m => ({...m,endDate:v}))}/><div className="field"><span>Daily reminder times</span><div className="time-inputs">{editingMed.times.map((time,i) => <div className="time-input-row" key={i}><input type="time" value={time} onChange={e => setEditingMed(m => ({ ...m, times: m.times.map((t,j) => j === i ? e.target.value : t) }))}/><button className="icon-button" disabled={editingMed.times.length === 1} onClick={() => setEditingMed(m => ({...m,times:m.times.filter((_,j) => i !== j)}))}><X size={15}/></button></div>)}<button className="text-link" onClick={() => setEditingMed(m => ({...m,times:[...m.times,'12:00']}))}><Plus size={15}/> Another time</button></div></div><Field area wide label="Additional instructions from label or clinician" value={editingMed.instructions} placeholder="With food, as needed, or other exact directions from the label" onChange={v => setEditingMed(m => ({...m,instructions:v}))}/></div><div className="modal-actions"><button className="button ghost bordered" onClick={() => setEditingMed(null)}>Cancel</button><button className="button primary" onClick={saveMed}>Save schedule</button></div></div></div>}
    {editingTask && <div className="modal-backdrop"><div className="modal compact" role="dialog" aria-modal="true" aria-label="Follow-up task editor"><div className="modal-head"><h2>Follow-up task</h2><button className="icon-button" onClick={() => setEditingTask(null)}><X size={20}/></button></div><div className="form-grid"><Field wide label="What needs to be done?" placeholder="Schedule a follow-up appointment" value={editingTask.title} onChange={v => setEditingTask(t => ({ ...t, title: v }))}/><Field wide label="Due date (optional)" type="date" value={editingTask.due} onChange={v => setEditingTask(t => ({ ...t, due: v }))}/></div><div className="modal-actions"><button className="button ghost bordered" onClick={() => setEditingTask(null)}>Cancel</button><button className="button primary" onClick={saveTask}>Save task</button></div></div></div>}
  </div>;
}

function PageHead({ eyebrow, title, description }) { return <div className="page-head"><div className="eyebrow muted">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>; }
function JourneyCard({ number, title, subtitle, items, icon: Icon, color, onClick }) { return <button className="journey-card" onClick={onClick}><div className="journey-top"><span className={`journey-icon ${color}`}><Icon size={23}/></span><span className="journey-number">{number}</span></div><h3>{title}</h3><p>{subtitle}</p><div className="journey-items">{items.map(item => <span key={item}><Check size={14}/>{item}</span>)}</div><span className="journey-go">Open workspace <ArrowRight size={16}/></span></button>; }
function Field({ label, value, onChange, type = 'text', area = false, wide = false, placeholder = '' }) { return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span>{area ? <textarea rows={3} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)}/> : <input type={type} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)}/>}</label>; }
function Empty({ title, description }) { return <div className="empty"><span><ClipboardCheck size={22}/></span><strong>{title}</strong><p>{description}</p></div>; }

createRoot(document.getElementById('root')).render(<App/>);

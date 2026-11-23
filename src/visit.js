export const initialVisit = () => ({
  id: crypto.randomUUID(),
  title: '',
  clinician: '',
  specialty: '',
  date: '',
  location: '',
  concerns: '',
  symptoms: '',
  timeline: '',
  questions: [],
  notes: '',
  instructions: '',
  followUp: '',
  documentedBy: '',
  confirmed: false,
  status: 'upcoming',
});

export const sampleVisits = () => [{
  id: 'sample-visit', title: 'Routine follow-up', clinician: 'Dr. Morgan (fictional)', specialty: 'Primary care',
  date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), location: 'Community Health Clinic',
  concerns: 'Feeling more tired than usual and having occasional headaches.',
  symptoms: 'Low energy in the afternoons; headaches two or three times this week.',
  timeline: 'Started about three weeks ago.',
  questions: [
    { id: 'q1', text: 'What information should I track before my next visit?', answered: false },
    { id: 'q2', text: 'What should I ask about my recent laboratory report?', answered: false },
  ],
  notes: 'Fictional example: Reviewed symptoms and discussed questions to bring to follow-up.',
  instructions: 'Fictional example only: Record symptoms in a journal and contact the clinic with questions.',
  followUp: 'Fictional example: Follow up with the clinic in two weeks.',
  documentedBy: 'Demo clinician (not verified)', confirmed: false, status: 'upcoming',
}];

export const sampleMeds = () => [{
  id: 'demo-med', name: 'Sample prescription (fictional)', dosage: 'As written on prescription', instructions: 'Illustrative entry only. Do not use as medical instructions.',
  times: ['09:00'], startDate: new Date().toISOString().slice(0, 10), endDate: '', prescribedBy: 'Demo clinician',
}];

export const sampleTasks = () => [
  { id: 'demo-task-1', title: 'Bring questions to the appointment', due: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), done: false, visitId: 'sample-visit' },
  { id: 'demo-task-2', title: 'Review visit notes after appointment', due: '', done: false, visitId: 'sample-visit' },
];

const line = value => String(value ?? '').replace(/\r?\n/g, ' ').trim();
export function visitText(visit, meds = [], tasks = []) {
  return [
    'CAREPATH VISIT SUMMARY',
    `Visit: ${line(visit.title)}`, `Date: ${line(visit.date)}`, `Clinician: ${line(visit.clinician)}`,
    `Specialty: ${line(visit.specialty)}`, `Location: ${line(visit.location)}`,
    '', 'BEFORE THE VISIT', `Concerns: ${line(visit.concerns)}`, `Symptoms: ${line(visit.symptoms)}`,
    `Timeline: ${line(visit.timeline)}`, 'Questions:',
    ...(visit.questions || []).map((q, i) => `${i + 1}. ${line(q.text)}${q.answered ? ' (discussed)' : ''}`),
    '', 'DURING THE VISIT', `Notes: ${line(visit.notes)}`, `Clinician-entered instructions: ${line(visit.instructions)}`,
    `Follow-up plan: ${line(visit.followUp)}`, `Entered by: ${line(visit.documentedBy) || 'Not specified (identity not verified)'}`,
    '', 'MEDICATION LIST (USER-ENTERED, NOT VERIFIED)',
    ...meds.map(m => `${line(m.name)} | ${line(m.dosage)} | ${(m.times || []).join(', ')} | ${line(m.instructions)}`),
    '', 'FOLLOW-UP TASKS', ...tasks.map(t => `${t.done ? '[x]' : '[ ]'} ${line(t.title)} ${line(t.due)}`),
    '', 'Review all notes and instructions with your healthcare professional. This tool does not diagnose, prescribe, or verify clinician identity.',
  ].join('\n');
}

export function downloadFile(name, content, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const escapeCalendar = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export function medicineCalendar(meds, days = 30, now = new Date()) {
  const events = [];
  for (const med of meds) {
    for (const time of med.times || []) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) continue;
      const start = med.startDate || now.toISOString().slice(0, 10);
      const localDate = new Date(`${start}T${time}:00`);
      if (Number.isNaN(localDate.getTime())) continue;
      let count = days;
      if (med.endDate) {
        const lastDay = new Date(`${med.endDate}T23:59:59`);
        count = Math.min(days, Math.max(0, Math.ceil((lastDay.getTime() - localDate.getTime()) / 86400000)));
      }
      if (count < 1) continue;
      const end = new Date(localDate.getTime() + 60000);
      const formatLocal = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;
      events.push([
        'BEGIN:VEVENT', `UID:${med.id}-${time.replace(':','')}@carepath-local`, `DTSTAMP:${stamp(now)}`,
        `DTSTART:${formatLocal(localDate)}`, `DTEND:${formatLocal(end)}`,
        `RRULE:FREQ=DAILY;COUNT=${count}`, `SUMMARY:${escapeCalendar(`Medication reminder: ${med.name}`)}`,
        `DESCRIPTION:${escapeCalendar(`Follow the instructions on your prescription. ${med.dosage}. ${med.instructions || ''}`)}`,
        'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${escapeCalendar(`Medication reminder: ${med.name}`)}`, 'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'));
    }
  }
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CarePath AI//Medication Reminders//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}

export function dueMedicationEvents(meds, logs, currentTime = new Date()) {
  const day = `${currentTime.getFullYear()}-${String(currentTime.getMonth()+1).padStart(2,'0')}-${String(currentTime.getDate()).padStart(2,'0')}`;
  const time = `${String(currentTime.getHours()).padStart(2,'0')}:${String(currentTime.getMinutes()).padStart(2,'0')}`;
  return meds.flatMap(m => (m.times || []).filter(t => t === time && (!m.startDate || m.startDate <= day) && (!m.endDate || m.endDate >= day) && !logs.some(l => l.medId === m.id && l.date === day && l.time === t)).map(t => ({ med: m, date: day, time: t })));
}

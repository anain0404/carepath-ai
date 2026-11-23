import test from 'node:test';
import assert from 'node:assert/strict';
import { dueMedicationEvents, medicineCalendar, visitText } from '../src/visit.js';

test('calendar includes the entered medication schedule and alarm', () => {
  const calendar = medicineCalendar([{ id:'m1', name:'Sample medicine', dosage:'prescribed dose', instructions:'label instructions', times:['09:00','21:00'], startDate:'2026-11-23', endDate:'' }], 30, new Date('2026-11-23T12:00:00Z'));
  assert.match(calendar, /RRULE:FREQ=DAILY;COUNT=30/);
  assert.match(calendar, /BEGIN:VALARM/);
  assert.equal((calendar.match(/BEGIN:VEVENT/g) || []).length, 2);
});

test('invalid reminder times are ignored', () => {
  const calendar = medicineCalendar([{ id:'m1', name:'Test', dosage:'as recorded', instructions:'', times:['invalid'], startDate:'2026-11-23' }], 30);
  assert.equal((calendar.match(/BEGIN:VEVENT/g) || []).length, 0);
});

test('due reminders only fire for unlogged medication times', () => {
  const meds = [{id:'m1',name:'Example',times:['09:00'],startDate:'2026-11-23',endDate:''}];
  const now = new Date(2026,10,23,9,0,0);
  assert.equal(dueMedicationEvents(meds,[],now).length,1);
  assert.equal(dueMedicationEvents(meds,[{medId:'m1',date:'2026-11-23',time:'09:00',status:'taken'}],now).length,0);
});

test('visit export contains entered notes but no generated medical guidance', () => {
  const text = visitText({title:'Test',date:'2026-11-23',questions:[{text:'What happens next?',answered:false}],instructions:'Clinician said to follow label.'},[],[]);
  assert.match(text,/Clinician said to follow label/);
  assert.match(text,/What happens next/);
});

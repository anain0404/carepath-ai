export const resources = [
  { id: 'visit', title: 'Make the most of your doctor visit', topic: 'Preparing for care', terms: ['visit','appointment','doctor','questions','concern','symptoms','follow up'], url: 'https://medlineplus.gov/ency/patientinstructions/000860.htm', description: 'Ideas for describing concerns, preparing questions, and following up after a visit.' },
  { id: 'tests', title: 'Medical tests', topic: 'Understanding tests', terms: ['blood','test','lab','results','screening','urine','report','numbers'], url: 'https://medlineplus.gov/lab-tests/', description: 'Patient-friendly information about why tests are ordered and what results may mean.' },
  { id: 'topics', title: 'Health topics', topic: 'Explore health information', terms: ['health','condition','symptoms','fatigue','sleep','headache','pain','dizziness','wellness'], url: 'https://medlineplus.gov/healthtopics.html', description: 'An index of health topics reviewed by the National Library of Medicine.' },
  { id: 'laboratory', title: 'Laboratory tests', topic: 'Understanding lab work', terms: ['blood','lab','laboratory','urine','sample','result','test'], url: 'https://medlineplus.gov/laboratorytests.html', description: 'Background on laboratory testing and how samples are used.' },
  { id: 'blood', title: 'What you need to know about blood testing', topic: 'Blood testing', terms: ['blood','fasting','lab','draw','needle','cbc','results'], url: 'https://medlineplus.gov/lab-tests/what-you-need-to-know-about-blood-testing/', description: 'Explains common blood-test procedures and preparation questions.' },
];

export const starterMessages = [
  { role: 'assistant', text: 'Hi! I can help you organize what you want to bring up at an appointment. What is the main thing you want to discuss?' },
];

export const example = {
  concern: 'I have been feeling unusually tired for about three weeks and want to explain it clearly at my appointment.',
  symptoms: 'Low energy in the afternoons, occasional headaches, and trouble concentrating.',
  timeline: 'Started around three weeks ago; seems more noticeable after lunch.',
  context: 'No new medications. I have a few questions about whether blood testing is worth discussing.',
  goals: 'Understand possible next steps to discuss with my clinician and what details are useful to track.',
};

const splitLines = text => (text || '').split(/\n|[.;](?=\s)/).map(x => x.trim()).filter(Boolean).slice(0, 8);
export const clean = text => (text || '').trim().slice(0, 4000);

export function retrieve(text, limit = 3) {
  const words = new Set(clean(text).toLowerCase().match(/[a-z]{3,}/g) || []);
  return resources.map(resource => ({
    ...resource,
    score: resource.terms.reduce((score, term) => score + (words.has(term) ? 2 : 0), 0),
  })).sort((a, b) => b.score - a.score).slice(0, limit);
}

const questionSet = {
  onset: 'When did you first notice this? Has it been changing since then?',
  frequency: 'How often does this happen, and how long does it usually last?',
  impact: 'How has this been affecting your day-to-day activities, if at all?',
  pattern: 'Have you noticed anything that tends to happen before it starts or makes it better or worse?',
  context: 'Is there any recent change, medication, or other background detail you want your clinician to know?',
  goals: 'What is the main question you want answered at your appointment?',
};

const topicQuestions = [
  { id: 'sleep', pattern: /\b(sleep|sleeping|insomnia|waking|bedtime|restless)\b/i, question: 'You mentioned sleep. What has changed about your sleep, and when did you first notice it?' },
  { id: 'energy', pattern: /\b(tired|fatigue|exhausted|energy|weakness)\b/i, question: 'You mentioned low energy. Is it present all day, or do you notice it more at particular times?' },
  { id: 'headache', pattern: /\b(headaches?|migraines?|head pain)\b/i, question: 'You mentioned headaches. How often are they happening, and how are they affecting your usual activities?' },
  { id: 'pain', pattern: /\b(pain|ache|sore|hurts|cramp)\b/i, question: 'You mentioned pain. Where do you notice it, and does it come and go or stay constant?' },
  { id: 'test', pattern: /\b(test|lab|bloodwork|blood test|results|report)\b/i, question: 'You mentioned a test or report. Is there a particular result or term you want your clinician to explain?' },
  { id: 'medication', pattern: /\b(medication|medicine|prescription|dose|tablet|pill)\b/i, question: 'You mentioned medication. Is there a particular change, effect, or question you want to discuss with your clinician?' },
  { id: 'mood', pattern: /\b(stress|anxiety|anxious|mood|overwhelmed)\b/i, question: 'You mentioned how you have been feeling. Is there a particular situation or pattern you want to bring up at your visit?' },
];

const spoken = messages => messages.filter(m => m.role === 'user').map(m => clean(m.text));
const asked = messages => messages.filter(m => m.role === 'assistant').map(m => clean(m.text));
const contains = (text, pattern) => pattern.test(text);

export function nextQuestion(messages) {
  const answers = spoken(messages);
  if (!answers.length) return starterMessages[0].text;
  const replies = asked(messages);
  const latest = answers[answers.length - 1];
  const history = answers.join(' ');
  const first = answers[0];
  const used = question => replies.includes(question);

  if (/\b(kill myself|suicid(?:e|al)|end my life|hurt myself)\b/i.test(latest)) {
    return 'I am sorry you are going through this. If you might act on these thoughts or are in immediate danger, call emergency services now. In the U.S., you can also call or text 988 for support. This appointment preparation tool cannot provide crisis care.';
  }

  if (/\b(chest pain|cannot breathe|can.t breathe|trouble breathing|stroke symptoms)\b/i.test(latest)) {
    return 'Some symptoms can need urgent medical attention. If you are experiencing a medical emergency, call emergency services now rather than using this appointment preparation tool.';
  }

  if (answers.length === 1 && /^(hi|hello|hey|thanks|thank you|ok|okay)[.! ]*$/i.test(latest)) {
    return 'What is the main concern or question you would like to discuss at your appointment?';
  }

  const hasTime = /\b(yesterday|today|tonight|last (?:night|week|month|year)|since|ago|weeks?|months?|years?|days?|hours?|recently|started|began)\b/i.test(history);
  const hasFrequency = /\b(daily|every day|each day|often|sometimes|occasionally|constantly|always|once|twice|intermittent|comes and goes|all day)\b/i.test(history);
  const hasImpact = /\b(work|school|class|sleep|exercise|routine|daily life|activities|concentrat|focus|walking)\b/i.test(history);

  if (!hasTime && !used(questionSet.onset)) return questionSet.onset;

  const topic = topicQuestions.find(t => contains(first, t.pattern) && !used(t.question))
    || topicQuestions.find(t => contains(latest, t.pattern) && !used(t.question));
  if (topic) return topic.question;

  if (!hasFrequency && !used(questionSet.frequency)) return questionSet.frequency;
  if (!hasImpact && !used(questionSet.impact)) return questionSet.impact;
  if (!used(questionSet.pattern)) return questionSet.pattern;
  if (!used(questionSet.context)) return questionSet.context;
  if (!used(questionSet.goals)) return questionSet.goals;
  return 'You have covered several useful details. Would you like to add anything else, or create your appointment brief now?';
}

export function prepareBrief(details, messages = [], documentText = '') {
  const notes = messages.filter(m => m.role === 'user').map(m => clean(m.text));
  const main = clean(details.concern) || notes[0] || 'Main concern not yet specified';
  const sources = retrieve([main, details.symptoms, details.context, documentText].join(' '));
  const questions = [
    'Which details of my symptoms or timeline would be most useful for you?',
    'What possible next steps should we discuss?',
    'Are any tests or follow-up appointments worth considering?',
    'What changes should prompt me to contact your office again?',
  ];
  if (details.goals?.trim()) questions.unshift(`Could we talk about my main goal: ${clean(details.goals)}?`);
  return {
    title: 'Appointment preparation brief',
    main,
    symptoms: splitLines(details.symptoms),
    timeline: clean(details.timeline),
    context: clean(details.context),
    goals: clean(details.goals),
    intakeNotes: notes,
    documentExcerpt: clean(documentText).slice(0, 750),
    questions: questions.slice(0, 6),
    checklist: ['Bring a list of medicines and supplements', 'Confirm the appointment location and time', 'Bring any relevant reports or test results', 'Write down the most important questions'],
    sources: sources.map(({ id, title, url, description, topic }) => ({ id, title, url, description, topic })),
    mode: 'demo',
  };
}

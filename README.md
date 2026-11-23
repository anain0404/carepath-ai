# CarePath AI

**A patient-first doctor visit companion built with React, JavaScript, and FastAPI.**

CarePath AI helps patients organize information before an appointment, capture clinician-provided notes during a visit, and manage their follow-up plan afterward. I built this project to explore how AI-assisted workflows and thoughtful product design can make healthcare appointments easier to navigate.

## Live demo

[Try CarePath AI](https://anain0404.github.io/carepath-ai/)

The public demo runs in the browser and does not send requests to an AI model. A separate local FastAPI backend enables optional model-generated intake questions. The demo includes fictional sample information.

## Features

### Before the appointment

- Create and review appointments with dates, clinicians, and locations
- Organize symptoms, concerns, and timelines
- Add questions and mark them as discussed during the visit
- Use an adaptive, rule-based conversation to explore what to ask
- Optionally connect the local AI backend for generated follow-up questions
- Import TXT notes, with PDF text extraction available through the backend

### During the appointment

- Capture key points from the conversation
- Enter instructions directly from the clinician
- Track questions that were answered
- Record the follow-up plan and who entered the notes
- Download a visit summary for review or sharing

### After the appointment

- Create and complete follow-up tasks
- Maintain a list of medications and recorded prescription instructions
- Set daily reminder times based on an existing prescription
- Mark scheduled medications as taken or skipped
- Use browser notifications while the application is open
- Export 30 days of medication reminders as an `.ics` calendar file
- Review visits in a timeline and export workspace data

## Technology

| Technology | Purpose |
| --- | --- |
| React | Multi-stage patient workspace and interactive components |
| JavaScript | Visit, medication, reminder, and follow-up logic |
| Vite | Local development and production builds |
| CSS | Responsive interface |
| FastAPI | Optional backend for AI intake and PDF extraction |
| OpenAI API | Optional contextual follow-up questions in local AI mode |
| MedlinePlus | Links to public patient health resources |

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173/carepath-ai/`.

Use **Explore fictional example** to load a sample visit, medication entry, and follow-up checklist.

Run the tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

### Optional AI backend

The browser demo works without a backend. To enable contextual model-generated intake follow-ups, start the Python API in another terminal.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Create a `.env` file in the root directory with an API key:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Then run:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

In CarePath, open **Before the visit** and turn on **Use local AI backend**. The backend should be running at `http://127.0.0.1:8000`.

Never put API keys in the frontend or commit `.env` to GitHub.

## Reminders and data storage

In-browser medication alerts are **not background notifications**. They are only checked while the application is open, and browser notification permissions must be enabled. Calendar export generates recurring reminders for up to 30 days. The calendar application determines whether those reminders trigger on a device.

Information is stored in React state for the current session by default. Users can optionally enable unencrypted local browser storage or export their workspace as JSON. The public demo does not include authentication, encrypted medical records, or secure patient-provider messaging. Use fictional information when testing or demonstrating it.

Medication entries and clinician notes are user-entered and are not clinically verified. CarePath does not recommend doses, interpret test results, check drug interactions, or tell users how to handle missed doses.

## Project structure

```text
carepath-ai/
├── index.html
├── src/
│   ├── main.jsx
│   ├── styles.css
│   ├── logic.js
│   └── visit.js
├── backend/
│   ├── main.py
│   ├── resources.py
│   ├── requirements.txt
│   └── test_api.py
├── tests/
│   ├── logic.test.js
│   └── visit.test.js
├── .github/workflows/deploy.yml
├── package.json
├── vite.config.js
└── README.md
```

## Future improvements

- Secure patient accounts with access controls
- Doctor and patient roles with authenticated note approval
- Encrypted document storage and user-controlled sharing
- Reliable scheduled push notifications through a deployed service
- FHIR integration in a synthetic-data sandbox
- Evaluation of extraction accuracy, source citations, and follow-up quality

## About this project

I wanted to build more than a healthcare chatbot. A doctor's visit involves preparation, conversations, instructions, and follow-up tasks that often end up scattered across notes and messages. CarePath brings those steps into a single workflow and gives users practical outputs they can review and take with them.

## Author

**Anvesha Nain**

[Portfolio](https://anain0404.github.io/anvesha-portfolio/) | [GitHub](https://github.com/anain0404) | [LinkedIn](https://www.linkedin.com/in/anvesha-nain-a14033223/)

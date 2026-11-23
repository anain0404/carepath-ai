
# CarePath AI

**A doctor visit companion that helps patients prepare, stay organized, and manage their care after an appointment.**

[**Live Demo**](https://anain0404.github.io/carepath-ai/) | [**Portfolio**](https://anain0404.github.io/anvesha-portfolio/)

## Overview

A doctor's appointment doesn't start when you enter the clinic or end when you leave. Patients often need to organize their concerns beforehand, remember what their clinician said, understand their prescriptions, and keep track of follow-up tasks.

I built **CarePath AI** to bring these steps into one application. Instead of focusing only on a healthcare chatbot, the project uses a connected before, during, and after appointment workflow to help patients manage information throughout their visit.

The application combines an interactive React workspace, medication and follow-up tracking, document handling, and an optional AI-powered intake assistant.

## Features

### Before the Visit: Prepare with Confidence

- Create appointments with dates, clinicians, and locations.
- Organize symptoms, concerns, and timelines.
- Prepare questions for the clinician.
- Use an adaptive, rule-based conversation to identify useful follow-up questions.
- Import text notes and optionally extract information from PDFs using the backend.
- Enable the local AI backend for contextual, model-generated intake questions.

### During the Visit: Capture What Matters

- Record key discussion points and clinician-provided instructions.
- Track which questions were answered.
- Document follow-up plans and who entered the notes.
- Generate and download a visit summary.

### After the Visit: Stay on Track

- Create and complete follow-up tasks.
- Organize medications and prescription instructions entered by the user.
- Schedule daily medication reminders.
- Mark medications as taken or skipped.
- Receive browser notifications while the application is open.
- Export 30 days of reminders to a calendar using `.ics` files.
- Review previous visits through a timeline.
- Export workspace information as JSON.

## Live Demo

**[Try CarePath AI](https://anain0404.github.io/carepath-ai/)**

The deployed version is a browser-based demonstration. Select **Explore fictional example** to see a sample appointment, medication schedule, and follow-up plan.

The public demo uses rule-based conversational follow-ups and does not connect to an AI model. Contextual AI-generated questions are available through the optional local FastAPI backend.

## Tech Stack

| Technology | How It's Used |
| --- | --- |
| React | Interactive patient workspace and visit management |
| JavaScript | Appointment, medication, reminder, and follow-up logic |
| Vite | Frontend development and production builds |
| CSS | Responsive interface and component styling |
| Python & FastAPI | Optional AI backend and PDF text extraction |
| OpenAI API | Contextual follow-up questions in local AI mode |
| MedlinePlus | Links to trusted patient health resources |
| GitHub Actions | Automated frontend deployment to GitHub Pages |

## How It Works

CarePath organizes a doctor's appointment into three connected stages:

**Prepare → Document → Follow Up**

Users start by organizing symptoms, questions, and relevant information. During the appointment, they can record clinician-provided notes and instructions. Afterward, they can turn those instructions into follow-up tasks, organize their prescribed medications, and schedule reminders.

The goal is to preserve useful information across the appointment rather than treating every interaction as a separate chatbot conversation.

## Getting Started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open the local development URL printed by Vite, normally `http://localhost:5173/carepath-ai/`.

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

### Optional AI Backend

The frontend works independently. To enable contextual AI-generated intake questions, configure the Python backend.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Create a `.env` file in the project root:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Start the backend:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

In the application, open **Before the visit** and enable **Use local AI backend**.

The API runs at `http://127.0.0.1:8000`.

Never commit API keys or `.env` files to GitHub.

## Privacy, Safety, and Limitations

CarePath AI is an educational prototype, not a medical device or a replacement for professional medical advice.

- The public demo uses fictional sample information.
- The application does not diagnose conditions, prescribe medication, recommend dosages, or verify clinician instructions.
- Medication information is entered by the user and is not clinically validated.
- Browser notifications are checked only while the application is open. Calendar reminders depend on the user's calendar application.
- Information is held in session state by default. Optional local browser storage is unencrypted.
- The public demo does not include authenticated patient accounts, encrypted medical record storage, or secure clinician messaging.

Do not use real patient information when testing or demonstrating the application.

## Future Improvements

- Secure patient accounts and authenticated clinician roles.
- Encrypted storage and user-controlled medical record sharing.
- Reliable background medication reminders.
- Synthetic-data FHIR integration for healthcare interoperability.
- AI-generated, source-backed explanations of clinician-provided instructions.
- Evaluation of document extraction accuracy, retrieval quality, and AI-generated follow-up questions.

## Project Structure

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

## Author

**Anvesha Nain**

Computer Science, Purdue University

[Portfolio](https://anain0404.github.io/anvesha-portfolio/) | [GitHub](https://github.com/anain0404) | [LinkedIn](https://www.linkedin.com/in/anvesha-nain-a14033223/)

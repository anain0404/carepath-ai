import re

RESOURCES = [
    {
        "id": "visit",
        "title": "Make the most of your doctor visit",
        "topic": "Preparing for care",
        "description": "Questions and preparation ideas for a healthcare appointment.",
        "url": "https://medlineplus.gov/ency/patientinstructions/000860.htm",
        "terms": ["visit", "appointment", "doctor", "questions", "concern", "symptoms", "follow", "care"],
    },
    {
        "id": "tests",
        "title": "Medical tests",
        "topic": "Understanding tests",
        "description": "Overview of why tests may be ordered and the kinds of information they provide.",
        "url": "https://medlineplus.gov/lab-tests/",
        "terms": ["blood", "test", "lab", "results", "screening", "urine", "report"],
    },
    {
        "id": "topics",
        "title": "Health topics",
        "topic": "Explore health information",
        "description": "Browse health topics from the National Library of Medicine.",
        "url": "https://medlineplus.gov/healthtopics.html",
        "terms": ["health", "condition", "symptoms", "fatigue", "sleep", "headache", "pain", "dizziness"],
    },
    {
        "id": "laboratory",
        "title": "Laboratory tests",
        "topic": "Understanding lab work",
        "description": "Background on laboratory testing and samples.",
        "url": "https://medlineplus.gov/laboratorytests.html",
        "terms": ["blood", "lab", "laboratory", "urine", "sample", "result", "test"],
    },
    {
        "id": "blood",
        "title": "What you need to know about blood testing",
        "topic": "Blood testing",
        "description": "Background on procedures and preparation for blood tests.",
        "url": "https://medlineplus.gov/lab-tests/what-you-need-to-know-about-blood-testing/",
        "terms": ["blood", "fasting", "lab", "draw", "needle", "cbc", "results"],
    },
]


def retrieve(query: str, limit: int = 3):
    words = set(re.findall(r"[a-z]{3,}", query.lower()))
    ranked = sorted(RESOURCES, key=lambda r: sum(2 for term in r["terms"] if term in words), reverse=True)
    return [{key: value for key, value in resource.items() if key != "terms"} for resource in ranked[:limit]]

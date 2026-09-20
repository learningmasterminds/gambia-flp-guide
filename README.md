# Gambia FLP — Interactive Teacher Guide Mini App

Digital interactive Teacher Guide for ECD 2, ECD 3 and Grade 1 (Term 1) in all eight Gambian languages of instruction, developed for the **Gambia Foundational Learning Programme (FLP)** in partnership with **MoBSE**, the **World Bank**, and **Learning Masterminds**.

## Features
- **30-Minute Classroom Timer**: Pacing alerts and reminders for teachers during instructional routines.
- **Structured 5-Day Weekly Cadence**: Weeks 1 to 10 with themes, daily outcomes, step-by-step scripts (*Say:* dialogues in the language of instruction), and fine motor exercises.
- **Grade 1 Sessions**: the seven national-language Grade 1 guides run two 30-minute sessions a day (A: phonics / pre-reading, B: read-aloud / vocabulary), switched with a Session A / B toggle; Grade 1 English is a single 60-minute oral-English lesson. Data: `data/<lang>_grade1_term1.json` (built by `../extract_grade1_all_languages.py`).
- **Offline PWA & Telegram Mini App (TMA)**: Pre-caches curriculum content so rural teachers have 100% offline access.
- **Pedagogical AI Coach**: Context-aware guidance for remediation, letter sound pronunciation, and classroom routines.
- **Search Engine**: Instant lookup for letters, vocabulary words, songs, and story read-alouds.
- **Facilitator Guide** (`facilitator.html`, 🎓 in the header): the abridged Literacy Facilitator Guide (September 2026) for the *trainers* who deliver the ECD 2&3 / Grade 1 GNLOI teacher training — a 6-day agenda navigated Day → Session, each session a scripted sequence of facilitation blocks (Facilitator Focus, Whole Group Discussion, Reflect Together…) with Say / Do / Ask cues, a session timer, search and deep links (`facilitator.html?day=2&session=9`). Data: `data/facilitator_guide.json` (built by `../extract_facilitator_guide.py` from the `.docx`). Unlike the lesson data it is English-only and not tied to a language or grade.

## Live Deployment
- **GitHub Pages**: [https://learningmasterminds.github.io/gambia-flp-guide/](https://learningmasterminds.github.io/gambia-flp-guide/)
- **Telegram Bot**: `@gambiaflp_bot`

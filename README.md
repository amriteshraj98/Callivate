# Callivate 🎥🧪 — Remote Tech Interview Platform

> Streamline technical interviews with real-time video, structured evaluations, and flexible question management.

[🌐 Live Demo](https://callivate-blond.vercel.app)

---

## ✨ Features

- 📹 **Real-time interview rooms** — host 1:1 interviews with video and shared context.
- 🗃️ **Question bank & tagging** — create questions, tag by topic/difficulty, and reuse across rounds.
- 📊 **Rubrics & scorecards** — consistent, rubric-based assessment with notes and flags.
- 🔁 **Multi-round workflows** — plan rounds (DSA, System Design, Behavioral) and track progress.
- 🧑‍⚖️ **Interviewer tools** — timers, quick scoring, and private notes.
- 🧑‍🎓 **Candidate view** — distraction-free interface with clear prompts and instructions.
- 🔒 **Auth & roles (WIP)** — interviewer/candidate flows separated.
- ⚡ **Fast, modular Next.js app** — TypeScript-first, easy to extend.



---

## 🧱 Tech Stack

- **Next.js** (TypeScript, App Router)
- **Convex** (serverless data & functions)
- **CSS / PostCSS** (with `postcss.config.mjs`)
- Tooling: ESLint, `tsconfig.json`

---


## 🚀 Getting Started

### 1) Prerequisites
- **Node.js ≥ 18** (LTS recommended)
- **npm** or **pnpm**

### 2) Clone & Install
```bash
git clone https://github.com/amriteshraj98/Callivate.git
cd Callivate
npm install    # or: pnpm install


```
### 3) Environment Variables
Create a `.env.local` file in the root directory and add the following (replace with your actual keys):

```bash
# Example variables — adjust to match your Convex project and any auth providers
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_SECRET_KEY=

```
### 4) Run the App
```bash
npm run dev
# App will be available at http://localhost:3000






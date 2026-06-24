<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=36&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=750&lines=tech2;Build.+Ship.+Iterate." alt="Typing SVG" />
</div>

<div align="center">

A modern full-stack web application — React 19 + TypeScript frontend with a Python backend, powered by Google's Gemini AI

<br/>

![TypeScript](https://img.shields.io/badge/TypeScript-94.3%25-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.4%25-3776AB?style=flat-square&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Lovable](https://img.shields.io/badge/Built%20with-Lovable-FF6B9D?style=flat-square)

</div>

---

```
████████╗███████╗ ██████╗██╗  ██╗██████╗
╚══██╔══╝██╔════╝██╔════╝██║  ██║╚════██╗
   ██║   █████╗  ██║     ███████║ █████╔╝
   ██║   ██╔══╝  ██║     ██╔══██║██╔═══╝
   ██║   ███████╗╚██████╗██║  ██║███████╗
   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝
```

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)
- [Team](#-team)

---

## 🧠 Overview

**tech2** is a full-stack web application combining a blazing-fast React + TypeScript frontend with a Python backend. It integrates Google's Gemini AI SDK for intelligent features, and is built on a modern component architecture using shadcn/ui, TanStack Router, and Tailwind CSS v4.

The project is developed on the [Lovable](https://lovable.dev) platform — a collaborative AI-powered development environment that keeps your code and editor in sync.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### ⚡ Lightning-Fast Frontend
- React 19 with full TypeScript support
- Vite 6 dev server with HMR
- TanStack Router for type-safe navigation
- TanStack Query for seamless data fetching

</td>
<td width="50%">

### 🤖 AI-Powered
- Google Gemini AI integration (`@google/genai`)
- Intelligent, context-aware features
- Built for extensibility and future AI workflows

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Beautiful UI
- shadcn/ui + Radix UI component library
- Tailwind CSS v4 utility-first styling
- Fully accessible, composable components
- Lucide React icon set

</td>
<td width="50%">

### 🏗️ Solid Architecture
- Python backend in the `backend/` directory
- React Hook Form + Zod for bulletproof forms
- Recharts for data visualization
- Sonner for toast notifications

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

```
┌────────────────────────────────────────────────────────────────┐
│                            tech2                               │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│   Frontend   │   Backend    │     AI       │     Tooling       │
│  React + TS  │   Python     │ Google Gemini│ Vite + Bun + ESLint│
└──────────────┴──────────────┴──────────────┴───────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| 💻 Language | TypeScript 5 + Python 3.12 | Type-safe frontend, flexible backend |
| ⚛️ UI Framework | React 19 | Component-based user interface |
| ⚡ Build Tool | Vite 6 | Fast dev server, optimized production builds |
| 🎨 Styling | Tailwind CSS v4 | Utility-first, zero-config styling |
| 🧩 Components | shadcn/ui + Radix UI | Accessible, headless component primitives |
| 🔀 Routing | TanStack Router | Type-safe, file-based routing |
| 📡 Data Fetching | TanStack Query | Server state management & caching |
| 📋 Forms | React Hook Form + Zod | Performant forms with schema validation |
| 📊 Charts | Recharts | Composable data visualization |
| 🤖 AI | Google Generative AI | Gemini AI integration |
| 📦 Package Manager | Bun | Ultra-fast JS runtime & package manager |

---

## 🗂️ Project Structure

```
tech2/
├── 📁 src/                  # Frontend source (React / TypeScript)
├── 📁 backend/              # Python backend
├── 📁 attached_assets/      # Static assets
├── 📄 index.html            # App HTML entry point
├── 📄 main.py               # Python entry point
├── 📄 package.json          # Node dependencies & scripts
├── 📄 pyproject.toml        # Python project config (requires Python 3.12+)
├── 📄 vite.config.ts        # Vite configuration
├── 📄 tsconfig.json         # TypeScript configuration
├── 📄 components.json       # shadcn/ui component config
└── 📄 eslint.config.js      # ESLint configuration
```

---

## 🚀 Getting Started

### ✅ Prerequisites

- **Node.js 18+** or **[Bun](https://bun.sh/)** (recommended)
- **Python 3.12+**
- **Git**

### 📥 1. Clone the Repository

```bash
git clone https://github.com/takvir-tur/tech2.git
cd tech2
```

### 📦 2. Install Frontend Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 🧪 3. Start the Development Server

```bash
# Using Bun
bun run dev

# Using npm
npm run dev
```

The app will be available at **http://localhost:5173**

### 🏗️ 4. Build for Production

```bash
bun run build
# or
npm run build
```

### 👀 5. Preview Production Build

```bash
bun run preview
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the Vite development server |
| `bun run build` | Build the app for production |
| `bun run preview` | Locally preview the production build |
| `bun run lint` | Run ESLint across the project |
| `bun run format` | Format all files with Prettier |

---

## 👥 Team

<div align="center">

| 👤 | Name | Working Field |
|----|------|------|
| 🧑‍💻 | Abu Sayem Mohammed Tanvir | Frontend & UI/UX |
| 🧑‍💻 | Md. Takvir Hossain Tur | Data Scrapping |
| 🧑‍💻 | Md. Ashraf Hossain Chowdhury | Backend & Api |
| 🧑‍💻 | Lokonath Bosak Bijoy | Backend & Api |

</div>



<div align="center">

⭐ **Found this project useful? Give it a star!**

> *"Great software isn't just built — it's iterated into existence."*

</div>

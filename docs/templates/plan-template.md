# [Nama Fitur] Implementation Plan

> Mengadopsi prinsip TELOS (Target, Execution, Loop, Output, Standards) dan alur 3-Stage Agent Crew (Planner → Worker → Checker).

**Goal:** Ringkasan tujuan implementasi modul/fitur.  
**Specialists Involved:** `frontend-specialist`, `backend-specialist`, `qa-tester`  
**Target Branch:** `feat/[nama-fitur]`  

---

## 1. TELOS Intent Alignment

- **Current State (Kondisi Saat Ini):**
  - [Jelaskan apa yang belum ada / kekurangan arsitektur saat ini]
- **Ideal State (Target Selesai):**
  - [Jelaskan kondisi akhir yang diharapkan secara fungsional & performa]
- **Falsifiable Verification Criteria (Bukti Bebas Asumsi):**
  - [ ] 100% unit & integration test passing di runner lokal
  - [ ] Linting & Type check zero errors (`npm run lint`, `tsc --noEmit`)
  - [ ] Bukti laporan hasil pengujian terlampir pada komentar kartu NeoKanban

---

## 2. Global Constraints & Guardrails
- **Isolasi Git:** Seluruh pengerjaan wajib di branch `feat/[nama-fitur]`.
- **TDD Disiplin:** Siklus Red-Green-Refactor untuk setiap unit fungsi.
- **Pre-Flight Test Gatekeeper:** Wajib lulus test suite sebelum `npx tsx scripts/kanban.ts review <cardId>`.
- **Safe Review Gate:** Larangan Auto-Done. Perpindahan ke `Done` hanya oleh Human Reviewer.

---

## 3. Tasks Breakdown

### Task 1: [Judul Task 1]

**Agent:** `backend-specialist` (Worker) | **Checker:** `qa-tester`  
**Priority:** HIGH  

**Files:**
- Create: `src/...`
- Modify: `src/...`
- Test: `tests/...`

**Steps:**
- [ ] **Step 1: Write the failing unit test (RED)**
- [ ] **Step 2: Implement minimal solution (GREEN)**
- [ ] **Step 3: Refactor and optimize (REFACTOR)**
- [ ] **Step 4: Independent Checker verification & pre-flight test**

---

### Task 2: [Judul Task 2]

**Agent:** `frontend-specialist` (Worker) | **Checker:** `ux-ui-pro-max`  
**Priority:** HIGH  

**Files:**
- Create: `src/components/...`
- Modify: `src/pages/...`
- Test: `tests/...`

**Steps:**
- [ ] **Step 1: Write component specification & failing test (RED)**
- [ ] **Step 2: Implement UI layout matching token-design.json (GREEN)**
- [ ] **Step 3: Refactor styles, micro-interactions, WCAG AA compliance (REFACTOR)**
- [ ] **Step 4: Independent Checker verification & visual regression check**

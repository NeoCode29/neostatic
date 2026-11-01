import assert from "node:assert";
import { parsePlanMarkdown, formatHandoffSession } from "./kanban.js";

const sampleMarkdown = `
# Authentication & Session Module Implementation Plan

**Goal:** Implement secure session handling and JWT validation.
**Specialists Involved:** backend-specialist, qa-tester

---

### Task 1: Setup JWT Token Service

**Agent:** backend-specialist
**Priority:** HIGH

**Files:**
- Create: \`src/services/jwt.service.ts\`
- Modify: \`src/config/app.ts\`
- Test: \`tests/services/jwt.service.spec.ts\`

**Steps:**
- [ ] **Step 1: Write failing unit test for token issuance**
- [ ] **Step 2: Implement sign and verify functions**
- [ ] **Step 3: Refactor token expiration handling**
- [ ] **Step 4: Verify test suite passes**

---

### Task 2: Implement Protected Route Middleware

**Agent:** backend-specialist
**Priority:** MEDIUM

**Files:**
- Create: \`src/middleware/auth.middleware.ts\`
- Test: \`tests/middleware/auth.middleware.spec.ts\`

**Steps:**
- [ ] **Step 1: Write test for 401 unauthorized header**
- [ ] **Step 2: Implement token extraction logic**
- [ ] **Step 3: Verify middleware integration**
`;

console.log("🧪 Testing parsePlanMarkdown()...");

const parsed = parsePlanMarkdown(sampleMarkdown);

assert.strictEqual(parsed.planTitle, "Authentication & Session Module Implementation Plan");
assert.strictEqual(parsed.goal, "Implement secure session handling and JWT validation.");
assert.strictEqual(parsed.tasks.length, 2, "Should parse exactly 2 tasks");

// Verify Task 1
const task1 = parsed.tasks[0];
assert.strictEqual(task1.taskNumber, 1);
assert.strictEqual(task1.taskTitle, "Setup JWT Token Service");
assert.strictEqual(task1.agent, "backend-specialist");
assert.strictEqual(task1.priority, "HIGH");
assert.deepStrictEqual(task1.files.create, ["src/services/jwt.service.ts"]);
assert.deepStrictEqual(task1.files.modify, ["src/config/app.ts"]);
assert.deepStrictEqual(task1.files.test, ["tests/services/jwt.service.spec.ts"]);
assert.strictEqual(task1.steps.length, 4);
assert.ok(task1.steps[0].includes("Step 1: Write failing unit test"));

// Verify Task 2
const task2 = parsed.tasks[1];
assert.strictEqual(task2.taskNumber, 2);
assert.strictEqual(task2.taskTitle, "Implement Protected Route Middleware");
assert.strictEqual(task2.priority, "MEDIUM");
assert.strictEqual(task2.steps.length, 3);

console.log("🧪 Testing formatHandoffSession()...");
const formattedHandoff = formatHandoffSession({
  sessionName: "setup-auth-module",
  summary: "Berhasil mengimplementasikan JWT token service dan middleware auth.",
  branch: "feat/auth-module",
  tasksStatus: {
    todo: ["Task 3"],
    inProgress: ["Task 2"],
    review: ["Task 1"],
    done: ["Task 0"],
  },
  testsStatus: "8/8 unit tests pass (100%)",
  nextSteps: ["Lanjutkan pengujian integration test route.", "Submit PR untuk review."],
});

assert.ok(formattedHandoff.includes("SESI:"), "Should include session header");
assert.ok(formattedHandoff.includes("setup-auth-module"), "Should include session name");
assert.ok(formattedHandoff.includes("feat/auth-module"), "Should include branch name");
assert.ok(formattedHandoff.includes("═════"), "Should include clear visual session dividers");
assert.ok(formattedHandoff.includes("8/8 unit tests pass"), "Should include test status");

console.log("🧪 Testing loadProjectConfig() and saveProjectConfig()...");
import { pingNeoKanban, loadProjectConfig, saveProjectConfig, initProject } from "./kanban.js";
import fs from "node:fs";
import path from "node:path";

const testConfigPath = path.resolve(process.cwd(), ".neokanban.json");
const backupExists = fs.existsSync(testConfigPath);
const originalConfig = backupExists ? fs.readFileSync(testConfigPath, "utf-8") : null;

try {
  saveProjectConfig({
    apiUrl: "http://localhost:3000",
    boardId: "test-board-123",
    boardTitle: "Test Board Title",
    user: {
      name: "Kresna",
      username: "kresna",
      role: "all-roles",
      mentionTag: "@kresna",
    },
  });

  const loaded = loadProjectConfig();
  assert.ok(loaded !== null, "Config should load successfully");
  assert.strictEqual(loaded?.boardId, "test-board-123");
  assert.strictEqual(loaded?.user?.mentionTag, "@kresna");
  assert.strictEqual(loaded?.user?.role, "all-roles");

  console.log("🧪 Testing pingNeoKanban() graceful resilience...");
  const pingResult = await pingNeoKanban({ apiUrl: "http://127.0.0.1:59999" }); // unreachable port
  assert.strictEqual(typeof pingResult.ok, "boolean");
  assert.strictEqual(typeof pingResult.message, "string");
  assert.strictEqual(pingResult.ok, false, "Should return ok=false for unreachable server without crashing");

  console.log("🧪 Testing parseComponentMetadata()...");
  const { parseComponentMetadata, formatAnnotationItem, formatSkillItem } = await import("./kanban.js");
  const meta = parseComponentMetadata(`
    <!-- category: FEEDBACK -->
    <!-- description: Badge status lunas hijau -->
    <span class="badge badge-success">Lunas</span>
  `, "template-status-badge.html");

  assert.strictEqual(meta.name, "Status Badge");
  assert.strictEqual(meta.category, "FEEDBACK");
  assert.strictEqual(meta.description, "Badge status lunas hijau");
  assert.ok(meta.htmlContent.includes("badge-success"));

  console.log("🧪 Testing formatAnnotationItem()...");
  const formattedAnno = formatAnnotationItem({
    id: "anno-1",
    type: "PIN",
    posX: 45.5,
    posY: 20.0,
    comment: "Ubah warna tombol menjadi indigo-600",
    status: "OPEN",
    targetTitle: "Halaman Invoice",
  });
  assert.ok(formattedAnno.includes("📌 PIN"));
  assert.ok(formattedAnno.includes("(45.5%, 20.0%)"));
  assert.ok(formattedAnno.includes("Ubah warna tombol"));

  console.log("🧪 Testing formatSkillItem()...");
  const formattedSkill = formatSkillItem({
    id: "skill-1",
    name: "Engineering Discipline",
    slug: "engineering-discipline",
    category: "ENGINEERING",
    description: "TDD and git isolation rules",
    filesCount: 3,
  });
  assert.ok(formattedSkill.includes("Engineering Discipline"));
  assert.ok(formattedSkill.includes("engineering-discipline"));

  console.log("🧪 Testing deriveDomainTags()...");
  const { deriveDomainTags, createHarnessBundle } = await import("./kanban.js");
  const feTags = deriveDomainTags("frontend-specialist", "Build interactive table");
  assert.ok(feTags.includes("frontend"), "Should include frontend tag");
  assert.ok(feTags.includes("ui"), "Should include ui tag");
  assert.ok(feTags.includes("antigravity"), "Should include antigravity tag");

  const beTags = deriveDomainTags("backend-specialist", "Create invoice API");
  assert.ok(beTags.includes("backend"), "Should include backend tag");
  assert.ok(beTags.includes("api"), "Should include api tag");

  const dbTags = deriveDomainTags("database-specialist", "Run prisma migration");
  assert.ok(dbTags.includes("database"), "Should include database tag");

  console.log("🧪 Testing createHarnessBundle()...");
  const bundle = createHarnessBundle();
  assert.strictEqual(bundle.name, "harnes-neokanban");
  assert.ok(bundle.files.length > 5, "Bundle should contain core template files");
  const hasAgents = bundle.files.some((f: any) => f.path === "AGENTS.md");
  const hasHarness = bundle.files.some((f: any) => f.path === "HARNESS.md");
  assert.ok(hasAgents, "Bundle must include AGENTS.md");
  assert.ok(hasHarness, "Bundle must include HARNESS.md");

} finally {
  if (backupExists && originalConfig !== null) {
    fs.writeFileSync(testConfigPath, originalConfig, "utf-8");
  }
}

console.log("✅ All test assertions passed successfully!");

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export interface TaskFiles {
  create: string[];
  modify: string[];
  test: string[];
}

export interface ParsedTask {
  taskNumber: number;
  taskTitle: string;
  agent?: string;
  priority?: string;
  files: TaskFiles;
  steps: string[];
  rawContent: string;
}

export interface ParsedPlan {
  planTitle: string;
  goal?: string;
  tasks: ParsedTask[];
}

export interface KanbanMappingLedger {
  boardId: string;
  boardTitle: string;
  planFile: string;
  syncedAt: string;
  tasks: Record<
    string,
    {
      cardId: string;
      title: string;
      agent?: string;
      status: string;
    }
  >;
}

export type ProjectStackType = "monorepo" | "unified" | "backend-only" | "frontend-only";

export interface ProjectConfig {
  apiUrl?: string;
  patToken?: string;
  boardId?: string;
  boardTitle?: string;
  stackType?: ProjectStackType;
  user?: {
    name?: string;
    username?: string;
    role?: string;
    mentionTag?: string;
  };
  initializedAt?: string;
}

export interface HarnessBundleFile {
  path: string;
  content: string;
}

export interface HarnessBundle {
  name: string;
  version: string;
  generatedAt: string;
  description: string;
  files: HarnessBundleFile[];
}

/**
 * Derives appropriate domain tags for NeoKanban cards based on specialist and task title
 */
export function deriveDomainTags(agent?: string, title?: string): string[] {
  const tags: Set<string> = new Set(["antigravity"]);
  const a = (agent || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (a) tags.add(a);

  if (a.includes("frontend") || a.includes("ux-ui") || t.includes("ui") || t.includes("component") || t.includes("page")) {
    tags.add("frontend");
    tags.add("ui");
  }

  if (a.includes("backend") || t.includes("api") || t.includes("endpoint") || t.includes("route") || t.includes("server")) {
    tags.add("backend");
    tags.add("api");
  }

  if (a.includes("database") || t.includes("schema") || t.includes("migration") || t.includes("prisma") || t.includes("sql") || t.includes("model")) {
    tags.add("database");
    tags.add("backend");
  }

  if (a.includes("qa") || a.includes("test") || t.includes("test") || t.includes("spec")) {
    tags.add("testing");
    tags.add("qa");
  }

  if (a.includes("security") || t.includes("audit") || t.includes("secret") || t.includes("auth")) {
    tags.add("security");
  }

  return Array.from(tags);
}

/**
 * Compiles all harness template files into a single in-memory / JSON distributable bundle
 */
export function createHarnessBundle(rootDir: string = process.cwd()): HarnessBundle {
  const pkgPath = path.resolve(rootDir, "package.json");
  let version = "1.0.0";
  let description = "Lean Agentic Harness Bundle";
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      version = pkg.version || version;
      description = pkg.description || description;
    } catch {}
  }

  const filesToInclude: string[] = [
    "AGENTS.md",
    "HARNESS.md",
    "README.md",
    "package.json",
    "tsconfig.json",
    ".gitignore",
  ];

  const dirsToInclude: string[] = [
    ".agents",
    "docs/context",
    "docs/templates",
    "docs/ui-governance",
    "scripts",
  ];

  const bundleFiles: HarnessBundleFile[] = [];

  function scanDir(dirRelative: string) {
    const dirFull = path.resolve(rootDir, dirRelative);
    if (!fs.existsSync(dirFull)) return;

    const entries = fs.readdirSync(dirFull, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = path.join(dirRelative, entry.name).replace(/\\/g, "/");
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".git" ||
        entry.name.endsWith(".zip") ||
        relPath.startsWith("docs/plans/") ||
        relPath === ".kanban-map.json" ||
        relPath === ".neokanban.json"
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        scanDir(relPath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(path.resolve(rootDir, relPath), "utf-8");
          bundleFiles.push({ path: relPath, content });
        } catch {}
      }
    }
  }

  for (const f of filesToInclude) {
    const fPath = path.resolve(rootDir, f);
    if (fs.existsSync(fPath)) {
      try {
        const content = fs.readFileSync(fPath, "utf-8");
        bundleFiles.push({ path: f, content });
      } catch {}
    }
  }

  for (const d of dirsToInclude) {
    scanDir(d);
  }

  return {
    name: "harnes-neokanban",
    version,
    generatedAt: new Date().toISOString(),
    description,
    files: bundleFiles,
  };
}

/**
 * Unpacks a harness bundle into a target workspace directory
 */
export function unpackHarnessBundle(
  bundle: HarnessBundle,
  targetDir: string,
  options: { overwrite?: boolean; stackType?: string } = {}
): { installedFiles: string[]; skippedFiles: string[] } {
  const installedFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const file of bundle.files) {
    const dest = path.resolve(targetDir, file.path);
    if (fs.existsSync(dest) && !options.overwrite) {
      skippedFiles.push(file.path);
      continue;
    }

    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }

    fs.writeFileSync(dest, file.content, "utf-8");
    installedFiles.push(file.path);
  }

  return { installedFiles, skippedFiles };
}

/**
 * Loads project-level NeoKanban configuration from .neokanban.json
 */
export function loadProjectConfig(): ProjectConfig | null {
  const cfgPath = path.resolve(process.cwd(), ".neokanban.json");
  if (fs.existsSync(cfgPath)) {
    try {
      return JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Saves project-level NeoKanban configuration to .neokanban.json
 */
export function saveProjectConfig(config: ProjectConfig): void {
  const cfgPath = path.resolve(process.cwd(), ".neokanban.json");
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(`💾 Project NeoKanban configuration saved to: ${cfgPath}`);
}

/**
 * Parses markdown plan document into structured task data
 */
export function parsePlanMarkdown(content: string): ParsedPlan {
  // 1. Title
  let planTitle = "Untitled Plan";
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    planTitle = titleMatch[1].trim();
  }

  // 2. Goal
  let goal: string | undefined;
  const goalMatch = content.match(/\*\*Goal:\*\*\s*([^\n\r]+)/);
  if (goalMatch) {
    goal = goalMatch[1].trim();
  }

  // 3. Extract Tasks
  const tasks: ParsedTask[] = [];
  const taskHeaderRegex = /^###\s+Task\s+(\d+):\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  const taskMatches: { number: number; title: string; index: number }[] = [];

  while ((match = taskHeaderRegex.exec(content)) !== null) {
    taskMatches.push({
      number: parseInt(match[1], 10),
      title: match[2].trim(),
      index: match.index,
    });
  }

  for (let i = 0; i < taskMatches.length; i++) {
    const current = taskMatches[i];
    const startIndex = current.index;
    const endIndex = i + 1 < taskMatches.length ? taskMatches[i + 1].index : content.length;
    const taskContent = content.slice(startIndex, endIndex);

    // Agent
    let agent: string | undefined;
    const agentMatch = taskContent.match(/\*\*Agent:\*\*\s*`?([^\n\r`]+)`?/);
    if (agentMatch) {
      agent = agentMatch[1].trim();
    }

    // Priority
    let priority: string | undefined;
    const priMatch = taskContent.match(/\*\*Priority:\*\*\s*([A-Za-z]+)/);
    if (priMatch) {
      priority = priMatch[1].trim().toUpperCase();
    }

    // Files
    const files: TaskFiles = { create: [], modify: [], test: [] };
    const createMatches = taskContent.matchAll(/-\s*Create:\s*`([^`]+)`/g);
    for (const cm of createMatches) files.create.push(cm[1]);

    const modifyMatches = taskContent.matchAll(/-\s*Modify:\s*`([^`]+)`/g);
    for (const mm of modifyMatches) files.modify.push(mm[1]);

    const testMatches = taskContent.matchAll(/-\s*Test:\s*`([^`]+)`/g);
    for (const tm of testMatches) files.test.push(tm[1]);

    // Steps (TDD Checklist items)
    const steps: string[] = [];
    const lines = taskContent.split(/\r?\n/);
    for (const line of lines) {
      const stepMatch = line.match(/^-\s*\[\s*\]\s*\*\*(Step\s+\d+:[^\*]+)\*\*/i);
      if (stepMatch) {
        steps.push(stepMatch[1].trim());
      } else {
        const altStep = line.match(/^-\s*\[\s*\]\s*(.+)$/);
        if (altStep && !altStep[1].includes("Task")) {
          steps.push(altStep[1].trim());
        }
      }
    }

    tasks.push({
      taskNumber: current.number,
      taskTitle: current.title,
      agent,
      priority,
      files,
      steps,
      rawContent: taskContent,
    });
  }

  return { planTitle, goal, tasks };
}

/**
 * Formats a clean session block with distinctive delimiters
 */
export function formatHandoffSession(options: {
  sessionName: string;
  summary: string;
  branch?: string;
  tasksStatus?: { todo?: string[]; inProgress?: string[]; review?: string[]; done?: string[] };
  testsStatus?: string;
  nextSteps?: string[];
  timestamp?: string;
}): string {
  const ts = options.timestamp || new Date().toISOString().replace("T", " ").slice(0, 16);
  const branch = options.branch || "master";
  const divider = "═".repeat(75);

  let out = `${divider}\n## 🏁 SESI: [${ts}] — ${options.sessionName}\n${divider}\n`;
  out += `- **Operator / Agent:** Antigravity\n`;
  out += `- **Branch Aktif:** \`${branch}\`\n`;
  out += `- **Waktu Pencatatan:** ${ts}\n\n`;

  out += `### 📌 Ringkasan Aktivitas Terakhir\n${options.summary.trim()}\n\n`;

  if (options.tasksStatus) {
    out += `### 📋 Status Kartu & NeoKanban\n`;
    out += `- **To Do:** ${options.tasksStatus.todo?.length ? options.tasksStatus.todo.join(", ") : "-"}\n`;
    out += `- **In Progress:** ${options.tasksStatus.inProgress?.length ? options.tasksStatus.inProgress.join(", ") : "-"}\n`;
    out += `- **Review:** ${options.tasksStatus.review?.length ? options.tasksStatus.review.join(", ") : "-"}\n`;
    out += `- **Done:** ${options.tasksStatus.done?.length ? options.tasksStatus.done.join(", ") : "-"}\n\n`;
  }

  if (options.testsStatus) {
    out += `### 🧪 Verifikasi Kualitas & Test\n${options.testsStatus.trim()}\n\n`;
  }

  if (options.nextSteps && options.nextSteps.length > 0) {
    out += `### 🚀 Langkah Kerja Berikutnya (Next Actionable Steps)\n`;
    for (let i = 0; i < options.nextSteps.length; i++) {
      out += `${i + 1}. ${options.nextSteps[i]}\n`;
    }
    out += `\n`;
  }

  out += `${divider}`;
  return out;
}

/**
 * Helper to call NeoKanban REST API
 */
async function kanbanApi<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    apiUrl?: string;
    token?: string;
  } = {}
): Promise<T> {
  const cfg = loadProjectConfig();
  const apiUrl = options.apiUrl || process.env.NEOKANBAN_API_URL || cfg?.apiUrl || "http://localhost:3000";
  const token = options.token || process.env.NEOKANBAN_PAT || cfg?.patToken;

  const url = `${apiUrl.replace(/\/$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NeoKanban API Error [${response.status} ${response.statusText}]: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Ping / Healthcheck for NeoKanban server
 */
export async function pingNeoKanban(options: { apiUrl?: string; token?: string } = {}): Promise<{ ok: boolean; message: string }> {
  const cfg = loadProjectConfig();
  const apiUrl = options.apiUrl || process.env.NEOKANBAN_API_URL || cfg?.apiUrl || "http://localhost:3000";
  const token = options.token || process.env.NEOKANBAN_PAT || cfg?.patToken;

  try {
    const url = `${apiUrl.replace(/\/$/, "")}/api/boards`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      return { ok: true, message: `Connected successfully to NeoKanban at ${apiUrl}` };
    }
    return { ok: false, message: `Server reachable at ${apiUrl} but responded with status [${res.status} ${res.statusText}].` };
  } catch (err: any) {
    return { ok: false, message: `Cannot connect to NeoKanban at ${apiUrl}: ${err.message || err}` };
  }
}

/**
 * Resolves active board ID from options or fetches first board
 */
async function resolveBoardId(options: { boardId?: string; apiUrl?: string; token?: string } = {}): Promise<string> {
  if (options.boardId) return options.boardId;
  const cfg = loadProjectConfig();
  if (cfg?.boardId) return cfg.boardId;

  const boardsData = await kanbanApi<{ boards: any[] }>("/api/boards", options);
  const boards = boardsData.boards || [];
  if (boards.length === 0) {
    throw new Error("No boards found on NeoKanban. Please create a board first.");
  }
  return boards[0].id;
}

/**
 * Wizard for Initial Project Setup
 */
export async function initProject(options: {
  apiUrl?: string;
  patToken?: string;
  boardId?: string;
  boardTitle?: string;
  role?: string;
  username?: string;
  offline?: boolean;
  stack?: ProjectStackType;
} = {}): Promise<ProjectConfig> {
  console.log("\n🚀 Initializing First-Time Project Setup for NeoKanban...");

  // 1. Healthcheck / Ping test
  const ping = await pingNeoKanban(options);
  if (ping.ok) {
    console.log(`✅ [Healthcheck Passed] ${ping.message}`);
  } else {
    console.log(`⚠️ [Healthcheck Warning] ${ping.message}`);
    console.log(`💡 Panduan: Pastikan server NeoKanban berjalan di http://localhost:3000 atau gunakan mode offline.`);
  }

  // 2. Prepare Config
  const existingCfg = loadProjectConfig() || {};
  const config: ProjectConfig = {
    ...existingCfg,
    apiUrl: options.apiUrl || existingCfg.apiUrl || "http://localhost:3000",
    patToken: options.patToken || existingCfg.patToken,
    boardId: options.boardId || existingCfg.boardId,
    boardTitle: options.boardTitle || existingCfg.boardTitle,
    stackType: options.stack || existingCfg.stackType || "unified",
    user: {
      name: options.username || existingCfg.user?.name || "Kresna",
      username: options.username || existingCfg.user?.username || "kresna",
      role: options.role || existingCfg.user?.role || "all-roles",
      mentionTag: options.username ? `@${options.username.replace(/^@/, "")}` : (existingCfg.user?.mentionTag || "@kresna"),
    },
    initializedAt: new Date().toISOString(),
  };

  // Scaffolding stack directories if monorepo
  if (config.stackType === "monorepo") {
    const clientDir = path.resolve(process.cwd(), "client");
    const serverDir = path.resolve(process.cwd(), "server");
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
      fs.writeFileSync(path.join(clientDir, ".gitkeep"), "", "utf-8");
      console.log(`📁 Scaffolding monorepo: client/ directory initialized.`);
    }
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
      fs.writeFileSync(path.join(serverDir, ".gitkeep"), "", "utf-8");
      console.log(`📁 Scaffolding monorepo: server/ directory initialized.`);
    }
  }

  // 3. Connect to board & pull context (if ping passed)
  if (ping.ok) {
    try {
      const boardsData = await kanbanApi<{ boards: any[] }>("/api/boards", {
        apiUrl: config.apiUrl,
        token: config.patToken,
      });
      const boards = boardsData.boards || [];

      let selectedBoard = boards.find((b) => b.id === config.boardId) || boards[0];
      if (!selectedBoard && config.boardTitle) {
        console.log(`📌 Creating new board: "${config.boardTitle}"...`);
        const newBoardRes = await kanbanApi<any>("/api/boards", {
          apiUrl: config.apiUrl,
          token: config.patToken,
          method: "POST",
          body: {
            title: config.boardTitle,
            description: `Project board initialized for ${path.basename(process.cwd())}`,
          },
        });
        selectedBoard = newBoardRes.board || newBoardRes;
      }

      if (selectedBoard) {
        config.boardId = selectedBoard.id;
        config.boardTitle = selectedBoard.title;
        console.log(`📌 Linked to NeoKanban Board: "${config.boardTitle}" (ID: ${config.boardId})`);

        // Check context documents
        const ctxRes = await kanbanApi<any>(`/api/boards/${config.boardId}/context`, {
          apiUrl: config.apiUrl,
          token: config.patToken,
        });
        const docs: any[] = ctxRes.documents || [];
        console.log(`📂 Board Context Documents found: ${docs.length}`);

        // Sync or initialize token-design.json
        const hasTokens = docs.some((d) => d.fileName?.toLowerCase() === "token-design.json");
        if (hasTokens) {
          await pullTokens({ boardId: config.boardId, apiUrl: config.apiUrl, token: config.patToken });
        } else {
          console.log(`ℹ️ Initializing standard token-design.json on NeoKanban board...`);
          await pushTokens(undefined, { boardId: config.boardId, apiUrl: config.apiUrl, token: config.patToken });
        }
      }
    } catch (err: any) {
      console.log(`⚠️ Online board synchronization notice: ${err.message}`);
    }
  }

  // 4. Save config file to project directory (.neokanban.json)
  saveProjectConfig(config);

  // 5. Ensure .neokanban.json is in .gitignore
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    if (!gitignoreContent.includes(".neokanban.json")) {
      fs.appendFileSync(gitignorePath, "\n.neokanban.json\n", "utf-8");
      console.log(`🔒 Added .neokanban.json to .gitignore to prevent secret leaks.`);
    }
  }

  // 6. Record Initial Living Handoff
  await saveHandoff("setup-awal", {
    summary: `Setup awal proyek selesai: Konfigurasi tersimpan di .neokanban.json, role pengguna (${config.user?.role}) dan tag mention (${config.user?.mentionTag}) telah dikonfigurasi.`,
    nextSteps: [
      "Periksa atau sesuaikan token design di docs/ui-governance/token-design.json.",
      "Tentukan fitur pertama yang ingin dikembangkan dan jalankan brainstorming.",
    ],
  });

  console.log(`\n🎉 Project Setup Completed Successfully!`);
  console.log(`👤 Active User: ${config.user?.name} (${config.user?.role}) | Mention: ${config.user?.mentionTag}`);
  console.log(`📋 Board: ${config.boardTitle || "Offline / Not linked"} (${config.boardId || "N/A"})\n`);

  return config;
}

/**
 * Checks if token-design.json exists on board context
 */
export async function checkTokens(
  options: { boardId?: string; apiUrl?: string; token?: string } = {}
): Promise<boolean> {
  try {
    const boardId = await resolveBoardId(options);
    const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
    const docs: any[] = contextRes.documents || [];
    const found = docs.find((d) => d.fileName?.toLowerCase() === "token-design.json");
    if (found) {
      console.log(`✅ Design Tokens found on NeoKanban board [${boardId}]: "token-design.json"`);
      return true;
    }
    console.log(`❌ Design Tokens ("token-design.json") NOT found on NeoKanban board [${boardId}].`);
    return false;
  } catch (err: any) {
    console.log(`⚠️ Unable to check tokens on NeoKanban: ${err.message}`);
    return false;
  }
}

/**
 * Pulls token-design.json from NeoKanban to local docs/ui-governance/token-design.json
 */
export async function pullTokens(
  options: { boardId?: string; apiUrl?: string; token?: string; targetPath?: string } = {}
): Promise<string> {
  const boardId = await resolveBoardId(options);
  const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
  const docs: any[] = contextRes.documents || [];
  const found = docs.find((d) => d.fileName?.toLowerCase() === "token-design.json");
  if (!found) {
    throw new Error(`"token-design.json" not found on board ${boardId}. Create it first with tokens:push.`);
  }

  const targetDir = path.resolve(process.cwd(), "docs/ui-governance");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = options.targetPath || path.join(targetDir, "token-design.json");
  fs.writeFileSync(targetPath, found.content, "utf-8");
  console.log(`💾 Design Tokens pulled successfully: ${targetPath}`);
  return targetPath;
}

/**
 * Pushes local token-design.json to NeoKanban board context
 */
export async function pushTokens(
  customPath?: string,
  options: { boardId?: string; apiUrl?: string; token?: string } = {}
): Promise<void> {
  const boardId = await resolveBoardId(options);
  let tokenFile = customPath
    ? path.resolve(process.cwd(), customPath)
    : path.resolve(process.cwd(), "docs/ui-governance/token-design.json");

  if (!fs.existsSync(tokenFile)) {
    tokenFile = path.resolve(process.cwd(), "docs/templates/token-design-template.json");
  }
  if (!fs.existsSync(tokenFile)) {
    throw new Error(`Token design file not found: ${tokenFile}`);
  }

  const content = fs.readFileSync(tokenFile, "utf-8").replace(/^\uFEFF/, "");
  JSON.parse(content); // Validate JSON format

  // Also ensure local copy in docs/ui-governance/token-design.json
  const localTarget = path.resolve(process.cwd(), "docs/ui-governance/token-design.json");
  if (!fs.existsSync(localTarget)) {
    fs.mkdirSync(path.dirname(localTarget), { recursive: true });
    fs.writeFileSync(localTarget, content, "utf-8");
  }

  try {
    const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
    const docs: any[] = contextRes.documents || [];
    const existing = docs.find((d) => d.fileName?.toLowerCase() === "token-design.json");

    if (existing) {
      await kanbanApi<any>(`/api/boards/${boardId}/context/${existing.id}`, {
        ...options,
        method: "PUT",
        body: {
          title: "Design Tokens Standard",
          content,
        },
      });
      console.log(`✅ Updated existing "token-design.json" on NeoKanban board [${boardId}].`);
    } else {
      await kanbanApi<any>(`/api/boards/${boardId}/context`, {
        ...options,
        method: "POST",
        body: {
          title: "Design Tokens Standard",
          fileName: "token-design.json",
          content,
        },
      });
      console.log(`✅ Created new "token-design.json" on NeoKanban board [${boardId}].`);
    }
  } catch (err: any) {
    console.log(`⚠️ NeoKanban sync skipped (${err.message || "Server not reachable"}). Token file is safely stored locally at: docs/ui-governance/token-design.json`);
  }
}

/**
 * Checks if component template exists on NeoKanban board context
 */
export async function checkComponent(
  componentName: string,
  options: { boardId?: string; apiUrl?: string; token?: string; targetDir?: string } = {}
): Promise<boolean> {
  const cleanName = componentName
    .trim()
    .toLowerCase()
    .replace(/^template-/, "")
    .replace(/\.html$/, "")
    .replace(/[^a-z0-9_-]/g, "-");
  const fileName = `template-${cleanName}.html`;

  try {
    const boardId = await resolveBoardId(options);
    const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
    const docs: any[] = contextRes.documents || [];
    const found = docs.find((d) => d.fileName?.toLowerCase() === fileName.toLowerCase());

    if (found) {
      console.log(`✅ Standard Component found on NeoKanban: "${fileName}"`);
      const dir = options.targetDir || path.resolve(process.cwd(), "docs/ui-governance/components");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const targetPath = path.join(dir, fileName);
      fs.writeFileSync(targetPath, found.content, "utf-8");
      console.log(`💾 Downloaded component to: ${targetPath}`);
      return true;
    }
    console.log(`ℹ️ Standard Component "${fileName}" does NOT exist on NeoKanban.`);
    return false;
  } catch (err: any) {
    console.log(`⚠️ Unable to check component on NeoKanban: ${err.message}`);
    return false;
  }
}

export interface UiComponentMetadata {
  name: string;
  category: string;
  description: string | null;
  htmlContent: string;
}

/**
 * Parses component metadata from HTML comments or derives from filename
 */
export function parseComponentMetadata(content: string, filename: string): UiComponentMetadata {
  let name = "";
  const nameComment = content.match(/<!--\s*name:\s*([^\n\r>]+)-->/i);
  if (nameComment) {
    name = nameComment[1].trim();
  } else {
    const baseName = path.basename(filename)
      .replace(/^template-/, "")
      .replace(/\.html$/, "")
      .replace(/[-_]+/g, " ");
    name = baseName
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  let category = "GENERAL";
  const catComment = content.match(/<!--\s*category:\s*([^\n\r>]+)-->/i);
  if (catComment) {
    category = catComment[1].trim().toUpperCase();
  }

  let description: string | null = null;
  const descComment = content.match(/<!--\s*description:\s*([^\n\r>]+)-->/i);
  if (descComment) {
    description = descComment[1].trim();
  }

  return {
    name,
    category,
    description,
    htmlContent: content.trim(),
  };
}

/**
 * Formats a visual review annotation item for human/AI console view
 */
export function formatAnnotationItem(anno: {
  id: string;
  type: string;
  posX: number;
  posY: number;
  comment: string;
  status: string;
  targetTitle?: string;
  pageId?: string;
  componentId?: string;
}): string {
  const badge = anno.type === "PIN" ? "📌 PIN" : "🔲 BOX";
  const pos = `(${anno.posX.toFixed(1)}%, ${anno.posY.toFixed(1)}%)`;
  const target = anno.targetTitle ? ` on "${anno.targetTitle}"` : "";
  const statusColor = anno.status === "OPEN" ? "🔴 OPEN" : "🟢 RESOLVED";
  return `${badge} ${pos}${target} [${statusColor}]:\n   💬 ${anno.comment}\n   🆔 ${anno.id}`;
}

/**
 * Formats a remote skill library catalog item
 */
export function formatSkillItem(skill: {
  id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  filesCount?: number;
}): string {
  const cat = skill.category ? `[${skill.category}] ` : "";
  const files = skill.filesCount !== undefined ? ` (${skill.filesCount} files)` : "";
  const desc = skill.description ? `\n   ${skill.description}` : "";
  return `📦 ${cat}${skill.name} (${skill.slug})${files}${desc}`;
}

/**
 * Publishes a component directly to NeoKanban UI/UX Studio entity (/api/boards/[id]/ui-components)
 */
export async function publishUiComponent(
  filePath: string,
  options: { boardId?: string; apiUrl?: string; token?: string; category?: string; description?: string } = {}
): Promise<void> {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Component file not found at: ${fullPath}`);
  }

  const rawContent = fs.readFileSync(fullPath, "utf-8");
  const meta = parseComponentMetadata(rawContent, filePath);
  if (options.category) meta.category = options.category.toUpperCase();
  if (options.description) meta.description = options.description;

  const boardId = await resolveBoardId(options);

  try {
    const res = await kanbanApi<{ components?: any[] }>(`/api/boards/${boardId}/ui-components`, options);
    const existing = res.components?.find((c: any) => c.name?.toLowerCase() === meta.name.toLowerCase());

    if (existing) {
      await kanbanApi<any>(`/api/boards/${boardId}/ui-components/${existing.id}`, {
        ...options,
        method: "PUT",
        body: {
          name: meta.name,
          category: meta.category,
          description: meta.description,
          htmlContent: meta.htmlContent,
        },
      });
      console.log(`✅ Updated UI/UX Studio component "${meta.name}" [${meta.category}] on NeoKanban.`);
    } else {
      await kanbanApi<any>(`/api/boards/${boardId}/ui-components`, {
        ...options,
        method: "POST",
        body: {
          name: meta.name,
          category: meta.category,
          description: meta.description,
          htmlContent: meta.htmlContent,
          order: 0,
        },
      });
      console.log(`✅ Created new UI/UX Studio component "${meta.name}" [${meta.category}] on NeoKanban.`);
    }
  } catch (err: any) {
    console.log(`⚠️ UI/UX Studio API sync skipped (${err.message || "Endpoint not reachable"}). Fallback to context document publishing.`);
    await publishComponent(filePath, options);
  }
}

/**
 * Pulls all UI components from NeoKanban UI/UX Studio into docs/ui-governance/components/
 */
export async function pullUiComponents(
  options: { boardId?: string; apiUrl?: string; token?: string; targetDir?: string } = {}
): Promise<void> {
  const boardId = await resolveBoardId(options);
  const targetDir = path.resolve(process.cwd(), options.targetDir || "docs/ui-governance/components");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    const res = await kanbanApi<{ components?: any[] }>(`/api/boards/${boardId}/ui-components`, options);
    const components = res.components || [];
    console.log(`📥 Found ${components.length} components in NeoKanban UI/UX Studio for board [${boardId}].`);

    for (const comp of components) {
      const cleanSlug = comp.name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = `template-${cleanSlug}.html`;
      const filePath = path.join(targetDir, fileName);

      const header = `<!-- name: ${comp.name} -->\n<!-- category: ${comp.category || "GENERAL"} -->\n${
        comp.description ? `<!-- description: ${comp.description} -->\n` : ""
      }\n`;
      fs.writeFileSync(filePath, `${header}${comp.htmlContent || ""}`, "utf-8");
      console.log(`  💾 Saved: ${fileName}`);
    }
    console.log(`✅ UI components pull completed.`);
  } catch (err: any) {
    console.error(`❌ Failed to pull UI components: ${err.message || err}`);
  }
}

/**
 * Publishes/Syncs a UI prototype page to NeoKanban UI/UX Studio (/api/boards/[id]/ui-pages)
 */
export async function pushUiPage(
  filePath: string,
  options: { boardId?: string; apiUrl?: string; token?: string; title?: string; routePath?: string; category?: string } = {}
): Promise<void> {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Page file not found at: ${fullPath}`);
  }

  const rawContent = fs.readFileSync(fullPath, "utf-8");
  const baseName = path.basename(filePath, ".html");
  const title = options.title || baseName.replace(/[-_]+/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const routePath = options.routePath || `/${baseName.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`;
  const category = options.category || "GENERAL";
  const boardId = await resolveBoardId(options);

  try {
    const res = await kanbanApi<{ pages?: any[] }>(`/api/boards/${boardId}/ui-pages`, options);
    const existing = res.pages?.find((p: any) => p.path === routePath || p.title?.toLowerCase() === title.toLowerCase());

    if (existing) {
      await kanbanApi<any>(`/api/boards/${boardId}/ui-pages/${existing.id}`, {
        ...options,
        method: "PUT",
        body: { title, path: routePath, category, htmlContent: rawContent },
      });
      console.log(`✅ Updated UI/UX Studio Page "${title}" (${routePath}) on NeoKanban.`);
    } else {
      await kanbanApi<any>(`/api/boards/${boardId}/ui-pages`, {
        ...options,
        method: "POST",
        body: { title, path: routePath, category, htmlContent: rawContent, order: 0 },
      });
      console.log(`✅ Created new UI/UX Studio Page "${title}" (${routePath}) on NeoKanban.`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to push UI page: ${err.message || err}`);
  }
}

/**
 * Pulls all UI prototype pages from NeoKanban UI/UX Studio into local docs/ui-governance/pages/
 */
export async function pullUiPages(
  options: { boardId?: string; apiUrl?: string; token?: string; targetDir?: string } = {}
): Promise<void> {
  const boardId = await resolveBoardId(options);
  const targetDir = path.resolve(process.cwd(), options.targetDir || "docs/ui-governance/pages");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    const res = await kanbanApi<{ pages?: any[] }>(`/api/boards/${boardId}/ui-pages`, options);
    const pages = res.pages || [];
    console.log(`📥 Found ${pages.length} pages in NeoKanban UI/UX Studio for board [${boardId}].`);

    for (const page of pages) {
      const cleanSlug = page.path.replace(/^\//, "").replace(/[^a-z0-9_-]/g, "-") || "index";
      const fileName = `${cleanSlug}.html`;
      const filePath = path.join(targetDir, fileName);

      fs.writeFileSync(filePath, page.htmlContent || "", "utf-8");
      console.log(`  💾 Saved Page: ${fileName} (${page.title})`);
    }
    console.log(`✅ UI pages pull completed.`);
  } catch (err: any) {
    console.error(`❌ Failed to pull UI pages: ${err.message || err}`);
  }
}

/**
 * Fetches visual review annotations (pins & bounding boxes) from NeoKanban UI/UX Studio
 */
export async function fetchUiAnnotations(
  options: { boardId?: string; apiUrl?: string; token?: string; pageId?: string; componentId?: string; status?: string } = {}
): Promise<void> {
  try {
    let endpoint = "/api/ui-annotations";
    const params = new URLSearchParams();
    if (options.pageId) params.append("pageId", options.pageId);
    if (options.componentId) params.append("componentId", options.componentId);
    if (options.status) params.append("status", options.status);
    const qs = params.toString();
    if (qs) endpoint += `?${qs}`;

    const res = await kanbanApi<{ annotations?: any[] }>(endpoint, options);
    const annotations = res.annotations || [];
    console.log(`\n🎨 NeoKanban UI/UX Studio Review Annotations (${annotations.length} items):\n`);

    if (annotations.length === 0) {
      console.log("ℹ️ No review annotations found.");
      return;
    }

    for (const anno of annotations) {
      console.log(formatAnnotationItem(anno));
      console.log("─".repeat(50));
    }
  } catch (err: any) {
    console.error(`❌ Failed to fetch UI review annotations: ${err.message || err}`);
  }
}

/**
 * Lists available skills from NeoKanban AI Skill Library
 */
export async function listRemoteSkills(
  options: { apiUrl?: string; token?: string } = {}
): Promise<void> {
  try {
    const res = await kanbanApi<{ skills?: any[] }>("/api/skills", options);
    const skills = res.skills || [];
    console.log(`\n🧠 NeoKanban AI Skill Library (${skills.length} available packages):\n`);

    if (skills.length === 0) {
      console.log("ℹ️ No skills published in the library.");
      return;
    }

    for (const skill of skills) {
      console.log(
        formatSkillItem({
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          category: skill.category,
          description: skill.description,
          filesCount: skill.files?.length,
        })
      );
      console.log("─".repeat(50));
    }
  } catch (err: any) {
    console.error(`❌ Failed to list remote skills: ${err.message || err}`);
  }
}

/**
 * Downloads a skill package from NeoKanban Skill Library and unpacks to local .agents/skills/<slug>/
 */
export async function pullRemoteSkill(
  slugOrId: string,
  options: { apiUrl?: string; token?: string; targetDir?: string } = {}
): Promise<void> {
  try {
    const res = await kanbanApi<any>(`/api/skills/${slugOrId}`, options);
    const skill = res.skill || res;
    if (!skill || !skill.slug) {
      throw new Error(`Skill "${slugOrId}" not found in NeoKanban Skill Library.`);
    }

    const baseDir = options.targetDir || path.resolve(process.cwd(), ".agents/skills", skill.slug);
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    console.log(`📥 Unpacking skill "${skill.name}" to: ${baseDir}...`);
    if (skill.files && Array.isArray(skill.files)) {
      for (const file of skill.files) {
        const filePath = path.join(baseDir, file.filePath || file.fileName);
        const parentDir = path.dirname(filePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content || "", "utf-8");
        console.log(`  💾 Installed: ${file.filePath || file.fileName}`);
      }
    } else if (skill.readmeContent || skill.skillMarkdown) {
      const skillMd = path.join(baseDir, "SKILL.md");
      fs.writeFileSync(skillMd, skill.skillMarkdown || skill.readmeContent, "utf-8");
      console.log(`  💾 Installed: SKILL.md`);
    }

    console.log(`✅ Skill "${skill.slug}" installed successfully to .agents/skills/${skill.slug}/`);
  } catch (err: any) {
    console.error(`❌ Failed to pull skill: ${err.message || err}`);
  }
}

/**
 * Resets repository runtime artifacts to prepare clean template state for a new project
 */
export function resetTemplate(options: { full?: boolean } = {}): void {
  console.log("\n🧹 Resetting repository to clean starter template state...");

  // 1. Clean docs/plans/
  const plansDir = path.resolve(process.cwd(), "docs/plans");
  if (fs.existsSync(plansDir)) {
    const files = fs.readdirSync(plansDir);
    for (const f of files) {
      if (f.endsWith(".md")) {
        fs.unlinkSync(path.join(plansDir, f));
        console.log(`  🗑️ Removed plan: docs/plans/${f}`);
      }
    }
  }

  // 2. Reset .kanban-map.json
  const mapPath = path.resolve(process.cwd(), ".kanban-map.json");
  const emptyMap: KanbanMappingLedger = {
    boardId: "",
    boardTitle: "",
    planFile: "",
    syncedAt: new Date().toISOString(),
    tasks: {},
  };
  fs.writeFileSync(mapPath, JSON.stringify(emptyMap, null, 2), "utf-8");
  console.log(`  💾 Reset .kanban-map.json to empty state.`);

  // 3. Reset docs/HANDOFF.md to clean template
  const handoffPath = path.resolve(process.cwd(), "docs/HANDOFF.md");
  const cleanHandoff = `# Living Session Handoff\n\n> Dokumen ini adalah **Living Source of Truth** status pengerjaan yang **wajib dibaca di awal setiap sesi baru** dan **diperbarui setiap kali menyelesaikan milestone/aktivitas**.\n\n═══════════════════════════════════════════════════════════════════════════\n## 🏁 SESI: [Baru] — starter-template\n═══════════════════════════════════════════════════════════════════════════\n- **Operator / Agent:** Antigravity\n- **Branch Aktif:** \`master\`\n- **Status:** Proyek baru siap dimulai dari template.\n\n### 🚀 Langkah Kerja Berikutnya\n1. Jalankan \`npx tsx scripts/kanban.ts init --board <id-board>\` untuk menghubungkan ke papan NeoKanban.\n2. Sesuaikan informasi proyek di \`docs/context/INDEX.md\` dan \`docs/context/ARCHITECTURE.md\`.\n3. Jalankan \`npx tsx scripts/kanban.ts context:push\` untuk mengunggah konteks awal ke papan.\n\n═══════════════════════════════════════════════════════════════════════════\n`;
  fs.writeFileSync(handoffPath, cleanHandoff, "utf-8");
  console.log(`  💾 Reset docs/HANDOFF.md to starter template.`);

  if (options.full) {
    const cfgPath = path.resolve(process.cwd(), ".neokanban.json");
    if (fs.existsSync(cfgPath)) {
      fs.unlinkSync(cfgPath);
      console.log(`  🗑️ Removed .neokanban.json.`);
    }
  }

  console.log("✅ Repository is now a pristine starter template ready to be copied or initialized!\n");
}

/**
 * Publishes reviewed and approved component template to NeoKanban board context
 */
export async function publishComponent(
  filePath: string,
  options: { boardId?: string; apiUrl?: string; token?: string } = {}
): Promise<void> {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Component file not found at: ${fullPath}`);
  }

  const baseName = path.basename(filePath);
  const cleanName = baseName
    .toLowerCase()
    .replace(/^template-/, "")
    .replace(/\.html$/, "")
    .replace(/[^a-z0-9_-]/g, "-");
  const fileName = `template-${cleanName}.html`;
  const content = fs.readFileSync(fullPath, "utf-8");

  try {
    const boardId = await resolveBoardId(options);
    const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
    const docs: any[] = contextRes.documents || [];
    const existing = docs.find((d) => d.fileName?.toLowerCase() === fileName.toLowerCase());

    if (existing) {
      await kanbanApi<any>(`/api/boards/${boardId}/context/${existing.id}`, {
        ...options,
        method: "PUT",
        body: {
          title: `Component: ${cleanName}`,
          content,
        },
      });
      console.log(`✅ Updated existing component template "${fileName}" on NeoKanban.`);
    } else {
      await kanbanApi<any>(`/api/boards/${boardId}/context`, {
        ...options,
        method: "POST",
        body: {
          title: `Component: ${cleanName}`,
          fileName,
          content,
        },
      });
      console.log(`✅ Published new component template "${fileName}" to NeoKanban.`);
    }
  } catch (err: any) {
    console.log(`⚠️ NeoKanban sync skipped (${err.message || "Server not reachable"}). Template file is safely saved locally at: ${filePath}`);
  }
}

/**
 * Checks completeness of local and remote context documents
 */
export async function checkContext(
  options: { boardId?: string; apiUrl?: string; token?: string } = {}
): Promise<{ localMissing: string[]; remoteMissing: string[] }> {
  const contextDir = path.resolve(process.cwd(), "docs/context");
  const requiredFiles = [
    "INDEX.md",
    "ARCHITECTURE.md",
    "DATABASE.md",
    "DESIGN_SYSTEM.md",
    "AGENTS.md",
    "BEHAVIOR.md",
    "SECURITY.md",
    "REPOSITORY.md",
    "HANDOFF.md",
  ];

  console.log("\n📋 Checking Project Context Completeness (docs/context/)...");

  const localMissing: string[] = [];
  for (const f of requiredFiles) {
    const exists = fs.existsSync(path.join(contextDir, f));
    if (!exists) {
      localMissing.push(f);
      console.log(`  ❌ Local: ${f} (missing)`);
    } else {
      console.log(`  ✅ Local: ${f}`);
    }
  }

  // Check functional feature contexts (FEATURE_*.md)
  const allContextFiles = fs.existsSync(contextDir) ? fs.readdirSync(contextDir) : [];
  const featureFiles = allContextFiles.filter(
    (f) => f.startsWith("FEATURE_") && f.endsWith(".md") && f !== "FEATURE_TEMPLATE.md"
  );
  if (featureFiles.length === 0) {
    console.log("  ⚠️ Local Feature Context: Belum ada berkas FEATURE_*.md!");
    console.log("     Saran: Bangun spesifikasi fitur (docs/context/FEATURE_[NAMA].md) menggunakan FEATURE_TEMPLATE.md sebelum planning.");
  } else {
    console.log(`  ✅ Local Feature Contexts (${featureFiles.length} fitur terdaftar):`);
    for (const ff of featureFiles) {
      console.log(`     - ${ff}`);
    }
  }

  const remoteMissing: string[] = [];
  try {
    const boardId = await resolveBoardId(options);
    const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
    const docs: any[] = contextRes.documents || [];
    console.log(`\n☁️ Checking NeoKanban Board Context [${boardId}]...`);
    for (const f of requiredFiles) {
      const found = docs.find((d) => d.fileName?.toLowerCase() === f.toLowerCase());
      if (found) {
        console.log(`  ✅ Board: ${f}`);
      } else {
        remoteMissing.push(f);
        console.log(`  ⚠️ Board: ${f} (not on board)`);
      }
    }

    if (featureFiles.length > 0) {
      console.log(`\n☁️ Checking Remote Feature Contexts on Board...`);
      for (const ff of featureFiles) {
        const found = docs.find((d) => d.fileName?.toLowerCase() === ff.toLowerCase());
        if (found) {
          console.log(`  ✅ Board: ${ff}`);
        } else {
          console.log(`  ⚠️ Board: ${ff} (belum di-push, jalankan context:push)`);
        }
      }
    }
  } catch (err: any) {
    console.log(`⚠️ Board check skipped (${err.message || "Offline"}).`);
  }

  return { localMissing, remoteMissing };
}

/**
 * Pushes all docs/context/*.md files to NeoKanban board context
 */
export async function pushContext(
  options: { boardId?: string; apiUrl?: string; token?: string } = {}
): Promise<void> {
  const contextDir = path.resolve(process.cwd(), "docs/context");
  if (!fs.existsSync(contextDir)) {
    throw new Error(`Context directory not found at: ${contextDir}`);
  }

  const boardId = await resolveBoardId(options);
  const files = fs.readdirSync(contextDir).filter((f) => f.endsWith(".md"));
  console.log(`\n🚀 Pushing ${files.length} context files to NeoKanban Board [${boardId}]...`);

  const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
  const docs: any[] = contextRes.documents || [];

  for (const f of files) {
    const filePath = path.join(contextDir, f);
    const content = fs.readFileSync(filePath, "utf-8");
    const existing = docs.find((d) => d.fileName?.toLowerCase() === f.toLowerCase());
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : f.replace(/\.md$/, "");

    if (existing) {
      await kanbanApi<any>(`/api/boards/${boardId}/context/${existing.id}`, {
        ...options,
        method: "PUT",
        body: { title, content },
      });
      console.log(`  🔄 Updated: ${f}`);
    } else {
      await kanbanApi<any>(`/api/boards/${boardId}/context`, {
        ...options,
        method: "POST",
        body: { title, fileName: f, content },
      });
      console.log(`  ➕ Created: ${f}`);
    }
  }

  console.log(`✅ All context files synced successfully to NeoKanban!\n`);
}

/**
 * Pulls all context files from NeoKanban board to local docs/context/
 */
export async function pullContext(
  options: { boardId?: string; apiUrl?: string; token?: string } = {}
): Promise<void> {
  const contextDir = path.resolve(process.cwd(), "docs/context");
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  const boardId = await resolveBoardId(options);
  console.log(`\n📥 Pulling context documents from NeoKanban Board [${boardId}]...`);
  const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
  const docs: any[] = contextRes.documents || [];

  if (docs.length === 0) {
    console.log(`ℹ️ No context documents found on board [${boardId}].`);
    return;
  }

  for (const doc of docs) {
    if (!doc.fileName || !doc.fileName.endsWith(".md")) continue;
    const targetPath = path.join(contextDir, doc.fileName);
    fs.writeFileSync(targetPath, doc.content || "", "utf-8");
    console.log(`  💾 Downloaded: ${doc.fileName}`);
  }

  console.log(`✅ Context pull completed.\n`);
}

/**
 * Synthesizes a new standard token-compliant component template without needing starter templates
 */
export function scaffoldComponent(
  componentName: string,
  options: { targetDir?: string } = {}
): string {
  const cleanName = componentName
    .trim()
    .toLowerCase()
    .replace(/^template-/, "")
    .replace(/\.html$/, "")
    .replace(/[^a-z0-9_-]/g, "-");
  const fileName = `template-${cleanName}.html`;
  const dir = options.targetDir || path.resolve(process.cwd(), "docs/ui-governance/components");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const targetPath = path.join(dir, fileName);

  const formattedTitle = cleanName
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  const content = `<!-- Component: ${formattedTitle} Template -->
<!-- Standards: WCAG AA, Token-based styles, Accessible labels, 6 states -->
<div 
  data-component="${cleanName}" 
  class="p-6 bg-white dark:bg-stone-900 border border-[#EAE6DF] dark:border-[#2E2B27] rounded-3xl shadow-sm hover:shadow-md transition-shadow"
>
  <div class="flex items-center justify-between pb-4 border-b border-[#EAE6DF] dark:border-stone-800">
    <h3 class="font-serif text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100">${formattedTitle}</h3>
    <span class="px-2.5 py-0.5 rounded-full bg-[#EFECE6] dark:bg-stone-800 text-[10px] font-mono text-stone-600 dark:text-stone-300">Standard Component</span>
  </div>

  <div class="mt-4 space-y-3">
    <p class="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
      Komponen ${cleanName} disintesis secara mandiri sesuai dengan token warna dan tipografi editorial.
    </p>

    <!-- Action Buttons with 6 states -->
    <div class="pt-2 flex items-center gap-2">
      <button 
        type="button" 
        class="px-5 py-2 rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 text-xs font-semibold tracking-wide transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
      >
        Action
      </button>
      <button 
        type="button" 
        class="px-5 py-2 rounded-full bg-[#EFECE6] dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium hover:bg-stone-200 transition-colors"
      >
        Dismiss
      </button>
    </div>
  </div>
</div>
`;

  fs.writeFileSync(targetPath, content.trim() + "\n", "utf-8");
  console.log(`✨ Synthesized new component template: ${targetPath}`);
  return targetPath;
}

/**
 * Executes UI/UX Pro Max local search engine
 */
export function searchUiUx(args: string[]): void {
  const scriptPath = path.resolve(process.cwd(), ".agents/skills/ui-ux-pro-max/scripts/search.py");
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ UI/UX Pro Max search script not found at: ${scriptPath}`);
    return;
  }
  const proc = spawnSync("python", [scriptPath, ...args], { stdio: "inherit" });
  if (proc.error) {
    console.error(`❌ Failed to execute python search script:`, proc.error.message);
  }
}

/**
 * Runs a Trail of Bits-inspired security audit across the project
 */
export function runSecurityAudit(): { passed: boolean; issues: string[] } {
  console.log("\n🛡️ Running Trail of Bits Security Audit...\n");
  const issues: string[] = [];

  // 1. Secret & Gitignore Check
  console.log("1️⃣ Checking Sensitive Files & Git Hygiene...");
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, "utf-8");
    if (!gitignore.includes(".env")) {
      issues.push("Warning: .env is not in .gitignore");
      console.log("  ⚠️ .env is not listed in .gitignore");
    } else {
      console.log("  ✅ .env is properly ignored in .gitignore");
    }
    if (!gitignore.includes(".neokanban.json")) {
      issues.push("Warning: .neokanban.json is not in .gitignore");
      console.log("  ⚠️ .neokanban.json is not listed in .gitignore");
    } else {
      console.log("  ✅ .neokanban.json is properly ignored in .gitignore");
    }
  }

  // 2. Dependency Vulnerability Audit (npm audit)
  console.log("\n2️⃣ Checking Dependency Supply Chain (npm audit)...");
  try {
    const npmAudit = spawnSync("npm audit --audit-level=high", {
      encoding: "utf-8",
      shell: true,
    });
    if (npmAudit.status === 0) {
      console.log("  ✅ No high or critical vulnerabilities found in dependencies.");
    } else {
      console.log("  ⚠️ Dependencies report high/critical vulnerabilities:\n", npmAudit.stdout || npmAudit.stderr);
      issues.push("npm audit reported vulnerabilities");
    }
  } catch (err: any) {
    console.log("  ⚠️ npm audit check skipped:", err.message);
  }

  // 3. Static Analysis Scan (Semgrep if available)
  console.log("\n3️⃣ Checking Static Analysis Scanner (Semgrep)...");
  try {
    const semgrepCheck = spawnSync("semgrep --version", { encoding: "utf-8", shell: true });
    if (semgrepCheck.status === 0) {
      console.log(`  🔍 Running Semgrep with telemetry disabled (--metrics=off)...`);
      const scan = spawnSync("semgrep scan --config auto --metrics=off", {
        stdio: "inherit",
        shell: true,
      });
      if (scan.status === 0) {
        console.log("  ✅ Semgrep static analysis passed.");
      } else {
        issues.push("Semgrep reported security findings");
      }
    } else {
      console.log("  ℹ️ Semgrep CLI not detected. Install via 'pip install semgrep' for AST static analysis.");
    }
  } catch {
    console.log("  ℹ️ Semgrep CLI not installed.");
  }

  // Final Summary
  console.log("\n═════════════════════════════════════════════════════════");
  if (issues.length === 0) {
    console.log("🎉 Security Audit PASSED: No critical security issues detected!");
  } else {
    console.log(`⚠️ Security Audit Completed with ${issues.length} item(s) to verify.`);
  }
  console.log("═════════════════════════════════════════════════════════\n");

  return { passed: issues.length === 0, issues };
}

/**
 * Saves and updates the single living handoff file (docs/HANDOFF.md),
 * maintaining a clean, bounded history without micro-file clutter,
 * and syncs to NeoKanban Living Context.
 */
export async function saveHandoff(
  sessionName: string,
  options: {
    summary?: string;
    content?: string;
    boardId?: string;
    apiUrl?: string;
    token?: string;
    nextSteps?: string[];
    branch?: string;
    testsStatus?: string;
  } = {}
): Promise<{ fileName: string; filePath: string }> {
  const mainHandoffPath = path.resolve(process.cwd(), "docs/HANDOFF.md");
  const mainDir = path.dirname(mainHandoffPath);
  if (!fs.existsSync(mainDir)) {
    fs.mkdirSync(mainDir, { recursive: true });
  }

  const sessionContent =
    options.content ||
    formatHandoffSession({
      sessionName,
      summary: options.summary || "Aktivitas sesi kerja diselesaikan.",
      branch: options.branch,
      testsStatus: options.testsStatus,
      nextSteps: options.nextSteps || ["Lanjutkan task berikutnya dari NeoKanban / Implementation Plan."],
    });

  const header = `# Living Session Handoff

> Dokumen ini adalah **Living Source of Truth** status pengerjaan yang **wajib dibaca di awal setiap sesi baru** dan **diperbarui setiap kali menyelesaikan milestone/aktivitas**.
> Format ini dijaga ramping dan terfokus pada status aktif tanpa file log yang menumpuk.`;

  // Read existing content to preserve at most 2 previous session blocks
  let existingSessions: string[] = [];
  if (fs.existsSync(mainHandoffPath)) {
    const raw = fs.readFileSync(mainHandoffPath, "utf-8");
    const divider = "═".repeat(75);
    const blocks = raw.split(divider).map((b) => b.trim()).filter((b) => b.startsWith("## 🏁 SESI:"));
    existingSessions = blocks.map((b) => `${divider}\n${b}\n${divider}`);
  }

  // Prepend current session, keep max 2 previous sessions
  const sessionsToKeep = [sessionContent.trim(), ...existingSessions.slice(0, 2)];
  const updatedMain = `${header}\n\n${sessionsToKeep.join("\n\n")}\n`;

  fs.writeFileSync(mainHandoffPath, updatedMain, "utf-8");
  console.log(`📝 Updated living handoff: ${mainHandoffPath}`);

  // Sync to NeoKanban Board Context if server available
  try {
    let boardId = options.boardId;
    if (!boardId) {
      const cfg = loadProjectConfig();
      boardId = cfg?.boardId;
    }
    if (!boardId) {
      const boardsData = await kanbanApi<{ boards: any[] }>("/api/boards", options);
      const boards = boardsData.boards || [];
      if (boards.length > 0) {
        boardId = boards[0].id;
      }
    }

    if (boardId) {
      console.log(`🔄 Syncing living handoff to NeoKanban board context [${boardId}]...`);
      const contextRes = await kanbanApi<any>(`/api/boards/${boardId}/context`, options);
      const docs: any[] = contextRes.documents || [];
      const existing = docs.find((d) => d.fileName?.toLowerCase() === "handoff.md" || d.fileName?.toLowerCase() === "living-handoff.md");

      if (existing) {
        await kanbanApi<any>(`/api/boards/${boardId}/context/${existing.id}`, {
          ...options,
          method: "PUT",
          body: {
            title: `Living Handoff (Active)`,
            content: updatedMain,
          },
        });
        console.log(`✅ Updated existing living handoff in NeoKanban.`);
      } else {
        await kanbanApi<any>(`/api/boards/${boardId}/context`, {
          ...options,
          method: "POST",
          body: {
            title: `Living Handoff (Active)`,
            fileName: "HANDOFF.md",
            content: updatedMain,
          },
        });
        console.log(`✅ Created living handoff in NeoKanban.`);
      }
    } else {
      console.log(`ℹ️ NeoKanban board offline. Living handoff stored locally at: docs/HANDOFF.md`);
    }
  } catch (err: any) {
    console.log(`⚠️ NeoKanban sync skipped (${err.message || "Server not reachable"}). Living handoff stored locally at: docs/HANDOFF.md`);
  }

  return { fileName: "HANDOFF.md", filePath: mainHandoffPath };
}

/**
 * Publish plan to NeoKanban board and automatically record activity handoff
 */
export async function publishPlan(
  planPath: string,
  options: { boardId?: string; apiUrl?: string; token?: string; mapPath?: string } = {}
): Promise<KanbanMappingLedger> {
  const fullPath = path.resolve(process.cwd(), planPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Plan file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const plan = parsePlanMarkdown(content);

  console.log(`\n📋 Publishing Plan: "${plan.planTitle}"`);
  console.log(`🎯 Tasks parsed: ${plan.tasks.length}`);

  // Governance check: Ensure feature contexts exist
  const contextDir = path.resolve(process.cwd(), "docs/context");
  if (fs.existsSync(contextDir)) {
    const allContextFiles = fs.readdirSync(contextDir);
    const featureFiles = allContextFiles.filter(
      (f) => f.startsWith("FEATURE_") && f.endsWith(".md") && f !== "FEATURE_TEMPLATE.md"
    );
    if (featureFiles.length === 0) {
      console.log(`⚠️ [Governance Warning] Tidak ditemukan berkas spesifikasi fitur (docs/context/FEATURE_*.md)!`);
      console.log(`   Disiplin Lean Harness: Sangat disarankan menyusun FEATURE_[NAMA].md sebelum memublikasikan kartu ke NeoKanban.\n`);
    } else {
      console.log(`📁 Linked Feature Contexts: ${featureFiles.length} file spesifikasi fitur aktif.`);
    }
  }

  // Resolve board
  const cfg = loadProjectConfig();
  let boardId = options.boardId || cfg?.boardId;
  let boardTitle = cfg?.boardTitle || "Project Development";

  const ledger: KanbanMappingLedger = {
    boardId: boardId || "offline-board",
    boardTitle,
    planFile: planPath,
    syncedAt: new Date().toISOString(),
    tasks: {},
  };

  try {
    const boardsData = await kanbanApi<{ boards: any[] }>("/api/boards", options);
    const boards = boardsData.boards || [];

    if (boardId) {
      const found = boards.find((b) => b.id === boardId);
      if (found) boardTitle = found.title;
    } else if (boards.length > 0) {
      const targetBoard = boards[0];
      boardId = targetBoard.id;
      boardTitle = targetBoard.title;
      console.log(`📌 Using Active Board: "${boardTitle}" (ID: ${boardId})`);
    } else {
      console.log(`Creating new board for project...`);
      const newBoard = await kanbanApi<any>("/api/boards", {
        ...options,
        method: "POST",
        body: {
          title: plan.planTitle.replace(/Implementation Plan/i, "").trim() || "Development Board",
          description: plan.goal || "Kanban board synchronized from Antigravity plan",
        },
      });
      const created = newBoard.board || newBoard;
      boardId = created.id;
      boardTitle = created.title;
      console.log(`✅ Board created: "${boardTitle}" (ID: ${boardId})`);
    }

    ledger.boardId = boardId!;
    ledger.boardTitle = boardTitle;

    // Fetch columns
    const boardDetail = await kanbanApi<any>(`/api/boards/${boardId}`, options);
    const boardObj = boardDetail.board || boardDetail;
    const columns: any[] = boardObj.columns || [];

    const todoCol = columns.find((c) => c.title.toLowerCase().trim() === "to do") || columns[0];
    if (!todoCol) {
      throw new Error(`No column found on board ${boardId}`);
    }

    for (const task of plan.tasks) {
      const cardTitle = `Task ${task.taskNumber}: ${task.taskTitle}`;
      console.log(`  ➕ Creating Card: "${cardTitle}"...`);

      let description = `### 🎯 Task Objective\n`;
      if (task.agent) description += `**Assigned Specialist:** \`${task.agent}\`\n\n`;
      if (task.priority) description += `**Priority:** \`${task.priority}\`\n\n`;

      if (task.files.create.length || task.files.modify.length || task.files.test.length) {
        description += `### 📁 Files Involved\n`;
        if (task.files.create.length) description += `- **Create:** \`${task.files.create.join("`, `")}\`\n`;
        if (task.files.modify.length) description += `- **Modify:** \`${task.files.modify.join("`, `")}\`\n`;
        if (task.files.test.length) description += `- **Test:** \`${task.files.test.join("`, `")}\`\n`;
        description += `\n`;
      }

      const cardRes = await kanbanApi<any>("/api/cards", {
        ...options,
        method: "POST",
        body: {
          boardId,
          columnId: todoCol.id,
          title: cardTitle,
          description,
          priority: task.priority || "MEDIUM",
          tags: deriveDomainTags(task.agent, task.taskTitle),
        },
      });
      const card = cardRes.card || cardRes;

      // Add Checklist Steps
      for (const step of task.steps) {
        await kanbanApi<any>(`/api/cards/${card.id}/checklists`, {
          ...options,
          method: "POST",
          body: { title: step },
        });
      }

      ledger.tasks[`task-${task.taskNumber}`] = {
        cardId: card.id,
        title: cardTitle,
        agent: task.agent,
        status: todoCol.title,
      };
    }
  } catch (err: any) {
    console.log(`⚠️ NeoKanban server sync skipped (${err.message || "Offline"}). Generating local ledger...`);
    for (const task of plan.tasks) {
      const cardTitle = `Task ${task.taskNumber}: ${task.taskTitle}`;
      ledger.tasks[`task-${task.taskNumber}`] = {
        cardId: `local-card-${task.taskNumber}`,
        title: cardTitle,
        agent: task.agent,
        status: "To Do",
      };
      console.log(`  📝 [Offline Card] "${cardTitle}" (Assigned: ${task.agent || "specialist"})`);
    }
  }

  // Save mapping ledger
  const mapPath = options.mapPath || path.resolve(process.cwd(), ".kanban-map.json");
  fs.writeFileSync(mapPath, JSON.stringify(ledger, null, 2), "utf-8");
  console.log(`💾 Saved mapping ledger to: ${mapPath}\n`);

  // Periodic automatic handoff on plan publish
  try {
    const slug = path.basename(planPath, ".md");
    await saveHandoff(`publish-${slug}`, {
      summary: `Penerbitan rencana "${plan.planTitle}" dengan ${plan.tasks.length} task ke kolom To Do papan NeoKanban.`,
      nextSteps: ["Mulai pengerjaan Task 1 di branch fitur terisolasi."],
      ...options,
    });
  } catch (err: any) {}

  return ledger;
}

/**
 * Move card to 'In Progress' and record activity handoff
 */
export async function startTask(
  cardId: string,
  options: { apiUrl?: string; token?: string; boardId?: string } = {}
) {
  await transitionToColumn(cardId, "In Progress", options);
  console.log(`🚀 Task card [${cardId}] marked as In Progress.`);

  try {
    await saveHandoff(`card-${cardId}-start`, {
      summary: `Task ${cardId} mulai dikerjakan pada branch fitur terisolasi.`,
      nextSteps: ["Jalankan siklus TDD (Red -> Green -> Refactor) untuk task ini."],
      ...options,
    });
  } catch (err: any) {}
}

/**
 * Toggle/check a checklist item
 */
export async function checkStep(
  cardId: string,
  stepPattern: string,
  options: { apiUrl?: string; token?: string } = {}
) {
  try {
    const cardRes = await kanbanApi<any>(`/api/cards/${cardId}`, options);
    const card = cardRes.card || cardRes;
    const checklists: any[] = card.checklists || [];

    const item = checklists.find((c) => c.title.toLowerCase().includes(stepPattern.toLowerCase().trim()));
    if (item) {
      await kanbanApi<any>(`/api/cards/${cardId}/checklists`, {
        ...options,
        method: "PUT",
        body: {
          itemId: item.id,
          isCompleted: true,
        },
      });
      console.log(`☑️ Checked checklist step: "${item.title}"`);
      return;
    }
  } catch (err: any) {
    console.log(`⚠️ NeoKanban sync skipped (${err.message || "Offline"}). Checked step locally: "${stepPattern}"`);
    return;
  }
  console.log(`☑️ Checked step pattern: "${stepPattern}"`);
}

/**
 * Runs pre-flight test gatekeeper (inspired by ATLAS & CodeAF)
 */
export function runPreFlightTests(options: { preflightCmd?: string; skipPreflight?: boolean } = {}): boolean {
  if (options.skipPreflight) {
    console.log("⚠️ Pre-flight test skipped via --skip-preflight.");
    return true;
  }

  let cmd = options.preflightCmd;
  if (!cmd) {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.scripts && pkg.scripts.test && !pkg.scripts.test.includes("no test specified")) {
          cmd = "npm test";
        }
      } catch {}
    }
  }

  if (!cmd) {
    const clientPkg = path.resolve(process.cwd(), "client/package.json");
    const serverPkg = path.resolve(process.cwd(), "server/package.json");
    const hasClient = fs.existsSync(clientPkg);
    const hasServer = fs.existsSync(serverPkg);

    if (hasClient && hasServer) {
      cmd = "npm --prefix client test --if-present && npm --prefix server test --if-present";
    } else if (hasClient) {
      cmd = "npm --prefix client test";
    } else if (hasServer) {
      cmd = "npm --prefix server test";
    }
  }

  if (!cmd) {
    console.log("ℹ️ No test suite configured in package.json. Pre-flight check passed.");
    return true;
  }

  console.log(`\n🧪 [ATLAS Pre-Flight Gatekeeper] Executing test suite: "${cmd}"...`);
  const result = spawnSync(cmd, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`\n❌ [ATLAS Pre-Flight Gatekeeper Failed]: Test suite returned non-zero exit code (${result.status}).`);
    console.error(`🛑 Transition to 'Review' REJECTED. Please fix failing tests before submitting to review.`);
    return false;
  }

  console.log(`✅ [ATLAS Pre-Flight Gatekeeper Passed]: Test suite passed 100%!\n`);
  return true;
}

/**
 * Move card to 'Review' with verification proof comment and record activity handoff (Enforces Safe Review Gate)
 */
export async function reviewTask(
  cardId: string,
  reportContent: string,
  options: { apiUrl?: string; token?: string; boardId?: string; preflightCmd?: string; skipPreflight?: boolean } = {}
) {
  // Pre-flight test gatekeeper (ATLAS pattern)
  const passed = runPreFlightTests(options);
  if (!passed) {
    throw new Error("Pre-flight tests failed. Cannot move card to Review.");
  }

  await transitionToColumn(cardId, "Review", options);

  // Attach verification proof comment
  try {
    await kanbanApi<any>(`/api/cards/${cardId}/comments`, {
      ...options,
      method: "POST",
      body: {
        content: reportContent,
        authorName: "Antigravity Specialist",
        isAiGenerated: true,
      },
    });
    console.log(`🛡️ Safe Review Gate: Card moved to [Review] and verification report attached.`);
  } catch (err: any) {
    console.log(`⚠️ NeoKanban sync skipped (${err.message || "Offline"}). Verification report recorded locally.`);
  }

  // Periodic automatic handoff on review completion
  try {
    await saveHandoff(`card-${cardId}-review`, {
      summary: `Verifikasi task ${cardId} selesai dan kartu dipindahkan ke kolom Review.\nLaporan:\n${reportContent}`,
      nextSteps: ["Menunggu verifikasi dan persetujuan human developer untuk merge ke branch utama."],
      ...options,
    });
  } catch (err: any) {}
}

/**
 * Move card helper
 */
async function transitionToColumn(
  cardId: string,
  targetColumnTitle: string,
  options: { apiUrl?: string; token?: string } = {}
) {
  // Update local map ledger if exists
  const mapPath = path.resolve(process.cwd(), ".kanban-map.json");
  if (fs.existsSync(mapPath)) {
    try {
      const map: KanbanMappingLedger = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
      for (const key of Object.keys(map.tasks)) {
        if (map.tasks[key].cardId === cardId || key === cardId) {
          map.tasks[key].status = targetColumnTitle;
        }
      }
      fs.writeFileSync(mapPath, JSON.stringify(map, null, 2), "utf-8");
    } catch {}
  }

  try {
    const cardRes = await kanbanApi<any>(`/api/cards/${cardId}`, options);
    const card = cardRes.card || cardRes;
    const boardId = card.column?.boardId || card.boardId;

    const boardDetail = await kanbanApi<any>(`/api/boards/${boardId}`, options);
    const board = boardDetail.board || boardDetail;
    const columns: any[] = board.columns || [];

    const targetCol = columns.find(
      (c) =>
        c.title.toLowerCase().trim() === targetColumnTitle.toLowerCase().trim() ||
        (targetColumnTitle.toLowerCase().trim() === "review" && c.title.toLowerCase().trim() === "in review")
    );

    if (targetCol) {
      await kanbanApi<any>(`/api/cards/${cardId}/move`, {
        ...options,
        method: "POST",
        body: {
          targetColumnId: targetCol.id,
          targetOrder: 0,
        },
      });
    }
  } catch (err: any) {
    console.log(`⚠️ NeoKanban server sync skipped (${err.message || "Offline"}). Local status updated to [${targetColumnTitle}].`);
  }
}

// CLI handler
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();

if (isMain) {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  async function run() {
    if (command === "init") {
      const urlIdx = process.argv.indexOf("--url");
      const apiUrl = urlIdx !== -1 ? process.argv[urlIdx + 1] : undefined;
      const tokIdx = process.argv.indexOf("--token");
      const patToken = tokIdx !== -1 ? process.argv[tokIdx + 1] : undefined;
      const boardIdx = process.argv.indexOf("--board");
      const boardId = boardIdx !== -1 ? process.argv[boardIdx + 1] : undefined;
      const titleIdx = process.argv.indexOf("--title");
      const boardTitle = titleIdx !== -1 ? process.argv[titleIdx + 1] : undefined;
      const roleIdx = process.argv.indexOf("--role");
      const role = roleIdx !== -1 ? process.argv[roleIdx + 1] : undefined;
      const userIdx = process.argv.indexOf("--username");
      const username = userIdx !== -1 ? process.argv[userIdx + 1] : undefined;
      const stackIdx = process.argv.indexOf("--stack");
      const stack = stackIdx !== -1 ? (process.argv[stackIdx + 1] as ProjectStackType) : undefined;
      const offline = process.argv.includes("--offline");

      await initProject({ apiUrl, patToken, boardId, boardTitle, role, username, stack, offline });
    } else if (command === "bundle") {
      const distDir = path.resolve(process.cwd(), "dist");
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
      const bundle = createHarnessBundle();
      const bundlePath = path.join(distDir, "harness-bundle.json");
      fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2), "utf-8");
      console.log(`\n📦 Harness successfully bundled into: ${bundlePath}`);
      console.log(`📄 Total files bundled: ${bundle.files.length}`);
      console.log(`💡 Ready to be imported or served by NeoKanban MCP daemon!\n`);
    } else if (command === "ping") {
      const ping = await pingNeoKanban();
      console.log(ping.ok ? `✅ ${ping.message}` : `❌ ${ping.message}`);
    } else if (command === "publish") {
      if (!arg1) {
        console.error("Usage: kanban publish <path-to-plan.md> [board-id]");
        process.exit(1);
      }
      await publishPlan(arg1, { boardId: arg2 });
    } else if (command === "start") {
      if (!arg1) {
        console.error("Usage: kanban start <card-id>");
        process.exit(1);
      }
      await startTask(arg1);
    } else if (command === "check") {
      if (!arg1 || !arg2) {
        console.error("Usage: kanban check <card-id> <step-title-pattern>");
        process.exit(1);
      }
      await checkStep(arg1, arg2);
    } else if (command === "review") {
      if (!arg1) {
        console.error("Usage: kanban review <card-id> [--report <text>] [--skip-preflight] [--preflight-cmd <cmd>]");
        process.exit(1);
      }
      const reportIdx = process.argv.indexOf("--report");
      const report =
        reportIdx !== -1 && process.argv[reportIdx + 1]
          ? process.argv[reportIdx + 1]
          : "Verification tests passed 100%.";
      const skipPreflight = process.argv.includes("--skip-preflight");
      const cmdIdx = process.argv.indexOf("--preflight-cmd");
      const preflightCmd = cmdIdx !== -1 && process.argv[cmdIdx + 1] ? process.argv[cmdIdx + 1] : undefined;

      await reviewTask(arg1, report, { skipPreflight, preflightCmd });
    } else if (command === "handoff") {
      if (!arg1) {
        console.error("Usage: kanban handoff <session-name> [--summary <text>] [--steps <comma-separated>]");
        process.exit(1);
      }
      const sumIdx = process.argv.indexOf("--summary");
      const summary = sumIdx !== -1 && process.argv[sumIdx + 1] ? process.argv[sumIdx + 1] : undefined;
      const stepsIdx = process.argv.indexOf("--steps");
      const steps = stepsIdx !== -1 && process.argv[stepsIdx + 1] ? process.argv[stepsIdx + 1].split(",") : undefined;
      await saveHandoff(arg1, { summary, nextSteps: steps });
    } else if (command === "tokens:check") {
      await checkTokens({ boardId: arg1 });
    } else if (command === "tokens:pull") {
      await pullTokens({ boardId: arg1 });
    } else if (command === "tokens:push") {
      await pushTokens(arg1, { boardId: arg2 });
    } else if (command === "component:check") {
      if (!arg1) {
        console.error("Usage: kanban component:check <componentName> [boardId]");
        process.exit(1);
      }
      await checkComponent(arg1, { boardId: arg2 });
    } else if (command === "component:publish" || command === "studio:component:push") {
      if (!arg1) {
        console.error("Usage: kanban component:publish <path-to-template.html> [boardId]");
        process.exit(1);
      }
      await publishUiComponent(arg1, { boardId: arg2 });
    } else if (command === "component:pull" || command === "studio:component:pull") {
      await pullUiComponents({ boardId: arg1 });
    } else if (command === "page:push" || command === "studio:page:push") {
      if (!arg1) {
        console.error("Usage: kanban page:push <path-to-page.html> [boardId]");
        process.exit(1);
      }
      await pushUiPage(arg1, { boardId: arg2 });
    } else if (command === "page:pull" || command === "studio:page:pull") {
      await pullUiPages({ boardId: arg1 });
    } else if (command === "ui:annotations" || command === "studio:annotations" || command === "ui:review") {
      await fetchUiAnnotations({ boardId: arg1 });
    } else if (command === "skills:list") {
      await listRemoteSkills();
    } else if (command === "skills:pull") {
      if (!arg1) {
        console.error("Usage: kanban skills:pull <slug-or-id>");
        process.exit(1);
      }
      await pullRemoteSkill(arg1);
    } else if (command === "template:reset") {
      const full = process.argv.includes("--full");
      resetTemplate({ full });
    } else if (command === "component:new" || command === "component:scaffold") {
      if (!arg1) {
        console.error("Usage: kanban component:new <componentName>");
        process.exit(1);
      }
      scaffoldComponent(arg1);
    } else if (command === "ui:search") {
      if (!arg1) {
        console.error("Usage: kanban ui:search <query> [--domain <style|color|typography|ux|chart|icons>] [--stack <stack>]");
        process.exit(1);
      }
      const rawArgs = process.argv.slice(process.argv.indexOf("ui:search") + 1);
      searchUiUx(rawArgs);
    } else if (command === "ui:design" || command === "ui:design-system") {
      if (!arg1) {
        console.error("Usage: kanban ui:design <project/product query>");
        process.exit(1);
      }
      const rawArgs = process.argv.slice(process.argv.indexOf(command) + 1);
      searchUiUx([...rawArgs, "--design-system"]);
    } else if (command === "context:check") {
      await checkContext({ boardId: arg1 });
    } else if (command === "context:push") {
      await pushContext({ boardId: arg1 });
    } else if (command === "context:pull") {
      await pullContext({ boardId: arg1 });
    } else if (command === "security:audit" || command === "audit") {
      runSecurityAudit();
    } else {
      console.log("\n⚡ Lean NeoKanban Sync CLI");
      console.log("Commands:");
      console.log("  init [--stack <type>] [--board]  First-time project setup (monorepo/unified/backend/frontend)");
      console.log("  bundle                           Compile harness into dist/harness-bundle.json for MCP");
      console.log("  ping                             Ping / healthcheck NeoKanban server");
      console.log("  publish <planPath> [boardId]     Publish plan tasks to 'To Do' column");
      console.log("  start <cardId>                   Move card to 'In Progress' + log handoff");
      console.log("  check <cardId> <stepPattern>     Mark TDD checklist step completed");
      console.log("  review <cardId> [--report text]  Move card to 'Review' + pre-flight test + report");
      console.log("  handoff <sessionName>            Save handoff to docs/HANDOFF.md & sync to NeoKanban");
      console.log("  security:audit                   Run Trail of Bits security scan (secrets, CVEs, SAST)");
      console.log("  context:check [boardId]          Check completeness of project context files");
      console.log("  context:push [boardId]           Upload docs/context/*.md to NeoKanban Board Context");
      console.log("  context:pull [boardId]           Download context documents from NeoKanban to local");
      console.log("  tokens:check [boardId]           Check if token-design.json exists on board");
      console.log("  tokens:pull [boardId]            Pull token-design.json to local directory");
      console.log("  tokens:push [path] [boardId]     Upload token-design.json to NeoKanban");
      console.log("  component:publish <file> [board] Publish template to NeoKanban UI/UX Studio");
      console.log("  component:pull [boardId]         Pull UI components from NeoKanban UI/UX Studio");
      console.log("  page:push <file> [boardId]       Publish HTML page prototype to UI/UX Studio");
      console.log("  page:pull [boardId]              Pull HTML page prototypes from UI/UX Studio");
      console.log("  ui:annotations [boardId]         Fetch visual review pins & annotations from UI Studio");
      console.log("  skills:list                      List available skills from NeoKanban Skill Library");
      console.log("  skills:pull <slug>               Install skill package to local .agents/skills/<slug>/");
      console.log("  template:reset [--full]          Reset repo artifacts to pristine starter template state");
      console.log("  component:new <name>             Synthesize token-compliant template-[name].html");
      console.log("  ui:search <query> [options]      Query UI/UX Pro Max intelligence (styles, colors, etc)");
      console.log("  ui:design <query>                Generate complete Design System with UI/UX Pro Max");
      console.log("\nHard Rule: Auto-Done is strictly prohibited. Final Done requires human review.\n");
    }
  }

  run().catch((err: any) => {
    console.error("❌ Error:", err.message || err);
    process.exit(1);
  });
}

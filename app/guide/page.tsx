import Link from 'next/link'

export const dynamic = 'force-dynamic'

const BOOKMARKLET = `javascript:(function(){
  navigator.clipboard.readText().then(function(text){
    fetch(window.location.origin+'/api/ingest',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer YOUR_INGEST_TOKEN'
      },
      body:text
    })
    .then(r=>r.json())
    .then(d=>alert('✓ '+d.data.created+' tasks added to "'+d.data.project+'"'))
    .catch(()=>alert('✗ Ingest failed — check JSON or token'));
  });
})()`

const DOCKET_BASIC = `DOCKET: <project name>`

const DOCKET_TASK_LIST = `DOCKET: trace-forms

Fix TypeScript errors in PromptView.tsx
Build index route
Set up nightly cron`

const DOCKET_NEW = `DOCKET NEW: <describe the project in a sentence or two>`

const DOCKET_ADD = `DOCKET ADD: trace-forms`

const WORKFLOW = `PLAN HERE (Claude chat)
        ↓
DOCKET: <project>  →  copy JSON
        ↓
/ingest or bookmarklet  →  tasks on board
        ↓
EXPAND cards as needed  →  break down vague tasks
        ↓
Return to chat for architecture decisions`

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-10 border-b border-zinc-800 pb-1 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
      {children}
    </h2>
  )
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 font-mono text-xs uppercase tracking-wide text-zinc-300">
      {children}
    </h3>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-xs leading-relaxed text-zinc-400">
      {children}
    </p>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mb-4 overflow-x-auto border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-300">
      <code>{children}</code>
    </pre>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mb-3 ml-4 list-disc font-mono text-xs leading-relaxed text-zinc-400 marker:text-zinc-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default function GuidePage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10 bg-zinc-950 text-zinc-100">
      <header className="mb-10 flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-mono text-xs uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
          >
            ← DOCKET
          </Link>
          <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
            CLAUDE INTEGRATION GUIDE
          </h1>
        </div>
      </header>

      <SectionHeading>Section 1 — In-App Features</SectionHeading>

      <Subheading>Expand Card</Subheading>
      <Body>
        Hover over any card on a project board to reveal the EXPAND button. Click it to generate 2–5 concrete subtasks based on the card title and current board context. Select which subtasks to add and choose the target column before confirming.
      </Body>
      <Body>Best used when:</Body>
      <BulletList
        items={[
          'A card is too vague to act on directly',
          'You need to break down a large task mid-sprint',
          'You want concrete next steps without leaving the board',
        ]}
      />

      <Subheading>Generate Board</Subheading>
      <Body>
        Click GENERATE → on the home screen to describe a new project. Claude will generate a full task board with tasks distributed across TODO, IN PROGRESS, and DONE columns. Review and deselect tasks before creating the project.
      </Body>
      <Body>Best used when:</Body>
      <BulletList
        items={[
          'Starting a greenfield project',
          'You want a quick structural scaffold before detailed planning',
          'You need a shareable starting point for a new workstream',
        ]}
      />

      <SectionHeading>Section 2 — Docket Ticket Prompt</SectionHeading>

      <Body>
        This is the primary workflow for teams using Claude chat for planning. It bridges the gap between conversation and the board.
      </Body>

      <Subheading>Basic usage</Subheading>
      <Body>When you want to generate tasks from a Claude conversation, type:</Body>
      <Code>{DOCKET_BASIC}</Code>
      <Body>
        Claude will output an ingest-ready JSON payload based on the conversation context. Copy it and push it to the board via:
      </Body>
      <BulletList
        items={[
          'The /ingest page (mobile-friendly, paste and submit)',
          'The desktop bookmarklet (copy JSON → click bookmarklet → done)',
        ]}
      />

      <Subheading>Variations</Subheading>

      <Body>
        <span className="text-zinc-300">Tasks from conversation:</span>
      </Body>
      <Code>{DOCKET_BASIC}</Code>
      <Body>Claude generates tickets based on what was just discussed.</Body>

      <Body>
        <span className="text-zinc-300">Explicit task list:</span>
      </Body>
      <Code>{DOCKET_TASK_LIST}</Code>
      <Body>Claude formats your list as ingest JSON with smart column assignment.</Body>

      <Body>
        <span className="text-zinc-300">New project:</span>
      </Body>
      <Code>{DOCKET_NEW}</Code>
      <Body>
        Claude generates a full board payload. More accurate than in-app GENERATE because the chat session has full project context.
      </Body>

      <Body>
        <span className="text-zinc-300">Add tasks mid-conversation:</span>
      </Body>
      <Code>{DOCKET_ADD}</Code>
      <Body>
        Claude generates only new tasks surfaced in the current conversation, not tasks already on the board.
      </Body>

      <Subheading>What Claude returns</Subheading>
      <Body>
        A ready-to-paste JSON block followed by a one-line summary of what was generated and why columns were assigned as they were.
      </Body>

      <Subheading>The /ingest page</Subheading>
      <Body>
        Navigate to /ingest from any page. Paste the JSON payload and click PUSH. Success shows task count and project name. The page is mobile-optimized — use it from your phone after a planning session.
      </Body>

      <Subheading>The bookmarklet</Subheading>
      <Body>
        Save this to your browser bookmarks bar. Click it after copying ingest JSON to push directly without opening /ingest:
      </Body>
      <Code>{BOOKMARKLET}</Code>
      <Body>
        Replace YOUR_INGEST_TOKEN with the value of INGEST_TOKEN from your environment variables.
      </Body>

      <SectionHeading>Section 3 — Optimal Workflow</SectionHeading>

      <Code>{WORKFLOW}</Code>

      <Body>
        <span className="text-zinc-300">Use Claude chat for:</span>
      </Body>
      <BulletList
        items={[
          'Architecture decisions and tradeoffs',
          'Cross-project thinking and prioritization',
          'Open-ended exploration where context builds',
          "Anything where you don't yet know what you want",
        ]}
      />

      <Body>
        <span className="text-zinc-300">Use in-app Claude for:</span>
      </Body>
      <BulletList
        items={[
          'Low-friction task expansion mid-sprint',
          'Breaking down a specific card without context switching',
          'Quick next-step suggestions scoped to the current board',
        ]}
      />
    </main>
  )
}

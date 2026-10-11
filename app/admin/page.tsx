"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Moon,
  Sun,
} from "lucide-react";

type Paper = {
  id: string;
  title: string;
  subject: string;
  board: string;
  year: string;
  type: string;
  status: "Published" | "Needs review";
  downloads: number;
};

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Papers", icon: Archive },
  { label: "Boards & classes", icon: FolderKanban },
  { label: "Review queue", icon: ShieldCheck },
];

export default function AdminPage() {
  const [active, setActive] = useState("Overview");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [query, setQuery] = useState("");
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [dark, setDark] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<{
    id: number;
    code: string;
    name: string;
    class_count: number;
    paper_count: number;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("papyrus-admin-theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("admin-dark", saved);
    fetch("/api/papers")
      .then((response) => response.json())
      .then((data: { papers?: Array<Record<string, unknown>> }) => {
        if (!data.papers?.length) return;
        setPapers(
          data.papers.map((paper) => ({
            id: String(paper.id),
            title: String(paper.title),
            subject: String(paper.subject),
            board: String(paper.board),
            year: String(paper.year),
            type: String(paper.type),
            status: Number(paper.is_verified) ? "Published" : "Needs review",
            downloads: Number(paper.downloads) || 0,
          })),
        );
      })
      .catch(() => setNotice("Could not load papers from the database."));
  }, []);

  const reviewCount = papers.filter(
    (paper) => paper.status === "Needs review",
  ).length;
  const filteredPapers = useMemo(
    () =>
      papers.filter((paper) =>
        `${paper.title} ${paper.subject} ${paper.board}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [papers, query],
  );

  async function publish(id: string) {
    const response = await fetch(`/api/papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: true }),
    });
    if (!response.ok) {
      setNotice("The paper could not be approved.");
      return;
    }
    setPapers((current) =>
      current.map((paper) =>
        paper.id === id ? { ...paper, status: "Published" } : paper,
      ),
    );
    setNotice("Paper approved and published to the archive.");
  }

  async function deletePaper(id: string) {
    const response = await fetch(`/api/papers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setNotice("The paper could not be deleted.");
      return;
    }
    setPapers((current) => current.filter((paper) => paper.id !== id));
    setNotice("Paper deleted.");
  }

  function toggleDarkMode() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("admin-dark", next);
    localStorage.setItem("papyrus-admin-theme", next ? "dark" : "light");
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <span className="brand-mark">P</span>
          <span>
            <strong>papyrus</strong>
            <small>ADMIN STUDIO</small>
          </span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={active === label ? "selected" : ""}
              onClick={() => setActive(label)}
            >
              <Icon size={17} /> {label}
              {label === "Review queue" && reviewCount > 0 && (
                <b>{reviewCount}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setShowSettings(true)}>
            <Settings2 size={17} /> Settings
          </button>
          <a href="/">
            <ChevronDown size={15} /> Back to archive
          </a>
          <div className="admin-user">
            <span>AR</span>
            <div>
              <strong>Alex Reed</strong>
              <small>Super admin</small>
            </div>
            <MoreHorizontal size={16} />
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="mobile-kicker">PAPYRUS / ADMIN</span>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              onClick={toggleDarkMode}
              aria-label="Toggle admin dark mode"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="admin-avatar">AR</button>
          </div>
        </header>
        {notice && (
          <div className="notice">
            <Check size={16} /> {notice}
            <button onClick={() => setNotice("")}>
              <X size={15} />
            </button>
          </div>
        )}
        {active === "Overview" && (
          <Overview
            papers={papers}
            reviewCount={reviewCount}
            onReview={() => setActive("Review queue")}
            onPublish={publish}
          />
        )}
        {active === "Papers" && (
          <PapersView
            papers={filteredPapers}
            query={query}
            setQuery={setQuery}
            onEdit={setSelectedPaper}
            onPublish={publish}
            onDelete={deletePaper}
          />
        )}
        {active === "Review queue" && (
          <ReviewView
            papers={papers.filter((paper) => paper.status === "Needs review")}
            onPublish={publish}
          />
        )}
        {active === "Boards & classes" && (
          <BoardsView
            onAdd={() => setShowBoardForm(true)}
            onSelect={setSelectedBoard}
          />
        )}
      </main>
      {selectedPaper && (
        <PaperModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          onSaved={(title) => {
            setPapers((current) =>
              current.map((paper) =>
                paper.id === selectedPaper.id ? { ...paper, title } : paper,
              ),
            );
            setSelectedPaper(null);
            setNotice("Paper updated.");
          }}
        />
      )}
      {selectedBoard && (
        <BoardModal
          board={selectedBoard}
          onClose={() => setSelectedBoard(null)}
          onSaved={(name, code) => {
            setSelectedBoard({ ...selectedBoard, name, code });
            setNotice("Board updated.");
          }}
        />
      )}
      {showBoardForm && (
        <Modal title="Add a board" onClose={() => setShowBoardForm(false)}>
          <form
            className="admin-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const response = await fetch("/api/boards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: form.get("name"),
                  code: form.get("code"),
                  className: form.get("className"),
                  subjectName: form.get("subjectName"),
                }),
              });
              setShowBoardForm(false);
              setNotice(
                response.ok
                  ? "Board added to your catalogue."
                  : "Board could not be added. Check its name and code.",
              );
            }}
          >
            <label>
              Board name
              <input
                name="name"
                placeholder="e.g. Cambridge International"
                required
              />
            </label>
            <label>
              Short code
              <input name="code" placeholder="e.g. CAIE" required />
            </label>
            <label>
              First class level
              <input name="className" placeholder="e.g. Grade 9" required />
            </label>
            <label>
              First subject
              <input
                name="subjectName"
                placeholder="e.g. Mathematics"
                required
              />
            </label>
            <button className="button-primary" type="submit">
              <Plus size={16} /> Create board
            </button>
          </form>
        </Modal>
      )}
      {showSettings && (
        <Modal
          title="Workspace settings"
          onClose={() => setShowSettings(false)}
        >
          <div className="admin-guide">
            <p>Adjust the workspace appearance.</p>
            <button className="button-secondary" onClick={toggleDarkMode}>
              {dark ? <Sun size={16} /> : <Moon size={16} />} Use{" "}
              {dark ? "light" : "dark"} mode
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Overview({
  papers,
  reviewCount,
  onReview,
  onPublish,
}: {
  papers: Paper[];
  reviewCount: number;
  onReview: () => void;
  onPublish: (id: string) => void;
}) {
  const downloads = papers.reduce((sum, paper) => sum + paper.downloads, 0);
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">SUNDAY, 04 OCTOBER 2026</div>
          <h2>
            Good afternoon, Alex <span>✦</span>
          </h2>
          <p>Here&apos;s what&apos;s happening in your archive today.</p>
        </div>
      </div>
      <div className="stats-grid">
        <Stat
          icon={BookOpen}
          label="Total papers"
          value={papers.length.toLocaleString()}
          change={`${papers.filter((paper) => paper.status === "Published").length} published`}
          tone="amber"
        />
        <Stat
          icon={BarChart3}
          label="Downloads this month"
          value={downloads.toLocaleString()}
          change="Recorded downloads"
          tone="blue"
        />
        <Stat
          icon={ShieldCheck}
          label="Awaiting review"
          value={String(reviewCount)}
          change={reviewCount ? "Needs your attention" : "All caught up"}
          tone="rose"
        />
        <Stat
          icon={Users}
          label="Active students"
          value={String(new Set(papers.map((paper) => paper.board)).size)}
          change="Boards represented"
          tone="green"
        />
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ACTION NEEDED</div>
              <h3>Review queue</h3>
            </div>
            <button className="text-button" onClick={onReview}>
              View all <ChevronDown size={14} />
            </button>
          </div>
          {papers
            .filter((paper) => paper.status === "Needs review")
            .map((paper) => (
              <ReviewRow
                key={paper.id}
                paper={paper}
                onPublish={() => onPublish(paper.id)}
              />
            ))}
          <div className="queue-empty">
            <Check size={16} />{" "}
            {reviewCount
              ? `${reviewCount} papers ready for review`
              : "All caught up"}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ARCHIVE HEALTH</div>
              <h3>Collection growth</h3>
            </div>
            <select className="period-select">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="chart">
            <div className="chart-y">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div className="bars">
              {[34, 46, 41, 65, 54, 72, 62, 87, 74, 96, 83, 100].map(
                (height, index) => (
                  <span key={index} style={{ height: `${height}%` }} />
                ),
              )}
            </div>
          </div>
          <div className="chart-labels">
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
          </div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">LATEST ACTIVITY</div>
            <h3>Recently added</h3>
          </div>
        </div>
        <div className="recent-list">
          {papers.slice(0, 3).map((paper) => (
            <div className="recent-item" key={paper.id}>
              <div className="file-icon">
                <BookOpen size={17} />
              </div>
              <div>
                <strong>{paper.title}</strong>
                <small>
                  {paper.subject} · {paper.board} · Added today
                </small>
              </div>
              <span
                className={`status ${paper.status === "Published" ? "published" : "review"}`}
              >
                {paper.status}
              </span>
              <MoreHorizontal size={17} color="var(--slate)" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  change,
  tone,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  change: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <strong>{value}</strong>
      <small className={tone === "rose" ? "attention" : ""}>{change}</small>
    </div>
  );
}
function ReviewRow({
  paper,
  onPublish,
}: {
  paper: Paper;
  onPublish: () => void;
}) {
  return (
    <div className="review-row">
      <div className="file-icon">
        <BookOpen size={17} />
      </div>
      <div className="review-details">
        <strong>{paper.title}</strong>
        <small>
          {paper.subject} · {paper.board} · Uploaded 2h ago
        </small>
      </div>
      <button className="approve-button" onClick={onPublish}>
        <Check size={14} /> Approve
      </button>
      <button className="icon-button">
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}
function PapersView({
  papers,
  query,
  setQuery,
  onEdit,
  onPublish,
  onDelete,
}: {
  papers: Paper[];
  query: string;
  setQuery: (value: string) => void;
  onEdit: (paper: Paper) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">CONTENT LIBRARY</div>
          <h2>
            All papers <span className="count-pill">{papers.length}</span>
          </h2>
        </div>
      </div>
      <div className="table-tools">
        <div className="admin-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search papers, subjects, boards..."
          />
        </div>
        <button className="filter-button">
          All statuses <ChevronDown size={14} />
        </button>
      </div>
      <div className="panel table-panel">
        <div className="paper-table header-row">
          <span>Paper</span>
          <span>Board</span>
          <span>Year</span>
          <span>Status</span>
          <span>Downloads</span>
          <span />
        </div>
        {papers.map((paper) => (
          <div className="paper-table" key={paper.id}>
            <div className="table-paper">
              <div className="file-icon">
                <BookOpen size={15} />
              </div>
              <span>
                <strong>{paper.title}</strong>
                <small>
                  {paper.subject} · {paper.type}
                </small>
              </span>
            </div>
            <span>{paper.board}</span>
            <span>{paper.year}</span>
            <span
              className={`status ${paper.status === "Published" ? "published" : "review"}`}
            >
              {paper.status}
            </span>
            <span>{paper.downloads}</span>
            <span className="row-actions">
              <button onClick={() => onEdit(paper)} title="Edit paper">
                <Settings2 size={15} />
              </button>
              {paper.status === "Needs review" && (
                <button onClick={() => onPublish(paper.id)} title="Approve">
                  <Check size={15} />
                </button>
              )}
              <button onClick={() => onDelete(paper.id)} title="Delete">
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function ReviewView({
  papers,
  onPublish,
}: {
  papers: Paper[];
  onPublish: (id: string) => void;
}) {
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">MODERATION</div>
          <h2>
            Review queue <span className="count-pill">{papers.length}</span>
          </h2>
          <p>Check metadata before papers become visible to students.</p>
        </div>
      </div>
      <div className="review-grid">
        {papers.map((paper) => (
          <div className="review-card" key={paper.id}>
            <div className="review-cover">
              <BookOpen size={28} />
              <span>PDF</span>
            </div>
            <div className="review-card-content">
              <span className="status review">Needs review</span>
              <h3>{paper.title}</h3>
              <p>
                {paper.subject} · {paper.board} · {paper.year}
              </p>
              <div className="review-card-actions">
                <button className="button-secondary">
                  <MoreHorizontal size={15} /> Inspect
                </button>
                <button
                  className="button-primary"
                  onClick={() => onPublish(paper.id)}
                >
                  <Check size={15} /> Approve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function BoardsView({
  onAdd,
  onSelect,
}: {
  onAdd: () => void;
  onSelect: (board: {
    id: number;
    code: string;
    name: string;
    class_count: number;
    paper_count: number;
  }) => void;
}) {
  const [boards, setBoards] = useState<
    Array<{
      id: number;
      code: string;
      name: string;
      class_count: number;
      paper_count: number;
    }>
  >([]);
  useEffect(() => {
    fetch("/api/boards")
      .then((response) => response.json())
      .then((data: { boards?: typeof boards }) => setBoards(data.boards || []));
  }, []);
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">ARCHIVE STRUCTURE</div>
          <h2>Boards & classes</h2>
          <p>Organise your catalogue by curriculum and level.</p>
        </div>
        <button className="button-primary" onClick={onAdd}>
          <Plus size={17} /> Add board
        </button>
      </div>
      <div className="board-grid">
        {boards.map((board) => (
          <div className="board-card" key={board.id}>
            <div className="board-mark blue">{board.code}</div>
            <div>
              <h3>{board.name}</h3>
              <p>
                {board.class_count} classes <span>·</span> {board.paper_count}{" "}
                papers
              </p>
            </div>
            <button
              className="icon-button"
              onClick={() => onSelect(board)}
              aria-label={`Open ${board.name}`}
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function PaperModal({
  paper,
  onClose,
  onSaved,
}: {
  paper: Paper;
  onClose: () => void;
  onSaved: (title: string) => void;
}) {
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(
      new FormData(event.currentTarget).get("title") || "",
    ).trim();
    const response = await fetch(`/api/papers/${paper.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (response.ok) onSaved(title);
  }
  return (
    <Modal title="Edit paper" onClose={onClose}>
      <form className="admin-form" onSubmit={save}>
        <label>
          Paper title
          <input name="title" defaultValue={paper.title} required />
        </label>
        <p>
          {paper.subject} · {paper.board} · {paper.year} · {paper.type}
        </p>
        <button className="button-primary" type="submit">
          Save changes
        </button>
      </form>
    </Modal>
  );
}
function BoardModal({
  board,
  onClose,
  onSaved,
}: {
  board: {
    id: number;
    code: string;
    name: string;
    class_count: number;
    paper_count: number;
  };
  onClose: () => void;
  onSaved: (name: string, code: string) => void;
}) {
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const code = String(form.get("code") || "").trim();
    const response = await fetch(`/api/boards/${board.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    if (response.ok) onSaved(name, code.toUpperCase());
  }
  return (
    <Modal title="Board details" onClose={onClose}>
      <form className="admin-form" onSubmit={save}>
        <label>
          Board name
          <input name="name" defaultValue={board.name} required />
        </label>
        <label>
          Short code
          <input name="code" defaultValue={board.code} required />
        </label>
        <p>
          {board.paper_count} papers across {board.class_count} classes.
        </p>
        <button className="button-primary" type="submit">
          Save board
        </button>
      </form>
    </Modal>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal">
        <header>
          <div>
            <div className="eyebrow">PAPYRUS / ADMIN</div>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

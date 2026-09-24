import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./auth";
import { TitleBar } from "./TitleBar";
import { CreateBugModal } from "./CreateBugModal";
import { EditBugModal, type Bug } from "./EditBugModal";

type BugStateFilter = "OPEN" | "CLOSED";

interface BugRow {
  id: number;
  title: string;
  severity: string;
  owner: string;
  state: string;
}

type SortColumn = "id" | "severity" | "title" | "owner";
type SortDirection = "asc" | "desc";

/** Severity priority for sort: LOW=0, MID=1, HIGH=2 (ascending = LOW then MID then HIGH). */
function severityOrder(s: string): number {
  const u = s.toUpperCase();
  if (u === "LOW") return 0;
  if (u === "MID") return 1;
  if (u === "HIGH") return 2;
  return 1;
}

/** Map API severity (HIGH/MID/LOW) to badge class suffix. */
function severityBadgeClass(severity: string): string {
  const s = severity.toUpperCase();
  if (s === "HIGH") return "severity-badge-high";
  if (s === "MID") return "severity-badge-mid";
  if (s === "LOW") return "severity-badge-low";
  return "severity-badge-mid";
}

/**
 * Search forms of a text: lower case, whitespace collapsed, and punctuation either removed or read as
 * a space. Trying both keeps "login" matching "log-in" (spec 11) and "save load" matching "save/load".
 */
function searchForms(text: string): string[] {
  const lower = text.toLowerCase();
  const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
  return [collapse(lower.replace(/\p{P}/gu, "")), collapse(lower.replace(/\p{P}/gu, " "))];
}

function titleMatchesSearch(title: string, query: string): boolean {
  if (query.trim() === "") return true;
  const titleForms = searchForms(title);
  return searchForms(query).some((q) => titleForms.some((t) => t.includes(q)));
}

function sortBugs(bugs: BugRow[], column: SortColumn, direction: SortDirection): BugRow[] {
  const sorted = [...bugs];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (column) {
      case "id":
        cmp = a.id - b.id;
        break;
      case "severity":
        cmp = severityOrder(a.severity) - severityOrder(b.severity);
        break;
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
      case "owner":
        cmp = a.owner.localeCompare(b.owner);
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

export function BoardPage() {
  const { user } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editBug, setEditBug] = useState<Bug | null>(null);
  const [bugs, setBugs] = useState<BugRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>("severity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<BugStateFilter>("OPEN");
  const [loadError, setLoadError] = useState(false);
  // The id makes a repeated message ("Bug saved." twice) a new value, so it is announced again.
  const [lastAction, setLastAction] = useState<{ text: string; id: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const announceSeq = useRef(0);
  const announceTimer = useRef<ReturnType<typeof setTimeout>>();
  // Only the newest board refresh may update the list; an older, slower one is ignored.
  const fetchRequest = useRef(0);
  // Only the newest row click may open the modal; an older, slower response is ignored.
  const openRequest = useRef(0);

  useEffect(() => {
    document.title = "Board – BuggyBoard";
    document.getElementById("board-heading")?.focus({ preventScroll: true });
  }, []);

  const bugsByState = useMemo(
    () => bugs.filter((bug) => bug.state.toUpperCase() === stateFilter),
    [bugs, stateFilter]
  );

  const filteredBugs = useMemo(
    () => bugsByState.filter((bug) => titleMatchesSearch(bug.title, searchQuery)),
    [bugsByState, searchQuery]
  );

  const sortedBugs = useMemo(
    () => sortBugs(filteredBugs, sortColumn, sortDirection),
    [filteredBugs, sortColumn, sortDirection]
  );

  function handleSortHeader(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const announce = useCallback((text: string) => {
    setLastAction({ text, id: ++announceSeq.current });
  }, []);

  const fetchBugs = useCallback(async () => {
    const request = ++fetchRequest.current;
    try {
      const res = await fetch("/api/bugs");
      if (!res.ok) throw new Error(`GET /api/bugs ${res.status}`);
      const data = (await res.json()) as BugRow[];
      if (request !== fetchRequest.current) return;
      setBugs(data);
      setLoadError(false);
    } catch {
      if (request === fetchRequest.current) setLoadError(true);
    } finally {
      if (request === fetchRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  async function handleRowClick(bugId: number) {
    const request = ++openRequest.current;
    try {
      const res = await fetch(`/api/bugs/${bugId}`);
      if (request !== openRequest.current) return;
      if (res.ok) {
        const bug = (await res.json()) as Bug;
        if (request !== openRequest.current) return;
        setNotice(null);
        setEditBug(bug);
      } else if (res.status === 404) {
        setNotice("That bug no longer exists.");
        announce("That bug no longer exists.");
        fetchBugs();
      } else {
        setNotice("Couldn't open the bug. Try again.");
        announce("Couldn't open the bug. Try again.");
      }
    } catch {
      if (request !== openRequest.current) return;
      setNotice("Couldn't open the bug. Try again.");
      announce("Couldn't open the bug. Try again.");
    }
  }

  // A drag that selects title text is not a click on the row.
  function isTextSelectionClick(e: React.MouseEvent): boolean {
    return e.detail > 0 && (window.getSelection()?.toString() ?? "") !== "";
  }

  // One polite status line for screen readers: what just happened, then what the board now shows.
  useEffect(() => {
    if (loading) return;
    const count = loadError
      ? "Couldn't load bugs."
      : sortedBugs.length === 0
        ? bugs.length > 0
          ? "No bugs matched."
          : "No bugs."
        : `${sortedBugs.length} ${stateFilter === "OPEN" ? "open" : "closed"} ${sortedBugs.length === 1 ? "bug" : "bugs"} shown.`;
    const message = [lastAction?.text, count].filter(Boolean).join(" ");
    // Clear, then set after a beat, so screen readers announce a message even when its text repeats.
    setAnnouncement("");
    clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(message), 100);
    return () => clearTimeout(announceTimer.current);
  }, [loading, loadError, sortedBugs.length, bugs.length, stateFilter, lastAction]);

  // A deleted row takes focus with it; put focus somewhere sensible instead of <body>.
  useEffect(() => {
    if (!loading && document.activeElement === document.body && !createModalOpen && editBug === null) {
      document.getElementById("board-heading")?.focus({ preventScroll: true });
    }
  }, [bugs, loading, createModalOpen, editBug]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <TitleBar
        onNewBug={() => {
          // Cancel a row open still in flight, so its bug can't open on top of the new one.
          openRequest.current++;
          setNotice(null);
          setCreateModalOpen(true);
        }}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setLastAction(null);
          setNotice(null);
          setSearchQuery(value);
        }}
      />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-5">
            <div
              className="flex rounded-lg border border-stone-200 bg-white p-0.5 shadow-sm"
              role="group"
              aria-label="Filter by bug state"
            >
              <button
                type="button"
                aria-pressed={stateFilter === "OPEN"}
                onClick={() => {
                  setLastAction(null);
                  setNotice(null);
                  setStateFilter("OPEN");
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-1 ${
                  stateFilter === "OPEN"
                    ? "bg-primary text-stone-800 shadow-sm ring-1 ring-stone-200/50 underline decoration-2 underline-offset-4"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                Open
              </button>
              <button
                type="button"
                aria-pressed={stateFilter === "CLOSED"}
                onClick={() => {
                  setLastAction(null);
                  setNotice(null);
                  setStateFilter("CLOSED");
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-1 ${
                  stateFilter === "CLOSED"
                    ? "bg-primary text-stone-800 shadow-sm ring-1 ring-stone-200/50 underline decoration-2 underline-offset-4"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                Closed
              </button>
            </div>
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {announcement}
          </p>
          {notice && (
            // Screen readers already hear this through the status line above.
            <p className="mb-3 text-center text-sm font-medium text-red-700" aria-hidden="true">
              {notice}
            </p>
          )}
          <section className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
            {/* Focusable so keyboard users can scroll a table wider than a narrow screen. */}
            <div className="overflow-x-auto focus:outline-none focus:ring-2 focus:ring-stone-600" role="region" aria-label="Bug table" tabIndex={0}>
              <table className="w-full text-left" aria-label="Bugs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600 text-sm font-medium uppercase tracking-wide">
                    <th className="px-4 py-3 w-20" scope="col" aria-sort={sortColumn === "id" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                      <button
                        type="button"
                        onClick={() => handleSortHeader("id")}
                        className="flex items-center gap-1 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-1 rounded"
                      >
                        ID
                        <span className="inline-block w-4 text-center" aria-hidden="true">
                          {sortColumn === "id" ? (sortDirection === "asc" ? "↑" : "↓") : "\u00A0"}
                        </span>
                      </button>
                    </th>
                    <th className="px-4 py-3 w-24" scope="col" aria-sort={sortColumn === "severity" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                      <button
                        type="button"
                        onClick={() => handleSortHeader("severity")}
                        className="flex items-center gap-1 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-1 rounded"
                      >
                        Severity
                        <span className="inline-block w-4 text-center" aria-hidden="true">
                          {sortColumn === "severity" ? (sortDirection === "asc" ? "↑" : "↓") : "\u00A0"}
                        </span>
                      </button>
                    </th>
                    <th className="px-4 py-3" scope="col" aria-sort={sortColumn === "title" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                      <button
                        type="button"
                        onClick={() => handleSortHeader("title")}
                        className="flex items-center gap-1 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-1 rounded"
                      >
                        Title
                        <span className="inline-block w-4 text-center" aria-hidden="true">
                          {sortColumn === "title" ? (sortDirection === "asc" ? "↑" : "↓") : "\u00A0"}
                        </span>
                      </button>
                    </th>
                    <th className="px-4 py-3 w-40" scope="col" aria-sort={sortColumn === "owner" ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>
                      <button
                        type="button"
                        onClick={() => handleSortHeader("owner")}
                        className="flex items-center gap-1 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-1 rounded"
                      >
                        Owner
                        <span className="inline-block w-4 text-center" aria-hidden="true">
                          {sortColumn === "owner" ? (sortDirection === "asc" ? "↑" : "↓") : "\u00A0"}
                        </span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
                        Loading…
                      </td>
                    </tr>
                  ) : loadError ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-red-700" role="alert">
                        Couldn&apos;t load bugs.{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setLoading(true);
                            fetchBugs();
                          }}
                          className="underline font-medium focus:outline-none focus:ring-2 focus:ring-stone-600 rounded"
                        >
                          Try again
                        </button>
                      </td>
                    </tr>
                  ) : sortedBugs.length === 0 && bugs.length > 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
                        No bugs matched.
                      </td>
                    </tr>
                  ) : sortedBugs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-stone-500">
                        No bugs.
                      </td>
                    </tr>
                  ) : (
                    sortedBugs.map((bug) => (
                      <tr
                        key={bug.id}
                        onClick={(e) => {
                          if (!isTextSelectionClick(e)) handleRowClick(bug.id);
                        }}
                        className="border-b border-stone-100 hover:bg-stone-50/80 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-stone-500 font-mono text-sm">{bug.id}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`severity-badge ${severityBadgeClass(bug.severity)}`}
                            data-severity={bug.severity.toUpperCase()}
                          >
                            {bug.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-800 [overflow-wrap:anywhere]">
                          {/* The row stays a real table row; this button is its keyboard and screen-reader way in. */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isTextSelectionClick(e)) handleRowClick(bug.id);
                            }}
                            className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-stone-600 rounded"
                          >
                            {bug.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-stone-600">{bug.owner}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <CreateBugModal
        isOpen={createModalOpen}
        defaultOwner={user?.username ?? ""}
        onClose={() => setCreateModalOpen(false)}
        onSaved={() => {
          setLastAction(null);
          fetchBugs().then(() => announce("Bug created."));
        }}
      />
      <EditBugModal
        bug={editBug}
        onClose={() => setEditBug(null)}
        onSaved={(outcome) => {
          setLastAction(null);
          setEditBug(null);
          // Announce after the list reloads, so the count read out is the new one.
          fetchBugs().then(() => announce(outcome === "deleted" ? "Bug deleted." : "Bug saved."));
        }}
        onGone={fetchBugs}
      />
    </div>
  );
}

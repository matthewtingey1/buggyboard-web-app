import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

interface TitleBarProps {
  /** When provided, a "New Bug" button is shown in the title bar that calls this when clicked. */
  onNewBug?: () => void;
  /** When provided, a search field is shown to the left of the New Bug button. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function TitleBar({
  onNewBug,
  searchValue = "",
  onSearchChange,
}: TitleBarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const showSearch = onSearchChange != null;
  const showClear = showSearch && searchValue.trim() !== "";
  const searchInputRef = useRef<HTMLInputElement>(null);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 rounded-lg overflow-hidden bg-stone-200 ring-1 ring-stone-300">
          <img
            src="/logo_50x50.png"
            alt="BuggyBoard"
            width={50}
            height={50}
            className="block"
          />
        </div>
        <h1 id="board-heading" tabIndex={-1} className="text-3xl leading-10 font-bold text-stone-800 focus:outline-none">
          BuggyBoard
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        {showSearch && (
          <div
            role="search"
            className="flex items-center w-full min-w-0 sm:w-80 rounded-lg border border-stone-500 bg-stone-50 focus-within:border-stone-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-stone-600 transition-colors"
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search bugs…"
              aria-label="Search bugs by title"
              className="flex-1 min-w-0 rounded-l border-0 bg-transparent px-3 py-2 text-stone-800 placeholder-stone-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
              className={`flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded text-stone-500 hover:bg-stone-200 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-1 ${showClear ? "" : "invisible pointer-events-none"}`}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
        {showSearch && onNewBug != null && (
          <div className="h-6 w-px bg-stone-200" aria-hidden="true" />
        )}
        {onNewBug != null && (
          <button
            type="button"
            onClick={onNewBug}
            className="rounded-lg px-4 py-2 text-base font-medium text-stone-800 border border-primary/60 bg-primary/25 hover:bg-primary/35 hover:border-primary focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
          >
            New Bug
          </button>
        )}
        {onNewBug != null && (
          <div className="h-6 w-px bg-stone-200" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-4 py-2 text-base font-medium text-stone-600 border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string; sublabel?: string }[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  id?: string
  "aria-invalid"?: boolean
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  className,
  id,
  ...rest
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [highlightIndex, setHighlightIndex] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false),
    )
  }, [options, query])

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  function selectOption(val: string) {
    onValueChange(val)
    setOpen(false)
  }

  function toggleOpen() {
    if (!open) {
      setQuery("")
      setHighlightIndex(0)
    }
    setOpen(!open)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setQuery("")
        setHighlightIndex(0)
        setOpen(true)
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filtered[highlightIndex]) {
        selectOption(filtered[highlightIndex].value)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  React.useEffect(() => {
    if (open && listRef.current) {
      const highlighted = listRef.current.children[highlightIndex] as HTMLElement
      highlighted?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIndex, open])

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        id={id}
        type="button"
        data-invalid={rest["aria-invalid"] ? "" : undefined}
        onClick={toggleOpen}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-3 data-[invalid]:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50",
          className,
        )}
      >
        <span className={cn("flex-1 truncate text-left", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 rounded-lg border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlightIndex(0)
                }}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
              />
            </div>
          </div>
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((option, i) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option.value)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
                    i === highlightIndex && "bg-accent text-accent-foreground",
                    value === option.value && "font-medium",
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.sublabel}
                      </span>
                    )}
                  </span>
                  {value === option.value && <Check className="size-4 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

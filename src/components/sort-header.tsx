import { ArrowDown, ArrowUp } from "lucide-react"
import { TableHead } from "@/components/ui/table"

interface SortHeaderProps {
  field: string
  label: string
  activeSort: string
  order: "asc" | "desc"
  onSort: (field: string) => void
  className?: string
}

export function SortHeader({
  field,
  label,
  activeSort,
  order,
  onSort,
  className,
}: SortHeaderProps) {
  const isActive = activeSort === field
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {isActive && (order === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </TableHead>
  )
}

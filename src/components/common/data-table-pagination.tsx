import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface Pagination {
  /** 1-based page number. */
  page: number
  pageSize: number
}

interface DataTablePaginationProps {
  pagination: Pagination
  /** Total number of rows on the server, across all pages. */
  total: number
  onPaginationChange: (pagination: Pagination) => void
  pageSizeOptions?: readonly number[]
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const

/** Controls for server-side pagination. The parent owns the state. */
export function DataTablePagination({
  pagination,
  total,
  onPaginationChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
  const { t } = useTranslation()
  const { page, pageSize } = pagination
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, total)
  const goToPage = (nextPage: number) =>
    onPaginationChange({ page: nextPage, pageSize })

  return (
    <div className="flex flex-col items-start justify-between gap-4 border-t p-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="pagination.showing"
            values={{ first: firstRow, last: lastRow, total }}
            components={{
              total: <span className="font-medium text-foreground" />,
            }}
          />
        </p>
        <div className="flex items-center gap-x-2">
          <p className="text-sm text-muted-foreground">
            {t("pagination.rowsPerPage")}
          </p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPaginationChange({ page: 1, pageSize: Number(value) })
            }
          >
            <SelectTrigger
              className="h-8"
              aria-label={t("pagination.rowsPerPage")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-x-6">
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="pagination.page"
            values={{ page, pageCount }}
            components={{
              current: <span className="font-medium text-foreground" />,
              count: <span className="font-medium text-foreground" />,
            }}
          />
        </p>
        <div className="flex items-center gap-x-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(1)}
            disabled={page <= 1}
          >
            <span className="sr-only">{t("pagination.first")}</span>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <span className="sr-only">{t("pagination.previous")}</span>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pageCount}
          >
            <span className="sr-only">{t("pagination.next")}</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(pageCount)}
            disabled={page >= pageCount}
          >
            <span className="sr-only">{t("pagination.last")}</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

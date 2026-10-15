import {
  type ColumnDef,
  flexRender,
  type RowData,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// Pagination, sorting and filtering run on the server, so the table registers
// no TanStack Table features. It only maps column definitions to rows.
const dataTableFeatures = tableFeatures({})

export type DataTableColumn<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData
>

interface DataTableProps<TData extends RowData> {
  columns: DataTableColumn<TData>[]
  data: TData[]
  /** Dims the rows while a new page loads and the previous page is still shown. */
  isRefreshing?: boolean
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  isRefreshing = false,
}: DataTableProps<TData>) {
  const table = useTable({ features: dataTableFeatures, data, columns })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody
        className={cn("transition-opacity", isRefreshing && "opacity-60")}
        aria-busy={isRefreshing}
      >
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface DataTableSkeletonProps {
  columns: number
  rows?: number
}

/** Loading placeholder with the same layout as DataTable. */
export function DataTableSkeleton({
  columns,
  rows = 5,
}: DataTableSkeletonProps) {
  const columnKeys = Array.from({ length: columns }, (_, index) => index)
  const rowKeys = Array.from({ length: rows }, (_, index) => index)

  return (
    <Table data-testid="data-table-skeleton" aria-busy>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columnKeys.map((column) => (
            <TableHead key={column}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowKeys.map((row) => (
          <TableRow key={row}>
            {columnKeys.map((column) => (
              <TableCell key={column}>
                <Skeleton className="h-4 w-full max-w-48" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

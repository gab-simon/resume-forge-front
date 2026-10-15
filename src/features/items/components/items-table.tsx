import { Inbox } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { getErrorMessage } from "@/api/errors"
import type { ItemResource } from "@/api/generated"
import { DataTable, DataTableSkeleton } from "@/components/common/data-table"
import { DataTablePagination } from "@/components/common/data-table-pagination"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { useItemsList } from "../api/queries"
import { ITEMS_PAGE_SIZE_OPTIONS, type ItemsPagination } from "../schemas"
import { getItemColumns } from "./items-columns"

interface ItemsTableProps {
  pagination: ItemsPagination
  onPaginationChange: (pagination: ItemsPagination) => void
  onEdit: (item: ItemResource) => void
  onDelete: (item: ItemResource) => void
}

export function ItemsTable({
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
}: ItemsTableProps) {
  const { t } = useTranslation()
  const { data, error, isPending, isPlaceholderData, refetch } =
    useItemsList(pagination)
  const columns = useMemo(
    () => getItemColumns({ t, onEdit, onDelete }),
    [t, onEdit, onDelete],
  )

  // Deleting the only row of the last page leaves the URL on a page that no
  // longer exists. Move back to the new last page.
  const lastPage = data
    ? Math.max(1, Math.ceil(data.total / pagination.pageSize))
    : undefined
  useEffect(() => {
    if (lastPage !== undefined && pagination.page > lastPage) {
      onPaginationChange({ page: lastPage, pageSize: pagination.pageSize })
    }
  }, [lastPage, pagination.page, pagination.pageSize, onPaginationChange])

  if (isPending) {
    return <DataTableSkeleton columns={3} />
  }

  if (error) {
    return (
      <ErrorState
        title={t("items.loadError")}
        message={getErrorMessage(error, t("errors.unexpected"))}
        onRetry={() => void refetch()}
      />
    )
  }

  if (data.total === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={t("items.empty.title")}
        description={t("items.empty.description")}
      />
    )
  }

  return (
    <div className="flex flex-col">
      <DataTable
        columns={columns}
        data={data.items}
        isRefreshing={isPlaceholderData}
      />
      <DataTablePagination
        pagination={pagination}
        total={data.total}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={ITEMS_PAGE_SIZE_OPTIONS}
      />
    </div>
  )
}

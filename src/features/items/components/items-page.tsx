import { Plus } from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ItemResource } from "@/api/generated"
import { Button } from "@/components/ui/button"
import type { ItemsPagination } from "../schemas"
import { DeleteItemDialog } from "./delete-item-dialog"
import { ItemFormDialog } from "./item-form-dialog"
import { ItemsTable } from "./items-table"

// `item` stays set while a dialog plays its closing animation, so the dialog
// keeps showing the same title and text until it unmounts.
interface DialogState {
  open: boolean
  item?: ItemResource
}

interface ItemsPageProps {
  /** Pagination lives in the URL. The route reads it and passes it down. */
  pagination: ItemsPagination
  onPaginationChange: (pagination: ItemsPagination) => void
}

export function ItemsPage({ pagination, onPaginationChange }: ItemsPageProps) {
  const { t } = useTranslation()
  const [formDialog, setFormDialog] = useState<DialogState>({ open: false })
  const [deleteDialog, setDeleteDialog] = useState<DialogState>({ open: false })

  const openEdit = useCallback(
    (item: ItemResource) => setFormDialog({ open: true, item }),
    [],
  )
  const openDelete = useCallback(
    (item: ItemResource) => setDeleteDialog({ open: true, item }),
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("items.title")}
          </h1>
          <p className="text-muted-foreground">{t("items.description")}</p>
        </div>
        <Button onClick={() => setFormDialog({ open: true })}>
          <Plus />
          {t("items.add")}
        </Button>
      </div>

      <ItemsTable
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <ItemFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog((state) => ({ ...state, open }))}
        item={formDialog.item}
      />
      <DeleteItemDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((state) => ({ ...state, open }))
        }
        item={deleteDialog.item}
      />
    </div>
  )
}

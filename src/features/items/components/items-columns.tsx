import type { TFunction } from "i18next"
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react"
import type { ItemResource } from "@/api/generated"
import type { DataTableColumn } from "@/components/common/data-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ItemColumnOptions {
  /** From useTranslation. The columns are rebuilt when the language changes. */
  t: TFunction
  onEdit: (item: ItemResource) => void
  onDelete: (item: ItemResource) => void
}

export function getItemColumns({
  t,
  onEdit,
  onDelete,
}: ItemColumnOptions): DataTableColumn<ItemResource>[] {
  return [
    {
      accessorKey: "name",
      header: t("items.fields.name"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: t("items.fields.description"),
      cell: ({ row }) =>
        row.original.description ? (
          <span className="block max-w-md truncate text-muted-foreground">
            {row.original.description}
          </span>
        ) : (
          <span className="text-muted-foreground italic">
            {t("items.fields.noDescription")}
          </span>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("common.actions")}</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical />
                <span className="sr-only">
                  {t("common.actionsFor", { name: row.original.name })}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                <Pencil />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(row.original)}
              >
                <Trash2 />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}

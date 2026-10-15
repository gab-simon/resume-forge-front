import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { getErrorMessage } from "@/api/errors"
import type { ItemResource } from "@/api/generated"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import { useDeleteItem } from "../api/mutations"

interface DeleteItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ItemResource
}

export function DeleteItemDialog({
  open,
  onOpenChange,
  item,
}: DeleteItemDialogProps) {
  const { t } = useTranslation()
  const deleteItem = useDeleteItem()

  function onConfirm() {
    if (!item) {
      return
    }
    deleteItem.mutate(
      { path: { item_id: item.item_id } },
      {
        onSuccess: () => {
          toast.success(t("items.toast.deleted"))
          onOpenChange(false)
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, t("errors.unexpected"))),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("items.delete.title")}</DialogTitle>
          <DialogDescription>
            {t("items.delete.description", { name: item?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={deleteItem.isPending}
            >
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <LoadingButton
            variant="destructive"
            loading={deleteItem.isPending}
            onClick={onConfirm}
          >
            {t("common.delete")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

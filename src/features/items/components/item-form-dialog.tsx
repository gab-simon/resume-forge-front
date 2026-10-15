import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { useCreateItem, useUpdateItem } from "../api/mutations"
import { type ItemFormValues, itemFormSchema, toItemPayload } from "../schemas"

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The item to edit. Omit it to create a new item. */
  item?: ItemResource
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
}: ItemFormDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? t("items.form.editTitle") : t("items.form.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {item
              ? t("items.form.editDescription")
              : t("items.form.addDescription")}
          </DialogDescription>
        </DialogHeader>
        {/* DialogContent unmounts when the dialog closes, so ItemForm starts
            with fresh default values each time the dialog opens. */}
        <ItemForm item={item} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

interface ItemFormProps {
  item?: ItemResource
  onDone: () => void
}

function ItemForm({ item, onDone }: ItemFormProps) {
  const { t } = useTranslation()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const isPending = createItem.isPending || updateItem.isPending

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    mode: "onBlur",
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
    },
  })

  function onSubmit(values: ItemFormValues) {
    const body = toItemPayload(values)
    const onError = (error: unknown) =>
      toast.error(getErrorMessage(error, t("errors.unexpected")))

    if (item) {
      updateItem.mutate(
        { path: { item_id: item.item_id }, body },
        {
          onSuccess: () => {
            toast.success(t("items.toast.updated"))
            onDone()
          },
          onError,
        },
      )
    } else {
      createItem.mutate(
        { body },
        {
          onSuccess: () => {
            toast.success(t("items.toast.created"))
            onDone()
          },
          onError,
        },
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("items.fields.name")}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("items.fields.name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("items.fields.description")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("items.fields.description")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <LoadingButton type="submit" loading={isPending}>
            {t("common.save")}
          </LoadingButton>
        </DialogFooter>
      </form>
    </Form>
  )
}

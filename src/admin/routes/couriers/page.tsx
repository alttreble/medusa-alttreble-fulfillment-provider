import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TruckFast } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { sdk } from "../../lib/client"

type SafeCourier = {
  id?: string
  provider: string
  label: string | null
  is_enabled: boolean
  test_mode: boolean
  credentials: Record<string, unknown>
  password_set: boolean
}

// Couriers the plugin knows how to talk to. Each is shown even before it's
// configured so the merchant can set it up from here.
const SUPPORTED_COURIERS: { provider: string; label: string }[] = [
  { provider: "econt", label: "Econt Express" },
]

const COURIERS_QUERY_KEY = ["couriers"]

type FormState = {
  label: string
  username: string
  password: string
  test_mode: boolean
  is_enabled: boolean
}

const CouriersPage = () => {
  const { t } = useTranslation("couriers")
  // Core dashboard strings (default "translation" namespace) we can reuse.
  const { t: tg } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<SafeCourier | null>(null)

  // Display query — loads on mount.
  const { data, isLoading } = useQuery({
    queryKey: COURIERS_QUERY_KEY,
    queryFn: () =>
      sdk.client.fetch<{ couriers: SafeCourier[] }>("/admin/couriers"),
  })

  // Merge configured accounts with the supported list so unconfigured
  // couriers still render.
  const rows: SafeCourier[] = SUPPORTED_COURIERS.map((supported) => {
    const existing = data?.couriers.find(
      (c) => c.provider === supported.provider
    )
    return (
      existing ?? {
        provider: supported.provider,
        label: supported.label,
        is_enabled: false,
        test_mode: true,
        credentials: {},
        password_set: false,
      }
    )
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{t("title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("subtitle")}
          </Text>
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            {tg("labels.loading")}
          </Text>
        </div>
      ) : (
        rows.map((courier) => (
          <CourierRow
            key={courier.provider}
            courier={courier}
            onEdit={() => setEditing(courier)}
          />
        ))
      )}

      {editing && (
        <EditCourierDrawer
          courier={editing}
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: COURIERS_QUERY_KEY })
            setEditing(null)
          }}
        />
      )}
    </Container>
  )
}

const CourierRow = ({
  courier,
  onEdit,
}: {
  courier: SafeCourier
  onEdit: () => void
}) => {
  const { t } = useTranslation("couriers")
  const { t: tg } = useTranslation()
  const username = (courier.credentials?.username as string) || "—"

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <Text size="small" leading="compact" weight="plus">
            {courier.label || courier.provider}
          </Text>
          <Badge size="2xsmall" color={courier.is_enabled ? "green" : "grey"}>
            {courier.is_enabled ? tg("general.enabled") : tg("general.disabled")}
          </Badge>
          {courier.test_mode && (
            <Badge size="2xsmall" color="orange">
              {t("test")}
            </Badge>
          )}
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          {t("user")}: {username} ·{" "}
          {courier.password_set ? t("passwordSet") : t("noPassword")}
        </Text>
      </div>
      <Button size="small" variant="secondary" onClick={onEdit}>
        {t("configure")}
      </Button>
    </div>
  )
}

const EditCourierDrawer = ({
  courier,
  open,
  onOpenChange,
  onSaved,
}: {
  courier: SafeCourier
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) => {
  const { t } = useTranslation("couriers")
  const { t: tg } = useTranslation()
  const [form, setForm] = useState<FormState>({
    label: courier.label || "",
    username: (courier.credentials?.username as string) || "",
    password: "",
    test_mode: courier.test_mode,
    is_enabled: courier.is_enabled,
  })

  // Re-sync when switching which courier is being edited.
  useEffect(() => {
    setForm({
      label: courier.label || "",
      username: (courier.credentials?.username as string) || "",
      password: "",
      test_mode: courier.test_mode,
      is_enabled: courier.is_enabled,
    })
  }, [courier])

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      sdk.client.fetch("/admin/couriers", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      toast.success(t("saved", { name: courier.label || courier.provider }))
      onSaved()
    },
    onError: (e: Error) => {
      toast.error(e.message || t("saveError"))
    },
  })

  const handleSubmit = () => {
    const credentials: Record<string, unknown> = {
      username: form.username,
    }
    // Only send the password when the merchant typed a new one — otherwise
    // the backend keeps the stored value.
    if (form.password) {
      credentials.password = form.password
    }

    save.mutate({
      provider: courier.provider,
      label: form.label || null,
      is_enabled: form.is_enabled,
      test_mode: form.test_mode,
      credentials,
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            {t("configureTitle", { name: courier.label || courier.provider })}
          </Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="flex-1 overflow-auto">
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <Label size="small">{t("displayName")}</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Econt Express"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label size="small">{t("apiUsername")}</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="iasp-dev"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label size="small">{t("apiPassword")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={
                  courier.password_set
                    ? t("passwordKeepPlaceholder")
                    : t("passwordEnterPlaceholder")
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label size="small">{t("testMode")}</Label>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("testModeDesc")}
                </Text>
              </div>
              <Switch
                checked={form.test_mode}
                onCheckedChange={(checked) =>
                  setForm({ ...form, test_mode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label size="small">{tg("general.enabled")}</Label>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("enabledDesc")}
                </Text>
              </div>
              <Switch
                checked={form.is_enabled}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_enabled: checked })
                }
              />
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button
              size="small"
              variant="secondary"
              disabled={save.isPending}
            >
              {tg("actions.cancel")}
            </Button>
          </Drawer.Close>
          <Button
            size="small"
            onClick={handleSubmit}
            isLoading={save.isPending}
          >
            {tg("actions.save")}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineRouteConfig({
  label: "Couriers",
  icon: TruckFast,
})

export default CouriersPage

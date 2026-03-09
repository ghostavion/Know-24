"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Pencil,
  ExternalLink,
  Plus,
  Loader2,
  BookOpen,
  Layout,
  FileText,
  PenTool,
  Copy,
  List,
  Zap,
  Mail,
  CheckSquare,
  Monitor,
  MessageCircle,
  Cpu,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PRODUCT_TYPES } from "@/lib/constants/product-types"

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Layout,
  FileText,
  PenTool,
  Copy,
  List,
  Zap,
  Mail,
  CheckSquare,
  Monitor,
  MessageCircle,
  Cpu,
}

interface Product {
  id: string
  title: string
  slug: string
  status: string
  price_cents: number
  pricing_model: string
  description: string | null
  product_type_display_name: string | null
  product_type_slug: string | null
}

interface EditFormState {
  title: string
  description: string
  priceDollars: string
  pricingModel: string
  status: string
}

interface ProductSlideOverProps {
  businessId: string
  businessName: string
}

const StatusBadge = ({ status }: { status: string }) => {
  const colorClass =
    status === "active"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : status === "draft"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colorClass)}>
      {status}
    </span>
  )
}

const SkeletonCard = () => (
  <div className="animate-pulse rounded-lg border p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-8 rounded bg-muted" />
        <div className="h-8 w-8 rounded bg-muted" />
      </div>
    </div>
  </div>
)

const ProductSlideOver = ({ businessId, businessName }: ProductSlideOverProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    title: "",
    description: "",
    priceDollars: "",
    pricingModel: "one_time",
    status: "draft",
  })
  const [saving, setSaving] = useState(false)
  const [showCreateGrid, setShowCreateGrid] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/businesses/${businessId}/products`)
      const json: { data?: Product[]; error?: { message: string } } = await res.json()
      if (json.data) {
        setProducts(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const startEditing = (product: Product) => {
    setEditingId(product.id)
    setEditForm({
      title: product.title,
      description: product.description ?? "",
      priceDollars: (product.price_cents / 100).toFixed(2),
      pricingModel: product.pricing_model,
      status: product.status,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
  }

  const handleSave = async (productId: string) => {
    setSaving(true)
    try {
      const priceCents = Math.round(parseFloat(editForm.priceDollars) * 100)
      await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          priceCents: isNaN(priceCents) ? undefined : priceCents,
          pricingModel: editForm.pricingModel,
          status: editForm.status,
        }),
      })
      setEditingId(null)
      await fetchProducts()
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (typeSlug: string) => {
    setCreating(true)
    try {
      await fetch(`/api/businesses/${businessId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productTypeSlug: typeSlug }),
      })
      setShowCreateGrid(false)
      await fetchProducts()
    } finally {
      setCreating(false)
    }
  }

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">Products for {businessName}</h3>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Products for {businessName}</h3>

      {products.length === 0 && !showCreateGrid && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No products yet. Create your first product below.
          </p>
        </div>
      )}

      {/* Product list */}
      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-lg border p-4 transition hover:bg-muted/50"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-semibold">{product.title}</p>
                <div className="flex items-center gap-2">
                  {product.product_type_display_name && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {product.product_type_display_name}
                    </span>
                  )}
                  <StatusBadge status={product.status} />
                  <span className="text-sm text-muted-foreground">
                    {formatPrice(product.price_cents)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startEditing(product)}
                >
                  <Pencil className="size-4" />
                </Button>
                <a
                  href={`/dashboard/products/${product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-muted"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === product.id && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.priceDollars}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          priceDollars: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Pricing Model
                    </label>
                    <select
                      value={editForm.pricingModel}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          pricingModel: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="one_time">One-time</option>
                      <option value="subscription">Subscription</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(product.id)}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="size-3.5 animate-spin" />}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create mode */}
      {showCreateGrid ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Choose a Product Type</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateGrid(false)}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {PRODUCT_TYPES.map((productType) => {
              const Icon = ICON_MAP[productType.iconName] ?? FileText
              return (
                <button
                  key={productType.slug}
                  type="button"
                  onClick={() => handleCreate(productType.slug)}
                  disabled={creating}
                  className={cn(
                    "cursor-pointer rounded-xl border border-border p-4 text-left transition-all",
                    "hover:border-primary/50 hover:bg-muted/50",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <Icon className="size-6 text-primary" />
                  <p className="mt-2 text-sm font-bold">{productType.displayName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {productType.description}
                  </p>
                </button>
              )
            })}
          </div>
          {creating && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Creating product...
            </div>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowCreateGrid(true)}
        >
          <Plus className="size-4" />
          Create New Product
        </Button>
      )}
    </div>
  )
}

export { ProductSlideOver }
export type { ProductSlideOverProps }

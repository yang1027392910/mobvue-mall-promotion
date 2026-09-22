import type { RawCartItem } from "@@/apis/cart/type"
import { addCartApi, deleteCartApi, getCartListApi, updateCartApi } from "@@/apis/cart"
import { defineStore } from "pinia"
import { computed, ref, watch } from "vue"
import { useUserStore } from "@/pinia/stores/user"

export interface CartProduct {
  id: number
  title: string
  image: string
  price: number
}
export interface CartItem extends CartProduct {
  cartId: number
  quantity: number
  selected: boolean
}
function normalizeItem(row: RawCartItem): CartItem {
  const product = row.product ?? row
  const image = String(product.cover ?? product.image ?? product.imageUrl ?? "")
  const item = {
    cartId: Number(row.cartId ?? row.id),
    id: Number(row.productId ?? product.productId ?? product.id),
    title: String(product.name ?? product.productName ?? product.title ?? ""),
    image: !image || /^https?:\/\//.test(image) ? image : `${(import.meta.env.VITE_IMAGE_BASE_URL || "").replace(/\/$/, "")}/${image.replace(/^\//, "")}`,
    price: Number(product.phPrice ?? product.price),
    quantity: Number(row.quantity),
    selected: row.checked === true || Number(row.checked) === 1
  }
  if (!Number.isSafeInteger(item.cartId) || item.cartId <= 0 || !Number.isSafeInteger(item.id) || item.id <= 0 || !Number.isFinite(item.price) || item.price < 0
    || !Number.isInteger(item.quantity) || item.quantity < 1) {
    throw new Error("Invalid cart data. Please try again.")
  }
  return item
}

export const useCartStore = defineStore("cart", () => {
  const user = useUserStore()
  const items = ref<CartItem[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const errorText = ref("")
  const loadError = ref("")
  const busy = computed(() => loading.value || saving.value)
  const count = computed(() => items.value.length)
  const selectedItems = computed(() => items.value.filter(item => item.selected))
  const allSelected = computed(() => count.value > 0 && selectedItems.value.length === count.value)
  const total = computed(() => selectedItems.value.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100)
  let generation = 0

  watch(() => user.token, () => {
    generation++
    items.value = []
    loading.value = false
    saving.value = false
    errorText.value = ""
    loadError.value = ""
  }, { flush: "sync" })

  async function load() {
    const current = generation
    loading.value = true
    loadError.value = ""
    try {
      const { data } = await getCartListApi()
      const rows = Array.isArray(data) ? data : data?.list
      if (!Array.isArray(rows)) throw new Error("Invalid cart response. Please try again.")
      const nextItems = rows.map(normalizeItem)
      if (current !== generation) return false
      items.value = nextItems
      return true
    } catch (error) {
      if (current === generation) loadError.value = error instanceof Error ? error.message : "Unable to load your cart."
      return false
    } finally {
      if (current === generation) loading.value = false
    }
  }
  async function fetchItems() {
    if (!user.token || busy.value) return false
    return load()
  }
  async function mutate(action: (current: number) => Promise<void>) {
    if (busy.value) return false
    errorText.value = ""
    if (!user.token) {
      errorText.value = "Please log in to manage your cart."
      return false
    }
    const current = generation
    saving.value = true
    try {
      await action(current)
      if (current !== generation) return false
      // Always refresh after a mutation to use server quantities, prices and selection.
      await load()
      return current === generation
    } catch (error) {
      if (current === generation) {
        errorText.value = error instanceof Error ? error.message : "Unable to update your cart."
        // A batch may have partially succeeded, or a timed-out request may have committed.
        await load()
      }
      return false
    } finally {
      if (current === generation) saving.value = false
    }
  }
  function add(product: CartProduct, quantity = 1) {
    if (!Number.isSafeInteger(product.id) || product.id <= 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) return Promise.resolve(false)
    return mutate(async () => {
      await addCartApi({ productId: product.id, quantity })
    })
  }
  function update(id: number, quantity: number, selected: boolean) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return Promise.resolve(false)
    return mutate(async () => {
      await updateCartApi({ productId: id, quantity, checked: selected ? 1 : 0 })
    })
  }
  function setQuantity(id: number, quantity: number) {
    const item = items.value.find(item => item.id === id)
    return item ? update(id, quantity, item.selected) : Promise.resolve(false)
  }
  function setSelected(id: number, selected: boolean) {
    const item = items.value.find(item => item.id === id)
    return item ? update(id, item.quantity, selected) : Promise.resolve(false)
  }
  function selectAll(selected: boolean) {
    const updates = items.value.filter(item => item.selected !== selected)
    return mutate(async (current) => {
      for (const item of updates) {
        if (current !== generation) return
        await updateCartApi({ productId: item.id, quantity: item.quantity, checked: selected ? 1 : 0 })
      }
    })
  }
  function remove(ids: number[]) {
    return mutate(async (current) => {
      for (const productId of new Set(ids)) {
        if (current !== generation) return
        await deleteCartApi({ productId })
      }
    })
  }
  return { items, count, selectedItems, allSelected, total, loading, saving, busy, errorText, loadError, fetchItems, add, setQuantity, setSelected, selectAll, remove }
})

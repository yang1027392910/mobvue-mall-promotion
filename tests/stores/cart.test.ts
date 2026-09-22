import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { reactive } from "vue"
import { addCartApi, deleteCartApi, getCartListApi, updateCartApi } from "../../src/common/apis/cart"
import { useCartStore } from "../../src/pinia/stores/cart"
import { useUserStore } from "../../src/pinia/stores/user"

vi.mock("../../src/common/apis/cart", () => ({
  addCartApi: vi.fn(),
  deleteCartApi: vi.fn(),
  getCartListApi: vi.fn(),
  updateCartApi: vi.fn()
}))
vi.mock("../../src/pinia/stores/user", () => ({ useUserStore: vi.fn() }))

let user: { token: string }
let rows: Array<{ productId: number, name: string, phPrice: number, quantity: number, checked: number }>
const product = { id: 1001, title: "Brush", price: 180, image: "" }
beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
  user = reactive({ token: "test-token" })
  vi.mocked(useUserStore).mockReturnValue(user as ReturnType<typeof useUserStore>)
  rows = [
    { productId: 1001, name: "Brush", phPrice: 180, quantity: 2, checked: 1 },
    { productId: 1002, name: "Shirt", phPrice: 150, quantity: 1, checked: 1 },
    { productId: 1003, name: "Bag", phPrice: 250, quantity: 1, checked: 1 }
  ]
  vi.mocked(getCartListApi).mockImplementation(async () => ({ code: 200, data: { list: rows.map(row => ({ ...row })) } }) as Awaited<ReturnType<typeof getCartListApi>>)
  vi.mocked(addCartApi).mockResolvedValue({ code: 200, data: null } as Awaited<ReturnType<typeof addCartApi>>)
  vi.mocked(updateCartApi).mockImplementation(async (data) => {
    Object.assign(rows.find(row => row.productId === data.productId)!, data)
    return { code: 200, data: null } as Awaited<ReturnType<typeof updateCartApi>>
  })
  vi.mocked(deleteCartApi).mockImplementation(async ({ productId }) => {
    rows = rows.filter(row => row.productId !== productId)
    return { code: 200, data: null } as Awaited<ReturnType<typeof deleteCartApi>>
  })
})

describe("server shopping cart", () => {
  it("loads server items and recalculates totals after quantity and checked updates", async () => {
    const cart = useCartStore()
    await cart.fetchItems()
    expect(cart.total).toBe(760)
    await cart.setQuantity(1001, 3)
    expect(updateCartApi).toHaveBeenLastCalledWith({ productId: 1001, quantity: 3, checked: 1 })
    expect(cart.total).toBe(940)
    await cart.setSelected(1001, false)
    expect(updateCartApi).toHaveBeenLastCalledWith({ productId: 1001, quantity: 3, checked: 0 })
    expect(cart.total).toBe(400)
    await cart.selectAll(false)
    expect(cart.total).toBe(0)
    expect(cart.allSelected).toBe(false)
  })

  it("adds the requested quantity and refreshes the server list", async () => {
    const cart = useCartStore()
    expect(await cart.add(product, 2)).toBe(true)
    expect(addCartApi).toHaveBeenCalledWith({ productId: 1001, quantity: 2 })
    expect(getCartListApi).toHaveBeenCalledOnce()
    expect(cart.count).toBe(3)
  })

  it("deletes by product id and supports an empty server cart", async () => {
    const cart = useCartStore()
    await cart.fetchItems()
    await cart.remove([1001, 1002, 1003])
    expect(deleteCartApi).toHaveBeenNthCalledWith(1, { productId: 1001 })
    expect(cart.count).toBe(0)
    expect(cart.total).toBe(0)
  })

  it("reconciles partially failed batches without reporting success", async () => {
    const cart = useCartStore()
    await cart.fetchItems()
    vi.mocked(deleteCartApi).mockImplementationOnce(async () => {
      rows = rows.filter(row => row.productId !== 1001)
      return { code: 200, data: null } as Awaited<ReturnType<typeof deleteCartApi>>
    }).mockRejectedValueOnce(new Error("Delete failed"))
    expect(await cart.remove([1001, 1002])).toBe(false)
    expect(cart.errorText).toBe("Delete failed")
    expect(cart.items.map(item => item.id)).toEqual([1002, 1003])
    expect(cart.busy).toBe(false)
  })

  it("retains confirmed quantities after a failed update and reports list failures", async () => {
    const cart = useCartStore()
    await cart.fetchItems()
    vi.mocked(updateCartApi).mockRejectedValueOnce(new Error("Update failed"))
    expect(await cart.setQuantity(1001, 3)).toBe(false)
    expect(cart.items[0].quantity).toBe(2)
    vi.mocked(getCartListApi).mockRejectedValueOnce(new Error("List failed"))
    expect(await cart.fetchItems()).toBe(false)
    expect(cart.loadError).toBe("List failed")
    expect(cart.items).toHaveLength(3)
  })

  it("clears account data and ignores an old account's in-flight list response", async () => {
    const cart = useCartStore()
    await cart.fetchItems()
    let resolve!: (value: Awaited<ReturnType<typeof getCartListApi>>) => void
    vi.mocked(getCartListApi).mockReturnValueOnce(new Promise((done) => {
      resolve = done
    }))
    const pending = cart.fetchItems()
    user.token = ""
    resolve({ code: 200, data: rows } as Awaited<ReturnType<typeof getCartListApi>>)
    await pending
    expect(cart.items).toEqual([])
    expect(await cart.add(product)).toBe(false)
    expect(addCartApi).not.toHaveBeenCalled()
  })

  it("handles nested products without confusing cart row ids with product ids", async () => {
    vi.mocked(getCartListApi).mockResolvedValueOnce({ code: 200, data: [{ id: 99, productId: 1001, quantity: "2", checked: "1", product: { id: 1001, name: "Brush", phPrice: "180" } }] } as Awaited<ReturnType<typeof getCartListApi>>)
    const cart = useCartStore()
    await cart.fetchItems()
    expect(cart.items[0]).toMatchObject({ id: 1001, price: 180, quantity: 2, selected: true })
  })
})

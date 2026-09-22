import { shallowMount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Cart from "../../src/pages/cart/index.vue"

const mocks = vi.hoisted(() => ({
  cart: { selectedItems: [] as Array<{ id: number, cartId: number, quantity: number }>, items: [], busy: false, loadError: "", count: 0, fetchItems: vi.fn(), remove: vi.fn() },
  orders: { creating: false, createError: "Failed", create: vi.fn(), fetchList: vi.fn() },
  coupons: { selectedCoupon: null, availableForOrder: [], availableLoading: false, selectedCouponId: null, discountFor: vi.fn(() => 0), fetchAvailable: vi.fn(), fetchRewards: vi.fn(), markSelectedUsed: vi.fn(), clearSelectedCoupon: vi.fn() },
  push: vi.fn(),
  failToast: vi.fn()
}))
vi.mock("../../src/pinia/stores/cart", () => ({ useCartStore: () => mocks.cart }))
vi.mock("../../src/pinia/stores/orders", () => ({ useOrdersStore: () => mocks.orders }))
vi.mock("../../src/pinia/stores/coupons", () => ({ useCouponsStore: () => mocks.coupons }))
vi.mock("../../src/pinia/stores/user", () => ({ useUserStore: () => ({ token: "test" }) }))
vi.mock("../../src/common/utils/guest-access", () => ({ requireLogin: () => true }))
vi.mock("../../src/common/apis/products", () => ({ getProductListApi: async () => ({ data: [] }) }))
vi.mock("vue-router", () => ({ useRouter: () => ({ push: mocks.push, back: vi.fn(), replace: vi.fn() }) }))
vi.mock("vant", async importOriginal => ({ ...await importOriginal<typeof import("vant")>(), showFailToast: mocks.failToast }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.cart.selectedItems = [{ id: 101, cartId: 1, quantity: 2 }]
  mocks.orders.create.mockResolvedValue({ id: "order-1" })
  mocks.cart.remove.mockResolvedValue(true)
  mocks.cart.fetchItems.mockResolvedValue(true)
  mocks.orders.fetchList.mockResolvedValue(undefined)
  mocks.coupons.discountFor.mockReturnValue(0)
  mocks.coupons.fetchAvailable.mockResolvedValue(true)
  mocks.coupons.fetchRewards.mockResolvedValue(true)
  mocks.coupons.markSelectedUsed.mockClear()
  mocks.coupons.clearSelectedCoupon.mockClear()
  mocks.coupons.selectedCoupon = null
})

async function submit() {
  const wrapper = shallowMount(Cart)
  mocks.cart.fetchItems.mockClear()
  mocks.coupons.fetchRewards.mockClear()
  await (wrapper.vm as unknown as { submitOrder: () => Promise<void> }).submitOrder()
  wrapper.unmount()
}

describe("checkout cart cleanup", () => {
  it.each([[1], [1, 2, 3]])("submits exactly the selected cart records %j", async (...cartIds) => {
    mocks.cart.selectedItems = cartIds.map((cartId, index) => ({ id: 100 + index, cartId, quantity: 1 }))
    await submit()
    expect(mocks.orders.create).toHaveBeenCalledWith(expect.objectContaining({ cartIds }))
    expect(mocks.cart.remove).not.toHaveBeenCalled()
    expect(mocks.cart.fetchItems).toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledWith({ path: "/order-success", query: { id: "order-1" } })
  })

  it("does not delete anything if order creation fails", async () => {
    mocks.orders.create.mockResolvedValue(null)
    await submit()
    expect(mocks.cart.remove).not.toHaveBeenCalled()
    expect(mocks.cart.fetchItems).not.toHaveBeenCalled()
    expect(mocks.coupons.fetchAvailable).toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it("uses the submitted snapshot if the selected items change", async () => {
    mocks.orders.create.mockImplementationOnce(async () => {
      mocks.cart.selectedItems = [{ id: 102, cartId: 2, quantity: 1 }]
      return { id: "order-1" }
    })
    await submit()
    expect(mocks.orders.create).toHaveBeenCalledWith(expect.objectContaining({ cartIds: [1] }))
  })

  it("refreshes cart, coupons, and orders after successful creation", async () => {
    await submit()
    expect(mocks.cart.fetchItems).toHaveBeenCalled()
    expect(mocks.coupons.fetchRewards).toHaveBeenCalled()
    expect(mocks.orders.fetchList).toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledOnce()
  })
})

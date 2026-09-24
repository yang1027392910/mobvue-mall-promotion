import type { Order } from "../../src/common/apis/orders/normalize"
import { flushPromises, shallowMount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { reactive } from "vue"
import { normalizeOrder } from "../../src/common/apis/orders/normalize"
import { canOpenPayment, hasPaymentAccount, paymentMethods } from "../../src/common/constants/payment"
import OrderDetails from "../../src/pages/orders/details.vue"
import MyOrders from "../../src/pages/orders/index.vue"
import OrderSuccess from "../../src/pages/orders/success.vue"
import Payment from "../../src/pages/payment/index.vue"

const mocks = vi.hoisted(() => ({
  route: { query: { id: "42" }, params: { method: "" } },
  store: {} as Record<string, any>,
  push: vi.fn(),
  replace: vi.fn(),
  copy: vi.fn(),
  pay: vi.fn(),
  success: vi.fn(),
  fail: vi.fn()
}))
vi.mock("../../src/common/apis/orders", () => ({ payOrderApi: mocks.pay }))
vi.mock("vue-router", () => ({ useRoute: () => mocks.route, useRouter: () => ({ push: mocks.push, replace: mocks.replace }) }))
vi.mock("../../src/pinia/stores/coupons", () => ({ useCouponsStore: () => ({ lastApplied: null }) }))
vi.mock("../../src/pinia/stores/orders", () => ({ useOrdersStore: () => mocks.store }))
vi.mock("../../src/pinia/stores/user", () => ({ useUserStore: () => ({ token: "test" }) }))
vi.mock("vant", async original => ({
  ...await original<typeof import("vant")>(),
  showSuccessToast: mocks.success,
  showFailToast: mocks.fail
}))

const fixture = (extra = {}): Order => normalizeOrder({ id: 42, orderNo: "PO202609241318", status: 0, totalAmount: 180, itemCount: 1, ...extra })
beforeEach(() => {
  vi.clearAllMocks()
  mocks.route = reactive({ query: { id: "42" }, params: { method: "" } })
  mocks.store = reactive({
    detail: fixture(),
    detailLoading: false,
    detailError: "",
    fetchDetail: vi.fn(),
    orders: [fixture(), fixture({ id: 43, status: 3 }), fixture({ id: 44, status: 4 })],
    listLoading: false,
    listError: "",
    hasMore: false,
    fetchList: vi.fn()
  })
  mocks.copy.mockResolvedValue(undefined)
  mocks.pay.mockReset()
  mocks.pay.mockResolvedValue({ code: 200, data: null })
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: mocks.copy } })
})

describe("payment flow", () => {
  it.each([
    [0, "I Have Paid", false],
    [1, "Pending Verification", true],
    [2, "Payment Confirmed", true]
  ] as const)("uses paymentStatus %s across order entry points", async (paymentStatus, label, disabled) => {
    mocks.store.detail = fixture({ paymentStatus })
    mocks.store.orders = [fixture({ paymentStatus })]
    for (const page of [MyOrders, OrderDetails, OrderSuccess]) {
      const wrapper = shallowMount(page)
      const button = wrapper.find(".order-pay-button")
      expect(button.text()).toBe(label)
      expect(button.attributes("disabled") !== undefined).toBe(disabled)
      if (disabled) {
        await button.trigger("click")
        expect(mocks.push).not.toHaveBeenCalled()
      }
      wrapper.unmount()
    }
  })

  it.each([
    [0, "I Have Paid", false],
    [1, "Pending Verification", true],
    [2, "Payment Confirmed", true]
  ] as const)("uses paymentStatus %s on the transfer page", async (paymentStatus, label, disabled) => {
    mocks.route.params.method = "gcash"
    mocks.store.detail = fixture({ paymentStatus })
    const wrapper = shallowMount(Payment)
    const button = wrapper.find(".payment-primary")
    expect(button.text()).toBe(label)
    expect(button.attributes("disabled") !== undefined).toBe(disabled)
    if (disabled) {
      await button.trigger("click")
      expect(mocks.pay).not.toHaveBeenCalled()
      expect(wrapper.find("form").exists()).toBe(false)
    }
    if (paymentStatus === 2) expect(wrapper.text()).toContain("Thank you for your payment.")
    wrapper.unmount()
  })

  it("updates buttons when verification changes from pending to confirmed", async () => {
    mocks.route.params.method = "maya"
    mocks.store.detail = fixture({ paymentStatus: 1 })
    const wrapper = shallowMount(Payment)
    expect(wrapper.find(".payment-primary").text()).toBe("Pending Verification")
    mocks.store.detail.paymentStatus = 2
    await flushPromises()
    expect(wrapper.find(".payment-primary").text()).toBe("Payment Confirmed")
    expect(wrapper.find(".payment-primary").classes()).toContain("is-confirmed")
    expect(mocks.pay).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("opens payment from the pending order without opening order details", async () => {
    const wrapper = shallowMount(MyOrders)
    expect(wrapper.findAll(".order-pay-button")).toHaveLength(1)
    expect(wrapper.find("button button").exists()).toBe(false)
    await wrapper.find(".order-pay-button").trigger("click")
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith({ path: "/payment", query: { id: "42" } })
    wrapper.unmount()
  })

  it("loads the requested order and switches between the two configured methods", async () => {
    const wrapper = shallowMount(Payment)
    expect(mocks.store.fetchDetail).toHaveBeenCalledWith("42")
    expect(wrapper.find(".payment-summary").text()).toContain("180.00")
    expect(wrapper.findAll("input[type=\"radio\"]")).toHaveLength(2)
    await wrapper.find("input[value=\"maya\"]").setValue()
    await wrapper.find(".payment-primary").trigger("click")
    expect(mocks.push).toHaveBeenCalledWith({ path: "/payment/maya", query: { id: "42" } })
    mocks.route.params.method = "maya"
    await flushPromises()
    expect(wrapper.find(".payment-intro").text()).toContain("Maya")
    wrapper.unmount()
  })

  it("copies the exact amount, disables placeholder account copying, and handles clipboard failure", async () => {
    mocks.route.params.method = "gcash"
    const wrapper = shallowMount(Payment)
    expect(wrapper.find("[aria-label=\"Copy GCash number\"]").attributes("disabled")).toBeDefined()
    await wrapper.find("[aria-label=\"Copy amount\"]").trigger("click")
    expect(mocks.copy).toHaveBeenCalledWith("180.00")
    mocks.copy.mockRejectedValueOnce(new Error("Denied"))
    await wrapper.find("[aria-label=\"Copy amount\"]").trigger("click")
    await flushPromises()
    expect(mocks.fail).toHaveBeenCalled()
    wrapper.unmount()
  })

  it.each([["gcash", 1], ["maya", 2]])("submits %s with its backend code and preserves order status", async (method, code) => {
    mocks.route.params.method = String(method)
    const wrapper = shallowMount(Payment)
    await wrapper.find("input[type=text]").setValue(" REF123 ")
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mocks.pay).toHaveBeenCalledExactlyOnceWith({ orderId: 42, paymentMethod: code, referenceNo: "REF123" })
    expect(mocks.store.detail).toMatchObject({ status: "Pending", statusGroup: "Pending", paymentStatus: 1, paymentMethod: code, paymentReference: "REF123" })
    expect(mocks.store.orders[0].paymentStatus).toBe(1)
    expect(wrapper.find(".payment-submitted").text()).toContain("awaiting seller verification")
    expect(wrapper.find("form").exists()).toBe(false)
    wrapper.unmount()
  })

  it("retains the reference and allows retry after failure", async () => {
    mocks.route.params.method = "gcash"
    mocks.pay.mockRejectedValueOnce(new Error("Payment rejected"))
    const wrapper = shallowMount(Payment)
    await wrapper.find("input[type=text]").setValue("REF123")
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mocks.fail).toHaveBeenCalledWith("Payment rejected")
    expect(mocks.store.detail.paymentStatus).toBeNull()
    expect((wrapper.find("input[type=text]").element as HTMLInputElement).value).toBe("REF123")
    expect(wrapper.find("button[type=submit]").attributes("disabled")).toBeUndefined()
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mocks.pay).toHaveBeenCalledTimes(2)
    expect(mocks.store.detail.paymentStatus).toBe(1)
    wrapper.unmount()
  })

  it("blocks duplicate in-flight requests and permits an empty optional reference", async () => {
    mocks.route.params.method = "gcash"
    let finish!: (value: { code: number }) => void
    mocks.pay.mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    const wrapper = shallowMount(Payment)
    await wrapper.find("form").trigger("submit")
    await wrapper.find("form").trigger("submit")
    expect(mocks.pay).toHaveBeenCalledExactlyOnceWith({ orderId: 42, paymentMethod: 1, referenceNo: "" })
    expect(wrapper.find("button[type=submit]").attributes("disabled")).toBeDefined()
    finish({ code: 0 })
    await flushPromises()
    expect(wrapper.find(".payment-submitted").exists()).toBe(true)
    wrapper.unmount()
  })

  it.each([undefined, { code: 500, message: "Not accepted" }])("rejects unsuccessful response %o", async (response) => {
    mocks.route.params.method = "gcash"
    mocks.pay.mockResolvedValueOnce(response)
    const wrapper = shallowMount(Payment)
    await wrapper.find("form").trigger("submit")
    await flushPromises()
    expect(mocks.fail).toHaveBeenCalled()
    expect(mocks.store.detail.paymentStatus).toBeNull()
    expect(wrapper.find(".payment-submitted").exists()).toBe(false)
    wrapper.unmount()
  })

  it("does not overwrite a different order after navigation", async () => {
    mocks.route.params.method = "gcash"
    let finish!: (value: { code: number }) => void
    mocks.pay.mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    const wrapper = shallowMount(Payment)
    await wrapper.find("form").trigger("submit")
    mocks.route.query.id = "99"
    mocks.store.detail = fixture({ id: 99 })
    await flushPromises()
    finish({ code: 200 })
    await flushPromises()
    expect(mocks.store.detail.paymentStatus).toBeNull()
    expect(mocks.store.orders[0].paymentStatus).toBe(1)
    expect(mocks.success).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("shows submitted payment without allowing another submission", () => {
    mocks.route.params.method = "gcash"
    mocks.store.detail = fixture({ payment_status: 1 })
    const wrapper = shallowMount(Payment)
    expect(wrapper.find(".payment-submitted").exists()).toBe(true)
    expect(wrapper.find("form").exists()).toBe(false)
    expect(canOpenPayment(mocks.store.detail)).toBe(false)
    wrapper.unmount()
  })

  it("does not display another order's amount during navigation", async () => {
    const wrapper = shallowMount(Payment)
    mocks.route.query.id = "99"
    await flushPromises()
    expect(mocks.store.fetchDetail).toHaveBeenLastCalledWith("99")
    expect(wrapper.find(".payment-summary").exists()).toBe(false)
    expect(wrapper.find(".payment-primary").exists()).toBe(false)
    wrapper.unmount()
  })

  it.each([{ status: 3 }, { status: 4 }, { status: 99 }, { totalAmount: null }, { totalAmount: -10 }, { totalAmount: 0 }])("prevents payment for unavailable orders %o", (extra) => {
    mocks.store.detail = fixture(extra)
    const wrapper = shallowMount(Payment)
    expect(wrapper.find(".payment-primary").exists()).toBe(false)
    expect(canOpenPayment(mocks.store.detail)).toBe(false)
    wrapper.unmount()
  })

  it("handles unknown payment methods and failed order loads without showing transfer details", async () => {
    mocks.route.params.method = "unknown"
    const wrapper = shallowMount(Payment)
    expect(wrapper.find(".payment-transfer").exists()).toBe(false)
    mocks.route.params.method = "gcash"
    mocks.store.detailError = "Order unavailable"
    await flushPromises()
    expect(wrapper.find(".payment-transfer").exists()).toBe(false)
    wrapper.unmount()
  })

  it("clears references when switching payment methods", async () => {
    mocks.route.params.method = "gcash"
    const wrapper = shallowMount(Payment)
    await wrapper.find("input[type=text]").setValue("old-reference")
    mocks.route.params.method = "maya"
    await flushPromises()
    expect((wrapper.find("input[type=text]").element as HTMLInputElement).value).toBe("")
    wrapper.unmount()
  })

  it("distinguishes configurable receiving numbers from placeholder data", () => {
    expect(paymentMethods.map(item => item.id)).toEqual(["gcash", "maya"])
    expect(paymentMethods.every(item => !hasPaymentAccount(item))).toBe(true)
    expect(hasPaymentAccount({ ...paymentMethods[0]!, accountNumber: "0912 345 6789" })).toBe(true)
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"
import { payOrderApi } from "../../src/common/apis/orders"
import { normalizeOrder } from "../../src/common/apis/orders/normalize"
import { request } from "../../src/http/axios"

vi.mock("../../src/http/axios", () => ({ request: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

describe("order payment contract", () => {
  it("sends a PUT with only the documented JSON fields", () => {
    payOrderApi({ orderId: 4, paymentMethod: 2, referenceNo: "123456789" })
    expect(request).toHaveBeenCalledExactlyOnceWith({
      url: "h5/order/pay",
      method: "put",
      data: { orderId: 4, paymentMethod: 2, referenceNo: "123456789" }
    })
  })
  it.each([
    { payment_status: 1, payment_method: 2, payment_reference: "123456789" },
    { paymentStatus: "1", paymentMethod: "2", paymentReference: "123456789" }
  ])("keeps payment fields separate from order status: %o", (payment) => {
    expect(normalizeOrder({ id: 4, status: 0, ...payment })).toMatchObject({
      status: "Pending",
      statusGroup: "Pending",
      paymentStatus: 1,
      paymentMethod: 2,
      paymentReference: "123456789"
    })
  })
})

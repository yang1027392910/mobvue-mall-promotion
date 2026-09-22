import { describe, expect, it } from "vitest"
import { normalizeOrder, orderStatuses } from "../../src/common/apis/orders/normalize"

describe("order status normalization", () => {
  it("offers only the three simplified states and the all filter", () => {
    expect(orderStatuses).toEqual(["All", "Pending", "Completed", "Cancelled"])
  })

  it.each(["Confirmed", "Processing"])("groups legacy %s names under Pending", (status) => {
    const order = normalizeOrder({ id: 1, status })
    expect(order.status).toBe("Pending")
    expect(order.statusGroup).toBe("Pending")
  })
  it.each([
    [0, "Pending"],
    [1, "Pending"],
    [2, "Pending"],
    [3, "Completed"],
    [4, "Cancelled"]
  ])("maps status %s to %s", (status, expected) => {
    for (const value of [status, String(status)]) {
      const order = normalizeOrder({ id: 1, status: value })
      expect(order.status).toBe(expected)
      expect(order.statusGroup).toBe(expected)
    }
  })

  it("uses the status code when a separate display name is provided", () => {
    expect(normalizeOrder({ id: 1, status: 2, statusName: "In progress" }).statusGroup).toBe("Pending")
  })

  it("continues supporting status names and the orderStatus field", () => {
    expect(normalizeOrder({ id: 1, status: "cancelled" }).statusGroup).toBe("Cancelled")
    expect(normalizeOrder({ id: 1, orderStatus: 0 }).statusGroup).toBe("Pending")
  })

  it("does not treat unknown or missing status codes as pending", () => {
    expect(normalizeOrder({ id: 1, status: 99 }).status).toBe("Status 99")
    expect(normalizeOrder({ id: 1, status: 99 }).statusGroup).toBe("Unknown")
    expect(normalizeOrder({ id: 1 }).statusGroup).toBe("Unknown")
  })
})

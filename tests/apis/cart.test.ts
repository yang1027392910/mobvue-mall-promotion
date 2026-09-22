import { beforeEach, describe, expect, it, vi } from "vitest"
import { addCartApi, deleteCartApi, getCartListApi, updateCartApi } from "../../src/common/apis/cart"
import { request } from "../../src/http/axios"

vi.mock("../../src/http/axios", () => ({ request: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

describe("cart API request contract", () => {
  it("uses the existing /api base URL with the provided methods and JSON payloads", () => {
    addCartApi({ productId: 1001, quantity: 2 })
    getCartListApi()
    updateCartApi({ productId: 1001, quantity: 3, checked: 1 })
    deleteCartApi({ productId: 1001 })
    expect(request).toHaveBeenNthCalledWith(1, { url: "h5/product/cart/add", method: "post", data: { productId: 1001, quantity: 2 } })
    expect(request).toHaveBeenNthCalledWith(2, { url: "h5/product/cart/list", method: "get" })
    expect(request).toHaveBeenNthCalledWith(3, { url: "h5/product/cart/update", method: "put", data: { productId: 1001, quantity: 3, checked: 1 } })
    expect(request).toHaveBeenNthCalledWith(4, { url: "h5/product/cart/delete", method: "delete", data: { productId: 1001 } })
  })
})

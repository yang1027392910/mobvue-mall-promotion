import { flushPromises, shallowMount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import HotProducts from "../../src/pages/hotProducts/index.vue"

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  favorite: vi.fn(),
  cart: { busy: false, errorText: "", add: vi.fn() },
  login: vi.fn(),
  push: vi.fn(),
  success: vi.fn(),
  fail: vi.fn()
}))
vi.mock("../../src/common/apis/favorite", () => ({ favoriteClickApi: mocks.favorite }))
vi.mock("../../src/common/apis/hotProduct", () => ({ getHotProductListApi: mocks.list }))
vi.mock("../../src/pinia/stores/cart", () => ({ useCartStore: () => mocks.cart }))
vi.mock("../../src/common/utils/guest-access", () => ({ requireLogin: mocks.login }))
vi.mock("vue-router", () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock("vant", async importOriginal => ({ ...await importOriginal<typeof import("vant")>(), showSuccessToast: mocks.success, showFailToast: mocks.fail }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.favorite.mockResolvedValue({ data: null })
  mocks.cart.busy = false
  mocks.login.mockReturnValue(true)
  mocks.cart.add.mockResolvedValue(true)
  mocks.list.mockResolvedValue({ data: [{ productId: 42, name: "Mini fan", price: 180, phPrice: "180.00", originalPrice: 999, sold: 0, soldCount: 128, hotTag: "Popular", categoryName: "Electronics", categoryIcon: "https://example.com/category.png", rating: 0, chinaCost: 99, profit: "40.00", score: 4.9, tiktokScore: "0.00" }] })
})

async function render() {
  const wrapper = shallowMount(HotProducts)
  await flushPromises()
  return wrapper
}

describe("hot product consumer cards", () => {
  it("shows consumer prices, sales and discount without internal business data", async () => {
    const wrapper = await render()
    expect(wrapper.find(".current-price").text()).toBe("₱180.00")
    expect(wrapper.find("del").text()).toBe("₱220.00")
    expect(wrapper.find(".discount").text()).toBe("-18%")
    expect(wrapper.find(".sold-count").text()).toBe("0 sold")
    expect(wrapper.find(".product-rating").exists()).toBe(false)
    expect(wrapper.find(".product-category").attributes("aria-label")).toBe("Electronics")
    expect(wrapper.find(".category-icon-image").attributes("src")).toBe("https://example.com/category.png")
    expect(wrapper.find(".hot-tag").exists()).toBe(false)
    expect(wrapper.find(".product-rank").attributes("alt")).toBe("Rank #1")
    expect(wrapper.text()).not.toMatch(/China Cost|Profit|TikTok Score|Popular|99.00|40.00|4.9/)
    wrapper.unmount()
  })

  it("adds the real product without opening details", async () => {
    const wrapper = await render()
    await wrapper.find(".add-to-cart").trigger("click")
    await flushPromises()
    expect(mocks.cart.add).toHaveBeenCalledWith({ id: 42, title: "Mini fan", image: "", price: 180 })
    expect(mocks.success).toHaveBeenCalledWith("Added to cart")
    expect(mocks.push).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("requires login and reports failed additions", async () => {
    const wrapper = await render()
    mocks.login.mockReturnValue(false)
    await wrapper.find(".add-to-cart").trigger("click")
    expect(mocks.cart.add).not.toHaveBeenCalled()
    mocks.login.mockReturnValue(true)
    mocks.cart.add.mockResolvedValue(false)
    await wrapper.find(".add-to-cart").trigger("click")
    await flushPromises()
    expect(mocks.fail).toHaveBeenCalled()
    expect(mocks.success).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it("does not invent sales, discounts, tags or a product ID", async () => {
    mocks.list.mockResolvedValue({ data: [{ name: "Unknown product", price: 180 }] })
    const wrapper = await render()
    expect(wrapper.find(".sold-count").text()).toBe("Sales unavailable")
    expect(wrapper.find(".product-rating").exists()).toBe(false)
    expect(wrapper.find(".product-category").exists()).toBe(false)
    expect(wrapper.find("del").exists()).toBe(false)
    expect(wrapper.find(".discount").exists()).toBe(false)
    expect(wrapper.find(".hot-tag").exists()).toBe(false)
    expect(wrapper.find(".add-to-cart").attributes("disabled")).toBeDefined()
    wrapper.unmount()
  })
  it("shows a positive customer rating and a real nested category", async () => {
    mocks.list.mockResolvedValue({ data: [{ productId: 42, name: "Fan", price: 180, rating: "4.8", sold: 128, category: { name: "Home" }, isFavorite: "1", rank: 4 }] })
    const wrapper = await render()
    expect(wrapper.find(".product-rating").text()).toBe("4.8")
    expect(wrapper.find(".sold-count").text()).toBe("128 sold")
    expect(wrapper.find(".product-category").attributes("aria-label")).toBe("Home")
    expect(wrapper.find(".product-rank").exists()).toBe(false)
    expect(wrapper.find(".favorite-button").attributes("aria-pressed")).toBe("true")
    wrapper.unmount()
  })

  it.each([0, -1, "0.00", undefined])("hides nonpositive or absent ratings (%s) even when internal scores exist", async (rating) => {
    mocks.list.mockResolvedValue({ data: [{ name: "Fan", price: 180, rating, sold: 0, tiktokScore: 4.8, hotTag: "Popular" }] })
    const wrapper = await render()
    expect(wrapper.find(".product-rating").exists()).toBe(false)
    expect(wrapper.find(".sold-count").text()).toBe("0 sold")
    expect(wrapper.find(".product-category").exists()).toBe(false)
    wrapper.unmount()
  })

  it("toggles favorites only after the API succeeds without opening the product", async () => {
    const wrapper = await render()
    await wrapper.find(".favorite-button").trigger("click")
    await flushPromises()
    expect(mocks.favorite).toHaveBeenCalledWith({ productId: 42 })
    expect(wrapper.find(".favorite-button").attributes("aria-pressed")).toBe("true")
    expect(mocks.push).not.toHaveBeenCalled()
    mocks.favorite.mockRejectedValueOnce(new Error("Try again"))
    await wrapper.find(".favorite-button").trigger("click")
    await flushPromises()
    expect(wrapper.find(".favorite-button").attributes("aria-pressed")).toBe("true")
    expect(mocks.fail).toHaveBeenCalledWith("Try again")
    wrapper.unmount()
  })

  it("requires login before changing favorites", async () => {
    mocks.login.mockReturnValue(false)
    const wrapper = await render()
    await wrapper.find(".favorite-button").trigger("click")
    expect(mocks.favorite).not.toHaveBeenCalled()
    expect(wrapper.find(".favorite-button").attributes("aria-pressed")).toBe("false")
    wrapper.unmount()
  })
})

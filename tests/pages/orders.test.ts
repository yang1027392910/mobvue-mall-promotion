import { mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import OrderDetails from "../../src/pages/orders/details.vue"
import MyOrders from "../../src/pages/orders/index.vue"
import OrderSuccess from "../../src/pages/orders/success.vue"
import { orderTotal, useDemoOrdersStore } from "../../src/pinia/stores/demo-orders"

beforeEach(() => setActivePinia(createPinia()))
async function makeRouter(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/orders", component: MyOrders },
      { path: "/order-details", component: OrderDetails },
      { path: "/order-success", component: OrderSuccess },
      { path: "/profile", component: { template: "<div />" } }
    ]
  })
  await router.push(path)
  await router.isReady()
  return router
}

describe("static order flow", () => {
  it("creates a pending snapshot without modifying cart items", () => {
    const store = useDemoOrdersStore()
    const cartItems = [{ id: 1, title: "Dress", price: 500, quantity: 2, image: "" }]
    const order = store.submit(cartItems)!
    expect(order.status).toBe("Pending")
    expect(orderTotal(order)).toBe(1000)
    cartItems[0].quantity = 5
    expect(order.items[0].quantity).toBe(2)
    expect(store.submit(cartItems)!.id).not.toBe(order.id)
    expect(store.submit([])).toBeNull()
  })

  it("filters the list by status and opens the selected order", async () => {
    const router = await makeRouter("/orders")
    const wrapper = mount(MyOrders, { global: { plugins: [router] } })
    expect(wrapper.findAll(".order-list-card")).toHaveLength(3)
    await wrapper.findAll(".order-filter")[2].trigger("click")
    expect(wrapper.findAll(".order-list-card")).toHaveLength(1)
    expect(wrapper.find(".order-status").text()).toBe("Confirmed")
    await wrapper.find(".order-list-card").trigger("click")
    await router.isReady()
    wrapper.unmount()
  })

  it("shows matching submitted totals on success and details screens", async () => {
    const store = useDemoOrdersStore()
    const order = store.submit([{ id: 1, title: "Selected product", price: 180, quantity: 2, image: "" }])!
    const router = await makeRouter(`/order-success?id=${order.id}`)
    const success = mount(OrderSuccess, { global: { plugins: [router] } })
    expect(success.text()).toContain(order.id)
    expect(success.text()).toContain("₱360.00")
    expect(success.text()).toContain("Pending")
    success.unmount()
    await router.push(`/order-details?id=${order.id}`)
    const details = mount(OrderDetails, { global: { plugins: [router] } })
    expect(details.text()).toContain("Selected product")
    expect(details.find(".order-grand-total").text()).toContain("₱360.00")
    expect(details.text()).toContain("To be confirmed")
    details.unmount()
  })
})

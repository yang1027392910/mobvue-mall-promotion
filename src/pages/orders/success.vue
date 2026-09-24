<script setup lang="ts">
import { formatOrderMoney, orderSubtotal } from "@@/apis/orders/normalize"
import { canOpenPayment, getPaymentState, showPaymentButton } from "@@/constants/payment"
import { showFailToast, showSuccessToast } from "vant"
import { computed, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useCouponsStore } from "@/pinia/stores/coupons"
import { useOrdersStore } from "@/pinia/stores/orders"
import { useUserStore } from "@/pinia/stores/user"
import "./orders.css"

const route = useRoute()
const router = useRouter()
const orders = useOrdersStore()
const coupons = useCouponsStore()
const user = useUserStore()
const orderId = computed(() => String(route.query.id || ""))
const order = computed(() => orders.detail)
const savedAmount = computed(() => coupons.lastApplied?.amount || 0)
watch(() => [orderId.value, user.token], () => {
  if (user.token) orders.fetchDetail(orderId.value)
}, { immediate: true })
async function copyOrderNumber() {
  if (!order.value) return
  try {
    await navigator.clipboard.writeText(order.value.orderNo)
    showSuccessToast("Order number copied")
  } catch {
    showFailToast("Unable to copy. Please copy the order number manually.")
  }
}
</script>

<template>
  <div class="orders-page order-success-page">
    <van-nav-bar left-arrow @click-left="router.replace('/cart')" />
    <div v-if="orders.detailLoading" class="orders-container">
      <van-loading color="#0860ff">
        Loading order details...
      </van-loading>
    </div>
    <section v-else-if="orders.lastCreated && !orderId" class="orders-container success-heading">
      <h1>Order Submitted!</h1><p>Your order has been created successfully. View My Orders to check its details.</p>
      <van-button block type="primary" color="#0860ff" @click="router.replace('/orders')">
        View My Orders
      </van-button>
    </section>
    <van-empty v-else-if="orders.detailError" :description="orders.detailError">
      <van-button v-if="orderId" type="primary" @click="orders.fetchDetail(orderId)">
        Retry
      </van-button>
      <van-button plain type="primary" @click="router.replace('/orders')">
        View My Orders
      </van-button>
    </van-empty>
    <main v-else-if="order" class="orders-container">
      <section class="success-heading">
        <div class="success-art" aria-hidden="true">
          <span class="confetti confetti-one" /><span class="confetti confetti-two" /><span class="confetti confetti-three" /><span class="confetti confetti-four" /><span class="confetti confetti-five" />
          <div class="success-circle">
            <van-icon name="success" />
          </div>
        </div>
        <h1>Order Submitted!</h1>
        <p>Your order has been created successfully.</p>
      </section>
      <section class="order-panel success-facts" aria-label="Order summary">
        <dl class="order-facts">
          <div>
            <dt>Order No.</dt><dd class="order-number">
              #{{ order.orderNo }} <button class="order-copy" aria-label="Copy order number" @click="copyOrderNumber">
                <van-icon name="description-o" />
              </button>
            </dd>
          </div>
          <div><dt>Items</dt><dd>{{ order.itemCount }}</dd></div>
          <div><dt>Subtotal</dt><dd>{{ formatOrderMoney(orderSubtotal(order)) }}</dd></div>
          <div v-if="savedAmount">
            <dt>Saved</dt><dd class="saved-amount">
              {{ formatOrderMoney(savedAmount) }}
            </dd>
          </div>
          <div><dt>Status</dt><dd><span class="order-status" :class="order.statusGroup.toLowerCase()">{{ order.status }}</span></dd></div>
        </dl>
      </section>
      <section class="next-step-card">
        <div class="next-step-icon">
          <van-icon name="bag" />
        </div>
        <div><h2>Next Step</h2><p>Please contact our customer service team to confirm pricing, shipping and delivery details.</p></div>
      </section>
      <div class="order-actions">
        <button v-if="showPaymentButton(order)" class="order-pay-button" :class="getPaymentState(order)?.className" :disabled="!canOpenPayment(order)" type="button" @click="router.push({ path: '/payment', query: { id: order.id } })">
          <van-icon :name="getPaymentState(order)?.icon" /> {{ getPaymentState(order)?.label }}
        </button>
        <van-button block type="primary" color="#0860ff" icon="chat-o" @click="router.replace('/orders')">
          View Order
        </van-button>
        <van-button block plain type="primary" color="#0860ff" @click="router.replace('/orders')">
          View My Orders
        </van-button>
      </div>
    </main>
    <van-empty v-else description="Order details are unavailable. Please check My Orders.">
      <van-button type="primary" @click="router.replace('/orders')">
        View My Orders
      </van-button>
    </van-empty>
  </div>
</template>

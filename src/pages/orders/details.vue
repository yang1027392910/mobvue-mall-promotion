<script setup lang="ts">
import { formatOrderDate, formatOrderMoney, orderSubtotal, orderTotal } from "@@/apis/orders/normalize"
import { canOpenPayment, getPaymentState, showPaymentButton } from "@@/constants/payment"
import { computed, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import ProductSaleType from "@/components/ProductSaleType/index.vue"
import { useOrdersStore } from "@/pinia/stores/orders"
import { useUserStore } from "@/pinia/stores/user"
import "./orders.css"

const route = useRoute()
const router = useRouter()
const orders = useOrdersStore()
const user = useUserStore()
const orderId = computed(() => String(route.query.id || ""))
const order = computed(() => orders.detail)
watch(() => [orderId.value, user.token], () => {
  if (user.token) orders.fetchDetail(orderId.value)
}, { immediate: true })
</script>

<template>
  <div class="orders-page">
    <van-nav-bar title="Order Details" left-arrow @click-left="router.push('/orders')" />
    <div v-if="orders.detailLoading" class="orders-container">
      <van-loading color="#0860ff">
        Loading order details...
      </van-loading>
    </div>
    <van-empty v-else-if="orders.detailError" :description="orders.detailError">
      <van-button v-if="orderId" type="primary" @click="orders.fetchDetail(orderId)">
        Retry
      </van-button>
      <van-button plain type="primary" @click="router.replace('/orders')">
        View My Orders
      </van-button>
    </van-empty>
    <main v-else-if="order" class="orders-container">
      <section class="order-detail-heading">
        <div class="order-card-header">
          <h1>#{{ order.orderNo }}</h1><span class="order-status" :class="order.statusGroup.toLowerCase()">{{ order.status }}</span>
        </div>
        <time class="order-date" :datetime="order.createdAt">{{ formatOrderDate(order.createdAt) }}</time>
      </section>
      <section class="order-panel order-detail-panel">
        <h2>Order Items</h2>
        <div class="order-detail-items">
          <div v-for="item in order.items" :key="item.id" class="order-detail-item">
            <div class="order-thumbnail">
              <van-image v-if="item.image" :src="item.image" :alt="item.title" fit="cover" width="100%" height="100%" /><van-icon v-else name="music-o" />
            </div>
            <div class="order-line-info">
              <h3><ProductSaleType :sale-type="item.saleType" compact /> {{ item.title }}</h3><p>{{ formatOrderMoney(item.price) }} × {{ item.quantity }}</p>
            </div>
            <strong>{{ formatOrderMoney(item.amount) }}</strong>
          </div>
        </div>
        <dl class="order-facts order-costs">
          <div><dt>Subtotal</dt><dd>{{ formatOrderMoney(orderSubtotal(order)) }}</dd></div>
          <div><dt>Discount</dt><dd>{{ formatOrderMoney(order.discount) }}</dd></div>
          <div><dt>Shipping Fee</dt><dd>{{ order.shipping === null ? 'To be confirmed' : formatOrderMoney(order.shipping) }}</dd></div>
          <div class="order-grand-total">
            <dt>Total</dt><dd>{{ formatOrderMoney(orderTotal(order)) }}</dd>
          </div>
          <div v-if="order.remark">
            <dt>Remark</dt><dd>{{ order.remark }}</dd>
          </div>
        </dl>
      </section>
      <button v-if="showPaymentButton(order)" class="order-pay-button order-pay-button--full" :class="getPaymentState(order)?.className" :disabled="!canOpenPayment(order)" type="button" @click="router.push({ path: '/payment', query: { id: order.id } })">
        <van-icon :name="getPaymentState(order)?.icon" /> {{ getPaymentState(order)?.label }}
      </button>
    </main>
    <van-empty v-else description="Order not found">
      <van-button type="primary" @click="router.replace('/orders')">
        View My Orders
      </van-button>
    </van-empty>
  </div>
</template>

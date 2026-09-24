<script setup lang="ts">
import { payOrderApi } from "@@/apis/orders"
import { formatOrderMoney } from "@@/apis/orders/normalize"
import { canOpenPayment, getPaymentState, hasPaymentAccount, paymentMethods } from "@@/constants/payment"
import { showFailToast, showSuccessToast } from "vant"
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useOrdersStore } from "@/pinia/stores/orders"
import { useUserStore } from "@/pinia/stores/user"
import "./payment.css"

const route = useRoute()
const router = useRouter()
const orders = useOrdersStore()
const user = useUserStore()
const selected = ref(paymentMethods[0]!.id)
const reference = ref("")
const confirming = ref(false)
let active = true
onBeforeUnmount(() => {
  active = false
})
const orderId = computed(() => typeof route.query.id === "string" ? route.query.id : "")
const methodId = computed(() => String(route.params.method || ""))
const method = computed(() => paymentMethods.find(item => item.id === methodId.value))
const order = computed(() => orders.detail?.id === orderId.value ? orders.detail : null)
const payable = computed(() => canOpenPayment(order.value))
const amount = computed(() => formatOrderMoney(order.value?.total ?? null))
const title = computed(() => method.value ? `Pay with ${method.value.name}` : "Payment")

watch(() => [orderId.value, user.token], () => {
  reference.value = ""
  if (user.token) void orders.fetchDetail(orderId.value)
}, { immediate: true })
watch(methodId, () => {
  reference.value = ""
  if (method.value) selected.value = method.value.id
}, { immediate: true })

function back() {
  void router.push(methodId.value ? { path: "/payment", query: { id: orderId.value } } : "/orders")
}
function continuePayment() {
  if (!payable.value) return
  void router.push({ path: `/payment/${selected.value}`, query: { id: orderId.value } })
}
async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    showSuccessToast(`${label} copied`)
  } catch {
    showFailToast("Unable to copy. Please select and copy the value manually.")
  }
}
async function reportPayment() {
  if (!payable.value || !method.value || confirming.value || !user.token) return
  const id = Number(orderId.value)
  if (!Number.isSafeInteger(id) || id <= 0) {
    showFailToast("Invalid order ID. Please reopen the order from My Orders.")
    return
  }
  const payload = {
    orderId: id,
    paymentMethod: method.value.paymentMethod,
    referenceNo: reference.value.trim()
  }
  const token = user.token
  const requestedOrderId = orderId.value
  const requestedMethodId = methodId.value
  const isCurrent = () => active && user.token === token && orderId.value === requestedOrderId && methodId.value === requestedMethodId
  confirming.value = true
  try {
    const response = await payOrderApi(payload)
    if (!response || ![0, 200].includes(response.code)) {
      throw new Error(response?.message || "Unable to submit payment. Please try again.")
    }
    if (user.token !== token) return
    // The backend only changes payment fields; leave the order status unchanged.
    const payment = { paymentStatus: 1, paymentMethod: payload.paymentMethod, paymentReference: payload.referenceNo }
    if (orders.detail?.id === requestedOrderId) Object.assign(orders.detail, payment)
    for (const item of orders.orders) {
      if (item.id === requestedOrderId) Object.assign(item, payment)
    }
    if (isCurrent()) showSuccessToast("Payment submitted. Awaiting seller verification.")
  } catch (error) {
    if (isCurrent()) showFailToast(error instanceof Error ? error.message : "Unable to submit payment. Please try again.")
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div class="payment-page">
    <van-nav-bar :title="title" left-arrow @click-left="back" />
    <div v-if="orders.detailLoading" class="payment-state">
      <van-loading color="#0860ff">
        Loading your order...
      </van-loading>
    </div>
    <van-empty v-else-if="orders.detailError || !order" :description="orders.detailError || 'Order not found. Please open an order from My Orders.'">
      <van-button v-if="orderId" type="primary" @click="orders.fetchDetail(orderId)">
        Retry
      </van-button>
      <van-button plain type="primary" @click="router.replace('/orders')">
        My Orders
      </van-button>
    </van-empty>
    <section v-else-if="order.paymentStatus === 1 || order.paymentStatus === 2" class="payment-content payment-submitted" :class="getPaymentState(order)?.className" role="status">
      <van-icon :name="getPaymentState(order)?.icon" />
      <h1>{{ getPaymentState(order)?.label }}</h1>
      <p>{{ getPaymentState(order)?.message }}</p>
      <p>#{{ order.orderNo }}</p>
      <button class="payment-primary" :class="getPaymentState(order)?.className" type="button" disabled>
        <van-icon :name="getPaymentState(order)?.icon" /> {{ getPaymentState(order)?.label }}
      </button>
      <van-button plain type="primary" @click="router.replace({ path: '/order-details', query: { id: order.id } })">
        View Order
      </van-button>
    </section>
    <van-empty v-else-if="!payable" description="Payment is not available for this order. Please contact the seller if you need help.">
      <van-button type="primary" @click="router.push('/procurement-support')">
        Contact Seller
      </van-button>
    </van-empty>
    <van-empty v-else-if="methodId && !method" description="This payment method is unavailable.">
      <van-button type="primary" @click="back">
        Choose a payment method
      </van-button>
    </van-empty>
    <main v-else-if="!method" class="payment-content payment-selection">
      <section class="payment-summary" aria-label="Order summary">
        <van-image v-if="order.productImages[0]" :src="order.productImages[0]" alt="Order product" fit="cover" class="payment-product-image" />
        <span v-else class="payment-product-image payment-image-placeholder"><van-icon name="bag-o" /></span>
        <div class="payment-summary-info">
          <h1>#{{ order.orderNo }}</h1>
          <div><span>{{ order.itemCount }} {{ order.itemCount === 1 ? 'item' : 'items' }}</span><strong>{{ amount }}</strong></div>
        </div>
      </section>
      <fieldset class="payment-methods">
        <legend>Select Payment Method</legend>
        <label v-for="option in paymentMethods" :key="option.id" class="payment-method" :class="{ 'is-selected': selected === option.id }">
          <input v-model="selected" type="radio" name="payment-method" :value="option.id">
          <span class="payment-brand" :class="option.id" aria-hidden="true">{{ option.mark }}</span>
          <span class="payment-method-copy"><strong>{{ option.name }}</strong><span>Pay via {{ option.name }} transfer</span></span>
        </label>
      </fieldset>
      <div class="payment-continue">
        <button class="payment-primary" type="button" @click="continuePayment">
          Continue <van-icon name="arrow" />
        </button>
      </div>
    </main>
    <main v-else class="payment-content payment-transfer">
      <section class="payment-intro">
        <span class="payment-brand" :class="method.id" aria-hidden="true">{{ method.mark }}</span>
        <div><h1>Send payment to our {{ method.name }} account</h1><p>Please transfer the exact amount and enter the reference number below.</p></div>
      </section>
      <section class="payment-account" aria-label="Receiving account">
        <!-- <div class="payment-account-name">
          <span>Account Name</span><strong>{{ method.accountName }}</strong>
        </div> -->
        <div class="payment-account-row">
          <div><span>{{ method.name }} Number</span><strong>{{ method.accountNumber }}</strong></div>
          <button class="payment-copy" type="button" :disabled="!hasPaymentAccount(method)" :aria-label="`Copy ${method.name} number`" @click="copy(method.accountNumber.replace(/\s/g, ''), 'Account number')">
            <van-icon name="description-o" /> Copy
          </button>
        </div>
        <div class="payment-account-row payment-amount-row">
          <div><span>Amount to Pay</span><strong class="payment-amount">{{ amount }}</strong></div>
          <button class="payment-copy" type="button" aria-label="Copy amount" @click="copy(order.total!.toFixed(2), 'Amount')">
            <van-icon name="description-o" /> Copy
          </button>
        </div>
      </section>
      <p v-if="!hasPaymentAccount(method)" class="payment-account-notice" role="status">
        Contact the seller to confirm the receiving account before transferring.
      </p>
      <section class="payment-instructions">
        <h2><van-icon name="balance-o" /> How to Pay</h2>
        <ol>
          <li>Open your {{ method.name }} app</li>
          <li>Send <strong>{{ amount }}</strong> to the number above</li>
          <li>Return here and enter the reference number</li>
          <li>Tap &ldquo;I Have Paid&rdquo;</li>
        </ol>
      </section>
      <form class="payment-reference-form" @submit.prevent="reportPayment">
        <label for="payment-reference">{{ method.name }} Reference No. <span>(Optional)</span></label>
        <div class="payment-reference-input">
          <input id="payment-reference" v-model="reference" type="text" :disabled="confirming" maxlength="100" autocomplete="off" placeholder="Enter reference number (e.g. 123456789)">
          <van-icon name="records-o" aria-hidden="true" />
        </div>
        <button class="payment-primary" type="submit" :disabled="confirming">
          {{ confirming ? "Submitting..." : getPaymentState(order)?.label }}
        </button>
        <p class="payment-verification-note">
          Your payment will be verified by the seller.
        </p>
      </form>
    </main>
  </div>
</template>

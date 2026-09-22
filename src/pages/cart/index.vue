<script setup lang="ts">
import type { CartProduct } from "@/pinia/stores/cart"
import { getProductListApi } from "@@/apis/products"
import { requireLogin } from "@@/utils/guest-access"
import { showConfirmDialog, showFailToast, showSuccessToast } from "vant"
import { computed, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { useCartStore } from "@/pinia/stores/cart"
import { useCouponsStore } from "@/pinia/stores/coupons"
import { useOrdersStore } from "@/pinia/stores/orders"
import { useUserStore } from "@/pinia/stores/user"

const router = useRouter()
const cart = useCartStore()
const user = useUserStore()
const orders = useOrdersStore()
const coupons = useCouponsStore()
const deliveryType = ref<1 | 2>(1)
const orderRemark = ref("")
const submitting = ref(false)
const checkoutVisible = ref(false)
watch(() => user.token, () => {
  checkoutVisible.value = false
  coupons.clearSelectedCoupon()
  if (user.token) {
    cart.fetchItems()
    coupons.fetchRewards()
  }
})
watch(() => [checkoutVisible.value, cart.total, cart.selectedItems.map(item => `${item.cartId}:${item.quantity}`).join(",")], () => {
  if (checkoutVisible.value && user.token) void coupons.fetchAvailable(cart.total)
})
const recommendations = ref<CartProduct[]>([])
const loading = ref(false)
const failed = ref(false)
const suggestedProducts = computed(() => recommendations.value.filter(product => !cart.items.some(item => item.id === product.id)).slice(0, 6))
const shippingFee = computed(() => 0)
const discountAmount = computed(() => coupons.discountFor())
const totalPayment = computed(() => Math.max(0, cart.total + shippingFee.value - discountAmount.value))
const availableCouponCount = computed(() => coupons.availableForOrder.length)
const peso = String.fromCharCode(8369)
const money = (value: number) => peso + value.toFixed(2)

async function submitOrder() {
  if (submitting.value || orders.creating || cart.busy || cart.loadError || !cart.selectedItems.length) return
  if (!requireLogin(router)) return
  const submittedItems = cart.selectedItems.map(item => ({ cartId: item.cartId, productId: item.id, quantity: item.quantity }))
  submitting.value = true
  try {
    const created = await orders.create({
      cartIds: submittedItems.map(item => item.cartId),
      deliveryType: deliveryType.value,
      userCouponId: coupons.selectedCoupon?.id ?? null,
      remark: orderRemark.value.trim()
    })
    if (!created) {
      if (orders.createError) showFailToast(orders.createError)
      await coupons.fetchAvailable(cart.total)
      return
    }
    coupons.markSelectedUsed()
    checkoutVisible.value = false
    orderRemark.value = ""
    deliveryType.value = 1
    await Promise.all([cart.fetchItems(), coupons.fetchRewards(), orders.fetchList()])
    await router.push({ path: "/order-success", query: created.id ? { id: created.id } : {} })
  } finally {
    submitting.value = false
  }
}

function back() {
  if (window.history.state?.back) router.back()
  else router.replace("/")
}
function openProduct(id: number) {
  router.push({ path: "/product-card", query: { id } })
}
async function removeItems(ids: number[]) {
  if (!ids.length) return
  try {
    await showConfirmDialog({ title: "Remove products?", message: "Remove the selected products from your cart?", confirmButtonText: "Remove", cancelButtonText: "Cancel", confirmButtonColor: "#0860ff" })
  } catch {
    return
  }
  await runAction(cart.remove(ids))
}
async function runAction(action: Promise<boolean>) {
  const succeeded = await action
  if (!succeeded) showFailToast(cart.errorText || "Unable to update your cart. Please try again.")
  return succeeded
}
async function changeQuantity(id: number, value: string | number) {
  if (submitting.value || cart.busy) return false
  await runAction(cart.setQuantity(id, Number(value)))
  // The refreshed server model controls the input, including on request failure.
  return false
}
async function addProduct(product: CartProduct) {
  if (!requireLogin(router)) return
  if (await runAction(cart.add(product))) showSuccessToast("Added to cart")
}
async function loadRecommendations() {
  loading.value = true
  failed.value = false
  try {
    const { data } = await getProductListApi({})
    const list = Array.isArray(data) ? data : data.list
    recommendations.value = list.map((item) => {
      const image = String(item.cover ?? item.image ?? item.imageUrl ?? "")
      return {
        id: Number(item.id ?? item.productId),
        title: String(item.name ?? item.productName ?? item.title ?? ""),
        image: !image || /^https?:\/\//.test(image) ? image : `${(import.meta.env.VITE_IMAGE_BASE_URL || "").replace(/\/$/, "")}/${image.replace(/^\//, "")}`,
        price: Number(item.phPrice ?? item.price)
      }
    }).filter(item => item.id > 0 && item.title && Number.isFinite(item.price) && item.price >= 0)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  cart.fetchItems()
  if (user.token) coupons.fetchRewards()
  loadRecommendations()
})
</script>

<template>
  <div class="cart-page" :class="{ 'is-empty': !cart.count }">
    <van-nav-bar :title="`My Cart (${cart.count})`" left-arrow @click-left="back">
      <template #right>
        <button v-if="cart.count" class="text-button" :disabled="submitting || cart.busy || !!cart.loadError || !cart.selectedItems.length" @click="removeItems(cart.selectedItems.map(item => item.id))">
          Delete
        </button>
      </template>
    </van-nav-bar>

    <main class="cart-content">
      <div v-if="!user.token" class="recommendation-status">
        <p>Log in to view your shopping cart.</p>
        <van-button type="primary" color="#0860ff" @click="router.push('/login')">
          Login
        </van-button>
      </div>
      <div v-else-if="cart.loading && !cart.count" class="recommendation-status">
        <van-loading color="#0860ff">
          Loading your cart...
        </van-loading>
      </div>
      <div v-else-if="cart.loadError" class="recommendation-status" role="alert">
        <p>{{ cart.loadError }}</p>
        <button class="text-button" :disabled="submitting || cart.busy" @click="cart.fetchItems()">
          Retry
        </button>
      </div>
      <template v-else-if="cart.count">
        <div class="shipping-notice">
          <van-icon name="logistics" size="21" />
          <span>Shipping fees confirmed with your order</span>
        </div>
        <div class="cart-items">
          <article v-for="item in cart.items" :key="item.id" class="cart-item">
            <van-checkbox :model-value="item.selected" :disabled="submitting || cart.busy" @update:model-value="runAction(cart.setSelected(item.id, $event))" shape="square" checked-color="#0860ff" :aria-label="`Select ${item.title}`" />
            <button class="item-image" :aria-label="`View ${item.title}`" @click="openProduct(item.id)">
              <van-image :src="item.image" :alt="item.title" fit="cover" width="100%" height="100%" />
            </button>
            <div class="item-details">
              <button class="item-title" @click="openProduct(item.id)">
                {{ item.title }}
              </button>
              <strong class="item-price">{{ money(item.price) }}</strong>
              <van-stepper :model-value="item.quantity" :disabled="submitting || cart.busy" min="1" max="999" integer :aria-label="`Quantity for ${item.title}`" :long-press="false" :before-change="(value: string | number) => changeQuantity(item.id, value)" />
            </div>
            <button class="remove-button" :disabled="submitting || cart.busy" :aria-label="`Remove ${item.title}`" @click="removeItems([item.id])">
              <van-icon name="delete-o" />
            </button>
          </article>
        </div>
      </template>
      <section v-else class="empty-cart">
        <svg class="empty-cart-icon" viewBox="0 0 120 110" fill="none" aria-hidden="true">
          <path d="M13 18l14 5 13 57h55l13-43H31M65 12v12M49 16l5 10M82 16l-5 10" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="47" cy="96" r="6" stroke="currentColor" stroke-width="4" />
          <circle cx="91" cy="96" r="6" stroke="currentColor" stroke-width="4" />
        </svg>
        <h1>Your cart is empty</h1>
        <p>Discover amazing products<br>and add them to your cart!</p>
        <van-button type="primary" color="#0860ff" block @click="router.push('/categories')">
          Browse Products
        </van-button>
      </section>

      <section class="recommendations">
        <div class="section-heading">
          <h2>{{ cart.count ? "You may also like" : "Recommended for you" }}</h2>
          <button v-if="cart.count" class="text-button see-more" @click="router.push('/categories')">
            See More <van-icon name="arrow" />
          </button>
        </div>
        <div v-if="loading" class="recommendation-status">
          <van-loading color="#0860ff" size="24">
            Loading products...
          </van-loading>
        </div>
        <div v-else-if="failed" class="recommendation-status">
          <p>Unable to load recommendations.</p>
          <button class="text-button" @click="loadRecommendations">
            Try again
          </button>
        </div>
        <div v-else-if="suggestedProducts.length" class="recommendation-list" :class="{ 'horizontal-list': cart.count }">
          <article v-for="item in suggestedProducts" :key="item.id" class="recommendation-card">
            <button class="recommendation-image" :aria-label="`View ${item.title}`" @click="openProduct(item.id)">
              <van-image :src="item.image" :alt="item.title" fit="cover" width="100%" height="100%" />
            </button>
            <div class="recommendation-body">
              <button class="recommendation-title" @click="openProduct(item.id)">
                {{ item.title }}
              </button>
              <div class="recommendation-bottom">
                <strong>{{ money(item.price) }}</strong>
                <button class="add-button" :disabled="submitting || cart.busy" :aria-label="`Add ${item.title} to cart`" @click="addProduct(item)">
                  <van-icon name="shopping-cart-o" />
                </button>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="recommendation-status">
          <button class="text-button" @click="router.push('/categories')">
            Explore more products <van-icon name="arrow" />
          </button>
        </div>
      </section>
    </main>

    <footer v-if="cart.count" class="cart-checkout">
      <div class="checkout-summary">
        <van-checkbox :model-value="cart.allSelected" :disabled="submitting || cart.busy || !!cart.loadError" shape="square" checked-color="#0860ff" @update:model-value="runAction(cart.selectAll($event))">
          Select All
        </van-checkbox>
        <div class="total" aria-live="polite">
          <span>Total:</span><strong>{{ money(cart.total) }}</strong>
        </div>
      </div>
      <van-button block type="primary" color="#0860ff" :disabled="submitting || cart.busy || !!cart.loadError || !cart.selectedItems.length" @click="checkoutVisible = true">
        Submit Order
      </van-button>
    </footer>

    <van-popup v-model:show="checkoutVisible" round position="bottom" closeable safe-area-inset-bottom>
      <section class="checkout-sheet">
        <h2>Checkout</h2>
        <div class="checkout-block">
          <h3>Shipping Method</h3>
          <label class="choice-row">
            <van-radio :model-value="deliveryType" :name="1" checked-color="#ff2d4f" @update:model-value="deliveryType = 1" />
            <span><strong>Self Pickup</strong><small>Pick up at our store</small></span>
            <em>Free</em>
          </label>
          <label class="choice-row">
            <van-radio :model-value="deliveryType" :name="2" checked-color="#ff2d4f" @update:model-value="deliveryType = 2" />
            <span><strong>Delivery</strong><small>Contact customer service</small></span>
            <em>To be confirmed</em>
          </label>
        </div>

        <button class="coupon-select-row" type="button" @click="router.push({ path: '/coupons', query: { select: '1', orderAmount: cart.total.toFixed(2) } })">
          <span><van-icon name="coupon-o" /> Use Coupon</span>
          <strong v-if="coupons.selectedCoupon">{{ coupons.selectedCoupon.title }}</strong>
          <small v-else-if="coupons.availableLoading">Loading coupons...</small>
          <small v-else>{{ availableCouponCount ? 'Select a coupon' : 'No coupon available' }}</small>
          <van-icon name="arrow" />
        </button>

        <button v-if="coupons.selectedCoupon" class="applied-coupon" type="button" @click="coupons.clearSelectedCoupon()">
          <span><van-icon name="gift-o" /> {{ money(coupons.selectedCoupon.amount) }} {{ coupons.selectedCoupon.title }}</span>
          <van-icon name="cross" />
        </button>

        <van-field v-model="orderRemark" label="Remark" type="textarea" placeholder="Optional order notes" rows="2" maxlength="500" show-word-limit :disabled="submitting" />
        <p v-if="orders.createError" role="alert">
          {{ orders.createError }} <router-link to="/orders">
            View My Orders
          </router-link>
        </p>
        <div class="order-lines">
          <div v-for="item in cart.selectedItems" :key="item.id" class="order-line">
            <span>{{ item.title }} 鑴?{{ item.quantity }}</span><strong>{{ money(item.price * item.quantity) }}</strong>
          </div>
        </div>
        <div class="total-lines">
          <div><span>Items Total</span><strong>{{ money(cart.total) }}</strong></div>
          <div><span>Discount</span><strong class="discount">- {{ money(discountAmount) }}</strong></div>
          <div><span>Shipping Fee</span><strong>To be confirmed</strong></div>
          <div class="payment-line">
            <span>Total Payment</span><strong>{{ money(totalPayment) }}</strong>
          </div>
        </div>
        <van-button block color="#ff2d4f" :loading="submitting" :disabled="submitting || cart.busy || !!cart.loadError || !cart.selectedItems.length" @click="submitOrder">
          Place Order
        </van-button>
      </section>
    </van-popup>
  </div>
</template>

<style scoped>
.cart-page {
  min-height: 100%;

  background: #f5f7fb;

  color: #101828;

  --van-stepper-background: #fff;

  --van-stepper-input-text-color: #101828;
}

.cart-page :deep(.van-nav-bar) {
  position: sticky;

  top: 0;

  z-index: 10;
}

.cart-page :deep(.van-nav-bar__title) {
  font-weight: 700;

  font-size: 18px;
}

.cart-page :deep(.van-nav-bar__arrow) {
  color: #0860ff;

  font-size: 22px;
}

.cart-content {
  padding: 10px 12px calc(155px + env(safe-area-inset-bottom));
}

button {
  cursor: pointer;

  font: inherit;
}

button:focus-visible {
  outline: 2px solid #0860ff;

  outline-offset: 3px;
}

.text-button {
  border: 0;

  padding: 5px 0;

  color: #0860ff;

  background: transparent;

  font-size: 13px;
}

.text-button:disabled {
  opacity: 0.4;

  cursor: default;
}

.shipping-notice {
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 14px 16px;

  margin-bottom: 9px;

  border-radius: 13px;

  background: #fff6e8;

  color: #88460d;

  font-size: 12px;
}

.cart-items {
  display: grid;

  gap: 10px;
}

.cart-item {
  position: relative;

  display: flex;

  align-items: center;

  gap: 12px;

  min-height: 128px;

  padding: 13px 12px;

  background: white;

  border-radius: 14px;
}

.cart-item > :deep(.van-checkbox) {
  flex-shrink: 0;
}

.item-image {
  flex: 0 0 90px;

  width: 90px;

  height: 96px;

  padding: 0;

  border: 0;

  border-radius: 8px;

  overflow: hidden;

  background: #eeece9;
}

.item-details {
  min-width: 0;

  flex: 1;

  align-self: stretch;
}

.item-title,
.recommendation-title {
  display: -webkit-box;

  -webkit-line-clamp: 2;

  -webkit-box-orient: vertical;

  overflow: hidden;

  border: 0;

  padding: 0;

  background: transparent;

  color: #101828;

  text-align: left;

  line-height: 19px;

  font-size: 14px;
}

.item-title {
  padding-right: 17px;

  min-height: 38px;
}

.item-price {
  display: block;

  margin: 6px 0 8px;

  color: #ff3b14;

  font-size: 15px;
}

.remove-button {
  position: absolute;

  right: 7px;

  top: 11px;

  display: grid;

  place-items: center;

  width: 28px;

  height: 28px;

  padding: 0;

  border: 0;

  background: transparent;

  color: #667085;

  font-size: 21px;
}

.item-details :deep(.van-stepper) {
  display: inline-flex;

  border: 1px solid #d8deea;

  border-radius: 6px;

  overflow: hidden;
}

.item-details :deep(.van-stepper__input) {
  width: 46px;

  height: 28px;

  margin: 0;

  border-right: 1px solid #d8deea;

  border-left: 1px solid #d8deea;
}

.item-details :deep(.van-stepper__minus),
.item-details :deep(.van-stepper__plus) {
  width: 31px;

  height: 28px;

  color: #52617d;

  border-radius: 0;
}

.item-details :deep(.van-stepper__minus--disabled),
.item-details :deep(.van-stepper__plus--disabled) {
  color: #c4cbd5;
}

.recommendations {
  margin-top: 28px;
}

.section-heading {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 8px;

  margin: 0 4px 13px;
}

h2 {
  margin: 0;

  font-size: 15px;

  line-height: 22px;
}

.see-more {
  font-size: 11px;

  white-space: nowrap;
}

.recommendation-list {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 12px;
}

.horizontal-list {
  display: flex;

  overflow-x: auto;

  padding: 0 4px 8px;

  scroll-snap-type: x proximity;
}

.recommendation-card {
  min-width: 0;

  overflow: hidden;

  border-radius: 11px;

  background: white;
}

.horizontal-list .recommendation-card {
  flex: 0 0 136px;

  scroll-snap-align: start;
}

.recommendation-image {
  display: block;

  width: 100%;

  aspect-ratio: 1.08;

  padding: 0;

  border: 0;

  overflow: hidden;

  background: #ecebea;
}

.recommendation-body {
  padding: 9px 8px;
}

.recommendation-title {
  font-size: 12px;

  line-height: 17px;

  min-height: 34px;
}

.recommendation-bottom {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 3px;

  margin-top: 7px;

  color: #0860ff;

  font-size: 14px;
}

.horizontal-list .recommendation-bottom {
  color: #ff3b14;
}

.add-button {
  display: grid;

  place-items: center;

  flex-shrink: 0;

  width: 26px;

  height: 28px;

  border: 1px solid #0860ff;

  border-radius: 5px;

  background: white;

  color: #0860ff;

  font-size: 19px;
}

.cart-checkout {
  position: fixed;

  z-index: 15;

  bottom: 0;

  left: 50%;

  transform: translateX(-50%);

  width: 100%;

  max-width: 500px;

  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));

  border-radius: 16px 16px 0 0;

  background: white;

  box-shadow: 0 -5px 24px #132c5010;
}

.checkout-summary {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 10px;

  margin-bottom: 17px;

  font-size: 13px;
}

.total {
  display: flex;

  align-items: baseline;

  justify-content: space-between;

  gap: 10px;

  font-size: 14px;
}

.total strong {
  color: #ff3b14;

  font-size: 23px;

  overflow-wrap: anywhere;
}

.cart-checkout :deep(.van-button),
.empty-cart :deep(.van-button) {
  height: 49px;

  border-radius: 8px;

  font-size: 16px;

  font-weight: 500;
}

.empty-cart {
  display: flex;

  flex-direction: column;

  align-items: center;

  padding: 78px 22px 40px;

  text-align: center;
}

.empty-cart-icon {
  width: 104px;

  height: 100px;

  color: #8b93a4;

  margin-bottom: 18px;
}

.empty-cart h1 {
  margin: 0;

  font-size: 17px;

  line-height: 25px;
}

.empty-cart p {
  margin: 10px 0 20px;

  color: #667085;

  font-size: 14px;

  line-height: 21px;
}

.is-empty .cart-content {
  padding-bottom: calc(28px + env(safe-area-inset-bottom));
}

.is-empty .recommendations {
  margin-top: 26px;
}

.recommendation-status {
  padding: 25px 10px;

  color: #667085;

  font-size: 13px;

  text-align: center;
}

.storage-warning {
  padding: 10px;

  color: #88460d;

  background: #fff6e8;

  font-size: 12px;
}

.checkout-sheet {
  max-width: 500px;

  margin: auto;

  padding: 26px 20px;
}

.checkout-sheet h2 {
  font-size: 19px;
}

.checkout-sheet > p {
  color: #667085;

  font-size: 13px;

  line-height: 21px;
}

.order-lines {
  max-height: 35vh;

  overflow-y: auto;

  margin-bottom: 20px;
}

.order-line {
  display: flex;

  justify-content: space-between;

  gap: 16px;

  padding: 12px 0;

  border-bottom: 1px solid #eef0f5;

  font-size: 13px;

  line-height: 20px;
}

.order-line strong {
  white-space: nowrap;
}

.checkout-block,
.coupon-select-row,
.applied-coupon,
.total-lines {
  margin-bottom: 14px;

  border-radius: 8px;

  background: #ffffff;

  box-shadow: 0 8px 22px rgba(15, 31, 58, 0.05);
}

.checkout-block {
  padding: 14px;
}

.checkout-block h3 {
  margin: 0 0 10px;

  color: #071632;

  font-size: 14px;

  line-height: 20px;
}

.choice-row {
  display: flex;

  align-items: center;

  gap: 10px;

  padding: 10px 0;

  border-bottom: 1px solid #eef2f7;
}

.choice-row:last-child {
  border-bottom: 0;
}

.choice-row span {
  min-width: 0;

  flex: 1;
}

.choice-row strong,
.coupon-select-row span,
.applied-coupon span {
  display: block;

  color: #071632;

  font-size: 13px;

  font-weight: 700;

  line-height: 18px;
}

.choice-row small {
  display: block;

  margin-top: 2px;

  color: #7b879f;

  font-size: 11px;

  line-height: 16px;
}

.choice-row em {
  color: #071632;

  font-size: 12px;

  font-style: normal;

  font-weight: 700;
}

.coupon-select-row,
.applied-coupon {
  width: 100%;

  min-height: 52px;

  border: 0;

  display: flex;

  align-items: center;

  gap: 10px;

  padding: 12px 14px;

  text-align: left;
}

.coupon-select-row span,
.applied-coupon span {
  display: inline-flex;

  align-items: center;

  gap: 8px;

  flex: 1;
}

.coupon-select-row > strong,
.coupon-select-row > small {
  color: #8b96ac;

  font-size: 11px;

  font-weight: 500;
}

.coupon-select-row :deep(.van-icon:first-child),
.applied-coupon :deep(.van-icon:first-child) {
  color: #ff2d4f;

  font-size: 18px;
}

.applied-coupon {
  color: #071632;
}

.total-lines {
  padding: 14px;
}

.total-lines > div {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;

  padding: 7px 0;

  color: #31405d;

  font-size: 12px;
}

.total-lines strong {
  color: #071632;

  font-size: 12px;
}

.total-lines .discount {
  color: #ff2d4f;
}

.total-lines .payment-line {
  margin-top: 7px;

  border-top: 1px solid #eef2f7;

  padding-top: 14px;

  color: #071632;

  font-size: 14px;

  font-weight: 700;
}

.total-lines .payment-line strong {
  color: #ff2d4f;

  font-size: 20px;
}
.checkout-sheet > .van-button {
  margin-top: 20px;

  border-radius: 8px;
}
</style>

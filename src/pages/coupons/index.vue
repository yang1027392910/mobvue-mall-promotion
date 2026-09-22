<script setup lang="ts">
import type { RawCouponStatus } from "@@/apis/coupons/type"
import type { Coupon } from "@/pinia/stores/coupons"
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import emptyCouponImage from "@/assets/coupon/no_data.png"
import { useCouponsStore } from "@/pinia/stores/coupons"

const route = useRoute()
const router = useRouter()
const coupons = useCouponsStore()
const activeStatus = ref<RawCouponStatus>(1)
const selectMode = computed(() => route.query.select === "1")
const orderAmount = computed(() => Number(route.query.orderAmount || 0))
const peso = String.fromCharCode(8369)
const tabs: Array<{ title: string, status: RawCouponStatus }> = [
  { title: "Available", status: 1 },
  { title: "Used", status: 2 },
  { title: "Expired", status: 3 }
]
const visibleCoupons = computed(() => selectMode.value ? coupons.availableForOrder : coupons.coupons)
const money = (amount: number) => peso + amount.toFixed(0)
const emptyText = computed(() => {
  if (selectMode.value) return "No available coupons yet"
  if (activeStatus.value === 2) return "No used coupons yet"
  if (activeStatus.value === 3) return "No expired coupons yet"
  return "No available coupons yet"
})
const dateText = (value: string) => value ? value.slice(0, 10) : "--"

async function loadCoupons(page = 1) {
  if (selectMode.value) await coupons.fetchAvailable(orderAmount.value)
  else await coupons.fetchList({ status: activeStatus.value, page, pageSize: 10 })
}

function openCoupon(coupon: Coupon) {
  router.push({ path: "/coupon-detail", query: { id: coupon.id } })
}

function useCoupon(coupon: Coupon | null) {
  if (selectMode.value) {
    if (coupon) coupons.selectCoupon(coupon.id)
    else coupons.clearSelectedCoupon()
    router.back()
    return
  }
  router.push("/hot-products")
}

watch(activeStatus, () => {
  if (!selectMode.value) void loadCoupons(1)
})
watch(() => route.fullPath, () => loadCoupons(1))
onMounted(() => loadCoupons(1))
</script>

<template>
  <div class="coupon-page">
    <van-nav-bar :title="selectMode ? 'Select Coupon' : 'My Coupons'" left-arrow @click-left="router.back()" />
    <div v-if="!selectMode" class="coupon-tabs">
      <button v-for="tab in tabs" :key="tab.status" class="coupon-tab" :class="{ active: activeStatus === tab.status }" type="button" @click="activeStatus = tab.status">
        {{ tab.title }}
      </button>
    </div>
    <main class="coupon-list">
      <button v-if="selectMode" class="no-coupon-row" type="button" @click="useCoupon(null)">
        <van-icon :name="coupons.selectedCouponId ? 'circle' : 'checked'" />
        <span>Do not use coupon</span>
      </button>
      <div v-if="coupons.listLoading || coupons.availableLoading" class="coupon-state">
        <van-loading color="#ff2d4f">
          Loading coupons...
        </van-loading>
      </div>
      <div v-else-if="coupons.listError || coupons.availableError" class="coupon-state" role="alert">
        <p>{{ coupons.listError || coupons.availableError }}</p>
        <button class="retry-button" type="button" @click="loadCoupons(1)">
          Retry
        </button>
      </div>
      <template v-else>
        <article v-for="coupon in visibleCoupons" :key="coupon.id" class="coupon-card" :class="{ selected: coupons.selectedCouponId === coupon.id }" @click="selectMode ? useCoupon(coupon) : openCoupon(coupon)">
          <van-icon v-if="selectMode" class="select-icon" :name="coupons.selectedCouponId === coupon.id ? 'checked' : 'circle'" />
          <div class="ticket-icon">
            <van-icon name="gift-o" />
          </div>
          <div class="coupon-copy">
            <strong>{{ money(coupon.amount) }}</strong>
            <span>{{ coupon.title }}</span>
            <small>Valid until {{ dateText(coupon.validTo) }}</small>
            <small v-if="selectMode">Discount preview: {{ peso }}{{ coupon.discountAmount.toFixed(2) }}</small>
          </div>
          <button v-if="!selectMode && coupon.statusCode === 1" class="use-button" type="button" @click.stop="useCoupon(coupon)">
            Use Now
          </button>
          <span v-else-if="!selectMode" class="status-pill">{{ coupon.statusName }}</span>
        </article>
        <div v-if="!visibleCoupons.length" class="empty-coupons">
          <img :src="emptyCouponImage" alt="" aria-hidden="true">
          <p>{{ emptyText }}</p>
        </div>
        <button v-if="!selectMode && coupons.hasMore" class="load-more" type="button" @click="loadCoupons(coupons.page + 1)">
          Load More
        </button>
        <p v-else-if="visibleCoupons.length" class="no-more">
          No more coupons
        </p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.coupon-page {
  min-height: 100%;
  color: #071632;
  background: #f7faff;
}
.coupon-page :deep(.van-nav-bar__title) {
  font-weight: 700;
}
.coupon-tabs {
  position: sticky;
  top: 46px;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 8px 12px 0;
  background: #f7faff;
}
.coupon-tab {
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 12px 4px;
  color: #64708b;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
}
.coupon-tab.active {
  border-color: #ff2d4f;
  color: #ff2d4f;
}
.coupon-list {
  padding: 12px 14px 40px;
}
.coupon-card,
.no-coupon-row {
  width: 100%;
  min-height: 86px;
  margin-bottom: 12px;
  border: 1px solid #e9edf5;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(15, 31, 58, 0.05);
  text-align: left;
}
.coupon-card.selected {
  border-color: #ff2d4f;
}
.no-coupon-row {
  min-height: 54px;
  color: #071632;
  font-size: 13px;
  font-weight: 700;
}
.select-icon {
  color: #ff2d4f;
  font-size: 18px;
}
.ticket-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #fff;
  background: linear-gradient(135deg, #ff9b37, #ff673a);
  font-size: 31px;
}
.coupon-card:nth-child(2n) .ticket-icon {
  background: linear-gradient(135deg, #ff6d76, #ff2d59);
}
.coupon-copy {
  min-width: 0;
  flex: 1;
}
.coupon-copy strong {
  display: block;
  color: #8a1208;
  font-size: 19px;
  line-height: 23px;
}
.coupon-copy span {
  display: block;
  color: #071632;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}
.coupon-copy small {
  display: block;
  color: #7b879f;
  font-size: 11px;
  line-height: 16px;
}
.use-button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  padding: 8px 13px;
  color: #fff;
  background: linear-gradient(135deg, #ff3856, #f51f44);
  font-size: 12px;
  font-weight: 700;
}
.status-pill {
  border-radius: 999px;
  padding: 6px 10px;
  color: #7b879f;
  background: #f0f3f8;
  font-size: 11px;
}
.coupon-state {
  padding: 35px 8px;
  color: #7b879f;
  font-size: 12px;
  text-align: center;
}
.retry-button,
.load-more {
  border: 0;
  color: #ff2d4f;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
}
.load-more {
  width: 100%;
  padding: 12px;
}
.empty-coupons {
  padding: 48px 20px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-coupons img {
  width: 105px;
  height: 105px;
  display: block;
  object-fit: contain;
}

.empty-coupons p {
  margin: 12px 0 0;
  color: #20283a;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.no-more {
  margin: 28px 0 0;
  color: #8b96ac;
  font-size: 12px;
  text-align: center;
}
</style>

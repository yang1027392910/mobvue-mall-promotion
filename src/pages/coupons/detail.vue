<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useCouponsStore } from "@/pinia/stores/coupons"

const route = useRoute()
const router = useRouter()
const coupons = useCouponsStore()
const peso = String.fromCharCode(8369)
const coupon = computed(() => coupons.getCoupon(String(route.query.id || "")))
const money = (amount: number) => peso + amount.toFixed(2)
const dateText = (value: string) => value || "--"

function useNow() {
  if (!coupon.value || coupon.value.statusCode !== 1) return
  router.push("/hot-products")
}

onMounted(async () => {
  if (!coupon.value) await coupons.fetchList({ page: 1, pageSize: 100 })
})
</script>

<template>
  <div class="coupon-detail-page">
    <van-nav-bar title="Coupon Detail" left-arrow @click-left="router.back()" />
    <main v-if="coupon" class="detail-content">
      <section class="coupon-hero">
        <strong>{{ peso }}{{ coupon.amount.toFixed(0) }}</strong>
        <span>{{ coupon.title }}</span>
        <van-icon name="gift-o" />
      </section>
      <section class="detail-panel">
        <div class="detail-row">
          <span>Status</span><strong class="status" :class="coupon.status">{{ coupon.statusName }}</strong>
        </div>
        <div class="detail-row">
          <span>Coupon Type</span><strong>{{ coupon.typeName }}</strong>
        </div>
        <div class="detail-row">
          <span>Amount</span><strong>{{ money(coupon.amount) }}</strong>
        </div>
        <div class="detail-row">
          <span>Valid Period</span><strong>{{ dateText(coupon.validFrom) }} ~ {{ dateText(coupon.validTo) }}</strong>
        </div>
        <div class="detail-row">
          <span>Source</span><strong>{{ coupon.typeName }}</strong>
        </div>
        <div class="detail-row description-row">
          <span>Description</span><strong>{{ coupon.description }}</strong>
        </div>
      </section>
      <van-button v-if="coupon.statusCode === 1" block color="#ff2d4f" class="primary-action" @click="useNow">
        Use Now
      </van-button>
    </main>
    <div v-else-if="coupons.listLoading" class="detail-state">
      <van-loading color="#ff2d4f">
        Loading coupon...
      </van-loading>
    </div>
    <van-empty v-else description="Coupon not found">
      <van-button type="primary" @click="router.replace('/coupons')">
        Back to Coupons
      </van-button>
    </van-empty>
  </div>
</template>

<style scoped>
.coupon-detail-page {
  min-height: 100%;
  color: #071632;
  background: #f7faff;
}
.detail-content {
  padding: 18px 14px 34px;
}
.detail-state {
  padding: 44px 12px;
  text-align: center;
}
.coupon-hero {
  position: relative;
  min-height: 104px;
  border-radius: 8px;
  padding: 22px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(135deg, #ff9c39, #ff6b32);
}
.coupon-hero strong {
  display: block;
  font-size: 31px;
  line-height: 36px;
}
.coupon-hero span {
  display: block;
  margin-top: 5px;
  font-size: 16px;
  font-weight: 700;
}
.coupon-hero :deep(.van-icon) {
  position: absolute;
  right: 22px;
  bottom: 13px;
  color: rgba(255, 255, 255, 0.26);
  font-size: 76px;
}
.detail-panel {
  margin-top: 18px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 22px rgba(15, 31, 58, 0.05);
}
.detail-row {
  min-height: 47px;
  border-bottom: 1px solid #eef2f7;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  font-size: 12px;
}
.detail-row:last-child {
  border-bottom: 0;
}
.detail-row span {
  flex: 0 0 auto;
  color: #66728c;
}
.detail-row strong {
  color: #071632;
  font-size: 12px;
  text-align: right;
}
.description-row {
  align-items: flex-start;
}
.description-row strong {
  line-height: 18px;
}
.status {
  border-radius: 999px;
  padding: 5px 12px;
  text-transform: capitalize;
}
.status.available {
  color: #18a957;
  background: #e9f9ef;
}
.status.locked,
.status.used,
.status.expired,
.status.disabled {
  color: #7b879f;
  background: #f0f3f8;
}
.primary-action {
  margin-top: 48px;
  height: 48px;
  border-radius: 8px;
  font-weight: 700;
}
</style>

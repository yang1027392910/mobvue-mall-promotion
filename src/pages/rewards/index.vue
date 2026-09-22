<script setup lang="ts">
import type { Coupon } from "@/pinia/stores/coupons"
import { computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { normalizeCoupon, useCouponsStore } from "@/pinia/stores/coupons"

const router = useRouter()
const coupons = useCouponsStore()
const peso = String.fromCharCode(8369)
const registration = computed(() => coupons.rewards?.registration ? normalizeCoupon(coupons.rewards.registration) : null)
const verification = computed(() => coupons.rewards?.verification ? normalizeCoupon(coupons.rewards.verification) : null)
const fallbackRegistration = computed<Coupon>(() => ({ id: 0, type: 1, typeName: "Registration", title: "New User Coupon", amount: 20, statusCode: 0, status: "locked", statusName: "Locked", description: "Registration reward will appear automatically after signup.", validFrom: "", validTo: "", usedAt: "", discountAmount: 0 }))
const fallbackVerification = computed<Coupon>(() => ({ id: 0, type: 2, typeName: "Verification", title: "Verification Coupon", amount: 40, statusCode: 0, status: "locked", statusName: "Locked", description: "Complete identity verification to unlock this reward.", validFrom: "", validTo: "", usedAt: "", discountAmount: 0 }))
const registrationReward = computed(() => registration.value || fallbackRegistration.value)
const verificationReward = computed(() => verification.value || fallbackVerification.value)

function actionText(coupon: Coupon) {
  if (coupon.statusCode === 1) return "Use Now"
  if (coupon.statusCode === 2) return "Used"
  if (coupon.statusCode === 3) return "Expired"
  if (coupon.statusCode === 4) return "Disabled"
  return "Locked"
}

function handleReward(coupon: Coupon) {
  if (coupon.statusCode === 1 && coupon.id) router.push("/hot-products")
  else if (coupon.type === 2 && coupon.statusCode === 0) router.push("/user-verification")
}

onMounted(() => coupons.fetchRewards())
</script>

<template>
  <div class="rewards-page">
    <van-nav-bar title="Rewards" left-arrow @click-left="router.back()" />
    <main class="rewards-content">
      <section class="rewards-hero">
        <div><h1>Get More Benefits</h1><p>Shop More, Save More</p></div><van-icon name="gift-o" />
      </section>
      <div v-if="coupons.rewardsLoading" class="reward-state">
        <van-loading color="#ff2d4f">
          Loading rewards...
        </van-loading>
      </div>
      <div v-else-if="coupons.rewardsError" class="reward-state" role="alert">
        <p>{{ coupons.rewardsError }}</p><button type="button" @click="coupons.fetchRewards()">
          Retry
        </button>
      </div>
      <template v-else>
        <article v-for="reward in [registrationReward, verificationReward]" :key="reward.type" class="reward-card">
          <div class="reward-icon" :class="reward.type === 1 ? 'blue' : 'purple'">
            <van-icon name="gift-o" />
          </div>
          <div class="reward-copy">
            <strong>{{ peso }}{{ reward.amount.toFixed(0) }}</strong><span>{{ reward.typeName }} Reward</span><small>{{ reward.description }}</small>
          </div>
          <button class="reward-action" :class="{ claimed: reward.statusCode !== 1 }" type="button" :disabled="![0, 1].includes(reward.statusCode)" @click="handleReward(reward)">
            {{ actionText(reward) }}
          </button>
        </article>
      </template>
      <div class="info-card">
        <van-icon name="info-o" /><span>{{ coupons.availableCount }} coupon(s) available now. More special offers will be available in the future.</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.rewards-page {
  min-height: 100%;
  color: #071632;
  background:
    radial-gradient(circle at 78% 9%, rgba(255, 255, 255, 0.86), transparent 58px),
    linear-gradient(145deg, #fff0ee 0%, #fff8f1 48%, #eef6ff 100%);
}
.rewards-page :deep(.van-nav-bar) {
  background: transparent;
}
.rewards-page :deep(.van-nav-bar__title) {
  font-weight: 700;
}
.rewards-content {
  padding: 22px 14px 38px;
}
.rewards-hero {
  margin-bottom: 18px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rewards-hero h1 {
  margin: 0;
  color: #ff2d4f;
  font-size: 18px;
  line-height: 24px;
}
.rewards-hero p {
  margin: 2px 0 0;
  color: #ff2d4f;
  font-size: 14px;
  font-weight: 700;
}
.rewards-hero :deep(.van-icon) {
  color: #ff576f;
  font-size: 64px;
  transform: rotate(-12deg);
}
.reward-card {
  min-height: 122px;
  margin-bottom: 14px;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 10px 26px rgba(166, 75, 75, 0.08);
}
.reward-icon {
  width: 62px;
  height: 62px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  font-size: 31px;
}
.reward-icon.blue {
  color: #0860ff;
  background: #eaf3ff;
}
.reward-icon.purple {
  color: #8b3dff;
  background: #f0e6ff;
}
.reward-copy {
  min-width: 0;
  flex: 1;
}
.reward-copy strong {
  display: block;
  color: #ff2d4f;
  font-size: 22px;
  line-height: 25px;
}
.reward-copy span {
  display: block;
  color: #071632;
  font-size: 12px;
  font-weight: 700;
  line-height: 17px;
}
.reward-copy small {
  display: block;
  margin-top: 12px;
  color: #73819a;
  font-size: 11px;
  line-height: 17px;
}
.reward-action {
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  padding: 9px 13px;
  color: #fff;
  background: linear-gradient(135deg, #ff3856, #f51f44);
  font-size: 11px;
  font-weight: 700;
}
.reward-action.claimed {
  color: #16a34a;
  background: #d8f9e4;
}
.reward-action:disabled {
  opacity: 0.75;
}
.reward-state {
  padding: 30px 8px;
  color: #7b879f;
  text-align: center;
}
.reward-state button {
  border: 0;
  color: #ff2d4f;
  background: transparent;
  font-weight: 700;
}
.info-card {
  margin-top: 26px;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  gap: 11px;
  color: #5d6c86;
  background: #eef7ff;
  font-size: 12px;
  line-height: 17px;
}
.info-card :deep(.van-icon) {
  flex: 0 0 auto;
  color: #0860ff;
  font-size: 21px;
}
</style>

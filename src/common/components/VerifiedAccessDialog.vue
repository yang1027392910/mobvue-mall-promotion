<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { computed } from "vue"
import giftStripBanner from "@/assets/modal/banner.png"
import giftTopImage from "@/assets/modal/gift.png"

const props = defineProps<{
  show: boolean
  status?: number
  showWelcomeTitle?: boolean
}>()

const emit = defineEmits<{
  "update:show": [value: boolean]
  "confirm": []
}>()

const isReviewing = computed(() => props.status === 0)
const isRejected = computed(() => props.status === 2)
const primaryText = computed(() => {
  if (isReviewing.value) return "View Verification Status"
  if (isRejected.value) return "Re-submit & Get Gift"
  return "Verify Now & Get Gift"
})

const subtitle = computed(() => {
  if (isReviewing.value) return "Your verification is being reviewed. Once approved, supplier contacts and exclusive benefits will unlock automatically."
  if (isRejected.value) return "Update your real-name verification to unlock more supplier contacts and exclusive benefits."
  return "Complete real-name verification to unlock more supplier contacts & exclusive benefits!"
})

const benefits = [
  {
    icon: "solar:phone-bold-duotone",
    className: "phone",
    title: "View Supplier Contacts",
    description: "Get phone, WhatsApp & more"
  },
  {
    icon: "solar:box-bold-duotone",
    className: "products",
    title: "More Products & Suppliers",
    description: "Unlock more items and trusted suppliers"
  },
  {
    icon: "solar:gift-bold-duotone",
    className: "gift",
    title: "Welcome Gift Package",
    description: "Get a special gift after verification",
    badge: "FREE"
  }
]

function close() {
  emit("update:show", false)
}

function confirm() {
  emit("confirm")
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="verified-access">
      <div
        v-if="show"
        class="verified-access-overlay"
        role="dialog"
        aria-modal="true"
        @click.self="close"
      >
        <section class="verified-access-card">
          <div class="verified-gift-top" aria-hidden="true">
            <img :src="giftTopImage" alt="">
          </div>
          <div v-if="showWelcomeTitle" class="title">
            Welcome to YiwuHub!
          </div>
          <div class="benefit-panel">
            <article
              v-for="item in benefits"
              :key="item.title"
              class="benefit-row"
            >
              <span class="benefit-icon" :class="`is-${item.className}`">
                <Icon :icon="item.icon" />
              </span>
              <span class="benefit-copy">
                <strong>
                  {{ item.title }}
                  <em v-if="item.badge">{{ item.badge }}</em>
                </strong>
                <small>{{ item.description }}</small>
              </span>
              <Icon class="benefit-lock" icon="solar:lock-keyhole-bold" />
            </article>
          </div>

          <button class="verify-primary" type="button" @click="confirm">
            <Icon icon="solar:shield-check-bold" />
            {{ primaryText }}
          </button>
          <button class="verify-secondary" type="button" @click="close">
            Later
          </button>

          <div class="secure-note">
            <Icon icon="solar:lock-keyhole-bold" />
            Your information is secure and protected.
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.verified-access-enter-active,
.verified-access-leave-active {
  transition: opacity 0.2s ease;
}

.verified-access-enter-active .verified-access-card,
.verified-access-leave-active .verified-access-card {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.verified-access-enter-from,
.verified-access-leave-to {
  opacity: 0;
}

.verified-access-enter-from .verified-access-card,
.verified-access-leave-to .verified-access-card {
  opacity: 0;
  transform: translateY(18px) scale(0.97);
}

.verified-access-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(4, 8, 18, 0.76);
  backdrop-filter: blur(2px);
}

.verified-access-card {
  position: relative;
  width: min(100%, 335px);
  max-height: calc(100vh - 32px);
  overflow: visible;
  border-radius: 18px;
  padding: 126px 15px 18px;
  color: #0b1735;
  background:
    radial-gradient(circle at 22% 10%, rgba(115, 178, 255, 0.26), transparent 25%),
    radial-gradient(circle at 84% 12%, rgba(116, 204, 255, 0.2), transparent 25%),
    linear-gradient(180deg, #f4f9ff 0%, #ffffff 42%, #ffffff 100%);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.34);
}
.verified-access-card .title {
  font-size: 16px;
  line-height: 20px;
  text-align: center;
  margin: 10px 0;
  font-weight: 600;
}
.verified-close {
  position: absolute;
  top: 12px;
  right: 13px;
  z-index: 4;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #263348;
  background: rgba(226, 236, 249, 0.9);
  font-size: 27px;
}

.verified-gift-top {
  position: absolute;
  left: 0;
  right: 0;
  top: -62px;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
}

.verified-gift-top img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.gift-hero {
  position: relative;
  height: 139px;
  margin: 0 -10px;
}

.main-gift {
  position: absolute;
  left: 50%;
  top: 24px;
  width: 124px;
  height: 98px;
  transform: translateX(-50%);
  filter: drop-shadow(0 18px 22px rgba(24, 80, 190, 0.23));
}

.gift-box,
.gift-lid {
  position: absolute;
  left: 12px;
  right: 12px;
  border-radius: 16px;
  background: linear-gradient(145deg, #6a91ff 0%, #1f62e6 68%, #1546c6 100%);
}

.gift-box {
  bottom: 0;
  height: 70px;
}

.gift-lid {
  top: 20px;
  height: 25px;
  border-radius: 14px 14px 11px 11px;
}

.gift-ribbon {
  position: absolute;
  background: linear-gradient(180deg, #ffe49b 0%, #f7a92f 72%);
}

.gift-ribbon-v {
  left: 51px;
  top: 18px;
  width: 22px;
  height: 80px;
}

.gift-ribbon-h {
  left: 11px;
  top: 36px;
  width: 103px;
  height: 16px;
}

.gift-bow {
  position: absolute;
  top: 0;
  width: 52px;
  height: 35px;
  border: 9px solid #ffd66e;
  border-radius: 60% 60% 45% 45%;
}

.gift-bow-left {
  left: 13px;
  transform: rotate(26deg);
}

.gift-bow-right {
  right: 12px;
  transform: rotate(-26deg);
}

.mini-gift,
.lock-shield,
.confetti {
  position: absolute;
}

.mini-gift {
  left: 36px;
  bottom: 28px;
  width: 45px;
  height: 42px;
  border-radius: 10px;
  background:
    linear-gradient(90deg, transparent 42%, #ffffff 43% 56%, transparent 57%),
    linear-gradient(180deg, transparent 42%, #ffffff 43% 56%, transparent 57%),
    linear-gradient(145deg, #ff94ae, #f8527d);
  box-shadow: 0 12px 22px rgba(248, 82, 125, 0.23);
  transform: rotate(-12deg);
}

.lock-shield {
  right: 39px;
  bottom: 29px;
  width: 49px;
  height: 55px;
  border-radius: 16px 16px 22px 22px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(145deg, #8bc1ff, #2775ef);
  font-size: 27px;
  box-shadow:
    inset 0 0 0 4px rgba(255, 255, 255, 0.34),
    0 12px 24px rgba(39, 117, 239, 0.24);
}

.confetti {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.confetti-one {
  left: 64px;
  top: 34px;
  background: #2378ff;
  transform: rotate(22deg);
}

.confetti-two {
  right: 70px;
  top: 31px;
  background: #a255ff;
  transform: rotate(-22deg);
}

.confetti-three {
  right: 32px;
  top: 76px;
  background: #ff8f25;
  transform: rotate(28deg);
}

.verified-access-card h2 {
  margin: -2px 0 13px;
  color: #101e3f;
  font-size: 28px;
  font-weight: 900;
  line-height: 32px;
  text-align: center;
}

.verified-access-card h2 span {
  margin-left: 4px;
}

.verified-subtitle {
  margin: 0 auto 18px;
  color: #182746;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  text-align: center;
}

.verified-subtitle::first-line {
  color: #182746;
}

.benefit-panel {
  overflow: hidden;
  border-radius: 13px;
  padding: 3px 0;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 28px rgba(28, 61, 120, 0.08);
}

.benefit-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 24px;
  align-items: center;
  padding: 3px 0;
}

.benefit-row + .benefit-row {
  border-top: 1px solid #edf2f9;
}

.benefit-icon {
  width: 25px;
  height: 25px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.benefit-icon.is-phone {
  color: #1677ff;
  background: #eaf3ff;
}

.benefit-icon.is-price {
  color: #8e50ff;
  background: #f2eaff;
}

.benefit-icon.is-products {
  color: #ff8a1d;
  background: #fff1df;
}

.benefit-icon.is-gift {
  color: #ef4778;
  background: #ffe8f0;
}

.benefit-copy {
  min-width: 0;
}

.benefit-copy strong {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #111a36;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
}

.benefit-copy em {
  border-radius: 10px;
  padding: 1px 6px;
  color: #fff;
  background: #1ac453b6;
  font-size: 9px;
  line-height: 10px;
  font-style: normal;
  font-weight: 500;
}

.benefit-copy small {
  display: block;
  margin-top: 2px;
  color: #74819a;
  font-size: 10px;
  font-weight: 500;
  line-height: 15px;
}

.benefit-lock {
  width: 20px;
  height: 20px;
  color: #22c969;
}

.gift-strip {
  display: block;
  margin: 0 -20px 0;
  border: 0;
  border-radius: 0;
  overflow: hidden;
}

.strip-gift {
  width: 100%;
  margin: 0;
  border-radius: 0;
  overflow: hidden;
}

.gift-strip img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.gift-strip p {
  margin: 0;
  color: #1d2b49;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.gift-strip strong {
  display: block;
  color: #102044;
  font-size: 14px;
  font-weight: 900;
}

.gift-strip b {
  color: #ff4e43;
  font-size: 17px;
}

.verify-primary,
.verify-secondary {
  width: 100%;
  height: 35px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.verify-primary {
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #ffffff;
  background: linear-gradient(135deg, #0872ff, #005bea);
  box-shadow: 0 10px 22px rgba(0, 98, 238, 0.28);
}

.verify-primary svg {
  width: 25px;
  height: 25px;
}

.verify-secondary {
  margin-top: 8px;
  border: 1px solid #93c2ff;
  color: #0872ff;
  background: #ffffff;
}

.secure-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 15px;
  color: #98a1b4;
  font-size: 12px;
  font-weight: 700;
}

.secure-note svg {
  width: 16px;
  height: 16px;
}
</style>

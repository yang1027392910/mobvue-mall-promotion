<script setup lang="ts">
import { Icon } from "@iconify/vue"
import aboutTopImage from "@/assets/about/foor-01.png"
import aboutMiddleImage from "@/assets/about/foor-02.png"
import aboutBottomImage from "@/assets/about/foor-03.png"

interface FeatureItem {
  icon: string
  title: string
  text: string
}

interface StepItem {
  icon: string
  title: string
  text: string
}

const router = useRouter()
const route = useRoute()
const hashScrollDelays = [0, 120, 280]

const aboutFeatures: FeatureItem[] = [
  {
    icon: "solar:shield-check-bold",
    title: "Verified Suppliers",
    text: "Carefully selected and trustworthy"
  },
  {
    icon: "solar:tag-price-bold",
    title: "Transparent Prices",
    text: "Clear quotes with no hidden fees"
  },
  {
    icon: "solar:headphones-round-sound-bold",
    title: "Dedicated Support",
    text: "English & Filipino customer service"
  }
]

const policies = [
  {
    id: "privacy-policy",
    label: "Privacy Policy"
  },
  {
    id: "terms-of-service",
    label: "Terms of Service"
  },
  {
    id: "refund-return-policy",
    label: "Refund & Return Policy"
  },
  {
    id: "shipping-customs-policy",
    label: "Shipping & Customs Policy"
  }
]

const steps: StepItem[] = [
  {
    icon: "solar:magnifer-bold",
    title: "Find Products",
    text: "Browse & select what you need"
  },
  {
    icon: "solar:chat-round-dots-bold",
    title: "Request Quote",
    text: "Contact us for best price"
  },
  {
    icon: "solar:box-bold",
    title: "Place Order",
    text: "Confirm details & payment"
  },
  {
    icon: "solar:delivery-bold",
    title: "Receive Goods",
    text: "Fast shipping to your door"
  }
]

const serviceFeatures: FeatureItem[] = [
  {
    icon: "solar:headphones-round-sound-bold",
    title: "7x24 Hours Online",
    text: "Always here for you"
  },
  {
    icon: "solar:users-group-rounded-bold",
    title: "Bilingual Support",
    text: "English & Filipino"
  },
  {
    icon: "solar:heart-shine-bold",
    title: "Fast Response",
    text: "Quick and efficient service"
  }
]

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push("/")
}

function goHome() {
  router.push("/")
}

function goCategories() {
  router.push("/categories")
}

function goSupport() {
  router.push("/procurement-support")
}

function goProfile() {
  router.push("/profile")
}

function getScrollableParent(element: HTMLElement) {
  let parent = element.parentElement

  while (parent) {
    const style = window.getComputedStyle(parent)
    const canScroll = /(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight

    if (canScroll) return parent
    parent = parent.parentElement
  }

  return null
}

function scrollToHash(hash: string, behavior: ScrollBehavior = "smooth") {
  if (!hash) return

  const target = document.getElementById(hash.replace("#", ""))
  if (!target) return

  const scrollParent = getScrollableParent(target)

  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const nextTop = scrollParent.scrollTop + targetRect.top - parentRect.top - 12

    scrollParent.scrollTo({
      top: Math.max(nextTop, 0),
      behavior
    })
    return
  }

  target.scrollIntoView({
    block: "start",
    behavior
  })
}

function scheduleHashScroll(hash: string) {
  if (!hash) return

  nextTick(() => {
    hashScrollDelays.forEach((delay, index) => {
      window.setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToHash(hash, index === 0 ? "auto" : "smooth")
        })
      }, delay)
    })
  })
}

watch(
  () => route.hash,
  (hash) => {
    scheduleHashScroll(hash)
  }
)

onMounted(() => {
  scheduleHashScroll(route.hash)
})
</script>

<template>
  <div class="about-policy-page">
    <main class="content-stack">
      <article id="about-us" class="info-card info-card--about anchor-section">
        <div class="illustration illustration--global" aria-hidden="true">
          <img class="illustration-image" :src="aboutTopImage" alt="">
        </div>

        <div class="card-copy">
          <h2>About Us</h2>
          <p>
            China2PH is a professional sourcing platform connecting high-quality Chinese suppliers
            with buyers in the Philippines. We provide transparent pricing, reliable products and
            one-stop sourcing services to help your business grow.
          </p>
        </div>

        <div class="feature-row">
          <div v-for="item in aboutFeatures" :key="item.title" class="mini-feature">
            <span class="mini-feature__icon">
              <Icon :icon="item.icon" />
            </span>
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </div>
      </article>

      <article id="policies" class="info-card info-card--policies anchor-section">
        <div class="illustration illustration--policy" aria-hidden="true">
          <img class="illustration-image" :src="aboutMiddleImage" alt="">
        </div>
        <div class="card-copy">
          <h2>Policies</h2>
          <p>We are committed to protecting your privacy and ensuring a safe trading environment.</p>
          <ul class="policy-list">
            <li v-for="item in policies" :id="item.id" :key="item.id" class="anchor-section">
              <Icon icon="solar:check-circle-bold" />
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </div>
      </article>

      <article id="how-it-works" class="info-card info-card--steps anchor-section">
        <div class="steps-grid">
          <div v-for="(item, index) in steps" :key="item.title" class="step-item">
            <span class="step-icon">
              <Icon :icon="item.icon" />
            </span>
            <strong>{{ item.title }}</strong>
            <span>{{ item.text }}</span>
          </div>
        </div>
        <div class="card-copy steps-copy">
          <h2>How It Works</h2>
          <p>Simple steps to source products from China.</p>
        </div>
      </article>

      <article class="info-card info-card--team">
        <div class="illustration illustration--team" aria-hidden="true">
          <img class="illustration-image" :src="aboutBottomImage" alt="">
        </div>
        <div class="card-copy">
          <h2>Our Service Team</h2>
          <p>Our professional team is here to assist you 7x24 hours.</p>
          <div class="service-list">
            <div v-for="item in serviceFeatures" :key="item.title" class="service-item">
              <span>
                <Icon :icon="item.icon" />
              </span>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.text }}</small>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section class="help-panel">
        <Icon class="help-icon" icon="solar:headphones-round-sound-bold" />
        <div>
          <h2>Need Help?</h2>
          <p>Contact our team anytime.</p>
        </div>
        <button type="button" @click="goSupport">
          Contact Us
        </button>
      </section>
    </main>

    <nav class="mock-tabbar" aria-label="Primary navigation">
      <button type="button" @click="goHome">
        <Icon icon="mdi:home-outline" />
        <span>Home</span>
      </button>
      <button type="button" @click="goCategories">
        <Icon icon="mdi:apps" />
        <span>Categories</span>
      </button>
      <button type="button" @click="goSupport">
        <Icon icon="mdi:text-box-outline" />
        <span>RFQ</span>
      </button>
      <button type="button" @click="goProfile">
        <Icon icon="mdi:account-outline" />
        <span>My Account</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.about-policy-page {
  min-height: 100%;
  padding: 14px 12px 88px;
  overflow-x: hidden;
  color: #071540;
  background:
    radial-gradient(circle at 50% 0%, rgba(232, 241, 255, 0.82) 0, rgba(248, 251, 255, 0) 240px),
    linear-gradient(180deg, #fbfdff 0%, #f8fbff 42%, #ffffff 100%);
}

.phone-chrome {
  display: flex;
  height: 26px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  color: #030714;
}

.phone-time {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0;
}

.phone-indicators {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 22px;
}

.cellular-bars {
  display: inline-flex;
  height: 18px;
  align-items: flex-end;
  gap: 3px;
}

.cellular-bars i {
  display: block;
  width: 4px;
  border-radius: 3px;
  background: #050711;
}

.cellular-bars i:nth-child(1) {
  height: 7px;
}

.cellular-bars i:nth-child(2) {
  height: 10px;
}

.cellular-bars i:nth-child(3) {
  height: 14px;
}

.cellular-bars i:nth-child(4) {
  height: 17px;
}

.battery {
  position: relative;
  width: 29px;
  height: 15px;
  border: 1.8px solid #16181f;
  border-radius: 4px;
}

.battery::after {
  position: absolute;
  top: 4px;
  right: -4px;
  width: 2px;
  height: 6px;
  border-radius: 0 2px 2px 0;
  background: #16181f;
  content: "";
}

.battery span {
  display: block;
  width: 22px;
  height: 9px;
  margin: 1.2px;
  border-radius: 2px;
  background: #15171d;
}

.page-hero {
  position: relative;
  min-height: 82px;
  padding-top: 20px;
}

.back-button {
  position: absolute;
  top: 24px;
  left: -3px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #071540;
  border: 0;
  background: transparent;
  font-size: 34px;
  place-items: center;
}

.hero-copy {
  text-align: center;
}

.hero-copy h1 {
  margin: 0;
  color: #071540;
  font-size: 25px;
  font-weight: 800;
  line-height: 31px;
}

.hero-copy p {
  margin: 8px auto 0;
  max-width: 310px;
  color: #3e4f78;
  font-size: 14px;
  font-weight: 500;
  line-height: 19px;
}

.content-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.anchor-section {
  scroll-margin-top: 14px;
}

.info-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(130px, 42%) minmax(0, 1fr);
  gap: 13px;
  min-height: 0;
  padding: 16px 15px;
  overflow: hidden;
  border: 1px solid rgba(229, 237, 250, 0.92);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 7px 22px rgba(35, 83, 152, 0.08);
}

.info-card::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  pointer-events: none;
  content: "";
}

.card-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.card-copy h2 {
  margin: 0 0 8px;
  color: #071540;
  font-size: 16px;
  font-weight: 600;
}

.card-copy p {
  margin: 0;
  color: #182345;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
}

.illustration {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 132px;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.illustration--global {
  min-height: 154px;
}

.illustration-image {
  display: block;
  width: min(100%, 178px);
  height: auto;
  max-height: 160px;
  object-fit: contain;
}

.globe {
  position: absolute;
  top: 8px;
  left: 6px;
  width: 158px;
  height: 135px;
  border-radius: 50%;
  background:
    linear-gradient(130deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0) 48%),
    radial-gradient(circle at 64% 38%, rgba(149, 191, 255, 0.55) 0 10px, transparent 11px),
    radial-gradient(circle at 36% 54%, rgba(156, 197, 255, 0.55) 0 13px, transparent 14px), #dceaff;
  box-shadow: inset 0 0 0 13px rgba(242, 247, 255, 0.64);
}

.globe::before,
.globe::after {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(137, 178, 236, 0.32);
  content: "";
}

.globe::before {
  inset: 19px 45px;
}

.globe::after {
  inset: 35px 12px;
}

.continent {
  position: absolute;
  display: block;
  border-radius: 42% 58% 55% 45%;
  background: #b7cff5;
  opacity: 0.92;
}

.continent--one {
  top: 30px;
  left: 38px;
  width: 43px;
  height: 30px;
}

.continent--two {
  top: 62px;
  right: 38px;
  width: 37px;
  height: 48px;
}

.continent--three {
  top: 17px;
  right: 61px;
  width: 23px;
  height: 15px;
}

.map-pin {
  position: absolute;
  z-index: 3;
  display: grid;
  width: 37px;
  height: 50px;
  color: #ffffff;
  border-radius: 50% 50% 50% 0;
  font-size: 9px;
  font-weight: 900;
  transform: rotate(-45deg);
  place-items: center;
  box-shadow: 0 5px 10px rgba(29, 105, 222, 0.24);
}

.map-pin span {
  display: grid;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  transform: rotate(45deg);
  place-items: center;
}

.map-pin--china {
  top: 64px;
  left: 18px;
  background: #f13d25;
}

.map-pin--china span {
  background: #e92f22;
}

.map-pin--ph {
  top: 63px;
  right: 17px;
  background: #1166df;
}

.map-pin--ph span {
  background: #1b7cff;
}

.ship {
  position: absolute;
  z-index: 4;
  left: 9px;
  bottom: 11px;
  width: 113px;
  height: 56px;
}

.ship-cabin,
.ship-stack,
.ship-hull,
.container,
.truck span {
  position: absolute;
  display: block;
}

.ship-cabin {
  left: 16px;
  bottom: 21px;
  width: 43px;
  height: 35px;
  border-radius: 4px 4px 0 0;
  background: #b8d6ff;
  box-shadow: inset 0 -10px 0 #83addf;
}

.ship-cabin::before {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 5px;
  background: repeating-linear-gradient(90deg, #214d89 0 5px, transparent 5px 10px);
  content: "";
}

.ship-stack {
  left: 42px;
  bottom: 54px;
  width: 8px;
  height: 15px;
  background: #1c4b8b;
}

.ship-hull {
  bottom: 5px;
  left: 0;
  width: 99px;
  height: 24px;
  border-radius: 0 0 22px 28px;
  background: linear-gradient(180deg, #183d78, #0c2656);
  transform: skewX(-12deg);
}

.container {
  bottom: 31px;
  width: 31px;
  height: 18px;
}

.container--red {
  left: 62px;
  background: #f05b39;
}

.container--orange {
  left: 92px;
  background: #ff8b29;
}

.truck {
  position: absolute;
  right: 17px;
  bottom: 18px;
  width: 78px;
  height: 45px;
}

.truck-box {
  left: 0;
  bottom: 14px;
  width: 44px;
  height: 34px;
  border-radius: 5px 2px 2px 2px;
  background: #245eb1;
}

.truck-cab {
  right: 0;
  bottom: 14px;
  width: 35px;
  height: 29px;
  border-radius: 5px 9px 3px 2px;
  background: #2e8aff;
}

.truck-wheel {
  bottom: 7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #18345e;
}

.truck-wheel--one {
  left: 13px;
}

.truck-wheel--two {
  right: 9px;
}

.illustration--global::after {
  content: none;
}

.feature-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 2px;
}

.mini-feature {
  display: grid;
  grid-template-columns: 1fr;
  gap: 7px;
  min-width: 0;
  align-items: center;
  justify-items: center;
  padding: 10px 6px;
  border-radius: 10px;
  background: #f6f9ff;
  text-align: center;
}

.mini-feature__icon {
  display: grid;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: #287bff;
  background: #e8f2ff;
  font-size: 22px;
  place-items: center;
}

.mini-feature strong,
.service-item strong {
  display: block;
  color: #071540;
  font-size: 11px;
  font-weight: 800;
  line-height: 14px;
}

.mini-feature span:last-child,
.service-item small {
  display: block;
  margin-top: 3px;
  color: #46557a;
  font-size: 10px;
  font-weight: 500;
  line-height: 13px;
}

.illustration--policy {
  min-height: 152px;
}

.illustration--policy .illustration-image {
  width: min(100%, 168px);
  max-height: 150px;
}

.document {
  position: absolute;
  top: 24px;
  left: 54px;
  width: 83px;
  height: 116px;
  border: 5px solid #54d79a;
  border-radius: 11px 24px 6px 7px;
  background: #f7fffb;
  box-shadow: 0 9px 18px rgba(19, 164, 104, 0.22);
}

.document::before {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 31px;
  height: 31px;
  border: 5px solid #54d79a;
  border-top: 0;
  border-right: 0;
  border-radius: 0 20px 0 9px;
  background: #8bedbd;
  content: "";
}

.document span {
  position: absolute;
  left: 19px;
  height: 6px;
  border-radius: 9px;
  background: #c4e8df;
}

.document span:nth-child(1) {
  top: 32px;
  width: 41px;
}

.document span:nth-child(2) {
  top: 54px;
  width: 58px;
}

.document span:nth-child(3) {
  top: 75px;
  width: 43px;
}

.document span:nth-child(4) {
  top: 96px;
  width: 28px;
}

.lock {
  position: absolute;
  left: 21px;
  bottom: 24px;
  width: 45px;
  height: 42px;
  border-radius: 8px;
  background: linear-gradient(180deg, #66dea8, #24b871);
  box-shadow: 0 7px 12px rgba(28, 167, 101, 0.24);
}

.lock::before {
  position: absolute;
  top: -25px;
  left: 8px;
  width: 30px;
  height: 34px;
  border: 7px solid #3fc38b;
  border-bottom: 0;
  border-radius: 17px 17px 0 0;
  content: "";
}

.lock span {
  position: absolute;
  top: 16px;
  left: 20px;
  width: 7px;
  height: 17px;
  border-radius: 9px;
  background: #ffffff;
}

.shield {
  position: absolute;
  right: 39px;
  bottom: 22px;
  display: grid;
  width: 63px;
  height: 71px;
  color: #ffffff;
  background: linear-gradient(160deg, #74e6a0, #22b866);
  clip-path: polygon(50% 0, 94% 18%, 88% 73%, 50% 100%, 12% 73%, 6% 18%);
  font-size: 40px;
  place-items: center;
  filter: drop-shadow(0 10px 14px rgba(28, 162, 88, 0.24));
}

.policy-list {
  display: flex;
  margin: 14px 0 0;
  padding: 0;
  flex-direction: column;
  gap: 9px;
  list-style: none;
}

.policy-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #15213f;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.policy-list svg {
  flex: 0 0 auto;
  color: #50c57e;
  font-size: 18px;
}

.info-card--steps {
  grid-template-columns: 1fr;
  gap: 15px;
  align-items: start;
  padding-top: 18px;
  padding-bottom: 18px;
}

.steps-grid {
  order: 2;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.step-item {
  position: relative;
  min-width: 0;
  text-align: center;
}

.step-item:not(:last-child)::after {
  position: absolute;
  top: 31px;
  right: -10px;
  color: #ffb15f;
  font-size: 15px;
  font-weight: 900;
  content: "->";
}

.step-number {
  position: absolute;
  top: -13px;
  left: 50%;
  z-index: 2;
  display: grid;
  width: 15px;
  height: 15px;
  color: #ffffff;
  border-radius: 50%;
  background: #ff7416;
  font-size: 10px;
  font-weight: 600;
  transform: translateX(-50%);
  place-items: center;
}

.step-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin: 6px auto 9px;
  color: #f08a20;
  border-radius: 50%;
  background: #fff0df;
  font-size: 28px;
  place-items: center;
}

.step-item strong {
  display: block;
  color: #101a39;
  font-size: 10px;
  font-weight: 800;
  line-height: 12px;
}

.step-item > span:last-child {
  display: block;
  margin-top: 5px;
  color: #101a39;
  font-size: 8px;
  font-weight: 500;
  line-height: 11px;
}

.steps-copy {
  order: 1;
  padding-right: 28px;
}

.steps-copy h2 {
  margin-bottom: 6px;
}

.steps-copy p {
  font-size: 13px;
}

.illustration--team {
  min-height: 152px;
}

.illustration--team .illustration-image {
  width: min(100%, 182px);
  max-height: 150px;
}

.chat-bubble {
  position: absolute;
  top: 11px;
  left: 55px;
  display: flex;
  width: 55px;
  height: 39px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 22px;
  background: #a689f5;
}

.chat-bubble::after {
  position: absolute;
  bottom: -7px;
  left: 14px;
  border-top: 10px solid #a689f5;
  border-right: 7px solid transparent;
  content: "";
}

.chat-bubble span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
}

.agent {
  position: absolute;
  bottom: 22px;
  width: 68px;
  height: 108px;
}

.agent--left {
  left: 17px;
  transform: scale(0.94);
}

.agent--center {
  left: 74px;
  z-index: 2;
}

.agent--right {
  right: 14px;
  transform: scale(0.94);
}

.agent span {
  position: absolute;
  display: block;
}

.agent .face {
  top: 25px;
  left: 14px;
  width: 42px;
  height: 49px;
  border-radius: 45% 45% 48% 48%;
  background: #ffb28d;
  box-shadow: inset 0 -5px 0 rgba(242, 125, 99, 0.18);
}

.agent .face::before,
.agent .face::after {
  position: absolute;
  top: 21px;
  width: 4px;
  height: 7px;
  border-radius: 50%;
  background: #0d2a66;
  content: "";
}

.agent .face::before {
  left: 10px;
}

.agent .face::after {
  right: 10px;
}

.agent .body {
  bottom: 0;
  left: 2px;
  width: 64px;
  height: 55px;
  border-radius: 20px 20px 8px 8px;
  background: linear-gradient(180deg, #7d7bff, #5a5eea);
}

.agent--center .body {
  background: linear-gradient(180deg, #ffffff, #edf3ff);
}

.agent--right .body {
  background: linear-gradient(180deg, #426ff5, #3e56d8);
}

.headset {
  z-index: 3;
  top: 21px;
  left: 6px;
  width: 56px;
  height: 43px;
  border: 5px solid #3d33a5;
  border-bottom: 0;
  border-radius: 31px 31px 0 0;
}

.headset::before,
.headset::after {
  position: absolute;
  bottom: -8px;
  width: 9px;
  height: 22px;
  border-radius: 9px;
  background: #4a3dc6;
  content: "";
}

.headset::before {
  left: -7px;
}

.headset::after {
  right: -7px;
}

.illustration--team::after {
  content: none;
}

.service-list {
  display: flex;
  margin-top: 15px;
  flex-direction: column;
  gap: 11px;
}

.service-item {
  display: grid;
  grid-template-columns: 31px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
}

.service-item > span {
  display: grid;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  color: #856df0;
  background: #eeeaff;
  font-size: 20px;
  place-items: center;
}

.help-panel {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 112px;
  gap: 10px;
  align-items: center;
  min-height: 62px;
  padding: 11px 16px;
  border-radius: 12px;
  background: linear-gradient(90deg, #e8f2ff 0%, #eff6ff 48%, #e2eeff 100%);
}

.help-icon {
  color: #2d7bff;
  font-size: 36px;
}

.help-panel h2 {
  margin: 0;
  color: #071540;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
}

.help-panel p {
  margin: 3px 0 0;
  color: #314469;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
}

.help-panel button {
  width: 112px;
  height: 38px;
  color: #ffffff;
  border: 0;
  border-radius: 7px;
  background: linear-gradient(180deg, #3e8bff 0%, #2a74f0 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.26),
    0 6px 12px rgba(42, 116, 240, 0.22);
  font-size: 14px;
  font-weight: 800;
}

.mock-tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  height: 62px;
  max-width: 500px;
  margin: 0 auto;
  padding-top: 7px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -8px 22px rgba(22, 49, 97, 0.04);
}

.mock-tabbar button {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: 3px;
  padding: 0;
  color: #536487;
  border: 0;
  background: transparent;
  font: inherit;
}

.mock-tabbar svg {
  width: 24px;
  height: 24px;
}

.mock-tabbar span {
  font-size: 11px;
  font-weight: 500;
  line-height: 15px;
}

@media (min-width: 768px) {
  .mock-tabbar {
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (max-width: 390px) {
  .about-policy-page {
    padding: 12px 10px 86px;
  }

  .info-card {
    grid-template-columns: minmax(108px, 40%) minmax(0, 1fr);
    gap: 9px;
    padding: 13px 12px;
  }

  .info-card--steps {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .info-card--steps .steps-copy,
  .info-card--steps .steps-grid {
    grid-column: 1 / -1;
  }

  .steps-copy {
    padding-right: 0;
  }

  .card-copy {
    padding-right: 0;
  }

  .card-copy h2 {
    font-size: 16px;
    line-height: 20px;
  }

  .card-copy p {
    font-size: 11.5px;
    line-height: 16px;
  }

  .info-card--about .illustration,
  .info-card--policies .illustration,
  .info-card--team .illustration {
    justify-self: center;
    width: 100%;
    min-height: 118px;
  }

  .illustration-image {
    width: min(100%, 126px);
    max-height: 120px;
  }

  .illustration--policy .illustration-image {
    width: min(100%, 116px);
    max-height: 112px;
  }

  .illustration--team .illustration-image {
    width: min(100%, 128px);
    max-height: 112px;
  }

  .feature-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .mini-feature {
    padding: 8px 4px;
  }

  .mini-feature__icon {
    width: 28px;
    height: 28px;
    font-size: 18px;
  }

  .mini-feature strong,
  .service-item strong {
    font-size: 10px;
    line-height: 13px;
  }

  .mini-feature span:last-child,
  .service-item small {
    font-size: 9px;
    line-height: 12px;
  }

  .steps-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 18px;
  }

  .step-item:nth-child(2)::after {
    display: none;
  }

  .step-item:not(:last-child)::after {
    right: -8px;
  }

  .help-panel {
    grid-template-columns: 36px minmax(0, 1fr);
  }

  .help-panel button {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>

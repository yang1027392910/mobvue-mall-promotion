<script setup lang="ts">
import type { CurrentUserResponseData } from "@@/apis/users/type"
import { getCurrentUserApi } from "@@/apis/users"
import { isLoggedIn } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import { showFailToast, showSuccessToast } from "vant"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"

const router = useRouter()
const userStore = useUserStore()

type CurrentUser = CurrentUserResponseData["data"]

const inviteCode = ref("ABCD1234")
const invitedCount = ref(2)
const verifiedCount = ref(1)
const requiredCount = ref(3)
const showInviteCode = ref(false)
const inviteLink = computed(() => {
  const origin = window.location.origin || "https://china2ph.com"
  const publicPath = import.meta.env.VITE_PUBLIC_PATH || "/"
  const normalizedPublicPath = publicPath.endsWith("/") ? publicPath : `${publicPath}/`
  const inviteQuery = `invite=${encodeURIComponent(inviteCode.value)}`

  if (import.meta.env.VITE_ROUTER_HISTORY === "hash") {
    return `${origin}${normalizedPublicPath}#/login?${inviteQuery}`
  }

  return `${origin}${normalizedPublicPath}login?${inviteQuery}`
})
const remainingCount = computed(() => Math.max(requiredCount.value - invitedCount.value, 0))
const progressPercent = computed(() => {
  if (!requiredCount.value) return 0
  return Math.min((invitedCount.value / requiredCount.value) * 100, 100)
})

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function getInviteCode(user: CurrentUser) {
  const code = user.inviteCode ?? user.invite_code ?? user.referralCode ?? user.referral_code
  if (code) return String(code)

  const userId = user.id ?? user.userId ?? user.user_id ?? user.sub
  return userId ? `YH${userId}` : "ABCD1234"
}

async function loadInviteInfo() {
  if (!isLoggedIn()) return

  try {
    const { data } = await getCurrentUserApi()
    userStore.setUserInfo(data)
    inviteCode.value = getInviteCode(data)
    invitedCount.value = toNumber(data.invitedCount ?? data.invited_count ?? data.inviteCount ?? data.invite_count, invitedCount.value)
    verifiedCount.value = toNumber(
      data.verifiedInviteCount
      ?? data.verified_invite_count
      ?? data.inviteVerifiedCount
      ?? data.invite_verified_count,
      verifiedCount.value
    )
    requiredCount.value = toNumber(data.inviteRequiredCount ?? data.invite_required_count, requiredCount.value)
  } catch {
    showFailToast("Unable to load invite info.")
  }
}

const steps = [
  {
    title: "Share",
    description: "Share your link with friends",
    icon: "mdi:share-variant",
    color: "blue"
  },
  {
    title: "Register",
    description: "Your friend registers via your link",
    icon: "mdi:account-plus",
    color: "green"
  },
  {
    title: "Verify",
    description: "Your friend completes real-name verification",
    icon: "mdi:shield-check",
    color: "blue"
  },
  {
    title: "Get Rewards",
    description: "You get a chance to win exciting rewards",
    icon: "mdi:gift",
    color: "orange"
  }
]

const rewards = [
  {
    name: "iPhone 15 Pro",
    prize: "Grand Prize",
    type: "phone"
  },
  {
    name: "Apple Watch S9",
    prize: "2nd Prize",
    type: "watch"
  },
  {
    name: "AirPods Pro 2",
    prize: "3rd Prize",
    type: "pods"
  },
  {
    name: "Shipping Coupon",
    prize: "Participation Prize",
    type: "coupon"
  }
]

const shareChannels = [
  {
    name: "WhatsApp",
    icon: "mdi:whatsapp",
    className: "whatsapp"
  },
  {
    name: "Messenger",
    icon: "mdi:facebook-messenger",
    className: "messenger"
  },
  {
    name: "Message",
    icon: "mdi:message-text",
    className: "message"
  },
  {
    name: "Facebook",
    icon: "mdi:facebook",
    className: "facebook"
  },
  {
    name: "Telegram",
    icon: "mdi:telegram",
    className: "telegram"
  }
]

async function copyText(value: string) {
  try {
    await navigator.clipboard?.writeText(value)
    showSuccessToast("Copied")
  } catch {
    showSuccessToast("Copy manually")
  }
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function openAppLink(appUrl: string, fallbackUrl?: string) {
  if (!isMobileDevice()) {
    if (fallbackUrl) {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer")
      return
    }

    copyText(inviteLink.value)
    return
  }

  let openedAt = Date.now()
  const onVisibilityChange = () => {
    if (document.hidden) openedAt = 0
  }

  document.addEventListener("visibilitychange", onVisibilityChange, { once: true })
  window.location.href = appUrl

  if (fallbackUrl) {
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (openedAt && Date.now() - openedAt < 1800) {
        window.location.href = fallbackUrl
      }
    }, 1200)
  }
}

function handleShare(channel = "Messenger") {
  const text = `Join YiwuHub with my invite code ${inviteCode.value}: ${inviteLink.value}`
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(inviteLink.value)
  const messengerAppId = import.meta.env.VITE_FACEBOOK_APP_ID
  const messengerAppLink = `fb-messenger://share?link=${encodedUrl}${messengerAppId ? `&app_id=${encodeURIComponent(messengerAppId)}` : ""}`
  const smsLink = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? `sms:&body=${encodedText}`
    : `sms:?body=${encodedText}`

  const urlMap: Record<string, string> = {
    WhatsApp: `https://wa.me/?text=${encodedText}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    Telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
  }

  if (channel === "Messenger") {
    openAppLink(messengerAppLink, `https://m.me/?link=${encodedUrl}`)
    return
  }

  if (channel === "Message") {
    openAppLink(smsLink)
    return
  }

  if (channel === "More" && navigator.share) {
    navigator.share({
      title: "Invite Friends",
      text,
      url: inviteLink.value
    }).catch(() => copyText(inviteLink.value))
    return
  }

  const shareUrl = urlMap[channel]
  if (shareUrl) {
    window.open(shareUrl, "_blank", "noopener,noreferrer")
    return
  }

  copyText(inviteLink.value)
}

function handleBack() {
  router.back()
}

onMounted(() => {
  if (isLoggedIn()) {
    loadInviteInfo()
  }
})
</script>

<template>
  <div class="invite-page">
    <main class="invite-main">
      <section class="invite-hero">
        <div class="hero-copy">
          <h2>
            Invite Friends
            <span>Earn Free Gifts</span>
          </h2>
          <p>Invite 3 friends to complete real-name verification and get a chance to win exciting rewards!</p>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="plane">
            <Icon icon="mdi:airplane" />
          </div>
          <div class="ship">
            <Icon icon="mdi:ferry" />
          </div>
          <div class="container-box">
            <div class="container-lines" />
          </div>
          <div class="gift-box">
            <Icon icon="mdi:gift" />
          </div>
          <div class="carton carton-one" />
          <div class="carton carton-two" />
          <div class="carton carton-three" />
        </div>
      </section>

      <section class="referral-tip">
        <span class="referral-tip-icon">
          <Icon icon="mdi:shield-check" />
        </span>
        <p>Your friend must register through your link and complete real-name verification to count as a valid referral.</p>
      </section>

      <section class="invite-card invite-share-card">
        <div class="field-block link-field">
          <span class="field-label">My Invite Link</span>
          <div class="link-row">
            <span>{{ inviteLink }}</span>
            <button class="copy-button" type="button" @click="copyText(inviteLink)">
              <Icon icon="mdi:clipboard-outline" />
              Copy
            </button>
          </div>
        </div>

        <div class="share-divider">
          <span />
          <strong>Or share directly</strong>
          <span />
        </div>

        <div class="share-channel-list">
          <button
            v-for="channel in shareChannels"
            :key="channel.name"
            class="share-channel"
            :class="`is-${channel.className}`"
            type="button"
            @click="handleShare(channel.name)"
          >
            <span>
              <Icon :icon="channel.icon" />
            </span>
            {{ channel.name }}
          </button>
        </div>

        <div class="link-reason-card">
          <Icon icon="mdi:bullhorn-outline" />
          <div>
            <strong>Why share the link instead of the code?</strong>
            <p>When your friend opens your link, the system will automatically record your invitation, ensuring you get the credit.</p>
          </div>
        </div>
      </section>

      <section class="invite-card progress-card">
        <h2>My Invitation Progress</h2>
        <div class="progress-stats">
          <div class="stat-item">
            <Icon icon="mdi:account-group" />
            <strong>{{ invitedCount }}</strong>
            <span>Friends Invited</span>
          </div>
          <div class="stat-item">
            <Icon icon="mdi:gift" />
            <strong>{{ requiredCount }}</strong>
            <span>Required</span>
          </div>
        </div>
        <div class="progress-footer">
          <span>Invite {{ remainingCount }} more friend{{ remainingCount === 1 ? "" : "s" }} to get a chance!</span>
          <div class="progress-row">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
            </div>
            <strong>{{ invitedCount }} / {{ requiredCount }}</strong>
            <button type="button">
              View Rules
              <van-icon name="arrow" />
            </button>
          </div>
        </div>
      </section>

      <section class="invite-card steps-card">
        <h2>How It Works</h2>
        <div class="steps-list">
          <template v-for="(step, index) in steps" :key="step.title">
            <article class="step-item">
              <span class="step-icon" :class="`is-${step.color}`">
                <Icon :icon="step.icon" />
              </span>
              <strong>{{ index + 1 }}. {{ step.title }}</strong>
              <p>{{ step.description }}</p>
            </article>
            <Icon
              v-if="index < steps.length - 1"
              class="step-arrow"
              icon="mdi:arrow-right"
            />
          </template>
        </div>
      </section>

      <button class="share-button" type="button" @click="handleShare()">
        <Icon icon="mdi:share-variant" />
        Share Now
        <Icon class="whatsapp-icon" icon="mdi:facebook-messenger" />
      </button>
    </main>
  </div>
</template>

<style scoped>
.invite-page {
  width: 100%;
  max-width: 500px;
  min-height: 100vh;
  margin: 0 auto;
  padding-bottom: 50px;
  color: #10172a;
  background: linear-gradient(180deg, #f7fbff 0%, #eef5ff 42%, #f8fbff 100%);
}

.invite-page,
.invite-page * {
  box-sizing: border-box;
}

.invite-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 54px;
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(14px);
  box-shadow:
    0 1px 0 rgba(15, 23, 42, 0.08),
    0 8px 24px rgba(15, 23, 42, 0.04);
}

.nav-button,
.record-button,
.section-heading button,
.progress-row button,
.invite-tabbar button {
  border: 0;
  appearance: none;
  cursor: pointer;
  background: transparent;
}

.nav-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #07112f;
  font-size: 22px;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.nav-button:active {
  background: #eef4ff;
  transform: scale(0.96);
}

.invite-nav h1 {
  margin: 0;
  text-align: center;
  font-size: 17px;
  font-weight: 900;
  line-height: 24px;
}

.record-button {
  padding: 0;
  color: #0758ff;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.invite-main {
  padding: 0 12px 6px;
}

.invite-hero {
  position: relative;
  /* min-height: 220px; */
  margin: 0 -15px;
  overflow: hidden;
  padding: 24px 22px 60px;
  color: #ffffff;
  background:
    radial-gradient(circle at 78% 12%, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0) 30%),
    radial-gradient(circle at 40% 88%, rgba(81, 185, 255, 0.52), rgba(81, 185, 255, 0) 28%),
    linear-gradient(135deg, #064bc7 0%, #0b6df0 48%, #4aa4ff 100%);
  box-shadow: inset 0 -18px 30px rgba(0, 52, 142, 0.16);
}

.invite-hero::before {
  position: absolute;
  inset: 16px 0 auto;
  height: 156px;
  background-image:
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  background-size:
    34px 34px,
    7px 7px;
  content: "";
  opacity: 0.55;
}

.invite-hero::after {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 46px;
  background: linear-gradient(180deg, rgba(244, 248, 255, 0), #f7fbff 86%);
  content: "";
}

.hero-copy {
  position: relative;
  z-index: 2;
  width: 58%;
}

.hero-copy h2 {
  margin: 0;
  text-shadow: 0 6px 18px rgba(0, 36, 115, 0.22);
  font-size: 18px;
}

.hero-copy h2 span {
  display: block;
  color: #ffe45c;
  font-size: 17px;
}

.hero-copy p {
  margin: 12px 0 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  color: rgba(255, 255, 255, 0.92);
}

.hero-art {
  position: absolute;
  right: -8px;
  bottom: 62px;
  z-index: 1;
  width: 50%;
  height: 116px;
}

.plane,
.ship {
  position: absolute;
  color: rgba(255, 255, 255, 0.28);
}

.plane {
  top: -2px;
  right: 52px;
  font-size: 30px;
  transform: rotate(-8deg);
}

.ship {
  right: 0;
  bottom: 12px;
  font-size: 30px;
}

.container-box {
  position: absolute;
  right: 26px;
  bottom: 18px;
  width: 92px;
  height: 64px;
  border: 2px solid rgba(5, 45, 122, 0.28);
  border-radius: 5px;
  background: linear-gradient(90deg, #0646a9, #1778f5);
  box-shadow: 0 16px 34px rgba(1, 28, 88, 0.34);
}

.container-lines {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.16) 0 2px, transparent 2px 16px);
}

.gift-box {
  position: absolute;
  left: 15px;
  bottom: 0;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 32px;
  box-shadow: 0 12px 24px rgba(2, 36, 104, 0.24);
}

.carton {
  position: absolute;
  width: 30px;
  height: 26px;
  border: 1px solid rgba(119, 78, 30, 0.28);
  border-radius: 3px;
  background: linear-gradient(135deg, #d7a66b, #f0c98d);
  box-shadow:
    inset 0 8px rgba(255, 255, 255, 0.2),
    0 8px 16px rgba(55, 34, 12, 0.16);
}

.carton-one {
  right: 70px;
  bottom: 16px;
}

.carton-two {
  right: 38px;
  bottom: 14px;
  transform: scale(0.86);
}

.carton-three {
  right: 10px;
  bottom: 11px;
  transform: scale(0.72);
}

.invite-card {
  border: 1px solid rgba(220, 231, 248, 0.88);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
}

.referral-tip {
  position: relative;
  z-index: 3;
  margin-top: -50px;
  border: 1px solid rgba(221, 232, 250, 0.84);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 13px;
  color: #3d5278;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 28px rgba(20, 100, 244, 0.18);
  backdrop-filter: blur(12px);
}

.referral-tip-icon {
  width: 31px;
  height: 31px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #ffffff;
  font-size: 20px;
  background: linear-gradient(135deg, #0c5df2, #267fff);
  box-shadow: 0 8px 16px rgba(12, 93, 242, 0.22);
}

.referral-tip p {
  margin: 0;
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
}

.invite-share-card {
  margin-top: 10px;
  padding: 13px 11px 12px;
}

.field-block {
  min-width: 0;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
}

.link-row {
  display: flex;
  align-items: center;
}

.copy-button {
  height: 30px;
  min-width: 50px;
  border: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #ffffff;
  background: linear-gradient(135deg, #0d5ff2, #166ff7);
  font-size: 10px;
  font-weight: 500;
  box-shadow: 0 8px 18px rgba(13, 95, 242, 0.22);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  flex: 0 0 auto;
}

.copy-button svg {
  width: 15px;
  height: 15px;
}

.copy-button:active {
  transform: scale(0.96);
  box-shadow: 0 4px 10px rgba(13, 95, 242, 0.18);
}

.link-row {
  min-width: 0;
  height: 42px;
  border: 0;
  border: 1px solid #e8eef9;
  border-radius: 12px;
  padding: 0 5px 0 4px;
  background: linear-gradient(180deg, #f8fbff, #eef4fb);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.link-row span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #172033;
  font-size: 10.5px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-divider {
  margin: 14px 0 12px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  color: #53627c;
  font-size: 11.5px;
  font-weight: 800;
}

.share-divider span {
  height: 1px;
  background: #d5deef;
}

.share-channel-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.share-channel {
  min-width: 0;
  border: 0;
  display: grid;
  justify-items: center;
  gap: 5px;
  color: #34405a;
  cursor: pointer;
  background: transparent;
  font-size: 9.5px;
  font-weight: 800;
  transition: transform 0.2s ease;
}

.share-channel:active {
  transform: scale(0.96);
}

.share-channel span {
  width: 39px;
  height: 39px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 22px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.share-channel.is-whatsapp span {
  background: #22c55e;
}

.share-channel.is-messenger span {
  background: linear-gradient(135deg, #1b7cff, #2f63ff);
}

.share-channel.is-message span {
  background: linear-gradient(135deg, #20c665, #16a34a);
}

.share-channel.is-facebook span {
  background: #1877f2;
}

.share-channel.is-telegram span {
  background: #35a9e8;
}

.share-channel.is-more span {
  color: #7b8496;
  background: #eef1f6;
}

.link-reason-card {
  margin-top: 15px;
  border: 1px solid #ffd999;
  border-radius: 10px;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 8px;
  padding: 11px 12px;
  background: linear-gradient(135deg, #fffaf0, #ffffff);
}

.link-reason-card > svg {
  width: 20px;
  height: 20px;
  color: #ff9800;
}

.link-reason-card strong {
  display: block;
  color: #ff9300;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
}

.link-reason-card p {
  margin: 3px 0 0;
  color: #24314c;
  font-size: 10px;
  font-weight: 400;
  line-height: 15px;
}

.optional-code-card {
  margin-top: 10px;
  border: 1px dashed #b8c7e3;
  border-radius: 10px;
  display: grid;
  grid-template-columns: 26px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 10px 11px;
  background: #fbfdff;
}

.optional-code-card > svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.optional-code-card strong {
  display: block;
  color: #111827;
  font-size: 11.5px;
  font-weight: 900;
  line-height: 15px;
}

.optional-code-card p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
}

.optional-code-card button {
  border: 0;
  color: #0758ff;
  background: transparent;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.optional-code-value {
  display: inline-block;
  margin-top: 5px;
  border-radius: 7px;
  padding: 3px 7px;
  color: #0d5ff2;
  background: #eef5ff;
  font-size: 11.5px;
  font-weight: 900;
}

.progress-card,
.steps-card,
.rewards-card {
  margin-top: 10px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(245, 250, 255, 0.95), rgba(255, 255, 255, 0.98));
}

.progress-card {
  position: relative;
  overflow: hidden;
}

/* .progress-card::before {
  position: absolute;
  top: -42px;
  right: -36px;
  width: 118px;
  height: 118px;
  border-radius: 50%;
  background: rgba(22, 119, 255, 0.06);
  content: "";
} */

.progress-card h2,
.steps-card h2,
.section-heading h2 {
  margin: 0;
  color: #111827;
  font-size: 13.5px;
  font-weight: 800;
  line-height: 18px;
}

.progress-stats {
  position: relative;
  margin-top: 10px;
  border: 1px solid #edf2fa;
  border-radius: 13px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  background: #ffffff;
  box-shadow: inset 0 -1px 0 rgba(15, 23, 42, 0.03);
}

.stat-item {
  min-width: 0;
  padding: 11px 3px 10px;
  display: grid;
  grid-template-columns: auto auto;
  justify-content: center;
  align-items: center;
  column-gap: 6px;
  row-gap: 3px;
}

.stat-item + .stat-item {
  border-left: 1px solid #e2e8f0;
}

.stat-item svg {
  width: 21px;
  height: 21px;
  filter: drop-shadow(0 6px 10px rgba(15, 23, 42, 0.08));
}

.stat-item:nth-child(1) svg {
  color: #2b6df6;
}

.stat-item:nth-child(2) svg {
  color: #18b96f;
}

.stat-item:nth-child(3) svg {
  color: #ff970f;
}

.stat-item strong {
  font-size: 21px;
  font-weight: 900;
  line-height: 24px;
}

.stat-item span {
  grid-column: 1 / -1;
  color: #4b5870;
  font-size: 10.5px;
  font-weight: 600;
  text-align: center;
}

.progress-footer {
  margin-top: 8px;
  border-top: 1px solid #e9eef7;
  padding-top: 9px;
}

.progress-footer > span {
  color: #243149;
  font-size: 10.8px;
  font-weight: 600;
}

.progress-row {
  margin-top: 7px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
}

.progress-track {
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
  background: #e8eef9;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #1464f4, #38a0ff);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3) inset;
}

.progress-row strong {
  color: #111827;
  font-size: 11.5px;
}

.progress-row button,
.section-heading button {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #0758ff;
  font-size: 10.8px;
  font-weight: 700;
  white-space: nowrap;
}

.steps-list {
  margin-top: 9px;
  border: 1px solid #edf2fa;
  border-radius: 11px;
  display: grid;
  grid-template-columns: 1fr 14px 1fr 14px 1fr 14px 1fr;
  align-items: start;
  padding: 11px 7px;
  background: #ffffff;
  scroll-snap-type: x proximity;
}

.step-item {
  min-width: 0;
  text-align: center;
  scroll-snap-align: start;
}

.step-icon {
  width: 38px;
  height: 38px;
  margin: 0 auto 7px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 20px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.1);
}

.step-icon.is-blue {
  background: linear-gradient(135deg, #125dec, #287cff);
}

.step-icon.is-green {
  background: linear-gradient(135deg, #13b971, #26d489);
}

.step-icon.is-orange {
  background: linear-gradient(135deg, #f79713, #ffb02e);
}

.step-item strong {
  display: block;
  color: #111827;
  font-size: 9.8px;
  font-weight: 900;
  line-height: 13px;
}

.step-item p {
  margin: 4px 0 0;
  color: #42506a;
  font-size: 9.5px;
  font-weight: 600;
  line-height: 13px;
}

.step-arrow {
  width: 14px;
  height: 14px;
  margin-top: 13px;
  color: #c8d3e5;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.rewards-grid {
  margin-top: 9px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
  scroll-snap-type: x proximity;
}

.reward-item {
  min-width: 0;
  border: 1px solid #e7edf8;
  border-radius: 11px;
  padding: 8px 5px 8px;
  text-align: center;
  background: linear-gradient(180deg, #ffffff, #f9fbff);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  scroll-snap-align: start;
}

.reward-visual {
  height: 48px;
  display: grid;
  place-items: center;
  font-size: 34px;
}

.reward-visual.is-phone,
.reward-visual.is-watch {
  color: #202938;
}

.reward-visual.is-pods {
  color: #c7d0dd;
}

.reward-visual.is-coupon {
  margin: 5px auto 7px;
  width: 56px;
  height: 36px;
  border-radius: 8px;
  color: #ffffff;
  background:
    radial-gradient(circle at left center, #ffffff 0 5px, transparent 6px),
    radial-gradient(circle at right center, #ffffff 0 5px, transparent 6px), linear-gradient(135deg, #1768f4, #2b87ff);
  font-size: 20px;
  box-shadow: 0 8px 16px rgba(23, 104, 244, 0.22);
}

.reward-item > strong {
  display: block;
  overflow: hidden;
  color: #111827;
  font-size: 9.8px;
  font-weight: 800;
  line-height: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reward-item > span {
  display: inline-block;
  max-width: 100%;
  margin-top: 5px;
  border-radius: 6px;
  padding: 2px 6px;
  overflow: hidden;
  color: #ffffff;
  background: #1464f4;
  font-size: 9px;
  font-weight: 700;
  line-height: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-button {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 24;
  width: calc(100% - 28px);
  max-width: 347px;
  height: 38px;
  margin-top: 0;
  border: 0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #ffffff;
  background: linear-gradient(135deg, #1264f4, #0b5be5);
  box-shadow: 0 14px 28px rgba(18, 100, 244, 0.28);
  font-size: 14px;
  font-weight: 500;
  transform: translateX(-50%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.share-button:active {
  transform: translateX(-50%) scale(0.985);
  box-shadow: 0 9px 18px rgba(18, 100, 244, 0.22);
}

.share-button svg {
  width: 21px;
  height: 21px;
}

.share-button .whatsapp-icon {
  border-radius: 50%;
  background: linear-gradient(135deg, #1b7cff, #2f63ff);
}

.invite-tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 20;
  width: 100%;
  max-width: 500px;
  height: 64px;
  transform: translateX(-50%);
  border-top: 1px solid #e5ebf5;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -10px 24px rgba(15, 23, 42, 0.05);
}

.invite-tabbar button {
  min-width: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
  -webkit-tap-highlight-color: transparent;
}

.invite-tabbar svg {
  width: 20px;
  height: 20px;
}

.invite-tabbar .active {
  color: #0758ff;
}

@media (max-width: 390px) {
  .hero-copy {
    width: 58%;
  }

  .hero-copy h2 {
    font-size: 25px;
    line-height: 28px;
  }

  .hero-copy p {
    margin-top: 10px;
    font-size: 11px;
    line-height: 16px;
  }

  .hero-art {
    right: -8px;
    width: 50%;
    transform: none;
    transform-origin: right bottom;
  }

  .invite-share-card {
    padding: 13px 11px;
  }

  .share-channel span {
    width: 39px;
    height: 39px;
    font-size: 22px;
  }

  .steps-list {
    grid-template-columns: repeat(4, minmax(82px, 1fr));
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .steps-list::-webkit-scrollbar {
    display: none;
  }

  .step-arrow {
    display: none;
  }

  .rewards-grid {
    grid-template-columns: repeat(4, minmax(82px, 1fr));
    overflow-x: auto;
    scrollbar-width: none;
  }

  .rewards-grid::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 360px) {
  .hero-copy {
    width: 62%;
  }

  .hero-copy h2 {
    font-size: 23px;
    line-height: 27px;
  }

  .hero-copy p {
    font-size: 10.5px;
    line-height: 15px;
  }

  .link-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .copy-button {
    min-width: 82px;
    padding: 0 10px;
  }

  .share-channel-list {
    gap: 5px;
  }

  .share-channel {
    font-size: 10px;
  }

  .share-channel span {
    width: 36px;
    height: 36px;
    font-size: 21px;
  }

  .optional-code-card {
    grid-template-columns: 28px 1fr;
  }

  .optional-code-card button {
    grid-column: 2;
    justify-self: start;
  }

  .share-button {
    bottom: 70px;
    height: 48px;
    font-size: 14px;
  }
}
</style>

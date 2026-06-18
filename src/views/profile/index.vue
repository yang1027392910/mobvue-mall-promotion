<script setup lang="ts">
import { isLoggedIn } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"

interface QuickEntry {
  title: string
  description: string
  icon: string
  color: string
  path?: string
}

interface MenuItem {
  title: string
  description: string
  icon: string
  path?: string
}

const quickEntries: QuickEntry[] = [
  {
    title: "Hot Products",
    description: "Find trending products",
    icon: "fire-o",
    color: "quick-blue",
    path: "/"
  },
  {
    title: "Supplier",
    description: "Verified suppliers from China",
    icon: "friends-o",
    color: "quick-purple",
    path: "/logistics-suppliers"
  },
  {
    title: "Profit Calculator",
    description: "Estimate product profit",
    icon: "solar:calculator-bold",
    color: "quick-cyan",
    path: "/calculator?mode=weight&from=profile"
  }
  // {
  //   title: "My Inquiries",
  //   description: "Track supplier replies",
  //   icon: "chat-o",
  //   color: "quick-green"
  // }
]

const menuItems: MenuItem[] = [
  {
    title: "My Favorites",
    description: "View and manage your saved products",
    icon: "star-o",
    path: "/favorites"
  },
  {
    title: "Help Center",
    description: "FAQs and platform guides",
    icon: "question-o",
    path: "/procurement-support"
  },
  {
    title: "logistics Support",
    description: "We're here to help you",
    icon: "service-o",
    path: "/logistics-suppliers"
  }
]

const router = useRouter()
const userStore = useUserStore()
const loggedIn = computed(() => isLoggedIn())
const userEmail = computed(() => userStore.email || (userStore.username.includes("@") ? userStore.username : ""))
const displayEmail = computed(() => maskEmail(userEmail.value))
const avatarInitial = computed(() => getEmailInitial(userEmail.value))

function maskEmail(email: string) {
  const [prefix, domain] = email.split("@")
  if (!prefix || !domain) return "yiwu***@hub.com"

  const visiblePrefix = prefix.length < 6 ? prefix.slice(0, 2) : prefix.slice(0, 6)
  return `${visiblePrefix}***@${domain}`
}

function getEmailInitial(email: string) {
  return (email.trim().charAt(0) || "Y").toUpperCase()
}

function handleLogin() {
  router.push("/login")
}

function handleLogout() {
  userStore.resetToken()
  router.replace("/login")
}

function handleNavigate(path?: string) {
  if (path) router.push(path)
}
</script>

<template>
  <div class="profile-page">
    <div v-if="!loggedIn" class="profile-guest">
      <van-icon class="profile-guest-icon" name="user-o" />
      <div class="profile-guest-title">
        Login to unlock this feature
      </div>
      <van-button class="profile-guest-button" type="primary" round @click="handleLogin">
        Login
      </van-button>
    </div>

    <template v-else>
      <header class="profile-header">
        <!-- <div class="header-toolbar">
          <div />
          <div class="settings-button" role="button" tabindex="0" aria-label="Settings">
            <van-icon name="setting-o" />
          </div>
        </div> -->

        <div class="header-profile">
          <div class="avatar">
            {{ avatarInitial }}
          </div>
          <div class="header-copy">
            <h1>Hello! 👋</h1>
            <p>{{ displayEmail }}</p>
            <span>Find products from China easily and confidently.</span>
          </div>
        </div>
      </header>

      <main class="profile-container profile-content">
        <section class="quick-card">
          <div
            v-for="item in quickEntries"
            :key="item.title"
            class="quick-item"
            role="button"
            tabindex="0"
            @click="handleNavigate(item.path)"
          >
            <span class="quick-icon" :class="item.color">
              <Icon v-if="item.path?.startsWith('/calculator')" :icon="item.icon" />
              <van-icon v-else :name="item.icon" />
            </span>
            <strong>{{ item.title }}</strong>
          </div>
        </section>

        <section class="menu-card">
          <div
            v-for="item in menuItems"
            :key="item.title"
            class="menu-item"
            role="button"
            tabindex="0"
            @click="handleNavigate(item.path)"
          >
            <span class="menu-icon">
              <van-icon :name="item.icon" />
            </span>
            <span class="menu-copy">
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <van-icon class="menu-arrow" name="arrow" />
          </div>
        </section>

        <div class="logout-card" role="button" tabindex="0" @click="handleLogout">
          <Icon class="logout-icon" icon="hugeicons:logout-03" />
          <span>Log Out</span>
        </div>
      </main>
    </template>
  </div>
</template>

<style scoped>
.profile-page {
  width: 100%;
  max-width: 375px;
  min-height: 100%;
  margin: 0 auto;
  padding-bottom: 96px;
  color: #111827;
  background: linear-gradient(180deg, #f6f9ff 0%, #f8fafc 100%);
}

.profile-guest {
  min-height: calc(100vh - 90px);
  padding: 32px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
}

.profile-guest-icon {
  width: 60px;
  height: 60px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  color: #1677ff;
  font-size: 32px;
  line-height: 1;
  background: #eef6ff;
}

.profile-guest-title {
  color: #111827;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.profile-guest-button {
  min-width: 120px;
  height: 42px;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.profile-header {
  position: relative;
  height: 210px;
  padding: 28px 20px;
  overflow: hidden;
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #7c3aed 100%);
  box-shadow: 0 16px 32px rgba(37, 99, 255, 0.22);
}

.profile-header::before {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 42%),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.07) 0 1px, transparent 1px 28px),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 34px);
  content: "";
  opacity: 0.45;
}

.profile-header::after {
  position: absolute;
  right: -42px;
  bottom: 18px;
  width: 180px;
  height: 76px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  content: "";
  opacity: 0.42;
  transform: rotate(-14deg);
}

.header-toolbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  appearance: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 21px;
  line-height: 1;
  background: rgba(255, 255, 255, 0.16);
  -webkit-tap-highlight-color: transparent;
}

.header-profile {
  margin-top: 15px;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 64px;
  height: 64px;
  border: 3px solid rgba(255, 255, 255, 0.52);
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #1677ff;
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
}

.header-copy {
  min-width: 0;
}

.header-copy h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 26px;
}

.header-copy p {
  margin: 5px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 600;
  line-height: 17px;
}

.header-copy span {
  display: block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  line-height: 17px;
}

.profile-container,
.profile-content {
  position: relative;
  z-index: 2;
}

.quick-card {
  margin: -48px 10px 10px;
  padding: 18px 5px;
  border-radius: 22px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.quick-item {
  position: relative;
  min-width: 0;
  /* min-height: 104px; */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
}

.quick-item + .quick-item::before {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 0;
  width: 1px;
  background: #eef2f7;
  content: "";
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 22px;
  line-height: 1;
}

.quick-blue {
  background: linear-gradient(135deg, #36a3ff, #1677ff);
}

.quick-purple {
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
}

.quick-cyan {
  background: linear-gradient(135deg, #22d3ee, #0ea5e9);
}

.quick-green {
  background: linear-gradient(135deg, #5eead4, #14b8a6);
}

.quick-item strong {
  width: 100%;
  color: #2a3a5b;
  font-size: 11px;
  font-weight: 600;
  line-height: 15px;
  margin-top: 5px;
  overflow: hidden;
  /* text-overflow: ellipsis; */
  white-space: nowrap;
}

.quick-item small {
  color: #64748b;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
}

.menu-card {
  margin: 0 12px;
  padding: 8px 0;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.menu-item {
  width: 100%;
  /* height: 60px; */
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.menu-item + .menu-item {
  border-top: 1px solid #eef2f7;
}

.menu-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #1677ff;
  font-size: 18px;
  line-height: 1;
  background: #eef6ff;
}

.menu-copy {
  min-width: 0;
  flex: 1;
}

.menu-copy strong {
  display: block;
  color: #111827;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
}

.menu-copy small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
}

.menu-arrow {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 18px;
  line-height: 1;
}

.logout-card {
  height: 50px;
  margin: 14px 12px 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #ff5a5f;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.logout-card:hover,
.logout-card:active {
  background: #fff5f6;
  transform: scale(0.98);
}

.logout-icon {
  width: 20px;
  height: 20px;
  color: #ff5a5f;
  /* font-size: 24px; */
  line-height: 1;
}
</style>

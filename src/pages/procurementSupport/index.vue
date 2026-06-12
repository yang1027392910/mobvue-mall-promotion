<script setup lang="ts">
import type { RawBannerItem } from "@@/apis/banner/type"
import type { RawProcurementContactItem } from "@@/apis/procurementContact/type"
import { getBannerListApi } from "@@/apis/banner"
import { getProcurementContactListApi } from "@@/apis/procurementContact"
import { Icon } from "@iconify/vue"
import { showSuccessToast } from "vant"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"

interface ContactMethod {
  platform: string
  contact: string
  description: string
  color: string
  bg: string
  icon: string
  fallbackIcon: string
  recommended: boolean
}

const router = useRouter()
const bannerLoaded = ref(true)
const bannerPath = "/uploads/banner/procurement_support_banner_1602x700.png"
const apiBannerImage = ref("")
const contactLoading = ref(false)
const contactErrorText = ref("")

const bannerImage = computed(() => {
  if (apiBannerImage.value) return apiBannerImage.value

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  if (!imageBaseUrl) return bannerPath

  return `${imageBaseUrl.replace(/\/$/, "")}/${bannerPath.replace(/^\//, "")}`
})

const defaultContactMethods: ContactMethod[] = [
  {
    platform: "Messenger",
    contact: "m.me/YiwuHub",
    description: "Most popular messaging app in the Philippines",
    color: "#0B6BFF",
    bg: "#F2F7FF",
    icon: "logos:messenger",
    fallbackIcon: "mdi:message",
    recommended: true
  },
  {
    platform: "WhatsApp",
    contact: "+63 912 345 6789",
    description: "International support · Fast response",
    color: "#18C46C",
    bg: "#F1FFF7",
    icon: "logos:whatsapp-icon",
    fallbackIcon: "ic:baseline-whatsapp",
    recommended: false
  },
  {
    platform: "Telegram",
    contact: "@YiwuHubSupport",
    description: "Fast quotations · 24/7 online",
    color: "#20A8E8",
    bg: "#F2FAFF",
    icon: "logos:telegram",
    fallbackIcon: "ic:baseline-telegram",
    recommended: false
  }
]

const contactMethods = ref<ContactMethod[]>(defaultContactMethods)

function handleBack() {
  router.back()
}

function getProcurementContactDataList(data: RawProcurementContactItem[] | {
  list?: RawProcurementContactItem[]
}) {
  if (Array.isArray(data)) return data
  return Array.isArray(data.list) ? data.list : []
}

function getContactTheme(contactType?: string) {
  const type = (contactType || "").trim().toLowerCase()

  const themes = {
    messenger: {
      platform: "Messenger",
      color: "#0B6BFF",
      bg: "#F2F7FF",
      icon: "logos:messenger",
      fallbackIcon: "mdi:message"
    },

    whatsapp: {
      platform: "WhatsApp",
      color: "#18C46C",
      bg: "#F1FFF7",
      icon: "logos:whatsapp-icon",
      fallbackIcon: "ic:baseline-whatsapp"
    },

    telegram: {
      platform: "Telegram",
      color: "#20A8E8",
      bg: "#F2FAFF",
      icon: "logos:telegram",
      fallbackIcon: "ic:baseline-telegram"
    },

    email: {
      platform: "Email",
      color: "#7C5CFF",
      bg: "#F6F2FF",
      icon: "material-icon-theme:email",
      fallbackIcon: "mdi:email"
    },

    phone: {
      platform: "Phone",
      color: "#FF8A00",
      bg: "#FFF7ED",
      icon: "mdi:phone-outline",
      fallbackIcon: "mdi:phone"
    }
  } as const

  return themes[type as keyof typeof themes] || themes.messenger
}

function normalizeContact(item: RawProcurementContactItem): ContactMethod {
  const theme = getContactTheme(item.contactType)

  return {
    ...theme,
    contact: item.contactValue,
    description: item.description,
    recommended: item.sort === 1
  }
}

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function getBannerDataList(data: RawBannerItem[] | {
  data?: RawBannerItem[]
  list?: RawBannerItem[]
  records?: RawBannerItem[]
  rows?: RawBannerItem[]
  items?: RawBannerItem[]
}) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.list)) return data.list
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.rows)) return data.rows
  return Array.isArray(data.items) ? data.items : []
}

function getBannerImage(item: RawBannerItem) {
  return getAssetUrl(String(item.image ?? item.imageUrl ?? item.bannerUrl ?? item.picUrl ?? item.cover ?? item.url ?? ""))
}

async function getCustomerBanner() {
  try {
    const { data } = await getBannerListApi({
      scene: "customer"
    })
    const banner = getBannerDataList(data)
      .filter(item => !item.scene || item.scene === "customer")
      .filter(item => item.status === undefined || Number(item.status) === 1)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
      .map(getBannerImage)
      .find(Boolean)

    if (banner) {
      bannerLoaded.value = true
      apiBannerImage.value = banner
    }
  } catch {
    apiBannerImage.value = ""
  }
}

async function getProcurementContacts() {
  contactLoading.value = true
  contactErrorText.value = ""

  try {
    const { data } = await getProcurementContactListApi({
      page: 1,
      pageSize: 10
    })
    const contacts = getProcurementContactDataList(data)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
      .map(normalizeContact)
      .filter(item => item.contact)

    if (contacts.length) {
      contactMethods.value = contacts
    }
  } catch (error) {
    contactErrorText.value = error instanceof Error ? error.message : "Failed to load contacts"
    contactMethods.value = defaultContactMethods
  } finally {
    contactLoading.value = false
  }
}

async function copyContact(contact: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(contact)
  } else {
    const textArea = document.createElement("textarea")
    textArea.value = contact
    textArea.style.position = "fixed"
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
  }

  showSuccessToast("Copied successfully")
}

onMounted(() => {
  getCustomerBanner()
  getProcurementContacts()
})
</script>

<template>
  <div class="support-page">
    <van-nav-bar
      class="support-nav"
      title="Procurement Support"
      left-arrow
      fixed
      placeholder
      @click-left="handleBack"
    />

    <main class="support-content">
      <section class="support-banner">
        <img
          v-if="bannerLoaded"
          class="support-banner__image"
          :src="bannerImage"
          alt="Procurement Support"
          @error="bannerLoaded = false"
        >
      </section>
      <van-loading
        v-if="contactLoading"
        class="contact-loading"
        color="#0b6bff"
      />

      <van-empty
        v-else-if="contactErrorText && contactMethods.length === 0"
        image="error"
        :description="contactErrorText"
      >
        <van-button
          size="small"
          type="primary"
          color="#0b6bff"
          @click="getProcurementContacts"
        >
          Retry
        </van-button>
      </van-empty>

      <section v-else class="contact-list">
        <article
          v-for="item in contactMethods"
          :key="item.platform"
          class="contact-card"
        >
          <div
            class="platform-icon"
            :style="{ background: item.bg }"
          >
            <Icon class="platform-icon__main" :icon="item.icon || item.fallbackIcon" :color="item.color" />
          </div>

          <div class="contact-info">
            <!-- <div class="platform-row">
              <h2>{{ item.platform }}</h2>
            </div> -->
            <div class="contact-value" :style="{ color: item.color }">
              {{ item.contact }}
            </div>
            <p>{{ item.description }}</p>
          </div>

          <button
            class="copy-button"
            type="button"
            :style="{
              color: item.color,
              background: item.bg,
              borderColor: `${item.color}4D`,
            }"
            @click="copyContact(item.contact)"
          >
            <Icon icon="solar:copy-linear" />
            <span>Copy</span>
          </button>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.support-page {
  min-height: 100vh;
  max-width: 375px;
  margin: 0 auto;
  padding-bottom: 28px;
  background: #f6f8fc;
  color: #071b3a;
}

.support-nav {
  --van-nav-bar-height: 56px;
  --van-nav-bar-background: #ffffff;
  --van-nav-bar-title-text-color: #071b3a;
  --van-nav-bar-title-font-size: 18px;
  --van-nav-bar-icon-color: #071b3a;
  --van-nav-bar-arrow-size: 21px;
  box-shadow: 0 1px 8px rgba(7, 27, 58, 0.06);
}

.support-nav :deep(.van-nav-bar__title) {
  font-weight: 700;
}

.support-content {
  padding-top: 5px;
}

.support-banner {
  width: calc(100% - 30px);
  height: 164px;
  margin: 0 15px;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(135deg, #f4f9ff 0%, #eaf3ff 100%);
  box-shadow: 0 8px 24px rgba(15, 80, 180, 0.1);
}

.support-banner__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 10px 5px;
}

.contact-heading__icon {
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #0b6bff;
  font-size: 20px;
  background: #eaf3ff;
}

.contact-heading h1 {
  margin: 0;
  color: #071b3a;
  font-size: 12px;
  font-weight: 500;
  line-height: 10px;
}

.contact-list {
  margin-top: 15px;
  display: grid;
  gap: 14px;
  padding: 0 15px;
}

.contact-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.contact-card {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border: 1px solid rgba(11, 107, 255, 0.08);
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(20, 40, 80, 0.08);
}

.platform-icon {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.platform-icon__main {
  width: 32px;
  height: 32px;
}

.contact-info {
  min-width: 0;
  flex: 1;
}

.platform-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.platform-row h2 {
  margin: 0;
  min-width: 0;
  color: #071b3a;
  font-size: 14px;
  font-weight: 600;
  /* line-height: 25px; */
}

.recommended-tag {
  flex-shrink: 0;
  max-width: 88px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #0b6bff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  background: #edf5ff;
}

.contact-value {
  font-size: 14px;
  font-weight: 600;
  line-height: 23px;
  overflow-wrap: anywhere;
}

.contact-info p {
  margin: 3px 0 0;
  color: #7a8699;
  font-size: 11px;
  line-height: 18px;
}

.copy-button {
  flex: 0 0 76px;
  width: 76px;
  height: 40px;
  border: 1px solid;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
}

.copy-button svg {
  width: 16px;
  height: 16px;
}

.secure-card {
  display: flex;
  gap: 12px;
  margin: 18px 15px 0;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f4f9ff 0%, #eaf3ff 100%);
}

.secure-icon {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #0b6bff;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.74);
}

.secure-content {
  min-width: 0;
}

.secure-content h2 {
  margin: 0 0 6px;
  color: #071b3a;
  font-size: 16px;
  font-weight: 700;
  line-height: 21px;
}

.secure-content p {
  margin: 0;
  color: #6b7890;
  font-size: 13px;
  line-height: 19px;
}

@media (max-width: 360px) {
  .contact-card {
    gap: 10px;
    padding: 16px 12px;
  }

  .platform-icon {
    flex-basis: 50px;
    width: 50px;
    height: 50px;
  }

  .platform-row h2 {
    font-size: 14px;
  }

  .contact-value {
    font-size: 12px;
  }

  .copy-button {
    flex-basis: 70px;
    width: 70px;
  }
}
</style>

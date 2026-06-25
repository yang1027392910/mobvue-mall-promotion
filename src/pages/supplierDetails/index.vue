<script setup lang="ts">
import type { RawSupplierItem } from "@@/apis/supplier/type"
import { getSupplierListApi } from "@@/apis/supplier"
import { requireLogin } from "@@/utils/guest-access"
import VerifiedAccessDialog from "@@/components/VerifiedAccessDialog.vue"
import { Icon } from "@iconify/vue"
import { showFailToast, showToast } from "vant"
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"

interface StatItem {
  icon: string
  iconClass: string
  label: string
  value: string
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const supplier = ref<RawSupplierItem>()
const loading = ref(false)
const errorText = ref("")
const previewVisible = ref(false)
const activeImageIndex = ref(0)
const touchStartX = ref(0)
const touchStartY = ref(0)
const showVerificationDialog = ref(false)

const supplierName = computed(() => supplier.value?.name || "Supplier Details")
const supplierCity = computed(() => supplier.value?.city ? `${supplier.value.city}, China` : "China")
const supplierProducts = computed(() => supplier.value?.mainProducts ?? supplier.value?.main_products ?? "")
const supplierMoq = computed(() => supplier.value?.moq || "-")
const supplierDescription = computed(() => supplier.value?.description || "This verified supplier has been reviewed by YiwuHub. Product details and contact availability may vary based on account verification status.")
const supplierLogo = computed(() => getAssetUrl(supplier.value?.logo))
const supplierWhatsapp = computed(() => supplier.value?.contactWhatsapp ?? supplier.value?.contact_whatsapp ?? "")
const canShowContact = computed(() => Number(supplier.value?.showContact ?? supplier.value?.show_contact ?? 0) === 1 && Boolean(supplierWhatsapp.value))
const activePreviewImage = computed(() => gallery.value[activeImageIndex.value] || gallery.value[0] || "")
const verificationStatus = computed(() => Number(userStore.userInfo.verificationStatus ?? -1))
const realNameVerified = computed(() => verificationStatus.value === 1)
const contactButtonText = computed(() => {
  if (realNameVerified.value) return "Contact Us"
  if (verificationStatus.value === 0) return "Under Review"
  if (verificationStatus.value === 2) return "Re-submit Verification"
  return "Verify to Contact"
})
const contactButtonIcon = computed(() => {
  if (realNameVerified.value) return "solar:chat-round-dots-bold-duotone"
  if (verificationStatus.value === 0) return "solar:clock-circle-bold-duotone"
  return "solar:shield-check-bold-duotone"
})

const defaultGallery = [
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1604762512526-b75a87d6f7e2?auto=format&fit=crop&w=520&q=80",
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=520&q=80"
]

const gallery = computed(() => {
  const imageList = normalizeImages(supplier.value?.images)

  if (imageList.length) return imageList
  return supplierLogo.value ? [supplierLogo.value] : defaultGallery
})

const stats = computed<StatItem[]>(() => [
  {
    icon: "solar:box-bold-duotone",
    iconClass: "blue",
    label: "Main Products",
    value: supplierProducts.value || "-"
  },
  {
    icon: "solar:database-bold-duotone",
    iconClass: "purple",
    label: "MOQ",
    value: supplierMoq.value
  },
  {
    icon: "solar:calendar-bold-duotone",
    iconClass: "orange",
    label: "Verification",
    value: "YiwuHub"
  }
])

function getDataList(data: RawSupplierItem[] | {
  data?: RawSupplierItem[]
  list?: RawSupplierItem[]
  records?: RawSupplierItem[]
  rows?: RawSupplierItem[]
  items?: RawSupplierItem[]
}) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.list)) return data.list
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.rows)) return data.rows
  return Array.isArray(data.items) ? data.items : []
}

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function normalizeImages(images?: string[] | string) {
  if (!images) return []

  if (Array.isArray(images)) {
    return images.map(item => getAssetUrl(String(item))).filter(Boolean)
  }

  const imageText = String(images).trim()
  if (!imageText) return []

  try {
    const parsedImages = JSON.parse(imageText)
    if (Array.isArray(parsedImages)) {
      return parsedImages.map(item => getAssetUrl(String(item))).filter(Boolean)
    }
  } catch {
    // Fall through to comma-separated parsing.
  }

  return imageText
    .split(",")
    .map(item => getAssetUrl(item.trim()))
    .filter(Boolean)
}

async function getSupplierDetail() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getSupplierListApi({
      page: 1,
      pageSize: 100
    })
    const routeId = Number(route.params.id)
    const activeSuppliers = getDataList(data)
      .filter(item => Number(item.status ?? 0) === 1)
      .sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0))

    supplier.value = activeSuppliers.find(item => Number(item.id) === routeId) ?? activeSuppliers[0]

    if (!supplier.value) errorText.value = "Supplier not found"
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Failed to load supplier"
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.back()
}

function promptUserVerification() {
  showVerificationDialog.value = true
}

function handleVerificationConfirm() {
  router.push("/user-verification")
}

async function ensureRealNameVerified() {
  if (realNameVerified.value) return true

  await userStore.getInfo()
  return realNameVerified.value
}

async function handleContact() {
  if (!requireLogin(router)) return

  if (!(await ensureRealNameVerified())) {
    await promptUserVerification()
    return
  }

  if (canShowContact.value) {
    const phone = supplierWhatsapp.value.replace(/\D/g, "")
    if (!phone) {
      showFailToast("Supplier contact information is unavailable.")
      return
    }

    window.location.href = `https://wa.me/${phone}`
    return
  }

  router.push("/procurement-support")
}

function previewImage(index: number) {
  if (!gallery.value.length) return

  activeImageIndex.value = index
  previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}

function showPreviousImage() {
  if (gallery.value.length <= 1) return
  activeImageIndex.value = (activeImageIndex.value - 1 + gallery.value.length) % gallery.value.length
}

function showNextImage() {
  if (gallery.value.length <= 1) return
  activeImageIndex.value = (activeImageIndex.value + 1) % gallery.value.length
}

function handleViewerTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

function handleViewerTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value

  if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return

  if (deltaX > 0) {
    showPreviousImage()
    return
  }

  showNextImage()
}

function handleShare() {
  router.push("/invite-friends")
}

onMounted(() => {
  getSupplierDetail()
})
</script>

<template>
  <div class="supplier-detail-page">
    <main class="detail-content">
      <van-loading
        v-if="loading"
        class="detail-loading"
        color="#0b6bff"
      />

      <van-empty
        v-else-if="errorText"
        image="error"
        :description="errorText"
      >
        <van-button
          size="small"
          type="primary"
          color="#0b6bff"
          @click="getSupplierDetail"
        >
          Retry
        </van-button>
      </van-empty>

      <template v-else>
        <section class="cover-section">
          <button type="button" class="cover-preview" @click="previewImage(0)">
            <img :src="gallery[0]" :alt="supplierName">
          </button>
          <span class="image-count">1/{{ gallery.length }}</span>
        </section>

        <section class="supplier-summary">
          <div class="summary-logo">
            <img v-if="supplierLogo" :src="supplierLogo" :alt="supplierName">
            <Icon v-else icon="solar:hanger-2-bold-duotone" />
          </div>
          <div class="summary-copy">
            <h1>{{ supplierName }}</h1>
            <div class="summary-tags">
              <span class="verified-tag">
                <Icon icon="solar:shield-check-bold" />
                Verified Supplier
              </span>
              <span class="blue-tag">{{ supplierMoq === "-" ? "Export Experience" : `MOQ ${supplierMoq}` }}</span>
            </div>
            <div class="location-row">
              <Icon icon="solar:map-point-bold-duotone" />
              <span>{{ supplierCity }}</span>
            </div>
          </div>

          <p>{{ supplierDescription }}</p>
        </section>

        <section class="stats-card" aria-label="Supplier facts">
          <article
            v-for="item in stats"
            :key="item.label"
            class="stat-item"
          >
            <Icon :class="item.iconClass" :icon="item.icon" />
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </section>

        <section class="about-card">
          <div class="factory-gallery">
            <button
              v-for="(image, index) in gallery"
              :key="image"
              class="gallery-thumb"
              type="button"
              @click="previewImage(index)"
            >
              <img
                :src="image"
                alt="Factory photo"
              >
            </button>
          </div>
        </section>

        <footer class="bottom-actions">
          <button
            class="contact-button"
            :class="{ 'contact-button--locked': !realNameVerified }"
            type="button"
            @click="handleContact"
          >
            <Icon :icon="contactButtonIcon" />
            {{ contactButtonText }}
          </button>
        </footer>
      </template>
    </main>

    <Teleport to="body">
      <div
        v-if="previewVisible"
        class="image-viewer"
        role="dialog"
        aria-modal="true"
        @click.self="closePreview"
      >
        <header class="viewer-header">
          <span>{{ activeImageIndex + 1 }} / {{ gallery.length }}</span>
          <button type="button" aria-label="Close image preview" @click="closePreview">
            <Icon icon="solar:close-circle-bold" />
          </button>
        </header>

        <div
          class="viewer-stage"
          @touchstart.passive="handleViewerTouchStart"
          @touchend.passive="handleViewerTouchEnd"
        >
          <img
            :src="activePreviewImage"
            :alt="supplierName"
          >
        </div>

        <div v-if="gallery.length > 1" class="viewer-thumbs">
          <button
            v-for="(image, index) in gallery"
            :key="image"
            type="button"
            :class="{ active: activeImageIndex === index }"
            @click="activeImageIndex = index"
          >
            <img :src="image" alt="">
          </button>
        </div>
      </div>
    </Teleport>

    <VerifiedAccessDialog
      v-model:show="showVerificationDialog"
      :status="verificationStatus"
      @confirm="handleVerificationConfirm"
    />
  </div>
</template>

<style scoped>
.supplier-detail-page {
  min-height: 100vh;
  max-width: 375px;
  margin: 0 auto;
  padding-bottom: 24px;
  color: #07152f;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7fe 52%, #ffffff 100%);
}

.supplier-detail-page,
.supplier-detail-page * {
  box-sizing: border-box;
}

.share-icon {
  width: 32px;
  height: 32px;
  border: 0;
  display: grid;
  place-items: center;
  padding: 0;
  color: #07152f;
  background: transparent;
  font-size: 22px;
}

.detail-content {
  padding: 8px 15px 0;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.cover-section {
  position: relative;
  height: 145px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  background: #e9eff7;
}

.cover-preview {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  padding: 0;
  background: transparent;
}

.cover-section img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-count {
  position: absolute;
  right: 9px;
  bottom: 11px;
  height: 27px;
  min-width: 38px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: rgba(7, 14, 32, 0.58);
  font-size: 12px;
  font-weight: 800;
}

.supplier-summary {
  position: relative;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 11px;
  margin: -26px 10px 0;
  border: 1px solid #e7edf7;
  border-radius: 10px;
  padding: 14px 13px 15px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 10px 26px rgba(28, 57, 102, 0.11);
}

.summary-logo {
  width: 64px;
  height: 64px;
  border: 1px solid #e9eef8;
  border-radius: 7px;
  display: grid;
  place-items: center;
  color: #39465d;
  background: linear-gradient(180deg, #ffffff, #f5f8fd);
  font-size: 44px;
  overflow: hidden;
}

.summary-logo img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.summary-copy {
  min-width: 0;
}

.summary-copy h1 {
  margin: 0 0 9px;
  color: #081733;
  font-size: 15.5px;
  font-weight: 900;
  line-height: 21px;
}

.summary-tags {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.summary-tags span {
  min-height: 21px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
}

.verified-tag {
  color: #06a75d;
  background: #eafbf1;
}

.verified-tag svg {
  width: 12px;
  height: 12px;
}

.blue-tag {
  color: #075eff;
  background: #edf4ff;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 9px;
  color: #52617c;
  font-size: 11px;
  font-weight: 700;
}

.location-row svg {
  width: 14px;
  height: 14px;
}

.supplier-summary > p {
  grid-column: 1 / -1;
  margin: 2px 0 0;
  border-top: 1px solid #e6ecf5;
  padding-top: 13px;
  color: #344564;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 13px;
  overflow: hidden;
  border: 1px solid #e7edf7;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(28, 57, 102, 0.06);
}

.stat-item {
  min-width: 0;
  min-height: 100px;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 8px 7px 10px;
  text-align: center;
}

.stat-item + .stat-item {
  border-left: 1px solid #edf1f7;
}

.stat-item svg {
  width: 25px;
  height: 25px;
  margin-bottom: 5px;
}

.stat-item svg.blue {
  color: #146cff;
}

.stat-item svg.purple {
  color: #8b5cf6;
}

.stat-item svg.green {
  color: #22b96e;
}

.stat-item svg.orange {
  color: #ff9417;
}

.stat-item span {
  min-height: 28px;
  color: #435473;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
}

.stat-item strong {
  margin-top: 6px;
  color: #12203f;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  overflow-wrap: anywhere;
}

.about-card {
  margin-top: 13px;
  border: 1px solid #e7edf7;
  border-radius: 10px;
  padding: 16px 13px 17px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(28, 57, 102, 0.06);
}

.about-card h2,
.gallery-heading h3 {
  margin: 0;
  color: #0b1834;
  font-size: 14px;
  font-weight: 900;
  line-height: 20px;
}

.about-card p {
  margin: 10px 0 17px;
  color: #344564;
  font-size: 12px;
  font-weight: 700;
  line-height: 21px;
}

.gallery-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-top: 1px solid #e7edf7;
  padding-top: 16px;
}

.gallery-heading button {
  border: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  color: #7a88a3;
  background: transparent;
  font-size: 11px;
  font-weight: 800;
}

.factory-gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.gallery-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 0;
  border-radius: 5px;
  display: block;
  overflow: hidden;
  padding: 0;
  background: #eef3f9;
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: #eef3f9;
}

.bottom-actions {
  display: block;
  margin-top: 11px;
}

.bottom-actions button {
  width: 100%;
  height: 43px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 900;
}

.bottom-actions svg {
  width: 20px;
  height: 20px;
}

.contact-button {
  border: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #0962ff, #0756e8);
  box-shadow: 0 10px 20px rgba(9, 98, 255, 0.23);
}

.contact-button--locked {
  background: linear-gradient(135deg, #1f6fff, #468cff);
}

:global(.image-viewer) {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  grid-template-rows: 58px minmax(0, 1fr) 82px;
  background: rgba(2, 6, 18, 0.96);
  color: #ffffff;
}

:global(.viewer-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  font-size: 13px;
  font-weight: 800;
}

:global(.viewer-header button),
:global(.viewer-thumbs button) {
  border: 0;
  padding: 0;
  background: transparent;
}

:global(.viewer-header button) {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 26px;
}

:global(.viewer-stage) {
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 8px 18px 14px;
  touch-action: pan-y;
}

:global(.viewer-stage img) {
  display: block;
  width: 100%;
  max-width: 680px;
  max-height: 100%;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
}

:global(.viewer-thumbs) {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  align-items: center;
  padding: 10px 15px 18px;
  background: linear-gradient(180deg, rgba(2, 6, 18, 0), rgba(2, 6, 18, 0.8));
  scrollbar-width: none;
}

:global(.viewer-thumbs button) {
  width: 52px;
  height: 52px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  flex: 0 0 auto;
  overflow: hidden;
  opacity: 0.62;
}

:global(.viewer-thumbs button.active) {
  border-color: #ffffff;
  opacity: 1;
}

:global(.viewer-thumbs img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
</style>

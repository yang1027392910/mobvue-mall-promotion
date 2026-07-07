<script setup lang="ts">
import type { RawProductItem } from "@@/apis/products/type"
import { favoriteClickApi } from "@@/apis/favorite"
import { getProductAiContentApi, getProductDetailApi } from "@@/apis/products"
import VerifiedAccessDialog from "@@/components/VerifiedAccessDialog.vue"
import { requireLogin } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import { showFailToast, showSuccessToast } from "vant"
import { computed, nextTick, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useSeo } from "@/composables/useSeo"
import { useUserStore } from "@/pinia/stores/user"

interface SupplierContact {
  name: string
  whatsapp: string
  wechat: string
  phone: string
}

interface ProductDetail {
  id: number
  name: string
  title: string
  subtitle: string
  cover: string
  seoTitle: string
  metaDescription: string
  seoKeywords: string[]
  urlSlug: string
  image: string
  images: string[]
  imageCount: string
  sales: number
  description: string
  chinaCost: string
  phPrice: string
  profit: string
  profitMargin: string
  minimumOrderQuantity: number
  unitCost: string
  sellingPrice: string
  shippingCost: string
  otherFees: string
  isFavorite: boolean
  canViewSupplierContact: boolean
  supplierContact: SupplierContact | null
  params: Array<{ icon: string, label: string, value: string }>
}

interface ProductSeoPayload {
  title?: string
  cover?: string
  seoTitle?: string
  metaDescription?: string
  seoKeywords?: string[]
  urlSlug?: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { setProductSeo } = useSeo()

const isFavorite = ref(false)
const loading = ref(false)
const favoriteLoading = ref(false)
const errorText = ref("")
const product = ref<ProductDetail | null>(null)
const activeImageIndex = ref(0)
const supplierContactSection = ref<HTMLElement | null>(null)
const showVerificationDialog = ref(false)
const productDetailRequestId = ref(0)

const productId = computed(() => Number(route.query.id || 0))
const verificationStatus = computed(() => Number(userStore.userInfo.verificationStatus ?? -1))
const realNameVerified = computed(() => verificationStatus.value === 1)
const showSupplierSecondaryAction = computed(() => !realNameVerified.value || !product.value?.canViewSupplierContact)
const supplierActionIcon = computed(() => {
  if (!realNameVerified.value) return "lock"
  return "service-o"
})
const supplierActionColor = computed(() => {
  if (!realNameVerified.value) return "#2563eb"
  return "#d97706"
})
const supplierActionText = computed(() => {
  if (!realNameVerified.value) return "Verify to Unlock"
  return "Contact Us"
})
const activeImageNumber = computed(() => product.value?.images.length ? activeImageIndex.value + 1 : 0)
const totalImageNumber = computed(() => product.value?.images.length || 1)
const productDescriptionHtml = computed(() => sanitizeRichText(product.value?.description ?? ""))

function isCurrentProductRoute(id: number) {
  return route.name === "ProductCard" && Number(route.query.id || 0) === id
}

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function formatPeso(value: number | string | undefined) {
  return `₱${toNumber(value).toFixed(2)}`
}

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function parseImages(images?: string | string[]) {
  if (!images) return []

  if (Array.isArray(images)) {
    return images.filter(item => typeof item === "string")
  }

  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : []
  } catch {
    return []
  }
}

function isSafeUrl(value: string) {
  const url = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, "")

  if (!url) return true
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return true
  return /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(url)
}

function sanitizeInlineStyle(value: string) {
  return value
    .split(";")
    .map(item => item.trim())
    .filter((item) => {
      if (!item) return false
      return !/expression|url\s*\(|behavior|-moz-binding/i.test(item)
    })
    .join("; ")
}

function sanitizeRichText(html: string) {
  if (!html.trim() || typeof document === "undefined") return ""

  const template = document.createElement("template")
  template.innerHTML = html

  template.content
    .querySelectorAll("script, iframe, object, embed, form, input, button, textarea, select, meta, link, style")
    .forEach(element => element.remove())

  template.content.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value

      if (name.startsWith("on") || name === "srcdoc") {
        element.removeAttribute(attribute.name)
        return
      }

      if (name === "style") {
        const safeStyle = sanitizeInlineStyle(value)
        if (safeStyle) element.setAttribute(attribute.name, safeStyle)
        else element.removeAttribute(attribute.name)
        return
      }

      if ((name === "href" || name === "src" || name === "xlink:href") && !isSafeUrl(value)) {
        element.removeAttribute(attribute.name)
      }
    })
  })

  return template.innerHTML
}

function getAiContentText(data: unknown) {
  if (typeof data === "string") return data
  if (!data || typeof data !== "object") return ""

  const contentData = data as Record<string, unknown>
  const content = contentData.content
    ?? contentData.aiContent
    ?? contentData.description
    ?? contentData.productDescription

  return typeof content === "string" ? content : ""
}

function getStringField(data: Record<string, unknown>, key: string) {
  const value = data[key]
  return typeof value === "string" ? value : ""
}

function getSeoKeywords(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(keyword => String(keyword).trim()).filter(Boolean)
  }

  if (typeof value === "string") {
    return value.split(",").map(keyword => keyword.trim()).filter(Boolean)
  }

  return []
}

function getAiContentSeo(data: unknown): ProductSeoPayload {
  if (!data || typeof data !== "object") return {}

  const contentData = data as Record<string, unknown>

  return {
    title: getStringField(contentData, "title"),
    cover: getStringField(contentData, "cover"),
    seoTitle: getStringField(contentData, "seoTitle"),
    metaDescription: getStringField(contentData, "metaDescription"),
    seoKeywords: getSeoKeywords(contentData.seoKeywords),
    urlSlug: getStringField(contentData, "urlSlug")
  }
}

function normalizeProduct(item: RawProductItem): ProductDetail {
  const images = parseImages(item.images)
  const cover = item.cover ?? item.image ?? item.imageUrl
  const allImages = [cover, ...images].filter(Boolean) as string[]
  const imageUrls = allImages.map(getAssetUrl).filter(Boolean)
  const chinaPrice = toNumber(item.chinaPrice)
  const phPrice = toNumber(item.phPrice ?? item.price)
  const profit = toNumber(item.profit, phPrice - chinaPrice)
  const profitMargin = phPrice ? Math.round((profit / phPrice) * 100) : 0
  // const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "--"
  const minimumOrderQuantity = toNumber(item.minimumOrderQuantity, 10)
  const shippingFee = toNumber(item.shippingFee)
  const otherFees = toNumber(item.otherFees)
  const supplierContact = item.supplierContact
    ? {
        name: String(item.supplierContact.name ?? ""),
        whatsapp: String(item.supplierContact.whatsapp ?? ""),
        wechat: String(item.supplierContact.wechat ?? ""),
        phone: String(item.supplierContact.phone ?? "")
      }
    : null

  return {
    id: toNumber(item.id ?? item.productId),
    name: String(item.name ?? item.productName ?? item.title ?? ""),
    title: String(item.title ?? item.name ?? item.productName ?? ""),
    subtitle: String(item.subtitle ?? ""),
    cover: getAssetUrl(String(item.cover ?? item.image ?? item.imageUrl ?? "")),
    seoTitle: String(item.seoTitle ?? ""),
    metaDescription: String(item.metaDescription ?? ""),
    seoKeywords: Array.isArray(item.seoKeywords) ? item.seoKeywords.map(keyword => String(keyword)) : [],
    urlSlug: String(item.urlSlug ?? ""),
    image: imageUrls[0] || "",
    images: imageUrls,
    imageCount: `${imageUrls.length ? 1 : 0}/${imageUrls.length || 1}`,
    sales: toNumber(item.sales ?? item.salesVolume),
    description: String(item.descriptionHtml ?? item.description ?? item.subtitle ?? ""),
    chinaCost: formatPeso(item.chinaPrice),
    phPrice: formatPeso(item.phPrice ?? item.price),
    profit: formatPeso(item.profit),
    profitMargin: `${profitMargin}%`,
    minimumOrderQuantity,
    unitCost: String(chinaPrice),
    sellingPrice: String(phPrice),
    shippingCost: String(shippingFee),
    otherFees: String(otherFees),
    isFavorite: Boolean(item.isFavorite ?? item.favorite ?? false),
    canViewSupplierContact: item.canViewSupplierContact === true,
    supplierContact,
    params: [
      { icon: "orders-o", label: "Min Order", value: `${minimumOrderQuantity} pcs` },
      { icon: "logistics", label: "Shipping Fee", value: formatPeso(shippingFee) }

    ]
  }
}

async function getProductDetail() {
  const nextProductId = productId.value
  const requestId = productDetailRequestId.value + 1
  productDetailRequestId.value = requestId
  loading.value = true
  errorText.value = ""

  try {
    if (!nextProductId) {
      throw new Error("Invalid product id")
    }

    const { data } = await getProductDetailApi(nextProductId)
    if (requestId !== productDetailRequestId.value || !isCurrentProductRoute(nextProductId)) return

    const normalizedProduct = normalizeProduct(data)
    product.value = normalizedProduct
    setProductSeo(normalizedProduct)
    activeImageIndex.value = 0
    isFavorite.value = normalizedProduct.isFavorite
    void getProductAiContent(normalizedProduct.id)
  } catch (error) {
    if (requestId !== productDetailRequestId.value || !isCurrentProductRoute(nextProductId)) return
    errorText.value = error instanceof Error ? error.message : "Failed to load product"
  } finally {
    if (requestId === productDetailRequestId.value && isCurrentProductRoute(nextProductId)) {
      loading.value = false
    }
  }
}

async function getProductAiContent(id: number) {
  try {
    if (!isCurrentProductRoute(id)) return

    const { data } = await getProductAiContentApi(id)
    if (!isCurrentProductRoute(id)) return

    const aiContent = getAiContentText(data).trim()
    const aiContentSeo = getAiContentSeo(data)

    if (product.value && product.value.id === id) {
      const nextProduct = {
        ...product.value,
        ...aiContentSeo,
        description: aiContent || product.value.description
      }

      product.value = nextProduct
      setProductSeo(nextProduct)
    }
  } catch {
    // AI content is supplemental; keep the normal product detail visible if it fails.
  }
}

async function toggleFavorite() {
  if (!requireLogin(router)) return
  if (!product.value || favoriteLoading.value) return

  favoriteLoading.value = true

  try {
    await favoriteClickApi({
      productId: product.value.id
    })
    isFavorite.value = !isFavorite.value
    product.value.isFavorite = isFavorite.value
  } finally {
    favoriteLoading.value = false
  }
}

function handleCalculateProfit() {
  if (!requireLogin(router) || !product.value) return

  router.push({
    path: "/calculator",
    query: {
      productName: product.value.name,
      moq: product.value.minimumOrderQuantity,
      quantity: product.value.minimumOrderQuantity,
      unitCost: product.value.unitCost,
      sellingPrice: product.value.sellingPrice,
      shippingCost: product.value.shippingCost,
      otherFees: product.value.otherFees
    }
  })
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

async function handleSupplierAction() {
  if (!requireLogin(router) || !product.value) return

  if (!(await ensureRealNameVerified())) {
    await promptUserVerification()
    return
  }

  if (product.value.canViewSupplierContact) {
    if (!product.value.supplierContact) {
      showFailToast("Supplier contact information is unavailable.")
      return
    }

    nextTick(() => {
      supplierContactSection.value?.scrollIntoView({
        behavior: "smooth",
        block: "end"
      })
    })
    return
  }

  handleContactUs()
}

function handleContactUs() {
  router.push("/procurement-support")
}

function handleImageChange(index: number) {
  activeImageIndex.value = index
}

async function copySupplierContact(label: string, value: string) {
  const contact = value.trim()

  if (!contact) {
    showFailToast(`${label} is unavailable.`)
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(contact)
    } else {
      const textarea = document.createElement("textarea")
      textarea.value = contact
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand("copy")
      textarea.remove()

      if (!copied) throw new Error("Copy failed")
    }

    showSuccessToast(`${label} copied.`)
  } catch {
    showFailToast("Unable to copy. Please copy it manually.")
  }
}

watch(productId, () => {
  getProductDetail()
}, {
  immediate: true
})
</script>

<template>
  <div class="product-detail-page">
    <main class="detail-content">
      <van-loading
        v-if="loading"
        class="detail-loading"
        color="#1677ff"
      />

      <van-empty
        v-else-if="errorText"
        image="error"
        :description="errorText"
      >
        <van-button
          size="small"
          type="primary"
          @click="getProductDetail"
        >
          Retry
        </van-button>
      </van-empty>

      <template v-else-if="product">
        <section class="image-section">
          <van-swipe
            v-if="product.images.length"
            v-model:active="activeImageIndex"
            class="product-image-swipe"
            indicator-color="#ffffff"
            @change="handleImageChange"
          >
            <van-swipe-item
              v-for="(image, index) in product.images"
              :key="`${image}-${index}`"
            >
              <img class="product-image" :src="image" :alt="product.name" draggable="false">
            </van-swipe-item>
          </van-swipe>
          <div v-else class="product-image-placeholder" />
          <div class="image-count">
            {{ activeImageNumber }}/{{ totalImageNumber }}
          </div>
        </section>

        <section class="basic-section">
          <h1 class="product-name">
            {{ product.name }}
          </h1>
          <div class="score-row">
            <div class="sales-row">
              <van-icon class="score-icon sales" name="fire-o" />
              <div class="score-label">
                Already sold
              </div>
              <div class="score-value sales">
                {{ product.sales }}
              </div>
            </div>
            <div
              v-for="item in product.params"
              :key="item.label"
              class="sales-row"
            >
              <van-icon class="score-icon" :name="item.icon" />
              <div class="score-label">
                {{ item.label }}
              </div>
              <div class="score-value">
                {{ item.value }}
              </div>
            </div>
          </div>
        </section>

        <section class="profit-card">
          <div class="price-grid">
            <div class="price-item">
              <div class="price-label">
                China Cost
              </div>
              <div class="price-value cost">
                {{ product.chinaCost }}
              </div>
            </div>
            <div class="price-item">
              <div class="price-label">
                PH Price
              </div>
              <div class="price-value ph">
                {{ product.phPrice }}
              </div>
            </div>
            <div class="price-item">
              <div class="price-label">
                Profit
              </div>
              <div class="price-value profit">
                {{ product.profit }}
              </div>
            </div>
            <div class="price-item">
              <div class="price-label">
                Profit Margin
              </div>
              <div class="price-value profit">
                {{ product.profitMargin }}
              </div>
            </div>
          </div>
        </section>

        <section v-if="productDescriptionHtml.trim()" class="description-card">
          <div class="product-description" v-html="productDescriptionHtml" />
        </section>

        <section
          v-if="product.canViewSupplierContact && product.supplierContact"
          ref="supplierContactSection"
          class="supplier-contact-card"
        >
          <div class="supplier-contact-heading">
            <div>
              <van-icon name="phone-o" />
              <h2>Supplier Information</h2>
            </div>
            <van-icon class="supplier-contact-check" name="checked" />
          </div>

          <div class="supplier-contact-list">
            <div class="supplier-contact-row">
              <van-icon name="manager-o" />
              <span>Supplier Name</span>
              <strong>{{ product.supplierContact.name || "--" }}</strong>
            </div>
            <div class="supplier-contact-row">
              <van-icon name="chat-o" />
              <span>WhatsApp</span>
              <strong>{{ product.supplierContact.whatsapp || "--" }}</strong>
              <button
                class="contact-copy-button"
                type="button"
                aria-label="Copy WhatsApp"
                @click="copySupplierContact('WhatsApp', product.supplierContact.whatsapp)"
              >
                <Icon icon="meteor-icons:copy" />
              </button>
            </div>
            <div class="supplier-contact-row">
              <van-icon name="comment-o" />
              <span>WeChat</span>
              <strong>{{ product.supplierContact.wechat || "--" }}</strong>
              <button
                class="contact-copy-button"
                type="button"
                aria-label="Copy WeChat"
                @click="copySupplierContact('WeChat', product.supplierContact.wechat)"
              >
                <Icon icon="meteor-icons:copy" />
              </button>
            </div>
            <div class="supplier-contact-row">
              <van-icon name="phone-o" />
              <span>Phone</span>
              <strong>{{ product.supplierContact.phone || "--" }}</strong>
              <button
                class="contact-copy-button"
                type="button"
                aria-label="Copy phone number"
                @click="copySupplierContact('Phone', product.supplierContact.phone)"
              >
                <Icon icon="meteor-icons:copy" />
              </button>
            </div>
          </div>
        </section>
      </template>
    </main>

    <div
      v-if="product"
      class="bottom-bar"
      :class="{ 'has-two-actions': !showSupplierSecondaryAction }"
    >
      <van-button
        class="bottom-button favorite-action"
        plain
        :icon="isFavorite ? 'like' : 'heart-o'"
        :loading="favoriteLoading"
        color="#2563eb"
        @click="toggleFavorite"
      >
        {{ isFavorite ? "Favorited" : "Add to Favorites" }}
      </van-button>
      <van-button
        v-if="showSupplierSecondaryAction"
        class="bottom-button supplier-secondary-action"
        :class="{
          'is-locked': !realNameVerified,
          'no-access': realNameVerified && !product.canViewSupplierContact,
        }"
        plain
        :icon="supplierActionIcon"
        :color="supplierActionColor"
        @click="handleSupplierAction"
      >
        {{ supplierActionText }}
      </van-button>
      <van-button
        class="bottom-button supplier-action"
        type="primary"
        color="#2563eb"
        @click="handleCalculateProfit"
      >
        Calculate Profit
      </van-button>
    </div>

    <VerifiedAccessDialog
      v-model:show="showVerificationDialog"
      :status="verificationStatus"
      @confirm="handleVerificationConfirm"
    />
  </div>
</template>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  max-width: 500px;
  margin: 0 auto;
  background: #ffffff;
  color: #111827;
}

.detail-nav :deep(.van-icon) {
  color: #111827;
}

.nav-icon-button {
  width: 30px;
  height: 30px;
  border: 0;
  background: transparent;
  color: #111827;
  font-size: 20px;
  display: inline-grid;
  place-items: center;
  padding: 0;
}

.detail-content {
  min-height: calc(100vh - 46px);
  padding-bottom: 96px;
  background: #f7f9fc;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.image-section {
  position: relative;
  height: 300px;
  background: #f3f4f6;
}

.product-image-swipe {
  width: 100%;
  height: 100%;
}

.product-image-swipe :deep(.van-swipe__track),
.product-image-swipe :deep(.van-swipe-item) {
  height: 100%;
}

.product-image-swipe :deep(.van-swipe__indicators) {
  bottom: 14px;
}

.product-image-swipe :deep(.van-swipe__indicator) {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(17, 24, 39, 0.18);
  opacity: 1;
  box-shadow: 0 2px 6px rgba(17, 24, 39, 0.22);
}

.product-image-swipe :deep(.van-swipe__indicator--active) {
  width: 20px;
  background: #2563eb;
  border-color: rgba(255, 255, 255, 0.86);
}

.product-image,
.product-image-placeholder {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
}

.product-image-placeholder {
  background: #f3f4f6;
}

.image-count {
  position: absolute;
  right: 14px;
  bottom: 14px;
  min-width: 44px;
  height: 26px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.72);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: grid;
  place-items: center;
  padding: 0 10px;
}

.basic-section,
.profit-card,
.description-card {
  margin: 8px 8px 0;
  border-radius: 16px;
  padding: 0 10px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.basic-section {
  padding: 0 10px 10px;
}

.product-name {
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
  line-height: 28px;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 10px;
  margin-top: 5px;
}

.sales-row {
  min-width: 0;
  text-align: center;
}

.score-icon {
  margin-bottom: 4px;
  color: #2563eb;
  font-size: 17px;
}

.score-icon.sales {
  color: #ff5a1f;
}

.score-label {
  min-width: 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-value {
  min-width: 0;
  margin-top: 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-value.sales {
  color: #ff5a1f;
}

.product-subtitle,
.product-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 21px;
  overflow-wrap: anywhere;
}

.description-card {
  padding: 10px;
}
::v-deep(.description-card .product-description h3) {
  padding: 0;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 30px;
  color: #111827;
}
.product-description :deep(p) {
  text-indent: 2ch;
  font-size: 12px;
  color: #374151;
}
.product-description :deep(p),
.product-description :deep(ul),
.product-description :deep(ol),
.product-description :deep(blockquote),
.product-description :deep(figure) {
  margin: 0 0 5px;
  font-size: 12px;
}

.product-description :deep(p:last-child),
.product-description :deep(ul:last-child),
.product-description :deep(ol:last-child),
.product-description :deep(blockquote:last-child),
.product-description :deep(figure:last-child) {
  margin-bottom: 0;
}

.product-description :deep(img),
.product-description :deep(video) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.product-description :deep(table) {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.product-description :deep(th),
.product-description :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 6px;
  vertical-align: top;
}

.product-description :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.product-subtitle {
  color: #374151;
  font-weight: 600;
}

.profit-card {
  padding: 16px;
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.price-item {
  min-width: 0;
  text-align: center;
}

.price-label {
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}

.price-value {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
  line-height: normal;
}

.price-value.cost {
  color: #ef4444;
}

.price-value.ph {
  color: #2563eb;
}

.price-value.profit {
  color: #16a34a;
}

.supplier-permission-card {
  min-height: 64px;
  margin: 12px 12px 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
}

.supplier-permission-card.has-access {
  color: #2e9d5c;
  background: #e8f7ee;
}

.supplier-permission-card.no-access {
  color: #b96a16;
  background: #fff4e5;
}

.supplier-permission-icon,
.supplier-check-icon {
  flex: 0 0 auto;
  font-size: 20px;
}

.supplier-permission-card p {
  flex: 1;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 19px;
}

.supplier-check-icon {
  color: #2e9d5c;
}

.bottom-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 20;
  width: 100%;
  max-width: 500px;
  height: 68px;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 28fr 28fr 30fr;
  gap: 5px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.08);
}

.bottom-bar.has-two-actions {
  grid-template-columns: 1fr 1fr;
}

.bottom-button {
  height: 44px;
  border-radius: 10px;
  font-weight: 500;
}

.favorite-action {
  background: #ffffff;
}

.favorite-action :deep(.van-button__text),
.supplier-secondary-action :deep(.van-button__text) {
  font-size: 12px;
}

.supplier-secondary-action {
  background: #f0faf4;
}

.supplier-secondary-action.is-locked {
  background: #eff6ff;
}

.supplier-secondary-action.no-access {
  background: #fff7ed;
}

.supplier-action :deep(.van-button__text) {
  font-size: 13px;
}

.supplier-contact-card {
  scroll-margin-bottom: 76px;
  margin: 12px 12px 0;
  overflow: hidden;
  border: 1px solid #d7efdf;
  border-radius: 14px;
  padding: 14px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(46, 157, 92, 0.08);
}

.supplier-contact-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #2e9d5c;
}

.supplier-contact-heading > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.supplier-contact-heading h2 {
  margin: 0;
  color: #111827;
  font-size: 16px;
  line-height: 24px;
}

.supplier-contact-heading .van-icon,
.supplier-contact-check {
  font-size: 20px;
}

.supplier-contact-list {
  overflow: hidden;
  border: 1px solid #eef2f7;
  border-radius: 12px;
}

.supplier-contact-row {
  min-height: 52px;
  display: grid;
  grid-template-columns: 20px 100px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f7;
}

.supplier-contact-row:last-child {
  border-bottom: 0;
}

.supplier-contact-row > .van-icon {
  color: #2e9d5c;
  font-size: 18px;
}

.supplier-contact-row span {
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
}

.supplier-contact-row strong {
  min-width: 0;
  color: #111827;
  font-size: 14px;
  text-align: right;
  overflow-wrap: anywhere;
}

.contact-copy-button {
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  background: transparent;
  font-size: 18px;
}
</style>

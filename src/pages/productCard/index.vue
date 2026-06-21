<script setup lang="ts">
import type { RawProductItem } from "@@/apis/products/type"
import { favoriteClickApi } from "@@/apis/favorite"
import { getProductListApi } from "@@/apis/products"
import { requireLogin } from "@@/utils/guest-access"
import { showFailToast, showSuccessToast } from "vant"
import { computed, nextTick, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

interface SupplierContact {
  name: string
  whatsapp: string
  wechat: string
  phone: string
}

interface ProductDetail {
  id: number
  name: string
  subtitle: string
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

const route = useRoute()
const router = useRouter()

const isFavorite = ref(false)
const loading = ref(false)
const favoriteLoading = ref(false)
const errorText = ref("")
const product = ref<ProductDetail | null>(null)
const activeImageIndex = ref(0)
const supplierContactVisible = ref(false)
const supplierContactSection = ref<HTMLElement | null>(null)

const productId = computed(() => Number(route.query.id || 0))

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function formatPeso(value: number | string | undefined) {
  return `₱${toNumber(value).toFixed(2)}`
}

function formatDollar(value: number | string | undefined) {
  return `$${toNumber(value).toFixed(2)}`
}

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function parseImages(images?: string) {
  if (!images) return []

  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : []
  } catch {
    return []
  }
}

function getProductDataList(data: RawProductItem[] | { list?: RawProductItem[] }) {
  if (Array.isArray(data)) return data
  return Array.isArray(data.list) ? data.list : []
}

function normalizeProduct(item: RawProductItem): ProductDetail {
  const images = parseImages(item.images)
  const allImages = [item.cover, ...images].filter(Boolean) as string[]
  const imageUrls = allImages.map(getAssetUrl).filter(Boolean)
  const chinaPrice = toNumber(item.chinaPrice)
  const phPrice = toNumber(item.phPrice ?? item.price)
  const profit = toNumber(item.profit, phPrice - chinaPrice)
  const profitMargin = phPrice ? Math.round((profit / phPrice) * 100) : 0
  const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "--"
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
    subtitle: String(item.subtitle ?? ""),
    image: imageUrls[0] || "",
    images: imageUrls,
    imageCount: `${imageUrls.length ? 1 : 0}/${imageUrls.length || 1}`,
    sales: toNumber(item.sales ?? item.salesVolume),
    description: String(item.description ?? item.subtitle ?? ""),
    chinaCost: formatDollar(item.chinaPrice),
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
      { icon: "orders-o", label: "MOQ", value: `${minimumOrderQuantity} pcs` },
      { icon: "cart-o", label: "Stock", value: `${toNumber(item.stock)} pcs` },
      { icon: "logistics", label: "Shipping Fee", value: formatDollar(shippingFee) },
      { icon: "apps-o", label: "Category ID", value: String(toNumber(item.categoryId)) },
      { icon: "fire-o", label: "Sales", value: String(toNumber(item.sales ?? item.salesVolume)) },
      { icon: "clock-o", label: "Created At", value: createdAt }
    ]
  }
}

async function getProductDetail() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getProductListApi({})
    const products = getProductDataList(data)
    const matchedProduct = products.find(item => toNumber(item.id ?? item.productId) === productId.value)

    if (!matchedProduct) {
      throw new Error("Product not found")
    }

    const normalizedProduct = normalizeProduct(matchedProduct)
    product.value = normalizedProduct
    activeImageIndex.value = 0
    isFavorite.value = normalizedProduct.isFavorite
    supplierContactVisible.value = false
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Failed to load product"
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.back()
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

function handleSupplierAction() {
  if (!requireLogin(router) || !product.value) return

  if (product.value.canViewSupplierContact) {
    if (!product.value.supplierContact) {
      showFailToast("Supplier contact information is unavailable.")
      return
    }

    supplierContactVisible.value = true
    nextTick(() => {
      supplierContactSection.value?.scrollIntoView({
        behavior: "smooth",
        block: "end"
      })
    })
    return
  }

  // TODO: Call the supplier access request API when the backend provides one.
  showSuccessToast("Request submitted, please wait for review.")
}

function handleContactUs() {
  router.push("/procurement-support")
}

onMounted(() => {
  getProductDetail()
})
</script>

<template>
  <div class="product-detail-page">
    <van-nav-bar
      title="Product Details"
      left-arrow
      fixed
      placeholder
      class="detail-nav"
      @click-left="handleBack"
    >
      <template #right>
        <button class="nav-icon-button" type="button" aria-label="Share">
          <van-icon name="share-o" />
        </button>
        <button class="nav-icon-button" type="button" aria-label="Favorite" :disabled="favoriteLoading" @click="toggleFavorite">
          <van-icon :name="isFavorite ? 'like' : 'heart-o'" />
        </button>
      </template>
    </van-nav-bar>

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
          >
            <van-swipe-item
              v-for="(image, index) in product.images"
              :key="`${image}-${index}`"
            >
              <img class="product-image" :src="image" :alt="product.name">
            </van-swipe-item>
          </van-swipe>
          <div v-else class="product-image-placeholder" />
          <div class="image-count">
            {{ product.images.length ? activeImageIndex + 1 : 0 }}/{{ product.images.length || 1 }}
          </div>
        </section>

        <section class="basic-section">
          <h1 class="product-name">
            {{ product.name }}
          </h1>
          <div class="score-row">
            <van-icon name="fire-o" />
            <span>Sales {{ product.sales }}</span>
          </div>
          <p v-if="product.subtitle" class="product-subtitle">
            {{ product.subtitle }}
          </p>
          <p class="product-description">
            {{ product.description }}
          </p>
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
          </div>
          <div class="margin-row">
            <span>Profit Margin</span>
            <strong>{{ product.profitMargin }}</strong>
          </div>
        </section>

        <section class="params-card">
          <div
            v-for="item in product.params"
            :key="item.label"
            class="param-row"
          >
            <div class="param-left">
              <van-icon :name="item.icon" />
              <span>{{ item.label }}</span>
            </div>
            <div class="param-value">
              {{ item.value }}
            </div>
          </div>
        </section>

        <section
          v-if="product.canViewSupplierContact && product.supplierContact && supplierContactVisible"
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
            </div>
            <div class="supplier-contact-row">
              <van-icon name="comment-o" />
              <span>WeChat</span>
              <strong>{{ product.supplierContact.wechat || "--" }}</strong>
            </div>
            <div class="supplier-contact-row">
              <van-icon name="phone-o" />
              <span>Phone</span>
              <strong>{{ product.supplierContact.phone || "--" }}</strong>
            </div>
          </div>
        </section>
      </template>
    </main>

    <div v-if="product" class="bottom-bar">
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
        class="bottom-button supplier-secondary-action"
        :class="{ 'no-access': !product.canViewSupplierContact }"
        plain
        :icon="product.canViewSupplierContact ? 'phone-o' : 'service-o'"
        :color="product.canViewSupplierContact ? '#2e9d5c' : '#d97706'"
        @click="product.canViewSupplierContact ? handleSupplierAction() : handleContactUs()"
      >
        {{ product.canViewSupplierContact ? "Supplier Info" : "Contact Us" }}
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
  </div>
</template>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #ffffff;
  color: #111827;
}

.detail-nav :deep(.van-nav-bar__title) {
  color: #111827;
  font-weight: 700;
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
.params-card {
  margin: 12px 12px 0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.basic-section {
  padding: 16px;
}

.product-name {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.score-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: #ff5a1f;
  font-size: 14px;
  font-weight: 700;
}

.product-subtitle,
.product-description {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 21px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
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

.margin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
  color: #6b7280;
  font-size: 14px;
}

.margin-row strong {
  color: #16a34a;
  font-size: 18px;
}

.params-card {
  overflow: hidden;
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid #eef2f7;
}

.param-row:last-child {
  border-bottom: 0;
}

.param-left {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.param-left .van-icon {
  color: #2563eb;
  font-size: 18px;
}

.param-value {
  min-width: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-align: right;
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
  max-width: 430px;
  height: 68px;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 28fr 30fr 42fr;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.08);
}

.bottom-button {
  height: 44px;
  border-radius: 10px;
  font-weight: 700;
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
  grid-template-columns: 20px 100px minmax(0, 1fr);
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
}

.supplier-contact-row strong {
  min-width: 0;
  color: #111827;
  font-size: 14px;
  text-align: right;
  overflow-wrap: anywhere;
}
</style>

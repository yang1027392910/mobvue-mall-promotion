<script setup lang="ts">
import type { RawProductItem } from "@@/apis/products/type"
import { favoriteClickApi } from "@@/apis/favorite"
import { getProductAiContentApi, getProductDetailApi } from "@@/apis/products"
import { requireLogin } from "@@/utils/guest-access"
import { showFailToast, showSuccessToast } from "vant"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import ProductImagePreview from "@/components/ProductImagePreview/index.vue"
import { useSeo } from "@/composables/useSeo"
import { useCartStore } from "@/pinia/stores/cart"

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
  phPrice: string
  sellingPrice: string
  isFavorite: boolean
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
const cart = useCartStore()
const { setProductSeo } = useSeo()

const isFavorite = ref(false)
const loading = ref(false)
const favoriteLoading = ref(false)
const errorText = ref("")
const product = ref<ProductDetail | null>(null)
const activeImageIndex = ref(0)
const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewStartIndex = ref(0)
const productDetailRequestId = ref(0)

const productId = computed(() => Number(route.query.id || 0))
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
  // Strip control characters to detect obfuscated unsafe URL schemes.
  // eslint-disable-next-line no-control-regex
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
    phPrice: formatPeso(item.phPrice ?? item.price),
    sellingPrice: String(toNumber(item.phPrice ?? item.price)),
    isFavorite: Boolean(item.isFavorite ?? item.favorite ?? false)
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

async function handleAddToCart() {
  if (!requireLogin(router) || !product.value) return
  const added = await cart.add({ id: product.value.id, title: product.value.name, image: product.value.image, price: Number(product.value.sellingPrice) })
  if (added) showSuccessToast("Added to cart")
  else showFailToast(cart.errorText || "Unable to add this product. Please try again.")
}

function handleContactUs() {
  router.push("/procurement-support")
}

function handleImageChange(index: number) {
  activeImageIndex.value = index
}

function openImagePreview(images: string[], index = 0) {
  const nextImages = images.filter(Boolean)
  if (!nextImages.length) return

  previewImages.value = nextImages
  previewStartIndex.value = Math.min(Math.max(index, 0), nextImages.length - 1)
  previewVisible.value = true
}

function previewProductImage(index = activeImageIndex.value) {
  if (!product.value?.images.length) return

  openImagePreview(product.value.images, index)
}

function handleDescriptionImageClick(event: MouseEvent) {
  const container = event.currentTarget as HTMLElement | null
  const target = event.target as HTMLElement | null
  const imageElement = target?.closest<HTMLImageElement>("img")

  if (!container || !imageElement || !container.contains(imageElement)) return

  const imageElements = Array.from(container.querySelectorAll<HTMLImageElement>("img"))
  const images = imageElements
    .map(image => image.currentSrc || image.src || image.getAttribute("src") || "")
    .filter(Boolean)
  const currentImage = imageElement.currentSrc || imageElement.src || imageElement.getAttribute("src") || ""
  const startIndex = Math.max(0, images.findIndex(image => image === currentImage))

  openImagePreview(images, startIndex)
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
              <img
                class="product-image"
                :src="image"
                :alt="product.name"
                draggable="false"
                @click="previewProductImage(index)"
              >
            </van-swipe-item>
          </van-swipe>
          <div v-else class="product-image-placeholder" />
          <div class="image-count">
            {{ activeImageNumber }}/{{ totalImageNumber }}
          </div>
        </section>

        <section class="basic-section">
          <div class="product-heading">
            <h1 class="product-name">
              {{ product.name }}
            </h1>
            <button
              class="favorite-toggle"
              type="button"
              :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
              :aria-pressed="isFavorite"
              :disabled="favoriteLoading"
              @click="toggleFavorite"
            >
              <van-icon :name="isFavorite ? 'like' : 'like-o'" />
            </button>
          </div>
          <p class="sales-count">
            {{ product.sales }} sold
          </p>
          <p class="retail-price">
            {{ product.phPrice }}
          </p>
        </section>

        <section class="fulfillment-card" aria-label="Pickup and delivery">
          <button class="fulfillment-row" type="button" @click="handleContactUs">
            <van-icon class="fulfillment-icon" name="shop-o" />
            <span class="fulfillment-text">
              <strong>Self Pickup Available</strong>
              <span>Pick up at our store in Cavite</span>
            </span>
            <van-icon name="arrow" />
          </button>
          <button class="fulfillment-row" type="button" @click="handleContactUs">
            <van-icon class="fulfillment-icon" name="logistics" />
            <span class="fulfillment-text">
              <strong>Delivery</strong>
              <span>Contact us for delivery</span>
            </span>
            <van-icon name="arrow" />
          </button>
        </section>

        <section v-if="productDescriptionHtml.trim()" class="description-card">
          <h2>Product Description</h2>
          <div
            class="product-description"
            v-html="productDescriptionHtml"
            @click="handleDescriptionImageClick"
          />
        </section>
      </template>
    </main>

    <div
      v-if="product && !loading && !errorText"
      class="bottom-bar"
    >
      <van-button
        class="bottom-button favorite-action"
        plain
        :icon="isFavorite ? 'like' : 'like-o'"
        :loading="favoriteLoading"
        color="#2563eb"
        @click="toggleFavorite"
      >
        {{ isFavorite ? "Favorited" : "Favorite" }}
      </van-button>
      <van-button
        class="bottom-button supplier-secondary-action"
        plain
        icon="service-o"
        color="#ff8500"
        @click="handleContactUs"
      >
        Contact Us
      </van-button>
      <van-button
        class="bottom-button supplier-action"
        type="primary"
        color="#2563eb"
        icon="shopping-cart-o"
        :loading="cart.saving"
        :disabled="cart.busy"
        @click="handleAddToCart"
      >
        Add to Cart
      </van-button>
    </div>

    <ProductImagePreview
      v-model:show="previewVisible"
      :images="previewImages"
      :start-index="previewStartIndex"
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

.detail-content {
  min-height: calc(100vh - 46px);
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
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

.product-image {
  cursor: zoom-in;
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
  font-size: 12px;
  font-weight: 600;
  display: grid;
  place-items: center;
  padding: 0 10px;
}

.basic-section {
  padding: 14px 18px 16px;
  background: #ffffff;
}
.product-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.product-name {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: #0c1738;
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
  overflow-wrap: anywhere;
}
.favorite-toggle {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border: 1px solid #eef0f4;
  border-radius: 50%;
  background: #ffffff;
  color: #475569;
  box-shadow: 0 2px 8px #0f172a0d;
  font-size: 22px;
  cursor: pointer;
}
.favorite-toggle[aria-pressed="true"] {
  color: #2563eb;
}
.sales-count {
  margin: 4px 0 8px;
  color: #52617a;
  font-size: 12px;
  line-height: 18px;
}
.retail-price {
  margin: 0;
  color: #ff2424;
  font-size: 26px;
  font-weight: 700;
  line-height: 34px;
}
.fulfillment-card,
.description-card {
  margin: 12px 10px 0;
  border-radius: 16px;
  padding: 0 14px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}
.fulfillment-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 0;
  border: 0;
  background: transparent;
  color: #0c1738;
  text-align: left;
  cursor: pointer;
}
.fulfillment-row + .fulfillment-row {
  border-top: 1px solid #e5e9f0;
}
.fulfillment-icon {
  flex-shrink: 0;
  font-size: 24px;
}
.fulfillment-text {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 4px;
  overflow-wrap: anywhere;
}
.fulfillment-text strong {
  font-size: 14px;
  line-height: 20px;
}
.fulfillment-text > span {
  color: #52617a;
  font-size: 12px;
  line-height: 18px;
}
.description-card h2 {
  margin: 0 0 12px;
  color: #0c1738;
  font-size: 16px;
  line-height: 24px;
}

.product-description {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 19px;
  overflow-wrap: anywhere;
}

.description-card {
  padding: 14px;
}
::v-deep(.description-card .product-description h3) {
  padding: 0;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 26px;
  color: #111827;
}
.product-description :deep(p) {
  font-size: 12px;
  color: #374151;
}
.product-description :deep(p),
.product-description :deep(ul),
.product-description :deep(ol),
.product-description :deep(blockquote),
.product-description :deep(figure) {
  margin: 0 0 8px;
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

.product-description :deep(img) {
  cursor: zoom-in;
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

.bottom-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 20;
  width: 100%;
  max-width: 500px;
  min-height: 68px;
  height: auto;
  transform: translateX(-50%);
  display: grid;
  box-sizing: border-box;
  grid-template-columns: 1fr 1fr 1.15fr;
  gap: 5px;
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.08);
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
  background: #ffffff;
}

.supplier-action :deep(.van-button__text) {
  font-size: 13px;
}
</style>

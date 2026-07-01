<script setup lang="ts">
import type { RawBannerItem } from "@@/apis/banner/type"
import type { RawHomeNavigationItem } from "@@/apis/homeNavigation/type"
import type { RawHotProductItem } from "@@/apis/hotProduct/type"
import { getBannerListApi } from "@@/apis/banner"
import { getHomeNavigationListApi } from "@@/apis/homeNavigation"
import { getHotProductListApi } from "@@/apis/hotProduct"
import { isLoggedIn } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import { onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import homeBanner from "@/assets/home/banner-suppliers.png"
import homeLogo from "@/assets/home/logo.png"
import rankNo1 from "@/assets/home/no_1.png"
import rankNo2 from "@/assets/home/no_2.png"
import rankNo3 from "@/assets/home/no_3.png"

interface ProductItem {
  id: number
  name: string
  image: string
  score: string
  cost: string
  price: string
  profit: string
}

interface BannerItem {
  id: number | string
  title: string
  image: string
  jumpType: BannerJumpType
  jumpValue: string
}

interface ListLikeData<T> {
  data?: T[]
  list?: T[]
  records?: T[]
  rows?: T[]
  items?: T[]
}

interface HomeNavigationItem {
  id: number | string
  title: string
  value: string
  icon: string
  jumpType: string
  jumpValue: string
  color: string
}

type BannerJumpType = "product" | "category" | "link" | "none"
type PointerPoint = {
  x: number
  y: number
}

const router = useRouter()
const loading = ref(false)
const errorText = ref("")
const products = ref<ProductItem[]>([])
const rankBadgeImages = [rankNo1, rankNo2, rankNo3]
const homeNavigations = ref<HomeNavigationItem[]>([
  {
    id: "suppliers",
    title: "Verified Suppliers",
    value: "500+",
    icon: "solar:verified-check-bold-duotone",
    jumpType: "path",
    jumpValue: "/suppliers",
    color: "#246bfe"
  },
  {
    id: "products",
    title: "Products",
    value: "10,000+",
    icon: "solar:clipboard-list-bold-duotone",
    jumpType: "path",
    jumpValue: "/hot-products",
    color: "#06a77d"
  },
  {
    id: "profit",
    title: "Profit Potential",
    value: "₱85.2M+",
    icon: "solar:hand-money-bold-duotone",
    jumpType: "path",
    jumpValue: "/calculator?mode=weight&from=profile",
    color: "#f4a900"
  },
  {
    id: "support",
    title: "Support",
    value: "24/7",
    icon: "solar:headphones-round-sound-bold-duotone",
    jumpType: "path",
    jumpValue: "/procurement-support",
    color: "#246bfe"
  }
])
const banners = ref<BannerItem[]>([
  {
    id: "local-banner",
    title: "YiwuHub banner",
    image: homeBanner,
    jumpType: "link",
    jumpValue: "/suppliers"
  }
])
const bannerDragThreshold = 8
const bannerClickSuppressed = ref(false)
let bannerPressStart: PointerPoint | null = null
let bannerClickResetTimer: number | undefined

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function formatMoney(value: number | string | undefined) {
  return `₱${toNumber(value).toFixed(2)}`
}

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function getDataList<T>(data: T[] | ListLikeData<T>) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.list)) return data.list
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.rows)) return data.rows
  return Array.isArray(data.items) ? data.items : []
}

function normalizeBanner(item: RawBannerItem, index: number): BannerItem {
  return {
    id: item.id ?? index,
    title: String(item.title ?? item.name ?? `Banner ${index + 1}`),
    image: getAssetUrl(String(item.image ?? item.imageUrl ?? item.bannerUrl ?? item.picUrl ?? item.cover ?? item.url ?? "")),
    jumpType: normalizeBannerJumpType(item.jumpType ?? item.targetType ?? item.type),
    jumpValue: getBannerJumpValue(item)
  }
}

function normalizeBannerJumpType(value: string | number | undefined): BannerJumpType {
  const normalizedValue = String(value ?? "").trim().toLowerCase()

  if (["1", "product", "goods", "商品"].includes(normalizedValue)) return "product"
  if (["2", "category", "分类"].includes(normalizedValue)) return "category"
  if (["3", "link", "url", "链接"].includes(normalizedValue)) return "link"
  return "none"
}

function getBannerJumpValue(item: RawBannerItem) {
  const value = item.jumpValue ?? item.targetValue ?? item.value

  if (item.productId !== undefined) return String(item.productId)
  if (item.categoryId !== undefined) return String(item.categoryId)
  if (value !== undefined) return String(value)
  return String(item.linkUrl ?? item.link ?? item.path ?? "")
}

function normalizeHotProduct(item: RawHotProductItem, index: number): ProductItem {
  const price = toNumber(item.price ?? item.phPrice ?? item.salePrice ?? item.sellingPrice)
  const cost = toNumber(item.chinaCost ?? item.chinaPrice ?? item.chinaPriceCny ?? item.cost ?? item.productCost)
  const profit = item.profit !== undefined
    ? toNumber(item.profit)
    : toNumber(item.grossProfit ?? item.estimatedProfit, price - cost)

  return {
    id: toNumber(item.productId ?? item.id ?? item.spuId ?? item.hotProductId, index + 1),
    name: String(item.name ?? item.productName ?? item.goodsName ?? item.title ?? "Unnamed Product"),
    image: getAssetUrl(String(item.image ?? item.imageUrl ?? item.productImage ?? item.mainImage ?? item.picUrl ?? item.cover ?? item.coverUrl ?? "")),
    score: toNumber(item.score ?? item.tiktokScore ?? item.tikTokScore ?? item.hotScore).toFixed(1),
    cost: formatMoney(cost),
    price: formatMoney(price),
    profit: formatMoney(profit)
  }
}

function getRankBadgeImage(index: number) {
  return rankBadgeImages[index % products.value.length] || ""
}

function getProductRank(index: number) {
  return index % products.value.length + 1
}

function handleProductClick(product: ProductItem) {
  router.push({ path: "/product-card", query: { id: product.id } })
}

function handleCustomerServiceClick() {
  router.push("/procurement-support")
}

function handleViewAll() {
  router.push("/hot-products")
}

function handleProfitCalculator(target = "/calculator?mode=weight&from=profile") {
  if (isLoggedIn()) {
    router.push(target)
    return
  }

  router.push({
    path: "/login",
    query: {
      redirect: target
    }
  })
}

function normalizeHomeNavigation(item: RawHomeNavigationItem, index: number): HomeNavigationItem {
  return {
    id: item.id ?? `${item.title || "navigation"}-${index}`,
    title: String(item.title ?? ""),
    value: String(item.value ?? ""),
    icon: String(item.icon || "solar:widget-2-bold-duotone"),
    jumpType: String(item.jumpType || "path").toLowerCase(),
    jumpValue: String(item.jumpValue || ""),
    color: String(item.color || "#246bfe")
  }
}

function handleNavigationClick(item: HomeNavigationItem) {
  if (!item.jumpValue) return

  if (item.jumpValue === "/hot-products") {
    router.push("/hot-products")
    return
  }

  if (item.jumpValue.startsWith("/calculator")) {
    handleProfitCalculator(item.jumpValue)
    return
  }

  if (item.jumpType === "link" || /^https?:\/\//.test(item.jumpValue)) {
    window.location.href = item.jumpValue
    return
  }

  router.push(item.jumpValue)
}

function getPointerPoint(event: MouseEvent | TouchEvent): PointerPoint | null {
  if ("touches" in event) {
    const touch = event.touches[0] || event.changedTouches[0]
    return touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  return { x: event.clientX, y: event.clientY }
}

function handleBannerPressStart(event: MouseEvent | TouchEvent) {
  window.clearTimeout(bannerClickResetTimer)
  bannerPressStart = getPointerPoint(event)
  bannerClickSuppressed.value = false
}

function handleBannerPressMove(event: MouseEvent | TouchEvent) {
  if (!bannerPressStart) return

  const point = getPointerPoint(event)
  if (!point) return

  const movedX = Math.abs(point.x - bannerPressStart.x)
  const movedY = Math.abs(point.y - bannerPressStart.y)

  if (movedX > bannerDragThreshold || movedY > bannerDragThreshold) {
    bannerClickSuppressed.value = true
  }
}

function handleBannerPressEnd() {
  if (!bannerClickSuppressed.value) {
    bannerPressStart = null
    return
  }

  bannerClickResetTimer = window.setTimeout(() => {
    bannerPressStart = null
    bannerClickSuppressed.value = false
  }, 160)
}

function handleBannerClick(banner: BannerItem, event: MouseEvent) {
  if (bannerClickSuppressed.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  if (banner.jumpType === "none" || !banner.jumpValue) return

  if (banner.jumpType === "product") {
    router.push({ path: "/product-card", query: { id: banner.jumpValue } })
  } else if (banner.jumpType === "category") {
    router.push({ path: "/product-list", query: { categoryId: banner.jumpValue } })
  } else if (/^https?:\/\//.test(banner.jumpValue)) {
    window.location.href = banner.jumpValue
  } else {
    router.push(banner.jumpValue)
  }
}

async function getHotProductList() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getHotProductListApi({ hotType: 1 })
    products.value = getDataList(data).map(normalizeHotProduct)
  } catch (error) {
    products.value = []
    errorText.value = error instanceof Error ? error.message : "Failed to load hot products"
  } finally {
    loading.value = false
  }
}

async function getBannerList() {
  try {
    const { data } = await getBannerListApi({ scene: "home" })
    const apiBanners = getDataList(data)
      .filter(item => !item.scene || item.scene === "home")
      .filter(item => item.status === undefined || Number(item.status) === 1)
      .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
      .map(normalizeBanner)
      .filter(item => item.image)

    if (apiBanners.length) banners.value = [banners.value[0], ...apiBanners]
  } catch {
    // Keep the local banner as fallback.
  }
}

async function getHomeNavigationList() {
  try {
    const { data } = await getHomeNavigationListApi()
    const navigationList = getDataList(data)
      .filter(item => item.status === undefined || Number(item.status) === 1)
      .sort((a, b) => toNumber(a.sort) - toNumber(b.sort))
      .map(normalizeHomeNavigation)
      .filter(item => item.title || item.value)

    if (navigationList.length) homeNavigations.value = navigationList
  } catch {
    // Keep the default navigation items when the API is unavailable.
  }
}

onMounted(() => {
  getBannerList()
  getHotProductList()
  getHomeNavigationList()
})

onBeforeUnmount(() => {
  window.clearTimeout(bannerClickResetTimer)
})
</script>

<template>
  <div class="page-home">
    <header class="home-header">
      <img class="home-logo" :src="homeLogo" alt="YiwuHub">
      <button class="service-button" type="button" aria-label="Contact customer service" @click="handleCustomerServiceClick">
        <Icon icon="mdi:customer-service" />
      </button>
    </header>

    <div class="home-banner">
      <van-swipe
        class="home-banner-swipe"
        :autoplay="3500"
        :duration="600"
        :loop="true"
        :show-indicators="false"
        @mousedown="handleBannerPressStart"
        @mousemove="handleBannerPressMove"
        @mouseup="handleBannerPressEnd"
        @mouseleave="handleBannerPressEnd"
        @touchstart.passive="handleBannerPressStart"
        @touchmove.passive="handleBannerPressMove"
        @touchend="handleBannerPressEnd"
      >
        <van-swipe-item
          v-for="banner in banners"
          :key="banner.id"
          class="home-banner-item"
          @click="handleBannerClick(banner, $event)"
        >
          <img :src="banner.image" :alt="banner.title" draggable="false">
          <div v-if="banner.id === 'local-banner'" class="home-banner-copy">
            <h1>
              Find Verified<br>
              China Suppliers
            </h1>
            <h2>
              Grow Your Business in<br>
              the Philippines
            </h2>
            <ul>
              <li>
                <Icon icon="solar:verified-check-bold" />
                Verified Suppliers
              </li>
              <li>
                <Icon icon="solar:calculator-bold" />
                Profit Calculators
              </li>
              <li>
                <Icon icon="solar:shield-check-bold" />
                Fast &amp; Reliable
              </li>
            </ul>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>

    <section
      class="platform-stats"
      :class="{ 'platform-stats--scrollable': homeNavigations.length > 4 }"
      aria-label="Platform statistics"
    >
      <div
        class="platform-stats__track"
        :style="{ '--navigation-count': Math.min(homeNavigations.length, 4) }"
      >
        <button
          v-for="item in homeNavigations"
          :key="item.id"
          class="platform-stat"
          type="button"
          @click="handleNavigationClick(item)"
        >
          <span
            class="platform-stat__icon"
            :style="{ '--navigation-color': item.color }"
          >
            <Icon size="2rem" :icon="item.icon" />
          </span>
          <strong>{{ item.value }}</strong>
          <span>{{ item.title }}</span>
        </button>
      </div>
    </section>

    <section class="today-products">
      <van-loading v-if="loading" class="home-loading" color="#1677ff" />
      <van-empty v-else-if="errorText" image="error" :description="errorText">
        <van-button size="small" type="primary" @click="getHotProductList">
          Retry
        </van-button>
      </van-empty>
      <van-empty v-else-if="products.length === 0" description="No products found" />

      <div v-else class="featured-products">
        <div class="featured-products__heading">
          <div>
            <!-- <span class="featured-products__eyebrow">Trending now</span> -->
            <h2>Trending Products</h2>
          </div>
          <a class="featured-products__view-all" @click="handleViewAll">
            View all
            <Icon icon="weui:arrow-filled" />
          </a>
        </div>
        <div class="product-track">
          <article
            v-for="(item, index) in products.slice(0, 3)"
            :key="item.id"
            class="today-card"
            @click="handleProductClick(item)"
          >
            <div class="today-card__image-wrap">
              <img class="today-card__image" :src="item.image" :alt="item.name">
              <img
                v-if="getRankBadgeImage(index)"
                class="today-card__rank"
                :src="getRankBadgeImage(index)"
                :alt="`No. ${getProductRank(index)}`"
              >
            </div>
            <h3>{{ item.name }}</h3>
            <div class="today-card__row">
              <span>China Cost</span><strong>{{ item.cost }}</strong>
            </div>
            <div class="today-card__row">
              <span>PH Price</span><strong>{{ item.price }}</strong>
            </div>
            <div class="today-card__row">
              <span>Profit / Item</span><strong>{{ item.profit }}</strong>
            </div>
            <!-- <button type="button">
              View Details
            </button> -->
          </article>
        </div>
      </div>
    </section>

    <section class="why-choose">
      <h2>Why Choose YiwuHub?</h2>
      <div class="why-choose__grid">
        <div class="why-choose__item">
          <span class="why-choose__icon">
            <Icon icon="solar:user-id-bold-duotone" />
          </span>
          <strong>Verified Suppliers</strong>
          <span>Factory Direct</span>
        </div>
        <div class="why-choose__item">
          <span class="why-choose__icon">
            <Icon icon="solar:calculator-bold-duotone" />
          </span>
          <strong>Profit Calculator</strong>
          <span>Know Before You Buy</span>
        </div>
        <div class="why-choose__item">
          <span class="why-choose__icon">
            <Icon icon="solar:shield-check-bold-duotone" />
          </span>
          <strong>Logistics Support</strong>
          <span>Door-to-Door Delivery</span>
        </div>
        <div class="why-choose__item">
          <span class="why-choose__icon">
            <Icon icon="solar:shield-star-bold-duotone" />
          </span>
          <strong>Secure &amp; Reliable</strong>
          <span>100% Safe Platform</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-home {
  /* min-height: 100vh; */
  padding: 50px 12px 10px;
  overflow-x: hidden;
  background: #f7faff;
}

.home-header {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 20;
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  padding: 0 12px 0;
  background: #f7faff;
  transform: translateX(-50%);
}

.home-logo {
  width: 118px;
  height: 36px;
  object-fit: contain;
  object-position: left center;
}

.service-button {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1677ff;
  font-size: 24px;
  place-items: center;
}

.home-banner {
  position: relative;
  width: calc(100% + 24px);
  margin-left: -10px;
  overflow: hidden;
  border-radius: 0;
  background: #eaf1ff;
  box-shadow: 0 8px 24px rgba(22, 119, 255, 0.08);
}

.home-banner-swipe {
  width: 100%;
  aspect-ratio: 343 / 220;
}

.home-banner :deep(.van-swipe__track),
.home-banner :deep(.van-swipe-item) {
  width: 100%;
  height: 100%;
}

.home-banner img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  user-select: none;
  -webkit-user-drag: none;
}

.home-banner-item {
  position: relative;
}

.home-banner-copy {
  position: absolute;
  top: 17px;
  left: 17px;
  z-index: 2;
  width: 48%;
  color: #10245d;
  pointer-events: none;
}

.home-banner-copy h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  line-height: 21px;
  letter-spacing: -0.4px;
}

.home-banner-copy h2 {
  margin: 7px 0 9px;
  color: #0756f3;
  font-size: 14px;
  font-weight: 900;
  line-height: 17px;
}

.home-banner-copy ul {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: 5px;
  list-style: none;
}

.home-banner-copy li {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #172554;
  font-size: 8px;
  font-weight: 700;
}

.home-banner-copy li svg {
  width: 12px;
  height: 12px;
  padding: 2px;
  border-radius: 50%;
  background: #e8f1ff;
  color: #1267f6;
}

.platform-stats {
  position: relative;
  z-index: 3;
  margin: -20px 0 0;
  border: 1px solid rgba(219, 228, 244, 0.8);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 7px 20px rgba(42, 73, 122, 0.1);
  overflow: hidden;
}

.platform-stats__track {
  display: grid;
  grid-template-columns: repeat(var(--navigation-count), minmax(0, 1fr));
  gap: 4px;
  padding: 11px 0 10px;
}

.platform-stats--scrollable {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.platform-stats--scrollable::-webkit-scrollbar {
  display: none;
}

.platform-stats--scrollable .platform-stats__track {
  display: flex;
  width: max-content;
  min-width: 100%;
}

.platform-stats--scrollable .platform-stat {
  width: calc((100vw - 26px) / 4);
  flex: 0 0 calc((100vw - 26px) / 4);
  scroll-snap-align: start;
}

.platform-stat {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition: transform 0.16s ease;
  -webkit-tap-highlight-color: transparent;
}

.platform-stat:active {
  transform: scale(0.94);
}

.platform-stat__icon {
  display: grid;
  width: 27px;
  height: 27px;
  margin-bottom: 4px;
  border-radius: 50%;
  font-size: 25px;
  place-items: center;
}

.platform-stat__icon {
  background: color-mix(in srgb, var(--navigation-color) 12%, white);
  color: var(--navigation-color);
}

.platform-stat strong {
  color: #102044;
  font-size: 11px;
  font-weight: 800;
  line-height: 15px;
  white-space: nowrap;
}

.platform-stat > span:last-child {
  overflow: hidden;
  width: 100%;
  margin-top: 2px;
  color: #71809b;
  font-size: 7px;
  line-height: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.today-products {
  margin-top: 5px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}

.section-heading h2 {
  margin: 0;
  color: #172554;
  font-size: 12px;
  font-weight: 600;
}

.section-heading button {
  display: inline-flex;
  align-items: center;
  padding: 6px 0 6px 12px;
  border: 0;
  background: transparent;
  color: #1677ff;
  font-size: 12px;
  font-weight: 700;
}

.home-loading {
  display: flex;
  justify-content: center;
  padding: 52px 0;
}

.featured-products {
  width: 100%;
}

.featured-products__heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 2px 10px;
}

.featured-products__eyebrow {
  display: block;
  margin-bottom: 2px;
  color: #f59e0b;
  font-size: 10px;
  font-weight: 800;
  line-height: 13px;
  text-transform: uppercase;
}

.featured-products__heading h2 {
  margin: 0;
  color: #102044;
  font-weight: 800;
  font-size: 13px;
  line-height: 30px;
}

.featured-products__view-all {
  display: inline-flex;
  height: 30px;
  align-items: center;
  justify-content: center;
  color: #1677ff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  border: none;
}

.featured-products__view-all svg {
  width: 14px;
  height: 14px;
}

.featured-products__view-all:active {
  transform: scale(0.96);
}

.product-track {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 2px 0 12px;
}

.today-card {
  min-width: 0;
  padding: 6px;
  border: 1px solid #e8efff;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.1);
  cursor: pointer;
}

.today-card__image-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
}

.today-card__image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: #f4f7ff;
  object-fit: cover;
}

.today-card__rank {
  position: absolute;
  top: -9px;
  left: -9px;
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.today-card h3 {
  height: 34px;
  padding: 2px 0;
  margin: 3px 0;
  overflow: hidden;
  color: #111827;
  font-size: 11px;
  font-weight: 500;
  line-height: 17px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.today-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  min-height: 19px;
  color: #64748b;
  font-size: 10px;
}

.today-card__row strong {
  color: #172554;
  font-size: 10px;
  white-space: nowrap;
}

.today-card > button {
  width: 100%;
  height: 26px;
  margin-top: 6px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: #1677ff;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
}

.why-choose {
  margin-top: 10px;
  padding: 12px 8px 13px;
  border: 1px solid #e4edff;
  border-radius: 14px;
  background: linear-gradient(135deg, #f7faff 0%, #edf5ff 100%);
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.07);
}

.why-choose h2 {
  margin: 0 0 12px;
  color: #172554;
  font-size: 13px;
  font-weight: 800;
}

.why-choose__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.why-choose__item {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  padding: 0 4px;
  text-align: center;
}

.why-choose__item + .why-choose__item::before {
  position: absolute;
  top: 8px;
  bottom: 5px;
  left: 0;
  width: 1px;
  background: #e1eafd;
  content: "";
}

.why-choose__icon {
  display: grid;
  width: 30px;
  height: 30px;
  margin-bottom: 5px;
  border-radius: 50%;
  background: #eaf2ff;
  color: #246bfe;
  font-size: 21px;
  box-shadow: 0 4px 10px rgba(36, 107, 254, 0.12);
  place-items: center;
}

.why-choose__item strong {
  overflow: hidden;
  width: 100%;
  color: #172554;
  font-size: 8px;
  font-weight: 800;
  line-height: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.why-choose__item > span:last-child {
  overflow: hidden;
  width: 100%;
  margin-top: 2px;
  color: #71809b;
  font-size: 6px;
  line-height: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

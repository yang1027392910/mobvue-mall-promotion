<script setup lang="ts">
import type { HotProductType, RawHotProductItem } from "@@/apis/hotProduct/type"
import { getHotProductListApi } from "@@/apis/hotProduct"
import { Icon } from "@iconify/vue"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import homeLogo from "@/assets/home/logo.png"

interface ProductItem {
  id: number
  name: string
  image: string
  score: string
  cost: string
  price: string
  profit: string
}

const activeTab = ref<HotProductType>(1)
const router = useRouter()
const searchValue = ref("")
const loading = ref(false)
const errorText = ref("")
const homeHeaderRef = ref<HTMLElement | null>(null)
const tabsOffsetTop = ref(0)
let headerResizeObserver: ResizeObserver | null = null

const tabs: Array<{ title: string, name: HotProductType }> = [
  { title: "Today", name: 1 },
  { title: "This Week", name: 2 },
  { title: "This Month", name: 3 },
  { title: "New Alerts", name: 4 }
]

const tabIconMap: Record<HotProductType, string> = {
  1: "solar:fire-bold-duotone",
  2: "solar:calendar-bold-duotone",
  3: "solar:chart-square-bold-duotone",
  4: "solar:bell-bold-duotone"
}

const tabTitleMap: Record<HotProductType, string> = {
  1: "Today",
  2: "Week",
  3: "Month",
  4: "Alerts"
}

const products = ref<ProductItem[]>([])

const filteredProducts = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase()
  if (!keyword) {
    return products.value
  }
  return products.value.filter(item => item.name.toLowerCase().includes(keyword))
})

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function formatMoney(value: number | string | undefined) {
  return `$${toNumber(value).toFixed(2)}`
}

function getProductImage(image?: string) {
  if (!image) return ""
  if (/^https?:\/\//.test(image)) return image
  return `http://localhost:3000${image.startsWith("/") ? image : `/${image}`}`
}

function getHotProductDataList(data: RawHotProductItem[] | {
  data?: RawHotProductItem[]
  list?: RawHotProductItem[]
  records?: RawHotProductItem[]
  rows?: RawHotProductItem[]
  items?: RawHotProductItem[]
}) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.list)) return data.list
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.rows)) return data.rows
  return Array.isArray(data.items) ? data.items : []
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
    image: getProductImage(String(item.image ?? item.imageUrl ?? item.productImage ?? item.mainImage ?? item.picUrl ?? item.cover ?? item.coverUrl ?? "")),
    score: toNumber(item.score ?? item.tiktokScore ?? item.tikTokScore ?? item.hotScore).toFixed(1),
    cost: formatMoney(cost),
    price: formatMoney(price),
    profit: formatMoney(profit)
  }
}

function handleProductClick(product: ProductItem) {
  router.push({
    path: "/product-card",
    query: {
      id: product.id
    }
  })
}

async function getHotProductList() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getHotProductListApi({ hotType: activeTab.value })
    products.value = getHotProductDataList(data).map(normalizeHotProduct)
  } catch (error) {
    products.value = []
    errorText.value = error instanceof Error ? error.message : "Failed to load hot products"
  } finally {
    loading.value = false
  }
}

function updateTabsOffsetTop() {
  tabsOffsetTop.value = homeHeaderRef.value?.offsetHeight || 0
}

async function setupStickyTabsOffset() {
  await nextTick()
  updateTabsOffsetTop()

  if (!homeHeaderRef.value) return

  headerResizeObserver = new ResizeObserver(updateTabsOffsetTop)
  headerResizeObserver.observe(homeHeaderRef.value)
}

onMounted(() => {
  getHotProductList()
  setupStickyTabsOffset()
})

onBeforeUnmount(() => {
  headerResizeObserver?.disconnect()
})

watch(activeTab, () => {
  getHotProductList()
})
</script>

<template>
  <div class="page-home" :style="{ '--home-tabs-top': `${tabsOffsetTop}px` }">
    <div ref="homeHeaderRef" class="home-header">
      <div class="home-title-row">
        <img class="home-logo" :src="homeLogo" alt="YiwuHub">
        <div class="home-actions">
          <button class="points-button" type="button">
            <span class="points-icon">
              <Icon icon="solar:dollar-bold" />
            </span>
            <span class="points-value">1250</span>
            <Icon icon="mingcute:right-line" class="points-arrow" />
          </button>
          <button class="notification-button" type="button">
            <Icon icon="mynaui:bell" class="home-icon" />
            <span class="notification-badge">3</span>
          </button>
        </div>
      </div>
      <!-- <van-search
        v-model:value="searchValue"
        placeholder="Search products or keywords"
        shape="round"
        background="#FFF"
        clearable
        class="home-search"
      /> -->
    </div>

    <van-tabs
      v-model:active="activeTab"
      class="home-tabs"
      color="#1677ff"
      inactive-color="#9aa3b8"
      line-width="28"
      swipeable
    >
      <van-tab
        v-for="tab in tabs"
        :title="tab.title"
        :name="tab.name"
        :key="tab.name"
      >
        <template #title>
          <span class="ranking-tab">
            <Icon class="ranking-tab__icon" :icon="tabIconMap[tab.name]" />
            <span>{{ tabTitleMap[tab.name] }}</span>
          </span>
        </template>
      </van-tab>
    </van-tabs>

    <div class="product-list">
      <van-loading v-if="loading" class="home-loading" color="#1677ff" />

      <van-empty
        v-else-if="errorText"
        image="error"
        :description="errorText"
      >
        <van-button size="small" type="primary" @click="getHotProductList">
          Retry
        </van-button>
      </van-empty>

      <van-empty
        v-else-if="filteredProducts.length === 0"
        description="No products found"
      />

      <template v-else>
        <div
          v-for="(item, index) in filteredProducts"
          :key="item.id"
          class="product-card"
          @click="handleProductClick(item)"
        >
          <div class="product-card-left">
            <div class="product-image-wrap">
              <img class="product-image" :src="item.image" :alt="item.name">
              <span class="product-rank">#{{ index + 1 }}</span>
            </div>
          </div>
          <div class="product-card-right">
            <div class="product-name">
              {{ item.name }}
            </div>
            <div class="product-meta">
              <div class="meta-row">
                <span class="meta-label">TikTok Score</span>
                <span class="meta-value">{{ item.score }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">China Cost</span>
                <span class="meta-value">{{ item.cost }}</span>
              </div>
            </div>
            <div class="product-footer">
              <div class="product-footer-item">
                <span class="footer-label">PH Price</span>
                <span class="footer-value">{{ item.price }}</span>
              </div>
              <div class="product-footer-item">
                <span class="footer-label">Profit</span>
                <span class="footer-value profit">{{ item.profit }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page-home {
  min-height: calc(100vh - 10px);
  padding: 0 16px 88px;
  background: #f7faff;
}
.home-header {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: 0 -16px;
  padding: 18px 16px 8px;
  background: #f7faff;
}
.home-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
}
.home-logo {
  display: block;
  width: 118px;
  height: 36px;
  object-fit: contain;
  object-position: left center;
  flex-shrink: 0;
}
.home-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.points-button,
.notification-button {
  border: 0;
  padding: 0;
  font: inherit;
  background: transparent;
}
.points-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px 0 10px;
  border-radius: 18px;
  color: #1f2937;
  background: #fff4df;
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.14);
}
.points-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 14px;
  background: linear-gradient(180deg, #ffc24b 0%, #f59e0b 100%);
}
.points-value {
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}
.points-arrow {
  color: #d08a12;
  font-size: 14px;
}
.notification-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 36px;
}
.home-icon {
  color: #111827;
  font-size: 23px;
}
.notification-badge {
  position: absolute;
  top: 4px;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border: 2px solid #ffffff;
  border-radius: 999px;
  color: #ffffff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  background: #ef233c;
}
.home-search {
  width: 100%;
}
.home-tabs {
  position: sticky;
  top: calc(var(--home-tabs-top) - 1px);
  z-index: 19;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 14px;
  isolation: isolate;
}
.home-tabs::before {
  position: absolute;
  top: -2px;
  right: -16px;
  bottom: 0;
  left: -16px;
  z-index: -1;
  background: #f7faff;
  content: "";
}
.home-tabs :deep(.van-tabs__wrap) {
  background: #ffffff;
  overflow: hidden;
  border-radius: 14px;
}
.home-tabs :deep(.van-tabs__nav) {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 14px;
  background: #ffffff;
}
.home-tabs :deep(.van-tab) {
  flex: none;
  min-width: 0;
  padding: 0;
}
.ranking-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
.ranking-tab__icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  font-size: 20px;
  flex-shrink: 0;
}
.home-tabs :deep(.van-tab--active) .ranking-tab {
  color: #1677ff;
  font-weight: 700;
}
.home-tabs :deep(.van-tab--active) .ranking-tab__icon {
  color: #1677ff;
}
.home-tabs :deep(.van-tabs__line) {
  width: 24px;
  height: 3px;
  border-radius: 999px;
  background: #1677ff;
}
.home-tabs :deep(.van-tabs__wrap::after),
.home-tabs :deep(.van-tabs__nav::after) {
  display: none;
}
.product-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 88px;
}
.home-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}
.product-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  margin-bottom: 16px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(22, 119, 255, 0.06);
  border: 1px solid #eaf1ff;
  cursor: pointer;
}
.product-card:last-child {
  margin-bottom: 0;
}
.product-card-left {
  flex-shrink: 0;
}
.product-image-wrap {
  position: relative;
  width: 116px;
  height: 116px;
  border-radius: 14px;
  background: #f5f8ff;
  overflow: hidden;
}
.product-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-rank {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  background: #1677ff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}
.product-card-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.product-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  line-height: 22px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.product-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 12px;
}
.meta-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.meta-label {
  color: #64748b;
  font-size: 13px;
  line-height: 17px;
}
.meta-value {
  color: #020617;
  font-size: 15px;
  font-weight: 800;
  line-height: 20px;
}
.product-footer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.product-footer-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.footer-label {
  color: #64748b;
  font-size: 13px;
  line-height: 17px;
}
.footer-value {
  color: #020617;
  font-size: 15px;
  font-weight: 800;
  line-height: 20px;
}
.profit {
  color: #1677ff;
}
</style>

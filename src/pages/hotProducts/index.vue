<script setup lang="ts">
import type { HotProductType, RawHotProductItem } from "@@/apis/hotProduct/type"
import { getHotProductListApi } from "@@/apis/hotProduct"
import { Icon } from "@iconify/vue"
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
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

interface ListLikeData {
  data?: RawHotProductItem[]
  list?: RawHotProductItem[]
  records?: RawHotProductItem[]
  rows?: RawHotProductItem[]
  items?: RawHotProductItem[]
}

const router = useRouter()
const activeTab = ref<HotProductType>(1)
const products = ref<ProductItem[]>([])
const loading = ref(false)
const errorText = ref("")
const rankBadgeImages = [rankNo1, rankNo2, rankNo3]

const tabs: Array<{ title: string, shortTitle: string, name: HotProductType, icon: string }> = [
  { title: "Today", shortTitle: "Today", name: 1, icon: "solar:fire-bold-duotone" },
  { title: "This Week", shortTitle: "Week", name: 2, icon: "solar:calendar-bold-duotone" },
  { title: "This Month", shortTitle: "Month", name: 3, icon: "solar:chart-square-bold-duotone" },
  { title: "New Alerts", shortTitle: "Alerts", name: 4, icon: "solar:bell-bold-duotone" }
]

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function formatMoney(value: number | string | undefined) {
  return `₱${toNumber(value).toFixed(2)}`
}

function getProductImage(image?: string) {
  if (!image) return ""
  if (/^https?:\/\//.test(image)) return image

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${image.replace(/^\//, "")}`
}

function getDataList(data: RawHotProductItem[] | ListLikeData) {
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

function getRankBadgeImage(index: number) {
  return rankBadgeImages[index] || ""
}

function handleProductClick(product: ProductItem) {
  router.push({ path: "/product-card", query: { id: product.id } })
}

async function getHotProductList() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getHotProductListApi({ hotType: activeTab.value })
    products.value = getDataList(data).map(normalizeHotProduct)
  } catch (error) {
    products.value = []
    errorText.value = error instanceof Error ? error.message : "Failed to load hot products"
  } finally {
    loading.value = false
  }
}

watch(activeTab, getHotProductList, { immediate: true })
</script>

<template>
  <div class="hot-products-page">
    <van-nav-bar
      title="Hot Products"
      left-arrow
      fixed
      placeholder
      @click-left="router.back()"
    />

    <div class="hot-tabs" role="tablist" aria-label="Product ranking filters">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="hot-tab"
        :class="{ 'hot-tab--active': activeTab === tab.name }"
        type="button"
        role="tab"
        :aria-label="tab.title"
        :aria-selected="activeTab === tab.name"
        @click="activeTab = tab.name"
      >
        <Icon :icon="tab.icon" />
        <span>{{ tab.shortTitle }}</span>
      </button>
    </div>

    <main class="hot-list">
      <van-loading v-if="loading" class="page-loading" color="#1677ff" />
      <van-empty v-else-if="errorText" image="error" :description="errorText">
        <van-button size="small" type="primary" @click="getHotProductList">
          Retry
        </van-button>
      </van-empty>
      <van-empty v-else-if="products.length === 0" description="No products found" />

      <template v-else>
        <article
          v-for="(item, index) in products"
          :key="item.id"
          class="product-card"
          @click="handleProductClick(item)"
        >
          <div class="product-image-wrap">
            <img class="product-image" :src="item.image" :alt="item.name">
            <img
              v-if="getRankBadgeImage(index)"
              class="product-rank"
              :src="getRankBadgeImage(index)"
              :alt="`No. ${index + 1}`"
            >
          </div>

          <div class="product-info">
            <h2>{{ item.name }}</h2>
            <div class="product-metrics">
              <div><span>TikTok Score</span><strong>{{ item.score }}</strong></div>
              <div><span>China Cost</span><strong>{{ item.cost }}</strong></div>
              <div><span>PH Price</span><strong>{{ item.price }}</strong></div>
              <div><span>Profit / Item</span><strong class="profit">{{ item.profit }}</strong></div>
            </div>
          </div>
        </article>
      </template>
    </main>
  </div>
</template>

<style scoped>
.hot-products-page {
  min-height: 100vh;
  background: #f7faff;
}

.hot-products-page :deep(.van-nav-bar__title) {
  color: #172554;
  font-weight: 800;
}

.hot-products-page :deep(.van-nav-bar .van-icon) {
  color: #172554;
}

.hot-tabs {
  position: sticky;
  top: 46px;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 10px 12px;
  background: rgba(247, 250, 255, 0.96);
  backdrop-filter: blur(12px);
}

.hot-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 0;
  height: 36px;
  padding: 0 4px;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.hot-tab svg {
  width: 18px;
  height: 18px;
}

.hot-tab--active {
  background: #1677ff;
  color: #ffffff;
  font-weight: 800;
  box-shadow: 0 7px 16px rgba(22, 119, 255, 0.2);
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 12px 24px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.product-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8efff;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 7px 20px rgba(22, 119, 255, 0.07);
  cursor: pointer;
}

.product-card:active {
  transform: scale(0.985);
}

.product-image-wrap {
  position: relative;
  width: 112px;
  height: 112px;
  flex: 0 0 112px;
}

.product-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: #f4f7ff;
  object-fit: cover;
}

.product-rank {
  position: absolute;
  top: -11px;
  left: -9px;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.product-info {
  min-width: 0;
  flex: 1;
}

.product-info h2 {
  margin: 1px 0 9px;
  overflow: hidden;
  color: #111827;
  font-size: 14px;
  line-height: 20px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px 10px;
}

.product-metrics div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.product-metrics span {
  color: #64748b;
  font-size: 10px;
}

.product-metrics strong {
  overflow: hidden;
  color: #172554;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-metrics .profit {
  color: #1677ff;
}
</style>

<script setup lang="ts">
import type { ProductItem, RawProductItem } from "@@/apis/products/type"
import { getProductListApi } from "@@/apis/products"
import { requireLogin } from "@@/utils/guest-access"
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

type FilterTab = "all" | "best" | "newest" | "price"

const route = useRoute()
const router = useRouter()

const activeTab = ref<FilterTab>("all")
const priceAsc = ref(true)
const showFilterPopup = ref(false)
const loading = ref(false)
const errorText = ref("")

const categoryId = computed(() => route.query.categoryId ? Number(route.query.categoryId) : undefined)
const categoryName = computed(() => String(route.query.categoryName || "All Products"))
const products = ref<ProductItem[]>([])

const tabs: Array<{ label: string, value: FilterTab }> = [
  { label: "All", value: "all" },
  { label: "Best Sellers", value: "best" },
  { label: "Newest", value: "newest" },
  { label: "Price", value: "price" }
]

const sortedProducts = computed(() => {
  const list = [...products.value]

  if (activeTab.value === "best") {
    return list.sort((a, b) => b.sales - a.sales)
  }

  if (activeTab.value === "newest") {
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  if (activeTab.value === "price") {
    return list.sort((a, b) => priceAsc.value ? a.phPrice - b.phPrice : b.phPrice - a.phPrice)
  }

  return list
})

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function getProductImage(image?: string) {
  if (!image) return ""
  if (/^https?:\/\//.test(image)) return image

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${image.replace(/^\//, "")}`
}

function getProductDataList(data: RawProductItem[] | { list?: RawProductItem[] }) {
  if (Array.isArray(data)) return data
  return Array.isArray(data.list) ? data.list : []
}

function normalizeProduct(item: RawProductItem): ProductItem {
  return {
    id: toNumber(item.id ?? item.productId),
    categoryId: toNumber(item.categoryId),
    name: String(item.name ?? item.productName ?? item.title ?? ""),
    image: getProductImage(String(item.image ?? item.imageUrl ?? item.cover ?? "")),
    phPrice: toNumber(item.phPrice ?? item.price),
    isFavorite: Boolean(item.isFavorite ?? item.favorite ?? false),
    sales: toNumber(item.sales ?? item.salesVolume),
    createdAt: String(item.createdAt ?? item.createTime ?? "")
  }
}

async function getProductList() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getProductListApi(categoryId.value ? { categoryId: categoryId.value } : {})
    products.value = getProductDataList(data).map(normalizeProduct).filter(item => item.id && item.name)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Failed to load products"
  } finally {
    loading.value = false
  }
}

function handleBack() {
  router.back()
}

function handleSearch() {
  router.push("/search")
}

function handleFilter() {
  showFilterPopup.value = true
}

function handleTabClick(tab: FilterTab) {
  if (tab === "price" && activeTab.value === "price") {
    priceAsc.value = !priceAsc.value
  }
  activeTab.value = tab
}

function handleProductClick(product: ProductItem) {
  router.push({
    path: "/product-card",
    query: {
      id: product.id
    }
  })
}

function toggleFavorite(product: ProductItem) {
  if (!requireLogin(router)) return

  product.isFavorite = !product.isFavorite
}

onMounted(() => {
  getProductList()
})

watch(categoryId, () => {
  getProductList()
})
</script>

<template>
  <div class="product-list-page">
    <div class="product-list-content">
      <van-loading
        v-if="loading"
        class="product-loading"
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
          @click="getProductList"
        >
          Retry
        </van-button>
      </van-empty>

      <template v-else>
        <div class="filter-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="filter-tab"
            :class="{ 'filter-tab--active': activeTab === tab.value }"
            type="button"
            @click="handleTabClick(tab.value)"
          >
            <span>{{ tab.label }}</span>
            <span v-if="tab.value === 'price'" class="price-arrows">
              <van-icon name="arrow-up" :class="{ active: activeTab === 'price' && priceAsc }" />
              <van-icon name="arrow-down" :class="{ active: activeTab === 'price' && !priceAsc }" />
            </span>
          </button>
        </div>

        <div class="product-grid">
          <div
            v-for="item in sortedProducts"
            :key="item.id"
            class="product-card"
            @click="handleProductClick(item)"
          >
            <div class="product-image-wrap">
              <img v-if="item.image" class="product-image" :src="item.image" :alt="item.name">
              <div v-else class="product-image-placeholder" />
            </div>

            <div class="product-info">
              <div class="product-name">
                {{ item.name }}
              </div>
              <div class="product-bottom">
                <div class="product-price">
                  ₱{{ item.phPrice.toFixed(2) }}
                </div>
                <button
                  class="favorite-button"
                  type="button"
                  :aria-label="item.isFavorite ? 'Remove favorite' : 'Add favorite'"
                  @click.stop="toggleFavorite(item)"
                >
                  <van-icon :name="item.isFavorite ? 'like' : 'heart-o'" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <van-empty v-if="sortedProducts.length === 0" description="No products found" />
      </template>
    </div>

    <van-popup
      v-model:show="showFilterPopup"
      position="bottom"
      round
      class="filter-popup"
    >
      <div class="filter-panel">
        <div class="filter-panel-title">
          Filter
        </div>
        <div class="filter-panel-row">
          More filters coming soon
        </div>
        <van-button type="primary" block round color="#2563eb" @click="showFilterPopup = false">
          Done
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.product-list-page {
  min-height: 100vh;
  background: #ffffff;
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

.product-list-content {
  padding: 0 12px;
}

.product-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.filter-tabs {
  position: sticky;
  top: 5px;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  margin: -2px -4px 16px;
  background: #ffffff;
  padding: 4px;
}

.filter-tab {
  position: relative;
  min-width: 0;
  height: 38px;
  border: 0;
  background: transparent;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 2px;
}

.filter-tab::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 22px;
  height: 3px;
  border-radius: 999px;
  background: transparent;
  transform: translateX(-50%);
}

.filter-tab--active {
  color: #2563eb;
}

.filter-tab--active::after {
  background: #2563eb;
}

.price-arrows {
  display: inline-flex;
  flex-direction: column;
  font-size: 9px;
  line-height: 1;
}

.price-arrows .active {
  color: #2563eb;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.product-card {
  overflow: hidden;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(17, 24, 39, 0.08);
}

.product-image-wrap {
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
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

.product-info {
  padding: 10px;
}

.product-name {
  min-height: 40px;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  margin-top: 8px;
  gap: 8px;
}

.product-price {
  color: #ff3b30;
  font-size: 16px;
  font-weight: 700;
}

.favorite-button {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: #f9fafb;
  color: #ff3b30;
  font-size: 18px;
  display: inline-grid;
  place-items: center;
  padding: 0;
}

.filter-panel {
  padding: 18px 16px 24px;
}

.filter-panel-title {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.filter-panel-row {
  margin: 16px 0 20px;
  color: #6b7280;
  font-size: 14px;
}
</style>

<script setup lang="ts">
import type { ProductItem, RawProductItem } from "@@/apis/products/type"
import { getProductListApi } from "@@/apis/products"
import { requireLogin } from "@@/utils/guest-access"
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import ProductCard from "@/components/ProductCard/index.vue"

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
  { label: "Best Sellers", value: "best" }
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
  const chinaCost = toNumber(item.chinaCost ?? item.chinaPrice)
  const phPrice = toNumber(item.phPrice ?? item.price)

  return {
    id: toNumber(item.id ?? item.productId),
    categoryId: toNumber(item.categoryId),
    name: String(item.name ?? item.productName ?? item.title ?? ""),
    image: getProductImage(String(item.image ?? item.imageUrl ?? item.cover ?? "")),
    chinaCost,
    phPrice,
    profit: item.profit === undefined ? phPrice - chinaCost : toNumber(item.profit),
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
          <ProductCard
            v-for="item in sortedProducts"
            :key="item.id"
            layout="grid"
            :show-favorite="false"
            :product="{
              id: item.id,
              title: item.name,
              image: item.image,
              chinaCost: item.chinaCost,
              price: item.phPrice,
              profit: item.profit,
              currency: '\u20B1',
              isFavorite: item.isFavorite,
            }"
            @click="handleProductClick(item)"
            @favorite="toggleFavorite(item)"
          />
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
  top: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  margin: 0 -12px 16px;
  background: #ffffff;
  padding: 6px 16px 5px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
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

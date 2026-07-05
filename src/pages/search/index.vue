<script setup lang="ts">
import type { RawProductItem } from "@@/apis/products/type"
import { favoriteClickApi } from "@@/apis/favorite"
import { searchProductApi } from "@@/apis/products"
import { requireLogin } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import noDateImage from "@/assets/serch/no_date.png"

interface SearchProduct {
  id: number
  name: string
  image: string
  minOrder: number
  price: number
  profit: number
  profitRate: number
  isFavorite: boolean
}

interface ListLikeData<T> {
  data?: T[]
  list?: T[]
  records?: T[]
  rows?: T[]
  items?: T[]
  total?: number
}

const route = useRoute()
const router = useRouter()

const keyword = ref(String(route.query.keyword || ""))
const searchedKeyword = ref(keyword.value.trim())
const products = ref<SearchProduct[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const recentSearchStorageKey = "yiwuhub_recent_searches"
const popularSearches = ["Toy", "Pet", "Kitchen", "Beauty", "Electronic", "Bag"]
const loading = ref(false)
const loadingMore = ref(false)
const errorText = ref("")
const hasSearched = ref(Boolean(searchedKeyword.value))
const recentSearches = ref<string[]>([])
const favoriteLoadingIds = ref<number[]>([])

const hasMore = computed(() => products.value.length < total.value)
const resultText = computed(() => {
  if (!searchedKeyword.value) return "Search products"
  return `"${searchedKeyword.value}"`
})

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function getAssetUrl(url?: string | string[]) {
  const image = Array.isArray(url) ? url[0] : url
  if (!image) return ""
  if (/^https?:\/\//.test(image)) return image

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${image.replace(/^\//, "")}`
}

function getDataList<T>(data: T[] | ListLikeData<T>) {
  if (Array.isArray(data)) {
    return {
      list: data,
      total: data.length
    }
  }

  const list = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.list)
      ? data.list
      : Array.isArray(data.records)
        ? data.records
        : Array.isArray(data.rows)
          ? data.rows
          : Array.isArray(data.items)
            ? data.items
            : []

  return {
    list,
    total: toNumber(data.total, list.length)
  }
}

function normalizeProduct(item: RawProductItem): SearchProduct {
  const price = toNumber(item.phPrice ?? item.price)
  const profit = toNumber(item.profit)
  const profitRate = item.profitRate !== undefined || item.profitMargin !== undefined
    ? toNumber(item.profitRate ?? item.profitMargin)
    : price > 0
      ? Math.round((profit / price) * 100)
      : 0

  return {
    id: toNumber(item.id ?? item.productId),
    name: String(item.name ?? item.productName ?? item.title ?? "Unnamed Product"),
    image: getAssetUrl(item.image ?? item.imageUrl ?? item.cover ?? item.images),
    minOrder: toNumber(item.minimumOrderQuantity ?? item.minOrderQuantity ?? item.minOrder ?? item.moq ?? item.stock),
    price,
    profit,
    profitRate,
    isFavorite: Boolean(item.isFavorite ?? item.favorite ?? false)
  }
}

function formatMoney(value: number) {
  return `\u20B1${value.toFixed(2)}`
}

function handleClear() {
  keyword.value = ""
}

function getStoredRecentSearches() {
  try {
    const value = window.localStorage.getItem(recentSearchStorageKey)
    if (value === null) return null
    const parsedValue: unknown = value ? JSON.parse(value) : []
    return Array.isArray(parsedValue)
      ? parsedValue.map(item => String(item).trim()).filter(Boolean).slice(0, 8)
      : []
  } catch {
    return null
  }
}

function saveRecentSearches(nextSearches: string[]) {
  recentSearches.value = nextSearches
  window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(nextSearches))
}

function addRecentSearch(value: string) {
  const nextKeyword = value.trim()
  if (!nextKeyword) return

  saveRecentSearches([
    nextKeyword,
    ...recentSearches.value.filter(item => item.toLowerCase() !== nextKeyword.toLowerCase())
  ].slice(0, 8))
}

function handleRecentSearch(value: string) {
  keyword.value = value
  searchProducts()
}

function removeRecentSearch(value: string) {
  saveRecentSearches(recentSearches.value.filter(item => item !== value))
}

function clearRecentSearches() {
  saveRecentSearches([])
}

function handleProductClick(product: SearchProduct) {
  router.push({
    path: "/product-card",
    query: {
      id: product.id
    }
  })
}

async function handleFavorite(product: SearchProduct) {
  if (!requireLogin(router)) return
  if (favoriteLoadingIds.value.includes(product.id)) return

  favoriteLoadingIds.value = [...favoriteLoadingIds.value, product.id]

  try {
    await favoriteClickApi({
      productId: product.id
    })
    product.isFavorite = !product.isFavorite
  } finally {
    favoriteLoadingIds.value = favoriteLoadingIds.value.filter(id => id !== product.id)
  }
}

async function searchProducts(reset = true) {
  const nextKeyword = keyword.value.trim()
  if (!nextKeyword) {
    searchedKeyword.value = ""
    products.value = []
    total.value = 0
    hasSearched.value = false
    return
  }

  if (loading.value || loadingMore.value) return

  hasSearched.value = true
  searchedKeyword.value = nextKeyword
  errorText.value = ""

  if (reset) {
    page.value = 1
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const { data } = await searchProductApi({
      keyword: nextKeyword,
      page: page.value,
      pageSize
    })
    const result = getDataList(data)
    const nextProducts = result.list.map(normalizeProduct).filter(item => item.id && item.name)

    products.value = reset ? nextProducts : [...products.value, ...nextProducts]
    total.value = result.total
    if (reset) addRecentSearch(nextKeyword)
    if (nextProducts.length > 0) page.value += 1

    router.replace({
      path: "/search",
      query: {
        keyword: nextKeyword
      }
    })
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Search failed"
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function handleScroll() {
  if (!hasMore.value || loading.value || loadingMore.value) return
  const scrollBottom = window.innerHeight + window.scrollY
  const triggerLine = document.documentElement.scrollHeight - 120
  if (scrollBottom >= triggerLine) searchProducts(false)
}

onMounted(() => {
  const storedRecentSearches = getStoredRecentSearches()
  recentSearches.value = storedRecentSearches ?? []
  window.addEventListener("scroll", handleScroll, { passive: true })
  if (keyword.value.trim()) searchProducts()
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll)
})
</script>

<template>
  <div class="search-page">
    <header class="search-header">
      <form class="search-box" action="" @submit.prevent="searchProducts()">
        <input
          v-model.trim="keyword"
          type="text"
          enterkeyhint="search"
          placeholder="Search products"
        >
        <button v-if="keyword" class="search-clear" type="button" aria-label="Clear search" @click="handleClear">
          <Icon icon="mdi:close" />
        </button>
        <button class="search-submit" type="submit" aria-label="Search">
          <Icon icon="solar:magnifer-linear" />
        </button>
      </form>
    </header>

    <main class="search-content">
      <div v-if="searchedKeyword" class="search-summary">
        <strong>{{ resultText }}</strong>
        <span>{{ total }} results</span>
      </div>

      <section v-if="!hasSearched && !loading" class="search-initial">
        <div v-if="recentSearches.length" class="recent-searches">
          <div class="recent-searches__heading">
            <h2>Recent Searches</h2>
            <button
              type="button"
              @click="clearRecentSearches"
            >
              Clear
            </button>
          </div>
          <div class="recent-searches__chips">
            <button
              v-for="item in recentSearches"
              :key="item"
              class="recent-chip"
              type="button"
              @click="handleRecentSearch(item)"
            >
              <span>{{ item }}</span>
              <Icon
                icon="mdi:close"
                @click.stop="removeRecentSearch(item)"
              />
            </button>
          </div>
        </div>

        <div class="popular-searches">
          <div class="recent-searches__heading">
            <h2>Popular Searches</h2>
          </div>
          <div class="recent-searches__chips">
            <button
              v-for="item in popularSearches"
              :key="item"
              class="popular-chip"
              type="button"
              @click="handleRecentSearch(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="search-empty-state" aria-hidden="true">
          <img class="search-empty-illustration" :src="noDateImage" alt="">
          <h2>Search for products</h2>
          <p>
            Find what you need
            from China
          </p>
        </div>
      </section>

      <van-loading v-if="loading" class="search-loading" color="#1677ff" />

      <van-empty
        v-else-if="errorText"
        image="error"
        :description="errorText"
      >
        <van-button size="small" type="primary" @click="searchProducts()">
          Retry
        </van-button>
      </van-empty>

      <van-empty
        v-else-if="hasSearched && products.length === 0"
        description="No products found"
      />

      <section v-else-if="hasSearched" class="search-results">
        <article
          v-for="item in products"
          :key="item.id"
          class="search-result-card"
          @click="handleProductClick(item)"
        >
          <div class="search-result-card__image">
            <img v-if="item.image" :src="item.image" :alt="item.name">
            <Icon v-else icon="solar:box-minimalistic-linear" />
          </div>
          <div class="search-result-card__body">
            <h3>{{ item.name }}</h3>
            <p>Min Order: {{ item.minOrder }} pcs</p>
            <div class="search-result-card__profit">
              <span v-if="item.profit > 0">Profit {{ formatMoney(item.profit) }}</span>
              <span v-if="item.profitRate > 0">{{ item.profitRate }}%</span>
            </div>
          </div>
          <button
            class="search-result-card__favorite"
            :class="{ 'is-favorite': item.isFavorite }"
            type="button"
            :aria-label="item.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
            @click.stop="handleFavorite(item)"
          >
            <van-loading
              v-if="favoriteLoadingIds.includes(item.id)"
              size="18px"
              color="#f04b0b"
            />
            <Icon
              v-else
              :icon="item.isFavorite ? 'solar:heart-bold' : 'solar:heart-linear'"
            />
          </button>
        </article>

        <van-loading v-if="loadingMore" class="search-loading-more" size="18px" color="#1677ff" />
        <p v-else-if="hasSearched && products.length > 0 && !hasMore" class="search-end">
          No more results
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #ffffff;
  color: #101828;
}

.search-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: block;
  padding: 8px 10px 8px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}

.search-box {
  height: 40px;
  border: 1px solid #d7dce6;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  background: #f9fafc;
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: 0;
  padding: 0 5px;
  color: #101828;
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  background: transparent;
  outline: none;
}

.search-clear {
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  padding: 0;
  color: #ffffff;
  font-size: 14px;
  background: #98a2b3;
}

.search-submit {
  width: 24px;
  height: 24px;
  border: 0;
  display: grid;
  place-items: center;
  padding: 0;
  color: #98a2b3;
  font-size: 21px;
  background: transparent;
}

.search-content {
  padding: 5px 18px 26px;
}

.search-summary {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 16px;
  font-size: 16px;
  line-height: 24px;
}

.search-summary strong {
  color: #101828;
  font-weight: 800;
}

.search-summary span {
  color: #667085;
}

.search-initial {
  min-height: calc(100vh - 92px);
  display: flex;
  flex-direction: column;
}

.recent-searches__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.recent-searches__heading h2 {
  margin: 0;
  color: #101828;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
}

.recent-searches__heading button {
  border: 0;
  padding: 0;
  color: #1677ff;
  font: inherit;
  font-size: 16px;
  line-height: 24px;
  background: transparent;
}

.recent-searches__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
}

.recent-chip {
  max-width: 100%;
  height: 30px;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 3px;
  color: #101828;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
  background: #f2f5fb;
}

.recent-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-chip svg {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  color: #98a2b3;
}

.popular-searches {
  margin-top: 10px;
  margin-bottom: 38px;
}

.popular-chip {
  height: 34px;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  padding: 0 3px;
  color: #1677ff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 34px;
  background: #eef6ff;
}

.search-empty-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.search-empty-illustration {
  width: 176px;
  height: auto;
  margin-bottom: 20px;
  object-fit: contain;
}

.search-empty-state h2 {
  margin: 0;
  color: #101828;
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
}

.search-empty-state p {
  width: 100%;
  margin: 10px 0 0;
  color: #667085;
  font-size: 14px;
  line-height: 20px;
}

.search-results {
  display: grid;
  gap: 10px;
}

.search-result-card {
  position: relative;
  min-width: 0;
  min-height: 116px;
  border: 1px solid #edf0f5;
  border-radius: 18px;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) 32px;
  gap: 14px;
  align-items: center;
  padding: 10px 12px;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(16, 24, 40, 0.04);
}

.search-result-card__image {
  width: 96px;
  height: 96px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #98a2b3;
  font-size: 28px;
  background: #f4f6f8;
}

.search-result-card__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.search-result-card__body {
  min-width: 0;
}

.search-result-card__body h3 {
  margin: 0 0 2px;
  overflow: hidden;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.search-result-card__body p {
  margin: 0;
  color: #667085;
  font-size: 13px;
  line-height: 18px;
}

.search-result-card__profit {
  display: flex;
  margin-top: 4px;
  flex-wrap: wrap;
  gap: 6px;
}

.search-result-card__profit span {
  display: inline-flex;
  height: 24px;
  align-items: center;
  color: #f04b0b;
  font-size: 15px;
  font-weight: 600;
  background: #fff1e8;
}

.search-result-card__favorite {
  width: 32px;
  height: 32px;
  border: 0;
  display: grid;
  place-items: center;
  padding: 0;
  color: #98a2b3;
  font-size: 25px;
  background: transparent;
}

.search-result-card__favorite.is-favorite {
  color: #f04b0b;
}

.search-loading {
  display: flex;
  justify-content: center;
  padding: 70px 0;
}

.search-loading-more {
  display: flex;
  justify-content: center;
  padding: 16px 0 4px;
}

.search-end {
  margin: 18px 0 4px;
  color: #667085;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}

@media (max-width: 360px) {
  .search-header {
    padding-right: 14px;
    padding-left: 14px;
  }

  .search-content {
    padding-right: 14px;
    padding-left: 14px;
  }

  .search-result-card {
    grid-template-columns: 86px minmax(0, 1fr) 28px;
    gap: 10px;
  }

  .search-result-card__image {
    width: 86px;
    height: 86px;
  }

  .recent-searches__chips {
    gap: 6px;
  }

  .recent-chip {
    height: 32px;
    padding: 0 12px;
    font-size: 14px;
  }
}
</style>

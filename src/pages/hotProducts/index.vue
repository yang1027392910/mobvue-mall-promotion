<script setup lang="ts">
import type { HotProductType, RawHotProductItem } from "@@/apis/hotProduct/type"
import { favoriteClickApi } from "@@/apis/favorite"
import { getHotProductListApi } from "@@/apis/hotProduct"
import { requireLogin } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import { showFailToast, showSuccessToast } from "vant"
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
import rankNo1 from "@/assets/home/no_1.png"
import rankNo2 from "@/assets/home/no_2.png"
import rankNo3 from "@/assets/home/no_3.png"
import ProductSaleType from "@/components/ProductSaleType/index.vue"
import { useCartStore } from "@/pinia/stores/cart"

interface ProductItem {
  saleType?: number | string | null
  id: number
  name: string
  image: string
  rank: number
  soldCount: number | null
  rating: string | null
  price: string
  currentPrice: number
  originalPrice: string
  discount: number
  categoryName: string
  categoryIcon: string
  categoryTone: string
  isFavorite: boolean
  favoriteLoading: boolean
}

interface ListLikeData {
  data?: RawHotProductItem[]
  list?: RawHotProductItem[]
  records?: RawHotProductItem[]
  rows?: RawHotProductItem[]
  items?: RawHotProductItem[]
}

const router = useRouter()
const cart = useCartStore()
const activeTab = ref<HotProductType>(1)
const products = ref<ProductItem[]>([])
const loading = ref(false)
const errorText = ref("")
const rankBadgeImages = [rankNo1, rankNo2, rankNo3]

const tabs: Array<{ title: string, shortTitle: string, subtitle: string, name: HotProductType, icon: string }> = [
  { title: "Today", shortTitle: "Today", subtitle: "Hot right now", name: 1, icon: "solar:fire-bold-duotone" },
  { title: "This Week", shortTitle: "Week", subtitle: "This week", name: 2, icon: "solar:calendar-bold-duotone" },
  { title: "This Month", shortTitle: "Month", subtitle: "This month", name: 3, icon: "solar:chart-square-bold-duotone" },
  { title: "New Alerts", shortTitle: "Alerts", subtitle: "New arrivals", name: 4, icon: "solar:bell-bold-duotone" }
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

const categoryStyles: Record<string, { tone: string }> = {
  fashion: { tone: "fashion" },
  electronics: { tone: "electronics" },
  beauty: { tone: "beauty" },
  home: { tone: "home" },
  toys: { tone: "toys" },
  shoes: { tone: "fashion" },
  bags: { tone: "beauty" },
  kitchen: { tone: "home" }
}

function normalizeHotProduct(item: RawHotProductItem, index: number): ProductItem {
  const price = toNumber(item.currentPrice ?? item.price ?? item.phPrice ?? item.salePrice ?? item.sellingPrice, Number.NaN)
  const phPrice = item.phPrice == null || String(item.phPrice).trim() === "" ? Number.NaN : toNumber(item.phPrice, Number.NaN)
  const profit = item.profit == null || String(item.profit).trim() === "" ? Number.NaN : toNumber(item.profit, Number.NaN)
  const originalPrice = Math.round((phPrice + profit) * 100) / 100
  const soldCount = toNumber(item.sold ?? item.soldCount ?? item.sales ?? item.salesVolume, Number.NaN)
  const rating = toNumber(item.rating, Number.NaN)
  const categoryName = String(item.categoryName ?? (typeof item.category === "string" ? item.category : item.category?.categoryName ?? item.category?.name) ?? "").trim()
  const categoryStyle = categoryStyles[categoryName.toLowerCase()]
  const rank = toNumber(item.rank, index + 1)
  const hasDiscount = Number.isFinite(price) && price >= 0 && Number.isFinite(originalPrice) && originalPrice > price

  return {
    id: toNumber(item.productId ?? item.spuId ?? item.id),
    saleType: item.saleType,
    name: String(item.name ?? item.productName ?? item.goodsName ?? item.title ?? "Unnamed Product"),
    image: getProductImage(String(item.image ?? item.imageUrl ?? item.productImage ?? item.mainImage ?? item.picUrl ?? item.cover ?? item.coverUrl ?? "")),
    rank: Number.isSafeInteger(rank) && rank > 0 ? rank : index + 1,
    rating: Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : null,
    soldCount: Number.isSafeInteger(soldCount) && soldCount >= 0 ? soldCount : null,
    price: Number.isFinite(price) && price >= 0 ? formatMoney(price) : "Price unavailable",
    currentPrice: price,
    originalPrice: hasDiscount ? formatMoney(originalPrice) : "",
    discount: hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0,
    categoryName,
    categoryIcon: getProductImage(String(item.categoryIcon ?? "").trim()),
    categoryTone: categoryStyle?.tone ?? "neutral",
    isFavorite: item.isFavorite === true || item.isFavorite === 1 || item.isFavorite === "1" || item.isFavorite === "true",
    favoriteLoading: false
  }
}

async function handleAddToCart(product: ProductItem) {
  if (cart.busy || !requireLogin(router)) return
  const added = await cart.add({ id: product.id, title: product.name, image: product.image, price: product.currentPrice })
  if (added) showSuccessToast("Added to cart")
  else showFailToast(cart.errorText || "Unable to add this product. Please try again.")
}

async function toggleFavorite(product: ProductItem) {
  if (product.favoriteLoading || !Number.isSafeInteger(product.id) || product.id <= 0 || !requireLogin(router)) return
  product.favoriteLoading = true
  try {
    await favoriteClickApi({ productId: product.id })
    product.isFavorite = !product.isFavorite
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : "Unable to update favorite. Please try again.")
  } finally {
    product.favoriteLoading = false
  }
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
    <div class="hot-tabs" aria-label="Product ranking filters">
      <button v-for="tab in tabs" :key="tab.name" class="hot-tab" :class="{ 'hot-tab--active': activeTab === tab.name }" type="button" :aria-label="tab.title" :aria-pressed="activeTab === tab.name" @click="activeTab = tab.name">
        <Icon :icon="tab.icon" />
        <span class="tab-copy"><strong>{{ tab.shortTitle }}</strong></span>
      </button>
    </div>
    <main class="hot-list" :aria-busy="loading">
      <div v-if="loading" class="loading-state" role="status" aria-label="Loading hot products">
        <div v-for="index in 4" :key="index" class="skeleton-card" aria-hidden="true">
          <div class="skeleton-image" />
          <div class="skeleton-copy">
            <i /><i /><i /><i />
          </div>
        </div>
        <span class="loading-label">Finding hot products…</span>
      </div>
      <van-empty v-else-if="errorText" image="error" :description="errorText">
        <van-button size="small" type="primary" round @click="getHotProductList">
          Try again
        </van-button>
      </van-empty>
      <van-empty v-else-if="products.length === 0" description="No trending products yet. Check back soon!" />
      <template v-else>
        <!-- <div class="list-heading">
          <h1>{{ tabs.find(tab => tab.name === activeTab)?.title }} picks</h1>
          <span>{{ products.length }} products</span>
        </div> -->
        <article v-for="item in products" :key="item.id" class="product-card">
          <button class="product-image-wrap" type="button" :aria-label="`View ${item.name}`" @click="handleProductClick(item)">
            <ProductSaleType class="product-sale-type" :sale-type="item.saleType" compact />
            <van-image class="product-image" :src="item.image" :alt="item.name" fit="cover">
              <template #error>
                <Icon icon="solar:gallery-bold-duotone" />
              </template>
            </van-image>
            <img v-if="item.rank <= 3" class="product-rank product-rank-image" :src="rankBadgeImages[item.rank - 1]" :alt="`Rank #${item.rank}`">
          </button>
          <div class="product-info">
            <h2>
              <button class="product-name" type="button" @click="handleProductClick(item)">
                {{ item.name }}
              </button>
            </h2>
            <div class="product-social">
              <span v-if="item.rating !== null" class="product-rating" :aria-label="`Rating: ${item.rating}`">
                <Icon icon="solar:star-bold" aria-hidden="true" /><strong>{{ item.rating }}</strong>
              </span>
              <span class="sold-count">{{ item.soldCount === null ? "Sales unavailable" : `${item.soldCount.toLocaleString("en-PH")} sold` }}</span>
            </div>
            <div class="product-pricing">
              <strong class="current-price">{{ item.price }}</strong>
              <template v-if="item.originalPrice">
                <del class="original-price">{{ item.originalPrice }}</del>
                <span v-if="item.discount > 0" class="discount">-{{ item.discount }}%</span>
              </template>
            </div>
            <div class="purchase-row">
              <span v-if="item.categoryName" class="product-category" :class="`product-category--${item.categoryTone}`" :title="item.categoryName" role="img" :aria-label="item.categoryName">
                <van-image v-if="item.categoryIcon" class="category-icon-image" :src="item.categoryIcon" fit="contain" alt="">
                  <template #error><Icon icon="solar:widget-2-bold-duotone" /></template>
                </van-image>
                <Icon v-else icon="solar:widget-2-bold-duotone" aria-hidden="true" />
              </span>
            </div>
          </div>
          <button class="favorite-button" :class="{ 'favorite-button--active': item.isFavorite }" type="button" :aria-label="item.isFavorite ? 'Remove from favorites' : 'Add to favorites'" :aria-pressed="item.isFavorite" :disabled="item.favoriteLoading || item.id <= 0 || !Number.isSafeInteger(item.id)" @click="toggleFavorite(item)">
            <van-icon :name="item.isFavorite ? 'like' : 'like-o'" />
          </button>
          <button class="add-to-cart" type="button" :disabled="cart.busy || item.id <= 0 || !Number.isSafeInteger(item.id) || !Number.isFinite(item.currentPrice) || item.currentPrice < 0" :aria-label="`Add ${item.name} to cart`" @click="handleAddToCart(item)">
            <Icon icon="solar:cart-large-2-bold" aria-hidden="true" /><span>Add to Cart</span>
          </button>
        </article>
        <aside class="discovery-note">
          <span class="note-icon"><Icon icon="solar:gift-bold-duotone" /></span>
          <div><strong>Your next bestseller is waiting</strong><p>Check back for more trending finds.</p></div>
          <Icon class="note-sparkle" icon="solar:stars-minimalistic-bold-duotone" />
        </aside>
      </template>
    </main>
  </div>
</template>

<style scoped>
.hot-products-page {
  min-height: 100%;
  padding-bottom: env(safe-area-inset-bottom);
  background: linear-gradient(180deg, #edf4ff 0, #f6f8fc 280px, #f6f8fc 100%);
  color: #17243d;
}
.ranking-intro {
  padding: 22px 18px 12px;
  text-align: center;
}
.intro-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #1677ff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
}
.intro-eyebrow svg {
  color: #ff6546;
  font-size: 18px;
}
.ranking-intro p {
  margin: 8px 0 6px;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.7px;
  line-height: 1.25;
}
.intro-description {
  color: #718099;
  font-size: 11px;
}
.hot-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
  padding: 12px;
  background: rgba(244, 248, 255, 0.94);
  backdrop-filter: blur(12px);
}
.hot-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  padding: 3px 3px;
  border: 1px solid #fff;
  border-radius: 16px;
  background: #fff;
  color: #718099;
  cursor: pointer;
  transition:
    background 160ms,
    box-shadow 160ms;
}
.hot-tab > svg {
  width: 22px;
  height: 22px;
}
.tab-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tab-copy strong {
  color: #24334b;
  font-size: 12px;
}
.tab-copy small {
  font-size: 9px;
  white-space: nowrap;
}
.hot-tab--active {
  border-color: transparent;
  background: linear-gradient(135deg, #2588ff, #0866f5);
  color: #e5f0ff;
  box-shadow: 0 6px 14px #1677ff26;
}
.hot-tab--active strong {
  color: #fff;
}
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 24px;
}
.list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 3px 0;
  margin: 0 12px;
}
.list-heading h1 {
  margin: 0;
  font-size: 14px;
  font-weight: 750;
}
.list-heading > span {
  color: #718099;
  font-size: 10px;
}
.product-card {
  width: calc(100% - 32px);
  margin: 0 16px;
  min-height: 136px;
  background: #ffffff;
  border-radius: 18px;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  position: relative;
  box-shadow: 0 2px 8px #17243d05;
}
.product-sale-type {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}
.product-image-wrap {
  position: relative;
  width: 112px;
  height: 112px;
  flex: 0 0 112px;
  border-radius: 12px;
  overflow: visible;
  background: #f5f6f8;
  padding: 0;
  border: 0;
  cursor: pointer;
}
.product-image {
  border-radius: 12px;
  overflow: hidden;
  display: block;
  width: 112px;
  height: 112px;
  object-fit: cover;
}
.product-image :deep(img) {
  object-fit: cover;
}
.product-image :deep(.van-image__error) {
  color: #94a3b8;
  font-size: 30px;
}
.product-rank {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  border-radius: 10px 0 10px 0;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.product-rank-image {
  position: absolute;
  top: -7px;
  left: -7px;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 0;
  object-fit: contain;
}
.product-info {
  flex: 1;
  min-width: 0;
  padding-left: 12px;
  display: flex;
  flex-direction: column;
}
.product-info h2 {
  margin: 0 30px 4px 0;
  color: #111827;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
}
.product-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.favorite-button {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
}
.favorite-button--active {
  color: #ff2d55;
}
.product-social {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 18px;
}
.product-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #1f2937;
  white-space: nowrap;
}
.product-rating svg {
  color: #ffb000;
  font-size: 14px;
}
.product-rating strong {
  font-weight: 600;
}
.product-rating + .sold-count {
  border-left: 1px solid #dbe1e9;
  padding-left: 8px;
}
.sold-count {
  color: #64748b;
}
.product-pricing {
  display: flex;
  align-items: center;
  min-width: 0;
  margin-top: 4px;
  white-space: nowrap;
}
.current-price {
  color: #ff174d;
  font-size: 20px;
  font-weight: 700;
  line-height: 26px;
  letter-spacing: -0.5px;
}
.original-price {
  font-size: 11px;
  color: #94a3b8;
  text-decoration: line-through;
  margin-left: 8px;
}
.discount {
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  color: #ff2d55;
  background: #fff0f4;
  border-radius: 10px;
  padding: 2px 6px;
  margin-left: 6px;
}
.purchase-row {
  display: flex;
  align-items: flex-end;
  min-height: 36px;
  margin-top: auto;
  padding-top: 4px;
  padding-right: 114px;
}
.product-category {
  box-sizing: border-box;
  width: 28px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  font-size: 16px;
  line-height: 1;
  background: #f1f5f9;
  color: #64748b;
}
.category-icon-image {
  width: 30px;
  height: 30px;
}
.category-icon-image :deep(.van-image__error) {
  background: transparent;
  color: #64748b;
}
.product-category--beauty {
  background: #fff0f4;
  color: #c54871;
}
.product-category--electronics {
  background: #edf5ff;
  color: #3674be;
}
.product-category--fashion {
  background: #f5efff;
  color: #8659bd;
}
.product-category--home {
  background: #edf8f0;
  color: #42805b;
}
.product-category--toys {
  background: #fff6e8;
  color: #a77827;
}
.add-to-cart {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  height: 36px;
  min-width: 108px;
  width: 108px;
  padding: 0 14px;
  background: #ff174d;
  color: #fff;
  border: none;
  border-radius: 10px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.add-to-cart > svg {
  flex-shrink: 0;
  width: 12px;
  height: 14px;
}
.add-to-cart:active:not(:disabled) {
  background: #e41143;
}
.add-to-cart:disabled,
.favorite-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.product-image-wrap:focus-visible,
.product-name:focus-visible,
.favorite-button:focus-visible,
.add-to-cart:focus-visible {
  outline: 2px solid #1677ff;
  outline-offset: 2px;
}
.discovery-note {
  margin: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  border-radius: 17px;
  background: linear-gradient(110deg, #ffedf1, #fff3f8);
}
.note-icon {
  color: #ff4b70;
  font-size: 28px;
}
.discovery-note strong {
  color: #db315c;
  font-size: 11px;
}
.discovery-note p {
  margin: 4px 0 0;
  color: #7b7890;
  font-size: 10px;
}
.note-sparkle {
  margin-left: auto;
  color: #f8a0ba;
  font-size: 22px;
  flex-shrink: 0;
}
.loading-state {
  margin: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: #fff;
}
.skeleton-image {
  width: 112px;
  height: 112px;
  flex-shrink: 0;
  border-radius: 13px;
  background: #edf1f7;
}
.skeleton-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 15px;
  padding-top: 8px;
}
.skeleton-copy i {
  height: 17px;
  border-radius: 5px;
  background: #edf1f7;
}
.skeleton-copy i:nth-child(even) {
  width: 65%;
}
.loading-label {
  color: #718099;
  font-size: 12px;
  text-align: center;
}
</style>

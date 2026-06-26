<script setup lang="ts">
export interface ProductCardData {
  id: number | string
  title: string
  image?: string
  price?: number
  currency?: string
  chinaCost?: number
  profit?: number
  profitMargin?: number
  isFavorite?: boolean
}

interface Props {
  product: ProductCardData
  showPrice?: boolean
  showFavorite?: boolean
  compact?: boolean
  layout?: "row" | "grid"
}

const props = withDefaults(defineProps<Props>(), {
  showPrice: true,
  showFavorite: true,
  compact: false,
  layout: "row"
})

const emit = defineEmits<{
  click: [product: ProductCardData]
  favorite: [product: ProductCardData]
}>()

function handleCardClick() {
  emit("click", props.product)
}

function handleFavoriteClick() {
  emit("favorite", props.product)
}

function formatMoney(value?: number) {
  return value === undefined ? "--" : value.toFixed(2)
}
</script>

<template>
  <div
    class="product-card"
    :class="[
      `product-card--${layout}`,
      { 'product-card--compact': compact },
    ]"
    role="button"
    tabindex="0"
    @click="handleCardClick"
    @keyup.enter="handleCardClick"
  >
    <div class="product-card__image-wrap">
      <img
        v-if="product.image"
        class="product-card__image"
        :src="product.image"
        :alt="product.title"
      >
      <div v-else class="product-card__placeholder" />
    </div>

    <div class="product-card__body">
      <div class="product-card__title">
        {{ product.title }}
      </div>
      <div class="product-card__footer">
        <div class="product-card__metrics">
          <div v-if="product.chinaCost !== undefined" class="product-card__metric">
            <span>China Cost</span>
            <strong>
              <span class="product-card__currency">{{ product.currency || "$" }}</span>{{ formatMoney(product.chinaCost) }}
            </strong>
          </div>
          <div v-if="showPrice" class="product-card__metric product-card__metric--price">
            <span>PH Price</span>
            <strong>
              <span class="product-card__currency">{{ product.currency || "$" }}</span>{{ formatMoney(product.price) }}
            </strong>
          </div>
          <div v-if="product.profit !== undefined" class="product-card__metric product-card__metric--profit">
            <span>Profit / Item</span>
            <strong>
              <span class="product-card__currency">{{ product.currency || "$" }}</span>{{ formatMoney(product.profit) }}
            </strong>
          </div>
        </div>

        <button
          v-if="showFavorite"
          class="product-card__favorite"
          type="button"
          :aria-label="product.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          @click.stop="handleFavoriteClick"
        >
          <van-icon :name="product.isFavorite ? 'like' : 'heart-o'" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  border: 1px solid #eaf1ff;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(20, 40, 80, 0.08);
  cursor: pointer;
  padding: 10px;
}

.product-card__image-wrap {
  flex: 0 0 104px;
  width: 104px;
  height: 104px;
  border-radius: 14px;
  background: #f5f8ff;
  overflow: hidden;
}

.product-card__image,
.product-card__placeholder {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 14px;
}

.product-card__image {
  object-fit: cover;
}

.product-card__placeholder {
  background: #f5f8ff;
}

.product-card__body {
  min-width: 0;
  flex: 1;
  padding: 2px 0;
}

.product-card__title {
  min-height: 44px;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  margin-top: 14px;
  gap: 8px;
}

.product-card__metrics {
  min-width: 0;
  flex: 1;
}

.product-card__metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 19px;
  color: #315074;
  font-size: 11px;
  line-height: 16px;
}

.product-card__metric span {
  white-space: nowrap;
}

.product-card__metric strong {
  min-width: 0;
  overflow: hidden;
  color: #071b44;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__currency {
  margin-right: 1px;
  font-size: 12px;
}

.product-card__favorite {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: #f3f7ff;
  color: #1677ff;
  font-size: 18px;
  display: inline-grid;
  place-items: center;
  padding: 0;
}

.product-card--compact .product-card__image-wrap {
  flex-basis: 88px;
  width: 88px;
  height: 88px;
}

.product-card--compact .product-card__body {
  padding: 0;
}

.product-card--compact .product-card__title {
  min-height: 36px;
  font-size: 13px;
  line-height: 18px;
}

.product-card--grid {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 8px 22px rgba(17, 24, 39, 0.08);
}

.product-card--grid .product-card__image-wrap {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 12px 12px 0 0;
}

.product-card--grid .product-card__image,
.product-card--grid .product-card__placeholder {
  border-radius: 12px 12px 0 0;
}

.product-card--grid .product-card__body {
  padding: 10px;
}

.product-card--grid .product-card__title {
  min-height: 40px;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.product-card--grid .product-card__footer {
  min-height: 32px;
  margin-top: 7px;
}

.product-card--grid .product-card__favorite {
  background: #f9fafb;
  color: #ff3b30;
}
</style>

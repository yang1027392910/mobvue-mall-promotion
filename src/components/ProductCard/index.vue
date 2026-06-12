<script setup lang="ts">
export interface ProductCardData {
  id: number | string
  title: string
  image?: string
  price?: number
  currency?: string
  chinaCost?: number
  profitMargin?: number
  isFavorite?: boolean
}

interface Props {
  product: ProductCardData
  showPrice?: boolean
  showFavorite?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPrice: true,
  showFavorite: true,
  compact: false
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
</script>

<template>
  <div
    class="product-card"
    :class="{ 'product-card--compact': compact }"
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
        <div v-if="showPrice" class="product-card__price">
          <span class="product-card__currency">{{ product.currency || "$" }}</span>
          <span>{{ product.price?.toFixed(2) || "--" }}</span>
        </div>
        <div v-else />

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

.product-card__price {
  min-width: 0;
  color: #1677ff;
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
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

.product-card--compact .product-card__price {
  font-size: 15px;
}
</style>

<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { computed } from "vue"

const props = defineProps<{
  saleType?: number | string | null
  compact?: boolean
}>()
const type = computed(() => Number(props.saleType))
const label = computed(() => type.value === 1 ? "In Stock" : "Pre-order")
const description = computed(() => type.value === 2 ? `${label.value}: Estimated ship in 7–14 days` : label.value)
</script>

<template>
  <span
    v-if="type === 1 || type === 2"
    class="product-sale-type"
    :class="{ 'is-preorder': type === 2, 'is-compact': compact }"
    role="img"
    :aria-label="description"
    :title="description"
  >
    <span class="product-sale-type__main">
      <Icon :icon="type === 1 ? 'codicon:package' : 'mdi:clock-outline'" width="16" height="16" aria-hidden="true" />
      <span v-if="!compact" class="product-sale-type__label">{{ label }}</span>
    </span>
    <span v-if="!compact && type === 2" class="product-sale-type__estimate">Estimated ship in 7–14 days</span>
  </span>
</template>

<style scoped>
.product-sale-type {
  display: inline-flex;
  flex-direction: column;
  flex-shrink: 0;
  box-sizing: border-box;
  width: 96px;
  height: 32px;
  overflow: hidden;
  border: 1px solid #18b86b;
  border-radius: 10px;
  background: linear-gradient(135deg, #13b85b, #008d55);
  color: #ffffff;
  vertical-align: middle;
}
.product-sale-type__main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 0;
}
.product-sale-type__main :deep(svg) {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
.product-sale-type__label {
  padding-left: 7px;
  border-left: 1px solid #ffffff55;
  font-size: 13px;
  font-weight: 700;
  line-height: 16px;
  white-space: nowrap;
}
.product-sale-type.is-preorder {
  width: 160px;
  border-color: #ff9900;
  background: linear-gradient(135deg, #ffa600, #ff8000);
}
.product-sale-type__estimate {
  display: block;
  background: #ffffff;
  color: #e87500;
  font-size: 10px;
  font-weight: 700;
  line-height: 12px;
  text-align: center;
  white-space: nowrap;
}
.product-sale-type.is-compact {
  width: 20px;
  height: 20px;
  border-radius: 5px;
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from "vue"

interface Props {
  images: string[]
  startIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  startIndex: 0
})

const show = defineModel<boolean>("show", {
  default: false
})

const activeIndex = ref(0)

const safeStartIndex = computed(() => {
  if (!props.images.length) return 0
  return Math.min(Math.max(props.startIndex, 0), props.images.length - 1)
})

const pageText = computed(() => {
  if (!props.images.length) return "0/0"
  return `${activeIndex.value + 1}/${props.images.length}`
})

function closePreview() {
  show.value = false
}

function handleChange(index: number) {
  activeIndex.value = index
}

watch([show, safeStartIndex], ([visible, index]) => {
  if (visible) activeIndex.value = index
}, {
  immediate: true
})
</script>

<template>
  <van-image-preview
    v-model:show="show"
    :images="images"
    :start-position="safeStartIndex"
    :show-index="false"
    :closeable="false"
    :close-on-click-image="false"
    :close-on-click-overlay="true"
    :double-scale="true"
    :min-zoom="1 / 3"
    :max-zoom="4"
    teleport="body"
    transition="product-image-preview-fade"
    class-name="product-image-preview"
    overlay-class="product-image-preview__overlay"
    @change="handleChange"
  >
    <template #cover>
      <div class="product-image-preview__topbar">
        <button
          class="product-image-preview__back"
          type="button"
          aria-label="Close image preview"
          @click="closePreview"
        >
          <van-icon name="arrow-left" />
        </button>

        <div class="product-image-preview__counter">
          {{ pageText }}
        </div>
      </div>
    </template>
  </van-image-preview>
</template>

<style scoped>
:global(.product-image-preview__overlay) {
  background: #000000;
}

:global(.product-image-preview) {
  overflow: hidden;
  background: #000000;
}

:global(.product-image-preview .van-image-preview__swipe),
:global(.product-image-preview .van-swipe__track),
:global(.product-image-preview .van-swipe-item) {
  height: 100%;
}

:global(.product-image-preview .van-image-preview__swipe-item) {
  box-sizing: border-box;
  padding: calc(56px + env(safe-area-inset-top)) 0 calc(28px + env(safe-area-inset-bottom));
}

:global(.product-image-preview .van-image-preview__image img) {
  width: 100%;
  max-height: calc(100vh - 84px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  object-fit: contain;
}

:global(.product-image-preview-fade-enter-active),
:global(.product-image-preview-fade-leave-active) {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

:global(.product-image-preview-fade-enter-from),
:global(.product-image-preview-fade-leave-to) {
  opacity: 0;
  transform: scale(0.985);
}

.product-image-preview__topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  height: calc(52px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(8px + env(safe-area-inset-top)) 14px 8px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.58), rgba(0, 0, 0, 0));
  pointer-events: none;
}

.product-image-preview__back,
.product-image-preview__counter {
  pointer-events: auto;
}

.product-image-preview__back {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  font-size: 23px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.product-image-preview__counter {
  min-width: 48px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
</style>

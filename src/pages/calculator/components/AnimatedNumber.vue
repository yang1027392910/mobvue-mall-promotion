<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"

const props = withDefaults(defineProps<{
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}>(), {
  prefix: "",
  suffix: "",
  duration: 600,
  decimals: 2
})

const displayValue = ref(props.value)
let animationFrame = 0

const formattedValue = computed(() => {
  return `${props.prefix}${displayValue.value.toLocaleString(undefined, {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals
  })}${props.suffix}`
})

watch(
  () => props.value,
  (nextValue, previousValue) => {
    cancelAnimationFrame(animationFrame)

    const from = previousValue ?? displayValue.value
    const startTime = performance.now()

    function animate(now: number) {
      const progress = Math.min((now - startTime) / props.duration, 1)
      displayValue.value = from + (nextValue - from) * progress

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
  }
)

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <span>{{ formattedValue }}</span>
</template>

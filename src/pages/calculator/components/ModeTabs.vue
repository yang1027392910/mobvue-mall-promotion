<script setup lang="ts">
import type { CalculatorTab, CalculatorTabOption } from "../types"

defineProps<{
  tabs: CalculatorTabOption[]
  modelValue: CalculatorTab
}>()

const emit = defineEmits<{
  "update:modelValue": [value: CalculatorTab]
}>()
</script>

<template>
  <div class="mode-tabs" aria-label="Calculation mode">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="mode-tab"
      :class="{ 'mode-tab--active': modelValue === tab.value }"
      type="button"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.mode-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  /* margin-bottom: 10px; */
}

.mode-tab {
  height: 30px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #f3f4f6;
  color: #8a93a3;
  font-size: 14px;
}

.mode-tab--active {
  border-color: #2563ff;
  background: #ffffff;
  color: #2563ff;
}
</style>

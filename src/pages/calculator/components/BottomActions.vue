<script setup lang="ts">
const emit = defineEmits<{
  calculateAgain: []
  save: []
}>()
</script>

<template>
  <div class="bottom-actions">
    <van-button class="secondary-action" @click="emit('calculateAgain')">
      Calculate Again
    </van-button>
    <van-button class="primary-action" @click="emit('save')">
      Save Calculation
    </van-button>
  </div>
</template>

<style scoped>
.bottom-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.secondary-action,
.primary-action {
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
}

.secondary-action {
  border: 1px solid #2563ff;
  background: #ffffff;
  color: #2563ff;
}

.primary-action {
  border: 1px solid #2563ff;
  background: #2563ff;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(37, 99, 255, 0.22);
}
</style>

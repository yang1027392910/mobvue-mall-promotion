<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { closeToast, showFailToast, showLoadingToast, showSuccessToast } from "vant"
import homeLogo from "@/assets/home/logo.png"
import goodsIcon from "@/assets/login/goods.png"
import safeIcon from "@/assets/login/safe.png"
import serviceIcon from "@/assets/login/service.png"
import { useUserStore } from "@/pinia/stores/user"
import { emailCodeLogin, sendEmailCode } from "./apis"

const router = useRouter()

const userStore = useUserStore()

const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | undefined

const loginFormData = reactive({
  email: "",
  code: ""
})

const emailPattern = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const codePattern = /^\d{6}$/
const isSendCodeDisabled = computed(() => sendingCode.value || countdown.value > 0)
const sendCodeText = computed(() => {
  if (sendingCode.value) return "Sending..."
  if (countdown.value > 0) return `${countdown.value}s`
  return "Send Code"
})

function onSubmit() {
  if (loading.value) return
  if (!validateEmail()) return
  if (!codePattern.test(loginFormData.code)) {
    showFailToast("Please enter a valid 6-digit code")
    return
  }

  loading.value = true
  showLoadingToast({
    message: "Continuing...",
    forbidClick: true,
    duration: 0
  })
  emailCodeLogin({
    email: loginFormData.email,
    code: loginFormData.code
  }).then(({ data }) => {
    userStore.setToken(data.token, data.user)
    router.push("/")
  }).catch((error) => {
    loginFormData.code = ""
    showFailToast(error?.message || "Verification failed")
  }).finally(() => {
    loading.value = false
    closeToast()
  })
}

function validateEmail() {
  if (!loginFormData.email) {
    showFailToast("Please enter email address")
    return false
  }
  if (!emailPattern.test(loginFormData.email)) {
    showFailToast("Please enter a valid email address")
    return false
  }
  return true
}

function startCountdown() {
  countdown.value = 60
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }, 1000)
}

function handleSendCode() {
  if (isSendCodeDisabled.value) return
  if (!validateEmail()) return

  sendingCode.value = true
  sendEmailCode(loginFormData.email).then(() => {
    showSuccessToast("Code sent")
    startCountdown()
  }).catch((error) => {
    showFailToast(error?.message || "Failed to send code")
  }).finally(() => {
    sendingCode.value = false
  })
}

function handleBackHome() {
  router.push("/")
}

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <button class="back-home" type="button" @click="handleBackHome">
        <span class="back-home__icon">
          <Icon icon="solar:alt-arrow-left-linear" />
        </span>
        <span>Back to Home</span>
      </button>

      <header class="login-hero">
        <div class="logo-wrap">
          <img v-if="homeLogo" class="brand-logo" :src="homeLogo" alt="YiwuHub">
          <div v-else class="logo-placeholder">
            YiwuHub
          </div>
        </div>
        <h1>Welcome to YiwuHub</h1>
        <p>Enter your email to sign in or create an account</p>
      </header>

      <section class="login-card">
        <van-form class="login-form" @submit="onSubmit">
          <van-cell-group class="form-fields" :border="false">
            <div class="field-block">
              <label class="field-label" for="email">Email Address</label>
              <van-field
                id="email"
                v-model.trim="loginFormData.email"
                class="login-field"
                name="email"
                placeholder="Email address"
                size="large"
                :border="false"
                :rules="[
                  { required: true, message: 'Please enter email address' },
                  { pattern: emailPattern, message: 'Please enter a valid email address' },
                ]"
              >
                <template #left-icon>
                  <Icon class="field-icon" icon="solar:letter-linear" />
                </template>
              </van-field>
              <p class="field-hint">
                We’ll use your email to sign in or create your account
              </p>
            </div>

            <div class="field-block">
              <label class="field-label" for="code">Verification Code</label>
              <van-field
                id="code"
                v-model.trim="loginFormData.code"
                class="login-field code-field"
                name="code"
                placeholder="Enter 6-digit code"
                size="large"
                maxlength="6"
                inputmode="numeric"
                :border="false"
                :rules="[
                  { required: true, message: 'Please enter verification code' },
                  { pattern: codePattern, message: 'Please enter a valid 6-digit code' },
                ]"
              >
                <template #left-icon>
                  <Icon class="field-icon" icon="solar:shield-check-linear" />
                </template>
                <template #button>
                  <button
                    class="send-code-button"
                    type="button"
                    :disabled="isSendCodeDisabled"
                    @click="handleSendCode"
                  >
                    {{ sendCodeText }}
                  </button>
                </template>
              </van-field>
              <p class="field-hint">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          </van-cell-group>

          <van-button
            class="sign-in-button"
            :loading="loading"
            native-type="submit"
            block
          >
            Continue
          </van-button>
        </van-form>
      </section>

      <section class="benefits">
        <div class="benefit-item">
          <div class="benefit-icon">
            <img :src="safeIcon" alt="">
          </div>
          <strong>Secure &amp; Reliable</strong>
          <span>Multiple layers of protection</span>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">
            <img :src="goodsIcon" alt="">
          </div>
          <strong>Verified Suppliers</strong>
          <span>Carefully selected trusted suppliers</span>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">
            <img :src="serviceIcon" alt="">
          </div>
          <strong>Dedicated Support</strong>
          <span>Professional sourcing assistance</span>
        </div>
      </section>

      <footer class="login-footer">
        © 2026 YiwuHub. All rights reserved.
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
  color: #0f172a;
}

.login-shell {
  width: 100%;
  max-width: 375px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 12px 0 16px;
}

.back-home {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 0;
  padding: 0;
  color: #334155;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  background: transparent;
  margin-left: 18px;
}

.back-home__icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #0f172a;
  font-size: 22px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.login-hero {
  margin-top: 24px;
  padding: 0 18px;
  text-align: center;
}

.logo-wrap {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  display: block;
  width: 150px;
  max-width: 82%;
  height: auto;
  object-fit: contain;
}

.logo-placeholder {
  min-width: 150px;
  height: 44px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #1677ff;
  font-size: 22px;
  font-weight: 800;
  background: #edf6ff;
}

.login-hero h1 {
  margin: 16px 0 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
  line-height: 30px;
}

.login-hero p {
  margin: 6px auto 0;
  color: #64748b;
  font-size: 13px;
  line-height: 18px;
  text-align: center;
}

.login-card {
  width: calc(100% - 36px);
  margin: 24px 18px 0;
  padding: 18px 18px 20px;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
}

.form-fields {
  display: grid;
  gap: 19px;
  margin: 0;
  background: transparent;
}

.field-block {
  min-width: 0;
}

.field-label {
  display: block;
  margin: 0 0 7px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.login-field {
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  padding: 0 10px 0 13px;
  border: 1px solid #d8e2f0;
  border-radius: 16px;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  background: #ffffff;
  box-sizing: border-box;
  overflow: hidden;
  line-height: 20px;
}

.login-field :deep(.van-field__left-icon) {
  width: 18px;
  margin-right: 9px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 18px;
  line-height: 18px;
}

.login-field :deep(.van-field__value) {
  height: 100%;
  min-width: 0;
  display: block;
  overflow: visible;
}

.login-field :deep(.van-field__body) {
  height: 100%;
  min-height: 0;
  max-height: 100%;
  align-items: center;
  line-height: 20px;
}

.login-field :deep(.van-field__button) {
  height: 30px;
  padding-left: 10px;
  display: flex;
  align-items: center;
  align-self: center;
  flex: 0 0 auto;
  line-height: 30px;
}

.login-field :deep(.van-field__control) {
  color: #0f172a;
  font-size: 14px;
  line-height: 20px;
}

.login-field :deep(.van-field__control::placeholder) {
  color: #9aaac2;
}

.login-field :deep(.van-field__error-message) {
  display: none;
}

.field-icon {
  width: 18px;
  height: 18px;
  color: #8fa3bf;
  font-size: 18px;
}

.send-code-button {
  min-width: 82px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  padding: 0 12px;
  color: #1677ff;
  font-size: 12px;
  font-weight: 600;
  line-height: 30px;
  white-space: nowrap;
  background: #eef6ff;
}

.send-code-button:disabled {
  color: #94a3b8;
  background: #f1f5f9;
}

.field-hint {
  margin: 6px 2px 0;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.sign-in-button {
  width: 100%;
  height: 44px;
  margin-top: 22px;
  border: 0;
  border-radius: 18px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(90deg, #1677ff 0%, #0066ff 100%);
  box-shadow: 0 12px 24px rgba(22, 119, 255, 0.25);
}

.benefits {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 24px 18px 0;
}

.benefit-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.benefit-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #edf6ff;
}

.benefit-icon img {
  display: block;
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.benefit-item strong {
  min-height: 30px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 15px;
}

.benefit-item span {
  color: #64748b;
  font-size: 11px;
  line-height: 15px;
}

.login-footer {
  margin-top: 22px;
  color: #8fa3bf;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

@media (max-width: 360px) {
  .login-shell {
    padding-top: 12px;
  }

  .login-card {
    padding-right: 16px;
    padding-left: 16px;
  }

  .benefits {
    gap: 8px;
  }
}
</style>

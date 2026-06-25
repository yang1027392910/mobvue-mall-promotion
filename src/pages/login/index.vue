<script setup lang="ts">
import type { RawBannerItem } from "@@/apis/banner/type"
import type { AxiosError } from "axios"
import { getBannerListApi } from "@@/apis/banner"
import { Icon } from "@iconify/vue"
import { allowMultipleToast, showFailToast, showLoadingToast, showSuccessToast } from "vant"
import goodsIcon from "@/assets/login/goods.png"
import safeIcon from "@/assets/login/safe.png"
import serviceIcon from "@/assets/login/service.png"
import { useUserStore } from "@/pinia/stores/user"
import { emailCodeLogin, sendEmailCode } from "./apis"

const router = useRouter()
const route = useRoute()

const userStore = useUserStore()

allowMultipleToast()

const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const emailError = ref("")
const loginBannerImage = ref("")
let countdownTimer: ReturnType<typeof setInterval> | undefined

const loginFormData = reactive({
  email: "",
  code: ""
})

const emailPattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i
const codePattern = /^\d{6}$/
const isSendCodeDisabled = computed(() => sendingCode.value || countdown.value > 0)
const sendCodeText = computed(() => {
  if (sendingCode.value) return "Sending..."
  if (countdown.value > 0) return `${countdown.value}s`
  return "Send Code"
})

const loginRedirect = computed(() => {
  const redirect = String(route.query.redirect || "")
  return redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/"
})
const inviteCode = computed(() => String(route.query.invite || "").trim())

interface LoginErrorResponse {
  error?: unknown
  message?: string
}

function getLoginErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<LoginErrorResponse>
  const responseError = axiosError.response?.data?.error
  if (typeof responseError === "string" && responseError.trim()) {
    return responseError
  }

  if (responseError && typeof responseError === "object") {
    return JSON.stringify(responseError)
  }

  return axiosError.response?.data?.message || axiosError.message || fallback
}

function showLoginErrorToast(error: unknown, fallback: string) {
  const message = getLoginErrorMessage(error, fallback)
  showFailToast({
    message,
    duration: 3000,
    wordBreak: "break-word",
    forbidClick: false
  })
}

const loginHeroStyle = computed(() => {
  if (!loginBannerImage.value) return {}

  return {
    backgroundImage: `url("${loginBannerImage.value.replace(/"/g, "%22")}")`
  }
})

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function getBannerDataList(data: RawBannerItem[] | {
  data?: RawBannerItem[]
  list?: RawBannerItem[]
  records?: RawBannerItem[]
  rows?: RawBannerItem[]
  items?: RawBannerItem[]
}) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.list)) return data.list
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.rows)) return data.rows
  return Array.isArray(data.items) ? data.items : []
}

function getBannerImage(item: RawBannerItem) {
  return getAssetUrl(String(item.image ?? item.imageUrl ?? item.bannerUrl ?? item.picUrl ?? item.cover ?? item.url ?? ""))
}

async function getLoginBanner() {
  try {
    const { data } = await getBannerListApi({
      scene: "login"
    })
    const banner = getBannerDataList(data)
      .filter(item => !item.scene || item.scene === "login")
      .filter(item => item.status === undefined || Number(item.status) === 1)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
      .map(getBannerImage)
      .find(Boolean)

    if (banner) loginBannerImage.value = banner
  } catch {
    loginBannerImage.value = ""
  }
}

function onSubmit() {
  if (loading.value) return
  if (!validateEmail()) return
  if (!codePattern.test(loginFormData.code)) {
    showFailToast("Please enter a valid 6-digit code")
    return
  }

  loading.value = true
  const loadingToast = showLoadingToast({
    message: "Continuing...",
    forbidClick: true,
    duration: 0
  })
  emailCodeLogin({
    email: loginFormData.email,
    code: loginFormData.code,
    ...(inviteCode.value ? { inviteCode: inviteCode.value } : {})
  }).then(({ data }) => {
    loadingToast.close()
    userStore.setToken(data.token, data.user)
    router.push(loginRedirect.value)
  }).catch((error) => {
    loadingToast.close()
    loginFormData.code = ""
    showLoginErrorToast(error, "Verification failed")
  }).finally(() => {
    loading.value = false
  })
}

function validateEmail() {
  const email = loginFormData.email.trim()
  if (!email) {
    emailError.value = "Please enter email address"
    showFailToast("Please enter email address")
    return false
  }
  if (!emailPattern.test(email)) {
    emailError.value = "Please enter a valid email address"
    showFailToast("Please enter a valid email address")
    return false
  }
  emailError.value = ""
  return true
}

function validateEmailValue(value: string) {
  return emailPattern.test(value.trim())
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
  if (sendingCode.value) {
    showFailToast("Verification code is being sent")
    return
  }
  if (countdown.value > 0) {
    showFailToast(`Please try again in ${countdown.value}s`)
    return
  }
  if (!validateEmail()) return

  sendingCode.value = true
  const loadingToast = showLoadingToast({
    message: "Sending code...",
    forbidClick: true,
    duration: 0
  })
  sendEmailCode(loginFormData.email).then(() => {
    showSuccessToast("Code sent")
    startCountdown()
  }).catch((error) => {
    loadingToast.close()
    showLoginErrorToast(error, "Failed to send code")
  }).finally(() => {
    sendingCode.value = false
  })
}

function handleEmailInput() {
  if (emailError.value) emailError.value = ""
}

function handleBackHome() {
  router.push("/")
}

onMounted(() => {
  getLoginBanner()
})

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <button
        class="back-home"
        type="button"
        aria-label="返回首页"
        title="返回首页"
        @click="handleBackHome"
      >
        <span class="back-home__icon" aria-hidden="true">×</span>
      </button>

      <header class="login-hero" :style="loginHeroStyle" />

      <section class="login-card">
        <van-form class="login-form" @submit="onSubmit">
          <van-cell-group class="form-fields" :border="false">
            <div class="field-block">
              <label class="field-label" for="email">Email Address</label>
              <van-field
                id="email"
                v-model.trim="loginFormData.email"
                class="login-field"
                type="email"
                name="email"
                inputmode="email"
                autocomplete="email"
                placeholder="Email address"
                size="large"
                :border="false"
                :rules="[
                  { required: true, message: 'Please enter email address' },
                  { validator: validateEmailValue, message: 'Please enter a valid email address' },
                ]"
                @input="handleEmailInput"
              >
                <template #left-icon>
                  <Icon class="field-icon" icon="solar:letter-linear" />
                </template>
              </van-field>
              <p v-if="emailError" class="field-error">
                {{ emailError }}
              </p>
              <p class="field-hint">
                We’ll use your email to sign in or create your account
              </p>
            </div>

            <div class="field-block">
              <label class="field-label" for="code">Verification Code</label>
              <div class="code-field-row">
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
                </van-field>
                <button
                  class="send-code-button"
                  :class="{ 'is-disabled': isSendCodeDisabled }"
                  type="button"
                  :aria-disabled="isSendCodeDisabled"
                  @pointerdown.stop.prevent="handleSendCode"
                >
                  {{ sendCodeText }}
                </button>
              </div>
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
          <!-- <span>Multiple layers of protection</span> -->
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">
            <img :src="goodsIcon" alt="">
          </div>
          <strong>Verified Suppliers</strong>
          <!-- <span>Carefully selected trusted suppliers</span> -->
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">
            <img :src="serviceIcon" alt="">
          </div>
          <strong>Dedicated Support</strong>
          <!-- <span>Professional sourcing assistance</span> -->
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
  background: linear-gradient(180deg, #eef7ff 0%, #f8fbff 42%, #ffffff 100%);
  color: #0f172a;
  overflow-x: hidden;
}

.login-shell {
  position: relative;
  width: 100%;
  max-width: 375px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 0 0 16px;
  overflow-x: hidden;
}

.back-home {
  position: fixed;
  z-index: 100;
  top: 12px;
  right: max(14px, calc((100vw - 375px) / 2 + 14px));
  display: inline-flex;
  align-items: center;
  border: 0;
  padding: 0;
  font: inherit;
  background: transparent;
  cursor: pointer;
}

.back-home__icon {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #0b4fb3;
  font-size: 0;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.16);
  backdrop-filter: blur(10px);
}

.back-home__icon::before,
.back-home__icon::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  content: "";
}

.back-home__icon::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.back-home__icon::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.login-hero {
  position: relative;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 16% 14%,
      rgba(255, 255, 255, 0.78) 0,
      rgba(255, 255, 255, 0.34) 25%,
      rgba(255, 255, 255, 0) 48%
    ),
    radial-gradient(
      circle at 90% 18%,
      rgba(255, 255, 255, 0.58) 0,
      rgba(255, 255, 255, 0.2) 22%,
      rgba(255, 255, 255, 0) 46%
    ),
    linear-gradient(153deg, #e9f6ff 0%, #ffffff 34%, #dceeff 64%, #b9dcff 100%);
  background-color: #e9f6ff;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.logo-wrap {
  position: relative;
  z-index: 1;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.brand-logo {
  display: block;
  width: 138px;
  max-width: 82%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(22, 119, 255, 0.12));
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
  position: relative;
  z-index: 1;
  margin: 0;
  color: #071b3a;
  font-size: 28px;
  font-weight: 800;
  line-height: 35px;
  letter-spacing: 0;
}

.text-china {
  color: #ff7a00;
}

.text-philippines {
  color: #1677ff;
}

.hero-tags {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.hero-tags span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 999px;
  padding: 0 12px;
  color: #1456b8;
  font-size: 12px;
  font-weight: 700;
  line-height: 30px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 8px 22px rgba(22, 119, 255, 0.12);
  backdrop-filter: blur(10px);
}

.login-card {
  position: relative;
  z-index: 2;
  width: calc(100% - 36px);
  margin: -30px 18px 0;
  padding: 10px 18px 10px;
  border: 1px solid rgba(216, 230, 247, 0.72);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 18px 42px rgba(30, 79, 144, 0.14);
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
  font-size: 12px;
  font-weight: 600;
  line-height: 15px;
}

.login-field {
  height: 40px;
  padding: 0 10px 0 13px;
  border: 1px solid #d8e6f7;
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
  width: 28px;
  height: 28px;
  margin-right: 9px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 28px;
  border-radius: 50%;
  background: #eef6ff;
  line-height: 28px;
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

.code-field-row {
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  border: 1px solid #d8e6f7;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 0;
  background: #ffffff;
  box-sizing: border-box;
  overflow: hidden;
}

.code-field {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  min-height: 100%;
  max-height: 100%;
  border: 0;
  border-radius: 0;
  padding-right: 0;
}

.field-icon {
  width: 15px;
  height: 15px;
  color: #1677ff;
  font-size: 15px;
}

.send-code-button {
  min-width: 82px;
  height: 30px;
  flex: 0 0 auto;
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

.send-code-button.is-disabled {
  color: #94a3b8;
  background: #f1f5f9;
}

.field-hint {
  margin: 2px 2px 0;
  color: #64748b;
  font-size: 10px;
  font-weight: 500;
  line-height: 18px;
}

.field-error {
  margin: 6px 2px 0;
  color: #ee0a24;
  font-size: 12px;
  line-height: 18px;
}

.sign-in-button {
  width: 100%;
  height: 40px;
  margin-top: 10px;
  border: 0;
  border-radius: 18px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(90deg, #2563eb 0%, #0a84ff 100%);
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.26);
}

.benefits {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 10px 18px 0;
  padding: 10px 0 2px;
}

.benefit-item {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  text-align: center;
}

.benefit-item + .benefit-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: linear-gradient(180deg, rgba(216, 230, 247, 0) 0%, #d8e6f7 35%, #d8e6f7 65%, rgba(216, 230, 247, 0) 100%);
}

.benefit-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #eef6ff;
  box-shadow: inset 0 0 0 1px rgba(22, 119, 255, 0.08);
}

.benefit-icon img {
  display: block;
  width: 40px;
  height: 40px;
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

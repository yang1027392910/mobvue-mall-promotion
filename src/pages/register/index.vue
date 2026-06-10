<script setup lang="ts">
import Description from "@@/components/Description.vue"

const router = useRouter()

const registerFormData = reactive({
  email: "",
  password: "",
  confirmPassword: ""
})

function goLogin() {
  router.push("/login")
}
</script>

<template>
  <div class="register-page">
    <Description class="register-brand" />

    <div class="register-panel">
      <div class="register-title">
        Create account
      </div>
      <div class="register-subtitle">
        Register with your email address.
      </div>

      <van-form>
        <van-cell-group inset>
          <van-field
            v-model="registerFormData.email"
            type="email"
            name="email"
            label="Email"
            placeholder="name@example.com"
            size="large"
            :rules="[
              { required: true, message: 'Please enter your email' },
              { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email' },
            ]"
          />
          <van-field
            v-model="registerFormData.password"
            type="password"
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            size="large"
            :rules="[{ required: true, message: 'Please enter your password' }]"
          />
          <van-field
            v-model="registerFormData.confirmPassword"
            type="password"
            name="confirmPassword"
            label="Confirm"
            placeholder="Repeat your password"
            size="large"
            :rules="[{ required: true, message: 'Please confirm your password' }]"
          />
        </van-cell-group>

        <div class="register-action">
          <van-button type="primary" native-type="submit" size="large" round block>
            Register
          </van-button>
        </div>
      </van-form>

      <button class="login-link" type="button" @click="goLogin">
        Already have an account? Log in
      </button>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 42px 16px 32px;
  background: #f7f9fc;
}
.register-brand {
  margin-bottom: 28px;
}
.register-panel {
  max-width: 390px;
  margin: 0 auto;
}
.register-title {
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
}
.register-subtitle {
  margin-top: 8px;
  margin-bottom: 22px;
  color: #64748b;
  font-size: 14px;
}
.register-action {
  margin: 28px 16px 18px;
}
.login-link {
  display: block;
  width: 100%;
  border: 0;
  padding: 8px 0;
  color: #1677ff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  background: transparent;
}
</style>

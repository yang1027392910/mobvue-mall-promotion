<script setup lang="ts">
interface BenefitItem {
  title: string
  icon: string
  color: string
}

interface AccountItem {
  title: string
  icon: string
  remark?: string
}

const benefits: BenefitItem[] = [
  { title: "Trending Products", icon: "home-o", color: "benefit-color-1" },
  { title: "Profit Calculator", icon: "calculator-o", color: "benefit-color-2" },
  { title: "Suppliers Directory", icon: "orders-o", color: "benefit-color-3" },
  { title: "Logistics Info", icon: "label-o", color: "benefit-color-4" },
  { title: "AI Content Generator", icon: "chat-o", color: "benefit-color-5" }
]

const accountItems: AccountItem[] = [
  { title: "My Orders", icon: "shopping-cart-o" },
  { title: "My Favorites", icon: "star-o" },
  { title: "Browsing History", icon: "orders-o" },
  { title: "Coupons", icon: "label-o", remark: "2 Available" },
  { title: "Invites & Rewards", icon: "gift-o" }
]
</script>

<template>
  <div class="profile-page">
    <div class="profile-banner">
      <div class="banner-top">
        <div />
        <van-icon name="setting-o" class="setting-icon" />
      </div>
      <div class="banner-body">
        <div class="avatar-shell">
          <div class="avatar-placeholder">
            S
          </div>
        </div>
        <div class="profile-info">
          <div class="hello-text">
            Hello, Seller! 👋
          </div>
          <div class="member-tag">
            Premium Member
          </div>
          <div class="member-since">
            Member since: May 15, 2024
          </div>
        </div>
        <van-button class="upgrade-button" type="primary" round size="small">
          Upgrade
        </van-button>
      </div>
    </div>

    <div class="profile-content">
      <section class="card membership-card">
        <div class="card-header">
          <div class="card-title">
            Membership Benefits
          </div>
        </div>
        <div class="benefits-row">
          <div v-for="item in benefits" :key="item.title" class="benefit-item">
            <div class="benefit-icon" :class="item.color">
              <van-icon :name="item.icon" />
            </div>
            <div class="benefit-title">
              {{ item.title }}
            </div>
          </div>
        </div>
      </section>

      <section class="card account-card">
        <div class="card-header">
          <div class="card-title">
            My Account
          </div>
        </div>
        <div class="account-list">
          <div v-for="item in accountItems" :key="item.title" class="account-item">
            <div class="account-item-left">
              <div class="account-icon">
                <van-icon :name="item.icon" />
              </div>
              <div class="account-label">
                {{ item.title }}
              </div>
            </div>
            <div class="account-item-right">
              <span v-if="item.remark" class="item-remark">{{ item.remark }}</span>
              <van-icon name="arrow" class="arrow-icon" />
            </div>
          </div>
        </div>
      </section>

      <section class="card plan-card">
        <div class="card-header plan-header">
          <div>
            <div class="card-title">
              Membership Plan
            </div>
            <div class="plan-name">
              Premium Member
            </div>
            <div class="plan-valid">
              Valid until: 2025-08-15
            </div>
          </div>
          <van-button class="manage-button" type="primary" round size="small">
            Manage
          </van-button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  background: #f7f9fc;
  padding-bottom: 90px;
}
.profile-banner {
  position: relative;
  z-index: 1;
  height: 200px;
  padding: 18px 18px 24px;
  color: #ffffff;
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
  background-image: url("../../assets/profile/bc.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.banner-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.setting-icon {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.9);
}
.banner-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  gap: 12px;
}
.avatar-shell {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.avatar-placeholder {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.18));
  color: #0f172a;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.hello-text {
  font-size: 18px;
  font-weight: 700;
}
.member-tag {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}
.member-since {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}
.upgrade-button {
  min-width: 86px;
}
.profile-content {
  position: relative;
  z-index: 2;
  margin-top: -40px;
  padding: 0 10px;
}
.card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 14px 28px rgba(16, 24, 40, 0.06);
  padding: 18px;
  margin-bottom: 16px;
}
.card-header {
  margin-bottom: 14px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #101828;
}
.benefits-row {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  overflow: hidden;
  padding-bottom: 4px;
}
.benefit-item {
  flex: 1;
  min-width: 0;
  max-width: 66px;
  border-radius: 16px;
  background: #f7f9fc;
  padding: 14px 2px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
}
.benefit-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 16px;
}
.benefit-color-1 {
  background: rgba(22, 119, 255, 0.16);
  color: #1677ff;
}
.benefit-color-2 {
  background: rgba(124, 58, 237, 0.16);
  color: #7c3aed;
}
.benefit-color-3 {
  background: rgba(14, 165, 233, 0.16);
  color: #0ea5e9;
}
.benefit-color-4 {
  background: rgba(20, 184, 166, 0.16);
  color: #14b8a6;
}
.benefit-color-5 {
  background: rgba(249, 115, 22, 0.16);
  color: #f97316;
}
.benefit-title {
  font-size: 11px;
  line-height: 1.35;
  color: #334155;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.account-list {
  display: flex;
  flex-direction: column;
}
.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}
.account-item:last-child {
  border-bottom: none;
}
.account-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.account-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #eff6ff;
  display: grid;
  place-items: center;
  color: #1677ff;
}
.account-label {
  font-size: 14px;
  color: #0f172a;
}
.account-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-remark {
  font-size: 12px;
  color: #475569;
}
.arrow-icon {
  color: #c7d2fe;
}
.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.plan-name {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #101828;
}
.plan-valid {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}
.manage-button {
  min-width: 96px;
}
@media (max-width: 390px) {
  .profile-page {
    padding-bottom: 98px;
  }
}
</style>

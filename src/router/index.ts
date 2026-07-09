import type { RouteRecordRaw } from "vue-router"
import { createRouter, createWebHashHistory, createWebHistory } from "vue-router"
import { registerNavigationGuard } from "@/router/guard"

const VITE_PUBLIC_PATH = import.meta.env.VITE_PUBLIC_PATH

const VITE_ROUTER_HISTORY = import.meta.env.VITE_ROUTER_HISTORY

/** 系统页面 */
export const systemRoutes: RouteRecordRaw[] = [
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    name: "403",
    meta: {
      title: "403"
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    name: "404",
    meta: {
      title: "404"
    },
    alias: "/:pathMatch(.*)*"
  }
]

/** 业务页面 */
export const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    name: "Login",
    meta: {
      title: "Login",
      seoTitle: "Login",
      description: "Sign in to your YiwuHub account to access verified China suppliers, manage favorites, calculate import profits, and connect with wholesale suppliers.",
      seoKeywords: "YiwuHub login, sign in, China wholesale platform, verified China suppliers"
    }
  },
  {
    path: "/",
    component: () => import("@/pages/home/index.vue"),
    name: "Home",
    meta: {
      title: "Home",
      seoTitle: "YiwuHub - Verified China Suppliers for Philippines Buyers",
      description: "Find verified China suppliers, compare factory prices, calculate product profits, and source wholesale goods from China for the Philippines.",
      seoKeywords: "China suppliers, Philippines wholesale, Yiwu suppliers, import from China",
      layout: {
        navBar: {
          showNavBar: false,
          showLeftArrow: false
        },
        tabbar: {
          showTabbar: true,
          label: "Home",
          icon: "home-o"
        },
        footer: true
      }
    }
  },
  {
    path: "/categories",
    component: () => import("@/pages/categories/index.vue"),
    name: "Categories",
    meta: {
      title: "Categories",
      seoTitle: "China Wholesale Categories | YiwuHub",
      description: "Browse through our extensive range of wholesale products from China, categorized for easy navigation and selection.",
      seoKeywords: "China wholesale categories, Philippines import, Yiwu products",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true,
          showRightSearch: true
        },
        tabbar: {
          showTabbar: true,
          label: "Categories",
          icon: "apps-o"
        }
      }
    }
  },
  {
    path: "/product-list",
    component: () => import("@/pages/productList/index.vue"),
    name: "ProductList",
    meta: {
      title: "Product List",
      dynamicSeo: true,
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true,
          showRightSearch: true
        }
      }
    }
  },
  {
    path: "/search",
    component: () => import("@/pages/search/index.vue"),
    name: "Search",
    meta: {
      title: "Search",
      dynamicSeo: true,
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        }
      }
    }
  },
  {
    path: "/hot-products",
    component: () => import("@/pages/hotProducts/index.vue"),
    name: "HotProducts",
    meta: {
      title: "Hot Products",
      seoTitle: "Hot Wholesale Products from China | YiwuHub",
      description: "Discover trending wholesale products from verified China suppliers. Compare factory prices, Philippine selling prices, and estimated profit opportunities.",
      seoKeywords: "hot wholesale products, trending China products, China suppliers, factory direct, Philippines wholesale, profitable products",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true,
          showRightSearch: true
        }
      }
    }
  },
  {
    path: "/product-card",
    component: () => import("@/pages/productCard/index.vue"),
    name: "ProductCard",
    meta: {
      title: "Product Details",
      dynamicSeo: true,
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true,
          showRightShare: true
        }
      }
    }
  },
  {
    path: "/calculator",
    component: () => import("@/pages/calculator/index.vue"),
    name: "Calculator",
    meta: {
      title: "Calculator",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true,
          showRightCustom: true,
          showRightSearch: true
        }
      }
    }
  },
  {
    path: "/suppliers",
    component: () => import("@/pages/suppliers/index.vue"),
    name: "Suppliers",
    meta: {
      title: "Suppliers",
      seoTitle: "Verified China Suppliers for Philippines Buyers | YiwuHub",
      description: "Find verified China suppliers and factory-direct sourcing partners for Philippines wholesale buyers.",
      seoKeywords: "verified China suppliers, factory direct suppliers, Philippines wholesale suppliers, Yiwu sourcing",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        }
      }
    }
  },
  {
    path: "/supplier-details/:id?",
    component: () => import("@/pages/supplierDetails/index.vue"),
    name: "SupplierDetails",
    meta: {
      title: "Supplier Details",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true,
          showRightShare: true
        }
      }
    }
  },
  {
    path: "/logistics-suppliers",
    component: () => import("@/pages/logisticsSuppliers/index.vue"),
    name: "LogisticsSuppliers",
    meta: {
      title: "Logistics Suppliers",
      seoTitle: "China to Philippines Logistics Suppliers | YiwuHub",
      description: "Connect with logistics suppliers for China to Philippines shipping, freight support, and door-to-door delivery.",
      seoKeywords: "China to Philippines shipping, logistics suppliers, freight forwarding, door to door delivery",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        }
      }
    }
  },
  {
    path: "/procurement-support",
    component: () => import("@/pages/procurementSupport/index.vue"),
    name: "ProcurementSupport",
    meta: {
      title: "Procurement Support",
      seoTitle: "China Procurement Support for Philippines Buyers | YiwuHub",
      description: "Contact YiwuHub procurement support for China sourcing, supplier help, product quotations, and buying assistance.",
      seoKeywords: "China procurement support, sourcing assistance, supplier help, product quotation",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        }
      }
    }
  },
  {
    path: "/about-policies",
    component: () => import("@/pages/aboutPolicies/index.vue"),
    name: "AboutPolicies",
    meta: {
      title: "About & Policies",
      seoTitle: "About YiwuHub & China Sourcing Policies | YiwuHub",
      description: "Learn about YiwuHub, China sourcing policies, buyer support, platform rules, and wholesale procurement guidance.",
      seoKeywords: "YiwuHub, China sourcing policies, wholesale procurement, buyer support",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        },
        tabbar: {
          showTabbar: false
        }
      }
    }
  },
  {
    path: "/user-verification",
    component: () => import("@/pages/UserVerification.vue"),
    name: "UserVerification",
    meta: {
      title: "Supplier Verification",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        }
      }
    }
  },
  {
    path: "/invite-friends",
    component: () => import("@/pages/inviteFriends/index.vue"),
    name: "InviteFriends",
    meta: {
      title: "Invite Friends",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        }
      }
    }
  },
  {
    path: "/favorites",
    component: () => import("@/pages/favorites/index.vue"),
    name: "Favorites",
    meta: {
      title: "Favorites",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        },
        tabbar: {
          showTabbar: true,
          label: "Favorites",
          icon: "star-o"
        }
      }
    }
  },
  {
    path: "/profile",
    component: () => import("@/views/profile/index.vue"),
    name: "Profile",
    meta: {
      title: "Profile",
      layout: {
        navBar: {
          showNavBar: false,
          showLeftArrow: false
        },
        tabbar: {
          showTabbar: true,
          label: "Profile",
          icon: "user-o"
        }
      }
    }
  }
]

/** 路由实例 */
export const router = createRouter({
  history: VITE_ROUTER_HISTORY === "hash" ? createWebHashHistory(VITE_PUBLIC_PATH) : createWebHistory(VITE_PUBLIC_PATH),
  routes: [...systemRoutes, ...routes]
})

// 注册路由导航守卫
registerNavigationGuard(router)

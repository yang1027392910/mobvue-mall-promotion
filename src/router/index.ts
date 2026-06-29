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
      title: "登录"
    }
  },
  {
    path: "/register",
    component: () => import("@/pages/register/index.vue"),
    name: "Register",
    meta: {
      title: "Register"
    }
  },
  {
    path: "/",
    component: () => import("@/pages/home/index.vue"),
    name: "Home",
    meta: {
      title: "Home",
      layout: {
        navBar: {
          showNavBar: false,
          showLeftArrow: false
        },
        tabbar: {
          showTabbar: true,
          icon: "home-o"
        }
      }
    }
  },
  {
    path: "/categories",
    component: () => import("@/pages/categories/index.vue"),
    name: "Categories",
    meta: {
      title: "Categories",
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
        },
        tabbar: {
          showTabbar: true,
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
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
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
          showRightCustom: true
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
      layout: {
        navBar: {
          showNavBar: true,
          showLeftArrow: true
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
          icon: "user-o"
        },
        footer: true
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

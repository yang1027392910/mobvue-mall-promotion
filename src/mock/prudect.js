import productImage from "@/assets/profile/product.png"

export const categoryList = [
  { id: 1, name: "Women Wear", icon: "women-wear" },
  { id: 2, name: "Men Wear", icon: "men-wear" },
  { id: 3, name: "Shoes", icon: "shoes" },
  { id: 4, name: "Bags", icon: "bags" },
  { id: 5, name: "Beauty", icon: "beauty" },
  { id: 6, name: "Jewelry", icon: "jewelry" },
  { id: 7, name: "Kids & Baby", icon: "kids-baby" },
  { id: 8, name: "Home & Living", icon: "home-living" },
  { id: 9, name: "Toys", icon: "toys" },
  { id: 10, name: "Stationery", icon: "stationery" },
  { id: 11, name: "Electronics", icon: "electronics" },
  { id: 12, name: "Sports", icon: "sports" },
  { id: 13, name: "Automotive", icon: "automotive" },
  { id: 14, name: "Pet Supplies", icon: "pet-supplies" },
  { id: 15, name: "Food", icon: "food" },
  { id: 16, name: "Others", icon: "others" }
]

export const productList = [
  {
    id: 1001,
    categoryId: 3,
    name: "Girl Shoes Pink",
    sku: "2506120001",
    image: productImage,
    price: 90,
    phPrice: 129,
    chinaCost: 42,
    score: 8.6,
    stock: 24,
    sales: 12,
    createdAt: "2026-06-01",
    isFavorite: true
  },
  {
    id: 1002,
    categoryId: 3,
    name: "White Casual Shoes",
    sku: "2506120002",
    image: productImage,
    price: 110,
    phPrice: 159,
    chinaCost: 51,
    score: 8.2,
    stock: 30,
    sales: 15,
    createdAt: "2026-06-02",
    isFavorite: true
  },
  {
    id: 1003,
    categoryId: 4,
    name: "Fashion Handbag",
    sku: "2506120003",
    image: productImage,
    price: 120,
    phPrice: 179,
    chinaCost: 58,
    score: 8.9,
    stock: 15,
    sales: 8,
    createdAt: "2026-05-28",
    isFavorite: true
  },
  {
    id: 1004,
    categoryId: 5,
    name: "Lipstick #01",
    sku: "2506120004",
    image: productImage,
    price: 30,
    phPrice: 59,
    chinaCost: 12,
    score: 7.8,
    stock: 100,
    sales: 20,
    createdAt: "2026-06-03",
    isFavorite: true
  },
  {
    id: 1005,
    categoryId: 9,
    name: "Small Car Toy",
    sku: "2506120005",
    image: productImage,
    price: 45,
    phPrice: 89,
    chinaCost: 18,
    score: 8.4,
    stock: 60,
    sales: 5,
    createdAt: "2026-05-30",
    isFavorite: true
  },
  {
    id: 1006,
    categoryId: 10,
    name: "Notebook A5",
    sku: "2506120006",
    image: productImage,
    price: 25,
    phPrice: 49,
    chinaCost: 9,
    score: 7.6,
    stock: 80,
    sales: 18,
    createdAt: "2026-06-04",
    isFavorite: true
  }
]

export function getProductMock() {
  return {
    categoryList,
    productList
  }
}

export function getTrendingProducts() {
  return productList.map(item => {
    const profit = item.price - item.chinaCost

    return {
      id: item.id,
      name: item.name,
      image: item.image,
      score: item.score.toFixed(1),
      cost: `$${item.chinaCost.toFixed(2)}`,
      price: `$${item.price.toFixed(2)}`,
      profit: `$${profit.toFixed(2)}`
    }
  })
}

export function getFavoriteProducts() {
  return productList.map(item => ({
    id: item.id,
    title: item.name,
    image: item.image,
    price: item.price,
    currency: "$",
    chinaCost: item.chinaCost,
    profitMargin: Math.round(((item.price - item.chinaCost) / item.price) * 100),
    isFavorite: item.isFavorite
  }))
}

export function getProductList(categoryId) {
  if (!categoryId) {
    return productList
  }

  return productList.filter(item => item.categoryId === Number(categoryId))
}

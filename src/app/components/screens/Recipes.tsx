import { Search, Heart, Clock, Flame, ChefHat } from "lucide-react";
import { ImageWithFallback } from "../ImageWithFallback";
import { readAppData } from "../../lib/storage";
import { computeMealMetrics } from "../../services/mealService";

export function Recipes() {
  const mealMetrics = computeMealMetrics(readAppData().mealEntries);
  const categories = [
    { name: "Món chính", count: 45, icon: "🍜" },
    { name: "Món phụ", count: 32, icon: "🥗" },
    { name: "Ăn sáng", count: 28, icon: "🥪" },
    { name: "Tráng miệng", count: 15, icon: "🍰" },
  ];

  const recipes = [
    {
      name: "Phở bò Hà Nội",
      calories: 450,
      prepTime: "30 phút",
      difficulty: "Trung bình",
      matchScore: 95,
      tags: ["Việt Nam", "Món chính", "Healthy"],
      image: "https://i-giadinh.vnecdn.net/2025/11/17/Pho-bo-Ha-Noi-7-vnexpress-1763-7388-9585-1763372391.jpg",
    },
    {
      name: "Gỏi cuốn tôm thịt",
      calories: 180,
      prepTime: "20 phút",
      difficulty: "Dễ",
      matchScore: 92,
      tags: ["Việt Nam", "Healthy", "Ít calo"],
      image: "https://cooponline.vn/tin-tuc/wp-content/uploads/2025/10/goi-cuon-tom-thit-chuan-vi-nuoc-cham-dau-phong-1.png",
    },
    {
      name: "Cơm gà xối mỡ",
      calories: 620,
      prepTime: "45 phút",
      difficulty: "Trung bình",
      matchScore: 88,
      tags: ["Việt Nam", "Món chính"],
      image: "https://i.ytimg.com/vi/P0NgzDow6jk/maxresdefault.jpg",
    },
    {
      name: "Salad rau củ Việt",
      calories: 210,
      prepTime: "15 phút",
      difficulty: "Dễ",
      matchScore: 85,
      tags: ["Healthy", "Ít calo", "Món phụ"],
      image: "https://nhahangvouy.com/wp-content/uploads/2025/09/Salad-Rau-Cu-1.jpg",
    },
  ];

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-6 py-8">
        <h1 className="text-2xl mb-1">Công thức món Việt</h1>
        <p className="text-yellow-100 text-sm">Cá nhân hóa theo khẩu vị của bạn</p>
      </div>

      <div className="px-6 mt-6">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ChefHat className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg mb-1">AI đề xuất hôm nay</h3>
              <p className="text-sm text-yellow-100">
                Bạn đã nạp khoảng {mealMetrics.totalCalories} kcal hôm nay, đây là các món phù hợp để cân bằng tiếp.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-lg mb-4">Danh mục</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {categories.map((category) => (
            <div key={category.name} className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-2">{category.icon}</div>
              <h3 className="font-semibold mb-1">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.count} công thức</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">Phù hợp với bạn</h2>
          <button className="text-yellow-600 text-sm font-medium hover:text-yellow-700">Xem tất cả →</button>
        </div>

        <div className="space-y-4 mb-6">
          {recipes.map((recipe) => (
            <div key={recipe.name} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="flex gap-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <ImageWithFallback src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1.5 rounded-lg">
                    <Heart size={16} />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {recipe.matchScore}% phù hợp
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-lg mb-2">{recipe.name}</h3>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Flame size={14} className="text-orange-500" />
                      <span>{recipe.calories} kcal</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={14} className="text-blue-500" />
                      <span>{recipe.prepTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button className="w-full bg-yellow-600 text-white py-2.5 rounded-xl font-semibold hover:bg-yellow-700 transition-colors">
                  Xem công thức
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

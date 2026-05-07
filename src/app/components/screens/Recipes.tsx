import { Heart, Clock, Flame, ChefHat, Search } from "lucide-react";
import { useState } from "react";
import { readAppData } from "../../lib/storage";
import { computeMealMetrics } from "../../services/mealService";

const categories = [
  { name: "Món chính", count: 45, gradient: "from-orange-400 to-rose-400" },
  { name: "Món phụ", count: 32, gradient: "from-emerald-400 to-teal-400" },
  { name: "Ăn sáng", count: 28, gradient: "from-amber-400 to-orange-400" },
  { name: "Tráng miệng", count: 15, gradient: "from-pink-400 to-violet-400" },
];

const allRecipes = [
  { name: "Phở bò Hà Nội", calories: 450, prepTime: "30 phút", difficulty: "Trung bình", matchScore: 95, tags: ["Việt Nam", "Món chính"], category: "Món chính" },
  { name: "Gỏi cuốn tôm thịt", calories: 180, prepTime: "20 phút", difficulty: "Dễ", matchScore: 92, tags: ["Healthy", "Ít calo"], category: "Món phụ" },
  { name: "Cơm gà xối mỡ", calories: 620, prepTime: "45 phút", difficulty: "Trung bình", matchScore: 88, tags: ["Việt Nam", "Món chính"], category: "Món chính" },
  { name: "Salad rau củ Việt", calories: 210, prepTime: "15 phút", difficulty: "Dễ", matchScore: 85, tags: ["Healthy", "Ít calo"], category: "Món phụ" },
  { name: "Bún chả Hà Nội", calories: 520, prepTime: "35 phút", difficulty: "Trung bình", matchScore: 90, tags: ["Việt Nam", "Món chính"], category: "Món chính" },
  { name: "Bánh cuốn", calories: 260, prepTime: "25 phút", difficulty: "Dễ", matchScore: 87, tags: ["Việt Nam", "Ăn sáng"], category: "Ăn sáng" },
  { name: "Chè đậu xanh", calories: 180, prepTime: "40 phút", difficulty: "Dễ", matchScore: 78, tags: ["Tráng miệng"], category: "Tráng miệng" },
  { name: "Cháo gà", calories: 280, prepTime: "30 phút", difficulty: "Dễ", matchScore: 84, tags: ["Ăn sáng", "Healthy"], category: "Ăn sáng" },
];

export function Recipes() {
  const mealMetrics = computeMealMetrics(readAppData().mealEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const filteredRecipes = allRecipes.filter((r) => {
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const detailRecipe = allRecipes.find((r) => r.name === showDetail);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Công thức món Việt</h1>
        <p className="text-amber-100/70 text-sm">Cá nhân hóa theo khẩu vị của bạn</p>
      </div>

      <div className="px-5 pt-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm món ăn..."
            className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* AI recommendation */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 mb-4 shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat size={18} className="text-white" />
            <h3 className="text-sm font-semibold text-white">AI đề xuất</h3>
          </div>
          <p className="text-amber-50/80 text-xs">
            Đã nạp {mealMetrics.totalCalories} kcal hôm nay. Các món dưới đây phù hợp để cân bằng dinh dưỡng.
          </p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              !selectedCategory ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                selectedCategory === cat.name ? "bg-amber-500 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Recipe list */}
        <div className="space-y-3 mb-6">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.name} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">{recipe.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Flame size={12} className="text-orange-400" /> {recipe.calories} kcal
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} className="text-blue-400" /> {recipe.prepTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-semibold">
                      {recipe.matchScore}%
                    </span>
                    <button className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center active:scale-90 transition-transform">
                      <Heart size={14} className="text-rose-400" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-3">
                  {recipe.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px]">{tag}</span>
                  ))}
                  <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[10px]">{recipe.difficulty}</span>
                </div>

                <button
                  onClick={() => setShowDetail(showDetail === recipe.name ? null : recipe.name)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold active:scale-[0.97] transition-transform"
                >
                  {showDetail === recipe.name ? "Ẩn chi tiết" : "Xem công thức"}
                </button>

                {/* Expandable detail */}
                {showDetail === recipe.name && (
                  <div className="mt-3 bg-amber-50 rounded-xl p-4 text-sm text-amber-900 space-y-2">
                    <p className="font-semibold">Cách làm {recipe.name}:</p>
                    <p>1. Chuẩn bị nguyên liệu tươi, rửa sạch.</p>
                    <p>2. Sơ chế và ướp gia vị theo khẩu vị.</p>
                    <p>3. Chế biến theo phương pháp truyền thống.</p>
                    <p>4. Bày ra đĩa, trang trí và thưởng thức.</p>
                    <p className="text-xs text-amber-700 mt-2">Thời gian chuẩn bị: {recipe.prepTime}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredRecipes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Không tìm thấy công thức phù hợp</p>
          )}
        </div>
      </div>
    </div>
  );
}

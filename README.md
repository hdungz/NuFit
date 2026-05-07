# NuFit - Ứng dụng Dinh dưỡng & Tập luyện AI

Ứng dụng web hỗ trợ theo dõi dinh dưỡng, lên kế hoạch bữa ăn và huấn luyện tập gym với AI realtime.

## Tính năng chính

### 🏋️ AI Workout Coaching
- **MediaPipe Pose Detection** — Vẽ khung xương cơ thể realtime trên camera
- **GPT-5.4 Vision Analysis** — Phân tích tư thế tập, nhận xét form qua hình ảnh composite (video + skeleton)
- **Voice Feedback** — Đọc to nhận xét chỉnh form bằng Web Speech API (tiếng Việt)
- Hỗ trợ camera trước/sau, bật/tắt pose detection & AI coaching

### 📸 Calorie Scanner
- Chụp ảnh món ăn → AI nhận diện thực phẩm và ước tính calories
- Tự động lưu vào nhật ký dinh dưỡng

### 🍽️ Meal Planning
- Lên kế hoạch bữa ăn theo ngày
- Gợi ý công thức nấu ăn

### 📊 Food Diary & Calendar
- Theo dõi lượng calo/macro hàng ngày
- Lịch tập luyện và check-in

### 💬 Chat Support
- Hỏi đáp dinh dưỡng & tập luyện với AI

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite |
| **Styling** | TailwindCSS |
| **Pose Detection** | MediaPipe Pose |
| **AI Vision** | GPT-5.4 via TrollLLM API |
| **Voice** | Web Speech API (SpeechSynthesis) |
| **Deploy** | Vercel |

## Cài đặt

```bash
# Clone repo
git clone https://github.com/hdungz/NuFit.git
cd NuFit

# Cài dependencies
pnpm install

# Tạo file .env từ template
cp .env.example .env
# Sửa .env và thêm API key của bạn

# Chạy dev server
pnpm dev
```

## Biến môi trường

| Biến | Mô tả |
|------|-------|
| `VITE_TROLLLLM_API_KEY` | API key cho TrollLLM (GPT/Claude models) |

## Build & Deploy

```bash
# Build production
pnpm build

# Deploy lên Vercel
vercel deploy --prod
```

## Cấu trúc dự án

```
src/
├── app/
│   ├── components/
│   │   ├── screens/          # Các màn hình chính
│   │   │   ├── WorkoutCoaching.tsx   # Huấn luyện AI + camera
│   │   │   ├── CalorieScanner.tsx    # Quét calories
│   │   │   ├── MealPlanning.tsx      # Kế hoạch bữa ăn
│   │   │   ├── FoodDiary.tsx         # Nhật ký dinh dưỡng
│   │   │   └── ...
│   │   └── PoseOverlay.tsx   # Component vẽ skeleton
│   ├── hooks/
│   │   └── usePoseDetection.ts   # Hook MediaPipe Pose
│   └── services/
│       ├── workoutAnalysisService.ts  # AI phân tích tư thế
│       ├── scannerService.ts          # AI nhận diện thực phẩm
│       └── ...
```

## License

MIT

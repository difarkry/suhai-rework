# SuhAI Rework

SuhAI Rework adalah aplikasi web berbasis JavaScript yang berfokus pada pengolahan, analisis, dan visualisasi data secara interaktif.  
Project ini dikembangkan sebagai **rework mandiri** dengan tujuan meningkatkan struktur kode, keterbacaan, dan kesiapan pengembangan jangka panjang.


> Fokus utama project: **clean architecture, reproducibility, dan developer experience.**


## 🎯 Tujuan Project
- Membangun aplikasi web dengan struktur yang rapi dan terukur
- Memisahkan concern antara frontend, backend, dan data
- Menjadi showcase kemampuan dasar–menengah dalam pengembangan web dan Node.js
- Menyediakan fondasi yang siap dikembangkan ke tahap production

## ✨ Fitur Utama
- 📊 Visualisasi data (heatmap, forecast, dan tampilan berbasis data lainnya)
- ⚡ Frontend ringan menggunakan HTML, CSS, dan JavaScript
- 🧠 Backend sederhana berbasis Node.js
- 🔐 Manajemen environment menggunakan `.env`
- 🧩 Struktur project modular dan mudah dipahami

## 🗂️ Struktur Project
```
.
├── css/ # Styling dan layout
├── js/ # Logic frontend
├── data/ # Data lokal (tidak disertakan di repo)
├── node_modules/ # Dependency (di-ignore)
├── server.js # Entry point backend
├── index.html # Halaman utama
├── package.json # Konfigurasi project & dependency
└── README.md
```


## 🚀 Cara Menjalankan Project
```
1️⃣ Clone repository
git clone https://github.com/difarkry/suhai-rework.git
cd suhai-rework
2️⃣ Install dependency
npm install
3️⃣ Setup environment
cp .env.example .env
Sesuaikan nilai pada file .env sesuai kebutuhan lokal.
4️⃣ Jalankan server
npm start
```
Akses aplikasi melalui browser sesuai konfigurasi server.
## 🧠 Engineering Notes
```
    Folder node_modules/ tidak disertakan untuk menjaga repository tetap ringan
    Folder data/ di-ignore karena berisi data lokal
    File .env tidak di-commit demi keamanan kredensial
    Struktur commit dibuat clean untuk memudahkan audit dan kolaborasi
```
## 🛠️ Tech Stack
```
    Frontend: HTML, CSS, JavaScript
    Backend: Node.js
    Environment Management: dotenv
    Package Manager: npm
```
## 🧭 Roadmap
```
    Refactor struktur frontend agar lebih scalable
    Pemisahan backend menjadi API layer
    Penambahan validasi dan error handling
    Deployment ke cloud (Vercel / Railway / Render)
```
## 📌 Status Project
```
🚧 Aktif dikembangkan sebagai project pembelajaran dan portfolio.
Feedback dan pengembangan lanjutan sangat terbuka.
```
## 👤 Author
```
Dikembangkan oleh difarkry
GitHub: https://github.com/difarkry
```
## 📄 Lisensi
```
Project ini digunakan untuk keperluan pembelajaran dan pengembangan pribadi.
```
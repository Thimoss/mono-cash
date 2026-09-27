# UI/UX Refactor Blueprint: MonoCash "Neo-Fintech" Edition

Dokumen ini memuat panduan perombakan antarmuka (UI) aplikasi **MonoCash** dari gaya monokrom terminal (*hacker-style*) menjadi gaya **Modern Neo-Fintech** yang lebih ramah mata, elegan, dinamis, dan intuitif untuk pencatatan keuangan harian.

---

## 1. Core Design Philosophy
* **Visual Hierarchy:** Mengganti kesan monoton dengan kontras warna yang fungsional (bukan sekadar hiasan).
* **Typography Hybrid:** 
  * Menggunakan *Sans-Serif* modern (Clean UI) untuk label, judul, dan navigasi agar terasa profesional.
  * Mempertahankan *Monospace* **hanya** untuk angka nominal uang, tanggal, dan kode referensi guna menjaga ketepatan kalkulasi visual.
* **Icon-Driven (Iconable):** Setiap kategori pengeluaran, kantong, dan aksi utama wajib ditemani ikon visual agar mudah dikenali dalam hitungan detik (*scannable*).
* **Soft & Rounded Elevation:** Mengurangi sudut lancip (`borderRadius: 0`) diganti dengan sudut lengkung halus (`borderRadius: 16`), *card* berlapis lembut, dan *subtle shadows*.

---

## 2. New Color Palette & Design Constants (`src/constants/theme.ts`)

| Token Name | Hex Value / Definition | Usage Purpose |
| :--- | :--- | :--- |
| **Background Dark** | `#121214` (Deep Charcoal) | Warna latar belakang utama aplikasi (menggantikan `#000000`). |
| **Surface / Card** | `#1A1A1E` / `#222228` | Warna latar komponen kartu, modal, dan elemen interaktif. |
| **Text Primary** | `#F3F4F6` (Soft Off-White) | Teks utama / judul yang kontras tapi tidak menyilaukan mata. |
| **Text Secondary**| `#9CA3AF` (Muted Gray) | Subteks, tanggal, label keterangan. |
| **Accent / Brand** | `#6366F1` (Indigo Modern) | Tombol utama, indikator aktif, aksen navigasi. |
| **Success (Income)**| `#10B981` (Emerald Green) | Saldo positif, transaksi *INCOME*, status lunas (*PAID*). |
| **Warning (Due)** | `#F59E0B` (Warm Amber) | Tagihan yang mendekati jatuh tempo (`<= 3 days`). |
| **Danger (Expense)**| `#EF4444` (Soft Rose Red) | Transaksi *EXPENSE*, tagihan *OVERDUE*, saldo defisit. |

---

## 3. Step-by-Step Execution Phases

### **Phase 1: Design System & Icon Library Setup**
* **Dependencies:** Install `lucide-react-native` untuk kebutuhan ikon universal.
* **Theme Update:** Perbarui `src/constants/theme.ts` dengan palet warna Neo-Fintech dan struktur *spacing/radius* baru.
* **Component Refactor:** Sesuaikan `ThemedText` dan `ThemedButton` agar mendukung varian warna fungsional dan transisi yang lebih lembut.

### **Phase 2: Dashboard & Kantong Revamp**
* **Header Profile:** Desain ulang bagian atas dengan sapaan atau status sinkronisasi yang bersih, ditambah tombol akses cepat ke Settings bernuansa modern.
* **Aggregated Balance Card:** Kartu total saldo dibuat lebih menonjol dengan latar gradasi halus atau aksen *Emerald*, dilengkapi indikator status dompet secara *real-time*.
* **Kantong Cards:** Setiap kartu kantong dilengkapi **ikon representatif** (misal: dompet untuk operasional, celengan untuk tabungan), nominal saldo dengan font *monospace*, dan tombol aksi yang intuitif.

### **Phase 3: Transactions & Category Icons Integration**
* **Category Mapping:** Petakan setiap kategori (Food & Beverage, Bills, Obligations, Transport, Lifestyle, Salary, dll.) ke ikon spesifik dari `lucide-react-native` beserta warna pill-nya masing-masing.
* **ActionModal Revamp:** Form input transaksi dan kantong dibuat lebih lapang dengan *picker* kategori berbasis ikon yang interaktif dan *eyecatching*.

### **Phase 4: Bills & Wishlist Visual Polish**
* **Bills Card (Tags & Badges):** 
  * Tagihan normal: Kartu gelap dengan teks putih & ikon utilitas.
  * Tagihan *Due Soon* / *Overdue*: Kartu berubah warna dengan aksen *Amber* / *Rose* yang jelas tanpa harus menggunakan mode *invert* hitam-putih ekstrem.
* **Wishlist Grid & Progress:** 
  * Tampilan *grid* barang impian dengan *thumbnail* gambar lokal yang jernih.
  * Tambahan indikator *progress bar* visual yang menunjukkan seberapa dekat total saldo kantong mencapai harga barang tersebut.

### **Phase 5: Settings & System Hub Polish**
* Merapikan halaman *Settings* dengan tata letak menu bergaya modern (*List items with icons*), tombol *Theme Switcher* yang responsif, serta dialog konfirmasi *Reset Data* yang elegan dan aman.

---

const supabaseClient = window.supabaseClient;

// Menampilkan pesan
function tampilPesan(teks, warna = "white") {
    const pesan = document.getElementById("pesan");

    if (pesan) {
        pesan.textContent = teks;
        pesan.style.color = warna;
    }
}

// Mengambil semua data barang dari Supabase
async function ambilBarang() {
    const { data, error } = await supabaseClient
        .from("barang")
        .select("*")
        .order("nama");

    if (error) {
        throw error;
    }

    return data || [];
}

// Membuat baris tabel dengan aman
function buatBaris(tabel, nilai, jumlahKolom) {
    const baris = document.createElement("tr");

    if (nilai === null) {
        const kolom = document.createElement("td");
        kolom.colSpan = jumlahKolom;
        kolom.textContent = "Belum ada data barang.";
        baris.appendChild(kolom);
    } else {
        nilai.forEach(function(teks) {
            const kolom = document.createElement("td");
            kolom.textContent = teks;
            baris.appendChild(kolom);
        });
    }

    tabel.appendChild(baris);
}

// Memeriksa login
async function cekLogin() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}

// Logout
function aturLogout() {
    const tombolLogout = document.querySelector(".logout");

    if (tombolLogout) {
        tombolLogout.addEventListener("click", async function(event) {
            event.preventDefault();

            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                alert("Gagal logout. Silakan coba lagi.");
                return;
            }

            window.location.href = "index.html";
        });
    }
}

// Menampilkan Dashboard
async function tampilDashboard() {
    const tabel = document.getElementById("tabelBarang");

    if (!tabel) return;

    try {
        const barang = await ambilBarang();

        tabel.innerHTML = "";

        let totalStok = 0;
        let stokHabis = 0;

        barang.forEach(function(item, index) {
            totalStok += item.jumlah;

            if (item.jumlah <= 5) {
                stokHabis++;
            }

            const baris = document.createElement("tr");

            [
                index + 1,
                item.nama,
                item.kategori,
                item.jumlah,
                item.supplier || "-"
            ].forEach(function(nilai) {
                const kolom = document.createElement("td");
                kolom.textContent = nilai;
                baris.appendChild(kolom);
            });

            tabel.appendChild(baris);
        });

        if (barang.length === 0) {
            buatBaris(tabel, null, 5);
        }

        document.getElementById("totalJenis").textContent = barang.length;
        document.getElementById("totalStok").textContent = totalStok;
        document.getElementById("stokHabis").textContent = stokHabis;

    } catch (error) {
        console.error(error);
        buatBaris(tabel, ["Gagal mengambil data dari database."], 5);
    }
}

// Menambahkan Stok
const formTambah = document.getElementById("formTambah");

if (formTambah) {
    formTambah.addEventListener("submit", async function(event) {
        event.preventDefault();

        const nama = document.getElementById("nama").value.trim();
        const kategori = document.getElementById("kategori").value.trim();
        const jumlah = Number(document.getElementById("jumlah").value);
        const supplier = document.getElementById("supplier").value.trim();

        if (jumlah < 1 || !Number.isInteger(jumlah)) {
            tampilPesan("Jumlah harus berupa bilangan bulat lebih dari 0.", "red");
            return;
        }

        try {
            tampilPesan("Menyimpan data...");

            const barang = await ambilBarang();

            const itemLama = barang.find(function(item) {
                return item.nama.toLowerCase() === nama.toLowerCase();
            });

            let hasil;

            if (itemLama) {
                hasil = await supabaseClient
                    .from("barang")
                    .update({
                        jumlah: itemLama.jumlah + jumlah,
                        kategori: kategori,
                        supplier: supplier || itemLama.supplier
                    })
                    .eq("id", itemLama.id);
            } else {
                hasil = await supabaseClient
                    .from("barang")
                    .insert([{
                        nama: nama,
                        kategori: kategori,
                        jumlah: jumlah,
                        supplier: supplier
                    }]);
            }

            if (hasil.error) throw hasil.error;

            tampilPesan("Stok berhasil ditambahkan!", "green");
            formTambah.reset();

        } catch (error) {
            console.error(error);
            tampilPesan("Gagal menyimpan data. Periksa koneksi database.", "red");
        }
    });
}

// Mengurangi Stok
const formKurangi = document.getElementById("formKurangi");

if (formKurangi) {
    formKurangi.addEventListener("submit", async function(event) {
        event.preventDefault();

        const nama = document.getElementById("namaKurangi").value.trim();
        const jumlah = Number(document.getElementById("jumlahKurangi").value);
        const keterangan = document.getElementById("keterangan").value.trim();

        if (jumlah < 1 || !Number.isInteger(jumlah)) {
            tampilPesan("Jumlah pengurangan harus bilangan bulat lebih dari 0.", "red");
            return;
        }

        try {
            tampilPesan("Memproses pengurangan stok...");

            const barang = await ambilBarang();

            const item = barang.find(function(data) {
                return data.nama.toLowerCase() === nama.toLowerCase();
            });

            if (!item) {
                tampilPesan("Barang tidak ditemukan.", "red");
                return;
            }

            if (jumlah > item.jumlah) {
                tampilPesan("Stok tidak mencukupi. Stok tersedia: " + item.jumlah, "red");
                return;
            }

            const { error } = await supabaseClient
                .from("barang")
                .update({
                    jumlah: item.jumlah - jumlah
                })
                .eq("id", item.id);

            if (error) throw error;

            tampilPesan(
                "Stok berhasil dikurangi. Keterangan: " + keterangan,
                "green"
            );

            formKurangi.reset();

        } catch (error) {
            console.error(error);
            tampilPesan("Gagal mengurangi stok. Periksa koneksi database.", "red");
        }
    });
}

// Mencari Barang
const formCari = document.getElementById("formCari");

if (formCari) {
    formCari.addEventListener("submit", async function(event) {
        event.preventDefault();

        const keyword = document.getElementById("keyword")
            .value.trim().toLowerCase();

        const hasil = document.getElementById("hasilCari");

        try {
            const barang = await ambilBarang();

            const ditemukan = barang.filter(function(item) {
                return item.nama.toLowerCase().includes(keyword) ||
                       item.kategori.toLowerCase().includes(keyword);
            });

            hasil.innerHTML = "";

            if (ditemukan.length === 0) {
                const baris = document.createElement("tr");
                const kolom = document.createElement("td");

                kolom.colSpan = 4;
                kolom.textContent = "Barang tidak ditemukan.";

                baris.appendChild(kolom);
                hasil.appendChild(baris);
                return;
            }

            ditemukan.forEach(function(item) {
                buatBaris(hasil, [
                    item.nama,
                    item.kategori,
                    item.jumlah,
                    item.supplier || "-"
                ], 4);
            });

        } catch (error) {
            console.error(error);
            hasil.innerHTML = "";

            const baris = document.createElement("tr");
            const kolom = document.createElement("td");

            kolom.colSpan = 4;
            kolom.textContent = "Gagal mengambil data dari database.";

            baris.appendChild(kolom);
            hasil.appendChild(baris);
        }
    });
}

// Menjalankan aplikasi
async function mulaiAplikasi() {
    if (!supabaseClient) {
        alert("Koneksi Supabase belum tersedia.");
        return;
    }

    const berhasilLogin = await cekLogin();

    if (!berhasilLogin) return;

    aturLogout();

    await tampilDashboard();
}

mulaiAplikasi();

console.log("APP.JS LOADED");
// =====================================
// APP.JS
// REGISTRASI SUPPLIER
// =====================================

const form = document.getElementById("formRegistrasi");

// =====================================
// AUTO NAMA SUPPLIER
// =====================================

const kodeSupplier = document.getElementById("kode_supplier");
const supplierCard = document.getElementById("supplierCard");
const supplierStatus = document.getElementById("supplierStatus");
const namaSupplier = document.getElementById("nama_supplier");

let timer;

kodeSupplier.addEventListener("input", function () {

    clearTimeout(timer);

    const kode = this.value.trim();

    if (kode == "") {

        supplierCard.style.display = "none";
        supplierStatus.innerHTML = "Ketik kode supplier.";
        namaSupplier.textContent = "-";

        return;

    }

    supplierStatus.innerHTML = "🔄 Mencari supplier...";

    timer = setTimeout(async () => {

        const { data, error } = await db
    .from("supplier")
    .select("*");

console.log(data);
console.log(error);
console.log("Kode yang dicari:", kode);
console.log("Data supplier:", data);
console.log("Error:", error);
        if (error) {

            console.log(error);

            supplierStatus.innerHTML =
                "❌ Terjadi kesalahan.";

            supplierCard.style.display = "none";

            return;

        }

        if (!data) {

            supplierStatus.innerHTML =
                "❌ Supplier tidak ditemukan.";

            supplierCard.style.display = "none";

            namaSupplier.textContent = "-";

            return;

        }

        namaSupplier.textContent =
            data.nama_supplier;

        supplierCard.style.display = "block";

        supplierStatus.innerHTML =
            "✅ Supplier ditemukan.";

        document
            .getElementById("nomor_kendaraan")
            .focus();

    }, 500);

});
// =====================================
// SUBMIT
// =====================================

form.addEventListener("submit", async function(e){

    e.preventDefault();

    const kode_supplier =
    document.getElementById("kode_supplier").value.trim();

   const nama_supplier =
document.getElementById("nama_supplier").textContent.trim();

    const nomor_kendaraan =
    document.getElementById("nomor_kendaraan").value.trim();

    const nama_supir =
    document.getElementById("nama_supir").value.trim();

    const no_identitas =
    document.getElementById("no_identitas").value.trim();

    const no_hp =
    document.getElementById("no_hp").value.trim();

    const jenis_kendaraan =
    document.getElementById("jenis_kendaraan").value;

    const warna_antrian =
    document.getElementById("warna_antrian").value;

    if(
        kode_supplier=="" ||
        nama_supplier=="" ||
        nomor_kendaraan=="" ||
        nama_supir==""
    ){

        alert("Data belum lengkap");
        return;

    }

    let prefix="";

    switch(warna_antrian){

        case "MERAH":
            prefix="M";
        break;

        case "KUNING":
            prefix="K";
        break;

        case "HIJAU":
            prefix="H";
        break;

        case "PUTIH":
            prefix="P";
        break;

        case "EXPRESS":
            prefix="E";
        break;

    }
      // =====================================
    // HITUNG NOMOR ANTRIAN
    // =====================================
const { data: rows, error: errRows } = await db
    .from("registrasi")
    .select("nomor_antrian")
    .eq("warna_antrian", warna_antrian);
console.log("ROWS =", rows);
console.log("ERROR =", errRows);
console.log("ROWS =", rows);
console.log("WARNA =", warna_antrian);
console.log("ERROR =", errRows);

if (errRows) {

    console.log(errRows);
    alert(errRows.message);
    return;

}

    let nomorTerakhir = 0;

    if(rows && rows.length > 0){

        rows.forEach(function(item){

            if(item.nomor_antrian){

                const angka = parseInt(
                    item.nomor_antrian.replace(/[^0-9]/g,"")
                );

                if(angka > nomorTerakhir){

                    nomorTerakhir = angka;

                }

            }

        });

    }

    const nomor = nomorTerakhir + 1;

    const nomor_antrian =
    prefix + String(nomor).padStart(4,"0");

    console.log("Nomor Baru :", nomor_antrian);
    // =====================================
    // SIMPAN KE DATABASE
    // =====================================

    const { error: insertError } = await db
    .from("registrasi")
    .insert([
        {
            tanggal: new Date().toISOString(),
            kode_supplier: kode_supplier,
            nama_supplier: nama_supplier,
            nomor_kendaraan: nomor_kendaraan,
            nama_supir: nama_supir,
            no_identitas: no_identitas,
            no_hp: no_hp,
            jenis_kendaraan: jenis_kendaraan,
            warna_antrian: warna_antrian,
            nomor_antrian: nomor_antrian
        }
    ]);

    if(insertError){

        console.log(insertError);
        alert(insertError.message);
        return;

    }

    let icon = "";

switch (warna_antrian) {

    case "MERAH":
        icon = "🔴";
        break;

    case "KUNING":
        icon = "🟡";
        break;

    case "HIJAU":
        icon = "🟢";
        break;

    case "PUTIH":
        icon = "⚪";
        break;

    case "EXPRESS":
        icon = "🩷";
        break;

}
console.log(document.getElementById("ticketNumber"));
console.log(document.getElementById("ticketKategori"));
const ticketNumber = document.getElementById("ticketNumber");
const ticketKategori = document.getElementById("ticketKategori");

ticketNumber.innerHTML = nomor_antrian;
ticketKategori.innerHTML = icon + " " + warna_antrian;
    // ===============================
// WARNA BACKGROUND NOMOR ANTRIAN
// ===============================

ticketNumber.style.background = "";
ticketNumber.style.color = "#ffffff";

switch (warna_antrian) {

    case "MERAH":
        ticketNumber.style.background = "#dc3545";
        break;

    case "KUNING":
        ticketNumber.style.background = "#ffc107";
        ticketNumber.style.color = "#000000";
        break;

    case "HIJAU":
        ticketNumber.style.background = "#198754";
        break;

    case "PUTIH":
        ticketNumber.style.background = "#6c757d";
        break;

    case "EXPRESS":
        ticketNumber.style.background = "#ff4fa3";
        break;

}

// ===============================
// TAMPILKAN MODAL
// ===============================

const modal = new bootstrap.Modal(
    document.getElementById("ticketModal")
);

modal.show();

form.reset();

// Reset tampilan supplier
document.getElementById("supplierCard").style.display = "none";
document.getElementById("nama_supplier").textContent = "-";
document.getElementById("supplierStatus").innerHTML = "Ketik kode supplier.";

});

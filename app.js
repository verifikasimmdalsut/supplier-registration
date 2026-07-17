// =====================================
// APP.JS
// REGISTRASI SUPPLIER
// =====================================

const form = document.getElementById("formRegistrasi");

// =====================================
// AUTO NAMA SUPPLIER
// =====================================

document
.getElementById("kode_supplier")
.addEventListener("change", async function () {

    const kode = this.value.trim();

    document.getElementById("nama_supplier").value = "";

    if(kode=="") return;

    const { data, error } = await db
    .from("supplier")
    .select("nama_supplier")
    .eq("kode_supplier", kode)
    .maybeSingle();

    if(error){

        console.log(error);
        alert(error.message);
        return;

    }

    if(!data){

        alert("Kode Supplier tidak ditemukan");
        return;

    }

    document.getElementById("nama_supplier").value =
    data.nama_supplier;

});

// =====================================
// SUBMIT
// =====================================

form.addEventListener("submit", async function(e){

    e.preventDefault();

    const kode_supplier =
    document.getElementById("kode_supplier").value.trim();

    const nama_supplier =
    document.getElementById("nama_supplier").value.trim();

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

});

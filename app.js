// ===============================
// REGISTRASI SUPPLIER
// ===============================

const form = document.getElementById("formRegistrasi");

// ===============================
// AUTO NAMA SUPPLIER
// ===============================

document.getElementById("kode_supplier").addEventListener("change", async function () {

    const kode = this.value.trim();

    if (kode === "") {
        document.getElementById("nama_supplier").value = "";
        return;
    }

    const { data, error } = await db
        .from("supplier")
        .select("nama_supplier")
        .eq("kode_supplier", kode)
        .maybeSingle();

    if (error) {
        console.error(error);
        return;
    }

    if (!data) {
        document.getElementById("nama_supplier").value = "";
        alert("Kode Supplier tidak ditemukan");
        return;
    }

    document.getElementById("nama_supplier").value = data.nama_supplier;

});

// ===============================
// SUBMIT
// ===============================

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const kode_supplier = document.getElementById("kode_supplier").value.trim();
    const nama_supplier = document.getElementById("nama_supplier").value;
    const nomor_kendaraan = document.getElementById("nomor_kendaraan").value;
    const nama_supir = document.getElementById("nama_supir").value;
    const no_identitas = document.getElementById("no_identitas").value;
    const no_hp = document.getElementById("no_hp").value;
    const jenis_kendaraan = document.getElementById("jenis_kendaraan").value;
    const warna_antrian = document.getElementById("warna_antrian").value;

    if (
        kode_supplier === "" ||
        nama_supplier === "" ||
        nomor_kendaraan === "" ||
        nama_supir === ""
    ) {
        alert("Data belum lengkap");
        return;
    }

    let prefix = "";

    switch (warna_antrian) {
        case "MERAH":
            prefix = "M";
            break;
        case "KUNING":
            prefix = "K";
            break;
        case "HIJAU":
            prefix = "H";
            break;
        case "PUTIH":
            prefix = "P";
            break;
        case "EXPRESS":
            prefix = "E";
            break;
    }

    const { data: list, error: errList } = await db
        .from("registrasi")
        .select("nomor_antrian")
        .eq("warna_antrian", warna_antrian);

    if (errList) {
        alert(errList.message);
        return;
    }

    let nomor = list ? list.length + 1 : 1;

    const nomor_antrian = prefix + String(nomor).padStart(4, "0");

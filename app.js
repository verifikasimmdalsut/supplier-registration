// ==============================
// REGISTRASI SUPPLIER
// ==============================

const form = document.getElementById("formRegistrasi");

// ==============================
// AUTO NAMA SUPPLIER
// ==============================

document.getElementById("kode_supplier").addEventListener("change", async function () {

    const kode = this.value.trim();

    document.getElementById("nama_supplier").value = "";

    if (kode === "") return;

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
        alert("Kode Supplier tidak ditemukan");
        return;
    }

    document.getElementById("nama_supplier").value = data.nama_supplier;

});

// ==============================
// SUBMIT
// ==============================

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const kode_supplier = document.getElementById("kode_supplier").value.trim();
    const nama_supplier = document.getElementById("nama_supplier").value.trim();
    const nomor_kendaraan = document.getElementById("nomor_kendaraan").value.trim();
    const nama_supir = document.getElementById("nama_supir").value.trim();
    const no_identitas = document.getElementById("no_identitas").value.trim();
    const no_hp = document.getElementById("no_hp").value.trim();
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

    // ==========================
    // PREFIX
    // ==========================

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

    // ==========================
    // HITUNG NOMOR
    // ==========================

    const { data: list, error: err1 } = await db
        .from("registrasi")
        .select("nomor_antrian")
        .eq("warna_antrian", warna_antrian);

    if (err1) {
        console.error(err1);
        alert(JSON.stringify(err1, null, 2));
        return;
    }

    const nomor = (list?.length || 0) + 1;

    const nomor_antrian =
        prefix + String(nomor).padStart(4, "0");

    // ==========================
    // INSERT
    // ==========================

    const { error } = await db
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

    if (error) {
        console.error(error);
        alert(JSON.stringify(error, null, 2));
        return;
    }

    alert("Registrasi Berhasil!\n\nNomor Antrian : " + nomor_antrian);

    form.reset();

});

// ===============================
// SIMPAN KE DATABASE
// ===============================

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

alert(
  "Registrasi Berhasil\n\nNomor Antrian : " + nomor_antrian
);

form.reset();

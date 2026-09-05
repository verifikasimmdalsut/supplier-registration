// ==========================================
// AEON Registrasi Supplier — app.js
// Logic form: cari supplier, validasi, submit
// (Menggunakan koneksi sb dari supabase.js)
// ==========================================

// --- Kode Akses Security (harian) ---
const KODE_AKSES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR32zY8ej5YFqxPsxHIUPxNHWpwfcTWKTy-jal-IomBj58EsZVuglItP6Fju02nYHQ97FgEVt-nbhNU/pub?output=csv';

// --- Elemen ---
const kodeInput = document.getElementById('kode_supplier');
const supplierStatus = document.getElementById('supplierStatus');
const supplierCard = document.getElementById('supplierCard');
const namaSupplierEl = document.getElementById('nama_supplier');
const form = document.getElementById('formRegistrasi');
const btnDaftar = document.getElementById('btnDaftar');
const kodeAksesInput = document.getElementById('kode_akses_security');

let verifiedSupplier = null;
let searchTimer = null;

// Mapping nilai warna_antrian ke class CSS tiket
const TICKET_COLOR_CLASS = {
  'MERAH': 'ticket-merah',
  'KUNING': 'ticket-kuning',
  'HIJAU': 'ticket-hijau',
  'PUTIH': 'ticket-putih',
  'EXPRESS': 'ticket-express',
};

// --- Pencarian supplier (live search, debounce 400ms) ---
function setStatus(type, text){
  supplierStatus.className = 'status-text' + (type ? ' ' + type : '');
  supplierStatus.textContent = text;
}

async function cariSupplier(kode){
  if(!kode){
    setStatus('', 'Ketik kode supplier...');
    supplierCard.style.display = 'none';
    verifiedSupplier = null;
    return;
  }

  setStatus('', 'Mencari...');

  const { data, error } = await sb
    .from('supplier')
    .select('kode_supplier, nama_supplier')
    .ilike('kode_supplier', kode)
    .limit(1)
    .maybeSingle();

  // Hindari race condition: pastikan input belum berubah lagi
  if(kodeInput.value.trim() !== kode) return;

  if(error){
    verifiedSupplier = null;
    supplierCard.style.display = 'none';
    setStatus('error', 'Gagal terhubung ke server. Coba lagi.');
    return;
  }

  if(data){
    verifiedSupplier = { code: data.kode_supplier, name: data.nama_supplier };
    namaSupplierEl.textContent = data.nama_supplier;
    supplierCard.style.display = 'flex';
    setStatus('success', 'Kode supplier ditemukan.');
  } else {
    verifiedSupplier = null;
    supplierCard.style.display = 'none';
    setStatus('error', 'Kode supplier tidak ditemukan.');
  }
}

kodeInput.addEventListener('input', () => {
  const kode = kodeInput.value.trim();
  clearTimeout(searchTimer);
  if(!kode){
    setStatus('', 'Ketik kode supplier...');
    supplierCard.style.display = 'none';
    verifiedSupplier = null;
    return;
  }
  searchTimer = setTimeout(() => cariSupplier(kode), 400);
});

// --- Ambil kode akses security yang berlaku hari ini ---
function formatTanggalHariIni(){
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return dd + '/' + mm + '/' + yyyy;
}

// Parser CSV sederhana (aman selama tidak ada koma di dalam value)
function parseCSV(text){
  return text
    .trim()
    .split('\n')
    .map(baris => baris.split(',').map(v => v.trim()));
}

async function ambilKodeAksesHariIni(){
  const res = await fetch(KODE_AKSES_CSV_URL + '&_=' + Date.now(), { cache: 'no-store' });
  if(!res.ok) throw new Error('Gagal ambil data kode akses');

  const rows = parseCSV(await res.text());
  const header = rows[0]; // ID, Tanggal, Kode
  const idxTanggal = header.indexOf('Tanggal');
  const idxKode = header.indexOf('Kode');

  const tanggalHariIni = formatTanggalHariIni();

  // Ambil baris TERAKHIR yang tanggalnya = hari ini
  // (asumsi: baris baru selalu ditambahkan di bawah oleh AppSheet)
  let kodeTerbaru = null;
  for(let i = 1; i < rows.length; i++){
    const baris = rows[i];
    if(!baris[idxTanggal]) continue;
    const tanggalBaris = baris[idxTanggal].split(' ')[0]; // ambil "dd/mm/yyyy" saja
    if(tanggalBaris === tanggalHariIni){
      kodeTerbaru = baris[idxKode];
    }
  }

  return kodeTerbaru; // null kalau belum ada kode yang diisi hari ini
}

// --- Validasi field wajib ---
const REQUIRED_FIELDS = {
  nomor_kendaraan: 'Nomor kendaraan wajib diisi.',
  nama_supir: 'Nama supir wajib diisi.',
  no_identitas: 'Nomor identitas wajib diisi.',
  no_hp: 'Nomor HP wajib diisi.',
  jenis_kendaraan: 'Pilih jenis kendaraan.',
  warna_antrian: 'Pilih warna antrian.',
};

Object.keys(REQUIRED_FIELDS).forEach(id => {
  const el = document.getElementById(id);
  const evt = el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(evt, () => {
    el.classList.remove('is-invalid');
    const err = document.getElementById('err_' + id);
    if(err) err.textContent = '';
  });
});

function validateForm(){
  let valid = true;

  if(!verifiedSupplier){
    setStatus('error', 'Cari dan pastikan kode supplier ditemukan dulu.');
    kodeInput.classList.add('is-invalid');
    valid = false;
  }

  const values = {};
  Object.entries(REQUIRED_FIELDS).forEach(([id, msg]) => {
    const el = document.getElementById(id);
    const val = el.value.trim();
    values[id] = val;
    if(!val){
      el.classList.add('is-invalid');
      const err = document.getElementById('err_' + id);
      if(err) err.textContent = msg;
      valid = false;
    }
  });

  return { valid, values };
}

// --- Submit form ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const { valid, values } = validateForm();
  if(!valid) return;

  // Validasi kode akses dari security
  const kodeAksesInputVal = kodeAksesInput.value.trim();
  if(!kodeAksesInputVal){
    kodeAksesInput.classList.add('is-invalid');
    const err = document.getElementById('err_kode_akses_security');
    if(err) err.textContent = 'Wajib diisi. Minta kode ke security.';
    return;
  }

  const originalHtml = btnDaftar.innerHTML;
  btnDaftar.disabled = true;
  btnDaftar.innerHTML = 'Memeriksa kode akses...';

  let kodeAksesValid;
  try{
    kodeAksesValid = await ambilKodeAksesHariIni();
  }catch(err){
    console.error(err);
    btnDaftar.disabled = false;
    btnDaftar.innerHTML = originalHtml;
    kodeAksesInput.classList.add('is-invalid');
    const errEl = document.getElementById('err_kode_akses_security');
    if(errEl) errEl.textContent = 'Gagal memeriksa kode akses. Coba lagi.';
    return;
  }

  if(!kodeAksesValid || kodeAksesInputVal !== String(kodeAksesValid).trim()){
    btnDaftar.disabled = false;
    btnDaftar.innerHTML = originalHtml;
    kodeAksesInput.classList.add('is-invalid');
    const errEl = document.getElementById('err_kode_akses_security');
    if(errEl) errEl.textContent = kodeAksesValid
      ? 'Kode akses salah. Minta kode yang benar ke security.'
      : 'Kode akses hari ini belum diisi security.';
    return;
  }

  btnDaftar.innerHTML = 'Menyimpan...';

  try{
    const warnaAntrian = values.warna_antrian;

    // Hitung nomor antrian: urut harian per warna antrian
   const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const { data: lastQueue, error: queueError } = await sb
  .from('registrasi')
  .select('nomor_antrian')
  .eq('warna_antrian', warnaAntrian)
  .gte('tanggal', startOfDay.toISOString())
  .order('nomor_antrian', { ascending: false })
  .limit(1)
  .maybeSingle();

if(queueError) throw queueError;

let nomorAntrian;

if(lastQueue && lastQueue.nomor_antrian){
  const nomorTerakhir = parseInt(lastQueue.nomor_antrian, 10) || 0;
  nomorAntrian = String(nomorTerakhir + 1).padStart(3, '0');
} else {
  nomorAntrian = '001';
}

    const { error: insertError } = await sb.from('registrasi').insert({
      kode_supplier: verifiedSupplier.code,
      nama_supplier: verifiedSupplier.name,
      nomor_kendaraan: values.nomor_kendaraan,
      nama_supir: values.nama_supir,
      no_identitas: values.no_identitas,
      no_hp: values.no_hp,
      jenis_kendaraan: values.jenis_kendaraan,
      warna_antrian: warnaAntrian,
      nomor_antrian: nomorAntrian,
    });

    if(insertError) throw insertError;

    // Isi & tampilkan modal tiket
    const ticketContent = document.getElementById('ticketModalContent');
    ticketContent.className = 'modal-content ticket-modal ' + (TICKET_COLOR_CLASS[warnaAntrian] || '');

    document.getElementById('ticketWarna').textContent = warnaAntrian;
    document.getElementById('ticketNomorAntrian').textContent = nomorAntrian;
    document.getElementById('ticketNamaSupplier').textContent = verifiedSupplier.name;

    // Format nomor antrian sesuai sheet checker: gabung angka (tanpa nol depan) + warna, contoh "5MERAH"
    const noAntrianSheet = String(parseInt(nomorAntrian, 10)) + warnaAntrian;
    document.getElementById('btnCekStatus').href = 'status-antrian.html?no=' + encodeURIComponent(noAntrianSheet) + '&nama=' + encodeURIComponent(verifiedSupplier.name);

    const ticketModal = new bootstrap.Modal(document.getElementById('ticketModal'));
    ticketModal.show();

    // Reset form setelah modal ditutup
    document.getElementById('ticketModal').addEventListener('hidden.bs.modal', () => {
      form.reset();
      verifiedSupplier = null;
      supplierCard.style.display = 'none';
      setStatus('', 'Ketik kode supplier...');
      kodeAksesInput.classList.remove('is-invalid');
      const errEl = document.getElementById('err_kode_akses_security');
      if(errEl) errEl.textContent = '';
    }, { once: true });

  }catch(err){
    setStatus('error', 'Gagal menyimpan data. Coba lagi.');
    console.error(err);
  }finally{
    btnDaftar.disabled = false;
    btnDaftar.innerHTML = originalHtml;
  }
});

/* =========================
   SUMBER DATA (Google Sheets, tab APLIKASI)
   gid=1633452008 -> tab "APLIKASI"
========================= */

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1mwiKR2YB37biTQ6sBQNlBJJM3Vt9ymxD5XAcXFIrcoQ/export?format=csv&gid=1633452008";


let RETURN_DATA = [];

const ALLOWED_STATUS = [
  "PENDING",
  "ACCEPTED GRN",
  "PRE-GRN-PRINTED"
];


/* =========================
   TANGGAL PEMUSNAHAN
   (berdasarkan kategori merchandise per departemen)

   - GROCERY          : dept 2001-2011              -> pemusnahan hari ke-11
   - DAILY & DAIRY     : dept 2025-2030              -> pemusnahan hari ke-11
   - NON FOOD          : dept 2014-2019              -> pemusnahan hari ke-16
   - HBC               : dept 2020-2024              -> pemusnahan hari ke-16
   - HSD KIDS          : dept 3001-3051, 1001-1100   -> pemusnahan hari ke-21
========================= */

function getMerchandiseCategory(deptStr){

  const dept = parseInt(deptStr, 10);

  if(isNaN(dept)){
    return null;
  }

  if(dept >= 2001 && dept <= 2011){
    return { label: "GROCERY", pemusnahanHari: 11 };
  }

  if(dept >= 2025 && dept <= 2030){
    return { label: "DAILY & DAIRY", pemusnahanHari: 11 };
  }

  if(dept >= 2014 && dept <= 2019){
    return { label: "NON FOOD", pemusnahanHari: 16 };
  }

  if(dept >= 2020 && dept <= 2024){
    return { label: "HBC", pemusnahanHari: 16 };
  }

  if((dept >= 3001 && dept <= 3051) || (dept >= 1001 && dept <= 1100)){
    return { label: "HSD DAN KIDS", pemusnahanHari: 21 };
  }

  return null;

}


/* =========================
   NAMA DEPARTEMEN
   (biar supplier tau kode departemennya itu apa)
========================= */

const DEPARTMENT_NAMES = {
  2001: "Confectionary",
  2002: "Snack",
  2003: "Seasonal",
  2004: "Seasoning",
  2005: "Material",
  2006: "Imported Food",
  2007: "Non Halal Grocery",
  2009: "Hot Beverage",
  2010: "Cold Beverage",
  2011: "Beer",
  2014: "Pet Care",
  2015: "Cleaning",
  2016: "Sanitary",
  2017: "Tobacco",
  2020: "Toiletries",
  2021: "Skin Care",
  2022: "Grooming",
  2023: "Prescription Poison",
  2024: "Health Support",
  2025: "Daily Food",
  2026: "Bread",
  2027: "Fresh Drink",
  2028: "Dairy Product",
  2029: "Processed Food",
  2030: "Ice-cream & Dessert",
  2031: "Fresh Seafood",
  2032: "Processed Seafood",
  2033: "Red Meat",
  2034: "Poultry",
  2035: "Pork",
  2036: "Ham - Sausage - Pickles",
  2037: "Vegetable",
  2038: "Fruit",
  2039: "Delica",
  2040: "Sushi",
  2041: "Bakery",
  2042: "Bakery"
};


function getDepartmentName(deptStr){

  const dept = parseInt(deptStr, 10);

  return DEPARTMENT_NAMES[dept] || null;

}


function formatDepartmentLabel(deptStr){

  const name =
    getDepartmentName(deptStr);

  return name
    ? deptStr + " - " + name
    : String(deptStr);

}


function parseFlexibleDate(str){

  if(!str){
    return null;
  }

  const s = str.trim();

  /* format ISO: 2026-07-01 */
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if(m){
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  /* format Indonesia: 01/07/2026 */
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if(m){
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }

  return null;

}


function formatDateID(date){

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;

}


function rollToNextMonday(date){

  const d = new Date(date);
  const day = d.getDay();  // 0=Minggu, 1=Senin, ... 6=Sabtu

  let diff;

  if(day === 1){
    diff = 0;               // udah Senin
  }else if(day === 0){
    diff = 1;                // Minggu -> besoknya Senin
  }else{
    diff = 8 - day;          // Selasa..Sabtu -> maju ke Senin berikutnya
  }

  d.setDate(d.getDate() + diff);

  return d;

}


function getPemusnahanInfo(dateCreatedStr, deptStr){

  const category =
    getMerchandiseCategory(deptStr);

  const createdDate =
    parseFlexibleDate(dateCreatedStr);

  if(!category || !createdDate){
    return null;
  }

  let pemusnahanDate =
    new Date(createdDate);

  pemusnahanDate.setDate(
    pemusnahanDate.getDate() + category.pemusnahanHari
  );

  /* pemusnahan hanya dilakukan dihari Senin */
  pemusnahanDate =
    rollToNextMonday(pemusnahanDate);

  return {
    category: category.label,
    hari: category.pemusnahanHari,
    tanggal: formatDateID(pemusnahanDate)
  };

}


/* =========================
   ELEMENT
========================= */

const supplierSection =
  document.getElementById("supplierSection");

const detailSection =
  document.getElementById("detailSection");

const supplierList =
  document.getElementById("supplierList");

const supplierCount =
  document.getElementById("supplierCount");

const searchInput =
  document.getElementById("searchSupplier");


/* =========================
   PARSER CSV
   (aman terhadap koma di dalam field & tanda kutip,
   karena Google Sheets otomatis quote field yang ada komanya)
========================= */

function parseCSV(text){

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for(let i = 0; i < text.length; i++){

    const char = text[i];
    const next = text[i + 1];

    if(inQuotes){

      if(char === '"' && next === '"'){
        field += '"';
        i++;
      }else if(char === '"'){
        inQuotes = false;
      }else{
        field += char;
      }

    }else{

      if(char === '"'){
        inQuotes = true;
      }else if(char === ","){
        row.push(field);
        field = "";
      }else if(char === "\r"){
        /* abaikan */
      }else if(char === "\n"){
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }else{
        field += char;
      }

    }

  }

  if(field.length > 0 || row.length > 0){
    row.push(field);
    rows.push(row);
  }

  return rows;

}


/* =========================
   AMBIL & MAPPING DATA
   (cari kolom berdasarkan NAMA header,
   bukan posisi tetap, biar tahan perubahan struktur sheet)
========================= */

async function loadReturnData(){

  const res = await fetch(CSV_URL);

  if(!res.ok){
    throw new Error("Gagal mengambil data (" + res.status + ")");
  }

  const text = await res.text();
  const rows = parseCSV(text);

  let headerIndex = -1;
  let headerRow = null;

  for(let i = 0; i < rows.length; i++){

    if(rows[i].some(cell => cell.trim() === "Date Created")){
      headerIndex = i;
      headerRow = rows[i];
      break;
    }

  }

  if(headerIndex === -1){
    throw new Error("Header 'Date Created' tidak ditemukan di sheet");
  }


  const col = {};
  let supplierColSeen = 0;

  headerRow.forEach((name, idx) => {

    const n = name.trim();

    if(n === "Supplier"){

      supplierColSeen++;

      if(supplierColSeen === 1){
        col.supplierCode = idx;
      }else{
        col.supplierName = idx;
      }

    }else if(n === "Date Created"){
      col.date = idx;
    }else if(n === "Department"){
      col.department = idx;
    }else if(n === "Supplier Contract"){
      col.supplierContract = idx;
    }else if(n === "Return No"){
      col.returnNo = idx;
    }else if(n === "Status"){
      col.status = idx;
    }else if(n === "Short Sku" || n === "Short SKU"){
      col.shortSku = idx;
    }else if(n === "Item Desc"){
      col.itemDesc = idx;
    }else if(n === "Qty Return"){
      col.qty = idx;
    }else if(n === "Aging Day"){
      col.aging = idx;
    }else if(n === "Dept."){
      col.dept = idx;
    }else if(n === "Location"){
      col.location = idx;
    }

  });


  const data = [];

  for(let i = headerIndex + 1; i < rows.length; i++){

    const r = rows[i];

    const returnNo =
      (r[col.returnNo] || "").trim();

    const supplierCode =
      (r[col.supplierCode] || "").trim();

    /* lewati baris kosong / pemisah section di sheet */
    if(!returnNo || !supplierCode){
      continue;
    }

    const status =
      (r[col.status] || "").trim().toUpperCase();

    /* hanya tampilkan status yang relevan buat supplier */
    if(!ALLOWED_STATUS.includes(status)){
      continue;
    }

    data.push({
      date: (r[col.date] || "").trim(),
      department: (r[col.department] || "").trim(),
      supplierCode: supplierCode,
      supplier: (r[col.supplierName] || "").trim(),
      supplierContract: (r[col.supplierContract] || "").trim(),
      returnNo: returnNo,
      status: status,
      shortSku: (r[col.shortSku] || "").trim(),
      itemDesc: (r[col.itemDesc] || "").trim(),
      qty: parseFloat(r[col.qty]) || 0,
      aging: parseInt(r[col.aging], 10) || 0,
      location: col.location !== undefined ? (r[col.location] || "").trim() : ""
    });

  }

  return data;

}


/* =========================
   GROUP SUPPLIER
========================= */

function groupBySupplier(data){

  const result = {};

  data.forEach(row => {

    const code = String(row.supplierCode);

    if(!result[code]){

      result[code] = {
        code: code,
        name: row.supplier,
        rows: []
      };

    }

    result[code].rows.push(row);

  });

  return Object.values(result);

}


/* =========================
   HITUNG SLIP
========================= */

function countSlip(rows){

  return new Set(
    rows.map(row => String(row.returnNo))
  ).size;

}


/* =========================
   TAMPIL SUPPLIER
========================= */

function renderSuppliers(data){

  const suppliers =
    groupBySupplier(data);

  supplierCount.textContent =
    suppliers.length + " Supplier";


  if(suppliers.length === 0){

    supplierList.innerHTML = `
      <p style="text-align:center;color:#777;padding:30px 0;grid-column:1/-1;">
        Tidak ada data return.
      </p>
    `;

    return;

  }


  supplierList.innerHTML =
    suppliers.map(supplier => {

      const slipCount =
        countSlip(supplier.rows);

      return `

        <div
          class="supplier-card"
          onclick="openSupplier('${supplier.code}')"
        >

          <div class="supplier-name">
            ${supplier.name}
          </div>

          <div class="supplier-code">
            Kode Supplier: ${supplier.code}
          </div>

          <div class="slip-number">
            ${slipCount}
          </div>

          <div class="slip-label">
            Jumlah Slip Return
          </div>

          <div class="arrow">
            ›
          </div>

        </div>

      `;

    }).join("");

}


/* =========================
   GROUP SLIP
========================= */

function groupBySlip(rows){

  const result = {};

  rows.forEach(row => {

    const slip =
      String(row.returnNo);

    if(!result[slip]){
      result[slip] = [];
    }

    result[slip].push(row);

  });

  return result;

}


/* =========================
   STATUS
========================= */

function statusBadge(status){

  const classMap = {
    "PENDING": "status-pending",
    "ACCEPTED GRN": "status-updated",
    "PRE-GRN-PRINTED": "status-preprinted"
  };

  const cls =
    classMap[status] || "status-cancel";

  return `
    <span class="${cls}">
      ${status}
    </span>
  `;

}


/* =========================
   BUKA DETAIL SUPPLIER
========================= */

function openSupplier(code){

  const supplier =
    groupBySupplier(RETURN_DATA)
      .find(item =>
        item.code === String(code)
      );


  if(!supplier){

    alert("Supplier tidak ditemukan");

    return;

  }


  const slipGroups =
    groupBySlip(supplier.rows);


  let html = `

    <div class="slip-title">

      DAFTAR SLIP RETURN

      <span style="
        float:right;
        color:#777;
        font-weight:normal;
        font-size:11px;
      ">
        ${Object.keys(slipGroups).length} Slip
      </span>

    </div>

  `;


  Object.entries(slipGroups)
    .forEach(([slipNo, items]) => {

      const first =
        items[0];


      html += `

        <div class="slip-card">

          <div
            class="slip-head"
            onclick="toggleSlip(this)"
          >

            <div class="slip-no">
              No. Slip: ${slipNo}
            </div>

            <div class="meta">
              Tanggal
              <strong>
                ${first.date}
              </strong>
            </div>

            <div class="meta">
              Status
              <strong>
                ${statusBadge(first.status)}
              </strong>
            </div>

            <div class="meta">
              Jumlah Item
              <strong>
                ${items.length} Item
              </strong>
            </div>

            <div class="meta">
              Aging
              <strong>
                ${first.aging} Hari
              </strong>
            </div>

            <div class="slip-arrow">
              ⌄
            </div>

          </div>


          <div class="items">

            <table>

              <thead>

                <tr>
                  <th>No</th>
                  <th>Item Description</th>
                  <th>Short SKU</th>
                  <th>Qty Return</th>
                  <th>Aging Day</th>
                  <th>Dept.</th>
                  <th>Tgl Pemusnahan</th>
                </tr>

              </thead>

              <tbody>

                ${items.map((item, index) => {

                  const pemusnahan =
                    getPemusnahanInfo(first.date, item.department);

                  return `

                  <tr>

                    <td>
                      ${index + 1}
                    </td>

                    <td>
                      ${item.itemDesc}
                    </td>

                    <td>
                      ${item.shortSku}
                    </td>

                    <td>
                      ${Number(item.qty).toFixed(2)}
                    </td>

                    <td>
                      ${item.aging}
                    </td>

                    <td>
                      ${formatDepartmentLabel(item.department)}
                    </td>

                    <td>
                      ${
                        pemusnahan
                          ? `<span class="pemusnahan-badge" title="${pemusnahan.category} · hari ke-${pemusnahan.hari}">${pemusnahan.tanggal}</span>`
                          : '<span style="color:#bbb;">-</span>'
                      }
                    </td>

                  </tr>

                  `;

                }).join("")}

              </tbody>

            </table>

          </div>

        </div>

      `;

    });


  detailSection.innerHTML = `

    <button
      class="back-button"
      onclick="backToSupplier()"
    >
      ← Kembali ke daftar supplier
    </button>


    <div class="supplier-header">

      <div>

        <h2>
          ${supplier.name}
        </h2>

        <p>
          Kode Supplier: ${supplier.code}
        </p>

      </div>

      <div class="return-badge">
        ADA RETURN
      </div>

    </div>


    ${html}


    <div class="chat-box">

      <div class="chat-box-header">
        Chat dengan Admin
      </div>

      <div
        class="chat-messages"
        id="chatMessages"
      >
        <p class="chat-empty">
          Memuat chat...
        </p>
      </div>

      <div class="chat-input-row">

        <input
          type="text"
          class="chat-input"
          id="chatInput"
          placeholder="Tulis pesan..."
          onkeydown="if(event.key==='Enter'){sendChatMessage();}"
        >

        <button
          class="chat-send-btn"
          id="chatSendBtn"
          onclick="sendChatMessage()"
        >
          Kirim
        </button>

      </div>

    </div>

  `;


  supplierSection.style.display = "none";

  detailSection.style.display = "block";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  openChat(supplier.code, supplier.name);

}


/* =========================
   KEMBALI
========================= */

function backToSupplier(){

  if(chatChannel){
    sb.removeChannel(chatChannel);
    chatChannel = null;
  }

  currentSupplierCode = null;
  currentSupplierName = null;

  detailSection.style.display =
    "none";

  supplierSection.style.display =
    "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================
   CHAT ADMIN <-> SUPPLIER
========================= */

let chatChannel = null;
let currentSupplierCode = null;
let currentSupplierName = null;


function escapeHtml(text){

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


function chatTime(iso){

  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

}


function chatBubbleHtml(msg){

  const cls =
    msg.sender_type === "admin"
      ? "admin"
      : "supplier";

  const label =
    msg.sender_type === "admin"
      ? (msg.sender_name || "Admin")
      : "Anda";

  return `
    <div class="chat-bubble ${cls}">
      ${escapeHtml(msg.message)}
      <span class="chat-meta">
        ${label} • ${chatTime(msg.created_at)}
      </span>
    </div>
  `;

}


function renderChatMessages(messages){

  const container =
    document.getElementById("chatMessages");

  if(!container){
    return;
  }

  if(!messages || messages.length === 0){

    container.innerHTML = `
      <p class="chat-empty">
        Belum ada chat. Tulis pesan pertama kamu di bawah.
      </p>
    `;

    return;

  }

  container.innerHTML =
    messages.map(chatBubbleHtml).join("");

  container.scrollTop =
    container.scrollHeight;

}


async function openChat(code, name){

  currentSupplierCode = code;
  currentSupplierName = name;

  if(chatChannel){
    sb.removeChannel(chatChannel);
    chatChannel = null;
  }

  const container =
    document.getElementById("chatMessages");

  if(container){
    container.innerHTML = `
      <p class="chat-empty">
        Memuat chat...
      </p>
    `;
  }

  const { data, error } =
    await sb
      .from("return_chat_messages")
      .select("*")
      .eq("supplier_code", code)
      .order("created_at", { ascending: true });

  if(error){

    console.error("Gagal load chat:", error);

    if(container){
      container.innerHTML = `
        <p class="chat-empty">
          Gagal memuat chat. Coba refresh halaman.
        </p>
      `;
    }

  }else{

    renderChatMessages(data);

  }


  chatChannel = sb
    .channel("return_chat_" + code)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "return_chat_messages",
        filter: "supplier_code=eq." + code
      },
      payload => {

        if(currentSupplierCode !== code){
          return;
        }

        const box =
          document.getElementById("chatMessages");

        if(!box){
          return;
        }

        const emptyMsg =
          box.querySelector(".chat-empty");

        if(emptyMsg){
          box.innerHTML = "";
        }

        box.insertAdjacentHTML(
          "beforeend",
          chatBubbleHtml(payload.new)
        );

        box.scrollTop =
          box.scrollHeight;

      }
    )
    .subscribe();

}


async function sendChatMessage(){

  const input =
    document.getElementById("chatInput");

  const btn =
    document.getElementById("chatSendBtn");

  if(!input || !currentSupplierCode){
    return;
  }

  const message =
    input.value.trim();

  if(!message){
    return;
  }

  btn.disabled = true;

  const { error } =
    await sb
      .from("return_chat_messages")
      .insert({
        supplier_code: currentSupplierCode,
        supplier_name: currentSupplierName,
        sender_type: "supplier",
        sender_name: currentSupplierName,
        message: message
      });

  btn.disabled = false;

  if(error){

    alert("Gagal mengirim pesan: " + error.message);

    console.error(error);

    return;

  }

  input.value = "";

}


/* =========================
   BUKA / TUTUP SLIP
========================= */

function toggleSlip(element){

  const card =
    element.parentElement;

  card.classList.toggle("open");


  const arrow =
    element.querySelector(".slip-arrow");


  if(arrow){

    arrow.textContent =
      card.classList.contains("open")
        ? "⌃"
        : "⌄";

  }

}


/* =========================
   SEARCH
========================= */

function searchSupplier(){

  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();


  const filtered =
    RETURN_DATA.filter(row => {

      return (

        row.supplier
          .toLowerCase()
          .includes(keyword)

        ||

        String(row.supplierCode)
          .includes(keyword)

      );

    });


  renderSuppliers(filtered);

}


if(searchInput){

  searchInput.addEventListener(
    "input",
    searchSupplier
  );

}


/* =========================
   MODE TOGGLE (Chat / List)
========================= */

function switchMode(mode){

  const chatView = document.getElementById("chatView");
  const listView = document.getElementById("listView");
  const chatBtn = document.getElementById("modeChatBtn");
  const listBtn = document.getElementById("modeListBtn");

  if(!chatView || !listView){
    return;
  }

  if(mode === "chat"){

    chatView.style.display = "block";
    listView.style.display = "none";
    chatBtn.classList.add("active");
    listBtn.classList.remove("active");

  }else{

    chatView.style.display = "none";
    listView.style.display = "block";
    listBtn.classList.add("active");
    chatBtn.classList.remove("active");

  }

}


/* =========================
   CHATBOT PENCARIAN SUPPLIER (fuzzy search, gratis, tanpa AI)
========================= */

let supplierFuse = null;
let masterSupplierFuse = null;
let awaitingSupplierChoice = null;


function buildSupplierFuse(){

  const suppliers =
    groupBySupplier(RETURN_DATA)
      .map(s => ({ code: s.code, name: s.name }));

  supplierFuse = new Fuse(suppliers, {
    keys: ["name", "code"],
    threshold: 0.3,
    minMatchCharLength: 3,
    ignoreLocation: true
  });

}


let masterSupplierFusePromise = null;


async function buildMasterSupplierFuse(){

  try{

    let allRows = [];
    let from = 0;
    const pageSize = 1000;

    while(true){

      const { data, error } =
        await sb
          .from("supplier")
          .select("kode_supplier, nama_supplier")
          .range(from, from + pageSize - 1);

      if(error){
        console.error("Gagal memuat master data supplier:", error);
        break;
      }

      if(!data || data.length === 0){
        break;
      }

      allRows = allRows.concat(data);

      if(data.length < pageSize){
        break;
      }

      from += pageSize;

    }

    if(allRows.length === 0){
      console.warn("Master data supplier: 0 baris ke-load.");
      return;
    }

    masterSupplierFuse = new Fuse(
      allRows.map(s => ({ code: String(s.kode_supplier), name: s.nama_supplier })),
      {
        keys: ["name", "code"],
        threshold: 0.3,
        minMatchCharLength: 3,
        ignoreLocation: true
      }
    );

  }catch(err){

    console.error("Gagal memuat master data supplier:", err);

  }

}


function addChatPageBubble(html, sender){

  const container =
    document.getElementById("chatPageMessages");

  if(!container){
    return;
  }

  const bubble = document.createElement("div");

  bubble.className = "chat-page-bubble " + sender;
  bubble.innerHTML = html;

  container.appendChild(bubble);

  container.scrollTop = container.scrollHeight;

}


function chatBotGreeting(){

  const container =
    document.getElementById("chatPageMessages");

  if(!container || container.childElementCount > 0){
    return;
  }

  addChatPageBubble(
    "Halo, mau cek return supplier apa hari ini? Ketik nama atau kode supplier ya.",
    "bot"
  );

}


const SUPPORT_WA_NUMBER = "081977259644";  // TODO: ganti ke nomor WA admin yang asli


function chatSupplierDetailHtml(supplierCode){

  const supplier =
    groupBySupplier(RETURN_DATA)
      .find(s => s.code === supplierCode);

  if(!supplier){

    return `Maaf, data supplier itu tidak ditemukan. Coba cari lagi ya.`;

  }

  const slipGroups =
    groupBySlip(supplier.rows);

  let html = `
    <strong>${supplier.name}</strong><br>
    Kode Supplier: ${supplier.code} · ${Object.keys(slipGroups).length} slip return
  `;

  Object.entries(slipGroups).forEach(([slipNo, items]) => {

    const first = items[0];

    html += `
      <div class="chat-slip-card">

        <div class="chat-slip-head">
          <strong>No. Slip ${escapeHtml(slipNo)}</strong>
          ${statusBadge(first.status)}
        </div>

        <div class="chat-slip-meta">
          Tanggal Dibuat: ${escapeHtml(first.date)}<br>
          Status: ${escapeHtml(first.status)} · ${items.length} item · Aging: ${first.aging} hari
        </div>

        <div class="chat-item-list">

          ${items.map(item => {

            const pemusnahan =
              getPemusnahanInfo(first.date, item.department);

            return `
              <div class="chat-item-card">

                <div class="chat-item-name">
                  ${escapeHtml(item.itemDesc)}
                </div>

                <div class="chat-item-row">
                  <span class="chat-item-key">SKU</span>
                  <span>${escapeHtml(item.shortSku)}</span>
                </div>

                <div class="chat-item-row">
                  <span class="chat-item-key">Qty Return</span>
                  <span>${Number(item.qty).toFixed(2)}</span>
                </div>

                <div class="chat-item-row">
                  <span class="chat-item-key">Aging</span>
                  <span>${item.aging} hari</span>
                </div>

                <div class="chat-item-row">
                  <span class="chat-item-key">Departemen</span>
                  <span>${escapeHtml(formatDepartmentLabel(item.department))}</span>
                </div>

                <div class="chat-item-row">
                  <span class="chat-item-key">Tgl Pemusnahan</span>
                  ${
                    pemusnahan
                      ? `<span class="pemusnahan-badge" title="${escapeHtml(pemusnahan.category)} · hari ke-${pemusnahan.hari}">${pemusnahan.tanggal}</span>`
                      : '<span style="color:#bbb;">-</span>'
                  }
                </div>

              </div>
            `;

          }).join("")}

        </div>

      </div>
    `;

  });

  html += `<div style="margin-top:8px;font-size:11px;color:#888;">Mau cek supplier lain? Ketik nama atau kode lagi.</div>`;

  return html;

}


function chooseMasterSupplierInChat(code, name){

  addChatPageBubble(escapeHtml(name), "user");

  addChatPageBubble(
    `Supplier <strong>${escapeHtml(name)}</strong> (kode ${escapeHtml(code)}) ada di data kami, tapi saat ini <strong>gak ada return yang aktif</strong>.<br><br>
    jika dirasa ini keliru, silakan hubungi kami lewat kolom chat di halaman List Supplier, atau WhatsApp ke
    <a href="https://wa.me/${SUPPORT_WA_NUMBER}" target="_blank" style="color:#5b21b6;font-weight:bold;">${SUPPORT_WA_NUMBER}</a>.`,
    "bot"
  );

}


function chooseSupplierInChat(code){

  const supplier =
    groupBySupplier(RETURN_DATA)
      .find(s => s.code === code);

  addChatPageBubble(
    escapeHtml(supplier ? supplier.name : code),
    "user"
  );

  addChatPageBubble(
    chatSupplierDetailHtml(code),
    "bot"
  );

  awaitingSupplierChoice = null;

}


async function sendChatPageMessage(){

  const input =
    document.getElementById("chatPageInput");

  if(!input){
    return;
  }

  const text =
    input.value.trim();

  if(!text){
    return;
  }

  addChatPageBubble(escapeHtml(text), "user");

  input.value = "";

  if(text.length < 3){

    addChatPageBubble(
      "Coba ketik minimal 3 huruf/angka dari nama atau kode supplier ya, biar pencariannya lebih akurat.",
      "bot"
    );

    return;

  }

  if(!supplierFuse){

    addChatPageBubble(
      "Data return masih dimuat, coba lagi sebentar ya.",
      "bot"
    );

    return;

  }

  const results =
    supplierFuse.search(text);

  if(results.length === 0){

    if(masterSupplierFusePromise){

      await Promise.race([
        masterSupplierFusePromise,
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);

    }

    const masterMatch =
      masterSupplierFuse
        ? masterSupplierFuse.search(text)
        : [];

    if(masterMatch.length === 1 && masterMatch[0].score <= 0.02){

      const found = masterMatch[0].item;

      addChatPageBubble(
        `Supplier <strong>${escapeHtml(found.name)}</strong> (kode ${escapeHtml(found.code)}) ada di data kami, tapi saat ini <strong>tidak ada return yang aktif</strong>.<br><br>
        jika dirasa ini keliru, silakan hubungi kami lewat kolom chat di halaman detail supplier, atau WhatsApp ke
        <a href="https://wa.me/${SUPPORT_WA_NUMBER}" target="_blank" style="color:#5b21b6;font-weight:bold;">${SUPPORT_WA_NUMBER}</a>.`,
        "bot"
      );

    }else if(masterMatch.length > 0){

      const topMatches = masterMatch.slice(0, 5);

      const optionsHtml =
        topMatches.map(r => `
          <div
            class="chat-option-btn"
            onclick="chooseMasterSupplierInChat('${r.item.code}', '${r.item.name.replace(/'/g, "\\'")}')"
          >
            ${escapeHtml(r.item.name)}
            <span style="color:#999;">· ${escapeHtml(r.item.code)}</span>
          </div>
        `).join("");

      addChatPageBubble(
        `Apakah salah satu supplier ini yang kamu maksud?${optionsHtml}`,
        "bot"
      );

    }else{

      addChatPageBubble(
        `Maaf, supplier gak ketemu. Coba cek lagi ejaan nama atau kode supplier-nya.<br><br>
        jika masih kesulitan, silakan hubungi kami lewat kolom chat di halaman detail supplier, atau WhatsApp ke
        <a href="https://wa.me/${SUPPORT_WA_NUMBER}" target="_blank" style="color:#5b21b6;font-weight:bold;">${SUPPORT_WA_NUMBER}</a>.`,
        "bot"
      );

    }

  }else if(results.length === 1 && results[0].score <= 0.02){

    const supplier = results[0].item;

    addChatPageBubble(
      chatSupplierDetailHtml(supplier.code),
      "bot"
    );

  }else{

    const topMatches =
      results.slice(0, 5);

    const optionsHtml =
      topMatches.map(r => `
        <div
          class="chat-option-btn"
          onclick="chooseSupplierInChat('${r.item.code}')"
        >
          ${escapeHtml(r.item.name)}
          <span style="color:#999;">· ${escapeHtml(r.item.code)}</span>
        </div>
      `).join("");

    addChatPageBubble(
      `Apakah salah satu ini yang kamu maksud?${optionsHtml}`,
      "bot"
    );

  }

}

async function init(){

  /* halaman admin tidak punya #supplierList, jadi cukup ambil datanya saja */
  if(!supplierList){

    try{
      RETURN_DATA = await loadReturnData();
    }catch(err){
      console.error("Gagal load data:", err);
    }

    if(typeof onReturnDataReady === "function"){
      onReturnDataReady();
    }

    return;

  }

  supplierList.innerHTML = `
    <p style="text-align:center;color:#777;padding:30px 0;grid-column:1/-1;">
      Memuat data return...
    </p>
  `;

  try{

    RETURN_DATA = await loadReturnData();

    renderSuppliers(RETURN_DATA);

    buildSupplierFuse();

  }catch(err){

    supplierList.innerHTML = `
      <p style="text-align:center;color:#dc2626;padding:30px 0;grid-column:1/-1;">
        Gagal memuat data return.<br>
        Silakan refresh halaman atau coba lagi nanti.
      </p>
    `;

    supplierCount.textContent = "0 Supplier";

    console.error("Gagal load data:", err);

  }

  if(typeof onReturnDataReady === "function"){
    onReturnDataReady();
  }

}

chatBotGreeting();

masterSupplierFusePromise = buildMasterSupplierFuse();

init();

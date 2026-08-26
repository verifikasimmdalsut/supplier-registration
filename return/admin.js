/* =========================
   ADMIN — LOGIN, DAFTAR SUPPLIER, CHAT
   (reuse: sb, loadReturnData, groupBySupplier, countSlip,
   escapeHtml, chatTime, chatBubbleHtml dari app.js)
========================= */

const loginBox = document.getElementById("loginBox");
const panelEl = document.getElementById("panel");
const logoutBtn = document.getElementById("logoutBtn");
const supplierPanelList = document.getElementById("supplierPanelList");
const chatPanel = document.getElementById("chatPanel");
const adminSearch = document.getElementById("adminSearch");
const loginError = document.getElementById("loginError");

let adminChannel = null;
let activeSupplierCode = null;
let activeSupplierName = null;
let adminName = "";

let globalChatChannel = null;
const unreadSuppliers = new Set();
let notificationsEnabled = false;
const lastMessageAt = {};


/* =========================
   AUTH
========================= */

async function doLogin(){

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  loginError.style.display = "none";

  const { data, error } =
    await sb.auth.signInWithPassword({ email, password });

  if(error){
    loginError.style.display = "block";
    return;
  }

  adminName = data.user.email;

  showPanel();

}


async function doLogout(){

  if(adminChannel){
    sb.removeChannel(adminChannel);
    adminChannel = null;
  }

  await sb.auth.signOut();

  panelEl.style.display = "none";
  logoutBtn.style.display = "none";
  loginBox.style.display = "block";

}


async function checkExistingSession(){

  const { data } = await sb.auth.getSession();

  if(data.session){
    adminName = data.session.user.email;
    showPanel();
  }

}


function showPanel(){

  loginBox.style.display = "none";
  logoutBtn.style.display = "inline-block";
  panelEl.style.display = "block";

  loadLastMessageTimes().then(() => {
    renderSupplierPanelList(RETURN_DATA);
  });

  initMonitor();

  setupNotificationButton();
  subscribeGlobalChat();

}


async function loadLastMessageTimes(){

  try{

    const { data, error } =
      await sb
        .from("return_chat_messages")
        .select("supplier_code, created_at, sender_type")
        .order("created_at", { ascending: false });

    if(error || !data){
      return;
    }

    data.forEach(row => {

      if(!lastMessageAt[row.supplier_code]){

        lastMessageAt[row.supplier_code] = row.created_at;

        /* tandai belum dibaca cuma kalau pesan TERAKHIR dari supplier
           (kalau admin udah bales duluan, gak perlu ditandai lagi) */
        if(
          row.sender_type === "supplier" &&
          row.supplier_code !== activeSupplierCode
        ){
          unreadSuppliers.add(row.supplier_code);
        }

      }

    });

  }catch(err){

    console.error("Gagal memuat waktu chat terakhir:", err);

  }

}


/* =========================
   TAB SWITCH
========================= */

function switchTab(tab){

  const chatTab = document.getElementById("chatTab");
  const monitorTab = document.getElementById("monitorTab");
  const chatBtn = document.getElementById("tabChatBtn");
  const monitorBtn = document.getElementById("tabMonitorBtn");

  if(tab === "chat"){

    chatTab.classList.add("active");
    monitorTab.classList.remove("active");
    chatBtn.classList.add("active");
    monitorBtn.classList.remove("active");

  }else{

    monitorTab.classList.add("active");
    chatTab.classList.remove("active");
    monitorBtn.classList.add("active");
    chatBtn.classList.remove("active");

  }

}


/* =========================
   MONITORING RETURN
   (join: registrasi supplier x data return sheet x konfirmasi admin)
========================= */

let REGISTRASI_DATA = [];
let CONFIRMATIONS = {};
let monitorFilter = "all";  // all | pending | done | cancel
let monitorSearchKeyword = "";
let openMonitorCards = new Set();
let registrasiChannel = null;
let confirmChannel = null;


async function loadMonitorSources(){

  const [regRes, confRes] = await Promise.all([

    sb.from("registrasi")
      .select("kode_supplier, nama_supplier, tanggal")
      .order("tanggal", { ascending: false }),

    sb.from("return_confirmations")
      .select("*")

  ]);

  REGISTRASI_DATA = regRes.data || [];

  CONFIRMATIONS = {};

  (confRes.data || []).forEach(row => {
    CONFIRMATIONS[row.supplier_code] = row;
  });

}


function buildMonitorEntries(){

  const suppliersWithReturn =
    groupBySupplier(RETURN_DATA);

  const returnBySupplierCode = {};

  suppliersWithReturn.forEach(s => {
    returnBySupplierCode[s.code] = s;
  });

  /* ambil registrasi TERBARU per kode_supplier */
  const latestRegByCode = {};

  REGISTRASI_DATA.forEach(reg => {

    const code = String(reg.kode_supplier);

    if(!latestRegByCode[code] ||
       new Date(reg.tanggal) > new Date(latestRegByCode[code].tanggal)){
      latestRegByCode[code] = reg;
    }

  });

  const entries = [];

  Object.keys(latestRegByCode).forEach(code => {

    const supplierReturn =
      returnBySupplierCode[code];

    /* HANYA tampil kalau supplier yang registrasi itu punya return */
    if(!supplierReturn){
      return;
    }

    const reg = latestRegByCode[code];
    const confirmation = CONFIRMATIONS[code];

    let status = "pending";

    if(
      confirmation &&
      confirmation.confirmed_at &&
      new Date(confirmation.confirmed_at) >= new Date(reg.tanggal)
    ){
      status = confirmation.status;
    }

    entries.push({
      code: code,
      name: supplierReturn.name || reg.nama_supplier,
      registeredAt: reg.tanggal,
      status: status,
      confirmedAt: confirmation ? confirmation.confirmed_at : null,
      slips: groupBySlip(supplierReturn.rows)
    });

  });

  entries.sort((a, b) => {

    const aDone = a.status !== "pending";
    const bDone = b.status !== "pending";

    if(aDone !== bDone){
      return aDone ? 1 : -1;
    }

    if(!aDone){
      return new Date(b.registeredAt) - new Date(a.registeredAt);
    }

    return new Date(b.confirmedAt || 0) - new Date(a.confirmedAt || 0);

  });

  return entries;

}


function statusPillHtml(status){

  const map = {
    pending: ["pending", "SEDANG PROSES"],
    done: ["done", "DONE"],
    cancel: ["cancel", "DIBATALKAN"]
  };

  const [cls, label] = map[status] || map.pending;

  return `<span class="status-pill ${cls}">${label}</span>`;

}


function renderMonitorList(){

  const container =
    document.getElementById("monitorList");

  if(!container){
    return;
  }

  let entries =
    buildMonitorEntries();

  if(monitorFilter !== "all"){
    entries = entries.filter(e => e.status === monitorFilter);
  }

  if(monitorSearchKeyword){

    const kw = monitorSearchKeyword.toLowerCase();

    entries = entries.filter(e =>
      e.name.toLowerCase().includes(kw) ||
      e.code.includes(kw) ||
      Object.keys(e.slips).some(slipNo => slipNo.includes(kw)) ||
      Object.values(e.slips).some(items =>
        items.some(item => (item.location || "").toLowerCase().includes(kw))
      )
    );

  }

  if(entries.length === 0){

    container.innerHTML = `
      <p class="chat-empty">Tidak ada supplier dengan return saat ini.</p>
    `;

    return;

  }

  container.innerHTML =
    entries.map((entry, index) => {

      const isOpen =
        openMonitorCards.has(entry.code);

      const slipRowsHtml =
        Object.entries(entry.slips).map(([slipNo, items]) => {

          const first = items[0];

          const pemusnahan =
            getPemusnahanInfo(first.date, first.department);

          return `
            <tr>
              <td>${escapeHtml(slipNo)}</td>
              <td>
                ${
                  first.location
                    ? escapeHtml(first.location)
                    : '<span style="color:#bbb;font-style:italic;">Belum diisi</span>'
                }
              </td>
              <td>${statusBadge(first.status)}</td>
              <td>${escapeHtml(first.department)}</td>
              <td>
                ${
                  pemusnahan
                    ? `<span class="pemusnahan-badge" title="${escapeHtml(pemusnahan.category)} · hari ke-${pemusnahan.hari}">${pemusnahan.tanggal}</span>`
                    : '<span style="color:#bbb;">-</span>'
                }
              </td>
            </tr>
          `;

        }).join("");

      const numberLabel =
        String(index + 1).padStart(2, "0");

      const actionsHtml =
        entry.status === "pending"
          ? `
            <div class="monitor-info-banner">
              <span>ℹ️</span>
              <span>Supplier baru datang. Silakan konfirmasi jika return sudah selesai.</span>
            </div>

            <div class="monitor-actions">

              <div
                class="monitor-btn monitor-btn-cancel"
                onclick="event.stopPropagation();confirmMonitor('${entry.code}','cancel')"
              >
                CANCEL
                <small>Batalkan proses return</small>
              </div>

              <div
                class="monitor-btn monitor-btn-done"
                onclick="event.stopPropagation();confirmMonitor('${entry.code}','done')"
              >
                ✓ DONE (KONFIRMASI)
                <small>Tandai return sudah selesai</small>
              </div>

            </div>
          `
          : `
            <div class="monitor-confirmed-note">
              ${entry.status === "done" ? "Ditandai selesai" : "Dibatalkan"}
              ${entry.confirmedAt ? "pada " + chatTime(entry.confirmedAt) : ""}
              ${entry.status !== "pending" ? `
                <span
                  style="color:#5b21b6;cursor:pointer;font-weight:bold;"
                  onclick="event.stopPropagation();confirmMonitor('${entry.code}','pending')"
                >
                  &nbsp;•&nbsp;Buka lagi
                </span>
              ` : ""}
            </div>
          `;

      return `
        <div class="monitor-card ${entry.status === "pending" ? "pending" : ""} ${isOpen ? "open" : ""}">

          <div
            class="monitor-card-head"
            onclick="toggleMonitorCard('${entry.code}')"
          >

            <div>
              <div class="monitor-card-title">
                ${numberLabel}. ${escapeHtml(entry.name)}
              </div>
              <div class="monitor-card-code">
                Kode Supplier: ${escapeHtml(entry.code)}
              </div>
            </div>

            <div class="monitor-card-right">
              ${statusPillHtml(entry.status)}
              <span class="monitor-chevron">⌄</span>
            </div>

          </div>

          <div class="monitor-card-body">

            <table class="monitor-slip-table">

              <thead>
                <tr>
                  <th>No Slip</th>
                  <th>Lokasi Return</th>
                  <th>Status</th>
                  <th>Departemen</th>
                  <th>Tgl Pemusnahan</th>
                </tr>
              </thead>

              <tbody>
                ${slipRowsHtml}
              </tbody>

            </table>

            ${actionsHtml}

          </div>

        </div>
      `;

    }).join("");

}


function toggleMonitorCard(code){

  if(openMonitorCards.has(code)){
    openMonitorCards.delete(code);
  }else{
    openMonitorCards.add(code);
  }

  renderMonitorList();

}


async function confirmMonitor(code, status){

  const { error } =
    await sb
      .from("return_confirmations")
      .upsert({
        supplier_code: code,
        status: status,
        confirmed_by: adminName,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

  if(error){
    alert("Gagal menyimpan status: " + error.message);
    console.error(error);
    return;
  }

  await loadMonitorSources();
  renderMonitorList();

}


function cycleMonitorFilter(){

  const order = ["all", "pending", "done", "cancel"];
  const labels = { all: "▽", pending: "🟠", done: "🟢", cancel: "⚪" };

  const currentIndex = order.indexOf(monitorFilter);

  monitorFilter = order[(currentIndex + 1) % order.length];

  document.getElementById("monitorFilterBtn").textContent =
    labels[monitorFilter];

  renderMonitorList();

}


function subscribeMonitorRealtime(){

  if(!registrasiChannel){

    registrasiChannel = sb
      .channel("admin_registrasi_watch")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrasi" },
        async (payload) => {

          const reg = payload.new;
          const code = String(reg.kode_supplier);

          await loadMonitorSources();
          renderMonitorList();

          /* cuma notif kalau supplier ini emang punya return di sheet */
          const hasReturn =
            groupBySupplier(RETURN_DATA)
              .some(s => s.code === code);

          if(hasReturn){
            notifyNewReturn(code, reg.nama_supplier);
          }

        }
      )
      .subscribe();

  }

  if(!confirmChannel){

    confirmChannel = sb
      .channel("admin_confirm_watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "return_confirmations" },
        async () => {
          await loadMonitorSources();
          renderMonitorList();
        }
      )
      .subscribe();

  }

}


function notifyNewReturn(code, name){

  playNotifSound();

  if(notificationsEnabled){

    const n = new Notification("Return baru — " + name, {
      body: "Kode Supplier: " + code + " • Supplier baru datang & ada return",
      tag: "return_" + code
    });

    n.onclick = () => {

      window.focus();

      switchTab("monitor");

      openMonitorCards.add(code);

      renderMonitorList();

      const el = document.getElementById("panel");

      if(el){
        el.scrollIntoView({ behavior: "smooth" });
      }

    };

  }

}


const monitorSearchInput =
  document.getElementById("monitorSearch");

if(monitorSearchInput){

  monitorSearchInput.addEventListener("input", function(){
    monitorSearchKeyword = this.value.trim().toLowerCase();
    renderMonitorList();
  });

}


async function initMonitor(){

  await loadMonitorSources();
  renderMonitorList();
  subscribeMonitorRealtime();

}


/* =========================
   DAFTAR SUPPLIER (kiri)
========================= */

function renderSupplierPanelList(data){

  const suppliers =
    groupBySupplier(data);

  suppliers.sort((a, b) => {

    const timeA = lastMessageAt[a.code];
    const timeB = lastMessageAt[b.code];

    if(timeA && timeB){
      return new Date(timeB) - new Date(timeA);
    }

    if(timeA && !timeB){
      return -1;
    }

    if(!timeA && timeB){
      return 1;
    }

    return 0;

  });

  if(suppliers.length === 0){

    supplierPanelList.innerHTML = `
      <p class="chat-empty">Belum ada data return.</p>
    `;

    return;

  }

  supplierPanelList.innerHTML =
    suppliers.map(supplier => {

      const slipCount =
        countSlip(supplier.rows);

      const activeCls =
        supplier.code === activeSupplierCode
          ? "active"
          : "";

      const unreadCls =
        unreadSuppliers.has(supplier.code)
          ? "has-unread"
          : "";

      return `
        <div
          class="supplier-item ${activeCls} ${unreadCls}"
          onclick="selectSupplier('${supplier.code}', '${supplier.name.replace(/'/g, "\\'")}')"
        >
          <span class="unread-dot"></span>
          <div>${supplier.name}</div>
          <div class="code">
            Kode: ${supplier.code} • ${slipCount} Slip Return
          </div>
        </div>
      `;

    }).join("");

}


if(adminSearch){

  adminSearch.addEventListener("input", function(){

    const keyword =
      this.value.trim().toLowerCase();

    const filtered =
      RETURN_DATA.filter(row =>
        row.supplier.toLowerCase().includes(keyword) ||
        String(row.supplierCode).includes(keyword)
      );

    renderSupplierPanelList(filtered);

  });

}


/* =========================
   PILIH SUPPLIER -> BUKA CHAT
========================= */

async function selectSupplier(code, name){

  activeSupplierCode = code;
  activeSupplierName = name;

  unreadSuppliers.delete(code);

  renderSupplierPanelList(RETURN_DATA);

  chatPanel.innerHTML = `

    <div class="chat-panel-head">
      ${name}
      <div class="code">Kode Supplier: ${code}</div>
    </div>

    <div class="chat-panel-body" id="adminChatMessages">
      <p class="chat-empty">Memuat chat...</p>
    </div>

    <div class="chat-panel-input">

      <input
        type="text"
        id="adminChatInput"
        placeholder="Balas chat supplier..."
        onkeydown="if(event.key==='Enter'){sendAdminReply();}"
      >

      <button
        id="adminChatSendBtn"
        onclick="sendAdminReply()"
      >
        Kirim
      </button>

    </div>

  `;

  /* di layar sempit, panel chat ada DI BAWAH daftar supplier —
     auto-scroll langsung biar keliatan, gak perlu geser manual */
  if(window.innerWidth < 750){

    chatPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

  if(adminChannel){
    sb.removeChannel(adminChannel);
    adminChannel = null;
  }

  const { data, error } =
    await sb
      .from("return_chat_messages")
      .select("*")
      .eq("supplier_code", code)
      .order("created_at", { ascending: true });

  const box =
    document.getElementById("adminChatMessages");

  if(error){

    console.error(error);

    if(box){
      box.innerHTML = `<p class="chat-empty">Gagal memuat chat.</p>`;
    }

  }else{

    renderAdminChat(data);

  }


  adminChannel = sb
    .channel("admin_chat_" + code)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "return_chat_messages",
        filter: "supplier_code=eq." + code
      },
      payload => {

        if(activeSupplierCode !== code){
          return;
        }

        const liveBox =
          document.getElementById("adminChatMessages");

        if(!liveBox){
          return;
        }

        const emptyMsg =
          liveBox.querySelector(".chat-empty");

        if(emptyMsg){
          liveBox.innerHTML = "";
        }

        liveBox.insertAdjacentHTML(
          "beforeend",
          chatBubbleHtml(payload.new)
        );

        liveBox.scrollTop =
          liveBox.scrollHeight;

      }
    )
    .subscribe();

}


function renderAdminChat(messages){

  const box =
    document.getElementById("adminChatMessages");

  if(!box){
    return;
  }

  if(!messages || messages.length === 0){

    box.innerHTML = `
      <p class="chat-empty">Belum ada chat dari supplier ini.</p>
    `;

    return;

  }

  box.innerHTML =
    messages.map(chatBubbleHtml).join("");

  box.scrollTop =
    box.scrollHeight;

}


async function sendAdminReply(){

  const input =
    document.getElementById("adminChatInput");

  const btn =
    document.getElementById("adminChatSendBtn");

  if(!input || !activeSupplierCode){
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
        supplier_code: activeSupplierCode,
        supplier_name: activeSupplierName,
        sender_type: "admin",
        sender_name: adminName,
        message: message
      });

  btn.disabled = false;

  if(error){
    alert("Gagal mengirim balasan: " + error.message);
    console.error(error);
    return;
  }

  input.value = "";

}


/* =========================
   NOTIFIKASI CHAT BARU
========================= */

function setupNotificationButton(){

  const btn =
    document.getElementById("notifBtn");

  if(!("Notification" in window)){
    return;
  }

  if(Notification.permission === "granted"){

    notificationsEnabled = true;
    btn.style.display = "none";

  }else if(Notification.permission === "denied"){

    btn.style.display = "none";

  }else{

    btn.style.display = "inline-block";

  }

}


async function enableNotifications(){

  if(!("Notification" in window)){

    alert("Browser ini tidak mendukung notifikasi.");

    return;

  }

  const result =
    await Notification.requestPermission();

  if(result === "granted"){

    notificationsEnabled = true;

    document.getElementById("notifBtn").style.display = "none";

    new Notification("Notifikasi aktif", {
      body: "Kamu akan diberi tahu tiap ada chat baru dari supplier."
    });

  }

}


function playNotifSound(){

  try{

    const ctx =
      new (window.AudioContext || window.webkitAudioContext)();

    const osc =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);

  }catch(e){

    /* browser tidak izinkan audio otomatis, abaikan */

  }

}


function subscribeGlobalChat(){

  if(globalChatChannel){
    return;
  }

  globalChatChannel = sb
    .channel("admin_global_chat_watch")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "return_chat_messages"
      },
      payload => {

        const msg = payload.new;

        /* cuma peduli pesan MASUK dari supplier, bukan balasan admin sendiri */
        if(msg.sender_type !== "supplier"){
          return;
        }

        lastMessageAt[msg.supplier_code] = msg.created_at;

        renderSupplierPanelList(RETURN_DATA);

        const isCurrentlyOpen =
          msg.supplier_code === activeSupplierCode &&
          document.visibilityState === "visible";

        if(!isCurrentlyOpen){

          unreadSuppliers.add(msg.supplier_code);

          if(notificationsEnabled){

            const n = new Notification("Chat baru — " + msg.supplier_name, {
              body: msg.message,
              tag: "chat_" + msg.supplier_code
            });

            n.onclick = () => {
              window.focus();
              selectSupplier(msg.supplier_code, msg.supplier_name);
            };

          }

          playNotifSound();

        }

      }
    )
    .subscribe();

}

function onReturnDataReady(){
  if(panelEl.style.display === "block"){
    renderSupplierPanelList(RETURN_DATA);
    renderMonitorList();
  }
}

checkExistingSession();

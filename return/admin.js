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
  panelEl.style.display = "grid";

  renderSupplierPanelList(RETURN_DATA);

  setupNotificationButton();
  subscribeGlobalChat();

}


/* =========================
   DAFTAR SUPPLIER (kiri)
========================= */

function renderSupplierPanelList(data){

  const suppliers =
    groupBySupplier(data);

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

        const isCurrentlyOpen =
          msg.supplier_code === activeSupplierCode &&
          document.visibilityState === "visible";

        if(!isCurrentlyOpen){

          unreadSuppliers.add(msg.supplier_code);

          renderSupplierPanelList(RETURN_DATA);

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
  if(panelEl.style.display === "grid"){
    renderSupplierPanelList(RETURN_DATA);
  }
}

checkExistingSession();

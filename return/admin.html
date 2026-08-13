<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Admin Chat Return — AEON Alam Sutera</title>

<style>
*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Arial, Helvetica, sans-serif;
  background:#f6f6f8;
  color:#222;
}

.header{
  background:#ffffff;
  border-bottom:1px solid #ddd;
  padding:16px 5%;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.logo-title{
  display:flex;
  align-items:center;
  gap:12px;
}

.logo-box{
  width:42px;
  height:42px;
  background:#111;
  color:white;
  display:flex;
  justify-content:center;
  align-items:center;
  font-size:12px;
  font-weight:bold;
  border-radius:5px;
}

.title{
  font-size:19px;
  font-weight:bold;
}

.subtitle{
  font-size:11px;
  color:#777;
  margin-top:2px;
}

.logout-btn{
  border:1px solid #ddd;
  background:#fff;
  padding:8px 14px;
  border-radius:7px;
  font-size:12px;
  cursor:pointer;
  display:none;
}

.container{
  max-width:1000px;
  margin:0 auto;
  padding:25px 5% 60px;
}

/* ============ LOGIN ============ */

.login-box{
  max-width:360px;
  margin:60px auto;
  background:#fff;
  border:1px solid #ddd;
  border-radius:12px;
  padding:28px;
}

.login-box h2{
  margin:0 0 6px;
  font-size:17px;
}

.login-box p{
  margin:0 0 20px;
  font-size:12px;
  color:#777;
}

.login-box input{
  width:100%;
  padding:11px 12px;
  border:1px solid #ddd;
  border-radius:8px;
  font-size:13px;
  margin-bottom:12px;
}

.login-box button{
  width:100%;
  padding:11px;
  background:#5b21b6;
  color:#fff;
  border:0;
  border-radius:8px;
  font-weight:bold;
  cursor:pointer;
  font-size:13px;
}

.login-error{
  color:#dc2626;
  font-size:11px;
  margin:-6px 0 12px;
  display:none;
}

/* ============ ADMIN PANEL ============ */

.panel{
  display:none;
  grid-template-columns:280px 1fr;
  gap:18px;
  align-items:start;
}

@media(min-width:750px){
  .panel{
    display:grid;
  }
}

.panel.mobile-active{
  display:grid;
}

.supplier-panel{
  background:#fff;
  border:1px solid #ddd;
  border-radius:10px;
  overflow:hidden;
}

.supplier-panel-head{
  padding:14px 15px;
  border-bottom:1px solid #eee;
  font-weight:bold;
  font-size:13px;
}

.supplier-panel-search{
  padding:10px 12px;
  border-bottom:1px solid #eee;
}

.supplier-panel-search input{
  width:100%;
  padding:9px 10px;
  border:1px solid #ddd;
  border-radius:7px;
  font-size:12px;
}

.supplier-item{
  padding:12px 15px;
  border-bottom:1px solid #f0f0f0;
  cursor:pointer;
  font-size:12px;
  position:relative;
}

.supplier-item .unread-dot{
  display:none;
  position:absolute;
  right:14px;
  top:14px;
  width:9px;
  height:9px;
  border-radius:50%;
  background:#dc2626;
}

.supplier-item.has-unread .unread-dot{
  display:block;
}

.supplier-item.has-unread{
  background:#fff7f7;
  font-weight:bold;
}

.supplier-item:hover{
  background:#faf9ff;
}

.supplier-item.active{
  background:#f1ebfb;
}

.supplier-item .code{
  color:#777;
  font-size:10px;
  margin-top:3px;
}

.chat-panel{
  background:#fff;
  border:1px solid #ddd;
  border-radius:10px;
  display:flex;
  flex-direction:column;
  min-height:500px;
}

.chat-panel-head{
  padding:15px;
  border-bottom:1px solid #eee;
  font-weight:bold;
  font-size:13px;
}

.chat-panel-head .code{
  font-weight:normal;
  color:#777;
  font-size:11px;
  margin-top:3px;
}

.chat-panel-body{
  flex:1;
  padding:15px;
  overflow-y:auto;
  display:flex;
  flex-direction:column;
  gap:10px;
  max-height:480px;
}

.chat-empty{
  text-align:center;
  color:#999;
  font-size:11px;
  padding:40px 0;
}

.chat-bubble{
  max-width:70%;
  padding:9px 12px;
  border-radius:12px;
  font-size:12px;
  line-height:1.5;
  word-wrap:break-word;
}

.chat-bubble .chat-meta{
  display:block;
  font-size:9px;
  margin-top:4px;
  opacity:0.7;
}

.chat-bubble.admin{
  align-self:flex-end;
  background:#5b21b6;
  color:#fff;
  border-bottom-right-radius:3px;
}

.chat-bubble.supplier{
  align-self:flex-start;
  background:#f1f0f4;
  color:#222;
  border-bottom-left-radius:3px;
}

.chat-panel-input{
  display:flex;
  gap:8px;
  padding:12px 15px;
  border-top:1px solid #eee;
}

.chat-panel-input input{
  flex:1;
  border:1px solid #ddd;
  border-radius:8px;
  padding:10px 12px;
  font-size:12px;
}

.chat-panel-input button{
  background:#5b21b6;
  color:#fff;
  border:0;
  border-radius:8px;
  padding:0 18px;
  font-weight:bold;
  cursor:pointer;
  font-size:12px;
}

.chat-panel-input button:disabled{
  opacity:0.5;
  cursor:not-allowed;
}

.no-selection{
  display:flex;
  align-items:center;
  justify-content:center;
  flex:1;
  color:#999;
  font-size:12px;
  padding:40px;
  text-align:center;
}
</style>
</head>

<body>

<div class="header">

  <div class="logo-title">

    <div class="logo-box">MMD</div>

    <div>
      <div class="title">Admin Chat Return</div>
      <div class="subtitle">AEON ALAM SUTERA</div>
    </div>

  </div>

  <button class="logout-btn" id="notifBtn" onclick="enableNotifications()" style="display:none;">
    🔔 Aktifkan Notifikasi
  </button>

  <button class="logout-btn" id="logoutBtn" onclick="doLogout()">
    Keluar
  </button>

</div>


<div class="container">

  <!-- LOGIN -->
  <div class="login-box" id="loginBox">

    <h2>Login Admin</h2>
    <p>Masuk untuk membalas chat supplier</p>

    <input type="email" id="loginEmail" placeholder="Email admin">
    <input type="password" id="loginPassword" placeholder="Password">

    <p class="login-error" id="loginError">
      Email atau password salah.
    </p>

    <button onclick="doLogin()">Masuk</button>

  </div>


  <!-- PANEL -->
  <div class="panel" id="panel">

    <div class="supplier-panel">

      <div class="supplier-panel-head">
        Daftar Supplier
      </div>

      <div class="supplier-panel-search">
        <input
          type="text"
          id="adminSearch"
          placeholder="Cari supplier..."
        >
      </div>

      <div id="supplierPanelList">
        <p class="chat-empty">Memuat...</p>
      </div>

    </div>

    <div class="chat-panel" id="chatPanel">

      <div class="no-selection">
        Pilih supplier di sebelah kiri untuk mulai membalas chat.
      </div>

    </div>

  </div>

</div>


<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../supabase.js"></script>
<script src="app.js"></script>
<script src="admin.js"></script>

</body>
</html>

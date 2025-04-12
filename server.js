const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000; // 你可以選擇其他未被佔用的端口

// 使用 cors 中介層來允許所有來源的請求 (開發階段建議這樣做)
app.use(cors());

// 設定靜態檔案服務，讓伺服器可以提供你的 HTML 檔案和相關的靜態資源 (包括你的 .js 和 .json 檔案)
app.use(express.static(path.join(__dirname, '.'))); // 將目前資料夾設定為靜態檔案的根目錄

app.listen(port, () => {
  console.log(`伺服器已啟動，正在監聽端口 ${port}`);
});
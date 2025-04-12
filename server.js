const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Fuse = require('fuse.js');

const app = express();
const port = 3000;

// 使用 cors 中間件，允許跨域請求 (你可以根據需要調整)
app.use(cors());

// 讀取 Line ID.json 檔案 (假設它在你的專案根目錄)
const rawData = fs.readFileSync(path.join(__dirname, 'line id.json'), 'utf8');
const lineIds = JSON.parse(rawData);

// 設定 fuse.js 的選項
const options = {
  keys: ['帳號'],
  threshold: 0.3,
  minMatchCharLength: 1,
};

// 建立 Fuse 實例
const fuse = new Fuse(lineIds, options);

// 建立搜尋 API 路由
app.get('/search', (req, res) => {
  // 你的搜尋邏輯在這裡
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: '請提供搜尋關鍵字' });
  }

  // 先檢查是否有完全相符的資料
  const exactMatch = lineIds.find(item => item['帳號'].toLowerCase() === query.toLowerCase());

  if (exactMatch) {
    return res.json([{ item: exactMatch }]);
  } else {
    const results = fuse.search(query);
    return res.json(results);
  }
});

// 處理根目錄的請求 (保留原本的 Hello World!)
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器已在 http://localhost:${port} 上運行`);
});
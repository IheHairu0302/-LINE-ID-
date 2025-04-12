const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Fuse = require('fuse.js'); // 引入 fuse.js

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// 讀取 Line ID.json 檔案
const rawData = fs.readFileSync('Line ID.json', 'utf8');
const lineIds = JSON.parse(rawData);

// 設定 fuse.js 的選項
const options = {
  keys: ['帳號'], // 指定要在 "帳號" 這個欄位進行模糊搜尋
  threshold: 0.3, // 模糊程度
  minMatchCharLength: 1, // 允許單字元的模糊匹配
};

// 建立 Fuse 實例
const fuse = new Fuse(lineIds, options);

// 建立搜尋 API 路由
app.get('/search', (req, res) => {
  const query = req.query.q; // 從查詢參數中獲取搜尋關鍵字

  if (!query) {
    return res.status(400).json({ error: '請提供搜尋關鍵字' });
  }

  // 先檢查是否有完全相符的資料
  const exactMatch = lineIds.find(item => item['帳號'].toLowerCase() === query.toLowerCase());

  if (exactMatch) {
    // 如果找到完全相符的資料，只返回這一個結果 (模擬 fuse.js 的結果格式)
    return res.json([{ item: exactMatch }]);
  } else {
    // 如果沒有找到完全相符的資料，再進行模糊搜尋
    const results = fuse.search(query); // 使用 fuse.js 進行搜尋
    return res.json(results); // 將搜尋結果以 JSON 格式回傳
  }
});

app.listen(port, () => {
  console.log(`伺服器已啟動，正在監聽端口 ${port}`);
});
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Fuse = require('fuse.js');

const app = express();

// 讀取 Line ID.json 檔案 (假設它與你的 search.js 在同一個目錄下)
const rawData = fs.readFileSync('line id.json', 'utf8');
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

// Netlify Function 需要導出一個名為 handler 的異步函式
exports.handler = async (event, context) => {
  // 處理 CORS
  const allowedOrigins = ['melodious-paletas-64f621.netlify.app', 'http://localhost:5500']; // 記得替換成你的實際網址
  const origin = event.headers.origin;
  if (allowedOrigins.includes(origin)) {
    app.use(cors({ origin }));
  } else {
    app.use(cors()); // 允許所有來源，你可以根據需求調整
  }

  // 將 Express app 轉換為 Netlify Function
  const server = require('serverless-http')(app);
  return server(event, context);
};
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Fuse = require('fuse.js');

const RAW_JSON_URL = 'https://raw.githubusercontent.com/IheHairu0302/line-id-data/refs/heads/master/line%20id.json';

exports.handler = async function(event, context) {
  const query = event.queryStringParameters.q;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '請提供搜尋關鍵字' }),
    };
  }

  try {
    const response = await fetch(RAW_JSON_URL);
    const lineIds = await response.json();

    const options = {
      keys: ['帳號'],
      threshold: 0.3,
      minMatchCharLength: 1,
    };

    const fuse = new Fuse(lineIds, options);

    // 先檢查是否有完全相符的資料
    const exactMatch = lineIds.find(item => item['帳號'].toLowerCase() === query.toLowerCase());

    let results;
    if (exactMatch) {
      results = [{ item: exactMatch }];
    } else {
      results = fuse.search(query);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    console.error('從 GitHub 獲取 JSON 檔案時發生錯誤:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '從 GitHub 獲取 JSON 檔案時發生錯誤' }),
    };
  }
};
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Fuse = require('fuse.js');

exports.handler = async function(event, context) {
  const query = event.queryStringParameters.q;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '請提供搜尋關鍵字' }),
    };
  }

  try {
    const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
    const response = await fetch('https://od.moi.gov.tw/api/v1/rest/datastore/A01010000C-001277-053');
    const data = await response.json();

    if (data && data.result && data.result.records) {
      const lineIds = data.result.records;

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
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '無法從 API 取得資料' }),
      };
    }
  } catch (error) {
    console.error('呼叫 API 時發生錯誤:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '呼叫 API 時發生錯誤' }),
    };
  }
};
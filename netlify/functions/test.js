const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const rawData = fs.readFileSync('/var/task/line id.json', 'utf8');
    const jsonData = JSON.parse(rawData);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: '成功讀取檔案', data: jsonData }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
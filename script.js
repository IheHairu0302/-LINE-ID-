const checkButton = document.getElementById("checkButton");
const lineIdInput = document.getElementById("lineIdInput");
const resultArea = document.getElementById("resultArea");

let fraudLineIds = []; // 先宣告一個空的陣列來存放載入的資料

// 載入詐騙 LINE ID 資料
fetch('Line ID.json')
  .then(response => response.json())
  .then(data => {
    fraudLineIds = data; // 將解析後的 JSON 資料存放到 fraudLineIds 陣列中
    console.log('詐騙 LINE ID 資料載入成功：', fraudLineIds); // 可以在控制台看到載入的資料
  })
  .catch(error => {
    console.error('載入 JSON 資料時發生錯誤：', error);
    showResult("載入詐騙資料時發生錯誤，請稍後再試。", "danger");
  });

// LINE ID 詐騙查詢功能
checkButton.addEventListener("click", () => {
  const inputId = lineIdInput.value.trim().toLowerCase();
  if (!inputId) {
    showResult("請輸入 LINE ID", "warning");
    return;
  }

  console.log('使用者輸入的 LINE ID (小寫)：', inputId);

  const matched = fraudLineIds.find(record => {
    const recordAccount = record["帳號"]?.toLowerCase();
    console.log('正在比對的 JSON 帳號 (小寫)：', recordAccount);
    return recordAccount === inputId;
  });

  if (matched) {
    showResult(`⚠️ 此 LINE ID (${inputId}) 已被通報為詐騙帳號！<br>通報日期：${matched["通報日期"]} <br>編號：${matched["編號"]}`, "danger");
  } else {
    showResult(`✅ 此 LINE ID (${inputId}) 未在詐騙名單中。請仍保持警覺。`, "success");
  }
});

function showResult(message, type) {
  resultArea.className = `alert alert-${type}`;
  resultArea.classList.remove("d-none");
  resultArea.innerHTML = message;
}
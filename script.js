const checkButton = document.getElementById("checkButton");
const lineIdInput = document.getElementById("lineIdInput");
const resultArea = document.getElementById("resultArea");

// LINE ID 詐騙查詢功能 (修改後)
checkButton.addEventListener("click", () => {
  const inputId = lineIdInput.value.trim().toLowerCase();
  if (!inputId) {
    showResult("請輸入 LINE ID", "warning");
    return;
  }

  console.log('使用者輸入的 LINE ID (小寫)：', inputId);

  // 發送請求到後端的 /search API
  fetch(`http://localhost:3000/search?q=${inputId}`)
    .then(response => response.json())
    .then(results => {
      console.log('後端回傳的搜尋結果：', results);
      if (results && results.length > 0) {
        let message = "";
        const numberOfResultsToShow = Math.min(5, results.length); // 最多顯示 3 個結果

        for (let i = 0; i < numberOfResultsToShow; i++) {
          const match = results[i].item;
          const score = results[i].score !== undefined ? `(相似度 ${(results[i].score).toFixed(2)})` : '(相似度資訊不可用)';
          message += `⚠️ 可能的詐騙帳號 ${score}：${inputId} (相似結果：${match["帳號"]})<br>通報日期：${match["通報日期"]} <br>編號：${match["編號"]}<hr>`;
        }
        showResult(message, "danger");
      } else {
        showResult(`✅ 此 LINE ID (${inputId}) 未在詐騙名單中找到相似結果。請仍保持警覺。`, "success");
      }
    })
    .catch(error => {
      console.error('向伺服器發送搜尋請求時發生錯誤：', error);
      showResult("搜尋時發生錯誤，請稍後再試。", "danger");
    });
});

function showResult(message, type) {
  resultArea.className = `alert alert-${type}`;
  resultArea.classList.remove("d-none");
  resultArea.innerHTML = message;
}
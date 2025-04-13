document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('lineIdInput'); // 注意這裡的 ID 應該是 'lineIdInput'
  const checkButton = document.getElementById('checkButton'); // 注意這裡的 ID 應該是 'checkButton'
  const searchResultsDiv = document.getElementById('resultArea'); // 注意這裡的 ID 應該是 'resultArea'
  const sortAscendingButton = document.getElementById('sortAscending');
  const sortDescendingButton = document.getElementById('sortDescending');

  let allSearchResults = []; // 用來儲存原始的搜尋結果

  checkButton.addEventListener('click', performSearch);

  function performSearch() {
    const inputId = searchInput.value.trim().toLowerCase();
    if (inputId) {
      searchResultsDiv.classList.remove('d-none'); // 顯示結果區域
      searchResultsDiv.innerHTML = '<p>搜尋中...</p>';
      fetch(`/.netlify/functions/search?q=${inputId}`)
        .then(response => response.json())
        .then(data => {
          allSearchResults = data; // 將搜尋結果儲存到變數中
          displayResults(data); // 預設顯示原始順序
        })
        .catch(error => {
          console.error('向伺服器發送搜尋請求時發生錯誤：', error);
          searchResultsDiv.innerHTML = '<p class="error">搜尋時發生錯誤</p>';
        });
    } else {
      searchResultsDiv.classList.add('d-none'); // 隱藏結果區域
      searchResultsDiv.innerHTML = '';
    }
  }

  function displayResults(results) {
    searchResultsDiv.innerHTML = '';
    if (results && results.length > 0) {
      const ul = document.createElement('ul');
      results.forEach(result => {
        const li = document.createElement('li');
        li.textContent = `帳號: ${result.item['帳號']}`;
        ul.appendChild(li);
      });
      searchResultsDiv.appendChild(ul);
    } else {
      searchResultsDiv.innerHTML = '<p>沒有找到符合的結果</p>';
    }
  }

  // 順序按鈕的點擊事件
  sortAscendingButton.addEventListener('click', function() {
    displayResults(allSearchResults); // 顯示原始儲存的順序
  });

  // 倒序按鈕的點擊事件
  sortDescendingButton.addEventListener('click', function() {
    const reversedResults = [...allSearchResults].reverse(); // 複製一份並反轉
    displayResults(reversedResults);
  });
});
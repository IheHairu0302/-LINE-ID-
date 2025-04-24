document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('lineIdInput');
  const checkButton = document.getElementById('checkButton');
  const searchResultsDiv = document.getElementById('resultArea');
  const sortAscendingButton = document.getElementById('sortAscending');
  const sortDescendingButton = document.getElementById('sortDescending');
  const paginationDiv = document.createElement('div'); // 創建分頁按鈕的容器
  paginationDiv.id = 'pagination';
  searchResultsDiv.after(paginationDiv); // 將分頁容器放在結果區域下方

  const resultsPerPage = 15; // 每頁顯示的結果數量
  let currentPage = 1;
  let allSearchResults = []; // 儲存所有搜尋結果

  checkButton.addEventListener('click', performSearch);

  function performSearch() {
      const inputId = searchInput.value.trim().toLowerCase();
      if (inputId) {
          searchResultsDiv.classList.remove('d-none');
          // 搜尋中狀態顯示 Font Awesome 放大鏡
          searchResultsDiv.innerHTML = `
              <div style="background-color: #e0f7fa; border: 1px solid #80deea; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #00838f;">
                  <i class="fas fa-search fa-sm" style="margin-right: 5px;"></i>
                  搜尋中...
              </div>
          `;
          fetch(`/.netlify/functions/search?q=${inputId}`)
              .then(response => response.json())
              .then(data => {
                  allSearchResults = data;
                  currentPage = 1;
                  if (allSearchResults.length === 0) {
                      // 如果沒有找到任何結果，直接顯示安全訊息 (含 Font Awesome 打勾)
                      searchResultsDiv.innerHTML = `
                          <div style="background-color: #e0ffe0; border: 1px solid #a5d6a7; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #388e3c;">
                              <i class="fas fa-check-circle fa-sm" style="margin-right: 5px;"></i>
                              您搜尋的帳號暫時是安全的
                          </div>
                      `;
                      paginationDiv.innerHTML = ''; // 清空分頁按鈕
                  } else {
                      displayPage(data, currentPage);
                      updatePaginationButtons(data);
                  }
              })
              .catch(error => {
                  console.error('向伺服器發送搜尋請求時發生錯誤：', error);
                  searchResultsDiv.innerHTML = '<p class="error">搜尋時發生錯誤</p>';
              });
      } else {
          searchResultsDiv.classList.add('d-none');
          searchResultsDiv.innerHTML = '';
          paginationDiv.innerHTML = '';
      }
  }

  function displayPage(results, page) {
      searchResultsDiv.innerHTML = '';
      searchResultsDiv.style.backgroundColor = ''; // 加上這行，在每次顯示新頁面時清除背景顏色
      const startIndex = (page - 1) * resultsPerPage;
      const endIndex = startIndex + resultsPerPage;
      const pageResults = results.slice(startIndex, endIndex);

      let hasReportedAccount = false;
      let ul = null;

      if (pageResults.length > 0) {
          ul = document.createElement('ul');
          ul.classList.add('list-unstyled'); // 使用 Bootstrap 的類別移除預設列表樣式 (可選)

          pageResults.forEach(result => {
              const li = document.createElement('li');
              li.style.marginBottom = '15px'; // 增加列表項目之間的間距
              li.style.borderBottom = '1px solid #eee'; // 添加分隔線
              li.style.paddingBottom = '10px'; // 增加分隔線下方的內邊距

              const accountInfo = document.createElement('div');
              accountInfo.style.display = 'flex';
              accountInfo.style.alignItems = 'center';
              accountInfo.style.justifyContent = 'space-between'; // 使帳號和日期靠兩邊對齊 (可選)
              accountInfo.style.flexWrap = 'wrap'; // 在小螢幕上換行 (可選)


              const accountText = document.createElement('span');
              accountText.textContent = `帳號: ${result.item['帳號']}`;
              accountInfo.appendChild(accountText);

              const statusContainer = document.createElement('div'); // 創建一個容器來放置圖示和日期
              statusContainer.style.display = 'flex';
              statusContainer.style.alignItems = 'center';


              const statusIcon = document.createElement('i');
              statusIcon.style.marginLeft = '10px'; // 圖示左側間距
              statusIcon.style.fontSize = '1.2em'; // 調整大小

              if (result.item['通報日期']) {
                  statusIcon.className = 'fas fa-exclamation-triangle'; // 黃色驚嘆號
                  statusIcon.style.color = '#ffc107'; // 黃色
                  statusIcon.title = '可能為通報帳號'; // 添加標題
                  hasReportedAccount = true;

                  const reportDateSpan = document.createElement('span');
                  reportDateSpan.style.marginLeft = '5px'; // 日期左側間距
                  reportDateSpan.style.fontSize = '0.9em';
                  reportDateSpan.style.color = '#555';
                  reportDateSpan.textContent = `通報日期: ${result.item['通報日期']}`; // 顯示通報日期
                  statusContainer.appendChild(statusIcon);
                  statusContainer.appendChild(reportDateSpan);


              } else {
                  statusIcon.className = 'fas fa-check-circle'; // 綠色打勾
                  statusIcon.style.color = '#28a745'; // 綠色
                  statusIcon.title = '帳號安全'; // 添加標題
                  statusContainer.appendChild(statusIcon);
              }
               accountInfo.appendChild(statusContainer); // 將圖示和日期容器添加到帳號信息容器中
              li.appendChild(accountInfo); // 將帳號信息容器添加到列表項目中
              ul.appendChild(li);
          });

          searchResultsDiv.appendChild(ul);

          // 根據是否有通報帳號顯示整體訊息和背景顏色
          if (hasReportedAccount) {
              const message = document.createElement('p');
              message.textContent = '以下是可能的通報帳號';
              searchResultsDiv.insertBefore(message, ul);
              searchResultsDiv.style.backgroundColor = '#ffe0e0'; // 淡紅色背景
          } else {
               // 如果所有結果都安全，顯示整體安全訊息
              const message = document.createElement('p');
              message.textContent = '您搜尋的帳號安全';
              searchResultsDiv.insertBefore(message, ul);
              searchResultsDiv.style.backgroundColor = '#e0ffe0'; // 淡綠色背景
          }

      } else {
          // 如果沒有任何搜尋結果
           searchResultsDiv.innerHTML = `
              <div style="background-color: #e0ffe0; border: 1px solid #a5d6a7; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #388e3c;">
                  <i class="fas fa-check-circle fa-sm" style="margin-right: 5px;"></i>
                  您搜尋的帳號暫時是安全的
              </div>
          `;
          searchResultsDiv.style.backgroundColor = ''; // 移除可能的背景色
      }
  }

  function updatePaginationButtons(results) {
      paginationDiv.innerHTML = ''; // 清空之前的分頁按鈕
      const totalPages = Math.ceil(results.length / resultsPerPage);
      const maxVisiblePages = 7; // 設定最多顯示的頁碼按鈕數量

      if (totalPages > 1) {
          const nav = document.createElement('nav');
          const ul = document.createElement('ul');
          ul.classList.add('pagination');

          // 上一頁按鈕
          const prevLi = document.createElement('li');
          prevLi.classList.add('page-item');
          if (currentPage === 1) {
              prevLi.classList.add('disabled');
          }
          const prevLink = document.createElement('a');
          prevLink.classList.add('page-link');
          prevLink.textContent = '上一頁';
          prevLink.addEventListener('click', () => {
              if (currentPage > 1) {
                  currentPage--;
                  displayPage(allSearchResults, currentPage);
                  updatePaginationButtons(allSearchResults);
              }
          });
          prevLi.appendChild(prevLink);
          ul.appendChild(prevLi);

          // 頁碼按鈕
          if (totalPages <= maxVisiblePages) {
              // 總頁數不多於可顯示的頁碼數量，直接顯示所有頁碼
              for (let i = 1; i <= totalPages; i++) {
                  const pageLi = createPageItem(i);
                  ul.appendChild(pageLi);
              }
          } else {
              // 總頁數過多，需要判斷顯示部分頁碼
              let startPage, endPage;

              if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
                  // 當前頁靠近開頭
                  startPage = 1;
                  endPage = maxVisiblePages - 1;
              } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
                  // 當前頁靠近結尾
                  startPage = totalPages - maxVisiblePages + 2;
                  endPage = totalPages;
              } else {
                  // 當前頁在中間
                  startPage = currentPage - Math.floor(maxVisiblePages / 2);
                  endPage = currentPage + Math.floor(maxVisiblePages / 2);
              }

              // 顯示第一頁和省略符號
              if (startPage > 1) {
                  ul.appendChild(createPageItem(1));
                  if (startPage > 2) {
                      const ellipsisLi = document.createElement('li');
                      ellipsisLi.classList.add('page-item', 'disabled');
                      const ellipsisSpan = document.createElement('span');
                      ellipsisSpan.classList.add('page-link');
                      ellipsisSpan.textContent = '...';
                      ellipsisLi.appendChild(ellipsisSpan);
                      ul.appendChild(ellipsisLi);
                  }
              }

              // 顯示中間的頁碼
              for (let i = startPage; i <= endPage; i++) {
                  ul.appendChild(createPageItem(i));
              }

              // 顯示省略符號和最後一頁
              if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                      const ellipsisLi = document.createElement('li');
                      ellipsisLi.classList.add('page-item', 'disabled');
                      const ellipsisSpan = document.createElement('span');
                      ellipsisSpan.classList.add('page-link');
                      ellipsisSpan.textContent = '...';
                      ellipsisLi.appendChild(ellipsisSpan);
                      ul.appendChild(ellipsisLi);
                  }
                  ul.appendChild(createPageItem(totalPages));
              }
          }

          // 下一頁按鈕
          const nextLi = document.createElement('li');
          nextLi.classList.add('page-item');
          if (currentPage === totalPages) {
              nextLi.classList.add('disabled');
          }
          const nextLink = document.createElement('a');
          nextLink.classList.add('page-link');
          nextLink.textContent = '下一頁';
          nextLink.addEventListener('click', () => {
              if (currentPage < totalPages) {
                  currentPage++;
                  displayPage(allSearchResults, currentPage);
                  updatePaginationButtons(allSearchResults);
              }
          });
          nextLi.appendChild(nextLink);
          ul.appendChild(nextLi);

          nav.appendChild(ul);
          paginationDiv.appendChild(nav);
      }
  }

  function createPageItem(pageNumber) {
      const pageLi = document.createElement('li');
      pageLi.classList.add('page-item');
      if (pageNumber === currentPage) {
          pageLi.classList.add('active');
      }
      const pageLink = document.createElement('a');
      pageLink.classList.add('page-link');
      pageLink.textContent = pageNumber;
      pageLink.addEventListener('click', () => {
          currentPage = pageNumber;
          displayPage(allSearchResults, currentPage);
          updatePaginationButtons(allSearchResults);
      });
      pageLi.appendChild(pageLink);
      return pageLi;
  }

  // 順序按鈕的點擊事件
  sortAscendingButton.addEventListener('click', function() {
      // 這裡不需要額外的排序邏輯，displayPage會處理
      displayPage(allSearchResults, currentPage); // 重新顯示當前頁面的結果
      updatePaginationButtons(allSearchResults);
  });

  // 倒序按鈕的點擊事件
  sortDescendingButton.addEventListener('click', function() {
      // 這裡進行反轉，然後重新顯示當前頁面的結果
      const reversedResults = [...allSearchResults].reverse();
      displayPage(reversedResults, currentPage); // 重新顯示當前頁面反轉後的結果
      // 注意：這裡更新分頁按鈕時應該使用allSearchResults，以便正確計算總頁數
      updatePaginationButtons(allSearchResults);
  });
});
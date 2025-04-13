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
      searchResultsDiv.innerHTML = '<p>搜尋中...</p>';
      fetch(`/.netlify/functions/search?q=${inputId}`)
        .then(response => response.json())
        .then(data => {
          allSearchResults = data;
          currentPage = 1; // 每次新的搜尋都回到第一頁
          displayPage(data, currentPage); // 顯示第一頁的結果
          updatePaginationButtons(data); // 更新分頁按鈕
        })
        .catch(error => {
          console.error('向伺服器發送搜尋請求時發生錯誤：', error);
          searchResultsDiv.innerHTML = '<p class="error">搜尋時發生錯誤</p>';
        });
    } else {
      searchResultsDiv.classList.add('d-none');
      searchResultsDiv.innerHTML = '';
      paginationDiv.innerHTML = ''; // 清空分頁按鈕
    }
  }

  function displayPage(results, page) {
    searchResultsDiv.innerHTML = '';
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const pageResults = results.slice(startIndex, endIndex); // 取得當前頁面的結果

    let hasReportedAccount = false;
    let ul = null;

    if (pageResults.length > 0) {
      ul = document.createElement('ul');
      pageResults.forEach(result => {
        const li = document.createElement('li');
        li.textContent = `帳號: ${result.item['帳號']}`;
        if (result.item['通報日期']) {
          hasReportedAccount = true;
        }
        ul.appendChild(li);
      });

      searchResultsDiv.appendChild(ul);

      if (hasReportedAccount) {
        const message = document.createElement('p');
        message.textContent = '以下是可能的通報帳號';
        searchResultsDiv.insertBefore(message, ul);
        searchResultsDiv.style.backgroundColor = '#ffe0e0';
      } else {
        const message = document.createElement('p');
        message.textContent = '您搜尋的帳號安全';
        searchResultsDiv.insertBefore(message, ul);
        searchResultsDiv.style.backgroundColor = '#e0ffe0';
      }
    } else {
      searchResultsDiv.innerHTML = '<p>沒有找到符合的結果</p>';
      searchResultsDiv.style.backgroundColor = '';
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
    displayPage(allSearchResults, currentPage); // 重新顯示當前頁面的結果
    updatePaginationButtons(allSearchResults);
  });

  // 倒序按鈕的點擊事件
  sortDescendingButton.addEventListener('click', function() {
    const reversedResults = [...allSearchResults].reverse();
    displayPage(reversedResults, currentPage); // 重新顯示當前頁面反轉後的結果
    updatePaginationButtons(reversedResults);
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('lineIdInput');
  const checkButton = document.getElementById('checkButton');
  const searchResultsDiv = document.getElementById('resultArea');
  const sortAscendingButton = document.getElementById('sortAscending');
  const sortDescendingButton = document.getElementById('sortDescending');
  const paginationDiv = document.createElement('div'); // 創建分頁按鈕的容器
  paginationDiv.id = 'pagination';
  searchResultsDiv.after(paginationDiv); // 將分頁容器放在結果區域下方

  const resultsPerPage = 10; // 每頁顯示的結果數量
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
      for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.classList.add('page-item');
        if (i === currentPage) {
          pageLi.classList.add('active');
        }
        const pageLink = document.createElement('a');
        pageLink.classList.add('page-link');
        pageLink.textContent = i;
        pageLink.addEventListener('click', () => {
          currentPage = i;
          displayPage(allSearchResults, currentPage);
          updatePaginationButtons(allSearchResults);
        });
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
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
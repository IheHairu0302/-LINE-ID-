document.addEventListener('DOMContentLoaded', function() {
    // 將所有 DOM 元素的取得都放在前面
    const searchInput = document.getElementById('lineIdInput');
    const checkButton = document.getElementById('checkButton');
    const searchResultsDiv = document.getElementById('resultArea');
    const sortAscendingButton = document.getElementById('sortAscending');
    const sortDescendingButton = document.getElementById('sortDescending');

    // 統計圖表相關元素
    const statisticsTabButton = document.getElementById('statistics-tab');
    const statisticsTabPane = document.getElementById('statistics'); // 統計頁籤的內容區域
    const scamTrendChartCanvas = document.getElementById('scamTrendChart'); // 全台趨勢圖 canvas
    const countyDetailChartCanvas = document.getElementById('countyDetailChart'); // 縣市詳細圖 canvas
    const countyInfoDiv = document.getElementById('county-info'); // 縣市資訊區域
    const taiwanMapContainer = document.getElementById('taiwan-map-container'); // 台灣地圖容器


    const paginationDiv = document.createElement('div'); // 創建分頁按鈕的容器
    paginationDiv.id = 'pagination';
    // 確保分頁容器在line-checker section內部，但可以彈性處理位置
    const lineCheckerSection = document.getElementById('line-checker');
    if (lineCheckerSection) { // 確保lineCheckerSection存在
        // 放在 searchResultsDiv 後面，這可能更直觀
        searchResultsDiv.after(paginationDiv);
    }


    let chartInitialized = false; // 標記，避免重複初始化圖表


    // 統計標籤按鈕的事件監聽器
    // 在這裡檢查統計頁籤相關的 DOM 元素是否存在，如果存在才允許初始化地圖和圖表
    if (statisticsTabButton && statisticsTabPane && scamTrendChartCanvas && countyDetailChartCanvas && countyInfoDiv && taiwanMapContainer) {
        statisticsTabButton.addEventListener('shown.bs.tab', function (event) {
            // 確保統計頁籤內容區域存在，才執行圖表相關初始化
            if (statisticsTabPane) {
                if (!chartInitialized) {
                    // 只有在第一次顯示統計頁籤時才初始化圖表和地圖
                    loadScamTrendChart();
                    initTaiwanMap(); // 初始化台灣地圖
                    chartInitialized = true; // 標記為已初始化
                }
                // 如果需要，可以在頁籤顯示時更新縣市資訊（例如顯示預設訊息）
                 if (countyInfoDiv && countyInfoDiv.innerHTML === '請在地圖上選擇一個縣市以查看詳細資訊') {
                     // 保持原有的預設訊息，或根據需要設定一個新的預設狀態
                 }
            } else {
                console.error("找不到統計頁籤的內容區域 (ID為 'statistics')");
            }
        });
    } else {
        console.warn("統計頁籤或地圖相關 DOM 元素未完全找到，統計功能可能無法正常運作。");
    }


    const resultsPerPage = 15; // 每頁顯示的結果數量
    let currentPage = 1;
    let allSearchResults = []; // 儲存所有搜尋結果

    // Font Awesome icons 的 HTML 片段，方便重複使用
    const searchIconHtml = `
     <div style="background-color: #e0f7fa; border: 1px solid #80deea; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #00838f;">
       <i class="fas fa-search fa-sm" style="margin-right: 5px;"></i>
       搜尋中...
     </div>
    `;
    const safeMessageHtml = `
     <div style="background-color: #e0ffe0; border: 1px solid #a5d6a7; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #388e3c;">
       <i class="fas fa-check-circle fa-sm" style="margin-right: 5px;"></i>
       您搜尋的帳號暫時是安全的
     </div>
    `;

    // 統計圖表數據 URL
    // 請在這裡替換成你實際從 GitHub 獲取到的 Raw URL
    const scamDataUrls = {
        110: 'https://raw.githubusercontent.com/IheHairu0302/scam_stats/refs/heads/master/110.json',
        111: 'https://raw.githubusercontent.com/IheHairu0302/scam_stats/refs/heads/master/111.json',
        112: 'https://raw.githubusercontent.com/IheHairu0302/scam_stats/refs/heads/master/112.json',
        113: 'https://raw.githubusercontent.com/IheHairu0302/scam_stats/refs/heads/master/113.json',
        114: 'https://raw.githubusercontent.com/IheHairu0302/scam_stats/refs/heads/master/114.json'
    };

    // 檢查按鈕事件監聽器 (確保 checkButton 存在)
    if (checkButton) {
        checkButton.addEventListener('click', performSearch);
        // 也為輸入框添加 'keypress' 事件，以便按下 Enter 鍵觸發搜尋
         searchInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                 event.preventDefault(); // 阻止表單提交等預設行為
                 performSearch();
             }
         });

    } else {
        console.error("找不到 ID 為 'checkButton' 的元素");
    }


    function performSearch() {
        // 確保 searchInput 和 searchResultsDiv 存在
        if (!searchInput || !searchResultsDiv) {
            console.error("搜尋相關 DOM 元素未找到");
            return;
        }

        const inputId = searchInput.value.trim().toLowerCase();
        if (inputId) {
            searchResultsDiv.classList.remove('d-none');
            // 搜尋中狀態顯示 Font Awesome 放大鏡
            searchResultsDiv.innerHTML = searchIconHtml;
             // 確保 paginationDiv 存在
             if (paginationDiv) paginationDiv.innerHTML = ''; // 清空之前的分頁按鈕

            // 請注意：這裡仍然使用原有的 Netlify Function 來搜尋 LINE ID
            fetch(`/.netlify/functions/search?q=${inputId}`)
                .then(response => {
                    if (!response.ok) {
                         // 處理非 2xx 的 HTTP 狀態碼
                         // 嘗試讀取錯誤訊息
                         return response.text().then(text => { throw new Error(`HTTP error! status: ${response.status}, message: ${text}`); });
                    }
                    return response.json();
                })
                .then(data => {
                    allSearchResults = data;
                    currentPage = 1;
                    if (allSearchResults.length === 0) {
                        // 如果沒有找到任何結果，直接顯示安全訊息 (含 Font Awesome 打勾)
                        searchResultsDiv.innerHTML = safeMessageHtml;
                        // 確保 paginationDiv 存在
                        if (paginationDiv) paginationDiv.innerHTML = ''; // 清空分頁按鈕
                    } else {
                        displayPage(data, currentPage);
                        updatePaginationButtons(data);
                         // 顯示排序按鈕 (如果之前隱藏了)
                         if(sortAscendingButton && sortDescendingButton) {
                             sortAscendingButton.style.display = '';
                             sortDescendingButton.style.display = '';
                         }
                    }
                })
                .catch(error => {
                    console.error('向伺服器發送搜尋請求時發生錯誤：', error);
                    // 確保 searchResultsDiv 存在
                    if (searchResultsDiv) searchResultsDiv.innerHTML = `<div class="alert alert-danger" role="alert">搜尋時發生錯誤，請稍後再試。詳情：${error.message}</div>`;
                    // 確保 paginationDiv 存在
                    if (paginationDiv) paginationDiv.innerHTML = '';
                     // 隱藏排序按鈕
                     if(sortAscendingButton && sortDescendingButton) {
                         sortAscendingButton.style.display = 'none';
                         sortDescendingButton.style.display = 'none';
                     }
                });
        } else {
             // 如果輸入為空
             // 確保 searchResultsDiv 和 paginationDiv 存在
             if (searchResultsDiv) {
                 searchResultsDiv.classList.add('d-none');
                 searchResultsDiv.innerHTML = '';
             }
             if (paginationDiv) {
                 paginationDiv.innerHTML = '';
             }
             // 隱藏排序按鈕
             if(sortAscendingButton && sortDescendingButton) {
                 sortAscendingButton.style.display = 'none';
                 sortDescendingButton.style.display = 'none';
             }
        }
    }

    function displayPage(results, page) {
        // 確保 searchResultsDiv 存在
        if (!searchResultsDiv) return;

        searchResultsDiv.innerHTML = '';
        searchResultsDiv.style.backgroundColor = ''; // 加上這行，在每次顯示新頁面時清除背景顏色
        const startIndex = (page - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        const pageResults = results.slice(startIndex, endIndex);

        let hasReportedAccount = false;
        let ul = null;

        if (pageResults.length > 0) {
            ul = document.createElement('ul');
            ul.classList.add('list-unstyled', 'mt-3'); // 使用 Bootstrap 的類別移除預設列表樣式並添加頂部間距


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
            const message = document.createElement('p');
            message.classList.add('mb-2'); // 添加底部間距
            if (hasReportedAccount) {
                message.textContent = `找到 ${allSearchResults.length} 個相關帳號，以下是通報結果:`;
                 message.style.color = '#dc3545'; // 紅色文字
                searchResultsDiv.style.backgroundColor = '#ffe0e0'; // 淡紅色背景
            } else {
                 // 如果所有結果都安全，顯示整體安全訊息
                message.textContent = `找到 ${allSearchResults.length} 個相關帳號，目前均顯示為安全帳號。`;
                 message.style.color = '#28a745'; // 綠色文字
                searchResultsDiv.style.backgroundColor = '#e0ffe0'; // 淡綠色背景
            }
            searchResultsDiv.insertBefore(message, searchResultsDiv.firstChild); // 將訊息放在最前面


        } else {
            // 如果沒有任何搜尋結果
            searchResultsDiv.innerHTML = safeMessageHtml;
            searchResultsDiv.style.backgroundColor = ''; // 移除可能的背景色
        }
    }

    function updatePaginationButtons(results) {
        // 確保 paginationDiv 存在
        if (!paginationDiv) return;

        paginationDiv.innerHTML = ''; // 清空之前的分頁按鈕
        const totalPages = Math.ceil(results.length / resultsPerPage);
        const maxVisiblePages = 7; // 設定最多顯示的頁碼按鈕數量

        if (totalPages > 1) {
            const nav = document.createElement('nav');
            const ul = document.createElement('ul');
            ul.classList.add('pagination', 'justify-content-center'); // 添加 Bootstrap 分頁和居中類別

            // 上一頁按鈕
            const prevLi = document.createElement('li');
            prevLi.classList.add('page-item');
            if (currentPage === 1) {
                prevLi.classList.add('disabled');
            }
            const prevLink = document.createElement('a');
            prevLink.classList.add('page-link');
            prevLink.textContent = '上一頁';
            prevLink.href = '#'; // 避免頁面跳轉
            prevLink.setAttribute('aria-label', 'Previous'); // 無障礙標籤
            prevLink.addEventListener('click', (e) => {
                 e.preventDefault(); // 阻止預設行為
                if (currentPage > 1) {
                    currentPage--;
                    displayPage(allSearchResults, currentPage);
                    updatePaginationButtons(allSearchResults);
                }
            });
            prevLi.appendChild(prevLink);
            ul.appendChild(prevLi);

            // 頁碼按鈕
            let startPage, endPage;
            if (totalPages <= maxVisiblePages) {
                // 總頁數不多於可顯示的頁碼數量，直接顯示所有頁碼
                startPage = 1;
                endPage = totalPages;
            } else {
                 // 總頁數過多，需要判斷顯示部分頁碼
                 const sidePages = Math.floor((maxVisiblePages - 3) / 2); // 兩邊預留的頁數 (減去首尾和省略符號)

                 if (currentPage <= sidePages + 1) {
                     // 當前頁靠近開頭
                     startPage = 1;
                     endPage = maxVisiblePages - 2; // 顯示到能容下 ... 和最後一頁
                 } else if (currentPage >= totalPages - sidePages) {
                     // 當前頁靠近結尾
                     startPage = totalPages - maxVisiblePages + 3; // 從能容下第一頁和 ... 開始
                     endPage = totalPages;
                 } else {
                     // 當前頁在中間
                     startPage = currentPage - sidePages;
                     endPage = currentPage + sidePages;
                 }

                 // 確保邊界正確
                 startPage = Math.max(1, startPage);
                 endPage = Math.min(totalPages, endPage);


                 // 顯示第一頁
                 if (startPage > 1) {
                      ul.appendChild(createPageItem(1));
                      // 顯示開頭的省略符號
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
            }

            // 顯示計算出的頁碼範圍
            for (let i = startPage; i <= endPage; i++) {
                ul.appendChild(createPageItem(i));
            }

             // 顯示最後一頁
             if (endPage < totalPages) {
                  // 顯示結尾的省略符號
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


            // 下一頁按鈕
            const nextLi = document.createElement('li');
            nextLi.classList.add('page-item');
            if (currentPage === totalPages) {
                nextLi.classList.add('disabled');
            }
            const nextLink = document.createElement('a');
            nextLink.classList.add('page-link');
            nextLink.textContent = '下一頁';
            nextLink.href = '#'; // 避免頁面跳轉
            nextLink.setAttribute('aria-label', 'Next'); // 無障礙標籤
            nextLink.addEventListener('click', (e) => {
                 e.preventDefault(); // 阻止預設行為
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
         // 隱藏排序按鈕如果沒有結果
         if (results.length === 0) {
              if(sortAscendingButton && sortDescendingButton) {
                  sortAscendingButton.style.display = 'none';
                  sortDescendingButton.style.display = 'none';
              }
         } else {
              if(sortAscendingButton && sortDescendingButton) {
                  sortAscendingButton.style.display = '';
                  sortDescendingButton.style.display = '';
              }
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
        pageLink.href = '#'; // 避免頁面跳轉
        pageLink.addEventListener('click', (e) => {
             e.preventDefault(); // 阻止預設行為
            currentPage = pageNumber;
            displayPage(allSearchResults, currentPage);
            updatePaginationButtons(allSearchResults);
        });
        pageLi.appendChild(pageLink);
        return pageLi;
    }

    // 順序按鈕的點擊事件 (確保按鈕存在)
    if (sortAscendingButton) {
        sortAscendingButton.addEventListener('click', function() {
             // 確保有搜尋結果才排序
             if (allSearchResults && allSearchResults.length > 0) {
                 // 這裡添加按日期升序排序邏輯 (假設 '通報日期' 是有效的日期字串或可以轉換為日期)
                 // 如果沒有 '通報日期' 的項目，將其視為較舊或放在後面
                 allSearchResults.sort((a, b) => {
                     const dateA = a.item['通報日期'] ? new Date(a.item['通報日期']) : null;
                     const dateB = b.item['通報日期'] ? new Date(b.item['通報日期']) : null;

                     if (dateA && dateB) return dateA - dateB;
                     if (dateA) return -1; // A 有日期 B 沒有，A 靠前
                     if (dateB) return 1; // B 有日期 A 沒有，B 靠前
                     return 0; // 都沒有日期，順序不變
                 });
                 currentPage = 1; // 排序後回到第一頁
                 displayPage(allSearchResults, currentPage); // 重新顯示當前頁面的結果
                 updatePaginationButtons(allSearchResults);
             }
        });
    } else {
        console.warn("找不到 ID 為 'sortAscending' 的元素");
    }


    // 倒序按鈕的點擊事件 (確保按鈕存在)
    if (sortDescendingButton) {
        sortDescendingButton.addEventListener('click', function() {
            // 確保有搜尋結果才排序
             if (allSearchResults && allSearchResults.length > 0) {
                 // 這裡添加按日期降序排序邏輯
                 allSearchResults.sort((a, b) => {
                     const dateA = a.item['通報日期'] ? new Date(a.item['通報日期']) : null;
                     const dateB = b.item['通報日期'] ? new Date(b.item['通報日期']) : null;

                     if (dateA && dateB) return dateB - dateA;
                     if (dateA) return -1; // A 有日期 B 沒有，A 靠前 (在降序中，無日期的靠後)
                     if (dateB) return 1; // B 有日期 A 沒有，B 靠前
                     return 0; // 都沒有日期，順序不變
                 });
                currentPage = 1; // 排序後回到第一頁
                displayPage(allSearchResults, currentPage); // 重新顯示當前頁面反轉後的結果
                updatePaginationButtons(allSearchResults);
             }
        });
    } else {
        console.warn("找不到 ID 為 'sortDescending' 的元素");
    }


    // 載入並繪製詐騙趨勢圖
    function loadScamTrendChart() {
        const years = [110,111, 112, 113, 114];
        const fetchPromises = years.map(year =>
            // 從 scamDataUrls 物件中獲取對應年份的 URL
            fetch(scamDataUrls[year])
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch data for year ${year}: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error(`Error fetching data for year ${year}:`, error);
                    // 返回一個表示失敗的結果，例如 null 或一個帶有錯誤標記的對象
                    return { error: `Failed to load data for year ${year}` };
                })
        );

        Promise.all(fetchPromises)
            .then(yearlyDataResults => {
                const yearlyTotals = [];
                let dataLoadError = false;

                yearlyDataResults.forEach(result => {
                    if (result && !result.error) {
                        let totalOccurrences = 0;
                        result.forEach(item => {
                            // 這裡根據你提供的 JSON 結構，加總「發生數」
                            if (item['發生數']) {
                                totalOccurrences += item['發生數'];
                            }
                        });
                        yearlyTotals.push(totalOccurrences);
                    } else {
                         // 如果某年數據載入失敗，則該年總數為0或標記錯誤
                         yearlyTotals.push(0); // 或者使用 NaN 表示數據不可用
                         dataLoadError = true;
                         console.error(`數據載入失敗的年份: ${result ? result.error : '未知錯誤'}`); // 輸出具體的錯誤信息
                    }
                });

                const chartData = {
                    labels: years.map(String), // 圖表 X 軸標籤 (年份)
                    datasets: [{
                        label: '年度詐騙發生總數', // 數據集名稱
                        data: yearlyTotals, // 年度總發生數數據
                        borderColor: 'rgb(75, 192, 192)', // 線條顏色
                        tension: 0.1, // 線條張力
                        fill: false // 不填充線下區域
                    }]
                };

                const ctx = scamTrendChartCanvas; // 使用前面取得的 canvas 元素
                if (ctx) { // 確保 canvas 元素存在
                    // 如果圖表已經存在，先銷毀它再創建新的 (避免重複繪製)
                    if (ctx.chart) {
                       ctx.chart.destroy();
                    }
                    const scamTrendChart = new Chart(ctx, {
                        type: 'line', // 趨勢圖通常用線圖
                        data: chartData, // 使用彙總後的數據
                        options: {
                            responsive: true, // 讓圖表響應式
                            maintainAspectRatio: false, // 允許獨立控制長寬比
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: '發生數'
                                    },
                                     ticks: { // 確保 y 軸刻度是整數
                                         precision: 0
                                     }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: '年份'
                                    }
                                }
                            },
                            plugins: {
                                tooltip: { // 顯示 tooltip 的發生數
                                    callbacks: {
                                        label: function(context) {
                                            return `${context.parsed.y} 件`;
                                        }
                                    }
                                },
                                title: {
                                    display: true,
                                    text: '歷年詐騙發生總數趨勢圖'
                                }
                            }
                        }
                    });
                    ctx.chart = scamTrendChart; // 將圖表實例存儲在 canvas 元素上
                    // 只有當圖表成功創建後才標記初始化完成 (雖然在這裡只調用一次，但這是個好習慣)
                    // chartInitialized = true; // chartInitialized 改在 initTaiwanMap() 之後設定


                    // 如果數據載入有錯誤，並且統計頁籤內容區域存在，顯示錯誤訊息
                    if (dataLoadError && statisticsTabPane) {
                         // 檢查是否已經有錯誤訊息，避免重複添加
                         if (!statisticsTabPane.querySelector('.data-load-error-message')) {
                             const errorMessage = document.createElement('p');
                             errorMessage.classList.add('data-load-error-message'); // 添加一個類別方便查找和避免重複
                             errorMessage.style.color = 'red';
                             errorMessage.textContent = '部分年度數據載入失敗，趨勢圖可能不完整。請檢查數據來源。';
                              // 檢查 statisticsTabPane 是否有內容，決定插入位置
                              const chartContainer = ctx.parentElement; // 找到 canvas 的父容器
                              if (chartContainer && chartContainer.parentElement === statisticsTabPane) {
                                   chartContainer.before(errorMessage); // 插入到圖表容器之前
                              } else if (statisticsTabPane.firstChild) {
                                   statisticsTabPane.insertBefore(errorMessage, statisticsTabPane.firstChild);
                              } else {
                                   statisticsTabPane.appendChild(errorMessage);
                              }
                         }
                    }

                } else {
                     console.error("找不到趨勢圖繪製區域 (ID為 'scamTrendChart')");
                     // 如果找不到 canvas 元素，但在統計頁籤內容區域，顯示錯誤訊息
                     if (statisticsTabPane && !statisticsTabPane.querySelector('.chart-missing-error')) {
                          const errorMessage = document.createElement('p');
                          errorMessage.classList.add('chart-missing-error');
                          errorMessage.style.color = 'red';
                          errorMessage.textContent = '找不到趨勢圖繪製區域。';
                          statisticsTabPane.appendChild(errorMessage);
                     }
                }
            })
            .catch(error => {
                console.error('Error processing trend chart data:', error);
                 if (statisticsTabPane && !statisticsTabPane.querySelector('.chart-processing-error')) {
                      const errorMessage = document.createElement('p');
                      errorMessage.classList.add('chart-processing-error');
                      errorMessage.style.color = 'red';
                      errorMessage.textContent = '處理歷年趨勢圖數據時發生錯誤。';
                      statisticsTabPane.appendChild(errorMessage);
                 } else if (!statisticsTabPane) {
                     console.error("找不到統計頁籤的內容區域 (ID為 'statistics')");
                 }
            });
    }

    // 台灣地圖與縣市詐騙數據相關功能
    // initTaiwanMap() 函式只在 shown.bs.tab 事件中由 chartInitialized 控制執行一次


    function initTaiwanMap() {
        // 確保地圖容器存在
        if (!taiwanMapContainer) {
            console.error("找不到地圖容器 (ID為 'taiwan-map-container')");
            return;
        }

        // 定義一個目標尺寸用於 SVG 的 viewBox 和 D3 的 fitSize
        // 這決定了地圖的長寬比例和 D3 內部計算的基準
        const svgTargetWidth = 400;
        const svgTargetHeight = 500;


        // 台灣地圖 TopoJSON 資料來源
        const taiwanMapUrl = 'https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.topo.json';

        // 模擬各縣市詐騙數據（實際應用中應從後端 API 獲取）
        // *** 保留使用者提供的 countyScamData，不修改 ***
        const countyScamData = {
             '台北縣': { '110': 4247, '111': 4369, '112': 7072, '113': 23082, '114': 5492 },
             '台北市': { '110': 3419, '111': 4044, '112': 4026, '113': 11065, '114': 2652 },
             '桃園縣': { '110': 1102, '111': 2031, '112': 1946, '113': 12888, '114': 3136 },
             '台中市': { '110': 1577, '111': 1530, '112': 2348, '113': 16168, '114': 3917 },
             '台中縣': { '110': 1577, '111': 1530, '112': 2348, '113': 16168, '114': 3917 },
             '台南市': { '110': 2801, '111': 3498, '112': 5464, '113': 11142, '114': 2145 },
             '台南縣': { '110': 2801, '111': 3498, '112': 5464, '113': 11142, '114': 2145 },
             '高雄市': { '110': 3039, '111': 2873, '112': 2533, '113': 13744, '114': 3346 },
             '高雄縣': { '110': 3039, '111': 2873, '112': 2533, '113': 13744, '114': 3346 },
             '宜蘭縣': { '110': 908, '111': 882, '112': 1142, '113': 2552, '114': 455 },
             '新竹縣': { '110': 533, '111': 947, '112': 1207, '113': 3469, '114': 772 },
             '苗栗縣': { '110': 363, '111': 907, '112': 1283, '113': 2880, '114': 568 },
             '彰化縣': { '110': 1470, '111': 1584, '112': 1893, '113': 5326, '114': 1182 },
             '南投縣': { '110': 836, '111': 956, '112': 1214, '113': 2198, '114': 395 },
             '雲林縣': { '110': 951, '111': 1497, '112': 1655, '113': 2812, '114': 601 },
             '嘉義縣': { '110': 599, '111': 583, '112': 755, '113': 2025, '114': 397 },
             '屏東縣': { '110': 454, '111': 506, '112': 618, '113': 3210, '114': 710 },
             '台東縣': { '110': 241, '111': 383, '112': 525, '113': 806, '114': 180 },
             '花蓮縣': { '110': 424, '111': 688, '112': 716, '113': 1761, '114': 321 },
             '澎湖縣': { '110': 157, '111': 208, '112': 472, '113': 497, '114': 53 },
             '基隆市': { '110': 343, '111': 535, '112': 802, '113': 1955, '114': 420 },       
             '新竹市': { '110': 399, '111': 371, '112': 577, '113': 3019, '114': 599 },        
             '嘉義市': { '110': 322, '111': 423, '112': 889, '113': 1493, '114': 260 },        
             '金門縣': { '110': 200, '111': 252, '112': 359, '113': 392, '114': 44 },
             '連江縣': { '110': 43, '111': 54, '112': 86, '113': 114, '114': 12 }
        };


        let countyDetailChart = null; // 在這個作用域內聲明，用於存儲縣市詳細圖表的實例

        // 創建 SVG 容器
        // 確保在創建新的 SVG 之前清空容器，避免重複繪製
        d3.select('#taiwan-map-container').select('svg').remove();
        const svg = d3.select('#taiwan-map-container')
            .append('svg')
            // *** 修正點：設定 SVG 的寬高為 100%，讓它填滿容器 ***
            .attr('width', '100%')
            .attr('height', '100%')
            // *** 修正點：設定 viewBox 使用目標尺寸，這定義了內部座標和長寬比例 ***
            .attr('viewBox', `0 0 ${svgTargetWidth} ${svgTargetHeight}`)
            .style('display', 'block'); // 確保 SVG 是塊級元素


        // 創建地圖投影
        // *** 修正點：初始化投影時不設定 scale 和 translate，稍後用 fitSize 設定 ***
        const projection = d3.geoMercator();

        // 創建地理路徑生成器
        const path = d3.geoPath().projection(projection);

        // 定義顏色比例尺，根據詐騙數量決定顏色深淺
        const getCountyScamTotal = county => {
            // *** 這裡會使用您保留的 countyScamData ***
            if (!countyScamData[county]) {
                 console.warn(`County "${county}" not found in countyScamData.`); // 添加警告
                 return 0;
            }
            return Object.values(countyScamData[county]).reduce((a, b) => a + b, 0);
        };

        // 計算縣市詐騙總數的最大值，用於顏色比例尺
        const allCountyTotals = Object.keys(countyScamData).map(getCountyScamTotal);
        const maxScamValue = allCountyTotals.length > 0 ? Math.max(...allCountyTotals) : 0;


        const colorScale = d3.scaleSequential()
            .domain([0, maxScamValue])
            .interpolator(d3.interpolateReds);

        // 載入台灣地圖數據
        d3.json(taiwanMapUrl).then(function(topology) {
            // *** 關鍵步驟：打印出 topology.objects 的內容來查看對象名稱 (這行您可以保留或移除，它已經完成了診斷任務) ***
            // console.log("TopoJSON 數據載入成功。請展開下方的物件，尋找包含地理數據的對象名稱，通常其下會有 'geometries' 屬性：", topology.objects);


            // 將 TopoJSON 轉換為 GeoJSON
            // *** 修正點：使用正確的對象名稱 'layer1' ***
            const geoJsonObjectName = 'layer1';


            // ***添加檢查：確保指定的對象存在於 topology.objects 中 (這個檢查可以幫助您將來診斷類似問題)***
            if (!topology.objects || !topology.objects[geoJsonObjectName]) {
                 console.error(`TopoJSON 對象中找不到名稱為 "${geoJsonObjectName}" 的數據。請檢查 TopoJSON 檔案結構或您在 geoJsonObjectName 中指定的名稱是否正確。目前找到的對象名稱有:`, Object.keys(topology.objects));
                 // 在地圖容器中顯示錯誤訊息給使用者
                 if (taiwanMapContainer) {
                     // 清空容器並顯示錯誤訊息
                     taiwanMapContainer.innerHTML = `<div class="alert alert-danger" role="alert">無法找到地圖數據 (${geoJsonObjectName})，請檢查主控台獲取詳情。</div>`;
                 }
                 // 同時清空/隱藏縣市詳細資訊區域和圖表
                  if (countyInfoDiv) countyInfoDiv.innerHTML = '<div class="alert alert-secondary">無法載入地圖數據，無法查看縣市詳細資訊。</div>';
                  if (countyDetailChart) { countyDetailChart.destroy(); countyDetailChart = null; } // 銷毀舊圖表
                  if (countyDetailChartCanvas) countyDetailChartCanvas.style.display = 'none'; // 隱藏 canvas

                 return; // 數據無效，停止繪製地圖後續內容
            }
            // ***檢查結束***


            const taiwanGeoJson = topojson.feature(topology, topology.objects[geoJsonObjectName]); // 現在應該會使用正確的對象名稱 'layer1'
            // console.log("轉換為 GeoJSON 成功，特徵數量 (未過濾):", taiwanGeoJson.features.length); // 查看轉換後的特徵數量
            // console.log("GeoJSON Features 結構:", taiwanGeoJson.features);


            // *** 關鍵修正：使用 fitSize 自動計算比例尺和位移 ***
            // 將地圖數據縮放到適合 svgTargetWidth x svgTargetHeight 的大小
            projection.fitSize([svgTargetWidth, svgTargetHeight], taiwanGeoJson);


            // 繪製縣市
            svg.selectAll('path')
                // *** 修正點：在這裡加入過濾，只繪製有 properties 和 COUNTYNAME 的特徵 ***
                .data(taiwanGeoJson.features.filter(d => d.properties && d.properties.COUNTYNAME)) // <-- 使用正確的 COUNTYNAME
                .enter()
                .append('path')
                .attr('d', path) // path generator 現在使用 fitSize 設定好的 projection
                .attr('fill', d => {
                    const countyName = d.properties.COUNTYNAME; // <-- 使用正確的 COUNTYNAME
                    const scamTotal = getCountyScamTotal(countyName); // *** 這裡會使用您保留的 countyScamData ***
                    return colorScale(scamTotal);
                })
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5)
                .attr('class', 'county') // 添加 class 以便選中
                .on('mouseover', function(event, d) {
                    d3.select(this)
                        .attr('stroke', '#333')
                        .attr('stroke-width', 1.5);

                    // 在地圖上顯示縣市名稱與詐騙數據總數
                    const countyName = d.properties.COUNTYNAME; // <-- 使用正確的 COUNTYNAME
                    const total = getCountyScamTotal(countyName); // *** 這裡會使用您保留的 countyScamData ***

                    // 移除任何現有的 tooltip
                    d3.selectAll('.tooltip').remove();

                    // 添加新的 tooltip
                    d3.select('#taiwan-map-container')
                        .append('div')
                        .attr('class', 'tooltip')
                        .style('position', 'absolute')
                        // 使用 event.pageX/pageY 配合容器偏移來定位 tooltip
                         .style('left', (event.pageX - (taiwanMapContainer.getBoundingClientRect().left || 0) + 15) + 'px')
                         .style('top', (event.pageY - (taiwanMapContainer.getBoundingClientRect().top || 0) - 30) + 'px')
                        .style('background-color', 'rgba(255, 255, 255, 0.9)')
                        .style('border', '1px solid #ddd')
                        .style('border-radius', '4px')
                        .style('padding', '5px 8px')
                        .style('font-size', '12px')
                        .style('pointer-events', 'none') // 讓 tooltip 不會影響滑鼠事件
                        .style('z-index', 100)
                        .html(`<strong>${countyName}</strong>: ${total}件`);
                })
                .on('mouseout', function() {
                    // 只有當滑鼠移出縣市路徑時才移除 tooltip
                     d3.select(this)
                         .attr('stroke', '#fff')
                         .attr('stroke-width', 0.5);

                    // 移除提示框
                    d3.selectAll('.tooltip').remove();
                })
                .on('click', function(event, d) {
                    const countyName = d.properties.COUNTYNAME; // <-- 使用正確的 COUNTYNAME
                    // 確保縣市名稱存在，避免傳遞 undefined
                     if (countyName) {
                         updateCountyInfo(countyName); // *** 這裡會使用您保留的 countyScamData ***
                         showCountyDetailChart(countyName); // *** 這裡會使用您保留的 countyScamData ***

                         // 高亮選中的縣市
                         d3.selectAll('.county').attr('stroke', '#fff').attr('stroke-width', 0.5); // 移除所有縣市的高亮
                         d3.select(this).attr('stroke', '#007bff').attr('stroke-width', 2); // 高亮當前選中的縣市
                     } else {
                         console.warn("點擊了沒有縣市名稱的區域:", d);
                         // 可以選擇顯示一個預設或錯誤訊息
                          if (countyInfoDiv) {
                              countyInfoDiv.innerHTML = '<div class="alert alert-secondary">請在地圖上選擇一個縣市以查看詳細資訊</div>';
                          }
                           // 銷毀詳細圖表 (如果存在)
                          if (countyDetailChart) {
                              countyDetailChart.destroy();
                              countyDetailChart = null;
                          }
                           // 隱藏 canvas 元素
                          if (countyDetailChartCanvas) {
                              countyDetailChartCanvas.style.display = 'none';
                          }

                     }
                });

            // 添加縣市名稱標籤
            svg.selectAll('text')
                 // 綁定數據前，過濾掉沒有 properties 或 COUNTYNAME 的特徵
                .data(taiwanGeoJson.features.filter(d => d.properties && d.properties.COUNTYNAME)) // <-- 使用正確的 COUNTYNAME
                .enter()
                .append('text')
                // 計算 x, y 座標使用 fitSize 設定好的 projection
                .attr('x', d => path.centroid(d)[0])
                .attr('y', d => path.centroid(d)[1])
                .attr('text-anchor', 'middle')
                .attr('font-size', '8px')
                .attr('pointer-events', 'none') // 讓文字不影響地圖的滑鼠事件
                // 在使用縣市名稱前，先進行防禦性檢查
                .attr('fill', d => {
                    // 檢查 properties 和 COUNTYNAME 是否存在
                    const countyName = (d.properties && d.properties.COUNTYNAME) ? d.properties.COUNTYNAME : null; // <-- 使用正確的 COUNTYNAME
                    // 如果沒有名字或對應的統計數據，給一個預設顏色 (例如灰色)
                    if (!countyName || !countyScamData[countyName]) { // *** 這裡會使用您保留的 countyScamData ***
                        return '#ccc'; // 灰色
                    }

                    const scamTotal = getCountyScamTotal(countyName); // *** 這裡會使用您保留的 countyScamData ***
                    // 根據詐騙總數決定文字顏色，如果背景顏色深，文字用白色
                     return colorScale(scamTotal) > (maxScamValue / 2) ? '#fff' : '#333'; // threshold can be adjusted
                })
                .text(d => {
                     // 由於數據已經過濾，d.properties.COUNTYNAME 確定存在了，可以直接使用
                    const name = d.properties.COUNTYNAME; // <-- 使用正確的 COUNTYNAME
                    return name.replace('臺', '台').replace('縣', '').replace('市', '');
                });

            // 添加圖例
            // 使用 svgTargetWidth/svgTargetHeight 進行圖例的定位
            const legendWidth = 180;
            const legendHeight = 15;
            const legend = svg.append('g')
                .attr('transform', `translate(${svgTargetWidth - legendWidth - 250}, ${svgTargetHeight - 40})`); // 使用目標尺寸定位圖例


            // 創建漸變色標
            // 移除舊的 defs 和 gradient 以防重複添加
             svg.select('defs').remove();
            const defs = svg.append('defs');
            const linearGradient = defs.append('linearGradient')
                .attr('id', 'scam-gradient')
                .attr('x1', '0%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '0%');

            linearGradient.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', colorScale(0));

            linearGradient.append('stop')
                .attr('offset', '100%')
                .attr('stop-color', colorScale(maxScamValue));

            // 添加漸變色矩形
            legend.append('rect')
                .attr('width', legendWidth)
                .attr('height', legendHeight)
                .style('fill', 'url(#scam-gradient)');

            // 添加圖例文字
            legend.append('text')
                .attr('x', 0)
                .attr('y', -5)
                .attr('font-size', '10px')
                .text('詐騙案件數量');

            legend.append('text')
                .attr('x', 0)
                .attr('y', legendHeight + 15)
                .attr('font-size', '9px')
                .text('少');

            legend.append('text')
                .attr('x', legendWidth)
                .attr('y', legendHeight + 15)
                .attr('text-anchor', 'end')
                .attr('font-size', '9px')
                .text('多');

        }).catch(error => {
            console.error('載入台灣地圖數據或處理時發生錯誤:', error);
             // 確保 taiwanMapContainer 存在才修改其內容
             if (taiwanMapContainer) {
                 // 清空容器並顯示錯誤訊息
                 taiwanMapContainer.innerHTML = `<div class="alert alert-danger" role="alert">載入台灣地圖數據時發生錯誤：${error.message}</div>`;
             }
             // 如果地圖載入失敗，縣市詳細資訊區域也顯示相應訊息
             if (countyInfoDiv) countyInfoDiv.innerHTML = '<div class="alert alert-secondary">地圖載入失敗，無法查看縣市詳細資訊。</div>';
             // 銷毀詳細圖表 (如果存在)
             if (countyDetailChart) { countyDetailChart.destroy(); countyDetailChart = null; }
             // 隱藏 canvas 元素
             if (countyDetailChartCanvas) countyDetailChartCanvas.style.display = 'none';

        });

        // 更新縣市詳細資訊
        function updateCountyInfo(countyName) {
            // 確保 countyInfoDiv 存在
            if (!countyInfoDiv) return;

            // *** 這裡會使用您保留的 countyScamData ***
            if (!countyScamData[countyName]) {
                countyInfoDiv.innerHTML = `<div class="alert alert-secondary" role="alert">找不到 ${countyName} 的詐騙資料。</div>`;
                return;
            }

            const data = countyScamData[countyName];
            const total = Object.values(data).reduce((a, b) => a + b, 0);
            const years = Object.keys(data).sort(); // 獲取年份並排序
             const latestYear = years.length > 0 ? years[years.length - 1] : 'N/A'; // 最新年份
             const prevYear = years.length > 1 ? years[years.length - 2] : 'N/A'; // 前一年份

            const latestData = data[latestYear] || 0;
            const prevData = data[prevYear] || 0;

             let changeRateText = '無前一年數據';
             let changeClass = '';
             let changeIcon = '';

             if (prevData > 0) {
                  const changeRate = ((latestData - prevData) / prevData * 100);
                  changeRateText = `${Math.abs(changeRate).toFixed(1)}%`;
                  if (changeRate > 0) {
                      changeClass = 'text-danger'; // 增長用紅色
                      changeIcon = '↑';
                  } else if (changeRate < 0) {
                       changeClass = 'text-success'; // 下降用綠色
                       changeIcon = '↓';
                  }
             } else if (latestData > 0 && prevYear !== 'N/A') {
             // 如果去年是0，今年有數據
             changeRateText = '無限大';
             changeClass = 'text-danger';
             changeIcon = '↑';
         } else if (latestData === 0 && prevData === 0) {
              // 如果去年和今年都是0
              changeRateText = '0%';
         }


        countyInfoDiv.innerHTML = `
             <h4>${countyName}</h4>
             <p><strong>總計 (歷年):</strong> ${total} 件</p>
             <p><strong>${latestYear} 年數據:</strong> ${latestData} 件</p>
             <p><strong>年增減 (${prevYear}-${latestYear}):</strong> <span class="${changeClass}">${changeRateText} ${changeIcon}</span></p>
             <p class="small text-muted">點擊縣市查看歷年趨勢圖</p>
             `;

        // 如果你保留年度按鈕並想讓它們做其他事情，可以在這裡添加監聽器
        // document.querySelectorAll('.year-btn').forEach(btn => { ... });
    }

    // 顯示縣市詳細折線圖
    function showCountyDetailChart(countyName) {
        // 確保 countyDetailChartCanvas 存在
        if (!countyDetailChartCanvas) return;

        // *** 這裡會使用您保留的 countyScamData ***
        if (!countyScamData[countyName]) {
             countyDetailChartCanvas.style.display = 'none'; // 隱藏 canvas
             // 在縣市資訊區域顯示錯誤訊息 (updateCountyInfo 已經處理)
             // updateCountyInfo(countyName);
             return;
        }

         countyDetailChartCanvas.style.display = 'block'; // 顯示 canvas

        const years = Object.keys(countyScamData[countyName]).sort(); // 獲取並排序年份
        const data = years.map(year => countyScamData[countyName][year] || 0); // 獲取對應數據

        // 銷毀先前的圖表實例（如果存在）
        if (countyDetailChart) {
            countyDetailChart.destroy();
        }

        // 建立新的折線圖
        countyDetailChart = new Chart(countyDetailChartCanvas, {
            type: 'line',
            data: {
                labels: years.map(year => `${year} 年`), // X 軸標籤
                datasets: [{
                    label: `${countyName} 詐騙案件數`,
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '案件數'
                        },
                        ticks: { // 確保 y 軸刻度是整數
                            precision: 0
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '年度'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} 件`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: `${countyName} 歷年詐騙案件趨勢`
                    }
                }
            }
        });
         // 將圖表實例存儲在 canvas 元素上 (以便銷毀)
         countyDetailChartCanvas.chart = countyDetailChart;
    }
} // end initTaiwanMap

});
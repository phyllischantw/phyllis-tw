/* UTM 轉傳：把來訪網址上的 UTM 帶到 school.phyllis.tw 的連結。
   電子書 PDF 內的連結會先到官網頁面，再由訪客點按鈕前往實戰系統；
   實戰系統是在首次落地時寫入歸因 cookie，所以官網這側必須把參數接力過去。

   規則：
   1. 來訪網址沒有 utm_source 時完全不動作，一般訪客的連結與 web 歸因維持原樣。
   2. 來訪 UTM 覆寫目標連結原有的同名 UTM（例如 medium=pdf 蓋掉 medium=web）。
   3. utm_content 例外：它在這個站代表 CTA 位置而非來源標籤，目標連結已標明位置時保留原值。
   4. 只改寫 UTM 欄位，路徑、其他查詢參數與 #hash 都保留。 */
(function () {
  'use strict';

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var TARGET_HOST = 'school.phyllis.tw';

  var incoming;
  try {
    incoming = new URL(window.location.href).searchParams;
  } catch (e) {
    return;
  }

  // 沒有 utm_source 就視為一般訪客，一個連結都不碰。
  if (!incoming.get('utm_source')) return;

  var carry = [];
  UTM_KEYS.forEach(function (key) {
    var value = incoming.get(key);
    if (value) carry.push([key, value]);
  });
  if (!carry.length) return;

  var links = document.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var url;
    try {
      url = new URL(link.getAttribute('href'), window.location.href);
    } catch (e) {
      continue;
    }
    if (url.hostname !== TARGET_HOST) continue;

    // searchParams.set 會就地覆寫同名參數，並保留 pathname、其他參數與 hash。
    for (var j = 0; j < carry.length; j++) {
      var k = carry[j][0];
      // 目標連結已寫明 CTA 位置（例如 ebook-system-ch4、ebook-system-end）時不覆寫，
      // 否則 ebook.html 上第 4 章與書末兩顆按鈕會被來訪的 ebook-web 洗成同一個值。
      if (k === 'utm_content' && url.searchParams.get('utm_content')) continue;
      url.searchParams.set(k, carry[j][1]);
    }
    link.href = url.toString();
  }
})();

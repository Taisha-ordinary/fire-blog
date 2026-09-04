/*
 * 記事ページ末尾の「あわせて読みたい」＆「プロフィールCTA」を描画するスクリプト。
 * index.html の記事一覧（.post-item）を実行時に取得して関連記事を計算するため、
 * 新しい記事を index.html に追加するだけで、このスクリプト側のメンテナンスは不要。
 * 設置対象：<div id="related-posts"></div> と <div id="profile-cta"></div> を
 * 持つ記事ページ（</article> と <nav class="article-nav"> の間を想定）。
 */
(function () {
  var relatedContainer = document.getElementById('related-posts');
  var ctaContainer = document.getElementById('profile-cta');
  // 2026-09-04：以前はここで «両方の描画先が無ければ即return» していたが、
  // このスクリプトはCTAクリックの計測（sim_cta_click / affiliate_click）も担っている。
  // 描画先を持たない旧フォーマットの記事（autumn-in-kanazawa.html）でCTA計測ごと
  // 落ちていたため、早期returnを廃止する。描画側は各関数が個別に自衛している。

  function currentFile() {
    var path = window.location.pathname.split('/').pop();
    return path && path.length ? path : 'index.html';
  }

  function getCurrentTags() {
    var tags = [];
    document.querySelectorAll('.article-tags .tag-pill').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var m = href.match(/tag=([^&]+)/);
      if (m) tags.push(decodeURIComponent(m[1]));
    });
    return tags;
  }

  function getCurrentCategory() {
    var metaEl = document.querySelector('.article-header .post-meta');
    if (!metaEl) return null;
    var parts = (metaEl.textContent || '').split('—');
    return parts.length > 1 ? parts[1].trim() : null;
  }

  function track(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    dataLayer.push(Object.assign({ event: eventName }, payload));
  }

  function renderRelated(posts) {
    if (!relatedContainer || !posts.length) return;
    var title = document.createElement('p');
    title.className = 'related-posts-title';
    title.textContent = 'あわせて読みたい';

    var grid = document.createElement('div');
    grid.className = 'related-posts-grid';

    posts.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'related-card';
      a.href = p.href;
      var catSpan = document.createElement('span');
      catSpan.className = 'related-card-cat';
      catSpan.textContent = p.category || '';
      var titleSpan = document.createElement('span');
      titleSpan.className = 'related-card-title';
      titleSpan.textContent = p.title;
      a.appendChild(catSpan);
      a.appendChild(titleSpan);
      a.addEventListener('click', function () {
        track('related_post_click', { click_location: 'article_related', link_url: p.href });
      });
      grid.appendChild(a);
    });

    relatedContainer.appendChild(title);
    relatedContainer.appendChild(grid);
  }

  function renderProfileCta() {
    if (!ctaContainer) return;
    ctaContainer.innerHTML =
      '<img class="profile-cta-avatar" src="avatar.png" alt="プロフィールアイコン">' +
      '<div class="profile-cta-body">' +
        '<p class="profile-cta-name">この記事の続きは、Xで</p>' +
        '<p class="profile-cta-text">今回のテーマに関する日々の気づきや細かい記録は、Xで先に発信しています。</p>' +
      '</div>' +
      '<div class="profile-cta-actions">' +
        '<a class="profile-cta-btn is-secondary" href="profile.html" data-cta="profile">プロフィールを見る</a>' +
        '<a class="profile-cta-btn is-primary x-sidebar-handle" href="https://x.com/Taisha_ordinary" target="_blank" rel="noopener" data-cta="x_profile">Xで続きを見る</a>' +
      '</div>';

    Array.prototype.forEach.call(ctaContainer.querySelectorAll('[data-cta]'), function (a) {
      a.addEventListener('click', function () {
        track('profile_cta_click', { click_location: 'article_profile_cta', cta_target: a.dataset.cta });
      });
    });
  }

  function parseIndexPosts(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var posts = [];
    doc.querySelectorAll('.post-item').forEach(function (el) {
      var href = el.getAttribute('href');
      var titleEl = el.querySelector('.post-item-title');
      var metaEl = el.querySelector('.post-meta');
      if (!href || !titleEl) return;
      var metaParts = (metaEl ? metaEl.textContent : '').split('—');
      posts.push({
        href: href,
        title: titleEl.textContent.trim(),
        category: metaParts.length > 1 ? metaParts[1].trim() : '',
        tags: (el.dataset.tags || '').split(',').filter(Boolean)
      });
    });
    return posts;
  }

  function pickRelated(allPosts) {
    var current = currentFile();
    var category = getCurrentCategory();
    var tags = getCurrentTags();

    var candidates = allPosts.filter(function (p) { return p.href !== current; });
    candidates.forEach(function (p) {
      var overlap = p.tags.filter(function (t) { return tags.indexOf(t) !== -1; }).length;
      var sameCategory = category && p.category === category ? 1 : 0;
      p._score = overlap * 2 + sameCategory;
    });
    candidates.sort(function (a, b) { return b._score - a._score; });
    return candidates.slice(0, 3);
  }

  renderProfileCta();

  // 2026-09-04：記事末尾に2枚目のツールCTAを新設したため、click_location を
  // data-cta-location から読む。属性が無い場合は従来どおり article_top（記事冒頭CTA）。
  // これが無いと2枚が同じ click_location で送られ、どちらが効いたか判定できない。
  Array.prototype.forEach.call(document.querySelectorAll('.sim-article-cta:not(.affiliate-article-cta)'), function (a) {
    a.addEventListener('click', function () {
      track('sim_cta_click', { click_location: a.dataset.ctaLocation || 'article_top' });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.affiliate-article-cta'), function (a) {
    a.addEventListener('click', function () {
      track('affiliate_click', {
        asp_name: a.dataset.aspName || '',
        program_category: a.dataset.programCategory || '',
        article_id: currentFile(),
        cta_id: a.dataset.ctaId || ''
      });
    });
  });

  if (relatedContainer) {
    fetch('index.html')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var posts = parseIndexPosts(html);
        renderRelated(pickRelated(posts));
      })
      .catch(function () {
        // 記事一覧の取得に失敗した場合は関連記事の表示を諦める（プロフィールCTAは表示済み）
      });
  }
})();

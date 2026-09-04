/*
 * 記事ページ末尾の「おすすめ記事／あわせて読みたい」＆「プロフィールCTA」を描画するスクリプト。
 *
 * 関連記事の決め方（2026-09-04 改訂）：
 *   1. recommend.json に該当記事の個別指定があればそれを使う
 *   2. 無ければ recommend.json のカテゴリ既定を使う
 *   3. どちらも無ければ従来どおり index.html の記事一覧から自動算出する
 * 手動セレクトは「あわせて読みたい」と同じ枠に描画するため、記事末尾のブロック数は増えない
 * （記事末尾は既に ①ツールCTA ②関連記事 ③プロフィールCTA の3枠あり、過積載を避けるため）。
 *
 * 設置対象：<div id="related-posts"></div> と <div id="profile-cta"></div> を
 * 持つ記事ページ（</article> と <nav class="article-nav"> の間を想定）。
 */
(function () {
  var relatedContainer = document.getElementById('related-posts');
  var ctaContainer = document.getElementById('profile-cta');
  // 2026-09-04：以前はここで «両方の描画先が無ければ即return» していたが、
  // このスクリプトはCTAクリックの計測（sim_cta_click / affiliate_click）も担っている。
  // 描画先を持たない記事でCTA計測ごと落ちていたため、早期returnを廃止する。
  // 描画側は各関数が個別に自衛している。

  /* ------------------------------------------------------------------
   * 世帯資産スナップショット（記事末尾プロフィール再掲で使用・2026-09-04 追加）
   *
   * 正本は fire-blog-real-facts.md および Obsidian Vault 10_Personal/CURRENT_STATE.md。
   * サイト内でこの数値を持つのはここ1箇所だけなので、更新時はこの定数だけを書き換える
   * （記事HTMLの一括編集は不要）。粒度は既存記事に合わせたレンジ表記を維持すること。
   * ------------------------------------------------------------------ */
  var ASSET_SNAPSHOT = {
    household: '6,100万円台',
    target: '7,000万円',
    progressPct: 87,        // 6,100 / 7,000 の概算。レンジ下限を基準にした控えめな値
    asOf: '2026年9月'
  };

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

  /* ---------------------------------------------------- 関連記事（自動算出） */
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

  /* ------------------------------------------- おすすめ記事（手動セレクト） */
  function pickRecommendEntry(cfg) {
    if (!cfg) return null;
    var file = currentFile();
    if (cfg.articles && cfg.articles[file]) return cfg.articles[file];
    var cat = getCurrentCategory();
    if (cat && cfg.categoryDefaults && cfg.categoryDefaults[cat]) {
      return cfg.categoryDefaults[cat];
    }
    return null;
  }

  function renderRecommend(entry) {
    if (!relatedContainer || !entry) return false;
    var file = currentFile();
    // 自分自身は候補から外す（カテゴリ既定には自記事が含まれ得るため）
    var items = (entry.items || []).filter(function (it) {
      return it && it.href && it.href !== file;
    }).slice(0, 3);
    if (!items.length) return false;

    var title = document.createElement('p');
    title.className = 'related-posts-title';
    title.textContent = entry.title || 'おすすめの記事';

    var grid = document.createElement('div');
    grid.className = 'related-posts-grid';

    items.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'related-card';
      a.href = p.href;
      var titleSpan = document.createElement('span');
      titleSpan.className = 'related-card-title';
      titleSpan.textContent = p.title;
      a.appendChild(titleSpan);
      a.addEventListener('click', function () {
        track('recommend_click', {
          click_location: 'article_recommend',
          link_url: p.href,
          article_id: file
        });
      });
      grid.appendChild(a);
    });

    relatedContainer.appendChild(title);
    relatedContainer.appendChild(grid);

    // 収益導線は1ブロックにつき最大1件。
    // 記事に既にASP広告CTAがある場合は、CTA過積載を避けるため出さない。
    var hasAffiliate = !!document.querySelector('.affiliate-article-cta');
    if (entry.promo && entry.promo.href && !hasAffiliate) {
      var promo = document.createElement('a');
      promo.className = 'recommend-promo';
      promo.href = entry.promo.href;
      promo.setAttribute('data-cta-location', 'article_recommend_promo');
      promo.innerHTML =
        '<span class="recommend-promo-label">' + (entry.promo.label || '関連プロダクト') + '</span>' +
        '<span class="recommend-promo-title"></span>' +
        '<span class="recommend-promo-note"></span>' +
        '<span class="recommend-promo-btn">詳しく見る ›</span>';
      promo.querySelector('.recommend-promo-title').textContent = entry.promo.title || '';
      promo.querySelector('.recommend-promo-note').textContent = entry.promo.note || '';
      promo.addEventListener('click', function () {
        track('recommend_promo_click', {
          click_location: 'article_recommend_promo',
          link_url: entry.promo.href,
          article_id: file
        });
      });
      relatedContainer.appendChild(promo);
    }
    return true;
  }

  /* ---------------------------------------------- プロフィールCTA（再掲） */
  function renderProfileCta() {
    if (!ctaContainer) return;
    var s = ASSET_SNAPSHOT;
    var pct = Math.max(0, Math.min(100, s.progressPct));

    ctaContainer.innerHTML =
      '<img class="profile-cta-avatar" src="avatar.png" alt="プロフィールアイコン">' +
      '<div class="profile-cta-body">' +
        '<p class="profile-cta-name">Taisha_ordinary｜金沢移住3年目</p>' +
        '<p class="profile-cta-text">東京から金沢へ移住し、フルリモートで働きながらFIREを目指しています。資産・生活費・移住コストは、推計ではなく実額で公開しています。</p>' +
        '<dl class="profile-cta-stats">' +
          '<div class="profile-cta-stat">' +
            '<dt>世帯資産</dt><dd>' + s.household + '</dd>' +
          '</div>' +
          '<div class="profile-cta-stat">' +
            '<dt>FIRE目標</dt><dd>' + s.target + '</dd>' +
          '</div>' +
        '</dl>' +
        '<div class="profile-cta-progress" role="img" ' +
          'aria-label="FIRE目標' + s.target + 'に対する到達度 約' + pct + 'パーセント">' +
          '<span class="profile-cta-progress-bar" style="width:' + pct + '%"></span>' +
        '</div>' +
        '<p class="profile-cta-note">' + s.asOf + '時点／FIRE目標に対して約' + pct + '%</p>' +
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

  /* ------------------------------------------------------------ 自動算出 */
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

  function renderAutoRelated() {
    return fetch('index.html')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        renderRelated(pickRelated(parseIndexPosts(html)));
      })
      .catch(function () {
        // 記事一覧の取得に失敗した場合は関連記事の表示を諦める（プロフィールCTAは表示済み）
      });
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
    fetch('recommend.json')
      .then(function (res) {
        if (!res.ok) throw new Error('recommend.json not available');
        return res.json();
      })
      .then(function (cfg) {
        if (!renderRecommend(pickRecommendEntry(cfg))) return renderAutoRelated();
      })
      .catch(function () {
        // 手動セレクトが読めない場合は従来の自動算出へフォールバックする
        return renderAutoRelated();
      });
  }
})();

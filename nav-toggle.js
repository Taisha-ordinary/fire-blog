/*
 * グローバルナビ（.global-nav）のハンバーガーメニュー開閉制御。
 * 640px以下のモバイル幅でのみ .nav-toggle ボタンが表示され、
 * .global-nav-inner の開閉をトグルする。PC幅ではボタンはCSSで非表示のため
 * このスクリプトは実質何もしない（リサイズ時のリセット処理のみ働く）。
 * 全ページ共通で読み込む想定（index.html含む全.htmlの<nav class="global-nav">直後）。
 */
(function () {
  var nav = document.querySelector('.global-nav');
  var toggle = document.getElementById('navToggle');
  if (!nav || !toggle) return;

  var OPEN_LABEL = 'メニューを開く';
  var CLOSE_LABEL = 'メニューを閉じる';

  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', OPEN_LABEL);
  }

  function openNav() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', CLOSE_LABEL);
  }

  toggle.addEventListener('click', function () {
    if (nav.classList.contains('is-open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Escキーで閉じる（開いている時のみ）。ボタンにフォーカスを戻す。
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav();
      toggle.focus();
    }
  });

  // メニュー内のリンクをクリックしたら閉じる（モバイルでの遷移をスムーズに）
  var links = nav.querySelectorAll('.global-nav-inner a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', closeNav);
  }

  // デスクトップ幅に戻した時に開閉状態をリセット
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > 640) closeNav();
    }, 150);
  });

  // Xプロフィールへの遷移計測（.x-sidebar-handle を持つリンク全て、全ページ共通）。
  // 2026-09-02判明：GA4のclick_x_profileイベントはこれまでサイト側に一度も実装されておらず
  // 常時0件だった（profile.htmlの1ボタンのみprofile_cta_clickという別名で計測されていた）。
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.x-sidebar-handle') : null;
    if (!el) return;
    window.dataLayer = window.dataLayer || [];
    dataLayer.push({
      event: 'click_x_profile',
      click_location: el.id || 'x_sidebar_handle',
      page_path: location.pathname
    });
  });

  // 商品ページ（products.html）への遷移計測（.product-cta-link を持つリンク全て、全ページ共通）。
  // 「導線の各段階を分離して計測する（BOOTH遷移ゼロは売上ゼロより重大なシグナル）」という
  // 2026-07-24の出品方針に対応する、ファネル最初の1段目の計測。
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.product-cta-link') : null;
    if (!el) return;
    window.dataLayer = window.dataLayer || [];
    dataLayer.push({
      event: 'click_product_cta',
      click_location: el.id || 'product_cta_link',
      page_path: location.pathname
    });
  });
})();

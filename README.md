# FIRE Notes

資産形成・FIRE・キャリア形成の3本柱について、数字と仮説ベースで考えたことを書いていく個人ブログサイトです。

## 構成

| ファイル | 役割 |
| --- | --- |
| `index.html` | トップページ（ヘッダー・記事一覧） |
| `article-1.html` | 記事ページ第1弾（FIREから逆算するキャリア設計） |
| `style.css` | 全ページ共通スタイル |
| `banner.svg` | ヘッダー横長バナー（仮画像・金箔モチーフ） |
| `avatar.svg` | ヘッダー丸アイコン（仮画像・金箔モチーフ） |

## デザイン方針

- 白基調で清潔感のあるレイアウト
- 金箔モチーフ（ゴールドのアクセントカラー：`--gold` `--gold-bright`）
- 見出しは明朝体（Shippori Mincho）、本文はゴシック体（Zen Kaku Gothic New）

## 画像の差し替え方

`banner.svg` / `avatar.svg` は仮画像です。実際の写真に差し替える場合：

1. 用意した画像ファイル（例：`banner.jpg` / `avatar.jpg`）をこのフォルダに置く
2. `index.html`・`article-1.html` 内の下記箇所の `src` を書き換える

```html
<img src="banner.svg" alt="">
<img class="avatar" src="avatar.svg" alt="プロフィールアイコン">
```

## Xリンクの差し替え方

`index.html` 内の以下の `YOUR_HANDLE` / `@YOUR_HANDLE` を実アカウント名に置き換えてください。

```html
<a href="https://x.com/YOUR_HANDLE" target="_blank" rel="noopener">
  ...
  @YOUR_HANDLE
</a>
```

## 記事の追加方法

1. `article-1.html` をコピーして `article-2.html` などにリネーム
2. 見出し・本文を書き換え
3. `index.html` の記事一覧（`#posts` 内）に新しい `<a class="post-item">` を追加

## 計測（GA4/GTM）

各HTMLの `<head>` 内にGA4埋め込み用のコメントアウトブロックがあります。計測IDが決まり次第、コメントを外して `G-XXXXXXX` を実IDに差し替えてください。

## 公開（GitHub Pages）

このリポジトリをGitHubにpushし、リポジトリ設定の「Pages」で公開ブランチを指定すると公開できます。

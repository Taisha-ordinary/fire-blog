# FIRE Notes（金沢で叶える地方移住FIREライフ）

金沢での地方移住とFIREの実体験をもとに、移住・お金とFIRE・仕事やブログ運営・金沢での暮らしについて発信する個人ブログサイトです。

公開URL：https://taisha-ordinary.github.io/fire-blog/

## 構成

| ファイル | 役割 |
| --- | --- |
| `index.html` | トップページ（ヘッダー・記事一覧） |
| `article-1.html` 〜 `article-10.html` | 記事ページ（各1000字以上） |
| `style.css` | 全ページ共通スタイル |
| `banner.png` | ヘッダー横長バナー画像 |
| `avatar.png` | ヘッダー丸アイコン画像 |

## カテゴリ（4本柱）

- 移住
- お金・FIRE
- 仕事・ブログ運営
- 金沢の暮らし

## デザイン方針

- 白基調で清潔感のあるレイアウト
- 金箔モチーフ（ゴールドのアクセントカラー：`--gold` `--gold-bright`）
- 見出しは明朝体（Shippori Mincho）、本文はゴシック体（Zen Kaku Gothic New）
- バナーは `aspect-ratio` で比率固定（画面幅に関わらずクロップされない設計）

## 画像の差し替え方

`banner.png` / `avatar.png` を差し替える場合：

1. 新しい画像ファイルを用意し、同名（`banner.png` / `avatar.png`）で上書き、または別名で配置してファイル名を変更
2. 別名にした場合は `index.html`・`article-N.html` 内の `src` を書き換える

```html
<img src="banner.png" alt="">
<img class="avatar" src="avatar.png" alt="プロフィールアイコン">
```

## Xリンク

`index.html` 内のXリンクは `@Taisha_ordinary` に設定済みです。変更する場合は以下を書き換えてください。

```html
<a href="https://x.com/Taisha_ordinary" target="_blank" rel="noopener">
  ...
  @Taisha_ordinary
</a>
```

## 記事の追加方法

1. 直近の `article-N.html` をコピーして `article-(N+1).html` にリネーム
2. `<title>`・meta description・`post-meta`（日付／カテゴリ）・`article-title`・本文を書き換え（本文は1000字以上を目安）
3. `index.html` の記事一覧（`#posts` 内）の先頭に新しい `<a class="post-item">` を追加（新しい記事が最上部）

## 自動投稿ルーティン

毎週水曜・土曜に1記事ずつ、合計週2本を自動投稿するスケジュールタスクを設定済みです。カテゴリ（移住／お金・FIRE／仕事・ブログ運営／金沢の暮らし）をバランスよく巡回して執筆します。詳細はプロジェクトのスケジュールタスク設定を参照してください。

## 計測（GA4/GTM）

各HTMLの `<head>` 内にGA4埋め込み用のコメントアウトブロックがあります。計測IDが決まり次第、コメントを外して `G-XXXXXXX` を実IDに差し替えてください。

## 公開（GitHub Pages）

`main` ブランチのルートを公開元に設定済みです。pushすると数分で https://taisha-ordinary.github.io/fire-blog/ に反映されます。

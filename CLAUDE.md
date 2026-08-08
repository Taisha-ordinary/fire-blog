# プロジェクト設定

## 目的
金沢での地方移住とFIREの実体験をもとに発信する個人ブログサイト「金沢で叶える地方移住FIREライフ」（情報発信の練習）。

## 扱わないテーマ
マーケティング／事業企画の話は扱わない（別プロジェクトの領域）。

## カテゴリ（4本柱）
- 移住
- お金・FIRE
- 仕事・ブログ運営
- 金沢の暮らし

## デザイン方針
- 白基調で清潔感のあるレイアウト
- 金箔モチーフ（ゴールドのアクセントカラー）
- 見出しは明朝体（Shippori Mincho）、本文はゴシック体（Zen Kaku Gothic New）
- バナーは `aspect-ratio` で比率固定し、画面幅に関わらずクロップしない

## 構成
- `index.html`：トップページ
- `article-N.html`：記事ページ（本文1000字以上が目安）
- `style.css`：共通スタイル
- `banner.png` / `avatar.png`：ヘッダー画像

## 運用ルール
- 毎週水曜・土曜に1記事ずつ、週2本を自動投稿（カテゴリを4本柱でバランスよく巡回）
- 新しい記事は `index.html` の記事一覧の最上部に追加（新しい順で表示）
- 公開サイト本体（記事・デザイン等）の git commit・pushは、このリポジトリ（fire-blog）内で完結させる（Taisha-ordinaryアカウントで公開済み）。非公開`sidework-ai-handoffs`への例外は[Codexとの連携](#codexとの連携)を参照

詳細は [README.md](README.md) を参照。

## Codexとの連携

- 作業前に [AGENTS.md](AGENTS.md) と [docs/ai-collaboration.md](docs/ai-collaboration.md) を読む。
- 役割分担（Claude Code＝継続実行・実装・修正・運用／Codex＝独立QA・技術監査・PRレビュー／ChatGPT＝横断戦略・要件定義・最終判断支援／ユーザー＝最終承認・PRマージ）は [AGENTS.md](AGENTS.md) の Roles を正とする。
- `main` へ直接コミットせず、作業ブランチとドラフトPRを使う。
- PRでは `.github/pull_request_template.md` に従い、handoff ID、目的、検証結果、未決事項、次の担当を明記する。
- Codexのレビューは同じPR上で受け、修正も同じブランチへ追加する。
- 売上、KPI、未公開戦略、個人情報、認証情報、AI間の非公開議論は、この公開リポジトリへ保存しない。
- 非公開の運営状態は `sidework-orchestrator` を正本とし、このリポジトリへ複製しない。
- 「このリポジトリ内で完結」ルールは公開サイト自体の変更が対象。非公開`sidework-ai-handoffs`へのcommit・pushは、fire-blogの実装・公開・マージとは独立した連携台帳として明示的な例外とする。ただし記録してよいのはhandoff ID・PR URL・commit SHA・担当AI・ステータス・次アクションのみで、会話全文・ローカルパス・runs内容・個人情報・認証情報・KPI・売上・未公開戦略は記録しない。

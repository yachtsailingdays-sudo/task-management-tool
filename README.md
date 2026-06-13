# タスク管理ツール × Outlook

サイドバーに入力したタスクを一覧に貯めておき、**ドラッグ&ドロップでカレンダーに置くと Outlook の予定表に「そのタスクをやる時間」が登録される**タスク管理アプリです。

- 左サイドバー: タスクの入力と一覧（バックログ）
- 右メイン: 週表示カレンダー（Outlook 連携）
- タスクをカレンダーの時間枠へドラッグ → その時刻に所要時間ぶんの予定を作成

## 特長

- **所要時間はデフォルト 30 分**。プリセット（15/30/45/60/90/120 分）またはカスタム入力で自由に変更可能。タスク追加後もカードの時計アイコンから変更できます。
- **ドラッグ&ドロップでスケジューリング**。ドロップした 30 分刻みの枠が予定の開始時刻になり、タスクの所要時間ぶんの長さで予定が作られます。
- **Outlook（Microsoft Graph）連携**。サインインした自分の予定表に直接イベントを作成。既存の予定もカレンダー上に表示されるので、空き時間を見ながら配置できます。
- **予定済み管理**。カレンダーに置いたタスクは「予定済み」になり、予定を削除するとバックログへ戻って再配置できます。
- **デモモード内蔵**。Azure の設定なしでも、モックの Outlook カレンダー（localStorage）で全機能をすぐ試せます。

## 連携モード（重要）

このアプリは 2 つのモードを自動で切り替えます。

| モード | 条件 | 動作 |
| --- | --- | --- |
| **デモ（モック）** | `VITE_MS_CLIENT_ID` 未設定（既定） | 予定はブラウザの localStorage に保存。サインインも擬似的。設定不要で全機能を体験できます。 |
| **Outlook 連携** | `VITE_MS_CLIENT_ID` 設定時 | MSAL でサインインし、Microsoft Graph 経由で実際の Outlook 予定表に読み書きします。 |

> ご質問の「必要な ID があるか分からない」点について: **ID がなくてもデモモードで今すぐ全機能を使えます。** 実際の Outlook 予定表に書き込みたくなったら、下記の手順でクライアント ID を 1 つ取得して設定するだけで本連携に切り替わります。

## セットアップ

```bash
npm install
npm run dev      # http://localhost:5173
```

ビルド:

```bash
npm run build
npm run preview
```

## 本物の Outlook 連携を有効にする

1. [Microsoft Entra 管理センター](https://entra.microsoft.com) →「アプリの登録」→「新規登録」。
2. **リダイレクト URI** を **SPA（シングルページ アプリケーション）** として登録（開発時は `http://localhost:5173`）。
3. 「API のアクセス許可」で Microsoft Graph の**委任**アクセス許可 `User.Read` と `Calendars.ReadWrite` を追加。
4. 「概要」の **アプリケーション (クライアント) ID** をコピー。
5. `.env.example` を `.env.local` にコピーし、`VITE_MS_CLIENT_ID` に貼り付け（必要に応じて `VITE_MS_TENANT_ID`）。
6. `npm run dev` を再起動。トップバーが「Outlook 連携」になり、「Outlook にサインイン」からログインできます。

## 使い方

1. 左上のフォームにタスク名を入力し、所要時間を選んで「タスクを追加」。
2. 右上の「デモを開始」（または「Outlook にサインイン」）で接続。
3. タスクカードをカレンダーの好きな時間枠へドラッグ&ドロップ。
4. その時刻に所要時間ぶんの予定が作成され、タスクは「予定済み」になります。
5. 予定の右上「×」で削除すると、タスクはバックログに戻ります。

## 技術スタック

- React 18 + TypeScript + Vite
- 認証: `@azure/msal-browser`（OAuth 2.0 / PKCE）
- カレンダー API: Microsoft Graph `v1.0`（`/me/calendarView`, `/me/events`）
- 永続化: タスク一覧は localStorage、予定はモード依存（モック=localStorage / 連携=Outlook）

## 構成

```
src/
  components/   Sidebar, TaskInput, TaskItem, Calendar, TopBar
  hooks/        useTasks（バックログ）, useCalendar（予定 + 認証）
  lib/          dates（日付/グリッド計算）, msalConfig,
                mockCalendar / graphCalendar（共通インターフェース実装）
  types.ts      Task / CalendarEvent / CalendarBackend
```

`mockCalendar` と `graphCalendar` は同じ `CalendarBackend` インターフェースを実装しているため、UI 側のコードはモードに依存しません。

フェーズ1：要件整理と環境準備
要件確認

機能：列リサイズ／ドラッグ＆ドロップ並べ替え／セル編集（テキスト・セレクト・チェックボックス・日付）／画像サムネイル表示

パフォーマンス目標：Chrome 上で 60fps 相当のドラッグ操作、リサイズ完了は 100ms以内

データ量想定：数十〜数百行、列数は可変（10〜20列程度）

技術スタックの決定

UI ライブラリ：MUI v5（@mui/material＋アイコン＋Emotion）

ヘッドレステーブル：TanStack Table v8（MIT）

仮想化：@tanstack/react-virtual（MIT）

列ドラッグ：dnd-kit（MIT）

ステート管理：React Context または Zustand（任意）

データ取得／更新：Google Sheets API via gapi／fetch

開発環境構築

Vite + TypeScript プロジェクトに MUI、TanStack、react-virtual、dnd-kit をインストール

MUI テーマを定義（カラーパレット、typography、ダーク・ライトモード対応）

フェーズ2：基本 PoC（概念実証）
TanStack Table の骨組み

useReactTable で列定義（id／header／cell／size／enableResizing: true など）をセット

MUI の <Table>, <TableHead>, <TableBody> ではなく、<div>＋display: grid または <table>＋table-layout: fixed のいずれかでシンプル実装

仮想化レンダリング

useVirtualizer で可視行のみレンダリング

MUI の <TableRow>／<TableCell> を仮想化領域内にレンダーし、スクロール同期を確認

ドラッグ＆ドロップ列並べ替え

dnd-kit の SortableContext／useSortable でヘッダーセルを並べ替え可能に

列再配置後に TanStack Table の columnOrder を更新

セル編集と更新ハンドラ

MUI の <TextField>, <Select>, <Checkbox> コンポーネントをセルレンダラとして差し込み

書き込みは onBlur／onEnter→Google Sheets API 呼び出し、エラーウィンドウはモーダルで表示

簡易パフォーマンステスト

Chrome DevTools でドラッグとリサイズを計測し、主要なボトルネックを抽出

フェーズ3：リサイズ UX の最適化
リサイズモード選定

onEnd モード（Proposal 3）をまず試し、ゴーストラインによるスムーズなドラッグを実装

ゴーストラインは MUI の <Box>（position: absolute）でヘッダー上に重ね描画

実幅反映

ドラッグ完了時に table.setColumnSizing を呼び出して一度だけ状態更新

TanStack Table が自動的にグリッドレイアウトを再計算

固定レイアウト確認

<Table sx={{ tableLayout: 'fixed' }}> を適用して固定テーブルモードに

幅は CSS 変数（--col-${id}-width） or columnSizing API 経由で管理

フェーズ4：パフォーマンスチューニング
CSS 変数による幅適用

各列の幅を CSS カスタムプロパティに登録し、CSS 側で反映。React の再レンダリングは最小限に。

requestAnimationFrame スロットリング

ゴーストライン移動や最終幅の計算処理は全て rAF 内で実行

pointermove イベントは event.preventDefault()→rAF スケジューリングにのみ使用

メモ化とレンダリング分割

列定義オブジェクト、行データ配列を useMemo でキャッシュ

セルコンポーネントを React.memo で包み、編集時以外は再描画をスキップ

DevTools で再計測

フレームごとの scripting/painting コストを測定

60fps を下回る場合はさらに DOM 更新範囲を限定 or 完全カスタム実装（Proposal 2）を検討

フェーズ5：品質保証とドキュメント化
クロスブラウザ検証

Chrome 以外（Firefox や Edge）の挙動を確認。特に pointer events の挙動差に注意。

アクセシビリティテスト

<table> であれば semantic なマークアップを維持。Grid化した場合は role=”grid”／aria-label などを追加。

デベロッパードキュメント

リサイズ・並べ替え・編集のフローを README にまとめ、実装ポイントと注意点を記載。

各提案の切り替え方法（onEnd vs live resize、CSS 変数 vs state）の比較表を作成。

リリースプラン

β リリース：小規模チームで試用しフィードバック収集

本番リリース：既存アプリケーションに統合。旧版を残した A/B テストやフェーズドロールアウトも検討

全体イメージ図
css
Copy
Edit
[View Layer]
┌────────────────────────────────────────────┐
│ MUI Theme Provider                         │
│   ┌─────────────────────────────────────┐  │
│   │ Header (dnd-kit + onEnd ガイド)     │  │
│   ├─────────────────────────────────────┤  │
│   │ Body (TanStack Table + react-virtual)│ │
│   └─────────────────────────────────────┘  │
└────────────────────────────────────────────┘

[State Layer]
┌────────────────────────────────────────────┐
│ React Context / Zustand                   │
│   ・列定義／サイズ管理                     │
│   ・行データ／表示フィールドID            │
│   ・編集中セル情報                         │
└────────────────────────────────────────────┘

[Data Layer]
┌────────────────────────────────────────────┐
│ Google Sheets API                         │
│   ・読み込み（初期／フィルタ適用）        │
│   ・更新（セル保存／エラーハンドリング）  │
└────────────────────────────────────────────┘
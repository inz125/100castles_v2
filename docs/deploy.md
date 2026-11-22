# 本番公開の手順

## 全体像

```
main に反映（PR をマージ）
  └─ GitHub Actions（.github/workflows/ci.yml）
       ├─ check     : 整形・lint・型チェック・テスト・ビルド・ワークフローの検査
       ├─ emulator  : Firestore エミュレータでクラウドの記録帳とルールのテスト
       ├─ rules     : Firestore のルールを公開（鍵が未登録ならスキップ）
       ├─ build-pages / deploy-pages : 画面を GitHub Pages に公開
```

- PR や main 以外のブランチでは check と emulator だけが動く
- 公開はすべてのチェックが通ったときだけ動く。**ルール → 画面の順**に公開する（D-86。先に画面を出すと、新しい置き場所への保存がクラウドに拒まれる）
- 公開先: https://inz125.github.io/100castles_v2/
- Firebase プロジェクト: `castles-5ae10`（`.firebaserc`）。画面に入れる Firebase の設定（`src/sharing/firebaseConfig.ts`）はブラウザに渡す前提の値で秘密ではない。読み書きできる範囲はセキュリティルール（`firestore.rules`）で制限する

## 鍵の扱い（安全のための設計）

Firestore のルールの公開には、Google Cloud のサービスアカウントの鍵（JSON）を使う。

- 鍵はコードに書かず、GitHub の Environment「production」の Secret（`FIREBASE_SERVICE_ACCOUNT`）にだけ置く。Environment は main からの実行にだけ渡すよう制限する
- 鍵を渡すのは公開の手順（`rules` ジョブの最後の手順）だけ。ファイルに書き出すのはその手順の間だけで、終わったら消す
- サービスアカウントの権限はルールの公開に必要なものだけにする（下記 2-1）。データの読み書きやプロジェクトの設定変更はできない
- ワークフローの既定の権限はリポジトリの読み取りだけ

それでも残るリスク:

| 漏れたら               | できてしまうこと                                                                     | 対処                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| サービスアカウントの鍵 | ルールを書き換えて、記録帳を誰でも読み書きできるようにする（または誰も使えなくする） | Google Cloud の画面でその鍵を削除し、新しい鍵を作って Secret を登録し直す。ルールを公開し直す |

- リポジトリは public。鍵をチャットや Issue・コミットに貼らない

## 1. GitHub Pages（設定済み）

- リポジトリの Settings → Pages → Source を「GitHub Actions」にする

## 2. Firestore のルールの自動公開（任意）

未登録のままでも画面の公開は動く（ルールの公開だけスキップされ、Actions の画面に notice が出る）。そのときはルールを変えるたびに「付録: 手元から公開する」で手で公開する。

### 2-1. サービスアカウントを作る

1. [Google Cloud コンソール](https://console.cloud.google.com/) でプロジェクト `castles-5ae10` を選ぶ
2. 「IAM と管理」→「サービス アカウント」→「サービス アカウントを作成」
   - 名前: `github-actions-rules` など
   - ロール: **Firebase Rules 管理者**（`roles/firebaserules.admin`）と **Service Usage ユーザー**（`roles/serviceusage.serviceUsageConsumer`）
3. 作ったサービスアカウントの「鍵」タブ →「鍵を追加」→「新しい鍵を作成」→ JSON。ダウンロードされたファイルが鍵

> 未検証: 必要なロールはこの 2 つの想定。初回の公開で権限不足のエラーが出たら、エラーに出たロールを足してこの手順書を直す

### 2-2. GitHub に登録する

1. リポジトリの Settings → Environments →「New environment」→ 名前 `production`
2. 「Deployment branches and tags」を「Selected branches and tags」にして `main` だけを許可する
3. 「Environment secrets」→「Add secret」
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: 2-1 でダウンロードした JSON ファイルの中身をそのまま貼る
4. ダウンロードした JSON ファイルはパソコンから消す

### 2-3. 確かめる

- 次に main に反映したとき、Actions の `rules` ジョブで「Firestore のルールを公開」が動き、`Deploy complete!` と出る
- Firebase コンソール → Firestore Database →「ルール」に、公開した日時の版が増えている

## 3. iPhone で使う

- Safari で公開先を開き、共有メニューの「ホーム画面に追加」で追加する（共有の参加はホーム画面のアプリで行う。D-82）
- 新しい版を公開したら、アプリを一度閉じて開き直すと更新される（出なければもう一度開き直す）

## 困ったとき

| 症状                                                   | 原因と対処                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 画面は新しいのに、共有中の記録がもう 1 人に届かない    | ルールが古いまま。Actions の `rules` ジョブがスキップされていないか確かめ、されていれば付録の手順で公開する |
| `rules` ジョブが `PERMISSION_DENIED`・`403` で失敗する | サービスアカウントのロールが足りない。エラーに出た権限を持つロールを 2-1 で足す                             |
| `rules` ジョブが鍵の読み込みで失敗する                 | Secret に JSON の一部だけを貼った。ファイルの中身全体（`{` から `}` まで）を登録し直す                      |

## 付録: 手元から公開する（GitHub に鍵を置かない方法）

パソコンで、リポジトリのフォルダで実行する（`firebase-tools` はプロジェクトに入っている）。

```sh
npx firebase login                            # 初回だけ。ブラウザで Google アカウントにログイン
npx firebase deploy --only firestore:rules    # 公開先は .firebaserc の castles-5ae10
```

- 画面より先に公開する。ルールを変えた PR は、ルールを公開してからマージする

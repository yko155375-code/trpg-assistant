# TRPG Assistant v2 安全開發與發布工作流

本文件定義 v2 的分支、驗收、發布、穩定標籤與回退規則。目標是讓 `main` 永遠代表可用版本，發生故障時從明確的 stable tag 回復，不再猜測「上一版」。

目前已驗收穩定版本：

* Label：`p0-localstorage-boot-guard`
* 穩定 commit：`934c84c456520c2e0ad54a1b7f4185ee739dc26b`
* Stable tag：`stable-v2-p0-localstorage-boot-guard`

## 1. 分支角色

* `main`：正式穩定版，只放已經由使用者驗收可用的版本。
* `codex/<功能-label>`：Codex 功能開發分支。
* `stable-v2-<label>`：使用者驗收成功後建立的穩定標籤。

## 2. 新功能流程

1. 每個新功能都必須從最新 `main` 建立新 branch。
2. Branch 命名格式為 `codex/<功能-label>`。
3. Codex 不得直接修改 `main`，除非使用者明確指定為 P0 熱修。
4. 每個功能 branch 只做一件事，保持修改可審查、可回退。
5. 不得在同一任務混合 UI、state、dice、monster、shop、routing 等多種大型修改。

範例：

```bash
git checkout main
git pull
git checkout -b codex/<功能-label>
```

## 3. 驗收流程

Codex 完成開發後，必須回報：

* Branch name
* Commit hash
* 修改檔案
* 是否新增檔案
* 是否改到禁止檔案
* 測試結果
* Console 是否有阻斷性 error
* Reload 掃描結果

使用者驗收通過後，才可以 merge 至 `main`。

Merge 至 `main` 後必須：

1. 更新 `v2/version.json`。
2. 確認 GitHub main 的實際 commit hash。
3. 建立對應的 stable tag。
4. Push stable tag 至 GitHub。

## 4. 穩定標籤規則

Tag 格式：

```text
stable-v2-<label>
```

例如：

```text
stable-v2-p0-localstorage-boot-guard
```

Stable tag 代表「已經驗收、可以回復的正式存檔點」。Rollback 必須引用明確的 stable tag 或 bad commit hash，不得使用模糊的「上一版」作為依據。

## 5. Rollback 流程

### A. 回退整個 v2 到 stable tag

```bash
git checkout main
git pull
git checkout stable-v2-<label> -- v2
git commit -m "Rollback v2 to stable-v2-<label>"
git push
```

適用情況：

* 多個 v2 檔案狀態錯亂。
* Import/export、啟動鏈或 state schema 已無法可靠判斷。
* 網站全黑或多個核心功能同時失效。

多檔狀態錯亂時，優先從 stable tag 回復整個 `v2/`。不要手動只回復單一檔案，以免造成 import/export 或 state schema 不一致。

### B. 只回退某次小改動

```bash
git revert <bad-commit-hash>
git push
```

適用情況：

* 問題可明確定位到單一、小範圍 commit。
* Revert 不會破壞後續相依修改。

## 6. P0 熱修流程

P0 包含：

* 全黑畫面。
* 啟動保護畫面。
* 使用者資料毀損。
* 主要頁面無法開啟。

P0 可以直接修正 `main`，但必須遵守：

1. 只修最小必要範圍。
2. 不新增功能。
3. 修復後立刻更新版本 label。
4. 回報 GitHub main 的實際 commit hash。
5. 驗收成功後立即建立新的 stable tag。

## 7. Codex 任務規範

* 每次 Codex 任務都要先列出允許修改的檔案。
* 若需要修改禁止檔案，必須停止並回報原因。
* 不得自行擴大任務範圍。
* 不得新增外掛式 fix module。
* 不得使用 `window.location.reload()`、`location.reload()` 或 `reload()`。
* 所有非表單提交用途的 `<button>` 必須明確設定 `type="button"`。
* 會修改 state 的任務，必須同步考慮 `normalizeState` 與舊 localStorage 資料相容。
* 新功能應在 `codex/<功能-label>` 分支開發，通過驗收後才 merge `main`。

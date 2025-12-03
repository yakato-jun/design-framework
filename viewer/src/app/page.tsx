export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-800">
        Design Viewer へようこそ
      </h1>
      <p className="mt-4 text-slate-600">
        左のサイドバーからサイト・画面を選択してください
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-700">画面遷移図</h2>
          <p className="mt-2 text-sm text-slate-500">
            サイト内の画面遷移を視覚的に確認できます
          </p>
        </div>
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-700">画面詳細</h2>
          <p className="mt-2 text-sm text-slate-500">
            各画面のレイアウト・フィールド・イベントを確認できます
          </p>
        </div>
      </div>
    </div>
  );
}

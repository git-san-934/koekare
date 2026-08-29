import { useState } from 'react'

// 段階1: 画面切り替えの器だけを用意する。中身は後続の段階で実装する。
const VIEWS = {
  day: '日別ビュー',
  month: '月別ビュー',
  form: '予定確認フォーム',
  backup: 'バックアップ',
}

export default function App() {
  const [view] = useState('day')

  return (
    <div className="app">
      <main className="app__main">
        <h1>コエカレ</h1>
        <p>{VIEWS[view]}（準備中）</p>
      </main>
    </div>
  )
}

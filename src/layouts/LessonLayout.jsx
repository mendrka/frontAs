import { Outlet } from 'react-router-dom'

function LessonLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,112,0.12),transparent_30%),linear-gradient(180deg,#f5fdf9_0%,#ffffff_42%,#e8faf1_100%)]">
      <Outlet />
    </div>
  )
}

export default LessonLayout

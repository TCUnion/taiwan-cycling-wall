interface Props {
  moakEventId: string
}

export default function MoakBadge({ moakEventId }: Props) {
  return (
    <a
      href={`https://moak.tw/event/${moakEventId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm hover:bg-yellow-100 transition-colors"
    >
      <span className="text-lg">🏅</span>
      <div>
        <p className="font-medium text-yellow-800">MOAK 認證活動</p>
        <p className="text-xs text-yellow-600">點擊前往 MOAK 查看</p>
      </div>
    </a>
  )
}

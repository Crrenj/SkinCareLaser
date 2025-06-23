import { Star } from 'lucide-react'

type Props = {
  author: string
  rating: number
  content: string
}

export default function ReviewCard({ author, rating, content }: Props) {
  return (
    <article className="border rounded-lg p-4 bg-white/80">
      <div className="flex items-center gap-1 mb-2 text-yellow-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={i < rating ? 'fill-current' : 'opacity-20'} size={16} />
        ))}
      </div>
      <p className="italic text-sm">« {content} »</p>
      <p className="mt-2 text-right text-xs font-semibold">– {author}</p>
    </article>
  )
}

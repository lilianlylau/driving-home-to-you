import { expandedLetterHeight, needsExpandedLetter } from '../lib/letterLayout'

export function Letter({
  editable = false,
  value = '',
  onChange,
}: {
  editable?: boolean
  value?: string
  onChange?: (value: string) => void
}) {
  const isExpanded = editable && needsExpandedLetter(value)

  return (
    <div
      className={`letter${isExpanded ? ' letter--expanded' : ''}`}
      style={isExpanded ? { height: `${expandedLetterHeight(value)}px` } : undefined}
    >
      <img src="/assets/letter/note-empty.png" alt="" />
      {editable ? (
        <textarea
          aria-label="Your letter"
          placeholder="start writing..."
          maxLength={500}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <p>
          hey, i was listening to that song we both love and it made me miss you. until i can
          actually make it back to you, i wanted to send a little piece of the road. turn the volume
          up for me. love you.
        </p>
      )}
    </div>
  )
}

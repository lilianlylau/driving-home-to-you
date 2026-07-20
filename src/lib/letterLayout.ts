// Leave a small buffer below the roughly 32 glyphs that fit on each line.
const COMPACT_LINE_LENGTH = 30
const COMPACT_LINE_COUNT = 7
const LETTER_VERTICAL_PADDING = 80
const LETTER_LINE_HEIGHT = 19

export function estimateLetterLines(noteText: string) {
  return noteText.split('\n').reduce((total, line) => {
    return total + Math.max(1, Math.ceil(line.length / COMPACT_LINE_LENGTH))
  }, 0)
}

export function needsExpandedLetter(noteText: string) {
  return estimateLetterLines(noteText) > COMPACT_LINE_COUNT
}

export function expandedLetterHeight(noteText: string) {
  return LETTER_VERTICAL_PADDING + estimateLetterLines(noteText) * LETTER_LINE_HEIGHT
}

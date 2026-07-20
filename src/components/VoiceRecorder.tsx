import { Button } from './Button'
import { Player } from './Player'

export function VoiceRecorder({
  state = 'empty',
  onBack,
  onComplete,
}: {
  state?: 'empty' | 'recording' | 'recorded'
  onBack?: () => void
  onComplete?: () => void
}) {
  const isEmpty = state === 'empty'
  return (
    <div className="voice-recorder">
      {!isEmpty && (
        <Player
          status={state === 'recording' ? 'recording...' : 'voice memo'}
          elapsed={state === 'recording' ? '00:01' : '00:32'}
        />
      )}
      <div className="voice-recorder__art">
        {!isEmpty && (
          <img
            className="voice-recorder__strip"
            src={`/assets/voice-memo/tape-${state === 'recording' ? 'recording' : 'recorded'}.png`}
            alt=""
          />
        )}
        <img
          src={`/assets/voice-memo/tape-recorder-${state === 'recording' ? 'on' : 'off'}.png`}
          alt="Portable tape recorder"
        />
      </div>
      <div className="actions">
        {isEmpty && (
          <>
            <Button tone="red">record audio</Button>
            <Button onClick={onBack}>back</Button>
            <Button onClick={onComplete}>skip</Button>
          </>
        )}
        {state === 'recording' && <Button tone="red">stop recording</Button>}
        {state === 'recorded' && (
          <>
            <Button>play back</Button>
            <Button tone="red">record again</Button>
            <Button onClick={onComplete}>done</Button>
          </>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'

const badgeClass = {
  correct: 'sp-c-ok',
  acceptable: 'sp-c-warn',
  incorrect: 'sp-c-err',
}

export default function ChatTimeline({ conversationHistory, isAiThinking }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const element = containerRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [conversationHistory, isAiThinking])

  return (
    <div ref={containerRef} className="sp-chat">
      {conversationHistory.map((message) => (
        <div key={message.id} className={message.role === 'ai' ? 'sp-bubble-ai' : `sp-bubble-user ${message.pending ? 'pending' : 'done'}`}>
          <div>{message.content}</div>
          {message.role === 'user' && message.correction?.status && (
            <>
              <div className={`sp-correction-badge ${badgeClass[message.correction.status] || ''}`}>
                <span className="sp-c-dot" />
                <span>{message.correction.status}</span>
                <span>{Math.round(message.correction.score || 0)}/100</span>
              </div>
              {(message.correction.explanation || message.correction.correctedVersion) && (
                <div className="sp-correction-detail">
                  {message.correction.explanation && <div>{message.correction.explanation}</div>}
                  {message.correction.correctedVersion && <span className="sp-corrected-text">{message.correction.correctedVersion}</span>}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {isAiThinking && (
        <div className="sp-typing-bubble">
          <span className="sp-typing-dot" />
          <span className="sp-typing-dot" />
          <span className="sp-typing-dot" />
        </div>
      )}
    </div>
  )
}

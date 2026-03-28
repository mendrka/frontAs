export const UserMessage = ({ children, className = '' }) => {
  return <div className={`sp-bubble-user px-4 py-3 text-white ${className}`}>{children}</div>
}

export default UserMessage


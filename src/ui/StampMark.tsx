/** 押印済みを表す朱色の印 */
export function StampMark({ size = 'small' }: { size?: 'small' | 'large' }) {
  return (
    <span role="img" aria-label="押印済み" className={`stamp-mark stamp-mark--${size}`}>
      印
    </span>
  )
}

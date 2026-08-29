import './fields.css'

export function DateField({ id, label, value, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <input
        id={id}
        type="date"
        className="field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

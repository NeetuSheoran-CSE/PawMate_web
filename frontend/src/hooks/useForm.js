import { useCallback, useRef, useState } from 'react'

/**
 * Small form helper.
 *   const form = useForm({ email: '' }, { email: compose(required('Email'), email) })
 *   <Field label="Email" {...form.field('email')} />
 *   if (!form.validate()) return
 */
export function useForm(initial, rules = {}) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const rulesRef = useRef(rules)
  rulesRef.current = rules // always use the latest rules

  const check = (name, all) => (rules[name] ? rules[name](all[name], all) : '')

  const setValue = useCallback((name, value) => {
    setValues(prev => {
      const next = { ...prev, [name]: value }
      const rule = rulesRef.current[name]
      setErrors(e => (name in e ? { ...e, [name]: rule ? rule(value, next) : '' } : e))
      return next
    })
  }, [])

  const handleChange = e => {
    const { name, type, value, checked } = e.target
    setValue(name, type === 'checkbox' ? checked : value)
  }

  const handleBlur = e => {
    const { name } = e.target
    setErrors(prev => ({ ...prev, [name]: check(name, values) }))
  }

  /** Validate the given field names (or all fields that have rules). Returns true when valid. */
  const validate = (names = Object.keys(rules)) => {
    const next = {}
    let ok = true
    names.forEach(n => {
      const msg = check(n, values)
      next[n] = msg
      if (msg) ok = false
    })
    setErrors(prev => ({ ...prev, ...next }))
    return ok
  }

  const field = name => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name] || '',
  })

  const reset = (next = initial) => {
    setValues(next)
    setErrors({})
  }

  return { values, errors, setValue, setValues, setErrors, handleChange, handleBlur, validate, field, reset }
}

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import './App.css'

/**
 * @typedef {'all'|'active'|'completed'} Filter
 */

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {number} createdAt
 */

const STORAGE_KEY = 'kavia.todo.v1'

function safeParseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function makeId() {
  // Avoid needing a dependency; prefer crypto.randomUUID when available.
  if (typeof crypto !== 'undefined' && crypto?.randomUUID) return crypto.randomUUID()
  return `todo_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function isValidTodoLike(t) {
  return (
    t &&
    typeof t === 'object' &&
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.completed === 'boolean' &&
    typeof t.createdAt === 'number'
  )
}

function loadTodosFromStorage() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = safeParseJson(raw, [])
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isValidTodoLike)
}

function saveTodosToStorage(todos) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

function FilterButton({ active, onClick, children }) {
  return (
    <button type="button" className={classNames('filterBtn', active && 'isActive')} onClick={onClick}>
      {children}
    </button>
  )
}

function Icon({ name }) {
  // Inline minimal icons (no external deps)
  if (name === 'check') {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="icon">
        <path
          fill="currentColor"
          d="M7.8 14.6 3.7 10.5a1 1 0 0 1 1.4-1.4l2.7 2.7 7-7a1 1 0 1 1 1.4 1.4l-7.7 7.7a1 1 0 0 1-1.4 0Z"
        />
      </svg>
    )
  }
  if (name === 'trash') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
        <path
          fill="currentColor"
          d="M9 3h6l1 2h5v2H3V5h5l1-2Zm1 6h2v10h-2V9Zm4 0h2v10h-2V9ZM7 9h2v10H7V9Z"
        />
      </svg>
    )
  }
  return null
}

export default function App() {
  const titleId = useId()
  const inputRef = useRef(null)

  /** @type {[Todo[], Function]} */
  const [todos, setTodos] = useState(() => loadTodosFromStorage())
  /** @type {[Filter, Function]} */
  const [filter, setFilter] = useState('all')
  const [draftTitle, setDraftTitle] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    saveTodosToStorage(todos)
  }, [todos])

  const visibleTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed)
    if (filter === 'completed') return todos.filter((t) => t.completed)
    return todos
  }, [todos, filter])

  const remainingCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos])
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos])

  function addTodo(title) {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Please enter a todo.')
      return
    }
    setError('')
    /** @type {Todo} */
    const todo = { id: makeId(), title: trimmed, completed: false, createdAt: Date.now() }
    setTodos((prev) => [todo, ...prev])
    setDraftTitle('')
    // Keep fast workflow: focus input after adding.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function toggleTodo(id) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed))
  }

  function handleSubmit(e) {
    e.preventDefault()
    addTodo(draftTitle)
  }

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="brandMark" aria-hidden="true" />
            <div>
              <h1 className="title" id={titleId}>
                Todos
              </h1>
              <p className="subtitle">Modern, minimal, and responsive.</p>
            </div>
          </div>
          <div className="stats" aria-label="Todo stats">
            <span className="pill">
              {remainingCount} <span className="pillLabel">left</span>
            </span>
            <span className="pill pillSecondary">
              {completedCount} <span className="pillLabel">done</span>
            </span>
          </div>
        </header>

        <main className="card" aria-labelledby={titleId}>
          <form className="addForm" onSubmit={handleSubmit} aria-label="Add todo">
            <label className="srOnly" htmlFor="todoInput">
              New todo
            </label>
            <input
              id="todoInput"
              ref={inputRef}
              className="textInput"
              type="text"
              value={draftTitle}
              placeholder="Add a new todo…"
              onChange={(e) => setDraftTitle(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'todoError' : undefined}
              autoComplete="off"
            />
            <button className="primaryBtn" type="submit">
              Add
            </button>
          </form>

          {error ? (
            <p id="todoError" className="errorText" role="alert">
              {error}
            </p>
          ) : null}

          <section className="controls" aria-label="Todo controls">
            <div className="filters" role="tablist" aria-label="Filter todos">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FilterButton>
              <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
                Active
              </FilterButton>
              <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>
                Completed
              </FilterButton>
            </div>

            <button
              className="ghostBtn"
              type="button"
              onClick={clearCompleted}
              disabled={completedCount === 0}
            >
              Clear completed
            </button>
          </section>

          <ul className="list" aria-label="Todo list">
            {visibleTodos.length === 0 ? (
              <li className="empty">
                <div className="emptyTitle">No todos here.</div>
                <div className="emptyHint">
                  {filter === 'all'
                    ? 'Add your first todo above.'
                    : filter === 'active'
                      ? 'All set — no active items.'
                      : 'No completed items yet.'}
                </div>
              </li>
            ) : (
              visibleTodos.map((todo) => (
                <li key={todo.id} className={classNames('item', todo.completed && 'isDone')}>
                  <button
                    type="button"
                    className={classNames('checkBtn', todo.completed && 'isChecked')}
                    onClick={() => toggleTodo(todo.id)}
                    aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {todo.completed ? <Icon name="check" /> : <span className="checkDot" aria-hidden="true" />}
                  </button>

                  <div className="itemText">
                    <div className="itemTitle">{todo.title}</div>
                  </div>

                  <button
                    type="button"
                    className="deleteBtn"
                    onClick={() => deleteTodo(todo.id)}
                    aria-label="Delete todo"
                    title="Delete"
                  >
                    <Icon name="trash" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </main>

        <footer className="footer">
          <div className="footerText">Tip: tap the circle to complete, use filters to focus.</div>
          <div className="footerTextMuted">Saved locally in your browser.</div>
        </footer>
      </div>
    </div>
  )
}

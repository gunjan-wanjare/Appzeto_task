import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTicket } from '../api.js';

const CATEGORIES = ['Bug', 'Feature', 'Billing', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

function validate({ title, description, category, priority }) {
  const errs = {};
  if (!title || title.trim().length < 5) errs.title = 'Title must be at least 5 characters';
  if (title && title.trim().length > 100) errs.title = 'Title must be at most 100 characters';
  if (!description || description.trim().length < 20) errs.description = 'Description must be at least 20 characters';
  if (!CATEGORIES.includes(category)) errs.category = 'Select a valid category';
  if (!PRIORITIES.includes(priority)) errs.priority = 'Select a valid priority';
  return errs;
}

export default function CreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setServerError('');
    try {
      await createTicket(form);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Something went wrong';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Create New Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{serverError}</div>
        )}

        <Field label="Title" error={errors.title}>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Login button not working on mobile"
            className={inputClass(errors.title)}
          />
          <p className="text-xs text-gray-400 mt-1">{form.title.trim().length}/100 characters (min 5)</p>
        </Field>

        <Field label="Description" error={errors.description}>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the issue in detail (min 20 characters)…"
            className={inputClass(errors.description)}
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.trim().length} characters (min 20)</p>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" error={errors.category}>
            <select name="category" value={form.category} onChange={handleChange} className={inputClass(errors.category)}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Priority" error={errors.priority}>
            <select name="priority" value={form.priority} onChange={handleChange} className={inputClass(errors.priority)}>
              <option value="">Select priority</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <Link to="/" className="flex-1 text-center py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Creating…' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function inputClass(hasError) {
  return `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors ${
    hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
  }`;
}

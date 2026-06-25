import { Plus, Trash2 } from 'lucide-react'

const fieldTypes = [
    { value: 'text', label: 'Short text' },
    { value: 'textarea', label: 'Long answer' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Single choice' },
    { value: 'checkbox', label: 'Checkbox' },
]

function makeFieldName(label) {
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
}

function createField() {
    return {
        id: crypto.randomUUID(),
        label: '',
        name: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: [],
    }
}

export default function CampaignFormBuilder({ value = [], onChange }) {
    const fields = Array.isArray(value) ? value : []

    const updateField = (id, patch) => {
        const next = fields.map((field) => {
            if (field.id !== id) return field

            const updated = {
                ...field,
                ...patch,
            }

            if (patch.label !== undefined && !field.name) {
                updated.name = makeFieldName(patch.label)
            }

            return updated
        })

        onChange(next)
    }

    const addField = () => {
        onChange([...fields, createField()])
    }

    const removeField = (id) => {
        onChange(fields.filter((field) => field.id !== id))
    }

    return (
        <div className="rounded-[24px] border frint-border bg-[var(--frint-soft-card)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-base font-black text-[var(--frint-text)]">
                        Custom form builder
                    </p>
                    <p className="mt-1 text-xs font-bold frint-muted">
                        Add extra questions for this campaign.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addField}
                    className="frint-primary-btn flex items-center justify-center gap-2 px-4 py-2.5 text-sm"
                >
                    <Plus size={16} />
                    Add field
                </button>
            </div>

            {fields.length === 0 ? (
                <div className="mt-4 rounded-[20px] border frint-border bg-[var(--frint-card)] p-4 text-sm font-bold frint-muted">
                    No custom fields added yet.
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="rounded-[22px] border frint-border bg-[var(--frint-card)] p-4"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-black text-[var(--frint-text)]">
                                    Field {index + 1}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => removeField(field.id)}
                                    className="rounded-full bg-red-50 p-2 text-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                <input
                                    value={field.label}
                                    onChange={(e) =>
                                        updateField(field.id, {
                                            label: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Question label"
                                />

                                <select
                                    value={field.type}
                                    onChange={(e) =>
                                        updateField(field.id, {
                                            type: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                >
                                    {fieldTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={field.name}
                                    onChange={(e) =>
                                        updateField(field.id, {
                                            name: makeFieldName(e.target.value),
                                        })
                                    }
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Field key, auto-generated from label"
                                />

                                <input
                                    value={field.placeholder || ''}
                                    onChange={(e) =>
                                        updateField(field.id, {
                                            placeholder: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="Placeholder optional"
                                />

                                {['select', 'radio'].includes(field.type) && (
                                    <textarea
                                        value={(field.options || []).join(', ')}
                                        onChange={(e) =>
                                            updateField(field.id, {
                                                options: e.target.value
                                                    .split(',')
                                                    .map((item) => item.trim())
                                                    .filter(Boolean),
                                            })
                                        }
                                        className="min-h-20 w-full rounded-2xl border frint-border bg-[var(--frint-card)] px-4 py-3 text-sm font-bold outline-none"
                                        placeholder="Options separated by comma"
                                    />
                                )}

                                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold frint-muted">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(field.required)}
                                        onChange={(e) =>
                                            updateField(field.id, {
                                                required: e.target.checked,
                                            })
                                        }
                                    />
                                    Required field
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
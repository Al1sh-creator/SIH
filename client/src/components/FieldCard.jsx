/**
 * FieldCard — farm field status card
 * Props: field, onEdit, onDelete
 */
export default function FieldCard({ field, onEdit, onDelete }) {
  const stageColors = {
    sowing:     'badge-info',
    vegetative: 'badge-success',
    flowering:  'badge-warning',
    fruiting:   'badge-warning',
    harvest:    'badge-danger',
    growing:    'badge-success',
  }

  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200 animate-slide-up flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-heading font-semibold text-gray-800">
            {field.field_name || field.name || 'Unnamed Field'}
          </h4>
          <p className="text-xs text-gray-500 font-body">{field.soil_type || 'Unknown'} soil</p>
        </div>
        <span className="text-2xl">🌱</span>
      </div>

      {/* Details */}
      <div className="space-y-2 flex-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-body">Crop</span>
          <span className="text-sm font-medium text-gray-800 font-body">
            {field.current_crop || field.crop_name || '—'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-body">Stage</span>
          {field.crop_stage ? (
            <span className={stageColors[field.crop_stage] || 'badge-info'}>
              {field.crop_stage}
            </span>
          ) : <span className="text-sm text-gray-400">—</span>}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 font-body">Area</span>
          <span className="text-sm font-stat font-medium text-gray-800">
            {field.field_size || field.area_acres || '—'} acres
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {(onEdit || onDelete) && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(field)}
              className="flex-1 text-sm text-primary hover:bg-primary/5 rounded-lg py-1.5 font-medium transition-all"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(field.id)}
              className="flex-1 text-sm text-red-500 hover:bg-red-50 rounded-lg py-1.5 font-medium transition-all"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

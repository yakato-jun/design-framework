'use client';

import { ResolvedArea, ResolvedElement } from '@/types/design';

interface PropertyPanelProps {
  selectedElement: ResolvedElement | null;
  selectedArea: ResolvedArea | null;
}

export default function PropertyPanel({
  selectedElement,
  selectedArea,
}: PropertyPanelProps) {
  if (!selectedElement && !selectedArea) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Properties</h2>
        <p className="text-sm text-slate-500">
          要素またはエリアを選択してください
        </p>
      </div>
    );
  }

  if (selectedElement) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Element Properties</h2>

        {/* Element ID */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-500 uppercase">
            Element ID
          </label>
          <div className="font-mono text-sm bg-slate-100 px-2 py-1 rounded mt-1">
            {selectedElement.elementId}
          </div>
        </div>

        {/* Field Ref */}
        {selectedElement.fieldRef && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Field Ref
            </label>
            <div className="font-mono text-sm bg-slate-100 px-2 py-1 rounded mt-1">
              {selectedElement.fieldRef}
            </div>
          </div>
        )}

        {/* Field Info */}
        {selectedElement.field && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Field
            </label>
            <div className="mt-1 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Type:</span>
                <span className="font-medium">{selectedElement.field.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Label:</span>
                <span className="font-medium">{selectedElement.field.label}</span>
              </div>
              {selectedElement.field.designHint && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Design Hint:</span>
                  <span className="font-medium">{selectedElement.field.designHint}</span>
                </div>
              )}
              {selectedElement.field.description && (
                <div>
                  <span className="text-slate-600">Description:</span>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedElement.field.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Layout Hint */}
        {selectedElement.layoutHint && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Layout Hint
            </label>
            <div className="text-sm mt-1">{selectedElement.layoutHint}</div>
          </div>
        )}

        {/* Events */}
        {selectedElement.events && selectedElement.events.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Events
            </label>
            <div className="mt-2 space-y-2">
              {selectedElement.events.map((event) => (
                <div
                  key={event.eventId}
                  className="bg-amber-50 border border-amber-200 rounded p-2"
                >
                  <div className="font-medium text-sm flex items-center gap-1">
                    <span>⚡</span>
                    <span>{event.name || event.eventId}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Trigger: {event.trigger.event} on {event.trigger.element}
                  </div>
                  {event.actions.map((action, i) => (
                    <div key={i} className="text-xs text-slate-500 mt-1">
                      → {action.type}
                      {action.target && `: ${action.target}`}
                      {action.interfaceRef && `: ${action.interfaceRef}`}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (selectedArea) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Area Properties</h2>

        {/* Area ID */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-500 uppercase">
            Area ID
          </label>
          <div className="font-mono text-sm bg-slate-100 px-2 py-1 rounded mt-1">
            {selectedArea.areaId}
          </div>
        </div>

        {/* Name */}
        {selectedArea.name && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Name
            </label>
            <div className="text-sm mt-1">{selectedArea.name}</div>
          </div>
        )}

        {/* Role */}
        {selectedArea.role && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Role
            </label>
            <div className="text-sm mt-1">{selectedArea.role}</div>
          </div>
        )}

        {/* Layout Hint */}
        {selectedArea.layoutHint && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Layout Hint
            </label>
            <div className="text-sm mt-1">{selectedArea.layoutHint}</div>
          </div>
        )}

        {/* Layout */}
        {selectedArea.layout && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Layout
            </label>
            <div className="text-sm mt-1">{selectedArea.layout}</div>
          </div>
        )}

        {/* Size Hint */}
        {selectedArea.sizeHint && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Size Hint
            </label>
            <div className="text-sm mt-1">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {selectedArea.sizeHint}
              </span>
            </div>
          </div>
        )}

        {/* Children */}
        {selectedArea.children && selectedArea.children.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Children
            </label>
            <div className="mt-1 flex flex-wrap gap-1">
              {selectedArea.children.map((childId) => (
                <span
                  key={childId}
                  className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                >
                  {childId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Grid Areas */}
        {selectedArea.gridAreas && selectedArea.gridAreas.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Grid Areas
            </label>
            <div className="mt-1 font-mono text-xs bg-slate-100 p-2 rounded overflow-x-auto">
              {selectedArea.gridAreas.map((row, i) => (
                <div key={i} className="whitespace-nowrap">
                  [{row.join(', ')}]
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inherited */}
        {selectedArea.inherited && (
          <div className="mb-4">
            <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded">
              Inherited from shared layout
            </span>
          </div>
        )}

        {/* Children count */}
        {selectedArea.children && selectedArea.children.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Children
            </label>
            <div className="text-sm mt-1">
              {selectedArea.children.length} child(ren)
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

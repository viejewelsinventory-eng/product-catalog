// Canonical file-type tag -> display label mapping.
// Tags are stored in the database in this short lowercase form (see the
// import script's FILE_TYPE_COLUMNS: '3dm', '3dm-mesh', 'jcd', 'mgx', 'stl').
// This file is the single source of truth for how they should be *displayed*
// anywhere in the UI, so ProductDetailModal and Sidebar never drift out of
// sync with each other or with what's actually stored in the database.
export const FILE_TYPE_LABELS: { tag: string; label: string }[] = [
  { tag: '3dm', label: '3DM' },
  { tag: '3dm-mesh', label: '3DM (Mesh with diamonds)' },
  { tag: 'jcd', label: 'JCD' },
  { tag: 'mgx', label: 'MGX' },
  { tag: 'stl', label: 'STL' },
]

export function getFileTypeLabel(tag: string): string {
  return FILE_TYPE_LABELS.find((f) => f.tag === tag)?.label ?? tag
}

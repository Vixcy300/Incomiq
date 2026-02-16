import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table'
import { ArrowUpDown, Trash2, ChevronLeft, ChevronRight, Search, TrendingUp, Briefcase, Car, ShoppingBag, BookOpen, Package, Video } from 'lucide-react'
import { formatCurrency, getRelativeTime, cn } from '@/lib/utils'
import type { Income } from '@/types'

// Category icons mapping for rich display
const categoryIcons: Record<string, React.ReactNode> = {
  freelance: <Briefcase className="w-4 h-4" />,
  delivery: <Package className="w-4 h-4" />,
  content: <Video className="w-4 h-4" />,
  rideshare: <Car className="w-4 h-4" />,
  tutoring: <BookOpen className="w-4 h-4" />,
  ecommerce: <ShoppingBag className="w-4 h-4" />,
}

// Category colors with gradients
const categoryGradients: Record<string, string> = {
  freelance: 'from-blue-500 to-indigo-500',
  delivery: 'from-orange-500 to-red-500',
  content: 'from-pink-500 to-purple-500',
  rideshare: 'from-green-500 to-emerald-500',
  tutoring: 'from-cyan-500 to-blue-500',
  ecommerce: 'from-amber-500 to-orange-500',
}

interface IncomeTableProps {
  incomes: Income[]
  onDelete: (id: string) => void
}

export default function IncomeTable({ incomes, onDelete }: IncomeTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const columns = useMemo<ColumnDef<Income>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-medium" onClick={() => column.toggleSorting()}>
            Date <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(row.original.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getRelativeTime(row.original.date)}</p>
          </div>
        ),
      },
      {
        accessorKey: 'source_name',
        header: 'Source',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${categoryGradients[row.original.category] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white shadow-sm`}>
              {categoryIcons[row.original.category] || <TrendingUp className="w-4 h-4" />}
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.original.source_name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const cat = row.original.category
          const gradient = categoryGradients[cat] || 'from-gray-500 to-gray-600'
          const icon = categoryIcons[cat] || <TrendingUp className="w-4 h-4" />
          return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-medium shadow-sm`}>
              {icon}
              <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-medium ml-auto" onClick={() => column.toggleSorting()}>
            Amount <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              +{formatCurrency(row.original.amount)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{row.original.description || '—'}</p>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(row.original.id)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        ),
      },
    ],
    [onDelete]
  )

  const filteredData = useMemo(() => {
    let data = incomes
    if (categoryFilter) {
      data = data.filter(d => d.category === categoryFilter)
    }
    return data
  }, [incomes, categoryFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const categories = ['freelance', 'delivery', 'content', 'rideshare', 'tutoring', 'ecommerce']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search income..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white transition-all duration-300"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategoryFilter('')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-sm',
              !categoryFilter 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-purple-200' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            All Sources
          </motion.button>
          {categories.map((cat) => {
            const isActive = categoryFilter === cat
            const gradient = categoryGradients[cat] || 'from-gray-500 to-gray-600'
            const icon = categoryIcons[cat] || <TrendingUp className="w-3.5 h-3.5" />
            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-sm',
                  isActive 
                    ? `bg-gradient-to-r ${gradient} text-white` 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {icon}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <motion.tr 
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors duration-200"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)} of{' '}
          {filteredData.length} entries
        </p>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

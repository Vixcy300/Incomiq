import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Upload, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import IncomeTable from '@/components/income/IncomeTable'
import CSVUploadZone from '@/components/income/CSVUploadZone'
import AddIncomeModal from '@/components/income/AddIncomeModal'
import { incomeApi } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Income, Expense } from '@/types'
import toast from 'react-hot-toast'

export default function IncomePage() {
  const _store = useAppStore()
  const [showUpload, setShowUpload] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Fetch incomes from API
  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await incomeApi.list()
      setIncomes(data.incomes || [])
    } catch (err) {
      console.error('Failed to fetch incomes:', err)
      toast.error('Failed to load income data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  const handleAddIncome = async (income: Omit<Income, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const newIncome = await incomeApi.create({
        amount: income.amount,
        source_name: income.source_name,
        category: income.category,
        date: income.date,
        description: income.description,
        tags: income.tags,
      })
      setIncomes([newIncome, ...incomes])
      setShowAddModal(false)
      toast.success('Income added successfully!')
    } catch (err) {
      toast.error('Failed to add income')
    }
  }

  const handleDeleteIncome = async (id: string) => {
    try {
      setDeleting(id)
      await incomeApi.delete(id)
      setIncomes(incomes.filter((i) => i.id !== id))
      toast.success('Income deleted')
    } catch (err) {
      toast.error('Failed to delete income')
      // Refresh to sync with server
      fetchIncomes()
    } finally {
      setDeleting(null)
    }
  }

  const handleCSVImport = (newIncomes: Income[], newExpenses: Expense[]) => {
    // Refresh data from server after import
    fetchIncomes()
    setShowUpload(false)
    
    // Show summary toast
    const incomeTotal = newIncomes.reduce((s, i) => s + i.amount, 0)
    const expenseTotal = newExpenses.reduce((s, e) => s + e.amount, 0)
    toast.success(
      `Imported ${newIncomes.length} income (₹${incomeTotal.toLocaleString('en-IN')}) and ${newExpenses.length} expenses (₹${expenseTotal.toLocaleString('en-IN')})`
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Income Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track all your income sources in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchIncomes}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowUpload(!showUpload)}
          >
            Upload CSV
          </Button>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Income
          </Button>
        </div>
      </div>

      {/* CSV Upload Zone */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <CSVUploadZone onImport={handleCSVImport} onClose={() => setShowUpload(false)} />
        </motion.div>
      )}

      {/* Income Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <IncomeTable incomes={incomes} onDelete={handleDeleteIncome} />
      </motion.div>

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddIncome}
      />
    </div>
  )
}

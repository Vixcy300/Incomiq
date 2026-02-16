import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, X, CheckCircle, Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatCurrency, getCategoryIcon } from '@/lib/utils'
import { transactionsApi } from '@/lib/api'
import type { Income, Expense } from '@/types'

interface CSVUploadZoneProps {
  onImport: (incomes: Income[], expenses: Expense[]) => void
  onClose: () => void
}

type UploadStage = 'idle' | 'uploading' | 'analyzing' | 'segregating' | 'done' | 'error'

const stageLabels: Record<UploadStage, string> = {
  idle: 'Drop your CSV file here',
  uploading: 'Uploading file...',
  analyzing: 'Analyzing transactions...',
  segregating: 'Segregating income & expenses...',
  done: 'Import complete!',
  error: 'Upload failed',
}

const stageProgress: Record<UploadStage, number> = {
  idle: 0,
  uploading: 25,
  analyzing: 50,
  segregating: 75,
  done: 100,
  error: 0,
}

export default function CSVUploadZone({ onImport, onClose }: CSVUploadZoneProps) {
  const [stage, setStage] = useState<UploadStage>('idle')
  const [parsedIncomes, setParsedIncomes] = useState<Income[]>([])
  const [parsedExpenses, setParsedExpenses] = useState<Expense[]>([])
  const [fileName, setFileName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setErrorMessage('')
    
    try {
      setStage('uploading')
      await sleep(500)
      
      setStage('analyzing')
      const result = await transactionsApi.uploadCSV(file)
      
      setStage('segregating')
      await sleep(500)
      
      if (result.errors && result.errors.length > 0) {
        console.warn('CSV parsing errors:', result.errors)
      }
      
      setParsedIncomes(result.incomes || [])
      setParsedExpenses(result.expenses || [])
      setStage('done')
    } catch (err) {
      console.error('CSV upload error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to process CSV file')
      setStage('error')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDrop: (accepted) => {
      if (accepted.length > 0) {
        processFile(accepted[0])
      }
    },
    disabled: stage !== 'idle' && stage !== 'error',
  })

  const handleImport = () => {
    onImport(parsedIncomes, parsedExpenses)
    resetState()
  }

  const resetState = () => {
    setStage('idle')
    setParsedIncomes([])
    setParsedExpenses([])
    setErrorMessage('')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Import Transactions CSV</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {stage === 'idle' || stage === 'error' ? (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : stage === 'error'
                ? 'border-red-300 bg-red-50 hover:border-red-400'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-12 h-12 mx-auto mb-3 ${stage === 'error' ? 'text-red-400' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-900">
              {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file, or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Auto-segregates income & expenses</p>
            {stage === 'error' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </div>
          
          {/* CSV Format Help */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-2">Expected CSV columns:</p>
            <code className="text-xs text-gray-600 block">
              type, date, amount, source, category, description, payment_method
            </code>
            <p className="text-xs text-gray-400 mt-1">
              "type" can be: income, expense (or auto-detected from source/category)
            </p>
          </div>
        </>
      ) : stage === 'done' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-success-500">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Successfully processed {fileName}</p>
              <p className="text-sm text-gray-500">
                {parsedIncomes.length} income + {parsedExpenses.length} expense entries detected
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Income</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{parsedIncomes.length}</p>
              <p className="text-sm text-emerald-600">
                Total: {formatCurrency(parsedIncomes.reduce((s, i) => s + i.amount, 0))}
              </p>
            </div>
            <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <TrendingDown className="w-5 h-5" />
                <span className="font-semibold">Expenses</span>
              </div>
              <p className="text-2xl font-bold text-rose-700">{parsedExpenses.length}</p>
              <p className="text-sm text-rose-600">
                Total: {formatCurrency(parsedExpenses.reduce((s, e) => s + e.amount, 0))}
              </p>
            </div>
          </div>

          {/* Preview tables */}
          {parsedIncomes.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-emerald-50 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-emerald-700">Income Preview</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Source</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedIncomes.slice(0, 3).map((income) => (
                    <tr key={income.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 flex items-center gap-2">
                        <span>{getCategoryIcon(income.category)}</span>
                        <span className="font-medium">{income.source_name}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 capitalize">{income.category}</td>
                      <td className="px-4 py-2 text-right font-semibold text-emerald-600">
                        +{formatCurrency(income.amount)}
                      </td>
                    </tr>
                  ))}
                  {parsedIncomes.length > 3 && (
                    <tr><td colSpan={3} className="px-4 py-2 text-center text-xs text-gray-400">
                      ...and {parsedIncomes.length - 3} more
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {parsedExpenses.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-rose-50 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-rose-700">Expense Preview</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedExpenses.slice(0, 3).map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 flex items-center gap-2">
                        <span>{getCategoryIcon(expense.category)}</span>
                        <span className="font-medium">{expense.description || expense.category}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 capitalize">{expense.category}</td>
                      <td className="px-4 py-2 text-right font-semibold text-rose-600">
                        -{formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                  {parsedExpenses.length > 3 && (
                    <tr><td colSpan={3} className="px-4 py-2 text-center text-xs text-gray-400">
                      ...and {parsedExpenses.length - 3} more
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={resetState}>
              Upload Another
            </Button>
            <Button onClick={handleImport} icon={<CheckCircle className="w-4 h-4" />}>
              Import {parsedIncomes.length + parsedExpenses.length} Entries
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-8">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            <p className="text-sm font-medium text-gray-700">{stageLabels[stage]}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${stageProgress[stage]}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">{stageProgress[stage]}% complete</p>
        </div>
      )}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

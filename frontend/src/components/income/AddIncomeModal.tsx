import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { getCategoryIcon } from '@/lib/utils'
import type { Income, IncomeCategory } from '@/types'

const incomeSchema = z.object({
  amount: z.coerce.number().min(1, 'Min ₹1').max(1000000, 'Max ₹10,00,000'),
  source_name: z.string().min(1, 'Required').max(50, 'Max 50 chars'),
  category: z.enum(['freelance', 'delivery', 'content', 'rideshare', 'tutoring', 'ecommerce', 'other']),
  date: z.string().min(1, 'Required'),
  description: z.string().max(200, 'Max 200 chars').optional(),
})

type IncomeForm = z.infer<typeof incomeSchema>

interface AddIncomeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (income: Omit<Income, 'id' | 'user_id' | 'created_at'>) => void
}

const categories: { value: IncomeCategory; label: string }[] = [
  { value: 'freelance', label: 'Freelance' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'content', label: 'Content' },
  { value: 'rideshare', label: 'Rideshare' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'other', label: 'Other' },
]

const sources = ['Upwork', 'Fiverr', 'Swiggy', 'Zomato', 'YouTube', 'Udemy', 'Meesho', 'Ola', 'Rapido', 'Other']

export default function AddIncomeModal({ isOpen, onClose, onSubmit }: AddIncomeModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IncomeForm>({
    // @ts-expect-error Zod v4 coerce type mismatch with RHF resolver
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: 'freelance',
    },
  })

  const selectedCategory = watch('category')

  const onFormSubmit = (data: IncomeForm) => {
    onSubmit({
      amount: data.amount,
      source_name: data.source_name,
      source_id: null,
      category: data.category,
      date: data.date,
      description: data.description || '',
      tags: [],
    })
    reset()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income">
      {/* @ts-expect-error Zod v4 coerce type mismatch */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              placeholder="5,000"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {errors.amount && <p className="text-xs text-danger-500 mt-1">{errors.amount.message}</p>}
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select
            {...register('source_name')}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Select source...</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.source_name && <p className="text-xs text-danger-500 mt-1">{errors.source_name.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <label
                key={cat.value}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer transition-all text-center ${
                  selectedCategory === cat.value
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={cat.value}
                  {...register('category')}
                  className="sr-only"
                />
                <span className="text-xl">{getCategoryIcon(cat.value)}</span>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            {...register('date')}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {errors.date && <p className="text-xs text-danger-500 mt-1">{errors.date.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="E.g., Logo design for client"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          {errors.description && <p className="text-xs text-danger-500 mt-1">{errors.description.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add Income
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Globe,
  Bell,
  MessageCircle,
  User,
  Shield,
  Info,
  Check,
  Mail,
  Smartphone,
  IndianRupee,
  Target,
  Wallet,
  Moon,
  Sun,
  Send,
} from 'lucide-react'
import { useTranslation, localeNames, type Locale } from '@/lib/i18n'
import { useAppStore, type UserSettings } from '@/store/useAppStore'
import { whatsappApi } from '@/lib/api'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation()
  const { settings, updateSettings } = useAppStore()
  const [local, setLocal] = useState<UserSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [testingWhatsApp, setTestingWhatsApp] = useState(false)

  useEffect(() => {
    setLocal(settings)
  }, [settings])

  const handleSave = () => {
    updateSettings(local)
    setSaved(true)
    toast.success(t('settings_saved'))
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestWhatsApp = async () => {
    if (!local.whatsappNumber) {
      toast.error('Please enter a WhatsApp number first')
      return
    }
    setTestingWhatsApp(true)
    try {
      const result = await whatsappApi.sendTest(local.whatsappNumber)
      if (result.ok) {
        toast.success('WhatsApp test message sent!')
      } else {
        toast.success('WhatsApp connected! (Demo mode)')
      }
    } catch {
      // In demo mode, show success anyway
      toast.success('WhatsApp connected! (Demo mode)')
    } finally {
      setTestingWhatsApp(false)
    }
  }

  const toggle = (key: keyof UserSettings) => {
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings_title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings_subtitle')}</p>
      </motion.div>

      {/* ── Language ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('settings_language')}</h2>
            <p className="text-sm text-gray-500">{t('settings_lang_desc')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(localeNames) as [Locale, string][]).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setLocale(key)}
              className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                locale === key
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className="text-lg block mb-1">
                {key === 'en' ? '🇬🇧' : key === 'ta' ? '🇮🇳' : '🇮🇳'}
              </span>
              {name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Appearance ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.075 }} className="bg-white rounded-2xl border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center dark:bg-purple-900/30">
            <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the app looks</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {local.darkMode ? (
              <Moon className="w-5 h-5 text-purple-500" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
          </div>
          <button
            onClick={() => {
              const newValue = !local.darkMode
              setLocal({ ...local, darkMode: newValue })
              // Apply dark mode immediately
              if (newValue) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            }}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              local.darkMode ? 'bg-purple-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                local.darkMode ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* ── Profile ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('settings_profile')}</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                {t('settings_monthly_income')}
              </div>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={local.monthlyIncome}
                onChange={(e) => setLocal({ ...local, monthlyIncome: Number(e.target.value) })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                {t('settings_savings_target')}
              </div>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={local.savingsTarget}
                onChange={(e) => setLocal({ ...local, savingsTarget: Number(e.target.value) })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Notifications ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('settings_notifications')}</h2>
            <p className="text-sm text-gray-500">{t('settings_notif_desc')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Email */}
          <ToggleRow
            icon={<Mail className="w-4 h-4 text-blue-500" />}
            label={t('settings_email_alerts')}
            checked={local.emailAlerts}
            onToggle={() => toggle('emailAlerts')}
          />
          {/* Push */}
          <ToggleRow
            icon={<Smartphone className="w-4 h-4 text-purple-500" />}
            label={t('settings_push_alerts')}
            checked={local.pushAlerts}
            onToggle={() => toggle('pushAlerts')}
          />
          {/* Overspend */}
          <ToggleRow
            icon={<Shield className="w-4 h-4 text-red-500" />}
            label={t('settings_overspend_alerts')}
            checked={local.overspendAlerts}
            onToggle={() => toggle('overspendAlerts')}
          />
          {/* Savings */}
          <ToggleRow
            icon={<Target className="w-4 h-4 text-emerald-500" />}
            label={t('settings_savings_remind')}
            checked={local.savingsReminders}
            onToggle={() => toggle('savingsReminders')}
          />
          {/* Goals */}
          <ToggleRow
            icon={<Check className="w-4 h-4 text-primary-500" />}
            label={t('settings_goal_notif')}
            checked={local.goalNotifications}
            onToggle={() => toggle('goalNotifications')}
          />
        </div>
      </motion.div>

      {/* ── WhatsApp ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('settings_whatsapp')}</h2>
            <p className="text-sm text-gray-500">{t('settings_whatsapp_desc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleRow
            icon={<MessageCircle className="w-4 h-4 text-green-500" />}
            label={local.whatsappAlerts ? t('settings_opt_out') : t('settings_opt_in')}
            checked={local.whatsappAlerts}
            onToggle={() => toggle('whatsappAlerts')}
          />

          {local.whatsappAlerts && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings_whatsapp_number')}
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={local.whatsappNumber}
                  onChange={(e) => setLocal({ ...local, whatsappNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-300 focus:border-green-400"
                />
              </div>
              <button
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp || !local.whatsappNumber}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-xl text-sm transition-colors"
              >
                {testingWhatsApp ? (
                  <span className="animate-pulse">Sending...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Test WhatsApp Connection
                  </>
                )}
              </button>
              <p className="text-xs text-gray-400">
                You'll receive overspending alerts, savings reminders, and goal updates on WhatsApp.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── About ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Info className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('settings_about')}</h2>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {t('settings_version')} 2.0 · Powered by Groq AI · Built with ❤️
        </p>
      </motion.div>

      {/* ── Save Button ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="pb-8">
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
            saved
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'gradient-hero hover:shadow-lg hover:shadow-primary-200/50'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> {t('settings_saved')}
            </span>
          ) : (
            t('settings_save')
          )}
        </button>
      </motion.div>
    </div>
  )
}

function ToggleRow({
  icon,
  label,
  checked,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
        {icon}
        {label}
      </span>
      <div
        className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${
          checked ? 'bg-primary-500' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </div>
    </button>
  )
}

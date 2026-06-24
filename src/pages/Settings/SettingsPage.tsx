import { useSettingsStore } from '../../app/store'

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore()

  return (
    <div className="flex h-full flex-col p-4">
      <h1 className="text-xl font-bold mb-4">Configurações</h1>

      <label className="flex items-center justify-between py-2">
        <span className="text-sm">Ônibus 3D</span>
        <input
          type="checkbox"
          checked={settings.show3D}
          onChange={(e) => updateSettings({ show3D: e.target.checked })}
        />
      </label>

      <label className="flex items-center justify-between py-2">
        <span className="text-sm">Notificações</span>
        <input
          type="checkbox"
          checked={settings.notificationsEnabled}
          onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
        />
      </label>
    </div>
  )
}

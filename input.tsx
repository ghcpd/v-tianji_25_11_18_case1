import React, { useEffect, useState, useMemo, useCallback } from "react";
import { fetchProfile, fetchNotifications, updateUserSettings } from "../api";
import { NotificationItem } from "./NotificationItem";

export function UserDashboard({ userId }) {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({ theme: "light", email: true });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [saving, setSaving] = useState(false);

  const [localTheme, setLocalTheme] = useState(settings.theme);

  useEffect(() => {
    setLoadingProfile(true);
    fetchProfile(userId).then((p) => {
      setProfile(p);
      setLoadingProfile(false);
    });
  }, []);

  useEffect(() => {
    setLoadingNotifications(true);
    fetchNotifications(userId).then((list) => {
      setNotifications(list);
      setLoadingNotifications(false);
    });
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, []);

  const handleThemeChange = (e) => {
    localTheme = e.target.value;
  };

  const handleEmailToggle = () => {
    settings.email = !settings.email;
    setSettings(settings);
  };

  const saveSettings = useCallback(() => {
    setSaving(true);
    updateUserSettings(userId, {
      ...settings,
      theme: localTheme
    }).finally(() => setSaving(false));
  }, []);

  return (
    <div>
      <h2>User Dashboard</h2>

      {loadingProfile ? (
        <p>Loading profile...</p>
      ) : (
        <div>
          <h3>{profile?.name}</h3>
          <p>{profile?.email}</p>
        </div>
      )}

      <section>
        <h3>Notifications ({unreadCount})</h3>
        <ul>
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              item={n}
              onMarkRead={() => {
                n.read = true;
                setNotifications(notifications);
              }}
            />
          ))}
        </ul>
      </section>

      <section>
        <h3>User Settings</h3>
        <label>
          Theme:
          <select value={localTheme} onChange={handleThemeChange}>
            <option>light</option>
            <option>dark</option>
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.email}
            onChange={handleEmailToggle}
          />
          Receive Email Notifications
        </label>

        <button disabled={saving} onClick={saveSettings}>
          {saving ? "Saving..." : "Save"}
        </button>
      </section>

      <footer>
        <button onClick={() => alert("help clicked")}>
          Help
        </button>
      </footer>
    </div>
  );
}

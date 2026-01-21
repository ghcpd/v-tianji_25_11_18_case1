import React, { ChangeEvent, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { profiles, fetchProfile, fetchNotif, saveSettings, NotificationItem as NotificationSchema, Settings } from './api';

type Profile = typeof profiles[keyof typeof profiles];

type NotificationItemProps = {
  item: NotificationSchema;
  onRead: (id: string) => void;
};

function NotificationItem({ item, onRead }: NotificationItemProps) {
  return (
    <div className="row">
      <div>
        <strong>{item.title}</strong>
        {!item.read && <span style={{ marginLeft: 6, color: '#06b6d4' }}>(new)</span>}
      </div>
      <button className="secondary" onClick={() => onRead(item.id)}>
        Mark
      </button>
    </div>
  );
}

type SettingsPanelProps = {
  userId: string;
  settings: Settings;
  onSave: (settings: Settings) => void;
};

function SettingsPanel({ userId, settings, onSave }: SettingsPanelProps) {
  const [local, setLocal] = useState<Settings>(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  const save = async () => {
    const res = await saveSettings(userId, local);
    if (res.ok) {
      onSave(res.settings);
    }
  };

  return (
    <div className="card">
      <h3>Settings</h3>
      <div className="small">Theme</div>
      <select value={local.theme} onChange={(e) => setLocal({ ...local, theme: e.target.value })}>
        <option>light</option>
        <option>dark</option>
      </select>

      <div style={{ marginTop: 8 }} className="small">
        Email Notify
      </div>
      <input
        type="checkbox"
        checked={local.email}
        onChange={(e) => setLocal({ ...local, email: e.target.checked })}
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save</button>
      </div>
    </div>
  );
}

export function App() {
  const [user, setUser] = useState('u1');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notif, setNotif] = useState<NotificationSchema[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [settings, setSettings] = useState<Settings>({ theme: 'light', email: true });
  const [cache, setCache] = useState<Record<string, Profile>>({});

  const profileToken = useRef(0);
  const notifToken = useRef(0);

  useEffect(() => {
    let t = ++profileToken.current;
    setProfile(null);
    fetchProfile(user).then((p) => {
      if (t === profileToken.current) {
        setProfile(p);
      }
    });
  }, [user]);

  useEffect(() => {
    const list = Object.values(profiles)
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({ id: p.id, name: p.name }));
    setResults(list);
  }, [query]);

  useEffect(() => {
    let t = ++notifToken.current;
    fetchNotif(user).then((n) => {
      if (t === notifToken.current) {
        setNotif(n);
      }
    });
  }, [user]);

  const unreadCount = useMemo(() => notif.filter((n) => !n.read).length, [notif]);

  const markRead = useCallback((id: string) => {
    setNotif((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  useEffect(() => {
    if (profile) {
      setCache((prev) => ({
        ...prev,
        [user]: profile
      }));
    }
  }, [profile, user]);

  const handleSaveSettings = (s: Settings) => {
    setSettings((prev) => ({
      ...prev,
      ...s
    }));
  };

  return (
    <div className="app">
      <div className="card">
        <h2>User Dashboard</h2>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <select aria-label="Switch user" value={user} onChange={(e: ChangeEvent<HTMLSelectElement>) => setUser(e.target.value)}>
            <option value="u1">u1</option>
            <option value="u2">u2</option>
            <option value="u3">u3</option>
          </select>
          <input
            placeholder="Search name…"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }} className="small">
          Unread: {unreadCount}
        </div>

        <div className="list" aria-label="Search results">
          {results.map((r) => (
            <div className="row" key={r.id}>
              <div>
                <strong>{r.name}</strong>
              </div>
              <button className="secondary" onClick={() => setUser(r.id)}>
                Load
              </button>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 16 }}>Profile</h3>
        <div className="card small">
          {profile ? (
            <div>
              <div>{profile.name}</div>
              <div>{profile.email}</div>
            </div>
          ) : (
            'No profile'
          )}
        </div>

        <h3 style={{ marginTop: 16 }}>Notifications</h3>
        <div className="card">
          {notif.map((n) => (
            <NotificationItem key={n.id} item={n} onRead={markRead} />
          ))}
        </div>
      </div>

      <div>
        <SettingsPanel userId={user} settings={settings} onSave={handleSaveSettings} />
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Debug Cache</h3>
          <pre>{JSON.stringify(cache, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

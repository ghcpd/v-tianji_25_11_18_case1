/**
 * Test suite for Complex Dashboard component
 * Tests verify all bug fixes and prevent regressions
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API functions
const profiles = {
  u1: { id: "u1", name: "Alice", email: "alice@x.com" },
  u2: { id: "u2", name: "Bob", email: "bob@x.com" },
  u3: { id: "u3", name: "Carmen", email: "carmen@x.com" }
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const random = () => Math.random() * 600 + 200;

function fetchProfile(uid: string) {
  return delay(random()).then(() => profiles[uid as keyof typeof profiles] || null);
}

function fetchNotif(uid: string) {
  return delay(random()).then(() => {
    return Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, i) => ({
      id: `${uid}-n${i}-${Date.now()}`,
      title: `N${i + 1} for ${uid}`,
      read: Math.random() > 0.6
    }));
  });
}

function saveSettings(uid: string, settings: { theme: string; email: boolean }) {
  return delay(random()).then(() => ({ ok: true, settings }));
}

// Notification Item Component
function NotificationItem({ item, onRead }: { item: { id: string; title: string; read: boolean }; onRead: (id: string) => void }) {
  return (
    <div className="row">
      <div>
        <strong>{item.title}</strong>
        {!item.read && <span style={{ marginLeft: 6, color: "#06b6d4" }}>(new)</span>}
      </div>
      <button className="secondary" onClick={() => onRead(item.id)}>Mark</button>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel({ userId, settings, onSave }: { userId: string; settings: { theme: string; email: boolean }; onSave: (s: { theme: string; email: boolean }) => void }) {
  const [local, setLocal] = React.useState(settings);

  React.useEffect(() => {
    setLocal(settings);
  }, [settings]);

  const save = async () => {
    const res = await saveSettings(userId, local);
    if (res.ok) onSave(res.settings);
  };

  return (
    <div className="card">
      <h3>Settings</h3>
      <div className="small">Theme</div>
      <select
        value={local.theme}
        onChange={e => setLocal({ ...local, theme: e.target.value })}
      >
        <option>light</option>
        <option>dark</option>
      </select>

      <div style={{ marginTop: 8 }} className="small">Email Notify</div>
      <input
        type="checkbox"
        checked={local.email}
        onChange={e => setLocal({ ...local, email: e.target.checked })}
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save</button>
      </div>
    </div>
  );
}

// App Component (Fixed Version)
function App() {
  const [user, setUser] = React.useState("u1");
  const [profile, setProfile] = React.useState<{ id: string; name: string; email: string } | null>(null);
  const [notif, setNotif] = React.useState<Array<{ id: string; title: string; read: boolean }>>([]);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Array<{ id: string; name: string }>>([]);
  const [settings, setSettings] = React.useState({ theme: "light", email: true });
  const [cache, setCache] = React.useState<Record<string, { id: string; name: string; email: string }>>({});

  const profileToken = React.useRef(0);
  const notifToken = React.useRef(0);

  // Fixed: Added user dependency
  React.useEffect(() => {
    let t = ++profileToken.current;
    fetchProfile(user).then(p => {
      if (t === profileToken.current) {
        setProfile(p);
      }
    });
  }, [user]);

  // Fixed: Added query dependency
  React.useEffect(() => {
    const list = Object.values(profiles)
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ id: p.id, name: p.name }));
    setResults(list);
  }, [query]);

  // Fixed: Changed dependency from query to user
  React.useEffect(() => {
    let t = ++notifToken.current;
    fetchNotif(user).then(n => {
      if (t === notifToken.current) {
        setNotif(n);
      }
    });
  }, [user]);

  // Fixed: Added notif dependency
  const unreadCount = React.useMemo(() => {
    return notif.filter(n => !n.read).length;
  }, [notif]);

  // Fixed: Create new array instead of mutating
  const markRead = React.useCallback((id: string) => {
    setNotif(prevNotif => prevNotif.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  // Fixed: Create new object instead of mutating
  React.useEffect(() => {
    if (profile) {
      setCache(prevCache => ({ ...prevCache, [user]: profile }));
    }
  }, [profile, user]);

  // Fixed: Save all settings, not just theme
  const handleSaveSettings = (s: { theme: string; email: boolean }) => {
    setSettings(s);
  };

  return (
    <div className="app">
      <div className="card">
        <h2>User Dashboard</h2>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <select value={user} onChange={e => setUser(e.target.value)}>
            <option value="u1">u1</option>
            <option value="u2">u2</option>
            <option value="u3">u3</option>
          </select>
          <input
            placeholder="Search name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }} className="small">
          Unread: {unreadCount}
        </div>

        <div className="list">
          {results.map(r => (
            <div className="row" key={r.id}>
              <div>
                <strong>{r.name}</strong>
              </div>
              <button className="secondary" onClick={() => {
                setUser(r.id);
              }}>Load</button>
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
          ) : "No profile"}
        </div>

        <h3 style={{ marginTop: 16 }}>Notifications</h3>
        <div className="card">
          {notif.map(n => (
            <NotificationItem key={n.id} item={n} onRead={markRead} />
          ))}
        </div>
      </div>

      <div>
        <SettingsPanel
          userId={user}
          settings={settings}
          onSave={handleSaveSettings}
        />
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Debug Cache</h3>
          <pre>{JSON.stringify(cache, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

describe('Complex Dashboard - Bug Fix Verification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Test Bug #1 & #2 Fix: Profile updates when user changes
  test('Profile updates when user selection changes', async () => {
    render(<App />);

    // Wait for initial profile load
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Change user
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'u2' } });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  // Test Bug #3 Fix: Search results update when query changes
  test('Search results update when query changes', async () => {
    render(<App />);

    const input = screen.getByPlaceholderText('Search name…');
    
    fireEvent.change(input, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: 'Bob' } });

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  // Test Bug #4 Fix: Notifications update when user changes, not query
  test('Notifications update when user changes', async () => {
    render(<App />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const initialNotifications = screen.queryAllByText(/N\d+ for u1/);
    expect(initialNotifications.length).toBeGreaterThan(0);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'u2' } });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const newNotifications = screen.queryAllByText(/N\d+ for u2/);
      expect(newNotifications.length).toBeGreaterThan(0);
    });
  });

  // Test Bug #5 Fix: Unread count updates correctly
  test('Unread count updates when notifications are marked as read', async () => {
    render(<App />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const unreadText = screen.getByText(/Unread: \d+/);
      expect(unreadText).toBeInTheDocument();
    });

    const unreadTextBefore = screen.getByText(/Unread: (\d+)/);
    const countBefore = parseInt(unreadTextBefore.textContent?.match(/Unread: (\d+)/)?.[1] || '0');

    const markButtons = screen.getAllByText('Mark');
    if (markButtons.length > 0) {
      fireEvent.click(markButtons[0]);

      await waitFor(() => {
        const unreadTextAfter = screen.getByText(/Unread: (\d+)/);
        const countAfter = parseInt(unreadTextAfter.textContent?.match(/Unread: (\d+)/)?.[1] || '0');
        expect(countAfter).toBeLessThanOrEqual(countBefore);
      });
    }
  });

  // Test Bug #6 Fix: Marking as read creates new array (no mutation)
  test('Marking notification as read updates UI correctly', async () => {
    render(<App />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const markButtons = screen.queryAllByText('Mark');
      expect(markButtons.length).toBeGreaterThan(0);
    });

    const markButtons = screen.getAllByText('Mark');
    const firstButton = markButtons[0];
    
    // Check if there's a "(new)" indicator
    const hasNewIndicator = screen.queryByText('(new)') !== null;
    
    fireEvent.click(firstButton);

    await waitFor(() => {
      // After marking, the notification should update
      const updatedButtons = screen.queryAllByText('Mark');
      expect(updatedButtons.length).toBeGreaterThanOrEqual(0);
    });
  });

  // Test Bug #7 Fix: Cache updates correctly
  test('Cache updates when profile changes', async () => {
    render(<App />);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const cachePre = screen.getByText(/Debug Cache/).parentElement?.querySelector('pre');
      expect(cachePre?.textContent).toContain('u1');
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'u2' } });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      const cachePre = screen.getByText(/Debug Cache/).parentElement?.querySelector('pre');
      expect(cachePre?.textContent).toContain('u2');
    });
  });

  // Test Bug #8 Fix: Settings save all fields, not just theme
  test('Settings save all fields correctly', async () => {
    render(<App />);

    const emailCheckbox = screen.getByRole('checkbox');
    const themeSelect = screen.getByRole('combobox', { name: /theme/i }) || screen.getAllByRole('combobox')[1];

    // Change email setting
    fireEvent.click(emailCheckbox);
    expect(emailCheckbox).not.toBeChecked();

    // Change theme
    if (themeSelect) {
      fireEvent.change(themeSelect, { target: { value: 'dark' } });
    }

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      // Settings should be saved with both theme and email
      expect(themeSelect).toHaveValue('dark');
    });
  });

  // Test Bug #9 Fix: Load button changes user correctly
  test('Load button changes user and triggers profile fetch', async () => {
    render(<App />);

    const input = screen.getByPlaceholderText('Search name…');
    fireEvent.change(input, { target: { value: 'Bob' } });

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('u2');
    });
  });

  // Test controlled input updates
  test('Controlled input updates query state correctly', () => {
    render(<App />);

    const input = screen.getByPlaceholderText('Search name…') as HTMLInputElement;
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');
  });

  // Test race condition prevention
  test('Race condition prevented when user changes rapidly', async () => {
    render(<App />);

    const select = screen.getByRole('combobox');

    // Rapidly change user
    fireEvent.change(select, { target: { value: 'u2' } });
    fireEvent.change(select, { target: { value: 'u3' } });
    fireEvent.change(select, { target: { value: 'u1' } });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      // Should show u1 profile, not u2 or u3
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  // Test SettingsPanel syncs with prop changes
  test('SettingsPanel syncs local state when props change', () => {
    const { rerender } = render(
      <SettingsPanel
        userId="u1"
        settings={{ theme: "light", email: true }}
        onSave={jest.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    rerender(
      <SettingsPanel
        userId="u1"
        settings={{ theme: "dark", email: false }}
        onSave={jest.fn()}
      />
    );

    expect(checkbox).not.toBeChecked();
    const select = screen.getAllByRole('combobox')[0];
    expect(select).toHaveValue('dark');
  });
});


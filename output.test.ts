/**
 * Comprehensive Test Suite for UI Bug Fixes
 * Testing: React state, async behavior, controlled inputs, rendering logic, and race conditions
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Mock profiles data
const profiles = {
  u1: { id: 'u1', name: 'Alice', email: 'alice@x.com' },
  u2: { id: 'u2', name: 'Bob', email: 'bob@x.com' },
  u3: { id: 'u3', name: 'Carmen', email: 'carmen@x.com' },
};

// Mock API functions
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const fetchProfile = jest.fn((uid: string) => {
  return delay(50).then(() => profiles[uid as keyof typeof profiles] || null);
});

const fetchNotif = jest.fn((uid: string) => {
  return delay(50).then(() => {
    return Array.from({ length: 2 }).map((_, i) => ({
      id: `${uid}-n${i}-${Date.now()}`,
      title: `N${i + 1} for ${uid}`,
      read: i === 0, // First notification is read
    }));
  });
});

const saveSettings = jest.fn((uid: string, settings: any) => {
  return delay(50).then(() => ({ ok: true, settings }));
});

// Component implementations for testing
const { useState, useEffect, useMemo, useCallback, useRef } = React;

interface NotificationItemProps {
  item: { id: string; title: string; read: boolean };
  onRead: (id: string) => void;
}

function NotificationItem({ item, onRead }: NotificationItemProps) {
  return (
    <div className="row" data-testid={`notif-${item.id}`}>
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

interface SettingsPanelProps {
  userId: string;
  settings: { theme: string; email: boolean };
  onSave: (settings: { theme: string; email: boolean }) => void;
}

function SettingsPanel({ userId, settings, onSave }: SettingsPanelProps) {
  const [local, setLocal] = useState(settings);

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
        data-testid="theme-select"
      >
        <option>light</option>
        <option>dark</option>
      </select>

      <div style={{ marginTop: 8 }} className="small">
        Email Notify
      </div>
      <input
        type="checkbox"
        checked={local.email}
        onChange={e => setLocal({ ...local, email: e.target.checked })}
        data-testid="email-checkbox"
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={save} data-testid="save-button">
          Save
        </button>
      </div>
    </div>
  );
}

// Fixed App Component
function App() {
  const [user, setUser] = useState('u1');
  const [profile, setProfile] = useState<any>(null);
  const [notif, setNotif] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [settings, setSettings] = useState({ theme: 'light', email: true });
  const [cache, setCache] = useState<Record<string, any>>({});

  const profileToken = useRef(0);
  const notifToken = useRef(0);

  // Fixed Bug #1 & #2: Added [user] dependency
  useEffect(() => {
    let t = ++profileToken.current;
    fetchProfile(user).then(p => {
      if (t === profileToken.current) {
        setProfile(p);
      }
    });
  }, [user]);

  // Fixed Bug #3: Added [query] dependency
  useEffect(() => {
    const list = Object.values(profiles)
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ id: p.id, name: p.name }));
    setResults(list);
  }, [query]);

  // Fixed Bug #4: Changed dependency from [query] to [user]
  useEffect(() => {
    let t = ++notifToken.current;
    fetchNotif(user).then(n => {
      if (t === notifToken.current) {
        setNotif(n);
      }
    });
  }, [user]);

  // Fixed Bug #5: Added [notif] dependency
  const unreadCount = useMemo(() => {
    return notif.filter(n => !n.read).length;
  }, [notif]);

  // Fixed Bug #6: Immutable update instead of mutation
  const markRead = useCallback((id: string) => {
    setNotif(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  // Fixed Bug #7: Create new object for cache update
  useEffect(() => {
    if (profile) {
      setCache(prev => ({ ...prev, [user]: profile }));
    }
  }, [profile, user]);

  // Fixed Bug #8: Spread entire settings object
  const handleSaveSettings = (s: any) => {
    setSettings(s);
  };

  return (
    <div className="app">
      <div className="card">
        <h2>User Dashboard</h2>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <select value={user} onChange={e => setUser(e.target.value)} data-testid="user-select">
            <option value="u1">u1</option>
            <option value="u2">u2</option>
            <option value="u3">u3</option>
          </select>
          <input
            placeholder="Search name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>

        <div style={{ marginTop: 12 }} className="small" data-testid="unread-count">
          Unread: {unreadCount}
        </div>

        <div className="list">
          {results.map(r => (
            <div className="row" key={r.id} data-testid={`result-${r.id}`}>
              <div>
                <strong>{r.name}</strong>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  setUser(r.id);
                }}
                data-testid={`load-${r.id}`}
              >
                Load
              </button>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 16 }}>Profile</h3>
        <div className="card small" data-testid="profile-display">
          {profile ? (
            <div>
              <div data-testid="profile-name">{profile.name}</div>
              <div data-testid="profile-email">{profile.email}</div>
            </div>
          ) : (
            'No profile'
          )}
        </div>

        <h3 style={{ marginTop: 16 }}>Notifications</h3>
        <div className="card">
          {notif.map(n => (
            <NotificationItem key={n.id} item={n} onRead={markRead} />
          ))}
        </div>
      </div>

      <div>
        <SettingsPanel userId={user} settings={settings} onSave={handleSaveSettings} />
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Debug Cache</h3>
          <pre data-testid="cache-display">{JSON.stringify(cache, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

describe('UI Bug Fixes - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bug #1 & #2: Profile fetching with correct dependencies and race condition handling', () => {
    test('should fetch profile on initial mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(fetchProfile).toHaveBeenCalledWith('u1');
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice');
        expect(screen.getByTestId('profile-email')).toHaveTextContent('alice@x.com');
      });
    });

    test('should fetch new profile when user changes', async () => {
      render(<App />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice');
      });

      // Change user
      const userSelect = screen.getByTestId('user-select');
      fireEvent.change(userSelect, { target: { value: 'u2' } });

      await waitFor(() => {
        expect(fetchProfile).toHaveBeenCalledWith('u2');
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Bob');
        expect(screen.getByTestId('profile-email')).toHaveTextContent('bob@x.com');
      });
    });

    test('should handle profile fetch race conditions correctly', async () => {
      let resolvers: Array<(value: any) => void> = [];
      fetchProfile.mockImplementation((uid: string) => {
        return new Promise(resolve => {
          resolvers.push(() => resolve(profiles[uid as keyof typeof profiles]));
        });
      });

      render(<App />);

      // Change user rapidly
      const userSelect = screen.getByTestId('user-select');
      fireEvent.change(userSelect, { target: { value: 'u2' } });
      fireEvent.change(userSelect, { target: { value: 'u3' } });

      // Resolve u3 first (most recent)
      await act(async () => {
        resolvers[2]();
        await Promise.resolve();
      });

      // Resolve older requests
      await act(async () => {
        resolvers[0]();
        resolvers[1]();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Carmen');
      });
    });
  });

  describe('Bug #3: Search results update with query changes', () => {
    test('should show all results initially when query is empty', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('result-u1')).toBeInTheDocument();
        expect(screen.getByTestId('result-u2')).toBeInTheDocument();
        expect(screen.getByTestId('result-u3')).toBeInTheDocument();
      });
    });

    test('should filter results when query changes', async () => {
      render(<App />);

      const searchInput = screen.getByTestId('search-input');
      
      await userEvent.type(searchInput, 'ali');

      await waitFor(() => {
        expect(screen.getByTestId('result-u1')).toBeInTheDocument();
        expect(screen.queryByTestId('result-u2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('result-u3')).not.toBeInTheDocument();
      });
    });

    test('should update results dynamically as user types', async () => {
      render(<App />);

      const searchInput = screen.getByTestId('search-input');
      
      await userEvent.type(searchInput, 'b');
      await waitFor(() => {
        expect(screen.getByTestId('result-u2')).toBeInTheDocument();
        expect(screen.queryByTestId('result-u1')).not.toBeInTheDocument();
      });

      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'car');
      await waitFor(() => {
        expect(screen.getByTestId('result-u3')).toBeInTheDocument();
        expect(screen.queryByTestId('result-u1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('result-u2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Bug #4: Notifications fetch on correct dependency (user, not query)', () => {
    test('should fetch notifications for current user', async () => {
      render(<App />);

      await waitFor(() => {
        expect(fetchNotif).toHaveBeenCalledWith('u1');
      });
    });

    test('should refetch notifications when user changes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(fetchNotif).toHaveBeenCalledWith('u1');
      });

      const userSelect = screen.getByTestId('user-select');
      fireEvent.change(userSelect, { target: { value: 'u2' } });

      await waitFor(() => {
        expect(fetchNotif).toHaveBeenCalledWith('u2');
      });
    });

    test('should NOT refetch notifications when query changes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(fetchNotif).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'test');

      // Wait a bit to ensure no additional calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(fetchNotif).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bug #5: Unread count updates correctly', () => {
    test('should display correct initial unread count', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 1');
      });
    });

    test('should update unread count when notification is marked as read', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 1');
      });

      // Find and click mark button for unread notification
      const markButtons = screen.getAllByText('Mark');
      fireEvent.click(markButtons[1]); // Second notification is unread

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 0');
      });
    });

    test('should update unread count when user changes (new notifications)', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 1');
      });

      const userSelect = screen.getByTestId('user-select');
      fireEvent.change(userSelect, { target: { value: 'u2' } });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 1');
      });
    });
  });

  describe('Bug #6: Mark as read immutable state update', () => {
    test('should mark notification as read without mutation', async () => {
      render(<App />);

      await waitFor(() => {
        const markButtons = screen.getAllByText('Mark');
        expect(markButtons.length).toBeGreaterThan(0);
      });

      // Get unread notification (second one)
      const unreadNotifications = screen.getAllByText(/\(new\)/);
      expect(unreadNotifications.length).toBe(1);

      const markButtons = screen.getAllByText('Mark');
      fireEvent.click(markButtons[1]);

      await waitFor(() => {
        expect(screen.queryByText(/\(new\)/)).not.toBeInTheDocument();
      });
    });

    test('should trigger re-render when marking as read', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 1');
      });

      const markButtons = screen.getAllByText('Mark');
      const initialCount = screen.getByTestId('unread-count').textContent;

      fireEvent.click(markButtons[1]);

      await waitFor(() => {
        const newCount = screen.getByTestId('unread-count').textContent;
        expect(newCount).not.toBe(initialCount);
        expect(newCount).toBe('Unread: 0');
      });
    });
  });

  describe('Bug #7: Cache updates with new object reference', () => {
    test('should update cache when profile loads', async () => {
      render(<App />);

      await waitFor(() => {
        const cacheDisplay = screen.getByTestId('cache-display');
        const cacheContent = JSON.parse(cacheDisplay.textContent || '{}');
        expect(cacheContent.u1).toEqual({
          id: 'u1',
          name: 'Alice',
          email: 'alice@x.com',
        });
      });
    });

    test('should accumulate multiple profiles in cache', async () => {
      render(<App />);

      await waitFor(() => {
        const cacheDisplay = screen.getByTestId('cache-display');
        const cacheContent = JSON.parse(cacheDisplay.textContent || '{}');
        expect(cacheContent.u1).toBeDefined();
      });

      const userSelect = screen.getByTestId('user-select');
      fireEvent.change(userSelect, { target: { value: 'u2' } });

      await waitFor(() => {
        const cacheDisplay = screen.getByTestId('cache-display');
        const cacheContent = JSON.parse(cacheDisplay.textContent || '{}');
        expect(cacheContent.u1).toBeDefined();
        expect(cacheContent.u2).toEqual({
          id: 'u2',
          name: 'Bob',
          email: 'bob@x.com',
        });
      });
    });
  });

  describe('Bug #8: Settings save preserves all fields', () => {
    test('should save both theme and email settings', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('theme-select')).toBeInTheDocument();
      });

      const themeSelect = screen.getByTestId('theme-select');
      const emailCheckbox = screen.getByTestId('email-checkbox');
      const saveButton = screen.getByTestId('save-button');

      // Change both settings
      fireEvent.change(themeSelect, { target: { value: 'dark' } });
      fireEvent.click(emailCheckbox); // Toggle to false

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveSettings).toHaveBeenCalledWith('u1', {
          theme: 'dark',
          email: false,
        });
      });
    });

    test('should preserve email setting when only theme changes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('theme-select')).toBeInTheDocument();
      });

      const themeSelect = screen.getByTestId('theme-select');
      const saveButton = screen.getByTestId('save-button');

      fireEvent.change(themeSelect, { target: { value: 'dark' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveSettings).toHaveBeenCalledWith('u1', {
          theme: 'dark',
          email: true, // Should preserve original email setting
        });
      });
    });
  });

  describe('Bug #9: Manual profile load updates user state correctly', () => {
    test('should update user state when clicking Load button', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice');
      });

      // Search for Bob
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'bob');

      await waitFor(() => {
        expect(screen.getByTestId('load-u2')).toBeInTheDocument();
      });

      // Click Load for Bob
      const loadButton = screen.getByTestId('load-u2');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Bob');
        expect(screen.getByTestId('profile-email')).toHaveTextContent('bob@x.com');
      });
    });

    test('should trigger notification fetch when loading via search result', async () => {
      render(<App />);

      await waitFor(() => {
        expect(fetchNotif).toHaveBeenCalledWith('u1');
      });

      const initialCallCount = fetchNotif.mock.calls.length;

      // Load u2 via search
      const searchInput = screen.getByTestId('search-input');
      await userEvent.type(searchInput, 'bob');

      const loadButton = screen.getByTestId('load-u2');
      fireEvent.click(loadButton);

      await waitFor(() => {
        expect(fetchNotif).toHaveBeenCalledWith('u2');
        expect(fetchNotif.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    test('should update cache correctly when loading via Load button', async () => {
      render(<App />);

      await waitFor(() => {
        const cacheDisplay = screen.getByTestId('cache-display');
        const cacheContent = JSON.parse(cacheDisplay.textContent || '{}');
        expect(cacheContent.u1).toBeDefined();
      });

      // Load u3 via search
      const searchInput = screen.getByTestId('search-input');
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'carmen');

      const loadButton = screen.getByTestId('load-u3');
      fireEvent.click(loadButton);

      await waitFor(() => {
        const cacheDisplay = screen.getByTestId('cache-display');
        const cacheContent = JSON.parse(cacheDisplay.textContent || '{}');
        expect(cacheContent.u3).toEqual({
          id: 'u3',
          name: 'Carmen',
          email: 'carmen@x.com',
        });
      });
    });
  });

  describe('Integration: Complex user workflows', () => {
    test('should handle rapid user switching with correct state updates', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice');
      });

      const userSelect = screen.getByTestId('user-select');

      // Rapid switches
      fireEvent.change(userSelect, { target: { value: 'u2' } });
      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Bob');
      });

      fireEvent.change(userSelect, { target: { value: 'u3' } });
      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Carmen');
      });

      fireEvent.change(userSelect, { target: { value: 'u1' } });
      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice');
      });
    });

    test('should maintain independent state for search and user selection', async () => {
      render(<App />);

      const searchInput = screen.getByTestId('search-input');
      const userSelect = screen.getByTestId('user-select');

      // Search for Bob
      await userEvent.type(searchInput, 'bob');
      await waitFor(() => {
        expect(screen.getByTestId('result-u2')).toBeInTheDocument();
      });

      // Change user to u3
      fireEvent.change(userSelect, { target: { value: 'u3' } });

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Carmen');
      });

      // Search results should still show only Bob
      expect(screen.getByTestId('result-u2')).toBeInTheDocument();
      expect(screen.queryByTestId('result-u1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('result-u3')).not.toBeInTheDocument();
    });
  });
});

const delay = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface Profile {
  id: string;
  name: string;
  email: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  read: boolean;
}

export interface Settings {
  theme: string;
  email: boolean;
}

export const profiles: Record<string, Profile> = {
  u1: { id: 'u1', name: 'Alice', email: 'alice@x.com' },
  u2: { id: 'u2', name: 'Bob', email: 'bob@x.com' },
  u3: { id: 'u3', name: 'Carmen', email: 'carmen@x.com' }
};

const randomDelay = () => Math.random() * 600 + 200;

export const fetchProfile = async (uid: string) => {
  if (!profiles[uid]) {
    await delay(randomDelay());
    return null;
  }
  await delay(randomDelay());
  return profiles[uid];
};

export const fetchNotif = async (uid: string) => {
  await delay(randomDelay());
  return Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, i) => ({
    id: `${uid}-n${i}-${Date.now()}`,
    title: `N${i + 1} for ${uid}`,
    read: Math.random() > 0.6
  }));
};

export const saveSettings = async (_uid: string, settings: Settings) => {
  await delay(randomDelay());
  return { ok: true, settings };
};

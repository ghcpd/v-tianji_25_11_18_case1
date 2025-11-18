import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import '@testing-library/jest-dom';
import { App } from './src/App';

jest.mock('./src/api', () => {
  const actual = jest.requireActual('./src/api');
  return {
    ...actual,
    fetchProfile: jest.fn(),
    fetchNotif: jest.fn(),
    saveSettings: jest.fn()
  };
});

type ApiModule = typeof import('./src/api');
const mockedApi = jest.requireMock('./src/api') as jest.Mocked<ApiModule>;
const actualApi = jest.requireActual<ApiModule>('./src/api');
type Profile = typeof actualApi.profiles[keyof typeof actualApi.profiles];
const defaultSettings = { theme: 'light', email: true };

describe('Complex dashboard regressions', () => {
  beforeEach(() => {
    mockedApi.fetchProfile.mockClear();
    mockedApi.fetchNotif.mockClear();
    mockedApi.saveSettings.mockClear();

    mockedApi.fetchProfile.mockResolvedValue(actualApi.profiles.u1);
    mockedApi.fetchNotif.mockResolvedValue([
      { id: 'u1-n0', title: 'N1 for u1', read: false }
    ]);
    mockedApi.saveSettings.mockResolvedValue({ ok: true, settings: defaultSettings });
  });

  test('search input filters the results list', async () => {
    render(React.createElement(App));

    const list = screen.getByLabelText('Search results');
    const search = await screen.findByPlaceholderText('Search name…');

    await userEvent.clear(search);
    await userEvent.type(search, 'bo');

    await waitFor(() => {
      expect(within(list).getByText('Bob')).toBeInTheDocument();
      expect(within(list).queryByText('Alice')).not.toBeInTheDocument();
    });
  });

  test('marking notifications read updates unread counter', async () => {
    render(React.createElement(App));

    await waitFor(() => expect(mockedApi.fetchNotif).toHaveBeenCalled());
    expect(screen.getByText('Unread: 1')).toBeInTheDocument();

    const markButtons = screen.getAllByRole('button', { name: 'Mark' });
    await userEvent.click(markButtons[0]);

    await waitFor(() => expect(screen.getByText('Unread: 0')).toBeInTheDocument());
  });

  test('load button respects latest profile fetch and avoids races', async () => {
    const controllers: Array<{ uid: string; resolve: (value: Profile | null) => void }> = [];
    mockedApi.fetchProfile.mockImplementation((uid: string) =>
      new Promise((resolve) => {
        controllers.push({ uid, resolve });
      })
    );

    render(React.createElement(App));

    await waitFor(() => expect(controllers.length).toBeGreaterThanOrEqual(1));
    const loadButtons = await screen.findAllByRole('button', { name: 'Load' });
    await userEvent.click(loadButtons[1]); // triggers second user fetch

    await waitFor(() => expect(controllers.length).toBe(2));

    controllers[1].resolve(actualApi.profiles.u2);
    await waitFor(() => expect(screen.getByText('bob@x.com')).toBeInTheDocument());

    controllers[0].resolve(actualApi.profiles.u1);
    await waitFor(() => expect(screen.getByText('bob@x.com')).toBeInTheDocument());
  });

  test('settings save preserves email toggle and updates theme', async () => {
    mockedApi.saveSettings.mockResolvedValue({ ok: true, settings: { theme: 'dark', email: false } });

    render(React.createElement(App));

    const checkbox = await screen.findByRole('checkbox');
    await userEvent.click(checkbox);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(saveButton);

    await waitFor(() => expect(checkbox).not.toBeChecked());
    expect(screen.getByDisplayValue('dark')).toBeInTheDocument();
  });

  test('notifications refetch when user changes', async () => {
    render(React.createElement(App));

    const select = await screen.findByLabelText('Switch user');
    await userEvent.selectOptions(select, 'u2');

    await waitFor(() => expect(mockedApi.fetchNotif).toHaveBeenCalledWith('u2'));
  });
});

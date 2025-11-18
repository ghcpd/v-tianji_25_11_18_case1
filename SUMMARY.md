Title: Evaluation of Model Performance in UI Debugging, Patch Creation, and Test Generation
Description: This evaluation measures the model’s ability to:
- Identify complex UI bugs
- Produce minimal and accurate patches
- Generate runnable automated tests

Detected Bugs:
1. Profile fetching ignored the `user` dependency, skipped clearing previous profile, and never canceled stale responses, so switching users showed wrong data.
2. Result filtering effect omitted the `query` dependency, so typing in the search box never updated the results list.
3. Notification loading subscribed to `query` instead of the selected user, causing stale data when the user changed.
4. `unreadCount` memoized without dependencies and relied on a mutated array, so the badge never reflected new reads.
5. `markRead` mutated the notification array and then reset the same reference, leaving state unchanged and unread counts stale.
6. Cache updates mutated `cache` directly and `setCache` reused the same object, so the debug cache UI never reflected new entries.
7. Settings save handler overwrote the saved profile with only the theme, dropping the email preference and controlled checkbox state.
8. Load buttons directly set the profile from the static list instead of invoking the fetch race logic, bypassing the token guard.

Fixes Applied:
- Tied the profile, notification, and result effects to their correct dependencies, cleared pending profile data on user change, and relied on cancellation tokens to avoid race overrides.
- Made memoized counts depend on actual notification data, rewrote `markRead` to produce new arrays, and stored cache updates immutably.
- Reworked the settings handler so it merges the entire settings object, and wired the load buttons to change the selected user instead of mutating state directly.
- Added accessible labels to the user selector and result list for deterministic querying in the regression suite.

Test Coverage:
- `output.test.ts` exercises controlled inputs, search filtering, unread-count updates, race-controlled profile loading, settings persistence, and notification refetching.
- Tests rely on mocked API implementations with deterministic resolves, and they guard against stale state by waiting for DOM updates through React Testing Library.
- `run_tests.sh` installs dependencies and runs `npm test`, though on the host it triggered a WSL update notice; alternative execution via `cmd /c npm.cmd test` completed successfully with the five tests above.

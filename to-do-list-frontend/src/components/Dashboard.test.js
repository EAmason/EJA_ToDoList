import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';

jest.mock(
  'react-router-dom',
  () => {
    const React = require('react');
    return {
      useNavigate: () => jest.fn(),
      MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    };
  },
  { virtual: true }
);

import { MemoryRouter } from 'react-router-dom';

beforeEach(() => {
  localStorage.setItem('userId', '1');
  // Mock fetch: GET returns empty array, POST echoes back with id
  global.fetch = jest.fn((url, opts) => {
    if (opts && opts.method === 'POST') {
      global.fetch._lastPost = { url, opts };
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 999, ...JSON.parse(opts.body) })
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

test(
    'Hides Hours Remaining when creating a new task and defaults HoursRemaining to EstimateHours on create.',
    async () => {
        
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );

        // Wait for the initial tasks fetch.
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Open a create modal.
        const createBtn = screen.getByRole('button', { name: /create task/i });
        userEvent.click(createBtn);

        // Hours Remaining input should NOT be present for the new task.
        expect(screen.queryByLabelText(/Hours Remaining/i)).toBeNull();

        // Fill in the required fields using nearby input fields because
        // the rendered labels are not programmatically linked.
        const nameLabel = screen.getByText(/Name/i);
        const nameInput = nameLabel.closest('div').querySelector('input');
        userEvent.type(nameInput, 'Test Task Title');

        const estimateLabel = screen.getByText(/Estimated Hours/i);
        const estimateInput = estimateLabel.closest('div').querySelector('input[type="number"]');
        userEvent.clear(estimateInput);
        userEvent.type(estimateInput, '8');

        // Save the task
        const saveBtn = screen.getByRole('button', { name: /save/i });
        userEvent.click(saveBtn);

        // Verify POST payload set HoursRemaining to EstimateHours
        await waitFor(() => {
            const last = global.fetch._lastPost;
            expect(last).toBeDefined();
            const body = JSON.parse(last.opts.body);
            expect(body.EstimateHours).toBe(8);
            expect(body.HoursRemaining).toBe(8);
        });
    }
);

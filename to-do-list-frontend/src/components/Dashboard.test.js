import React from 'react';
import { render, screen, within, waitFor, act, fireEvent } from '@testing-library/react';
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
  const createdTasks = [];

  global.fetch = jest.fn((url, opts) => {
    if (opts && opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      const created = { id: 999, ...body };
      createdTasks.push(created);
      global.fetch._lastPost = { url, opts };
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve(created)
      });
    }

    if (opts && opts.method === 'DELETE') {
      const taskId = parseInt(url.split('/').pop(), 10);
      const index = createdTasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        createdTasks.splice(index, 1);
      }
      return Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.resolve({})
      });
    }

    if (opts && opts.method === 'PUT') {
      const taskId = parseInt(url.split('/').pop(), 10);
      const body = JSON.parse(opts.body);
      const index = createdTasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        createdTasks[index] = { id: taskId, ...body };
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createdTasks[index])
      });
    }

    if (!opts || opts.method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createdTasks)
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
    'Dashboard renders correctly.',
    async () => {
        
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );

        // Wait for the initial tasks fetch.
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Verify static elements are present.
        expect(screen.getByText(/Task Tracker/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
        expect(screen.getByText(/no reminders for today/i)).toBeInTheDocument();
        expect(screen.getByText(/no overdue tasks/i)).toBeInTheDocument();
        expect(screen.getByText(/no tasks due soon/i)).toBeInTheDocument();
    }
);

test(
    'Default collapsed sections expand as expected.',
    async () => {
        
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );

        // Wait for the initial tasks fetch.
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Verify that the collapsed section text does not exist before expanding.
        expect(screen.queryByText(/no remaining tasks/i)).not.toBeInTheDocument();

        // Expand the Remaining Tasks section.
        const remainingCard = screen.getByText(/Remaining Tasks/i).closest('.category-card');
        const createBtn = within(remainingCard).getByRole('button', { name: /expand/i });
        await userEvent.click(createBtn);

        // Verify that the collapsed section text exists after expanding.
        expect(screen.getByText(/no remaining tasks/i)).toBeInTheDocument();
    }
);

test(
    'Task creation works.',
    async () => {
        
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );

        // Wait for the initial tasks fetch.
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Verify that no overdue tasks appear before task creation.
        expect(screen.getByText(/no overdue tasks/i)).toBeInTheDocument();

        // Open a create modal.
        const createBtn = screen.getByRole('button', { name: /create task/i });
        await userEvent.click(createBtn);

        // Fill in the required fields using nearby input fields because
        // the rendered labels are not programmatically linked.
        const nameLabel = screen.getByText(/Name/i);
        const nameInput = nameLabel.closest('div').querySelector('input');
        await userEvent.type(nameInput, 'Overdue Task Title');

        const estimateLabel = screen.getByText(/Estimated Hours/i);
        const estimateInput = estimateLabel.closest('div').querySelector('input[type="number"]');
        await userEvent.clear(estimateInput);
        await userEvent.type(estimateInput, '8');

        const priorityLabel = screen.getAllByText(/Priority/i).find(el => el.tagName.toLowerCase() === 'label');
        const prioritySelect = priorityLabel.closest('div').querySelector('select');
        await userEvent.selectOptions(prioritySelect, 'HighPriority');

        const formatDateTimeLocal = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        const overdueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const overdueValue = formatDateTimeLocal(overdueDate);

        const dueDateLabel = screen.getByText(/Due Date/i);
        const dueDateInput = dueDateLabel.closest('div').querySelector('input[type="datetime-local"]');
        fireEvent.change(dueDateInput, { target: { value: overdueValue } });

        // Save the task
        const saveBtn = screen.getByRole('button', { name: /save/i });
        await act(async () => {
          await userEvent.click(saveBtn);
        });

        // Verify save and refresh finished.
        await waitFor(() => expect(screen.getByText(/Task created/i)).toBeInTheDocument());

        // Verify that the new task appears in the Overdue section after creation.
        await waitFor(() => expect(screen.getByText(/Overdue Task Title/i)).toBeInTheDocument());
        expect(screen.queryByText(/no overdue tasks/i)).not.toBeInTheDocument();
    }
);

test(
    'Task deletion works.',
    async () => {
        
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );

        // Wait for the initial tasks fetch.
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Verify that no overdue tasks appear before task creation.
        expect(screen.getByText(/no overdue tasks/i)).toBeInTheDocument();

        // Open a create modal.
        const createBtn = screen.getByRole('button', { name: /create task/i });
        await userEvent.click(createBtn);

        // Fill in the required fields using nearby input fields because
        // the rendered labels are not programmatically linked.
        const nameLabel = screen.getByText(/Name/i);
        const nameInput = nameLabel.closest('div').querySelector('input');
        await userEvent.type(nameInput, 'Overdue Task Title');

        const estimateLabel = screen.getByText(/Estimated Hours/i);
        const estimateInput = estimateLabel.closest('div').querySelector('input[type="number"]');
        await userEvent.clear(estimateInput);
        await userEvent.type(estimateInput, '8');

        const priorityLabel = screen.getAllByText(/Priority/i).find(el => el.tagName.toLowerCase() === 'label');
        const prioritySelect = priorityLabel.closest('div').querySelector('select');
        await userEvent.selectOptions(prioritySelect, 'HighPriority');

        const formatDateTimeLocal = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        const overdueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const overdueValue = formatDateTimeLocal(overdueDate);

        const dueDateLabel = screen.getByText(/Due Date/i);
        const dueDateInput = dueDateLabel.closest('div').querySelector('input[type="datetime-local"]');
        fireEvent.change(dueDateInput, { target: { value: overdueValue } });

        // Save the task
        const saveBtn = screen.getByRole('button', { name: /save/i });
        await act(async () => {
          await userEvent.click(saveBtn);
        });

        // Verify save and refresh finished.
        await waitFor(() => expect(screen.getByText(/Task created/i)).toBeInTheDocument());

        // Verify that the new task appears in the Overdue section after creation.
        await waitFor(() => expect(screen.getByText(/Overdue Task Title/i)).toBeInTheDocument());
        expect(screen.queryByText(/no overdue tasks/i)).not.toBeInTheDocument();

        // Open the editing modal.
        const editBtn = screen.getByText(/Overdue Task Title/i);
        await userEvent.click(editBtn);

        // Mock the confirmation dialog to auto-confirm deletion
        window.confirm = jest.fn(() => true);

        const deleteBtn = screen.getByRole('button', { name: /delete/i });
        await userEvent.click(deleteBtn);

        await waitFor(() => expect(screen.queryByText(/Overdue Task Title/i)).not.toBeInTheDocument());
        expect(screen.getByText(/no overdue tasks/i)).toBeInTheDocument();
    }
);

test(
    'Task editing works.',
    async () => {
        
        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
        );

        // Wait for the initial tasks fetch.
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Verify that no overdue tasks appear before task creation.
        expect(screen.getByText(/no overdue tasks/i)).toBeInTheDocument();

        // Open a create modal.
        const createBtn = screen.getByRole('button', { name: /create task/i });
        await userEvent.click(createBtn);

        // Fill in the required fields using nearby input fields because
        // the rendered labels are not programmatically linked.
        const nameLabel = screen.getByText(/Name/i);
        const nameInput = nameLabel.closest('div').querySelector('input');
        await userEvent.type(nameInput, 'Overdue Task Title');

        const estimateLabel = screen.getByText(/Estimated Hours/i);
        const estimateInput = estimateLabel.closest('div').querySelector('input[type="number"]');
        await userEvent.clear(estimateInput);
        await userEvent.type(estimateInput, '8');

        const priorityLabel = screen.getAllByText(/Priority/i).find(el => el.tagName.toLowerCase() === 'label');
        const prioritySelect = priorityLabel.closest('div').querySelector('select');
        await userEvent.selectOptions(prioritySelect, 'HighPriority');

        const formatDateTimeLocal = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        const overdueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const overdueValue = formatDateTimeLocal(overdueDate);

        const dueDateLabel = screen.getByText(/Due Date/i);
        const dueDateInput = dueDateLabel.closest('div').querySelector('input[type="datetime-local"]');
        fireEvent.change(dueDateInput, { target: { value: overdueValue } });

        // Save the task
        const saveBtn = screen.getByRole('button', { name: /save/i });
        await act(async () => {
          await userEvent.click(saveBtn);
        });

        // Verify save and refresh finished.
        await waitFor(() => expect(screen.getByText(/Task created/i)).toBeInTheDocument());

        // Verify that the new task appears in the Overdue section after creation.
        await waitFor(() => expect(screen.getByText(/Overdue Task Title/i)).toBeInTheDocument());
        expect(screen.queryByText(/no overdue tasks/i)).not.toBeInTheDocument();

        // Open the editing modal.
        const editBtn = screen.getByText(/Overdue Task Title/i);
        await userEvent.click(editBtn);

        // Update the task title.
        const editNameLabel = screen.getByText(/Name/i);
        const editNameInput = editNameLabel.closest('div').querySelector('input');
        await userEvent.type(editNameInput, 'Edited Overdue Task Title');

        const editSaveBtn = screen.getByRole('button', { name: /save/i });
        await userEvent.click(editSaveBtn);

        // Verify that the task still exists, but with the updated title.
        await waitFor(() => expect(screen.queryByText(/no overdue tasks/i)).not.toBeInTheDocument());
        expect(screen.getByText(/Edited Overdue Task Title/i)).toBeInTheDocument();
    }
);

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
        await userEvent.click(createBtn);

        // Hours Remaining input should NOT be present for the new task.
        expect(screen.queryByLabelText(/Hours Remaining/i)).toBeNull();

        // Fill in the required fields using nearby input fields because
        // the rendered labels are not programmatically linked.
        const nameLabel = screen.getByText(/Name/i);
        const nameInput = nameLabel.closest('div').querySelector('input');
        await userEvent.type(nameInput, 'Test Task Title');

        const estimateLabel = screen.getByText(/Estimated Hours/i);
        const estimateInput = estimateLabel.closest('div').querySelector('input[type="number"]');
        await userEvent.clear(estimateInput);
        await userEvent.type(estimateInput, '8');

        // Save the task
        const saveBtn = screen.getByRole('button', { name: /save/i });
        await userEvent.click(saveBtn);

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

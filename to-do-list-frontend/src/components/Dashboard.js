import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import './Dashboard.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5082';

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [now, setNow] = useState(new Date());
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const successTimerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeTask(t) {
    // Support differing casing from backend
    return {
      id: t.id ?? t.Id,
      userId: t.userId ?? t.UserId,
      name: t.name ?? t.Name,
      description: t.description ?? t.Description,
      dueDate: t.dueDate ? new Date(t.dueDate) : (t.DueDate ? new Date(t.DueDate) : null),
      priority: t.priority ?? t.Priority,
      estimateHours: t.estimateHours ?? t.EstimateHours,
      hoursRemaining: t.hoursRemaining ?? t.HoursRemaining,
      status: t.status ?? t.Status,
      createdAt: t.createdAt ? new Date(t.createdAt) : (t.CreatedAt ? new Date(t.CreatedAt) : null),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : (t.UpdatedAt ? new Date(t.UpdatedAt) : null),
      completedAt: t.completedAt ? new Date(t.completedAt) : (t.CompletedAt ? new Date(t.CompletedAt) : null),
    };
  }

  // Fetch tasks for current user
  const fetchTasks = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      const parsed = data.map(t => ({ ...t }));
      setTasks(parsed.map(normalizeTask));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Categorization helpers
  const startOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const endOfDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  const categorize = (allTasks) => {
    const nowUtc = new Date();
    const todayStart = startOfDay(nowUtc);
    const todayEnd = endOfDay(nowUtc);
    const inOneWeek = new Date(nowUtc.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todaysReminders = allTasks.filter(t => t.priority === 'Reminder' && t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd);

    const upcomingReminders = allTasks.filter(t => t.priority === 'Reminder' && t.dueDate && t.dueDate > todayEnd && t.dueDate <= inOneWeek)
      .sort((a, b) => a.dueDate - b.dueDate);

    const overdue = allTasks.filter(t => t.dueDate && t.dueDate < nowUtc && t.status !== 'Completed')
      .sort((a, b) => a.dueDate - b.dueDate); // earliest past first -> furthest in past first

    // Reverse to get furthest in the past first.
    overdue.reverse();

    const dueSoon = allTasks.filter(t => t.dueDate && t.dueDate > nowUtc && t.dueDate <= inOneWeek && !(t.priority === 'Reminder'))
      .sort((a, b) => a.dueDate - b.dueDate);

    const recentlyCompleted = allTasks.filter(t => t.completedAt && t.completedAt >= new Date(nowUtc.getTime() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.completedAt - a.completedAt);

    const listedIds = new Set([
      ...todaysReminders.map(t => t.id),
      ...upcomingReminders.map(t => t.id),
      ...overdue.map(t => t.id),
      ...dueSoon.map(t => t.id),
      ...recentlyCompleted.map(t => t.id),
    ]);

    const remaining = allTasks.filter(t => !listedIds.has(t.id) && t.status !== 'Completed');

    return { todaysReminders, upcomingReminders, overdue, dueSoon, remaining, recentlyCompleted };
  };

  const groups = categorize(tasks);

  const displayDate = (d) => d ? new Date(d).toLocaleString() : '';

  const timeRemainingText = (due) => {
    if (!due) return '';
    const ms = due - new Date();
    if (ms <= 0) return 'Overdue';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day(s) left`;
    return `${hours} hour(s) left`;
  };

  const openTask = (task) => {
    setSelectedTask({ ...task });
    setShowModal(true);
  };
  const createNewTask = () => {
    const template = {
      id: null,
      name: '',
      description: '',
      dueDate: null,
      priority: 'MediumPriority',
      estimateHours: null,
      hoursRemaining: null,
      status: 'NotStarted',
    };
    setSelectedTask(template);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const saveTask = async () => {
    if (!selectedTask) return;
    setErrorMsg(null);
    const userId = localStorage.getItem('userId');
    const payload = {
      UserId: userId ? parseInt(userId, 10) : undefined,
      Name: selectedTask.name,
      Description: selectedTask.description,
      DueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString() : null,
      Priority: selectedTask.priority,
      EstimateHours: selectedTask.estimateHours,
      HoursRemaining: selectedTask.hoursRemaining,
      Status: selectedTask.status
    };

    try {
      let res;
      if (selectedTask.id) {
        res = await fetch(`${API_BASE}/api/tasks/${selectedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Update failed:', errorText);
          const message = errorText || 'Update failed';
          setErrorMsg(message);
          throw new Error(message);
        }
      } else {
        res = await fetch(`${API_BASE}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Create failed:', errorText);
          const message = errorText || 'Create failed';
          setErrorMsg(message);
          throw new Error(message);
        }
      }

      await fetchTasks();
      // Show temporary success cue
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      setErrorMsg(null);
      setSuccessMsg(selectedTask.id ? 'Task updated' : 'Task created');
      successTimerRef.current = setTimeout(() => setSuccessMsg(null), 3000);
      closeModal();
    } catch (err) {
      console.error(err);
      if (!errorMsg) {
        setErrorMsg(err.message || 'Failed to save task');
      }
    }
  };

  const deleteTask = async () => {
    if (!selectedTask || !selectedTask.id) return;
    const ok = window.confirm('Are you sure you want to delete this task?');
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${selectedTask.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchTasks();
      // Show temporary success cue
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      setSuccessMsg('Task deleted');
      successTimerRef.current = setTimeout(() => setSuccessMsg(null), 3000);
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Failed to delete task.');
    }
  };

  return (
    <Container fluid className="dashboard-wrapper">
      <div className="dashboard-header">
        <div>
          <h1>Task Tracker</h1>
          <div>{now.toLocaleString()} ({Intl.DateTimeFormat().resolvedOptions().timeZone})</div>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {successMsg && (
        <div style={{ margin: '12px 0' }}>
          <Alert variant="success" onClose={() => setSuccessMsg(null)} dismissible>{successMsg}</Alert>
        </div>
      )}
      {errorMsg && (
        <div style={{ margin: '12px 0' }}>
          <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>{errorMsg}</Alert>
        </div>
      )}

      <div style={{ textAlign: 'right', margin: '16px 0' }}>
        <Button variant="primary" onClick={createNewTask}>Create Task</Button>
      </div>

      <div className="dashboard-content">
        <Row>
          {/* Today's Reminders */}
          <Col md={12} className="mb-4">
            <Card className="category-card">
              <Card.Header>
                <Card.Title>Today's Reminders</Card.Title>
                <span className="task-count">{groups.todaysReminders.length} tasks</span>
              </Card.Header>
              <Card.Body>
                {groups.todaysReminders.length > 0 ? (
                  <ul className="task-list">
                    {groups.todaysReminders.map(task => (
                      <li key={task.id} className="task-item" onClick={() => openTask(task)} style={{cursor: 'pointer'}}>
                        <span className="task-title">{task.name}</span>
                        <span className="task-date">{displayDate(task.dueDate)}</span>
                        <span style={{marginLeft:12}}>{task.priority}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="no-tasks">No reminders for today.</p>}
              </Card.Body>
            </Card>
          </Col>

          {/* Upcoming Reminders */}
          <Col md={12} className="mb-4">
            <Card className="category-card">
              <Card.Header>
                <Card.Title>Upcoming Reminders</Card.Title>
                <span className="task-count">{groups.upcomingReminders.length} tasks</span>
              </Card.Header>
              <Card.Body>
                {groups.upcomingReminders.length > 0 ? (
                  <ul className="task-list">
                    {groups.upcomingReminders.map(task => (
                      <li key={task.id} className="task-item" onClick={() => openTask(task)} style={{cursor: 'pointer'}}>
                        <span className="task-title">{task.name}</span>
                        <span className="task-date">{displayDate(task.dueDate)}</span>
                        <span style={{marginLeft:12}}>{task.priority}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="no-tasks">No upcoming reminders.</p>}
              </Card.Body>
            </Card>
          </Col>

          {/* Overdue Tasks */}
          <Col md={12} className="mb-4">
            <Card className="category-card">
              <Card.Header>
                <Card.Title>Overdue Tasks</Card.Title>
                <span className="task-count">{groups.overdue.length} tasks</span>
              </Card.Header>
              <Card.Body>
                {groups.overdue.length > 0 ? (
                  <ul className="task-list">
                    {groups.overdue.map(task => (
                      <li key={task.id} className="task-item" onClick={() => openTask(task)} style={{cursor: 'pointer'}}>
                        <span className="task-title">{task.name}</span>
                        <span className="task-date">{displayDate(task.dueDate)}</span>
                        <span style={{marginLeft:12}}>{task.priority}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="no-tasks">No overdue tasks.</p>}
              </Card.Body>
            </Card>
          </Col>

          {/* Tasks Due Soon */}
          <Col md={12} className="mb-4">
            <Card className="category-card">
              <Card.Header>
                <Card.Title>Tasks Due Soon</Card.Title>
                <span className="task-count">{groups.dueSoon.length} tasks</span>
              </Card.Header>
              <Card.Body>
                {groups.dueSoon.length > 0 ? (
                  <ul className="task-list">
                    {groups.dueSoon.map(task => (
                      <li key={task.id} className="task-item" onClick={() => openTask(task)} style={{cursor: 'pointer'}}>
                        <span className="task-title">{task.name}</span>
                        <span className="task-date">{displayDate(task.dueDate)}</span>
                        <span style={{marginLeft:12}}>{task.priority}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="no-tasks">No tasks due soon.</p>}
              </Card.Body>
            </Card>
          </Col>

          {/* Remaining Tasks */}
          <Col md={12} className="mb-4">
            <Card className="category-card">
              <Card.Header>
                <Card.Title>Remaining Tasks</Card.Title>
                <span className="task-count">{groups.remaining.length} tasks</span>
              </Card.Header>
              <Card.Body>
                {groups.remaining.length > 0 ? (
                  <ul className="task-list">
                    {groups.remaining.map(task => (
                      <li key={task.id} className="task-item" onClick={() => openTask(task)} style={{cursor: 'pointer'}}>
                        <span className="task-title">{task.name}</span>
                        <span className="task-date">{displayDate(task.dueDate)}</span>
                        <span style={{marginLeft:12}}>{task.priority}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="no-tasks">No remaining tasks.</p>}
              </Card.Body>
            </Card>
          </Col>

          {/* Recently Completed Tasks */}
          <Col md={12} className="mb-4">
            <Card className="category-card">
              <Card.Header>
                <Card.Title>Recently Completed Tasks</Card.Title>
                <span className="task-count">{groups.recentlyCompleted.length} tasks</span>
              </Card.Header>
              <Card.Body>
                {groups.recentlyCompleted.length > 0 ? (
                  <ul className="task-list">
                    {groups.recentlyCompleted.map(task => (
                      <li key={task.id} className="task-item" onClick={() => openTask(task)} style={{cursor: 'pointer'}}>
                        <span className="task-title">{task.name}</span>
                        <span className="task-date">{displayDate(task.completedAt)}</span>
                        <span style={{marginLeft:12}}>{task.priority}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="no-tasks">No recently completed tasks.</p>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Task Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control value={selectedTask.name} onChange={e => setSelectedTask({...selectedTask, name: e.target.value})} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} value={selectedTask.description || ''} onChange={e => setSelectedTask({...selectedTask, description: e.target.value})} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Due Date (local)</Form.Label>
                <Form.Control type="datetime-local" value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().slice(0,16) : ''} onChange={e => setSelectedTask({...selectedTask, dueDate: new Date(e.target.value)})} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select value={selectedTask.priority} onChange={e => setSelectedTask({...selectedTask, priority: e.target.value})}>
                  <option>Urgent</option>
                  <option>HighPriority</option>
                  <option>MediumPriority</option>
                  <option>LowPriority</option>
                  <option>Optional</option>
                  <option>Reminder</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Estimate Hours</Form.Label>
                <Form.Control type="number" min="0" value={selectedTask.estimateHours ?? ''} onChange={e => setSelectedTask({...selectedTask, estimateHours: e.target.value ? parseInt(e.target.value,10) : null})} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hours Remaining</Form.Label>
                <Form.Control type="number" min="0" value={selectedTask.hoursRemaining ?? ''} onChange={e => setSelectedTask({...selectedTask, hoursRemaining: e.target.value ? parseInt(e.target.value,10) : null})} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select value={selectedTask.status} onChange={e => setSelectedTask({...selectedTask, status: e.target.value})}>
                  <option>NotStarted</option>
                  <option>InProgress</option>
                  <option>Completed</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedTask && selectedTask.id && <Button variant="danger" onClick={deleteTask}>Delete</Button>}
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={saveTask}>Save</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Dashboard;

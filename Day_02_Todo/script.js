/* Advanced To-Do — desktop-friendly + inline editing + drag/drop + export/import
   Single-file app logic. Save to script.js and open index.html.
*/

(() => {
  // DOM refs
  const addInput = document.getElementById('add-input');
  const addBtn = document.getElementById('add-btn');
  const addPriority = document.getElementById('add-priority');
  const addDue = document.getElementById('add-due');

  const taskList = document.getElementById('task-list');
  const taskCount = document.getElementById('task-count');
  const mobileCount = document.getElementById('mobile-count');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sortSelect = document.getElementById('sort-select');

  const themeToggle = document.getElementById('theme-toggle');
  const exportBtn = document.getElementById('export-btn');
  const importFile = document.getElementById('import-file');
  const clearBtn = document.getElementById('clear-btn');

  // details
  const detailsCard = document.getElementById('details-card');
  const detailsEmpty = document.getElementById('details-empty');
  const detailsPanel = document.getElementById('details-panel');
  const detailsEdit = document.getElementById('details-edit');
  const detailTitle = document.getElementById('detail-title');
  const detailNotes = document.getElementById('detail-notes');
  const detailPriority = document.getElementById('detail-priority');
  const detailDue = document.getElementById('detail-due');
  const detailTags = document.getElementById('detail-tags');
  const detailCreated = document.getElementById('detail-created');
  const detailUpdated = document.getElementById('detail-updated');

  const detailEditBtn = document.getElementById('detail-edit-btn');
  const detailDeleteBtn = document.getElementById('detail-delete-btn');

  const editTitle = document.getElementById('edit-title');
  const editNotes = document.getElementById('edit-notes');
  const editPriority = document.getElementById('edit-priority');
  const editDue = document.getElementById('edit-due');
  const editTags = document.getElementById('edit-tags');
  const editSave = document.getElementById('edit-save');
  const editCancel = document.getElementById('edit-cancel');

  // modal
  const taskModalEl = document.getElementById('taskModal');
  const modalTitle = document.getElementById('modal-title');
  const modalNotes = document.getElementById('modal-notes');
  const modalPriority = document.getElementById('modal-priority');
  const modalDue = document.getElementById('modal-due');
  const modalTags = document.getElementById('modal-tags');
  const modalEditBtn = document.getElementById('modal-edit-btn');
  const bsModal = new bootstrap.Modal(taskModalEl);

  // confirm modal
  const confirmModalEl = document.getElementById('confirmModal');
  const confirmModal = new bootstrap.Modal(confirmModalEl);
  const confirmTitle = document.querySelector('#confirmModal .modal-title');
  const confirmBody = document.querySelector('#confirmModal .modal-body');
  const confirmActionBtn = document.getElementById('confirm-action-btn');

  // toast
  const toastEl = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const bsToast = new bootstrap.Toast(toastEl, { delay: 1600 });

  // state
  let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  let selectedId = null;
  let currentFilter = 'all';
  let currentSearch = '';
  let currentSort = 'manual';
  let pendingAction = null;

  // helper: debounce
  function debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  // helper: save
  function save() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // helper: id
  function makeId() {
    return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7);
  }

  // format date
  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString();
    } catch { return iso; }
  }

  function showToast(msg) {
    toastMsg.textContent = msg;
    bsToast.show();
  }

  // escape text to avoid XSS
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"'`=\/]/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;' })[s]);
  }

  // Apply theme
  function loadTheme() {
    const t = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-bs-theme', t);
    themeToggle.innerHTML = t === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
  }
  loadTheme();

  themeToggle.addEventListener('click', () => {
    const cur = document.body.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
    const nxt = cur === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-bs-theme', nxt);
    localStorage.setItem('theme', nxt);
    themeToggle.innerHTML = nxt === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
  });

  // render list
  function renderList() {
    // filter + search + sort
    let list = [...tasks];

    // filter
    if (currentFilter === 'completed') list = list.filter(t => t.completed);
    if (currentFilter === 'pending') list = list.filter(t => !t.completed);

    // search
    if (currentSearch.trim()) {
      const q = currentSearch.toLowerCase();
      list = list.filter(t => {
        return (t.text?.toLowerCase().includes(q))
          || (t.notes?.toLowerCase().includes(q))
          || (t.tags?.join(',').toLowerCase().includes(q));
      });
    }

    // sort
    if (currentSort === 'created_desc') list.sort((a,b)=>b.createdAt - a.createdAt);
    if (currentSort === 'created_asc') list.sort((a,b)=>a.createdAt - b.createdAt);
    if (currentSort === 'due_asc') list.sort((a,b)=> {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due) - new Date(b.due);
    });
    if (currentSort === 'priority_desc') {
      const map = { high:3, medium:2, low:1 };
      list.sort((a,b)=> (map[b.priority]||0) - (map[a.priority]||0));
    }

    // clear list
    taskList.textContent = '';

    // build DOM with fragment
    const fragment = document.createDocumentFragment();
    list.forEach(task => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      if (task.completed) li.classList.add('completed');
      li.dataset.id = task.id;

      const mainFlex = document.createElement('div');
      mainFlex.className = 'd-flex align-items-start w-100';

      // checkbox
      const checkbox = document.createElement('input');
      checkbox.className = 'form-check-input me-3 mt-1';
      checkbox.type = 'checkbox';
      checkbox.dataset.action = 'toggle';
      checkbox.checked = task.completed;
      mainFlex.appendChild(checkbox);

      // content div
      const contentDiv = document.createElement('div');
      contentDiv.className = 'flex-grow-1';

      // title row
      const titleRow = document.createElement('div');
      titleRow.className = 'd-flex align-items-center';

      const titleSpan = document.createElement('div');
      titleSpan.className = 'task-title';
      titleSpan.textContent = task.text || 'Untitled';
      titleRow.appendChild(titleSpan);

      if (task.due) {
        const dueSmall = document.createElement('small');
        dueSmall.className = 'task-meta ms-2';
        dueSmall.textContent = `Due ${fmtDate(task.due)}`;
        titleRow.appendChild(dueSmall);
      }
      contentDiv.appendChild(titleRow);

      // meta row
      const metaDiv = document.createElement('div');
      metaDiv.className = 'mt-1 small text-muted';

      const prioritySpan = document.createElement('span');
      prioritySpan.className = `badge-priority priority-${task.priority || 'low'}`;
      prioritySpan.textContent = task.priority || 'low';
      metaDiv.appendChild(prioritySpan);

      if (task.tags && task.tags.length) {
        task.tags.forEach(tag => {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'badge bg-secondary ms-1 small';
          tagSpan.textContent = tag;
          metaDiv.appendChild(tagSpan);
        });
      }
      contentDiv.appendChild(metaDiv);

      mainFlex.appendChild(contentDiv);
      li.appendChild(mainFlex);

      // actions div
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'ms-2 d-flex align-items-center';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-link';
      editBtn.dataset.action = 'edit';
      editBtn.title = 'Inline edit';
      editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
      actionsDiv.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-link text-danger';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.title = 'Delete';
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(actionsDiv);
      fragment.appendChild(li);
    });
    taskList.appendChild(fragment);

    // counts
    const totalTasks = tasks.length;
    taskCount.textContent = `${totalTasks} tasks`;
    mobileCount.textContent = `${totalTasks} tasks`;

    // progress
    const completed = tasks.filter(t => t.completed).length;
    const pct = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${pct}%`;

    // Rebind sortable
    initSortable();

    // keep selected highlight
    highlightSelected();
  }

  // init Sortable for manual mode
  let sortableInstance = null;
  function initSortable() {
    if (sortableInstance) sortableInstance.destroy();
    if (currentSort !== 'manual') return;

    sortableInstance = Sortable.create(taskList, {
      animation: 160,
      handle: '.task-title',
      swapThreshold: 1,
      onEnd: evt => {
        const ids = Array.from(taskList.children).map(li => li.dataset.id);
        const newTasks = ids.map(id => tasks.find(t => t.id === id)).filter(Boolean);
        tasks.forEach(t => { if (!ids.includes(t.id)) newTasks.push(t); });
        tasks = newTasks;
        save();
      }
    });
  }

  // add task
  function addTaskFromInput() {
    const text = addInput.value.trim();
    if (!text) return;
    const t = {
      id: makeId(),
      text,
      notes: '',
      completed: false,
      priority: addPriority.value || 'medium',
      due: addDue.value || null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    tasks.unshift(t);
    save();
    renderList();
    addInput.value = '';
    addDue.value = '';
    addPriority.value = 'medium';
    showToast('Task added');
  }
  addBtn.addEventListener('click', addTaskFromInput);
  addInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTaskFromInput();
  });

  // delegation for list actions
  taskList.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    const actionBtn = e.target.closest('button[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      if (action === 'edit') {
        enableInlineEdit(id, li);
        return;
      }
      if (action === 'delete') {
        promptDeleteTask(id);
        return;
      }
    }

    const checkbox = e.target.closest('input[type="checkbox"][data-action="toggle"]');
    if (checkbox) {
      toggleComplete(id, checkbox.checked);
      return;
    }

    selectTask(id);
  });

  // enable inline edit
  function enableInlineEdit(id, li) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    li.textContent = '';

    const editRow = document.createElement('div');
    editRow.className = 'edit-row w-100';

    const titleInput = document.createElement('input');
    titleInput.className = 'form-control form-control-sm edit-title';
    titleInput.value = task.text;
    editRow.appendChild(titleInput);

    const prioritySelect = document.createElement('select');
    prioritySelect.className = 'form-select form-select-sm edit-priority';
    prioritySelect.style.width = '110px';
    ['low', 'medium', 'high'].forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      if (p === task.priority) opt.selected = true;
      prioritySelect.appendChild(opt);
    });
    editRow.appendChild(prioritySelect);

    const dueInput = document.createElement('input');
    dueInput.type = 'date';
    dueInput.className = 'form-control form-control-sm edit-due';
    dueInput.value = task.due || '';
    dueInput.style.width = '150px';
    editRow.appendChild(dueInput);

    const btnDiv = document.createElement('div');
    btnDiv.className = 'ms-2';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-sm btn-success btn-save';
    saveBtn.innerHTML = '<i class="bi bi-check"></i>';
    btnDiv.appendChild(saveBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-sm btn-secondary btn-cancel';
    cancelBtn.innerHTML = '<i class="bi bi-x"></i>';
    btnDiv.appendChild(cancelBtn);

    editRow.appendChild(btnDiv);
    li.appendChild(editRow);

    titleInput.focus();
    titleInput.select();

    saveBtn.addEventListener('click', () => {
      const newText = titleInput.value.trim();
      if (!newText) { showToast('Title required'); return; }
      task.text = newText;
      task.priority = prioritySelect.value;
      task.due = dueInput.value || null;
      task.updatedAt = Date.now();
      save();
      renderList();
      showToast('Task updated');
    }, { once: true });

    cancelBtn.addEventListener('click', () => {
      renderList();
    }, { once: true });
  }

  // toggle complete
  function toggleComplete(id, checked) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !!checked;
    task.updatedAt = Date.now();
    save();
    renderList();
  }

  // prompt delete task
  function promptDeleteTask(id) {
    confirmTitle.textContent = 'Confirm Delete';
    confirmBody.textContent = 'Are you sure you want to delete this task?';
    pendingAction = () => {
      tasks = tasks.filter(t => t.id !== id);
      if (selectedId === id) {
        selectedId = null;
        closeDetails();
      }
      save();
      renderList();
      showToast('Deleted');
    };
    confirmModal.show();
  }

  // select task
  function selectTask(id) {
    selectedId = id;
    highlightSelected();
    renderDetails();
    if (window.innerWidth < 992) {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      modalTitle.textContent = task.text;
      modalNotes.textContent = task.notes || '(no notes)';
      modalPriority.innerHTML = `<span class="badge priority-${task.priority}">${escapeHtml(task.priority)}</span>`;
      modalDue.textContent = task.due ? fmtDate(task.due) : '—';
      modalTags.innerHTML = (task.tags || []).map(tag => `<span class="badge bg-secondary me-1">${escapeHtml(tag)}</span>`).join('');
      bsModal.show();
    }
  }

  function highlightSelected() {
    taskList.querySelectorAll('li').forEach(li => {
      li.classList.toggle('active', li.dataset.id === selectedId);
    });
  }

  // render details
  function renderDetails() {
    if (!selectedId) return closeDetails();
    const t = tasks.find(x => x.id === selectedId);
    if (!t) return closeDetails();

    detailsEmpty.classList.add('d-none');
    detailsPanel.classList.remove('d-none');
    detailsEdit.classList.add('d-none');

    detailTitle.textContent = t.text;
    detailNotes.textContent = t.notes || '(no notes)';
    detailPriority.innerHTML = `<span class="badge priority-${t.priority}">${escapeHtml(t.priority)}</span>`;
    detailDue.textContent = t.due ? fmtDate(t.due) : '—';
    detailTags.innerHTML = (t.tags||[]).map(tag => `<span class="badge bg-secondary me-1">${escapeHtml(tag)}</span>`).join('');
    detailCreated.textContent = new Date(t.createdAt).toLocaleString();
    detailUpdated.textContent = new Date(t.updatedAt).toLocaleString();
  }

  function closeDetails() {
    selectedId = null;
    detailsPanel.classList.add('d-none');
    detailsEdit.classList.add('d-none');
    detailsEmpty.classList.remove('d-none');
  }

  // detail edit
  detailEditBtn.addEventListener('click', () => {
    const t = tasks.find(x => x.id === selectedId);
    if (!t) return;
    detailsPanel.classList.add('d-none');
    detailsEdit.classList.remove('d-none');
    editTitle.value = t.text || '';
    editNotes.value = t.notes || '';
    editPriority.value = t.priority || 'medium';
    editDue.value = t.due || '';
    editTags.value = (t.tags || []).join(', ');
  });

  editCancel.addEventListener('click', renderDetails);

  editSave.addEventListener('click', () => {
    const t = tasks.find(x => x.id === selectedId);
    if (!t) return;
    t.text = editTitle.value.trim() || t.text;
    t.notes = editNotes.value.trim();
    t.priority = editPriority.value;
    t.due = editDue.value || null;
    t.tags = editTags.value.split(',').map(s=>s.trim()).filter(Boolean);
    t.updatedAt = Date.now();
    save();
    renderList();
    renderDetails();
    showToast('Saved');
  });

  // detail delete
  detailDeleteBtn.addEventListener('click', () => {
    if (selectedId) promptDeleteTask(selectedId);
  });

  // modal edit
  modalEditBtn.addEventListener('click', () => {
    bsModal.hide();
    if (!selectedId) return;
    const li = taskList.querySelector(`li[data-id="${selectedId}"]`);
    if (li) enableInlineEdit(selectedId, li);
  });

  // confirm action handler
  confirmActionBtn.addEventListener('click', () => {
    if (pendingAction) pendingAction();
    confirmModal.hide();
    pendingAction = null;
  });

  // search + filter + sort
  const debouncedRender = debounce(renderList);
  searchInput.addEventListener('input', e => {
    currentSearch = e.target.value;
    debouncedRender();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  sortSelect.addEventListener('change', e => {
    currentSort = e.target.value;
    renderList();
  });

  // keyboard
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.toLowerCase() === 'n') { e.preventDefault(); addInput.focus(); }
    if (e.key === '/') { e.preventDefault(); searchInput.focus(); }
  });

  // export
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Export ready');
  });
//Abdur Rahaman shishir
  // import
  importFile.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid file');
        if (!confirm('Replace all tasks with imported tasks?')) return;
        tasks = parsed.map(x => ({
          id: x.id || makeId(),
          text: x.text || '',
          notes: x.notes || '',
          completed: !!x.completed,
          priority: x.priority || 'medium',
          due: x.due || null,
          tags: x.tags || [],
          createdAt: x.createdAt || Date.now(),
          updatedAt: x.updatedAt || Date.now()
        }));
        save();
        renderList();
        showToast('Imported');
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  });

  // clear
  clearBtn.addEventListener('click', () => {
    confirmTitle.textContent = 'Confirm Clear';
    confirmBody.textContent = 'Are you sure you want to delete all tasks?';
    pendingAction = () => {
      tasks = [];
      save();
      renderList();
      showToast('All cleared');
    };
    confirmModal.show();
  });

  // initial
  renderList();

  // sample if empty
  if (!tasks.length) {
    const sample = [
      { id: makeId(), text: 'Welcome to your new To-Do app', notes: 'Try adding tasks, drag to reorder, and open the details panel on the right (desktop).', completed: false, priority:'medium', due: null, tags:['welcome'], createdAt: Date.now(), updatedAt: Date.now() },
      { id: makeId(), text: 'Add a due date', notes: 'Use the date field when creating tasks.', completed: false, priority:'low', due: null, tags:[], createdAt: Date.now(), updatedAt: Date.now() }
    ];
    tasks = sample;
    save();
    renderList();
  }

  // Expose for testing
  window.__todo = { tasks, renderList, save, addTaskFromInput, selectTask };
})();
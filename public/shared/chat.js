/* Shared realtime chat controller for student + professor message pages. */
(function () {
  const E = Dash.escapeHTML;
  let me = null;
  let contacts = [];
  let activeId = null;
  let socket = null;

  const listEl = document.getElementById('contactList');
  const headEl = document.getElementById('chatHead');
  const bodyEl = document.getElementById('chatBody');
  const formEl = document.getElementById('chatForm');
  const textEl = document.getElementById('chatText');

  function totalUnread() {
    return contacts.reduce((sum, c) => sum + (c.unread || 0), 0);
  }

  function updateNavBadge() {
    const badge = document.getElementById('navChatBadge');
    if (!badge) return;
    const n = totalUnread();
    if (n > 0) { badge.textContent = n; badge.style.display = ''; }
    else badge.style.display = 'none';
  }

  function renderContacts() {
    if (!contacts.length) {
      listEl.innerHTML = `<div class="empty" style="padding:24px">No one to message yet.</div>`;
      return;
    }
    listEl.innerHTML = contacts.map((c) => `
      <div class="chat-contact ${c.id === activeId ? 'on' : ''}" data-id="${c.id}">
        <div class="avatar" style="background:${Dash.avatarColor(c.id)}">${E(Dash.initials(c.name))}</div>
        <div style="min-width:0;flex:1">
          <div class="nm">${E(c.name)}</div>
          <div class="last">${c.lastMessage ? E(c.lastMessage) : '<span style="opacity:.6">No messages yet</span>'}</div>
        </div>
        ${c.unread ? `<span class="un">${c.unread}</span>` : ''}
      </div>`).join('');
    listEl.querySelectorAll('.chat-contact').forEach((el) => {
      el.addEventListener('click', () => openConversation(el.dataset.id));
    });
    updateNavBadge();
  }

  function bubble(m) {
    return `<div class="bubble ${m.mine ? 'mine' : 'them'}">
      ${E(m.text)}<span class="t">${Dash.fmtDateTime(m.createdAt)}</span>
    </div>`;
  }

  function scrollDown() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  async function openConversation(id) {
    activeId = id;
    const contact = contacts.find((c) => c.id === id);
    headEl.textContent = contact ? contact.name : 'Conversation';
    bodyEl.innerHTML = `<div class="empty" style="margin:auto">Loading…</div>`;
    formEl.style.display = 'flex';
    renderContacts();
    try {
      const data = await BuzzMindAPI.getConversation(id);
      headEl.innerHTML = `${E(data.contact.name)} <span class="badge role-${E(data.contact.role)}" style="margin-left:8px">${E(data.contact.role)}</span>`;
      bodyEl.innerHTML = data.messages.length
        ? data.messages.map(bubble).join('')
        : `<div class="empty" style="margin:auto">Say hello &#128075;</div>`;
      scrollDown();
      if (contact) { contact.unread = 0; updateNavBadge(); renderContacts(); }
      textEl.focus();
    } catch (err) {
      bodyEl.innerHTML = `<div class="empty" style="margin:auto">${E(err.message || 'Could not load conversation.')}</div>`;
      formEl.style.display = 'none';
    }
  }

  async function send(e) {
    e.preventDefault();
    const text = textEl.value.trim();
    if (!text || !activeId) return;
    textEl.value = '';
    try {
      const msg = await BuzzMindAPI.sendChat(activeId, text);
      if (bodyEl.querySelector('.empty')) bodyEl.innerHTML = '';
      bodyEl.insertAdjacentHTML('beforeend', bubble(msg));
      scrollDown();
      const contact = contacts.find((c) => c.id === activeId);
      if (contact) { contact.lastMessage = text; contact.lastAt = msg.createdAt; }
      moveToTop(activeId);
      renderContacts();
    } catch (err) {
      Dash.toast(err.message || 'Could not send message', 'error');
      textEl.value = text;
    }
  }

  function moveToTop(id) {
    const idx = contacts.findIndex((c) => c.id === id);
    if (idx > 0) contacts.unshift(contacts.splice(idx, 1)[0]);
  }

  function onIncoming(payload) {
    const fromId = String(payload.from);
    let contact = contacts.find((c) => c.id === fromId || String(c.id) === fromId);
    if (fromId === String(activeId)) {
      if (bodyEl.querySelector('.empty')) bodyEl.innerHTML = '';
      bodyEl.insertAdjacentHTML('beforeend', bubble({ text: payload.text, mine: false, createdAt: payload.createdAt }));
      scrollDown();
      if (contact) contact.lastMessage = payload.text;
      moveToTop(fromId);
      renderContacts();
    } else if (contact) {
      contact.unread = (contact.unread || 0) + 1;
      contact.lastMessage = payload.text;
      contact.lastAt = payload.createdAt;
      moveToTop(fromId);
      renderContacts();
    } else {
      loadContacts();
    }
    Dash.toast(`${payload.fromName || 'New message'}: ${payload.text.slice(0, 40)}`);
  }

  async function loadContacts() {
    try {
      contacts = await BuzzMindAPI.getChatContacts();
      renderContacts();
    } catch (err) {
      listEl.innerHTML = `<div class="empty" style="padding:24px">${E(err.message || 'Failed to load contacts.')}</div>`;
    }
  }

  function connectSocket() {
    if (typeof io === 'undefined' || !me) return;
    socket = io();
    socket.on('connect', () => socket.emit('user:join', me.id));
    socket.on('chat:message', onIncoming);
  }

  formEl.addEventListener('submit', send);

  Dash.boot('chat').then(async (user) => {
    me = user;
    if (!me) {
      listEl.innerHTML = `<div class="empty" style="padding:24px">Please sign in.</div>`;
      return;
    }
    connectSocket();
    await loadContacts();
    const to = new URLSearchParams(location.search).get('to');
    if (to) openConversation(to);
  });
})();

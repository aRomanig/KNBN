const API = 'http://localhost:3000'
let currentBoardId = null

function mostrarAuth() {
    let auth = document.getElementById('telaAuth')
    let main = document.getElementById('telaMain')
    auth.style.display = 'block'
    main.style.display = 'none'
}

function parseToken(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch { return null }
}

function mostrarMain() {
    let auth = document.getElementById('telaAuth')
    let main = document.getElementById('telaMain')
    main.style.display = 'block'
    auth.style.display = 'none'
}

if (localStorage.getItem('token')) {
        mostrarMain()
        carregarBoards()
    } else {
        mostrarAuth()
    }

function switchTab(tab) {
    if (tab === 'login') {
        document.getElementById('formLogin').style.display = 'block'
        document.getElementById('formRegister').style.display = 'none'
    } else {
        document.getElementById('formLogin').style.display = 'none'
        document.getElementById('formRegister').style.display = 'block'
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim()
    const password = document.getElementById('loginPassword').value
    const errorLg = document.getElementById('loginError')
    errorLg.style.display = 'none'

    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    })

    const data = await res.json()

    if (!res.ok) {
        errorLg.textContent = data.error
        errorLg.style.display = 'block'
        return
    }

    localStorage.setItem('token', data.token)
    mostrarMain()
    carregarBoards()
}

async function register() {
    const email = document.getElementById('registerEmail').value.trim()
    const password = document.getElementById('registerPassword').value
    const errorRg = document.getElementById('registerError')
    errorRg.style.display = 'none'

    const res = await fetch(`${API}/auth/registrar`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    })

    const data = await res.json()

    if (!res.ok) {
        errorRg.textContent = data.error
        errorRg.style.display = 'block'
        return
    }
    
    switchTab('login')
    document.getElementById('loginEmail').value = email
}

function logout() {
    localStorage.removeItem('token')
    mostrarAuth()
}

async function carregarBoards() {
    const list = document.getElementById('boardsList')
    const res = await fetch(`${API}/boards`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`},
    })

    const boards = await res.json()

    if (boards.boards.length === 0) {
            list.innerHTML = '<div class="empty-state">// nenhum board ainda, crie seu primeiro!</div>'
            return
    } else {
        list.innerHTML = boards.boards.map(board => `<div class="board-item">
    <span class="board-item-title">${board.title}</span>
    <div class="board-item-actions">
        <button class="btn-sm" onclick="abrirBoard(${board.id})">Abrir</button>
        <button class="btn-sm btn-danger" onclick="deletarBoard(${board.id})">Deletar</button>
    </div>
</div>`).join('')
    }
}

async function criarBoard() {
    const title = document.getElementById('boardTitle').value.trim()

    if (!title) return

    const res = await fetch(`${API}/boards`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`},
        body: JSON.stringify({title})
    })

    if (!res.ok) {
        return
    }
    document.getElementById('boardTitle').value = ''
    carregarBoards()
}

async function deletarBoard(boardId) {
    if (!boardId) return

    const res = await fetch(`${API}/boards/${boardId}`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`}
    })

    if (!res.ok) {
        return
    }
    carregarBoards()
}

async function abrirBoard(boardId) {
    if (!boardId) return

    currentBoardId = boardId

    const res = await fetch(`${API}/boards/${boardId}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`}
    })

    const data = await res.json()
    document.getElementById('kanbanTitle').innerText = data.boards.title

    document.getElementById('telaBoards').style.display = 'none'
    document.getElementById('telaKanban').style.display = 'block'

    carregarTasks(boardId)
}

async function voltarParaBoards() {
    currentBoardId = null

    document.getElementById('telaBoards').style.display = 'block'
    document.getElementById('telaKanban').style.display = 'none'

    carregarBoards()
}

async function carregarTasks(boardId) {
    const res = await fetch(`${API}/boards/${boardId}/tasks`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`}
    })
    const tasks = await res.json()

    const todo = tasks.tasks.filter(task => task.stage === 1)
    const doing = tasks.tasks.filter(task => task.stage === 2)
    const done = tasks.tasks.filter(task => task.stage === 3)

    document.getElementById('colunaTodo').innerHTML = todo.map(task => `<div class="task-card">
    <strong>${task.title}</strong>
    <p>${task.content}</p>
    <div class="task-meta">
        <span class="task-badge">Prioridade: ${task.priority}</span>
        <span class="task-badge">Prazo: ${task.due_date ?? 'Sem prazo'}</span>
    </div>
    <div class="task-actions">
        ${task.stage !== 1 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 1)">← A fazer</button>` : ''}
        ${task.stage !== 2 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 2)">Em progresso</button>` : ''}
        ${task.stage !== 3 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 3)">Concluído →</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deletarTask(${task.id})">Deletar</button>
    </div>
</div>`).join('')

    document.getElementById('colunaDoing').innerHTML = doing.map(task => `<div class="task-card">
    <strong>${task.title}</strong>
    <p>${task.content}</p>
    <div class="task-meta">
        <span class="task-badge">Prioridade: ${task.priority}</span>
        <span class="task-badge">Prazo: ${task.due_date ?? 'Sem prazo'}</span>
    </div>
    <div class="task-actions">
        ${task.stage !== 1 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 1)">← A fazer</button>` : ''}
        ${task.stage !== 2 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 2)">Em progresso</button>` : ''}
        ${task.stage !== 3 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 3)">Concluído →</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deletarTask(${task.id})">Deletar</button>
    </div>
</div>`).join('')

    document.getElementById('colunaDone').innerHTML = done.map(task => `<div class="task-card">
    <strong>${task.title}</strong>
    <p>${task.content}</p>
    <div class="task-meta">
        <span class="task-badge">Prioridade: ${task.priority}</span>
        <span class="task-badge">Prazo: ${task.due_date ?? 'Sem prazo'}</span>
    </div>
    <div class="task-actions">
        ${task.stage !== 1 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 1)">← A fazer</button>` : ''}
        ${task.stage !== 2 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 2)">Em progresso</button>` : ''}
        ${task.stage !== 3 ? `<button class="btn-sm btn-ghost" onclick="moverTask(${task.id}, 3)">Concluído →</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deletarTask(${task.id})">Deletar</button>
    </div>
</div>`).join('')
}

async function criarTask() {
    const title = document.getElementById('taskTitle').value.trim()
    const content = document.getElementById('taskContent').value
    const stage = Number(document.getElementById('taskStage').value)
    const priority = document.getElementById('taskPriority').value
    const dueDate = document.getElementById('taskDueDate').value || null
    const errorTk = document.getElementById('taskError')
    errorTk.style.display = 'none'

    const res = await fetch(`${API}/boards/${currentBoardId}/tasks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`},
        body: JSON.stringify({title, content, priority, stage, due_date: dueDate})
    })

    const data = await res.json()

    if (!res.ok) {
        errorTk.innerText = data.error
        errorTk.style.display = 'block'
        return
    }

    document.getElementById('taskTitle').value = ''
    document.getElementById('taskContent').value = ''
    carregarTasks(currentBoardId)
}

async function deletarTask(taskId) {
    if (!taskId) return

    const res = await fetch(`${API}/boards/${currentBoardId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`}
    })

    carregarTasks(currentBoardId)
}

async function moverTask(taskId, stage) {
    const res = await fetch(`${API}/boards/${currentBoardId}/tasks/${taskId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await res.json()
    const task = data.task

    await fetch(`${API}/boards/${currentBoardId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            title: task.title,
            content: task.content,
            priority: task.priority,
            due_date: task.due_date,
            stage: stage
        })
    })
    carregarTasks(currentBoardId)
}
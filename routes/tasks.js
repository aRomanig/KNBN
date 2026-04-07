const express = require('express')
const db = require('../database')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router({ mergeParams: true})

router.get('/', authMiddleware, (req, res) => {
    const board = db.prepare(` SELECT * FROM boards WHERE id = ? AND owner_id = ?`).get(req.params.boardId, req.user.id)

    if (!board) {
        return res.status(404).json({ error: 'Board não encontrado!' })
    }
    const tasks = db.prepare('SELECT * FROM tasks WHERE board_id = ?').all(req.params.boardId)

    res.status(200).json({tasks})
})

router.post('/', authMiddleware, (req, res) => {
    const {title, content, priority, duedate, stage} = req.body

    const board = db.prepare(`SELECT * FROM boards WHERE id = ? AND owner_id = ?`).get(req.params.boardId, req.user.id)

    if (!board) {
        return res.status(404).json({ error: 'Board não encontrado!' })
    }

    if (!title || !content || !priority || !stage) {
        return res.status(400).json({ error: 'Faltando informações na requisição.' })
    }

    if (content.length > 260) {
        return res.status(400).json({ error: 'Conteúdo muito grande. Limite de 260 caracteres.' })
    }

    if (title.length > 150) {
        return res.status(400).json({ error: 'Título mmuito grande. Limite de 150 caracteres.' })
    }

    const stmt = db.prepare(`INSERT INTO tasks (title, board_id, content, priority, due_date, stage) VALUES (?,?,?,?,?,?)`)
    const result = stmt.run(title, req.params.boardId, content, priority, duedate, stage)
    res.status(201).json({ succes: 'Task criada com sucesso!' })
})

router.put('/:id', authMiddleware, (req, res) => {
    const {title, content, priority, duedate, stage} = req.body

    const board = db.prepare(`SELECT * FROM boards WHERE id = ? AND owner_id = ?`).get(req.params.boardId, req.user.id)
    const task = db.prepare(`SELECT * FROM tasks WHERE id = ? AND board_id = ?`).get(req.params.id, req.params.boardId)

    if (!board || !task) {
        return res.status(404).json({ error: 'Board e/ou task não encontrada!' })
    }

    if (!title || !content || !priority || !stage) {
        return res.status(400).json({ error: 'Faltando informaçoes na requisição'})
    }

    db.prepare(`UPDATE tasks SET title = ?, content = ?, priority = ?, due_date = ?, stage = ? WHERE id = ?`).run(title, content, priority, duedate, stage, req.params.id)
    res.status(200).json({ succes: 'Task atualizada com sucesso!' })
})

router.delete('/:id', authMiddleware, (req, res) => {
    const task = db.prepare(`SELECT * FROM tasks WHERE id = ? AND board_id = ?`).get(req.params.id, req.params.boardId)
    const board = db.prepare(`SELECT * FROM boards WHERE id = ? AND owner_id = ?`).get(req.params.boardId, req.user.id)

    if (!board) {
        return res.status(404).json({ error: 'Board não encontrada!' })
    }

    if (!task) {
        return res.status(404).json({ error: 'Task não encontrada!' })
    }

    db.prepare(`DELETE FROM tasks WHERE id = ?`).run(req.params.id)
    res.status(200).json({ success: 'Task deletada com sucesso!' })
})

router.get('/:id', authMiddleware, (req, res) => {
    const board = db.prepare('SELECT * FROM boards WHERE id = ? AND owner_id = ?')
        .get(req.params.boardId, req.user.id)
    if (!board) return res.status(404).json({ error: 'Board não encontrado!' })

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND board_id = ?')
        .get(req.params.id, req.params.boardId)
    if (!task) return res.status(404).json({ error: 'Task não encontrada!' })

    res.status(200).json({ task })
})

module.exports = router
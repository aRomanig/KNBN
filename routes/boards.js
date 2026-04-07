const express = require('express')
const db = require('../database')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
    const stmt = db.prepare(`
            SELECT * FROM boards WHERE owner_id = ? ORDER BY created_at DESC
        `)
    const boards = stmt.all(req.user.id)
    res.status(200).json({boards})
})

router.get('/:id', authMiddleware, (req, res) => {
    const stmt = db.prepare(`
            SELECT * FROM boards WHERE id = ? AND owner_id = ?
        `)
    const boards = stmt.get(req.params.id, req.user.id)

    if (!boards) {
        return res.status(404).json({ erro: 'Board não encontrado!'})
    }
    res.status(200).json({boards})
})

router.post('/', authMiddleware, (req, res) => {
    const {title} = req.body

    if (!title) {
        return res.status(400).json({ error: 'O título é obrigatório! '})
    }

    if (title.length > 50) {
        return res.status(400).json({ error: 'O título dever ter no máximo 50 caracteres.'})
    }

    const stmt = db.prepare(`INSERT INTO boards (title, owner_id) VALUES (?,?)`)
    const result = stmt.run(title, req.user.id)

    res.status(201).json({ success: 'Board criada com sucesso!'})
})

router.delete('/:id', authMiddleware, (req, res) => {
    const board = db.prepare(`SELECT * FROM boards WHERE id = ?`).get(req.params.id)

    if (!board) {
        return res.status(404).json({ error: 'Board! não encontrado!' })
    }

    if (board.owner_id != req.user.id) {
        return res.status(403).json({ error: 'Você não tem permissão pra apagar esse board!'})
    }

    db.prepare(`DELETE FROM boards WHERE id = ?`).run(req.params.id)

    res.status(200).json({success: 'Board deletado com sucesso!' })
})

module.exports = router
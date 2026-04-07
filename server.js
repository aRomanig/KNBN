const express = require('express')
const cors = require('cors')
const db = require('./database')
const app = express()
const authRoutes = require('./routes/auth')
const boardRoutes = require('./routes/boards')
const taskRoutes = require('./routes/tasks')

app.use(cors({ origin: 'https://knbn-production.up.railway.app', credentials: true}))              
app.use(express.json())      
app.use(express.static('public'))
app.use('/auth', authRoutes)
app.use('/boards', boardRoutes)
app.use('/boards/:boardId/tasks', taskRoutes)

app.get('/health', (req, res) => {
    res.json({ mensagem: 'Servidor funcionando!' })
})

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000')
})
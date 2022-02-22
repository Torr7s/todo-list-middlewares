const express = require('express');
const { v4: uuid, validate } = require('uuid');

const app = express()

app.use(express.json())

const users = []

function checkExistsUserAccount(_request, _response, _next) {
  const { username } = _request.headers

  const user = users.find((user) => user.username === username)

  if (!user) {
    return _response
      .status(404).
      json({
        error: 'User does not exists!'
      })
  }

  _request.user = user

  return _next()
}

function checkCreateTodosUserAvailability(_request, _response, _next) {
  const { user } = _request

  if (!user.pro && user.todos.length < 10 || user.pro) return _next()

  return _response
    .status(403)
    .json({
      error: 'Limit of 10 todos reached! Buy the Pro plan!!'
    })
}

function checkTodoExists(_request, _response, _next) {
  const { username } = _request.headers
  const { id } = _request.params

  const user = users.find((user) => user.username === username)

  if (!user) {
    return _response
      .status(404).
      json({
        error: 'User does not exists!'
      })
  }

  if (!validate(id)) {
    return _response
      .status(400)
      .json({
        error: 'Invalid todo id!'
      })
  }

  const userTodo = user.todos.find((todo) => todo.id === id)

  if (!userTodo) {
    return _response
      .status(404)
      .json({
        error: 'Todo does not exists!'
      })
  }

  _request.user = user
  _request.todo = userTodo

  return _next()
}

function findUserById(_request, _response, _next) {
  const { id } = _request.params

  const user = users.find((user) => user.id === id)

  if (!user) {
    return _response
      .status(404)
      .json({
        error: 'User does not exists!'
      })
  }

  _request.user = user

  return _next()
}

app.get('/users/:id', findUserById, (_request, _response) => {
  const { user } = _request

  return _response.status(200).json(user)
})

app.post('/users', (_request, _response) => {
  const { name, username } = _request.body

  const user = users.some((user) => user.username === username)

  if (user) {
    return _response
      .status(400)
      .json({
        error: 'User already exists!'
      })
  }

  const newUser = {
    id: uuid(),
    name,
    username,
    pro: false,
    todos: []
  }

  users.push(newUser)

  return _response.status(201).json(newUser)
})

app.patch('/users/:id/pro', findUserById, (_request, _response) => {
  const { user } = _request

  if (user.pro) {
    return _response
      .status(400)
      .json({
        error: 'Pro plan is already activated!'
      })
  }

  user.pro = true

  return _response.json(user)
})

app.get('/todos', checkExistsUserAccount, (_request, _response) => {
  const { user } = _request

  return _response.json(user.todos)
})

app.post('/todos', checkExistsUserAccount, checkCreateTodosUserAvailability, (_request, _response) => {
  const { user } = _request.user
  const { title, deadline } = _request.body

  const todo = {
    id: uuid(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo)

  return _response.status(201).json(todo)
})

app.put('/todos/:id', checkTodoExists, (_request, _response) => {
  const { todo } = _request
  const { title, deadline } = _request.body

  todo.title = title
  todo.deadline = new Date(deadline)

  return _response.json(userTodo)
})

app.patch('/todos/:id/done', checkTodoExists, (_request, _response) => {
  const { todo } = _request

  todo.done = true

  return _response.status(201).json(userTodo)
})

app.delete('/todos/:id', checkExistsUserAccount, checkTodoExists, (_request, _response) => {
  const { user, todo } = _request

  const todoIndex = user.todos.indexOf(todo)

  if (todoIndex === -1) {
    return _response
      .status(404)
      .json({
        error: 'Todo does not exists!'
      })
  }

  user.todos.splice(todoIndex, 1)

  return _response.status(204).send()
})

module.exports = {
  app,
  users,
  checkExistsUserAccount,
  checkCreateTodosUserAvailability,
  checkTodoExists,
  findUserById
}
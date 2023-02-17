const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyparser = require("body-parser");
app.use(bodyparser.json());

// eslint-disable-next-line no-unused-vars
app.get("/todos", (req, res) => {
  console.log("todos list");
});

app.post("/todos", async (req, res) => {
  console.log("creating a todo", req.body);
  try {
    const todo = await Todo.addTodo({
      title: req.body.title,
      dueDate: req.body.dueDate,
      completed: false,
    });
    return res.json(todo);
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async (req, res) => {
  console.log("updating todo ", req.params.id);
  const todo = await Todo.findByPk(req.params.id);
  try {
    const updateTodo = await todo.markAsComplete();
    return res.json(updateTodo);
  } catch (error) {
    return res.status(422).json(error);
  }
});

// eslint-disable-next-line no-unused-vars
app.delete("/todos/:id", (req, res) => {
  console.log("deleting todo ", req.params.id);
});

module.exports = app;

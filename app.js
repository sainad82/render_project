const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path');
const { Todo } = require("./models")

app.set("view engine" , "ejs");
app.use(bodyParser.json())
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

app.get("/",  async (req, res) => {
    const alltodos = await Todo.getAllTodos();

    const currentDate = new Date().toISOString().split('T')[0];

    const overdueTodos = alltodos.filter(todo => todo.dueDate < currentDate);
    const dueTodayTodos = alltodos.filter(todo => todo.dueDate === currentDate);
    const dueLaterTodos = alltodos.filter(todo => todo.dueDate > currentDate);
    res.render("index",{
        overdueTodos:overdueTodos,
        dueTodayTodos:dueTodayTodos,
        dueLaterTodos:dueLaterTodos
    });     
});

app.post('/todos', async (req,res) => {
    const todo = await Todo.addTodo({ title:req.body.title ,dueDate:req.body.dueDate,completed:false})
})

app.put('/todos/:id/markAsCompleted', async (req,res) => {
    console.log("updated todo");

    const todo = await Todo.findByPk(req.params.id);
    try {
        const updatedTodo = await todo.markAsCompleted()
        return res.json(updatedTodo)
    }
    catch(error){
        console.log(error)
        return res.status(422).json(error);
    }
})


module.exports = app;


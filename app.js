const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path');

app.set("view engine" , "ejs");
app.use(bodyParser.json())
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

const { Todo } = require("./models")


app.get("/totTodos",  async (req, res) => {
    const todoCount = await Todo.getCount();
    res.render("index"); // index refers to index.ejs
});

app.get("/",  async (req, res) => {
    const allTodos = await Todo.getAllTodos();
    if(res.accepts("html")){
        res.render("index",{
            allTodos
        });
    }
    else{
        res.json({allTodos}); // index refers to index.ejs
    }
});

// eslint-disable-next-line no-unused-vars
app.get('/todos', async (req,res) => {
    console.log(Todo.count());
})

app.post('/todos', async (req,res) => {
    console.log("Todo List");
    try{
        const todo = await Todo.addTodo({ title:req.body.title ,dueDate:req.body.dueDate,completed:false})
        return res.json(todo);
    }catch(error){
        console.log(error)
        return res.status(422).json(error)
    }
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


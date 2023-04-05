const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path');
var csrf = require("tiny-csrf");
var cookieparser = require("cookie-parser");
const { Todo } = require("./models")

app.set("view engine" , "ejs");
app.use(bodyParser.json())
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({extended:false}));

app.use(cookieparser("shh! some secret string"));
app.use(csrf("this_should_be_a_32_characterlon",['post','put','delete']));

app.get("/",  async (req, res) => {
    const alltodos = await Todo.getAllTodos();
    const currentDate = new Date().toISOString().split('T')[0];
    const overdueTodos = alltodos.filter(todo => todo.dueDate < currentDate);
    const dueTodayTodos = alltodos.filter(todo => todo.dueDate === currentDate);
    const dueLaterTodos = alltodos.filter(todo => todo.dueDate > currentDate);
    const completedTodos =await  alltodos.filter(todo=>todo.completed==true);
    if(req.accepts('html')){
        res.render("index",{
            overdueTodos:overdueTodos,
            dueTodayTodos:dueTodayTodos,
            dueLaterTodos:dueLaterTodos,
            completedTodos:completedTodos,
            csrfToken:req.csrfToken(),
        }); 
    }
    else{
        res.json({
            overdueTodos,
            dueTodayTodos,
            dueLaterTodos
        })
    }     
});

app.post('/todos', async (req,res) => {
    const todo = await Todo.addTodo(
        { 
            title:req.body.title ,
            dueDate:req.body.dueDate,
            completed:false
        });
    res.redirect("/");
})

app.put('/todos/:id', async (req,res) => {
    console.log("updated todo");

    const todo = await Todo.findByPk(req.params.id);
    try {
        const updatedTodo = await todo.setCompletionStatus(req.body.completed);
    }
    catch(error){
        console.log(error)
        return res.status(422).json(error);
    }
})


app.delete('/todos/:id',async (req,res) => {
    const todo = await Todo.findByPk(req.params.id)
    try{
        await Todo.remove(req.params.id);
        return res.json({success : true});
    }
    catch(error){
        return res.status(422).json(error);
    }
    
})


module.exports = app;


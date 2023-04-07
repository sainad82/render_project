const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path');
var csrf = require("tiny-csrf");
var cookieparser = require("cookie-parser");
const { Todo,User } = require("./models")

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require("bcrypt")
const { password } = require('pg/lib/defaults');


const saltRounds = 10;
app.set("view engine" , "ejs");
app.use(bodyParser.json())
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({extended:false}));
app.use(cookieparser("shh! some secret string"));
app.use(csrf("this_should_be_a_32_characterlon",['post','put','delete']));

app.use(session({
    secret: "my-secret-super-key-21728172615261561",
    cookie : {
        maxAge:24*60*60*1000 
    }
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password'
}, (username,password,done) => {
    User.findOne({ where:{email: username}})
        .then(async(user) => {
            const result = await bcrypt.compare(password,user.password);
            if(result){
                return done(null,user);
            }
            else{
                return done("Invalid Password")
            }
            
        }).catch((error) => {
            return (error)
        })
}))

passport.serializeUser((user,done)=>{
    console.log("Serializing user in a session",user.id)
    done(null, user.id)
})

passport.deserializeUser((id,done)=>{
    User.findByPk(id)
        .then(user => {
            done(null,user);
        })
        .catch(error => {
            done(error,null);
        })
})


app.get("/",  async (req, res) => {
    res.render("index",{
        title: "Todo Application",
        csrfToken:req.csrfToken(),
    }); 
    
});
app.get("/todos", connectEnsureLogin.ensureLoggedIn() , async (req, res) => {
    const loggedInUser = req.user.id;
    const alltodos = await Todo.getAllTodos(loggedInUser);
    const completedTodos =await  alltodos.filter(todo=>todo.completed==true);
    const currentDate = new Date().toISOString().split('T')[0];
    const overdueTodos = alltodos.filter(todo => todo.dueDate < currentDate && todo.completed==false);
    const dueTodayTodos = alltodos.filter(todo => todo.dueDate === currentDate && todo.completed==false);
    const dueLaterTodos = alltodos.filter(todo => todo.dueDate > currentDate && todo.completed==false);
    
    if(req.accepts('html')){
        res.render("todos",{
            title: "Todo Application",
            overdueTodos:overdueTodos,
            dueTodayTodos:dueTodayTodos,
            dueLaterTodos:dueLaterTodos,
            completedTodos:completedTodos,
            csrfToken : req.csrfToken(),
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

app.get("/signup" , (req,res) => {
    res.render("signup",{title:"Signup" , csrfToken:req.csrfToken()});
})

app.post("/users" ,async(req,res) => {
    //Hash password using bcrypt
    const hashedPwd = await bcrypt.hash(req.body.password,saltRounds);
    console.log(hashedPwd);

    // Creating a new User
    try{
        const user = await User.create({
            firstname : req.body.firstname,
            lastname : req.body.lastname,
            email : req.body.email,
            password : hashedPwd
        })
        req.login(user, (err) => {
            if(err){
                console.log(err);
            }
            res.redirect("/todos")
        })
        
    }
    catch(error){
         console.log(error);
    }
    
})

app.get("/login", (req,res) => {
    res.render("login.ejs",{
        title:"login",
        csrfToken:req.csrfToken(),
    });
})

app.post("/session" , passport.authenticate('local',{failureRedirect:"/login"}), (req,res) => {
    res.redirect("/todos");
})

app.get("/signout",(req,res,next) => {
    //signout 
    req.logout((err) => {
        if(err){ return next(err);}
        res.redirect("/")
    })
})

app.post('/todos',connectEnsureLogin.ensureLoggedIn(), async (req,res) => {
    console.log(req.user)
    try{
        await Todo.addTodo(
        { 
            title:req.body.title ,
            dueDate:req.body.dueDate,
            completed:false,
            userId:req.user.id
        });
        res.redirect("/todos");
    }catch(error){
        console.log(error);
        return res.status(422).json(error);
    }
})

app.put('/todos/:id', async (req,res) => {
    console.log("updated todo");
    const todo = await Todo.findByPk(req.params.id);
    try {
        const updatedTodo = await todo.setCompletionStatus(req.body.completed);
        return res.json(updatedTodo)
    }
    catch(error){
        console.log(error)
        return res.status(422).json(error);
    }
})


app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
    try{
      await Todo.remove(request.params.id,request.user.id);
      return response.json({success:true});
    }
    catch(error ){
      return response.status(422).json(error);
    }
  });


module.exports = app;


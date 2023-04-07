const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
var cheerio = require("cheerio");
const { password } = require("pg/lib/defaults");
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent , username , password) => {
  let res = await agent.get("/login")
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email:username,
    password:password,
    _csrf:csrfToken,
  })
}
describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Sign Up" , async() => {
    let res = await agent.get("/signup")
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstname:"Test",
      lastname:"User A",
      email:"abc@gmail.com",
      password:"12345",
      _csrf:csrfToken
    })
    expect(res.statusCode).toBe(302)
  })

  test("Sign Out" , async() => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);

  })

  test("create new todo", async () => {
    const agent = request.agent(server);
    await login(agent,"abc@gmail.com", "12345");
    const res = await agent.get("/todos");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Mark a todo as complete", async () => {
    const agent = request.agent(server);
    await login(agent,"abc@gmail.com", "12345");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
     await agent.post("/todos").send({
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf:csrfToken
    });
    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept","application/json");

      const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
      const dueTodayCount = parsedGroupedResponse.dueTodayTodos.length;
      const latestTodo = parsedGroupedResponse.dueTodayTodos[dueTodayCount-1];

      res = await agent.get("/todos");
      csrfToken = extractCsrfToken(res);

      const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf:csrfToken,
        completed:true,
      })
      const parsedUpdatedResponse = JSON.parse(markCompleteResponse.text)
      expect(parsedUpdatedResponse.completed).toBe(true);
  });
  test("Delete a Todo",async ()=>{
    const agent = request.agent(server);
    await login(agent,"abc@gmail.com", "12345");
    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      _csrf:csrfToken,
      title: "Buy Milk",
      dueDate: new Date().toISOString(),
      completed: false,
      
    });
    const groupedTodosResponse = await agent
    .get("/todos")
    .set("Accept","application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueTodayTodos.length;
    const latestTodo = parsedGroupedResponse.dueTodayTodos[dueTodayCount-1];

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);
    
    const deletedResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf:csrfToken
    })
    expect(deletedResponse.statusCode).toBe(200);
  })
});

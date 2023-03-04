const Sequelize = require("sequelize");

const database = "todo_h2vh";
const username = "postgre";
const password = "sv0Wte0HludywzIIVm5vld38XL2WuBnJ";
const sequelize = new Sequelize(database, username, password, {
  host: "dpg-cg0c26u4dad93e1ih170-a.oregon-postgres.render.com",
  dialect: "postgres"
});

const connect = async () => {
  return sequelize.authenticate();
};

module.exports = {
  connect,
  sequelize,
};
const { connect } = require("/connectDB.js");
const Todo = require("/models/todo.js");

const countData = async () => {
    try {
      const TotalCount = await Todo.count();
      console.log(`There are ${TotalCount} items in the table.`);
    } catch (error) {
      console.error(error);
    }
};

(async () => {
    await totalData();
})();
  
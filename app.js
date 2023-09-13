const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasDueDateProperties = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

const isValidTodoPriority = (item) => {
  if (item === "HIGH" || item === "MEDIUM" || item === "LOW") {
    return true;
  } else {
    return false;
  }
};
const isValidTodoStatus = (item) => {
  if (item === "TO DO" || item === "IN PROGRESS" || item === "DONE") {
    return true;
  } else {
    return false;
  }
};
const isValidTodoCategory = (item) => {
  if (item === "WORK" || item === "HOME" || item === "LEARNING") {
    return true;
  } else {
    return false;
  }
};
const isValidTodoDueDate = (item) => {
  return isValid(new Date(item));
};

convertTodoProperty = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;

      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertTodoProperty(object)));
      } else if (isValidTodoPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityAndCategoryProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND priority = '${priority}';`;

      if (isValidTodoPriority(priority) && isValidTodoCategory(category)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertTodoProperty(object)));
      } else if (isValidTodoPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND status = '${status}';`;

      if (isValidTodoStatus(status) && isValidTodoCategory(category)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertTodoProperty(object)));
      } else if (isValidTodoStatus(status)) {
        response.status(400);
        response.send("Invalid Todo status");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}';`;

      if (isValidTodoCategory(category)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertTodoProperty(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;

      if (isValidTodoPriority(priority)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertTodoProperty(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperties(request.query):
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;

      if (isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertTodoProperty(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE
            todo LIKE '%${search_q}%';`;

      data = await db.all(getTodosQuery);
      response.send(data.map((object) => convertTodoProperty(object)));
  }
});

//API 2 Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE
        id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertTodoProperty(todo));
});

//API 3 Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    if (isValidTodoDueDate(date)) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const getTodoQuery = `
            SELECT * 
            FROM todo
            WHERE
                due_date = '${formattedDate}';`;
      const todo = await db.all(getTodoQuery);
      response.send(todo.map((object) => convertTodoProperty(object)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//API 4 Create a todo in the todo table

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case isValidTodoStatus(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case isValidTodoCategory(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case isValidTodoDueDate(dueDate):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const createTodoQuery = `
            INSERT INTO 
            todo(id,todo,priority,status,category,due_date)
            VALUES 
            (
                ${id},
                '${todo}',
                '${priority}',
                '${status}',
                '${category}',
                '${formattedDate}'
            );`;
      const dbResponse = await db.run(createTodoQuery);
      response.send("Todo Successfully Added");
  }
});

//API 5 Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status, category, dueDate } = request.body;

  switch (true) {
    case hasPriorityProperties(request.body):
      const updateTodoPriorityQuery = `
                UPDATE 
                todo
                SET
                priority = '${priority}'
                WHERE
                id = ${todoId};`;
      if (isValidTodoPriority(priority)) {
        await db.run(updateTodoPriorityQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperties(request.body):
      const updateTodoStatusQuery = `
                UPDATE 
                todo
                SET
                status = '${status}'
                WHERE
                id = ${todoId};`;
      if (isValidTodoStatus(status)) {
        await db.run(updateTodoStatusQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperties(request.body):
      const updateTodoCategoryQuery = `
                UPDATE 
                todo
                SET
                category = '${category}'
                WHERE
                id = ${todoId};`;
      if (isValidTodoCategory(category)) {
        await db.run(updateTodoCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasDueDateProperties(request.body):
      const updateDueDateQuery = `
                UPDATE 
                todo
                SET
                due_date = '${dueDate}'
                WHERE
                id = ${todoId};`;
      if (isValidTodoDueDate(dueDate)) {
        await db.run(updateDueDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      const updateTodoQuery = `
                UPDATE 
                todo
                SET
                todo = '${todo}'
                WHERE
                id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
